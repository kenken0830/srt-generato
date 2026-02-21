import os
import subprocess
import tempfile
import wave
import numpy as np
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# CORS: Next.js フロントエンドからのリクエストを許可
CORS(app, resources={r"/api/*": {"origins": os.environ.get("ALLOWED_ORIGIN", "*")}})

# API キー認証（環境変数 API_SECRET_KEY を設定しておく）
API_SECRET_KEY = os.environ.get("API_SECRET_KEY", "")

def require_api_key(f):
    """Bearer トークンで API キーを検証するデコレータ。"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not API_SECRET_KEY:          # キー未設定なら認証スキップ（開発時）
            return f(*args, **kwargs)
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {API_SECRET_KEY}":
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

_model_cache = {}

WHISPER_SAMPLE_RATE = 16000


def get_ffmpeg_exe() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def convert_to_wav(input_path: str, output_path: str) -> None:
    """imageio-ffmpeg のバイナリで mono 16kHz WAV に変換する。"""
    ffmpeg = get_ffmpeg_exe()
    cmd = [
        ffmpeg, '-y',
        '-i', input_path,
        '-ar', str(WHISPER_SAMPLE_RATE),
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg 変換エラー:\n{result.stderr[-600:]}")


def load_wav_as_float32(wav_path: str) -> np.ndarray:
    """WAV ファイルを float32 numpy 配列 [-1, 1] として読み込む。"""
    with wave.open(wav_path, 'rb') as wf:
        sampwidth = wf.getsampwidth()
        n_frames  = wf.getnframes()
        raw       = wf.readframes(n_frames)

    if sampwidth == 2:
        audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sampwidth == 4:
        audio = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise ValueError(f"非対応サンプル幅: {sampwidth} bytes")

    return audio  # already mono (converted by ffmpeg -ac 1)


def get_model(model_name: str):
    if model_name not in _model_cache:
        import whisper
        _model_cache[model_name] = whisper.load_model(model_name)
    return _model_cache[model_name]


def split_japanese_text(text: str, max_chars: int = 10) -> list[str]:
    chunks = []
    remaining = text.strip()

    while len(remaining) > max_chars:
        best_pos = max_chars

        for i in range(min(max_chars, len(remaining)) - 1, 0, -1):
            ch = remaining[i]
            if ch in '。！？…':
                best_pos = i + 1
                break
            elif ch in '、':
                best_pos = i + 1
                break
            elif ch in ' \u3000':
                best_pos = i
                break

        chunk = remaining[:best_pos].strip()
        if chunk:
            chunks.append(chunk)
        remaining = remaining[best_pos:].strip()

    if remaining:
        chunks.append(remaining)

    return [c for c in chunks if c]


def seconds_to_srt_time(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    ms       = total_ms % 1000
    total_s  = total_ms // 1000
    s        = total_s % 60
    total_m  = total_s // 60
    m        = total_m % 60
    h        = total_m // 60
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_srt(segments: list[dict], max_chars: int = 10) -> tuple[str, list[dict]]:
    entries = []
    idx = 1

    for seg in segments:
        start = seg['start']
        end   = seg['end']
        text  = seg['text'].strip()
        if not text:
            continue

        chunks = split_japanese_text(text, max_chars)
        if not chunks:
            continue

        total_chars = sum(len(c) for c in chunks)
        duration    = max(end - start, 0.0)
        current     = start

        for i, chunk in enumerate(chunks):
            chunk_end = end if i == len(chunks) - 1 else \
                        current + duration * (len(chunk) / total_chars if total_chars else 1 / len(chunks))
            entries.append({
                'index': idx,
                'start': seconds_to_srt_time(current),
                'end':   seconds_to_srt_time(chunk_end),
                'text':  chunk,
            })
            idx += 1
            current = chunk_end

    lines = []
    for e in entries:
        lines.extend([str(e['index']), f"{e['start']} --> {e['end']}", e['text'], ''])

    return '\n'.join(lines), entries


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/transcribe', methods=['POST'])
@require_api_key
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    if not audio_file.filename:
        return jsonify({'error': 'No file selected'}), 400

    model_name = request.form.get('model', 'base')
    try:
        max_chars = max(1, min(int(request.form.get('max_chars', 10)), 50))
    except ValueError:
        max_chars = 10

    suffix   = os.path.splitext(audio_file.filename)[1] or '.tmp'
    tmp_path = None
    wav_path = None

    try:
        # 1. アップロードファイルを一時保存（mkstemp = Windows 互換）
        fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        os.close(fd)
        audio_file.save(tmp_path)

        # 2. imageio-ffmpeg で WAV 変換
        wav_path = tmp_path + '.wav'
        convert_to_wav(tmp_path, wav_path)

        # 3. WAV を numpy 配列に読み込む（Whisper 内部の ffmpeg 呼び出しを回避）
        audio_array = load_wav_as_float32(wav_path)

        # 4. Whisper で文字起こし（numpy 配列を直接渡す）
        model  = get_model(model_name)
        result = model.transcribe(
            audio_array,
            language='ja',
            task='transcribe',
            verbose=False,
        )

        srt_content, entries = build_srt(result['segments'], max_chars)
        duration = result['segments'][-1]['end'] if result['segments'] else 0.0

        return jsonify({
            'success':        True,
            'srt':            srt_content,
            'segments_count': len(entries),
            'duration':       round(duration, 2),
            'full_text':      result['text'].strip(),
        })

    except Exception as exc:
        import traceback
        return jsonify({'error': str(exc), 'trace': traceback.format_exc()}), 500

    finally:
        for p in (tmp_path, wav_path):
            if p and os.path.exists(p):
                try:
                    os.unlink(p)
                except OSError:
                    pass


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)

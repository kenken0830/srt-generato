'use client'

import { useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { LogOut, Upload, Download, Zap, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  plan: 'free' | 'pro'
  minutes_used: number
  minutes_limit: number | null
}

export default function DashboardClient({ user, profile }: { user: User; profile: Profile }) {
  const router  = useRouter()
  const supabase = createClient()

  const [file, setFile]           = useState<File | null>(null)
  const [model, setModel]         = useState('base')
  const [maxChars, setMaxChars]   = useState(10)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState<{ srt: string; segments_count: number; duration: number; full_text: string } | null>(null)
  const [isDragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPro     = profile?.plan === 'pro'
  const used      = profile?.minutes_used ?? 0
  const limit     = profile?.minutes_limit ?? 5
  const usagePct  = isPro ? 0 : Math.min((used / limit) * 100, 100)
  const remaining = isPro ? null : Math.max(limit - used, 0)

  function formatBytes(b: number) {
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1048576).toFixed(1) + ' MB'
  }

  async function handleConvert() {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    const fd = new FormData()
    fd.append('audio', file)
    fd.append('model', model)
    fd.append('max_chars', String(maxChars))

    try {
      const res  = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result) return
    const blob = new Blob([result.srt], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: (file?.name.replace(/\.[^.]+$/, '') ?? 'transcription') + '.srt',
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCheckout() {
    const res  = await fetch('/api/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function handlePortal() {
    const res  = await fetch('/api/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const allowedModels = isPro
    ? [['tiny','tiny — 最速'],['base','base — バランス'],['small','small — 高精度'],['medium','medium — より高精度'],['large','large — 最高精度']]
    : [['base','base — バランス']]

  return (
    <div className="min-h-screen bg-bg">
      {/* NAV */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-black text-lg tracking-tight">
          SRT<span className="text-accent">Generator</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#555]">{user.email}</span>
          {isPro ? (
            <button onClick={handlePortal}
              className="flex items-center gap-1.5 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 hover:bg-amber-500/20 transition-colors">
              <Crown size={12} /> Pro
            </button>
          ) : (
            <button onClick={handleCheckout}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent2 text-white text-xs font-bold px-3 py-1.5 transition-colors">
              <Zap size={12} /> Pro にアップグレード
            </button>
          )}
          <button onClick={handleSignOut} className="text-[#555] hover:text-white transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* USAGE BAR (free only) */}
        {!isPro && (
          <div className="bg-surface border border-border p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-widest uppercase text-[#555]">今月の使用量</span>
              <span className="text-xs text-[#666]">{used.toFixed(1)} / {limit} 分</span>
            </div>
            <div className="h-1.5 bg-surf2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {remaining !== null && remaining <= 1 && (
              <p className="mt-3 text-xs text-accent">
                残り {remaining.toFixed(1)} 分です。
                <button onClick={handleCheckout} className="underline ml-1">Pro にアップグレード</button>
              </p>
            )}
          </div>
        )}

        {/* UPLOAD */}
        <div className="bg-surface border border-border p-8 mb-4">
          {/* DROP ZONE */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false)
              const f = e.dataTransfer.files[0]
              if (f) setFile(f)
            }}
            className={`border-2 border-dashed py-10 text-center cursor-pointer transition-colors ${isDragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-[#444]'}`}
          >
            <input ref={inputRef} type="file" className="hidden"
              accept="audio/*,video/mp4,.m4a,.flac,.ogg,.aac,.wav,.mp3,.mp4,.webm"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
            <Upload size={32} className="mx-auto mb-3 text-[#444]" />
            <p className="text-sm text-[#555]">
              <span className="text-white font-bold">クリック</span>またはドロップ
            </p>
            <p className="text-xs text-[#444] mt-1">MP3 / WAV / M4A / MP4 / FLAC 対応</p>
          </div>

          {/* FILE INFO */}
          {file && (
            <div className="mt-4 flex items-center gap-3 bg-surf2 border border-border px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{file.name}</div>
                <div className="text-xs text-[#555]">{formatBytes(file.size)}</div>
              </div>
              <button onClick={() => setFile(null)} className="text-[#555] hover:text-accent text-lg leading-none shrink-0">×</button>
            </div>
          )}

          {/* OPTIONS */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-[#555] mb-2">モデル</label>
              <div className="relative">
                <select value={model} onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-surf2 border border-border text-white text-sm px-3 py-2.5 appearance-none outline-none focus:border-accent transition-colors">
                  {allowedModels.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-xs pointer-events-none">▾</span>
              </div>
              {!isPro && <p className="text-xs text-[#444] mt-1">Pro で全モデル利用可</p>}
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-[#555] mb-2">最大文字数 / 行</label>
              <input type="number" value={maxChars} min={3} max={30}
                onChange={(e) => setMaxChars(Number(e.target.value))}
                className="w-full bg-surf2 border border-border text-white text-sm px-3 py-2.5 outline-none focus:border-accent transition-colors" />
            </div>
          </div>

          {/* CONVERT BTN */}
          <button
            onClick={handleConvert}
            disabled={!file || loading}
            className="mt-6 w-full bg-accent hover:bg-accent2 disabled:opacity-40 text-white font-black tracking-wider uppercase text-sm py-4 transition-colors"
          >
            {loading ? '変換中...' : '変換する — CONVERT'}
          </button>

          {error && (
            <div className="mt-4 bg-accent/10 border border-accent text-accent text-sm p-3">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* RESULTS */}
        {result && (
          <div className="bg-surface border border-border p-8 fade-up">
            {/* STATS */}
            <div className="grid grid-cols-3 gap-px bg-border mb-6">
              {[
                { v: result.segments_count, l: 'セグメント数' },
                { v: result.duration + '秒', l: '音声時間' },
                { v: maxChars + '文字', l: '最大文字数' },
              ].map(({ v, l }) => (
                <div key={l} className="bg-surface py-4 text-center">
                  <div className="text-2xl font-black text-accent">{v}</div>
                  <div className="text-xs text-[#555] mt-1">{l}</div>
                </div>
              ))}
            </div>

            {/* SRT PREVIEW */}
            <p className="text-xs font-bold tracking-widest uppercase text-[#555] mb-2">SRT プレビュー</p>
            <pre className="bg-surf2 border border-border p-4 text-xs font-mono text-[#aaa] max-h-64 overflow-y-auto whitespace-pre leading-relaxed mb-4">
              {result.srt}
            </pre>

            {/* FULL TEXT */}
            <p className="text-xs font-bold tracking-widest uppercase text-[#555] mb-2">全文テキスト</p>
            <div className="bg-surf2 border border-border p-4 text-sm text-[#888] max-h-32 overflow-y-auto leading-relaxed mb-5">
              {result.full_text}
            </div>

            <button onClick={handleDownload}
              className="w-full border-2 border-green text-green hover:bg-green hover:text-black font-black tracking-wider uppercase text-sm py-3 transition-colors flex items-center justify-center gap-2">
              <Download size={16} /> SRT ファイルをダウンロード
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

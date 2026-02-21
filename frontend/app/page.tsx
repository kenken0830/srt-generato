import Link from 'next/link'
import { Mic, FileText, Download, Zap, Check } from 'lucide-react'

const features = [
  { icon: Mic,      title: 'AI音声認識',     desc: 'OpenAI Whisper による高精度な日本語文字起こし。背景ノイズにも強い。' },
  { icon: FileText, title: '縦型動画対応',    desc: '9:16 の縦型動画に最適化。10文字以内で自然に区切った字幕を生成。' },
  { icon: Download, title: 'SRT即ダウンロード', desc: 'CapCut・Premiere・DaVinci など主要ソフトで使えるSRTファイルを出力。' },
]

const plans = [
  {
    name: '無料',
    price: '¥0',
    period: '',
    desc: 'まずは試してみたい方に',
    features: ['月5分まで変換', 'base モデル', 'SRTダウンロード'],
    cta: '無料で始める',
    href: '/auth/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '¥980',
    period: '/ 月',
    desc: '毎日使いたいクリエイターに',
    features: ['無制限変換', '全モデル選択可（large含む）', 'SRTダウンロード', '優先処理'],
    cta: 'Proプランを始める',
    href: '/auth/login?plan=pro',
    highlight: true,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* NAV */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-black text-lg tracking-tight">
          SRT<span className="text-accent">Generator</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-[#666] hover:text-white transition-colors">
            ログイン
          </Link>
          <Link href="/auth/login" className="bg-accent hover:bg-accent2 transition-colors text-white text-sm font-bold px-4 py-2">
            無料で始める
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center fade-up">
        <div className="inline-block bg-accent text-white text-xs font-bold tracking-widest uppercase px-3 py-1 mb-8">
          Whisper × SRT
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          音声を<span className="text-accent">字幕</span>に<br />変換する
        </h1>
        <p className="text-[#666] text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          音声・動画をアップロードするだけ。AI が自動で日本語文字起こしを行い、
          縦型動画（9:16）にぴったりな SRT ファイルを生成します。
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/login"
            className="bg-accent hover:bg-accent2 transition-colors text-white font-black text-base tracking-wider uppercase px-8 py-4">
            無料で試す — FREE
          </Link>
          <Link href="#pricing"
            className="border border-border hover:border-[#444] transition-colors text-[#666] hover:text-white text-sm font-bold px-6 py-4">
            料金を見る
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-surface p-8">
              <div className="w-10 h-10 bg-surf2 border border-border flex items-center justify-center mb-5">
                <Icon size={18} className="text-accent" />
              </div>
              <h3 className="font-black text-base mb-2">{title}</h3>
              <p className="text-[#555] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-xs font-bold tracking-widest uppercase text-[#444] mb-12">使い方</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', text: '音声・動画ファイルをアップロード' },
            { step: '02', text: 'AI が日本語で自動文字起こし' },
            { step: '03', text: 'SRT ファイルをダウンロード' },
          ].map(({ step, text }) => (
            <div key={step} className="flex flex-col items-center gap-4">
              <span className="text-5xl font-black text-accent opacity-30">{step}</span>
              <p className="text-sm text-[#888]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-xs font-bold tracking-widest uppercase text-[#444] mb-3 text-center">料金プラン</p>
        <h2 className="text-3xl font-black text-center mb-12">シンプルな価格設定</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`border p-8 flex flex-col ${plan.highlight ? 'border-accent' : 'border-border bg-surface'}`}>
              {plan.highlight && (
                <div className="bg-accent text-white text-xs font-bold tracking-widest uppercase px-3 py-1 self-start mb-4">
                  おすすめ
                </div>
              )}
              <div className="mb-1 text-[#666] text-sm">{plan.name}</div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-[#666] text-sm mb-1">{plan.period}</span>
              </div>
              <p className="text-[#555] text-xs mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#aaa]">
                    <Check size={14} className="text-green shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                className={`mt-auto text-center font-black tracking-wider uppercase text-sm py-3 transition-colors
                  ${plan.highlight
                    ? 'bg-accent hover:bg-accent2 text-white'
                    : 'border border-border hover:border-[#444] text-[#888] hover:text-white'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-[#444]">
        <span>© 2025 SRT Generator</span>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
        </div>
      </footer>
    </div>
  )
}

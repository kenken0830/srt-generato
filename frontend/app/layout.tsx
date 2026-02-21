import type { Metadata } from 'next'
import { Zen_Kaku_Gothic_New, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const zen = Zen_Kaku_Gothic_New({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-zen',
  display: 'swap',
})

const mono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SRT Generator — 音声文字起こし',
  description: '音声・動画を自動で日本語文字起こしし、縦型動画（9:16）向けSRTファイルを生成します',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${zen.variable} ${mono.variable}`}>
      <body className="bg-bg text-white font-sans antialiased">{children}</body>
    </html>
  )
}

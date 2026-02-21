'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-black">
            SRT<span className="text-accent">Generator</span>
          </span>
        </div>

        <div className="bg-surface border border-border p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-green text-4xl mb-4">✓</div>
              <h2 className="font-black text-lg mb-2">メールを確認してください</h2>
              <p className="text-[#666] text-sm leading-relaxed">
                <span className="text-white">{email}</span> にログインリンクを送りました。
                メールのリンクをクリックするとダッシュボードに移動します。
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-black text-xl mb-1">ログイン / 新規登録</h1>
              <p className="text-[#555] text-xs mb-6">メールアドレスにリンクを送ります（パスワード不要）</p>

              {error && (
                <div className="bg-accent/10 border border-accent text-accent text-xs p-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-[#555] mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-surf2 border border-border text-white text-sm px-4 py-3 outline-none focus:border-accent transition-colors placeholder:text-[#444]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent2 disabled:opacity-40 text-white font-black tracking-wider uppercase text-sm py-3 transition-colors"
                >
                  {loading ? '送信中...' : 'リンクを送る'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

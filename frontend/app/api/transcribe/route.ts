import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5分タイムアウト (Vercel Pro 以上)

export async function POST(req: NextRequest) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // プロフィール取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, minutes_used, minutes_limit')
    .eq('id', user.id)
    .single()

  // 無料プランの使用量チェック
  if (profile?.plan !== 'pro' && profile?.minutes_limit != null) {
    if ((profile.minutes_used ?? 0) >= profile.minutes_limit) {
      return NextResponse.json({ error: '今月の無料枠（5分）を使い切りました。Pro にアップグレードしてください。' }, { status: 403 })
    }
  }

  // Railway バックエンドへフォワード
  const formData = await req.formData()
  const backendUrl = process.env.RAILWAY_BACKEND_URL
  if (!backendUrl) return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 })

  const backendRes = await fetch(`${backendUrl}/api/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.BACKEND_API_KEY}` },
    body: formData,
  })

  const data = await backendRes.json()
  if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status })

  // 使用量を記録（duration は秒 → 分に変換）
  if (data.duration) {
    const minutesUsed = data.duration / 60
    await supabase
      .from('profiles')
      .update({ minutes_used: (profile?.minutes_used ?? 0) + minutesUsed })
      .eq('id', user.id)

    await supabase.from('transcriptions').insert({
      user_id:        user.id,
      filename:       formData.get('audio') instanceof File ? (formData.get('audio') as File).name : 'unknown',
      duration:       data.duration,
      segments_count: data.segments_count,
    })
  }

  return NextResponse.json(data)
}

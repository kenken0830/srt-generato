import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // プロフィール取得（なければ作成）
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email, plan: 'free', minutes_used: 0, minutes_limit: 5 })
      .select()
      .single()
    profile = data
  }

  return <DashboardClient user={user} profile={profile} />
}

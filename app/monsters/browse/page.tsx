import { supabase } from '@/lib/supabase'
import { Monster, PrivacyType } from '@/lib/types'
import { getSession } from '@/lib/auth'
import BrowseMonstersClient from './BrowseMonstersClient'

export default async function BrowseMonstersPage() {
  const session = await getSession()

  const { data: monsters } = await supabase
    .from('monsters')
    .select('id, name, type, cr, hp, ac, speed, notes, privacy')
    .eq('privacy', PrivacyType.Public)
    .neq('user_id', session!.userId)
    .order('name', { ascending: true })

  return <BrowseMonstersClient monsters={(monsters ?? []) as Monster[]} userId={session!.userId} />
}

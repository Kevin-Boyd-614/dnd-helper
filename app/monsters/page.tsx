import { supabase } from '@/lib/supabase'
import { Monster } from '@/lib/types'
import MonstersClient from './MonstersClient'
import { getSession } from '@/lib/auth'

export default async function MonstersPage() {
  const session = await getSession()

  const { data: monsters } = await supabase
    .from('monsters')
    .select('id, name, type, cr, hp, ac, speed, notes')
    .eq('user_id', session!.userId)
    .order('name', { ascending: true })

  return <MonstersClient monsters={(monsters ?? []) as Monster[]} />
}

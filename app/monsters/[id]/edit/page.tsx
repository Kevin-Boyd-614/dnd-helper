import { supabase } from '@/lib/supabase'
import { Monster, MonsterSkill } from '@/lib/types'
import EditMonsterClient from './EditMonsterClient'
import { notFound } from 'next/navigation'

export default async function EditMonsterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: monster } = await supabase
    .from('monsters')
    .select('id, name, type, hp, ac, speed, notes, privacy')
    .eq('id', id)
    .single()

  if (!monster) notFound()

  const { data: skills } = await supabase
    .from('monster_skills')
    .select('id, monster_id, name, description, damage, damage_type, range, cooldown')
    .eq('monster_id', id)
    .order('created_at', { ascending: true })

  return (
    <EditMonsterClient
      monster={monster as Monster}
      skills={(skills ?? []) as MonsterSkill[]}
    />
  )
}
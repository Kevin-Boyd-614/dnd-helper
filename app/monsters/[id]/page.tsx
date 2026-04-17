import { supabase } from '@/lib/supabase'
import { Monster, MonsterSkill } from '@/lib/types'
import MonsterClient from './MonsterClient'
import { notFound } from 'next/navigation'

export default async function MonsterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: monster } = await supabase
    .from('monsters')
    .select('id, name, type, hp, ac, speed, notes')
    .eq('id', id)
    .single()

  if (!monster) notFound()

  const { data: skills } = await supabase
    .from('monster_skills')
    .select('id, monster_id, name, description, damage, damage_type, range, cooldown')
    .eq('monster_id', id)
    .order('created_at', { ascending: true })

  return (
    <MonsterClient
      monster={monster as Monster}
      skills={(skills ?? []) as MonsterSkill[]}
    />
  )
}
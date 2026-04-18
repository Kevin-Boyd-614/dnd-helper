import { supabase } from '@/lib/supabase'
import { Encounter, EncounterMonster, EncounterMonsterAction, Monster, MonsterSkill } from '@/lib/types'
import { notFound } from 'next/navigation'
import EncounterClient from './EncounterClient'

export default async function EncounterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: encounter } = await supabase
    .from('encounters')
    .select('id, name, notes, status, dungeon_id')
    .eq('id', id)
    .single()

  if (!encounter) notFound()

  const { data: dungeon } = await supabase
    .from('dungeons')
    .select('id, name, chapter_id')
    .eq('id', encounter.dungeon_id)
    .single()

  const { data: chapter } = dungeon
    ? await supabase.from('chapters').select('id, name, campaign_id').eq('id', dungeon.chapter_id).single()
    : { data: null }

  const { data: encounterMonsters } = await supabase
    .from('encounter_monsters')
    .select('*, monster:monsters(*)')
    .eq('encounter_id', id)
    .order('initiative', { ascending: false })

  const { data: allMonsters } = await supabase
    .from('monsters')
    .select('id, name, type, cr, hp, ac, speed, notes')
    .order('name', { ascending: true })

  const { data: actions } = await supabase
    .from('encounter_monster_actions')
    .select('*')
    .eq('encounter_id', id)
    .order('turn', { ascending: true })

  const monsterIds = (encounterMonsters ?? []).map((em: any) => em.monster_id)
  const { data: monsterSkills } = monsterIds.length > 0
    ? await supabase.from('monster_skills').select('*').in('monster_id', monsterIds)
    : { data: [] }

  const skillsByMonsterId = (monsterSkills ?? []).reduce((acc: Record<string, MonsterSkill[]>, s: MonsterSkill) => {
    if (!acc[s.monster_id]) acc[s.monster_id] = []
    acc[s.monster_id].push(s)
    return acc
  }, {})

  return (
    <EncounterClient
      encounter={encounter as Encounter}
      dungeonName={dungeon?.name ?? ''}
      campaignId={chapter?.campaign_id ?? null}
      encounterMonsters={(encounterMonsters ?? []) as unknown as EncounterMonster[]}
      allMonsters={(allMonsters ?? []) as Monster[]}
      initialActions={(actions ?? []) as EncounterMonsterAction[]}
      monsterSkills={skillsByMonsterId}
    />
  )
}

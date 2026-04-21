import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { PrivacyType } from '@/lib/types'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await request.json()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .or(`user_id.eq.${session.userId},privacy.eq.${PrivacyType.Public}`)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Copy campaign
  const { data: newCampaign } = await supabase
    .from('campaigns')
    .insert({
      name: `${campaign.name} (Copy)`,
      setting: campaign.setting,
      description: campaign.description,
      player_count: campaign.player_count,
      privacy: PrivacyType.Copied,
      user_id: session.userId,
    })
    .select()
    .single()

  if (!newCampaign) return NextResponse.json({ error: 'Failed to copy campaign' }, { status: 500 })

  // Fetch and copy chapters
  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('order_index')

  if (!chapters?.length) return NextResponse.json({ id: newCampaign.id })

  const chapterMap: Record<string, string> = {}
  for (const chapter of chapters) {
    const { data: newChapter } = await supabase
      .from('chapters')
      .insert({ name: chapter.name, description: chapter.description, order_index: chapter.order_index, campaign_id: newCampaign.id })
      .select()
      .single()
    if (newChapter) chapterMap[chapter.id] = newChapter.id
  }

  // Fetch and copy dungeons
  const { data: dungeons } = await supabase
    .from('dungeons')
    .select('*')
    .in('chapter_id', Object.keys(chapterMap))
    .order('order_index')

  if (!dungeons?.length) return NextResponse.json({ id: newCampaign.id })

  const dungeonMap: Record<string, string> = {}
  for (const dungeon of dungeons) {
    const { data: newDungeon } = await supabase
      .from('dungeons')
      .insert({ name: dungeon.name, description: dungeon.description, order_index: dungeon.order_index, chapter_id: chapterMap[dungeon.chapter_id] })
      .select()
      .single()
    if (newDungeon) dungeonMap[dungeon.id] = newDungeon.id
  }

  // Fetch and copy encounters
  const { data: encounters } = await supabase
    .from('encounters')
    .select('*')
    .in('dungeon_id', Object.keys(dungeonMap))

  if (!encounters?.length) return NextResponse.json({ id: newCampaign.id })

  const encounterMap: Record<string, string> = {}
  for (const encounter of encounters) {
    const { data: newEncounter } = await supabase
      .from('encounters')
      .insert({ name: encounter.name, notes: encounter.notes, status: 'planned', dungeon_id: dungeonMap[encounter.dungeon_id] })
      .select()
      .single()
    if (newEncounter) encounterMap[encounter.id] = newEncounter.id
  }

  // Fetch and copy encounter monsters, resetting HP and initiative
  const { data: encounterMonsters } = await supabase
    .from('encounter_monsters')
    .select('*, monster:monsters(hp)')
    .in('encounter_id', Object.keys(encounterMap))

  if (encounterMonsters?.length) {
    await supabase.from('encounter_monsters').insert(
      encounterMonsters.map((em: any) => ({
        encounter_id: encounterMap[em.encounter_id],
        monster_id: em.monster_id,
        current_hp: em.monster?.hp ?? 0,
        initiative: null,
      }))
    )
  }

  return NextResponse.json({ id: newCampaign.id })
}

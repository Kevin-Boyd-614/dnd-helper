import { supabase } from '@/lib/supabase'
import { Campaign, Chapter, Dungeon, Encounter, PrivacyType } from '@/lib/types'
import CampaignClient from './CampaignClient'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, setting, description, player_count, created_at')
    .eq('id', id)
    .or(`user_id.eq.${session!.userId},privacy.eq.${PrivacyType.Public}`)
    .single()

  if (!campaign) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, description, order_index, campaign_id')
    .eq('campaign_id', id)
    .order('order_index', { ascending: true })

  const { data: dungeons } = await supabase
    .from('dungeons')
    .select('id, name, description, order_index, chapter_id')
    .in('chapter_id', (chapters ?? []).map(c => c.id))
    .order('order_index', { ascending: true })

  const { data: encounters } = await supabase
    .from('encounters')
    .select('id, name, notes, status, dungeon_id')
    .in('dungeon_id', (dungeons ?? []).map(d => d.id))
    .order('created_at', { ascending: true })

  return (
    <CampaignClient
      campaign={campaign as Campaign}
      chapters={(chapters ?? []) as Chapter[]}
      dungeons={(dungeons ?? []) as Dungeon[]}
      encounters={(encounters ?? []) as Encounter[]}
    />
  )
}

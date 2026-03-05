import { supabase } from '@/lib/supabase'
import { Campaign } from '@/lib/types'
import CampaignsClient from './CampaignsClient'

export default async function CampaignsPage() {
  const { data: rawCampaigns } = await supabase
    .from('campaigns')
    .select('id, name, setting, description, player_count, created_at')
    .order('created_at', { ascending: false })

  const { data: chapterCounts } = await supabase
    .from('chapters')
    .select('campaign_id')

  const campaigns: Campaign[] = (rawCampaigns ?? []).map(c => ({
    ...c,
    setting: c.setting ?? '',
    chapterCount: chapterCounts?.filter(ch => ch.campaign_id === c.id).length ?? 0
  }))

  return <CampaignsClient campaigns={campaigns} />
}

import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { PrivacyType } from '@/lib/types'
import BrowseCampaignsClient from './BrowseCampaignsClient'

export default async function BrowseCampaignsPage() {
  const session = await getSession()

  const { data: rawCampaigns } = await supabase
    .from('campaigns')
    .select('id, name, setting, description, player_count, created_at')
    .eq('privacy', PrivacyType.Public)
    .neq('user_id', session!.userId)
    .order('created_at', { ascending: false })

  const campaignIds = (rawCampaigns ?? []).map(c => c.id)

  const { data: chapterCounts } = campaignIds.length
    ? await supabase.from('chapters').select('campaign_id').in('campaign_id', campaignIds)
    : { data: [] }

  const campaigns = (rawCampaigns ?? []).map(c => ({
    ...c,
    chapterCount: chapterCounts?.filter(ch => ch.campaign_id === c.id).length ?? 0,
  }))

  return <BrowseCampaignsClient campaigns={campaigns} userId={session!.userId} />
}

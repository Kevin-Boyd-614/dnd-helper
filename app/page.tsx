import { supabase } from '@/lib/supabase'
import HomeClient from '@/components/HomeClient'
import { Campaign } from '@/lib/types'
import { getSession } from '@/lib/auth'

export default async function Page() {
  const session = await getSession()
  const userId = session!.userId

  const [{ count: campaignCount }, { count: chapterCount }, { count: dungeonCount }] =
    await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('chapters').select('campaigns!inner(user_id)', { count: 'exact', head: true }).eq('campaigns.user_id', userId),
      supabase.from('dungeons').select('chapters!inner(campaigns!inner(user_id))', { count: 'exact', head: true }).eq('chapters.campaigns.user_id', userId),
    ])

  const { data: rawCampaigns } = await supabase
    .from('campaigns')
    .select('id, name, setting, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(4)

  const campaignIds = (rawCampaigns ?? []).map(c => c.id)

  const { data: chapterCounts } = campaignIds.length > 0
    ? await supabase.from('chapters').select('campaign_id').in('campaign_id', campaignIds)
    : { data: [] }

  const campaigns: Campaign[] = (rawCampaigns ?? []).map(c => ({
    ...c,
    setting: c.setting ?? '',
    chapterCount: chapterCounts?.filter(ch => ch.campaign_id === c.id).length ?? 0
  }))

return (
  <HomeClient
    stats={{
      campaigns: campaignCount ?? 0,
      chapters: chapterCount ?? 0,
      dungeons: dungeonCount ?? 0,
    }}
    campaigns={campaigns}
  />
)
}
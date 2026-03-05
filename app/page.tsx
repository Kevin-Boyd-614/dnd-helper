import { supabase } from '@/lib/supabase'
import HomeClient from '@/components/HomeClient'
import { Campaign } from '@/lib/types'

export default async function Page() {
  // These run on the server - like calling a service layer in .NET
  const [{ count: campaignCount }, { count: chapterCount2 }, { count: dungeonCount }] =
    await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('chapters').select('*', { count: 'exact', head: true }),
      supabase.from('dungeons').select('*', { count: 'exact', head: true }),
    ])

  const { data: rawCampaigns } = await supabase
  .from('campaigns')
  .select('id, name, setting')
  .order('created_at', { ascending: false })
  .limit(4)

const { data: chapterCounts } = await supabase
  .from('chapters')
  .select('campaign_id')

const campaigns: Campaign[] = (rawCampaigns ?? []).map(c => ({
  ...c,
  setting: c.setting ?? '',
  chapterCount: chapterCounts?.filter(ch => ch.campaign_id === c.id).length ?? 0
}))

return (
  <HomeClient
    stats={{
      campaigns: campaignCount ?? 0,
      chapters: chapterCount2 ?? 0,
      dungeons: dungeonCount ?? 0,
    }}
    campaigns={campaigns}
  />
)
}
import { supabase } from '@/lib/supabase'
import EditCampaignClient from './EditCampaignClient'
import { notFound } from 'next/navigation'

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, setting, description, player_count')
    .eq('id', id)
    .single()

  if (!campaign) notFound()

  return <EditCampaignClient campaign={campaign} />
}

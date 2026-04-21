import { supabase } from '@/lib/supabase'
import EditCampaignClient from './EditCampaignClient'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, setting, description, player_count, privacy, created_at')
    .eq('id', id)
    .eq('user_id', session!.userId)
    .single()

  if (!campaign) notFound()

  return <EditCampaignClient campaign={campaign} />
}

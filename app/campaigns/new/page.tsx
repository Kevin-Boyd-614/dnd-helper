import { getSession } from '@/lib/auth'
import NewCampaignClient from './NewCampaignClient'

export default async function NewCampaignPage() {
  const session = await getSession()
  return <NewCampaignClient userId={session!.userId} />
}

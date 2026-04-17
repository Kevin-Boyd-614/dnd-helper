import { getSession } from '@/lib/auth'
import NewMonsterClient from './NewMonsterClient'

export default async function NewMonsterPage() {
  const session = await getSession()
  return <NewMonsterClient userId={session!.userId} />
}

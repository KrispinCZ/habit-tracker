import { createServerClient } from '@/lib/supabase-server'
import { HabitWithLogs } from '@/lib/types'
import HabitList from '@/components/HabitList'
import AddHabitForm from '@/components/AddHabitForm'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerClient()

  const { data: habits } = await supabase
    .from('habits')
    .select('*, habit_logs(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <AddHabitForm />
      <HabitList habits={(habits as HabitWithLogs[]) ?? []} />
    </div>
  )
}

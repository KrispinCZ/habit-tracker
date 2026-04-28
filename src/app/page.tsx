import { createServerClient } from '@/lib/supabase-server'
import { HabitWithLogs } from '@/lib/types'
import HabitList from '@/components/HabitList'
import AddHabitForm from '@/components/AddHabitForm'
import YearGrid from '@/components/YearGrid'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerClient()

  const { data: habits } = await supabase
    .from('habits')
    .select('*, habit_logs(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const habitList = (habits as HabitWithLogs[]) ?? []

  return (
    <div className="space-y-8">
      <AddHabitForm />
      <YearGrid habits={habitList} />
      <HabitList habits={habitList} />
    </div>
  )
}

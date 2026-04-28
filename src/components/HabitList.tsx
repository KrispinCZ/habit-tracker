import { HabitWithLogs } from '@/lib/types'
import HabitCard from './HabitCard'

interface Props {
  habits: HabitWithLogs[]
}

export default function HabitList({ habits }: Props) {
  if (habits.length === 0) {
    return (
      <p className="text-center text-gray-600 py-12 text-sm">
        Zatím žádné zvyky. Přidej první!
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {habits.map(habit => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  )
}

import { createServerClient } from '@/lib/supabase-server'
import { HabitWithLogs } from '@/lib/types'
import { formatFrequency, getLast30Days, isExpectedDay, toISODate } from '@/lib/utils'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const supabase = await createServerClient()

  const { data: habit } = await supabase
    .from('habits')
    .select('*, habit_logs(*)')
    .eq('share_token', token)
    .is('deleted_at', null)
    .single()

  if (!habit) notFound()

  const h = habit as HabitWithLogs
  const days = getLast30Days()
  const logMap = new Map(h.habit_logs.map(l => [l.log_date, l.status]))
  const today = toISODate(new Date())

  const doneDays = [...logMap.values()].filter(s => s === 'done').length
  const expectedDays = days.filter(d => isExpectedDay(d, h.frequency, h.target_day) && d <= today).length
  const rate = expectedDays > 0 ? Math.round((doneDays / expectedDays) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">Sdílený zvyk</p>
        <h2 className="text-2xl font-semibold text-white">{h.title}</h2>
        <p className="text-sm text-gray-400 mt-1">{formatFrequency(h.frequency, h.target_day)}</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex gap-8 mb-6">
          <div>
            <p className="text-3xl font-bold text-green-400">{rate}%</p>
            <p className="text-xs text-gray-500 mt-0.5">úspěšnost (30 dní)</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{doneDays}</p>
            <p className="text-xs text-gray-500 mt-0.5">splněno</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{expectedDays}</p>
            <p className="text-xs text-gray-500 mt-0.5">očekáváno</p>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {days.map(day => {
            const status = logMap.get(day)
            const expected = isExpectedDay(day, h.frequency, h.target_day)
            const isToday = day === today

            let bg = 'bg-gray-800'
            if (status === 'done') bg = 'bg-green-500'
            else if (status === 'missed') bg = 'bg-red-500'
            else if (expected && day < today) bg = 'bg-gray-700'

            return (
              <div
                key={day}
                title={day}
                className={`w-6 h-6 rounded-sm ${bg} ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900' : ''}`}
              />
            )
          })}
        </div>
        <p className="text-xs text-gray-600 mt-2">Posledních 30 dní</p>

        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Splněno</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Nesplněno</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-700 inline-block" /> Očekáváno</span>
        </div>
      </div>

      <p className="text-xs text-center text-gray-700">Read-only view · Habit Tracker</p>
    </div>
  )
}

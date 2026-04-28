'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { HabitWithLogs, HabitStatus } from '@/lib/types'
import { formatFrequency, getLast30Days, isExpectedDay, toISODate } from '@/lib/utils'

interface Props {
  habit: HabitWithLogs
}

export default function HabitCard({ habit }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const days = getLast30Days()
  const logMap = new Map(habit.habit_logs.map(l => [l.log_date, l.status]))
  const today = toISODate(new Date())

  async function logDay(date: string, status: HabitStatus) {
    const supabase = createClient()
    const existing = logMap.get(date)

    if (existing === status) {
      await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('log_date', date)
    } else if (existing) {
      await supabase.from('habit_logs').update({ status }).eq('habit_id', habit.id).eq('log_date', date)
    } else {
      await supabase.from('habit_logs').insert({ habit_id: habit.id, log_date: date, status })
    }
    router.refresh()
  }

  async function deleteHabit() {
    if (!confirm(`Opravdu smazat zvyk "${habit.title}"? Data zůstanou v databázi.`)) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('habits').update({ deleted_at: new Date().toISOString() }).eq('id', habit.id)
    router.refresh()
  }

  function copyShareUrl() {
    const url = `${window.location.origin}/share/${habit.share_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="font-medium text-gray-900">{habit.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{formatFrequency(habit.frequency, habit.target_day)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyShareUrl}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
            title="Zkopírovat sdílecí odkaz"
          >
            {copied ? '✓ Zkopírováno' : '⬡ Sdílet'}
          </button>
          <button
            onClick={deleteHabit}
            disabled={deleting}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
            title="Smazat zvyk"
          >
            Smazat
          </button>
        </div>
      </div>

      {/* Today's actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => logDay(today, 'done')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            logMap.get(today) === 'done'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
          }`}
        >
          ✓ Splněno
        </button>
        <button
          onClick={() => logDay(today, 'missed')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            logMap.get(today) === 'missed'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          ✗ Nesplněno
        </button>
      </div>

      {/* 30-day grid */}
      <div className="flex gap-1 flex-wrap">
        {days.map(day => {
          const status = logMap.get(day)
          const expected = isExpectedDay(day, habit.frequency, habit.target_day)
          const isToday = day === today

          let bg = 'bg-gray-100'
          if (status === 'done') bg = 'bg-green-500'
          else if (status === 'missed') bg = 'bg-red-400'
          else if (expected && day < today) bg = 'bg-gray-200'

          return (
            <div
              key={day}
              title={day}
              className={`w-6 h-6 rounded-sm ${bg} ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''} cursor-default`}
            />
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2">Posledních 30 dní</p>
    </div>
  )
}

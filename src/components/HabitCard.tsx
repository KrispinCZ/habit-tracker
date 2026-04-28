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
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const days = getLast30Days()
  const logMap = new Map(habit.habit_logs.map(l => [l.log_date, l.status]))
  const today = toISODate(new Date())
  const todayStatus = logMap.get(today)

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
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header — vždy viditelný, kliknutím rozbalí/sbalí */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Indikátor dnešního stavu */}
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            todayStatus === 'done' ? 'bg-green-500' :
            todayStatus === 'missed' ? 'bg-red-500' :
            'bg-gray-600'
          }`} />
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{habit.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatFrequency(habit.frequency, habit.target_day)}</p>
          </div>
        </div>
        <span className={`text-gray-500 text-sm ml-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Detail — rozbalitelný */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-800">
          {/* Akce pro dnešek */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => logDay(today, 'done')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                todayStatus === 'done'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-green-900/40 hover:text-green-400'
              }`}
            >
              ✓ Splněno
            </button>
            <button
              onClick={() => logDay(today, 'missed')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                todayStatus === 'missed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-400'
              }`}
            >
              ✗ Nesplněno
            </button>
          </div>

          {/* 30denní grid */}
          <div className="flex gap-1 flex-wrap">
            {days.map(day => {
              const status = logMap.get(day)
              const expected = isExpectedDay(day, habit.frequency, habit.target_day)
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
          <p className="text-xs text-gray-600">Posledních 30 dní</p>

          {/* Akce karty */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={copyShareUrl}
              className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
            >
              {copied ? '✓ Zkopírováno' : '⬡ Sdílet'}
            </button>
            <button
              onClick={deleteHabit}
              disabled={deleting}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Smazat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

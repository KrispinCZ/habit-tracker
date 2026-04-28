'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { HabitFrequency } from '@/lib/types'

const DAYS_OF_WEEK = [
  { value: 1, label: 'Pondělí' },
  { value: 2, label: 'Úterý' },
  { value: 3, label: 'Středa' },
  { value: 4, label: 'Čtvrtek' },
  { value: 5, label: 'Pátek' },
  { value: 6, label: 'Sobota' },
  { value: 7, label: 'Neděle' },
]

export default function AddHabitForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [targetDay, setTargetDay] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('habits').insert({
      title: title.trim(),
      frequency,
      target_day: frequency === 'daily' ? null : targetDay,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setTitle('')
    setFrequency('daily')
    setTargetDay(1)
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors text-sm font-medium"
      >
        + Přidat zvyk
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-700 p-5 space-y-4">
      <h2 className="font-medium text-white">Nový zvyk</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Název</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Např. Ranní cvičení"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Frekvence</label>
        <select
          value={frequency}
          onChange={e => setFrequency(e.target.value as HabitFrequency)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">Denně</option>
          <option value="weekly">Týdně</option>
          <option value="monthly">Měsíčně</option>
        </select>
      </div>

      {frequency === 'weekly' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Který den</label>
          <select
            value={targetDay}
            onChange={e => setTargetDay(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DAYS_OF_WEEK.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      )}

      {frequency === 'monthly' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Den v měsíci</label>
          <select
            value={targetDay}
            onChange={e => setTargetDay(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}.</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Zrušit
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Ukládám…' : 'Uložit'}
        </button>
      </div>
    </form>
  )
}

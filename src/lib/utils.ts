import { HabitFrequency } from './types'

export function formatFrequency(frequency: HabitFrequency, targetDay: number | null): string {
  if (frequency === 'daily') return 'Denně'
  if (frequency === 'weekly') {
    const days = ['', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
    return `Týdně (${days[targetDay ?? 1]})`
  }
  if (frequency === 'monthly') {
    return `Měsíčně (${targetDay}. v měsíci)`
  }
  return frequency
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(toISODate(d))
  }
  return days
}

export function isExpectedDay(date: string, frequency: HabitFrequency, targetDay: number | null): boolean {
  if (frequency === 'daily') return true
  const d = new Date(date + 'T12:00:00')
  if (frequency === 'weekly') {
    const iso = d.getDay() === 0 ? 7 : d.getDay()
    return iso === targetDay
  }
  if (frequency === 'monthly') {
    return d.getDate() === targetDay
  }
  return false
}

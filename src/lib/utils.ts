import { HabitFrequency, HabitWithLogs } from './types'

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

// Typ pro jeden den v ročním gridu
export interface DayCell {
  date: string        // ISO date, např. "2026-01-01"
  total: number       // počet očekávaných zvyků
  done: number        // počet splněných zvyků
  isFuture: boolean   // datum je v budoucnosti
}

// Typ pro týden (sloupec) v gridu — 7 položek (Po–Ne), null = prázdná buňka (jiný rok)
export type WeekColumn = (DayCell | null)[]

/**
 * Vrátí ISO string pro dnešní datum (lokální čas, bez časové zóny).
 */
export function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Vypočítá stav pro každý den aktuálního roku na základě zvyků a jejich logů.
 * Vrátí pole sloupců (týdnů), kde každý sloupec má 7 buněk (Po–Ne).
 * Dny mimo aktuální rok jsou null.
 */
export function buildYearGrid(habits: HabitWithLogs[]): WeekColumn[] {
  const today = todayISO()
  const year = new Date().getFullYear()
  const startDate = `${year}-01-01`
  const endDate = today

  // Sestavíme mapu log_date → Set(habit_id) pro "done" logy
  const doneByDate = new Map<string, Set<number>>()
  for (const habit of habits) {
    for (const log of habit.habit_logs) {
      if (log.status === 'done') {
        if (!doneByDate.has(log.log_date)) doneByDate.set(log.log_date, new Set())
        doneByDate.get(log.log_date)!.add(habit.id)
      }
    }
  }

  // Zjistíme ISO den týdne (1=Po, 7=Ne) pro 1. 1. roku
  const jan1 = new Date(`${year}-01-01T12:00:00`)
  const jan1Dow = jan1.getDay() === 0 ? 7 : jan1.getDay() // 1–7

  // Počet dní od 1.1. do konce roku (nebo dnešku)
  const end = new Date(endDate + 'T12:00:00')
  const start = new Date(startDate + 'T12:00:00')

  // Celkový počet dní v roce pro grid (celý rok)
  const totalDaysInYear = isLeapYear(year) ? 366 : 365

  // Počet týdnů (sloupců): od prvního týdne do posledního dne roku
  // Sloupec 0: obsahuje 1.1., začíná od indexu (jan1Dow - 1) v týdnu
  const totalColumns = Math.ceil((totalDaysInYear + jan1Dow - 1) / 7)

  // Sestavíme grid: columns[col][row], row 0 = Pondělí
  const columns: WeekColumn[] = Array.from({ length: totalColumns }, () => Array(7).fill(null))

  let cursor = new Date(startDate + 'T12:00:00')
  for (let day = 0; day < totalDaysInYear; day++) {
    const isoDate = toISODate(cursor)
    const colIndex = Math.floor((day + jan1Dow - 1) / 7)
    const rowIndex = (day + jan1Dow - 1) % 7

    const isFuture = isoDate > endDate

    // Spočítáme expected a done pro tento den
    let total = 0
    let done = 0
    if (!isFuture) {
      for (const habit of habits) {
        if (isExpectedDay(isoDate, habit.frequency, habit.target_day)) {
          total++
          if (doneByDate.get(isoDate)?.has(habit.id)) done++
        }
      }
    }

    columns[colIndex][rowIndex] = { date: isoDate, total, done, isFuture }

    cursor.setDate(cursor.getDate() + 1)
  }

  return columns
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Vrátí pole názvů měsíců (česky, zkráceně) a index sloupce, kde daný měsíc začíná.
 * Používá se pro vykreslení popisků měsíců nad gridem.
 */
export function getMonthLabels(year: number): { label: string; colIndex: number }[] {
  const mesice = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
  const jan1 = new Date(`${year}-01-01T12:00:00`)
  const jan1Dow = jan1.getDay() === 0 ? 7 : jan1.getDay()

  const labels: { label: string; colIndex: number }[] = []
  for (let month = 0; month < 12; month++) {
    const firstOfMonth = new Date(year, month, 1)
    const dayOfYear = getDayOfYear(firstOfMonth) - 1 // 0-indexed
    const colIndex = Math.floor((dayOfYear + jan1Dow - 1) / 7)
    labels.push({ label: mesice[month], colIndex })
  }
  return labels
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

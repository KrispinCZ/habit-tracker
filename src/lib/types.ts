export type HabitFrequency = 'daily' | 'weekly' | 'monthly'
export type HabitStatus = 'done' | 'missed'

export interface Habit {
  id: number
  user_id: string | null
  title: string
  frequency: HabitFrequency
  target_day: number | null
  share_token: string
  deleted_at: string | null
  created_at: string
}

export interface HabitLog {
  id: number
  habit_id: number
  log_date: string
  status: HabitStatus
  created_at: string
}

export interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

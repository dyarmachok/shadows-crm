import { request, toQueryString } from './http'
import type { Category, PostStatus, ShadowPost } from './posts'

export interface ScheduleSlot {
  scheduledAt: string
  /** Локальний час слота, HH:mm */
  time: string
  past: boolean
  /** Можна поставити пост */
  available: boolean
  post: {
    id?: string
    status?: PostStatus
    preview?: string
    parts?: number
    category?: Partial<Category> | null
  } | null
}

export interface ScheduleDay {
  date: string
  timeZone: string
  slots: ScheduleSlot[]
}

export const scheduleApi = {
  /** date — локальна дата YYYY-MM-DD */
  day: (date: string, timeZone: string) =>
    request<ScheduleDay>(`/schedule/day?${toQueryString({ date, timeZone })}`),
  /** Пости зі слотами в проміжку [from, to) */
  range: (from: string, to: string) =>
    request<ShadowPost[]>(`/schedule?${toQueryString({ from, to })}`),
}

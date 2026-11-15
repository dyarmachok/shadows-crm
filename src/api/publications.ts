import { request } from './http'
import type { SpillTeaPost } from './spilltea'

export type PublicationChannel = 'site' | 'threads'
export type PublicationStatus = 'scheduled' | 'publishing' | 'published' | 'failed'

/** 'queue' — наступний вільний слот розкладу, 'now' — одразу, або дата-час ISO */
export type PublishAt = 'queue' | 'now' | string

export interface Publication {
  id: number
  postId: number
  channel: PublicationChannel
  /** Мовна версія, що публікується (en) */
  lang: string
  status: PublicationStatus
  scheduledAt: string
  publishedAt: string | null
  error: string | null
  threads: {
    /** Ланцюжок: кожна частина ≤ 500 символів */
    parts: string[]
    publishedParts: number
    permalink: string | null
  } | null
  updatedAt: string
}

export interface PublicationWithPost extends Publication {
  post: SpillTeaPost
}

export interface Schedule {
  timeZone: string
  /** Щоденні часи HH:MM */
  times: string[]
}

export interface ScheduleInfo extends Schedule {
  /** Найближчі вільні слоти */
  nextSlots: string[]
  /** false — публікатор на сервері вимкнено, нічого не публікується */
  publisherEnabled: boolean
  /** false — немає токена Threads */
  threadsEnabled: boolean
}

export interface PublicationsQuery {
  status?: PublicationStatus[]
  channel?: PublicationChannel
  from?: string
  to?: string
  limit?: number
}

export const THREADS_TEXT_LIMIT = 500

// Як на бекенді: емодзі рахуються за байтами UTF-8
const EMOJI =
  /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|\u{200D}|\u{FE0F}/u
export function threadsLength(text: string) {
  let length = 0
  for (const char of text) length += EMOJI.test(char) ? new TextEncoder().encode(char).length : 1
  return length
}

function queryString(query: PublicationsQuery) {
  const params = new URLSearchParams()
  for (const status of query.status ?? []) params.append('status', status)
  for (const key of ['channel', 'from', 'to', 'limit'] as const) {
    if (query[key] != null) params.set(key, String(query[key]))
  }
  return params.toString()
}

export const publicationsApi = {
  schedule: () => request<ScheduleInfo>('/api/schedule'),
  updateSchedule: (schedule: Schedule) =>
    request<ScheduleInfo>('/api/schedule', { method: 'PUT', body: JSON.stringify(schedule) }),
  list: (query: PublicationsQuery = {}) =>
    request<PublicationWithPost[]>(`/api/publications?${queryString(query)}`),
  publish: (postId: number, channels: PublicationChannel[], at: PublishAt = 'queue') =>
    request<Publication[]>(`/api/spilltea/${postId}/publications`, {
      method: 'POST',
      body: JSON.stringify({ channels, at }),
    }),
  update: (id: number, body: { at?: PublishAt; threadsParts?: string[] }) =>
    request<Publication>(`/api/publications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id: number) => request<null>(`/api/publications/${id}`, { method: 'DELETE' }),
}

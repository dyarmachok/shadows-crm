import type { Publication, PublicationChannel, PublicationStatus } from '@/api/publications'
import { formatDateTime } from './date'

export const channelLabels: Record<PublicationChannel, string> = {
  site: 'Сайт',
  threads: 'Threads',
}

export const channelIcons: Record<PublicationChannel, string> = {
  site: 'mdi-web',
  threads: 'mdi-at',
}

export const statusLabels: Record<PublicationStatus, string> = {
  scheduled: 'Заплановано',
  publishing: 'Публікується',
  published: 'Опубліковано',
  failed: 'Помилка',
}

export const statusColors: Record<PublicationStatus, string | undefined> = {
  scheduled: 'info',
  publishing: 'warning',
  published: 'success',
  failed: 'error',
}

/** «Заплановано · 15 лист. 2026 р., 10:00» */
export function publicationSummary(p: Publication) {
  const when = p.status === 'published' && p.publishedAt ? p.publishedAt : p.scheduledAt
  return `${statusLabels[p.status]} · ${formatDateTime(when)}`
}

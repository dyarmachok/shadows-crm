import type { PostStatus } from '@/api/posts'

export const postStatusMeta: Record<PostStatus, { title: string; color: string; icon: string }> = {
  translated: { title: 'Не в черзі', color: 'grey', icon: 'mdi-translate' },
  scheduled: { title: 'Заплановано', color: 'primary', icon: 'mdi-calendar-clock' },
  publishing: { title: 'Публікується', color: 'warning', icon: 'mdi-progress-upload' },
  published: { title: 'Опубліковано', color: 'success', icon: 'mdi-check-circle-outline' },
  failed: { title: 'Помилка', color: 'error', icon: 'mdi-alert-circle-outline' },
}

export const postStatusItems = Object.entries(postStatusMeta).map(([value, meta]) => ({
  value,
  title: meta.title,
}))

/** Статуси, з яких пост можна поставити в слот або перенести */
export const canSchedule = (status: PostStatus) =>
  status === 'translated' || status === 'scheduled' || status === 'failed'

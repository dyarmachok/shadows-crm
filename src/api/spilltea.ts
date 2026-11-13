import { request, toQueryString, type Paginated } from './http'
import type { PostImage } from './sources'

/** Мови додатка; en — основна */
export type Language = 'en' | 'uk' | 'es' | 'pt' | 'de'

export interface SpillTeaCategory {
  id: number
  slug: string
  /** Англійська (основна) назва */
  name: string
  /** Назви всіма мовами, ключ — код мови */
  names: Partial<Record<Language, string>>
}

export interface SpillTeaTranslation {
  id: number
  lang: Language
  slug: string
  body: string
  bodyFormat: 'text' | 'markdown'
  model: string | null
  /** Лайки з ideer на момент імпорту */
  seedLikesCount: number
  likesCount: number
  commentsCount: number
}

/** Пост, перекладений з ideer усіма мовами; куди публікувати — вирішується в CRM */
export interface SpillTeaPost {
  id: number
  /** id вихідного поста в ideer */
  sourceId: number | null
  category: SpillTeaCategory | null
  image: PostImage | null
  /** Опубліковано на сайті; null — ні */
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  translations: SpillTeaTranslation[]
}

export interface SpillTeaQuery {
  page?: number
  limit?: number
  categoryId?: number
  /** true — опубліковані на сайті, false — ще ні */
  onSite?: boolean
}

export const spillteaApi = {
  list: (query: SpillTeaQuery = {}) =>
    request<Paginated<SpillTeaPost>>(`/api/spilltea?${toQueryString(query)}`),
  get: (id: number) => request<SpillTeaPost>(`/api/spilltea/${id}`),
  categories: () => request<SpillTeaCategory[]>('/api/spilltea/categories'),
}

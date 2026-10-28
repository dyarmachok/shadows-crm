import { request, toQueryString, type Paginated } from './http'

export interface Category {
  id: string
  name: string
  slug: string
}

export interface PostImage {
  uri?: string
  width?: number
  height?: number
}

export type PostStatus = 'translated' | 'scheduled' | 'publishing' | 'published' | 'failed'

export interface PostError {
  message?: string
  partIndex?: number
  at?: string
}

export interface ShadowPost {
  id: string
  category: Category | null
  note: string
  parts: string[]
  noteType: 'text' | 'markdown'
  image: PostImage | null
  status: PostStatus
  sourceId: number
  scheduledAt: string | null
  publishedAt: string | null
  permalink: string | null
  /** Скільки частин уже опубліковано */
  publishedParts: number
  error: PostError | null
  createdAt: string
  updatedAt: string
}

export interface PostsQuery {
  page?: number
  limit?: number
  categoryId?: string
  status?: PostStatus
}

export const postsApi = {
  list: (query: PostsQuery = {}) =>
    request<Paginated<ShadowPost>>(`/posts?${toQueryString(query)}`),
  get: (id: string) => request<ShadowPost>(`/posts/${id}`),
  categories: () => request<Category[]>('/categories'),
  /** scheduledAt — початок години в майбутньому, ISO 8601 з часовим поясом */
  schedule: (id: string, scheduledAt: string) =>
    request<ShadowPost>(`/posts/${id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ scheduledAt }),
    }),
  unschedule: (id: string) => request<ShadowPost>(`/posts/${id}/schedule`, { method: 'DELETE' }),
}

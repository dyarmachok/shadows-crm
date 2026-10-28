import { request, toQueryString, type Paginated } from './http'
import type { PostImage, ShadowPost } from './posts'

export interface SourceCategory {
  id: number
  name: string
  slug: string | null
  postCount: number
}

export interface SourcePost {
  id: number
  category: Omit<SourceCategory, 'postCount'>
  note: string
  noteType: 'text' | 'markdown'
  image: PostImage | null
  likesCount: number
  commentsCount: number
  reactions: Record<string, number>
  createdAt: string
  /** Пост shadows, якщо вже перекладено */
  postId: string | null
}

export interface SourcesQuery {
  page?: number
  limit?: number
  categoryId?: number
}

export const sourcesApi = {
  list: (query: SourcesQuery = {}) =>
    request<Paginated<SourcePost>>(`/sources?${toQueryString(query)}`),
  categories: () => request<SourceCategory[]>('/sources/categories'),
  get: (id: number) => request<SourcePost>(`/sources/${id}`),
  translate: (id: number) => request<ShadowPost>(`/sources/${id}/translate`, { method: 'POST' }),
}

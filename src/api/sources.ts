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

/** За датою публікації: newest — від нових, oldest — від старих */
export type SourcesSort = 'newest' | 'oldest'

export interface SourcesQuery {
  page?: number
  limit?: number
  categoryId?: number
  sort?: SourcesSort
}

export const sourcesApi = {
  list: (query: SourcesQuery = {}) =>
    request<Paginated<SourcePost>>(`/api/sources?${toQueryString(query)}`),
  categories: () => request<SourceCategory[]>('/api/sources/categories'),
  get: (id: number) => request<SourcePost>(`/api/sources/${id}`),
  translate: (id: number) =>
    request<ShadowPost>(`/api/sources/${id}/translate`, { method: 'POST' }),
}

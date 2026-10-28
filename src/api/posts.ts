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

export interface ShadowPost {
  id: string
  category: Category | null
  note: string
  noteType: 'text' | 'markdown'
  image: PostImage | null
  status: 'translated'
  sourceId: number
  createdAt: string
  updatedAt: string
}

export interface PostsQuery {
  page?: number
  limit?: number
  categoryId?: string
}

export const postsApi = {
  list: (query: PostsQuery = {}) =>
    request<Paginated<ShadowPost>>(`/posts?${toQueryString(query)}`),
  get: (id: string) => request<ShadowPost>(`/posts/${id}`),
  categories: () => request<Category[]>('/categories'),
}

import { request } from './http'
import type { Language } from './spilltea'

export interface LocalizedName {
  name: string
  slug: string
}

/** Категорія з назвами й slug-ами всіма мовами; en — основна */
export interface Category {
  id: number
  /** id категорії в ideer */
  sourceCategoryId: number | null
  /** null — ще не перевірено (машинний переклад) */
  reviewedAt: string | null
  /** Постів у SpillTea */
  postCount: number
  translations: Partial<Record<Language, LocalizedName>>
  updatedAt: string
}

export interface CategoryUpdate {
  reviewed?: boolean
  /** Лише змінені мови й поля */
  translations?: Partial<Record<Language, Partial<LocalizedName>>>
}

export const categoriesApi = {
  list: () => request<Category[]>('/api/categories'),
  get: (id: number) => request<Category>(`/api/categories/${id}`),
  update: (id: number, body: CategoryUpdate) =>
    request<Category>(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  /** Той самий slugify, що й на бекенді при імпорті */
  slugify: (text: string, lang: Language) =>
    request<{ slug: string }>('/api/categories/slugify', {
      method: 'POST',
      body: JSON.stringify({ text, lang }),
    }),
}

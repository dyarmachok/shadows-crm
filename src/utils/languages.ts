import type { Language, SpillTeaCategory, SpillTeaPost } from '@/api/spilltea'

/** Мова CRM: пости й категорії показуються нею, якщо переклад є */
export const CRM_LANGUAGE: Language = 'uk'

export const languageLabels: Record<Language, string> = {
  uk: 'Українська',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
}

/** Порядок вкладок у CRM: спершу українська */
export const languageOrder: Language[] = ['uk', 'en', 'es', 'pt', 'de']

export const categoryName = (category: SpillTeaCategory | null) =>
  category ? (category.names[CRM_LANGUAGE] ?? category.name) : undefined

export const translationFor = (post: SpillTeaPost, lang: Language = CRM_LANGUAGE) =>
  post.translations.find((t) => t.lang === lang) ?? post.translations[0]

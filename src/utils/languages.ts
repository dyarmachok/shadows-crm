import type { Language, SpillTeaCategory, SpillTeaPost } from '@/api/spilltea'

/** Мова CRM: пости й категорії показуються нею, якщо переклад є */
export const CRM_LANGUAGE: Language = 'uk'

export const languageLabels: Record<Language, string> = {
  uk: 'Українська',
  en: 'English',
}

/** Порядок вкладок у CRM: спершу українська */
export const languageOrder: Language[] = ['uk', 'en']

/** Мови, якими контент публікується на сайті; slug потрібен лише для них */
export const SITE_LANGUAGES: Language[] = ['en']
export const isSiteLanguage = (lang: Language) => SITE_LANGUAGES.includes(lang)

export const categoryName = (category: SpillTeaCategory | null) =>
  category ? (category.names[CRM_LANGUAGE] ?? category.name) : undefined

export const translationFor = (post: SpillTeaPost, lang: Language = CRM_LANGUAGE) =>
  post.translations.find((t) => t.lang === lang) ?? post.translations[0]

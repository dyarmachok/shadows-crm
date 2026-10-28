import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Сторінка й категорія списку, синхронізовані з query-параметрами URL */
export function useListQuery() {
  const route = useRoute()
  const router = useRouter()

  const page = computed({
    get: () => Number(route.query.page) || 1,
    set: (value) => router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }),
  })

  const categoryId = computed<string | null>({
    get: () => (typeof route.query.categoryId === 'string' ? route.query.categoryId : null),
    set: (value) => router.push({ query: { categoryId: value ?? undefined } }),
  })

  watch(page, () => window.scrollTo({ top: 0 }))

  return { page, categoryId }
}

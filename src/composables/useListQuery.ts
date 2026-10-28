import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Рядковий query-параметр URL; зміна значення скидає сторінку списку */
export function useQueryParam(name: string) {
  const route = useRoute()
  const router = useRouter()

  return computed<string | null>({
    get: () => {
      const value = route.query[name]
      return typeof value === 'string' ? value : null
    },
    set: (value) =>
      router.push({ query: { ...route.query, [name]: value ?? undefined, page: undefined } }),
  })
}

/** Сторінка й категорія списку, синхронізовані з query-параметрами URL */
export function useListQuery() {
  const route = useRoute()
  const router = useRouter()

  const page = computed({
    get: () => Number(route.query.page) || 1,
    set: (value) => router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }),
  })

  const categoryId = useQueryParam('categoryId')

  watch(page, () => window.scrollTo({ top: 0 }))

  return { page, categoryId }
}

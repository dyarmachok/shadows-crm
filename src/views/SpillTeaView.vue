<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import type { Paginated } from '@/api/http'
import {
  spillteaApi,
  type Language,
  type SpillTeaCategory,
  type SpillTeaPost,
} from '@/api/spilltea'
import PostCard from '@/components/PostCard.vue'
import PublicationChips from '@/components/publications/PublicationChips.vue'
import PublishDialog from '@/components/publications/PublishDialog.vue'
import { useListQuery, useQueryParam } from '@/composables/useListQuery'
import {
  categoryName,
  CRM_LANGUAGE,
  languageLabels,
  languageOrder,
  translationFor,
} from '@/utils/languages'

const LIMIT = 20

const { page, categoryId } = useListQuery()
const onSiteParam = useQueryParam('onSite')

const categories = ref<SpillTeaCategory[]>([])
const data = ref<Paginated<SpillTeaPost> | null>(null)
const loading = ref(false)
const error = ref('')

const categoryItems = computed(() =>
  categories.value
    .map((c) => ({ title: categoryName(c)!, value: String(c.id) }))
    .sort((a, b) => a.title.localeCompare(b.title, 'uk')),
)

const siteItems = [
  { title: 'Ще не на сайті', value: 'false' },
  { title: 'На сайті', value: 'true' },
]

const languagesOf = (post: SpillTeaPost) =>
  languageOrder.filter((lang) => post.translations.some((t) => t.lang === lang))

/** Пост, для якого відкрито діалог публікації */
const publishing = ref<SpillTeaPost | null>(null)
const publishOpen = ref(false)
function openPublish(post: SpillTeaPost) {
  publishing.value = post
  publishOpen.value = true
}

/** Обрана мова для кожного поста; за замовчуванням — мова CRM */
const selectedLang = reactive(new Map<number, Language>())
const langOf = (post: SpillTeaPost) => selectedLang.get(post.id) ?? CRM_LANGUAGE

async function loadPosts() {
  loading.value = true
  error.value = ''
  try {
    data.value = await spillteaApi.list({
      page: page.value,
      limit: LIMIT,
      categoryId: categoryId.value ? Number(categoryId.value) : undefined,
      onSite: onSiteParam.value ? onSiteParam.value === 'true' : undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити пости'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = await spillteaApi.categories()
  } catch {
    // фільтр просто буде порожнім
  }
})

watch(() => [page.value, categoryId.value, onSiteParam.value], loadPosts, { immediate: true })
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-4 mb-4">
    <v-select
      v-model="categoryId"
      :items="categoryItems"
      label="Категорія"
      clearable
      hide-details
      density="comfortable"
      style="max-width: 360px"
    />
    <v-select
      v-model="onSiteParam"
      :items="siteItems"
      label="Сайт"
      clearable
      hide-details
      density="comfortable"
      style="max-width: 240px"
    />
    <v-spacer />
    <span v-if="data" class="text-body-2 text-medium-emphasis">Всього: {{ data.total }}</span>
  </div>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

  <v-progress-linear v-if="loading" indeterminate class="mb-4" />

  <v-row v-if="data?.items.length">
    <v-col v-for="post in data.items" :key="post.id" cols="12" md="6" xl="4">
      <PostCard
        :label="post.sourceId ? `з #${post.sourceId}` : `#${post.id}`"
        :date="post.createdAt"
        :note="translationFor(post, langOf(post))?.body ?? ''"
        :category="categoryName(post.category)"
        :image="post.image"
      >
        <template #actions>
          <v-chip
            v-for="lang in languagesOf(post)"
            :key="lang"
            size="small"
            :variant="translationFor(post, langOf(post))?.lang === lang ? 'flat' : 'outlined'"
            :color="translationFor(post, langOf(post))?.lang === lang ? 'primary' : undefined"
            :title="languageLabels[lang]"
            class="text-uppercase"
            @click="selectedLang.set(post.id, lang)"
          >
            {{ lang }}
          </v-chip>
          <PublicationChips :publications="post.publications" />
          <v-spacer />
          <v-btn
            v-if="post.publications.length < 2"
            variant="text"
            color="primary"
            prepend-icon="mdi-send-clock-outline"
            @click="openPublish(post)"
          >
            Опублікувати
          </v-btn>
          <v-btn
            :to="{ name: 'spilltea-post', params: { id: post.id } }"
            variant="text"
            prepend-icon="mdi-open-in-new"
          >
            Відкрити
          </v-btn>
        </template>
      </PostCard>
    </v-col>
  </v-row>

  <v-empty-state
    v-else-if="data && !loading"
    icon="mdi-tea-outline"
    title="Постів поки немає"
    text="Перекладіть пост у Sources — він з'явиться тут усіма мовами"
  />

  <PublishDialog v-if="publishing" v-model="publishOpen" :post="publishing" @done="loadPosts" />

  <v-pagination
    v-if="data && data.totalPages > 1"
    v-model="page"
    :length="data.totalPages"
    :total-visible="7"
    :disabled="loading"
    class="mt-4"
  />
</template>

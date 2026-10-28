<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import type { Paginated } from '@/api/http'
import { postsApi, type Category, type PostStatus, type ShadowPost } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'
import PostStatusChip from '@/components/PostStatusChip.vue'
import { useListQuery, useQueryParam } from '@/composables/useListQuery'
import { formatDateTime } from '@/utils/date'
import { postStatusItems } from '@/utils/postStatus'

const LIMIT = 20

const { page, categoryId } = useListQuery()
const status = useQueryParam('status')

const categories = ref<Category[]>([])
const data = ref<Paginated<ShadowPost> | null>(null)
const loading = ref(false)
const error = ref('')

const categoryItems = computed(() => categories.value.map((c) => ({ title: c.name, value: c.id })))

async function loadPosts() {
  loading.value = true
  error.value = ''
  try {
    data.value = await postsApi.list({
      page: page.value,
      limit: LIMIT,
      categoryId: categoryId.value ?? undefined,
      status: (status.value as PostStatus | null) ?? undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити пости'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = await postsApi.categories()
  } catch {
    // фільтр просто буде порожнім
  }
})

watch(() => [page.value, categoryId.value, status.value], loadPosts, { immediate: true })
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
      v-model="status"
      :items="postStatusItems"
      label="Статус"
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
        :label="`з #${post.sourceId}`"
        :date="post.createdAt"
        :note="post.note"
        :category="post.category?.name"
        :image="post.image"
      >
        <template #actions>
          <PostStatusChip :status="post.status" />
          <span v-if="post.publishedAt" class="text-body-2 text-medium-emphasis">
            {{ formatDateTime(post.publishedAt) }}
          </span>
          <span v-else-if="post.scheduledAt" class="text-body-2 text-medium-emphasis">
            {{ formatDateTime(post.scheduledAt) }}
          </span>
          <span v-if="post.parts.length > 1" class="text-body-2 text-medium-emphasis">
            {{ post.parts.length }} частин
          </span>
          <v-spacer />
          <v-btn
            :to="{ name: 'shadow', params: { id: post.id } }"
            variant="text"
            append-icon="mdi-arrow-right"
          >
            Детальніше
          </v-btn>
        </template>
      </PostCard>
    </v-col>
  </v-row>

  <v-empty-state
    v-else-if="data && !loading"
    icon="mdi-text-box-remove-outline"
    title="Постів не знайдено"
    text="Перекладіть пости на сторінці Sources"
  >
    <template #actions>
      <v-btn :to="{ name: 'sources' }" color="primary" variant="tonal">До Sources</v-btn>
    </template>
  </v-empty-state>

  <v-pagination
    v-if="data && data.totalPages > 1"
    v-model="page"
    :length="data.totalPages"
    :total-visible="7"
    :disabled="loading"
    class="mt-4"
  />
</template>

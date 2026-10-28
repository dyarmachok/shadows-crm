<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import type { Paginated } from '@/api/http'
import type { ShadowPost } from '@/api/posts'
import { sourcesApi, type SourceCategory, type SourcePost } from '@/api/sources'
import PostCard from '@/components/PostCard.vue'
import { useListQuery } from '@/composables/useListQuery'

const LIMIT = 20

const reactionEmoji: Record<string, string> = {
  joke: '😂',
  love: '❤️',
  wow: '😮',
  sad: '😢',
  angry: '😡',
  ugh: '😖',
  facepalm: '🤦',
}

const { page, categoryId } = useListQuery()

const categories = ref<SourceCategory[]>([])
const data = ref<Paginated<SourcePost> | null>(null)
const loading = ref(false)
const error = ref('')

const translating = reactive(new Set<number>())
const snackbar = reactive({
  show: false,
  color: 'success',
  text: '',
  post: null as ShadowPost | null,
})

const categoryItems = computed(() =>
  categories.value.map((c) => ({ title: `${c.name} (${c.postCount})`, value: String(c.id) })),
)

async function loadPosts() {
  loading.value = true
  error.value = ''
  try {
    data.value = await sourcesApi.list({
      page: page.value,
      limit: LIMIT,
      categoryId: categoryId.value ? Number(categoryId.value) : undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити пости'
  } finally {
    loading.value = false
  }
}

async function translate(source: SourcePost) {
  translating.add(source.id)
  try {
    const post = await sourcesApi.translate(source.id)
    Object.assign(snackbar, {
      show: true,
      color: 'success',
      text: `Пост #${source.id} перекладено`,
      post,
    })

    // перекладений пост зникає зі списку на бекенді — прибираємо його й локально
    if (data.value) {
      data.value.items = data.value.items.filter((item) => item.id !== source.id)
      data.value.total--
      if (!data.value.items.length) await loadPosts()
    }
  } catch (e) {
    const text = e instanceof Error ? e.message : 'Не вдалося перекласти пост'
    Object.assign(snackbar, { show: true, color: 'error', text, post: null })
  } finally {
    translating.delete(source.id)
  }
}

onMounted(async () => {
  try {
    categories.value = await sourcesApi.categories()
  } catch {
    // фільтр просто буде порожнім
  }
})

watch(() => [page.value, categoryId.value], loadPosts, { immediate: true })
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
    <v-spacer />
    <span v-if="data" class="text-body-2 text-medium-emphasis">
      Неперекладених: {{ data.total }}
    </span>
  </div>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

  <v-progress-linear v-if="loading" indeterminate class="mb-4" />

  <v-row v-if="data?.items.length">
    <v-col v-for="post in data.items" :key="post.id" cols="12" md="6" xl="4">
      <PostCard
        :label="`#${post.id}`"
        :date="post.createdAt"
        :note="post.note"
        :category="post.category.name"
        :image="post.image"
      >
        <template #actions>
          <span class="text-body-2 text-medium-emphasis">
            <v-icon icon="mdi-thumb-up-outline" size="small" /> {{ post.likesCount }}
          </span>
          <span class="text-body-2 text-medium-emphasis">
            <v-icon icon="mdi-comment-outline" size="small" /> {{ post.commentsCount }}
          </span>
          <span
            v-for="(count, name) in post.reactions"
            :key="name"
            :title="String(name)"
            class="text-body-2 text-medium-emphasis"
          >
            {{ reactionEmoji[name] ?? name }} {{ count }}
          </span>
          <v-spacer />
          <v-btn
            v-if="post.postId"
            :to="{ name: 'shadow', params: { id: post.postId } }"
            variant="text"
            prepend-icon="mdi-open-in-new"
          >
            Переклад
          </v-btn>
          <v-btn
            v-else
            color="primary"
            variant="tonal"
            prepend-icon="mdi-translate"
            :loading="translating.has(post.id)"
            @click="translate(post)"
          >
            Перекласти
          </v-btn>
        </template>
      </PostCard>
    </v-col>
  </v-row>

  <v-empty-state
    v-else-if="data && !loading"
    icon="mdi-database-off-outline"
    title="Неперекладених постів немає"
  />

  <v-pagination
    v-if="data && data.totalPages > 1"
    v-model="page"
    :length="data.totalPages"
    :total-visible="7"
    :disabled="loading"
    class="mt-4"
  />

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="5000">
    {{ snackbar.text }}
    <template v-if="snackbar.post" #actions>
      <v-btn variant="text" :to="{ name: 'shadow', params: { id: snackbar.post.id } }">
        Відкрити
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import { postsApi, type ShadowPost } from '@/api/posts'
import { sourcesApi, type SourcePost } from '@/api/sources'
import PostCard from '@/components/PostCard.vue'

const props = defineProps<{ id: string }>()

const post = ref<ShadowPost | null>(null)
const source = ref<SourcePost | null>(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  source.value = null
  try {
    post.value = await postsApi.get(props.id)
    source.value = await sourcesApi.get(post.value.sourceId).catch(() => null)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити пост'
  } finally {
    loading.value = false
  }
}

watch(() => props.id, load, { immediate: true })
</script>

<template>
  <v-btn :to="{ name: 'shadows' }" variant="text" prepend-icon="mdi-arrow-left" class="mb-4">
    До списку
  </v-btn>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

  <v-progress-linear v-if="loading" indeterminate class="mb-4" />

  <v-row v-if="post">
    <v-col cols="12" md="6">
      <div class="text-overline mb-2">Переклад</div>
      <PostCard
        label="Оновлено"
        :date="post.updatedAt"
        :note="post.note"
        :category="post.category?.name"
        :image="post.image"
      />
    </v-col>
    <v-col cols="12" md="6">
      <div class="text-overline mb-2">Оригінал #{{ post.sourceId }}</div>
      <PostCard
        v-if="source"
        :label="`#${source.id}`"
        :date="source.createdAt"
        :note="source.note"
        :category="source.category.name"
        :image="source.image"
      />
      <v-alert v-else-if="!loading" type="info" variant="tonal" text="Оригінал недоступний" />
    </v-col>
  </v-row>
</template>

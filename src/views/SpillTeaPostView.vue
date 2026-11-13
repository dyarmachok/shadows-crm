<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { sourcesApi, type SourcePost } from '@/api/sources'
import { spillteaApi, type Language, type SpillTeaPost } from '@/api/spilltea'
import PostCard from '@/components/PostCard.vue'
import { formatDateTime } from '@/utils/date'
import { categoryName, CRM_LANGUAGE, languageLabels, languageOrder } from '@/utils/languages'

const props = defineProps<{ id: number }>()

const post = ref<SpillTeaPost | null>(null)
const source = ref<SourcePost | null>(null)
const loading = ref(false)
const error = ref('')
const tab = ref<Language>(CRM_LANGUAGE)

const translations = computed(() =>
  languageOrder.flatMap((lang) => post.value?.translations.filter((t) => t.lang === lang) ?? []),
)

async function load() {
  loading.value = true
  error.value = ''
  source.value = null
  try {
    post.value = await spillteaApi.get(props.id)
    if (!post.value.translations.some((t) => t.lang === tab.value)) {
      tab.value = post.value.translations[0]?.lang ?? CRM_LANGUAGE
    }
    if (post.value.sourceId) {
      source.value = await sourcesApi.get(post.value.sourceId).catch(() => null)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити пост'
  } finally {
    loading.value = false
  }
}

watch(() => props.id, load, { immediate: true })
</script>

<template>
  <v-btn :to="{ name: 'spilltea' }" variant="text" prepend-icon="mdi-arrow-left" class="mb-4">
    До списку
  </v-btn>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

  <v-progress-linear v-if="loading" indeterminate class="mb-4" />

  <v-row v-if="post">
    <v-col cols="12" lg="7">
      <v-card border flat>
        <v-img
          v-if="post.image?.uri"
          :src="post.image.uri"
          :aspect-ratio="
            post.image.width && post.image.height ? post.image.width / post.image.height : undefined
          "
          max-height="360"
          cover
        />

        <v-card-item>
          <template v-if="post.category" #prepend>
            <v-chip size="small" color="primary" variant="tonal">
              {{ categoryName(post.category) }}
            </v-chip>
          </template>
          <template #append>
            <span class="text-caption text-medium-emphasis">
              #{{ post.id }} · {{ formatDateTime(post.createdAt) }}
            </span>
          </template>
        </v-card-item>

        <v-tabs v-model="tab" density="comfortable" show-arrows>
          <v-tab v-for="t in translations" :key="t.lang" :value="t.lang">
            {{ languageLabels[t.lang] }}
          </v-tab>
        </v-tabs>
        <v-divider />

        <v-tabs-window v-model="tab">
          <v-tabs-window-item v-for="t in translations" :key="t.lang" :value="t.lang">
            <v-card-text class="note">{{ t.body }}</v-card-text>
            <v-card-text class="pt-0 d-flex flex-wrap ga-4 text-body-2 text-medium-emphasis">
              <span title="Slug для адреси на сайті">
                <v-icon icon="mdi-link-variant" size="small" /> {{ t.slug }}
              </span>
              <span title="Лайки з ideer на момент імпорту">
                <v-icon icon="mdi-thumb-up-outline" size="small" /> {{ t.seedLikesCount }}
              </span>
              <span v-if="t.model" title="Модель перекладу">
                <v-icon icon="mdi-robot-outline" size="small" /> {{ t.model }}
              </span>
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>

    <v-col cols="12" lg="5">
      <v-card border flat class="mb-4">
        <v-card-title class="text-subtitle-1">Публікація</v-card-title>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-web"
            title="Сайт"
            :subtitle="post.publishedAt ? formatDateTime(post.publishedAt) : 'Не опубліковано'"
          />
          <v-list-item prepend-icon="mdi-at" title="Threads" subtitle="Скоро" />
        </v-list>
      </v-card>

      <template v-if="post.sourceId">
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
      </template>
    </v-col>
  </v-row>
</template>

<style scoped>
.note {
  white-space: pre-wrap;
}
</style>

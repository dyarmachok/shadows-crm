<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { postsApi, type ShadowPost } from '@/api/posts'
import { sourcesApi, type SourcePost } from '@/api/sources'
import PostCard from '@/components/PostCard.vue'
import PostStatusChip from '@/components/PostStatusChip.vue'
import ScheduleDialog from '@/components/ScheduleDialog.vue'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id: string }>()

const post = ref<ShadowPost | null>(null)
const source = ref<SourcePost | null>(null)
const loading = ref(false)
const error = ref('')

const scheduleOpen = ref(false)
const unscheduling = ref(false)
const actionError = ref('')

const canSchedule = computed(
  () => !!post.value && ['translated', 'scheduled', 'failed'].includes(post.value.status),
)

async function load() {
  loading.value = true
  error.value = ''
  actionError.value = ''
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

async function unschedule() {
  unscheduling.value = true
  actionError.value = ''
  try {
    post.value = await postsApi.unschedule(props.id)
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Не вдалося зняти пост з черги'
  } finally {
    unscheduling.value = false
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
    <v-col cols="12" md="7">
      <div class="text-overline mb-2">Переклад</div>
      <PostCard
        label="Оновлено"
        :date="post.updatedAt"
        :note="post.note"
        :parts="post.parts"
        :published-parts="post.publishedParts"
        :category="post.category?.name"
        :image="post.image"
      />
    </v-col>

    <v-col cols="12" md="5">
      <div class="text-overline mb-2">Публікація</div>
      <v-card border flat class="mb-6">
        <v-card-item>
          <PostStatusChip :status="post.status" />
        </v-card-item>

        <v-list density="compact">
          <v-list-item
            v-if="post.scheduledAt"
            prepend-icon="mdi-calendar-clock"
            title="Слот"
            :subtitle="formatDateTime(post.scheduledAt)"
          />
          <v-list-item
            v-if="post.publishedAt"
            prepend-icon="mdi-send-check-outline"
            title="Опубліковано"
            :subtitle="formatDateTime(post.publishedAt)"
          />
          <v-list-item
            prepend-icon="mdi-format-list-numbered"
            title="Частини"
            :subtitle="`Опубліковано ${post.publishedParts} з ${post.parts.length}`"
          />
          <v-list-item
            v-if="post.permalink"
            prepend-icon="mdi-open-in-new"
            title="Посилання"
            :subtitle="post.permalink"
            :href="post.permalink"
            target="_blank"
          />
        </v-list>

        <v-card-text v-if="post.error || actionError" class="pt-0">
          <v-alert
            v-if="post.error"
            type="error"
            variant="tonal"
            density="compact"
            :title="
              post.error.partIndex != null
                ? `Помилка на частині ${post.error.partIndex + 1}`
                : 'Помилка публікації'
            "
            :text="
              [post.error.message, post.error.at && formatDateTime(post.error.at)]
                .filter(Boolean)
                .join(' · ')
            "
          />
          <v-alert
            v-if="actionError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2"
            :text="actionError"
          />
        </v-card-text>

        <v-card-actions v-if="canSchedule">
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-calendar-plus"
            @click="scheduleOpen = true"
          >
            {{ post.status === 'scheduled' ? 'Перенести' : 'Запланувати' }}
          </v-btn>
          <v-btn
            v-if="post.status === 'scheduled'"
            color="error"
            variant="text"
            prepend-icon="mdi-calendar-remove"
            :loading="unscheduling"
            @click="unschedule"
          >
            Зняти з черги
          </v-btn>
        </v-card-actions>
      </v-card>

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

  <ScheduleDialog v-if="post" v-model="scheduleOpen" :post="post" @saved="post = $event" />
</template>

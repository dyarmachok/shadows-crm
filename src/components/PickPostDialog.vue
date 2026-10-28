<script setup lang="ts">
import { ref, watch } from 'vue'

import type { Paginated } from '@/api/http'
import { postsApi, type ShadowPost } from '@/api/posts'
import type { ScheduleSlot } from '@/api/schedule'
import { formatDateTime } from '@/utils/date'

const LIMIT = 10

const props = defineProps<{ target: ScheduleSlot | null }>()
const emit = defineEmits<{ saved: [post: ShadowPost] }>()
const open = defineModel<boolean>({ required: true })

const page = ref(1)
const data = ref<Paginated<ShadowPost> | null>(null)
const selected = ref<string | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await postsApi.list({ status: 'translated', page: page.value, limit: LIMIT })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити пости'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!selected.value || !props.target) return

  saving.value = true
  error.value = ''
  try {
    emit('saved', await postsApi.schedule(selected.value, props.target.scheduledAt))
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося запланувати пост'
  } finally {
    saving.value = false
  }
}

watch(open, (value) => {
  if (!value) return
  selected.value = null
  page.value = 1
})

watch([open, page], () => open.value && load())
</script>

<template>
  <v-dialog v-model="open" max-width="640" scrollable>
    <v-card
      title="Поставити пост у слот"
      :subtitle="target ? formatDateTime(target.scheduledAt) : undefined"
    >
      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-list v-if="data?.items.length" lines="three" border rounded>
          <v-list-item
            v-for="post in data.items"
            :key="post.id"
            :active="selected === post.id"
            color="primary"
            @click="selected = post.id"
          >
            <v-list-item-title>{{ post.category?.name ?? 'Без категорії' }}</v-list-item-title>
            <v-list-item-subtitle>{{ post.note }}</v-list-item-subtitle>
            <template v-if="post.parts.length > 1" #append>
              <span class="text-caption text-medium-emphasis">{{ post.parts.length }} ч.</span>
            </template>
          </v-list-item>
        </v-list>

        <v-empty-state
          v-else-if="data && !loading"
          icon="mdi-text-box-remove-outline"
          title="Немає постів поза чергою"
          text="Перекладіть нові пости на сторінці Sources"
        />

        <v-pagination
          v-if="data && data.totalPages > 1"
          v-model="page"
          :length="data.totalPages"
          :total-visible="5"
          :disabled="loading"
          density="compact"
          class="mt-2"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">Скасувати</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!selected" :loading="saving" @click="save">
          Запланувати
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

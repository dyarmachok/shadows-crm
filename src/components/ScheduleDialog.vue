<script setup lang="ts">
import { ref, watch } from 'vue'

import { postsApi, type ShadowPost } from '@/api/posts'
import { scheduleApi, type ScheduleSlot } from '@/api/schedule'
import { addDays, formatDay, timeZone, toLocalDate, today } from '@/utils/date'

const props = defineProps<{ post: ShadowPost }>()
const emit = defineEmits<{ saved: [post: ShadowPost] }>()
const open = defineModel<boolean>({ required: true })

const date = ref(today())
const slots = ref<ScheduleSlot[]>([])
const selected = ref<string | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')

async function loadSlots() {
  selected.value = null
  if (!date.value) return

  loading.value = true
  error.value = ''
  try {
    slots.value = (await scheduleApi.day(date.value, timeZone)).slots
  } catch (e) {
    slots.value = []
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити слоти'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!selected.value) return

  saving.value = true
  error.value = ''
  try {
    emit('saved', await postsApi.schedule(props.post.id, selected.value))
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося запланувати пост'
  } finally {
    saving.value = false
  }
}

watch(
  open,
  (value) => {
    if (value) date.value = props.post.scheduledAt ? toLocalDate(props.post.scheduledAt) : today()
  },
  { immediate: true },
)

watch([open, date], () => open.value && loadSlots(), { immediate: true })
</script>

<template>
  <v-dialog v-model="open" max-width="560">
    <v-card title="Слот публікації" :subtitle="formatDay(date)">
      <v-card-text>
        <div class="d-flex align-center ga-2 mb-4">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            :disabled="date <= today()"
            @click="date = addDays(date, -1)"
          />
          <v-text-field v-model="date" type="date" :min="today()" hide-details density="compact" />
          <v-btn icon="mdi-chevron-right" variant="text" @click="date = addDays(date, 1)" />
        </div>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <div class="slots">
          <v-btn
            v-for="item in slots"
            :key="item.scheduledAt"
            :color="
              selected === item.scheduledAt
                ? 'primary'
                : item.post?.id === post.id
                  ? 'success'
                  : undefined
            "
            :variant="selected === item.scheduledAt ? 'flat' : 'outlined'"
            :disabled="!item.available"
            :title="item.post?.preview"
            @click="selected = item.scheduledAt"
          >
            {{ item.time }}
          </v-btn>
        </div>
        <div class="text-caption text-medium-emphasis mt-3">
          Одна година — один пост. Зайняті й минулі слоти недоступні.
        </div>
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

<style scoped>
.slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
}
</style>

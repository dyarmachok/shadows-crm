<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { scheduleApi, type ScheduleSlot } from '@/api/schedule'
import type { ShadowPost } from '@/api/posts'
import PickPostDialog from '@/components/PickPostDialog.vue'
import PostStatusChip from '@/components/PostStatusChip.vue'
import { useQueryParam } from '@/composables/useListQuery'
import { addDays, formatDay, formatTime, timeZone, toLocalDate, today } from '@/utils/date'

const QUEUE_DAYS = 7

const tab = ref<'day' | 'queue'>('day')

const dateParam = useQueryParam('date')
const date = computed({
  get: () => dateParam.value ?? today(),
  set: (value: string) => (dateParam.value = value && value !== today() ? value : null),
})

const slots = ref<ScheduleSlot[]>([])
const queue = ref<ShadowPost[]>([])
const loading = ref(false)
const error = ref('')

const pickOpen = ref(false)
const pickTarget = ref<ScheduleSlot | null>(null)
const snackbar = reactive({ show: false, text: '' })

const queueByDay = computed(() => {
  const groups = new Map<string, ShadowPost[]>()
  for (const post of queue.value) {
    const day = toLocalDate(post.scheduledAt!)
    groups.set(day, [...(groups.get(day) ?? []), post])
  }
  return [...groups]
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (tab.value === 'day') {
      slots.value = (await scheduleApi.day(date.value, timeZone)).slots
    } else {
      const now = new Date()
      const to = new Date(now.getTime() + QUEUE_DAYS * 24 * 60 * 60 * 1000)
      queue.value = await scheduleApi.range(now.toISOString(), to.toISOString())
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити розклад'
  } finally {
    loading.value = false
  }
}

function pick(slot: ScheduleSlot) {
  pickTarget.value = slot
  pickOpen.value = true
}

function onScheduled() {
  Object.assign(snackbar, { show: true, text: 'Пост поставлено в слот' })
  load()
}

watch([tab, date], load, { immediate: true })
</script>

<template>
  <v-tabs v-model="tab" class="mb-4">
    <v-tab value="day" prepend-icon="mdi-calendar-today">День</v-tab>
    <v-tab value="queue" prepend-icon="mdi-format-list-bulleted"
      >Черга на {{ QUEUE_DAYS }} днів</v-tab
    >
  </v-tabs>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

  <template v-if="tab === 'day'">
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-btn icon="mdi-chevron-left" variant="text" @click="date = addDays(date, -1)" />
      <v-btn variant="tonal" :disabled="date === today()" @click="date = today()">Сьогодні</v-btn>
      <v-btn icon="mdi-chevron-right" variant="text" @click="date = addDays(date, 1)" />
      <v-text-field
        v-model="date"
        type="date"
        hide-details
        density="compact"
        style="max-width: 180px"
      />
      <span class="text-h6 ml-2">{{ formatDay(date) }}</span>
    </div>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-list border rounded lines="two">
      <v-list-item
        v-for="item in slots"
        :key="item.scheduledAt"
        :to="item.post?.id ? { name: 'shadow', params: { id: item.post.id } } : undefined"
        :class="{ 'text-disabled': item.past && !item.post }"
      >
        <template #prepend>
          <span class="slot-time text-h6 mr-4">{{ item.time }}</span>
        </template>

        <template v-if="item.post">
          <v-list-item-title>{{ item.post.preview }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ item.post.category?.name ?? 'Без категорії' }}
            <template v-if="item.post.parts && item.post.parts > 1">
              · {{ item.post.parts }} частин
            </template>
          </v-list-item-subtitle>
        </template>
        <v-list-item-title v-else class="text-medium-emphasis">
          {{ item.available ? 'Вільно' : item.past ? 'Минуло' : 'Недоступно' }}
        </v-list-item-title>

        <template #append>
          <PostStatusChip v-if="item.post?.status" :status="item.post.status" />
          <v-btn
            v-else-if="item.available"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-plus"
            @click="pick(item)"
          >
            Поставити пост
          </v-btn>
        </template>
      </v-list-item>
    </v-list>
  </template>

  <template v-else>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-list v-if="queueByDay.length" border rounded lines="two">
      <template v-for="[day, posts] in queueByDay" :key="day">
        <v-list-subheader class="text-capitalize">{{ formatDay(day) }}</v-list-subheader>
        <v-list-item
          v-for="post in posts"
          :key="post.id"
          :to="{ name: 'shadow', params: { id: post.id } }"
        >
          <template #prepend>
            <span class="slot-time text-h6 mr-4">{{ formatTime(post.scheduledAt!) }}</span>
          </template>
          <v-list-item-title>{{ post.note }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ post.category?.name ?? 'Без категорії' }}
            <template v-if="post.parts.length > 1"> · {{ post.parts.length }} частин</template>
          </v-list-item-subtitle>
          <template #append>
            <PostStatusChip :status="post.status" />
          </template>
        </v-list-item>
      </template>
    </v-list>

    <v-empty-state
      v-else-if="!loading"
      icon="mdi-calendar-blank-outline"
      title="Черга порожня"
      :text="`На найближчі ${QUEUE_DAYS} днів нічого не заплановано`"
    />
  </template>

  <PickPostDialog v-model="pickOpen" :target="pickTarget" @saved="onScheduled" />

  <v-snackbar v-model="snackbar.show" color="success" timeout="4000">{{
    snackbar.text
  }}</v-snackbar>
</template>

<style scoped>
.slot-time {
  min-width: 56px;
  font-variant-numeric: tabular-nums;
}
</style>

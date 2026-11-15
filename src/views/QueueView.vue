<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { publicationsApi, type PublicationWithPost, type ScheduleInfo } from '@/api/publications'
import PublicationActions from '@/components/publications/PublicationActions.vue'
import { formatDateTime, formatDay, formatTime, toLocalDate } from '@/utils/date'
import { categoryName, translationFor } from '@/utils/languages'
import { channelIcons, channelLabels, statusColors, statusLabels } from '@/utils/publications'

const schedule = ref<ScheduleInfo | null>(null)
const queue = ref<PublicationWithPost[]>([])
const published = ref<PublicationWithPost[]>([])
const loading = ref(false)
const error = ref('')

// Редагування розкладу
const times = ref<string[]>([])
const newTime = ref('12:00')
const savingSchedule = ref(false)
const scheduleDirty = computed(
  () => !!schedule.value && times.value.join() !== schedule.value.times.join(),
)

/** Черга, згрупована за днем; канали одного поста в одному слоті — одним рядком */
const days = computed(() => {
  const groups = new Map<string, Map<string, PublicationWithPost[]>>()
  for (const p of queue.value) {
    const day = toLocalDate(p.scheduledAt)
    const slots = groups.get(day) ?? new Map<string, PublicationWithPost[]>()
    const key = `${p.scheduledAt}|${p.postId}`
    slots.set(key, [...(slots.get(key) ?? []), p])
    groups.set(day, slots)
  }
  return [...groups].map(([day, slots]) => ({ day, slots: [...slots.values()] }))
})

const failedCount = computed(() => queue.value.filter((p) => p.status === 'failed').length)

const excerpt = (p: PublicationWithPost) => {
  const body = translationFor(p.post)?.body ?? ''
  return body.length > 180 ? `${body.slice(0, 180)}…` : body
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [info, upcoming, done] = await Promise.all([
      publicationsApi.schedule(),
      publicationsApi.list({ status: ['scheduled', 'publishing', 'failed'], limit: 200 }),
      publicationsApi.list({ status: ['published'], limit: 20 }),
    ])
    schedule.value = info
    times.value = [...info.times]
    queue.value = upcoming
    published.value = done
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити чергу'
  } finally {
    loading.value = false
  }
}

function addTime() {
  if (newTime.value && !times.value.includes(newTime.value)) {
    times.value = [...times.value, newTime.value].sort()
  }
}

async function saveSchedule() {
  if (!schedule.value) return
  savingSchedule.value = true
  error.value = ''
  try {
    schedule.value = await publicationsApi.updateSchedule({
      timeZone: schedule.value.timeZone,
      times: times.value,
    })
    times.value = [...schedule.value.times]
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося зберегти розклад'
  } finally {
    savingSchedule.value = false
  }
}

onMounted(load)
</script>

<template>
  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />
  <v-alert
    v-if="schedule && !schedule.publisherEnabled"
    type="warning"
    variant="tonal"
    class="mb-4"
    title="Публікатор вимкнено"
    text="На сервері не задано PUBLISHER_ENABLED=true — заплановані пости не публікуються."
  />
  <v-alert
    v-else-if="schedule && !schedule.threadsEnabled"
    type="info"
    variant="tonal"
    class="mb-4"
    text="Немає токена Threads (THREADS_API_KEY) — публікації в Threads завершаться помилкою."
  />

  <v-row>
    <v-col cols="12" lg="4">
      <v-card border flat class="mb-4">
        <v-card-item>
          <v-card-title class="text-subtitle-1">Розклад</v-card-title>
          <v-card-subtitle v-if="schedule">
            Щодня, {{ schedule.timeZone }}. Нові пости стають у перший вільний час.
          </v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-chip
              v-for="time in times"
              :key="time"
              closable
              @click:close="times = times.filter((t) => t !== time)"
            >
              {{ time }}
            </v-chip>
            <span v-if="!times.length" class="text-error text-body-2">
              Немає часів — черга не працює
            </span>
          </div>
          <div class="d-flex ga-2 align-center">
            <v-text-field
              v-model="newTime"
              type="time"
              label="Час"
              density="compact"
              hide-details
              style="max-width: 140px"
            />
            <v-btn variant="tonal" prepend-icon="mdi-plus" @click="addTime">Додати</v-btn>
          </div>
        </v-card-text>
        <v-card-actions v-if="scheduleDirty">
          <v-spacer />
          <v-btn variant="text" @click="times = [...(schedule?.times ?? [])]">Скасувати</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingSchedule" @click="saveSchedule">
            Зберегти розклад
          </v-btn>
        </v-card-actions>
        <v-divider />
        <v-card-text v-if="schedule?.nextSlots.length">
          <div class="text-caption text-medium-emphasis mb-1">Найближчі вільні слоти</div>
          <div v-for="slot in schedule.nextSlots" :key="slot" class="text-body-2">
            {{ formatDateTime(slot) }}
          </div>
        </v-card-text>
      </v-card>

      <v-card v-if="published.length" border flat>
        <v-card-title class="text-subtitle-1">Нещодавно опубліковано</v-card-title>
        <v-list density="compact">
          <v-list-item
            v-for="p in published"
            :key="p.id"
            :prepend-icon="channelIcons[p.channel]"
            :to="{ name: 'spilltea-post', params: { id: p.postId } }"
            :title="excerpt(p)"
            :subtitle="`${channelLabels[p.channel]} · ${formatDateTime(p.publishedAt ?? p.scheduledAt)}`"
            lines="two"
          />
        </v-list>
      </v-card>
    </v-col>

    <v-col cols="12" lg="8">
      <div class="d-flex align-center mb-2">
        <div class="text-subtitle-1">
          Заплановано: {{ queue.length }}
          <span v-if="failedCount" class="text-error">· з помилкою: {{ failedCount }}</span>
        </div>
        <v-spacer />
        <v-btn icon="mdi-refresh" variant="text" title="Оновити" :loading="loading" @click="load" />
      </div>

      <v-progress-linear v-if="loading && !queue.length" indeterminate class="mb-4" />

      <template v-for="group in days" :key="group.day">
        <div class="text-overline mt-4 mb-1">{{ formatDay(group.day) }}</div>
        <v-card border flat>
          <v-list lines="three">
            <template v-for="(slot, i) in group.slots" :key="slot[0]!.id">
              <v-divider v-if="i" />
              <v-list-item :to="{ name: 'spilltea-post', params: { id: slot[0]!.postId } }">
                <template #prepend>
                  <div class="text-h6 mr-4" style="min-width: 56px">
                    {{ formatTime(slot[0]!.scheduledAt) }}
                  </div>
                </template>
                <v-list-item-title class="d-flex flex-wrap align-center ga-2 mb-1">
                  <v-chip
                    v-if="slot[0]!.post.category"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                  >
                    {{ categoryName(slot[0]!.post.category) }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">#{{ slot[0]!.postId }}</span>
                </v-list-item-title>
                <v-list-item-subtitle>{{ excerpt(slot[0]!) }}</v-list-item-subtitle>
                <div class="mt-2">
                  <div
                    v-for="p in slot"
                    :key="p.id"
                    class="d-flex flex-wrap align-center ga-2"
                    @click.prevent.stop
                  >
                    <v-chip
                      size="small"
                      variant="tonal"
                      :color="statusColors[p.status]"
                      :prepend-icon="channelIcons[p.channel]"
                    >
                      {{ channelLabels[p.channel] }} · {{ statusLabels[p.status] }}
                    </v-chip>
                    <span v-if="p.threads && p.threads.parts.length > 1" class="text-caption">
                      {{ p.threads.parts.length }} частин
                    </span>
                    <span v-if="p.error" class="text-caption text-error">{{ p.error }}</span>
                    <PublicationActions :publication="p" @changed="load" @error="error = $event" />
                  </div>
                </div>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </template>

      <v-empty-state
        v-if="!loading && !queue.length"
        icon="mdi-calendar-blank-outline"
        title="Черга порожня"
        text="Відкрийте SpillTea і натисніть «Опублікувати» на пості"
      />
    </v-col>
  </v-row>
</template>

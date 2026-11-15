<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  publicationsApi,
  type PublicationChannel,
  type PublishAt,
  type ScheduleInfo,
} from '@/api/publications'
import type { SpillTeaPost } from '@/api/spilltea'
import { channelIcons, channelLabels } from '@/utils/publications'
import WhenPicker from './WhenPicker.vue'

const props = defineProps<{ post: SpillTeaPost }>()
const emit = defineEmits<{ done: [] }>()
const open = defineModel<boolean>({ required: true })

const ALL: PublicationChannel[] = ['site', 'threads']

const schedule = ref<ScheduleInfo | null>(null)
const channels = ref<PublicationChannel[]>([])
const at = ref<PublishAt>('queue')
const picker = ref<{ valid: boolean } | null>(null)
const saving = ref(false)
const error = ref('')

/** Канали, куди пост уже додано */
const taken = computed(() => new Set(props.post.publications.map((p) => p.channel)))
const available = computed(() => ALL.filter((c) => !taken.value.has(c)))
const hasEnglish = computed(() => props.post.translations.some((t) => t.lang === 'en'))

watch(
  open,
  async (value) => {
    if (!value) return
    error.value = ''
    channels.value = [...available.value]
    try {
      schedule.value = await publicationsApi.schedule()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не вдалося завантажити розклад'
    }
  },
  { immediate: true },
)

async function submit() {
  saving.value = true
  error.value = ''
  try {
    await publicationsApi.publish(props.post.id, channels.value, at.value)
    emit('done')
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося запланувати'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="520">
    <v-card title="Опублікувати">
      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />
        <v-alert
          v-if="!hasEnglish"
          type="warning"
          variant="tonal"
          class="mb-4"
          text="У поста немає англійської версії — публікувати нічого"
        />
        <v-alert
          v-if="schedule && !schedule.publisherEnabled"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
          text="Публікатор на сервері вимкнено (PUBLISHER_ENABLED) — заплановане не опублікується"
        />

        <div class="text-subtitle-2 mb-1">Куди</div>
        <v-checkbox
          v-for="channel in ALL"
          :key="channel"
          v-model="channels"
          :value="channel"
          :disabled="taken.has(channel)"
          :prepend-icon="channelIcons[channel]"
          :hint="
            taken.has(channel)
              ? 'Уже заплановано або опубліковано'
              : channel === 'threads' && schedule && !schedule.threadsEnabled
                ? 'Немає токена Threads — публікація завершиться помилкою'
                : channel === 'threads'
                  ? 'Довгий текст розіб’ється на ланцюжок; частини можна змінити після планування'
                  : undefined
          "
          :persistent-hint="taken.has(channel) || channel === 'threads'"
          :label="channelLabels[channel]"
          density="comfortable"
        />

        <div class="text-subtitle-2 mt-4 mb-1">Коли</div>
        <WhenPicker ref="picker" v-model="at" allow-queue :next-slot="schedule?.nextSlots[0]" />
        <div class="text-caption text-medium-emphasis">
          Публікується англійська версія. Усі обрані канали отримують один час.
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Скасувати</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!channels.length || !hasEnglish || !picker?.valid"
          @click="submit"
        >
          {{ at === 'now' ? 'Опублікувати' : 'Запланувати' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

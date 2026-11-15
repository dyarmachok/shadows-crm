<script setup lang="ts">
import { computed, ref } from 'vue'

import type { SpillTeaPost } from '@/api/spilltea'
import { formatDateTime } from '@/utils/date'
import { channelIcons, channelLabels, statusColors, statusLabels } from '@/utils/publications'
import PublicationActions from './PublicationActions.vue'
import PublishDialog from './PublishDialog.vue'

const props = defineProps<{ post: SpillTeaPost }>()
const emit = defineEmits<{ changed: [] }>()

const publishOpen = ref(false)
const error = ref('')

const canAdd = computed(() => props.post.publications.length < 2)

function changed() {
  error.value = ''
  emit('changed')
}
</script>

<template>
  <v-card border flat>
    <v-card-item>
      <v-card-title class="text-subtitle-1">Публікація</v-card-title>
      <template #append>
        <v-btn
          v-if="canAdd"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-send-clock-outline"
          @click="publishOpen = true"
        >
          Опублікувати
        </v-btn>
      </template>
    </v-card-item>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mx-4 mb-2"
      :text="error"
      closable
      @click:close="error = ''"
    />

    <v-list v-if="post.publications.length" density="compact">
      <v-list-item
        v-for="p in post.publications"
        :key="p.id"
        :prepend-icon="channelIcons[p.channel]"
      >
        <v-list-item-title class="d-flex align-center ga-2">
          {{ channelLabels[p.channel] }}
          <v-chip size="x-small" variant="tonal" :color="statusColors[p.status]">
            {{ statusLabels[p.status] }}
          </v-chip>
        </v-list-item-title>
        <v-list-item-subtitle>
          <template v-if="p.status === 'published' && p.publishedAt">
            {{ formatDateTime(p.publishedAt) }}
          </template>
          <template v-else>{{ formatDateTime(p.scheduledAt) }}</template>
          <template v-if="p.threads && p.threads.parts.length > 1">
            · {{ p.threads.parts.length }} частин
          </template>
        </v-list-item-subtitle>
        <div v-if="p.error" class="text-caption text-error mt-1">{{ p.error }}</div>
        <template #append>
          <PublicationActions :publication="p" @changed="changed" @error="error = $event" />
        </template>
      </v-list-item>
    </v-list>
    <v-card-text v-else class="text-medium-emphasis pt-0">
      Ще не заплановано ні на сайт, ні в Threads
    </v-card-text>

    <PublishDialog v-model="publishOpen" :post="post" @done="changed" />
  </v-card>
</template>

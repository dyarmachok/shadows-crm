<script setup lang="ts">
import type { PostImage } from '@/api/posts'
import { formatDateTime } from '@/utils/date'

defineProps<{
  label: string
  date: string
  note: string
  category?: string
  image?: PostImage | null
  /** Якщо частин більше однієї, показуються вони замість note */
  parts?: string[]
  publishedParts?: number
}>()
</script>

<template>
  <v-card class="d-flex flex-column h-100" border flat>
    <v-img
      v-if="image?.uri"
      :src="image.uri"
      :aspect-ratio="image.width && image.height ? image.width / image.height : undefined"
      max-height="320"
      cover
    />

    <v-card-item>
      <template v-if="category" #prepend>
        <v-chip size="small" color="primary" variant="tonal">{{ category }}</v-chip>
      </template>
      <template #append>
        <span class="text-caption text-medium-emphasis">
          {{ label }} · {{ formatDateTime(date) }}
        </span>
      </template>
    </v-card-item>

    <v-card-text v-if="parts && parts.length > 1" class="flex-grow-1">
      <div v-for="(part, i) in parts" :key="i" class="part">
        <div class="d-flex align-center ga-1 text-caption text-medium-emphasis mb-1">
          Частина {{ i + 1 }}/{{ parts.length }}
          <v-icon
            v-if="publishedParts && i < publishedParts"
            icon="mdi-check"
            color="success"
            size="small"
            title="Опубліковано"
          />
        </div>
        <div class="note">{{ part }}</div>
      </div>
    </v-card-text>
    <v-card-text v-else class="note flex-grow-1">{{ note }}</v-card-text>

    <v-card-actions v-if="$slots.actions" class="flex-wrap ga-3 px-4">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.note {
  white-space: pre-wrap;
}

.part + .part {
  margin-top: 12px;
  padding-top: 12px;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>

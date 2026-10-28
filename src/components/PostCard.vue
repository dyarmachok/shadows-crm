<script setup lang="ts">
import type { PostImage } from '@/api/posts'

defineProps<{
  label: string
  date: string
  note: string
  category?: string
  image?: PostImage | null
}>()

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' })
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
          {{ label }} · {{ dateFormat.format(new Date(date)) }}
        </span>
      </template>
    </v-card-item>

    <v-card-text class="note flex-grow-1">{{ note }}</v-card-text>

    <v-card-actions v-if="$slots.actions" class="flex-wrap ga-3 px-4">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.note {
  white-space: pre-wrap;
}
</style>

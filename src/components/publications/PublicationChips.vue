<script setup lang="ts">
import type { Publication } from '@/api/publications'
import { channelIcons, channelLabels, publicationSummary, statusColors } from '@/utils/publications'

defineProps<{ publications: Publication[] }>()
</script>

<template>
  <v-chip
    v-for="p in publications"
    :key="p.id"
    size="small"
    variant="tonal"
    :color="statusColors[p.status]"
    :prepend-icon="channelIcons[p.channel]"
    :title="p.error ? `${publicationSummary(p)}\n${p.error}` : publicationSummary(p)"
  >
    {{ channelLabels[p.channel] }}
    <v-icon v-if="p.status === 'published'" icon="mdi-check" size="small" end />
    <v-icon v-else-if="p.status === 'failed'" icon="mdi-alert-circle-outline" size="small" end />
    <v-icon v-else icon="mdi-clock-outline" size="small" end />
  </v-chip>
</template>

<script setup lang="ts">
import type { PostStatus } from '@/api/posts'
import { postStatusMeta } from '@/utils/postStatus'

defineProps<{ status: PostStatus }>()
</script>

<template>
  <v-chip
    size="small"
    variant="tonal"
    :color="postStatusMeta[status].color"
    :prepend-icon="postStatusMeta[status].icon"
  >
    {{ postStatusMeta[status].title }}
  </v-chip>
</template>

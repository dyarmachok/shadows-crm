<script setup lang="ts">
import { ref } from 'vue'

import { publicationsApi, type Publication } from '@/api/publications'
import RescheduleDialog from './RescheduleDialog.vue'
import ThreadsPartsDialog from './ThreadsPartsDialog.vue'

const props = defineProps<{ publication: Publication }>()
const emit = defineEmits<{ changed: []; error: [message: string] }>()

const rescheduleOpen = ref(false)
const partsOpen = ref(false)
const busy = ref(false)

async function run(action: () => Promise<unknown>) {
  busy.value = true
  try {
    await action()
    emit('changed')
  } catch (e) {
    emit('error', e instanceof Error ? e.message : 'Помилка')
  } finally {
    busy.value = false
  }
}

function remove() {
  const p = props.publication
  const question =
    p.status === 'published' ? 'Зняти пост із сайту?' : 'Скасувати заплановану публікацію?'
  if (confirm(question)) run(() => publicationsApi.remove(p.id))
}

/** Повторити після помилки: у той самий час або одразу, якщо він минув */
const retry = () => run(() => publicationsApi.update(props.publication.id, {}))

/** Опублікувати одразу, не чекаючи запланованого часу */
function publishNow() {
  const p = props.publication
  const where = p.channel === 'threads' ? 'у Threads' : 'на сайті'
  if (confirm(`Опублікувати ${where} зараз?`)) {
    run(() => publicationsApi.update(p.id, { at: 'now' }))
  }
}

const canEdit = () => ['scheduled', 'failed'].includes(props.publication.status)
const canRemove = () =>
  canEdit()
    ? !(props.publication.threads?.publishedParts ?? 0)
    : props.publication.status === 'published' && props.publication.channel === 'site'
</script>

<template>
  <div class="d-flex flex-wrap ga-1">
    <v-btn
      v-if="publication.threads?.permalink"
      :href="publication.threads.permalink"
      target="_blank"
      icon="mdi-open-in-new"
      size="small"
      variant="text"
      title="Відкрити в Threads"
    />
    <v-btn
      v-if="publication.status === 'failed'"
      icon="mdi-refresh"
      size="small"
      variant="text"
      title="Повторити"
      :loading="busy"
      @click="retry"
    />
    <v-btn
      v-if="canEdit()"
      icon="mdi-send"
      size="small"
      variant="text"
      color="primary"
      title="Опублікувати зараз"
      :loading="busy"
      @click="publishNow"
    />
    <v-btn
      v-if="canEdit()"
      icon="mdi-calendar-edit-outline"
      size="small"
      variant="text"
      title="Перепланувати"
      @click="rescheduleOpen = true"
    />
    <v-btn
      v-if="canEdit() && publication.channel === 'threads'"
      icon="mdi-format-list-numbered"
      size="small"
      variant="text"
      :title="`Частини ланцюжка (${publication.threads?.parts.length ?? 0})`"
      @click="partsOpen = true"
    />
    <v-btn
      v-if="canRemove()"
      :icon="publication.status === 'published' ? 'mdi-web-remove' : 'mdi-close'"
      size="small"
      variant="text"
      :title="publication.status === 'published' ? 'Зняти з сайту' : 'Скасувати'"
      :loading="busy"
      @click="remove"
    />

    <RescheduleDialog v-model="rescheduleOpen" :publication="publication" @done="emit('changed')" />
    <ThreadsPartsDialog
      v-if="publication.channel === 'threads'"
      v-model="partsOpen"
      :publication="publication"
      @done="emit('changed')"
    />
  </div>
</template>

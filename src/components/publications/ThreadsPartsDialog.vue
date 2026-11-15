<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  publicationsApi,
  THREADS_TEXT_LIMIT,
  threadsLength,
  type Publication,
} from '@/api/publications'

const props = defineProps<{ publication: Publication }>()
const emit = defineEmits<{ done: [] }>()
const open = defineModel<boolean>({ required: true })

const parts = ref<string[]>([])
const saving = ref(false)
const error = ref('')

/** Уже опубліковані частини змінювати не можна */
const locked = computed(() => props.publication.threads?.publishedParts ?? 0)
const valid = computed(
  () =>
    parts.value.length > 0 &&
    parts.value.every((p) => p.trim() && threadsLength(p) <= THREADS_TEXT_LIMIT),
)

watch(
  open,
  (value) => {
    if (!value) return
    parts.value = [...(props.publication.threads?.parts ?? [])]
    error.value = ''
  },
  { immediate: true },
)

async function submit() {
  saving.value = true
  error.value = ''
  try {
    await publicationsApi.update(props.publication.id, {
      threadsParts: parts.value.map((p) => p.trim()),
    })
    emit('done')
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося зберегти'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="720" scrollable>
    <v-card title="Ланцюжок Threads">
      <v-card-subtitle>
        Перша частина — пост, решта — відповіді під ним. До {{ THREADS_TEXT_LIMIT }} символів кожна.
      </v-card-subtitle>
      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />
        <div v-for="(_, i) in parts" :key="i" class="d-flex ga-2 align-start">
          <v-textarea
            v-model="parts[i]"
            :label="`Частина ${i + 1}`"
            :disabled="i < locked"
            :hint="i < locked ? 'Уже опубліковано' : undefined"
            :persistent-hint="i < locked"
            :counter="THREADS_TEXT_LIMIT"
            :counter-value="threadsLength"
            :rules="[(v: string) => threadsLength(v) <= THREADS_TEXT_LIMIT || 'Задовго']"
            auto-grow
            rows="2"
            density="comfortable"
          />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            title="Видалити частину"
            :disabled="i < locked || parts.length === 1"
            @click="parts.splice(i, 1)"
          />
        </div>
        <v-btn variant="text" prepend-icon="mdi-plus" @click="parts.push('')">Додати частину</v-btn>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Скасувати</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" :disabled="!valid" @click="submit">
          Зберегти
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { PublishAt } from '@/api/publications'
import { formatDateTime, today } from '@/utils/date'

const props = defineProps<{
  /** Найближчий вільний слот черги */
  nextSlot?: string
  /** Показати варіант «Наступний слот» */
  allowQueue?: boolean
}>()
const model = defineModel<PublishAt>({ required: true })

type Mode = 'queue' | 'now' | 'custom'
const mode = ref<Mode>(props.allowQueue ? 'queue' : 'custom')
const date = ref(today())
const time = ref('10:00')

/** Локальні дата й час браузера → ISO */
const customIso = computed(() => {
  const d = new Date(`${date.value}T${time.value}`)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
})
const inPast = computed(() => !!customIso.value && new Date(customIso.value).getTime() < Date.now())

watch(
  [mode, customIso],
  () => {
    model.value = mode.value === 'custom' ? customIso.value : mode.value
  },
  { immediate: true },
)

defineExpose({
  valid: computed(() => mode.value !== 'custom' || (!!customIso.value && !inPast.value)),
})
</script>

<template>
  <v-radio-group v-model="mode" hide-details class="mb-2">
    <v-radio v-if="allowQueue" value="queue">
      <template #label>
        <span>
          Наступний вільний слот
          <span v-if="nextSlot" class="text-medium-emphasis">· {{ formatDateTime(nextSlot) }}</span>
          <span v-else class="text-error">· немає часів у розкладі</span>
        </span>
      </template>
    </v-radio>
    <v-radio value="custom" label="Обрати день і час" />
    <v-radio value="now" label="Зараз" />
  </v-radio-group>

  <div v-if="mode === 'custom'" class="d-flex flex-wrap ga-3">
    <v-text-field
      v-model="date"
      type="date"
      label="День"
      :min="today()"
      density="comfortable"
      style="max-width: 200px"
    />
    <v-text-field
      v-model="time"
      type="time"
      label="Година"
      density="comfortable"
      style="max-width: 160px"
      :error-messages="inPast ? 'Цей час уже минув' : undefined"
    />
  </div>
</template>

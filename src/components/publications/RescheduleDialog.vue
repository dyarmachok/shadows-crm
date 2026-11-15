<script setup lang="ts">
import { ref, watch } from 'vue'

import { publicationsApi, type Publication, type PublishAt } from '@/api/publications'
import { channelLabels } from '@/utils/publications'
import WhenPicker from './WhenPicker.vue'

const props = defineProps<{ publication: Publication }>()
const emit = defineEmits<{ done: [] }>()
const open = defineModel<boolean>({ required: true })

const nextSlot = ref<string>()
const at = ref<PublishAt>('queue')
const picker = ref<{ valid: boolean } | null>(null)
const saving = ref(false)
const error = ref('')

watch(
  open,
  async (value) => {
    if (!value) return
    error.value = ''
    nextSlot.value = (await publicationsApi.schedule().catch(() => null))?.nextSlots[0]
  },
  { immediate: true },
)

async function submit() {
  saving.value = true
  error.value = ''
  try {
    await publicationsApi.update(props.publication.id, { at: at.value })
    emit('done')
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося перепланувати'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="480">
    <v-card :title="`Перепланувати: ${channelLabels[publication.channel]}`">
      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />
        <WhenPicker ref="picker" v-model="at" allow-queue :next-slot="nextSlot" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Скасувати</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!picker?.valid"
          @click="submit"
        >
          Зберегти
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

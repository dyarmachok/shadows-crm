<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { categoriesApi, type Category } from '@/api/categories'
import type { Language } from '@/api/spilltea'
import CategoryDialog from '@/components/CategoryDialog.vue'
import { useQueryParam } from '@/composables/useListQuery'
import { formatDateTime } from '@/utils/date'
import { CRM_LANGUAGE, languageOrder } from '@/utils/languages'

const categories = ref<Category[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const reviewedParam = useQueryParam('reviewed')

const editing = ref<Category | null>(null)
const dialogOpen = ref(false)
const snackbar = reactive({ show: false, text: '' })

const reviewedItems = [
  { title: 'Неперевірені', value: 'false' },
  { title: 'Перевірені', value: 'true' },
]

const otherLanguages = languageOrder.filter((l) => l !== CRM_LANGUAGE)

const headers = [
  { title: 'Українська', key: 'uk', sortable: true },
  ...otherLanguages.map((l) => ({ title: l.toUpperCase(), key: l, sortable: true })),
  { title: 'Постів', key: 'postCount', sortable: true, align: 'end' as const },
  { title: 'Статус', key: 'reviewedAt', sortable: true },
]

const reviewedCount = computed(() => categories.value.filter((c) => c.reviewedAt).length)

const rows = computed(() =>
  categories.value
    .filter((c) => {
      if (reviewedParam.value === 'true' && !c.reviewedAt) return false
      if (reviewedParam.value === 'false' && c.reviewedAt) return false
      return true
    })
    .map((c) => ({
      ...c,
      // назви окремими полями — для колонок, пошуку й сортування таблиці
      ...(Object.fromEntries(
        languageOrder.map((l) => [l, c.translations[l]?.name ?? '—']),
      ) as Record<Language, string>),
    }))
    .sort((a, b) => a.uk.localeCompare(b.uk, 'uk')),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    categories.value = await categoriesApi.list()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити категорії'
  } finally {
    loading.value = false
  }
}

function edit(id: number) {
  editing.value = categories.value.find((c) => c.id === id) ?? null
  dialogOpen.value = !!editing.value
}

function onSaved(updated: Category) {
  categories.value = categories.value.map((c) => (c.id === updated.id ? updated : c))
  Object.assign(snackbar, {
    show: true,
    text: `Збережено: ${updated.translations[CRM_LANGUAGE]?.name ?? updated.id}`,
  })
}

onMounted(load)
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-4 mb-4">
    <v-text-field
      v-model="search"
      label="Пошук"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      density="comfortable"
      style="max-width: 320px"
    />
    <v-select
      v-model="reviewedParam"
      :items="reviewedItems"
      label="Перевірка"
      clearable
      hide-details
      density="comfortable"
      style="max-width: 240px"
    />
    <v-spacer />
    <span v-if="categories.length" class="text-body-2 text-medium-emphasis">
      Перевірено {{ reviewedCount }} з {{ categories.length }}
    </span>
  </div>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

  <v-card border flat>
    <v-data-table
      :headers="headers"
      :items="rows"
      :search="search ?? ''"
      :loading="loading"
      :items-per-page="-1"
      hide-default-footer
      hover
      density="comfortable"
      @click:row="(_: Event, { item }: { item: { id: number } }) => edit(item.id)"
    >
      <template #[`item.uk`]="{ item }">
        <span class="font-weight-medium">{{ item.uk }}</span>
        <div class="text-caption text-medium-emphasis">
          {{ item.translations[CRM_LANGUAGE]?.slug }}
        </div>
      </template>
      <template #[`item.reviewedAt`]="{ item }">
        <v-chip
          v-if="item.reviewedAt"
          size="small"
          color="success"
          variant="tonal"
          prepend-icon="mdi-check"
          :title="formatDateTime(item.reviewedAt)"
        >
          Перевірено
        </v-chip>
        <v-chip v-else size="small" variant="outlined">Машинний переклад</v-chip>
      </template>
    </v-data-table>
  </v-card>

  <CategoryDialog v-if="editing" v-model="dialogOpen" :category="editing" @saved="onSaved" />

  <v-snackbar v-model="snackbar.show" color="success" timeout="3000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import type { Paginated } from '@/api/http'
import { usersApi, type AdminUser, type TeaPlusFilter, type UserRole } from '@/api/users'
import { useListQuery, useQueryParam } from '@/composables/useListQuery'
import { formatDateTime } from '@/utils/date'

const LIMIT = 50

const { page } = useListQuery()
const teaPlusParam = useQueryParam('teaPlus')
const roleParam = useQueryParam('role')
const qParam = useQueryParam('q')

const data = ref<Paginated<AdminUser> | null>(null)
const loading = ref(false)
const error = ref('')

const teaPlusItems: { title: string; value: TeaPlusFilter }[] = [
  { title: 'Tea+ діє', value: 'active' },
  { title: 'Tea+ закінчився', value: 'expired' },
  { title: 'Купували хоч раз', value: 'purchased' },
  { title: 'Не купували', value: 'never' },
]
const roleItems: { title: string; value: UserRole }[] = [
  { title: 'Користувачі', value: 'user' },
  { title: 'Адміни', value: 'admin' },
]

// Пошук застосовується з невеликою затримкою, щоб не смикати API на кожну літеру
const search = ref(qParam.value ?? '')
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    qParam.value = value.trim() || null
  }, 400)
})

const headers = [
  { title: 'ID', key: 'id', sortable: false, width: 70 },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Tea+', key: 'teaPlus', sortable: false },
  { title: 'Оплати', key: 'payments', sortable: false },
  { title: 'Реєстрація', key: 'createdAt', sortable: false },
]

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })

/** Скільки днів лишилось до кінця Tea+ */
const daysLeft = (until: string) => Math.ceil((new Date(until).getTime() - Date.now()) / 86_400_000)

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await usersApi.list({
      page: page.value,
      limit: LIMIT,
      teaPlus: (teaPlusParam.value as TeaPlusFilter | null) ?? undefined,
      role: (roleParam.value as UserRole | null) ?? undefined,
      q: qParam.value ?? undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося завантажити користувачів'
  } finally {
    loading.value = false
  }
}

watch(() => [page.value, teaPlusParam.value, roleParam.value, qParam.value], load, { immediate: true })
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-4 mb-4">
    <v-text-field
      v-model="search"
      label="Пошук за email"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      density="comfortable"
      style="max-width: 320px"
      @click:clear="search = ''"
    />
    <v-select
      v-model="teaPlusParam"
      :items="teaPlusItems"
      label="Tea+"
      clearable
      hide-details
      density="comfortable"
      style="max-width: 240px"
    />
    <v-select
      v-model="roleParam"
      :items="roleItems"
      label="Роль"
      clearable
      hide-details
      density="comfortable"
      style="max-width: 200px"
    />
    <v-spacer />
    <span v-if="data" class="text-body-2 text-medium-emphasis">Всього: {{ data.total }}</span>
  </div>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

  <v-card border flat>
    <v-data-table
      :headers="headers"
      :items="data?.items ?? []"
      :loading="loading"
      :items-per-page="-1"
      hide-default-footer
      no-data-text="Нікого не знайдено"
      loading-text="Завантаження…"
    >
      <template #[`item.email`]="{ item }">
        <div class="d-flex align-center ga-2">
          {{ item.email }}
          <v-chip v-if="item.role === 'admin'" size="x-small" color="primary" variant="tonal">admin</v-chip>
        </div>
        <div class="text-caption text-medium-emphasis">{{ item.username }}</div>
      </template>

      <template #[`item.teaPlus`]="{ item }">
        <template v-if="item.teaPlus && item.teaPlusUntil">
          <v-chip size="small" color="success" variant="tonal" prepend-icon="mdi-check-circle-outline">
            до {{ formatDate(item.teaPlusUntil) }}
          </v-chip>
          <div class="text-caption text-medium-emphasis">ще {{ daysLeft(item.teaPlusUntil) }} дн.</div>
        </template>
        <v-chip v-else-if="item.teaPlusUntil" size="small" color="warning" variant="tonal" prepend-icon="mdi-clock-alert-outline">
          закінчився {{ formatDate(item.teaPlusUntil) }}
        </v-chip>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #[`item.payments`]="{ item }">
        <template v-if="item.payments.count">
          <div class="d-flex align-center ga-2">
            {{ item.payments.count }}
            <v-chip v-if="!item.payments.hasLive" size="x-small" variant="outlined" title="Лише тестові оплати (sandbox)">sandbox</v-chip>
          </div>
          <div v-if="item.payments.lastPaidAt" class="text-caption text-medium-emphasis">
            остання {{ formatDateTime(item.payments.lastPaidAt) }}
          </div>
        </template>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #[`item.createdAt`]="{ item }">
        {{ formatDateTime(item.createdAt) }}
      </template>
    </v-data-table>
  </v-card>

  <v-pagination
    v-if="data && data.totalPages > 1"
    v-model="page"
    :length="data.totalPages"
    :total-visible="7"
    :disabled="loading"
    class="mt-4"
  />
</template>

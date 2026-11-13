<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import {
  categoriesApi,
  type Category,
  type CategoryUpdate,
  type LocalizedName,
} from '@/api/categories'
import type { Language } from '@/api/spilltea'
import { languageLabels, languageOrder } from '@/utils/languages'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const props = defineProps<{ category: Category }>()
const emit = defineEmits<{ saved: [category: Category] }>()
const open = defineModel<boolean>({ required: true })

const form = reactive<Record<Language, LocalizedName>>(
  Object.fromEntries(languageOrder.map((l) => [l, { name: '', slug: '' }])) as Record<
    Language,
    LocalizedName
  >,
)
const reviewed = ref(false)
const saving = ref(false)
const slugifying = reactive(new Set<Language>())
const error = ref('')

const rules = {
  name: (v: string) => !!v.trim() || 'Обовʼязкове поле',
  slug: (v: string) => SLUG_PATTERN.test(v) || 'Лише a-z, 0-9 і дефіси між словами',
}

function reset() {
  for (const lang of languageOrder) {
    form[lang].name = props.category.translations[lang]?.name ?? ''
    form[lang].slug = props.category.translations[lang]?.slug ?? ''
  }
  reviewed.value = !!props.category.reviewedAt
  error.value = ''
}

watch(open, (value) => value && reset(), { immediate: true })

/** Лише змінені мови й поля */
const changes = computed(() => {
  const translations: CategoryUpdate['translations'] = {}
  for (const lang of languageOrder) {
    const before = props.category.translations[lang]
    const name = form[lang].name.trim()
    const slug = form[lang].slug.trim()
    const diff: Partial<LocalizedName> = {}
    if (name !== (before?.name ?? '')) diff.name = name
    if (slug !== (before?.slug ?? '')) diff.slug = slug
    if (Object.keys(diff).length) translations[lang] = diff
  }
  return translations
})

const reviewedChanged = computed(() => reviewed.value !== !!props.category.reviewedAt)
const dirty = computed(() => Object.keys(changes.value).length > 0 || reviewedChanged.value)
const valid = computed(() =>
  languageOrder.every(
    (l) => rules.name(form[l].name) === true && rules.slug(form[l].slug) === true,
  ),
)

async function generateSlug(lang: Language) {
  if (!form[lang].name.trim()) return
  slugifying.add(lang)
  try {
    form[lang].slug = (await categoriesApi.slugify(form[lang].name, lang)).slug
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося згенерувати slug'
  } finally {
    slugifying.delete(lang)
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const body: CategoryUpdate = {}
    if (Object.keys(changes.value).length) body.translations = changes.value
    if (reviewedChanged.value) body.reviewed = reviewed.value
    emit('saved', await categoriesApi.update(props.category.id, body))
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося зберегти'
  } finally {
    saving.value = false
  }
}

async function saveAsReviewed() {
  reviewed.value = true
  await save()
}
</script>

<template>
  <v-dialog v-model="open" max-width="760" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        {{ form.uk.name || category.translations.en?.name }}
        <span class="text-caption text-medium-emphasis">#{{ category.id }}</span>
      </v-card-title>
      <v-card-subtitle> Зміна slug змінює адресу сторінки категорії на сайті </v-card-subtitle>

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

        <v-row v-for="lang in languageOrder" :key="lang" dense>
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="form[lang].name"
              :label="languageLabels[lang]"
              :rules="[rules.name]"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="7">
            <v-text-field
              v-model="form[lang].slug"
              label="Slug"
              :prefix="`/${lang}/c/`"
              :rules="[rules.slug]"
              density="comfortable"
            >
              <template #append-inner>
                <v-btn
                  icon="mdi-auto-fix"
                  size="small"
                  variant="text"
                  title="Згенерувати з назви"
                  :loading="slugifying.has(lang)"
                  @click="generateSlug(lang)"
                />
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <v-checkbox
          v-model="reviewed"
          label="Перевірено: назви й slug-и всіма мовами коректні"
          hide-details
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Скасувати</v-btn>
        <v-btn
          v-if="!category.reviewedAt && !reviewed"
          variant="tonal"
          color="success"
          prepend-icon="mdi-check"
          :disabled="!valid"
          :loading="saving"
          @click="saveAsReviewed"
        >
          Зберегти й позначити
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!dirty || !valid"
          :loading="saving"
          @click="save"
        >
          Зберегти
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const required = (v: string) => !!v || 'Обовʼязкове поле'
const emailRule = (v: string) => /.+@.+\..+/.test(v) || 'Невірний email'

async function onSubmit(event: Promise<{ valid: boolean }>) {
  if (!(await event).valid) return

  loading.value = true
  error.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не вдалося увійти'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-main>
    <v-container class="fill-height" fluid>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="pa-4" elevation="4">
            <v-card-title class="text-h5 text-center">Shadows CRM</v-card-title>
            <v-card-subtitle class="text-center">Вхід до системи</v-card-subtitle>

            <v-card-text>
              <v-form @submit.prevent="onSubmit">
                <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="mb-4"
                  :text="error"
                />

                <v-text-field
                  v-model="email"
                  label="Email"
                  type="email"
                  autocomplete="username"
                  prepend-inner-icon="mdi-email-outline"
                  :rules="[required, emailRule]"
                  class="mb-2"
                />

                <v-text-field
                  v-model="password"
                  label="Пароль"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :rules="[required]"
                  class="mb-4"
                  @click:append-inner="showPassword = !showPassword"
                />

                <v-btn type="submit" color="primary" size="large" block :loading="loading">
                  Увійти
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

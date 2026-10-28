import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { authApi, type LoginPayload, type User } from '@/api/auth'
import { tokenStorage } from '@/api/http'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(tokenStorage.get())
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(payload: LoginPayload) {
    const res = await authApi.login(payload)
    tokenStorage.set(res.token)
    token.value = res.token
    user.value = res.user
  }

  async function fetchMe() {
    try {
      user.value = await authApi.me()
    } catch {
      logout()
    }
  }

  function logout() {
    tokenStorage.clear()
    token.value = null
    user.value = null
  }

  return { token, user, isAuthenticated, login, fetchMe, logout }
})

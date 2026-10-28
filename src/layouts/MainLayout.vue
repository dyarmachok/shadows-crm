<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const drawer = ref(true)

const menu = [
  // exact: інакше порожній дочірній шлях '' вважається активним на будь-якій сторінці layout
  {
    title: 'Дашборд',
    icon: 'mdi-view-dashboard-outline',
    to: { name: 'dashboard' },
    exact: true,
  },
  { title: 'Sources', icon: 'mdi-database-outline', to: { name: 'sources' } },
  { title: 'Shadows', icon: 'mdi-text-box-check-outline', to: { name: 'shadows' } },
  { title: 'Розклад', icon: 'mdi-calendar-clock', to: { name: 'schedule' } },
]

function logout() {
  auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <v-navigation-drawer v-model="drawer">
    <v-list-item title="Shadows CRM" class="py-4" />
    <v-divider />
    <v-list nav>
      <v-list-item
        v-for="item in menu"
        :key="item.title"
        :to="item.to"
        :exact="item.exact"
        :prepend-icon="item.icon"
        :title="item.title"
      />
    </v-list>
  </v-navigation-drawer>

  <v-app-bar flat border>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-app-bar-title>{{ $route.meta.title }}</v-app-bar-title>
    <template #append>
      <span class="text-body-2 mr-4">{{ auth.user?.email }}</span>
      <v-btn icon="mdi-logout" title="Вийти" @click="logout" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container fluid>
      <RouterView />
    </v-container>
  </v-main>
</template>

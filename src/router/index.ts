import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: 'Дашборд' },
        },
        {
          path: 'sources',
          name: 'sources',
          component: () => import('../views/SourcesView.vue'),
          meta: { title: 'Sources' },
        },
        {
          path: 'shadows',
          name: 'shadows',
          component: () => import('../views/ShadowsView.vue'),
          meta: { title: 'Shadows' },
        },
        {
          path: 'shadows/:id',
          name: 'shadow',
          component: () => import('../views/ShadowPostView.vue'),
          props: true,
          meta: { title: 'Shadow' },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    return auth.isAuthenticated ? { name: 'dashboard' } : true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (!auth.user) {
    await auth.fetchMe()
    if (!auth.isAuthenticated) return { name: 'login' }
  }
})

export default router

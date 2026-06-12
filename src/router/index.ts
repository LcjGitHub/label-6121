import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'convert',
      component: () => import('@/views/ConvertView.vue'),
      meta: { title: '页码换算' },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { title: '对照记录' },
    },
    {
      path: '/mapping',
      name: 'mapping',
      component: () => import('@/views/MappingView.vue'),
      meta: { title: '卷册完整映射表' },
    },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · 古籍页码对照器` : '古籍页码对照器'
})

export default router

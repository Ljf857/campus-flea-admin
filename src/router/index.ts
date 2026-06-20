import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '@/utils/storage'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/default/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '仪表盘', icon: 'dashboard', affix: true } },
      { path: 'user', name: 'User', component: () => import('@/views/user/index.vue'), meta: { title: '用户管理', icon: 'user' } },
      { path: 'user/verify', name: 'UserVerify', component: () => import('@/views/user/verify.vue'), meta: { title: '实名审核', icon: 'user', hidden: true } },
      { path: 'goods', name: 'Goods', component: () => import('@/views/goods/index.vue'), meta: { title: '商品管理', icon: 'goods' } },
      { path: 'goods/audit', name: 'GoodsAudit', component: () => import('@/views/goods/audit.vue'), meta: { title: '商品审核', icon: 'goods', hidden: true } },
      { path: 'order', name: 'Order', component: () => import('@/views/order/index.vue'), meta: { title: '订单管理', icon: 'order' } },
      { path: 'category', name: 'Category', component: () => import('@/views/category/index.vue'), meta: { title: '分类管理', icon: 'category' } },
      { path: 'banner', name: 'Banner', component: () => import('@/views/banner/index.vue'), meta: { title: '轮播图管理', icon: 'banner' } },
      { path: 'notice', name: 'Notice', component: () => import('@/views/notice/index.vue'), meta: { title: '公告管理', icon: 'notice' } },
      { path: 'report', name: 'Report', component: () => import('@/views/report/index.vue'), meta: { title: '举报管理', icon: 'report' } },
      { path: 'evaluation', name: 'Evaluation', component: () => import('@/views/evaluation/index.vue'), meta: { title: '评价管理', icon: 'evaluation' } },
      { path: 'manager', name: 'Manager', component: () => import('@/views/manager/index.vue'), meta: { title: '管理员管理', icon: 'manager' } },
      { path: 'log', name: 'Log', component: () => import('@/views/log/index.vue'), meta: { title: '操作日志', icon: 'log' } },
      { path: 'apm', name: 'Apm', component: () => import('@/views/apm/index.vue'), meta: { title: '性能监控', icon: 'apm' } },
      { path: 'setting', name: 'Setting', component: () => import('@/views/setting/index.vue'), meta: { title: '系统设置', icon: 'setting' } },
      { path: 'file', name: 'File', component: () => import('@/views/file/index.vue'), meta: { title: '文件管理', icon: 'file' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to, _from, next) => {
  const token = getToken()
  if (to.meta.requiresAuth !== false && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && token) {
    next({ path: '/dashboard' })
  } else {
    document.title = `${(to.meta.title as string) || ''} - 校园跳蚤管理后台`
    next()
  }
})

export default router

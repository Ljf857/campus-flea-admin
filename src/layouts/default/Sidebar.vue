<script setup lang="ts">
/**
 * 左侧导航栏 —— 240px（折叠 64px）
 *
 * 刻意不用 el-menu：需要「分组标题 + 左侧指示条 + 深色底」这套层级，
 * 用 Tailwind 直接写更可控，也避免和 Element Plus 的菜单样式反复角力。
 * 路由与菜单项和重构前完全一致（含 hidden 子页），仅调整了呈现分组。
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'
import {
  Activity,
  LayoutDashboard,
  Package,
  Tags,
  Image,
  Bell,
  Star,
  ListOrdered,
  Flag,
  Users,
  ShieldCheck,
  ScrollText,
  Settings,
  Folder,
  ChevronDown,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import BrandMark from '@/components/BrandMark/index.vue'

interface MenuItem {
  path: string
  title: string
  icon: Component
  children?: { path: string; title: string }[]
}

interface MenuSection {
  label: string
  items: MenuItem[]
}

const route = useRoute()
const appStore = useAppStore()

const sections: MenuSection[] = [
  {
    label: '概览',
    items: [{ path: '/dashboard', title: '仪表盘', icon: LayoutDashboard }],
  },
  {
    label: '运营',
    items: [
      {
        path: '/goods',
        title: '商品管理',
        icon: Package,
        children: [
          { path: '/goods', title: '商品列表' },
          { path: '/goods/audit', title: '商品审核' },
        ],
      },
      { path: '/category', title: '分类管理', icon: Tags },
      { path: '/banner', title: '轮播图管理', icon: Image },
      { path: '/notice', title: '公告管理', icon: Bell },
      { path: '/evaluation', title: '评价管理', icon: Star },
    ],
  },
  {
    label: '交易',
    items: [
      { path: '/order', title: '订单管理', icon: ListOrdered },
      { path: '/report', title: '举报管理', icon: Flag },
    ],
  },
  {
    label: '用户',
    items: [
      {
        path: '/user',
        title: '用户管理',
        icon: Users,
        children: [
          { path: '/user', title: '用户列表' },
          { path: '/user/verify', title: '实名审核' },
        ],
      },
    ],
  },
  {
    label: '系统',
    items: [
      { path: '/manager', title: '管理员管理', icon: ShieldCheck },
      { path: '/log', title: '操作日志', icon: ScrollText },
      { path: '/apm', title: '性能监控', icon: Activity },
      { path: '/file', title: '文件管理', icon: Folder },
      { path: '/setting', title: '系统设置', icon: Settings },
    ],
  },
]

// 移动端抽屉内始终展开，仅桌面端跟随折叠状态
const isCollapse = computed(() => !appStore.isMobile && appStore.sidebarCollapsed)

/** 当前展开的父级菜单（默认展开命中子路由的那一组） */
const openGroups = ref<string[]>([])

watch(
  () => route.path,
  (path) => {
    const hit = sections.flatMap((s) => s.items).find(
      (i) => i.children && i.children.some((c) => c.path === path),
    )
    if (hit && !openGroups.value.includes(hit.path)) {
      openGroups.value = [...openGroups.value, hit.path]
    }
  },
  { immediate: true },
)

function toggleGroup(path: string): void {
  openGroups.value = openGroups.value.includes(path)
    ? openGroups.value.filter((p) => p !== path)
    : [...openGroups.value, path]
}

function isGroupOpen(path: string): boolean {
  return openGroups.value.includes(path)
}

/** 子路由命中时，父项也要高亮 */
function isItemActive(item: MenuItem): boolean {
  if (route.path === item.path) return true
  return Boolean(item.children?.some((c) => c.path === route.path))
}

/** 折叠状态下点击分组：先展开侧栏，再打开该组，否则子项无处可点 */
function handleCollapsedGroup(item: MenuItem): void {
  appStore.toggleSidebar()
  if (!openGroups.value.includes(item.path)) toggleGroup(item.path)
}
</script>

<template>
  <nav
    class="on-dark flex h-full flex-col bg-sidebar text-sidebar-fg"
    aria-label="主导航"
  >
    <!-- 品牌区 -->
    <div
      class="flex h-header shrink-0 items-center border-b border-white/8"
      :class="isCollapse ? 'justify-center px-0' : 'gap-2.5 px-4'"
    >
      <BrandMark size="sm" />
      <span v-if="!isCollapse" class="min-w-0">
        <span class="block truncate text-sm font-semibold text-white">校园跳蚤</span>
        <span class="block truncate text-2xs text-white/45">管理后台</span>
      </span>
    </div>

    <!-- 菜单 -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
      <div v-for="section in sections" :key="section.label" class="mb-1">
        <p
          v-if="!isCollapse"
          class="px-2.5 pb-1.5 pt-3 text-[11px] font-semibold tracking-wider text-white/35"
        >
          {{ section.label }}
        </p>
        <div v-else class="mx-2 my-2 border-t border-white/8" aria-hidden="true"></div>

        <ul class="flex flex-col gap-0.5">
          <li v-for="item in section.items" :key="item.path">
            <!-- 可折叠分组 -->
            <template v-if="item.children && !isCollapse">
              <button
                type="button"
                class="group flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150 hover:bg-white/6 hover:text-white"
                :class="isItemActive(item) ? 'text-white' : ''"
                :aria-expanded="isGroupOpen(item.path)"
                @click="toggleGroup(item.path)"
              >
                <component :is="item.icon" :size="18" class="shrink-0" aria-hidden="true" />
                <span class="flex-1 truncate text-left">{{ item.title }}</span>
                <ChevronDown
                  :size="14"
                  class="shrink-0 text-white/40 transition-transform duration-150"
                  :class="isGroupOpen(item.path) ? 'rotate-180' : ''"
                  aria-hidden="true"
                />
              </button>
              <ul v-show="isGroupOpen(item.path)" class="mt-0.5 flex flex-col gap-0.5">
                <li v-for="child in item.children" :key="child.path">
                  <router-link
                    :to="child.path"
                    class="relative flex h-8 items-center rounded-md pl-9 pr-2.5 text-sm transition-colors duration-150"
                    :class="
                      route.path === child.path
                        ? 'bg-brand/16 text-white'
                        : 'text-sidebar-fg hover:bg-white/6 hover:text-white'
                    "
                    :aria-current="route.path === child.path ? 'page' : undefined"
                  >
                    <span
                      class="absolute left-4 h-1 w-1 rounded-full transition-colors duration-150"
                      :class="route.path === child.path ? 'bg-brand' : 'bg-white/25'"
                      aria-hidden="true"
                    ></span>
                    <span class="truncate">{{ child.title }}</span>
                  </router-link>
                </li>
              </ul>
            </template>

            <!-- 折叠态下的分组：点击即展开侧栏 -->
            <el-tooltip
              v-else-if="item.children && isCollapse"
              :content="item.title"
              placement="right"
              :offset="10"
            >
              <button
                type="button"
                class="flex h-9 w-full items-center justify-center rounded-md transition-colors duration-150 hover:bg-white/6 hover:text-white"
                :class="isItemActive(item) ? 'bg-brand/16 text-white' : ''"
                :aria-label="item.title"
                @click="handleCollapsedGroup(item)"
              >
                <component :is="item.icon" :size="18" aria-hidden="true" />
              </button>
            </el-tooltip>

            <!-- 普通项 -->
            <el-tooltip
              v-else-if="isCollapse"
              :content="item.title"
              placement="right"
              :offset="10"
            >
              <router-link
                :to="item.path"
                class="flex h-9 items-center justify-center rounded-md transition-colors duration-150 hover:bg-white/6 hover:text-white"
                :class="
                  isItemActive(item)
                    ? 'bg-brand/16 text-white'
                    : 'text-sidebar-fg'
                "
                :aria-label="item.title"
                :aria-current="isItemActive(item) ? 'page' : undefined"
              >
                <component :is="item.icon" :size="18" aria-hidden="true" />
              </router-link>
            </el-tooltip>

            <router-link
              v-else
              :to="item.path"
              class="relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150"
              :class="
                isItemActive(item)
                  ? 'bg-brand/16 text-white'
                  : 'text-sidebar-fg hover:bg-white/6 hover:text-white'
              "
              :aria-current="isItemActive(item) ? 'page' : undefined"
            >
              <span
                v-if="isItemActive(item)"
                class="absolute left-0 h-4 w-0.5 rounded-full bg-brand"
                aria-hidden="true"
              ></span>
              <component :is="item.icon" :size="18" class="shrink-0" aria-hidden="true" />
              <span class="truncate">{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

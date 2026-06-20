<script setup lang="ts">
/**
 * 后台主框架
 * 结构：左侧栏 240px（折叠 64px） + 右侧（顶部导航 60px + 主内容）
 * 主内容统一 max-width 1200px 居中；<768px 时侧栏收进抽屉。
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const route = useRoute()
const appStore = useAppStore()

const asideWidth = computed(() =>
  appStore.sidebarCollapsed
    ? 'var(--spacing-sidebar-collapsed)'
    : 'var(--spacing-sidebar)',
)

// 移动端抽屉：跳转后自动关闭
watch(
  () => route.fullPath,
  () => appStore.closeMobileSidebar(),
)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-page">
    <!-- 左侧栏（桌面端） -->
    <aside
      v-if="!appStore.isMobile"
      class="shrink-0 overflow-hidden border-r border-line transition-[width] duration-200 ease-out"
      :style="{ width: asideWidth }"
    >
      <Sidebar />
    </aside>

    <!-- 右侧主区 -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="h-header shrink-0 border-b border-line bg-surface">
        <Header />
      </header>

      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto w-full max-w-content px-4 py-5 md:px-6 md:py-6">
          <router-view v-slot="{ Component }">
            <transition
              enter-active-class="transition-[opacity,transform] duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              leave-active-class="transition-opacity duration-100 ease-in"
              leave-to-class="opacity-0"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- 移动端抽屉 -->
    <el-drawer
      v-model="appStore.mobileSidebarOpen"
      direction="ltr"
      size="240px"
      :with-header="false"
      append-to-body
      class="layout-mobile-drawer"
    >
      <Sidebar />
    </el-drawer>
  </div>
</template>

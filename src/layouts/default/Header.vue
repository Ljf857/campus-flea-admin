<script setup lang="ts">
/**
 * 顶部导航：折叠开关 + 面包屑 + 主题切换 + 用户菜单
 * 功能与重构前一致（个人资料改昵称/头像、退出登录），仅重做视觉与层级。
 */
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Sun,
  Moon,
  Monitor,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import request from '@/api/index'
import ImageUpload from '@/components/ImageUpload/index.vue'
import { resolveImageUrl } from '@/utils/image'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

const profileDialog = ref(false)
const profileForm = ref({ realName: '', avatar: '' })

const pageTitle = computed(() => (route.meta.title as string) || '')
const userName = computed(() => userStore.userInfo?.nickname || '管理员')

/** 用查表而不是 find()：find 的返回值是可空的，查表能保证任意 mode 都有对应项 */
const THEME_OPTIONS = {
  light: { label: '明亮模式', icon: Sun },
  dark: { label: '深色模式', icon: Moon },
  system: { label: '跟随系统', icon: Monitor },
} as const

const themeOptions = (Object.keys(THEME_OPTIONS) as Array<keyof typeof THEME_OPTIONS>).map(
  (mode) => ({ mode, ...THEME_OPTIONS[mode] }),
)

const currentTheme = computed(() => THEME_OPTIONS[appStore.themeMode])

function handleThemeChange(mode: 'light' | 'dark' | 'system'): void {
  appStore.setTheme(mode)
}

function openProfile(): void {
  profileForm.value = {
    realName: userStore.userInfo?.nickname || '',
    avatar: userStore.userInfo?.avatar || '',
  }
  profileDialog.value = true
}

async function saveProfile(): Promise<void> {
  await request.put('/admin/managers/profile', {
    realName: profileForm.value.realName,
    avatar: profileForm.value.avatar,
  })
  userStore.patchUserInfo({
    nickname: profileForm.value.realName,
    avatar: profileForm.value.avatar,
  })
  ElMessage.success('保存成功')
  profileDialog.value = false
}

async function handleLogout(): Promise<void> {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  userStore.clearAuth()
  ElMessage.success('已退出')
  router.replace('/login')
}
</script>

<template>
  <div class="flex h-full items-center justify-between gap-4 px-3 md:px-5">
    <!-- 左：折叠开关 + 面包屑 -->
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-hover hover:text-ink"
        :aria-label="
          appStore.isMobile
            ? '打开导航菜单'
            : appStore.sidebarCollapsed
              ? '展开侧边栏'
              : '收起侧边栏'
        "
        @click="appStore.toggleSidebar()"
      >
        <Menu v-if="appStore.isMobile" :size="18" aria-hidden="true" />
        <PanelLeftOpen
          v-else-if="appStore.sidebarCollapsed"
          :size="18"
          aria-hidden="true"
        />
        <PanelLeftClose v-else :size="18" aria-hidden="true" />
      </button>

      <nav class="flex min-w-0 items-center gap-2 text-sm" aria-label="面包屑">
        <span class="hidden shrink-0 text-muted sm:inline">首页</span>
        <span class="hidden shrink-0 text-line-strong sm:inline" aria-hidden="true">/</span>
        <span class="truncate font-medium text-ink">{{ pageTitle }}</span>
      </nav>
    </div>

    <!-- 右：主题 + 用户 -->
    <div class="flex shrink-0 items-center gap-1 md:gap-2">
      <el-dropdown trigger="click" @command="handleThemeChange">
        <button
          type="button"
          class="flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted transition-colors duration-150 hover:bg-hover hover:text-ink"
          aria-label="切换主题"
        >
          <component :is="currentTheme.icon" :size="16" aria-hidden="true" />
          <span class="hidden lg:inline">{{ currentTheme.label }}</span>
          <ChevronDown :size="13" class="hidden text-line-strong lg:inline" aria-hidden="true" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="opt in themeOptions"
              :key="opt.mode"
              :command="opt.mode"
            >
              <component :is="opt.icon" :size="15" class="mr-2" aria-hidden="true" />
              {{ opt.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <span class="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden="true"></span>

      <el-dropdown trigger="click">
        <button
          type="button"
          class="flex h-9 items-center gap-2 rounded-md pl-1 pr-2 transition-colors duration-150 hover:bg-hover"
          :aria-label="`当前登录：${userName}，打开账户菜单`"
        >
          <el-avatar
            :size="28"
            :src="resolveImageUrl(userStore.userInfo?.avatar)"
            class="shrink-0"
          />
          <span class="hidden max-w-24 truncate text-sm font-medium text-ink md:inline">
            {{ userName }}
          </span>
          <ChevronDown :size="13" class="hidden text-line-strong md:inline" aria-hidden="true" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="openProfile">
              <User :size="15" class="mr-2" aria-hidden="true" /> 个人资料
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <LogOut :size="15" class="mr-2" aria-hidden="true" /> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <el-dialog v-model="profileDialog" title="个人资料" width="480px">
    <el-form label-width="80px">
      <el-form-item label="头像">
        <ImageUpload
          v-model="profileForm.avatar"
          biz-type="avatar"
          tip="建议 1:1 比例，支持 jpg/png，不超过 10MB"
        />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="profileForm.realName" placeholder="请输入姓名" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="profileDialog = false">取消</el-button>
      <el-button type="primary" @click="saveProfile">保存</el-button>
    </template>
  </el-dialog>
</template>

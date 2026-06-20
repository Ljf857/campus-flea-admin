import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** 移动端断点：CSS 的 @media (max-width: 767px) 与 store 保持同一边界 */
export const MOBILE_BREAKPOINT = 768

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const themeMode = ref<'light' | 'dark' | 'system'>(
    (localStorage.getItem('campus_flea_theme') as 'light' | 'dark' | 'system') || 'system',
  )

  /** 设备类型与移动端抽屉状态 */
  const device = ref<'mobile' | 'desktop'>('desktop')
  const mobileSidebarOpen = ref(false)
  const isMobile = computed(() => device.value === 'mobile')

  let mql: MediaQueryList | null = null

  function applyDevice(matches: boolean): void {
    device.value = matches ? 'mobile' : 'desktop'
    // 任何断点变化（旋转/缩放）都关闭抽屉
    mobileSidebarOpen.value = false
  }

  function onDeviceChange(e: MediaQueryListEvent): void {
    applyDevice(e.matches)
  }

  function initDevice(): void {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql = mq
    mq.addEventListener('change', onDeviceChange)
    applyDevice(mq.matches)
  }

  function destroyDevice(): void {
    mql?.removeEventListener('change', onDeviceChange)
    mql = null
  }

  function openMobileSidebar(): void {
    mobileSidebarOpen.value = true
  }

  function closeMobileSidebar(): void {
    mobileSidebarOpen.value = false
  }

  function toggleSidebar(): void {
    if (isMobile.value) {
      mobileSidebarOpen.value = !mobileSidebarOpen.value
      return
    }
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setTheme(mode: 'light' | 'dark' | 'system'): void {
    themeMode.value = mode
    localStorage.setItem('campus_flea_theme', mode)
    applyTheme()
  }

  function applyTheme(): void {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = themeMode.value === 'dark' || (themeMode.value === 'system' && systemDark)
    document.documentElement.classList.toggle('dark', isDark)
  }

  return {
    sidebarCollapsed,
    themeMode,
    device,
    isMobile,
    mobileSidebarOpen,
    toggleSidebar,
    setTheme,
    applyTheme,
    initDevice,
    destroyDevice,
    openMobileSidebar,
    closeMobileSidebar,
  }
})

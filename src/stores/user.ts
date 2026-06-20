import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi } from '@/api/modules/auth'
import {
  setToken,
  setRefreshToken,
  clearTokens,
  getStorage,
  setStorage,
  removeStorage,
} from '@/utils/storage'
import type { AdminInfo, AdminLoginParams, LoginResult } from '@/api/types/admin'

/** 只有登录接口会返回管理员资料，刷新页面时靠这份缓存恢复 */
const USER_INFO_KEY = 'userInfo'

export const useUserStore = defineStore('user', () => {
  /**
   * 只放业务数据（管理员资料）。
   * token 的唯一真源是 localStorage（见 utils/storage.ts）：请求拦截器与路由守卫
   * 直接读写它，登录/刷新/登出都只走 storage，不在 pinia 里放副本，
   * 避免 reactive 副本与磁盘值不同步（旧实现里 refresh 只写盘、没同步 store）。
   */
  const userInfo = ref<AdminInfo | null>(getStorage<AdminInfo>(USER_INFO_KEY))

  async function login(params: AdminLoginParams): Promise<void> {
    const data = (await loginApi(params)) as LoginResult
    setToken(data.accessToken)
    setRefreshToken(data.refreshToken)
    setUserInfo(data.userInfo)
  }

  function setUserInfo(info: AdminInfo): void {
    userInfo.value = info
    setStorage(USER_INFO_KEY, info)
  }

  /** 改资料后同步落盘，否则刷新会回滚成登录时的昵称/头像 */
  function patchUserInfo(patch: Partial<AdminInfo>): void {
    if (userInfo.value) setUserInfo({ ...userInfo.value, ...patch })
  }

  function clearAuth(): void {
    userInfo.value = null
    clearTokens()
    removeStorage(USER_INFO_KEY)
  }

  return { userInfo, login, setUserInfo, patchUserInfo, clearAuth }
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { getToken, getRefreshToken } from '@/utils/storage'
import type { AdminLoginParams } from '@/api/types/admin'

const LOGIN_PARAMS: AdminLoginParams = {
  username: 'admin',
  password: 'Abc123456',
  // 阿里云验证码 2.0：拼图验证通过后由 SDK 透出的验签参数
  captchaVerifyParam: 'encrypted-verify-param',
}

// vi.mock 会被提升到文件顶部，工厂里不能引用外部变量，所以资料写在工厂内
vi.mock('@/api/modules/auth', () => ({
  loginApi: vi.fn().mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 7200,
    userInfo: {
      id: 1,
      phone: 'admin',
      nickname: '管理员甲',
      avatar: 'http://localhost:9000/avatar/a.png',
      verifyStatus: 1,
      verifyStatusDesc: '管理员',
    },
  }),
}))

/** 重建 pinia 等价于刷新页面后 Pinia 从零启动，只带着 localStorage 里的东西 */
function reloadStore() {
  setActivePinia(createPinia())
  return useUserStore()
}

describe('管理员资料跨刷新保留', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('刷新后仍能读到登录时的昵称与头像', async () => {
    const store = reloadStore()
    await store.login(LOGIN_PARAMS)
    expect(store.userInfo?.nickname).toBe('管理员甲')

    const afterReload = reloadStore()
    expect(afterReload.userInfo?.nickname).toBe('管理员甲')
    expect(afterReload.userInfo?.avatar).toBe('http://localhost:9000/avatar/a.png')
    // token 不在 store 里，唯一真源是 localStorage
    expect('accessToken' in afterReload).toBe(false)
    expect(getToken()).toBe('access-token')
    expect(getRefreshToken()).toBe('refresh-token')
  })

  it('改过资料后刷新保留新值', async () => {
    const store = reloadStore()
    await store.login(LOGIN_PARAMS)
    store.patchUserInfo({ nickname: '新名字', avatar: 'http://localhost:9000/avatar/b.png' })

    const afterReload = reloadStore()
    expect(afterReload.userInfo?.nickname).toBe('新名字')
    expect(afterReload.userInfo?.avatar).toBe('http://localhost:9000/avatar/b.png')
  })

  it('退出登录后缓存清空，刷新不会再恢复', async () => {
    const store = reloadStore()
    await store.login(LOGIN_PARAMS)
    store.clearAuth()

    expect(localStorage.getItem('campus_flea_userInfo')).toBeNull()
    expect(getToken()).toBe('')
    expect(getRefreshToken()).toBe('')
    expect(reloadStore().userInfo).toBeNull()
  })

  it('没登录过的新浏览器里 userInfo 为空', () => {
    expect(reloadStore().userInfo).toBeNull()
  })
})

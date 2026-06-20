import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, setToken, getRefreshToken, setRefreshToken, clearTokens } from '@/utils/storage'
import type { Result } from './types/common'

const MAX_RETRIES = 2
const RETRY_DELAY = 1000

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as Result
    if (res.code === 200) {
      response.data = res.data
      return response
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  async (error) => {
    const { response, config } = error

    if (!response) {
      if (!config._retryCount) config._retryCount = 0
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount++
        await new Promise((r) => setTimeout(r, RETRY_DELAY * config._retryCount))
        return instance(config)
      }
    }

    if (response?.status === 401 && !config.url.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            config.headers.Authorization = `Bearer ${token}`
            resolve(instance(config))
          })
        })
      }

      isRefreshing = true
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
          null,
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        )
        const result = data as Result
        if (result.code === 200) {
          const tokenData = result.data as { accessToken: string; refreshToken: string }
          setToken(tokenData.accessToken)
          setRefreshToken(tokenData.refreshToken)
          pendingRequests.forEach((cb) => cb(tokenData.accessToken))
          pendingRequests = []
          config.headers.Authorization = `Bearer ${tokenData.accessToken}`
          return instance(config)
        }
        throw new Error('Refresh failed')
      } catch {
        pendingRequests = []
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    if (response?.status === 403) {
      ElMessage.error('无权限访问')
    } else if (response?.data?.message) {
      ElMessage.error(response.data.message)
    } else {
      ElMessage.error('网络异常')
    }
    return Promise.reject(error)
  },
)

const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get<T>(url, config).then((res) => res.data)
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post<T>(url, data, config).then((res) => res.data)
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put<T>(url, data, config).then((res) => res.data)
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete<T>(url, config).then((res) => res.data)
  },
}

export default request

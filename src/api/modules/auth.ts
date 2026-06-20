import request from '../index'
import type { AdminLoginParams, CaptchaConfig } from '../types/admin'

export function loginApi(data: AdminLoginParams) {
  return request.post('/admin/auth/login', data)
}

/**
 * 获取人机验证配置（阿里云验证码 2.0）
 * 返回 { enabled, sceneId, prefix, region }；enabled=false 时前端不渲染验证码
 */
export function getCaptchaConfigApi() {
  return request.get<CaptchaConfig>('/admin/auth/captcha')
}

export function logoutApi() {
  return request.post('/admin/auth/logout')
}

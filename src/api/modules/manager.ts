import request from '../index'
import type { PageResult } from '../types/common'
import type { AdminManager } from '../types/admin'

export function getManagerListApi(params: { page?: number; size?: number }) {
  return request.get<PageResult<AdminManager>>('/admin/managers', { params })
}

export function addManagerApi(data: Partial<AdminManager> & { password?: string }) {
  return request.post('/admin/managers', data)
}

export function updateManagerApi(id: number, data: Partial<AdminManager>) {
  return request.put(`/admin/managers/${id}`, data)
}

export function deleteManagerApi(id: number) {
  return request.delete(`/admin/managers/${id}`)
}

export function resetPasswordApi(id: number, password: string) {
  return request.put(`/admin/managers/${id}/reset-password`, { password })
}

import request from '../index'
import type { PageResult } from '../types/common'
import type { Notice } from '../types/admin'

export function getNoticeListApi(params: { page?: number; size?: number }) {
  return request.get<PageResult<Notice>>('/admin/notices', { params })
}

export function addNoticeApi(data: Partial<Notice>) {
  return request.post('/admin/notices', data)
}

export function updateNoticeApi(id: number, data: Partial<Notice>) {
  return request.put(`/admin/notices/${id}`, data)
}

export function deleteNoticeApi(id: number) {
  return request.delete(`/admin/notices/${id}`)
}

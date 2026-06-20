import request from '../index'
import type { PageResult } from '../types/common'
import type { UserInfo, UserVerify } from '../types/user'

export function getUserListApi(params: { page?: number; size?: number; keyword?: string; verifyStatus?: number; status?: number }) {
  return request.get<PageResult<UserInfo>>('/admin/users', { params })
}

export function getUserDetailApi(id: number) {
  return request.get<UserInfo>(`/admin/users/${id}`)
}

export function updateUserStatusApi(id: number, status: number) {
  return request.put(`/admin/users/${id}/status`, { status })
}

export function getPendingVerifyApi(params: { page?: number; size?: number }) {
  return request.get<PageResult<UserVerify>>('/admin/users/verify/pending', { params })
}

export function auditVerifyApi(id: number, data: { verifyStatus: number; rejectReason?: string }) {
  return request.put(`/admin/users/${id}/verify`, data)
}

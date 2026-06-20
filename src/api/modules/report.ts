import request from '../index'
import type { PageResult } from '../types/common'
import type { Report } from '../types/goods'

export function getReportListApi(params: { page?: number; size?: number; handleStatus?: number }) {
  return request.get<PageResult<Report>>('/admin/reports', { params })
}

export function handleReportApi(id: number, data: { handleStatus: number; handleResult: string; action?: string }) {
  return request.put(`/admin/reports/${id}`, data)
}

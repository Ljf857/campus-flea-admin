import request from '../index'
import type { PageResult } from '../types/common'
import type { Goods } from '../types/goods'

export function getGoodsListApi(params: { page?: number; size?: number; keyword?: string; status?: number; categoryId?: number }) {
  return request.get<PageResult<Goods>>('/admin/goods', { params })
}

export function getGoodsDetailApi(id: number) {
  return request.get<Goods>(`/admin/goods/${id}`)
}

export function getPendingGoodsApi(params: { page?: number; size?: number }) {
  return request.get<PageResult<Goods>>('/admin/goods/verify/pending', { params })
}

export function auditGoodsApi(id: number, data: { verifyStatus: number; rejectReason?: string }) {
  return request.put(`/admin/goods/${id}/verify`, data)
}

export function offlineGoodsApi(id: number, reason: string) {
  return request.put(`/admin/goods/${id}/offline`, { reason })
}

export function deleteGoodsApi(id: number) {
  return request.delete(`/admin/goods/${id}`)
}

import request from '../index'
import type { PageResult } from '../types/common'
import type { Order } from '../types/order'

export function getOrderListApi(params: { page?: number; size?: number; keyword?: string; status?: number }) {
  return request.get<PageResult<Order>>('/admin/orders', { params })
}

export function getOrderDetailApi(id: number) {
  return request.get<Order>(`/admin/orders/${id}`)
}

import request from '../index'
import type { PageResult } from '../types/common'
import type { Evaluation } from '../types/order'

export function getEvaluationListApi(params: { page?: number; size?: number }) {
  return request.get<PageResult<Evaluation>>('/admin/evaluations', { params })
}

export function deleteEvaluationApi(id: number) {
  return request.delete(`/admin/evaluations/${id}`)
}

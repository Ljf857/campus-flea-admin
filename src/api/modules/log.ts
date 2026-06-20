import request from '../index'
import type { PageResult } from '../types/common'
import type { OperationLog } from '../types/admin'

export function getLogListApi(params: { page?: number; size?: number; module?: string; operator?: string; startTime?: string; endTime?: string }) {
  return request.get<PageResult<OperationLog>>('/admin/logs', { params })
}

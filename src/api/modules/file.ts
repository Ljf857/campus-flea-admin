import request from '../index'
import type { PageResult } from '../types/common'
import type { FileRecord } from '../types/admin'

export function getFileListApi(params: { page?: number; size?: number }) {
  return request.get<PageResult<FileRecord>>('/admin/files', { params })
}

export function deleteFileApi(id: number) {
  return request.delete('/admin/files', { data: { id } })
}

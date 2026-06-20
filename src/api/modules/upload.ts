import request from '../index'

export interface UploadResult {
  url: string
  fileName: string
  size: number
}

export function uploadImageApi(file: File, type?: string) {
  const formData = new FormData()
  formData.append('file', file)
  if (type) formData.append('type', type)
  return request.post<UploadResult>('/upload/image', formData)
}

export function deleteFileByNameApi(fileName: string) {
  return request.delete('/upload', { data: { fileName } })
}

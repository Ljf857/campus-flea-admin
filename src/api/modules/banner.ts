import request from '../index'
import type { Banner } from '../types/admin'

export function getBannerListApi() {
  return request.get<Banner[]>('/admin/banners')
}

export function addBannerApi(data: Partial<Banner>) {
  return request.post('/admin/banners', data)
}

export function updateBannerApi(id: number, data: Partial<Banner>) {
  return request.put(`/admin/banners/${id}`, data)
}

export function deleteBannerApi(id: number) {
  return request.delete(`/admin/banners/${id}`)
}

import request from '../index'
import type { PrimaryCategory, SubCategory } from '../types/goods'

export function getCategoryListApi() {
  return request.get<PrimaryCategory[]>('/admin/categories')
}

export function addCategoryApi(data: Partial<PrimaryCategory>) {
  return request.post('/admin/categories', data)
}

export function updateCategoryApi(id: number, data: Partial<PrimaryCategory>) {
  return request.put(`/admin/categories/${id}`, data)
}

export function deleteCategoryApi(id: number) {
  return request.delete(`/admin/categories/${id}`)
}

export function getSubCategoryListApi(primaryId: number) {
  return request.get<SubCategory[]>('/admin/sub-categories', { params: { primaryId } })
}

export function addSubCategoryApi(data: Partial<SubCategory>) {
  return request.post('/admin/sub-categories', data)
}

export function updateSubCategoryApi(id: number, data: Partial<SubCategory>) {
  return request.put(`/admin/sub-categories/${id}`, data)
}

export function deleteSubCategoryApi(id: number) {
  return request.delete(`/admin/sub-categories/${id}`)
}

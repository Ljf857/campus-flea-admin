import request from '../index'
import type { DashboardData } from '../types/admin'

export function getDashboardApi() {
  return request.get<DashboardData>('/admin/dashboard')
}

import request from '../index'
import type { SysSetting } from '../types/admin'

export function getSettingListApi() {
  return request.get<SysSetting[]>('/admin/settings')
}

export function updateSettingApi(settingKey: string, settingValue: string) {
  return request.put('/admin/settings', { settingKey, settingValue })
}

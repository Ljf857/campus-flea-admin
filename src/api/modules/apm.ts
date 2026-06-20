import request from '../index'
import type { PageParams, PageResult } from '../types/common'
import type {
  ApmApiStat,
  ApmCrashRecord,
  ApmFrameStat,
  ApmNetworkRecord,
  ApmOverview,
  ApmQuery,
  ApmSceneStat,
  ApmStartupRecord,
} from '../types/apm'

/**
 * APM 性能监控接口
 *
 * 对应后端 AdminApmController（/api/admin/apm/**），需管理员角色。
 * baseURL 已是 `/api`，因此这里不再重复前缀。
 */

/** 性能概览：四维摘要 + 最慢接口 Top */
export function getApmOverviewApi(params: ApmQuery & { slowThresholdMs?: number }) {
  return request.get<ApmOverview>('/admin/apm/overview', { params })
}

/** 接口维度统计（含 P50/P90/P99），sort 可选 p99 / avg / max / count */
export function getApmApisApi(params: ApmQuery & { limit?: number; sort?: string }) {
  return request.get<ApmApiStat[]>('/admin/apm/apis', { params })
}

/** 慢请求明细，按耗时倒序 */
export function getApmSlowCallsApi(params: ApmQuery & { minMs?: number; limit?: number }) {
  return request.get<ApmNetworkRecord[]>('/admin/apm/network/slow', { params })
}

/** 崩溃 / ANR 分页列表（不含堆栈） */
export function getApmCrashesApi(params: ApmQuery & PageParams & { type?: string }) {
  return request.get<PageResult<ApmCrashRecord>>('/admin/apm/crashes', { params })
}

/** 崩溃 / ANR 详情（含完整堆栈） */
export function getApmCrashDetailApi(id: number) {
  return request.get<ApmCrashRecord>(`/admin/apm/crashes/${id}`)
}

/** 启动耗时明细，按时间倒序 */
export function getApmStartupsApi(params: ApmQuery & { limit?: number }) {
  return request.get<ApmStartupRecord[]>('/admin/apm/startups', { params })
}

/** 帧率与卡顿聚合 */
export function getApmFramesApi(params: ApmQuery) {
  return request.get<ApmFrameStat>('/admin/apm/frames', { params })
}

/** 场景埋点聚合 */
export function getApmScenesApi(params: ApmQuery & { limit?: number }) {
  return request.get<ApmSceneStat[]>('/admin/apm/scenes', { params })
}

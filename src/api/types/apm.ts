/**
 * APM 性能监控相关类型
 *
 * 字段与后端 com.campus.flea.modules.apm 下的 VO / 实体逐一对齐，
 * 改任意一侧都要同步改另一侧。
 *
 * 注意：后端配置了 `default-property-inclusion: non_null`，
 * 值为 null 的字段会被整个省略而不是返回 null，因此可空字段要按
 * 「可能 undefined」处理，展示时一律走 `?? 兜底值`，不能直接取属性。
 */

/** 通用查询参数 */
export interface ApmQuery {
  /** 应用标识；留空表示统计全部应用 */
  appId?: string
  /** 统计时长（小时） */
  hours?: number
}

/** 网络指标摘要 */
export interface ApmNetworkSummary {
  /** 请求总数 */
  total: number
  /** 失败数（含鉴权失败） */
  failure: number
  /** 其中的鉴权失败数（401/403），已从成功率的分母中排除 */
  authFailure: number
  /**
   * 成功率（百分比）。分母是「可判定请求数」= total - authFailure。
   * 没有可判定请求时后端不返回该字段（见文件头 non_null 说明），展示时须区分「—」与 0%。
   */
  successRate?: number
  avgMs: number
  p50Ms: number
  p90Ms: number
  p99Ms: number
  maxMs: number
  /** 超过慢请求阈值的请求数 */
  slowCalls: number
}

/** 稳定性摘要 */
export interface ApmCrashSummary {
  /** 崩溃与 ANR 总数 */
  total: number
  crashCount: number
  anrCount: number
  /** 发生在前台的数量 —— 前台崩溃对用户是直接可感知的，单列出来 */
  foregroundCount: number
  /** 受影响设备数 */
  deviceCount: number
}

/** 启动指标摘要 */
export interface ApmStartupSummary {
  /** 样本数 */
  samples: number
  /** 最近一次启动耗时（毫秒） */
  lastMs: number
  avgMs: number
  p90Ms: number
  /** 冷启动占比（百分比） */
  coldRatio: number
}

/** 帧率与卡顿聚合 */
export interface ApmFrameStat {
  /** 统计窗口数 */
  windows: number
  deviceCount: number
  /** 帧数加权的平均帧率 */
  avgFps: number
  totalFrames: number
  jankyFrames: number
  frozenFrames: number
  /** 卡顿帧率（百分比） */
  jankRate: number
  /** 冻结帧率（百分比） */
  frozenRate: number
  /** 最差单帧耗时（毫秒） */
  worstFrameMs: number
}

/** 接口维度性能统计 */
export interface ApmApiStat {
  /** 归一化请求路径（数字 ID 段已替换为 {id}） */
  url: string
  method: string
  total: number
  /** 失败数（含鉴权失败） */
  failure: number
  /** 其中的鉴权失败数（401/403），已从成功率的分母中排除 */
  authFailure: number
  /** 成功率（百分比）。分母为 total - authFailure，无可判定请求时不返回该字段 */
  successRate?: number
  avgMs: number
  p50Ms: number
  p90Ms: number
  p99Ms: number
  maxMs: number
}

/** 性能概览 */
export interface ApmOverview {
  appId: string
  hours: number
  /** 统计起始时间 */
  from: string
  /** 统计结束时间 */
  to: string
  /** 上报批次数 */
  reportBatches: number
  /** 覆盖设备数 */
  deviceCount: number
  /** 会话数 */
  sessionCount: number
  network: ApmNetworkSummary
  crash: ApmCrashSummary
  startup: ApmStartupSummary
  frame: ApmFrameStat
  /** 最慢接口 Top */
  topSlowApis: ApmApiStat[]
}

/** 网络请求明细 */
export interface ApmNetworkRecord {
  id: number
  reportId: number
  appId: string
  deviceId: string
  sessionId: string
  appVersion: string
  url: string
  method: string
  /** HTTP 状态码，-1 表示传输层失败 */
  code: number
  durationMs: number
  requestBytes: number
  responseBytes: number
  /** 失败类型（超时 / DNS / 连接等），正常请求为 null */
  errorType?: string | null
  /** 链路标识，可与服务端日志对照 */
  traceId?: string | null
  /** 客户端观测时间戳（毫秒） */
  clientTime: number
  createTime: string
}

/** 崩溃 / ANR 明细 */
export interface ApmCrashRecord {
  id: number
  reportId: number
  appId: string
  deviceId: string
  sessionId: string
  appVersion: string
  osVersion: string
  device: string
  /** crash-崩溃 anr-无响应 */
  type: string
  /** 异常摘要 */
  message: string
  /** 完整堆栈；列表接口不返回，仅详情接口返回 */
  stack?: string | null
  threadName: string
  /** 发生时是否前台：0-后台 1-前台 */
  foreground: number
  clientTime: number
  createTime: string
}

/** 冷启动明细 */
export interface ApmStartupRecord {
  id: number
  reportId: number
  appId: string
  deviceId: string
  sessionId: string
  appVersion: string
  osVersion: string
  device: string
  /** 启动总耗时（毫秒） */
  totalMs: number
  /** 是否冷启动：0-热启动 1-冷启动 */
  cold: number
  /** 阶段耗时，JSON 字符串（形如 {"appInit":300,"firstFrame":512}） */
  stages?: string | null
  clientTime: number
  createTime: string
}

/** 场景埋点聚合 */
export interface ApmSceneStat {
  name: string
  total: number
  avgMs: number
  p90Ms: number
  maxMs: number
}

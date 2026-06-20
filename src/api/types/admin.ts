/** 管理员管理实体（来自 /admin/managers API） */
export interface AdminManager {
  id: number
  username: string
  realName: string
  avatar: string
  role: string
  status: number
  lastLoginTime: string
  lastLoginIp: string
  createTime: string
}

/** 管理员登录参数 */
export interface AdminLoginParams {
  username: string
  password: string
  /**
   * 阿里云验证码 2.0 人机验证参数。
   * 由验证码 JS SDK 在拼图验证通过后透出，必须原样上送，服务端再向阿里云验签。
   * 未启用人机验证时为空字符串。
   */
  captchaVerifyParam: string
}

/** 人机验证配置（来自 /admin/auth/captcha） */
export interface CaptchaConfig {
  /** 是否启用阿里云人机验证 */
  enabled: boolean
  /** 验证码场景 ID，仅在 enabled=true 时下发 */
  sceneId?: string
  /** 身份标 prefix，仅在 enabled=true 时下发 */
  prefix?: string
  /** 实例地域：cn / sgp，仅在 enabled=true 时下发 */
  region?: string
}

/** 登录用户信息（来自后端 LoginVO.UserInfo） */
export interface AdminInfo {
  id: number
  phone: string
  nickname: string
  avatar: string
  verifyStatus: number
  verifyStatusDesc: string
}

/** 登录结果 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  userInfo: AdminInfo
}

/** 轮播图 */
export interface Banner {
  id: number
  title: string
  image: string
  linkType: number
  linkUrl: string
  sort: number
  status: number
  createTime: string
}

/** 公告 */
export interface Notice {
  id: number
  title: string
  content: string
  type: number
  status: number
  publishTime: string
  publisherId: number
  createTime: string
}

/** 操作日志 */
export interface OperationLog {
  id: number
  operatorId: number
  operatorName: string
  module: string
  operation: string
  method: string
  requestUrl: string
  requestParams: string
  responseData: string
  ip: string
  status: number
  errorMsg: string
  costTime: number
  createTime: string
}

/** 系统设置 */
export interface SysSetting {
  id: number
  settingKey: string
  settingValue: string
  settingDesc: string
  settingType: string
}

/** 文件记录 */
export interface FileRecord {
  id: number
  fileName: string
  originalName: string
  fileUrl: string
  fileSize: number
  fileType: string
  bizType: string
  uploaderId: number
  createTime: string
}

/** 仪表盘数据 */
export interface DashboardData {
  userCount: number
  goodsCount: number
  orderCount: number
  todayNewUser: number
  todayNewGoods: number
  todayNewOrder: number
  pendingVerifyUser: number
  pendingVerifyGoods: number
  pendingReport: number
  userTrend: Array<{ date: string; count: number }>
  goodsTrend: Array<{ date: string; count: number }>
  categoryStats: Array<{ name: string; count: number }>
}

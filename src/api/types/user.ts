/** 用户信息 */
export interface UserInfo {
  id: number
  phone: string
  nickname: string
  avatar: string
  gender: number
  signature: string
  campus: string
  verifyStatus: number
  status: number
  registerTime: string
  lastLoginTime: string
  createTime: string
}

/** 用户实名认证 */
export interface UserVerify {
  id: number
  userId: number
  realName: string
  studentNo: string
  idCardFront: string
  idCardBack: string
  verifyStatus: number
  rejectReason: string
  verifyTime: string
  verifierId: number
  createTime: string
}

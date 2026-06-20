/** 商品状态 */
export const GOODS_STATUS: Record<number, { label: string; type: string }> = {
  1: { label: '在售', type: 'success' },
  2: { label: '下架', type: 'info' },
  3: { label: '审核中', type: 'warning' },
  4: { label: '审核未通过', type: 'danger' },
  5: { label: '已售', type: '' },
}

/** 订单状态 */
export const ORDER_STATUS: Record<number, { label: string; type: string }> = {
  1: { label: '待确认', type: 'warning' },
  2: { label: '待交易', type: 'primary' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已取消', type: 'info' },
}

/** 认证状态 */
export const VERIFY_STATUS: Record<number, { label: string; type: string }> = {
  0: { label: '未认证', type: 'info' },
  1: { label: '已认证', type: 'success' },
  2: { label: '审核中', type: 'warning' },
  3: { label: '审核未通过', type: 'danger' },
}

/** 账号状态 */
export const USER_STATUS: Record<number, { label: string; type: string }> = {
  0: { label: '禁用', type: 'danger' },
  1: { label: '正常', type: 'success' },
}

/** 举报处理状态 */
export const REPORT_STATUS: Record<number, { label: string; type: string }> = {
  0: { label: '待处理', type: 'warning' },
  1: { label: '已处理', type: 'success' },
  2: { label: '已忽略', type: 'info' },
}

/** 交易方式 */
export const DELIVERY_TYPE: Record<number, string> = {
  1: '自取',
  2: '邮寄',
  3: '自取/邮寄',
}

/** 公告类型 */
export const NOTICE_TYPE: Record<number, string> = {
  1: '系统公告',
  2: '活动通知',
}

/** 轮播图跳转类型 */
export const BANNER_LINK_TYPE: Record<number, string> = {
  1: '商品',
  2: '分类',
  3: '外链',
  4: '无跳转',
}

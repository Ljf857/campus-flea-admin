/** 商品信息 */
export interface Goods {
  id: number
  title: string
  description: string
  price: number
  originalPrice: number
  coverImage: string
  images: string
  conditionLevel: number
  categoryId: number
  categoryName: string
  sellerId: number
  location: string
  deliveryType: number
  viewCount: number
  favoriteCount: number
  status: number
  rejectReason: string
  publishTime: string
  verifyTime: string
  createTime: string
}

/** 一级分类 */
export interface PrimaryCategory {
  id: number
  name: string
  /** 分类图标：移动端 CategoryIcons.kt 的映射键，或自定义图标图片 URL */
  icon: string
  /** 浅色模式主题色（十六进制） */
  color: string
  /** 深色模式主题色；留空时移动端按 color 自动推导 */
  colorDark?: string
  sort: number
  status: number
  createTime: string
}

/** 二级分类 */
export interface SubCategory {
  id: number
  primaryId: number
  name: string
  icon: string
  /** 浅色模式主题色（十六进制） */
  color: string
  /** 深色模式主题色；留空时移动端按 color 自动推导 */
  colorDark?: string
  sort: number
  status: number
  createTime: string
}

/** 商品举报 */
export interface Report {
  id: number
  reporterId: number
  goodsId: number
  reason: string
  description: string
  evidenceImages: string
  handleStatus: number
  handleResult: string
  handlerId: number
  handleTime: string
  createTime: string
}

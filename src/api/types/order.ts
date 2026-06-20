/** 订单信息 */
export interface Order {
  id: number
  orderNo: string
  goodsId: number
  goodsTitle: string
  goodsPrice: number
  goodsCover: string
  buyerId: number
  sellerId: number
  deliveryType: number
  addressId: number
  addressSnapshot: string
  remark: string
  status: number
  cancelReason: string
  confirmTime: string
  completeTime: string
  cancelTime: string
  createTime: string
}

/** 订单评价 */
export interface Evaluation {
  id: number
  orderId: number
  goodsId: number
  evaluatorId: number
  evaluateeId: number
  rating: number
  content: string
  images: string
  createTime: string
}

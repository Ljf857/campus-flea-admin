/** 统一响应结果 */
export interface Result<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
}

/** 分页响应结果 */
export interface PageResult<T = unknown> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

/** 分页查询参数 */
export interface PageParams {
  page?: number
  size?: number
}

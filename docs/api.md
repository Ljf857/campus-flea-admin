# 校园跳蚤管理后台 - API 接口文档

基地址：`/api`  
响应格式：统一 `Result<T>` 包裹

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... },
  "timestamp": 1718764800000
}
```

分页响应格式 `PageResult<T>`：

```json
{
  "list": [ ... ],
  "total": 100,
  "page": 1,
  "size": 10,
  "totalPages": 10
}
```

错误码：

| 码 | 含义 |
|---|------|
| 200 | 成功 |
| 10001 | 参数错误 |
| 10002 | 资源不存在 |
| 11001 | 用户名或密码错误 |
| 11002 | 验证码错误 |
| 11003 | 账号已被禁用 |
| 11007 | 未登录或登录已过期 |
| 11008 | 无权限访问 |

---

## 一、认证

### 1.1 获取人机验证配置

```
GET /api/admin/auth/captcha
```

**Response `Result<CaptchaVO>`:**

```json
{
  "code": 200,
  "data": {
    "enabled": true,
    "sceneId": "<验证码控制台的场景 ID>",
    "prefix": "<验证码控制台的身份标 prefix>",
    "region": "cn"
  }
}
```

### 1.2 管理员登录

```
POST /api/admin/auth/login
```

**Request body:**

```json
{
  "username": "your-username",
  "password": "your-password",
  "captcha": "A3bF",
  "captchaVerifyParam": "your-captcha-verify-param"
}
```

**Response `Result<LoginVO>`:**

```json
{
  "code": 200,
  "data": {
    "accessToken": "your-access-token",
    "refreshToken": "your-refresh-token",
    "expiresIn": 7200,
    "userInfo": {
      "id": 1,
      "phone": "admin",
      "nickname": "管理员",
      "avatar": "http://...",
      "verifyStatus": 1,
      "verifyStatusDesc": "管理员"
    }
  }
}
```

### 1.3 刷新 Token

```
POST /api/auth/refresh
```

**Header:** `Authorization: Bearer <refreshToken>`

**Response `Result<TokenVO>`:**

```json
{
  "code": 200,
  "data": {
    "accessToken": "your-access-token",
    "refreshToken": "your-refresh-token",
    "expiresIn": 7200
  }
}
```

---

## 二、仪表盘

### 2.1 获取仪表盘数据

```
GET /api/admin/dashboard
```

**Response `Result<DashboardData>`:**

```json
{
  "code": 200,
  "data": {
    "userCount": 1000,
    "goodsCount": 500,
    "orderCount": 300,
    "todayNewUser": 10,
    "todayNewGoods": 5,
    "todayNewOrder": 3,
    "pendingVerifyUser": 2,
    "pendingVerifyGoods": 1,
    "pendingReport": 0,
    "userTrend": [{ "date": "2026-06-01", "count": 10 }],
    "goodsTrend": [{ "date": "2026-06-01", "count": 5 }],
    "categoryStats": [{ "name": "数码", "count": 120 }]
  }
}
```

---

## 三、用户管理

### 3.1 用户列表

```
GET /api/admin/users?page=1&size=10&keyword=&verifyStatus=&status=
```

| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码，默认 1 |
| size | int | 每页条数，默认 10 |
| keyword | string | 手机号/昵称搜索 |
| verifyStatus | int | 认证状态筛选 |
| status | int | 账号状态筛选 |

**Response `Result<PageResult<User>>`:**

### 3.2 用户详情

```
GET /api/admin/users/{id}
```

### 3.3 禁用/启用用户

```
PUT /api/admin/users/{id}/status
```

**Request body:**
```json
{ "status": 0 }
```

### 3.4 待审核实名列表

```
GET /api/admin/users/verify/pending?page=1&size=10
```

### 3.5 审核实名

```
PUT /api/admin/users/{id}/verify
```

**Request body:**
```json
{
  "verifyStatus": 1,
  "rejectReason": "资料不清晰"
}
```

---

## 四、商品管理

### 4.1 商品列表

```
GET /api/admin/goods?page=1&size=10&keyword=&status=&categoryId=
```

### 4.2 商品详情（管理端）

```
GET /api/admin/goods/{id}
```

### 4.3 待审核商品列表

```
GET /api/admin/goods/verify/pending?page=1&size=10
```

### 4.4 审核商品

```
PUT /api/admin/goods/{id}/verify
```

**Request body:**
```json
{ "verifyStatus": 1, "rejectReason": "" }
```

### 4.5 强制下架

```
PUT /api/admin/goods/{id}/offline
```

**Request body:**
```json
{ "reason": "违规商品" }
```

### 4.6 删除商品

```
DELETE /api/admin/goods/{id}
```

---

## 五、订单管理

### 5.1 订单列表

```
GET /api/admin/orders?page=1&size=10&keyword=&status=
```

### 5.2 订单详情

```
GET /api/admin/orders/{id}
```

---

## 六、分类管理

### 6.1 一级分类列表

```
GET /api/admin/categories
```

### 6.2 新增一级分类

```
POST /api/admin/categories
```

### 6.3 修改一级分类

```
PUT /api/admin/categories/{id}
```

### 6.4 删除一级分类

```
DELETE /api/admin/categories/{id}
```

### 6.5 二级分类列表

```
GET /api/admin/sub-categories?primaryId=1
```

### 6.6 新增二级分类

```
POST /api/admin/sub-categories
```

### 6.7 修改二级分类

```
PUT /api/admin/sub-categories/{id}
```

### 6.8 删除二级分类

```
DELETE /api/admin/sub-categories/{id}
```

---

## 七、轮播图管理

### 7.1 轮播图列表

```
GET /api/admin/banners
```

### 7.2 新增轮播图

```
POST /api/admin/banners
```

### 7.3 修改轮播图

```
PUT /api/admin/banners/{id}
```

### 7.4 删除轮播图

```
DELETE /api/admin/banners/{id}
```

---

## 八、公告管理

### 8.1 公告列表

```
GET /api/admin/notices?page=1&size=10
```

### 8.2 新增公告

```
POST /api/admin/notices
```

### 8.3 修改公告

```
PUT /api/admin/notices/{id}
```

### 8.4 删除公告

```
DELETE /api/admin/notices/{id}
```

---

## 九、举报管理

### 9.1 举报列表

```
GET /api/admin/reports?page=1&size=10&handleStatus=
```

### 9.2 处理举报

```
PUT /api/admin/reports/{id}
```

**Request body:**
```json
{
  "handleStatus": 1,
  "handleResult": "已下架商品并警告卖家",
  "action": "offline"
}
```

`action` 可选值：`warn`（警告）、`offline`（下架）、`ban`（封号）

---

## 十、评价管理

### 10.1 评价列表

```
GET /api/admin/evaluations?page=1&size=10
```

### 10.2 删除评价

```
DELETE /api/admin/evaluations/{id}
```

---

## 十一、管理员管理

### 11.1 管理员列表

```
GET /api/admin/managers?page=1&size=10
```

### 11.2 新增管理员

```
POST /api/admin/managers
```

### 11.3 修改管理员

```
PUT /api/admin/managers/{id}
```

### 11.4 删除管理员

```
DELETE /api/admin/managers/{id}
```

### 11.5 重置密码

```
PUT /api/admin/managers/{id}/reset-password
```

**Request body:**
```json
{ "password": "your-password" }
```

### 11.6 修改个人信息

```
PUT /api/admin/managers/profile
```

**Request body:**
```json
{ "realName": "张三", "avatar": "http://..." }
```

---

## 十二、操作日志

### 12.1 日志列表

```
GET /api/admin/logs?page=1&size=10&module=&operator=&startTime=&endTime=
```

---

## 十三、系统设置

### 13.1 设置列表

```
GET /api/admin/settings
```

### 13.2 更新设置

```
PUT /api/admin/settings
```

**Request body:**
```json
{ "settingKey": "app_name", "settingValue": "校园跳蚤" }
```

---

## 十四、文件管理

### 14.1 文件列表

```
GET /api/admin/files?page=1&size=10
```

### 14.2 删除文件

```
DELETE /api/admin/files
```

**Request body:**
```json
{ "id": 1 }
```

---

## 十五、文件上传

### 15.1 单图上传

```
POST /api/upload/image
```

**Request:** `multipart/form-data`

| 字段 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 (jpg/png/webp/gif ≤ 10MB) |
| type | string | 业务类型（可选） |

**Response `Result<UploadVO>`:**

```json
{
  "code": 200,
  "data": {
    "url": "http://minio:9000/campus-flea/images/xxx.jpg",
    "fileName": "images/xxx.jpg",
    "size": 102400
  }
}
```

### 15.2 批量上传

```
POST /api/upload/images
```

**Request:** `multipart/form-data`，字段 `files`（多文件）、`type`

### 15.3 删除上传文件

```
DELETE /api/upload
```

**Request body:**
```json
{ "fileName": "images/xxx.jpg" }
```

---

## 数据模型

### User

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| phone | String | 手机号 |
| nickname | String | 昵称 |
| avatar | String | 头像URL |
| gender | Integer | 性别 |
| signature | String | 个性签名 |
| campus | String | 学校 |
| verifyStatus | Integer | 认证状态：0-未认证 1-已认证 2-审核中 3-未通过 |
| status | Integer | 账号状态：0-禁用 1-正常 |
| registerTime | LocalDateTime | 注册时间 |
| lastLoginTime | LocalDateTime | 最后登录时间 |

### Goods

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| title | String | 商品标题 |
| price | BigDecimal | 价格 |
| originalPrice | BigDecimal | 原价 |
| coverImage | String | 封面图 |
| images | String | 多图（逗号分隔） |
| categoryId | Long | 分类ID |
| sellerId | Long | 卖家ID |
| status | Integer | 商品状态 |
| deliveryType | Integer | 交易方式 |
| viewCount | Integer | 浏览量 |
| rejectReason | String | 驳回原因 |

### Orders

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| orderNo | String | 订单号 |
| goodsId | Long | 商品ID |
| goodsTitle | String | 商品标题 |
| goodsPrice | BigDecimal | 商品价格 |
| goodsCover | String | 商品封面 |
| buyerId | Long | 买家ID |
| sellerId | Long | 卖家ID |
| status | Integer | 订单状态：1-待确认 2-待交易 3-已完成 4-已取消 |
| deliveryType | Integer | 交易方式 |
| cancelReason | String | 取消原因 |

### Evaluation

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| orderId | Long | 订单ID |
| goodsId | Long | 商品ID |
| evaluatorId | Long | 评价人ID |
| rating | Integer | 评分 (1-5) |
| content | String | 评价内容 |
| images | String | 评价图片 |

### Report

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| reporterId | Long | 举报人ID |
| goodsId | Long | 被举报商品ID |
| reason | String | 举报原因 |
| handleStatus | Integer | 处理状态：0-待处理 1-已处理 2-已忽略 |
| handleResult | String | 处理结果 |
| action | String | 联动操作 |

### Admin

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| username | String | 用户名 |
| realName | String | 真实姓名 |
| avatar | String | 头像URL |
| role | String | 角色 |
| status | Integer | 状态 |

### Banner

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| title | String | 标题 |
| image | String | 图片URL |
| linkType | Integer | 跳转类型 |
| linkUrl | String | 跳转链接 |
| sort | Integer | 排序 |
| status | Integer | 状态 |

### Notice

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| title | String | 标题 |
| content | String | 内容 |
| type | Integer | 类型：1-系统公告 2-活动通知 |
| status | Integer | 状态 |
| publishTime | LocalDateTime | 发布时间 |
| publisherId | Long | 发布人ID |

### SysSetting

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| settingKey | String | 配置键 |
| settingValue | String | 配置值 |
| settingDesc | String | 描述 |
| settingType | String | 类型 |

### FileRecord

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| fileName | String | 文件名 |
| originalName | String | 原始文件名 |
| fileUrl | String | 访问URL |
| fileSize | Long | 文件大小 |
| fileType | String | 文件类型 |
| bizType | String | 业务类型 |
| uploaderId | Long | 上传人ID |
| createTime | LocalDateTime | 上传时间 |

### OperationLog

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| operatorId | Long | 操作人ID |
| operatorName | String | 操作人名称 |
| module | String | 操作模块 |
| operation | String | 操作描述 |
| method | String | 请求方法 |
| requestUrl | String | 请求URL |
| ip | String | IP地址 |
| status | Integer | 状态 |
| costTime | Long | 耗时(ms) |
| errorMsg | String | 错误信息 |
| createTime | LocalDateTime | 操作时间 |

---

## 安全说明

- 认证方式：Bearer JWT（双Token机制）
- AccessToken 有效期：2 小时（默认）
- RefreshToken 有效期：7 天（默认）
- 管理员 Token 中包含角色 `ROLE_ADMIN` 或 `ROLE_SUPER_ADMIN`
- 所有 `/api/admin/**` 接口需具有管理员角色
- 阿里云验证码 2.0 的一次验证周期只能用于一次登录尝试；登录失败后前端会自动重新初始化验证码

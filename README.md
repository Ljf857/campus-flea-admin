# 校园跳蚤 · 管理后台（campus-flea-admin）

校园二手交易平台的管理端，为「校园跳蚤」平台提供用户、商品、订单、内容与系统配置的全流程后台管理能力。

> 本项目为德州职业技术学院专科毕业设计配套代码，仅供学习交流。

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 登录认证 | 账号密码登录，接入**阿里云验证码 2.0（拼图验证）**做人机校验；AccessToken / RefreshToken 自动续期 |
| 仪表盘 | 平台核心指标概览、趋势图表、待办事项统计 |
| 用户管理 | 用户列表与详情、禁用 / 启用、实名认证审核 |
| 商品管理 | 商品列表与详情、发布审核、强制下架、删除 |
| 订单管理 | 订单列表与详情查询 |
| 分类管理 | 一 / 二级分类的增删改查 |
| 轮播图管理 | 首页轮播图维护 |
| 公告管理 | 平台公告发布与维护 |
| 举报管理 | 用户举报列表与处理 |
| 评价管理 | 商品评价查询与删除 |
| 管理员管理 | 管理员账号增删改查、重置密码、个人信息维护 |
| 操作日志 | 后台操作审计日志 |
| 系统设置 | 平台参数配置 |
| 文件管理 | 上传文件列表与清理 |
| 性能监控 | 接口 APM 指标可视化 |

## 技术栈

- **框架**：Vue 3.5（Composition API）+ TypeScript + Vite 8
- **状态管理**：Pinia 3
- **路由**：Vue Router 5（含登录守卫与动态权限）
- **UI 组件**：Element Plus、TDesign Vue Next
- **样式**：Tailwind CSS 4 + Sass，支持亮 / 暗色主题切换
- **图表**：ECharts 6 + vue-echarts
- **网络**：axios（统一封装、请求 / 响应拦截、自动刷新 Token）
- **代码质量**：ESLint + oxlint + Prettier
- **单元测试**：Vitest + @vue/test-utils

## 目录结构

```
campus-flea-admin/
├─ src/
│  ├─ api/                # 接口封装
│  │  ├─ index.ts         # axios 实例、拦截器、Token 自动刷新
│  │  ├─ modules/         # 按业务域拆分的接口（auth/user/goods/order/...）
│  │  └─ types/           # 接口请求 / 响应类型定义
│  ├─ components/         # 通用业务组件（图表卡片、图片上传、图标选择器、响应式表格等）
│  ├─ constants/          # 常量与图标映射
│  ├─ layouts/default/    # 后台整体布局（侧边栏 / 顶栏）
│  ├─ router/             # 路由表与导航守卫
│  ├─ stores/             # Pinia 状态（用户信息、应用主题等）
│  ├─ styles/             # 设计令牌、主题与全局样式
│  ├─ utils/              # 工具方法（storage、阿里云验证码、图表主题等）
│  └─ views/              # 各业务页面，与功能模块一一对应
├─ docs/api.md            # 管理端接口文档
├─ nginx/nginx.conf       # 生产环境 Nginx 配置（含 API / WebSocket / MinIO 反向代理）
├─ Dockerfile             # 多阶段构建（Node 构建 → Nginx 托管）
└─ .env / .env.production # 环境变量
```

## 环境要求

- Node.js `^22.18.0 || >=24.12.0`
- npm（或 pnpm / yarn）
- 已启动的后端服务（默认通过 `/api` 代理）

## 快速开始

```sh
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建，产物在 dist/
npm run build

# 仅构建，跳过类型检查
npm run build:no-typecheck

# 本地预览构建产物
npm run preview

# 单元测试
npm run test:unit

# 代码检查与格式化
npm run lint
npm run format
```

## 环境变量

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 后端接口前缀 | `/api` |
| `VITE_MINIO_URL` | 对象存储访问前缀 | `http://localhost:9000`（开发）/ `/minio`（生产） |

开发环境将 `/api`、`/minio` 代理到本地后端与 MinIO；生产环境由 Nginx 反向代理。

## Docker 部署

```sh
# 构建镜像
docker build -t campus-flea-admin .

# 启动容器
docker run -d -p 80:80 --name campus-flea-admin campus-flea-admin
```

`nginx/nginx.conf` 中 `/api` 与 `/ws` 分别代理到 `backend:8080`，`/minio` 代理到 `minio:9000`，
因此该容器需与后端、MinIO 处于同一 Docker 网络（参见部署编排文件）。

## 接口文档

管理端全部接口的定义、请求参数与响应示例见 [`docs/api.md`](docs/api.md)。

## 说明

- 登录依赖的阿里云验证码配置（场景 ID、前缀、地域）由后端下发，前端按配置动态加载
  `AliyunCaptcha.js`，无需在前端硬编码密钥。
- 管理端的全部接口均要求管理员角色，登录态异常时拦截器会自动尝试静默刷新 Token，
  刷新失败则跳回登录页。

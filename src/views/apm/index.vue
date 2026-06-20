<script setup lang="ts">
/**
 * 性能监控
 *
 * 数据链路：端上 APM 采集 → POST /api/apm/report → 服务端聚合 → 本页读取。
 * 这一页全是读操作，没有任何写入口。
 *
 * 为什么分 Tab 而不是把七组数据平铺：一次并发打七个接口既慢又浪费，
 * 而使用者多数时候只关心其中一块。因此切换 Tab 时才按需加载，
 * 已加载过的不会重复请求；换筛选条件或点「刷新数据」会强制重取。
 * 指标卡依赖的概览数据始终加载，因为它是全页的摘要，切换 Tab 时不该消失。
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Timer, CircleCheck, Hourglass, Bug, RefreshCw, AlertCircle } from 'lucide-vue-next'
import {
  getApmOverviewApi,
  getApmApisApi,
  getApmSlowCallsApi,
  getApmCrashesApi,
  getApmCrashDetailApi,
  getApmStartupsApi,
  getApmFramesApi,
  getApmScenesApi,
} from '@/api/modules/apm'
import type {
  ApmOverview,
  ApmApiStat,
  ApmNetworkRecord,
  ApmCrashRecord,
  ApmStartupRecord,
  ApmFrameStat,
  ApmSceneStat,
} from '@/api/types/apm'
import { useAppStore } from '@/stores/app'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import ChartCard from '@/components/ChartCard/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const appStore = useAppStore()

/** 统计时长选项。后端上限 90 天，这里给到 30 天足够覆盖毕业设计的观察周期 */
const RANGE_OPTIONS = [
  { label: '近 1 小时', value: 1 },
  { label: '近 6 小时', value: 6 },
  { label: '近 24 小时', value: 24 },
  { label: '近 7 天', value: 168 },
  { label: '近 30 天', value: 720 },
]

/** 慢请求阈值，与端上拦截器、后端 overview 的默认值保持一致，避免两处口径不同 */
const SLOW_THRESHOLD_MS = 800

/** 接口统计一次最多取多少行（后端上限 30，每行要额外做 3 次百分位查询） */
const API_STAT_LIMIT = 15

const query = reactive({ appId: '', hours: 24 })
const activeTab = ref('overview')
/** 已加载过的 Tab —— 切换回来时不重复打接口 */
const loaded = reactive<Record<string, boolean>>({})

const overview = ref<ApmOverview | null>(null)
const startupTrend = ref<ApmStartupRecord[]>([])
const apiStats = ref<(ApmApiStat & { _key: string })[]>([])
const slowCalls = ref<ApmNetworkRecord[]>([])
const crashes = ref<ApmCrashRecord[]>([])
const crashTotal = ref(0)
const crashQuery = reactive({ page: 1, size: 10, type: '' })
const frames = ref<ApmFrameStat | null>(null)
const scenes = ref<ApmSceneStat[]>([])

const loading = ref(false)
const error = ref('')

// ---------------------------------------------------------------------------
// 展示辅助
// ---------------------------------------------------------------------------

/** 后端 LocalDateTime 序列化为 ISO（2026-09-12T12:40:56），统一成可读形式 */
function formatTime(raw?: string | null): string {
  if (!raw) return '—'
  return raw.replace('T', ' ').slice(0, 19)
}

/** 图表横轴用的短时间：只保留 月-日 时:分，否则 20 个刻度会糊成一片 */
function formatShortTime(raw?: string | null): string {
  const t = formatTime(raw)
  return t.length >= 16 ? t.slice(5, 16) : t
}

/** 耗时着色：只有越过慢请求阈值才上状态色，正常值保持中性 */
function durationClass(ms: number): string {
  if (ms >= 2000) return 'text-danger'
  if (ms >= SLOW_THRESHOLD_MS) return 'text-warning-ink'
  return ''
}

/**
 * 成功率着色：健康线取 99%，低于 95% 视为异常。
 * rate 为 undefined 表示后端判定「没有可判定请求」，未着色、由调用处显示「—」。
 */
function successRateClass(rate?: number): string {
  if (rate === undefined) return 'text-muted'
  if (rate >= 99) return 'text-success-ink'
  if (rate >= 95) return 'text-warning-ink'
  return 'text-danger'
}

/** 图表左侧标签空间有限，路径只保留最后两段 */
function shortUrl(url: string): string {
  const parts = url.split('/').filter(Boolean)
  return parts.slice(-2).join('/') || url
}

/** 阶段耗时字段是后端存下来的 JSON 字符串，解析失败不能连累整页渲染 */
function parseStages(raw?: string | null): { name: string; ms: number }[] {
  if (!raw) return []
  try {
    const obj = JSON.parse(raw) as Record<string, number>
    return Object.entries(obj).map(([name, ms]) => ({ name, ms: Number(ms) }))
  } catch {
    return []
  }
}

function formatStages(raw?: string | null): string {
  const stages = parseStages(raw)
  if (!stages.length) return '—'
  return stages.map((s) => `${s.name} ${s.ms}ms`).join(' · ')
}

const statCards = computed(() => {
  const n = overview.value?.network
  const c = overview.value?.crash
  return [
    {
      label: 'P99 响应耗时',
      value: n?.p99Ms ?? 0,
      icon: Timer,
      hint: `毫秒 · 平均 ${n?.avgMs ?? 0}，最大 ${n?.maxMs ?? 0}`,
    },
    {
      label: '请求成功率',
      // 不写 ?? 0：后端在「没有可判定请求」时不返回该字段，保持 undefined
      // 让指标卡显示「—」，否则 0% 会被读成「所有请求都失败了」
      value: n?.successRate,
      icon: CircleCheck,
      hint: `百分比 · 共 ${n?.total ?? 0} 次请求，失败 ${n?.failure ?? 0} 次（其中鉴权失败 ${n?.authFailure ?? 0} 次，不计入成功率）`,
    },
    {
      label: '慢请求数',
      value: n?.slowCalls ?? 0,
      icon: Hourglass,
      hint: `耗时超过 ${SLOW_THRESHOLD_MS} 毫秒`,
    },
    {
      label: '崩溃与 ANR',
      value: c?.total ?? 0,
      icon: Bug,
      hint: `崩溃 ${c?.crashCount ?? 0} · ANR ${c?.anrCount ?? 0} · 前台 ${c?.foregroundCount ?? 0}`,
    },
  ]
})

const slowApiChart = computed(() =>
  (overview.value?.topSlowApis ?? []).map((a) => ({
    label: shortUrl(a.url),
    value: a.p99Ms ?? 0,
  })),
)

/** 启动趋势接口按时间倒序返回，折线要按时间正序才有意义 */
const startupChart = computed(() =>
  [...startupTrend.value]
    .reverse()
    .map((s) => ({ label: formatShortTime(s.createTime), value: s.totalMs ?? 0 })),
)

// ---------------------------------------------------------------------------
// 数据加载
// ---------------------------------------------------------------------------

const apiParams = computed(() => ({
  appId: query.appId || undefined,
  hours: query.hours,
}))

async function fetchOverview(): Promise<void> {
  const [ov, startups] = await Promise.all([
    getApmOverviewApi({ ...apiParams.value, slowThresholdMs: SLOW_THRESHOLD_MS }),
    getApmStartupsApi({ ...apiParams.value, limit: 20 }),
  ])
  overview.value = ov
  startupTrend.value = startups ?? []
}

async function fetchCrashes(): Promise<void> {
  const res = await getApmCrashesApi({
    ...apiParams.value,
    type: crashQuery.type || undefined,
    page: crashQuery.page,
    size: crashQuery.size,
  })
  crashes.value = res?.list ?? []
  crashTotal.value = res?.total ?? 0
}

async function fetchTab(tab: string): Promise<void> {
  if (tab === 'overview') {
    await fetchOverview()
  } else if (tab === 'apis') {
    const [apis, slow] = await Promise.all([
      getApmApisApi({ ...apiParams.value, limit: API_STAT_LIMIT, sort: 'p99' }),
      getApmSlowCallsApi({
        ...apiParams.value,
        minMs: SLOW_THRESHOLD_MS,
        limit: 20,
      }),
    ])
    // 同一路径可能对应多个方法，单独拼一个唯一键给表格用
    apiStats.value = (apis ?? []).map((a) => ({ ...a, _key: `${a.method} ${a.url}` }))
    slowCalls.value = slow ?? []
  } else if (tab === 'stability') {
    await fetchCrashes()
  } else if (tab === 'performance') {
    const [fr, sc] = await Promise.all([
      getApmFramesApi(apiParams.value),
      getApmScenesApi({ ...apiParams.value, limit: 20 }),
    ])
    frames.value = fr
    scenes.value = sc ?? []
  }
}

async function runLoad(task: () => Promise<void>): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    await task()
  } catch {
    error.value = '性能数据加载失败，请确认后端服务状态与管理员权限'
  } finally {
    loading.value = false
  }
}

function loadTab(tab: string): void {
  void runLoad(async () => {
    // 概览是摘要，无论进哪个 Tab 都要保证它已就绪
    if (tab !== 'overview' && !overview.value) await fetchOverview()
    await fetchTab(tab)
    loaded[tab] = true
  })
}

/** 强制重取当前 Tab；概览同时刷新，因为指标卡一直可见 */
function refresh(): void {
  loaded[activeTab.value] = false
  delete loaded.overview
  void runLoad(async () => {
    await fetchOverview()
    if (activeTab.value !== 'overview') await fetchTab(activeTab.value)
    loaded[activeTab.value] = true
    loaded.overview = true
  })
}

/** 筛选条件变化：已加载标记全部作废，回到第一页 */
function handleQueryChange(): void {
  Object.keys(loaded).forEach((key) => delete loaded[key])
  crashQuery.page = 1
  loadTab(activeTab.value)
}

function handleCrashFilterChange(): void {
  crashQuery.page = 1
  loadTab('stability')
}

function handleCrashPageChange(): void {
  loadTab('stability')
}

watch(activeTab, (tab) => {
  if (!loaded[tab]) loadTab(tab)
})

onMounted(() => {
  loadTab(activeTab.value)
})

// ---------------------------------------------------------------------------
// 崩溃详情
// ---------------------------------------------------------------------------

const drawerVisible = ref(false)
const detailLoading = ref(false)
const crashDetail = ref<ApmCrashRecord | null>(null)

async function openCrashDetail(row: ApmCrashRecord): Promise<void> {
  drawerVisible.value = true
  detailLoading.value = true
  crashDetail.value = null
  try {
    crashDetail.value = await getApmCrashDetailApi(row.id)
  } catch {
    // 响应拦截器已给出错误提示，这里只需保持抽屉为空
  } finally {
    detailLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// 表格列
// ---------------------------------------------------------------------------

const apiColumns: RTColumn[] = [
  { prop: 'url', label: '接口路径', minWidth: 220, isTitle: true, showOverflowTooltip: true },
  { prop: 'method', label: '方法', width: 72 },
  { prop: 'total', label: '次数', width: 80, align: 'right' },
  { prop: 'authFailure', label: '鉴权失败', width: 92, align: 'right', slot: 'authFailure' },
  { prop: 'successRate', label: '成功率', width: 92, align: 'right', slot: 'successRate' },
  { prop: 'p50Ms', label: 'P50', width: 78, align: 'right' },
  { prop: 'p90Ms', label: 'P90', width: 78, align: 'right', slot: 'duration' },
  { prop: 'p99Ms', label: 'P99', width: 78, align: 'right', slot: 'duration' },
  { prop: 'maxMs', label: '最大', width: 78, align: 'right', slot: 'duration' },
]

const slowColumns: RTColumn[] = [
  { prop: 'url', label: '接口路径', minWidth: 200, isTitle: true, showOverflowTooltip: true },
  { prop: 'method', label: '方法', width: 72 },
  { prop: 'code', label: '状态码', width: 88, slot: 'code' },
  { prop: 'durationMs', label: '耗时(ms)', width: 100, align: 'right', slot: 'duration' },
  { prop: 'errorType', label: '失败类型', width: 110, slot: 'plain' },
  { prop: 'deviceId', label: '设备标识', width: 130, showOverflowTooltip: true },
  { prop: 'createTime', label: '发生时间', width: 170, slot: 'time' },
]

const crashColumns: RTColumn[] = [
  { prop: 'type', label: '类型', width: 84, slot: 'crashType' },
  { prop: 'message', label: '异常摘要', minWidth: 220, isTitle: true, showOverflowTooltip: true },
  { prop: 'device', label: '机型', width: 140, showOverflowTooltip: true },
  { prop: 'osVersion', label: '系统', width: 88, slot: 'plain' },
  { prop: 'threadName', label: '线程', width: 110, showOverflowTooltip: true },
  { prop: 'foreground', label: '现场', width: 82, slot: 'foreground' },
  { prop: 'appVersion', label: '版本', width: 90, slot: 'plain' },
  { prop: 'createTime', label: '发生时间', width: 170, slot: 'time' },
  { label: '操作', width: 90, isActions: true, slot: 'actions' },
]

const startupColumns: RTColumn[] = [
  { prop: 'totalMs', label: '启动耗时(ms)', width: 120, slot: 'duration' },
  { prop: 'cold', label: '类型', width: 84, slot: 'cold' },
  {
    prop: 'stages',
    label: '阶段拆分',
    minWidth: 260,
    isTitle: true,
    showOverflowTooltip: true,
    slot: 'stages',
  },
  { prop: 'device', label: '机型', width: 140, showOverflowTooltip: true },
  { prop: 'appVersion', label: '版本', width: 90, slot: 'plain' },
  { prop: 'createTime', label: '时间', width: 170, slot: 'time' },
]

const sceneColumns: RTColumn[] = [
  { prop: 'name', label: '场景名', minWidth: 180, isTitle: true, showOverflowTooltip: true },
  { prop: 'total', label: '次数', width: 90, align: 'right' },
  { prop: 'avgMs', label: '平均耗时(ms)', width: 120, align: 'right' },
  { prop: 'p90Ms', label: 'P90', width: 90, align: 'right', slot: 'duration' },
  { prop: 'maxMs', label: '最大', width: 90, align: 'right', slot: 'duration' },
]

const frameRows = computed(() => {
  const f = frames.value
  return [
    { label: '统计窗口', value: f?.windows ?? 0, unit: '个' },
    { label: '覆盖设备', value: f?.deviceCount ?? 0, unit: '台' },
    { label: '平均帧率', value: f?.avgFps ?? 0, unit: 'fps' },
    { label: '采样总帧数', value: f?.totalFrames ?? 0, unit: '帧' },
    { label: '卡顿帧率', value: f?.jankRate ?? 0, unit: '%' },
    { label: '冻结帧率', value: f?.frozenRate ?? 0, unit: '%' },
    { label: '最差单帧', value: f?.worstFrameMs ?? 0, unit: 'ms' },
  ]
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader
      title="性能监控"
      description="端上 APM 采集的运行时数据 · 覆盖网络、稳定性、冷启动与流畅度"
    >
      <template #actions>
        <el-button :loading="loading" @click="refresh">
          <RefreshCw v-if="!loading" :size="15" class="mr-1.5" aria-hidden="true" />
          刷新数据
        </el-button>
      </template>
    </PageHeader>

    <!-- 筛选：统计范围与应用标识都对所有 Tab 生效 -->
    <section class="rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <el-form inline class="!mb-0" @submit.prevent="handleQueryChange">
        <el-form-item label="统计范围">
          <el-select v-model="query.hours" class="md:!w-32" @change="handleQueryChange">
            <el-option
              v-for="r in RANGE_OPTIONS"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="应用标识">
          <el-input
            v-model="query.appId"
            placeholder="留空统计全部应用"
            clearable
            class="md:!w-56"
            @change="handleQueryChange"
            @keyup.enter="handleQueryChange"
            @clear="handleQueryChange"
          />
        </el-form-item>
      </el-form>
    </section>

    <!-- 全局错误 -->
    <div
      v-if="error"
      class="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs"
      role="alert"
    >
      <div class="flex items-center gap-3">
        <span class="grid size-9 place-items-center rounded-md bg-danger-soft text-danger">
          <AlertCircle :size="16" aria-hidden="true" />
        </span>
        <div>
          <p class="text-sm font-medium text-ink">{{ error }}</p>
          <p class="text-2xs text-muted">检查后端服务与管理员权限后重试</p>
        </div>
      </div>
      <el-button type="primary" @click="refresh">重新加载</el-button>
    </div>

    <template v-else>
      <!-- 指标卡：概览数据来自全时段聚合，切 Tab 不重载 -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          v-for="card in statCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :hint="card.hint"
          :loading="!overview"
        />
      </div>

      <el-tabs v-model="activeTab">
        <!-- ============ 概览 ============ -->
        <el-tab-pane label="概览" name="overview">
          <div v-loading="loading && !overview" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="最慢接口 Top"
                description="按 P99 耗时排序 · 单位毫秒"
                type="bar"
                unit="ms"
                value-label="P99(ms)"
                :height="300"
                :data="slowApiChart"
                :loading="!overview"
                empty-text="暂无接口调用数据"
              />
              <ChartCard
                title="冷启动耗时趋势"
                description="最近 20 次启动 · 单位毫秒"
                type="line"
                unit="ms"
                value-label="启动耗时(ms)"
                :height="300"
                :data="startupChart"
                :loading="!overview"
                empty-text="暂无启动数据"
              />
            </div>

            <section class="rounded-lg border border-line bg-surface p-5 shadow-xs">
              <h2 class="text-base font-semibold text-ink">采集概况</h2>
              <p class="mt-0.5 text-2xs text-muted">
                统计区间 {{ formatTime(overview?.from) }} 至 {{ formatTime(overview?.to) }}
              </p>
              <el-descriptions class="mt-4" :column="appStore.isMobile ? 1 : 3" border>
                <el-descriptions-item label="上报批次">
                  {{ overview?.reportBatches ?? 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="覆盖设备">
                  {{ overview?.deviceCount ?? 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="会话数">
                  {{ overview?.sessionCount ?? 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="启动样本">
                  {{ overview?.startup?.samples ?? 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="平均启动耗时">
                  {{ overview?.startup?.avgMs ?? 0 }} ms
                </el-descriptions-item>
                <el-descriptions-item label="冷启动占比">
                  {{ overview?.startup?.coldRatio ?? 0 }}%
                </el-descriptions-item>
                <el-descriptions-item label="平均帧率">
                  {{ overview?.frame?.avgFps ?? 0 }} fps
                </el-descriptions-item>
                <el-descriptions-item label="卡顿帧率">
                  {{ overview?.frame?.jankRate ?? 0 }}%
                </el-descriptions-item>
                <el-descriptions-item label="受影响设备">
                  {{ overview?.deviceCount ?? 0 }}
                </el-descriptions-item>
              </el-descriptions>
            </section>
          </div>
        </el-tab-pane>

        <!-- ============ 接口分析 ============ -->
        <el-tab-pane label="接口分析" name="apis">
          <div class="flex flex-col gap-4">
            <section
              class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5"
            >
              <div>
                <h2 class="text-base font-semibold text-ink">接口维度统计</h2>
                <p class="mt-0.5 text-2xs text-muted">
                  按归一化路径聚合（数字 ID 已替换为 {id}）· 按 P99 倒序 · 耗时单位毫秒
                </p>
              </div>

              <ResponsiveTable
                :data="apiStats"
                :columns="apiColumns"
                :loading="loading"
                row-key="_key"
                title-key="url"
                empty-text="暂无接口调用数据"
                empty-hint="端上产生网络请求后会自动汇总到这里"
              >
                <template #authFailure="{ row }">
                  <span class="tabular text-muted">{{ row.authFailure ?? 0 }}</span>
                </template>
                <template #successRate="{ row }">
                  <!-- 无可判定请求（分母被鉴权失败吃光）时显示「—」：
                       这一行全是没登录的调用，成功率无从谈起，写 0% 是误导 -->
                  <span v-if="row.successRate === undefined" class="text-muted">—</span>
                  <span v-else class="tabular" :class="successRateClass(row.successRate)">
                    {{ row.successRate }}%
                  </span>
                </template>
                <template #duration="{ row, column }">
                  <span class="tabular" :class="durationClass(row[column.prop ?? ''] ?? 0)">
                    {{ row[column.prop ?? ''] ?? 0 }}
                  </span>
                </template>
              </ResponsiveTable>

              <p v-if="apiStats.length" class="text-2xs text-muted">
                仅展示 P99 最高的 {{ apiStats.length }} 个接口
              </p>
            </section>

            <section
              class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5"
            >
              <div>
                <h2 class="text-base font-semibold text-ink">慢请求明细</h2>
                <p class="mt-0.5 text-2xs text-muted">
                  耗时超过 {{ SLOW_THRESHOLD_MS }} 毫秒的请求，按耗时倒序
                </p>
              </div>

              <ResponsiveTable
                :data="slowCalls"
                :columns="slowColumns"
                :loading="loading"
                row-key="id"
                title-key="url"
                empty-text="没有超过阈值的慢请求"
                empty-hint="这是好消息 —— 说明当前接口耗时都在预期内"
              >
                <template #code="{ row }">
                  <el-tag v-if="row.code === -1" type="danger" size="small">传输失败</el-tag>
                  <el-tag v-else :type="row.code >= 400 ? 'danger' : 'success'" size="small">
                    {{ row.code }}
                  </el-tag>
                </template>
                <template #duration="{ row, column }">
                  <span class="tabular" :class="durationClass(row[column.prop ?? ''] ?? 0)">
                    {{ row[column.prop ?? ''] ?? 0 }}
                  </span>
                </template>
                <template #plain="{ row, column }">
                  {{ row[column.prop ?? ''] || '—' }}
                </template>
                <template #time="{ row, column }">
                  {{ formatTime(row[column.prop ?? '']) }}
                </template>
              </ResponsiveTable>
            </section>
          </div>
        </el-tab-pane>

        <!-- ============ 稳定性 ============ -->
        <el-tab-pane label="稳定性" name="stability">
          <section
            class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-ink">崩溃与 ANR</h2>
                <p class="mt-0.5 text-2xs text-muted">
                  共 {{ crashTotal }} 条 · ANR 由主线程看门狗判定，属于风险信号而非系统确认的 ANR
                </p>
              </div>
              <el-select v-model="crashQuery.type" class="!w-32" @change="handleCrashFilterChange">
                <el-option label="全部类型" value="" />
                <el-option label="崩溃" value="crash" />
                <el-option label="ANR" value="anr" />
              </el-select>
            </div>

            <ResponsiveTable
              :data="crashes"
              :columns="crashColumns"
              :loading="loading"
              row-key="id"
              title-key="message"
              empty-text="没有崩溃与 ANR 记录"
              empty-hint="该时间段内应用运行稳定"
            >
              <template #crashType="{ row }">
                <el-tag :type="row.type === 'anr' ? 'warning' : 'danger'" size="small">
                  {{ row.type === 'anr' ? 'ANR' : '崩溃' }}
                </el-tag>
              </template>
              <template #foreground="{ row }">
                <span :class="row.foreground === 1 ? 'text-danger' : 'text-muted'">
                  {{ row.foreground === 1 ? '前台' : '后台' }}
                </span>
              </template>
              <template #plain="{ row, column }">
                {{ row[column.prop ?? ''] || '—' }}
              </template>
              <template #time="{ row, column }">
                {{ formatTime(row[column.prop ?? '']) }}
              </template>
              <template #actions="{ row }">
                <el-button link type="primary" @click="openCrashDetail(row)"> 查看堆栈 </el-button>
              </template>
            </ResponsiveTable>

            <el-pagination
              v-if="crashTotal > 0"
              v-model:current-page="crashQuery.page"
              v-model:page-size="crashQuery.size"
              :total="crashTotal"
              layout="total, sizes, prev, pager, next"
              :page-sizes="[10, 20, 50]"
              @size-change="handleCrashPageChange"
              @current-change="handleCrashPageChange"
            />
          </section>
        </el-tab-pane>

        <!-- ============ 启动与流畅度 ============ -->
        <el-tab-pane label="启动与流畅度" name="performance">
          <div class="flex flex-col gap-4">
            <section class="rounded-lg border border-line bg-surface p-5 shadow-xs">
              <h2 class="text-base font-semibold text-ink">流畅度</h2>
              <p class="mt-0.5 text-2xs text-muted">平均帧率按帧数加权，避免短窗口与长窗口等权</p>
              <el-descriptions class="mt-4" :column="appStore.isMobile ? 1 : 4" border>
                <el-descriptions-item v-for="r in frameRows" :key="r.label" :label="r.label">
                  {{ r.value }} {{ r.unit }}
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section
              class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5"
            >
              <div>
                <h2 class="text-base font-semibold text-ink">启动明细</h2>
                <p class="mt-0.5 text-2xs text-muted">
                  最近 20 次启动 · 阶段耗时由端上分段打点，单位毫秒
                </p>
              </div>

              <ResponsiveTable
                :data="startupTrend"
                :columns="startupColumns"
                :loading="loading"
                row-key="id"
                title-key="stages"
                empty-text="暂无启动记录"
                empty-hint="应用冷启动后会自动上报"
              >
                <template #duration="{ row, column }">
                  <span class="tabular" :class="durationClass(row[column.prop ?? ''] ?? 0)">
                    {{ row[column.prop ?? ''] ?? 0 }}
                  </span>
                </template>
                <template #cold="{ row }">
                  <el-tag :type="row.cold === 1 ? 'primary' : 'info'" size="small">
                    {{ row.cold === 1 ? '冷启动' : '热启动' }}
                  </el-tag>
                </template>
                <template #stages="{ row }">
                  <span class="text-2xs text-body">{{ formatStages(row.stages) }}</span>
                </template>
                <template #plain="{ row, column }">
                  {{ row[column.prop ?? ''] || '—' }}
                </template>
                <template #time="{ row, column }">
                  {{ formatTime(row[column.prop ?? '']) }}
                </template>
              </ResponsiveTable>
            </section>

            <section
              class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5"
            >
              <div>
                <h2 class="text-base font-semibold text-ink">场景埋点</h2>
                <p class="mt-0.5 text-2xs text-muted">端上自定义打点的耗时统计 · 按发生次数倒序</p>
              </div>

              <ResponsiveTable
                :data="scenes"
                :columns="sceneColumns"
                :loading="loading"
                row-key="name"
                title-key="name"
                empty-text="暂无场景埋点数据"
                empty-hint="端上埋点上报后会显示在这里"
              >
                <template #duration="{ row, column }">
                  <span class="tabular" :class="durationClass(row[column.prop ?? ''] ?? 0)">
                    {{ row[column.prop ?? ''] ?? 0 }}
                  </span>
                </template>
              </ResponsiveTable>
            </section>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- 崩溃详情：堆栈很长，用抽屉而不是弹窗，纵向空间更充裕 -->
    <el-drawer v-model="drawerVisible" title="崩溃详情" :size="appStore.isMobile ? '92%' : '60%'">
      <div v-loading="detailLoading" class="flex flex-col gap-4">
        <template v-if="crashDetail">
          <el-descriptions :column="appStore.isMobile ? 1 : 2" border>
            <el-descriptions-item label="类型">
              <el-tag :type="crashDetail.type === 'anr' ? 'warning' : 'danger'" size="small">
                {{ crashDetail.type === 'anr' ? 'ANR' : '崩溃' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发生时现场">
              {{ crashDetail.foreground === 1 ? '前台' : '后台' }}
            </el-descriptions-item>
            <el-descriptions-item label="线程">{{
              crashDetail.threadName || '—'
            }}</el-descriptions-item>
            <el-descriptions-item label="发生时间">
              {{ formatTime(crashDetail.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="机型">{{
              crashDetail.device || '—'
            }}</el-descriptions-item>
            <el-descriptions-item label="系统">{{
              crashDetail.osVersion || '—'
            }}</el-descriptions-item>
            <el-descriptions-item label="应用版本">
              {{ crashDetail.appVersion || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="设备标识">
              {{ crashDetail.deviceId || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="异常摘要" :span="2">
              {{ crashDetail.message || '—' }}
            </el-descriptions-item>
          </el-descriptions>

          <div>
            <h3 class="mb-2 text-sm font-semibold text-ink">堆栈</h3>
            <pre
              class="max-h-[420px] overflow-auto rounded-md border border-line bg-subtle p-3 text-2xs leading-relaxed text-body"
              >{{ crashDetail.stack || '该记录没有采集到堆栈' }}</pre
            >
          </div>
        </template>

        <p v-else-if="!detailLoading" class="text-sm text-muted">详情加载失败，请稍后重试</p>
      </div>
    </el-drawer>
  </div>
</template>

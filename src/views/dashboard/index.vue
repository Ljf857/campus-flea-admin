<script setup lang="ts">
/**
 * 仪表盘
 *
 * 数据与重构前完全一致（同一个 getDashboardApi），
 * 仅把原先的进度条换成带坐标轴、可悬停读数的图表，并补齐加载 / 空 / 错误三态。
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  ShoppingBag,
  ReceiptText,
  UserPlus,
  UserCheck,
  PackageCheck,
  Flag,
  ChevronRight,
  RefreshCw,
} from 'lucide-vue-next'
import { getDashboardApi } from '@/api/modules/dashboard'
import type { DashboardData } from '@/api/types/admin'
import StatCard from '@/components/StatCard/index.vue'
import ChartCard from '@/components/ChartCard/index.vue'

const router = useRouter()

const data = ref<DashboardData | null>(null)
const loading = ref(true)
const error = ref('')

const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const statCards = computed(() => [
  { label: '注册用户', value: data.value?.userCount, icon: Users, hint: '平台累计注册' },
  { label: '商品数量', value: data.value?.goodsCount, icon: ShoppingBag, hint: '累计发布商品' },
  { label: '订单数量', value: data.value?.orderCount, icon: ReceiptText, hint: '累计成交订单' },
  { label: '今日新增用户', value: data.value?.todayNewUser, icon: UserPlus, hint: '今日 00:00 起' },
])

/** 待办：数量 > 0 才用状态色，0 保持中性 —— 颜色要表达状态，不当装饰 */
const pendingItems = computed(() => [
  {
    label: '待审核实名认证',
    count: data.value?.pendingVerifyUser ?? 0,
    path: '/user/verify',
    icon: UserCheck,
  },
  {
    label: '待审核商品',
    count: data.value?.pendingVerifyGoods ?? 0,
    path: '/goods/audit',
    icon: PackageCheck,
  },
  {
    label: '待处理举报',
    count: data.value?.pendingReport ?? 0,
    path: '/report',
    icon: Flag,
  },
])

const pendingTotal = computed(() =>
  pendingItems.value.reduce((sum, item) => sum + item.count, 0),
)

const userTrend = computed(() =>
  (data.value?.userTrend ?? []).map((d) => ({ label: d.date, value: d.count })),
)

const categoryStats = computed(() =>
  (data.value?.categoryStats ?? []).map((d) => ({ label: d.name, value: d.count })),
)

const todayStats = computed(() => [
  { label: '新增用户', value: data.value?.todayNewUser ?? 0, unit: '人' },
  { label: '新增商品', value: data.value?.todayNewGoods ?? 0, unit: '件' },
  { label: '新增订单', value: data.value?.todayNewOrder ?? 0, unit: '笔' },
])

async function fetchData(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    data.value = (await getDashboardApi()) as DashboardData
  } catch {
    error.value = '仪表盘数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- 页头：标题 / 副标题 -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-ink">仪表盘</h1>
        <p class="mt-1 text-sm text-muted">平台整体运营概览 · {{ today }}</p>
      </div>
      <el-button :loading="loading" @click="fetchData">
        <RefreshCw v-if="!loading" :size="15" class="mr-1.5" aria-hidden="true" />
        刷新数据
      </el-button>
    </div>

    <!-- 全局错误：接口挂了要有明确出口，而不是一片空白 -->
    <div
      v-if="error"
      class="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs"
      role="alert"
    >
      <div class="flex items-center gap-3">
        <span class="grid size-9 place-items-center rounded-md bg-danger-soft text-danger">
          <Flag :size="16" aria-hidden="true" />
        </span>
        <div>
          <p class="text-sm font-medium text-ink">{{ error }}</p>
          <p class="text-2xs text-muted">请检查网络或后端服务状态后重试</p>
        </div>
      </div>
      <el-button type="primary" @click="fetchData">重新加载</el-button>
    </div>

    <template v-else>
      <!-- 指标卡 -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          v-for="card in statCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :hint="card.hint"
          :loading="loading"
        />
      </div>

      <!-- 趋势 + 待办 -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <ChartCard
            title="用户增长趋势"
            description="按日统计的累计注册用户增量"
            type="line"
            unit="人"
            value-label="新增用户"
            :data="userTrend"
            :loading="loading"
            empty-text="暂无用户增长数据"
          />
        </div>

        <!-- 待处理事项：self-start 让它贴合内容，不为了和图表卡等高而在卡片里留一大片空白 -->
        <section
          class="flex flex-col self-start rounded-lg border border-line bg-surface shadow-xs"
          aria-labelledby="pending-heading"
        >
          <header class="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
            <h2 id="pending-heading" class="text-base font-semibold text-ink">待处理事项</h2>
            <span
              v-if="pendingTotal > 0"
              class="rounded-full bg-warning-soft px-2 py-0.5 text-2xs font-medium text-warning-ink"
            >
              共 {{ pendingTotal }} 项
            </span>
          </header>

          <div v-if="loading" class="flex flex-col gap-3 px-5 pb-5">
            <el-skeleton animated :rows="3" />
          </div>

          <ul v-else class="px-2 pb-3">
            <li v-for="item in pendingItems" :key="item.label">
              <button
                type="button"
                class="group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors duration-150 hover:bg-hover"
                @click="router.push(item.path)"
              >
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-md"
                  :class="
                    item.count > 0 ? 'bg-warning-soft text-warning-ink' : 'bg-subtle text-muted'
                  "
                  aria-hidden="true"
                >
                  <component :is="item.icon" :size="15" />
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm text-body">{{ item.label }}</span>
                </span>

                <span
                  class="tabular shrink-0 text-lg font-semibold"
                  :class="item.count > 0 ? 'text-warning-ink' : 'text-muted'"
                >
                  {{ item.count }}
                </span>
                <ChevronRight
                  :size="15"
                  class="shrink-0 text-line-strong transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted"
                  aria-hidden="true"
                />
              </button>
            </li>
          </ul>

          <div v-if="!loading && pendingTotal === 0" class="px-5 pb-5">
            <p class="rounded-md bg-subtle px-3 py-4 text-center text-2xs text-muted">
              所有审核与举报都已处理完毕
            </p>
          </div>
        </section>
      </div>

      <!-- 分类统计 + 今日数据 -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <ChartCard
            title="商品分类统计"
            description="各分类下的在架商品数量"
            type="bar"
            unit="件"
            value-label="商品数"
            :height="280"
            :data="categoryStats"
            :loading="loading"
            empty-text="暂无分类统计数据"
          />
        </div>

        <section
          class="flex flex-col self-start rounded-lg border border-line bg-surface shadow-xs"
          aria-labelledby="today-heading"
        >
          <header class="px-5 pb-3 pt-4">
            <h2 id="today-heading" class="text-base font-semibold text-ink">今日数据</h2>
            <p class="mt-0.5 text-2xs text-muted">统计周期为今日 00:00 至现在</p>
          </header>

          <div v-if="loading" class="px-5 pb-5">
            <el-skeleton animated :rows="3" />
          </div>

          <dl v-else class="px-5 pb-5">
            <div
              v-for="row in todayStats"
              :key="row.label"
              class="flex items-center justify-between border-b border-line py-3 last:border-0"
            >
              <dt class="text-sm text-muted">{{ row.label }}</dt>
              <dd class="text-base font-semibold text-ink">
                {{ row.value.toLocaleString('zh-CN') }}
                <span class="ml-0.5 text-2xs font-normal text-muted">{{ row.unit }}</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </template>
  </div>
</template>

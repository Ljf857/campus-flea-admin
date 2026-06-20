<script setup lang="ts">
/**
 * 图表卡片：标题区 + 图表 / 表格视图切换 + 加载 / 空 / 错误三态
 *
 * 为什么内建表格视图：图表用颜色和位置承载数值，对屏幕阅读器和色觉障碍用户不可读。
 * 表格是同一份数据的等价表达，保证任何数值都不是「只能靠悬停才能拿到」。
 */
import { computed, ref } from 'vue'
import { BarChart3, Table2, AlertCircle } from 'lucide-vue-next'
import Chart, { type ChartPoint } from '@/components/Chart/index.vue'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    data: ChartPoint[]
    type: 'line' | 'bar'
    unit?: string
    height?: number
    loading?: boolean
    error?: string
    emptyText?: string
    /** 表格视图里数值列的表头，如「新增用户」 */
    valueLabel?: string
  }>(),
  {
    height: 260,
    loading: false,
    error: '',
    emptyText: '暂无数据',
    valueLabel: '数量',
  },
)

const view = ref<'chart' | 'table'>('chart')

const isEmpty = computed(() => !props.data.length)
const total = computed(() => props.data.reduce((sum, d) => sum + d.value, 0))
</script>

<template>
  <section class="flex flex-col rounded-lg border border-line bg-surface shadow-xs">
    <!-- 标题区 -->
    <header class="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-ink">{{ title }}</h3>
        <p v-if="description" class="mt-0.5 truncate text-2xs text-muted">{{ description }}</p>
      </div>

      <!-- 图表 / 表格切换：纯粹的呈现方式选择，不改变数据 -->
      <div
        v-if="!loading && !error && !isEmpty"
        class="flex shrink-0 items-center gap-0.5 rounded-md bg-subtle p-0.5"
        role="group"
        aria-label="切换数据呈现方式"
      >
        <button
          type="button"
          class="grid size-7 place-items-center rounded-sm transition-colors duration-150"
          :class="
            view === 'chart'
              ? 'bg-surface text-ink shadow-xs'
              : 'text-muted hover:text-body'
          "
          :aria-pressed="view === 'chart'"
          aria-label="图表视图"
          @click="view = 'chart'"
        >
          <BarChart3 :size="14" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="grid size-7 place-items-center rounded-sm transition-colors duration-150"
          :class="
            view === 'table'
              ? 'bg-surface text-ink shadow-xs'
              : 'text-muted hover:text-body'
          "
          :aria-pressed="view === 'table'"
          aria-label="表格视图"
          @click="view = 'table'"
        >
          <Table2 :size="14" aria-hidden="true" />
        </button>
      </div>
    </header>

    <!-- 主体 -->
    <div class="flex-1 px-5 pb-5">
      <!-- 加载：骨架屏，高度与图表一致，避免内容到位时跳动 -->
      <div v-if="loading" class="flex flex-col gap-3" :style="{ height: `${height}px` }">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="rect" style="width: 100%; height: 100%" />
          </template>
        </el-skeleton>
      </div>

      <!-- 错误 -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center gap-2 text-center"
        :style="{ minHeight: `${height}px` }"
        role="alert"
      >
        <AlertCircle :size="28" class="text-danger" aria-hidden="true" />
        <p class="text-sm text-body">{{ error }}</p>
        <p class="text-2xs text-muted">请稍后重试，或联系技术支持</p>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="isEmpty"
        class="flex flex-col items-center justify-center gap-1.5 text-center"
        :style="{ minHeight: `${height}px` }"
      >
        <div class="grid size-12 place-items-center rounded-full bg-subtle" aria-hidden="true">
          <BarChart3 :size="22" class="text-muted" />
        </div>
        <p class="text-sm text-body">{{ emptyText }}</p>
        <p class="text-2xs text-muted">数据产生后会自动显示在这里</p>
      </div>

      <!-- 图表 -->
      <Chart
        v-else-if="view === 'chart'"
        :type="type"
        :data="data"
        :unit="unit"
        :height="height"
      />

      <!-- 表格视图：图表的无障碍等价物 -->
      <div v-else class="overflow-y-auto" :style="{ maxHeight: `${height}px` }">
        <table class="w-full text-sm">
          <caption class="sr-only">{{ title }}的数据表格</caption>
          <thead>
            <tr class="border-b border-line text-2xs text-muted">
              <th scope="col" class="py-2 text-left font-semibold">类别</th>
              <th scope="col" class="py-2 text-right font-semibold">{{ valueLabel }}</th>
              <th scope="col" class="py-2 text-right font-semibold">占比</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in data"
              :key="row.label"
              class="border-b border-line last:border-0 transition-colors duration-150 hover:bg-hover"
            >
              <th scope="row" class="py-2 text-left font-normal text-body">
                {{ row.label }}
              </th>
              <td class="tabular py-2 text-right font-medium text-ink">
                {{ row.value.toLocaleString('zh-CN') }}
              </td>
              <td class="tabular py-2 text-right text-muted">
                {{ total ? ((row.value / total) * 100).toFixed(1) : '0.0' }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

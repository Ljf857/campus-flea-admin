<script setup lang="ts">
/**
 * 基础图表：单系列折线/面积图 与 横向条形图
 *
 * 遵循的图表规范：
 * - 单系列不画图例（标题已经说明画的是什么），避免多一个只有一格的色块
 * - 网格线是 1px 实线、贴近表面色一档，绝不用虚线
 * - 折线 2px 圆角端点，面积填充 10% 透明度；标记点 8px 且带 2px 表面色描边环
 * - 条形图柱体最宽 24px，数据端 4px 圆角、基线端方角，数值直接标在柱端
 * - 分类是名义数据（分类名无大小序），所有柱子同一颜色，不做深浅色阶
 * - 文字一律用文本色，不穿数据色
 * - 悬停层默认就有：折线用吸附十字准星，条形用逐柱提示
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import {
  useChartTheme,
  baseTooltipStyle,
  valueAxisStyle,
  categoryAxisStyle,
  niceStep,
  axisMax,
} from '@/utils/chartTheme'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent])

export interface ChartPoint {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    type: 'line' | 'bar'
    data: ChartPoint[]
    height?: number
    /** 悬停提示里数值后面的单位，如「人」「件」 */
    unit?: string
  }>(),
  { height: 260, unit: '' },
)

const theme = useChartTheme()

/** 分类名来自接口，属于不可信数据；ECharts 的 formatter 返回 HTML，必须转义 */
function escapeHtml(raw: string): string {
  return String(raw).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

const option = computed(() => {
  const t = theme.value
  const valueAxis = valueAxisStyle(t)
  const catAxis = categoryAxisStyle(t)
  const labels = props.data.map((d) => d.label)
  const values = props.data.map((d) => d.value)

  // 刻度步长与上界都取整，轴上只会出现 0/50/100/150 这类干净数字
  const rawMax = Math.max(...values, 0)
  const step = niceStep(rawMax)
  const max = axisMax(rawMax, step)

  const tooltip = {
    ...baseTooltipStyle(t),
    // 数值在前、标签在后：读者已经知道看的是什么，想要的是数
    formatter: (params: unknown) => {
      const list = Array.isArray(params) ? params : [params]
      const first = list[0] as { name?: string; value?: number } | undefined
      const value = Number(first?.value ?? 0)
      return `<span style="font-weight:600;font-size:14px">${value.toLocaleString('zh-CN')}${escapeHtml(props.unit)}</span><br/><span style="color:${t.axisText};font-size:12px">${escapeHtml(String(first?.name ?? ''))}</span>`
    },
  }

  if (props.type === 'line') {
    return {
      grid: { top: 16, right: 16, bottom: 4, left: 4, containLabel: true },
      tooltip: { ...tooltip, trigger: 'axis', axisPointer: { type: 'line', snap: true, lineStyle: { color: t.grid, width: 1 } } },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        ...catAxis,
        axisLabel: { ...catAxis.axisLabel, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max,
        interval: step,
        ...valueAxis,
      },
      series: [
        {
          type: 'line',
          data: values,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 2, cap: 'round', join: 'round', color: t.series },
          areaStyle: { color: t.area },
          // 2px 表面色描边环：标记点压在折线上也能看清
          itemStyle: { color: t.series, borderColor: t.surface, borderWidth: 2 },
          emphasis: { scale: 1.2, focus: 'none' },
        },
      ],
    }
  }

  return {
    grid: { top: 8, right: 44, bottom: 4, left: 4, containLabel: true },
    tooltip: { ...tooltip, trigger: 'item' },
    xAxis: { type: 'value', min: 0, max, interval: step, ...valueAxis },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      ...catAxis,
      // 分类名是文本，用正文色（不穿数据色）
      axisLabel: { color: t.bodyText, fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barMaxWidth: 24,
        // 横向条：基线在左，数据端在右 —— 右端 4px 圆角，左端方角
        itemStyle: { color: t.series, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          distance: 8,
          // 直接标注用文本色，不穿数据色
          color: t.bodyText,
          fontSize: 12,
        },
        emphasis: { itemStyle: { color: t.series, opacity: 0.85 } },
      },
    ],
  }
})
</script>

<template>
  <VChart
    :option="option"
    :style="{ height: `${height}px` }"
    autoresize
    :aria-label="`${type === 'line' ? '趋势' : '分类统计'}图表`"
    role="img"
  />
</template>

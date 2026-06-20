import { onScopeDispose, ref, computed, type Ref } from 'vue'

/**
 * 图表配色。
 *
 * ECharts 画在 canvas 上，拿不到 CSS 变量，只能喂具体色值，
 * 所以这里把语义 token 解析成十六进制，并跟随 <html class="dark"> 变化重算。
 *
 * 数值来源（已用 dataviz 校验脚本验证，浅色/深色双模式）：
 *   series #0077FF —— 单系列标记色，两模式均全项通过。
 *   注意不要再往同一张图里加 #0062D6：两者相邻对比 ΔE 仅 8.0（低于 15 的下限），
 *   正常色觉都难以区分。多系列时请另选色相，而不是取同一个蓝的深浅档。
 */

const DARK = {
  series: '#0077ff',
  area: 'rgba(0, 119, 255, 0.14)',
  grid: '#1e293b', // 网格线：贴近表面色一档，保持退让
  axisText: '#94a3b8',
  bodyText: '#cbd5e1',
  tooltipBg: '#111827',
  tooltipBorder: '#1e293b',
  surface: '#111827',
}

const LIGHT = {
  series: '#0077ff',
  area: 'rgba(0, 119, 255, 0.10)', // 面积填充 ~10%，是淡淡的水洗，不是实块
  grid: '#e2e8f0',
  axisText: '#64748b',
  bodyText: '#334155',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  surface: '#ffffff',
}

export type ChartTheme = typeof LIGHT

/**
 * 跟随 <html class="dark"> 的响应式开关。
 * 用 MutationObserver 而不是监听 store：主题还可能由 index.html 内联脚本
 * 或系统偏好变化触发，观察 class 本身是唯一可靠的信号。
 */
export function useDarkMode(): Ref<boolean> {
  const isDark = ref(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  if (typeof window === 'undefined') return isDark

  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (): void => {
    const stored = localStorage.getItem('campus_flea_theme') || 'system'
    if (stored === 'system') {
      isDark.value = document.documentElement.classList.contains('dark')
    }
  }
  mql.addEventListener('change', onSystemChange)

  onScopeDispose(() => {
    observer.disconnect()
    mql.removeEventListener('change', onSystemChange)
  })

  return isDark
}

/** 解析出当前模式下的图表配色 */
export function useChartTheme() {
  const isDark = useDarkMode()
  return computed<ChartTheme>(() => (isDark.value ? DARK : LIGHT))
}

/** 共享的提示框样式，两个图表复用，保证观感一致 */
export function baseTooltipStyle(theme: ChartTheme) {
  return {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: theme.bodyText, fontSize: 13 },
    extraCssText: 'border-radius:8px;box-shadow:0 4px 12px -2px rgba(15,23,42,.1);',
  }
}

/**
 * 数值轴：画实线细网格 —— 网格只出现在承载数值的那根轴上。
 * 名义轴（日期、分类名）不画网格，否则两个方向都是线，画面立刻变吵。
 */
export function valueAxisStyle(theme: ChartTheme) {
  return {
    splitLine: {
      show: true,
      lineStyle: { color: theme.grid, width: 1, type: 'solid' as const },
    },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: theme.axisText, fontSize: 12 },
  }
}

/** 名义轴：无网格、无轴线、无刻度，只留标签 */
export function categoryAxisStyle(theme: ChartTheme) {
  return {
    splitLine: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: theme.axisText, fontSize: 12 },
  }
}

/**
 * 取一个「好看的」刻度步长（1/2/5 × 10ⁿ）。
 * 不能用 max/4 这类除法：会算出 33 这种步长，轴上出现 0/33/66/99 的怪数字。
 */
export function niceStep(max: number, targetTicks = 5): number {
  if (!Number.isFinite(max) || max <= 0) return 1
  const raw = max / targetTicks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  return step
}

/** 轴的上界对齐到步长的整数倍，避免出现「150 和 140 同时出现」这种断裂刻度 */
export function axisMax(max: number, step: number): number {
  if (!Number.isFinite(max) || max <= 0) return step
  return Math.ceil(max / step) * step
}

/**
 * 分类主题色的解析、推导与对比度校验。
 *
 * ⚠️ 这里的算法必须与移动端
 * `CampusFlea/app/src/main/java/com/example/campusflea/ui/util/CategoryColors.kt`
 * 逐项保持一致，否则后台预览与 App 实际效果会对不上——那比没有预览更糟，
 * 因为管理员会信任一个假的预览。改动其一必须同步改另一方。
 */

/** 与移动端 Color.kt 的 OnColorLight / OnColorDark 对应 */
export const ON_COLOR_LIGHT = '#FFFFFF'
export const ON_COLOR_DARK = '#1A1C1E'

/**
 * 色块底色的相对亮度上限，与移动端 `MAX_TILE_LUMINANCE` 同值。
 *
 * 白色图标要在色块上满足非文字图形 3:1 的最低对比度，底色亮度必须 ≤ 0.30
 * （1.05 / (0.30 + 0.05) = 3.0）。超过这个值的颜色会被自动压暗。
 */
export const MAX_TILE_LUMINANCE = 0.3

/** 深色版推导参数，与移动端 deriveDarkVariant 对应 */
const DARK_VARIANT = {
  saturationScale: 0.8,
  lightnessScale: 0.9,
}

export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null
  const cleaned = input.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null
  return `#${cleaned.toUpperCase()}`
}

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex)
  if (!n) return null
  return [
    parseInt(n.slice(1, 3), 16),
    parseInt(n.slice(3, 5), 16),
    parseInt(n.slice(5, 7), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

/** sRGB 分量线性化 */
function srgbToLinear(value: number): number {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** WCAG 相对亮度，与 Compose 的 Color.luminance() 同一公式 */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const r = srgbToLinear(rgb[0])
  const g = srgbToLinear(rgb[1])
  const b = srgbToLinear(rgb[2])
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 两色的 WCAG 对比度 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

interface Hsl {
  h: number
  s: number
  l: number
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min

  if (d === 0) return { h: 0, s: 0, l }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6

  return { h, s, l }
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  if (s === 0) {
    const v = l * 255
    return [v, v, v]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  return [hue2rgb(h + 1 / 3) * 255, hue2rgb(h) * 255, hue2rgb(h - 1 / 3) * 255]
}

/**
 * 深色模式下的默认推导：同色相，降饱和并略压暗。
 * 目的不是换一个颜色，而是让色块在近黑背景上不刺眼。
 */
export function deriveDarkVariant(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const hsl = rgbToHsl(...rgb)
  const s = Math.min(1, Math.max(0, hsl.s * DARK_VARIANT.saturationScale))
  const l = Math.min(1, Math.max(0, hsl.l * DARK_VARIANT.lightnessScale))
  const [r, g, b] = hslToRgb({ h: hsl.h, s, l })
  return rgbToHex(r, g, b)
}

/**
 * 把颜色压暗到亮度不超过 maxLuminance，保持色相与饱和度。
 *
 * 在 HSL 明度上做二分查找而不是乘一个固定系数：不同色相对明度的敏感度差别很大
 * （蓝色和黄色同样的 HSL 明度，实际亮度能差好几倍），固定系数会有的压不够、有的压过头。
 */
export function clampToMaxLuminance(hex: string, maxLuminance = MAX_TILE_LUMINANCE): string {
  if (relativeLuminance(hex) <= maxLuminance) return hex
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const hsl = rgbToHsl(...rgb)

  let low = 0
  let high = hsl.l
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2
    const [r, g, b] = hslToRgb({ h: hsl.h, s: hsl.s, l: mid })
    if (relativeLuminance(rgbToHex(r, g, b)) > maxLuminance) high = mid
    else low = mid
  }
  const [r, g, b] = hslToRgb({ h: hsl.h, s: hsl.s, l: low })
  return rgbToHex(r, g, b)
}

export interface TileColors {
  /** 压暗之后的实际底色（App 里看到的就是这个） */
  background: string
  /** 图标颜色，恒为白 */
  foreground: string
  /** 前台预览用的、未经约束的原始色；后台未配置时为 null */
  raw: string | null
  /** 底色是否被压暗过（用于给出提示） */
  adjusted: boolean
}

/**
 * 解析分类色块的实际配色。
 *
 * 与移动端 `categoryTileColors` 一一对应：图标恒为白色，底色过浅时自动压暗。
 * 后台预览必须走这个函数，否则会显示出一个 App 上并不存在的颜色。
 */
export function resolveTileColors(
  color: string | null | undefined,
  colorDark: string | null | undefined,
  isDark: boolean,
): TileColors {
  const light = normalizeHex(color)
  if (!light) {
    // 未配置：App 会退回主题容器色，这里给一个等价的近似值
    return {
      background: isDark ? '#3E4759' : '#DAE2F9',
      foreground: isDark ? '#DAE2F9' : '#131C2B',
      raw: null,
      adjusted: false,
    }
  }

  const raw = isDark ? (normalizeHex(colorDark) ?? deriveDarkVariant(light)) : light
  const background = clampToMaxLuminance(raw)
  return {
    background,
    foreground: ON_COLOR_LIGHT,
    raw,
    // 浮点误差容忍：压暗前后差距极小时不提示
    adjusted: relativeLuminance(raw) - relativeLuminance(background) > 0.005,
  }
}

/** 对比度等级 */
export type ContrastLevel = 'excellent' | 'good' | 'low'

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 4.5) return 'excellent'
  if (ratio >= 3) return 'good'
  return 'low'
}

export const CONTRAST_LABEL: Record<ContrastLevel, string> = {
  excellent: '对比度优秀',
  good: '对比度达标',
  low: '对比度偏低',
}

/**
 * 预设色板。
 *
 * 分成两组：第一组是与移动端品牌色（#0077FF）协调的推荐色，直接用即可；
 * 第二组是扩展色。这里不再刻意排除浅色——选浅了会被自动压暗到可读范围，
 * 预览会如实显示压暗后的结果。分组的意义变成了「色相倾向」的区分。
 */
export const PRESET_COLOR_GROUPS: { label: string; colors: string[] }[] = [
  {
    label: '品牌推荐',
    colors: ['#0059C4', '#00696E', '#2E7D46', '#B03A5B', '#C05621', '#6B4FA8'],
  },
  {
    label: '扩展色板',
    colors: [
      '#1F7A3D', '#4A7C1F', '#00695C', '#00796B', '#0277BD',
      '#1565C0', '#4527A0', '#6A1B9A', '#AD1457', '#C62828',
      '#D84315', '#EF6C00', '#9E7C0C', '#5D4037', '#455A64', '#37474F',
    ],
  },
  {
    label: '明亮色（会被自动压暗）',
    colors: [
      '#66BB6A', '#42A5F5', '#F06292', '#FF7043', '#AB47BC',
      '#FFA726', '#81C784', '#90CAF9', '#CE93D8', '#FFB74D', '#64B5F6',
    ],
  },
]

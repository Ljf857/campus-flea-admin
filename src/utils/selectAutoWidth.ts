import { nextTick, type App, type ComponentPublicInstance, type VNode } from 'vue'

interface SelectLikeInstance {
  $el: unknown
  $slots: ComponentPublicInstance['$slots']
}

/** 用与下拉框相同的字体测量文本宽度 */
function measureTextWidth(text: string, font: CSSStyleDeclaration): number {
  const span = document.createElement('span')
  span.setAttribute(
    'style',
    'position:absolute;visibility:hidden;white-space:nowrap;top:-9999px;left:0;pointer-events:none;'
  )
  span.style.fontSize = font.fontSize
  span.style.fontFamily = font.fontFamily
  span.style.fontWeight = font.fontWeight
  span.style.fontStyle = font.fontStyle
  span.style.letterSpacing = font.letterSpacing
  span.style.textTransform = font.textTransform
  span.textContent = text
  document.body.appendChild(span)
  const width = span.offsetWidth
  span.remove()
  return width
}

/** 递归收集 el-select 默认插槽中所有 el-option 的 label 文本 */
function collectOptionLabels(instance: SelectLikeInstance): string[] {
  const labels: string[] = []
  const walk = (vnodes: VNode[] | undefined): void => {
    if (!vnodes) return
    for (const vnode of vnodes) {
      if (!vnode) continue
      const props = (vnode.props ?? {}) as Record<string, unknown>
      const label = props.label
      if (label != null && label !== '') {
        labels.push(String(label))
        continue
      }
      const children = vnode.children as unknown
      if (Array.isArray(children)) {
        walk(children as VNode[])
      } else if (children && typeof children === 'object') {
        const slotChildren = children as Record<string, unknown>
        if (typeof slotChildren.default === 'function') walk((slotChildren.default as () => VNode[])())
        else if (Array.isArray(slotChildren.default)) walk(slotChildren.default as VNode[])
      }
    }
  }
  const slots = instance.$slots
  for (const name of Object.keys(slots)) {
    if (name === 'prefix' || name === 'suffix') continue
    const slotFn = slots[name]
    if (slotFn) walk(slotFn() as VNode[])
  }
  return labels
}

/** 选中文本之外，还需为下拉框自身留白：左右 padding 24 + 间距 6 + 右侧图标约 16 */
const SELECT_CHROME = 56

const MOBILE_QUERY = '(max-width: 767px)'

function applyAutoWidth(instance: SelectLikeInstance): void {
  const el = instance.$el as HTMLElement | undefined
  if (!el || typeof el.classList?.contains !== 'function' || !el.classList.contains('el-select')) return

  // 移动端让 CSS 的 width:100% 接管，清除内联 min-width，避免对抗
  if (window.matchMedia(MOBILE_QUERY).matches) {
    el.style.minWidth = ''
    return
  }

  const labels = collectOptionLabels(instance)
  if (labels.length === 0) return

  const wrapper = el.querySelector<HTMLElement>('.el-select__wrapper')
  const font = wrapper ? getComputedStyle(wrapper) : getComputedStyle(el)
  const longest = Math.max(...labels.map((label) => measureTextWidth(label, font)))

  const minWidth = Math.max(96, Math.ceil(longest + SELECT_CHROME))
  el.style.minWidth = `${minWidth}px`
}

/**
 * 全局让所有 el-select 的宽度自适应选项中最长的文本，
 * 保证选中任何选项都能完整显示、不被省略号截断。
 * 通过 app.mixin 自动作用于每个 el-select 实例，无需逐个标注。
 */
export function setupSelectAutoWidth(app: App): void {
  app.mixin({
    mounted(this: ComponentPublicInstance) {
      const el = this.$el as HTMLElement | undefined
      if (el?.classList?.contains('el-select')) nextTick(() => applyAutoWidth(this))
    },
    updated(this: ComponentPublicInstance) {
      const el = this.$el as HTMLElement | undefined
      if (el?.classList?.contains('el-select')) nextTick(() => applyAutoWidth(this))
    },
  })
}

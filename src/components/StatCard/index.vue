<script setup lang="ts">
/**
 * 指标卡（stat tile）
 *
 * 规范：标签用陈述句、不加冒号；数值用半粗体、大号且用比例数字
 * （不是等宽数字 —— 大号数字用 tabular-nums 会显得松散）；
 * 图标底色统一用品牌浅色，不拿状态色（成功/警告/危险）做装饰，
 * 那三个颜色留给真正表达状态的场景（如待处理数量）。
 */
import { computed, type Component } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: number | undefined
    icon: Component
    hint?: string
    loading?: boolean
  }>(),
  { hint: '', loading: false },
)

/**
 * 大数值压缩：12,846 → 1.28万，避免指标卡被撑破。
 *
 * value 为 undefined 表示「这个指标没有值」（如样本量为 0 的成功率、后端 non_null
 * 省略掉的字段），显示「—」而不是 0——0 是一个具体的断言，会把「无数据」说成「值是 0」。
 * 加载中的情况由 loading 走骨架屏，不会走到这里。
 */
const display = computed(() => {
  const v = props.value
  if (v === undefined) return '—'
  if (v < 10000) return v.toLocaleString('zh-CN')
  return `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}万`
})
</script>

<template>
  <div
    class="rounded-lg border border-line bg-surface p-4 shadow-xs transition-shadow duration-150 hover:shadow-md md:p-5"
  >
    <div class="flex items-center gap-2">
      <span
        class="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"
        aria-hidden="true"
      >
        <component :is="icon" :size="16" />
      </span>
      <span class="truncate text-sm text-muted">{{ label }}</span>
    </div>

    <div class="mt-3">
      <el-skeleton v-if="loading" animated :rows="1" />
      <template v-else>
        <p class="text-2xl font-semibold leading-tight text-ink">{{ display }}</p>
        <p v-if="hint" class="mt-1 text-2xs text-muted">{{ hint }}</p>
      </template>
    </div>
  </div>
</template>

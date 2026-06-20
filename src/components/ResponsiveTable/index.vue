<script lang="ts">
/** 响应式表格列配置：桌面渲染 el-table，移动端渲染卡片列表 */
export interface RTColumn {
  prop?: string // 行字段；操作列可省略
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean // 桌面长文本 tooltip
  slot?: string // 命名插槽 key，表格单元格与卡片值区共用
  isTitle?: boolean // 卡片：作为标题而非 label/value 行
  isActions?: boolean // 桌面：fixed="right"；卡片：底部操作区
  hideInCard?: boolean // 卡片：不显示（如 ID）
  /**
   * 禁止换行。默认允许换行 —— 不要全局开 nowrap：
   * 定宽列装不下 nowrap 内容时会直接溢出压到相邻列上，
   * 而没有 showOverflowTooltip 的列不会省略号截断，就会看起来像错版。
   * 这里显式配合 ellipsis，保证再怎么窄也只是截断，不会串列。
   */
  nowrap?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Inbox } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const props = withDefaults(
  defineProps<{
    data: Record<string, unknown>[]
    columns: RTColumn[]
    loading?: boolean
    rowKey?: string
    titleKey?: string
    emptyText?: string
    /** 空状态下的补充说明，例如「换个关键词再试」 */
    emptyHint?: string
  }>(),
  {
    loading: false,
    rowKey: 'id',
    emptyText: '暂无数据',
    emptyHint: '',
  },
)

const appStore = useAppStore()
const isMobile = computed(() => appStore.isMobile)

const actionCol = computed(() => props.columns.find((c) => c.isActions))
const titleCol = computed(() => props.columns.find((c) => c.isTitle))

function rowTitle(row: Record<string, unknown>): string {
  if (props.titleKey) return String(row[props.titleKey ?? ''] ?? '')
  if (titleCol.value?.prop) return String(row[titleCol.value.prop ?? ''] ?? '')
  const first = props.columns.find((c) => c.prop)
  return first?.prop ? String(row[first.prop ?? ''] ?? '') : ''
}

// 卡片中渲染为 label/value 行的列（排除标题、操作、隐藏列）
const cardColumns = computed(() =>
  props.columns.filter((c) => !c.isTitle && !c.isActions && !c.hideInCard),
)
</script>

<template>
  <!-- 桌面端：el-table -->
  <el-table v-if="!isMobile" :data="data" v-loading="loading" :row-key="rowKey">
    <el-table-column
      v-for="(col, i) in columns"
      :key="col.prop || col.label || i"
      :prop="col.prop"
      :label="col.label"
      :width="col.width"
      :min-width="col.minWidth"
      :align="col.align"
      :show-overflow-tooltip="col.showOverflowTooltip"
      :class-name="col.nowrap ? 'rt-nowrap' : ''"
      :fixed="col.isActions ? 'right' : undefined"
    >
      <template #default="scope">
        <slot v-if="col.slot" :name="col.slot" :row="scope.row as any" :column="col" />
        <span v-else>{{ scope.row[col.prop ?? ''] }}</span>
      </template>
    </el-table-column>

    <!-- 空状态：图标 + 主文案 + 补充说明，比一行灰字更有指引性 -->
    <template #empty>
      <div v-if="!loading" class="flex flex-col items-center gap-2 py-10">
        <div class="grid size-12 place-items-center rounded-full bg-subtle" aria-hidden="true">
          <Inbox :size="22" class="text-muted" />
        </div>
        <p class="text-sm text-body">{{ emptyText }}</p>
        <p v-if="emptyHint" class="text-2xs text-muted">{{ emptyHint }}</p>
      </div>
    </template>
  </el-table>

  <!-- 移动端：卡片列表 -->
  <div v-else v-loading="loading" class="flex flex-col gap-3">
    <div
      v-if="!data.length && !loading"
      class="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface py-12"
    >
      <div class="grid size-12 place-items-center rounded-full bg-subtle" aria-hidden="true">
        <Inbox :size="22" class="text-muted" />
      </div>
      <p class="text-sm text-body">{{ emptyText }}</p>
      <p v-if="emptyHint" class="text-2xs text-muted">{{ emptyHint }}</p>
    </div>

    <article
      v-for="(row, index) in data"
      :key="String(row[rowKey ?? ''] ?? index)"
      class="rounded-lg border border-line bg-surface p-4 shadow-xs"
    >
      <h3 v-if="rowTitle(row)" class="mb-2 text-base font-semibold text-ink">
        {{ rowTitle(row) }}
      </h3>

      <dl class="flex flex-col">
        <div
          v-for="col in cardColumns"
          :key="col.prop || col.label"
          class="flex items-start justify-between gap-3 border-b border-line py-1.5 text-sm last:border-0"
        >
          <dt class="shrink-0 text-muted">{{ col.label }}</dt>
          <dd class="min-w-0 flex-1 text-right break-words text-body">
            <slot v-if="col.slot" :name="col.slot" :row="row as any" :column="col" />
            <span v-else>{{ row[col.prop ?? ''] }}</span>
          </dd>
        </div>
      </dl>

      <div
        v-if="actionCol"
        class="mt-3 flex flex-wrap gap-2 border-t border-line pt-3"
      >
        <slot :name="actionCol.slot || 'actions'" :row="row as any" :column="actionCol" />
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
/* 按列可选：nowrap 必须和 ellipsis 成对出现，否则窄列会串到隔壁列上 */
:deep(.el-table .rt-nowrap .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

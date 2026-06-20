<script setup lang="ts">
/**
 * 页头：标题 + 副标题 + 右侧操作区
 *
 * 全站统一的层级起点：h1 是页面唯一的顶级标题，副标题说明这块数据是什么，
 * 操作区放「新增」这类页面级动作。筛选条件属于内容区，不放在这里。
 */
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-3">
    <div class="min-w-0">
      <h1 class="text-xl font-semibold text-ink">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

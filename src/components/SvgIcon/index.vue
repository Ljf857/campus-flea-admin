<script setup lang="ts">
interface Props {
  name: string
  size?: number | string
  color?: string
}
const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor',
})
</script>

<template>
  <el-icon :size="props.size" :color="props.color">
    <component :is="props.name" />
  </el-icon>
</template>

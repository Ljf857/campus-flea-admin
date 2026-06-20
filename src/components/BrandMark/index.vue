<script setup lang="ts">
/**
 * 品牌标识：蓝色圆角方块 + 白色购物车图标。
 *
 * 侧栏、登录页大屏品牌区、登录页小屏品牌区三处共用，避免同一个标记散落三份、
 * 改一次要改三处（这三处此前都是硬编码的一个「跳」字）。
 */
withDefaults(
  defineProps<{
    /** sm = 32px（侧栏），md = 36px（登录页） */
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' },
)
</script>

<template>
  <span class="brand-mark" :class="`is-${size}`" aria-hidden="true">
    <svg class="brand-mark-icon" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M7,18c-1.1,0 -1.99,0.9 -1.99,2S5.9,22 7,22s2,-0.9 2,-2 -0.9,-2 -2,-2zM1,2v2h2l3.6,7.59 -1.35,2.45c-0.16,0.28 -0.25,0.61 -0.25,0.96 0,1.1 0.9,2 2,2h12v-2L7.42,15c-0.14,0 -0.25,-0.11 -0.25,-0.25l0.03,-0.12 0.9,-1.63h7.45c0.75,0 1.41,-0.41 1.75,-1.03l3.58,-6.49c0.08,-0.14 0.12,-0.31 0.12,-0.48 0,-0.55 -0.45,-1 -1,-1L5.21,4l-0.94,-2L1,2zM17,18c-1.1,0 -1.99,0.9 -1.99,2s0.89,2 1.99,2 2,-0.9 2,-2 -0.9,-2 -2,-2z"
      />
    </svg>
  </span>
</template>

<style scoped>
.brand-mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-brand);
  color: #fff;
}
.brand-mark.is-sm {
  width: 32px;
  height: 32px;
}
.brand-mark.is-md {
  width: 36px;
  height: 36px;
}

.brand-mark-icon {
  width: 62%;
  height: 62%;
  /* Material 图标路径本身带 2px 的视觉留白，靠尺寸比例已经够，无需再补 padding */
  display: block;
}
</style>

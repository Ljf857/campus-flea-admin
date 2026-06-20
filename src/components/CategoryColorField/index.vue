<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Moon, RefreshCw, Sun } from 'lucide-vue-next'
import {
  CONTRAST_LABEL,
  PRESET_COLOR_GROUPS,
  contrastLevel,
  contrastRatio,
  deriveDarkVariant,
  normalizeHex,
  resolveTileColors,
} from '@/utils/categoryColor'
import { findIconOption } from '@/constants/categoryIcons'

const props = withDefaults(
  defineProps<{
    color?: string
    colorDark?: string
    /** 当前分类图标，仅用于预览 */
    icon?: string
  }>(),
  {
    color: '',
    colorDark: '',
    icon: '',
  },
)

const emit = defineEmits<{
  'update:color': [value: string]
  'update:colorDark': [value: string]
}>()

/**
 * 是否跟随浅色值自动推导深色版。
 *
 * 默认开启：绝大多数分类不需要单独配色，自动推导既能省事，
 * 又能保证深浅两套色在色相上一致（手动配很容易配出两个不搭的颜色）。
 */
const autoDerive = ref(true)

const lightHex = computed(() => normalizeHex(props.color))
const darkHex = computed(() => normalizeHex(props.colorDark))

/**
 * 实际生效的配色。
 * ⚠️ 预览必须用这个而不是原始 hex——App 会把过浅的底色压暗，
 * 显示原始色等于给管理员看一个不存在的结果。
 */
const lightTile = computed(() => resolveTileColors(props.color, props.colorDark, false))
const darkTile = computed(() => resolveTileColors(props.color, props.colorDark, true))

const lightRatio = computed(() =>
  lightTile.value.raw ? contrastRatio(lightTile.value.background, lightTile.value.foreground) : 0,
)
const darkRatio = computed(() =>
  darkTile.value.raw ? contrastRatio(darkTile.value.background, darkTile.value.foreground) : 0,
)

const iconComponent = computed(() => findIconOption(props.icon || '')?.icon)

watch(
  () => props.color,
  (next) => {
    if (!autoDerive.value) return
    const hex = normalizeHex(next)
    if (!hex) return
    const derived = deriveDarkVariant(hex)
    if (derived !== normalizeHex(props.colorDark)) {
      emit('update:colorDark', derived)
    }
  },
  { immediate: true },
)

function pickLight(hex: string) {
  emit('update:color', hex)
}

function pickDark(hex: string) {
  autoDerive.value = false
  emit('update:colorDark', hex)
}

function regenerateDark() {
  const hex = normalizeHex(props.color)
  if (!hex) return
  autoDerive.value = true
  emit('update:colorDark', deriveDarkVariant(hex))
}

function toggleAutoDerive() {
  autoDerive.value = !autoDerive.value
  if (autoDerive.value) regenerateDark()
}
</script>

<template>
  <div class="color-field">
    <!-- 深浅两个色值 -->
    <div class="color-row">
      <div class="color-slot">
        <div class="color-slot-head">
          <Sun :size="13" />
          <span>浅色模式</span>
        </div>
        <div class="color-slot-body">
          <el-color-picker :model-value="color" @update:model-value="pickLight" />
          <code class="color-hex">{{ lightHex ?? '未设置' }}</code>
          <span v-if="lightHex" class="contrast-badge" :class="`is-${contrastLevel(lightRatio)}`">
            {{ lightRatio.toFixed(1) }}:1
          </span>
        </div>
        <p v-if="lightTile.adjusted" class="slot-note">
          底色过浅，App 会压暗为
          <span class="inline-swatch" :style="{ backgroundColor: lightTile.background }"></span>
          <code>{{ lightTile.background }}</code>
          以保证白色图标可读
        </p>
      </div>

      <div class="color-slot">
        <div class="color-slot-head">
          <Moon :size="13" />
          <span>深色模式</span>
          <button type="button" class="auto-toggle" @click="toggleAutoDerive">
            <span class="auto-box" :class="{ on: autoDerive }">
              <Check v-if="autoDerive" :size="10" :stroke-width="3" />
            </span>
            由浅色自动推导
          </button>
          <button
            v-if="autoDerive && color"
            type="button"
            class="regen-btn"
            title="重新推导"
            @click="regenerateDark"
          >
            <RefreshCw :size="12" />
          </button>
        </div>
        <div class="color-slot-body">
          <el-color-picker
            :model-value="colorDark"
            :disabled="autoDerive"
            @update:model-value="pickDark"
          />
          <code class="color-hex">{{ darkHex ?? '未设置' }}</code>
          <span v-if="darkHex" class="contrast-badge" :class="`is-${contrastLevel(darkRatio)}`">
            {{ darkRatio.toFixed(1) }}:1
          </span>
        </div>
        <p v-if="darkTile.adjusted" class="slot-note">
          同样会被压暗为
          <span class="inline-swatch" :style="{ backgroundColor: darkTile.background }"></span>
          <code>{{ darkTile.background }}</code>
        </p>
      </div>
    </div>

    <p class="color-hint">
      图标恒为白色，底色过浅时自动压暗到白图标可读的范围，因此对比度始终达标（{{
        CONTRAST_LABEL[contrastLevel(lightRatio)]
      }}）。留空则移动端退回主题容器色。
    </p>

    <!-- 预设色板 -->
    <div v-for="group in PRESET_COLOR_GROUPS" :key="group.label" class="preset-group">
      <div class="preset-label">{{ group.label }}</div>
      <div class="preset-swatches">
        <button
          v-for="hex in group.colors"
          :key="hex"
          type="button"
          class="swatch"
          :class="{ active: lightHex === hex }"
          :style="{ backgroundColor: hex }"
          :title="hex"
          @click="pickLight(hex)"
        >
          <Check v-if="lightHex === hex" :size="12" :stroke-width="3" />
        </button>
      </div>
    </div>

    <!-- 移动端预览：深浅并排 -->
    <div class="mobile-preview">
      <span class="shrink-0 text-2xs text-muted">移动端效果</span>

      <div class="preview-mode" :style="{ backgroundColor: '#F2F4F8' }">
        <span class="preview-tile" :style="{ backgroundColor: lightTile.background }">
          <component :is="iconComponent" v-if="iconComponent" :size="24" :color="lightTile.foreground" />
        </span>
        <span class="preview-caption" :style="{ color: '#5C5F66' }">浅色</span>
      </div>

      <div class="preview-mode" :style="{ backgroundColor: '#0B0C0E' }">
        <span class="preview-tile" :style="{ backgroundColor: darkTile.background }">
          <component :is="iconComponent" v-if="iconComponent" :size="24" :color="darkTile.foreground" />
        </span>
        <span class="preview-caption" :style="{ color: '#9BA0A8' }">深色</span>
      </div>

      <span class="text-2xs text-muted">切换下方主题按钮可直接看到真实效果。</span>
    </div>
  </div>
</template>

<style scoped>
.color-field {
  width: 100%;
}

.color-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-slot {
  flex: 1;
  min-width: 240px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}

.color-slot-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-body);
}

.color-slot-body {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-hex {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.slot-note {
  margin: 8px 0 0;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--text-muted);
}
.inline-swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 0 2px;
  vertical-align: -1px;
  border-radius: 3px;
  border: 1px solid rgb(15 23 42 / 0.12);
}

.contrast-badge {
  margin-left: auto;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.contrast-badge.is-excellent {
  background: var(--success-soft);
  color: var(--color-success-ink);
}
.contrast-badge.is-good {
  background: var(--brand-soft);
  color: var(--color-brand);
}
.contrast-badge.is-low {
  background: var(--warning-soft);
  color: var(--color-warning-ink);
}

.auto-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
  cursor: pointer;
}
.auto-toggle:hover {
  color: var(--color-brand);
}
.auto-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  color: #fff;
}
.auto-box.on {
  border-color: var(--color-brand);
  background: var(--color-brand);
}

.regen-btn {
  display: inline-flex;
  align-items: center;
  color: var(--text-muted);
  cursor: pointer;
}
.regen-btn:hover {
  color: var(--color-brand);
}

.color-hint {
  margin: 8px 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ---------- 预设色板 ---------- */
.preset-group {
  margin-top: 12px;
}
.preset-label {
  margin-bottom: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.preset-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgb(15 23 42 / 0.12);
  border-radius: var(--radius-sm);
  color: #fff;
  cursor: pointer;
  transition: transform 150ms var(--ease-out-quart);
}
.swatch:hover {
  transform: scale(1.1);
}
.swatch.active {
  outline: 2px solid var(--color-brand-ring);
  outline-offset: 1px;
}

/* ---------- 移动端预览 ---------- */
.mobile-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
  flex-wrap: wrap;
}

.preview-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: var(--radius-md);
}

.preview-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
}

.preview-caption {
  font-size: 0.75rem;
}
</style>

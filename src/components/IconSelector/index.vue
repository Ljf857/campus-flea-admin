<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { AlertTriangle, Check, Search, UploadCloud, X } from 'lucide-vue-next'
import { getToken } from '@/utils/storage'
import { resolveImageUrl } from '@/utils/image'
import {
  CATEGORY_ICON_GROUPS,
  findIconOption,
  isIconSupported,
  type CategoryIconOption,
} from '@/constants/categoryIcons'
import { resolveTileColors } from '@/utils/categoryColor'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    bizType?: string
    /** 移动端预览用的色块底色；为空时用中性容器色 */
    previewColor?: string
  }>(),
  {
    modelValue: '',
    bizType: 'category',
    previewColor: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)
const activeTab = ref<'library' | 'upload'>('library')
const search = ref('')
const uploading = ref(false)

const uploadAction = `${import.meta.env.VITE_API_BASE_URL || '/api'}/upload/image`

function isUrl(val: string): boolean {
  return val.startsWith('http://') || val.startsWith('https://')
}

/** 当前值对应的目录项（自定义上传的图片没有目录项） */
const currentOption = computed<CategoryIconOption | undefined>(() =>
  findIconOption(props.modelValue),
)

/**
 * 当前值移动端是否认得。
 *
 * 不认得的典型来源是历史数据：以前后台的可选图标和移动端的映射表不是同一份，
 * 选了移动端没有的名字，App 会静默回退成通用图标。这里把它显式标出来，
 * 让管理员有机会修掉，而不是继续在两边都无感知的状态下运行。
 */
const unsupported = computed(() => !isIconSupported(props.modelValue))

/**
 * 预览色块。
 * 必须走 resolveTileColors 而不是直接用原始色：App 会把过浅的底色压暗、
 * 并恒用白色图标，这里若显示原始色，管理员看到的就不是 App 上的效果。
 */
const previewTile = computed(() => resolveTileColors(props.previewColor, null, false))

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return CATEGORY_ICON_GROUPS
  return CATEGORY_ICON_GROUPS.map((g) => ({
    group: g.group,
    options: g.options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    ),
  })).filter((g) => g.options.length > 0)
})

const totalMatches = computed(() =>
  filteredGroups.value.reduce((sum, g) => sum + g.options.length, 0),
)

/** 打开时重置搜索，避免上次的关键词让人以为图标变少了 */
watch(visible, (open) => {
  if (open) search.value = ''
})

function select(icon: string) {
  emit('update:modelValue', icon)
  visible.value = false
}

function clearIcon() {
  emit('update:modelValue', '')
}

function handleUploadSuccess(response: { data?: { url?: string } }) {
  uploading.value = false
  const url = response?.data?.url as string | undefined
  if (!url) {
    ElMessage.error('上传响应异常')
    return
  }
  emit('update:modelValue', url)
  visible.value = false
}

function handleUploadError() {
  uploading.value = false
  ElMessage.error('上传失败')
}

function beforeUpload(file: File) {
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
  if (!isImage) {
    ElMessage.error('仅支持图片格式')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片不能超过 10MB')
    return false
  }
  return true
}
</script>

<template>
  <div class="icon-selector">
    <!-- 触发器：直接画出图标，而不是让人读图标名的前两个字母 -->
    <button
      type="button"
      class="trigger"
      :class="{ 'is-empty': !modelValue }"
      @click="visible = true"
    >
      <span class="trigger-preview" :style="{ backgroundColor: previewTile.background }">
        <img
          v-if="modelValue && isUrl(modelValue)"
          :src="resolveImageUrl(modelValue)"
          alt=""
          class="size-full object-cover"
        />
        <component
          v-else-if="currentOption"
          :is="currentOption.icon"
          :size="20"
          :color="previewTile.foreground"
        />
        <span v-else-if="modelValue" class="text-[11px] font-semibold" :style="{ color: previewTile.foreground }">
          ?
        </span>
      </span>

      <span class="trigger-text">
        <span v-if="currentOption" class="trigger-label">{{ currentOption.label }}</span>
        <span v-else-if="modelValue && isUrl(modelValue)" class="trigger-label">自定义图标</span>
        <span v-else-if="modelValue" class="trigger-label trigger-label--warn">{{ modelValue }}</span>
        <span v-else class="trigger-placeholder">点击选择图标</span>
      </span>

      <span v-if="modelValue" class="trigger-clear" title="清除" @click.stop="clearIcon">
        <X :size="14" />
      </span>
    </button>

    <p v-if="unsupported" class="mt-1 flex items-start gap-1 text-2xs text-warning-ink">
      <AlertTriangle :size="12" class="mt-[2px] shrink-0" />
      <span>「{{ modelValue }}」移动端不认识，会显示成通用图标，建议重新选择一个。</span>
    </p>

    <el-dialog v-model="visible" title="选择分类图标" width="720px" append-to-body>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="图标库" name="library">
          <div class="mb-3 flex items-center gap-3">
            <el-input
              v-model="search"
              placeholder="搜索含义或图标名，如「耳机」「Headphones」"
              clearable
              class="flex-1"
            >
              <template #prefix><Search :size="14" /></template>
            </el-input>
            <span class="shrink-0 text-2xs text-muted">{{ totalMatches }} 个图标</span>
          </div>

          <div class="icon-scroll">
            <div v-for="g in filteredGroups" :key="g.group" class="mb-4 last:mb-0">
              <div class="mb-2 text-2xs font-semibold text-muted">{{ g.group }}</div>
              <div class="icon-grid">
                <button
                  v-for="opt in g.options"
                  :key="opt.value"
                  type="button"
                  class="icon-cell"
                  :class="{ active: modelValue === opt.value }"
                  :title="`${opt.label}（${opt.value}）`"
                  @click="select(opt.value)"
                >
                  <component :is="opt.icon" :size="22" />
                  <span class="icon-cell-label">{{ opt.label }}</span>
                  <span v-if="modelValue === opt.value" class="icon-cell-check">
                    <Check :size="10" :stroke-width="3" />
                  </span>
                </button>
              </div>
            </div>

            <div v-if="totalMatches === 0" class="py-10 text-center text-sm text-muted">
              没有匹配的图标，试试别的关键词，或改用「自定义上传」
            </div>
          </div>

          <!-- 移动端预览：色块 + 图标，与 App 分类页的呈现一致 -->
          <div class="preview-bar">
            <span class="shrink-0 text-2xs text-muted">移动端效果</span>
            <div class="preview-cell">
              <span class="preview-tile" :style="{ backgroundColor: previewTile.background }">
                <component
                  v-if="currentOption"
                  :is="currentOption.icon"
                  :size="24"
                  :color="previewTile.foreground"
                />
                <img
                  v-else-if="modelValue && isUrl(modelValue)"
                  :src="resolveImageUrl(modelValue)"
                  alt=""
                  class="size-full object-cover"
                />
                <AlertTriangle v-else :size="20" :color="previewTile.foreground" />
              </span>
              <span class="text-2xs text-muted">{{ currentOption?.label ?? '未选择' }}</span>
            </div>
            <span class="text-2xs text-muted">
              预览图形来自 Lucide，移动端实际使用 Material 图标，形状略有差异，请按<strong>含义</strong>选择。
            </span>
          </div>
        </el-tab-pane>

        <el-tab-pane label="自定义上传" name="upload">
          <div class="flex justify-center py-8">
            <el-upload
              :action="uploadAction"
              :headers="{ Authorization: `Bearer ${getToken()}` }"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :on-progress="() => (uploading = true)"
              :data="{ type: bizType }"
              accept="image/jpeg,image/png,image/webp,image/gif"
              name="file"
            >
              <div class="upload-area">
                <UploadCloud :size="28" />
                <span>{{ uploading ? '上传中…' : '点击上传自定义图标' }}</span>
                <span class="text-2xs text-muted">支持 jpg / png / webp，不超过 10MB</span>
              </div>
            </el-upload>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ---------- 触发器 ---------- */
.trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 32px;
  padding: 0 10px 0 4px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  cursor: pointer;
  transition: border-color 150ms var(--ease-out-quart);
}
.trigger:hover {
  border-color: var(--color-brand);
}
.trigger.is-empty {
  border-style: dashed;
}

.trigger-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  color: #fff;
}

.trigger-text {
  flex: 1;
  min-width: 0;
  text-align: left;
}
.trigger-label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.trigger-label--warn {
  color: var(--color-warning-ink);
}
.trigger-placeholder {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.trigger-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  color: var(--text-muted);
}
.trigger-clear:hover {
  background: var(--bg-hover);
  color: var(--text-body);
}

/* ---------- 图标网格 ---------- */
.icon-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: 8px;
}

.icon-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 4px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-body);
  cursor: pointer;
  transition:
    border-color 150ms var(--ease-out-quart),
    background-color 150ms var(--ease-out-quart),
    color 150ms var(--ease-out-quart);
}
.icon-cell:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
  background: var(--brand-soft);
}
.icon-cell.active {
  border-color: var(--color-brand);
  color: var(--color-brand);
  background: var(--brand-soft);
}

.icon-cell-label {
  font-size: 0.75rem;
  line-height: 1.2;
  text-align: center;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.icon-cell.active .icon-cell-label,
.icon-cell:hover .icon-cell-label {
  color: var(--color-brand);
}

.icon-cell-check {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--color-brand);
  color: #fff;
}

/* ---------- 移动端预览 ---------- */
.preview-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
}

.preview-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.preview-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* ---------- 上传 ---------- */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 320px;
  padding: 32px 0;
  border: 2px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  color: var(--text-body);
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    border-color 150ms var(--ease-out-quart),
    color 150ms var(--ease-out-quart);
}
.upload-area:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
</style>

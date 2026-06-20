<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/storage'
import { resolveImageUrl } from '@/utils/image'

const props = withDefaults(defineProps<{
  modelValue?: string
  bizType?: string
  tip?: string
}>(), {
  modelValue: '',
  bizType: 'common',
  tip: '建议尺寸 16:9，支持 jpg/png/webp，不超过 10MB',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uploading = ref(false)
const previewUrl = ref(props.modelValue)

watch(() => props.modelValue, (val) => { previewUrl.value = val || '' })

const actionUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/upload/image`

function onSuccess(response: { data?: { url?: string } }) {
  uploading.value = false
  const url = response?.data?.url as string | undefined
  if (!url) { ElMessage.error('上传响应异常'); return }
  previewUrl.value = url
  emit('update:modelValue', url)
}

function onError() {
  uploading.value = false
  ElMessage.error('上传失败')
}

function beforeUpload(file: File) {
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
  if (!isImage) { ElMessage.error('仅支持 jpg/png/webp/gif 格式'); return false }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) { ElMessage.error('图片不能超过 10MB'); return false }
  return true
}

async function handleRemove() {
  previewUrl.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="image-upload">
    <el-upload
      ref="uploadRef"
      :action="actionUrl"
      :headers="{ Authorization: `Bearer ${getToken()}` }"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="onSuccess"
      :on-error="onError"
      :on-progress="() => { uploading = true }"
      :data="{ type: bizType }"
      accept="image/jpeg,image/png,image/webp,image/gif"
      name="file"
    >
      <div v-if="!previewUrl" class="upload-placeholder">
        <el-icon :size="24"><Plus /></el-icon>
        <span>{{ uploading ? '上传中...' : '点击上传' }}</span>
      </div>
      <div v-else class="preview-wrapper">
        <el-image :src="resolveImageUrl(previewUrl)" fit="cover" class="preview-img" :preview-src-list="[resolveImageUrl(previewUrl)]" preview-teleported />
        <div class="preview-overlay">
          <el-icon :size="18" class="overlay-icon" @click.stop="handleRemove"><Delete /></el-icon>
        </div>
      </div>
    </el-upload>
    <p class="upload-tip">{{ tip }}</p>
  </div>
</template>

<style scoped lang="scss">
.image-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  max-width: 100%;
}

/* 用语义 token 而不是写死的十六进制：写死的话深色模式不会跟着变 */
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 90px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background-color: var(--bg-subtle);
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
  gap: 6px;
  transition:
    border-color 150ms var(--ease-out-quart),
    color 150ms var(--ease-out-quart);

  &:hover {
    border-color: var(--color-brand);
    color: var(--color-brand);
  }
}

.preview-wrapper {
  position: relative;
  width: 160px;
  height: 90px;
  border-radius: var(--radius-md);
  overflow: hidden;
  &:hover .preview-overlay { opacity: 1; }
}

.preview-img {
  width: 100%;
  height: 100%;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s;
}

/* 压在深色蒙层上，白色是唯一正确选择，与主题无关 */
.overlay-icon {
  color: #fff;
  cursor: pointer;
  padding: 4px;
  &:hover { color: var(--color-danger); }
}

.upload-tip {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
</style>

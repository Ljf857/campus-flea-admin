<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import { getFileListApi, deleteFileApi } from '@/api/modules/file'
import { uploadImageApi } from '@/api/modules/upload'
import type { FileRecord } from '@/api/types/admin'
import type { PageResult } from '@/api/types/common'
import { resolveImageUrl } from '@/utils/image'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 80, hideInCard: true },
  { prop: 'originalName', label: '文件名', minWidth: 220, showOverflowTooltip: true, isTitle: true },
  { prop: 'fileType', label: '类型', width: 110 },
  { prop: 'bizType', label: '业务类型', width: 110 },
  { prop: 'fileSize', label: '大小', width: 110, slot: 'fileSize' },
  { prop: 'uploaderId', label: '上传者', width: 90 },
  { label: '预览', width: 100, slot: 'preview' },
  { prop: 'createTime', label: '上传时间', width: 180 },
  { label: '操作', width: 90, isActions: true, slot: 'actions' },
]

const loading = ref(false)
const list = ref<FileRecord[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })
const uploadLoading = ref(false)

async function handleUpload(file: File) {
  uploadLoading.value = true
  try {
    await uploadImageApi(file, 'common')
    ElMessage.success('上传成功')
    fetchData()
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    uploadLoading.value = false
  }
}

function onUploadChange(file: UploadFile) {
  if (file.raw) handleUpload(file.raw)
  return false
}

async function fetchData() {
  loading.value = true
  try { const res = await getFileListApi(query) as PageResult<FileRecord>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

async function handleDelete(row: FileRecord) {
  try { await ElMessageBox.confirm(`确定删除文件「${row.originalName}」吗？`, '警告', { type: 'error' }) } catch { return }
  await deleteFileApi(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="文件管理" description="管理平台上传的图片等资源文件，删除前请确认未被业务引用">
      <template #actions>
        <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onUploadChange">
          <el-button type="primary" :loading="uploadLoading">
            {{ uploadLoading ? '上传中…' : '上传文件' }}
          </el-button>
        </el-upload>
      </template>
    </PageHeader>

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="originalName"
        empty-text="还没有上传任何文件"
        empty-hint="点击右上角「上传文件」开始"
      >
        <template #fileSize="{ row }">
          <span class="tabular">{{ formatSize(row.fileSize) }}</span>
        </template>
        <template #preview="{ row }">
          <el-image
            v-if="row.fileType?.startsWith('image')"
            :src="resolveImageUrl(row.fileUrl)"
            :preview-src-list="[resolveImageUrl(row.fileUrl)]"
            preview-teleported
            fit="cover"
            class="size-12 rounded-sm border border-line"
          />
          <span v-else class="text-muted">—</span>
        </template>
        <template #actions="{ row }">
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </ResponsiveTable>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50]"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </section>
  </div>
</template>

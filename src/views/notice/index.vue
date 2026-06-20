<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getNoticeListApi, addNoticeApi, updateNoticeApi, deleteNoticeApi } from '@/api/modules/notice'
import { NOTICE_TYPE } from '@/constants'
import type { Notice } from '@/api/types/admin'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 80, hideInCard: true },
  { prop: 'title', label: '标题', minWidth: 220, showOverflowTooltip: true, isTitle: true },
  { prop: 'type', label: '类型', width: 110, slot: 'type' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'publishTime', label: '发布时间', width: 180 },
  { label: '操作', width: 140, isActions: true, slot: 'actions' },
]

const loading = ref(false)
const list = ref<Notice[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = reactive({ id: 0, title: '', content: '', type: 1, status: 1 })

async function fetchData() {
  loading.value = true
  try { const res = await getNoticeListApi(query) as PageResult<Notice>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function openAdd() { isEdit.value = false; Object.assign(form, { id: 0, title: '', content: '', type: 1, status: 1 }); dialogVisible.value = true }

function openEdit(row: Notice) { isEdit.value = true; Object.assign(form, { id: row.id, title: row.title, content: row.content, type: row.type, status: row.status }); dialogVisible.value = true }

async function handleSubmit() {
  if (!form.title || !form.content) { ElMessage.warning('请填写完整信息'); return }
  saving.value = true
  try {
    if (isEdit.value) { await updateNoticeApi(form.id, form); ElMessage.success('修改成功') }
    else { await addNoticeApi(form); ElMessage.success('发布成功') }
    dialogVisible.value = false
    fetchData()
  } finally { saving.value = false }
}

async function handleDelete(row: Notice) {
  try { await ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '警告', { type: 'error' }) } catch { return }
  await deleteNoticeApi(row.id); ElMessage.success('删除成功'); fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="公告管理" description="发布与维护面向全体用户的平台公告">
      <template #actions>
        <el-button type="primary" @click="openAdd">发布公告</el-button>
      </template>
    </PageHeader>

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="title"
        empty-text="还没有发布公告"
        empty-hint="点击右上角「发布公告」撰写第一条"
      >
        <template #type="{ row }">{{ NOTICE_TYPE[row.type] || '-' }}</template>
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '发布' : '草稿' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="warning" link @click="openEdit(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="600px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="公告标题" maxlength="100" show-word-limit /></el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio v-for="(v, k) in NOTICE_TYPE" :key="k" :value="Number(k)">{{ v }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="公告内容" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">发布</el-radio>
            <el-radio :value="0">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

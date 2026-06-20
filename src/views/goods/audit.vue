<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingGoodsApi, auditGoodsApi } from '@/api/modules/goods'
import type { Goods } from '@/api/types/goods'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const loading = ref(false)
const list = ref<Goods[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 80, hideInCard: true },
  { prop: 'title', label: '商品标题', minWidth: 220, showOverflowTooltip: true, isTitle: true },
  { prop: 'price', label: '售价', width: 110, slot: 'price' },
  { prop: 'categoryName', label: '分类', width: 110 },
  { prop: 'sellerId', label: '卖家ID', width: 90 },
  { prop: 'createTime', label: '提交时间', width: 180 },
  { label: '操作', width: 100, isActions: true, slot: 'actions' },
]

const dialogVisible = ref(false)
const currentItem = ref<Goods | null>(null)
const submitting = ref(false)
const auditForm = reactive({ verifyStatus: 1, rejectReason: '' })

async function fetchData() {
  loading.value = true
  try { const res = await getPendingGoodsApi(query) as PageResult<Goods>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function openAudit(item: Goods) {
  currentItem.value = item
  auditForm.verifyStatus = 1
  auditForm.rejectReason = ''
  dialogVisible.value = true
}

async function handleAudit() {
  if (!currentItem.value) return
  if (auditForm.verifyStatus === 2 && !auditForm.rejectReason) { ElMessage.warning('请填写驳回原因'); return }
  submitting.value = true
  try {
    await auditGoodsApi(currentItem.value.id, auditForm)
    ElMessage.success('审核完成')
    dialogVisible.value = false
    fetchData()
  } finally { submitting.value = false }
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="商品审核" description="审核用户新提交的商品，通过后才会在平台展示">
      <template #actions>
        <el-button @click="fetchData">刷新</el-button>
      </template>
    </PageHeader>

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="title"
        empty-text="没有待审核的商品"
        empty-hint="所有提交都已审核完毕"
      >
        <template #price="{ row }">
          <span class="tabular font-semibold text-ink">¥{{ row.price.toFixed(2) }}</span>
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link @click="openAudit(row)">审核</el-button>
        </template>
      </ResponsiveTable>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchData"
      />
    </section>

    <el-dialog v-model="dialogVisible" title="审核商品" width="520px">
      <el-form label-width="80px">
        <el-form-item label="商品标题">{{ currentItem?.title }}</el-form-item>
        <el-form-item label="售价">¥{{ currentItem?.price?.toFixed(2) }}</el-form-item>
        <el-form-item label="描述">{{ currentItem?.description || '—' }}</el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.verifyStatus">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.verifyStatus === 2" label="驳回原因">
          <el-input v-model="auditForm.rejectReason" type="textarea" :rows="3" placeholder="请说明驳回原因，用户可见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAudit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

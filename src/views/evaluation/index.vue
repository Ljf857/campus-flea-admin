<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEvaluationListApi, deleteEvaluationApi } from '@/api/modules/evaluation'
import type { Evaluation } from '@/api/types/order'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 80, hideInCard: true },
  { prop: 'orderId', label: '订单ID', width: 90 },
  { prop: 'goodsId', label: '商品ID', width: 90 },
  { prop: 'evaluatorId', label: '评价人ID', width: 100 },
  { prop: 'rating', label: '评分', width: 140, slot: 'rating' },
  { prop: 'content', label: '评价内容', minWidth: 260, isTitle: true },
  { prop: 'createTime', label: '评价时间', width: 180 },
  { label: '操作', width: 90, isActions: true, slot: 'actions' },
]

const loading = ref(false)
const list = ref<Evaluation[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })

async function fetchData() {
  loading.value = true
  try { const res = await getEvaluationListApi(query) as PageResult<Evaluation>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

async function handleDelete(row: Evaluation) {
  try { await ElMessageBox.confirm('确定要删除此评价吗？删除后不可恢复。', '警告', { type: 'error' }) } catch { return }
  await deleteEvaluationApi(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="评价管理" description="查看交易评价，删除含辱骂、广告等违规内容的评价" />

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="content"
        empty-text="还没有交易评价"
        empty-hint="订单完成后，买卖双方的评价会显示在这里"
      >
        <template #rating="{ row }">
          <el-rate :model-value="row.rating" disabled size="small" />
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

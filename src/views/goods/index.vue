<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGoodsListApi, offlineGoodsApi, deleteGoodsApi } from '@/api/modules/goods'
import { GOODS_STATUS } from '@/constants'
import type { Goods } from '@/api/types/goods'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const loading = ref(false)
const list = ref<Goods[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '', status: undefined as number | undefined, categoryId: undefined as number | undefined })

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 70, hideInCard: true },
  { prop: 'title', label: '商品标题', minWidth: 180, showOverflowTooltip: true, isTitle: true },
  { prop: 'price', label: '售价', width: 90, slot: 'price' },
  { prop: 'categoryName', label: '分类', width: 90 },
  { prop: 'sellerId', label: '卖家ID', width: 80, hideInCard: true },
  { prop: 'viewCount', label: '浏览', width: 70 },
  { prop: 'favoriteCount', label: '收藏', width: 70 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'publishTime', label: '发布时间', width: 170 },
  { label: '操作', width: 140, isActions: true, slot: 'actions' },
]

const hasFilter = computed(() => Boolean(query.keyword || query.status !== undefined))

async function fetchData() {
  loading.value = true
  try { const res = await getGoodsListApi(query) as PageResult<Goods>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function handleSearch() {
  query.page = 1
  fetchData()
}

async function handleOffline(row: Goods) {
  try { await ElMessageBox.confirm(`确定要下架「${row.title}」吗？`, '提示', { type: 'warning' }) } catch { return }
  await offlineGoodsApi(row.id, '管理员下架')
  ElMessage.success('下架成功')
  fetchData()
}

async function handleDelete(row: Goods) {
  try { await ElMessageBox.confirm(`确定要删除「${row.title}」吗？删除后不可恢复。`, '警告', { type: 'error' }) } catch { return }
  await deleteGoodsApi(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="商品管理" description="查看与维护平台在架商品，支持下架和删除违规内容" />

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="商品标题" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" @change="handleSearch">
            <el-option v-for="(v, k) in GOODS_STATUS" :key="k" :label="v.label" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="title"
        empty-text="没有符合条件的商品"
        :empty-hint="hasFilter ? '换个关键词或调整筛选条件再试' : '平台还没有发布商品'"
      >
        <template #price="{ row }">
          <span class="tabular font-semibold text-ink">¥{{ row.price.toFixed(2) }}</span>
        </template>
        <template #status="{ row }">
          <el-tag :type="(GOODS_STATUS[row.status]?.type as any)" size="small">
            {{ GOODS_STATUS[row.status]?.label }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button v-if="row.status === 1" type="warning" link @click="handleOffline(row)">下架</el-button>
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

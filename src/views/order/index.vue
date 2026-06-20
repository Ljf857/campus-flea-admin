<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getOrderListApi } from '@/api/modules/order'
import { ORDER_STATUS, DELIVERY_TYPE } from '@/constants'
import type { Order } from '@/api/types/order'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const loading = ref(false)
const list = ref<Order[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '', status: undefined as number | undefined })
const dialogVisible = ref(false)
const currentItem = ref<Order | null>(null)

const columns: RTColumn[] = [
  { prop: 'orderNo', label: '订单编号', width: 170 },
  { prop: 'goodsTitle', label: '商品标题', minWidth: 200, showOverflowTooltip: true, isTitle: true },
  { prop: 'goodsPrice', label: '金额', width: 100, slot: 'goodsPrice' },
  { prop: 'buyerId', label: '买家ID', width: 80, hideInCard: true },
  { prop: 'sellerId', label: '卖家ID', width: 80, hideInCard: true },
  { prop: 'deliveryType', label: '交易方式', width: 100, slot: 'deliveryType' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createTime', label: '下单时间', width: 170 },
  { label: '操作', width: 80, isActions: true, slot: 'actions' },
]

const hasFilter = computed(() => Boolean(query.keyword || query.status !== undefined))

async function fetchData() {
  loading.value = true
  try { const res = await getOrderListApi(query) as PageResult<Order>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function handleSearch() {
  query.page = 1
  fetchData()
}

function viewDetail(item: Order) { currentItem.value = item; dialogVisible.value = true }

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="订单管理" description="查看平台交易订单及其流转状态，点击可查看交易详情" />

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="订单号 / 商品标题" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" @change="handleSearch">
            <el-option v-for="(v, k) in ORDER_STATUS" :key="k" :label="v.label" :value="Number(k)" />
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
        title-key="goodsTitle"
        empty-text="没有符合条件的订单"
        :empty-hint="hasFilter ? '换个关键词或调整筛选条件再试' : '平台还没有产生订单'"
      >
        <template #goodsPrice="{ row }">
          <span class="tabular font-semibold text-ink">¥{{ row.goodsPrice.toFixed(2) }}</span>
        </template>
        <template #deliveryType="{ row }">{{ DELIVERY_TYPE[row.deliveryType] || '-' }}</template>
        <template #status="{ row }">
          <el-tag :type="(ORDER_STATUS[row.status]?.type as any)" size="small">
            {{ ORDER_STATUS[row.status]?.label }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
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

    <el-dialog v-model="dialogVisible" title="订单详情" width="600px">
      <el-descriptions :column="appStore.isMobile ? 1 : 2" border>
        <el-descriptions-item label="订单编号">{{ currentItem?.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="(ORDER_STATUS[currentItem?.status ?? 0]?.type as any)">
            {{ ORDER_STATUS[currentItem?.status ?? 0]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="商品标题" :span="2">{{ currentItem?.goodsTitle }}</el-descriptions-item>
        <el-descriptions-item label="商品价格">¥{{ currentItem?.goodsPrice?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="交易方式">{{ DELIVERY_TYPE[currentItem?.deliveryType ?? 0] }}</el-descriptions-item>
        <el-descriptions-item label="买家ID">{{ currentItem?.buyerId }}</el-descriptions-item>
        <el-descriptions-item label="卖家ID">{{ currentItem?.sellerId }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentItem?.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ currentItem?.createTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

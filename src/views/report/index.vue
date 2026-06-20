<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getReportListApi, handleReportApi } from '@/api/modules/report'
import { REPORT_STATUS } from '@/constants'
import type { Report } from '@/api/types/goods'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 70, isTitle: true, hideInCard: true },
  { prop: 'goodsId', label: '商品ID', width: 80 },
  { prop: 'reason', label: '举报原因', width: 110 },
  { prop: 'description', label: '描述', minWidth: 220, showOverflowTooltip: true },
  { prop: 'reporterId', label: '举报人ID', width: 90 },
  { prop: 'handleStatus', label: '处理状态', width: 100, slot: 'handleStatus' },
  { prop: 'handleResult', label: '处理结果', minWidth: 160, showOverflowTooltip: true },
  { prop: 'createTime', label: '举报时间', width: 170 },
  { label: '操作', width: 80, isActions: true, slot: 'actions' },
]

const loading = ref(false)
const list = ref<Report[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, handleStatus: undefined as number | undefined })
const dialogVisible = ref(false)
const currentItem = ref<Report | null>(null)
const form = reactive({ handleStatus: 1, handleResult: '', action: '' })

const hasFilter = computed(() => query.handleStatus !== undefined)

async function fetchData() {
  loading.value = true
  try { const res = await getReportListApi(query) as PageResult<Report>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function handleSearch() {
  query.page = 1
  fetchData()
}

function openHandle(item: Report) {
  currentItem.value = item
  form.handleStatus = 1
  form.handleResult = ''
  form.action = ''
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!currentItem.value) return
  if (!form.handleResult) { ElMessage.warning('请填写处理结果'); return }
  await handleReportApi(currentItem.value.id, form)
  ElMessage.success('处理完成')
  dialogVisible.value = false
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="举报管理" description="处理用户提交的举报，可联动警告用户、下架商品或封禁账号" />

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="状态">
          <el-select v-model="query.handleStatus" clearable placeholder="全部" @change="handleSearch">
            <el-option v-for="(v, k) in REPORT_STATUS" :key="k" :label="v.label" :value="Number(k)" />
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
        title-key="id"
        empty-text="没有符合条件的举报"
        :empty-hint="hasFilter ? '换个筛选条件再试' : '当前没有待处理的举报'"
      >
        <template #handleStatus="{ row }">
          <el-tag :type="(REPORT_STATUS[row.handleStatus]?.type as any)" size="small">
            {{ REPORT_STATUS[row.handleStatus]?.label }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button v-if="row.handleStatus === 0" type="primary" link @click="openHandle(row)">处理</el-button>
          <span v-else class="text-muted">—</span>
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

    <el-dialog v-model="dialogVisible" title="处理举报" width="520px">
      <el-form label-width="80px">
        <el-form-item label="举报原因">{{ currentItem?.reason }}</el-form-item>
        <el-form-item label="描述">{{ currentItem?.description }}</el-form-item>
        <el-form-item label="处理结果">
          <el-radio-group v-model="form.handleStatus">
            <el-radio :value="1">已处理</el-radio>
            <el-radio :value="2">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="form.handleResult" type="textarea" :rows="3" placeholder="请填写处理结果说明，将记录在案" />
        </el-form-item>
        <el-form-item label="联动操作">
          <el-select v-model="form.action" clearable placeholder="不联动">
            <el-option label="警告用户" value="warn" />
            <el-option label="下架商品" value="offline" />
            <el-option label="封禁账号" value="ban" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

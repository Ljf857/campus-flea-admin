<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getLogListApi } from '@/api/modules/log'
import type { OperationLog } from '@/api/types/admin'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 70, hideInCard: true },
  { prop: 'operatorName', label: '操作人', width: 110, isTitle: true },
  { prop: 'module', label: '模块', width: 90 },
  { prop: 'operation', label: '操作', width: 130 },
  { prop: 'requestUrl', label: '请求URL', minWidth: 200, showOverflowTooltip: true },
  { prop: 'ip', label: 'IP', width: 130 },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'costTime', label: '耗时(ms)', width: 90, slot: 'costTime' },
  { prop: 'createTime', label: '操作时间', width: 170 },
]

const loading = ref(false)
const list = ref<OperationLog[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, module: '', operator: '', startTime: '', endTime: '' })
const modules = ['认证', '用户', '商品', '订单', '分类', '轮播图', '公告', '举报', '评价', '管理员', '设置', '文件']

async function fetchData() {
  loading.value = true
  try { const res = await getLogListApi(query) as PageResult<OperationLog>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function handleQuery() { query.page = 1; fetchData() }

function resetQuery() {
  Object.assign(query, { page: 1, module: '', operator: '', startTime: '', endTime: '' })
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="操作日志" description="审计管理员在后台的每一次写操作，用于问题追溯" />

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <el-form inline @submit.prevent="handleQuery">
        <el-form-item label="模块">
          <el-select v-model="query.module" clearable placeholder="全部" @change="handleQuery">
            <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="query.operator" placeholder="操作人" clearable class="md:!w-36" @clear="handleQuery" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="query.startTime" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" @change="handleQuery" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="query.endTime" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" @change="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="operatorName"
        empty-text="没有符合条件的日志"
        empty-hint="调整模块、操作人或时间范围再试"
      >
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
        <template #costTime="{ row }">
          <span class="tabular" :class="row.costTime > 1000 ? 'text-warning-ink' : ''">
            {{ row.costTime }}
          </span>
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

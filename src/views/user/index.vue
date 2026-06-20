<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserListApi, updateUserStatusApi } from '@/api/modules/user'
import { VERIFY_STATUS, USER_STATUS } from '@/constants'
import type { UserInfo } from '@/api/types/user'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const loading = ref(false)
const list = ref<UserInfo[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '', verifyStatus: undefined as number | undefined, status: undefined as number | undefined })

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 80, hideInCard: true },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'nickname', label: '昵称', width: 120, isTitle: true },
  { prop: 'gender', label: '性别', width: 70, slot: 'gender' },
  { prop: 'campus', label: '校区', width: 100 },
  { prop: 'verifyStatus', label: '认证状态', width: 110, slot: 'verifyStatus' },
  { prop: 'status', label: '账号状态', width: 110, slot: 'status' },
  { prop: 'registerTime', label: '注册时间', width: 180 },
  { label: '操作', width: 100, isActions: true, slot: 'actions' },
]

const hasFilter = computed(() => Boolean(query.keyword || query.verifyStatus !== undefined || query.status !== undefined))

async function fetchData() {
  loading.value = true
  try {
    const res = await getUserListApi(query) as PageResult<UserInfo>
    list.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}

/** 筛选条件变化时回到第一页，否则会停在一个空的高页码上 */
function handleSearch() {
  query.page = 1
  fetchData()
}

async function handleToggleStatus(row: UserInfo) {
  const newStatus = row.status === 1 ? 0 : 1
  const label = newStatus === 0 ? '禁用' : '启用'
  try { await ElMessageBox.confirm(`确定要${label}用户「${row.nickname}」吗？`, '提示', { type: 'warning' }) } catch { return }
  await updateUserStatusApi(row.id, newStatus)
  ElMessage.success(`${label}成功`)
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="用户管理" description="查看平台注册用户，管理账号状态与实名认证进度" />

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="手机号 / 昵称" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="认证状态">
          <el-select v-model="query.verifyStatus" clearable placeholder="全部" @change="handleSearch">
            <el-option v-for="(v, k) in VERIFY_STATUS" :key="k" :label="v.label" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select v-model="query.status" clearable placeholder="全部" @change="handleSearch">
            <el-option v-for="(v, k) in USER_STATUS" :key="k" :label="v.label" :value="Number(k)" />
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
        title-key="nickname"
        empty-text="没有符合条件的用户"
        :empty-hint="hasFilter ? '换个关键词或调整筛选条件再试' : '平台还没有注册用户'"
      >
        <template #gender="{ row }">{{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '未知' }}</template>
        <template #verifyStatus="{ row }">
          <el-tag :type="(VERIFY_STATUS[row.verifyStatus]?.type as any)" size="small">
            {{ VERIFY_STATUS[row.verifyStatus]?.label }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-tag :type="(USER_STATUS[row.status]?.type as any)" size="small">
            {{ USER_STATUS[row.status]?.label }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button :type="row.status === 1 ? 'danger' : 'success'" link @click="handleToggleStatus(row)">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
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

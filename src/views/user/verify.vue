<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingVerifyApi, auditVerifyApi } from '@/api/modules/user'
import { VERIFY_STATUS } from '@/constants'
import type { UserVerify } from '@/api/types/user'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const loading = ref(false)
const list = ref<UserVerify[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 80, hideInCard: true },
  { prop: 'userId', label: '用户ID', width: 90 },
  { prop: 'realName', label: '真实姓名', width: 130, isTitle: true },
  { prop: 'studentNo', label: '学号', width: 140 },
  { prop: 'verifyStatus', label: '状态', width: 110, slot: 'verifyStatus' },
  { prop: 'createTime', label: '申请时间', width: 180 },
  { label: '操作', width: 100, isActions: true, slot: 'actions' },
]

const dialogVisible = ref(false)
const currentItem = ref<UserVerify | null>(null)
const submitting = ref(false)
const auditForm = reactive({ verifyStatus: 1, rejectReason: '' })

async function fetchData() {
  loading.value = true
  try { const res = await getPendingVerifyApi(query) as PageResult<UserVerify>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function openAudit(item: UserVerify) {
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
    await auditVerifyApi(currentItem.value.userId, auditForm)
    ElMessage.success('审核完成')
    dialogVisible.value = false
    fetchData()
  } finally { submitting.value = false }
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="实名审核" description="核验用户提交的姓名与学号，通过后用户获得已认证标识">
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
        title-key="realName"
        empty-text="没有待审核的认证申请"
        empty-hint="所有申请都已处理完毕"
      >
        <template #verifyStatus="{ row }">
          <el-tag :type="(VERIFY_STATUS[row.verifyStatus]?.type as any)" size="small">
            {{ VERIFY_STATUS[row.verifyStatus]?.label }}
          </el-tag>
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

    <el-dialog v-model="dialogVisible" title="审核实名认证" width="480px">
      <el-form label-width="80px">
        <el-form-item label="真实姓名">{{ currentItem?.realName }}</el-form-item>
        <el-form-item label="学号">{{ currentItem?.studentNo }}</el-form-item>
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

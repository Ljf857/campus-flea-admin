<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getManagerListApi, addManagerApi, updateManagerApi, deleteManagerApi, resetPasswordApi } from '@/api/modules/manager'
import type { AdminManager } from '@/api/types/admin'
import type { PageResult } from '@/api/types/common'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 70, hideInCard: true },
  { prop: 'username', label: '账号', width: 100 },
  { prop: 'realName', label: '姓名', width: 100, isTitle: true },
  { prop: 'role', label: '角色', width: 100, slot: 'role' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'lastLoginTime', label: '最后登录', width: 150 },
  { prop: 'lastLoginIp', label: '登录IP', width: 120 },
  { prop: 'createTime', label: '创建时间', width: 150 },
  { label: '操作', width: 200, isActions: true, slot: 'actions' },
]

const ROLE_LABEL: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
}

const loading = ref(false)
const list = ref<AdminManager[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })
const dialogVisible = ref(false)
const pwdDialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = reactive({ id: 0, username: '', realName: '', password: '', role: 'admin', status: 1 })
const resetPwdForm = reactive({ id: 0, username: '', password: '' })

async function fetchData() {
  loading.value = true
  try { const res = await getManagerListApi(query) as PageResult<AdminManager>; list.value = res.list; total.value = res.total } finally { loading.value = false }
}

function openAdd() { isEdit.value = false; Object.assign(form, { id: 0, username: '', realName: '', password: '', role: 'admin', status: 1 }); dialogVisible.value = true }

function openEdit(row: AdminManager) { isEdit.value = true; Object.assign(form, { id: row.id, username: row.username, realName: row.realName, password: '', role: row.role, status: row.status }); dialogVisible.value = true }

function openResetPwd(row: AdminManager) { Object.assign(resetPwdForm, { id: row.id, username: row.username, password: '' }); pwdDialogVisible.value = true }

async function handleSubmit() {
  if (!form.username || (isEdit.value ? false : !form.password)) { ElMessage.warning('请填写完整信息'); return }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateManagerApi(form.id, {
        username: form.username,
        realName: form.realName,
        role: form.role,
        status: form.status,
      })
      ElMessage.success('修改成功')
    } else { await addManagerApi(form); ElMessage.success('新增成功') }
    dialogVisible.value = false
    fetchData()
  } finally { saving.value = false }
}

async function handleDelete(row: AdminManager) {
  try { await ElMessageBox.confirm(`确定要删除管理员「${row.realName}」吗？删除后该账号将无法登录。`, '警告', { type: 'error' }) } catch { return }
  await deleteManagerApi(row.id); ElMessage.success('删除成功'); fetchData()
}

async function handleResetPwd() {
  if (!resetPwdForm.password || resetPwdForm.password.length < 6) { ElMessage.warning('密码至少6位'); return }
  saving.value = true
  try {
    await resetPasswordApi(resetPwdForm.id, resetPwdForm.password)
    ElMessage.success('密码重置成功')
    pwdDialogVisible.value = false
  } finally { saving.value = false }
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="管理员管理" description="维护后台账号及其角色权限，可重置密码或停用账号">
      <template #actions>
        <el-button type="primary" @click="openAdd">新增管理员</el-button>
      </template>
    </PageHeader>

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="realName"
        empty-text="还没有管理员账号"
        empty-hint="点击右上角「新增管理员」创建第一个账号"
      >
        <template #role="{ row }">{{ ROLE_LABEL[row.role] || row.role }}</template>
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="warning" link @click="openEdit(row)">编辑</el-button>
          <el-button type="primary" link @click="openResetPwd(row)">重置密码</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑管理员' : '新增管理员'" width="480px">
      <el-form label-width="80px">
        <el-form-item label="账号"><el-input v-model="form.username" :disabled="isEdit" placeholder="登录账号" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" placeholder="真实姓名" /></el-form-item>
        <el-form-item v-if="!isEdit" label="密码"><el-input v-model="form.password" type="password" show-password placeholder="至少 6 位" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pwdDialogVisible" title="重置密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="账号">{{ resetPwdForm.username }}</el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="resetPwdForm.password" type="password" show-password placeholder="至少6位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleResetPwd">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

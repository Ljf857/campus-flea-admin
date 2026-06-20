<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AlertTriangle } from 'lucide-vue-next'
import {
  getCategoryListApi, addCategoryApi, updateCategoryApi, deleteCategoryApi,
  getSubCategoryListApi, addSubCategoryApi, updateSubCategoryApi, deleteSubCategoryApi,
} from '@/api/modules/category'
import type { PrimaryCategory, SubCategory } from '@/api/types/goods'
import IconSelector from '@/components/IconSelector/index.vue'
import CategoryColorField from '@/components/CategoryColorField/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'
import { findIconOption, isIconSupported } from '@/constants/categoryIcons'
import { resolveTileColors } from '@/utils/categoryColor'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 60, hideInCard: true },
  { label: '分类名称', minWidth: 160, slot: 'name', isTitle: true },
  { label: '移动端效果', width: 130, slot: 'preview' },
  { prop: 'sort', label: '排序', width: 70 },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { label: '操作', width: 280, isActions: true, slot: 'actions' },
]
const subColumns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 60, hideInCard: true },
  { label: '分类名称', minWidth: 140, slot: 'name', isTitle: true },
  { label: '移动端效果', width: 130, slot: 'preview' },
  { prop: 'sort', label: '排序', width: 70 },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { label: '操作', width: 160, isActions: true, slot: 'actions' },
]

const loading = ref(false)
const submitting = ref(false)
const list = ref<PrimaryCategory[]>([])

const dialogVisible = ref(false)
const isEdit = ref(false)
// colorDark 为深色模式主题色。留空时移动端按 color 自动推导，因此存量数据无需回填。
const form = reactive({ id: 0, name: '', icon: '', color: '', colorDark: '', sort: 0, status: 1 })

const subDialogVisible = ref(false)
const currentPrimary = ref<PrimaryCategory | null>(null)
const subList = ref<SubCategory[]>([])
const subLoading = ref(false)

const subFormDialogVisible = ref(false)
const subIsEdit = ref(false)
const subSubmitting = ref(false)
const subForm = reactive({ id: 0, name: '', icon: '', color: '', colorDark: '', sort: 0, status: 1 })

async function fetchData() {
  loading.value = true
  try {
    list.value = await getCategoryListApi() as PrimaryCategory[]
  } finally { loading.value = false }
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: 0, name: '', icon: '', color: '', colorDark: '', sort: 0, status: 1 })
  dialogVisible.value = true
}

function openEdit(row: PrimaryCategory) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    colorDark: row.colorDark ?? '',
    sort: row.sort,
    status: row.status,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.name) { ElMessage.warning('请输入分类名称'); return }
  if (submitting.value) return
  submitting.value = true
  try {
    if (isEdit.value) { await updateCategoryApi(form.id, form); ElMessage.success('修改成功') }
    else { await addCategoryApi(form); ElMessage.success('新增成功') }
    dialogVisible.value = false; fetchData()
  } finally { submitting.value = false }
}

async function handleDelete(row: PrimaryCategory) {
  try { await ElMessageBox.confirm(`确定要删除一级分类「${row.name}」吗？其下的所有二级分类也将一并删除。`, '警告', { type: 'error' }) } catch { return }
  await deleteCategoryApi(row.id); ElMessage.success('删除成功'); fetchData()
}

async function openSubManage(row: PrimaryCategory) {
  currentPrimary.value = row
  subDialogVisible.value = true
  await fetchSubList()
}

async function fetchSubList() {
  if (!currentPrimary.value) return
  subLoading.value = true
  try {
    subList.value = await getSubCategoryListApi(currentPrimary.value.id) as SubCategory[]
  } finally { subLoading.value = false }
}

function openSubAdd() {
  subIsEdit.value = false
  Object.assign(subForm, { id: 0, name: '', icon: '', color: '', colorDark: '', sort: 0, status: 1 })
  subFormDialogVisible.value = true
}

function openSubEdit(row: SubCategory) {
  subIsEdit.value = true
  Object.assign(subForm, {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    colorDark: row.colorDark ?? '',
    sort: row.sort,
    status: row.status,
  })
  subFormDialogVisible.value = true
}

async function handleSubSubmit() {
  if (!subForm.name) { ElMessage.warning('请输入分类名称'); return }
  if (subSubmitting.value) return
  subSubmitting.value = true
  try {
    if (subIsEdit.value) {
      await updateSubCategoryApi(subForm.id, subForm)
      ElMessage.success('修改成功')
    } else {
      await addSubCategoryApi({ ...subForm, primaryId: currentPrimary.value!.id })
      ElMessage.success('新增成功')
    }
    subFormDialogVisible.value = false
    await fetchSubList()
  } finally { subSubmitting.value = false }
}

async function handleSubDelete(row: SubCategory) {
  try { await ElMessageBox.confirm(`确定要删除二级分类「${row.name}」吗？`, '警告', { type: 'error' }) } catch { return }
  await deleteSubCategoryApi(row.id); ElMessage.success('删除成功'); fetchSubList()
}

/**
 * 预览用的底色与图标色。
 *
 * 走与移动端同一套 `resolveTileColors`——深色值缺失时按相同规则推导、
 * 过浅的底色按相同规则压暗、图标恒为白。预览与 App 不一致比没有预览更糟，
 * 因为管理员会信任一个假的效果图。
 */
function tileColor(row: { color: string; colorDark?: string }, isDark: boolean): string {
  return resolveTileColors(row.color, row.colorDark, isDark).background
}

function tileForeground(row: { color: string; colorDark?: string }, isDark: boolean): string {
  return resolveTileColors(row.color, row.colorDark, isDark).foreground
}

function rowIcon(row: { icon: string }) {
  return findIconOption(row.icon)?.icon
}

function rowIconUnsupported(row: { icon: string }) {
  return !isIconSupported(row.icon)
}

function rowIconLabel(row: { icon: string }) {
  return findIconOption(row.icon)?.label ?? row.icon ?? '未设置'
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="分类管理" description="维护平台商品分类树。一级分类下可继续添加二级分类，图标与主题色会直接呈现到 App 首页的分类宫格">
      <template #actions>
        <el-button type="primary" @click="openAdd()">新增一级分类</el-button>
      </template>
    </PageHeader>

    <section class="rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="name"
        empty-text="还没有商品分类"
        empty-hint="点击右上角「新增一级分类」开始搭建分类树"
      >
        <template #name="{ row }">
          <span class="flex items-center gap-2">
            <span v-if="rowIconUnsupported(row)" class="shrink-0 text-warning-ink" title="移动端不认识这个图标">
              <AlertTriangle :size="13" />
            </span>
            {{ row.name }}
          </span>
        </template>

        <!-- 移动端效果：深浅两个色块并排，所见即所得 -->
        <template #preview="{ row }">
          <div class="flex items-center gap-1.5" :title="`${rowIconLabel(row)} · 浅色 ${row.color || '未设置'} / 深色 ${row.colorDark || '自动推导'}`">
            <span
              class="preview-tile"
              :style="{ backgroundColor: tileColor(row, false) }"
            >
              <img v-if="row.icon && row.icon.startsWith('http')" :src="row.icon" alt="" />
              <component
                v-else-if="rowIcon(row)"
                :is="rowIcon(row)"
                :size="16"
                :color="tileForeground(row, false)"
              />
              <AlertTriangle v-else :size="14" :color="tileForeground(row, false)" />
            </span>
            <span
              class="preview-tile"
              :style="{ backgroundColor: tileColor(row, true) }"
            >
              <img v-if="row.icon && row.icon.startsWith('http')" :src="row.icon" alt="" />
              <component
                v-else-if="rowIcon(row)"
                :is="rowIcon(row)"
                :size="16"
                :color="tileForeground(row, true)"
              />
              <AlertTriangle v-else :size="14" :color="tileForeground(row, true)" />
            </span>
          </div>
        </template>

        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link @click="openSubManage(row)">管理子分类</el-button>
          <el-button type="warning" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </ResponsiveTable>
    </section>

    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑一级分类':'新增一级分类'" width="620px">
      <el-form label-width="100px">
        <el-form-item label="分类名称"><el-input v-model="form.name" placeholder="例如：数码产品" /></el-form-item>
        <el-form-item label="图标">
          <IconSelector v-model="form.icon" :preview-color="form.color" />
        </el-form-item>
        <el-form-item label="主题色">
          <CategoryColorField
            v-model:color="form.color"
            v-model:color-dark="form.colorDark"
            :icon="form.icon"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
          <p class="mt-1 text-2xs text-muted">数字越小，排序越靠前</p>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="subDialogVisible" :title="'管理子分类 - ' + (currentPrimary?.name || '')" width="820px">
      <div class="mb-3">
        <el-button type="primary" @click="openSubAdd">新增二级分类</el-button>
      </div>
      <ResponsiveTable
        :data="subList"
        :columns="subColumns"
        :loading="subLoading"
        row-key="id"
        title-key="name"
        empty-text="该分类下还没有二级分类"
        empty-hint="点击上方「新增二级分类」添加"
      >
        <template #name="{ row }">
          <span class="flex items-center gap-2">
            <span v-if="rowIconUnsupported(row)" class="shrink-0 text-warning-ink" title="移动端不认识这个图标">
              <AlertTriangle :size="13" />
            </span>
            {{ row.name }}
          </span>
        </template>

        <template #preview="{ row }">
          <div class="flex items-center gap-1.5">
            <span class="preview-tile" :style="{ backgroundColor: tileColor(row, false) }">
              <img v-if="row.icon && row.icon.startsWith('http')" :src="row.icon" alt="" />
              <component
                v-else-if="rowIcon(row)"
                :is="rowIcon(row)"
                :size="16"
                :color="tileForeground(row, false)"
              />
              <AlertTriangle v-else :size="14" :color="tileForeground(row, false)" />
            </span>
            <span class="preview-tile" :style="{ backgroundColor: tileColor(row, true) }">
              <img v-if="row.icon && row.icon.startsWith('http')" :src="row.icon" alt="" />
              <component
                v-else-if="rowIcon(row)"
                :is="rowIcon(row)"
                :size="16"
                :color="tileForeground(row, true)"
              />
              <AlertTriangle v-else :size="14" :color="tileForeground(row, true)" />
            </span>
          </div>
        </template>

        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="warning" link @click="openSubEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleSubDelete(row)">删除</el-button>
        </template>
      </ResponsiveTable>
      <template #footer>
        <el-button @click="subDialogVisible = false">关闭</el-button>
      </template>

      <el-dialog v-model="subFormDialogVisible" :title="subIsEdit?'编辑二级分类':'新增二级分类'" width="620px" append-to-body>
        <el-form label-width="100px">
          <el-form-item label="分类名称"><el-input v-model="subForm.name" placeholder="例如：笔记本电脑" /></el-form-item>
          <el-form-item label="图标">
            <IconSelector v-model="subForm.icon" :preview-color="subForm.color" />
          </el-form-item>
          <el-form-item label="主题色">
            <CategoryColorField
              v-model:color="subForm.color"
              v-model:color-dark="subForm.colorDark"
              :icon="subForm.icon"
            />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="subForm.sort" :min="0" :max="999" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="subForm.status">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer><el-button @click="subFormDialogVisible=false">取消</el-button><el-button type="primary" :loading="subSubmitting" @click="handleSubSubmit">确认</el-button></template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<style scoped>
.preview-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}
.preview-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

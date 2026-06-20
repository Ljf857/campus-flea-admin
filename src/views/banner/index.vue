<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBannerListApi, addBannerApi, updateBannerApi, deleteBannerApi } from '@/api/modules/banner'
import { BANNER_LINK_TYPE } from '@/constants'
import ImageUpload from '@/components/ImageUpload/index.vue'
import type { Banner } from '@/api/types/admin'
import { resolveImageUrl } from '@/utils/image'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'id', label: 'ID', width: 70, hideInCard: true },
  { prop: 'title', label: '标题', minWidth: 170, isTitle: true },
  { label: '图片', width: 130, slot: 'image' },
  { prop: 'linkType', label: '跳转类型', width: 100, slot: 'linkType' },
  { prop: 'linkUrl', label: '链接', minWidth: 160, showOverflowTooltip: true },
  { prop: 'sort', label: '排序', width: 70 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', width: 170 },
  { label: '操作', width: 130, isActions: true, slot: 'actions' },
]

const loading = ref(false)
const list = ref<Banner[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = reactive({ id: 0, title: '', image: '', linkType: 1, linkUrl: '', sort: 0, status: 1 })

async function fetchData() { loading.value = true; try { list.value = (await getBannerListApi()) as Banner[] } finally { loading.value = false } }

function openAdd() { isEdit.value = false; Object.assign(form, { id: 0, title: '', image: '', linkType: 1, linkUrl: '', sort: 0, status: 1 }); dialogVisible.value = true }

function openEdit(row: Banner) { isEdit.value = true; Object.assign(form, { id: row.id, title: row.title, image: row.image, linkType: row.linkType, linkUrl: row.linkUrl, sort: row.sort, status: row.status }); dialogVisible.value = true }

async function handleSubmit() {
  if (!form.title || !form.image) { ElMessage.warning('请填写完整信息'); return }
  saving.value = true
  try {
    if (isEdit.value) { await updateBannerApi(form.id, form); ElMessage.success('修改成功') }
    else { await addBannerApi(form); ElMessage.success('新增成功') }
    dialogVisible.value = false
    fetchData()
  } finally { saving.value = false }
}

async function handleDelete(row: Banner) {
  try { await ElMessageBox.confirm(`确定删除轮播图「${row.title}」吗？`, '警告', { type: 'error' }) } catch { return }
  await deleteBannerApi(row.id); ElMessage.success('删除成功'); fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="轮播图管理" description="维护 App 首页轮播位，控制展示顺序、跳转目标与启用状态">
      <template #actions>
        <el-button type="primary" @click="openAdd">新增轮播图</el-button>
      </template>
    </PageHeader>

    <section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        title-key="title"
        empty-text="还没有配置轮播图"
        empty-hint="点击右上角「新增轮播图」开始配置"
      >
        <template #image="{ row }">
          <img
            :src="resolveImageUrl(row.image)"
            :alt="row.title"
            class="h-[45px] w-20 rounded-sm border border-line object-cover"
          />
        </template>
        <template #linkType="{ row }">{{ BANNER_LINK_TYPE[row.linkType] || '-' }}</template>
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="warning" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </ResponsiveTable>
    </section>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑轮播图' : '新增轮播图'" width="520px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="轮播图标题" /></el-form-item>
        <el-form-item label="图片">
          <ImageUpload v-model="form.image" biz-type="banner" tip="建议尺寸 750×360，支持 jpg/png，不超过 10MB" />
        </el-form-item>
        <el-form-item label="跳转类型">
          <el-select v-model="form.linkType">
            <el-option v-for="(v, k) in BANNER_LINK_TYPE" :key="k" :label="v" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" placeholder="商品ID / 分类ID / 外链 URL" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

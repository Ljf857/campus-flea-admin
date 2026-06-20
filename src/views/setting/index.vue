<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettingListApi, updateSettingApi } from '@/api/modules/setting'
import type { SysSetting } from '@/api/types/admin'
import PageHeader from '@/components/PageHeader/index.vue'
import ResponsiveTable, { type RTColumn } from '@/components/ResponsiveTable/index.vue'

const columns: RTColumn[] = [
  { prop: 'settingKey', label: '配置键', width: 220, isTitle: true },
  { prop: 'settingDesc', label: '说明', width: 220 },
  { label: '配置值', minWidth: 300, slot: 'value' },
  { label: '操作', width: 90, isActions: true, slot: 'actions' },
]

const loading = ref(false)
const list = ref<SysSetting[]>([])
const savingKey = ref('')

async function fetchData() {
  loading.value = true
  try { list.value = (await getSettingListApi()) as SysSetting[] } finally { loading.value = false }
}

async function handleSave(item: SysSetting) {
  if (!item.settingValue) { ElMessage.warning('设置值不能为空'); return }
  savingKey.value = item.settingKey
  try {
    await updateSettingApi(item.settingKey, item.settingValue)
    ElMessage.success('保存成功')
  } finally { savingKey.value = '' }
}

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="系统设置" description="维护平台运行参数，修改后立即生效，请谨慎操作" />

    <section class="rounded-lg border border-line bg-surface p-4 shadow-xs md:p-5">
      <ResponsiveTable
        :data="list"
        :columns="columns"
        :loading="loading"
        row-key="settingKey"
        title-key="settingKey"
        empty-text="还没有可配置的参数"
        empty-hint="后端尚未下发配置项"
      >
        <template #value="{ row }">
          <el-input v-if="row.settingType === 'text'" v-model="row.settingValue" type="textarea" :rows="2" />
          <el-switch
            v-else-if="row.settingType === 'boolean'"
            v-model="row.settingValue"
            active-value="true"
            inactive-value="false"
          />
          <el-input v-else v-model="row.settingValue" />
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link :loading="savingKey === row.settingKey" @click="handleSave(row)">
            保存
          </el-button>
        </template>
      </ResponsiveTable>
    </section>
  </div>
</template>

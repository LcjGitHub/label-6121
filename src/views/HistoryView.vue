<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useEditionStore } from '@/stores/edition'
import type { ConversionRecord, PageInputType } from '@/types'

const router = useRouter()
const editionStore = useEditionStore()

const records = computed(() => editionStore.filteredRecords)
const totalRecords = computed(() => editionStore.sortedRecords.length)

const filterEditionId = computed({
  get: () => editionStore.filterEditionId,
  set: (val: string) => { editionStore.filterEditionId = val },
})
const filterInputType = computed({
  get: () => editionStore.filterInputType,
  set: (val: PageInputType | '') => { editionStore.filterInputType = val },
})

const editionOptions = computed(() =>
  editionStore.getSortedEditionsWithFavorite().map((e) => ({
    label: e.name,
    value: e.id,
  })),
)

const directionOptions = [
  { label: '现代 → 古', value: 'modern' as PageInputType },
  { label: '古 → 现代', value: 'ancient' as PageInputType },
]

const importFileRef = ref<HTMLInputElement | null>(null)

function formatInputType(record: ConversionRecord): string {
  return record.inputType === 'modern' ? '现代 → 古' : '古 → 现代'
}

function formatConversion(record: ConversionRecord): string {
  const inputLabel = record.inputType === 'modern' ? '现代' : '古'
  const outputLabel = record.inputType === 'modern' ? '古' : '现代'
  return `${inputLabel}：${record.inputValue} → ${outputLabel}：${record.outputValue}`
}

async function handleDelete(record: ConversionRecord): Promise<void> {
  try {
    await ElMessageBox.confirm('确定删除这条对照记录吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    editionStore.removeRecord(record.id)
    ElMessage.success('已删除')
  } catch {
    /* 用户取消 */
  }
}

function handleReconvert(record: ConversionRecord): void {
  editionStore.setPrefillData({
    editionId: record.editionId,
    volumeId: record.volumeId,
    inputType: record.inputType,
    inputValue: record.inputValue,
  })
  router.push({
    path: '/',
    query: {
      edition: record.editionId,
      volume: record.volumeId,
    },
  })
}

async function handleClearAll(): Promise<void> {
  if (totalRecords.value === 0) return

  try {
    await ElMessageBox.confirm('确定清空全部对照记录吗？此操作不可恢复。', '清空确认', {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning',
    })
    editionStore.clearRecords()
    ElMessage.success('已清空全部记录')
  } catch {
    /* 用户取消 */
  }
}

function handleExport(): void {
  if (totalRecords.value === 0) {
    ElMessage.warning('暂无记录可导出')
    return
  }
  editionStore.exportRecords()
  ElMessage.success('备份文件已下载')
}

function triggerImportFile(): void {
  importFileRef.value?.click()
}

async function handleImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  try {
    const text = await file.text()
    const result = editionStore.importRecords(text)
    ElMessage.success(
      `导入完成：新增 ${result.added} 条，更新 ${result.updated} 条，共 ${result.total} 条`,
    )
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '导入失败，文件格式不正确')
  }
}

function formatRelativeTime(datetime: string): string {
  const d = dayjs(datetime)
  const now = dayjs()
  if (now.diff(d, 'day') === 0) {
    return d.format('HH:mm')
  }
  if (now.diff(d, 'day') < 7) {
    return d.format('ddd HH:mm')
  }
  return d.format('YYYY-MM-DD HH:mm')
}

function handleClearFilters(): void {
  editionStore.clearFilters()
}

const hasActiveFilters = computed(
  () => filterEditionId.value !== '' || filterInputType.value !== '',
)
</script>

<template>
  <div class="page-container">
    <div class="literary-card filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="8">
          <el-select
            v-model="filterEditionId"
            placeholder="按版本名称筛选"
            clearable
            style="width: 100%"
            size="default"
          >
            <el-option
              v-for="opt in editionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-select
            v-model="filterInputType"
            placeholder="按换算方向筛选"
            clearable
            style="width: 100%"
            size="default"
          >
            <el-option
              v-for="opt in directionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-button
            type="primary"
            plain
            :disabled="!hasActiveFilters"
            @click="handleClearFilters"
          >
            清空筛选
          </el-button>
        </el-col>
      </el-row>
    </div>

    <div class="page-header">
      <div>
        <h1 class="page-title">对照记录</h1>
        <p class="page-subtitle">
          换算历史保存在本地浏览器，
          <template v-if="hasActiveFilters">
            当前筛选结果 {{ records.length }} 条，共 {{ totalRecords }} 条
          </template>
          <template v-else>
            共 {{ totalRecords }} 条
          </template>
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" plain @click="handleExport">
          导出备份
        </el-button>
        <el-button type="success" plain @click="triggerImportFile">
          从文件导入
        </el-button>
        <el-button
          v-if="totalRecords > 0"
          type="danger"
          plain
          @click="handleClearAll"
        >
          清空全部
        </el-button>
        <input
          ref="importFileRef"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleImportFile"
        />
      </div>
    </div>

    <div class="literary-card">
      <template v-if="records.length > 0">
        <el-table :data="records" stripe style="width: 100%">
          <el-table-column label="时间" width="140">
            <template #default="{ row }">
              <span :title="row.createdAt">{{ formatRelativeTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="editionName" label="版本" min-width="120" />
          <el-table-column prop="volumeName" label="卷册" min-width="140" />
          <el-table-column label="方向" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ formatInputType(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="对照结果" min-width="200">
            <template #default="{ row }">
              {{ formatConversion(row) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleReconvert(row)">
                再次换算
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <div v-else-if="hasActiveFilters && totalRecords > 0" class="empty-hint">
        <p>无符合筛选条件的记录</p>
        <el-button type="primary" link @click="handleClearFilters">清空筛选</el-button>
      </div>

      <div v-else class="empty-hint">
        <p>暂无对照记录</p>
        <RouterLink to="/">
          <el-button type="primary" link>去换算页码</el-button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header .page-subtitle {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-card {
  padding: 16px 24px;
  margin-bottom: 16px;
}
</style>

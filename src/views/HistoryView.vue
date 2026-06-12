<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useEditionStore } from '@/stores/edition'
import type { ConversionRecord } from '@/types'

const editionStore = useEditionStore()

const records = computed(() => editionStore.sortedRecords)

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

async function handleClearAll(): Promise<void> {
  if (records.value.length === 0) return

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
  if (records.value.length === 0) {
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
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">对照记录</h1>
        <p class="page-subtitle">换算历史保存在本地浏览器，共 {{ records.length }} 条</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" plain @click="handleExport">
          导出备份
        </el-button>
        <el-button type="success" plain @click="triggerImportFile">
          从文件导入
        </el-button>
        <el-button
          v-if="records.length > 0"
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
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

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
</style>

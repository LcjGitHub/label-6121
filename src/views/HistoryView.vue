<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useEditionStore } from '@/stores/edition'
import type { ConversionRecord } from '@/types'

const editionStore = useEditionStore()

const records = computed(() => editionStore.sortedRecords)

/**
 * 格式化输入类型显示
 * @param record - 对照记录
 */
function formatInputType(record: ConversionRecord): string {
  return record.inputType === 'modern' ? '现代 → 古' : '古 → 现代'
}

/**
 * 格式化输入输出展示
 * @param record - 对照记录
 */
function formatConversion(record: ConversionRecord): string {
  const inputLabel = record.inputType === 'modern' ? '现代' : '古'
  const outputLabel = record.inputType === 'modern' ? '古' : '现代'
  return `${inputLabel}：${record.inputValue} → ${outputLabel}：${record.outputValue}`
}

/**
 * 删除单条记录
 * @param record - 对照记录
 */
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

/**
 * 清空全部记录
 */
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

/**
 * 相对时间展示
 * @param datetime - 时间字符串
 */
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
      <el-button
        v-if="records.length > 0"
        type="danger"
        plain
        @click="handleClearAll"
      >
        清空全部
      </el-button>
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
</style>

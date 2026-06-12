<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { useToggle } from '@vueuse/core'
import { useEditionStore } from '@/stores/edition'
import { convertPage, convertPageRange, validatePageInput, validatePageRange } from '@/utils/converter'
import type { BatchConversionResult, ConvertMode, PageInputType } from '@/types'

const route = useRoute()
const router = useRouter()
const editionStore = useEditionStore()

const convertMode = ref<ConvertMode>('single')
const inputType = ref<PageInputType>('modern')
const inputValue = ref('')
const outputValue = ref('')
const errorMessage = ref('')

const startPage = ref('')
const endPage = ref('')
const batchResult = ref<BatchConversionResult | null>(null)
const batchCurrentPage = ref(1)
const batchPageSize = ref(10)

const [saving, toggleSaving] = useToggle(false)

let isUpdatingQuery = false

function resetResult(): void {
  outputValue.value = ''
  errorMessage.value = ''
}

function resetBatchResult(): void {
  batchResult.value = null
  errorMessage.value = ''
}

function handleModeChange(): void {
  inputValue.value = ''
  startPage.value = ''
  endPage.value = ''
  resetResult()
  resetBatchResult()
}

function sanitizeRouteQuery(editionId: string | undefined, volumeId: string | undefined): {
  validEdition: string | undefined
  validVolume: string | undefined
  needsUpdate: boolean
} {
  let needsUpdate = false

  if (!editionId) {
    return { validEdition: undefined, validVolume: undefined, needsUpdate }
  }

  const edition = editionStore.getEditionById(editionId)
  if (!edition) {
    needsUpdate = true
    return { validEdition: undefined, validVolume: undefined, needsUpdate }
  }

  if (volumeId) {
    const volume = editionStore.getVolumeById(editionId, volumeId)
    if (!volume) {
      needsUpdate = true
      return { validEdition: editionId, validVolume: undefined, needsUpdate }
    }
    return { validEdition: editionId, validVolume: volumeId, needsUpdate }
  }

  return { validEdition: editionId, validVolume: undefined, needsUpdate }
}

function applyRouteQuery(): void {
  if (isUpdatingQuery) return

  const queryEdition = route.query.edition as string | undefined
  const queryVolume = route.query.volume as string | undefined

  const { validEdition, validVolume, needsUpdate } = sanitizeRouteQuery(queryEdition, queryVolume)

  if (validEdition) {
    editionStore.selectedEditionId = validEdition
    if (validVolume) {
      editionStore.selectedVolumeId = validVolume
    } else {
      editionStore.syncVolumeOnEditionChange()
    }
    inputValue.value = ''
    startPage.value = ''
    endPage.value = ''
    resetResult()
    resetBatchResult()
  } else {
    editionStore.initSelection()
  }

  if (needsUpdate || (validEdition && !validVolume)) {
    isUpdatingQuery = true
    const currentEdition = validEdition ?? editionStore.selectedEditionId
    const currentVolume = validVolume ?? editionStore.selectedVolumeId
    router
      .replace({
        path: route.path,
        query: {
          ...(currentEdition ? { edition: currentEdition } : {}),
          ...(currentVolume ? { volume: currentVolume } : {}),
        },
      })
      .finally(() => {
        isUpdatingQuery = false
      })
  }
}

applyRouteQuery()

const prefill = editionStore.consumePrefillData()
if (prefill) {
  inputType.value = prefill.inputType
  inputValue.value = prefill.inputValue
  convertMode.value = 'single'
  resetResult()
  resetBatchResult()
}

watch(
  () => [route.query.edition, route.query.volume],
  () => {
    applyRouteQuery()
  },
)

const editionId = computed({
  get: () => editionStore.selectedEditionId,
  set: (val: string) => { editionStore.selectedEditionId = val },
})
const volumeId = computed({
  get: () => editionStore.selectedVolumeId,
  set: (val: string) => { editionStore.selectedVolumeId = val },
})

const editionOptions = computed(() =>
  editionStore.getSortedEditionsWithFavorite().map((e) => ({
    label: e.name,
    value: e.id,
    isFavorite: e.isFavorite,
  })),
)

const isCurrentFavorite = computed(() =>
  editionId.value ? editionStore.isFavoriteEdition(editionId.value) : false,
)

const favoriteCount = computed(() => editionStore.favoriteCount)

function handleToggleFavorite(): void {
  if (!editionId.value) return
  editionStore.toggleFavoriteEdition(editionId.value)
}

const volumeOptions = computed(() => {
  const edition = editionStore.getEditionById(editionId.value)
  return edition?.volumes.map((v) => ({ label: v.name, value: v.id })) ?? []
})

const selectedEdition = computed(() => editionStore.getEditionById(editionId.value))

const selectedVolume = computed(() =>
  editionStore.getVolumeById(editionId.value, volumeId.value),
)

const inputPlaceholder = computed(() =>
  inputType.value === 'modern' ? '请输入现代页码（正整数）' : '请输入古页码',
)

const outputLabel = computed(() =>
  inputType.value === 'modern' ? '古页码' : '现代页码',
)

const hasResult = computed(() => Boolean(outputValue.value))

const hasBatchResult = computed(() => batchResult.value !== null)

const paginatedBatchItems = computed(() => {
  if (!batchResult.value) return []
  const items = batchResult.value.items
  const start = (batchCurrentPage.value - 1) * batchPageSize.value
  const end = start + batchPageSize.value
  return items.slice(start, end)
})

const batchTotal = computed(() => batchResult.value?.total ?? 0)

watch(editionId, () => {
  editionStore.syncVolumeOnEditionChange()
  startPage.value = ''
  endPage.value = ''
  resetResult()
  resetBatchResult()
})

watch([inputType, volumeId], () => {
  startPage.value = ''
  endPage.value = ''
  resetResult()
  resetBatchResult()
})

watch(convertMode, () => {
  resetResult()
  resetBatchResult()
})

/**
 * 根据当前换算模式分发提交
 */
function handleSubmit(): void {
  if (convertMode.value === 'range') {
    handleBatchConvert()
  } else {
    handleConvert()
  }
}

/**
 * 切换输入类型并清空输入
 */
function handleInputTypeChange(): void {
  inputValue.value = ''
  resetResult()
}

/**
 * 执行页码换算
 */
function handleConvert(): void {
  if (!editionId.value || !volumeId.value) {
    ElMessage.warning('请先选择版本与卷册')
    return
  }

  const validationError = validatePageInput(inputType.value, inputValue.value)
  if (validationError) {
    errorMessage.value = validationError
    outputValue.value = ''
    ElMessage.error(validationError)
    return
  }

  const volume = selectedVolume.value
  if (!volume) {
    ElMessage.error('卷册数据不存在')
    return
  }

  const result = convertPage(volume.mappings, inputType.value, inputValue.value)
  if (!result.success) {
    errorMessage.value = result.message ?? '换算失败'
    outputValue.value = ''
    ElMessage.warning(result.message ?? '换算失败')
    return
  }

  outputValue.value = result.outputValue ?? ''
  errorMessage.value = ''
  ElMessage.success('换算成功')
}

/**
 * 保存当前对照记录
 */
async function handleSave(): Promise<void> {
  if (!hasResult.value) {
    ElMessage.warning('请先完成换算再保存')
    return
  }

  const edition = selectedEdition.value
  const volume = selectedVolume.value
  if (!edition || !volume) return

  toggleSaving(true)
  try {
    editionStore.addRecord({
      editionId: edition.id,
      editionName: edition.name,
      volumeId: volume.id,
      volumeName: volume.name,
      inputType: inputType.value,
      inputValue: inputValue.value.trim(),
      outputValue: outputValue.value,
    })
    ElMessage.success('已保存对照记录')
  } finally {
    toggleSaving(false)
  }
}

/**
 * 执行页码区间批量换算
 */
function handleBatchConvert(): void {
  if (!editionId.value || !volumeId.value) {
    ElMessage.warning('请先选择版本与卷册')
    return
  }

  const validationError = validatePageRange(startPage.value, endPage.value)
  if (validationError) {
    errorMessage.value = validationError
    batchResult.value = null
    ElMessage.error(validationError)
    return
  }

  const volume = selectedVolume.value
  if (!volume) {
    ElMessage.error('卷册数据不存在')
    return
  }

  const startNum = Number(startPage.value.trim())
  const endNum = Number(endPage.value.trim())
  const result = convertPageRange(volume.mappings, startNum, endNum)

  batchResult.value = result
  errorMessage.value = ''
  batchCurrentPage.value = 1
  ElMessage.success(`批量换算完成，共 ${result.foundCount}/${result.total} 条匹配`)
}

/**
 * 重置表单
 */
function handleReset(): void {
  inputValue.value = ''
  startPage.value = ''
  endPage.value = ''
  resetResult()
  resetBatchResult()
}

function handleBatchCurrentChange(page: number): void {
  batchCurrentPage.value = page
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">页码换算</h1>
    <p class="page-subtitle">
      选择古籍版本与卷册，输入现代页码或古页码，自动换算另一种页码体系
    </p>

    <div class="literary-card">
      <el-form label-position="top" @submit.prevent="handleSubmit">
        <el-row :gutter="20" align="middle">
          <el-col :xs="24" :sm="12">
            <el-form-item label="古籍版本">
              <div class="edition-select-wrapper">
                <el-select
                  v-model="editionId"
                  placeholder="请选择版本"
                  style="width: 100%"
                >
                  <el-option
                    v-for="opt in editionOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  >
                    <div class="option-content">
                      <span class="option-label">{{ opt.label }}</span>
                      <el-icon
                        v-if="opt.isFavorite"
                        class="star-icon favorite"
                        :size="14"
                      >
                        <StarFilled />
                      </el-icon>
                    </div>
                  </el-option>
                </el-select>
                <el-tooltip
                  :content="isCurrentFavorite ? '取消收藏此版本' : '收藏此版本'"
                  placement="top"
                >
                  <el-button
                    class="favorite-btn"
                    :type="isCurrentFavorite ? 'warning' : 'default'"
                    :icon="isCurrentFavorite ? StarFilled : Star"
                    circle
                    size="default"
                    :disabled="!editionId"
                    @click="handleToggleFavorite"
                  />
                </el-tooltip>
              </div>
              <div v-if="favoriteCount > 0" class="favorite-hint">
                已收藏 {{ favoriteCount }} 个常用版本，收藏版本在列表中置顶显示
              </div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="卷册">
              <el-select
                v-model="volumeId"
                placeholder="请选择卷册"
                style="width: 100%"
                :disabled="!editionId"
              >
                <el-option
                  v-for="opt in volumeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <p v-if="selectedEdition" class="edition-desc">
          {{ selectedEdition.description }}
        </p>

        <el-form-item label="换算模式">
          <el-radio-group v-model="convertMode" @change="handleModeChange">
            <el-radio value="single">单条换算</el-radio>
            <el-radio value="range">区间批量换算</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="convertMode === 'single'">
          <el-form-item label="换算方向">
            <el-radio-group v-model="inputType" @change="handleInputTypeChange">
              <el-radio value="modern">现代页码 → 古页码</el-radio>
              <el-radio value="ancient">古页码 → 现代页码</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item :label="inputType === 'modern' ? '现代页码' : '古页码'">
            <el-input
              v-model="inputValue"
              :placeholder="inputPlaceholder"
              clearable
              @keyup.enter="handleConvert"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button type="primary" @click="handleConvert">换算</el-button>
            <el-button :disabled="!hasResult" :loading="saving" @click="handleSave">
              保存记录
            </el-button>
            <el-button @click="handleReset">清空</el-button>
          </div>
        </template>

        <template v-else>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="起始现代页码">
                <el-input
              v-model="startPage"
              placeholder="请输入起始现代页码（正整数）"
              clearable
              type="number"
              @keyup.enter="handleBatchConvert"
            />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="结束现代页码">
                <el-input
              v-model="endPage"
              placeholder="请输入结束现代页码（正整数）"
              clearable
              type="number"
              @keyup.enter="handleBatchConvert"
            />
              </el-form-item>
            </el-col>
          </el-row>

          <div class="form-actions">
            <el-button type="primary" @click="handleBatchConvert">批量换算</el-button>
            <el-button @click="handleReset">清空</el-button>
          </div>
        </template>
      </el-form>

      <div v-if="convertMode === 'single' && hasResult" class="result-box">
        <div class="result-label">{{ outputLabel }}</div>
        <div class="result-value">{{ outputValue }}</div>
      </div>

      <div v-if="convertMode === 'range' && hasBatchResult" class="batch-result-box">
        <div class="result-summary">
          批量换算结果：共 {{ batchResult?.foundCount }}/{{ batchResult?.total }} 条匹配
        </div>
        <div class="batch-table-wrapper">
          <el-table :data="paginatedBatchItems" stripe style="width: 100%" size="small">
            <el-table-column
              prop="modernPage"
              label="现代页码"
              width="100"
              align="center"
            />
            <el-table-column
              prop="ancientPage"
              label="古页码"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                <span v-if="row.found">{{ row.ancientPage }}</span>
                <span v-else class="not-found">未匹配</span>
              </template>
            </el-table-column>
            <el-table-column
              label="状态"
              width="90"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="row.found ? 'success' : 'info'" size="small">
                  {{ row.found ? '已匹配' : '未匹配' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="batchCurrentPage"
            :page-size="batchPageSize"
            :total="batchTotal"
            layout="prev, pager, next, total"
            :page-sizes="[batchPageSize]"
            background
            @current-change="handleBatchCurrentChange"
          />
        </div>
      </div>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="warning"
        show-icon
        :closable="false"
        class="error-alert"
      />
    </div>

    <div v-if="selectedVolume" class="literary-card mapping-hint">
      <span class="section-label">本卷页码映射示例（Mock）</span>
      <el-table :data="selectedVolume.mappings.slice(0, 5)" stripe size="small">
        <el-table-column prop="modernPage" label="现代页码" width="120" />
        <el-table-column prop="ancientPage" label="古页码" />
      </el-table>
      <p class="hint-text">
        当前共 {{ selectedVolume.mappings.length }} 条映射，
        <RouterLink to="/mapping" class="hint-link">查看完整映射表 →</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.edition-select-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.edition-select-wrapper :deep(.el-select) {
  flex: 1;
}

.favorite-btn {
  flex-shrink: 0;
}

.option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.option-label {
  flex: 1;
}

.star-icon {
  flex-shrink: 0;
}

.star-icon.favorite {
  color: #f59e0b;
  fill: #f59e0b;
}

.favorite-hint {
  width: 100%;
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--ink-secondary);
  letter-spacing: 0.03em;
}

.edition-desc {
  margin: -8px 0 20px;
  padding: 10px 14px;
  background: #f0ebe0;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--ink-secondary);
  line-height: 1.6;
}

.error-alert {
  margin-top: 20px;
}

.mapping-hint {
  margin-top: 20px;
}

.hint-text {
  margin: 12px 0 0;
  font-size: 0.8rem;
  color: var(--ink-secondary);
}

.hint-link {
  color: var(--accent);
  text-decoration: none;
}

.hint-link:hover {
  text-decoration: underline;
}

.batch-result-box {
  margin-top: 20px;
}

.batch-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.result-summary {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #f0ebe0;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--ink-secondary);
  font-weight: 500;
}

.not-found {
  color: #9ca3af;
  font-style: italic;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.pagination-wrapper :deep(.el-pagination.is-background .el-pager li:not(.is-active).is-hover) {
  color: var(--accent);
}

.pagination-wrapper :deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--accent);
}

.pagination-wrapper :deep(.el-pagination button:hover:not(:disabled)) {
  color: var(--accent);
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useToggle } from '@vueuse/core'
import { useEditionStore } from '@/stores/edition'
import { convertPage, validatePageInput } from '@/utils/converter'
import type { PageInputType } from '@/types'

const editionStore = useEditionStore()

const editionId = ref('')
const volumeId = ref('')
const inputType = ref<PageInputType>('modern')
const inputValue = ref('')
const outputValue = ref('')
const errorMessage = ref('')

const [saving, toggleSaving] = useToggle(false)

const editionOptions = computed(() =>
  editionStore.editions.map((e) => ({ label: e.name, value: e.id })),
)

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

/** 初始化默认选中第一项 */
function initDefaults(): void {
  const firstEdition = editionStore.editions[0]
  if (!firstEdition) return
  editionId.value = firstEdition.id
  volumeId.value = firstEdition.volumes[0]?.id ?? ''
}

watch(editionId, (newId) => {
  const edition = editionStore.getEditionById(newId)
  volumeId.value = edition?.volumes[0]?.id ?? ''
  resetResult()
})

watch([inputType, volumeId], () => {
  resetResult()
})

/**
 * 清空换算结果
 */
function resetResult(): void {
  outputValue.value = ''
  errorMessage.value = ''
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
 * 重置表单
 */
function handleReset(): void {
  inputValue.value = ''
  resetResult()
}

initDefaults()
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">页码换算</h1>
    <p class="page-subtitle">
      选择古籍版本与卷册，输入现代页码或古页码，自动换算另一种页码体系
    </p>

    <div class="literary-card">
      <el-form label-position="top" @submit.prevent="handleConvert">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="古籍版本">
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
                />
              </el-select>
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
      </el-form>

      <div v-if="hasResult" class="result-box">
        <div class="result-label">{{ outputLabel }}</div>
        <div class="result-value">{{ outputValue }}</div>
      </div>

      <el-alert
        v-else-if="errorMessage"
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
      <p class="hint-text">完整映射表后续版本可展开查看，当前共 {{ selectedVolume.mappings.length }} 条</p>
    </div>
  </div>
</template>

<style scoped>
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
</style>

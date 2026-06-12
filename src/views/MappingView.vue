<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { useEditionStore } from '@/stores/edition'

const editionStore = useEditionStore()

editionStore.initSelection()

const editionId = computed({
  get: () => editionStore.selectedEditionId,
  set: (val: string) => { editionStore.selectedEditionId = val },
})
const volumeId = computed({
  get: () => editionStore.selectedVolumeId,
  set: (val: string) => { editionStore.selectedVolumeId = val },
})
const currentPage = ref(1)
const pageSize = ref(10)

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

const paginatedMappings = computed(() => {
  const mappings = selectedVolume.value?.mappings ?? []
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return mappings.slice(start, end)
})

const totalCount = computed(() => selectedVolume.value?.mappings.length ?? 0)

const hasData = computed(() => editionStore.editions.length > 0)

watch(editionId, () => {
  editionStore.syncVolumeOnEditionChange()
  currentPage.value = 1
})

watch(volumeId, () => {
  currentPage.value = 1
})

function handleCurrentChange(page: number): void {
  currentPage.value = page
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">卷册完整映射表</h1>
    <p class="page-subtitle">
      选择古籍版本与卷册，浏览该卷全部现代页码与古页码的完整对照关系
    </p>

    <div class="literary-card filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="8">
          <div class="edition-select-wrapper">
            <el-select
              v-model="editionId"
              placeholder="请选择版本"
              style="width: 100%"
              size="default"
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
            已收藏 {{ favoriteCount }} 个常用版本
          </div>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-select
            v-model="volumeId"
            placeholder="请选择卷册"
            style="width: 100%"
            :disabled="!editionId"
            size="default"
          >
            <el-option
              v-for="opt in volumeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8">
          <span v-if="selectedVolume" class="volume-summary">
            {{ selectedVolume.name }} · 共 {{ totalCount }} 条映射
          </span>
        </el-col>
      </el-row>
      <p v-if="selectedEdition" class="edition-desc">
        {{ selectedEdition.description }}
      </p>
    </div>

    <div v-if="hasData" class="literary-card">
      <el-table :data="paginatedMappings" stripe style="width: 100%" size="small">
        <el-table-column
          type="index"
          label="序号"
          width="80"
          align="center"
          :index="(index: number) => (currentPage - 1) * pageSize + index + 1"
        />
        <el-table-column prop="modernPage" label="现代页码" width="120" align="center" />
        <el-table-column prop="ancientPage" label="古页码" align="center" />
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          layout="prev, pager, next, total"
          :page-sizes="[pageSize]"
          background
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <div v-else class="literary-card">
      <div class="empty-hint">
        <p>暂无古籍数据</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edition-select-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
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
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--ink-secondary);
  letter-spacing: 0.03em;
}

.filter-card {
  padding: 16px 24px;
}

.volume-summary {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--ink-secondary);
  letter-spacing: 0.04em;
  line-height: 32px;
}

.edition-desc {
  margin: 8px 0 0;
  padding: 8px 14px;
  background: #f0ebe0;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--ink-secondary);
  line-height: 1.6;
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

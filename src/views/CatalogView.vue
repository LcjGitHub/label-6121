<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Star, StarFilled, CaretRight, CaretBottom, Document } from '@element-plus/icons-vue'
import { useEditionStore } from '@/stores/edition'
import type { Volume } from '@/types'

const router = useRouter()
const editionStore = useEditionStore()

const expandedEditions = ref<Set<string>>(new Set(editionStore.editions.map((e) => e.id)))

function toggleEdition(editionId: string): void {
  if (expandedEditions.value.has(editionId)) {
    expandedEditions.value.delete(editionId)
  } else {
    expandedEditions.value.add(editionId)
  }
}

function isExpanded(editionId: string): boolean {
  return expandedEditions.value.has(editionId)
}

function handleVolumeClick(editionId: string, volumeId: string): void {
  editionStore.selectedEditionId = editionId
  editionStore.selectedVolumeId = volumeId
  router.push({
    path: '/',
    query: { edition: editionId, volume: volumeId },
  })
}

function handleToggleFavorite(editionId: string, event: Event): void {
  event.stopPropagation()
  editionStore.toggleFavoriteEdition(editionId)
}

function getVolumeSummary(volume: Volume): string {
  const mappings = volume.mappings
  if (mappings.length === 0) return '暂无映射数据'
  const first = mappings[0]
  const last = mappings[mappings.length - 1]
  return `共 ${mappings.length} 条映射 · 现代页码 ${first.modernPage}-${last.modernPage}`
}

function expandAll(): void {
  editionStore.editions.forEach((e) => expandedEditions.value.add(e.id))
}

function collapseAll(): void {
  expandedEditions.value.clear()
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">古籍版本目录</h1>
        <p class="page-subtitle">浏览所有古籍版本及其卷册结构，点击卷册可快速跳转至页码换算</p>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="expandAll">全部展开</el-button>
        <el-button size="small" @click="collapseAll">全部收起</el-button>
      </div>
    </div>

    <div v-if="editionStore.editions.length > 0" class="catalog-list">
      <div
        v-for="edition in editionStore.getSortedEditionsWithFavorite()"
        :key="edition.id"
        class="edition-card literary-card"
      >
        <div class="edition-header" @click="toggleEdition(edition.id)">
          <div class="edition-main-info">
            <el-icon class="expand-icon" :size="16">
              <component :is="isExpanded(edition.id) ? CaretBottom : CaretRight" />
            </el-icon>
            <div class="edition-title-wrapper">
              <h3 class="edition-title">
                {{ edition.name }}
                <el-icon
                  v-if="edition.isFavorite"
                  class="favorite-icon"
                  :size="16"
                >
                  <StarFilled />
                </el-icon>
              </h3>
              <p class="edition-desc">{{ edition.description }}</p>
            </div>
          </div>
          <div class="edition-actions">
            <el-tooltip
              :content="edition.isFavorite ? '取消收藏此版本' : '收藏此版本'"
              placement="top"
            >
              <el-button
                :type="edition.isFavorite ? 'warning' : 'default'"
                :icon="edition.isFavorite ? StarFilled : Star"
                circle
                size="small"
                @click="handleToggleFavorite(edition.id, $event)"
              />
            </el-tooltip>
          </div>
        </div>

        <div v-show="isExpanded(edition.id)" class="volume-list">
          <div
            v-for="volume in editionStore.getEditionById(edition.id)?.volumes"
            :key="volume.id"
            class="volume-item"
            @click="handleVolumeClick(edition.id, volume.id)"
          >
            <el-icon class="volume-icon" :size="18">
              <Document />
            </el-icon>
            <div class="volume-info">
              <div class="volume-name">{{ volume.name }}</div>
              <div class="volume-summary">{{ getVolumeSummary(volume) }}</div>
            </div>
            <el-icon class="arrow-icon" :size="16">
              <CaretRight />
            </el-icon>
          </div>
        </div>

        <div v-show="isExpanded(edition.id)" class="edition-footer">
          <span class="volume-count">
            共 {{ editionStore.getEditionById(edition.id)?.volumes.length ?? 0 }} 卷
          </span>
        </div>
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
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.catalog-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edition-card {
  padding: 0;
  overflow: hidden;
}

.edition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.edition-header:hover {
  background-color: rgba(139, 90, 43, 0.04);
}

.edition-main-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.expand-icon {
  color: var(--ink-secondary);
  margin-top: 4px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.edition-title-wrapper {
  flex: 1;
  min-width: 0;
}

.edition-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ink-primary);
  letter-spacing: 0.05em;
}

.favorite-icon {
  color: #f59e0b;
  fill: #f59e0b;
}

.edition-desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ink-secondary);
  line-height: 1.6;
}

.edition-actions {
  flex-shrink: 0;
  margin-left: 16px;
}

.volume-list {
  border-top: 1px solid var(--paper-border);
  padding: 8px 0;
  background-color: rgba(240, 235, 224, 0.3);
}

.volume-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px 14px 52px;
  cursor: pointer;
  transition: background-color 0.2s ease, padding-left 0.2s ease;
}

.volume-item:hover {
  background-color: rgba(139, 90, 43, 0.06);
  padding-left: 60px;
}

.volume-icon {
  color: var(--accent);
  flex-shrink: 0;
}

.volume-info {
  flex: 1;
  min-width: 0;
}

.volume-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ink-primary);
  margin-bottom: 2px;
}

.volume-summary {
  font-size: 0.8rem;
  color: var(--ink-secondary);
  letter-spacing: 0.03em;
}

.arrow-icon {
  color: var(--ink-secondary);
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
}

.volume-item:hover .arrow-icon {
  opacity: 1;
  transform: translateX(0);
}

.edition-footer {
  padding: 10px 24px;
  border-top: 1px solid var(--paper-border);
  text-align: right;
}

.volume-count {
  font-size: 0.75rem;
  color: var(--ink-secondary);
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .edition-header {
    padding: 16px;
  }

  .volume-item {
    padding: 12px 16px 12px 44px;
  }

  .volume-item:hover {
    padding-left: 52px;
  }

  .edition-footer {
    padding: 8px 16px;
  }
}
</style>

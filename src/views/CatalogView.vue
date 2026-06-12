<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, StarFilled, CaretRight, CaretBottom, Document } from '@element-plus/icons-vue'
import { useEditionStore } from '@/stores/edition'

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

function getVolumeAriaLabel(editionName: string, volumeName: string, volumeDesc: string): string {
  return `${editionName}，${volumeName}，${volumeDesc}。点击可跳转至页码换算。`
}

function handleVolumeClick(editionId: string, volumeId: string): void {
  editionStore.selectedEditionId = editionId
  editionStore.selectedVolumeId = volumeId
  router.push({
    path: '/',
    query: { edition: editionId, volume: volumeId }
  })
}

function handleToggleFavorite(editionId: string): void {
  editionStore.toggleFavoriteEdition(editionId)
}

function expandAll(): void {
  editionStore.editions.forEach((e) => expandedEditions.value.add(e.id))
}

function collapseAll(): void {
  expandedEditions.value.clear()
}

const sortedEditions = computed(() => editionStore.getSortedEditionsWithFavorite())
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

    <div v-if="sortedEditions.length > 0" class="catalog-list">
      <section
        v-for="edition in sortedEditions"
        :key="edition.id"
        class="edition-card literary-card"
      >
        <div class="edition-header-row">
          <button
            type="button"
            class="edition-toggle"
            :aria-expanded="isExpanded(edition.id)"
            :aria-controls="`edition-content-${edition.id}`"
            @click="toggleEdition(edition.id)"
          >
            <el-icon class="expand-icon" :size="16" aria-hidden="true">
              <component :is="isExpanded(edition.id) ? CaretBottom : CaretRight" />
            </el-icon>
            <div class="edition-title-wrapper">
              <h3 class="edition-title">
                {{ edition.name }}
                <el-icon
                  v-if="edition.isFavorite"
                  class="favorite-icon"
                  :size="16"
                  aria-label="已收藏"
                >
                  <StarFilled />
                </el-icon>
              </h3>
              <p class="edition-desc">{{ edition.description }}</p>
            </div>
          </button>
          <div class="edition-actions">
            <el-tooltip
              :content="edition.isFavorite ? '取消收藏此版本' : '收藏此版本'"
              placement="top"
            >
              <el-button
                :type="edition.isFavorite ? 'warning' : 'default'"
                :icon="edition.isFavorite ? StarFilled : Star"
                :aria-label="edition.isFavorite ? '取消收藏此版本' : '收藏此版本'"
                circle
                size="small"
                @click="handleToggleFavorite(edition.id)"
              />
            </el-tooltip>
          </div>
        </div>

        <ul
          v-show="isExpanded(edition.id)"
          :id="`edition-content-${edition.id}`"
          class="volume-list"
          role="list"
        >
          <li
            v-for="volume in editionStore.getEditionById(edition.id)?.volumes"
            :key="volume.id"
            role="listitem"
          >
            <button
              type="button"
              class="volume-item"
              :aria-label="getVolumeAriaLabel(edition.name, volume.name, volume.description)"
              @click="handleVolumeClick(edition.id, volume.id)"
            >
              <el-icon class="volume-icon" :size="18" aria-hidden="true">
                <Document />
              </el-icon>
              <div class="volume-info">
                <div class="volume-name">{{ volume.name }}</div>
                <div class="volume-desc">{{ volume.description }}</div>
              </div>
              <el-icon class="arrow-icon" :size="16" aria-hidden="true">
                <CaretRight />
              </el-icon>
            </button>
          </li>
        </ul>

        <footer v-show="isExpanded(edition.id)" class="edition-footer">
          <span class="volume-count">
            共 {{ editionStore.getEditionById(edition.id)?.volumes.length ?? 0 }} 卷
          </span>
        </footer>
      </section>
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

.edition-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.edition-toggle {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  padding: 20px 0 20px 24px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: background-color 0.2s ease;
  outline: none;
}

.edition-toggle:hover,
.edition-toggle:focus-visible {
  background-color: rgba(139, 90, 43, 0.04);
}

.edition-toggle:focus-visible {
  box-shadow: inset 3px 0 0 0 var(--accent);
}

.expand-icon {
  color: var(--ink-secondary);
  margin-top: 4px;
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
  padding: 20px 24px 20px 0;
}

.volume-list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  border-top: 1px solid var(--paper-border);
  background-color: rgba(240, 235, 224, 0.3);
}

.volume-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 24px 14px 52px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition:
    background-color 0.2s ease,
    padding-left 0.2s ease;
  outline: none;
}

.volume-item:hover,
.volume-item:focus-visible {
  background-color: rgba(139, 90, 43, 0.06);
}

.volume-item:hover {
  padding-left: 60px;
}

.volume-item:focus-visible {
  box-shadow: inset 3px 0 0 0 var(--accent);
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
  margin-bottom: 4px;
}

.volume-desc {
  font-size: 0.82rem;
  color: var(--ink-secondary);
  line-height: 1.5;
}

.arrow-icon {
  color: var(--ink-secondary);
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
}

.volume-item:hover .arrow-icon,
.volume-item:focus-visible .arrow-icon {
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
  .edition-toggle {
    padding: 16px 0 16px 16px;
  }

  .edition-actions {
    padding: 16px 16px 16px 0;
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

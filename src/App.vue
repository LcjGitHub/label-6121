<script setup lang="ts">
import { computed } from 'vue'
import { Star } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditionStore } from '@/stores/edition'

const route = useRoute()
const router = useRouter()
const editionStore = useEditionStore()

const activeMenu = computed(() => route.path)

const recordCount = computed(() => editionStore.records.length)
const favoriteCount = computed(() => editionStore.favoriteCount)

/**
 * 导航至指定路径
 * @param path - 目标路由
 */
function navigateTo(path: string): void {
  router.push(path)
}
</script>

<template>
  <el-container class="app-layout">
    <el-header class="app-header" height="64px">
      <div class="header-inner">
        <div class="brand" @click="navigateTo('/')">
          <span class="brand-mark">📜</span>
          <span class="brand-text">古籍页码对照器</span>
        </div>
        <div class="nav-area">
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            class="nav-menu"
            :ellipsis="false"
            @select="navigateTo"
          >
            <el-menu-item index="/">页码换算</el-menu-item>
            <el-menu-item index="/catalog">古籍版本目录</el-menu-item>
            <el-menu-item index="/mapping">卷册完整映射表</el-menu-item>
            <el-menu-item index="/history">
              对照记录
              <el-badge
                v-if="recordCount > 0"
                :value="recordCount"
                :max="99"
                class="record-badge"
              />
            </el-menu-item>
          </el-menu>
          <el-tooltip
            v-if="favoriteCount > 0"
            :content="`已收藏 ${favoriteCount} 个常用版本`"
            placement="bottom"
          >
            <div class="favorite-indicator">
              <el-icon :size="16" class="favorite-star">
                <Star />
              </el-icon>
              <el-badge :value="favoriteCount" :max="99" class="favorite-badge" />
            </div>
          </el-tooltip>
        </div>
      </div>
    </el-header>

    <el-main class="app-main">
      <router-view />
    </el-main>

    <el-footer class="app-footer" height="48px">
      Mock 数据仅供框架演示 · 后续可接入真实古籍页码库
    </el-footer>
  </el-container>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--paper-bg);
}

.app-header {
  background: var(--header-bg);
  border-bottom: 1px solid var(--paper-border);
  padding: 0;
}

.header-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.brand-mark {
  font-size: 1.25rem;
}

.brand-text {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink-primary);
}

.nav-area {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 0 0 auto;
}

.nav-menu {
  background: transparent;
  border-bottom: none;
  flex: 0 0 auto;
}

.favorite-indicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.1);
  cursor: default;
}

.favorite-star {
  color: #f59e0b;
  fill: #f59e0b;
}

.favorite-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  transform: translate(50%, -50%);
}

.nav-menu :deep(.el-menu-item) {
  font-family: inherit;
  letter-spacing: 0.06em;
  color: var(--ink-secondary);
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: var(--accent) !important;
  border-bottom-color: var(--accent) !important;
}

.record-badge {
  margin-left: 6px;
  vertical-align: middle;
}

.app-main {
  padding: 0;
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: var(--ink-secondary);
  border-top: 1px solid var(--paper-border);
  background: var(--header-bg);
  letter-spacing: 0.04em;
}
</style>

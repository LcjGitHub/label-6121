<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { filterMappings } from '@/utils/mappingFilter'
import type { PageMapping } from '@/types'

interface Props {
  mappings: PageMapping[]
  collapsedCount?: number
  showExpandToggle?: boolean
  showSearchOnExpand?: boolean
  title?: string
  showIndex?: boolean
  size?: 'large' | 'default' | 'small'
}

const props = withDefaults(defineProps<Props>(), {
  collapsedCount: 5,
  showExpandToggle: true,
  showSearchOnExpand: true,
  title: '本卷页码映射示例',
  showIndex: false,
  size: 'small'
})

const isExpanded = ref(false)
const searchKeyword = ref('')

function handleToggleExpand(): void {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    searchKeyword.value = ''
  }
}

function clearSearch(): void {
  searchKeyword.value = ''
}

const displayMappings = computed(() => {
  if (!props.mappings || props.mappings.length === 0) {
    return []
  }
  if (isExpanded.value) {
    return filterMappings(props.mappings, searchKeyword.value)
  }
  return props.mappings.slice(0, props.collapsedCount)
})

const totalCount = computed(() => props.mappings?.length ?? 0)
const filteredCount = computed(() => displayMappings.value.length)
const hasMore = computed(() => totalCount.value > props.collapsedCount)

watch(
  () => props.mappings,
  () => {
    searchKeyword.value = ''
  }
)
</script>

<template>
  <div class="mapping-table-container">
    <div class="mapping-header">
      <span class="section-label">{{ title }}</span>
      <div class="header-meta">
        <span v-if="isExpanded && searchKeyword" class="filter-info">
          筛选结果：{{ filteredCount }}/{{ totalCount }} 条
        </span>
        <span v-else class="filter-info"> 共 {{ totalCount }} 条映射 </span>
        <el-button
          v-if="showExpandToggle && hasMore"
          :icon="isExpanded ? ArrowUp : ArrowDown"
          size="small"
          text
          type="primary"
          @click="handleToggleExpand"
        >
          {{ isExpanded ? '收起' : '展开全部映射表' }}
        </el-button>
      </div>
    </div>

    <div v-if="isExpanded && showSearchOnExpand" class="search-wrapper">
      <el-input
        v-model="searchKeyword"
        :placeholder="'输入现代页码数字或古页码文字搜索...'"
        clearable
        :prefix-icon="Search"
        size="default"
        class="search-input"
        @clear="clearSearch"
      />
    </div>

    <el-table :data="displayMappings" stripe :size="size" style="width: 100%">
      <el-table-column
        v-if="showIndex && isExpanded"
        type="index"
        label="序号"
        width="80"
        align="center"
      />
      <el-table-column prop="modernPage" label="现代页码" width="120" align="center" />
      <el-table-column prop="ancientPage" label="古页码" align="center" />
    </el-table>

    <div
      v-if="isExpanded && showSearchOnExpand && searchKeyword && filteredCount === 0"
      class="empty-tip"
    >
      未找到匹配的映射记录，请尝试其他关键字
    </div>
  </div>
</template>

<style scoped>
.mapping-table-container {
  width: 100%;
}

.mapping-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink-primary, #4a3728);
  letter-spacing: 0.05em;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-info {
  font-size: 0.8rem;
  color: var(--ink-secondary, #8b7355);
}

.search-wrapper {
  margin-bottom: 12px;
}

.search-input {
  max-width: 360px;
}

.empty-tip {
  margin-top: 12px;
  padding: 12px 16px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-secondary);
  background: #faf7f0;
  border-radius: 4px;
}
</style>

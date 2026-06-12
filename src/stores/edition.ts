import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import editionsData from '@/mock/editions.json'
import type { ConversionRecord, Edition, PageInputType, Volume } from '@/types'

/**
 * 古籍版本与对照历史记录 Store
 */
export const useEditionStore = defineStore(
  'edition',
  () => {
    const editions = ref<Edition[]>(editionsData.editions)
    const records = ref<ConversionRecord[]>([])

    const sortedRecords = computed(() =>
      [...records.value].sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      ),
    )

    /**
     * 根据 ID 获取版本
     * @param editionId - 版本 ID
     */
    function getEditionById(editionId: string): Edition | undefined {
      return editions.value.find((e) => e.id === editionId)
    }

    /**
     * 根据 ID 获取卷册
     * @param editionId - 版本 ID
     * @param volumeId - 卷册 ID
     */
    function getVolumeById(editionId: string, volumeId: string): Volume | undefined {
      const edition = getEditionById(editionId)
      return edition?.volumes.find((v) => v.id === volumeId)
    }

    /**
     * 保存对照记录
     */
    function addRecord(payload: {
      editionId: string
      editionName: string
      volumeId: string
      volumeName: string
      inputType: PageInputType
      inputValue: string
      outputValue: string
    }): void {
      records.value.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...payload,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      })
    }

    /**
     * 删除单条记录
     * @param id - 记录 ID
     */
    function removeRecord(id: string): void {
      records.value = records.value.filter((r) => r.id !== id)
    }

    /**
     * 清空全部记录
     */
    function clearRecords(): void {
      records.value = []
    }

    return {
      editions,
      records,
      sortedRecords,
      getEditionById,
      getVolumeById,
      addRecord,
      removeRecord,
      clearRecords,
    }
  },
  {
    persist: {
      paths: ['records'],
    },
  },
)

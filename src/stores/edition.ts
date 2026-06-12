import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import editionsData from '@/mock/editions.json'
import type { ConversionRecord, Edition, MappingBackup, PageInputType, Volume } from '@/types'
import { mergeRecords, parseBackupFile, serializeBackup, triggerDownload } from '@/utils/backup'

/**
 * 古籍版本与对照历史记录 Store
 */
export const useEditionStore = defineStore(
  'edition',
  () => {
    const editions = ref<Edition[]>(editionsData.editions)
    const records = ref<ConversionRecord[]>([])
    const selectedEditionId = ref('')
    const selectedVolumeId = ref('')

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

    function initSelection(): void {
      if (selectedEditionId.value) return
      const firstEdition = editions.value[0]
      if (!firstEdition) return
      selectedEditionId.value = firstEdition.id
      selectedVolumeId.value = firstEdition.volumes[0]?.id ?? ''
    }

    function syncVolumeOnEditionChange(): void {
      const edition = getEditionById(selectedEditionId.value)
      const volumeExists = edition?.volumes.some((v) => v.id === selectedVolumeId.value)
      if (!volumeExists) {
        selectedVolumeId.value = edition?.volumes[0]?.id ?? ''
      }
    }

    function exportRecords(): void {
      const jsonStr = serializeBackup(records.value)
      triggerDownload(jsonStr)
    }

    function importRecords(fileContent: string): { added: number; updated: number; total: number } {
      const backup: MappingBackup = parseBackupFile(fileContent)
      const result = mergeRecords(records.value, backup.records)
      records.value = result.records
      return { added: result.added, updated: result.updated, total: records.value.length }
    }

    return {
      editions,
      records,
      selectedEditionId,
      selectedVolumeId,
      sortedRecords,
      getEditionById,
      getVolumeById,
      addRecord,
      removeRecord,
      clearRecords,
      initSelection,
      syncVolumeOnEditionChange,
      exportRecords,
      importRecords,
    }
  },
  {
    persist: {
      paths: ['records'],
    },
  },
)

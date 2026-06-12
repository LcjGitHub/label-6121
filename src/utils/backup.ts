import dayjs from 'dayjs'
import type { ConversionRecord, MappingBackup } from '@/types'

const BACKUP_VERSION = '1.0'

export function serializeBackup(records: ConversionRecord[]): string {
  const backup: MappingBackup = {
    meta: {
      version: BACKUP_VERSION,
      exportedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      recordCount: records.length,
    },
    records,
  }
  return JSON.stringify(backup, null, 2)
}

export function triggerDownload(jsonStr: string, filename?: string): void {
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename ?? `mapping-backup-${dayjs().format('YYYYMMDD-HHmmss')}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function parseBackupFile(text: string): MappingBackup {
  const parsed = JSON.parse(text)
  if (!parsed.meta || !parsed.records || !Array.isArray(parsed.records)) {
    throw new Error('备份文件格式不正确：缺少 meta 或 records 字段')
  }
  if (typeof parsed.meta.version !== 'string' || typeof parsed.meta.exportedAt !== 'string') {
    throw new Error('备份文件元信息不完整')
  }
  for (const rec of parsed.records as ConversionRecord[]) {
    if (!rec.id || !rec.editionId || !rec.createdAt) {
      throw new Error('备份文件中包含无效的对照记录')
    }
  }
  return parsed as MappingBackup
}

export function mergeRecords(
  existing: ConversionRecord[],
  incoming: ConversionRecord[],
): ConversionRecord[] {
  const map = new Map<string, ConversionRecord>()
  for (const rec of existing) {
    map.set(rec.id, rec)
  }
  for (const rec of incoming) {
    const prev = map.get(rec.id)
    if (!prev) {
      map.set(rec.id, rec)
    } else {
      const prevTime = dayjs(prev.createdAt).valueOf()
      const incomingTime = dayjs(rec.createdAt).valueOf()
      if (incomingTime > prevTime) {
        map.set(rec.id, rec)
      }
    }
  }
  return Array.from(map.values())
}

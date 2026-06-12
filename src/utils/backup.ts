import dayjs from 'dayjs'
import type { ConversionRecord, MappingBackup } from '@/types'

const BACKUP_VERSION = '1.0'

const REQUIRED_RECORD_FIELDS: Array<keyof ConversionRecord> = [
  'id',
  'editionId',
  'editionName',
  'volumeId',
  'volumeName',
  'inputType',
  'inputValue',
  'outputValue',
  'createdAt'
]

export function serializeBackup(records: ConversionRecord[]): string {
  const backup: MappingBackup = {
    meta: {
      version: BACKUP_VERSION,
      exportedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      recordCount: records.length
    },
    records
  }
  return JSON.stringify(backup, null, 2)
}

export function triggerDownload(jsonStr: string, filename?: string): void {
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename ?? `对照记录备份-${dayjs().format('YYYYMMDD-HHmmss')}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function parseBackupFile(text: string): MappingBackup {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('备份文件格式不正确，无法解析')
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('meta' in parsed) ||
    !('records' in parsed) ||
    !Array.isArray((parsed as MappingBackup).records)
  ) {
    throw new Error('备份文件格式不正确，无法解析')
  }
  const backup = parsed as MappingBackup
  if (typeof backup.meta.version !== 'string' || typeof backup.meta.exportedAt !== 'string') {
    throw new Error('备份文件格式不正确，无法解析')
  }
  for (let i = 0; i < backup.records.length; i++) {
    const rec = backup.records[i] as ConversionRecord
    for (const field of REQUIRED_RECORD_FIELDS) {
      if (!rec[field]) {
        throw new Error(`第 ${i + 1} 条记录缺少必填字段「${field}」，备份文件格式不正确`)
      }
    }
    if (rec.remark === undefined) {
      rec.remark = ''
    }
  }
  return backup
}

export interface MergeResult {
  records: ConversionRecord[]
  added: number
  updated: number
}

export function mergeRecords(
  existing: ConversionRecord[],
  incoming: ConversionRecord[]
): MergeResult {
  const map = new Map<string, ConversionRecord>()
  let added = 0
  let updated = 0
  for (const rec of existing) {
    map.set(rec.id, rec)
  }
  for (const rec of incoming) {
    const prev = map.get(rec.id)
    if (!prev) {
      map.set(rec.id, rec)
      added++
    } else {
      const prevTime = dayjs(prev.createdAt).valueOf()
      const incomingTime = dayjs(rec.createdAt).valueOf()
      if (incomingTime > prevTime) {
        map.set(rec.id, rec)
        updated++
      }
    }
  }
  return { records: Array.from(map.values()), added, updated }
}

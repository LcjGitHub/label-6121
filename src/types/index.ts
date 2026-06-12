/** 单条页码映射 */
export interface PageMapping {
  modernPage: number
  ancientPage: string
}

/** 卷册 */
export interface Volume {
  id: string
  name: string
  description: string
  mappings: PageMapping[]
}

/** 古籍版本 */
export interface Edition {
  id: string
  name: string
  description: string
  volumes: Volume[]
}

/** Mock 数据根结构 */
export interface EditionsData {
  editions: Edition[]
}

/** 输入页码类型 */
export type PageInputType = 'modern' | 'ancient'

/** 换算模式 */
export type ConvertMode = 'single' | 'range'

/** 对照历史记录 */
export interface ConversionRecord {
  id: string
  editionId: string
  editionName: string
  volumeId: string
  volumeName: string
  inputType: PageInputType
  inputValue: string
  outputValue: string
  createdAt: string
}

/** 换算结果 */
export interface ConversionResult {
  success: boolean
  outputValue?: string
  message?: string
}

/** 批量换算单条结果 */
export interface BatchConversionItem {
  modernPage: number
  ancientPage: string
  found: boolean
}

/** 批量换算结果 */
export interface BatchConversionResult {
  items: BatchConversionItem[]
  total: number
  foundCount: number
}

/** 备份文件元信息 */
export interface BackupMeta {
  version: string
  exportedAt: string
  recordCount: number
}

/** 备份文件完整结构 */
export interface MappingBackup {
  meta: BackupMeta
  records: ConversionRecord[]
}

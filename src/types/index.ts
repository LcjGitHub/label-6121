/** 单条页码映射 */
export interface PageMapping {
  modernPage: number
  ancientPage: string
}

/** 卷册 */
export interface Volume {
  id: string
  name: string
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

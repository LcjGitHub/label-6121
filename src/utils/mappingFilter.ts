import type { PageMapping } from '@/types'

export type FilterField = 'both' | 'modern' | 'ancient'

export interface FilterOptions {
  field?: FilterField
  caseSensitive?: boolean
  exactMatch?: boolean
}

export interface FilterResult {
  items: PageMapping[]
  total: number
  matched: number
  keyword: string
}

function normalize(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase()
}

function matchValue(source: string, target: string, exactMatch: boolean): boolean {
  if (exactMatch) {
    return source === target
  }
  return source.includes(target)
}

/**
 * 根据关键字过滤页码映射表
 * 支持按现代页码数字或古页码文字进行实时过滤
 * @param mappings - 页码映射表
 * @param keyword - 搜索关键字
 * @param options - 过滤选项
 */
export function filterMappings(
  mappings: PageMapping[],
  keyword: string,
  options: FilterOptions = {},
): PageMapping[] {
  const { field = 'both', caseSensitive = false, exactMatch = false } = options
  const trimmed = keyword.trim()

  if (!trimmed) {
    return mappings
  }

  const normalizedKeyword = normalize(trimmed, caseSensitive)
  const isPureNumeric = isNumericKeyword(trimmed)

  return mappings.filter((m) => {
    const modernStr = normalize(String(m.modernPage), caseSensitive)
    const ancientStr = normalize(m.ancientPage, caseSensitive)

    const matchModern = (): boolean => {
      if (isPureNumeric) {
        return m.modernPage === Number(trimmed)
      }
      if (exactMatch) {
        return modernStr === normalizedKeyword
      }
      return modernStr.includes(normalizedKeyword)
    }

    const matchAncient = (): boolean => {
      return matchValue(ancientStr, normalizedKeyword, exactMatch)
    }

    switch (field) {
      case 'modern':
        return matchModern()
      case 'ancient':
        return matchAncient()
      case 'both':
      default:
        if (isPureNumeric) {
          return matchModern() || matchAncient()
        }
        return matchAncient()
    }
  })
}

/**
 * 带统计信息的过滤函数
 * @param mappings - 页码映射表
 * @param keyword - 搜索关键字
 * @param options - 过滤选项
 */
export function filterMappingsWithStats(
  mappings: PageMapping[],
  keyword: string,
  options: FilterOptions = {},
): FilterResult {
  const items = filterMappings(mappings, keyword, options)
  return {
    items,
    total: mappings.length,
    matched: items.length,
    keyword: keyword.trim(),
  }
}

/**
 * 检查关键字是否可能是数字（现代页码）
 */
export function isNumericKeyword(keyword: string): boolean {
  const trimmed = keyword.trim()
  if (!trimmed) return false
  return /^\d+$/.test(trimmed)
}

/**
 * 获取字段描述文本
 */
export function getFieldLabel(field: FilterField): string {
  switch (field) {
    case 'modern':
      return '现代页码'
    case 'ancient':
      return '古页码'
    case 'both':
    default:
      return '全部字段'
  }
}

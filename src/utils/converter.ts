import type {
  BatchConversionItem,
  BatchConversionResult,
  ConversionResult,
  NearbySuggestion,
  PageInputType,
  PageMapping
} from '@/types'
import { normalizePageInput } from '@/utils/pageNormalize'

/**
 * 校验现代页码是否为正整数
 * @param value - 输入字符串
 */
export function validateModernPage(value: string): string | null {
  const normalized = normalizePageInput(value)
  if (!normalized) {
    return '请输入现代页码'
  }
  if (!/^\d+$/.test(normalized)) {
    return '现代页码须为正整数'
  }
  const num = Number(normalized)
  if (num <= 0 || !Number.isInteger(num)) {
    return '现代页码须为正整数'
  }
  return null
}

/**
 * 校验古页码输入（非空即可，古页码格式多样）
 * @param value - 输入字符串
 */
export function validateAncientPage(value: string): string | null {
  const normalized = normalizePageInput(value)
  if (!normalized) {
    return '请输入古页码'
  }
  return null
}

/**
 * 根据输入类型校验页码
 * @param type - 页码类型
 * @param value - 输入值
 */
export function validatePageInput(type: PageInputType, value: string): string | null {
  return type === 'modern' ? validateModernPage(value) : validateAncientPage(value)
}

/** 中文数字字符到数值的映射 */
const CHINESE_DIGIT_MAP: Record<string, number> = {
  零: 0,
  〇: 0,
  '○': 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  百: 100,
  千: 1000,
  万: 10000
}

/** 天干地支等常见古籍序号字符 */
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/**
 * 解析单个中文数字或序号字符为数值
 * @param ch - 单个字符
 */
function parseChineseChar(ch: string): number | null {
  if (CHINESE_DIGIT_MAP[ch] !== undefined) return CHINESE_DIGIT_MAP[ch]
  const stemIdx = HEAVENLY_STEMS.indexOf(ch)
  if (stemIdx !== -1) return stemIdx + 1
  const branchIdx = EARTHLY_BRANCHES.indexOf(ch)
  if (branchIdx !== -1) return branchIdx + 1
  return null
}

/**
 * 将古页码字符串解析为可比较的数值键数组
 * 按段解析：中文数字段转为数值，阿拉伯数字段转为数值，其他字符保留
 * @param page - 古页码字符串
 */
function parseAncientPageKey(page: string): Array<number | string> {
  const result: Array<number | string> = []
  let i = 0
  while (i < page.length) {
    const ch = page[i]
    // 阿拉伯数字段
    if (/[0-9]/.test(ch)) {
      let numStr = ''
      while (i < page.length && /[0-9]/.test(page[i])) {
        numStr += page[i]
        i++
      }
      result.push(Number(numStr))
      continue
    }
    // 中文字段
    const chineseNum = parseChineseChar(ch)
    if (chineseNum !== null) {
      let current = 0
      let section = 0
      let j = i
      while (j < page.length) {
        const val = parseChineseChar(page[j])
        if (val === null) break
        if (val >= 10) {
          if (current === 0) current = 1
          section += current * val
          current = 0
        } else {
          current = val
        }
        j++
      }
      const total = section + current
      if (total > 0) {
        result.push(total)
        i = j
        continue
      }
    }
    // 普通字符
    result.push(ch)
    i++
  }
  return result
}

/**
 * 比较两个古页码的键数组，支持数值和字符串混合比较
 */
function compareAncientKeys(a: Array<number | string>, b: Array<number | string>): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const av = a[i]
    const bv = b[i]
    if (av === undefined) return -1
    if (bv === undefined) return 1
    if (typeof av === 'number' && typeof bv === 'number') {
      if (av !== bv) return av - bv
    } else {
      const as = String(av)
      const bs = String(bv)
      if (as !== bs) return as < bs ? -1 : 1
    }
  }
  return 0
}

/**
 * 比较两个古页码字符串（基于中文数字语义顺序）
 * @param a - 古页码 A
 * @param b - 古页码 B
 */
function compareAncientPages(a: string, b: string): number {
  return compareAncientKeys(parseAncientPageKey(a), parseAncientPageKey(b))
}

/**
 * 在映射表中查找与输入最接近的三条对照建议
 * 现代页码按数值距离排序（距离相同时按现代页码升序），
 * 古页码在原映射表顺序（按现代页码从小到大）中定位插入位置，取前后相邻条目
 * @param mappings - 页码映射表（按现代页码从小到大排列）
 * @param inputType - 输入类型
 * @param inputValue - 输入值
 */
export function findNearbySuggestions(
  mappings: PageMapping[],
  inputType: PageInputType,
  inputValue: string
): NearbySuggestion[] {
  if (mappings.length === 0) return []

  if (inputType === 'modern') {
    const num = Number(normalizePageInput(inputValue))
    const sorted = [...mappings].sort((a, b) => {
      const distA = Math.abs(a.modernPage - num)
      const distB = Math.abs(b.modernPage - num)
      if (distA !== distB) return distA - distB
      return a.modernPage - b.modernPage
    })
    return sorted.slice(0, 3).map((m) => ({
      modernPage: m.modernPage,
      ancientPage: m.ancientPage
    }))
  }

  const normalized = normalizePageInput(inputValue)
  let insertIdx = mappings.findIndex((m) => compareAncientPages(m.ancientPage, normalized) >= 0)
  if (insertIdx === -1) insertIdx = mappings.length

  const start = Math.max(0, insertIdx - 1)
  const end = Math.min(mappings.length, start + 3)
  const adjustedStart = Math.max(0, end - 3)
  return mappings.slice(adjustedStart, end).map((m) => ({
    modernPage: m.modernPage,
    ancientPage: m.ancientPage
  }))
}

/**
 * 现代页码 → 古页码
 * @param mappings - 页码映射表
 * @param modernPage - 现代页码
 */
export function convertModernToAncient(
  mappings: PageMapping[],
  modernPage: number
): ConversionResult {
  const found = mappings.find((m) => m.modernPage === modernPage)
  if (!found) {
    const suggestions = findNearbySuggestions(mappings, 'modern', String(modernPage))
    return { success: false, message: '未找到对应古页码，请核对卷册与页码', suggestions }
  }
  return { success: true, outputValue: found.ancientPage }
}

/**
 * 古页码 → 现代页码
 * @param mappings - 页码映射表
 * @param ancientPage - 古页码
 */
export function convertAncientToModern(
  mappings: PageMapping[],
  ancientPage: string
): ConversionResult {
  const normalized = normalizePageInput(ancientPage)
  const found = mappings.find((m) => m.ancientPage === normalized)
  if (!found) {
    const suggestions = findNearbySuggestions(mappings, 'ancient', normalized)
    return { success: false, message: '未找到对应现代页码，请核对卷册与页码', suggestions }
  }
  return { success: true, outputValue: String(found.modernPage) }
}

/**
 * 双向页码换算
 * @param mappings - 页码映射表
 * @param inputType - 输入类型
 * @param inputValue - 输入值
 */
export function convertPage(
  mappings: PageMapping[],
  inputType: PageInputType,
  inputValue: string
): ConversionResult {
  if (inputType === 'modern') {
    const error = validateModernPage(inputValue)
    if (error) {
      return { success: false, message: error }
    }
    return convertModernToAncient(mappings, Number(normalizePageInput(inputValue)))
  }

  const error = validateAncientPage(inputValue)
  if (error) {
    return { success: false, message: error }
  }
  return convertAncientToModern(mappings, inputValue)
}

/**
 * 校验页码区间输入的有效性
 * 依次检查起始页与结束页是否为正整数，以及起始页是否大于结束页。
 * 错误提示为完整中文句子，不拼接前缀。
 * @param start - 起始现代页码输入字符串
 * @param end - 结束现代页码输入字符串
 * @returns 校验通过返回 null，否则返回错误信息
 */
export function validatePageRange(start: string, end: string): string | null {
  const startNormalized = normalizePageInput(start)
  const endNormalized = normalizePageInput(end)

  if (!startNormalized) {
    return '请输入起始现代页码'
  }
  if (!/^\d+$/.test(startNormalized) || Number(startNormalized) <= 0) {
    return '现代页码须为正整数'
  }

  if (!endNormalized) {
    return '请输入结束现代页码'
  }
  if (!/^\d+$/.test(endNormalized) || Number(endNormalized) <= 0) {
    return '现代页码须为正整数'
  }

  if (Number(startNormalized) > Number(endNormalized)) {
    return '起始页不得大于结束页'
  }

  return null
}

/**
 * 对指定区间内的现代页码执行批量换算
 * 遍历起始页到结束页之间的每一个现代页码，在映射表中查找对应古页码，
 * 标记每条记录是否匹配成功，最终汇总返回。
 * @param mappings - 当前卷册的页码映射表
 * @param startModernPage - 起始现代页码（正整数）
 * @param endModernPage - 结束现代页码（正整数，不小于起始页）
 * @returns 批量换算结果，包含所有条目、总数和匹配数
 */
export function convertPageRange(
  mappings: PageMapping[],
  startModernPage: number,
  endModernPage: number
): BatchConversionResult {
  const items: BatchConversionItem[] = []
  let foundCount = 0

  for (let modern = startModernPage; modern <= endModernPage; modern++) {
    const found = mappings.find((m) => m.modernPage === modern)
    if (found) {
      foundCount++
      items.push({
        modernPage: modern,
        ancientPage: found.ancientPage,
        found: true
      })
    } else {
      items.push({
        modernPage: modern,
        ancientPage: '',
        found: false
      })
    }
  }

  return {
    items,
    total: items.length,
    foundCount
  }
}

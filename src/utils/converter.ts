import type {
  BatchConversionItem,
  BatchConversionResult,
  ConversionResult,
  PageInputType,
  PageMapping,
} from '@/types'

/**
 * 校验现代页码是否为正整数
 * @param value - 输入字符串
 */
export function validateModernPage(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return '请输入现代页码'
  }
  if (!/^\d+$/.test(trimmed)) {
    return '现代页码须为正整数'
  }
  const num = Number(trimmed)
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
  const trimmed = value.trim()
  if (!trimmed) {
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

/**
 * 现代页码 → 古页码
 * @param mappings - 页码映射表
 * @param modernPage - 现代页码
 */
export function convertModernToAncient(
  mappings: PageMapping[],
  modernPage: number,
): ConversionResult {
  const found = mappings.find((m) => m.modernPage === modernPage)
  if (!found) {
    return { success: false, message: '未找到对应古页码，请核对卷册与页码' }
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
  ancientPage: string,
): ConversionResult {
  const trimmed = ancientPage.trim()
  const found = mappings.find((m) => m.ancientPage === trimmed)
  if (!found) {
    return { success: false, message: '未找到对应现代页码，请核对卷册与页码' }
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
  inputValue: string,
): ConversionResult {
  if (inputType === 'modern') {
    const error = validateModernPage(inputValue)
    if (error) {
      return { success: false, message: error }
    }
    return convertModernToAncient(mappings, Number(inputValue.trim()))
  }

  const error = validateAncientPage(inputValue)
  if (error) {
    return { success: false, message: error }
  }
  return convertAncientToModern(mappings, inputValue)
}

export function validatePageRange(start: string, end: string): string | null {
  const startError = validateModernPage(start)
  if (startError) {
    return `起始页${startError}`
  }
  const endError = validateModernPage(end)
  if (endError) {
    return `结束页${endError}`
  }
  const startNum = Number(start.trim())
  const endNum = Number(end.trim())
  if (startNum > endNum) {
    return '起始页不得大于结束页'
  }
  return null
}

export function convertPageRange(
  mappings: PageMapping[],
  startModernPage: number,
  endModernPage: number,
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
        found: true,
      })
    } else {
      items.push({
        modernPage: modern,
        ancientPage: '',
        found: false,
      })
    }
  }

  return {
    items,
    total: items.length,
    foundCount,
  }
}

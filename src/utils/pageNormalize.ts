/**
 * 页码字符串规范化工具模块
 * 统一处理：首尾空白去除、全角半角数字转换、大小写无关的模糊匹配预处理
 */

/**
 * 将全角数字字符转换为半角数字
 * Unicode 全角数字范围：U+FF10 ~ U+FF19 (０-９)
 * 半角数字范围：U+0030 ~ U+0039 (0-9)
 * @param value - 输入字符串
 * @returns 全角数字已转换为半角的字符串
 */
export function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  )
}

/**
 * 基础页码输入规范化
 * 处理：首尾空白去除 + 全角数字转半角
 * 适用于校验、换算前的输入预处理
 * @param value - 原始输入字符串
 * @returns 规范化后的字符串
 */
export function normalizePageInput(value: string): string {
  return toHalfWidthDigits(value.trim())
}

/**
 * 搜索匹配专用规范化
 * 在基础规范化之上增加：大小写统一（默认不区分大小写）
 * 适用于搜索关键字与被搜索字段的预处理
 * @param value - 原始字符串
 * @param caseSensitive - 是否区分大小写，默认 false（不区分）
 * @returns 规范化后的字符串
 */
export function normalizeForSearch(value: string, caseSensitive: boolean = false): string {
  const normalized = normalizePageInput(value)
  return caseSensitive ? normalized : normalized.toLowerCase()
}

/**
 * 判断规范化后是否为空字符串
 * @param value - 输入字符串
 * @returns 是否为空
 */
export function isNormalizedEmpty(value: string): boolean {
  return normalizePageInput(value) === ''
}

/**
 * 检查关键字是否为纯数字（现代页码判定用）
 * 已包含：首尾空白去除 + 全角转半角
 * @param keyword - 输入关键字
 * @returns 是否为纯数字字符串
 */
export function isNumericKeyword(keyword: string): boolean {
  const normalized = normalizePageInput(keyword)
  if (!normalized) return false
  return /^\d+$/.test(normalized)
}

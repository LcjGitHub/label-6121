import { describe, it, expect } from 'vitest'
import {
  toHalfWidthDigits,
  normalizePageInput,
  normalizeForSearch,
  isNormalizedEmpty,
  isNumericKeyword
} from '@/utils/pageNormalize'

describe('pageNormalize - 全角数字转换', () => {
  it('应将全角数字转换为半角数字', () => {
    expect(toHalfWidthDigits('０１２３４５６７８９')).toBe('0123456789')
  })

  it('混合全角半角数字应正确转换', () => {
    expect(toHalfWidthDigits('１２a３４b５６')).toBe('12a34b56')
  })

  it('无非数字字符时应保持不变', () => {
    expect(toHalfWidthDigits('abc甲乙丙')).toBe('abc甲乙丙')
  })

  it('空字符串应返回空字符串', () => {
    expect(toHalfWidthDigits('')).toBe('')
  })
})

describe('pageNormalize - 基础输入规范化', () => {
  it('应去除首尾空白字符', () => {
    expect(normalizePageInput('  123  ')).toBe('123')
    expect(normalizePageInput('\t\n456\n\t')).toBe('456')
  })

  it('去除空白后应转换全角数字', () => {
    expect(normalizePageInput('  １２３  ')).toBe('123')
  })

  it('纯空白字符应返回空字符串', () => {
    expect(normalizePageInput('   ')).toBe('')
    expect(normalizePageInput('\t\n ')).toBe('')
  })

  it('空字符串应返回空字符串', () => {
    expect(normalizePageInput('')).toBe('')
  })

  it('中文古页码应保持不变', () => {
    expect(normalizePageInput('卷一·第三十二页')).toBe('卷一·第三十二页')
    expect(normalizePageInput('  甲子篇  ')).toBe('甲子篇')
  })
})

describe('pageNormalize - 搜索匹配规范化', () => {
  it('默认不区分大小写，应转为小写', () => {
    expect(normalizeForSearch('ABC')).toBe('abc')
    expect(normalizeForSearch('AbC123')).toBe('abc123')
  })

  it('指定区分大小写时应保持原大小写', () => {
    expect(normalizeForSearch('ABC', true)).toBe('ABC')
    expect(normalizeForSearch('AbC123', true)).toBe('AbC123')
  })

  it('应同时执行基础规范化（去空白+全角数字转半角）', () => {
    expect(normalizeForSearch('  ABC１２３  ')).toBe('abc123')
    expect(normalizeForSearch('  ＡＢＣ123  ')).toBe('ａｂｃ123')
  })

  it('空字符串应返回空字符串', () => {
    expect(normalizeForSearch('')).toBe('')
    expect(normalizeForSearch('   ')).toBe('')
  })
})

describe('pageNormalize - 空值判断', () => {
  it('空字符串应判定为空', () => {
    expect(isNormalizedEmpty('')).toBe(true)
  })

  it('仅含空白字符应判定为空', () => {
    expect(isNormalizedEmpty('   ')).toBe(true)
    expect(isNormalizedEmpty('\t\n')).toBe(true)
  })

  it('含有效字符应判定为非空', () => {
    expect(isNormalizedEmpty('a')).toBe(false)
    expect(isNormalizedEmpty('1')).toBe(false)
    expect(isNormalizedEmpty('一')).toBe(false)
  })

  it('全角数字应判定为非空', () => {
    expect(isNormalizedEmpty('１')).toBe(false)
  })
})

describe('pageNormalize - 纯数字判定', () => {
  it('纯阿拉伯数字应判定为真', () => {
    expect(isNumericKeyword('0')).toBe(true)
    expect(isNumericKeyword('123')).toBe(true)
    expect(isNumericKeyword('99999')).toBe(true)
  })

  it('全角数字规范化后应判定为真', () => {
    expect(isNumericKeyword('１２３')).toBe(true)
    expect(isNumericKeyword('  ４５６  ')).toBe(true)
  })

  it('空字符串应判定为假', () => {
    expect(isNumericKeyword('')).toBe(false)
    expect(isNumericKeyword('   ')).toBe(false)
  })

  it('非纯数字应判定为假', () => {
    expect(isNumericKeyword('12a')).toBe(false)
    expect(isNumericKeyword('一二三')).toBe(false)
    expect(isNumericKeyword('1.5')).toBe(false)
    expect(isNumericKeyword('-1')).toBe(false)
    expect(isNumericKeyword('  1 2  ')).toBe(false)
  })

  it('中文数字应判定为假', () => {
    expect(isNumericKeyword('十')).toBe(false)
    expect(isNumericKeyword('一百二十三')).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import type { PageMapping } from '@/types'
import {
  validateModernPage,
  validateAncientPage,
  validatePageInput,
  validatePageRange,
  convertModernToAncient,
  convertAncientToModern,
  convertPage,
  convertPageRange,
  findNearbySuggestions
} from '@/utils/converter'

const MOCK_MAPPINGS: PageMapping[] = [
  { modernPage: 1, ancientPage: '卷一·第一页' },
  { modernPage: 2, ancientPage: '卷一·第二页' },
  { modernPage: 5, ancientPage: '卷一·第五页' },
  { modernPage: 10, ancientPage: '卷一·第十页' },
  { modernPage: 11, ancientPage: '卷二·第一页' },
  { modernPage: 20, ancientPage: '卷二·第十页' },
  { modernPage: 50, ancientPage: '卷三·第二十页' },
  { modernPage: 100, ancientPage: '卷四·第十页' }
]

const EMPTY_MAPPINGS: PageMapping[] = []

describe('converter - 现代页码校验', () => {
  it('正常正整数应校验通过', () => {
    expect(validateModernPage('1')).toBeNull()
    expect(validateModernPage('100')).toBeNull()
    expect(validateModernPage('99999')).toBeNull()
  })

  it('带首尾空白的正整数应校验通过', () => {
    expect(validateModernPage('  123  ')).toBeNull()
    expect(validateModernPage('\t456\n')).toBeNull()
  })

  it('全角正整数应校验通过', () => {
    expect(validateModernPage('１２３')).toBeNull()
    expect(validateModernPage('  ４５６  ')).toBeNull()
  })

  it('空值应返回错误信息', () => {
    expect(validateModernPage('')).toBe('请输入现代页码')
    expect(validateModernPage('   ')).toBe('请输入现代页码')
    expect(validateModernPage('\t\n')).toBe('请输入现代页码')
  })

  it('零应返回错误信息', () => {
    expect(validateModernPage('0')).toBe('现代页码须为正整数')
    expect(validateModernPage('  0  ')).toBe('现代页码须为正整数')
  })

  it('负数应返回错误信息', () => {
    expect(validateModernPage('-1')).toBe('现代页码须为正整数')
    expect(validateModernPage('-100')).toBe('现代页码须为正整数')
  })

  it('小数应返回错误信息', () => {
    expect(validateModernPage('1.5')).toBe('现代页码须为正整数')
    expect(validateModernPage('3.14')).toBe('现代页码须为正整数')
  })

  it('含非数字字符应返回错误信息', () => {
    expect(validateModernPage('12a')).toBe('现代页码须为正整数')
    expect(validateModernPage('一二三')).toBe('现代页码须为正整数')
    expect(validateModernPage('abc')).toBe('现代页码须为正整数')
  })

  it('数字间含空白应返回错误信息', () => {
    expect(validateModernPage('1 2')).toBe('现代页码须为正整数')
    expect(validateModernPage('1\n2')).toBe('现代页码须为正整数')
  })
})

describe('converter - 古页码校验', () => {
  it('任意非空字符串应校验通过', () => {
    expect(validateAncientPage('卷一·第一页')).toBeNull()
    expect(validateAncientPage('1')).toBeNull()
    expect(validateAncientPage('a')).toBeNull()
    expect(validateAncientPage('甲子篇')).toBeNull()
  })

  it('带首尾空白的非空值应校验通过', () => {
    expect(validateAncientPage('  卷一·第一页  ')).toBeNull()
    expect(validateAncientPage('\t甲子\n')).toBeNull()
  })

  it('空值应返回错误信息', () => {
    expect(validateAncientPage('')).toBe('请输入古页码')
    expect(validateAncientPage('   ')).toBe('请输入古页码')
    expect(validateAncientPage('\t\n')).toBe('请输入古页码')
  })
})

describe('converter - 按类型校验页码', () => {
  it('modern 类型应使用现代页码校验逻辑', () => {
    expect(validatePageInput('modern', '123')).toBeNull()
    expect(validatePageInput('modern', '')).toBe('请输入现代页码')
    expect(validatePageInput('modern', 'abc')).toBe('现代页码须为正整数')
  })

  it('ancient 类型应使用古页码校验逻辑', () => {
    expect(validatePageInput('ancient', '卷一')).toBeNull()
    expect(validatePageInput('ancient', '')).toBe('请输入古页码')
    expect(validatePageInput('ancient', 'abc123')).toBeNull()
  })
})

describe('converter - 中文数字古页码解析与邻近建议（古页码方向）', () => {
  it('简单中文数字：一、二、五应按正确顺序定位', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'ancient', '卷一·第三页')
    expect(result).toHaveLength(3)
    expect(result[0].ancientPage).toBe('卷一·第二页')
    expect(result[1].ancientPage).toBe('卷一·第五页')
  })

  it('"十"应按数值10正确解析定位', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'ancient', '卷一·第十页')
    expect(result).toHaveLength(3)
    const matchedPages = result.map((r) => r.ancientPage)
    expect(matchedPages).toContain('卷一·第十页')
    const matchedItem = result.find((r) => r.ancientPage === '卷一·第十页')
    expect(matchedItem!.modernPage).toBe(10)
  })

  it('"二十"应按数值20正确解析定位', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'ancient', '卷二·第十页')
    expect(result).toHaveLength(3)
    const matchedPages = result.map((r) => r.ancientPage)
    expect(matchedPages).toContain('卷二·第十页')
    const matchedItem = result.find((r) => r.ancientPage === '卷二·第十页')
    expect(matchedItem!.modernPage).toBe(20)
  })

  it('天干地支字符：甲、子应按序号解析', () => {
    const testMappings: PageMapping[] = [
      { modernPage: 1, ancientPage: '甲篇' },
      { modernPage: 2, ancientPage: '乙篇' },
      { modernPage: 10, ancientPage: '癸篇' },
      { modernPage: 11, ancientPage: '子卷' }
    ]
    const result = findNearbySuggestions(testMappings, 'ancient', '丙篇')
    expect(result).toHaveLength(3)
    expect(result[0].ancientPage).toBe('乙篇')
    expect(result[1].ancientPage).toBe('癸篇')
  })

  it('混合阿拉伯数字段和中文字段应正确解析', () => {
    const testMappings: PageMapping[] = [
      { modernPage: 1, ancientPage: '卷1·第一页' },
      { modernPage: 5, ancientPage: '卷1·第五页' },
      { modernPage: 10, ancientPage: '卷2·第一页' }
    ]
    const result = findNearbySuggestions(testMappings, 'ancient', '卷1·第三页')
    expect(result).toHaveLength(3)
    expect(result[0].ancientPage).toBe('卷1·第一页')
    expect(result[1].ancientPage).toBe('卷1·第五页')
  })

  it('空映射表应返回空数组', () => {
    const result = findNearbySuggestions(EMPTY_MAPPINGS, 'ancient', '卷一')
    expect(result).toEqual([])
  })
})

describe('converter - 邻近页码建议（现代页码方向）', () => {
  it('精确匹配时应返回该条目为第一条', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'modern', '10')
    expect(result[0]).toEqual({ modernPage: 10, ancientPage: '卷一·第十页' })
  })

  it('距离相同时应按现代页码升序排列', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'modern', '15')
    expect(result).toHaveLength(3)
    expect(result[0].modernPage).toBe(11)
    expect(result[1].modernPage).toBe(10)
    expect(result[2].modernPage).toBe(20)
  })

  it('应最多返回3条建议', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'modern', '50')
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('输入在所有条目之前应取最小三个', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'modern', '0')
    expect(result).toHaveLength(3)
    expect(result[0].modernPage).toBe(1)
    expect(result[1].modernPage).toBe(2)
    expect(result[2].modernPage).toBe(5)
  })

  it('输入在所有条目之后应取最大三个', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'modern', '999')
    expect(result).toHaveLength(3)
    expect(result[0].modernPage).toBe(100)
    expect(result[1].modernPage).toBe(50)
    expect(result[2].modernPage).toBe(20)
  })

  it('映射表条目不足3条时应返回全部条目', () => {
    const smallMappings: PageMapping[] = [
      { modernPage: 1, ancientPage: '第一页' },
      { modernPage: 5, ancientPage: '第五页' }
    ]
    const result = findNearbySuggestions(smallMappings, 'modern', '3')
    expect(result).toHaveLength(2)
  })

  it('空映射表应返回空数组', () => {
    const result = findNearbySuggestions(EMPTY_MAPPINGS, 'modern', '10')
    expect(result).toEqual([])
  })

  it('全角数字输入应正常工作', () => {
    const result = findNearbySuggestions(MOCK_MAPPINGS, 'modern', '１０')
    expect(result[0]).toEqual({ modernPage: 10, ancientPage: '卷一·第十页' })
  })
})

describe('converter - 单次双向换算：现代 → 古', () => {
  it('精确映射应成功返回古页码', () => {
    const result = convertModernToAncient(MOCK_MAPPINGS, 10)
    expect(result.success).toBe(true)
    expect(result.outputValue).toBe('卷一·第十页')
    expect(result.message).toBeUndefined()
    expect(result.suggestions).toBeUndefined()
  })

  it('未找到映射应返回失败并附带邻近建议', () => {
    const result = convertModernToAncient(MOCK_MAPPINGS, 7)
    expect(result.success).toBe(false)
    expect(result.outputValue).toBeUndefined()
    expect(result.message).toBe('未找到对应古页码，请核对卷册与页码')
    expect(result.suggestions).toBeDefined()
    expect(result.suggestions!.length).toBeGreaterThan(0)
    expect(result.suggestions!.length).toBeLessThanOrEqual(3)
  })

  it('空映射表应返回失败', () => {
    const result = convertModernToAncient(EMPTY_MAPPINGS, 1)
    expect(result.success).toBe(false)
    expect(result.message).toBe('未找到对应古页码，请核对卷册与页码')
    expect(result.suggestions).toEqual([])
  })
})

describe('converter - 单次双向换算：古 → 现代', () => {
  it('精确映射应成功返回现代页码字符串', () => {
    const result = convertAncientToModern(MOCK_MAPPINGS, '卷一·第十页')
    expect(result.success).toBe(true)
    expect(result.outputValue).toBe('10')
    expect(result.message).toBeUndefined()
    expect(result.suggestions).toBeUndefined()
  })

  it('带首尾空白的古页码应成功匹配', () => {
    const result = convertAncientToModern(MOCK_MAPPINGS, '  卷一·第十页  ')
    expect(result.success).toBe(true)
    expect(result.outputValue).toBe('10')
  })

  it('未找到映射应返回失败并附带邻近建议', () => {
    const result = convertAncientToModern(MOCK_MAPPINGS, '卷一·第七页')
    expect(result.success).toBe(false)
    expect(result.outputValue).toBeUndefined()
    expect(result.message).toBe('未找到对应现代页码，请核对卷册与页码')
    expect(result.suggestions).toBeDefined()
    expect(result.suggestions!.length).toBeGreaterThan(0)
  })

  it('空映射表应返回失败', () => {
    const result = convertAncientToModern(EMPTY_MAPPINGS, '卷一')
    expect(result.success).toBe(false)
    expect(result.message).toBe('未找到对应现代页码，请核对卷册与页码')
    expect(result.suggestions).toEqual([])
  })
})

describe('converter - 双向换算统一入口 convertPage', () => {
  it('modern 类型输入合法且命中映射应成功', () => {
    const result = convertPage(MOCK_MAPPINGS, 'modern', '10')
    expect(result.success).toBe(true)
    expect(result.outputValue).toBe('卷一·第十页')
  })

  it('modern 类型输入非法应返回校验错误', () => {
    const result = convertPage(MOCK_MAPPINGS, 'modern', 'abc')
    expect(result.success).toBe(false)
    expect(result.message).toBe('现代页码须为正整数')
    expect(result.suggestions).toBeUndefined()
  })

  it('modern 类型输入空值应返回校验错误', () => {
    const result = convertPage(MOCK_MAPPINGS, 'modern', '')
    expect(result.success).toBe(false)
    expect(result.message).toBe('请输入现代页码')
  })

  it('ancient 类型输入合法且命中映射应成功', () => {
    const result = convertPage(MOCK_MAPPINGS, 'ancient', '卷一·第十页')
    expect(result.success).toBe(true)
    expect(result.outputValue).toBe('10')
  })

  it('ancient 类型输入空值应返回校验错误', () => {
    const result = convertPage(MOCK_MAPPINGS, 'ancient', '   ')
    expect(result.success).toBe(false)
    expect(result.message).toBe('请输入古页码')
  })

  it('空映射表 + 合法输入应返回未找到错误', () => {
    const result = convertPage(EMPTY_MAPPINGS, 'modern', '1')
    expect(result.success).toBe(false)
    expect(result.message).toBe('未找到对应古页码，请核对卷册与页码')
  })
})

describe('converter - 区间校验', () => {
  it('正常区间（起止均为正整数且起止）应校验通过', () => {
    expect(validatePageRange('1', '10')).toBeNull()
    expect(validatePageRange('5', '5')).toBeNull()
    expect(validatePageRange('100', '200')).toBeNull()
  })

  it('带空白和全角数字的正常区间应校验通过', () => {
    expect(validatePageRange('  １  ', '  １０  ')).toBeNull()
  })

  it('起始页为空应返回错误', () => {
    expect(validatePageRange('', '10')).toBe('请输入起始现代页码')
    expect(validatePageRange('   ', '10')).toBe('请输入起始现代页码')
  })

  it('起始页非法格式应返回错误', () => {
    expect(validatePageRange('0', '10')).toBe('现代页码须为正整数')
    expect(validatePageRange('-1', '10')).toBe('现代页码须为正整数')
    expect(validatePageRange('1.5', '10')).toBe('现代页码须为正整数')
    expect(validatePageRange('abc', '10')).toBe('现代页码须为正整数')
  })

  it('结束页为空应返回错误', () => {
    expect(validatePageRange('1', '')).toBe('请输入结束现代页码')
    expect(validatePageRange('1', '   ')).toBe('请输入结束现代页码')
  })

  it('结束页非法格式应返回错误', () => {
    expect(validatePageRange('1', '0')).toBe('现代页码须为正整数')
    expect(validatePageRange('1', '-5')).toBe('现代页码须为正整数')
    expect(validatePageRange('1', 'abc')).toBe('现代页码须为正整数')
  })

  it('起始页大于结束页应返回错误', () => {
    expect(validatePageRange('10', '1')).toBe('起始页不得大于结束页')
    expect(validatePageRange('100', '50')).toBe('起始页不得大于结束页')
  })
})

describe('converter - 区间批量换算', () => {
  it('全部命中的区间应正确返回所有映射', () => {
    const result = convertPageRange(MOCK_MAPPINGS, 1, 2)
    expect(result.total).toBe(2)
    expect(result.foundCount).toBe(2)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({ modernPage: 1, ancientPage: '卷一·第一页', found: true })
    expect(result.items[1]).toEqual({ modernPage: 2, ancientPage: '卷一·第二页', found: true })
  })

  it('部分命中的区间应正确标记命中与未命中', () => {
    const result = convertPageRange(MOCK_MAPPINGS, 1, 5)
    expect(result.total).toBe(5)
    expect(result.foundCount).toBe(3)
    expect(result.items[0].found).toBe(true)
    expect(result.items[0].modernPage).toBe(1)
    expect(result.items[1].found).toBe(true)
    expect(result.items[1].modernPage).toBe(2)
    expect(result.items[2].found).toBe(false)
    expect(result.items[2].modernPage).toBe(3)
    expect(result.items[2].ancientPage).toBe('')
    expect(result.items[3].found).toBe(false)
    expect(result.items[3].modernPage).toBe(4)
    expect(result.items[4].found).toBe(true)
    expect(result.items[4].modernPage).toBe(5)
  })

  it('单页区间应返回一条结果', () => {
    const result = convertPageRange(MOCK_MAPPINGS, 10, 10)
    expect(result.total).toBe(1)
    expect(result.foundCount).toBe(1)
    expect(result.items[0]).toEqual({ modernPage: 10, ancientPage: '卷一·第十页', found: true })
  })

  it('完全无命中的区间应全部标记为未命中', () => {
    const result = convertPageRange(MOCK_MAPPINGS, 3, 4)
    expect(result.total).toBe(2)
    expect(result.foundCount).toBe(0)
    expect(result.items.every((item) => item.found === false)).toBe(true)
    expect(result.items.every((item) => item.ancientPage === '')).toBe(true)
  })

  it('空映射表应全部返回未命中', () => {
    const result = convertPageRange(EMPTY_MAPPINGS, 1, 10)
    expect(result.total).toBe(10)
    expect(result.foundCount).toBe(0)
    expect(result.items).toHaveLength(10)
    result.items.forEach((item) => {
      expect(item.found).toBe(false)
      expect(item.ancientPage).toBe('')
    })
  })

  it('大范围区间应生成正确数量条目', () => {
    const result = convertPageRange(MOCK_MAPPINGS, 1, 100)
    expect(result.total).toBe(100)
    expect(result.items).toHaveLength(100)
    expect(result.items[0].modernPage).toBe(1)
    expect(result.items[99].modernPage).toBe(100)
  })

  it('起始与结束相同且未命中应返回一条未命中', () => {
    const result = convertPageRange(MOCK_MAPPINGS, 999, 999)
    expect(result.total).toBe(1)
    expect(result.foundCount).toBe(0)
    expect(result.items[0]).toEqual({ modernPage: 999, ancientPage: '', found: false })
  })
})

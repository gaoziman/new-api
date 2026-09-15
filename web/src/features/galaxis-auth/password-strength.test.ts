import { describe, expect, test } from 'vitest'

import { assessPassword } from './password-strength'

describe('assessPassword', () => {
  test('空密码返回 0 档，调用方据此隐藏强度条', () => {
    expect(assessPassword('')).toEqual({ level: 0, text: '' })
  })

  test('不足 8 位一律压到最低档，并明说差在长度上', () => {
    // 这条口令字符种类齐全（大小写+数字+符号），但只有 7 位。
    // 若按「种类数」评分会给到高档，长度短才是真正的问题。
    const s = assessPassword('Aa1!bc2')
    expect(s.level).toBe(1)
    expect(s.text).toBe('太短了，至少 8 个字符')
  })

  test('够长但种类单一仍是最低档，提示指向种类而非长度', () => {
    const s = assessPassword('aaaaaaaaaaaaaaaa')
    expect(s.level).toBe(1)
    expect(s.text).toBe('强度偏弱，建议混合字母和数字')
  })

  test('8 位 + 两种字符进入中档', () => {
    expect(assessPassword('abcd1234').level).toBe(2)
  })

  test('11 位 + 三种字符仍是中档：长度没到 12 就不给最高档', () => {
    expect(assessPassword('Abcd123456x').level).toBe(2)
  })

  test('12 位 + 三种字符才是最高档', () => {
    const s = assessPassword('Abcd12345678')
    expect(s.level).toBe(3)
    expect(s.text).toBe('强度不错')
  })

  test('档位边界：第 8 位是中档的下界', () => {
    expect(assessPassword('abcd123').level).toBe(1) // 7 位
    expect(assessPassword('abcd1234').level).toBe(2) // 8 位
  })

  test('档位边界：第 12 位是高档的下界', () => {
    expect(assessPassword('Abcd1234567').level).toBe(2) // 11 位
    expect(assessPassword('Abcd12345678').level).toBe(3) // 12 位
  })
})

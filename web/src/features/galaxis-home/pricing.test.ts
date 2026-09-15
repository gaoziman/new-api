import { describe, expect, test } from 'vitest'

import { groupByVendor, toRows, type PricingPayload } from './pricing'

/** 造一份最小可用的接口响应。 */
function payload(over: Partial<PricingPayload> = {}): PricingPayload {
  return {
    success: true,
    data: [],
    group_ratio: { default: 1, 'codex pro': 0.5 },
    usable_group: { default: '默认', 'codex pro': 'Codex Pro' },
    vendors: [
      { id: 1, name: 'OpenAI', icon: '' },
      { id: 2, name: 'Anthropic', icon: '' },
    ],
    ...over,
  }
}

function model(over: Partial<PricingPayload['data'][number]> = {}) {
  return {
    model_name: 'gpt-x',
    vendor_id: 1,
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 2,
    cache_ratio: 0,
    enable_groups: ['default'],
    ...over,
  }
}

describe('toRows', () => {
  test('倍率按 $2 / 百万 token 换算，输出价再乘 completion_ratio', () => {
    const [row] = toRows(
      payload({ data: [model({ model_ratio: 1.5, completion_ratio: 4 })] })
    )
    expect(row.inputUsd).toBe(3) // 1.5 × 2
    expect(row.outputUsd).toBe(12) // 3 × 4
  })

  test('不乘分组倍率——这是刻意的产品决策，不是遗漏', () => {
    // codex pro 的 group_ratio 是 0.5。若误乘进去，inputUsd 会变成 1 而不是 2。
    // 公开价目表展示的是模型基准单价，账号维度的折扣不在这里体现。
    const [row] = toRows(
      payload({
        data: [model({ model_ratio: 1, enable_groups: ['codex pro'] })],
      })
    )
    expect(row.inputUsd).toBe(2)
  })

  test('cache_ratio 为 0 时缓存价是 null，表格据此显示破折号', () => {
    const [row] = toRows(payload({ data: [model({ cache_ratio: 0 })] }))
    expect(row.cachedUsd).toBeNull()
  })

  test('cache_ratio 非 0 时按基准价折算', () => {
    const [row] = toRows(
      payload({ data: [model({ model_ratio: 2, cache_ratio: 0.25 })] })
    )
    expect(row.cachedUsd).toBe(1) // 2×2×0.25
  })

  test('按次计费的模型被排除', () => {
    const rows = toRows(
      payload({
        data: [model({ quota_type: 1 }), model({ model_name: 'ok', quota_type: 0 })],
      })
    )
    expect(rows.map((r) => r.name)).toEqual(['ok'])
  })

  test('未知厂商归到「其他」，不丢行', () => {
    const [row] = toRows(payload({ data: [model({ vendor_id: 999 })] }))
    expect(row.vendor).toBe('其他')
  })

  test('分组标签取 usable_group 的显示名；查不到时退回分组 key', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'a', enable_groups: ['codex pro'] }),
          model({ model_name: 'b', enable_groups: ['未登记分组'] }),
        ],
      })
    )
    const labelOf = (name: string) =>
      rows.find((r) => r.name === name)?.groupLabel
    expect(labelOf('a')).toBe('Codex Pro')
    expect(labelOf('b')).toBe('未登记分组')
  })

  test('enable_groups 为空时退回 default，不产生 undefined 分组', () => {
    const [row] = toRows(payload({ data: [model({ enable_groups: [] })] }))
    expect(row.group).toBe('default')
    expect(row.groupLabel).toBe('默认')
  })

  test('先按厂商、再按模型名排序', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'z-gpt', vendor_id: 1 }),
          model({ model_name: 'a-gpt', vendor_id: 1 }),
          model({ model_name: 'm-claude', vendor_id: 2 }),
        ],
      })
    )
    // Anthropic 在 OpenAI 之前；同厂商内按名字
    expect(rows.map((r) => `${r.vendor}/${r.name}`)).toEqual([
      'Anthropic/m-claude',
      'OpenAI/a-gpt',
      'OpenAI/z-gpt',
    ])
  })
})

describe('groupByVendor', () => {
  test('同厂商的行聚到一起，且保持传入顺序', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'a', vendor_id: 1 }),
          model({ model_name: 'b', vendor_id: 2 }),
          model({ model_name: 'c', vendor_id: 1 }),
        ],
      })
    )
    const grouped = groupByVendor(rows)
    expect(Object.keys(grouped).sort()).toEqual(['Anthropic', 'OpenAI'])
    expect(grouped.OpenAI.map((r) => r.name)).toEqual(['a', 'c'])
  })
})

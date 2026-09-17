import { describe, expect, test } from 'vitest'

import {
  toRows,
  uniformCacheDiscount,
  type PricingPayload,
} from './pricing'

/** 造一份最小可用的接口响应。 */
function payload(over: Partial<PricingPayload> = {}): PricingPayload {
  return {
    success: true,
    data: [],
    group_ratio: { default: 1, 'codex pro': 0.5, 'Claude Max': 1.5 },
    usable_group: {
      default: '默认',
      'codex pro': 'Codex Pro',
      'Claude Max': 'Claude Max',
    },
    vendors: [
      { id: 1, name: 'OpenAI', icon: 'OpenAI' },
      { id: 2, name: 'Anthropic', icon: 'Claude.Color' },
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
    create_cache_ratio: 0,
    enable_groups: ['default'],
    ...over,
  }
}

describe('toRows 价格换算', () => {
  test('倍率按 $2 / 百万 token 换算，输出价再乘 completion_ratio', () => {
    const [row] = toRows(
      payload({ data: [model({ model_ratio: 1.5, completion_ratio: 4 })] })
    )
    expect(row.inputUsd).toBe(3) // 1.5 × 1(default) × 2
    expect(row.outputUsd).toBe(12) // 3 × 4
  })

  test('必须乘分组倍率——展示的是用户实际被扣的价，不是基准单价', () => {
    // 这条曾经断言「不乘」，理由是「同一模型对不同分组价格不同，乘了会被
    // 误解成人人都是这个价」。该前提与实际数据不符：线上 14 个模型
    // enable_groups 长度全部为 1，不存在一个模型跨多个分组的情况。
    // 不乘的代价是页面报价与实际扣费不一致（Claude Max 少报 33%、
    // codex pro 多报 100%），价目表因此需要加一行小字说明「上面不是你要付的钱」。
    const [cheap] = toRows(
      payload({ data: [model({ model_ratio: 1, enable_groups: ['codex pro'] })] })
    )
    expect(cheap.inputUsd).toBe(1) // 1 × 0.5 × 2

    const [pricey] = toRows(
      payload({
        data: [model({ model_ratio: 1, enable_groups: ['Claude Max'] })],
      })
    )
    expect(pricey.inputUsd).toBe(3) // 1 × 1.5 × 2
  })

  test('group_ratio 整个缺失时按 1 倍处理，不能算出 NaN', () => {
    const [row] = toRows(
      payload({ group_ratio: null, data: [model({ model_ratio: 2 })] })
    )
    expect(row.inputUsd).toBe(4)
  })

  test('分组不在 group_ratio 表里时按 1 倍处理', () => {
    const [row] = toRows(
      payload({
        data: [model({ model_ratio: 2, enable_groups: ['未登记分组'] })],
      })
    )
    expect(row.inputUsd).toBe(4)
  })

  test('缓存命中价与缓存写入价都按含倍率的输入价折算', () => {
    const [row] = toRows(
      payload({
        data: [
          model({
            model_ratio: 2,
            cache_ratio: 0.1,
            create_cache_ratio: 1.25,
            enable_groups: ['Claude Max'],
          }),
        ],
      })
    )
    expect(row.inputUsd).toBe(6) // 2 × 1.5 × 2
    expect(row.cacheHitUsd).toBe(0.6) // 6 × 0.1
    expect(row.cacheWriteUsd).toBe(7.5) // 6 × 1.25
  })

  test('比例为 0 或缺失时对应缓存价是 null，由表格显示为不适用', () => {
    const [row] = toRows(
      payload({ data: [model({ cache_ratio: 0, create_cache_ratio: 0 })] })
    )
    expect(row.cacheHitUsd).toBeNull()
    expect(row.cacheWriteUsd).toBeNull()
  })

  test('按次计费的模型被排除', () => {
    const rows = toRows(
      payload({
        data: [model({ quota_type: 1 }), model({ model_name: 'ok' })],
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
    const labelOf = (n: string) => rows.find((r) => r.name === n)?.groupLabel
    expect(labelOf('a')).toBe('Codex Pro')
    expect(labelOf('b')).toBe('未登记分组')
  })

  test('enable_groups 为空时退回 default，不产生 undefined 分组', () => {
    const [row] = toRows(payload({ data: [model({ enable_groups: [] })] }))
    expect(row.group).toBe('default')
    expect(row.groupLabel).toBe('默认')
  })

  test('模型跨多个分组时取倍率最低的那个，结果不依赖数组顺序', () => {
    // 线上暂时没有这种数据，但接口结构允许。取 enable_groups[0] 的话
    // 报价会随后台返回顺序漂移，同一个模型可能一会儿贵一会儿便宜。
    const a = toRows(
      payload({
        data: [
          model({ model_ratio: 1, enable_groups: ['Claude Max', 'codex pro'] }),
        ],
      })
    )
    const b = toRows(
      payload({
        data: [
          model({ model_ratio: 1, enable_groups: ['codex pro', 'Claude Max'] }),
        ],
      })
    )
    expect(a[0].group).toBe('codex pro')
    expect(a[0].inputUsd).toBe(1)
    expect(b[0]).toEqual(a[0])
  })
})

describe('toRows 日期快照合并', () => {
  test('同价的日期快照并入主版本，只留一行并记下日期', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'claude-haiku-4-5', vendor_id: 2 }),
          model({ model_name: 'claude-haiku-4-5-20251001', vendor_id: 2 }),
        ],
      })
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('claude-haiku-4-5')
    expect(rows[0].snapshots).toEqual(['20251001'])
  })

  test('快照价格与主版本不同则不合并——合并会藏掉真实的价差', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'gpt-x', model_ratio: 1 }),
          model({ model_name: 'gpt-x-20251001', model_ratio: 2 }),
        ],
      })
    )
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.snapshots.length === 0)).toBe(true)
  })

  test('主版本不存在时快照自成一行，不被丢弃', () => {
    const rows = toRows(
      payload({ data: [model({ model_name: 'gpt-x-20251001' })] })
    )
    expect(rows.map((r) => r.name)).toEqual(['gpt-x-20251001'])
  })

  test('多个快照全部并入同一主版本', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'gpt-x-20251001' }),
          model({ model_name: 'gpt-x' }),
          model({ model_name: 'gpt-x-20250101' }),
        ],
      })
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].snapshots).toEqual(['20250101', '20251001'])
  })

  test('版本号尾巴不是 8 位日期的不当作快照', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'gpt-4' }),
          model({ model_name: 'gpt-4-1106' }),
        ],
      })
    )
    expect(rows).toHaveLength(2)
  })
})

describe('toRows 排序', () => {
  test('先按厂商，同厂商内按输入价从高到低', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'cheap-gpt', vendor_id: 1, model_ratio: 1 }),
          model({ model_name: 'dear-gpt', vendor_id: 1, model_ratio: 5 }),
          model({ model_name: 'a-claude', vendor_id: 2, model_ratio: 3 }),
        ],
      })
    )
    expect(rows.map((r) => r.name)).toEqual([
      'a-claude', // Anthropic 在前
      'dear-gpt', // 同厂商内贵的在前
      'cheap-gpt',
    ])
  })

  test('同厂商同价时按模型名，保证顺序稳定', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'b-gpt' }),
          model({ model_name: 'a-gpt' }),
        ],
      })
    )
    expect(rows.map((r) => r.name)).toEqual(['a-gpt', 'b-gpt'])
  })
})

describe('uniformCacheDiscount', () => {
  test('所有模型缓存比例一致时返回该比例，用于「缓存命中只要 N 折」', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'a', model_ratio: 1, cache_ratio: 0.1 }),
          model({ model_name: 'b', model_ratio: 5, cache_ratio: 0.1 }),
        ],
      })
    )
    expect(uniformCacheDiscount(rows)).toBe(0.1)
  })

  test('比例不一致时返回 null——不能对着一半模型说「全部适用」', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'a', cache_ratio: 0.1 }),
          model({ model_name: 'b', cache_ratio: 0.25 }),
        ],
      })
    )
    expect(uniformCacheDiscount(rows)).toBeNull()
  })

  test('有模型不支持缓存时返回 null', () => {
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'a', cache_ratio: 0.1 }),
          model({ model_name: 'b', cache_ratio: 0 }),
        ],
      })
    )
    expect(uniformCacheDiscount(rows)).toBeNull()
  })

  test('空表返回 null，不产生 0 折这种荒唐文案', () => {
    expect(uniformCacheDiscount([])).toBeNull()
  })
})

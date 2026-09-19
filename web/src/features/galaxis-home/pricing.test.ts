import { describe, expect, test } from 'vitest'

import {
  discountRatio,
  monthlyCny,
  officialCny,
  ourCny,
  savedCny,
  toRows,
  uniformCacheDiscount,
  zhe,
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

describe('toRows 官方价', () => {
  test('官方价是不含分组倍率的基准价，实付价才乘倍率', () => {
    const [row] = toRows(
      payload({
        data: [
          model({
            model_ratio: 2.5,
            completion_ratio: 5,
            enable_groups: ['Claude Max'],
          }),
        ],
      })
    )
    expect(row.officialInputUsd).toBe(5) // 2.5 × 2，不乘 1.5
    expect(row.officialOutputUsd).toBe(25) // 5 × 5
    expect(row.inputUsd).toBe(7.5) // 2.5 × 1.5 × 2
    expect(row.outputUsd).toBe(37.5)
  })

  test('倍率小于 1 的分组，实付价低于官方价', () => {
    const [row] = toRows(
      payload({
        data: [
          model({
            model_ratio: 2.5,
            completion_ratio: 6,
            enable_groups: ['codex pro'],
          }),
        ],
      })
    )
    expect(row.officialInputUsd).toBe(5)
    expect(row.inputUsd).toBe(2.5) // 5 折
    expect(row.officialOutputUsd).toBe(30)
    expect(row.outputUsd).toBe(15)
  })

  test('default 分组倍率为 1 时两者相等', () => {
    const [row] = toRows(payload({ data: [model({ model_ratio: 3 })] }))
    expect(row.officialInputUsd).toBe(row.inputUsd)
    expect(row.officialOutputUsd).toBe(row.outputUsd)
  })

  test('官方价同样收敛浮点，不带二进制尾巴', () => {
    const [row] = toRows(
      payload({ data: [model({ model_ratio: 0.05, completion_ratio: 3 })] })
    )
    expect(row.officialInputUsd).toBe(0.1)
    expect(row.officialOutputUsd).toBe(0.3)
  })

  test('快照合并只在含官方价在内的价格全部相同时发生', () => {
    // 两行实付价相同但官方价不同（分组倍率不同抵消了差异）时必须保留两行，
    // 合并会让「官方价」那一列凭空丢失一个真实数值。
    const rows = toRows(
      payload({
        data: [
          model({ model_name: 'm', model_ratio: 1, enable_groups: ['default'] }),
          model({
            model_name: 'm-20251001',
            model_ratio: 2,
            enable_groups: ['codex pro'],
          }),
        ],
      })
    )
    expect(rows).toHaveLength(2)
  })
})

describe('人民币折算与折扣', () => {
  const rates = { usdToCny: 7.3, cnyPerQuotaUsd: 1 }

  const opus = () =>
    toRows(
      payload({
        data: [
          model({
            model_ratio: 2.5,
            completion_ratio: 5,
            cache_ratio: 0.1,
            create_cache_ratio: 1.25,
            enable_groups: ['Claude Max'],
          }),
        ],
      })
    )[0]

  test('官方美元牌价按汇率折成人民币', () => {
    const r = opus()
    expect(officialCny(r, 'input', rates)).toBe(36.5) // $5 × 7.3
    expect(officialCny(r, 'output', rates)).toBe(182.5) // $25 × 7.3
  })

  test('本站价按充值价折算；Price=1 时人民币数值等于额度美元数', () => {
    const r = opus()
    expect(ourCny(r, 'input', rates)).toBe(7.5)
    expect(ourCny(r, 'output', rates)).toBe(37.5)
  })

  test('充值价不是 1 时本站价跟着变', () => {
    const r = opus()
    expect(ourCny(r, 'input', { usdToCny: 7.3, cnyPerQuotaUsd: 2 })).toBe(15)
  })

  test('折扣 = 本站价 / 官方折合价，越小越便宜', () => {
    const r = opus()
    // 7.5 / 36.5 ≈ 0.2055
    expect(discountRatio(r, 'input', rates)).toBeCloseTo(0.2055, 4)
    expect(zhe(discountRatio(r, 'input', rates))).toBe('2.1 折')
  })

  test('省下的钱 = 官方折合价 - 本站价', () => {
    const r = opus()
    expect(savedCny(r, 'input', rates)).toBe(29) // 36.5 - 7.5
  })

  test('汇率缺失或为 0 时折扣返回 null，不产出 Infinity 或 NaN', () => {
    const r = opus()
    const broken = { usdToCny: 0, cnyPerQuotaUsd: 1 }
    expect(discountRatio(r, 'input', broken)).toBeNull()
    expect(savedCny(r, 'input', broken)).toBeNull()
  })

  test('zhe 只保留一位小数，且带单位', () => {
    expect(zhe(0.21)).toBe('2.1 折')
    expect(zhe(0.5)).toBe('5.0 折')
    expect(zhe(1)).toBe('10.0 折')
    expect(zhe(null)).toBe('—')
  })

  test('月支出 = 输入单价 × 输入量 + 输出单价 × 输出量', () => {
    const r = opus()
    // 官方：36.5×10 + 182.5×2 = 365 + 365 = 730
    expect(monthlyCny(r, 10, 2, rates).official).toBe(730)
    // 本站：7.5×10 + 37.5×2 = 75 + 75 = 150
    expect(monthlyCny(r, 10, 2, rates).ours).toBe(150)
    expect(monthlyCny(r, 10, 2, rates).saved).toBe(580)
  })

  test('月用量为 0 时不报错，折扣按单价算而不是除以 0', () => {
    const r = opus()
    const m = monthlyCny(r, 0, 0, rates)
    expect(m.official).toBe(0)
    expect(m.ours).toBe(0)
    expect(m.saved).toBe(0)
    expect(m.ratio).toBeNull()
  })

  test('缓存价也能折算到人民币，写入不适用时为 null', () => {
    const r = opus()
    expect(ourCny(r, 'cacheHit', rates)).toBe(0.75)
    // 7.5 × 1.25 = 9.375。数据层保留原值，两位小数是渲染层的事
    expect(ourCny(r, 'cacheWrite', rates)).toBe(9.375)

    const noWrite = toRows(
      payload({ data: [model({ cache_ratio: 0.1, create_cache_ratio: 0 })] })
    )[0]
    expect(ourCny(noWrite, 'cacheWrite', rates)).toBeNull()
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

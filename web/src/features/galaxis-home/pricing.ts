/*
 * 价目表数据换算。
 *
 * 逻辑整体沿用官网版本（galaxis-web/src/lib/pricing.ts），未改动算法。
 * 差别只有取数路径：官网是跨站请求 https://galaxisrouter.cn/api/pricing，
 * 这里与后端同源，用相对路径即可。
 */

/** 倍率 → 美元/百万 token 的换算系数。 */
export const USD_PER_RATIO_PER_M = 2

export interface PricingModel {
  model_name: string
  vendor_id: number
  quota_type: number
  model_ratio: number
  completion_ratio: number
  cache_ratio: number
  enable_groups: string[]
}

export interface PricingPayload {
  success: boolean
  data: PricingModel[]
  group_ratio: Record<string, number> | null
  usable_group: Record<string, string>
  vendors: { id: number; name: string; icon: string }[]
}

export interface ModelRow {
  name: string
  vendor: string
  group: string
  groupLabel: string
  inputUsd: number
  outputUsd: number
  cachedUsd: number | null
}

export const PRICING_PATH = '/api/pricing'

export function toRows(p: PricingPayload): ModelRow[] {
  const vendorName = new Map(p.vendors.map((v) => [v.id, v.name]))
  return p.data
    .filter((m) => m.quota_type === 0) // 按次计费的模型价格语义不同，不混在这张表里
    .map((m) => {
      const group = m.enable_groups[0] ?? 'default'
      // 刻意**不**乘 group_ratio：这里展示的是模型本身的基准单价。
      // 分组倍率（codex pro 0.5 / Claude Max 1.5）是账号维度的折扣或加价，
      // 同一个模型对不同分组的用户价格不同，放进公开价目表反而会被理解成
      // 「人人都是这个价」。group_ratio 仍在 payload 里，将来要做
      // 「按分组切换」的价目表可以直接用。
      const base = m.model_ratio * USD_PER_RATIO_PER_M
      return {
        name: m.model_name,
        vendor: vendorName.get(m.vendor_id) ?? '其他',
        group,
        groupLabel: p.usable_group?.[group] ?? group,
        inputUsd: base,
        outputUsd: base * m.completion_ratio,
        cachedUsd: m.cache_ratio ? base * m.cache_ratio : null,
      }
    })
    .sort((a, b) => a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name))
}

/** 按厂商分组，供表格分段渲染。 */
export function groupByVendor(rows: ModelRow[]): Record<string, ModelRow[]> {
  return rows.reduce<Record<string, ModelRow[]>>((acc, r) => {
    ;(acc[r.vendor] ??= []).push(r)
    return acc
  }, {})
}

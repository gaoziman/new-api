/*
 * 价目表数据换算。
 *
 * 逻辑与官网版本（galaxis-web/src/lib/pricing.ts）保持同步，两边算法必须一致。
 * 差别只有取数路径：官网是跨站请求 https://galaxisrouter.cn/api/pricing，
 * 这里与后端同源，用相对路径即可。
 *
 * 【换算依据】客户端 `app/src/ipc.ts` 的 `QUOTA_PER_UNIT = 500_000`（50 万额度 = $1）。
 * New API 计费公式：消耗额度 = tokens × model_ratio × group_ratio。
 * 所以 1M tokens 价格 = 1e6 × model_ratio × group_ratio / 500000
 *                    = 2 × model_ratio × group_ratio 美元。
 */

/** 倍率 → 美元/百万 token 的换算系数。 */
export const USD_PER_RATIO_PER_M = 2

/** 日期快照版本名，形如 `claude-haiku-4-5-20251001`。 */
const SNAPSHOT_SUFFIX = /^(.+)-(\d{8})$/

/**
 * 收敛浮点尾巴。`6 × 0.1` 在 IEEE-754 下是 0.6000000000000001，
 * 渲染时 `.toFixed(2)` 看不出来，但它会渗进相等判断——快照合并正是靠
 * 价格相等来决定合不合并的。取 6 位小数：最低价 $0.10 档的缓存价要到
 * 小数点后 4 位（如 $0.0915），留两位裕量，同时足以抹掉第 15 位的噪声。
 */
function round(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

export interface PricingModel {
  model_name: string
  vendor_id: number
  quota_type: number
  model_ratio: number
  completion_ratio: number
  cache_ratio: number
  /** 首次建立缓存的一次性开销倍数，相对输入价。 */
  create_cache_ratio?: number
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
  /** 厂商图标名，交给 getLobeIcon 解析（如 `OpenAI`、`Claude.Color`）。 */
  vendorIcon: string
  group: string
  groupLabel: string
  /** 以下均为**含分组倍率**的实付单价，美元 / 百万 token。 */
  inputUsd: number
  outputUsd: number
  cacheHitUsd: number | null
  cacheWriteUsd: number | null
  /** 已并入本行的日期快照，如 `['20251001']`；无快照时为空数组。 */
  snapshots: string[]
}

export const PRICING_PATH = '/api/pricing'

/**
 * 选出用于报价的分组。
 *
 * 线上每个模型目前都只属于一个分组，但接口结构允许多个。取 `enable_groups[0]`
 * 会让报价随后台返回顺序漂移（同一模型一会儿贵一会儿便宜），所以固定取倍率
 * 最低、也就是对用户最有利的那个。
 */
function pickGroup(
  groups: string[],
  ratios: Record<string, number> | null
): string {
  if (groups.length === 0) return 'default'
  return [...groups].sort(
    (a, b) => (ratios?.[a] ?? 1) - (ratios?.[b] ?? 1) || a.localeCompare(b)
  )[0]
}

/** 四个价格字段是否完全相同。用于判断快照版能否并入主版本。 */
function samePrice(a: ModelRow, b: ModelRow): boolean {
  return (
    a.inputUsd === b.inputUsd &&
    a.outputUsd === b.outputUsd &&
    a.cacheHitUsd === b.cacheHitUsd &&
    a.cacheWriteUsd === b.cacheWriteUsd
  )
}

/**
 * 把日期快照并入主版本。
 *
 * `claude-haiku-4-5` 和 `claude-haiku-4-5-20251001` 价格一模一样，并排两行只会
 * 让人以为看花了眼。合并的前提是**价格完全相同**：价格不同说明它们是两个真实
 * 不同的档位，合并会藏掉价差。主版本不在列表里时，快照保留自己那行。
 */
function mergeSnapshots(rows: ModelRow[]): ModelRow[] {
  const byName = new Map(rows.map((r) => [r.name, r]))
  const merged: ModelRow[] = []

  for (const row of rows) {
    const m = SNAPSHOT_SUFFIX.exec(row.name)
    const base = m ? byName.get(m[1]) : undefined
    if (m && base && base.vendor === row.vendor && samePrice(base, row)) {
      base.snapshots.push(m[2])
      continue
    }
    merged.push(row)
  }

  for (const row of merged) row.snapshots.sort()
  return merged
}

export function toRows(p: PricingPayload): ModelRow[] {
  const vendors = new Map(p.vendors.map((v) => [v.id, v]))

  const rows = p.data
    .filter((m) => m.quota_type === 0) // 按次计费的模型价格语义不同，不混在这张表里
    .map<ModelRow>((m) => {
      const group = pickGroup(m.enable_groups, p.group_ratio)
      // 乘上分组倍率，得到用户实际被扣的价。不乘的话页面报价与账单对不上：
      // Claude Max（1.5）会少报 33%，codex pro（0.5）会多报 100%。
      const input = round(
        m.model_ratio * (p.group_ratio?.[group] ?? 1) * USD_PER_RATIO_PER_M
      )
      const vendor = vendors.get(m.vendor_id)
      return {
        name: m.model_name,
        vendor: vendor?.name ?? '其他',
        vendorIcon: vendor?.icon ?? '',
        group,
        groupLabel: p.usable_group?.[group] ?? group,
        inputUsd: input,
        outputUsd: round(input * m.completion_ratio),
        cacheHitUsd: m.cache_ratio ? round(input * m.cache_ratio) : null,
        cacheWriteUsd: m.create_cache_ratio
          ? round(input * m.create_cache_ratio)
          : null,
        snapshots: [],
      }
    })

  // 贵的排前面：旗舰模型是大多数人来这张表要找的东西。
  return mergeSnapshots(rows).sort(
    (a, b) =>
      a.vendor.localeCompare(b.vendor) ||
      b.inputUsd - a.inputUsd ||
      a.name.localeCompare(b.name)
  )
}

/**
 * 全部模型共用的缓存命中折扣，取不到一致值时返回 null。
 *
 * 页面上「缓存命中只要 N 折」这句话要对所有模型成立才能说。写死成「1 折」的话，
 * 后台把任意一个模型的 cache_ratio 调走，这句就变成了假话而没人会发现。
 */
export function uniformCacheDiscount(rows: ModelRow[]): number | null {
  if (rows.length === 0) return null

  let shared: number | null = null
  for (const r of rows) {
    if (r.cacheHitUsd === null || r.inputUsd === 0) return null
    const ratio = round(r.cacheHitUsd / r.inputUsd)
    if (shared === null) shared = ratio
    else if (shared !== ratio) return null
  }
  return shared
}

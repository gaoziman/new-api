/*
 * 价格区。结构与文案来自客户原型。
 *
 * 【与官网版的差别】
 * 1. 官网构建期把价目表烘进 HTML 再由脚本运行期刷新；这里与后端同源，
 *    运行期取一次即可——价格随后台配置变动，烘进前端产物只会让它过期。
 * 2. 厂商图标走 `getLobeIcon()`（接口返回的 `vendors[].icon` 就是 lobehub 的名字，
 *    如 `OpenAI`、`Claude.Color`）。原型是纯静态 HTML、没有图标库，那一列留空。
 *
 * 【为什么保留 id="priceTable" 与 data-src】原型的滚动揭示动画按 id 选元素；
 * data-src 留作排查用，能一眼看出这张表的数据来自哪个接口。
 */
import { useEffect, useMemo, useState } from 'react'

import { getLobeIcon } from '@/lib/lobe-icon'

import {
  PRICING_PATH,
  toRows,
  uniformCacheDiscount,
  type ModelRow,
  type PricingPayload,
} from '../pricing'

type Status = 'loading' | 'ready' | 'failed'

const usd = (n: number) => `$${n.toFixed(2)}`

export function Pricing() {
  const [rows, setRows] = useState<ModelRow[]>([])
  const [status, setStatus] = useState<Status>('loading')
  /** null = 不按厂商筛选。用 null 而不是哨兵字符串，省得跟真实厂商名撞车。 */
  const [vendor, setVendor] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    async function load() {
      try {
        const res = await fetch(PRICING_PATH, { signal: controller.signal })
        const json = res.ok ? ((await res.json()) as PricingPayload) : null
        if (cancelled) return
        if (json?.success && Array.isArray(json.data)) {
          setRows(toRows(json))
          setStatus('ready')
        } else {
          setStatus('failed')
        }
      } catch {
        if (!cancelled) setStatus('failed')
      } finally {
        clearTimeout(timer)
      }
    }

    void load()

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  /** 厂商 Tab：顺序跟表格一致，附带每家的模型数。 */
  const vendors = useMemo(() => {
    const counts = new Map<string, { count: number; icon: string }>()
    for (const r of rows) {
      const hit = counts.get(r.vendor)
      if (hit) hit.count += 1
      else counts.set(r.vendor, { count: 1, icon: r.vendorIcon })
    }
    return [...counts.entries()].map(([name, v]) => ({ name, ...v }))
  }, [rows])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (vendor === null || r.vendor === vendor) &&
        (q === '' ||
          r.name.toLowerCase().includes(q) ||
          r.snapshots.some((s) => s.includes(q)))
    )
  }, [rows, vendor, query])

  const discount = useMemo(() => uniformCacheDiscount(rows), [rows])

  return (
    <>
      {/* FIG.04 价格 */}
      <div className='hrule' aria-hidden='true'>
        <i className='node node-l' />
        <i className='node node-r' />
        <span className='fig'>
          FIG.<b>04</b>&nbsp;&nbsp;PRICING — 多少钱
        </span>
      </div>
      <div className='price-zone' id='pricing'>
        <div className='dl-head reveal'>
          <h2>用多少付多少，没有月费</h2>
          <p>
            下面是你实际会被扣掉的价格，已经按分组倍率算好，不需要再自己折算。
            单位为美元 / 每百万 token。
          </p>
        </div>

        {/*
          「缓存命中只要 N 折」由数据推导，不写死：后台把任意一个模型的
          cache_ratio 调走，这句话就不再对全部模型成立，此时整块不渲染。
        */}
        {discount !== null && (
          <div className='pt-anchor reveal'>
            <b>缓存命中只要 {+(discount * 10).toFixed(2)} 折</b>
            <span>
              重复的上下文按输入价的 {+(discount * 100).toFixed(2)}% 计费，
              全部模型都适用
            </span>
          </div>
        )}

        <div className='price-facts reveal'>
          <div className='pf-item'>
            <svg
              className='pf-ico'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.7'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <path d='M3 12.5V5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.4.6l6.5 6.5a2 2 0 0 1 0 2.8l-6.6 6.6a2 2 0 0 1-2.8 0L3.6 13.9a2 2 0 0 1-.6-1.4z' />
              <circle cx='7.5' cy='7.5' r='1.4' />
            </svg>
            <div>
              <b>用多少付多少</b>
              <span>没有月费，不用订阅</span>
            </div>
          </div>
          <div className='pf-item'>
            <svg
              className='pf-ico'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.7'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <rect x='2' y='5' width='20' height='14' rx='2' />
              <path d='M2 10h20' />
              <path d='M6 15h4' />
            </svg>
            <div>
              <b>账户预充值</b>
              <span>充多少用多少，余额看得见</span>
            </div>
          </div>
          <div className='pf-item'>
            <svg
              className='pf-ico'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.7'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <path d='M12 3v9' />
              <path d='M18.4 6.6a9 9 0 1 1-12.8 0' />
            </svg>
            <div>
              <b>余额用完自动停</b>
              <span>不会自动扣款，不会产生欠费</span>
            </div>
          </div>
        </div>

        {/* 模型价目表：运行期从同源接口取 */}
        <div className='price-table reveal' id='priceTable' data-src={PRICING_PATH}>
          {status === 'ready' && rows.length > 0 && (
            <div className='pt-controls'>
              <div className='pt-tabs' role='group' aria-label='按厂商筛选'>
                <button
                  type='button'
                  className='pt-tab'
                  aria-pressed={vendor === null}
                  onClick={() => setVendor(null)}
                >
                  全部 <span className='cnt'>{rows.length}</span>
                </button>
                {vendors.map((v) => (
                  <button
                    type='button'
                    key={v.name}
                    className='pt-tab'
                    aria-pressed={vendor === v.name}
                    onClick={() => setVendor(v.name)}
                  >
                    <span className='pt-ico' aria-hidden='true'>
                      {getLobeIcon(v.icon, 15)}
                    </span>
                    {v.name} <span className='cnt'>{v.count}</span>
                  </button>
                ))}
              </div>
              <div className='pt-search'>
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  aria-hidden='true'
                >
                  <circle cx='11' cy='11' r='7' />
                  <path d='m20 20-3.5-3.5' />
                </svg>
                <input
                  type='search'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='搜索模型'
                  aria-label='搜索模型'
                />
              </div>
            </div>
          )}

          {status === 'loading' && (
            /* 骨架屏形状与真实行一致，不用转圈——转圈看不出要等多久，也撑不住布局 */
            <div className='pt-wrap' aria-busy='true' aria-label='价格加载中'>
              <table>
                <tbody>
                  {Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td>
                        <span className='pt-sk lg' />
                      </td>
                      <td className='num'>
                        <span className='pt-sk sm' />
                      </td>
                      <td className='num'>
                        <span className='pt-sk sm' />
                      </td>
                      <td className='num soft'>
                        <span className='pt-sk xs' />
                      </td>
                      <td className='num soft'>
                        <span className='pt-sk xs' />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/*
            取不到时必须说清楚，不能停在「加载中…」。
            价格页一直转圈会让人以为是自己网络的问题而反复刷新。
          */}
          {status === 'failed' && (
            <p className='pt-empty'>价格暂时取不到，请稍后刷新页面重试。</p>
          )}

          {status === 'ready' && visible.length === 0 && (
            <p className='pt-empty'>
              <b>没有匹配的模型</b>
              换个关键词，或点「全部」看完整列表
            </p>
          )}

          {status === 'ready' && visible.length > 0 && (
            <div className='pt-wrap'>
              <table>
                <thead>
                  {/*
                    两层表头：上层交代这几列价格的归属（都是我们的实付价，不是官方价），
                    下层是具体口径。缓存两列单独成组，和主价拉开。
                  */}
                  <tr>
                    <th rowSpan={2}>模型</th>
                    <th className='grp' colSpan={2}>
                      GalaxisRouter
                    </th>
                    <th className='grp soft' colSpan={2}>
                      缓存
                    </th>
                    <th className='ven' rowSpan={2}>
                      供应商
                    </th>
                  </tr>
                  <tr>
                    <th className='num'>输入 / 1M</th>
                    <th className='num'>输出 / 1M</th>
                    <th className='num soft'>缓存命中</th>
                    <th className='num soft'>缓存写入</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => (
                    <tr
                      key={`${r.vendor}/${r.name}`}
                      className={
                        i > 0 && visible[i - 1].vendor !== r.vendor
                          ? 'pt-gap'
                          : undefined
                      }
                    >
                      <td>
                        <div className='pt-name'>{r.name}</div>
                        <div className='pt-sub'>
                          {r.vendor}
                          <span className='pt-grp'>{r.groupLabel}</span>
                          {r.snapshots.length > 0 && (
                            <span
                              className='pt-snap'
                              title={`含日期快照版本：${r.snapshots
                                .map((s) => `${r.name}-${s}`)
                                .join('、')}`}
                            >
                              含 {r.snapshots.length} 个日期快照
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='num' data-label='输入 / 1M'>
                        <span className='pt-price'>{usd(r.inputUsd)}</span>
                      </td>
                      <td className='num' data-label='输出 / 1M'>
                        <span className='pt-price'>{usd(r.outputUsd)}</span>
                      </td>
                      <td className='num soft' data-label='缓存命中'>
                        {r.cacheHitUsd === null ? (
                          <span className='pt-na'>不适用</span>
                        ) : (
                          <span className='pt-hit'>{usd(r.cacheHitUsd)}</span>
                        )}
                      </td>
                      <td className='num soft' data-label='缓存写入'>
                        {r.cacheWriteUsd === null ? (
                          <span className='pt-na'>不适用</span>
                        ) : (
                          <span className='pt-write'>
                            {usd(r.cacheWriteUsd)}
                          </span>
                        )}
                      </td>
                      <td className='ven'>
                        <span className='pt-ico' aria-hidden='true'>
                          {getLobeIcon(r.vendorIcon, 19)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className='pt-note'>
            价格已包含分组倍率。<code>缓存命中</code> 指上下文被复用时的输入单价，
            <code>缓存写入</code> 指首次建立缓存的一次性开销。日期快照版本与主版本
            价格相同，已并入同一行。余额用完自动停，不会自动扣款。
          </p>
        </div>
      </div>
    </>
  )
}

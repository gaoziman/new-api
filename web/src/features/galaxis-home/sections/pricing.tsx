/*
 * 价格区。结构与文案来自客户原型。
 *
 * 【与官网版的差别】官网是构建期把价目表烘进 HTML、再由脚本运行期静默刷新。
 * 这里与后端同源，直接运行期取一次即可——价格随后台配置变动，
 * 烘进前端产物只会让它过期。
 *
 * 【为什么保留 id="priceTable" 与 data-src】原型的滚动揭示动画按 id 选元素；
 * data-src 留作排查用，能一眼看出这张表的数据来自哪个接口。
 */
import { useEffect, useState } from 'react'

import {
  PRICING_PATH,
  groupByVendor,
  toRows,
  type ModelRow,
  type PricingPayload,
} from '../pricing'

type Status = 'loading' | 'ready' | 'failed'

export function Pricing() {
  const [rows, setRows] = useState<ModelRow[]>([])
  const [status, setStatus] = useState<Status>('loading')

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

  const byVendor = groupByVendor(rows)
  const vendors = Object.keys(byVendor)

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
          <p>账户预充值，余额用完自动停，不会自动扣款</p>
        </div>

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
          {status === 'loading' && <p className='pt-empty'>价格加载中…</p>}
          {/*
            取不到时必须说清楚，不能停在「加载中…」。
            价格页一直转圈会让人以为是自己网络的问题而反复刷新。
          */}
          {status === 'failed' && (
            <p className='pt-empty'>价格暂时取不到，请稍后刷新页面重试。</p>
          )}
          {vendors.map((v) => (
            <div className='pt-group' key={v}>
              <h3 className='pt-vendor'>{v}</h3>
              <div className='pt-scroll'>
                <table>
                  <thead>
                    <tr>
                      <th>模型</th>
                      <th>分组</th>
                      <th className='num'>输入</th>
                      <th className='num'>输出</th>
                      <th className='num'>缓存命中</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byVendor[v].map((r) => (
                      <tr key={`${r.vendor}/${r.name}/${r.group}`}>
                        <td className='pt-name'>{r.name}</td>
                        <td>
                          <span className='pt-tag'>{r.groupLabel}</span>
                        </td>
                        <td className='num'>${r.inputUsd.toFixed(2)}</td>
                        <td className='num'>${r.outputUsd.toFixed(2)}</td>
                        <td className='num'>
                          {r.cachedUsd === null
                            ? '—'
                            : `$${r.cachedUsd.toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className='pt-note'>
            单位：美元 / 每百万
            token，为模型基准单价。实际扣费还会按你所在分组的倍率折算，登录客户端可查看实时余额与用量。
          </p>
        </div>
      </div>
    </>
  )
}

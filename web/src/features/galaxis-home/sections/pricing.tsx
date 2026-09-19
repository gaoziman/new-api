/*
 * FIG.04 价格区 —— 按客户交付的 DESIGN.md 第 10 节 + pricing-v6.html 实现。
 *
 * 【信息链】官方价 $ → × 汇率 → = 折合 ¥ → 本站价 ¥（1 元 = 1 美金额度）
 *          → 打几折 · 每 1M 省 ¥ → 按月用量对比 → 月省 / 年省
 *
 * 【与官网版的差别】官网构建期把价格与汇率烘进 HTML 再由脚本运行期刷新；
 * 这里与后端同源，运行期取一次即可——价格随后台配置变动，烘进产物只会过期。
 *
 * 【汇率为什么取 /api/status】客户接入说明写的是从 topup_info 取，但那个端点
 * 返回的是 pay_methods / min_topup / amount_options / discount / topup_link，
 * 没有汇率字段。真正有 usd_exchange_rate 与 price 的是 /api/status。
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

import {
  PRICING_PATH,
  STATUS_PATH,
  byVendor,
  channelOf,
  discountRatio,
  monthlyCny,
  money,
  officialCny,
  ourCny,
  ratesFrom,
  savedCny,
  toRows,
  zhe,
  type ModelRow,
  type PriceDir,
  type PricingPayload,
  type PricingRates,
} from '../pricing'

type Status = 'loading' | 'ready' | 'failed'

/** 滑块默认值，沿用客户原型：每月输入 10M / 输出 2M。 */
const DEF_IN = 10
const DEF_OUT = 2

export function Pricing() {
  const [rows, setRows] = useState<ModelRow[]>([])
  const [rates, setRates] = useState<PricingRates | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [vendor, setVendor] = useState('all')
  const [picked, setPicked] = useState('')
  const [mIn, setMIn] = useState(DEF_IN)
  const [mOut, setMOut] = useState(DEF_OUT)
  const zoneRef = useRef<HTMLDivElement>(null)

  /*
   * 给晚到的 .reveal 节点补一个观察者。
   *
   * use-home-effects.ts 的滚动入场是在首页挂载时 querySelectorAll('.reveal')
   * 一次性收集目标的。筛选按钮与表格要等接口回来才插进 DOM，那时观察者早就
   * 收完了，这些块永远拿不到 .in，会被 opacity:0 永久卡住——页面上看到的是
   * 估算器下面一大片空白。这里只观察自己这一片里还没 .in 的，不动共享逻辑。
   */
  useEffect(() => {
    const zone = zoneRef.current
    if (status !== 'ready' || !zone) return

    const late = zone.querySelectorAll<HTMLElement>('.reveal:not(.in)')
    if (late.length === 0) return

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      for (const el of late) el.classList.add('in')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      },
      { threshold: 0.12 }
    )
    for (const el of late) io.observe(el)
    return () => io.disconnect()
  }, [status])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    async function load() {
      try {
        const [pr, sr] = await Promise.all([
          fetch(PRICING_PATH, { signal: controller.signal }),
          fetch(STATUS_PATH, { signal: controller.signal }),
        ])
        const pj = pr.ok ? ((await pr.json()) as PricingPayload) : null
        const sj = sr.ok ? await sr.json() : null
        if (cancelled) return

        const nextRates = ratesFrom(sj)
        // 没汇率算不出折合价，整块退回失败态，别渲染一片破折号
        if (pj?.success && Array.isArray(pj.data) && nextRates) {
          setRows(toRows(pj))
          setRates(nextRates)
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

  const groups = useMemo(() => byVendor(rows), [rows])
  const visible = useMemo(
    () => (vendor === 'all' ? groups : groups.filter(([v]) => v === vendor)),
    [groups, vendor]
  )

  /** 估算器当前模型。用户没选过就用第一个（列表已按价格降序）。 */
  const row = useMemo(
    () => rows.find((r) => r.name === picked) ?? rows[0] ?? null,
    [rows, picked]
  )
  const est = useMemo(
    () => (row && rates ? monthlyCny(row, mIn, mOut, rates) : null),
    [row, rates, mIn, mOut]
  )

  /** 官方价格子：折合人民币（划掉）+ 换算过程小字。 */
  const offCell = (r: ModelRow, dir: PriceDir) => {
    if (!rates) return null
    const usd = dir === 'input' ? r.officialInputUsd : r.officialOutputUsd
    return (
      <>
        <span className='off-cny'>¥{money(officialCny(r, dir, rates))}</span>
        <span className='off-usd'>
          ${money(usd)} × {rates.usdToCny.toFixed(2)}
        </span>
      </>
    )
  }

  /** 本站价格子：价格 + 折扣块 + 省额。 */
  const mineCell = (r: ModelRow, dir: PriceDir) => {
    if (!rates) return null
    const saved = savedCny(r, dir, rates)
    return (
      <>
        <div className='mine-line'>
          <span className='mine'>
            <i>¥</i>
            {money(ourCny(r, dir, rates) ?? 0)}
          </span>
          <span className='zhe'>{zhe(discountRatio(r, dir, rates))}</span>
        </div>
        {saved !== null && <div className='saved'>省 ¥{money(saved)}</div>}
      </>
    )
  }

  /** 缓存格子：只作用输入侧，不与官方比。 */
  const cacheCell = (r: ModelRow) => {
    if (!rates) return null
    const hit = ourCny(r, 'cacheHit', rates)
    const wr = ourCny(r, 'cacheWrite', rates)
    return (
      <div className='cache'>
        <s>命中</s>
        {hit === null ? '不适用' : `¥${money(hit)}`}
        <br />
        <s>写入</s>
        {wr === null ? '不适用' : `¥${money(wr)}`}
      </div>
    )
  }

  const note = (r: ModelRow) =>
    r.snapshots.length > 0 ? (
      <div className='mnote'>含 {r.snapshots.length} 个日期快照</div>
    ) : null

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
      <div className='price-zone' id='pricing' ref={zoneRef}>
        <div className='dl-head reveal'>
          <h2>一样的模型，两成的价钱</h2>
          <p>1 元充值到账 1 美金额度 · 官方美元价按汇率折合人民币对比</p>
        </div>

        {/* 估算器 */}
        <div className='calc reveal'>
          <div className='calc-ctl'>
            <div className='ctl'>
              <label htmlFor='sv-model'>模型</label>
              <select
                id='sv-model'
                value={row?.name ?? ''}
                onChange={(e) => setPicked(e.target.value)}
              >
                {groups.map(([v, list]) => (
                  <optgroup label={v} key={v}>
                    {list.map((r) => (
                      <option value={r.name} key={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className='ctl ctl-range'>
              <div className='ctl-v'>
                {mIn} M<small>每月输入 TOKENS</small>
              </div>
              <input
                type='range'
                min={1}
                max={200}
                step={1}
                value={mIn}
                onChange={(e) => setMIn(Number(e.target.value))}
                aria-label='每月输入 tokens（百万）'
              />
            </div>
            <div className='ctl ctl-range'>
              <div className='ctl-v'>
                {mOut} M<small>每月输出 TOKENS</small>
              </div>
              <input
                type='range'
                min={1}
                max={100}
                step={1}
                value={mOut}
                onChange={(e) => setMOut(Number(e.target.value))}
                aria-label='每月输出 tokens（百万）'
              />
            </div>
          </div>

          <div className='eq' role='group' aria-label='计价逻辑'>
            <div className='eq-cell'>
              <small>官方价 / 1M</small>
              <b>{row ? `$${money(row.officialInputUsd)}` : '$—'}</b>
              <div className='sub'>输入价，美元</div>
            </div>
            <div className='eq-cell'>
              <small>
                <i>×</i> 汇率
              </small>
              <b>{rates ? rates.usdToCny.toFixed(2) : '—'}</b>
              <div className='sub'>
                {rates ? (
                  '来自后台设置'
                ) : (
                  <span className='ph'>
                    <span>汇率未取到</span>
                  </span>
                )}
              </div>
            </div>
            <div className='eq-cell dim'>
              <small>
                <i>=</i> 折合人民币
              </small>
              <b>
                {row && rates ? `¥${money(officialCny(row, 'input', rates))}` : '¥—'}
              </b>
              <div className='sub'>官方直接买要付的</div>
            </div>
            <div className='eq-cell zone'>
              <small>本站价 / 1M</small>
              <b>
                {row && rates ? `¥${money(ourCny(row, 'input', rates) ?? 0)}` : '¥—'}
              </b>
              <div className='sub'>1 元 = 1 美金额度</div>
            </div>
            <div className='eq-cell out'>
              <small>
                <i>→</i> 折扣
              </small>
              <b>{row && rates ? zhe(discountRatio(row, 'input', rates)) : '—'}</b>
              <div className='sub'>
                每 1M 省{' '}
                <span className='pz-num'>
                  {row && rates ? `¥${money(savedCny(row, 'input', rates) ?? 0)}` : '¥—'}
                </span>
              </div>
            </div>
          </div>

          <div className='bars'>
            <div className='bar-row'>
              <span className='bar-l'>官方直接买</span>
              <div className='bar'>
                <div className='bar-fill off' style={{ width: '100%' }} />
              </div>
              <span className='bar-v dim'>{est ? `¥${money(est.official)}` : '¥—'}</span>
            </div>
            <div className='bar-row'>
              <span className='bar-l'>走 GALAXISROUTER</span>
              <div className='bar'>
                {/* 留 1.5% 下限，免得折扣太深缩成看不见 */}
                <div
                  className='bar-fill mine'
                  style={{
                    width: `${est?.ratio === null || !est ? 100 : Math.max(est.ratio * 100, 1.5)}%`,
                  }}
                />
              </div>
              <span className='bar-v hl'>{est ? `¥${money(est.ours)}` : '¥—'}</span>
            </div>
          </div>

          <div className='calc-out'>
            <div>
              <div className='co-k'>{est ? `¥${money(est.saved)}` : '¥—'}</div>
              <div className='co-l'>每月省下</div>
            </div>
            <div className='co-sub'>
              <b>
                {est?.ratio != null
                  ? `${zhe(est.ratio)}，省 ${Math.round((1 - est.ratio) * 100)}%`
                  : '—'}
              </b>
              　·　一年省 <b>{est ? `¥${money(est.saved * 12)}` : '¥—'}</b>
            </div>
          </div>
        </div>

        {status === 'ready' && groups.length > 0 && (
          <div className='filters reveal' role='group' aria-label='按供应商筛选'>
            <button
              type='button'
              aria-pressed={vendor === 'all'}
              onClick={() => setVendor('all')}
            >
              全部
            </button>
            {groups.map(([v]) => (
              <button
                type='button'
                key={v}
                aria-pressed={vendor === v}
                onClick={() => setVendor(v)}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && <p className='pz-empty'>价格加载中…</p>}
        {/*
          取不到时必须说清楚，不能停在「加载中…」。
          价格页一直转圈会让人以为是自己网络的问题而反复刷新。
        */}
        {status === 'failed' && (
          <p className='pz-empty'>价格暂时取不到，请稍后刷新页面重试。</p>
        )}

        {status === 'ready' && (
          <>
            <div className='tbl reveal'>
              <table className='ptab'>
                <thead>
                  <tr className='zone-head'>
                    <th>Model</th>
                    <th colSpan={2}>
                      官方价<em>美元 → 折合人民币</em>
                    </th>
                    <th colSpan={2} className='z zl zr'>
                      GalaxisRouter<em>人民币额度 · 1 元 = 1 美金</em>
                    </th>
                    <th>
                      缓存<em>仅输入侧</em>
                    </th>
                  </tr>
                  <tr className='col-head'>
                    <th>模型</th>
                    <th>输入 / 1M</th>
                    <th>输出 / 1M</th>
                    <th className='z zl'>输入 / 1M</th>
                    <th className='z zr'>输出 / 1M</th>
                    <th>命中 / 写入</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(([v, list]) => (
                    <Fragment key={v}>
                      <tr className='grp'>
                        <td colSpan={6}>
                          <div className='grp-name'>
                            {v}
                            <span>{channelOf(list)}</span>
                          </div>
                        </td>
                      </tr>
                      {list.map((r) => (
                        <tr className='m' key={r.name}>
                          <td>
                            <div className='mname'>{r.name}</div>
                            {note(r)}
                          </td>
                          <td>{offCell(r, 'input')}</td>
                          <td>{offCell(r, 'output')}</td>
                          <td className='z zl'>{mineCell(r, 'input')}</td>
                          <td className='z zr'>{mineCell(r, 'output')}</td>
                          <td>{cacheCell(r)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 卡片流（≤899px 顶替表格，同一份数据） */}
            <div className='pcards reveal'>
              {visible.map(([v, list]) => (
                <Fragment key={v}>
                  <div className='pc-grp'>
                    <div className='grp-name'>
                      {v}
                      <span>{channelOf(list)}</span>
                    </div>
                  </div>
                  {list.map((r) => (
                    <div className='pcard' key={r.name}>
                      <div className='pc-head'>
                        <div>
                          <div className='mname'>{r.name}</div>
                          {note(r)}
                        </div>
                        <span className='zhe'>
                          {rates ? zhe(discountRatio(r, 'input', rates)) : '—'}
                        </span>
                      </div>
                      <div className='pc-off'>
                        <div>
                          <div className='pc-l'>官方 · 输入</div>
                          {offCell(r, 'input')}
                        </div>
                        <div>
                          <div className='pc-l'>官方 · 输出</div>
                          {offCell(r, 'output')}
                        </div>
                      </div>
                      <div className='pc-zone'>
                        <div>
                          <div className='pc-l'>本站 · 输入</div>
                          {mineCell(r, 'input')}
                        </div>
                        <div>
                          <div className='pc-l'>本站 · 输出</div>
                          {mineCell(r, 'output')}
                        </div>
                      </div>
                      <div className='pc-cache'>{cacheCell(r)}</div>
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </>
        )}

        <p className='foot reveal'>
          单位：每 100 万 tokens。官方价为各厂商公开定价（美元），按后台设置的汇率换成
          人民币便于对比；本站价为人民币额度。缓存仅作用于输入侧，命中为输入价 10%，
          写入为 125%。折扣随汇率变动，以实际结算为准。
        </p>

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
              <span>1 元充 1 美金额度，不用海外信用卡</span>
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
      </div>
    </>
  )
}

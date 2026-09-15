/*
 * 首页的交互行为。
 *
 * 这些行为原本是客户原型里 4 个「加载即执行」的原生脚本
 * （scroll-progress / orbit / wx-fab / cinema）。搬进单页应用必须重写成
 * 可拆卸的形式，原因是：
 *
 *   原型是独立页面，离开页面即整页卸载，监听器、IntersectionObserver、
 *   setInterval 都由浏览器回收，所以原脚本一个 teardown 都没写。
 *   在 SPA 里换路由**不会**卸载文档——不清理的话，用户从首页进了控制台之后，
 *   那个每 1.6 秒跑一次的轨道定时器仍在后台执行并操作已被移除的 DOM，
 *   scroll 监听器也会继续在每一次滚动时触发。多进出几次首页就叠加多份。
 *
 * 所以每个行为都写成「安装并返回卸载函数」，由 useEffect 统一在卸载时回收。
 * 行为逻辑本身与原型一致，未改动。
 *
 * 原型里另外两段脚本（按平台给 CTA 加推荐样式并重排、改写页脚下载链接）
 * 没有搬过来——它们改的是渲染结果，已交回 React 由状态驱动，
 * 理由见 use-platform.ts。
 *
 * 另外，所有查询都限定在首页根元素内（root.querySelector 而非 document），
 * 避免选到 SPA 其它部分的同名元素——.reveal / .orb 这类类名很通用。
 */
import { useEffect, type RefObject } from 'react'

type Teardown = () => void

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 顶部滚动进度条。 */
function scrollProgress(root: HTMLElement): Teardown {
  const bar = root.querySelector<HTMLElement>('.scroll-progress')
  if (!bar) return () => {}

  const onScroll = () => {
    const h = document.documentElement
    const total = h.scrollHeight - h.clientHeight
    // 内容不足一屏时 total 为 0，直接算会得到 NaN 并把宽度写成 "NaN%"
    bar.style.width = total > 0 ? `${(h.scrollTop / total) * 100}%` : '0%'
  }

  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}

/** 滚动入场：元素进入视野时加 .in。 */
function revealOnScroll(root: HTMLElement): Teardown {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('in')
        io.unobserve(e.target)
      })
    },
    { threshold: 0.12 }
  )
  root.querySelectorAll('.reveal').forEach((el) => io.observe(el))
  return () => io.disconnect()
}

/** 放映厅幕布：滚到视野时自动拉开。 */
function cinemaCurtain(root: HTMLElement): Teardown {
  const cinema = root.querySelector<HTMLElement>('#cinema')
  if (!cinema) return () => {}

  const open = () => cinema.classList.add('is-open')
  if (reduceMotion()) {
    open()
    return () => {}
  }

  let timer: number | undefined
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        timer = window.setTimeout(open, 260)
        io.disconnect()
      })
    },
    { threshold: 0.35 }
  )
  io.observe(cinema)

  return () => {
    io.disconnect()
    // 定时器必须一起清：幕布还没拉开就离开页面的话，
    // 260ms 后会对已卸载的元素动手
    if (timer !== undefined) clearTimeout(timer)
  }
}

/** 滚动时高亮导航当前栏目。 */
function navSpy(root: HTMLElement): Teardown {
  const map = [...root.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]')]
    .map((a) => {
      const href = a.getAttribute('href')
      // 「首页」指向 #top，页面上并没有这个 id（浏览器对 #top 有回到顶部的
      // 内置行为，所以链接本身是好的）。但这样它就进不了下面的观察名单，
      // 标记里预设的 .on 永远摘不掉——滚到下面时会出现两个高亮项。
      // 把它挂到 Hero 上，让它和其它栏目一样参与轮换。
      let sec: Element | null = null
      if (href === '#top') sec = root.querySelector('.hero')
      else if (href && href.length > 1) sec = root.querySelector(href)
      return { a, sec }
    })
    .filter((x): x is { a: HTMLAnchorElement; sec: Element } => Boolean(x.sec))

  if (!map.length) return () => {}

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        map.forEach((x) => x.a.classList.toggle('on', x.sec === e.target))
      })
    },
    { rootMargin: '-45% 0px -50% 0px' }
  )
  map.forEach((x) => spy.observe(x.sec))
  return () => spy.disconnect()
}

/** Hero 轨道上的标签轮播。 */
function orbitRotation(root: HTMLElement): Teardown {
  const orbs = [...root.querySelectorAll<HTMLElement>('.orb')]
  if (!orbs.length || reduceMotion()) return () => {}

  let i = 0
  orbs[0].classList.add('on')
  const id = window.setInterval(() => {
    orbs[i].classList.remove('on')
    i = (i + 1) % orbs.length
    orbs[i].classList.add('on')
  }, 1600)

  return () => window.clearInterval(id)
}

/** 悬浮微信入口。 */
function wxFab(root: HTMLElement): Teardown {
  const fab = root.querySelector<HTMLElement>('#wxFab')
  const btn = root.querySelector<HTMLElement>('#wxBtn')
  if (!fab || !btn) return () => {}

  const set = (open: boolean) => {
    fab.classList.toggle('is-open', open)
    btn.setAttribute('aria-expanded', String(open))
  }

  const onBtnClick = (e: Event) => {
    e.stopPropagation()
    set(!fab.classList.contains('is-open'))
  }
  const onEnter = () => set(true)
  const onLeave = () => set(false)
  const onDocClick = (e: MouseEvent) => {
    if (!fab.contains(e.target as Node)) set(false)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') set(false)
  }

  btn.addEventListener('click', onBtnClick)
  const hoverable = window.matchMedia('(hover:hover) and (pointer:fine)').matches
  if (hoverable) {
    fab.addEventListener('mouseenter', onEnter)
    fab.addEventListener('mouseleave', onLeave)
  }
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)

  return () => {
    btn.removeEventListener('click', onBtnClick)
    if (hoverable) {
      fab.removeEventListener('mouseenter', onEnter)
      fab.removeEventListener('mouseleave', onLeave)
    }
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKey)
  }
}

/** 今日排片：切换场次。 */
function cinemaTabs(root: HTMLElement): Teardown {
  const tabs = [...root.querySelectorAll<HTMLElement>('.showtime')]
  const reels = [...root.querySelectorAll<HTMLElement>('.reel')]
  const sub = root.querySelector<HTMLElement>('.marquee-sub')
  if (!tabs.length) return () => {}

  let subTimer: number | undefined

  const show = (i: number) => {
    tabs.forEach((t, n) => {
      const on = n === i
      t.classList.toggle('is-on', on)
      t.setAttribute('aria-selected', String(on))
    })
    reels.forEach((r, n) => r.classList.toggle('is-on', n === i))

    const txt = tabs[i].dataset.sub
    if (sub && txt) {
      sub.style.opacity = '0'
      if (subTimer !== undefined) clearTimeout(subTimer)
      subTimer = window.setTimeout(() => {
        sub.textContent = txt
        sub.style.opacity = ''
      }, 160)
    }

    // 切走时暂停上一卷
    reels.forEach((r, n) => {
      if (n === i) return
      const v = r.querySelector('video')
      if (v && !v.paused) v.pause()
    })
  }

  const cleanups: Teardown[] = []
  tabs.forEach((t, i) => {
    const onClick = () => show(i)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
      tabs[next].focus()
      show(next)
    }
    t.addEventListener('click', onClick)
    t.addEventListener('keydown', onKey)
    cleanups.push(() => {
      t.removeEventListener('click', onClick)
      t.removeEventListener('keydown', onKey)
    })
  })

  return () => {
    cleanups.forEach((fn) => fn())
    if (subTimer !== undefined) clearTimeout(subTimer)
  }
}

/**
 * 页面级平滑滚动。
 *
 * 原型把 scroll-behavior:smooth 写在 html 上。作用域化之后它落到了首页的
 * 包裹 div 上，而导航锚点滚动的是**文档**，所以在 div 上不起作用。
 * 这里改成进入首页时设到 documentElement、离开时还原——既保住行为，
 * 又不会让整个后台都变成平滑滚动。
 */
function documentSmoothScroll(): Teardown {
  const el = document.documentElement
  const previous = el.style.scrollBehavior
  el.style.scrollBehavior = 'smooth'
  return () => {
    el.style.scrollBehavior = previous
  }
}

const BEHAVIORS = [
  scrollProgress,
  revealOnScroll,
  cinemaCurtain,
  navSpy,
  orbitRotation,
  wxFab,
  cinemaTabs,
]

export function useHomeEffects(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const teardowns = BEHAVIORS.map((install) => install(root))
    teardowns.push(documentSmoothScroll())

    return () => teardowns.forEach((fn) => fn())
  }, [rootRef])
}

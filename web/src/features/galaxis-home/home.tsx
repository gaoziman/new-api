/*
 * Galaxis 首页。
 *
 * 替换掉 New API 原本的落地页（features/home）。设计来自客户官网
 * （galaxisrouter.com），各区块由 sections/ 下的组件承载。
 *
 * 【骨架为什么留在这里】<main> / .chart / .chart-frame 这三层是跨区块的
 * 页面骨架，在原型 HTML 里它们的开闭标签分散在 Hero 与 Contact 内部。
 * 拆成组件时若照搬，单个组件的标签就不闭合了，所以骨架留在本文件，
 * 每个区块只管自己那一段。
 *
 * 【gx-home 这个类不能删】它是整份样式表的作用域根。样式表里每一条规则都
 * 以它开头（见 galaxis-home.css 开头的说明），删掉它整页会退化成无样式的裸 HTML。
 */
import { useRef } from 'react'

import './galaxis-home.css'
import { Business } from './sections/business'
import { Contact } from './sections/contact'
import { Faq } from './sections/faq'
import { Hero } from './sections/hero'
import { Pricing } from './sections/pricing'
import { SiteFooter } from './sections/site-footer'
import { SiteNav } from './sections/site-nav'
import { Steps } from './sections/steps'
import { SvgDefs } from './sections/svg-defs'
import { Tools } from './sections/tools'
import { Tutorial } from './sections/tutorial'
import { WxFab } from './sections/wx-fab'
import { useHomeEffects } from './use-home-effects'

export function GalaxisHome() {
  const rootRef = useRef<HTMLDivElement>(null)
  useHomeEffects(rootRef)

  return (
    <div className='gx-home' ref={rootRef}>
      <SvgDefs />
      <SiteNav />

      <main>
        <div className='chart'>
          <Hero />

          {/* ============ 图纸框架 ============ */}
          <div
            className='chart-frame enter'
            style={{ '--d': '340ms' } as React.CSSProperties}
          >
            <span className='rail rail-l' aria-hidden='true' />
            <span className='rail rail-r' aria-hidden='true' />

            <Tutorial />
            <Tools />
            <Steps />
            <Pricing />
            <Business />
            <Faq />
            <Contact />

            <div className='hrule' aria-hidden='true'>
              <i className='node node-l' />
              <i className='node node-r' />
            </div>
          </div>
        </div>

        <SiteFooter />
      </main>

      <WxFab />
    </div>
  )
}

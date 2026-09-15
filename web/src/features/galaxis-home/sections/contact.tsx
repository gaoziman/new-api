/*
 * 本区块的结构与文案来自客户原型，设计未改动。
 * JSX 由 scripts/html-to-jsx.cjs 从 galaxis-web 的 Astro 组件机械转换而来，
 * 不是手抄——原型含大量内联 SVG 与 CSS 自定义属性，手抄的错误是视觉性的，
 * 编译能过但肉眼难发现。要改设计请改原型后重新转换，不要直接编辑本文件的标签。
 *
 * 标签里 <i></i> 这类空元素没有改写成自闭合形式（lint 会有 self-closing 提示）。
 * 这是刻意的：保持与原型逐字对应，重新转换时才不会产生无意义的 diff。
 */

export function Contact() {
  return (
    <>
      {/* FIG.07 联系我们 */}
            <div className="hrule" aria-hidden="true">
              <i className="node node-l"></i><i className="node node-r"></i>
              <span className="fig">FIG.<b>07</b>&nbsp;&nbsp;CONTACT — 找得到人</span>
            </div>
            <div className="contact-zone" id="contact">
              <div className="dl-head reveal">
                <h2>装不上？随时问</h2>
                <p>工作时间内都有人，装不上不收钱</p>
              </div>
              <div className="contact-grid contact-grid-2 reveal">
                {/* 微信客服卡片：按用户要求暂时隐藏（2026-09-12），取消下面的注释即可恢复
                <div class="contact-card">
                  <div class="contact-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.5 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-5.3A7.5 7.5 0 1 1 20.5 11.5Z"/>
                    </svg>
                  </div>
                  <h3>微信客服</h3>
                  <p>加个好友，手把手带你装好</p>
                </div>
                */}
                <div className="contact-card">
                  <div className="contact-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 20.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 20.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M12 3.5a5 5 0 0 1 5 5v6M12 3.5a5 5 0 0 0-5 5v6" />
                    </svg>
                  </div>
                  <h3>用户交流群</h3>
                  <p>一起用的人都在里面，有问题随时问</p>
                </div>
                <div className="contact-card">
                  <div className="contact-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="m3 6.5 9 6 9-6" />
                    </svg>
                  </div>
                  <h3>商务与开票</h3>
                  <p>对公转账、合同、发票都能开</p>
                </div>
              </div>
            </div>
    </>
  )
}

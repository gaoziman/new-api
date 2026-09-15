/*
 * 本区块的结构与文案来自客户原型，设计未改动。
 * JSX 由 scripts/html-to-jsx.cjs 从 galaxis-web 的 Astro 组件机械转换而来，
 * 不是手抄——原型含大量内联 SVG 与 CSS 自定义属性，手抄的错误是视觉性的，
 * 编译能过但肉眼难发现。要改设计请改原型后重新转换，不要直接编辑本文件的标签。
 *
 * 标签里 <i></i> 这类空元素没有改写成自闭合形式（lint 会有 self-closing 提示）。
 * 这是刻意的：保持与原型逐字对应，重新转换时才不会产生无意义的 diff。
 */

export function WxFab() {
  return (
    <>
      {/* ============================================================
           悬浮微信入口
           ★ 换成真实二维码：把 .wx-qr 里的占位块整体替换成
             <img src="wechat-qr.png" alt="企业微信二维码"/>
             图片建议 400x400 以上的方图，和 index.html 放同一目录。
           ============================================================ */}
      <div className="wx-fab" id="wxFab" style={{ display: 'none' }} hidden>
        <div className="wx-card" id="wxCard" role="dialog" aria-label="微信联系方式">
          <div className="wx-qr">
            <span className="todo">待填<br />企业微信二维码</span>
          </div>
          <p className="wx-cap">微信扫码联系我们</p>
          <p className="wx-sub">装不上包教包会</p>
        </div>
        <button className="wx-btn" id="wxBtn" type="button" aria-expanded="false" aria-controls="wxCard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.5 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-5.3A7.5 7.5 0 1 1 20.5 11.5Z" />
          </svg>
          <span className="wx-open">微信咨询</span>
          <span className="wx-close">收起</span>
        </button>
      </div>
    </>
  )
}

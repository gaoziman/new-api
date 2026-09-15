/*
 * 本区块的结构与文案来自客户原型，设计未改动。
 * JSX 由 scripts/html-to-jsx.cjs 从 galaxis-web 的 Astro 组件机械转换而来，
 * 不是手抄——原型含大量内联 SVG 与 CSS 自定义属性，手抄的错误是视觉性的，
 * 编译能过但肉眼难发现。要改设计请改原型后重新转换，不要直接编辑本文件的标签。
 *
 * 标签里 <i></i> 这类空元素没有改写成自闭合形式（lint 会有 self-closing 提示）。
 * 这是刻意的：保持与原型逐字对应，重新转换时才不会产生无意义的 diff。
 */

export function SvgDefs() {
  return (
    <>
      {/* ============================================================
           BRAND MARK SLOT · 官方品牌标记插槽
           现在里面是临时的中性占位图形，不是各家的官方标识。
           ★ 替换方法：从官方品牌页下载 SVG，把里面的 <path> 整段
             复制进对应 <symbol>，viewBox 统一改成 0 0 24 24 即可。
             颜色写死在 fill 里，不要用 currentColor（品牌规范通常
             要求保持原色，不得改色）。
             · Claude / Anthropic → anthropic.com 新闻room 媒体资源
             · OpenAI / Codex     → openai.com/brand
           ============================================================ */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }} aria-hidden="true" focusable="false">
        <defs>
          <symbol id="m-claude" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M12 6.5v11M6.9 9.2l10.2 5.6M17.1 9.2 6.9 14.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </symbol>
          <symbol id="m-openai" viewBox="0 0 24 24">
            <path d="M12 3.6 19.4 8v8L12 20.4 4.6 16V8z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
          </symbol>
        </defs>
      </svg>

      <div className="scroll-progress" aria-hidden="true"></div>

      {/* ============ 导航 ============ */}
    </>
  )
}

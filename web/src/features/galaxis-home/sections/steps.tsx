/*
 * 本区块的结构与文案来自客户原型，设计未改动。
 * JSX 由 scripts/html-to-jsx.cjs 从 galaxis-web 的 Astro 组件机械转换而来，
 * 不是手抄——原型含大量内联 SVG 与 CSS 自定义属性，手抄的错误是视觉性的，
 * 编译能过但肉眼难发现。要改设计请改原型后重新转换，不要直接编辑本文件的标签。
 *
 * 标签里 <i></i> 这类空元素没有改写成自闭合形式（lint 会有 self-closing 提示）。
 * 这是刻意的：保持与原型逐字对应，重新转换时才不会产生无意义的 diff。
 */

export function Steps() {
  return (
    <>
      {/* FIG.03 三步接入 */}
            <div className="hrule" aria-hidden="true">
              <i className="node node-l"></i><i className="node node-r"></i>
              <span className="fig">FIG.<b>03</b>&nbsp;&nbsp;ROUTE — 三步就能开始用</span>
            </div>
            <div className="route-zone" id="route">
              <div className="route">
                <div className="stop lit reveal">
                  <div className="stop-dot">1</div>
                  <h3>下载安装</h3>
                  <p>选你的电脑系统，下载后双击安装。Mac 如果提示「无法打开」，去「系统设置 → 隐私与安全性」点一下允许就好。</p>
                </div>
                <div className="stop reveal">
                  <div className="stop-dot">2</div>
                  <h3>登录账号</h3>
                  <p>用手机号或邮箱注册一个 <code>GalaxisRouter</code> 账号，在客户端里登录。剩下的配置客户端会自动完成，你不用复制粘贴任何东西。</p>
                </div>
                <div className="stop reveal">
                  <div className="stop-dot">3</div>
                  <h3>选工具，点启动</h3>
                  <p>在客户端里挑 Claude Code 或 Codex，点「启动」。状态栏亮起星标就代表通了，可以开始干活了。</p>
                </div>
              </div>
            </div>
    </>
  )
}

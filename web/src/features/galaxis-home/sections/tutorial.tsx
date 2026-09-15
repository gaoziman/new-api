/*
 * 本区块的结构与文案来自客户原型，设计未改动。
 * JSX 由 scripts/html-to-jsx.cjs 从 galaxis-web 的 Astro 组件机械转换而来，
 * 不是手抄——原型含大量内联 SVG 与 CSS 自定义属性，手抄的错误是视觉性的，
 * 编译能过但肉眼难发现。要改设计请改原型后重新转换，不要直接编辑本文件的标签。
 *
 * 唯一的手工改动：给场次切换的 <button> 补了 type="button"。
 * 原型里没写，HTML 的默认值是 submit——这几个按钮当前不在表单内所以没出事，
 * 但将来一旦被包进 form 就会意外提交。
 *
 * 标签里 <i></i> 这类空元素没有改写成自闭合形式（lint 会有 self-closing 提示）。
 * 这是刻意的：保持与原型逐字对应，重新转换时才不会产生无意义的 diff。
 */

export function Tutorial() {
  return (
    <>
      {/* FIG.01 视频教程 */}
            <div className="hrule" aria-hidden="true">
              <i className="node node-l"></i><i className="node node-r"></i>
              <span className="fig">FIG.<b>01</b>&nbsp;&nbsp;TUTORIAL — 手把手视频教程</span>
            </div>
            <div className="stage" id="tutorial">
              <div className="cinema" id="cinema">
                {/* 灯箱标牌 */}
                <div className="marquee">
                  <div className="marquee-bulbs" aria-hidden="true"><i className="bulb" style={{ animationDelay: '0.00s' }}></i><i className="bulb" style={{ animationDelay: '0.11s' }}></i><i className="bulb" style={{ animationDelay: '0.22s' }}></i><i className="bulb" style={{ animationDelay: '0.33s' }}></i><i className="bulb" style={{ animationDelay: '0.44s' }}></i><i className="bulb" style={{ animationDelay: '0.55s' }}></i><i className="bulb" style={{ animationDelay: '0.66s' }}></i><i className="bulb" style={{ animationDelay: '0.77s' }}></i><i className="bulb" style={{ animationDelay: '0.88s' }}></i><i className="bulb" style={{ animationDelay: '0.99s' }}></i><i className="bulb" style={{ animationDelay: '1.10s' }}></i><i className="bulb" style={{ animationDelay: '1.21s' }}></i><i className="bulb" style={{ animationDelay: '1.32s' }}></i><i className="bulb" style={{ animationDelay: '1.43s' }}></i><i className="bulb" style={{ animationDelay: '1.54s' }}></i><i className="bulb" style={{ animationDelay: '1.65s' }}></i><i className="bulb" style={{ animationDelay: '1.76s' }}></i></div>
                  <div className="marquee-text">NOW SHOWING&nbsp;&nbsp;·&nbsp;&nbsp;<b>GALAXISROUTER</b></div>
                  <div className="marquee-sub">OpenAI 官方客户端，登录就能用</div>
                </div>

                {/* 今日排片：三个场次切换 */}
                <div className="showtimes" role="tablist" aria-label="选择要播放的教程">
                  <button type="button" className="showtime is-on" role="tab" aria-selected="true" data-reel="0" data-sub="OpenAI 官方客户端，登录就能用">
                    <i className="st-no">01</i>
                    <span className="st-name">Codex 客户端</span>
                    <span className="st-time">03:40</span>
                  </button>
                  <button type="button" className="showtime" role="tab" aria-selected="false" data-reel="1" data-sub="让 Claude 在终端里帮你写代码、改 bug">
                    <i className="st-no">02</i>
                    <span className="st-name">Claude Code 命令行</span>
                    <span className="st-time">04:20</span>
                  </button>
                  <button type="button" className="showtime" role="tab" aria-selected="false" data-reel="2" data-sub="像微信一样的聊天窗口，不懂代码也能用">
                    <i className="st-no">03</i>
                    <span className="st-name">Claude 客户端</span>
                    <span className="st-time">03:10</span>
                  </button>
                </div>

                {/* 放映厅 */}
                <div className="hall">
                  <div className="beam" aria-hidden="true"></div>
                  <span className="mote" style={{ left: '31%', bottom: '12%', animationDuration: '9s', animationDelay: '0s' }}></span><span className="mote" style={{ left: '44%', bottom: '6%', animationDuration: '11s', animationDelay: '1.6s' }}></span><span className="mote" style={{ left: '57%', bottom: '16%', animationDuration: '10s', animationDelay: '3.1s' }}></span><span className="mote" style={{ left: '66%', bottom: '9%', animationDuration: '12s', animationDelay: '4.4s' }}></span><span className="mote" style={{ left: '38%', bottom: '22%', animationDuration: '9.5s', animationDelay: '2.2s' }}></span><span className="mote" style={{ left: '52%', bottom: '28%', animationDuration: '13s', animationDelay: '5.5s' }}></span><span className="mote" style={{ left: '61%', bottom: '20%', animationDuration: '10.5s', animationDelay: '6.8s' }}></span>
                  <div className="screen-frame">
                    <div className="video-slot">
                      {/* ★ 接入视频：把每个 .reel 里的 .video-ph 换成
                           <video src="01.mp4" controls poster="01.jpg"></video>
                           或 B 站 / YouTube 的 iframe。三卷各放各的。 */}
                      <div className="reel is-on" data-reel="0">
                        <button className="video-ph" type="button" aria-label="播放：Codex 客户端">
                          <span className="video-ph-play" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </span>
                          <span className="video-ph-text">Codex 客户端 · 即将上线</span>
                          <span className="video-ph-sub">REC 03:40 / 装好登录，直接开聊</span>
                        </button>
                      </div>
                      <div className="reel" data-reel="1">
                        <button className="video-ph" type="button" aria-label="播放：Claude Code 命令行">
                          <span className="video-ph-play" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </span>
                          <span className="video-ph-text">Claude Code 命令行 · 即将上线</span>
                          <span className="video-ph-sub">REC 04:20 / 写代码、改 bug、整理文件</span>
                        </button>
                      </div>
                      <div className="reel" data-reel="2">
                        <button className="video-ph" type="button" aria-label="播放：Claude 客户端">
                          <span className="video-ph-play" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </span>
                          <span className="video-ph-text">Claude 客户端 · 即将上线</span>
                          <span className="video-ph-sub">REC 03:10 / 写文案、读文档、做表格</span>
                        </button>
                      </div>
                    </div>
                    {/* 幕布 */}
                    <div className="curtain curtain-l" aria-hidden="true"></div>
                    <div className="curtain curtain-r" aria-hidden="true"></div>
                  </div>
                  <svg className="seats" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><g fill="#080706" opacity="0.85"><rect x="0.0" y="26" width="7.6" height="30" rx="3.4" /><rect x="9.6" y="26" width="7.6" height="30" rx="3.4" /><rect x="19.2" y="26" width="7.6" height="30" rx="3.4" /><rect x="28.8" y="26" width="7.6" height="30" rx="3.4" /><rect x="38.4" y="26" width="7.6" height="30" rx="3.4" /><rect x="48.0" y="26" width="7.6" height="30" rx="3.4" /><rect x="57.6" y="26" width="7.6" height="30" rx="3.4" /><rect x="67.2" y="26" width="7.6" height="30" rx="3.4" /><rect x="76.8" y="26" width="7.6" height="30" rx="3.4" /><rect x="86.4" y="26" width="7.6" height="30" rx="3.4" /><rect x="96.0" y="26" width="7.6" height="30" rx="3.4" /></g><g fill="#080706" opacity="1"><rect x="4.5" y="4" width="7.6" height="34" rx="3.4" /><rect x="14.1" y="4" width="7.6" height="34" rx="3.4" /><rect x="23.7" y="4" width="7.6" height="34" rx="3.4" /><rect x="33.3" y="4" width="7.6" height="34" rx="3.4" /><rect x="42.9" y="4" width="7.6" height="34" rx="3.4" /><rect x="52.5" y="4" width="7.6" height="34" rx="3.4" /><rect x="62.1" y="4" width="7.6" height="34" rx="3.4" /><rect x="71.7" y="4" width="7.6" height="34" rx="3.4" /><rect x="81.3" y="4" width="7.6" height="34" rx="3.4" /><rect x="90.9" y="4" width="7.6" height="34" rx="3.4" /></g></svg>
                </div>
              </div>

              {/* 票根 */}
              <p className="ticket reveal">
                <span className="ticket-stub">ADMIT ONE<b>03:00</b>GALAXIS</span>
                <span className="ticket-body">看完这段，你就能自己把 <b>Claude Code</b> 和 <b>Codex</b> 装好跑起来。不用记命令，跟着点就行。</span>
              </p>
            </div>

            {/* 特性三格 */}
            <div className="hrule" aria-hidden="true"><i className="node node-l"></i><i className="node node-r"></i></div>
            <div className="feat-row">
              <div className="feat-cell reveal">
                <h3><b>3 步</b> 就能用上</h3>
                <p>全程点鼠标，不用敲命令</p>
              </div>
              <div className="feat-cell reveal">
                <h3><b>2 大</b> 官方工具</h3>
                <p>Claude Code &amp; Codex 都支持</p>
              </div>
              <div className="feat-cell reveal">
                <h3><b>0</b> 配置门槛</h3>
                <p>装完即用，无需手动配置</p>
              </div>
            </div>
    </>
  )
}

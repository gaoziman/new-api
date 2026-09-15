/*
 * 本区块的结构与文案来自客户原型，设计未改动。
 * JSX 由 scripts/html-to-jsx.cjs 从 galaxis-web 的 Astro 组件机械转换而来，
 * 不是手抄——原型含大量内联 SVG 与 CSS 自定义属性，手抄的错误是视觉性的，
 * 编译能过但肉眼难发现。要改设计请改原型后重新转换，不要直接编辑本文件的标签。
 *
 * 标签里 <i></i> 这类空元素没有改写成自闭合形式（lint 会有 self-closing 提示）。
 * 这是刻意的：保持与原型逐字对应，重新转换时才不会产生无意义的 diff。
 */

export function Business() {
  return (
    <>
      {/* FIG.05 企业采购 */}
            <div className="hrule" aria-hidden="true">
              <i className="node node-l"></i><i className="node node-r"></i>
              <span className="fig">FIG.<b>05</b>&nbsp;&nbsp;BUSINESS — 企业采购</span>
            </div>
            <div className="biz-zone" id="business">
              <div className="dl-head reveal">
                <h2>公司用，能开票、能对公</h2>
                <p>报销走正规流程，财务那边好交代</p>
              </div>
              <div className="biz-grid reveal">
                <div className="biz-card">
                  <div className="biz-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 3h14v18l-2.3-1.6L14.4 21 12 19.4 9.6 21l-2.3-1.6L5 21V3Z" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
                    </svg>
                  </div>
                  <h3>提供增值税发票</h3>
                  <p>普票、专票都能开。充值后在客户端提交开票申请，填好抬头和税号，1–3 个工作日开出，电子发票直接发到你邮箱。</p>
                  <ul className="biz-list">
                    <li>增值税普通发票 / 专用发票</li>
                    <li>电子发票，可直接打印报销</li>
                    <li>发票金额按实际充值金额开具</li>
                  </ul>
                </div>
                <div className="biz-card">
                  <div className="biz-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8" /><path d="M3 21h18" />
                    </svg>
                  </div>
                  <h3>支持对公账户转账</h3>
                  <p>公对公银行转账，走公司账户付款。需要合同、报价单、付款凭证的都能提供，到账后按金额充进你的账户。</p>
                  <ul className="biz-list">
                    <li>对公银行转账，支持大额付款</li>
                    <li>可提供采购合同与报价单</li>
                    <li>年度框架协议可单独谈</li>
                  </ul>
                </div>
              </div>
              <p className="biz-note reveal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.2" />
                </svg>
                <span>需要开票或走对公流程，直接<b>联系我们</b>，把公司抬头和需求发过来就行，我们会把合同和收款信息一并给你。</span>
              </p>
            </div>
    </>
  )
}

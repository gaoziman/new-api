/*
 * 本区块的结构与文案来自客户原型，设计未改动。
 * JSX 由 scripts/html-to-jsx.cjs 从 galaxis-web 的 Astro 组件机械转换而来，
 * 不是手抄——原型含大量内联 SVG 与 CSS 自定义属性，手抄的错误是视觉性的，
 * 编译能过但肉眼难发现。要改设计请改原型后重新转换，不要直接编辑本文件的标签。
 *
 * 标签里 <i></i> 这类空元素没有改写成自闭合形式（lint 会有 self-closing 提示）。
 * 这是刻意的：保持与原型逐字对应，重新转换时才不会产生无意义的 diff。
 */

export function Faq() {
  return (
    <>
      {/* FIG.06 常见问题 */}
            <div className="hrule" aria-hidden="true">
              <i className="node node-l"></i><i className="node node-r"></i>
              <span className="fig">FIG.<b>06</b>&nbsp;&nbsp;FAQ — 新手最常问的</span>
            </div>
            <div className="faq-zone" id="faq">
              <div className="faq-list reveal">
                <details className="faq-item">
                  <summary>我完全不懂技术，真的能用吗？</summary>
                  <div className="faq-a">能。整个过程只有下载、登录、点启动三步，全程点鼠标，不需要输入任何命令。如果你还是不放心，上面那个视频教程是手把手录的，跟着点一遍就会了。</div>
                </details>
                <details className="faq-item">
                  <summary>需要自己去注册 Claude 或 OpenAI 账号吗？</summary>
                  <div className="faq-a">不需要。你只要注册一个 GalaxisRouter 账号，客户端会自动完成全部接入配置，你不用准备任何海外账号，也不用手动填写任何参数。</div>
                </details>
                <details className="faq-item">
                  <summary>怎么收费？会不会不知不觉扣很多钱？</summary>
                  <div className="faq-a">按实际用量计费，没有月费也没有订阅。账户是预充值的，余额用完会自动停下来，不会从你的银行卡自动扣款。用了多少在客户端里随时能看到。</div>
                </details>
                <details className="faq-item">
                  <summary>公司报销怎么办？能开发票吗？</summary>
                  <div className="faq-a">能。我们提供增值税普通发票和专用发票，也支持对公账户转账，需要采购合同和报价单都可以出。在客户端里提交开票申请，或者直接联系我们，把抬头和税号发过来就行。</div>
                </details>
                <details className="faq-item">
                  <summary>装的时候卡住了，找谁帮忙？</summary>
                  <div className="faq-a">客户端里有「反馈」按钮，点了直接发给我们；也可以加官方交流群，工作时间内都有人在。装不上不收钱，别担心。</div>
                </details>
              </div>
            </div>
    </>
  )
}

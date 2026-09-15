/*
 * Hero 区。结构与文案来自客户原型，改动三处，都是「从独立静态页搬进单页应用」
 * 必须做的适配：
 *
 * 1. 版本号与两个下载链接改为运行期从发布清单取（见 use-release.ts）。
 *    构建期烘死会过期——后端二进制的发布节奏远慢于客户端版本。
 * 2. 「推荐」样式与按钮顺序改由平台状态驱动，不再由脚本在加载后改 DOM。
 *    原做法有顺序依赖，且 React 不知道 DOM 被外部改过（见 use-platform.ts）。
 * 3. 「请在电脑上打开」的提示同样改为状态控制。
 *
 * data-os 仍然保留：它是这两个按钮的语义标记，排查时能一眼对上。
 */
import { useRelease } from '../use-release'
import { usePlatform } from '../use-platform'

export function Hero() {
  const release = useRelease()
  const platform = usePlatform()

  const macCta = (
    <a href={release.macUrl} className={`cta-dl${platform === 'mac' ? ' is-rec' : ''}`} data-os="mac">
      <span className="dl-rec">免安装配置</span>
      <svg className="dl-os-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.9c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.7-3.9zM14.4 5.6c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" fill="currentColor" /></svg>
      下载 macOS 版
      <svg className="dl-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
    </a>
  )

  const winCta = (
    <a href={release.windowsUrl} className={`cta-dl${platform === 'windows' ? ' is-rec' : ''}`} data-os="windows">
      <span className="dl-rec">免安装配置</span>
      <svg className="dl-os-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5 10.5 4.4v7.1H3V5.5zm0 13 7.5 1.1v-7H3v5.9zm8.5 1.2L21 21V12.6h-9.5v7.1zm0-15.4v7.2H21V3l-9.5 1.3z" fill="currentColor" /></svg>
      下载 Windows 版
      <svg className="dl-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
    </a>
  )

  // 命中当前系统的按钮排在前面
  const ctas =
    platform === 'mac' ? (
      <>
        {macCta}
        {winCta}
      </>
    ) : (
      <>
        {winCta}
        {macCta}
      </>
    )

  return (
    <section className="hero">
                <div className="enter" style={{ '--d': '0ms' } as React.CSSProperties}>
            <div className="orbit">
            <span className="gx gx-core" aria-hidden="true"></span>
            <span className="gx gx-arms" aria-hidden="true"><span className="gx-arm" style={{ '--r': '0deg' } as React.CSSProperties}></span><span className="gx-arm" style={{ '--r': '60deg' } as React.CSSProperties}></span><span className="gx-arm" style={{ '--r': '120deg' } as React.CSSProperties}></span></span>
            <span className="gx gx-dust" aria-hidden="true"><span className="gd" style={{ '--x': '39.1%', '--y': '71.9%', '--s': '2.1px', '--t': '3.5s', '--d': '2.7s', '--gc': '#7c3aed' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '9.4%', '--y': '26.7%', '--s': '1.6px', '--t': '3.6s', '--d': '2.1s', '--gc': '#0f766e' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '77.4%', '--y': '67.5%', '--s': '2.4px', '--t': '3.7s', '--d': '1.1s', '--gc': '#c2410c' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '21.9%', '--y': '35.2%', '--s': '2.6px', '--t': '3.4s', '--d': '4.3s', '--gc': '#0369a1' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '18.6%', '--y': '67.5%', '--s': '2.0px', '--t': '5.6s', '--d': '3.4s', '--gc': '#a16207' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '16.1%', '--y': '30.9%', '--s': '1.8px', '--t': '5.6s', '--d': '0.3s', '--gc': '#c2410c' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '24.6%', '--y': '26.4%', '--s': '2.0px', '--t': '6.5s', '--d': '2.3s', '--gc': '#8a8580' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '32.4%', '--y': '70.9%', '--s': '1.5px', '--t': '6.6s', '--d': '0.4s', '--gc': '#0369a1' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '4.8%', '--y': '42.8%', '--s': '2.2px', '--t': '4.4s', '--d': '4.9s', '--gc': '#a16207' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '25.2%', '--y': '48.1%', '--s': '1.7px', '--t': '7.2s', '--d': '2.1s', '--gc': '#a16207' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '53.4%', '--y': '13.3%', '--s': '2.4px', '--t': '4.5s', '--d': '3.5s', '--gc': '#8a8580' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '20.7%', '--y': '33.9%', '--s': '2.4px', '--t': '7.3s', '--d': '2.4s', '--gc': '#a16207' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '87.8%', '--y': '65.1%', '--s': '2.1px', '--t': '7.5s', '--d': '4.1s', '--gc': '#0369a1' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '40.4%', '--y': '4.8%', '--s': '1.8px', '--t': '7.2s', '--d': '1.8s', '--gc': '#a16207' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '23.6%', '--y': '51.0%', '--s': '1.7px', '--t': '6.4s', '--d': '2.0s', '--gc': '#8a8580' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '79.1%', '--y': '66.1%', '--s': '2.0px', '--t': '7.0s', '--d': '4.1s', '--gc': '#0369a1' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '36.7%', '--y': '2.7%', '--s': '2.2px', '--t': '4.8s', '--d': '1.2s', '--gc': '#a16207' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '62.0%', '--y': '74.0%', '--s': '1.6px', '--t': '5.3s', '--d': '2.9s', '--gc': '#0369a1' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '45.2%', '--y': '73.8%', '--s': '2.0px', '--t': '5.8s', '--d': '1.6s', '--gc': '#4f46e5' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '37.1%', '--y': '17.2%', '--s': '2.1px', '--t': '6.1s', '--d': '0.3s', '--gc': '#be123c' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '24.6%', '--y': '68.9%', '--s': '1.9px', '--t': '4.9s', '--d': '1.0s', '--gc': '#0f766e' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '28.4%', '--y': '58.5%', '--s': '2.1px', '--t': '3.6s', '--d': '2.8s', '--gc': '#a16207' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '86.2%', '--y': '38.0%', '--s': '1.4px', '--t': '4.1s', '--d': '1.9s', '--gc': '#0369a1' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '86.3%', '--y': '39.6%', '--s': '1.9px', '--t': '3.7s', '--d': '2.4s', '--gc': '#8a8580' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '21.0%', '--y': '53.6%', '--s': '1.5px', '--t': '6.4s', '--d': '3.7s', '--gc': '#8a8580' } as React.CSSProperties}></span><span className="gd" style={{ '--x': '61.8%', '--y': '28.2%', '--s': '1.3px', '--t': '7.3s', '--d': '2.6s', '--gc': '#4f46e5' } as React.CSSProperties}></span></span>
            <span className="gx-comet" aria-hidden="true"></span>
            <span className="orbit-track t1" aria-hidden="true"></span>
            <span className="orbit-track t2" aria-hidden="true"></span>
            <span className="orbit-track t3" aria-hidden="true"></span>
            <div className="orbit-spin s3" aria-hidden="true"><span className="orb" style={{ '--a': '12deg', '--c': 'var(--ink-2)' } as React.CSSProperties}><span className="orb-in"><span className="orb-cell"><span className="orb-chip"><b>Claude</b></span><i className="orb-moon"></i></span></span></span><span className="orb" style={{ '--a': '132deg', '--c': 'var(--ink-2)' } as React.CSSProperties}><span className="orb-in"><span className="orb-cell"><span className="orb-chip"><b>Claude</b><s>Code</s></span><i className="orb-moon"></i></span></span></span><span className="orb" style={{ '--a': '252deg', '--c': 'var(--ink-2)' } as React.CSSProperties}><span className="orb-in"><span className="orb-cell"><span className="orb-chip"><b>DeepSeek</b></span><i className="orb-moon"></i></span></span></span></div>
            <div className="orbit-spin s2" aria-hidden="true"><span className="orb" style={{ '--a': '66deg', '--c': 'var(--ink-2)' } as React.CSSProperties}><span className="orb-in"><span className="orb-cell"><span className="orb-chip"><b>GPT</b></span><i className="orb-moon"></i></span></span></span><span className="orb" style={{ '--a': '214deg', '--c': 'var(--ink-2)' } as React.CSSProperties}><span className="orb-in"><span className="orb-cell"><span className="orb-chip"><b>Codex</b></span><i className="orb-moon"></i></span></span></span></div>
            <div className="orbit-spin s1" aria-hidden="true"><span className="orb" style={{ '--a': '160deg', '--c': 'var(--ink-2)' } as React.CSSProperties}><span className="orb-in"><span className="orb-cell"><span className="orb-chip"><b>GLM</b></span><i className="orb-moon"></i></span></span></span><span className="orb" style={{ '--a': '330deg', '--c': 'var(--ink-2)' } as React.CSSProperties}><span className="orb-in"><span className="orb-cell"><span className="orb-chip"><b>Kimi</b></span><i className="orb-moon"></i></span></span></span></div>
            <span className="orbit-cap"><i></i>MODEL ROUTING</span>
            <div className="hero-badge">
              <span className="badge-tag">GALAXIS-01</span>
              <svg className="badge-logo" viewBox="0 0 64 64" role="img" aria-label="Galaxis"> <defs> <radialGradient id="gl-hero-arm" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="28"> <stop offset="0.06" stopColor="#FFE6B0" stopOpacity="0.85" /> <stop offset="0.20" stopColor="#F78BDA" /> <stop offset="0.42" stopColor="#A96DF2" /> <stop offset="0.70" stopColor="#6E72EA" stopOpacity="1" /> <stop offset="1.00" stopColor="#4C7CF2" stopOpacity="1" /> </radialGradient> <radialGradient id="gl-hero-core" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="11"> <stop offset="0" stopColor="#FFFFFF" /> <stop offset="0.30" stopColor="#FFF4D2" /> <stop offset="0.62" stopColor="#FFCE78" stopOpacity="0.55" /> <stop offset="1" stopColor="#FFB25A" stopOpacity="0" /> </radialGradient> </defs> <g> <path d="M29.01,35.50L28.40,34.27L27.88,33.51L27.45,32.79L27.11,32.06L26.84,31.32L26.64,30.55L26.52,29.76L26.47,28.96L26.50,28.14L26.61,27.31L26.80,26.47L27.08,25.64L27.43,24.82L27.86,24.02L28.38,23.23L28.96,22.48L29.62,21.77L30.36,21.09L31.15,20.47L32.01,19.90L32.93,19.38L33.89,18.92L34.91,18.53L35.97,18.20L37.06,17.95L38.19,17.76L39.34,17.65L40.52,17.61L41.71,17.65L42.91,17.76L44.12,17.94L45.33,18.20L46.54,18.53L47.75,18.94L48.94,19.41L50.12,19.95L51.29,20.57L52.44,21.24L53.57,21.98L54.68,22.77L55.77,23.61L56.87,24.49L58.15,25.29L58.15,25.29L57.71,23.82L56.98,22.54L56.14,21.32L55.22,20.16L54.21,19.06L53.14,18.03L51.99,17.05L50.79,16.15L49.52,15.33L48.20,14.58L46.83,13.92L45.41,13.35L43.96,12.87L42.47,12.49L40.95,12.22L39.41,12.06L37.85,12.01L36.30,12.07L34.75,12.26L33.21,12.57L31.70,13.00L30.23,13.55L28.81,14.24L27.45,15.04L26.16,15.97L24.97,17.02L23.89,18.17L22.93,19.43L22.10,20.78L21.42,22.21L20.91,23.71L20.58,25.25L20.44,26.81L20.50,28.37L20.77,29.90L21.24,31.36L21.93,32.71L22.81,33.92L23.86,34.93L25.06,35.70L26.37,36.17L27.71,36.25L29.01,35.50Z" fill="url(#gl-hero-arm)" /> <path d="M28.50,29.01L29.73,28.40L30.49,27.88L31.21,27.45L31.94,27.11L32.68,26.84L33.45,26.64L34.24,26.52L35.04,26.47L35.86,26.50L36.69,26.61L37.53,26.80L38.36,27.08L39.18,27.43L39.98,27.86L40.77,28.38L41.52,28.96L42.23,29.62L42.91,30.36L43.53,31.15L44.10,32.01L44.62,32.93L45.08,33.89L45.47,34.91L45.80,35.97L46.05,37.06L46.24,38.19L46.35,39.34L46.39,40.52L46.35,41.71L46.24,42.91L46.06,44.12L45.80,45.33L45.47,46.54L45.06,47.75L44.59,48.94L44.05,50.12L43.43,51.29L42.76,52.44L42.02,53.57L41.23,54.68L40.39,55.77L39.51,56.87L38.71,58.15L38.71,58.15L40.18,57.71L41.46,56.98L42.68,56.14L43.84,55.22L44.94,54.21L45.97,53.14L46.95,51.99L47.85,50.79L48.67,49.52L49.42,48.20L50.08,46.83L50.65,45.41L51.13,43.96L51.51,42.47L51.78,40.95L51.94,39.41L51.99,37.85L51.93,36.30L51.74,34.75L51.43,33.21L51.00,31.70L50.45,30.23L49.76,28.81L48.96,27.45L48.03,26.16L46.98,24.97L45.83,23.89L44.57,22.93L43.22,22.10L41.79,21.42L40.29,20.91L38.75,20.58L37.19,20.44L35.63,20.50L34.10,20.77L32.64,21.24L31.29,21.93L30.08,22.81L29.07,23.86L28.30,25.06L27.83,26.37L27.75,27.71L28.50,29.01Z" fill="url(#gl-hero-arm)" /> <path d="M34.99,28.50L35.60,29.73L36.12,30.49L36.55,31.21L36.89,31.94L37.16,32.68L37.36,33.45L37.48,34.24L37.53,35.04L37.50,35.86L37.39,36.69L37.20,37.53L36.92,38.36L36.57,39.18L36.14,39.98L35.62,40.77L35.04,41.52L34.38,42.23L33.64,42.91L32.85,43.53L31.99,44.10L31.07,44.62L30.11,45.08L29.09,45.47L28.03,45.80L26.94,46.05L25.81,46.24L24.66,46.35L23.48,46.39L22.29,46.35L21.09,46.24L19.88,46.06L18.67,45.80L17.46,45.47L16.25,45.06L15.06,44.59L13.88,44.05L12.71,43.43L11.56,42.76L10.43,42.02L9.32,41.23L8.23,40.39L7.13,39.51L5.85,38.71L5.85,38.71L6.29,40.18L7.02,41.46L7.86,42.68L8.78,43.84L9.79,44.94L10.86,45.97L12.01,46.95L13.21,47.85L14.48,48.67L15.80,49.42L17.17,50.08L18.59,50.65L20.04,51.13L21.53,51.51L23.05,51.78L24.59,51.94L26.15,51.99L27.70,51.93L29.25,51.74L30.79,51.43L32.30,51.00L33.77,50.45L35.19,49.76L36.55,48.96L37.84,48.03L39.03,46.98L40.11,45.83L41.07,44.57L41.90,43.22L42.58,41.79L43.09,40.29L43.42,38.75L43.56,37.19L43.50,35.63L43.23,34.10L42.76,32.64L42.07,31.29L41.19,30.08L40.14,29.07L38.94,28.30L37.63,27.83L36.29,27.75L34.99,28.50Z" fill="url(#gl-hero-arm)" /> <path d="M35.50,34.99L34.27,35.60L33.51,36.12L32.79,36.55L32.06,36.89L31.32,37.16L30.55,37.36L29.76,37.48L28.96,37.53L28.14,37.50L27.31,37.39L26.47,37.20L25.64,36.92L24.82,36.57L24.02,36.14L23.23,35.62L22.48,35.04L21.77,34.38L21.09,33.64L20.47,32.85L19.90,31.99L19.38,31.07L18.92,30.11L18.53,29.09L18.20,28.03L17.95,26.94L17.76,25.81L17.65,24.66L17.61,23.48L17.65,22.29L17.76,21.09L17.94,19.88L18.20,18.67L18.53,17.46L18.94,16.25L19.41,15.06L19.95,13.88L20.57,12.71L21.24,11.56L21.98,10.43L22.77,9.32L23.61,8.23L24.49,7.13L25.29,5.85L25.29,5.85L23.82,6.29L22.54,7.02L21.32,7.86L20.16,8.78L19.06,9.79L18.03,10.86L17.05,12.01L16.15,13.21L15.33,14.48L14.58,15.80L13.92,17.17L13.35,18.59L12.87,20.04L12.49,21.53L12.22,23.05L12.06,24.59L12.01,26.15L12.07,27.70L12.26,29.25L12.57,30.79L13.00,32.30L13.55,33.77L14.24,35.19L15.04,36.55L15.97,37.84L17.02,39.03L18.17,40.11L19.43,41.07L20.78,41.90L22.21,42.58L23.71,43.09L25.25,43.42L26.81,43.56L28.37,43.50L29.90,43.23L31.36,42.76L32.71,42.07L33.92,41.19L34.93,40.14L35.70,38.94L36.17,37.63L36.25,36.29L35.50,34.99Z" fill="url(#gl-hero-arm)" /> </g> <circle cx="32" cy="32" r="11" fill="url(#gl-hero-core)" /> <circle cx="32" cy="32" r="2.6" fill="#FFFDF4" /> </svg>
            </div>
            </div>
          </div>
          <p className="slogan enter" style={{ '--d': '60ms' } as React.CSSProperties}>
            <span className="slogan-l">一个 API，</span>
            <span className="slogan-r">调用全球 AI</span>
          </p>
          <h1 className="enter" style={{ '--d': '140ms' } as React.CSSProperties}><span className="hl">Claude Code</span> 和 <span className="hl">Codex</span>，小白也能一键开用</h1>
          <p className="sub enter" style={{ '--d': '190ms' } as React.CSSProperties}>无需海外账号，无需手动配置，即刻使用。</p>
          <div className="hero-ctas enter" style={{ '--d': '250ms' } as React.CSSProperties}>
            {ctas}
          </div>
          <p className="hero-ver enter" style={{ '--d': '270ms' } as React.CSSProperties}>
            当前版本 v{release.version}<span className="hv-sep">·</span>Windows 10/11 与 macOS 12+
          </p>
          <a className="cta-alt enter" style={{ '--d': '290ms' } as React.CSSProperties} href="#tutorial">不确定怎么装？先看视频教程 →</a>
          <p className="desktop-only-note" hidden={platform !== 'mobile'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            客户端仅支持 Windows / macOS，请在电脑上打开本页下载
          </p>
          <p className="ver-line enter" style={{ '--d': '320ms' } as React.CSSProperties}>
            <b>无需信用卡</b><i>|</i>无需海外账号<i>|</i>注册即送体验额度
          </p>
        </section>
  )
}

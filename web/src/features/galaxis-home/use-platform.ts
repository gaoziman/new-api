/*
 * 来访平台识别。
 *
 * 客户端只有 Windows 和 macOS 版，所以只区分这三类。
 *
 * 【为什么要有这个 hook】原型是用脚本在加载后改 DOM：给命中系统的按钮加类、
 * 把它挪到最前、再把页脚的通用下载链接改写成对应地址。在 React 里这么做有两个坑：
 *   1. 顺序依赖——页脚链接是从 Hero 按钮上复制 href 的，而 Hero 的地址来自
 *      异步取回的发布清单。脚本只在挂载时跑一次，拿到的是兜底版本，
 *      清单更新后页脚就停在旧版本上（官网那边正是靠「把两个脚本合并成一个」
 *      来保证顺序的，很脆）。
 *   2. React 不知道 DOM 被外部改过顺序，后续更新时容易和它打架。
 * 改成由状态驱动渲染，这两个问题都不存在。
 */
import { useEffect, useState } from 'react'

export type Platform = 'mac' | 'windows' | 'mobile'

function detect(): Platform {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod|Android/.test(ua)) return 'mobile'
  return /Macintosh|Mac OS X/.test(ua) ? 'mac' : 'windows'
}

export function usePlatform(): Platform {
  // 首屏先按 windows 渲染，挂载后立刻校正。
  // 不在初始值里直接调 detect()：服务端或测试环境没有 navigator。
  const [platform, setPlatform] = useState<Platform>('windows')
  useEffect(() => setPlatform(detect()), [])
  return platform
}

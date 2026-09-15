/*
 * 客户端发布信息。
 *
 * 【与 Astro 版的差别】官网那份是在构建期抓 latest.json 把版本号烘进 HTML，
 * 再由前端脚本在运行期二次校正。搬进 New API 之后构建期抓取没有意义——
 * 页面是随后端二进制一起发布的，而客户端版本更新频率远高于后端；
 * 烘进去的值必然过期（线上实测出现过官网停在 0.2.2、客户端已发 0.2.3）。
 * 所以这里只在运行期取，发版不必重新构建后端。
 *
 * 【为什么读得到】/codedock/ 由 Caddy 在同源路径下提供，不涉及跨域。
 *
 * 【为什么保留兜底版本】清单取不到时（网络异常、Caddy 配置变动）页面不能
 * 显示空版本号或坏链接。兜底值会过期，但过期的下载链接仍指向真实存在的包，
 * 比渲染出 undefined 要好。
 */
import { useEffect, useState } from 'react'

/** 发布目录。与 latest.json 中的 url 同源同路径。 */
const RELEASE_BASE = '/codedock'
const MANIFEST = `${RELEASE_BASE}/latest.json`

/**
 * 兜底版本：取不到清单时用。
 * 这个值会过期，属于预期内——它只在清单不可达时出现。
 */
const FALLBACK_VERSION = '0.2.4'

/** 语义化版本，形如 0.2.4 */
const VERSION_RE = /^\d+\.\d+\.\d+$/

export interface Release {
  version: string
  /** Windows 安装包直链 */
  windowsUrl: string
  /** macOS 安装包直链 */
  macUrl: string
  /** 是否取到了线上清单（false 表示用的是兜底值） */
  live: boolean
}

/**
 * 由版本号推导安装包地址。
 *
 * 不直接用 latest.json 里 platforms.*.url：那些是**更新器**用的产物
 * （macOS 是 .app.tar.gz），给用户下载要的是 .dmg / .exe。
 * 两者文件名规则一致，只差扩展名，所以按版本号拼。
 */
function urlsFor(version: string) {
  return {
    windowsUrl: `${RELEASE_BASE}/Galaxis_${version}_x64-setup.exe`,
    macUrl: `${RELEASE_BASE}/Galaxis_${version}_universal.dmg`,
  }
}

export function useRelease(): Release {
  const [version, setVersion] = useState(FALLBACK_VERSION)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    // 超时兜底：清单拿不到就继续用兜底版本，不能让页面一直等
    const timer = setTimeout(() => controller.abort(), 8000)

    async function load() {
      try {
        const res = await fetch(MANIFEST, { signal: controller.signal })
        if (!res.ok) return
        const json = (await res.json()) as { version?: unknown }
        if (cancelled) return
        const v = json?.version
        if (typeof v === 'string' && VERSION_RE.test(v)) {
          setVersion(v)
          setLive(true)
        }
      } catch {
        /* 取不到就沿用兜底版本，不报错、不清空 */
      } finally {
        clearTimeout(timer)
      }
    }

    void load()

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  return { version, live, ...urlsFor(version) }
}

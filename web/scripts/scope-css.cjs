/**
 * CSS 作用域化：把一份为独立页面写的样式表收进某个根类之下。
 *
 * 【为什么需要】首页原型样式表定义了 :root / html / body / a / button / main / *
 * 这些元素级选择器，以及 .nav / .brand / .stage / .node 这类极通用的类名。
 * 独立部署时没人跟它抢，但注入 New API 的单页应用后，样式表一旦加载就对
 * 整站生效——button{} 会重绘控制台里每一个按钮，:root 会改写全站 CSS 变量。
 * 单页应用换路由不卸载样式表，离开首页后污染依然在。
 *
 * 【做了什么】
 *   :root / html / body      → 合并到根类自身（变量与页面底色由包裹层承担）
 *   其余选择器                → 前缀根类
 *   @keyframes 名             → 加前缀，避免与上游同名动画互相覆盖
 *   @media / @supports        → 递归处理内部规则
 *
 * 【不做什么】不改任何声明值。唯一的例外是 animation/animation-name 里
 * 对被重命名 keyframes 的引用，不改就会指向不存在的动画。
 */
const fs = require('fs')

/** 需要合并进根类自身、而不是作为后代选择器的「全局」选择器。 */
const HOST = new Set([':root', 'html', 'body', 'html,body', 'body,html'])

/**
 * 把一段 CSS 切成顶层块。返回 [{type:'rule'|'at', prelude, body}|{type:'decl', text}]
 * 手写而不用正则整体匹配：CSS 的嵌套和字符串会让单条正则失效。
 */
function splitBlocks(css) {
  const out = []
  let i = 0
  let start = 0
  let depth = 0
  let quote = null
  let preludeEnd = -1

  while (i < css.length) {
    const ch = css[i]

    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      i++
      continue
    }
    // 注释整体跳过
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      if (end < 0) throw new Error('未闭合的 CSS 注释')
      i = end + 2
      continue
    }
    if (ch === '{') {
      if (depth === 0) preludeEnd = i
      depth++
      i++
      continue
    }
    if (ch === '}') {
      depth--
      if (depth === 0) {
        out.push({
          type: 'block',
          prelude: css.slice(start, preludeEnd).trim(),
          body: css.slice(preludeEnd + 1, i),
          raw: css.slice(start, i + 1),
        })
        start = i + 1
      }
      if (depth < 0) throw new Error('CSS 花括号不匹配（多余的 }）')
      i++
      continue
    }
    // 顶层的 @import / @charset 这类以分号结束的规则
    if (ch === ';' && depth === 0) {
      const text = css.slice(start, i + 1).trim()
      if (text) out.push({ type: 'statement', raw: text })
      start = i + 1
      i++
      continue
    }
    i++
  }
  if (depth !== 0) throw new Error('CSS 花括号不匹配（缺少 }）')
  const tail = css.slice(start).trim()
  if (tail) out.push({ type: 'statement', raw: tail })
  return out
}

/** 给单个选择器加上作用域前缀。 */
function scopeSelector(sel, root) {
  const s = sel.trim()
  if (!s) return s
  // 伪元素/伪类打头（如 ::selection、:focus-visible）→ 作为后代
  // 其余一律前缀为后代选择器
  return `${root} ${s}`
}

function scopeSelectorList(prelude, root) {
  return prelude
    .split(',')
    .map((s) => scopeSelector(s, root))
    .join(',\n')
}

/**
 * 把 prelude 拆成「前导注释」和「真正的选择器」。
 *
 * splitBlocks 扫描时跳过注释内容，但块的起点仍在注释之前，
 * 于是 `/* 说明 *​/ main {…}` 的 prelude 会连注释一起带上。
 * 若直接加前缀就成了 `.gx-home /* 说明 *​/ main`——前缀贴在注释上，
 * 真正的 main 反而没被限定，样式照样泄漏到全站。
 */
function splitPrelude(prelude) {
  let comments = ''
  let rest = prelude
  for (;;) {
    const trimmed = rest.trimStart()
    if (!trimmed.startsWith('/*')) break
    const end = trimmed.indexOf('*/')
    if (end < 0) break
    comments += trimmed.slice(0, end + 2) + '\n'
    rest = trimmed.slice(end + 2)
  }
  // 选择器中间也可能夹注释，一并去掉（注释不影响匹配）
  rest = rest.replace(/\/\*[\s\S]*?\*\//g, ' ')
  return { comments, selector: rest.trim() }
}

function processRules(css, root, kfPrefix, hostDecls) {
  const blocks = splitBlocks(css)
  const out = []

  for (const b of blocks) {
    if (b.type === 'statement') {
      out.push(b.raw)
      continue
    }

    const { comments, selector: prelude } = splitPrelude(b.prelude)
    if (comments) out.push(comments.trimEnd())
    if (!prelude) {
      // 只有注释、没有选择器：不可能出现，出现说明解析错了
      throw new Error(`解析出空选择器，原始 prelude: ${b.prelude.slice(0, 80)}`)
    }

    // @keyframes：重命名，避免与上游同名动画互相覆盖
    if (/^@(-\w+-)?keyframes\b/i.test(prelude)) {
      const renamed = prelude.replace(
        /^(@(?:-\w+-)?keyframes\s+)([\w-]+)/i,
        (_, head, name) => `${head}${kfPrefix}${name}`
      )
      out.push(`${renamed} {${b.body}}`)
      continue
    }

    // @media / @supports：递归处理内部
    if (/^@(media|supports|container|layer)\b/i.test(prelude)) {
      const inner = processRules(b.body, root, kfPrefix, hostDecls)
      out.push(`${prelude} {\n${inner}\n}`)
      continue
    }

    // 其它 at 规则（@font-face 等）原样保留
    if (prelude.startsWith('@')) {
      out.push(`${prelude} {${b.body}}`)
      continue
    }

    // 普通规则
    const normalized = prelude.replace(/\s+/g, '')
    if (HOST.has(normalized)) {
      // :root / html / body 的声明归到根类自身。
      // 必须补上结尾分号：原规则里最后一条声明通常省略分号，
      // 直接拼接会让它吞掉下一条（实测 html{scroll-behavior:smooth} 吞掉了 body 的 background）。
      const decls = b.body.trim().replace(/;\s*$/, '')
      hostDecls.push(`/* 原 ${prelude} */\n${decls};`)
      continue
    }

    out.push(`${scopeSelectorList(prelude, root)} {${b.body}}`)
  }

  return out.join('\n')
}

/** 改写 animation / animation-name 里对被重命名 keyframes 的引用。 */
function renameAnimationRefs(css, names, kfPrefix) {
  if (!names.size) return css
  // 长名优先，避免 "sp" 抢先匹配掉 "spin" 的前两个字符
  const alt = [...names]
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  // 先整条取出 animation 声明，再在声明内部替换动画名。
  // 【不能反复替换到稳定】改名后的 gx-home-spin 里，'-' 是非单词字符，
  // \bspin\b 仍然命中，循环会无限加前缀。所以必须单趟，且用
  // 「前一个字符不是 - 或字母数字」的前瞻把已加前缀的名字排除掉。
  const declRe = /animation(?:-name)?\s*:[^;}]*/gi
  const nameRe = new RegExp(`(^|[^\\w-])(${alt})(?![\\w-])`, 'g')

  return css.replace(declRe, (decl) =>
    decl.replace(nameRe, (_, lead, name) => `${lead}${kfPrefix}${name}`)
  )
}

/* ---- CLI ---- */
const [, , inFiles, rootClass, outFile] = process.argv
if (!inFiles || !rootClass || !outFile) {
  console.error('用法: node scope-css.cjs <in1.css,in2.css> <.root-class> <out.css>')
  process.exit(1)
}

const kfPrefix = rootClass.replace(/^\./, '') + '-'
const hostDecls = []
let body = ''
const kfNames = new Set()

for (const f of inFiles.split(',')) {
  const css = fs.readFileSync(f, 'utf8')
  for (const m of css.matchAll(/@(?:-\w+-)?keyframes\s+([\w-]+)/gi)) {
    kfNames.add(m[1])
  }
  body += `\n/* ===== 来自 ${f} ===== */\n`
  body += processRules(css, rootClass, kfPrefix, hostDecls)
}

body = renameAnimationRefs(body, kfNames, kfPrefix)

const header = `/*
 * 本文件由 scripts/scope-css.cjs 生成，请勿手工编辑。
 * 源：${inFiles}
 * 作用域根：${rootClass}
 * 重新生成：见 features/galaxis-home/README.md
 */\n`

const host = `${rootClass} {\n${hostDecls.join('\n\n')}\n}\n`

fs.writeFileSync(outFile, header + '\n' + host + '\n' + body + '\n')
console.error(
  `✅ 已生成 ${outFile}\n` +
  `   合并到根类的全局规则: ${hostDecls.length} 条\n` +
  `   重命名的 keyframes:   ${kfNames.size} 个`
)

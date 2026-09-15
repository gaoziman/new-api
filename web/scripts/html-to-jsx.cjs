/**
 * Astro 组件 → React TSX 的机械转换器。
 *
 * 【为什么用脚本而不是手改】首页有约 2000 行标签、36 个内联 SVG、
 * 上百个带 CSS 自定义属性的 style（如 style="--x:39.1%;--y:71.9%"）。
 * 手抄必然出错，而且错的是视觉细节——编译能过，肉眼看不出来。
 *
 * 【正确性怎么保证】这个脚本只做确定性的语法改写，不做判断；
 * 转换完必须跑 typecheck + 截图比对线上官网，两道都过才算数。
 * 脚本对无法确定的输入直接抛错，不猜。
 */
const fs = require('fs')
const path = require('path')

/** HTML 属性 → JSX 属性。只列实际出现的，未知的连字符属性会报错。 */
const ATTR = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autocapitalize: 'autoCapitalize',
  readonly: 'readOnly',
  spellcheck: 'spellCheck',
  contenteditable: 'contentEditable',
  inputmode: 'inputMode',
  srcset: 'srcSet',
  novalidate: 'noValidate',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity',
  'stroke-miterlimit': 'strokeMiterlimit',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'text-anchor': 'textAnchor',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'font-weight': 'fontWeight',
  'letter-spacing': 'letterSpacing',
  'dominant-baseline': 'dominantBaseline',
  'vector-effect': 'vectorEffect',
  'gradient-units': 'gradientUnits',
  'gradient-transform': 'gradientTransform',
  'marker-end': 'markerEnd',
  'marker-start': 'markerStart',
  'shape-rendering': 'shapeRendering',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'stdDeviation': 'stdDeviation',
  'xlink:href': 'xlinkHref',
  'xmlns:xlink': 'xmlnsXlink',
  'preserveAspectRatio': 'preserveAspectRatio',
}

/** HTML 里不需要闭合、JSX 里必须自闭合的元素。 */
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/** 无值的布尔属性，JSX 里要写成 attr={true}。 */
const BOOLEAN = new Set([
  'hidden', 'disabled', 'checked', 'selected', 'required',
  'readonly', 'multiple', 'autofocus', 'novalidate', 'open', 'defer', 'async',
])

/** kebab-case → camelCase（用于 style 里的标准 CSS 属性）。 */
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

/**
 * style="a:1;--b:2" → {{ a: '1', '--b': '2' }}
 * 自定义属性（--x）必须保留原名并加引号，camelCase 会让它失效。
 */
function convertStyle(value) {
  const parts = []
  for (const decl of value.split(';')) {
    const trimmed = decl.trim()
    if (!trimmed) continue
    const idx = trimmed.indexOf(':')
    if (idx < 0) throw new Error(`无法解析的 style 声明: ${trimmed}`)
    const prop = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (val.includes("'")) throw new Error(`style 值含单引号，需人工处理: ${trimmed}`)
    const key = prop.startsWith('--') ? `'${prop}'` : camel(prop)
    parts.push(`${key}: '${val}'`)
  }
  // 含自定义属性时 React 的类型定义不认，需要断言
  const needsCast = parts.some((p) => p.startsWith("'--"))
  const obj = `{ ${parts.join(', ')} }`
  return needsCast
    ? `{${obj} as React.CSSProperties}`
    : `{${obj}}`
}

/** 转换单个开标签内部的属性串。 */
function convertAttrs(raw, tagName) {
  let out = ''
  // 依次吃掉 attr="v" / attr='v' / attr
  const re = /\s*([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/y
  let pos = 0
  while (pos < raw.length) {
    re.lastIndex = pos
    const m = re.exec(raw)
    if (!m) {
      const rest = raw.slice(pos).trim()
      if (rest) throw new Error(`<${tagName}> 属性无法解析: ${rest}`)
      break
    }
    pos = re.lastIndex
    const name = m[1]
    let value = m[2] !== undefined ? m[2] : m[3]

    // Astro 的 attr={expr} 本身就是 JSX 语法，原样透传。
    // 这类位置（链接目标、动态版本号）后续要手工接到 React 数据源上，
    // 透传而不是报错，能让机械转换一次跑完，人工只收尾这几处。
    if (value === undefined && raw[pos] === '=' && raw[pos + 1] === '{') {
      let depth = 0
      let k = pos + 1
      for (; k < raw.length; k++) {
        if (raw[k] === '{') depth++
        else if (raw[k] === '}' && --depth === 0) break
      }
      if (depth !== 0) throw new Error(`<${tagName}> 的 ${name}= 表达式括号不匹配`)
      out += ` ${ATTR[name] ?? name}=${raw.slice(pos + 1, k + 1)}`
      pos = k + 1
      continue
    }

    if (value === undefined) {
      // 无值属性
      if (BOOLEAN.has(name.toLowerCase())) {
        out += ` ${ATTR[name.toLowerCase()] ?? name.toLowerCase()}={true}`
        continue
      }
      // 无值的 data-* 在 HTML 里等价于空串，选择器 [data-x] 照样命中。
      // 写成 {true} 会渲染成 data-x="true"，虽然也能被 [data-x] 选中，
      // 但值变了；用空串与原型完全一致。
      if (/^data-/.test(name)) {
        out += ` ${name}=""`
        continue
      }
      throw new Error(`<${tagName}> 出现未知的无值属性: ${name}`)
    }

    if (name === 'style') {
      out += ` style=${convertStyle(value)}`
      continue
    }

    let jsxName = ATTR[name] ?? ATTR[name.toLowerCase()] ?? name
    // aria-* / data-* 在 JSX 里保持原样，其余连字符属性必须显式映射过
    if (jsxName.includes('-') && !/^(aria|data)-/.test(jsxName)) {
      throw new Error(`未映射的连字符属性: ${name}（出现在 <${tagName}>）`)
    }

    // 值里含 { } 会被 JSX 当成表达式，需转义
    const safe = value.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
    if (safe.includes('"')) {
      out += ` ${jsxName}={${JSON.stringify(safe)}}`
    } else {
      out += ` ${jsxName}="${safe}"`
    }
  }
  return out
}

function convert(html) {
  let out = ''
  let i = 0
  while (i < html.length) {
    // HTML 注释 → JSX 注释
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i)
      if (end < 0) throw new Error('未闭合的 HTML 注释')
      const body = html.slice(i + 4, end).replace(/\*\//g, '*​/')
      out += `{/*${body}*/}`
      i = end + 3
      continue
    }
    // 闭标签
    if (/^<\/[a-zA-Z]/.test(html.slice(i))) {
      const end = html.indexOf('>', i)
      out += html.slice(i, end + 1)
      i = end + 1
      continue
    }
    // 开标签
    if (/^<[a-zA-Z]/.test(html.slice(i))) {
      // 找到该标签的 '>'（属性值里的 > 需要跳过）
      let j = i + 1
      let quote = null
      while (j < html.length) {
        const ch = html[j]
        if (quote) {
          if (ch === quote) quote = null
        } else if (ch === '"' || ch === "'") {
          quote = ch
        } else if (ch === '>') break
        j++
      }
      if (j >= html.length) throw new Error('未闭合的开标签')
      const inner = html.slice(i + 1, j)
      const selfClosed = inner.trimEnd().endsWith('/')
      const body = selfClosed ? inner.trimEnd().slice(0, -1) : inner
      const nameMatch = body.match(/^([a-zA-Z][-a-zA-Z0-9]*)/)
      const tag = nameMatch[1]
      const attrs = convertAttrs(body.slice(tag.length), tag)
      const close = selfClosed || VOID.has(tag.toLowerCase()) ? ' />' : '>'
      out += `<${tag}${attrs}${close}`
      i = j + 1
      continue
    }
    // 文本：JSX 里 { } 有特殊含义
    const next = html.indexOf('<', i)
    const text = next < 0 ? html.slice(i) : html.slice(i, next)
    out += text.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
    i = next < 0 ? html.length : next
  }
  return out
}

/* ---- CLI ---- */
const [, , inFile, outFile] = process.argv
if (!inFile) {
  console.error('用法: node html-to-jsx.cjs <输入.html> [输出.jsx]')
  process.exit(1)
}
const src = fs.readFileSync(inFile, 'utf8')
const result = convert(src)
if (outFile) fs.writeFileSync(outFile, result)
else process.stdout.write(result)

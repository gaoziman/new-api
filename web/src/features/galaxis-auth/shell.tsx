/*
 * 登录 / 注册页共用的外壳、图标与小部件。
 *
 * 这一层只负责「长什么样」，不碰任何认证逻辑——登录、注册、2FA、密码加密、
 * 人机校验全部沿用上游 `features/auth` 的既有实现（见 sign-in.tsx / sign-up.tsx 的说明）。
 * 保持这条边界，二开的改动面才只有展示层，上游升级时冲突范围最小。
 *
 * 图标路径数据取自客户原型，未改动。
 */
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { BrandMark } from './brand-mark'

/* ---------------- 图标 ---------------- */

const STROKE = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconCheck() {
  return (
    <svg viewBox='0 0 24 24' strokeWidth={1.7} {...STROKE} aria-hidden='true'>
      <path d='M20 6 9 17l-5-5' />
    </svg>
  )
}

export function IconAlert() {
  return (
    <svg viewBox='0 0 24 24' strokeWidth={1.8} {...STROKE} aria-hidden='true'>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 8v5M12 16h.01' />
    </svg>
  )
}

export function IconSignIn() {
  return (
    <svg viewBox='0 0 24 24' strokeWidth={1.9} {...STROKE} aria-hidden='true'>
      <path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' />
      <polyline points='10 17 15 12 10 7' />
      <line x1='15' x2='3' y1='12' y2='12' />
    </svg>
  )
}

export function IconSignUp() {
  return (
    <svg viewBox='0 0 24 24' strokeWidth={1.9} {...STROKE} aria-hidden='true'>
      <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
      <circle cx='9' cy='7' r='4' />
      <path d='M19 8v6M22 11h-6' />
    </svg>
  )
}

export function IconSpinner() {
  return (
    <svg
      className='spin'
      viewBox='0 0 24 24'
      strokeWidth={2.2}
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      aria-hidden='true'
    >
      <path d='M21 12a9 9 0 1 1-6.2-8.6' />
    </svg>
  )
}

function IconEyeOn() {
  return (
    <svg viewBox='0 0 24 24' strokeWidth={1.7} {...STROKE} aria-hidden='true'>
      <path d='M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg viewBox='0 0 24 24' strokeWidth={1.7} {...STROKE} aria-hidden='true'>
      <path d='M10.6 6.2A9.9 9.9 0 0 1 12 6c6.2 0 10 7 10 7a17 17 0 0 1-3 3.8M6.3 6.4A17 17 0 0 0 2 13s3.8 7 10 7a9.7 9.7 0 0 0 4.3-1' />
      <path d='m3 3 18 18' />
      <path d='M9.9 10a3 3 0 0 0 4.2 4.2' />
    </svg>
  )
}

/* ---------------- 小部件 ---------------- */

/**
 * 顶部通栏提示。
 * 原型用 `.show` 类切换显隐；React 里直接按有无内容决定是否渲染，
 * 少一个可能和真实状态对不上的 DOM 类。
 */
export function Alert({ text, bad }: { text: string; bad?: boolean }) {
  if (!text) return null
  return (
    <div className={bad ? 'alert is-bad' : 'alert'} role='alert'>
      <IconAlert />
      <span>{text}</span>
    </div>
  )
}

/** 字段级错误。留空则不占位，避免表单在报错时跳动一次布局。 */
export function FieldError({ text }: { text?: string }) {
  if (!text) return null
  return <p className='msg'>{text}</p>
}

/**
 * 带明文切换的密码框。
 *
 * 原型用 `data-for` + 全局 querySelectorAll 绑定；这里改成组件自持 state，
 * 页面上有几个密码框就各自独立，不再依赖 id 唯一。
 */
export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
  invalid?: boolean
}) {
  const [shown, setShown] = useState(false)
  return (
    <div className='inp-wrap has-eye'>
      <input
        className={invalid ? 'inp is-err' : 'inp'}
        id={id}
        name={id}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        className='eye'
        type='button'
        onClick={() => setShown(!shown)}
        aria-label={shown ? '隐藏密码' : '显示密码'}
      >
        {shown ? <IconEyeOff /> : <IconEyeOn />}
      </button>
    </div>
  )
}

/* ---------------- 页面外壳 ---------------- */

/**
 * AGPL 署名。
 *
 * New API 以 AGPL-3.0 发布，其 NOTICE 依据第 7 条附加了署名要求：
 * 修改后的界面必须保留原作者署名，并给出获取源码的入口。
 * 这段因此是**合规要件，不是装饰**，不要在「精简页脚」时删掉。
 * 上游仓库链接指向 QuantumNous/new-api；本站修改版源码链接指向我们的 fork。
 */
export function Attribution() {
  return (
    <p className='attrib'>
      Frontend design and development by{' '}
      <a
        href='https://github.com/QuantumNous/new-api'
        target='_blank'
        rel='noreferrer noopener'
      >
        New API contributors
      </a>
      . 本站界面为其修改版，源码见{' '}
      <a
        href='https://github.com/gaoziman/new-api'
        target='_blank'
        rel='noreferrer noopener'
      >
        gaoziman/new-api
      </a>
      ，依 AGPL-3.0 授权。
    </p>
  )
}

/**
 * 页脚：服务协议 / 隐私政策 / 站点域名 + 署名。
 *
 * 协议链接按后台开关显示——管理员没启用时页面上不该出现点进去是空白的链接。
 * 域名读 `location.host` 而不是写死：这套代码同时服务 .cn 和 .com 两个域名，
 * 写死必然有一边是错的。
 */
export function FormFoot({
  userAgreement,
  privacyPolicy,
}: {
  userAgreement: boolean
  privacyPolicy: boolean
}) {
  return (
    <>
      <p className='form-foot'>
        {userAgreement && <Link to='/user-agreement'>服务协议</Link>}
        {privacyPolicy && <Link to='/privacy-policy'>隐私政策</Link>}
        <span>{typeof window === 'undefined' ? '' : window.location.host}</span>
      </p>
      <Attribution />
    </>
  )
}

/** FIG 图号分隔线，和官网同一套制图语言。 */
export function FigRule({ label }: { label: string }) {
  return (
    <div className='fig-rule' aria-hidden='true'>
      <i className='node node-l' />
      <i className='node node-r' />
      <span className='fig'>
        FIG.<b>01</b>
        {'  '}
        {label}
      </span>
    </div>
  )
}

/**
 * 左品牌栏 + 右表单栏的整体骨架。
 *
 * 最外层的 `gx-auth` 是样式作用域根，删掉它整页样式会全部失效
 * （见 galaxis-auth.css 开头关于作用域的说明）。
 */
export function AuthShell({
  brand,
  children,
}: {
  brand: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className='gx-auth'>
      <aside className='brand-pane'>
        <span className='rail rail-a' aria-hidden='true' />
        <span className='rail rail-b' aria-hidden='true' />

        <Link className='brand-lock' to='/'>
          <BrandMark idPrefix='gx-brand' />
          <b>GalaxisRouter</b>
        </Link>

        {brand}

        <p className='brand-foot'>
          <i />
          EST. 2026 · GALAXIS NETWORK
        </p>
      </aside>

      <section className='form-pane'>
        <div className='form-col'>
          <Link className='mini-lock' to='/'>
            <BrandMark idPrefix='gx-mini' />
            <b>GalaxisRouter</b>
          </Link>
          {children}
        </div>
      </section>
    </main>
  )
}

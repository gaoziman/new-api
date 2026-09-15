/*
 * Galaxis 登录页。
 *
 * 【边界】本文件只负责界面。认证逻辑一律复用上游 `features/auth` 的既有实现：
 *   - `login()`  —— 内含密码加密（password_encrypted / encryption_key_id）协商
 *   - `useAuthRedirect().handleLoginResult()` —— 处理会话落地、语言同步、跳转，
 *     以及**两步验证**：返回的是挑战而非会话时，它会存下挑战并转到 /otp。
 *     所以这里不需要、也不应该自己写 2FA 面板。
 *   - `useTurnstile()` —— 后台开启人机校验时的 token 管理
 * 这样二开的改动面只有展示层，上游升级这些能力我们自动跟上。
 *
 * 【错误提示的分工】上游的 axios 拦截器（lib/http-client.ts）已经对每一个
 * `success:false` 响应和 HTTP 错误统一弹了 toast，并且走了 i18n。
 * 因此这里**不再把服务端消息渲染进 alert 条**——那会让同一句话出现两次。
 * alert 条只承载本地信息：后台开关导致的功能不可用、表单未勾选协议之类。
 */
import { Link, useSearch } from '@tanstack/react-router'
import axios from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { Turnstile } from '@/components/turnstile'
import { login } from '@/features/auth/api'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { getServerErrorMessageKey } from '@/lib/server-error-message'
import { useStatus } from '@/hooks/use-status'

import './galaxis-auth.css'
import {
  Alert,
  AuthShell,
  FieldError,
  FigRule,
  FormFoot,
  IconCheck,
  IconSignIn,
  IconSpinner,
  PasswordField,
} from './shell'

type Errors = { acct?: string; pw?: string }

const FACTS = [
  ['无需海外账号', '，也不用手动配置环境'],
  ['用多少付多少', '，没有月费，不用订阅'],
  ['余额用完自动停', '，不会自动扣款'],
] as const

export function GalaxisSignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const { status } = useStatus()
  const { handleLoginResult } = useAuthRedirect()
  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile()

  const [acct, setAcct] = useState('')
  const [pw, setPw] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  // 每次提交后重挂 Turnstile 组件：它的 token 是一次性的，
  // 登录失败后不换新 widget，第二次提交必定因 token 已用过而被拒。
  const [turnstileKey, setTurnstileKey] = useState(0)

  // 这几项来自后台开关。读不到时按「开启」处理，避免 status 还在加载时
  // 页面先把注册入口藏起来、加载完又冒出来的闪烁。
  const passwordLoginEnabled =
    (status?.password_login_enabled ??
      status?.data?.password_login_enabled ??
      true) !== false
  const registerVisible =
    !status?.self_use_mode_enabled && status?.register_enabled !== false
  const passwordEncryptionEnabled =
    (status?.password_login_encryption_enabled ??
      status?.data?.password_login_encryption_enabled ??
      false) === true

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const next: Errors = {}
    if (!acct.trim()) next.acct = '请填写用户名或电子邮件'
    if (!pw) next.pw = '请填写密码'
    setErrors(next)
    if (Object.keys(next).length) return

    if (!validateTurnstile()) return

    const submittedToken = turnstileToken
    if (isTurnstileEnabled) {
      setTurnstileToken('')
      setTurnstileKey((n) => n + 1)
    }

    setBusy(true)
    try {
      const res = await login({
        username: acct.trim(),
        password: pw,
        turnstile: submittedToken,
        passwordEncryptionEnabled,
      })
      if (res.success) {
        setPw('')
        // 成功即跳转；若账号开了两步验证，这里会转到 /otp 而不是控制台。
        if (await handleLoginResult(res.data, redirect)) {
          toast.success('欢迎回来')
        }
      }
      // success:false 的提示已由拦截器弹出，这里不重复
    } catch (error: unknown) {
      // 同理：axios 错误拦截器已经提示过
      if (axios.isAxiosError(error)) return
      if (getServerErrorMessageKey(error)) return
      toast.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  const brand = (
    <div className='brand-mid'>
      <p className='brand-kicker'>WELCOME BACK</p>
      <h2>
        群星之间，<i>一线直达</i>。
      </h2>
      <p className='brand-tag'>
        登录后打开客户端，挑 Claude Code 或 Codex，点一下就能接着干活。
      </p>
      <ul className='brand-facts'>
        {FACTS.map(([strong, rest]) => (
          <li key={strong}>
            <IconCheck />
            <span>
              <b>{strong}</b>
              {rest}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <AuthShell brand={brand}>
      <FigRule label='SIGN IN' />

      <div className='form-head'>
        <h1>登录</h1>
        {registerVisible && (
          <p>
            没有账号？<Link to='/sign-up'>立即注册</Link>
          </p>
        )}
      </div>

      {!passwordLoginEnabled && (
        <Alert bad text='管理员已关闭密码登录，请使用其他登录方式或联系客服。' />
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className='field'>
          <div className='lbl'>
            <label htmlFor='acct'>
              用户名或电子邮件<span className='req'>*</span>
            </label>
          </div>
          <div className='inp-wrap'>
            <input
              className={errors.acct ? 'inp is-err' : 'inp'}
              id='acct'
              name='username'
              type='text'
              autoComplete='username'
              placeholder='输入用户名或电子邮件'
              value={acct}
              onChange={(e) => {
                setAcct(e.target.value)
                if (errors.acct) setErrors((s) => ({ ...s, acct: undefined }))
              }}
            />
          </div>
          <FieldError text={errors.acct} />
        </div>

        <div className='field'>
          <div className='lbl'>
            <label htmlFor='pw'>
              密码<span className='req'>*</span>
            </label>
            <Link to='/forgot-password'>忘记密码？</Link>
          </div>
          <PasswordField
            id='pw'
            value={pw}
            onChange={(v) => {
              setPw(v)
              if (errors.pw) setErrors((s) => ({ ...s, pw: undefined }))
            }}
            placeholder='输入密码'
            autoComplete='current-password'
            invalid={!!errors.pw}
          />
          <FieldError text={errors.pw} />
        </div>

        {isTurnstileEnabled && (
          <div className='turnstile-slot'>
            <Turnstile
              key={turnstileKey}
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
            />
          </div>
        )}

        <button
          className={busy ? 'btn is-busy' : 'btn'}
          type='submit'
          disabled={busy || !passwordLoginEnabled}
        >
          {busy ? <IconSpinner /> : <IconSignIn />}
          <span>{busy ? '正在登录…' : '登录'}</span>
        </button>
      </form>

      <FormFoot
        userAgreement={Boolean(status?.user_agreement_enabled)}
        privacyPolicy={Boolean(status?.privacy_policy_enabled)}
      />
    </AuthShell>
  )
}

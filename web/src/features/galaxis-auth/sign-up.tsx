/*
 * Galaxis 注册页。
 *
 * 【边界】同登录页：界面是我们的，逻辑复用上游 `features/auth`——
 *   - `register()` —— 注册请求，含 turnstile 透传
 *   - `useEmailVerification()` —— 发码 + 60 秒倒计时。选它而不是自己写，
 *     关键在于它**只在发送成功后才启动倒计时**；服务端对发码有限流，
 *     失败也倒计时会让按钮上的秒数和真实冷却对不上。
 *   - `getAffiliateCode()` —— 邀请码（落在 storage 里，由邀请链接写入），
 *     漏传邀请人就拿不到奖励。
 *
 * 【注册不自动登录】New API 的注册接口不种会话 cookie，成功后必须再登录一次。
 * 因此这里跳 /sign-in 并把用户名带过去，少让用户填一个字段。
 *
 * 【错误提示】服务端消息由 lib/http-client.ts 的拦截器统一 toast，
 * 这里不重复渲染（详见 sign-in.tsx 顶部说明）。
 */
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Turnstile } from '@/components/turnstile'
import { register } from '@/features/auth/api'
import { useEmailVerification } from '@/features/auth/hooks/use-email-verification'
import { getAffiliateCode } from '@/features/auth/lib/storage'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { useStatus } from '@/hooks/use-status'

import './galaxis-auth.css'
import { assessPassword } from './password-strength'
import {
  Alert,
  AuthShell,
  FieldError,
  FigRule,
  FormFoot,
  IconSignUp,
  IconSpinner,
  PasswordField,
} from './shell'

type Errors = {
  user?: string
  pw?: string
  pw2?: string
  mail?: string
  code?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STEPS = [
  ['注册账号', '，用邮箱收一次验证码'],
  ['下载客户端', '，装完在里面登录'],
  ['点击配置', '，Claude Code 和 Codex 即刻开用'],
] as const

export function GalaxisSignUp() {
  const navigate = useNavigate()
  const { status } = useStatus()
  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile()
  const {
    sendCode,
    isSending,
    secondsLeft,
    isActive: counting,
  } = useEmailVerification({ turnstileToken, validateTurnstile })

  const [user, setUser] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [mail, setMail] = useState('')
  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  // 后台开关。邮箱验证关掉时，邮箱与验证码两栏不该出现，
  // 也不该作为必填——填了也用不上，多发这两个字段还会被服务端当成非法参数。
  const emailRequired = Boolean(status?.email_verification)
  const registerEnabled = status?.register_enabled !== false
  const strength = assessPassword(pw)

  const clear = (k: keyof Errors) =>
    setErrors((s) => (s[k] ? { ...s, [k]: undefined } : s))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNotice('')

    const next: Errors = {}
    if (!user.trim()) next.user = '请填写用户名'

    if (!pw) next.pw = '请填写密码'
    else if (pw.length < 8 || pw.length > 128) next.pw = '密码需为 8–128 个字符'

    if (!pw2) next.pw2 = '请再输入一次密码'
    else if (pw2 !== pw) next.pw2 = '两次输入的密码不一致'

    if (emailRequired) {
      if (!mail.trim()) next.mail = '请填写电子邮件'
      else if (!EMAIL_RE.test(mail.trim())) next.mail = '邮箱格式不正确'
      if (!code.trim()) next.code = '请填写邮箱验证码'
    }

    setErrors(next)
    if (Object.keys(next).length) return

    if (!agreed) {
      setNotice('请先勾选同意服务协议和隐私政策。')
      return
    }
    if (!validateTurnstile()) return

    setBusy(true)
    try {
      const res = await register({
        username: user.trim(),
        password: pw,
        email: emailRequired ? mail.trim() : undefined,
        verification_code: emailRequired ? code.trim() : undefined,
        aff_code: getAffiliateCode(),
        turnstile: turnstileToken,
      })
      if (res?.success) {
        toast.success('注册成功，请登录')
        // 带上用户名，登录页会预填
        void navigate({
          to: '/sign-in',
          search: { redirect: undefined },
          replace: true,
        })
      }
      // 失败提示由拦截器统一弹出
    } catch {
      // 同上，拦截器已处理
    } finally {
      setBusy(false)
    }
  }

  async function onSendCode() {
    const value = mail.trim()
    if (!value) {
      setErrors((s) => ({ ...s, mail: '请先填写电子邮件' }))
      return
    }
    if (!EMAIL_RE.test(value)) {
      setErrors((s) => ({ ...s, mail: '邮箱格式不正确' }))
      return
    }
    clear('mail')
    // 倒计时只在发送成功后启动，由 hook 自己保证
    await sendCode(value)
  }

  const brand = (
    <div className='brand-mid'>
      <p className='brand-kicker'>CREATE ACCOUNT</p>
      <h2>
        注册一个账号，
        <br />
        <i>剩下的交给客户端</i>。
      </h2>
      <p className='brand-tag'>
        不用海外账号，不用手动配置环境。注册即送体验额度，先试着用，觉得顺手再充。
      </p>
      <ul className='brand-steps'>
        {STEPS.map(([strong, rest]) => (
          <li key={strong}>
            <span>
              <b>{strong}</b>
              {rest}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )

  let codeButtonLabel = '发送验证码'
  if (counting) codeButtonLabel = `${secondsLeft} 秒后重发`
  else if (isSending) codeButtonLabel = '发送中…'

  return (
    <AuthShell brand={brand}>
      <FigRule label='SIGN UP' />

      <div className='form-head'>
        <h1>创建账户</h1>
        <p>
          已有账户？<Link to='/sign-in'>直接登录</Link>
        </p>
      </div>

      {!registerEnabled && (
        <Alert bad text='管理员已关闭注册功能。如需开通账号请联系客服。' />
      )}
      <Alert bad text={notice} />

      <form onSubmit={onSubmit} noValidate>
        <div className='field'>
          <div className='lbl'>
            <label htmlFor='user'>
              用户名<span className='req'>*</span>
            </label>
          </div>
          <div className='inp-wrap'>
            <input
              className={errors.user ? 'inp is-err' : 'inp'}
              id='user'
              name='username'
              type='text'
              autoComplete='username'
              placeholder='输入您的用户名'
              value={user}
              onChange={(e) => {
                setUser(e.target.value)
                clear('user')
              }}
            />
          </div>
          <FieldError text={errors.user} />
        </div>

        <div className='field'>
          <div className='lbl'>
            <label htmlFor='pw'>
              密码<span className='req'>*</span>
            </label>
            <span className='note'>8–128 个字符</span>
          </div>
          <PasswordField
            id='pw'
            value={pw}
            onChange={(v) => {
              setPw(v)
              clear('pw')
            }}
            placeholder='输入密码'
            autoComplete='new-password'
            invalid={!!errors.pw}
          />
          {strength.level > 0 && (
            <div className='strength' data-lv={strength.level}>
              <div className='strength-bar'>
                <i />
                <i />
                <i />
              </div>
              <p className='strength-txt'>{strength.text}</p>
            </div>
          )}
          <FieldError text={errors.pw} />
        </div>

        <div className='field'>
          <div className='lbl'>
            <label htmlFor='pw2'>
              确认密码<span className='req'>*</span>
            </label>
          </div>
          <PasswordField
            id='pw2'
            value={pw2}
            onChange={(v) => {
              setPw2(v)
              clear('pw2')
            }}
            placeholder='再输入一次密码'
            autoComplete='new-password'
            invalid={!!errors.pw2}
          />
          <FieldError text={errors.pw2} />
        </div>

        {emailRequired && (
          <>
            <div className='field'>
              <div className='lbl'>
                <label htmlFor='mail'>
                  电子邮件<span className='req'>*</span>
                </label>
                <span className='note'>需验证</span>
              </div>
              <div className='inp-wrap'>
                <input
                  className={errors.mail ? 'inp is-err' : 'inp'}
                  id='mail'
                  name='email'
                  type='email'
                  autoComplete='email'
                  placeholder='name@example.com'
                  value={mail}
                  onChange={(e) => {
                    setMail(e.target.value)
                    clear('mail')
                  }}
                />
              </div>
              <FieldError text={errors.mail} />
            </div>

            <div className='field'>
              <div className='lbl'>
                <label htmlFor='code'>
                  邮箱验证码<span className='req'>*</span>
                </label>
              </div>
              <div className='code-row'>
                <div className='inp-wrap'>
                  <input
                    className={errors.code ? 'inp is-err' : 'inp'}
                    id='code'
                    name='verification_code'
                    type='text'
                    inputMode='numeric'
                    autoComplete='one-time-code'
                    placeholder='输入收到的验证码'
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      clear('code')
                    }}
                  />
                </div>
                <button
                  className='btn-ghost'
                  type='button'
                  onClick={onSendCode}
                  disabled={isSending || counting}
                >
                  {codeButtonLabel}
                </button>
              </div>
              <FieldError text={errors.code} />
            </div>
          </>
        )}

        {isTurnstileEnabled && (
          <div className='turnstile-slot'>
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
            />
          </div>
        )}

        <label className='check'>
          <input
            type='checkbox'
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              if (e.target.checked) setNotice('')
            }}
            className={notice && !agreed ? 'is-err' : undefined}
          />
          <span>
            我已阅读并同意{' '}
            {/*
              协议页由后台开关控制。管理员没启用时点进去是空页面，
              所以未启用就退化成纯文本——宁可不可点，也不给死链。
            */}
            {status?.user_agreement_enabled ? (
              <Link to='/user-agreement'>服务协议</Link>
            ) : (
              '服务协议'
            )}{' '}
            和{' '}
            {status?.privacy_policy_enabled ? (
              <Link to='/privacy-policy'>隐私政策</Link>
            ) : (
              '隐私政策'
            )}
          </span>
        </label>

        <button
          className={busy ? 'btn is-busy' : 'btn'}
          type='submit'
          disabled={busy || !registerEnabled}
        >
          {busy ? <IconSpinner /> : <IconSignUp />}
          <span>{busy ? '正在创建…' : '创建账户'}</span>
        </button>
      </form>

      <FormFoot
        userAgreement={Boolean(status?.user_agreement_enabled)}
        privacyPolicy={Boolean(status?.privacy_policy_enabled)}
      />
    </AuthShell>
  )
}

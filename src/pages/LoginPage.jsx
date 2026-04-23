import React, { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/features/auth/AuthContext.jsx'
import './LoginPage.css'

const OTP_RESEND_SECONDS = 60

function normalizeAuthError(err, fallback = '操作失败') {
  if (!(err instanceof ApiError)) return fallback
  const msg = String(err.message || fallback)
  if (msg.includes('验证码已失效')) return '验证码已失效，请点击“发送验证码”获取最新验证码。'
  if (msg.includes('账号或验证码错误')) return '验证码错误，请确认输入的是最新 6 位验证码。'
  if (msg.includes('登录已锁定')) return '尝试次数过多，账号已临时锁定，请稍后再试。'
  if (msg.includes('发送过于频繁')) return '发送过于频繁，请稍候再试。'
  return msg
}

function LoginPage() {
  const { requestOtp, signInWithOtp, signInWithPassword, resetPasswordByOtp } = useAuth()
  const [tab, setTab] = useState('otp')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (otpCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setOtpCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [otpCooldown])

  const canSubmit = useMemo(() => {
    const e = email.trim()
    if (!e) return false
    if (tab === 'otp') return otpCode.trim().length === 6
    if (tab === 'reset') return otpCode.trim().length === 6 && newPassword.trim().length >= 6
    return password.trim().length >= 6
  }, [email, otpCode, password, newPassword, tab])

  const handleSendOtp = async () => {
    if (otpCooldown > 0) return
    setError('')
    setMessage('')
    setSendingOtp(true)
    try {
      const res = await requestOtp(email.trim())
      setMessage(res.message || '验证码已发送')
      setOtpCooldown(OTP_RESEND_SECONDS)
    } catch (err) {
      setError(normalizeAuthError(err, '发送验证码失败'))
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      if (tab === 'otp') {
        await signInWithOtp(email.trim(), otpCode.trim().replace(/\s+/g, ''))
      } else if (tab === 'reset') {
        await resetPasswordByOtp(email.trim(), otpCode.trim().replace(/\s+/g, ''), newPassword.trim())
      } else {
        await signInWithPassword(email.trim(), password)
      }
    } catch (err) {
      setError(normalizeAuthError(err, '操作失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand-mark" aria-hidden="true">
          财
        </div>
        <h2 className="login-title">对账管理系统登录</h2>
        <p className="login-subtitle">支持邮箱验证码或密码登录</p>

        <div className="login-tabs" role="tablist" aria-label="登录方式">
          <button
            type="button"
            onClick={() => setTab('otp')}
            className={`login-tab ${tab === 'otp' ? 'active' : ''}`}
          >
            验证码登录
          </button>
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`login-tab ${tab === 'password' ? 'active' : ''}`}
          >
            密码登录
          </button>
          <button
            type="button"
            onClick={() => setTab('reset')}
            className={`login-tab ${tab === 'reset' ? 'active' : ''}`}
          >
            重置密码
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            <span>邮箱</span>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入公司邮箱"
              required
            />
          </label>
          {tab === 'otp' || tab === 'reset' ? (
            <>
              <label className="login-label">
                <span>验证码</span>
                <div className="login-otp-row">
                  <input
                    className="login-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
                    placeholder="6位验证码"
                  />
                  <button
                    type="button"
                    className="login-otp-btn"
                    onClick={handleSendOtp}
                    disabled={!email.trim() || sendingOtp || otpCooldown > 0}
                  >
                    {sendingOtp ? '发送中...' : otpCooldown > 0 ? `${otpCooldown}s 后可重发` : '发送验证码'}
                  </button>
                </div>
              </label>
              {tab === 'reset' ? (
                <label className="login-label">
                  <span>新密码</span>
                  <input
                    className="login-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少6位新密码"
                  />
                </label>
              ) : null}
            </>
          ) : (
            <label className="login-label">
              <span>密码</span>
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </label>
          )}
          {message ? <div className="login-message login-message--success">{message}</div> : null}
          {error ? <div className="login-message login-message--error">{error}</div> : null}

          <button type="submit" className="login-submit-btn" disabled={!canSubmit || submitting}>
            {submitting ? '提交中...' : tab === 'reset' ? '重置并登录' : '登录'}
          </button>

          <p className="login-footnote">仅限公司授权账号访问</p>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

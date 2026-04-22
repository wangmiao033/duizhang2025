import React, { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/features/auth/AuthContext.jsx'

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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f1f5f9' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
        <h2 style={{ margin: 0 }}>对账管理系统登录</h2>
        <p style={{ margin: '8px 0 16px', color: '#64748b' }}>支持邮箱验证码或密码登录</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button type="button" onClick={() => setTab('otp')} className={`rec-btn ${tab === 'otp' ? 'rec-btn--primary' : 'rec-btn--ghost'}`}>验证码登录</button>
          <button type="button" onClick={() => setTab('password')} className={`rec-btn ${tab === 'password' ? 'rec-btn--primary' : 'rec-btn--ghost'}`}>密码登录</button>
          <button type="button" onClick={() => setTab('reset')} className={`rec-btn ${tab === 'reset' ? 'rec-btn--primary' : 'rec-btn--ghost'}`}>重置密码</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>邮箱</span>
            <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入公司邮箱" required />
          </label>
          {tab === 'otp' || tab === 'reset' ? (
            <>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>验证码</span>
                <input
                  className="admin-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
                  placeholder="6位验证码"
                />
              </label>
              {tab === 'reset' ? (
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>新密码</span>
                  <input className="admin-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少6位新密码" />
                </label>
              ) : null}
              <div>
                <button
                  type="button"
                  className="rec-btn rec-btn--ghost"
                  onClick={handleSendOtp}
                  disabled={!email.trim() || sendingOtp || otpCooldown > 0}
                >
                  {sendingOtp ? '发送中...' : otpCooldown > 0 ? `${otpCooldown}s 后可重发` : '发送验证码'}
                </button>
              </div>
            </>
          ) : (
            <label style={{ display: 'grid', gap: 6 }}>
              <span>密码</span>
              <input className="admin-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
            </label>
          )}
          {message ? <div style={{ color: '#059669', fontSize: 13 }}>{message}</div> : null}
          {error ? <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div> : null}
          <button type="submit" className="rec-btn rec-btn--primary" disabled={!canSubmit || submitting}>
            {submitting ? '提交中...' : tab === 'reset' ? '重置并登录' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

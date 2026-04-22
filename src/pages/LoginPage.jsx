import React, { useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/features/auth/AuthContext.jsx'

function LoginPage() {
  const { requestOtp, signInWithOtp, signInWithPassword, resetPasswordByOtp } = useAuth()
  const [tab, setTab] = useState('otp')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    const e = email.trim()
    if (!e) return false
    if (tab === 'otp') return otpCode.trim().length >= 4
    if (tab === 'reset') return otpCode.trim().length >= 4 && newPassword.trim().length >= 6
    return password.trim().length >= 6
  }, [email, otpCode, password, newPassword, tab])

  const handleSendOtp = async () => {
    setError('')
    setMessage('')
    setSendingOtp(true)
    try {
      const res = await requestOtp(email.trim())
      setMessage(res.message || '验证码已发送')
    } catch (err) {
      if (err instanceof ApiError) setError(String(err.message || '发送验证码失败'))
      else setError('发送验证码失败')
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
        await signInWithOtp(email.trim(), otpCode.trim())
      } else if (tab === 'reset') {
        await resetPasswordByOtp(email.trim(), otpCode.trim(), newPassword.trim())
      } else {
        await signInWithPassword(email.trim(), password)
      }
    } catch (err) {
      if (err instanceof ApiError) setError(String(err.message || '操作失败'))
      else setError('操作失败')
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
                <input className="admin-input" type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="6位验证码" />
              </label>
              {tab === 'reset' ? (
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>新密码</span>
                  <input className="admin-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少6位新密码" />
                </label>
              ) : null}
              <div>
                <button type="button" className="rec-btn rec-btn--ghost" onClick={handleSendOtp} disabled={!email.trim() || sendingOtp}>
                  {sendingOtp ? '发送中...' : '发送验证码'}
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

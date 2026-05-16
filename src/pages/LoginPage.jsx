import React, { useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/features/auth/AuthContext.jsx'
import './LoginPage.css'

function normalizeAuthError(err, fallback = '操作失败') {
  if (!(err instanceof ApiError)) return fallback
  const msg = String(err.message || fallback)
  if (msg.includes('登录已锁定')) return '尝试次数过多，账号已临时锁定，请稍后再试。'
  if (msg.includes('账号或密码错误')) return '账号或密码错误，请重新输入。'
  return msg
}

function LoginPage() {
  const { signInWithPassword } = useAuth()
  const [account, setAccount] = useState('adam')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    return account.trim().length > 0 && password.trim().length >= 6
  }, [account, password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setError('')
    setSubmitting(true)
    try {
      await signInWithPassword(account.trim(), password)
    } catch (err) {
      setError(normalizeAuthError(err, '登录失败'))
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
        <p className="login-subtitle">使用公司内部账号密码登录</p>

        <div className="login-mode-badge">账号登录</div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            <span>账号</span>
            <input
              className="login-input"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="请输入账号"
              autoComplete="username"
              required
            />
          </label>

          <label className="login-label">
            <span>密码</span>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="login-message login-message--error">{error}</div> : null}

          <button type="submit" className="login-submit-btn" disabled={!canSubmit || submitting}>
            {submitting ? '登录中...' : '登录'}
          </button>

          <p className="login-footnote">仅限公司授权账号访问</p>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

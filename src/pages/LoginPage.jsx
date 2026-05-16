import React, { useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/features/auth/AuthContext.jsx'
import './LoginPage.css'

const REMEMBER_ACCOUNT_KEY = 'duizhang:remember-account'
const DEFAULT_ACCOUNT = 'adam'

function normalizeAuthError(err, fallback = '操作失败') {
  if (!(err instanceof ApiError)) return fallback
  const msg = String(err.message || fallback)
  if (msg.includes('登录已锁定')) return '尝试次数过多，账号已临时锁定，请稍后再试。'
  if (msg.includes('账号或密码错误')) return '账号或密码错误，请重新输入。'
  return msg
}

function LoginPage() {
  const { signInWithPassword } = useAuth()
  const savedAccount =
    typeof window !== 'undefined' ? window.localStorage.getItem(REMEMBER_ACCOUNT_KEY) : ''
  const [account, setAccount] = useState(savedAccount || DEFAULT_ACCOUNT)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberAccount, setRememberAccount] = useState(Boolean(savedAccount) || true)
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
      const normalizedAccount = account.trim()
      await signInWithPassword(normalizedAccount, password)
      if (rememberAccount) {
        window.localStorage.setItem(REMEMBER_ACCOUNT_KEY, normalizedAccount)
      } else {
        window.localStorage.removeItem(REMEMBER_ACCOUNT_KEY)
      }
    } catch (err) {
      setError(normalizeAuthError(err, '登录失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-hero-panel" aria-label="系统介绍">
          <div className="login-shield" aria-hidden="true">
            <span>✓</span>
          </div>
          <p className="login-kicker">Caiwu 2026</p>
          <h1 className="login-hero-title">对账管理系统</h1>
          <p className="login-hero-copy">
            研发对账、渠道结算、发票与回款资料统一管理。登录后保持 1 天有效，刷新页面不会退出。
          </p>
          <div className="login-hero-notes" aria-hidden="true">
            <div className="login-hero-note">
              <span>▣</span>
              <span>1 天内无需重复输入密码</span>
            </div>
            <div className="login-hero-note">
              <span>▢</span>
              <span>会话信息由安全 Cookie 保存</span>
            </div>
          </div>
        </section>

        <section className="login-card" aria-label="账号登录">
          <div className="login-mode-badge">账号登录</div>
          <h2 className="login-title">欢迎回来</h2>
          <p className="login-subtitle">登录后本设备 1 天内可直接进入系统。</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label">
              <span>账号</span>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">□</span>
                <input
                  className="login-input"
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="请输入账号"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="login-label">
              <span>密码</span>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">◇</span>
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? '隐藏' : '显示'}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="login-option login-option--primary">
                <input type="checkbox" checked readOnly />
                <span>
                  <strong>1 天免输入密码</strong>
                  <small>适合个人常用设备；公共电脑请退出登录。</small>
                </span>
              </label>
              <label className="login-option">
                <input
                  type="checkbox"
                  checked={rememberAccount}
                  onChange={(e) => setRememberAccount(e.target.checked)}
                />
                <span>记住账号</span>
              </label>
            </div>

            {error ? <div className="login-message login-message--error">{error}</div> : null}

            <button type="submit" className="login-submit-btn" disabled={!canSubmit || submitting}>
              {submitting ? '登录中...' : '登录系统'}
            </button>

            <p className="login-footnote">授权人员方可访问，请妥善保管账号密码。</p>
          </form>
        </section>
      </div>
    </div>
  )
}

export default LoginPage

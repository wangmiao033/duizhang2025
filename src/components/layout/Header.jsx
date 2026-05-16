import React, { useState } from 'react'
import Calendar from '@/components/Calendar.jsx'
import NotificationCenter from '@/components/NotificationCenter.jsx'
import UserGuide from '@/components/UserGuide.jsx'
import Settings from '@/components/Settings.jsx'
import HelpTooltip from '@/components/HelpTooltip.jsx'
import MobileMenu from '@/components/MobileMenu.jsx'
import ConfirmDialog from '@/components/ConfirmDialog.jsx'
import { SIDEBAR_GROUPS } from '@/app/routes.js'
import { useAuth } from '@/features/auth/AuthContext.jsx'
import './Header.css'

function Header({ activeView, onNavigate, onSettingsChange }) {
  const { user, signOut, updateMyPassword } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submittingPassword, setSubmittingPassword] = useState(false)
  const closePasswordDialog = () => {
    setShowPasswordDialog(false)
    setPasswordError('')
    setCurrentPassword('')
    setNewPassword('')
    setSubmittingPassword(false)
  }

  const handlePasswordConfirm = async () => {
    if (submittingPassword) return
    if (!currentPassword.trim()) {
      setPasswordError('请输入当前密码')
      return
    }
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setPasswordError('新密码至少 6 位')
      return
    }
    setPasswordError('')
    setSubmittingPassword(true)
    try {
      await updateMyPassword(currentPassword, newPassword.trim())
      closePasswordDialog()
      window.alert('密码修改成功')
    } catch (err) {
      setPasswordError(`修改失败：${String(err?.message || err)}`)
    } finally {
      setSubmittingPassword(false)
    }
  }

  return (
    <header className="app-admin-header">
      <div className="app-admin-header__toolbar">
        <div className="app-admin-header__right">
          <div className="app-admin-header__mobile">
            <MobileMenu>
              <nav className="header-mobile-sidebar">
                {SIDEBAR_GROUPS.map((group) => (
                  <div key={group.id} className="header-mobile-group">
                    <div className="header-mobile-group-label">{group.label}</div>
                    {group.items.map((item) => (
                      <button
                        key={item.view}
                        type="button"
                        className={`header-mobile-item ${item.view === activeView ? 'active' : ''}`}
                        onClick={() => onNavigate?.(item.view)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </MobileMenu>
          </div>
          <Calendar
            compact={true}
            onDateSelect={(_date, dateStr) => {
              console.log('选择日期:', dateStr)
            }}
          />
          <label className="app-admin-header__search-wrap">
            <span className="visually-hidden">全局搜索</span>
            <input
              id="global-admin-search"
              type="search"
              className="admin-input app-admin-header__search"
              placeholder="全局搜索…"
              autoComplete="off"
            />
          </label>
          <NotificationCenter />
          <HelpTooltip />
          <Settings onSettingsChange={onSettingsChange} />
          <div className="app-admin-header__user-wrap">
            <button
              type="button"
              className="app-admin-header__user"
              title={user?.email || '用户'}
              aria-label="用户"
              onClick={() => setShowUserMenu((v) => !v)}
            >
              <span className="app-admin-header__user-dot" />
            </button>
            {showUserMenu ? (
              <div className="app-admin-header__user-menu">
                <div className="app-admin-header__user-email">{user?.email || '当前用户'}</div>
                <button
                  type="button"
                  className="app-admin-header__user-menu-item"
                  onClick={() => {
                    setShowUserMenu(false)
                    setShowPasswordDialog(true)
                  }}
                >
                  修改密码
                </button>
                <button
                  type="button"
                  className="app-admin-header__user-menu-item danger"
                  onClick={() => {
                    setShowUserMenu(false)
                    setShowLogoutDialog(true)
                  }}
                >
                  退出登录
                </button>
              </div>
            ) : null}
          </div>
          <UserGuide />
        </div>
      </div>
      <ConfirmDialog
        isOpen={showPasswordDialog}
        title="修改密码"
        message={
          <div className="app-admin-header__password-form">
            <label className="app-admin-header__password-label">
              <span>当前密码</span>
              <input
                className="admin-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="app-admin-header__password-label">
              <span>新密码</span>
              <input
                className="admin-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {passwordError ? <div className="app-admin-header__password-error">{passwordError}</div> : null}
          </div>
        }
        onConfirm={handlePasswordConfirm}
        onCancel={closePasswordDialog}
        confirmText={submittingPassword ? '提交中...' : '确认修改'}
        cancelText="取消"
      />
      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="退出登录"
        message="确认退出当前账号吗？"
        onConfirm={async () => {
          setShowLogoutDialog(false)
          await signOut()
        }}
        onCancel={() => setShowLogoutDialog(false)}
        confirmText="退出"
        cancelText="取消"
      />
    </header>
  )
}

export default Header

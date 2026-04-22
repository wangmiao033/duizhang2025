import React, { useMemo } from 'react'
import Calendar from '@/components/Calendar.jsx'
import NotificationCenter from '@/components/NotificationCenter.jsx'
import ThemeToggle from '@/components/ThemeToggle.jsx'
import UserGuide from '@/components/UserGuide.jsx'
import Settings from '@/components/Settings.jsx'
import HelpTooltip from '@/components/HelpTooltip.jsx'
import MobileMenu from '@/components/MobileMenu.jsx'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb.jsx'
import { SIDEBAR_GROUPS, getBreadcrumb, getPageMeta } from '@/app/routes.js'
import { useAuth } from '@/features/auth/AuthContext.jsx'
import './Header.css'

function Header({ activeView, onNavigate, onSettingsChange }) {
  const { user, signOut, updateMyPassword } = useAuth()
  const breadcrumb = useMemo(() => getBreadcrumb(activeView), [activeView])
  const meta = useMemo(() => getPageMeta(activeView), [activeView])

  return (
    <header className="app-admin-header">
      <div className="app-admin-header__toolbar">
        <div className="app-admin-header__left">
          <AdminBreadcrumb items={breadcrumb} onNavigate={onNavigate} />
          <div className="app-admin-header__titles">
            <h1 className="app-admin-header__title">{meta.title}</h1>
            <p className="app-admin-header__desc">{meta.description}</p>
          </div>
        </div>
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
          <Settings onSettingsChange={onSettingsChange} />
          <HelpTooltip />
          <UserGuide />
          <ThemeToggle />
          <button
            type="button"
            className="app-admin-header__user"
            title={user?.email || '用户'}
            aria-label="用户"
            onClick={async () => {
              const action = window.prompt('输入 1 修改密码；输入 2 退出登录')
              if (action === '1') {
                const current = window.prompt('请输入当前密码')
                if (!current) return
                const next = window.prompt('请输入新密码（至少6位）')
                if (!next || next.trim().length < 6) return
                try {
                  await updateMyPassword(current, next.trim())
                  window.alert('密码修改成功')
                } catch (err) {
                  window.alert(`修改失败：${String(err?.message || err)}`)
                }
              }
              if (action === '2') {
                await signOut()
              }
            }}
          >
            <span className="app-admin-header__user-dot" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

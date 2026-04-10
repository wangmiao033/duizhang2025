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
import './Header.css'

function Header({ activeView, onNavigate, onSettingsChange }) {
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
          <button type="button" className="app-admin-header__user" title="用户" aria-label="用户">
            <span className="app-admin-header__user-dot" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

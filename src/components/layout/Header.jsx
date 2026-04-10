import React from 'react'
import Calendar from '@/components/Calendar.jsx'
import NotificationCenter from '@/components/NotificationCenter.jsx'
import ThemeToggle from '@/components/ThemeToggle.jsx'
import UserGuide from '@/components/UserGuide.jsx'
import Settings from '@/components/Settings.jsx'
import HelpTooltip from '@/components/HelpTooltip.jsx'
import MobileMenu from '@/components/MobileMenu.jsx'
import { SIDEBAR_GROUPS } from '@/app/routes.js'
import './Header.css'

function Header({ activeView, onNavigate, onSettingsChange }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <h1>对账管理系统</h1>
          <p>生成标准格式的对账单</p>
        </div>
        <div className="header-actions">
          <div className="header-mobile-nav">
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
                        onClick={() => onNavigate && onNavigate(item.view)}
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
            onDateSelect={(date, dateStr) => {
              console.log('选择日期:', dateStr)
            }}
          />
          <NotificationCenter />
          <ThemeToggle />
          <UserGuide />
          <Settings onSettingsChange={onSettingsChange} />
          <HelpTooltip />
        </div>
      </div>
    </header>
  )
}

export default Header

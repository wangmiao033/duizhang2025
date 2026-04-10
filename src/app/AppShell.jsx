import React from 'react'
import Header from '@/components/layout/Header.jsx'
import Sidebar from '@/components/layout/Sidebar.jsx'
import './AppShell.css'

/**
 * 标准后台骨架：左侧固定导航 + 右侧（顶栏 + 全宽工作区）
 * 不再使用「整页居中大白盒」包裹。
 */
function AppShell({ activeView, onNavigate, onSettingsChange, children }) {
  return (
    <div className="app">
      <div className="app-dashboard">
        <Sidebar activeView={activeView} onNavigate={onNavigate} />
        <div className="app-main-shell">
          <Header activeView={activeView} onNavigate={onNavigate} onSettingsChange={onSettingsChange} />
          <main className="app-workspace">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default AppShell

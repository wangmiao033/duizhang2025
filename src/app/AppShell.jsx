import React from 'react'
import Header from '@/components/layout/Header.jsx'
import Sidebar from '@/components/layout/Sidebar.jsx'
import { ADMIN_GRAY_MAIN_VIEWS } from '@/app/routes.js'
import './AppShell.css'

function AppShell({ activeView, onNavigate, onSettingsChange, children }) {
  const mainClass = ADMIN_GRAY_MAIN_VIEWS.has(activeView)
    ? 'app-main app-main--rd-recon'
    : 'app-main'

  return (
    <div className="app">
      <Header activeView={activeView} onNavigate={onNavigate} onSettingsChange={onSettingsChange} />
      <div className="app-shell">
        <Sidebar activeView={activeView} onNavigate={onNavigate} />
        <main className={mainClass}>{children}</main>
      </div>
    </div>
  )
}

export default AppShell

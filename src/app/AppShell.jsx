import React from 'react'
import Header from '@/components/layout/Header.jsx'
import Sidebar from '@/components/layout/Sidebar.jsx'
import './AppShell.css'

function AppShell({ activeView, onNavigate, onSettingsChange, children }) {
  return (
    <div className="app">
      <Header activeView={activeView} onNavigate={onNavigate} onSettingsChange={onSettingsChange} />
      <div className="app-shell">
        <Sidebar activeView={activeView} onNavigate={onNavigate} />
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}

export default AppShell

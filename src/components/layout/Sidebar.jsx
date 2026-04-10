import React from 'react'
import { SIDEBAR_GROUPS } from '@/app/routes.js'
import './Sidebar.css'

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="app-sidebar" aria-label="主导航">
      <div className="app-sidebar-inner">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.id} className="sidebar-group">
            <div className="sidebar-group-label">{group.label}</div>
            <div className="sidebar-group-items">
              {group.items.map((item) => {
                const isActive = item.view === activeView
                return (
                  <button
                    key={item.view}
                    type="button"
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => onNavigate && onNavigate(item.view)}
                  >
                    <span className="sidebar-item-label">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar

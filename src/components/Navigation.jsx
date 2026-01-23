import React from 'react'
import './Navigation.css'

function Navigation({ items = [], activeTab, onChange }) {
  return (
    <nav className="nav-bar">
      <div className="nav-items">
        {items.map((item) => {
          const isActive = item.key === activeTab
          return (
            <button
              key={item.key}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onChange && onChange(item.key)}
            >
              <span className="nav-label">{item.label}</span>
              {isActive && <span className="nav-active-indicator" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default Navigation

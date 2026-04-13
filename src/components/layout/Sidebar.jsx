import React, { useEffect, useMemo, useState } from 'react'
import { SIDEBAR_GROUPS, VIEW_ICONS } from '@/app/routes.js'
import './Sidebar.css'

function findGroupIdForView(view) {
  const g = SIDEBAR_GROUPS.find((gr) => gr.items.some((i) => i.view === view))
  return g?.id ?? 'workbench'
}

function Sidebar({ activeView, onNavigate }) {
  const activeGroupId = useMemo(() => findGroupIdForView(activeView), [activeView])
  const [expandedId, setExpandedId] = useState(activeGroupId)

  useEffect(() => {
    setExpandedId(activeGroupId)
  }, [activeGroupId])

  const toggleGroup = (groupId) => {
    setExpandedId((cur) => (cur === groupId ? cur : groupId))
  }

  const renderItems = (group) => (
    <div className="sidebar-sub-list">
      {group.items.map((item) => {
        const isActive = item.view === activeView
        return (
          <button
            key={item.view}
            type="button"
            className={`sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => onNavigate && onNavigate(item.view)}
          >
            <span className="sidebar-item-icon" aria-hidden>
              {VIEW_ICONS[item.view] || '·'}
            </span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <aside className="app-sidebar" aria-label="主导航">
      <div className="app-sidebar-inner">
        {SIDEBAR_GROUPS.map((group) => {
          const isSingleton = group.items.length === 1
          const open = isSingleton || expandedId === group.id
          const groupActive = activeGroupId === group.id

          if (isSingleton) {
            return (
              <div key={group.id} className="sidebar-group sidebar-group--singleton">
                {renderItems(group)}
              </div>
            )
          }

          return (
            <div key={group.id} className={`sidebar-group ${groupActive ? 'active' : ''}`}>
              <button
                type="button"
                className="sidebar-group-toggle"
                aria-expanded={open}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="sidebar-group-title">{group.label}</div>
                <span className={`sidebar-group-chevron ${open ? 'is-open' : ''}`} aria-hidden />
              </button>
              {open && renderItems(group)}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar

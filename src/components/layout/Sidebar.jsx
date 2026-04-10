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

  return (
    <aside className="app-sidebar" aria-label="主导航">
      <div className="app-sidebar-inner">
        {SIDEBAR_GROUPS.map((group) => {
          const open = expandedId === group.id
          return (
            <div key={group.id} className="sidebar-group">
              <button
                type="button"
                className={`sidebar-group-header ${open ? 'is-open' : ''}`}
                aria-expanded={open}
                onClick={() => toggleGroup(group.id)}
              >
                <span className="sidebar-group-header-label">{group.label}</span>
                <span className="sidebar-group-chevron" aria-hidden>
                  {open ? '\u25be' : '\u25b8'}
                </span>
              </button>
              {open && (
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
                        <span className="sidebar-item-icon" aria-hidden>
                          {VIEW_ICONS[item.view] || '·'}
                        </span>
                        <span className="sidebar-item-label">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar

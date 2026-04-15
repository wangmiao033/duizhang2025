import React, { useEffect, useMemo, useState } from 'react'
import {
  SIDEBAR_GROUPS,
  VIEW_ICONS,
  getPageTitle,
  isSidebarTrackableView
} from '@/app/routes.js'
import {
  addFavoriteView,
  mergeRecentViews,
  readFavoriteViews,
  readRecentViews,
  removeFavoriteView,
  writeFavoriteViews,
  writeRecentViews
} from '@/utils/sidebarShortcutsStorage.js'
import './Sidebar.css'

function findGroupIdForView(view) {
  const g = SIDEBAR_GROUPS.find((gr) => gr.items.some((i) => i.view === view))
  return g?.id ?? 'workbench'
}

function sanitizeTrackable(list) {
  return list.filter((v) => isSidebarTrackableView(v))
}

function StarOutline({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        d="M11.48 3.5a.56.56 0 011.04 0l2.13 5.11c.1.24.32.41.57.45l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.28 5.38c.13.55-.48.98-.98.69l-4.73-2.55a.57.57 0 00-.54 0L6.98 20.5a.56.56 0 01-.98-.69l1.28-5.38a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.47-.35l2.13-5.11z"
      />
    </svg>
  )
}

function StarFilled({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M11.48 3.5a.56.56 0 011.04 0l2.13 5.11c.1.24.32.41.57.45l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.28 5.38c.13.55-.48.98-.98.69l-4.73-2.55a.57.57 0 00-.54 0L6.98 20.5a.56.56 0 01-.98-.69l1.28-5.38a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.47-.35l2.13-5.11z"
      />
    </svg>
  )
}

function Sidebar({ activeView, onNavigate }) {
  const activeGroupId = useMemo(() => findGroupIdForView(activeView), [activeView])
  const [expandedId, setExpandedId] = useState(activeGroupId)
  const [recentViews, setRecentViews] = useState(() => sanitizeTrackable(readRecentViews()))
  const [favoriteViews, setFavoriteViews] = useState(() => sanitizeTrackable(readFavoriteViews()))
  /** 最近访问默认收起，避免挤占主导航；展开后最多展示 2 条 */
  const [recentSectionOpen, setRecentSectionOpen] = useState(false)

  useEffect(() => {
    setExpandedId(activeGroupId)
  }, [activeGroupId])

  const toggleGroup = (groupId) => {
    setExpandedId((cur) => (cur === groupId ? cur : groupId))
  }

  useEffect(() => {
    if (!isSidebarTrackableView(activeView)) return
    setRecentViews((prev) => {
      const next = mergeRecentViews(prev, activeView)
      writeRecentViews(next)
      return next
    })
  }, [activeView])

  const favoriteSet = useMemo(() => new Set(favoriteViews), [favoriteViews])
  const recentDisplay = useMemo(
    () => sanitizeTrackable(recentViews).filter((v) => !favoriteSet.has(v)),
    [recentViews, favoriteSet]
  )
  const recentDisplayLimited = useMemo(() => recentDisplay.slice(0, 2), [recentDisplay])

  const addFavorite = (view) => {
    if (!isSidebarTrackableView(view)) return
    setFavoriteViews((prev) => {
      const next = addFavoriteView(prev, view)
      writeFavoriteViews(next)
      return next
    })
  }

  const removeFavorite = (view) => {
    setFavoriteViews((prev) => {
      const next = removeFavoriteView(prev, view)
      writeFavoriteViews(next)
      return next
    })
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

  const renderShortcutRow = (view, { mode }) => {
    const isActive = view === activeView
    const label = getPageTitle(view)
    const go = () => onNavigate && onNavigate(view)
    return (
      <div
        key={`${mode}-${view}`}
        role="button"
        tabIndex={0}
        className={`sidebar-item sidebar-item--shortcut ${isActive ? 'active' : ''}`}
        onClick={go}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            go()
          }
        }}
      >
        <span className="sidebar-item-icon" aria-hidden>
          {VIEW_ICONS[view] || '·'}
        </span>
        <span className="sidebar-item-label">{label}</span>
        <span className="sidebar-item-actions">
          {mode === 'favorite' && (
            <>
              <StarFilled className="sidebar-shortcut-svg sidebar-shortcut-svg--pinned" aria-hidden />
              <button
                type="button"
                className="sidebar-shortcut-remove"
                aria-label="取消收藏"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeFavorite(view)
                }}
              >
                移除
              </button>
            </>
          )}
          {mode === 'recent' && (
            <button
              type="button"
              className="sidebar-shortcut-add"
              aria-label="加入常用入口"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addFavorite(view)
              }}
            >
              <StarOutline className="sidebar-shortcut-svg" />
            </button>
          )}
        </span>
      </div>
    )
  }

  return (
    <aside className="app-sidebar" aria-label="主导航">
      <div className="app-sidebar-inner">
        <div className="sidebar-brand">
          <div className="sidebar-brand__title">对账管理系统</div>
          <div className="sidebar-brand__subtitle">财务后台</div>
        </div>

        <div className="sidebar-shortcuts">
          {favoriteViews.length > 0 && (
            <div className="sidebar-shortcuts-block">
              <div className="sidebar-group-title sidebar-group-title--static">常用入口</div>
              <div className="sidebar-sub-list sidebar-sub-list--shortcuts">
                {favoriteViews.map((view) => renderShortcutRow(view, { mode: 'favorite' }))}
              </div>
            </div>
          )}
          {recentDisplay.length > 0 && (
            <div className="sidebar-shortcuts-block">
              <button
                type="button"
                className="sidebar-recent-toggle"
                aria-expanded={recentSectionOpen}
                onClick={() => setRecentSectionOpen((v) => !v)}
              >
                <div className="sidebar-group-title sidebar-group-title--static sidebar-group-title--in-toggle">
                  最近访问
                </div>
                <span
                  className={`sidebar-group-chevron sidebar-group-chevron--recent ${recentSectionOpen ? 'is-open' : ''}`}
                  aria-hidden
                />
              </button>
              {recentSectionOpen && (
                <div className="sidebar-sub-list sidebar-sub-list--shortcuts">
                  {recentDisplayLimited.map((view) => renderShortcutRow(view, { mode: 'recent' }))}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="功能分组">
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
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar

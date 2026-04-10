import React from 'react'

/**
 * @param {{ label: string, view?: string, current?: boolean }[]} items
 * @param {(view: string) => void} [onNavigate]
 */
function AdminBreadcrumb({ items = [], onNavigate }) {
  return (
    <nav className="admin-breadcrumb" aria-label="面包屑">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="admin-breadcrumb__segment">
          {i > 0 ? <span className="admin-breadcrumb__sep" aria-hidden> / </span> : null}
          {item.view ? (
            <button type="button" className="admin-breadcrumb__link" onClick={() => onNavigate?.(item.view)}>
              {item.label}
            </button>
          ) : item.current ? (
            <span className="admin-breadcrumb__current">{item.label}</span>
          ) : (
            <span className="admin-breadcrumb__muted">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export default AdminBreadcrumb

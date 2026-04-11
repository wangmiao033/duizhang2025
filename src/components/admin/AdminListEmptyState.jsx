import React from 'react'

/**
 * 列表空态：全站统一图标、标题、说明与操作按钮（仅展示层，无业务逻辑）
 */
function AdminListEmptyState({
  icon = '\uD83D\uDCCB',
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = 'default',
  className = ''
}) {
  const rootClass = ['admin-list-empty', variant === 'inline' ? 'admin-list-empty--inline' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} role="status">
      <div className="admin-list-empty__icon" aria-hidden>
        {icon}
      </div>
      <div className="admin-list-empty__text">
        <p className="admin-list-empty__title">{title}</p>
        {description ? <p className="admin-list-empty__desc">{description}</p> : null}
      </div>
      {primaryAction || secondaryAction ? (
        <div className="admin-list-empty__actions">
          {secondaryAction ? (
            <button type="button" className="admin-btn admin-btn--secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          ) : null}
          {primaryAction ? (
            <button type="button" className="admin-btn admin-btn--primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default AdminListEmptyState

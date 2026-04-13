import React from 'react'
import './PageContainer.css'

/** hideHeader：与 AppShell 顶栏（面包屑+标题+说明）同时使用时设为 true，避免重复页头。 */
function PageContainer({ title, description, actions, filters, children, hideHeader = false, className = '' }) {
  return (
    <div className={`page-container ${className}`.trim()}>
      {!hideHeader && (title || actions) && (
        <div className="page-container-header">
          <div className="page-container-titles">
            {title && <h2 className="page-container-title">{title}</h2>}
            {description && <p className="page-container-desc">{description}</p>}
          </div>
          {actions && <div className="page-container-actions">{actions}</div>}
        </div>
      )}
      {filters && <div className="page-container-filters">{filters}</div>}
      <div className="page-container-body">{children}</div>
    </div>
  )
}

export default PageContainer

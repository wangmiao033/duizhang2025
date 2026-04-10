import React from 'react'
import './PageContainer.css'

function PageContainer({ title, description, actions, filters, children }) {
  return (
    <div className="page-container">
      {(title || actions) && (
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

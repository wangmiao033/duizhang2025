import React from 'react'

function ReconciliationPageHeader({ title, description, actions }) {
  return (
    <header className="rec-page-header">
      <div className="rec-page-header__titles">
        <h1 className="rec-page-header__title">{title}</h1>
        <p className="rec-page-header__desc">{description}</p>
      </div>
      {actions ? <div className="rec-page-header__actions">{actions}</div> : null}
    </header>
  )
}

export default ReconciliationPageHeader

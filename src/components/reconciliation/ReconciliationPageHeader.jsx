import React from 'react'

function ReconciliationPageHeader({ title, description }) {
  return (
    <header className="rec-page-header">
      <div className="rec-page-header__titles">
        <h1 className="rec-page-header__title">{title}</h1>
        <p className="rec-page-header__desc">{description}</p>
      </div>
    </header>
  )
}

export default ReconciliationPageHeader

import React from 'react'

function AdminPageSection({ title, children, className = '' }) {
  return (
    <section className={`admin-page-section ${className}`.trim()}>
      {title ? <h2 className="admin-page-section__title">{title}</h2> : null}
      {children}
    </section>
  )
}

export default AdminPageSection

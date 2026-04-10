import React from 'react'

function AdminTableCard({ children, className = '' }) {
  return (
    <div className={`admin-table-card ${className}`.trim()}>
      <div className="admin-table-card__body">{children}</div>
    </div>
  )
}

export default AdminTableCard

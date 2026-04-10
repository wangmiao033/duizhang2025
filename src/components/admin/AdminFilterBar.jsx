import React from 'react'

function AdminFilterBar({ children, className = '' }) {
  return <div className={`admin-filter-bar ${className}`.trim()}>{children}</div>
}

export default AdminFilterBar

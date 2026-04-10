import React from 'react'

function AdminActionBar({ children, className = '' }) {
  return <div className={`admin-action-bar ${className}`.trim()}>{children}</div>
}

export default AdminActionBar

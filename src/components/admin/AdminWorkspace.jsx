import React from 'react'

function AdminWorkspace({ children, className = '' }) {
  return <div className={`admin-workspace ${className}`.trim()}>{children}</div>
}

export default AdminWorkspace

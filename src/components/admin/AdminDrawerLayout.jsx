import React from 'react'

function AdminDrawerLayout({ children, className = '' }) {
  return <aside className={`admin-drawer-surface ${className}`.trim()}>{children}</aside>
}

export default AdminDrawerLayout

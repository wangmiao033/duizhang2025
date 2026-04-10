import React from 'react'

function AdminStatsRow({ children, className = '' }) {
  return <div className={`admin-stats-row ${className}`.trim()}>{children}</div>
}

export default AdminStatsRow

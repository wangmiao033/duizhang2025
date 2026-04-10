import React, { useMemo } from 'react'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb.jsx'
import { getBreadcrumb, getPageMeta } from '@/app/routes.js'

/**
 * 业务页内页头：与全局顶栏信息一致，供 PageContainer hideHeader 或双栏布局复用
 */
function AdminHeader({ view, onNavigate, className = '' }) {
  const breadcrumb = useMemo(() => getBreadcrumb(view), [view])
  const meta = useMemo(() => getPageMeta(view), [view])

  return (
    <header className={`admin-page-header ${className}`.trim()}>
      <AdminBreadcrumb items={breadcrumb} onNavigate={onNavigate} />
      <h1 className="admin-page-header__title">{meta.title}</h1>
      <p className="admin-page-header__desc">{meta.description}</p>
    </header>
  )
}

export default AdminHeader

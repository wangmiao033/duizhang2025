import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'

function InvoiceFormPageLayout({ toolsSlot, previewAmount, previewLabel = '开票金额(元)', footerActions, children }) {
  return (
    <PageContainer hideHeader className="page-container--admin-workspace page-container--invoice-form">
      <div className="admin-workspace rec-form-page">
        {toolsSlot ? (
          <section className="admin-workspace__card rec-form-page__tools-card">
            <h3 className="admin-workspace__card-title">工具与快捷录入</h3>
            <div className="rec-create-tools">{toolsSlot}</div>
          </section>
        ) : null}
        <div className="rec-form-page__form-wrap">{children}</div>
        <div className="rec-create-footer">
          <div className="rec-create-footer__preview">
            <span className="rec-create-footer__preview-label">{previewLabel}</span>
            <span className="rec-create-footer__preview-value">¥{previewAmount.toFixed(2)}</span>
          </div>
          <div className="rec-create-footer__actions">{footerActions}</div>
        </div>
      </div>
    </PageContainer>
  )
}

export default InvoiceFormPageLayout

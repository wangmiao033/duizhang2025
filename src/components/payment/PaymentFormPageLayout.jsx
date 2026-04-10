import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'

function PaymentFormPageLayout({ toolsSlot, footerSummary, footerActions, children }) {
  return (
    <PageContainer hideHeader className="page-container--admin-workspace page-container--payment-form">
      <div className="admin-workspace rec-form-page">
        {toolsSlot ? (
          <section className="admin-workspace__card rec-form-page__tools-card">
            <h3 className="admin-workspace__card-title">工具区（预留）</h3>
            <div className="rec-create-tools">{toolsSlot}</div>
          </section>
        ) : null}
        <div className="rec-form-page__form-wrap">{children}</div>
        <div className="rec-create-footer">
          {footerSummary ? (
            <div className="rec-create-footer__preview">
              <span className="rec-create-footer__preview-label">{footerSummary.label}</span>
              <span className="rec-create-footer__preview-value">{footerSummary.value}</span>
            </div>
          ) : (
            <div className="rec-create-footer__preview" />
          )}
          <div className="rec-create-footer__actions">{footerActions}</div>
        </div>
      </div>
    </PageContainer>
  )
}

export default PaymentFormPageLayout

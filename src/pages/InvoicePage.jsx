import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import InvoiceManageWorkspace from '@/components/invoice/InvoiceManageWorkspace.jsx'
import PaymentRegisterWorkspace from '@/components/payment/PaymentRegisterWorkspace.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/invoice/invoice-admin.css'

function InvoicePage({ section }) {
  if (section === VIEWS.INVOICE_PAYMENT) {
    return (
      <PageContainer hideHeader className="page-container--recon-rd">
        <PaymentRegisterWorkspace />
      </PageContainer>
    )
  }

  return (
    <PageContainer hideHeader className="page-container--recon-rd">
      <InvoiceManageWorkspace
        variant={section === VIEWS.INVOICE_VERIFY ? 'verify' : 'manage'}
        direction={section === VIEWS.INVOICE_INPUT ? 'input' : 'output'}
      />
    </PageContainer>
  )
}

export default InvoicePage

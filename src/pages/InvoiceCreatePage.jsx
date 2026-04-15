import React, { useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import InvoiceFormPageLayout from '@/components/invoice/InvoiceFormPageLayout.jsx'
import InvoiceForm from '@/components/invoice/InvoiceForm.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'
import '@/components/invoice/invoice-admin.css'

const FORM_ID = 'invoice-create-form'

function InvoiceCreatePage() {
  const { invoice, showToast, setActiveView } = useAppState()
  const { submitInvoiceFromForm } = invoice

  const submitIntentRef = useRef('back')
  const [previewAmount, setPreviewAmount] = useState(0)

  const goList = () => setActiveView(VIEWS.INVOICE_MANAGE)

  const handleAfterSubmit = (intent) => {
    if (intent !== 'continue') {
      goList()
    }
  }

  return (
    <InvoiceFormPageLayout
      toolsSlot={
        <p className="admin-workspace__card-desc" style={{ margin: 0 }}>
          先在下方“粘贴发票文本自动识别”中粘贴税务系统文本，再做人工校对与保存。
        </p>
      }
      previewAmount={previewAmount}
      footerActions={
        <>
          <button type="button" className="rec-btn rec-btn--ghost" onClick={goList}>
            返回列表
          </button>
          <button
            type="button"
            className="rec-btn rec-btn--secondary"
            onClick={() => {
              submitIntentRef.current = 'continue'
              document.getElementById(FORM_ID)?.requestSubmit()
            }}
          >
            保存并继续新增
          </button>
          <button
            type="button"
            className="rec-btn rec-btn--primary"
            onClick={() => {
              submitIntentRef.current = 'back'
              document.getElementById(FORM_ID)?.requestSubmit()
            }}
          >
            保存
          </button>
        </>
      }
    >
      <InvoiceForm
        formId={FORM_ID}
        mode="add"
        seedFromStore
        submitIntentRef={submitIntentRef}
        submitInvoiceFromForm={submitInvoiceFromForm}
        onAfterSubmit={handleAfterSubmit}
        onPreviewChange={setPreviewAmount}
        showToast={showToast}
      />
    </InvoiceFormPageLayout>
  )
}

export default InvoiceCreatePage

import React, { useMemo, useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import InvoiceFormPageLayout from '@/components/invoice/InvoiceFormPageLayout.jsx'
import InvoiceForm from '@/components/invoice/InvoiceForm.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'
import '@/components/invoice/invoice-admin.css'

const FORM_ID = 'invoice-edit-form'

function InvoiceEditPage() {
  const { invoice, showToast, setActiveView, invoiceEditId } = useAppState()
  const { invoiceRecords, submitInvoiceFromForm } = invoice

  const submitIntentRef = useRef('back')
  const [previewAmount, setPreviewAmount] = useState(0)

  const editRecord = useMemo(
    () => (invoiceEditId != null ? invoiceRecords.find((r) => r.id === invoiceEditId) : null),
    [invoiceRecords, invoiceEditId]
  )

  const goList = () => setActiveView(VIEWS.INVOICE_MANAGE)

  const handleAfterSubmit = () => {
    goList()
  }

  if (invoiceEditId == null) {
    return (
      <InvoiceFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">请从发票管理列表选择记录并点击「编辑」进入本页。</p>
        </div>
      </InvoiceFormPageLayout>
    )
  }

  if (!editRecord) {
    return (
      <InvoiceFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <h3 className="admin-workspace__card-title">未找到发票</h3>
          <p className="admin-workspace__card-desc">数据可能已删除（id: {invoiceEditId}）。</p>
        </div>
      </InvoiceFormPageLayout>
    )
  }

  return (
    <InvoiceFormPageLayout
      toolsSlot={
        <p className="admin-workspace__card-desc" style={{ margin: 0 }}>
          核销请在列表中操作；编辑保存后返回发票管理。
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
        mode="edit"
        sourceRecord={editRecord}
        submitIntentRef={submitIntentRef}
        submitInvoiceFromForm={submitInvoiceFromForm}
        onAfterSubmit={handleAfterSubmit}
        onPreviewChange={setPreviewAmount}
        showToast={showToast}
      />
    </InvoiceFormPageLayout>
  )
}

export default InvoiceEditPage

import React, { useMemo, useRef } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PaymentFormPageLayout from '@/components/payment/PaymentFormPageLayout.jsx'
import PaymentForm from '@/components/payment/PaymentForm.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'payment-edit-form'

function PaymentEditPage() {
  const { settings, showToast, setActiveView, paymentEditId } = useAppState()
  const { partners, deliveries, setDeliveries } = settings

  const submitIntentRef = useRef('back')

  const editRecord = useMemo(
    () => (paymentEditId != null ? deliveries.find((d) => d.id === paymentEditId) : null),
    [deliveries, paymentEditId]
  )

  const goList = () => setActiveView(VIEWS.INVOICE_PAYMENT)

  const handleAfterSubmit = () => {
    goList()
  }

  if (paymentEditId == null) {
    return (
      <PaymentFormPageLayout
        toolsSlot={null}
        footerSummary={null}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">请从回款登记列表选择记录并点击「编辑」进入本页。</p>
        </div>
      </PaymentFormPageLayout>
    )
  }

  if (!editRecord) {
    return (
      <PaymentFormPageLayout
        toolsSlot={null}
        footerSummary={null}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <h3 className="admin-workspace__card-title">未找到记录</h3>
          <p className="admin-workspace__card-desc">数据可能已删除（id: {paymentEditId}）。</p>
        </div>
      </PaymentFormPageLayout>
    )
  }

  return (
    <PaymentFormPageLayout
      toolsSlot={
        <span className="admin-workspace__card-desc" style={{ margin: 0 }}>
          编辑保存后返回列表；数据写入 deliveries，与旧版一致。
        </span>
      }
      footerSummary={{ label: '编辑单号', value: editRecord.trackingNumber || '（待寄出）' }}
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
      <PaymentForm
        formId={FORM_ID}
        mode="edit"
        sourceRecord={editRecord}
        partners={partners}
        deliveries={deliveries}
        onDeliveriesChange={setDeliveries}
        submitIntentRef={submitIntentRef}
        onAfterSubmit={handleAfterSubmit}
        onSaved={() => showToast('快递记录已更新', 'success')}
        showToast={showToast}
      />
    </PaymentFormPageLayout>
  )
}

export default PaymentEditPage

import React, { useRef } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PaymentFormPageLayout from '@/components/payment/PaymentFormPageLayout.jsx'
import PaymentForm from '@/components/payment/PaymentForm.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'payment-create-form'

function PaymentCreatePage() {
  const { settings, showToast, setActiveView } = useAppState()
  const { partners, deliveries, persistDelivery } = settings

  const submitIntentRef = useRef('back')

  const goList = () => setActiveView(VIEWS.INVOICE_PAYMENT)

  const handleAfterSubmit = (intent) => {
    if (intent !== 'continue') {
      goList()
    }
  }

  return (
    <PaymentFormPageLayout
      toolsSlot={
        <span className="admin-workspace__card-desc" style={{ margin: 0 }}>
          回款登记数据仍写入历史「快递/寄送」台账（deliveries），行为与旧版一致。
        </span>
      }
      footerSummary={{ label: '当前台账总条数', value: `${deliveries.length} 条` }}
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
      <PaymentForm
        formId={FORM_ID}
        mode="add"
        partners={partners}
        persistDelivery={persistDelivery}
        submitIntentRef={submitIntentRef}
        onAfterSubmit={handleAfterSubmit}
        onSaved={() => showToast('快递记录已更新', 'success')}
        showToast={showToast}
      />
    </PaymentFormPageLayout>
  )
}

export default PaymentCreatePage

import React, { useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import ChannelFormPageLayout from '@/components/channel/ChannelFormPageLayout.jsx'
import ChannelBillingForm from '@/components/channel/ChannelBillingForm.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'channel-reconciliation-create-form'

const TOOLS_PLACEHOLDER = (
  <span className="admin-workspace__card-desc" style={{ margin: 0 }}>
    渠道模板与快速填充预留，后续可与研发对账对齐；当前请使用下方完整表单录入。
  </span>
)

function ChannelReconciliationCreatePage() {
  const { recon, showToast, setActiveView } = useAppState()
  const { onChannelAddRecord } = recon

  const submitIntentRef = useRef('back')
  const [previewAmount, setPreviewAmount] = useState(0)

  const goList = () => setActiveView(VIEWS.RECON_CHANNEL)

  const handleAfterSubmit = (intent) => {
    if (intent !== 'continue') {
      goList()
    }
  }

  return (
    <ChannelFormPageLayout
      toolsSlot={TOOLS_PLACEHOLDER}
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
      <ChannelBillingForm
        formId={FORM_ID}
        mode="add"
        onAddRecord={onChannelAddRecord}
        submitIntentRef={submitIntentRef}
        onAfterSubmit={handleAfterSubmit}
        onPreviewChange={setPreviewAmount}
        onError={(msg) => showToast(msg, 'error')}
      />
    </ChannelFormPageLayout>
  )
}

export default ChannelReconciliationCreatePage

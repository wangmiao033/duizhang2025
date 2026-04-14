import React, { useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import ReconciliationLineItemsForm from '@/components/reconciliation/ReconciliationLineItemsForm.jsx'
import QuickFill from '@/components/QuickFill.jsx'
import TemplatePresets from '@/components/TemplatePresets.jsx'
import ReconciliationFormPageLayout from '@/components/reconciliation/ReconciliationFormPageLayout.jsx'
import { showNotification } from '@/components/NotificationCenter.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'reconciliation-create-form'

function ReconciliationCreatePage() {
  const { recon, settings, showToast, setActiveView } = useAppState()
  const { addRecord, handleApplyTemplate, quickFillData, setQuickFillData } = recon
  const { settlementMonth, partners, setPartners } = settings

  const submitIntentRef = useRef('back')
  const [previewAmount, setPreviewAmount] = useState(0)

  const goList = () => setActiveView(VIEWS.RECON_RD)

  const onTemplateApply = (template) => {
    handleApplyTemplate(template)
    setQuickFillData((prev) => ({
      ...(prev && typeof prev === 'object' ? prev : {}),
      channelFeeRate: template.channelFeeRate,
      taxPoint: template.taxPoint,
      revenueShareRatio: template.revenueShareRatio,
      discount: template.discount,
      ...(template.testingFee != null ? { testingFee: String(template.testingFee) } : {})
    }))
  }

  const handleSubmitted = (intent) => {
    if (intent === 'continue') {
      showToast('已保存，可继续录入下一条', 'success')
      return
    }
    goList()
  }

  return (
    <ReconciliationFormPageLayout
      toolsSlot={
        <>
          <QuickFill
            onFill={(data) => {
              setQuickFillData(data)
              showNotification('快速填充模板已应用', 'success')
            }}
          />
          <TemplatePresets onApplyTemplate={onTemplateApply} />
        </>
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
      <ReconciliationLineItemsForm
        formId={FORM_ID}
        layout="createPage"
        mode="add"
        showSubmitButton={false}
        submitIntentRef={submitIntentRef}
        onPreviewChange={setPreviewAmount}
        onSubmitted={handleSubmitted}
        onAddRecord={addRecord}
        settlementMonth={settlementMonth}
        onError={(msg) => showToast(msg, 'error')}
        quickFillData={quickFillData}
        partners={partners}
        onAddPartner={(name) => {
          const newPartner = {
            id: Date.now(),
            name,
            category: '游戏研发商',
            tag2: '',
            createdAt: new Date().toISOString()
          }
          setPartners([...partners, newPartner])
          showToast(`客户"${name}"已添加到客户库`, 'success')
        }}
      />
    </ReconciliationFormPageLayout>
  )
}

export default ReconciliationCreatePage

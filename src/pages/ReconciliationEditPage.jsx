import React, { useMemo, useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import DataForm from '@/components/DataForm.jsx'
import QuickFill from '@/components/QuickFill.jsx'
import TemplatePresets from '@/components/TemplatePresets.jsx'
import ReconciliationFormPageLayout from '@/components/reconciliation/ReconciliationFormPageLayout.jsx'
import { showNotification } from '@/components/NotificationCenter.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'reconciliation-edit-form'

function ReconciliationEditPage() {
  const { recon, settings, showToast, setActiveView, reconEditRecordId } = useAppState()
  const { records, updateRecord, handleApplyTemplate, quickFillData, setQuickFillData } = recon
  const { settlementMonth, partners, setPartners } = settings

  const submitIntentRef = useRef('back')
  const [previewAmount, setPreviewAmount] = useState(0)

  const editRecord = useMemo(
    () => (reconEditRecordId != null ? records.find((r) => r.id === reconEditRecordId) : null),
    [records, reconEditRecordId]
  )

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

  const handleSubmitted = () => {
    showToast('记录已保存', 'success')
    goList()
  }

  if (reconEditRecordId == null) {
    return (
      <ReconciliationFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回研发对账列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">请从研发对账列表中选择一条记录，点击「编辑」进入本页。</p>
        </div>
      </ReconciliationFormPageLayout>
    )
  }

  if (!editRecord) {
    return (
      <ReconciliationFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回研发对账列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <h3 className="admin-workspace__card-title">未找到记录</h3>
          <p className="admin-workspace__card-desc">
            编号对应的数据可能已删除或不存在（id: {reconEditRecordId}）。
          </p>
        </div>
      </ReconciliationFormPageLayout>
    )
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
      <DataForm
        formId={FORM_ID}
        layout="createPage"
        mode="edit"
        editRecord={editRecord}
        showSubmitButton={false}
        submitIntentRef={submitIntentRef}
        onPreviewChange={setPreviewAmount}
        onSubmitted={handleSubmitted}
        onUpdateRecord={updateRecord}
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

export default ReconciliationEditPage

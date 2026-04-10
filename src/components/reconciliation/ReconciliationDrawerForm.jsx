import React, { useEffect, useState } from 'react'
import DataForm from '@/components/DataForm.jsx'
import QuickFill from '@/components/QuickFill.jsx'
import TemplatePresets from '@/components/TemplatePresets.jsx'
import { showNotification } from '@/components/NotificationCenter.jsx'

const FORM_ID = 'reconciliation-drawer-form'

function ReconciliationDrawerForm({
  open,
  mode,
  editRecord,
  onClose,
  settlementMonth,
  addRecord,
  updateRecord,
  showToast,
  quickFillData,
  setQuickFillData,
  partners,
  onAddPartner,
  handleApplyTemplate
}) {
  const [previewAmount, setPreviewAmount] = useState(0)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const title = mode === 'edit' ? '编辑对账记录' : '新增对账记录'

  const handleSubmitted = () => {
    onClose()
  }

  return (
    <>
      <button
        type="button"
        className="rec-drawer-backdrop"
        aria-label="关闭抽屉"
        onClick={onClose}
      />
      <aside className="rec-drawer" role="dialog" aria-modal="true" aria-labelledby="rec-drawer-title">
        <div className="rec-drawer__head">
          <h2 id="rec-drawer-title" className="rec-drawer__title">
            {title}
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__tools">
          <QuickFill
            onFill={(data) => {
              setQuickFillData(data)
              showNotification('快速填充模板已应用', 'success')
            }}
          />
          <TemplatePresets onApplyTemplate={handleApplyTemplate} />
        </div>
        <div className="rec-drawer__body">
          <DataForm
            formId={FORM_ID}
            layout="drawer"
            mode={mode}
            editRecord={mode === 'edit' ? editRecord : null}
            showSubmitButton={false}
            onPreviewChange={setPreviewAmount}
            onSubmitted={handleSubmitted}
            onAddRecord={addRecord}
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
        </div>
        <div className="rec-drawer__footer">
          <div className="rec-drawer__preview">
            <span className="rec-drawer__preview-label">预计结算金额</span>
            <span className="rec-drawer__preview-value">¥{previewAmount.toFixed(2)}</span>
          </div>
          <div className="rec-drawer__footer-actions">
            <button type="button" className="rec-btn rec-btn--ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="rec-btn rec-btn--primary" form={FORM_ID}>
              保存
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default ReconciliationDrawerForm

import React, { useEffect, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'

const defaultInvoiceForm = {
  title: '',
  taxNo: '',
  amount: '',
  status: '未开',
  issueDate: '',
  remark: ''
}

function recordToForm(inv) {
  return {
    title: inv.title || '',
    taxNo: inv.taxNo || '',
    amount: inv.amount != null ? String(inv.amount) : '',
    status: inv.status || '未开',
    issueDate: inv.issueDate || '',
    remark: inv.remark || ''
  }
}

/**
 * 发票完整表单（新增/编辑共用；校验与提交走 store.submitInvoiceFromForm）
 */
function InvoiceForm({
  formId,
  mode = 'add',
  sourceRecord = null,
  seedFromStore = false,
  submitIntentRef,
  submitInvoiceFromForm,
  onAfterSubmit,
  onPreviewChange,
  parseInvoiceFromFilename,
  showToast
}) {
  const { invoice } = useAppState()
  const { invoiceForm } = invoice
  const [formData, setFormData] = useState(defaultInvoiceForm)

  useEffect(() => {
    const amt = parseFloat(formData.amount || 0)
    onPreviewChange?.(Number.isFinite(amt) ? amt : 0)
  }, [formData.amount, onPreviewChange])

  useEffect(() => {
    if (mode === 'edit' && sourceRecord) {
      setFormData(recordToForm(sourceRecord))
      return
    }
    if (mode === 'add' && seedFromStore && (invoiceForm.title || invoiceForm.taxNo || invoiceForm.amount)) {
      setFormData({
        title: invoiceForm.title || '',
        taxNo: invoiceForm.taxNo || '',
        amount: invoiceForm.amount != null ? String(invoiceForm.amount) : '',
        status: invoiceForm.status || '未开',
        issueDate: invoiceForm.issueDate || '',
        remark: invoiceForm.remark || ''
      })
      return
    }
    if (mode === 'add' && !seedFromStore) {
      setFormData({ ...defaultInvoiceForm })
    }
  }, [mode, sourceRecord?.id, seedFromStore, invoiceForm])

  const setField = (k, v) => setFormData((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const intent = submitIntentRef?.current ?? 'back'
    const editId = mode === 'edit' && sourceRecord ? sourceRecord.id : undefined
    const resetFormAfterAdd = mode === 'add' && intent !== 'continue'

    const ok = submitInvoiceFromForm(formData, { editId, resetFormAfterAdd })
    if (!ok) return

    if (mode === 'add' && intent === 'continue') {
      setFormData({ ...defaultInvoiceForm })
    }
    onAfterSubmit?.(intent)
    if (submitIntentRef) submitIntentRef.current = 'back'
  }

  return (
    <form id={formId} className="invoice-form invoice-form--page" onSubmit={handleSubmit}>
      <div className="form-section-title">基础信息</div>
      <div className="invoice-form__row">
        <label>发票抬头 *</label>
        <input
          type="text"
          className="admin-input"
          value={formData.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="公司名称"
        />
      </div>
      <div className="invoice-form__row">
        <label>税号 *</label>
        <input
          type="text"
          className="admin-input"
          value={formData.taxNo}
          onChange={(e) => setField('taxNo', e.target.value)}
          placeholder="纳税人识别号"
        />
      </div>

      <div className="form-section-title">发票信息 · 金额与日期</div>
      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>开票金额(元)</label>
          <input
            type="number"
            step="0.01"
            className="admin-input"
            value={formData.amount}
            onChange={(e) => setField('amount', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label>开票日期</label>
          <input
            type="date"
            className="admin-input"
            value={formData.issueDate}
            onChange={(e) => setField('issueDate', e.target.value)}
          />
        </div>
      </div>

      <div className="form-section-title">关联结算 / 合作方提示</div>
      <p className="admin-workspace__card-desc" style={{ margin: '0 0 12px' }}>
        核销对账记录请在「发票管理」列表中点击「核销」；此处可填写备注说明关联结算单或合作方。
      </p>

      <div className="form-section-title">金额 / 税额 / 状态</div>
      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>状态</label>
          <select
            className="admin-input"
            value={formData.status}
            onChange={(e) => setField('status', e.target.value)}
          >
            <option value="未开">未开</option>
            <option value="已开">已开</option>
            <option value="作废">作废</option>
          </select>
        </div>
        <div>
          <label>备注</label>
          <input
            type="text"
            className="admin-input"
            value={formData.remark}
            onChange={(e) => setField('remark', e.target.value)}
            placeholder="可填写收件人、邮箱等"
          />
        </div>
      </div>

      {mode === 'add' && parseInvoiceFromFilename && showToast ? (
        <div className="invoice-form__quick">
          <button
            type="button"
            className="rec-btn rec-btn--secondary"
            onClick={() => {
              const filename = window.prompt(
                '请输入发票文件名（格式：销售方+购买方+金额+日期），例如：深圳龙魂+广州熊动22557.99+20260126'
              )
              if (!filename) return
              const parsedInfo = parseInvoiceFromFilename(filename)
              if (parsedInfo) {
                setFormData((prev) => ({ ...prev, ...parsedInfo }))
                showToast('已解析发票信息，请确认并补充税号后保存', 'success')
              } else {
                showToast('文件名格式不正确', 'error')
              }
            }}
          >
            从文件名快速解析
          </button>
        </div>
      ) : null}
    </form>
  )
}

export default InvoiceForm
export { defaultInvoiceForm, recordToForm }

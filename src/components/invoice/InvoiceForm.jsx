import React, { useEffect, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import { parseInvoiceText } from '@/domain/invoice/parseInvoiceText.js'

const defaultInvoiceForm = {
  invoiceDirection: 'output',
  invoiceType: '',
  digitalInvoiceNo: '',
  invoiceCode: '',
  invoiceNo: '',
  sellerName: '',
  sellerTaxNo: '',
  title: '',
  taxNo: '',
  amount: '',
  taxAmount: '',
  amountWithTax: '',
  status: '未开',
  issueDate: '',
  issuer: '',
  invoiceSource: '',
  remark: ''
}

function recordToForm(inv) {
  return {
    invoiceDirection: inv.invoiceDirection || inv.invoice_direction || 'output',
    invoiceType: inv.invoiceType || '',
    digitalInvoiceNo: inv.digitalInvoiceNo || '',
    invoiceCode: inv.invoiceCode || '',
    invoiceNo: inv.invoiceNo || '',
    sellerName: inv.sellerName || '',
    sellerTaxNo: inv.sellerTaxNo || '',
    title: inv.title || '',
    taxNo: inv.taxNo || '',
    amount: inv.amount != null ? String(inv.amount) : '',
    taxAmount: inv.taxAmount != null ? String(inv.taxAmount) : '',
    amountWithTax:
      inv.amountWithTax != null
        ? String(inv.amountWithTax)
        : (
            (parseFloat(String(inv.amount ?? 0)) || 0) + (parseFloat(String(inv.taxAmount ?? 0)) || 0)
          ).toFixed(2),
    status: inv.status || '未开',
    issueDate: inv.issueDate || '',
    issuer: inv.issuer || '',
    invoiceSource: inv.invoiceSource || '',
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
  const [rawInvoiceText, setRawInvoiceText] = useState('')

  useEffect(() => {
    const amt = parseFloat(formData.amount || 0)
    onPreviewChange?.(Number.isFinite(amt) ? amt : 0)
  }, [formData.amount, onPreviewChange])

  useEffect(() => {
    if (mode === 'edit' && sourceRecord) {
      setFormData(recordToForm(sourceRecord))
      return
    }
    if (
      mode === 'add' &&
      seedFromStore &&
      (invoiceForm.title || invoiceForm.taxNo || invoiceForm.amount || invoiceForm.digitalInvoiceNo)
    ) {
      setFormData({
        invoiceDirection: invoiceForm.invoiceDirection || 'output',
        invoiceType: invoiceForm.invoiceType || '',
        digitalInvoiceNo: invoiceForm.digitalInvoiceNo || '',
        invoiceCode: invoiceForm.invoiceCode || '',
        invoiceNo: invoiceForm.invoiceNo || '',
        sellerName: invoiceForm.sellerName || '',
        sellerTaxNo: invoiceForm.sellerTaxNo || '',
        title: invoiceForm.title || '',
        taxNo: invoiceForm.taxNo || '',
        amount: invoiceForm.amount != null ? String(invoiceForm.amount) : '',
        taxAmount: invoiceForm.taxAmount != null ? String(invoiceForm.taxAmount) : '',
        amountWithTax:
          invoiceForm.amountWithTax != null
            ? String(invoiceForm.amountWithTax)
            : (
                (parseFloat(String(invoiceForm.amount || 0)) || 0) +
                (parseFloat(String(invoiceForm.taxAmount || 0)) || 0)
              ).toFixed(2),
        status: invoiceForm.status || '未开',
        issueDate: invoiceForm.issueDate || '',
        issuer: invoiceForm.issuer || '',
        invoiceSource: invoiceForm.invoiceSource || '',
        remark: invoiceForm.remark || ''
      })
      return
    }
    if (mode === 'add' && !seedFromStore) {
      setFormData({ ...defaultInvoiceForm })
    }
  }, [mode, sourceRecord?.id, seedFromStore, invoiceForm])

  const setField = (k, v) => setFormData((prev) => ({ ...prev, [k]: v }))

  const applyParsedInvoiceText = () => {
    const parsed = parseInvoiceText(rawInvoiceText, formData.invoiceDirection || 'output')
    if (!parsed) {
      showToast?.('未识别到有效发票文本', 'error')
      return
    }
    setFormData((prev) => {
      const base = {
        ...prev,
        invoiceType: parsed.invoice_type || prev.invoiceType,
        digitalInvoiceNo: parsed.digital_invoice_no || prev.digitalInvoiceNo,
        invoiceCode: parsed.invoice_code || '',
        invoiceNo: parsed.invoice_no || '',
        amount: parsed.amount || prev.amount,
        taxAmount: parsed.tax_amount || prev.taxAmount,
        amountWithTax: parsed.total_amount || prev.amountWithTax,
        issueDate: parsed.invoice_date || prev.issueDate,
        issuer: parsed.issuer || prev.issuer,
        invoiceSource: parsed.invoice_source || prev.invoiceSource,
        status: parsed.invoice_status || prev.status,
        remark: [prev.remark, parsed.remark].filter(Boolean).join(prev.remark && parsed.remark ? '；' : '')
      }
      if ((prev.invoiceDirection || 'output') === 'input') {
        base.sellerName = parsed.seller_name || prev.sellerName
        base.sellerTaxNo = parsed.seller_tax_no || prev.sellerTaxNo
      } else {
        base.title = parsed.buyer_name || prev.title
        base.taxNo = parsed.buyer_tax_no || prev.taxNo
      }
      return base
    })
    showToast?.('已识别并填充发票字段', 'success')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const intent = submitIntentRef?.current ?? 'back'
    const editId = mode === 'edit' && sourceRecord ? sourceRecord.id : undefined
    const resetFormAfterAdd = mode === 'add' && intent !== 'continue'

    const ok = await submitInvoiceFromForm(formData, { editId, resetFormAfterAdd })
    if (!ok) return

    if (mode === 'add' && intent === 'continue') {
      setFormData({ ...defaultInvoiceForm })
    }
    onAfterSubmit?.(intent)
    if (submitIntentRef) submitIntentRef.current = 'back'
  }

  return (
    <form id={formId} className="invoice-form invoice-form--page" onSubmit={handleSubmit}>
      {mode === 'add' ? (
        <>
          <div className="form-section-title">粘贴发票文本自动识别</div>
          <div className="invoice-form__row">
            <textarea
              className="admin-input"
              rows={6}
              value={rawInvoiceText}
              onChange={(e) => setRawInvoiceText(e.target.value)}
              placeholder="请粘贴税务系统复制的整条发票文本"
            />
          </div>
          <div className="invoice-form__quick">
            <button type="button" className="rec-btn rec-btn--secondary" onClick={applyParsedInvoiceText}>
              自动识别并填充
            </button>
          </div>
        </>
      ) : null}

      <div className="form-section-title">基础信息</div>
      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>发票方向</label>
          <select
            className="admin-input"
            value={formData.invoiceDirection}
            onChange={(e) => setField('invoiceDirection', e.target.value)}
          >
            <option value="output">销项发票</option>
            <option value="input">进项发票</option>
          </select>
        </div>
        <div>
          <label>票种</label>
          <input
            type="text"
            className="admin-input"
            value={formData.invoiceType}
            onChange={(e) => setField('invoiceType', e.target.value)}
            placeholder="例如：数电发票（增值税专用发票）"
          />
        </div>
      </div>
      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>数电发票号码</label>
          <input
            type="text"
            className="admin-input"
            value={formData.digitalInvoiceNo}
            onChange={(e) => setField('digitalInvoiceNo', e.target.value)}
            placeholder="数电发票号码"
          />
        </div>
        <div>
          <label>发票状态</label>
          <select className="admin-input" value={formData.status} onChange={(e) => setField('status', e.target.value)}>
            <option value="未开">未开</option>
            <option value="已开">已开</option>
            <option value="作废">作废</option>
          </select>
        </div>
      </div>
      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>发票代码</label>
          <input
            type="text"
            className="admin-input"
            value={formData.invoiceCode}
            onChange={(e) => setField('invoiceCode', e.target.value)}
            placeholder="发票代码"
          />
        </div>
        <div>
          <label>发票号码</label>
          <input
            type="text"
            className="admin-input"
            value={formData.invoiceNo}
            onChange={(e) => setField('invoiceNo', e.target.value)}
            placeholder="发票号码"
          />
        </div>
      </div>

      <div className="invoice-form__row">
        <label>{formData.invoiceDirection === 'input' ? '销售方名称 *' : '购买方纳税人名称 *'}</label>
        <input
          type="text"
          className="admin-input"
          value={formData.invoiceDirection === 'input' ? formData.sellerName : formData.title}
          onChange={(e) =>
            setField(formData.invoiceDirection === 'input' ? 'sellerName' : 'title', e.target.value)
          }
          placeholder="公司名称"
        />
      </div>
      <div className="invoice-form__row">
        <label>{formData.invoiceDirection === 'input' ? '销售方纳税人识别号 *' : '购买方纳税人识别号 *'}</label>
        <input
          type="text"
          className="admin-input"
          value={formData.invoiceDirection === 'input' ? formData.sellerTaxNo : formData.taxNo}
          onChange={(e) =>
            setField(formData.invoiceDirection === 'input' ? 'sellerTaxNo' : 'taxNo', e.target.value)
          }
          placeholder="纳税人识别号"
        />
      </div>

      <div className="form-section-title">发票信息 · 金额与日期</div>
      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>金额(元)</label>
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
          <label>税额(元)</label>
          <input
            type="number"
            step="0.01"
            className="admin-input"
            value={formData.taxAmount}
            onChange={(e) => setField('taxAmount', e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>价税合计(元)</label>
          <input
            type="number"
            step="0.01"
            className="admin-input"
            value={formData.amountWithTax}
            onChange={(e) => setField('amountWithTax', e.target.value)}
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

      <div className="invoice-form__row invoice-form__row--two">
        <div>
          <label>开票人</label>
          <input
            type="text"
            className="admin-input"
            value={formData.issuer}
            onChange={(e) => setField('issuer', e.target.value)}
            placeholder="开票人"
          />
        </div>
        <div>
          <label>发票来源</label>
          <input
            type="text"
            className="admin-input"
            value={formData.invoiceSource}
            onChange={(e) => setField('invoiceSource', e.target.value)}
            placeholder="例如：电子发票服务平台"
          />
        </div>
      </div>

      <div className="form-section-title">关联结算 / 合作方提示</div>
      <p className="admin-workspace__card-desc" style={{ margin: '0 0 12px' }}>
        核销对账记录请在「发票管理」列表中点击「核销」；此处可填写备注说明关联结算单或合作方。
      </p>

      <div className="form-section-title">状态与备注</div>
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

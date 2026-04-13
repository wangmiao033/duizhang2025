import React, { useEffect, useState } from 'react'
import {
  initialDeliveryForm,
  DELIVERY_STATUSES,
  COURIER_COMPANIES,
  buildDeliveryRecord,
  deliveryToFormData
} from '@/domain/payment/deliveryForm.js'
import '@/components/DeliveryCenter.css'

/**
 * 回款登记（实际为快递/寄送台账）完整表单，与 DeliveryCenter 校验及字段一致
 */
function PaymentForm({
  formId,
  mode = 'add',
  sourceRecord = null,
  partners = [],
  submitIntentRef,
  persistDelivery,
  onAfterSubmit,
  onSaved,
  showToast
}) {
  const [formData, setFormData] = useState(initialDeliveryForm)

  useEffect(() => {
    if (mode === 'edit' && sourceRecord) {
      setFormData(deliveryToFormData(sourceRecord))
      return
    }
    if (mode === 'add') {
      setFormData({ ...initialDeliveryForm })
    }
  }, [mode, sourceRecord?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const intent = submitIntentRef?.current ?? 'back'
    const built = buildDeliveryRecord(formData, partners, {
      editingId: mode === 'edit' ? sourceRecord?.id : undefined,
      existing: mode === 'edit' ? sourceRecord : undefined
    })
    if (!built.ok) {
      if (showToast) showToast(built.error, 'error')
      else window.alert(built.error)
      return
    }

    const ok = await persistDelivery(built.record, {
      editingId: mode === 'edit' && sourceRecord ? sourceRecord.id : undefined
    })
    if (!ok) return

    onSaved?.()

    if (mode === 'add' && intent === 'continue') {
      setFormData({ ...initialDeliveryForm })
    }
    onAfterSubmit?.(intent)
    if (submitIntentRef) submitIntentRef.current = 'back'
  }

  const setField = (k, v) => setFormData((prev) => ({ ...prev, [k]: v }))

  return (
    <form id={formId} className="payment-form-page" onSubmit={handleSubmit}>
      <div className="form-section-title">基础信息 · 物流</div>
      <div className="delivery-form-grid">
        <div className="form-group">
          <label>快递单号</label>
          <input
            type="text"
            className="admin-input"
            value={formData.trackingNumber}
            onChange={(e) => setField('trackingNumber', e.target.value)}
            placeholder="待寄出可留空"
          />
        </div>
        <div className="form-group">
          <label>快递公司 *</label>
          <select
            className="admin-input"
            value={formData.courierCompany}
            onChange={(e) => setField('courierCompany', e.target.value)}
          >
            <option value="">请选择</option>
            {COURIER_COMPANIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>状态 *</label>
          <select className="admin-input" value={formData.status} onChange={(e) => setField('status', e.target.value)}>
            {DELIVERY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>关联客户</label>
          <select
            className="admin-input"
            value={formData.partnerId}
            onChange={(e) => {
              const selectedPartner = partners.find((p) => p.id === parseInt(e.target.value, 10))
              setFormData((prev) => ({
                ...prev,
                partnerId: e.target.value,
                recipient: selectedPartner ? selectedPartner.recipient || '' : prev.recipient,
                recipientPhone: selectedPartner ? selectedPartner.recipientPhone || '' : prev.recipientPhone,
                address: selectedPartner ? selectedPartner.mailingAddress || '' : prev.address
              }))
            }}
          >
            <option value="">不关联</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-section-title">回款对象 / 收件信息</div>
      <div className="delivery-form-grid">
        <div className="form-group">
          <label>收件人 *</label>
          <input
            type="text"
            className="admin-input"
            value={formData.recipient}
            onChange={(e) => setField('recipient', e.target.value)}
            placeholder="收件人姓名"
          />
        </div>
        <div className="form-group">
          <label>收件人电话 *</label>
          <input
            type="text"
            className="admin-input"
            value={formData.recipientPhone}
            onChange={(e) => setField('recipientPhone', e.target.value)}
            placeholder="联系电话"
          />
        </div>
        <div className="form-group full-width">
          <label>收件地址 *</label>
          <input
            type="text"
            className="admin-input"
            value={formData.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="详细地址"
          />
        </div>
      </div>

      <div className="form-section-title">金额与日期（寄送时间轴）</div>
      <div className="delivery-form-grid">
        <div className="form-group">
          <label>寄出日期</label>
          <input
            type="date"
            className="admin-input"
            value={formData.sendDate}
            onChange={(e) => setField('sendDate', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>预计送达</label>
          <input
            type="date"
            className="admin-input"
            value={formData.expectedDate}
            onChange={(e) => setField('expectedDate', e.target.value)}
          />
        </div>
      </div>

      <div className="form-section-title">对应发票 / 结算（备注说明）</div>
      <p className="admin-workspace__card-desc" style={{ margin: '0 0 12px' }}>
        本模块数据仍存于「快递/寄送」台账（与历史回款登记页一致）；若需关联发票号或结算单号，请在备注中填写。
      </p>

      <div className="form-section-title">状态与备注</div>
      <div className="delivery-form-grid">
        <div className="form-group full-width">
          <label>备注</label>
          <textarea
            className="admin-input"
            rows={3}
            value={formData.remark}
            onChange={(e) => setField('remark', e.target.value)}
            placeholder="备注信息（选填）"
          />
        </div>
      </div>
    </form>
  )
}

export default PaymentForm

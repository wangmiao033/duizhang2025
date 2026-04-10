/**
 * 回款登记页实际承载「快递/寄送」记录（settings.deliveries），与 DeliveryCenter 历史校验一致 */

export const initialDeliveryForm = {
  trackingNumber: '',
  courierCompany: '',
  recipient: '',
  recipientPhone: '',
  address: '',
  partnerId: '',
  status: '待寄出',
  sendDate: '',
  expectedDate: '',
  remark: ''
}

export const DELIVERY_STATUSES = ['待寄出', '已寄出', '运输中', '已送达', '已签收', '异常']

export const COURIER_COMPANIES = ['顺丰', '圆通', '中通', '申通', '韵达', 'EMS', '京东物流', '其他']

/**
 * @returns {{ ok: true, record: object } | { ok: false, error: string }}
 */
export function buildDeliveryRecord(formData, partners, { editingId, existing } = {}) {
  if (!formData.trackingNumber.trim() && formData.status !== '待寄出') {
    return { ok: false, error: '已寄出的快递需要填写快递单号' }
  }

  const partnerIdParsed = formData.partnerId ? parseInt(formData.partnerId, 10) : null
  const partner = partnerIdParsed ? partners.find((p) => p.id === partnerIdParsed) : null

  const base = {
    trackingNumber: formData.trackingNumber.trim(),
    courierCompany: formData.courierCompany || '其他',
    recipient: formData.recipient.trim(),
    recipientPhone: formData.recipientPhone.trim(),
    address: formData.address.trim(),
    partnerId: partnerIdParsed,
    partnerName: partner?.name || '',
    status: formData.status,
    sendDate: formData.sendDate || '',
    expectedDate: formData.expectedDate || '',
    remark: formData.remark.trim()
  }

  if (existing && editingId != null) {
    return { ok: true, record: { ...existing, ...base, id: editingId } }
  }

  return {
    ok: true,
    record: {
      ...base,
      id: Date.now(),
      createdAt: new Date().toISOString()
    }
  }
}

export function deliveryToFormData(delivery) {
  return {
    trackingNumber: delivery.trackingNumber || '',
    courierCompany: delivery.courierCompany || '',
    recipient: delivery.recipient || '',
    recipientPhone: delivery.recipientPhone || '',
    address: delivery.address || '',
    partnerId: delivery.partnerId ? String(delivery.partnerId) : '',
    status: delivery.status || '待寄出',
    sendDate: delivery.sendDate || '',
    expectedDate: delivery.expectedDate || '',
    remark: delivery.remark || ''
  }
}

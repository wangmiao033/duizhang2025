/**
 * 渠道对账表单：金额链路与 buildRecordFromForm（与 ChannelBilling 历史逻辑一致，仅集中导出）
 */

export const initialForm = {
  channelName: '',
  gameName: '',
  startDate: '',
  endDate: '',
  flow: '',
  voucherCost: '',
  noWorryCost: '',
  refundCost: '',
  testCost: '',
  welfareCost: '',
  shareRate: '30',
  taxRate: '5',
  gatewayCost: '',
  settlementAmount: '',
  remark: ''
}

export function calculateBillingAmount(data) {
  const flow = parseFloat(data.flow || 0)
  const voucher = parseFloat(data.voucherCost || 0)
  const noWorry = parseFloat(data.noWorryCost || 0)
  const refund = parseFloat(data.refundCost || 0)
  const test = parseFloat(data.testCost || 0)
  const welfare = parseFloat(data.welfareCost || 0)
  return flow - voucher - noWorry - refund - test - welfare
}

export function calculateShareAmount(data) {
  const billingAmount = calculateBillingAmount(data)
  const shareRate = parseFloat(data.shareRate || 0) / 100
  return billingAmount * shareRate
}

export function calculateSettlement(data) {
  const shareAmount = calculateShareAmount(data)
  const gatewayCost = parseFloat(data.gatewayCost || 0)
  const taxRate = parseFloat(data.taxRate || 0) / 100
  const taxAmount = shareAmount * taxRate
  return shareAmount - gatewayCost - taxAmount
}

export function buildRecordFromForm(fd) {
  const billingAmount = calculateBillingAmount(fd)
  const shareAmount = calculateShareAmount(fd)
  return {
    ...fd,
    flow: parseFloat(fd.flow || 0),
    voucherCost: parseFloat(fd.voucherCost || 0),
    noWorryCost: parseFloat(fd.noWorryCost || 0),
    refundCost: parseFloat(fd.refundCost || 0),
    testCost: parseFloat(fd.testCost || 0),
    welfareCost: parseFloat(fd.welfareCost || 0),
    billingAmount,
    shareRate: parseFloat(fd.shareRate || 0),
    shareAmount,
    taxRate: parseFloat(fd.taxRate || 0),
    gatewayCost: parseFloat(fd.gatewayCost || 0),
    settlementAmount: parseFloat(fd.settlementAmount || 0)
  }
}

export function recordToFormData(record) {
  return {
    channelName: record.channelName || '',
    gameName: record.gameName || '',
    startDate: record.startDate || '',
    endDate: record.endDate || '',
    flow: String(record.flow ?? ''),
    voucherCost: String(record.voucherCost ?? ''),
    noWorryCost: String(record.noWorryCost ?? ''),
    refundCost: String(record.refundCost ?? ''),
    testCost: String(record.testCost ?? ''),
    welfareCost: String(record.welfareCost ?? ''),
    shareRate: String(record.shareRate ?? '30'),
    taxRate: String(record.taxRate ?? '5'),
    gatewayCost: String(record.gatewayCost ?? ''),
    settlementAmount: String(record.settlementAmount ?? ''),
    remark: record.remark || ''
  }
}

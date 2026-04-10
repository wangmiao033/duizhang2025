/**
 * 研发对账结算金额（与历史 App.jsx 内联实现保持一致）
 * @param {Record<string, unknown>} record
 * @returns {number}
 */
export function calculateSettlementAmount(record) {
  const gameFlow = parseFloat(record.gameFlow || 0)
  const testingFee = parseFloat(record.testingFee || 0)
  const voucher = parseFloat(record.voucher || 0)
  const channelFeeRate = parseFloat(record.channelFeeRate || 0) / 100
  const taxPoint = parseFloat(record.taxPoint || 0) / 100
  const revenueShareRatio = parseFloat(record.revenueShareRatio || 0) / 100
  const discount = parseFloat(record.discount || 1)
  const refund = parseFloat(record.refund || 0)

  const baseAmount = gameFlow - testingFee - voucher
  const afterChannelFee = baseAmount * (1 - channelFeeRate)
  const afterTax = afterChannelFee * (1 - taxPoint)
  const afterShare = afterTax * revenueShareRatio
  const afterDiscount = afterShare * discount
  const finalAmount = afterDiscount - refund

  return Math.max(0, Math.round(finalAmount * 100) / 100)
}

/**
 * 与增删改流程一致：先算金额再四舍五入到分，返回数字（非 toFixed 字符串）
 */
export function roundSettlementAmountNumber(record) {
  const settlementAmount = calculateSettlementAmount(record)
  return Math.round(settlementAmount * 100) / 100
}

/**
 * 存储用字符串格式 */
export function formatSettlementAmountString(record) {
  return roundSettlementAmountNumber(record).toFixed(2)
}

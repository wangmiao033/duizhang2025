/**
 * 研发对账结算金额（与账单 Excel 口径一致）
 *
 * 1. 折后流水 = 游戏流水 × 折扣
 * 2. 结算基数 = 折后流水 − 测试费 − 代金券 − 退款
 * 3. 结算金额 = ROUND(MAX(0, 结算基数 × (1 − 通道费率) × 分成比例), 2)
 *
 * 通道费率、分成比例为表单中的百分数（如 15 表示 15%）。
 * 税点字段仍存在于表单，当前账单口径不参与本计算。
 *
 * @param {Record<string, unknown>} record
 * @returns {number}
 */
export function calculateSettlementAmount(record) {
  const gameFlow = parseFloat(record.gameFlow || 0)
  const testingFee = parseFloat(record.testingFee || 0)
  const voucher = parseFloat(record.voucher || 0)
  const channelFeeRate = parseFloat(record.channelFeeRate || 0) / 100
  const revenueShareRatio = parseFloat(record.revenueShareRatio || 0) / 100
  const refund = parseFloat(record.refund || 0)
  const discountRaw = parseFloat(record.discount)
  const discount = Number.isFinite(discountRaw) ? discountRaw : 1

  const discountedFlow = gameFlow * discount
  const base = discountedFlow - testingFee - voucher - refund
  const amount = base * (1 - channelFeeRate) * revenueShareRatio

  if (!Number.isFinite(amount)) return 0
  return Math.max(0, Math.round(amount * 100) / 100)
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

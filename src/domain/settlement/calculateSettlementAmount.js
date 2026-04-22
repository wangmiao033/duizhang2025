function calculateSettlementAmountBase(record) {
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
  return Math.max(0, amount)
}

/**
 * 单行结算金额（展示口径）：ROUND(MAX(0, ...), 2)
 */
export function calculateSettlementAmount(record) {
  return Math.round(calculateSettlementAmountBase(record) * 100) / 100
}

/**
 * 单行结算金额（汇总口径）：仅做 MAX(0, ...)，不做分位四舍五入。
 */
export function calculateSettlementAmountRaw(record) {
  return calculateSettlementAmountBase(record)
}

/**
 * 分成毛额（可负），与 calculateSettlementAmount 内乘算一致，不做 max(0,·)。
 * @param {Record<string, unknown>} record
 * @returns {number}
 */
export function calculateSettlementGrossShare(record) {
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
  return Math.round(amount * 100) / 100
}

/**
 * 单行明细 → calculateSettlementAmount 所需字段（通道费沿用主单）
 * @param {Record<string, unknown>} line
 * @param {string|number} channelFeeRatePercent
 */
export function rdLineItemToSettlementPayload(line, channelFeeRatePercent) {
  const cf =
    channelFeeRatePercent !== undefined && channelFeeRatePercent !== null
      ? String(channelFeeRatePercent)
      : '0'
  return {
    gameFlow: line.revenue ?? line.gameFlow ?? 0,
    testingFee: line.testFee ?? line.testingFee ?? 0,
    voucher: line.couponAmount ?? line.voucher ?? 0,
    channelFeeRate: cf,
    revenueShareRatio: line.shareRatio ?? line.revenueShareRatio ?? 0,
    refund: line.extraFee ?? line.refund ?? 0,
    discount: line.discountRate ?? line.discount ?? '1',
    taxPoint: line.taxRate ?? line.taxPoint ?? 0
  }
}

/**
 * 多游戏明细时：先求和再四舍五入（与财务 Excel 汇总口径一致）
 * @param {Record<string, unknown>} record
 */
export function totalReconciliationSettlementAmount(record) {
  const items = record.items
  if (Array.isArray(items) && items.length > 0) {
    const cf = record.channelFeeRate
    let sum = 0
    for (const line of items) {
      sum += calculateSettlementAmountRaw(rdLineItemToSettlementPayload(line, cf))
    }
    return Math.round(sum * 100) / 100
  }
  return calculateSettlementAmount(record)
}

/**
 * 与增删改流程一致：先算金额再四舍五入到分，返回数字（非 toFixed 字符串）
 */
export function roundSettlementAmountNumber(record) {
  return totalReconciliationSettlementAmount(record)
}

/**
 * 存储用字符串格式 */
export function formatSettlementAmountString(record) {
  return totalReconciliationSettlementAmount(record).toFixed(2)
}

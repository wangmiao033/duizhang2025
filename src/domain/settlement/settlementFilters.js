/**
 * 结算相关字段筛选（金额区间等），供页面与导出复用
 */
export function recordMatchesAmountRange(record, minAmount, maxAmount) {
  const amt = parseFloat(record.settlementAmount || 0)
  if (minAmount !== undefined && minAmount !== null && minAmount !== '') {
    const min = parseFloat(minAmount)
    if (!Number.isNaN(min) && amt < min) return false
  }
  if (maxAmount !== undefined && maxAmount !== null && maxAmount !== '') {
    const max = parseFloat(maxAmount)
    if (!Number.isNaN(max) && amt > max) return false
  }
  return true
}

/**
 * 渠道对账：多游戏明细聚合（列表/筛选/导出用）
 */

/** @param {Record<string, unknown>} record */
export function getChannelLineItems(record) {
  const raw = record?.items
  if (Array.isArray(raw) && raw.length > 0) return raw
  if (record?.gameName || record?.flow != null) {
    return [
      {
        id: record._legacyLineId || `legacy-${record.id}`,
        gameName: record.gameName,
        flow: record.flow,
        voucherCost: record.voucherCost,
        noWorryCost: record.noWorryCost,
        refundCost: record.refundCost,
        testCost: record.testCost,
        welfareCost: record.welfareCost,
        shareRate: record.shareRate,
        billingAmount: record.billingAmount,
        shareAmount: record.shareAmount,
        taxRate: record.taxRate,
        gatewayCost: record.gatewayCost,
        settlementAmount: record.settlementAmount
      }
    ]
  }
  return []
}

/** 按游戏拆成虚拟行（报表按游戏分组） */
export function expandChannelRecordByGameLines(record) {
  const lines = getChannelLineItems(record)
  if (lines.length === 0) return [{ ...record, _virtualLineKey: String(record.id) }]
  return lines.map((line, idx) => ({
    ...record,
    id: record.id,
    _virtualLineKey: `${record.id}::${line.id ?? idx}`,
    gameName: line.gameName,
    flow: line.flow,
    channelFlow: line.flow,
    voucherCost: line.voucherCost,
    noWorryCost: line.noWorryCost,
    refundCost: line.refundCost,
    testCost: line.testCost,
    welfareCost: line.welfareCost,
    shareRate: line.shareRate,
    billingAmount: line.billingAmount,
    shareAmount: line.shareAmount,
    taxRate: line.taxRate,
    gatewayCost: line.gatewayCost,
    settlementAmount: line.settlementAmount
  }))
}

export function sumChannelNumericLines(record, field) {
  return getChannelLineItems(record).reduce((s, line) => s + (parseFloat(line[field]) || 0), 0)
}

export function getChannelTotals(record) {
  const lines = getChannelLineItems(record)
  if (lines.length === 0) {
    return {
      flow: parseFloat(record.flow) || 0,
      voucherCost: parseFloat(record.voucherCost) || 0,
      refundCost: parseFloat(record.refundCost) || 0,
      settlementAmount: parseFloat(record.settlementAmount) || 0
    }
  }
  return {
    flow: lines.reduce((s, l) => s + (parseFloat(l.flow) || 0), 0),
    voucherCost: lines.reduce((s, l) => s + (parseFloat(l.voucherCost) || 0), 0),
    refundCost: lines.reduce((s, l) => s + (parseFloat(l.refundCost) || 0), 0),
    settlementAmount: lines.reduce((s, l) => s + (parseFloat(l.settlementAmount) || 0), 0)
  }
}

/** @param {Record<string, unknown>} record */
export function getChannelNoWorryTotal(record) {
  return getChannelLineItems(record).reduce((s, l) => s + (parseFloat(l.noWorryCost) || 0), 0)
}

/** @param {Record<string, unknown>} record */
export function getChannelWelfareTotal(record) {
  return getChannelLineItems(record).reduce((s, l) => s + (parseFloat(l.welfareCost) || 0), 0)
}

export function getChannelGamesDisplay(record) {
  const names = getChannelLineItems(record)
    .map((l) => (l.gameName != null ? String(l.gameName).trim() : ''))
    .filter(Boolean)
  if (names.length === 0) return record.gameName || ''
  if (names.length <= 2) return names.join('、')
  return `${names[0]} 等${names.length}个游戏`
}

/** 主表已收金额（多笔收款汇总） */
export function getChannelReceivedAmount(record) {
  const v = record?.receivedAmount
  return v != null ? parseFloat(String(v)) || 0 : 0
}

/** 未收 = 应收（结算合计）- 已收 */
export function getChannelUnpaidAmount(record) {
  return getChannelTotals(record).settlementAmount - getChannelReceivedAmount(record)
}

export function receiptStatusTagLabel(status) {
  switch (String(status || 'unpaid')) {
    case 'paid':
      return '已收'
    case 'partial':
      return '部分收'
    default:
      return '未收'
  }
}

export function receiptStatusTagClass(status) {
  switch (String(status || 'unpaid')) {
    case 'paid':
      return 'channel-receipt-tag channel-receipt-tag--paid'
    case 'partial':
      return 'channel-receipt-tag channel-receipt-tag--partial'
    default:
      return 'channel-receipt-tag channel-receipt-tag--unpaid'
  }
}

/** 已收占应收比例0–100（应收≤0 且已收≥0 视为 100%） */
export function receiptProgressPercent(received, receivable) {
  const r = parseFloat(String(received)) || 0
  const a = parseFloat(String(receivable)) || 0
  if (a <= 0) return r >= 0 ? 100 : 0
  return Math.min(100, Math.round((r / a) * 100))
}

/** 已收满应收（与后端 receipt_status=paid 一致） */
export function isChannelReceiptSettled(record) {
  const a = getChannelTotals(record).settlementAmount
  const r = getChannelReceivedAmount(record)
  return r + 1e-9 >= a
}

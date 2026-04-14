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

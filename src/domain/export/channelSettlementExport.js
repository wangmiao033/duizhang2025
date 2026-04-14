/**
 * 渠道对账「结算单」Excel：按渠道分 sheet，版式参考研发 settlementConfirmationExport
 */

import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { getChannelLineItems, getLineEffectiveFlow } from '@/domain/channel/channelAggregates.js'
import { sanitizeExcelSheetName, toChineseUppercase } from '@/domain/export/settlementConfirmationExport.js'

function formatNumber(value) {
  return Number(value || 0)
}

function settlementPeriodLabelFromRecords(records) {
  const list = Array.isArray(records) ? records : []
  const m = list.map((r) => r.settlementMonth).find((x) => x != null && String(x).trim() !== '')
  if (m && /^\d{4}-\d{1,2}$/.test(String(m).trim())) {
    const [y, mo] = String(m).trim().split('-')
    const mm = mo.length === 1 ? `0${mo}` : mo
    return `${y}年${mm}月`
  }
  const r0 = list[0]
  if (r0?.startDate && r0?.endDate) {
    return `${r0.startDate} 至 ${r0.endDate}`
  }
  return m != null ? String(m) : '—'
}

/** 从多条 channel_record 展平为结算单行（不发渠道的内部字段） */
export function flatChannelSettlementRowsFromRecords(records) {
  const rows = []
  const list = Array.isArray(records) ? records : []
  list.forEach((record) => {
    getChannelLineItems(record).forEach((line) => {
      const eff = getLineEffectiveFlow(line)
      const voucher = formatNumber(line.voucherCost)
      const noWorry = formatNumber(line.noWorryCost)
      const refund = formatNumber(line.refundCost)
      const test = formatNumber(line.testCost)
      const welfare = formatNumber(line.welfareCost)
      const billingAmount = eff - voucher - noWorry - refund - test - welfare
      const shareRate = formatNumber(line.shareRate)
      const rawShare = line.shareAmount
      const hasStoredShare =
        rawShare !== '' && rawShare !== undefined && rawShare !== null && Number.isFinite(parseFloat(rawShare))
      let shareAmount = hasStoredShare ? formatNumber(rawShare) : billingAmount * (shareRate / 100)
      if (!Number.isFinite(shareAmount)) shareAmount = 0
      rows.push({
        gameName: line.gameName != null ? String(line.gameName) : '',
        totalFlow: eff,
        voucher,
        shareRatioDisplay: `${shareRate}%`,
        shareAmount: Math.round(shareAmount * 100) / 100
      })
    })
  })
  return rows
}

function groupRecordsByChannelName(records) {
  const map = new Map()
  const list = Array.isArray(records) ? records.filter(Boolean) : []
  list.forEach((r) => {
    const name = r.channelName || '未命名渠道'
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(r)
  })
  return Array.from(map.entries()).map(([channelName, recs]) => ({
    channelName,
    records: recs,
    settlementPeriodLabel: settlementPeriodLabelFromRecords(recs),
    rows: flatChannelSettlementRowsFromRecords(recs)
  }))
}

function sanitizeFileSegment(raw) {
  return String(raw || '')
    .trim()
    .replace(/[/\\?*:[\]"<>|]/g, '_')
    .slice(0, 80)
}

/**
 * 单个渠道 sheet 的二维数组
 * @param {{ channelName: string, settlementPeriodLabel: string, rows: ReturnType<typeof flatChannelSettlementRowsFromRecords> }} group
 */
export function buildChannelSettlementSheetAoa(group) {
  const channelName = group.channelName || ''
  const period = group.settlementPeriodLabel || '—'
  const dataRows = Array.isArray(group.rows) ? group.rows : []

  const wsData = []
  wsData.push(['结算单'])
  wsData.push([])
  wsData.push([`渠道：${channelName}`])
  wsData.push([`结算周期：${period}`])
  wsData.push([])

  const headers = ['游戏名称', '总流水（元）', '代金券', '分成比例', '分成金额（元）']
  wsData.push(headers)

  let sumFlow = 0
  let sumVoucher = 0
  let sumShare = 0

  dataRows.forEach((row) => {
    sumFlow += row.totalFlow
    sumVoucher += row.voucher
    sumShare += row.shareAmount
    wsData.push([
      row.gameName,
      row.totalFlow.toFixed(2),
      row.voucher.toFixed(2),
      row.shareRatioDisplay,
      row.shareAmount.toFixed(2)
    ])
  })

  wsData.push([
    '合计',
    sumFlow.toFixed(2),
    sumVoucher.toFixed(2),
    '',
    sumShare.toFixed(2)
  ])

  wsData.push([])
  wsData.push([`支付金额（大写）：${toChineseUppercase(sumShare)}`])
  wsData.push([`支付金额（数字）：${sumShare.toFixed(2)}`])
  wsData.push([])
  wsData.push(['盖章：', ''])
  wsData.push(['日期：', dayjs().format('YYYY年MM月DD日')])

  return wsData
}

/** 列宽与合并（5 列明细） */
export function applyChannelSettlementSheetLayout(ws) {
  ws['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }]
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }
  ]
  ws['!rows'] = []
  ws['!rows'][0] = { hpt: 28 }
  ws['!rows'][5] = { hpt: 22 }
}

/**
 * @param {Record<string, unknown>[]} records 已筛选或已选中的 channel_record 列表
 * @returns {{ wb: import('xlsx').WorkBook, fileName: string }}
 */
export function buildChannelSettlementWorkbook(records) {
  const groups = groupRecordsByChannelName(records)
  if (groups.length === 0) {
    throw new Error('NO_RECORDS')
  }

  const wb = XLSX.utils.book_new()
  const usedNames = new Set()

  groups.forEach((g, i) => {
    let base = sanitizeExcelSheetName(g.channelName || `渠道${i + 1}`)
    let name = base
    let n = 1
    while (usedNames.has(name)) {
      const suffix = `_${n++}`
      name = (base.slice(0, Math.max(1, 31 - suffix.length)) + suffix).slice(0, 31)
    }
    usedNames.add(name)

    const aoa = buildChannelSettlementSheetAoa(g)
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    applyChannelSettlementSheetLayout(ws)
    XLSX.utils.book_append_sheet(wb, ws, name)
  })

  let fileName
  if (groups.length === 1) {
    const seg = sanitizeFileSegment(groups[0].channelName) || '未命名渠道'
    fileName = `渠道结算单_${seg}.xlsx`
  } else {
    fileName = `渠道结算单_批量_${dayjs().format('YYYYMMDD')}.xlsx`
  }

  return { wb, fileName }
}

export function writeChannelSettlementToFile(wb, fileName) {
  XLSX.writeFile(wb, fileName)
}

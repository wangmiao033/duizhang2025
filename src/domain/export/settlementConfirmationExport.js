/**
 * 研发对账「结算确认单」Excel：按选中记录生成 workbook（可多 sheet）
 * 与 BillExport 中 Excel 版式保持一致规则：顶栏收/付款方留空、删除开票与收款银行区块等。
 */

import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import {
  calculateSettlementAmount,
  rdLineItemToSettlementPayload
} from '@/domain/settlement/calculateSettlementAmount.js'
import { isCorruptSettlementNumber } from '@/utils/settlementNumber.js'

/** 阿拉伯数字转中文大写金额（与历史 BillExport 口径一致） */
export function toChineseUppercase(num) {
  if (Number.isNaN(Number(num))) return ''
  const n = Number(num)
  const units = '\u4edf\u4f70\u62fe\u4ebf\u4edf\u4f70\u62fe\u4e07\u4edf\u4f70\u62fe\u5143\u89d2\u5206'
  const chars = '\u96f6\u58f9\u8d30\u53c1\u8086\u4f0d\u9646\u67f4\u634c\u7396'
  const str = String(Math.round(n * 100))
  const len = str.length
  if (len > units.length) return String(num)
  let result = ''
  for (let i = 0; i < len; i += 1) {
    const digit = parseInt(str[i], 10)
    const unit = units[units.length - len + i]
    result += `${chars[digit]}${unit}`
  }
  return result
    .replace(/\u96f6[\u4edf\u4f70\u62fe]/g, '\u96f6')
    .replace(/零{2,}/g, '零')
    .replace(/零(万|亿|元)/g, '$1')
    .replace(/亿万/g, '亿')
    .replace(/零角零分$/, '整')
    .replace(/零分$/, '整')
    .replace(/零角/, '')
}

function formatNumber(value) {
  return Number(value || 0)
}

function pctDisplay(val) {
  if (val === null || val === undefined || val === '') return '0%'
  const n = Number(val)
  if (!Number.isFinite(n)) return '0%'
  return `${n}%`
}

/** 多游戏明细：每个 line 导出一行（充值金额列用折后流水，与渠道「折算」思路一致） */
function expandRdRecordsForSettlementExport(records) {
  const list = Array.isArray(records) ? records : []
  const out = []
  for (const r of list) {
    const items = r.items
    if (Array.isArray(items) && items.length > 0) {
      for (const line of items) {
        const cycleFromLine =
          line.settlementCycle != null && String(line.settlementCycle).trim() !== ''
            ? String(line.settlementCycle).trim()
            : null
        const dRaw = parseFloat(line.discountRate)
        const d = Number.isFinite(dRaw) ? dRaw : 1
        const rev = parseFloat(line.revenue || 0)
        const net = (Number.isFinite(rev) ? rev : 0) * d
        const payload = rdLineItemToSettlementPayload(line, r.channelFeeRate)
        const headerMonth = r.settlementMonth != null ? String(r.settlementMonth) : ''
        out.push({
          settlementMonth: cycleFromLine != null ? cycleFromLine : headerMonth,
          game: line.gameName,
          gameFlow: net,
          voucher: line.couponAmount,
          refund: line.extraFee,
          testingFee: line.testFee,
          revenueShareRatio: line.shareRatio,
          channelFeeRate: r.channelFeeRate,
          taxPoint: line.taxRate,
          settlementAmount: calculateSettlementAmount(payload)
        })
      }
    } else {
      out.push(r)
    }
  }
  return out
}

/**
 * 生成单个 sheet 的二维数组（可含多行明细 + 合计 + 支付金额 + 盖章区）
 * @param {Record<string, unknown>[]} records 本 sheet 内的研发对账行（至少 0 条，一般为 1 或多条）
 */
export function buildSettlementSheetAoa(records) {
  const safe = Array.isArray(records) ? records : []
  const expanded = expandRdRecordsForSettlementExport(safe)
  const today = dayjs().format('YYYY年MM月DD日')
  const wsData = []

  wsData.push(['结算确认单'])
  wsData.push([])
  wsData.push(['收方：', '', '', '', '出具日期：', today])
  wsData.push(['付款方：', ''])
  wsData.push([])

  const headers = [
    '结算周期',
    '游戏项目',
    '充值金额',
    '代金券',
    '退款',
    '平台币（赠送）',
    '合作方分成比例',
    '通道费率',
    '税率',
    '合作方分成收入'
  ]
  wsData.push(headers)

  expanded.forEach((record) => {
    const rechargeRaw = record.gameFlow
    const rechargeCell =
      rechargeRaw === null || rechargeRaw === undefined || rechargeRaw === ''
        ? ''
        : formatNumber(rechargeRaw).toFixed(2)
    const voucher = formatNumber(record.voucher)
    const refund = formatNumber(record.refund)
    const platformCoin = formatNumber(record.testingFee)
    const shareRatio = pctDisplay(record.revenueShareRatio)
    const channel = pctDisplay(record.channelFeeRate)
    const tax = pctDisplay(record.taxPoint)
    const incRaw = record.settlementAmount
    const incomeCell =
      incRaw === null || incRaw === undefined || incRaw === ''
        ? ''
        : formatNumber(incRaw).toFixed(2)

    wsData.push([
      record.settlementMonth != null ? String(record.settlementMonth) : '',
      record.game != null ? String(record.game) : '',
      rechargeCell,
      voucher.toFixed(2),
      refund.toFixed(2),
      platformCoin.toFixed(2),
      shareRatio,
      channel,
      tax,
      incomeCell
    ])
  })

  const sum2 = (getter) =>
    expanded.reduce((s, r) => {
      const v = getter(r)
      const n = Number(v)
      return s + (Number.isFinite(n) ? n : 0)
    }, 0)

  const totalRecharge = sum2((r) => r.gameFlow)
  const totalVoucher = sum2((r) => r.voucher)
  const totalRefund = sum2((r) => r.refund)
  const totalPlatform = sum2((r) => r.testingFee)
  const totalIncome = sum2((r) => r.settlementAmount)

  wsData.push([
    '合计',
    '',
    totalRecharge.toFixed(2),
    totalVoucher.toFixed(2),
    totalRefund.toFixed(2),
    totalPlatform.toFixed(2),
    '',
    '',
    '',
    totalIncome.toFixed(2)
  ])

  wsData.push([])
  wsData.push([`支付金额（大写）：${toChineseUppercase(totalIncome)}`])
  wsData.push([`支付金额（数字）：${totalIncome.toFixed(2)}`])
  wsData.push([])
  wsData.push(['盖公章：', ''])
  wsData.push(['时间：', ''])

  return wsData
}

/** Excel sheet 名合法且 ≤31 字符 */
export function sanitizeExcelSheetName(raw) {
  let src = raw
  if (src != null && isCorruptSettlementNumber(String(src))) {
    src = '结算单'
  }
  const base = String(src || '结算单')
    .replace(/[:\\/?*[\]]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
  const cut = base.slice(0, 31)
  return cut || 'Sheet1'
}

function allocateUniqueSheetNames(records) {
  const used = new Set()
  return records.map((r, i) => {
    let base = sanitizeExcelSheetName(r.settlementNumber || `结算单${i + 1}`)
    let name = base
    let n = 1
    while (used.has(name)) {
      const suffix = `_${n++}`
      name = (base.slice(0, Math.max(1, 31 - suffix.length)) + suffix).slice(0, 31)
    }
    used.add(name)
    return name
  })
}

export function applySettlementSheetLayout(ws) {
  const colWidths = [
    { wch: 16 },
    { wch: 26 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 }
  ]
  ws['!cols'] = colWidths
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 5 }, e: { r: 2, c: 9 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 9 } }
  ]
  ws['!rows'] = []
  ws['!rows'][0] = { hpt: 28 }
  ws['!rows'][5] = { hpt: 22 }
}

function sanitizeFileSegment(raw) {
  return String(raw || '')
    .trim()
    .replace(/[/\\?*:[\]"<>|]/g, '_')
    .slice(0, 80)
}

/**
 * 仅根据选中记录生成 workbook与建议文件名（每条记录一个 sheet；单条时一个 sheet）
 * @param {Record<string, unknown>[]} selectedRecords 已按勾选顺序排好的记录
 * @returns {{ wb: import('xlsx').WorkBook, fileName: string }}
 */
export function buildSettlementWorkbookFromSelected(selectedRecords) {
  const list = Array.isArray(selectedRecords) ? selectedRecords.filter(Boolean) : []
  if (list.length === 0) {
    throw new Error('NO_RECORDS')
  }

  const wb = XLSX.utils.book_new()

  if (list.length === 1) {
    const r = list[0]
    const sheetName = allocateUniqueSheetNames(list)[0]
    const aoa = buildSettlementSheetAoa([r])
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    applySettlementSheetLayout(ws)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    const no = sanitizeFileSegment(r.settlementNumber) || '未命名'
    const fileName = `研发对账单_${no}.xlsx`
    return { wb, fileName }
  }

  const names = allocateUniqueSheetNames(list)
  list.forEach((r, i) => {
    const aoa = buildSettlementSheetAoa([r])
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    applySettlementSheetLayout(ws)
    XLSX.utils.book_append_sheet(wb, ws, names[i])
  })

  const fileName = `研发对账单_批量导出_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`
  return { wb, fileName }
}

export function writeSettlementWorkbookToFile(wb, fileName) {
  XLSX.writeFile(wb, fileName)
}

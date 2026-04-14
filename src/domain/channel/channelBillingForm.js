/**
 * 渠道对账表单：单行计算（calculate*）与多行汇总（buildFullChannelRecord）
 */

import { getChannelLineItems } from '@/domain/channel/channelAggregates.js'

export const initialHeaderForm = {
  channelName: '',
  partnerName: '',
  settlementMonth: '',
  startDate: '',
  endDate: '',
  remark: '',
  status: 'pending',
  serverCost: '',
  discountType: '',
  channelFeeRate: '',
  devShareRate: '',
  profitRate: ''
}

export function initialLineItem() {
  return {
    id: '',
    gameName: '',
    flow: '',
    discountFactor: '1',
    voucherCost: '',
    noWorryCost: '',
    refundCost: '',
    testCost: '',
    welfareCost: '',
    shareRate: '30',
    taxRate: '5',
    gatewayCost: '',
    settlementAmount: ''
  }
}

/** Excel 单游戏行映射仍使用扁平 initialForm */
export const initialForm = {
  ...initialHeaderForm,
  ...initialLineItem()
}

/** 折扣系数：空/非法/≤0 时按 1 */
export function resolveDiscountFactor(data) {
  const raw = data.discountFactor
  if (raw === '' || raw === undefined || raw === null) return 1
  const n = parseFloat(String(raw))
  if (!Number.isFinite(n) || n <= 0) return 1
  return n
}

/** 总流水 = 后台流水 × 折扣系数（2 位小数） */
export function effectiveLineFlowFromFormData(data) {
  const raw = parseFloat(data.flow || 0)
  const fac = resolveDiscountFactor(data)
  return Math.round(raw * fac * 100) / 100
}

export function calculateBillingAmount(data) {
  const flow = effectiveLineFlowFromFormData(data)
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

function resolveSettlementAmount(fd) {
  const auto = calculateSettlement(fd)
  const raw = fd.settlementAmount
  if (raw === '' || raw === undefined || raw === null) return Math.round(auto * 100) / 100
  const parsed = parseFloat(raw)
  if (!Number.isFinite(parsed)) return Math.round(auto * 100) / 100
  return Math.round(parsed * 100) / 100
}

/** 单行游戏明细（数值化 + 计费/分成/结算），公式与历史单游戏一致 */
export function buildLineRecordFromForm(fd) {
  const discountFactor = resolveDiscountFactor(fd)
  const effectiveFlow = effectiveLineFlowFromFormData(fd)
  const billingAmount = calculateBillingAmount(fd)
  const shareAmount = calculateShareAmount(fd)
  const settlementAmount = resolveSettlementAmount(fd)
  return {
    gameName: fd.gameName != null ? String(fd.gameName) : '',
    flow: parseFloat(fd.flow || 0),
    discountFactor,
    effectiveFlow,
    voucherCost: parseFloat(fd.voucherCost || 0),
    noWorryCost: parseFloat(fd.noWorryCost || 0),
    refundCost: parseFloat(fd.refundCost || 0),
    testCost: parseFloat(fd.testCost || 0),
    welfareCost: parseFloat(fd.welfareCost || 0),
    billingAmount: Math.round(billingAmount * 100) / 100,
    shareRate: parseFloat(fd.shareRate || 0),
    shareAmount: Math.round(shareAmount * 100) / 100,
    taxRate: parseFloat(fd.taxRate || 0),
    gatewayCost: parseFloat(fd.gatewayCost || 0),
    settlementAmount
  }
}

function parseOptionalNum(v) {
  if (v === '' || v === undefined || v === null) return null
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

/** 整单：公共字段 + items[] + 主表汇总字段（sum） */
export function buildFullChannelRecord(headerForm, lineFormList) {
  const items = lineFormList.map((row) => buildLineRecordFromForm(row))
  const sum = (getter) => items.reduce((s, it) => s + (getter(it) || 0), 0)
  return {
    channelName: headerForm.channelName,
    partnerName: headerForm.partnerName || '',
    settlementMonth: headerForm.settlementMonth || '',
    startDate: headerForm.startDate || '',
    endDate: headerForm.endDate || '',
    remark: headerForm.remark || '',
    status: headerForm.status || 'pending',
    serverCost: parseOptionalNum(headerForm.serverCost),
    discountType: headerForm.discountType || null,
    channelFeeRate: parseOptionalNum(headerForm.channelFeeRate),
    devShareRate: parseOptionalNum(headerForm.devShareRate),
    profitRate: parseOptionalNum(headerForm.profitRate),
    items,
    gameName: items.map((i) => i.gameName).filter(Boolean).join('、'),
    rawFlowTotal: sum((i) => i.flow),
    flow: sum((i) => i.effectiveFlow),
    voucherCost: sum((i) => i.voucherCost),
    noWorryCost: sum((i) => i.noWorryCost),
    refundCost: sum((i) => i.refundCost),
    testCost: sum((i) => i.testCost),
    welfareCost: sum((i) => i.welfareCost),
    billingAmount: sum((i) => i.billingAmount),
    shareAmount: sum((i) => i.shareAmount),
    taxRate: items.length ? items[0].taxRate : 0,
    shareRate: items.length ? items[0].shareRate : 0,
    gatewayCost: sum((i) => i.gatewayCost),
    settlementAmount: sum((i) => i.settlementAmount)
  }
}

/** Excel / 单游戏导入：一单一行游戏 */
export function buildChannelBillFromSingleGameForm(fd) {
  return buildFullChannelRecord(
    {
      channelName: fd.channelName,
      partnerName: fd.partnerName || '',
      settlementMonth: fd.settlementMonth || '',
      startDate: fd.startDate || '',
      endDate: fd.endDate || '',
      remark: fd.remark || '',
      status: 'pending',
      serverCost: '',
      discountType: '',
      channelFeeRate: '',
      devShareRate: '',
      profitRate: ''
    },
    [fd]
  )
}

/** @deprecated 单游戏；请用 buildChannelBillFromSingleGameForm或 buildLineRecordFromForm */
export function buildRecordFromForm(fd) {
  const line = buildLineRecordFromForm(fd)
  return {
    ...fd,
    ...line,
    channelName: fd.channelName,
    startDate: fd.startDate,
    endDate: fd.endDate,
    remark: fd.remark
  }
}

export function recordToHeaderForm(record) {
  return {
    channelName: record.channelName || '',
    partnerName: record.partnerName || '',
    settlementMonth: record.settlementMonth || '',
    startDate: record.startDate || '',
    endDate: record.endDate || '',
    remark: record.remark || '',
    status: record.status || 'pending',
    serverCost: record.serverCost != null && record.serverCost !== '' ? String(record.serverCost) : '',
    discountType: record.discountType != null ? String(record.discountType) : '',
    channelFeeRate:
      record.channelFeeRate != null && record.channelFeeRate !== '' ? String(record.channelFeeRate) : '',
    devShareRate: record.devShareRate != null && record.devShareRate !== '' ? String(record.devShareRate) : '',
    profitRate: record.profitRate != null && record.profitRate !== '' ? String(record.profitRate) : ''
  }
}

export function recordToLineForms(record) {
  return getChannelLineItems(record).map((line) => ({
    id: line.id != null ? String(line.id) : '',
    gameName: line.gameName || '',
    flow: String(line.flow ?? ''),
    discountFactor:
      line.discountFactor !== undefined && line.discountFactor !== null ? String(line.discountFactor) : '1',
    voucherCost: String(line.voucherCost ?? ''),
    noWorryCost: String(line.noWorryCost ?? ''),
    refundCost: String(line.refundCost ?? ''),
    testCost: String(line.testCost ?? ''),
    welfareCost: String(line.welfareCost ?? ''),
    shareRate: String(line.shareRate ?? '30'),
    taxRate: String(line.taxRate ?? '5'),
    gatewayCost: String(line.gatewayCost ?? ''),
    settlementAmount: String(line.settlementAmount ?? '')
  }))
}

/** 兼容旧代码：首行与表头合并为扁平表单 */
export function recordToFormData(record) {
  const h = recordToHeaderForm(record)
  const lines = recordToLineForms(record)
  const first = lines[0] || initialLineItem()
  return { ...h, ...first }
}

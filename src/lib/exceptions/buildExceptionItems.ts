import { getInvoiceRecordId } from '@/lib/api/invoice.ts'
import { getPaymentRecordId } from '@/lib/api/payment.ts'
import { getChannelRecordId } from '@/lib/api/channel.ts'
import type { InvoicePaymentLinkRow } from '@/lib/api/invoicePaymentLink.ts'
import {
  EXCEPTION_TYPES,
  type ExceptionItem,
  type ExceptionLevel,
  type ExceptionTargetType,
  type ExceptionUserStatus,
  makeExceptionId
} from '@/lib/exceptions/exceptionTypes.ts'
import { extractAmountCandidates, paymentRecordToAmountSearchBlob } from '@/lib/exceptions/paymentAmountParse.ts'
import { getExceptionUserStatus } from '@/lib/exceptions/exceptionStatusStorage.ts'

/** 与研发对账 StatusManager 一致；渠道记录复用同一套 status 值 */
const ALLOWED_CHANNEL_STATUSES = new Set([
  'pending',
  'confirmed',
  'settled',
  'invoiced',
  'verified'
])

function pickClosestCandidate(candidates: number[], hint: number): number | null {
  if (!candidates.length) return null
  return candidates.reduce((best, a) =>
    Math.abs(a - hint) < Math.abs(best - hint) ? a : best
  )
}

function linkedPaymentsRepresentativeSum(
  paymentIds: string[],
  paymentById: Map<string, Record<string, unknown>>,
  invoiceAmount: number
): number | null {
  let sum = 0
  let anyParsed = false
  for (const pid of paymentIds) {
    const p = paymentById.get(pid)
    if (!p) continue
    const blob = paymentRecordToAmountSearchBlob(p)
    const cands = extractAmountCandidates(blob)
    const v = pickClosestCandidate(cands, invoiceAmount)
    if (v != null) {
      sum += v
      anyParsed = true
    }
  }
  return anyParsed ? sum : null
}

function amountMismatchExceeds(invoiceAmt: number, linkedSum: number): boolean {
  const tol = Math.max(1, Math.abs(invoiceAmt) * 0.02)
  return Math.abs(linkedSum - invoiceAmt) > tol
}

export type BuildExceptionItemsInput = {
  invoiceRecords: Record<string, unknown>[]
  paymentRecords: Record<string, unknown>[]
  links: InvoicePaymentLinkRow[]
  reconciliationRecords: Record<string, unknown>[]
  channelRecords: Record<string, unknown>[]
  calculateSettlementAmount: (record: Record<string, unknown>) => number
}

function baseItem(
  type: ExceptionItem['type'],
  level: ExceptionLevel,
  title: string,
  description: string,
  targetType: ExceptionTargetType,
  targetId: string,
  createdAt: string,
  extra?: Record<string, unknown>
): ExceptionItem {
  const id = makeExceptionId(type, targetType, targetId)
  const stored = getExceptionUserStatus(id) as ExceptionUserStatus
  return {
    id,
    type,
    level,
    title,
    description,
    targetType,
    targetId,
    status: stored,
    createdAt,
    extra
  }
}

export function buildExceptionItems(input: BuildExceptionItemsInput): ExceptionItem[] {
  const {
    invoiceRecords,
    paymentRecords,
    links,
    reconciliationRecords,
    channelRecords,
    calculateSettlementAmount
  } = input

  const items: ExceptionItem[] = []

  const invoiceById = new Map<string, Record<string, unknown>>()
  for (const inv of invoiceRecords) {
    const id = getInvoiceRecordId(inv)
    if (id) invoiceById.set(id, inv)
  }

  const paymentById = new Map<string, Record<string, unknown>>()
  for (const p of paymentRecords) {
    const id = getPaymentRecordId(p)
    if (id) paymentById.set(id, p)
  }

  const linksByInvoice = new Map<string, InvoicePaymentLinkRow[]>()
  const linksByPayment = new Map<string, InvoicePaymentLinkRow[]>()
  for (const L of links) {
    const iid = L.invoice_id
    const pid = L.payment_id
    if (!linksByInvoice.has(iid)) linksByInvoice.set(iid, [])
    linksByInvoice.get(iid)!.push(L)
    if (!linksByPayment.has(pid)) linksByPayment.set(pid, [])
    linksByPayment.get(pid)!.push(L)
  }

  const now = new Date().toISOString()

  for (const inv of invoiceRecords) {
    const iid = getInvoiceRecordId(inv)
    if (!iid) continue
    const list = linksByInvoice.get(iid) || []
    if (list.length === 0) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.INVOICE_UNLINKED,
          'warning',
          '发票未关联回款',
          `发票「${String(inv.title || iid).slice(0, 40)}」尚无发票-回款关联记录。`,
          'invoice',
          iid,
          now,
          { taxNo: inv.taxNo }
        )
      )
      continue
    }

    const payIds = [...new Set(list.map((x) => x.payment_id))]
    const invAmt = parseFloat(String(inv.amount ?? 0))
    if (payIds.length > 1) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.DUPLICATE_LINK_INVOICE,
          'warning',
          '发票关联多笔回款',
          `发票「${String(inv.title || iid).slice(0, 32)}」关联了 ${payIds.length} 笔回款，请确认是否符合业务规则。`,
          'invoice',
          iid,
          now,
          { paymentIds: payIds }
        )
      )
    }

    const sumRep = linkedPaymentsRepresentativeSum(payIds, paymentById, invAmt)
    if (sumRep != null && Number.isFinite(invAmt) && amountMismatchExceeds(invAmt, sumRep)) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.INVOICE_PAYMENT_AMOUNT_MISMATCH,
          'error',
          '发票金额与关联回款解析金额不一致',
          `发票金额为 ${invAmt.toFixed(2)}，关联回款文本解析金额合计约 ${sumRep.toFixed(2)}，差异超过阈值（±¥${Math.max(1, Math.abs(invAmt) * 0.02).toFixed(2)}）。`,
          'invoice',
          iid,
          now,
          { invoiceAmount: invAmt, parsedSum: sumRep }
        )
      )
    }
  }

  for (const p of paymentRecords) {
    const pid = getPaymentRecordId(p)
    if (!pid) continue
    const list = linksByPayment.get(pid) || []
    if (list.length === 0) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.PAYMENT_UNLINKED,
          'warning',
          '回款未关联发票',
          `回款登记「${[p.partnerName, p.trackingNumber].filter(Boolean).join(' · ') || pid}」尚未关联发票。`,
          'payment',
          pid,
          now
        )
      )
      continue
    }
    const invIds = [...new Set(list.map((x) => x.invoice_id))]
    if (invIds.length > 1) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.DUPLICATE_LINK_PAYMENT,
          'warning',
          '回款关联多张发票',
          `回款「${String(p.trackingNumber || pid).slice(0, 24)}」关联了 ${invIds.length} 张发票，请确认是否符合业务规则。`,
          'payment',
          pid,
          now,
          { invoiceIds: invIds }
        )
      )
    }
  }

  for (const ch of channelRecords) {
    const cid = getChannelRecordId(ch)
    if (!cid) continue
    const raw = ch.status
    const s = raw == null || raw === '' ? '' : String(raw).trim()
    if (!s || !ALLOWED_CHANNEL_STATUSES.has(s)) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.CHANNEL_STATUS_INVALID,
          'warning',
          '渠道对账状态异常',
          `记录「${[ch.channelName, ch.gameName].filter(Boolean).join(' / ') || cid}」状态为空或不在允许范围（${[...ALLOWED_CHANNEL_STATUSES].join('、')}）。当前：${s || '（空）'}`,
          'channel',
          cid,
          now,
          { status: s || null }
        )
      )
    }
  }

  for (let idx = 0; idx < reconciliationRecords.length; idx++) {
    const rec = reconciliationRecords[idx]
    const rid =
      rec.id != null && String(rec.id).trim() !== ''
        ? String(rec.id)
        : `legacy:${String(rec.settlementNumber ?? '')}:${String(rec.game ?? '')}:${String(rec.settlementMonth ?? '')}:${idx}`
    const storedStr = String(rec.settlementAmount ?? '').trim()
    const stored = parseFloat(storedStr || '0')
    if (stored < 0) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.RECON_SETTLEMENT_NEGATIVE,
          'error',
          '研发对账结算金额为负',
          `记录「${String(rec.game || rid)}」结算金额 ${storedStr} < 0。`,
          'reconciliation',
          rid,
          now,
          { settlementMonth: rec.settlementMonth }
        )
      )
    }
    const calculated = calculateSettlementAmount(rec)
    const diff = Math.abs(stored - calculated)
    if (diff > 0.01) {
      items.push(
        baseItem(
          EXCEPTION_TYPES.RECON_SETTLEMENT_MISMATCH,
          'error',
          '研发对账结算金额与计算值不一致',
          `记录「${String(rec.game || rid)}」存储 ${stored.toFixed(2)}，按规则计算为 ${calculated.toFixed(2)}，差异 ${diff.toFixed(2)}。`,
          'reconciliation',
          rid,
          now,
          { calculated, stored, settlementNumber: rec.settlementNumber }
        )
      )
    }
  }

  return items
}

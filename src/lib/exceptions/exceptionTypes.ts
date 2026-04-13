/**
 * 异常中心 2.0 — 类型与统一结构（便于后续迁 API）
 */

export const EXCEPTION_TYPES = {
  INVOICE_UNLINKED: 'invoice_unlinked',
  PAYMENT_UNLINKED: 'payment_unlinked',
  INVOICE_PAYMENT_AMOUNT_MISMATCH: 'invoice_payment_amount_mismatch',
  CHANNEL_STATUS_INVALID: 'channel_status_invalid',
  RECON_SETTLEMENT_NEGATIVE: 'recon_settlement_negative',
  RECON_SETTLEMENT_MISMATCH: 'recon_settlement_mismatch',
  DUPLICATE_LINK_PAYMENT: 'duplicate_link_payment',
  DUPLICATE_LINK_INVOICE: 'duplicate_link_invoice'
} as const

export type ExceptionType = (typeof EXCEPTION_TYPES)[keyof typeof EXCEPTION_TYPES]

export type ExceptionTargetType =
  | 'invoice'
  | 'payment'
  | 'reconciliation'
  | 'channel'
  | 'invoice_link'
  | 'payment_link'

export type ExceptionLevel = 'error' | 'warning' | 'info'

export type ExceptionUserStatus = 'pending' | 'ignored' | 'resolved'

/** 与后端对齐时可改为 snake_case；当前前端统一 camelCase */
export type ExceptionItem = {
  id: string
  type: ExceptionType
  level: ExceptionLevel
  title: string
  description: string
  targetType: ExceptionTargetType
  targetId: string
  status: ExceptionUserStatus
  createdAt: string
  extra?: Record<string, unknown>
}

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  [EXCEPTION_TYPES.INVOICE_UNLINKED]: '发票未关联回款',
  [EXCEPTION_TYPES.PAYMENT_UNLINKED]: '回款未关联发票',
  [EXCEPTION_TYPES.INVOICE_PAYMENT_AMOUNT_MISMATCH]: '发票与关联回款金额不一致',
  [EXCEPTION_TYPES.CHANNEL_STATUS_INVALID]: '渠道对账状态异常',
  [EXCEPTION_TYPES.RECON_SETTLEMENT_NEGATIVE]: '研发对账结算金额为负',
  [EXCEPTION_TYPES.RECON_SETTLEMENT_MISMATCH]: '研发对账结算金额与计算值不一致',
  [EXCEPTION_TYPES.DUPLICATE_LINK_PAYMENT]: '回款重复关联多张发票',
  [EXCEPTION_TYPES.DUPLICATE_LINK_INVOICE]: '发票重复关联多笔回款'
}

export function makeExceptionId(
  type: ExceptionType,
  targetType: ExceptionTargetType,
  targetId: string
): string {
  return `${type}:${targetType}:${targetId}`
}

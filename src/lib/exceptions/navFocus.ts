/**
 * 从异常中心「去处理」跳转时，由目标页消费一次（sessionStorage）
 */

const PREFIX = 'duizhang.navFocus.'

export function stashInvoiceFocus(id: string) {
  if (id) sessionStorage.setItem(`${PREFIX}invoiceId`, id)
}

export function stashPaymentFocus(id: string) {
  if (id) sessionStorage.setItem(`${PREFIX}paymentId`, id)
}

export function stashReconciliationFocus(id: string) {
  if (id) sessionStorage.setItem(`${PREFIX}reconId`, id)
}

export function stashChannelFocus(id: string) {
  if (id) sessionStorage.setItem(`${PREFIX}channelId`, id)
}

export function consumeInvoiceFocus(): string | null {
  const k = `${PREFIX}invoiceId`
  const v = sessionStorage.getItem(k)
  sessionStorage.removeItem(k)
  return v
}

export function consumePaymentFocus(): string | null {
  const k = `${PREFIX}paymentId`
  const v = sessionStorage.getItem(k)
  sessionStorage.removeItem(k)
  return v
}

export function consumeReconciliationFocus(): string | null {
  const k = `${PREFIX}reconId`
  const v = sessionStorage.getItem(k)
  sessionStorage.removeItem(k)
  return v
}

export function consumeChannelFocus(): string | null {
  const k = `${PREFIX}channelId`
  const v = sessionStorage.getItem(k)
  sessionStorage.removeItem(k)
  return v
}

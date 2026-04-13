import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import { useInvoicePaymentLinks } from '@/hooks/useInvoicePaymentLinks.js'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { buildExceptionItems } from '@/lib/exceptions/buildExceptionItems.ts'

/**
 * 异常中心 2.0：聚合识别结果；refresh() 在本地状态变更后调用以重新合并持久化状态 */
export function useExceptionItems() {
  const [rev, setRev] = useState(0)
  const { recon, invoice, settings } = useAppState()
  const { links } = useInvoicePaymentLinks()

  useEffect(() => {
    const bump = () => setRev((r) => r + 1)
    window.addEventListener('duizhang-exception-status-changed', bump)
    return () => window.removeEventListener('duizhang-exception-status-changed', bump)
  }, [])

  const items = useMemo(
    () =>
      buildExceptionItems({
        invoiceRecords: invoice?.invoiceRecords ?? [],
        paymentRecords: settings?.deliveries ?? [],
        links,
        reconciliationRecords: recon?.records ?? [],
        channelRecords: recon?.channelRecords ?? [],
        calculateSettlementAmount
      }),
    [
      invoice?.invoiceRecords,
      settings?.deliveries,
      links,
      recon?.records,
      recon?.channelRecords,
      rev
    ]
  )

  const refresh = useCallback(() => setRev((r) => r + 1), [])

  const pendingCount = useMemo(() => items.filter((i) => i.status === 'pending').length, [items])

  return { items, refresh, pendingCount }
}

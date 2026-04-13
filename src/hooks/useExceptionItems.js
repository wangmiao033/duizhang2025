import { useEffect, useMemo, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import { useInvoicePaymentLinks } from '@/hooks/useInvoicePaymentLinks.js'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { buildExceptionItems } from '@/lib/exceptions/buildExceptionItems.ts'
import {
  fetchExceptionStatusesFromApi,
  readLocalStatusMap
} from '@/lib/exceptions/exceptionStatusStorage.ts'

function mergeStatusMaps(
  localMap,
  remoteMap
) {
  return { ...localMap, ...remoteMap }
}

/**
 * 异常中心 2.0：规则在前端识别；状态优先后端，本地为缓存与回退。
 */
export function useExceptionItems() {
  const [statusMap, setStatusMap] = useState(() => readLocalStatusMap())
  const { recon, invoice, settings } = useAppState()
  const { links } = useInvoicePaymentLinks()

  useEffect(() => {
    const onDetail = (e) => {
      const d = e?.detail
      if (d && d.exceptionId && d.status) {
        setStatusMap((m) => ({ ...m, [d.exceptionId]: d.status }))
      }
    }
    window.addEventListener('duizhang-exception-status-changed', onDetail)
    return () => window.removeEventListener('duizhang-exception-status-changed', onDetail)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const remote = await fetchExceptionStatusesFromApi()
      if (cancelled) return
      if (remote != null) {
        setStatusMap((prev) => mergeStatusMaps(prev, remote))
      } else {
        setStatusMap(readLocalStatusMap())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(
    () =>
      buildExceptionItems({
        invoiceRecords: invoice?.invoiceRecords ?? [],
        paymentRecords: settings?.deliveries ?? [],
        links,
        reconciliationRecords: recon?.records ?? [],
        channelRecords: recon?.channelRecords ?? [],
        calculateSettlementAmount,
        statusMap
      }),
    [
      invoice?.invoiceRecords,
      settings?.deliveries,
      links,
      recon?.records,
      recon?.channelRecords,
      statusMap
    ]
  )

  const pendingCount = useMemo(() => items.filter((i) => i.status === 'pending').length, [items])

  return { items, pendingCount, statusMap }
}

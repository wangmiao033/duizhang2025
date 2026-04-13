import { useCallback, useEffect, useMemo, useState } from 'react'
import { listInvoicePaymentLinks } from '@/lib/api/invoicePaymentLink.ts'

/**
 * 发票-回款关联列表（全量拉取，用于列表/抽屉展示关联状态）
 */
export function useInvoicePaymentLinks() {
  const [links, setLinks] = useState([])
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const { items } = await listInvoicePaymentLinks({ limit: 1000, offset: 0 })
      setLinks(items)
    } catch (e) {
      console.error(e)
      setError(e)
      setLinks([])
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const byInvoiceId = useMemo(() => {
    const m = new Map()
    for (const L of links) {
      const k = L.invoice_id
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(L)
    }
    return m
  }, [links])

  const byPaymentId = useMemo(() => {
    const m = new Map()
    for (const L of links) {
      const k = L.payment_id
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(L)
    }
    return m
  }, [links])

  return { links, refresh, byInvoiceId, byPaymentId, error }
}

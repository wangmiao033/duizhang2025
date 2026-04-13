import { useState, useEffect, useCallback, useRef } from 'react'
import { STORAGE_KEYS, storageGet, storageSet, getStorageVersion, setStorageVersion } from '@/store/useAppStorage.js'
import { getNumberFormatFromStorage, saveNumberFormatToStorage } from '@/utils/settlementNumber.js'
import {
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
  apiPaymentRowToFrontend,
  frontendPaymentToPayload
} from '@/lib/api/payment.ts'

const defaultPartyA = {
  invoiceTitle: '厦门巴掌互动科技有限公司',
  invoiceContent: '*信息系统服务*信息服务费',
  taxRegistrationNo: '91350203MA348H8D3Y',
  invoiceAddress: '厦门市软件园三期凤岐路199-1号1003单元',
  bankName: '兴业银行厦门集美支行',
  bankAccount: '129980100100171131',
  phone: '0592-6219126'
}

const defaultPartyB = {
  companyName: '广州能动科技有限公司',
  bankName: '中国工商银行股份有限公司广州兴华支行',
  bankAccount: '3602841509200157769'
}

function normalizeLocalDeliveries(saved) {
  return (saved || []).map((d) => ({
    ...d,
    id: d.id != null ? String(d.id) : String(Date.now())
  }))
}

export function useSettingsStore({ showToast } = {}) {
  const [partyA, setPartyA] = useState(defaultPartyA)
  const [partyB, setPartyB] = useState(defaultPartyB)
  const [settlementMonth, setSettlementMonth] = useState('')
  const [partners, setPartners] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [settlementNumberFormat, setSettlementNumberFormat] = useState(getNumberFormatFromStorage())
  const [paymentApiEnabled, setPaymentApiEnabled] = useState(false)

  const showToastRef = useRef(showToast)
  showToastRef.current = showToast

  const refetchPaymentsFromApi = useCallback(async () => {
    const { items } = await listPayments({ limit: 500, offset: 0 })
    setDeliveries(items.map(apiPaymentRowToFrontend))
  }, [])

  useEffect(() => {
    if (getStorageVersion() === 0) {
      setStorageVersion(1)
    }
  }, [])

  useEffect(() => {
    const savedPartyA = storageGet(STORAGE_KEYS.PARTY_A)
    const savedPartyB = storageGet(STORAGE_KEYS.PARTY_B)
    const savedMonth = storageGet(STORAGE_KEYS.SETTLEMENT_MONTH, { parseJson: false })
    const savedPartners = storageGet(STORAGE_KEYS.PARTNERS)
    if (savedPartyA) setPartyA(savedPartyA)
    if (savedPartyB) setPartyB(savedPartyB)
    if (savedMonth) setSettlementMonth(savedMonth)
    if (savedPartners) setPartners(savedPartners)
    setSettlementNumberFormat(getNumberFormatFromStorage())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refetchPaymentsFromApi()
        if (cancelled) return
        setPaymentApiEnabled(true)
      } catch (err) {
        console.error(err)
        if (cancelled) return
        showToastRef.current?.(
          '无法连接回款登记服务器，已使用本地缓存。请检查网络或 VITE_API_BASE_URL。',
          'error'
        )
        const savedDeliveries = storageGet(STORAGE_KEYS.DELIVERIES)
        if (savedDeliveries?.length) {
          setDeliveries(normalizeLocalDeliveries(savedDeliveries))
        }
        setPaymentApiEnabled(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refetchPaymentsFromApi])

  useEffect(() => {
    storageSet(STORAGE_KEYS.PARTY_A, partyA)
  }, [partyA])

  useEffect(() => {
    storageSet(STORAGE_KEYS.PARTY_B, partyB)
  }, [partyB])

  useEffect(() => {
    storageSet(STORAGE_KEYS.SETTLEMENT_MONTH, settlementMonth, { asJson: false })
  }, [settlementMonth])

  useEffect(() => {
    storageSet(STORAGE_KEYS.PARTNERS, partners)
  }, [partners])

  useEffect(() => {
    storageSet(STORAGE_KEYS.DELIVERIES, deliveries)
  }, [deliveries])

  useEffect(() => {
    if (settlementNumberFormat) {
      saveNumberFormatToStorage(settlementNumberFormat)
    }
  }, [settlementNumberFormat])

  const persistDelivery = useCallback(
    async (record, { editingId } = {}) => {
      const rec = { ...record, id: record.id != null ? String(record.id) : String(Date.now()) }
      if (paymentApiEnabled) {
        try {
          if (editingId != null) {
            await updatePayment(String(editingId), frontendPaymentToPayload(rec))
          } else {
            await createPayment(frontendPaymentToPayload(rec))
          }
          await refetchPaymentsFromApi()
          return true
        } catch (e) {
          console.error(e)
          showToastRef.current?.('回款登记保存服务器失败', 'error')
          return false
        }
      }
      if (editingId != null) {
        const sid = String(editingId)
        setDeliveries((prev) =>
          prev.map((d) => (String(d.id) === sid ? { ...rec, id: sid } : d))
        )
      } else {
        setDeliveries((prev) => [{ ...rec, id: String(rec.id) }, ...prev])
      }
      return true
    },
    [paymentApiEnabled, refetchPaymentsFromApi]
  )

  const patchDeliveryRecord = useCallback(
    async (next) => {
      const sid = String(next.id)
      if (paymentApiEnabled) {
        try {
          await updatePayment(sid, frontendPaymentToPayload(next))
          await refetchPaymentsFromApi()
          showToastRef.current?.('快递记录已更新', 'success')
        } catch (e) {
          console.error(e)
          showToastRef.current?.('更新服务器失败', 'error')
        }
        return
      }
      setDeliveries((prev) => prev.map((d) => (String(d.id) === sid ? next : d)))
      showToastRef.current?.('快递记录已更新', 'success')
    },
    [paymentApiEnabled, refetchPaymentsFromApi]
  )

  const deleteDeliveryById = useCallback(
    async (rawId) => {
      const sid = String(rawId)
      if (paymentApiEnabled) {
        try {
          await deletePayment(sid)
          await refetchPaymentsFromApi()
        } catch (e) {
          console.error(e)
          showToastRef.current?.('从服务器删除失败', 'error')
          return
        }
      } else {
        setDeliveries((prev) => prev.filter((d) => String(d.id) !== sid))
      }
      showToastRef.current?.('快递记录已删除', 'success')
    },
    [paymentApiEnabled, refetchPaymentsFromApi]
  )

  return {
    partyA,
    setPartyA,
    partyB,
    setPartyB,
    settlementMonth,
    setSettlementMonth,
    partners,
    setPartners,
    deliveries,
    setDeliveries,
    settlementNumberFormat,
    setSettlementNumberFormat,
    paymentApiEnabled,
    persistDelivery,
    patchDeliveryRecord,
    deleteDeliveryById,
    refetchPaymentsFromApi
  }
}

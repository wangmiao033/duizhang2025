import { useState, useEffect } from 'react'
import { STORAGE_KEYS, storageGet, storageSet, getStorageVersion, setStorageVersion } from '@/store/useAppStorage.js'
import { getNumberFormatFromStorage, saveNumberFormatToStorage } from '@/utils/settlementNumber.js'

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

export function useSettingsStore() {
  const [partyA, setPartyA] = useState(defaultPartyA)
  const [partyB, setPartyB] = useState(defaultPartyB)
  const [settlementMonth, setSettlementMonth] = useState('')
  const [partners, setPartners] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [settlementNumberFormat, setSettlementNumberFormat] = useState(getNumberFormatFromStorage())

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
    const savedDeliveries = storageGet(STORAGE_KEYS.DELIVERIES)
    if (savedPartyA) setPartyA(savedPartyA)
    if (savedPartyB) setPartyB(savedPartyB)
    if (savedMonth) setSettlementMonth(savedMonth)
    if (savedPartners) setPartners(savedPartners)
    if (savedDeliveries) setDeliveries(savedDeliveries)
    setSettlementNumberFormat(getNumberFormatFromStorage())
  }, [])

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
    setSettlementNumberFormat
  }
}

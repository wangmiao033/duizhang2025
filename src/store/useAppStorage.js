/**
 * localStorage 统一封装：键名与历史版本完全一致，禁止随意改名
 */
export const STORAGE_KEYS = {
  RECONCILIATION_RECORDS: 'reconciliationRecords',
  PARTY_A: 'partyA',
  PARTY_B: 'partyB',
  SETTLEMENT_MONTH: 'settlementMonth',
  PARTNERS: 'partners',
  DELIVERIES: 'deliveries',
  CHANNEL_RECORDS: 'channelRecords',
  INVOICE_RECORDS: 'invoiceRecords',
  SETTLEMENT_NUMBER_FORMAT: 'settlementNumberFormat'
}

const VERSION_KEY = 'appStorageSchemaVersion'
const CURRENT_VERSION = 1

export function getStorageVersion() {
  try {
    const v = localStorage.getItem(VERSION_KEY)
    return v ? parseInt(v, 10) || 0 : 0
  } catch {
    return 0
  }
}

export function setStorageVersion(version = CURRENT_VERSION) {
  try {
    localStorage.setItem(VERSION_KEY, String(version))
  } catch {
    /* ignore */
  }
}

export function storageGet(key, { parseJson = true, defaultValue = null } = {}) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return defaultValue
    if (!parseJson) return raw
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

export function storageSet(key, value, { asJson = true } = {}) {
  try {
    if (value === undefined) {
      localStorage.removeItem(key)
      return true
    }
    localStorage.setItem(key, asJson ? JSON.stringify(value) : String(value))
    return true
  } catch {
    return false
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function storageUpdate(key, updater, { parseJson = true } = {}) {
  const current = storageGet(key, { parseJson, defaultValue: null })
  const next = typeof updater === 'function' ? updater(current) : updater
  return storageSet(key, next, { asJson: parseJson })
}

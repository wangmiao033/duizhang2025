/**
 * 发票核销：已选研发对账记录的结算金额合计 */
export function sumVerifiedSettlementAmount(records, verifiedRecordIds) {
  const ids = (verifiedRecordIds || []).map((x) => String(x))
  if (!ids.length) return 0
  const set = new Set(ids)
  return (records || []).reduce((sum, r) => {
    if (set.has(String(r.id))) {
      return sum + parseFloat(r.settlementAmount || 0)
    }
    return sum
  }, 0)
}

export function getRecordsForVerificationIds(records, verifiedRecordIds) {
  const set = new Set((verifiedRecordIds || []).map((x) => String(x)))
  return (records || []).filter((r) => set.has(String(r.id)))
}

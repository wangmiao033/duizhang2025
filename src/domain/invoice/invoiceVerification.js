/**
 * 发票核销：已选研发对账记录的结算金额合计 */
export function sumVerifiedSettlementAmount(records, verifiedRecordIds) {
  const ids = verifiedRecordIds || []
  if (!ids.length) return 0
  const set = new Set(ids)
  return (records || []).reduce((sum, r) => {
    if (set.has(r.id)) {
      return sum + parseFloat(r.settlementAmount || 0)
    }
    return sum
  }, 0)
}

export function getRecordsForVerificationIds(records, verifiedRecordIds) {
  const set = new Set(verifiedRecordIds || [])
  return (records || []).filter((r) => set.has(r.id))
}

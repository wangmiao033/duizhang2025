/**
 * 研发对账记录汇总统计（原 App.jsx statistics useMemo）
 */
export function computeRecordsStatistics(records) {
  const list = records || []
  const totalGameFlow = list.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0)
  const totalTestingFee = list.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0)
  const totalVoucher = list.reduce((sum, r) => sum + (parseFloat(r.voucher) || 0), 0)
  const totalSettlementAmount = list.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0)
  const totalRefund = list.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0)

  return {
    totalGameFlow,
    totalTestingFee,
    totalVoucher,
    totalSettlementAmount,
    totalRefund,
    recordCount: list.length,
    avgSettlementAmount: list.length > 0 ? totalSettlementAmount / list.length : 0,
    avgGameFlow: list.length > 0 ? totalGameFlow / list.length : 0
  }
}

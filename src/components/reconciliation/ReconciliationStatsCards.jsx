import React, { useMemo } from 'react'
import { computeRecordsStatistics } from '@/domain/settlement/settlementSummary.js'
import { validateAllRecords, getValidationStatistics } from '@/utils/dataValidation.js'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'

function ReconciliationStatsCards({ filteredRecords, compact = false }) {
  const stats = useMemo(() => computeRecordsStatistics(filteredRecords), [filteredRecords])

  const verifiedTotal = useMemo(() => {
    return (filteredRecords || [])
      .filter((r) => (r.status || 'pending') === 'verified')
      .reduce((s, r) => s + (parseFloat(r.settlementAmount) || 0), 0)
  }, [filteredRecords])

  const anomalyCount = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) return 0
    const issues = validateAllRecords(filteredRecords, calculateSettlementAmount)
    return getValidationStatistics(issues).errors
  }, [filteredRecords])

  const fmt = (n) => `¥${(Number(n) || 0).toFixed(2)}`

  const cards = [
    { label: '记录数', value: String(stats.recordCount), sub: '当前筛选' },
    { label: '流水合计', value: fmt(stats.totalGameFlow) },
    { label: '结算金额合计', value: fmt(stats.totalSettlementAmount), emphasize: true },
    { label: '已核销金额', value: fmt(verifiedTotal) },
    { label: '异常数', value: String(anomalyCount), warn: anomalyCount > 0 }
  ]

  return (
    <div
      className={`rec-stats-cards ${compact ? 'rec-stats-cards--compact' : ''}`}
      aria-label="筛选结果概览"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rec-stat-card ${c.emphasize ? 'rec-stat-card--emphasis' : ''} ${c.warn ? 'rec-stat-card--warn' : ''}`}
        >
          <div className="rec-stat-card__label">{c.label}</div>
          <div className="rec-stat-card__value">{c.value}</div>
          {c.sub && <div className="rec-stat-card__sub">{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}

export default ReconciliationStatsCards

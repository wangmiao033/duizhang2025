import { filterRecordsByCycle } from '@/utils/settlementCycle.js'
import { recordMatchesAmountRange } from '@/domain/settlement/settlementFilters.js'

/**
 * 研发对账列表：搜索、高级筛选、排序（原 App.jsx filteredRecords useMemo）
 */
export function filterAndSortReconciliationRecords({
  records,
  searchTerm,
  filterOptions = {},
  sortOptions = { field: '', order: 'desc' },
  selectedCycleKey,
  cycleType
}) {
  let result = [...(records || [])]

  if (selectedCycleKey !== null && selectedCycleKey !== undefined) {
    result = filterRecordsByCycle(result, selectedCycleKey, cycleType)
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    result = result.filter(
      (record) =>
        (record.game && record.game.toLowerCase().includes(term)) ||
        (record.partner && record.partner.toLowerCase().includes(term)) ||
        (record.settlementMonth && record.settlementMonth.toLowerCase().includes(term)) ||
        (record.settlementNumber && record.settlementNumber.toLowerCase().includes(term))
    )
  }

  if (filterOptions.partner) {
    result = result.filter((r) => r.partner && r.partner.includes(filterOptions.partner))
  }
  if (filterOptions.game) {
    result = result.filter((r) => r.game && r.game.includes(filterOptions.game))
  }
  if (filterOptions.status) {
    result = result.filter((r) => (r.status || 'pending') === filterOptions.status)
  }
  if (filterOptions.minAmount != null && filterOptions.minAmount !== '') {
    const min = parseFloat(filterOptions.minAmount)
    result = result.filter((r) => parseFloat(r.settlementAmount || 0) >= min)
  }
  if (filterOptions.maxAmount != null && filterOptions.maxAmount !== '') {
    const max = parseFloat(filterOptions.maxAmount)
    result = result.filter((r) => parseFloat(r.settlementAmount || 0) <= max)
  }

  if (sortOptions.field) {
    result.sort((a, b) => {
      let aVal
      let bVal
      switch (sortOptions.field) {
        case 'gameFlow':
          aVal = parseFloat(a.gameFlow || 0)
          bVal = parseFloat(b.gameFlow || 0)
          break
        case 'settlementAmount':
          aVal = parseFloat(a.settlementAmount || 0)
          bVal = parseFloat(b.settlementAmount || 0)
          break
        case 'game':
          aVal = (a.game || '').toLowerCase()
          bVal = (b.game || '').toLowerCase()
          break
        case 'partner':
          aVal = (a.partner || '').toLowerCase()
          bVal = (b.partner || '').toLowerCase()
          break
        default:
          return 0
      }

      if (sortOptions.field === 'game' || sortOptions.field === 'partner') {
        return sortOptions.order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOptions.order === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  return result
}

export function filterReconciliationRecordsForExport(records, filterOptions) {
  let result = [...(records || [])]
  if (!filterOptions) return result
  if (filterOptions.partner) {
    result = result.filter((r) => r.partner && r.partner.includes(filterOptions.partner))
  }
  if (filterOptions.game) {
    result = result.filter((r) => r.game && r.game.includes(filterOptions.game))
  }
  if (filterOptions.status) {
    result = result.filter((r) => (r.status || 'pending') === filterOptions.status)
  }
  result = result.filter((r) =>
    recordMatchesAmountRange(r, filterOptions.minAmount, filterOptions.maxAmount)
  )
  return result
}

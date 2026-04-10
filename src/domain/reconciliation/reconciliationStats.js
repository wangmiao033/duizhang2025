/**
 * 按状态汇总（原 App.jsx 工作台状态统计卡片）
 * @param {Array} records
 * @param {Array<{ value: string, label: string, color?: string, icon?: string }>} statusOptions
 */
export function computeStatusAggregates(records, statusOptions = []) {
  const list = records || []
  return statusOptions.map((option) => {
    const matched = list.filter((r) => (r.status || 'pending') === option.value)
    const count = matched.length
    const amount = matched.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0)
    return {
      ...option,
      count,
      amount
    }
  })
}

/**
 * 结算周期管理工具
 */

import dayjs from 'dayjs'

// 周期类型
export const CYCLE_TYPES = {
  MONTHLY: 'monthly',      // 月度
  QUARTERLY: 'quarterly',  // 季度
  YEARLY: 'yearly',        // 年度
  CUSTOM: 'custom'         // 自定义
}

// 周期类型显示名称
export const CYCLE_TYPE_NAMES = {
  [CYCLE_TYPES.MONTHLY]: '月度',
  [CYCLE_TYPES.QUARTERLY]: '季度',
  [CYCLE_TYPES.YEARLY]: '年度',
  [CYCLE_TYPES.CUSTOM]: '自定义'
}

/**
 * 从结算月份字符串解析日期
 */
export function parseSettlementMonth(monthStr) {
  if (!monthStr) return null
  // 格式：YYYY-MM 或 YYYYMM
  const normalized = monthStr.replace(/-/g, '')
  if (normalized.length === 6) {
    const year = normalized.substring(0, 4)
    const month = normalized.substring(4, 6)
    return dayjs(`${year}-${month}-01`)
  }
  return dayjs(monthStr)
}

/**
 * 获取周期开始日期
 */
export function getCycleStartDate(monthStr, cycleType = CYCLE_TYPES.MONTHLY) {
  const date = parseSettlementMonth(monthStr)
  if (!date || !date.isValid()) return null

  switch (cycleType) {
    case CYCLE_TYPES.MONTHLY:
      return date.startOf('month')
    
    case CYCLE_TYPES.QUARTERLY:
      const quarter = Math.floor((date.month()) / 3)
      return date.month(quarter * 3).startOf('month')
    
    case CYCLE_TYPES.YEARLY:
      return date.startOf('year')
    
    default:
      return date.startOf('month')
  }
}

/**
 * 获取周期结束日期
 */
export function getCycleEndDate(monthStr, cycleType = CYCLE_TYPES.MONTHLY) {
  const date = parseSettlementMonth(monthStr)
  if (!date || !date.isValid()) return null

  switch (cycleType) {
    case CYCLE_TYPES.MONTHLY:
      return date.endOf('month')
    
    case CYCLE_TYPES.QUARTERLY:
      const quarter = Math.floor((date.month()) / 3)
      return date.month(quarter * 3 + 2).endOf('month')
    
    case CYCLE_TYPES.YEARLY:
      return date.endOf('year')
    
    default:
      return date.endOf('month')
  }
}

/**
 * 获取周期标识（用于分组）
 */
export function getCycleKey(monthStr, cycleType = CYCLE_TYPES.MONTHLY) {
  const date = parseSettlementMonth(monthStr)
  if (!date || !date.isValid()) return '未设置'

  switch (cycleType) {
    case CYCLE_TYPES.MONTHLY:
      return date.format('YYYY-MM')
    
    case CYCLE_TYPES.QUARTERLY:
      const quarter = Math.floor((date.month()) / 3) + 1
      return `${date.year()}Q${quarter}`
    
    case CYCLE_TYPES.YEARLY:
      return date.format('YYYY')
    
    default:
      return date.format('YYYY-MM')
  }
}

/**
 * 获取周期显示名称
 */
export function getCycleDisplayName(cycleKey, cycleType = CYCLE_TYPES.MONTHLY) {
  if (cycleKey === '未设置') return cycleKey

  switch (cycleType) {
    case CYCLE_TYPES.MONTHLY:
      const monthDate = dayjs(cycleKey + '-01')
      return monthDate.isValid() ? monthDate.format('YYYY年MM月') : cycleKey
    
    case CYCLE_TYPES.QUARTERLY:
      return cycleKey.replace('Q', '年第') + '季度'
    
    case CYCLE_TYPES.YEARLY:
      return `${cycleKey}年`
    
    default:
      return cycleKey
  }
}

/**
 * 获取所有周期列表（按时间倒序）
 */
export function getAllCycles(records, cycleType = CYCLE_TYPES.MONTHLY) {
  const cycleMap = new Map()
  
  records.forEach(record => {
    const cycleKey = getCycleKey(record.settlementMonth, cycleType)
    if (!cycleMap.has(cycleKey)) {
      const startDate = getCycleStartDate(record.settlementMonth, cycleType)
      const endDate = getCycleEndDate(record.settlementMonth, cycleType)
      cycleMap.set(cycleKey, {
        key: cycleKey,
        displayName: getCycleDisplayName(cycleKey, cycleType),
        startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
        endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
        recordCount: 0,
        totalAmount: 0
      })
    }
    const cycle = cycleMap.get(cycleKey)
    cycle.recordCount++
    cycle.totalAmount += parseFloat(record.settlementAmount || 0)
  })

  // 转换为数组并按时间倒序排序
  return Array.from(cycleMap.values()).sort((a, b) => {
    if (a.key === '未设置') return 1
    if (b.key === '未设置') return -1
    return b.key.localeCompare(a.key)
  })
}

/**
 * 获取当前周期
 */
export function getCurrentCycle(cycleType = CYCLE_TYPES.MONTHLY) {
  const now = dayjs()
  
  switch (cycleType) {
    case CYCLE_TYPES.MONTHLY:
      return getCycleKey(now.format('YYYY-MM'), cycleType)
    
    case CYCLE_TYPES.QUARTERLY:
      return getCycleKey(now.format('YYYY-MM'), cycleType)
    
    case CYCLE_TYPES.YEARLY:
      return getCycleKey(now.format('YYYY-MM'), cycleType)
    
    default:
      return getCycleKey(now.format('YYYY-MM'), cycleType)
  }
}

/**
 * 获取上一个周期
 */
export function getPreviousCycle(cycleKey, cycleType = CYCLE_TYPES.MONTHLY) {
  if (cycleKey === '未设置') return null

  let date
  switch (cycleType) {
    case CYCLE_TYPES.MONTHLY:
      date = dayjs(cycleKey + '-01')
      return getCycleKey(date.subtract(1, 'month').format('YYYY-MM'), cycleType)
    
    case CYCLE_TYPES.QUARTERLY:
      const match = cycleKey.match(/(\d{4})Q(\d)/)
      if (match) {
        const year = parseInt(match[1])
        const quarter = parseInt(match[2])
        if (quarter === 1) {
          date = dayjs(`${year - 1}-12-01`)
        } else {
          date = dayjs(`${year}-${(quarter - 2) * 3 + 1}-01`)
        }
        return getCycleKey(date.format('YYYY-MM'), cycleType)
      }
      return null
    
    case CYCLE_TYPES.YEARLY:
      const year = parseInt(cycleKey)
      date = dayjs(`${year - 1}-01-01`)
      return getCycleKey(date.format('YYYY-MM'), cycleType)
    
    default:
      return null
  }
}

/**
 * 获取下一个周期
 */
export function getNextCycle(cycleKey, cycleType = CYCLE_TYPES.MONTHLY) {
  if (cycleKey === '未设置') return null

  let date
  switch (cycleType) {
    case CYCLE_TYPES.MONTHLY:
      date = dayjs(cycleKey + '-01')
      return getCycleKey(date.add(1, 'month').format('YYYY-MM'), cycleType)
    
    case CYCLE_TYPES.QUARTERLY:
      const match = cycleKey.match(/(\d{4})Q(\d)/)
      if (match) {
        const year = parseInt(match[1])
        const quarter = parseInt(match[2])
        if (quarter === 4) {
          date = dayjs(`${year + 1}-01-01`)
        } else {
          date = dayjs(`${year}-${quarter * 3 + 1}-01`)
        }
        return getCycleKey(date.format('YYYY-MM'), cycleType)
      }
      return null
    
    case CYCLE_TYPES.YEARLY:
      const year = parseInt(cycleKey)
      date = dayjs(`${year + 1}-01-01`)
      return getCycleKey(date.format('YYYY-MM'), cycleType)
    
    default:
      return null
  }
}

/**
 * 按周期筛选记录
 */
export function filterRecordsByCycle(records, cycleKey, cycleType = CYCLE_TYPES.MONTHLY) {
  if (!cycleKey || cycleKey === '未设置') {
    return records.filter(r => !r.settlementMonth)
  }

  return records.filter(record => {
    const recordCycleKey = getCycleKey(record.settlementMonth, cycleType)
    return recordCycleKey === cycleKey
  })
}

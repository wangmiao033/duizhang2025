/**
 * 结算单编号生成工具
 * 支持多种编号格式
 */

// 编号格式配置
export const SETTLEMENT_NUMBER_FORMATS = {
  // 格式1: JS-YYYYMMDD-001 (结算-年月日-序号)
  DATE_SEQUENCE: {
    name: '日期+序号',
    pattern: 'JS-{YYYYMMDD}-{SEQ}',
    description: 'JS-20250127-001'
  },
  // 格式2: JS-YYYYMM-合作方-001 (结算-年月-合作方-序号)
  MONTH_PARTNER_SEQUENCE: {
    name: '年月+合作方+序号',
    pattern: 'JS-{YYYYMM}-{PARTNER}-{SEQ}',
    description: 'JS-202501-合作方A-001'
  },
  // 格式3: SETTLEMENT-YYYYMMDD-HHMMSS (结算-年月日-时分秒)
  DATETIME: {
    name: '日期时间',
    pattern: 'SETTLEMENT-{YYYYMMDD}-{HHMMSS}',
    description: 'SETTLEMENT-20250127-143025'
  },
  // 格式4: JS-YYYYMM-001 (结算-年月-序号)
  MONTH_SEQUENCE: {
    name: '年月+序号',
    pattern: 'JS-{YYYYMM}-{SEQ}',
    description: 'JS-202501-001'
  },
  // 格式5: 01+YYYYMMDDHHMM (固定前缀+年月日时分，确保分粒度唯一)
  PREFIX01_MINUTE_TIMESTAMP: {
    name: '01+年月日时分',
    pattern: '01{YYYYMMDDHHMM}',
    description: '01202601271514'
  }
}

// 默认格式
const DEFAULT_FORMAT = 'DATE_SEQUENCE'

/**
 * 获取合作方简称（取前3个字符或拼音首字母）
 */
function getPartnerShortName(partner) {
  if (!partner) return 'UNK'
  
  // 如果合作方名称较短，直接使用
  if (partner.length <= 3) {
    return partner.toUpperCase()
  }
  
  // 取前3个字符并转为大写
  return partner.substring(0, 3).toUpperCase()
}

/**
 * 格式化日期
 */
function formatDate(date, format) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return {
    YYYY: year,
    YY: String(year).substring(2),
    MM: month,
    DD: day,
    YYYYMMDD: `${year}${month}${day}`,
    YYYYMM: `${year}${month}`,
    HHMMSS: `${hours}${minutes}${seconds}`,
    HHMM: `${hours}${minutes}` // 时分格式（用于01前缀格式）
  }
}

/**
 * 获取指定日期和格式的序号
 */
function getSequenceNumber(records, date, format, partner = null) {
  const dateStr = formatDate(date, format)
  let prefix = ''
  
  switch (format) {
    case 'DATE_SEQUENCE':
      prefix = `JS-${dateStr.YYYYMMDD}-`
      break
    case 'MONTH_PARTNER_SEQUENCE':
      const partnerShort = getPartnerShortName(partner)
      prefix = `JS-${dateStr.YYYYMM}-${partnerShort}-`
      break
    case 'DATETIME':
      prefix = `SETTLEMENT-${dateStr.YYYYMMDD}-`
      break
    case 'MONTH_SEQUENCE':
      prefix = `JS-${dateStr.YYYYMM}-`
      break
    case 'PREFIX01_MINUTE_TIMESTAMP':
      // 对于01前缀格式，前缀是 01 + YYYYMMDDHHMM
      prefix = `01${dateStr.YYYYMMDD}${dateStr.HHMM}`
      break
    default:
      prefix = `JS-${dateStr.YYYYMMDD}-`
  }
  
  // 对于 PREFIX01_MINUTE_TIMESTAMP 格式，需要特殊处理
  if (format === 'PREFIX01_MINUTE_TIMESTAMP') {
    // 查找相同时间戳的编号（同一分钟内创建的记录）
    const matchingNumbers = records
      .filter(r => r.settlementNumber && r.settlementNumber.startsWith(prefix))
      .length
    // 如果同一分钟内已有记录，添加序号后缀（但这种情况应该很少见）
    return matchingNumbers
  }
  
  // 查找相同前缀的编号
  const matchingNumbers = records
    .filter(r => r.settlementNumber && r.settlementNumber.startsWith(prefix))
    .map(r => {
      const match = r.settlementNumber.match(/-(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
  
  // 返回下一个序号
  const maxSeq = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : 0
  return maxSeq + 1
}

/**
 * 生成结算单编号
 * @param {Array} records - 现有记录数组
 * @param {Date} date - 日期对象（可选，默认当前日期）
 * @param {string} format - 编号格式（可选，默认DATE_SEQUENCE）
 * @param {string} partner - 合作方名称（可选，某些格式需要）
 * @returns {string} 生成的编号
 */
export function generateSettlementNumber(records = [], date = new Date(), format = DEFAULT_FORMAT, partner = null) {
  const dateStr = formatDate(date, format)
  const seq = getSequenceNumber(records, date, format, partner)
  
  switch (format) {
    case 'DATE_SEQUENCE':
      return `JS-${dateStr.YYYYMMDD}-${String(seq).padStart(3, '0')}`
    
    case 'MONTH_PARTNER_SEQUENCE':
      const partnerShort = getPartnerShortName(partner)
      return `JS-${dateStr.YYYYMM}-${partnerShort}-${String(seq).padStart(3, '0')}`
    
    case 'DATETIME':
      return `SETTLEMENT-${dateStr.YYYYMMDD}-${dateStr.HHMMSS}`
    
    case 'MONTH_SEQUENCE':
      return `JS-${dateStr.YYYYMM}-${String(seq).padStart(3, '0')}`
    
    case 'PREFIX01_MINUTE_TIMESTAMP':
      // 格式：01 + YYYYMMDDHHMM (14位数字)
      // 如果同一分钟内有多条记录，添加2位序号后缀（变成16位）以确保唯一性
      const baseNumber = `01${dateStr.YYYYMMDD}${dateStr.HHMM}`
      if (seq > 0) {
        return `${baseNumber}${String(seq).padStart(2, '0')}`
      }
      return baseNumber
    
    default:
      return `JS-${dateStr.YYYYMMDD}-${String(seq).padStart(3, '0')}`
  }
}

/**
 * 验证编号格式
 */
export function validateSettlementNumber(number, format = DEFAULT_FORMAT) {
  if (!number || typeof number !== 'string') return false
  
  const patterns = {
    DATE_SEQUENCE: /^JS-\d{8}-\d{3}$/,
    MONTH_PARTNER_SEQUENCE: /^JS-\d{6}-[A-Z0-9]{1,10}-\d{3}$/,
    DATETIME: /^SETTLEMENT-\d{8}-\d{6}$/,
    MONTH_SEQUENCE: /^JS-\d{6}-\d{3}$/,
    PREFIX01_MINUTE_TIMESTAMP: /^01\d{12}(\d{2})?$/ // 01 + 12位日期时间，可选2位序号
  }
  
  return patterns[format] ? patterns[format].test(number) : false
}

/**
 * 检查编号是否唯一
 */
export function isSettlementNumberUnique(records, number, excludeId = null) {
  return !records.some(r => 
    r.id !== excludeId && 
    r.settlementNumber === number
  )
}

/**
 * 从localStorage获取编号格式配置
 */
export function getNumberFormatFromStorage() {
  try {
    const saved = localStorage.getItem('settlementNumberFormat')
    return saved || DEFAULT_FORMAT
  } catch {
    return DEFAULT_FORMAT
  }
}

/**
 * 保存编号格式配置到localStorage
 */
export function saveNumberFormatToStorage(format) {
  try {
    localStorage.setItem('settlementNumberFormat', format)
  } catch (error) {
    console.error('保存编号格式失败:', error)
  }
}

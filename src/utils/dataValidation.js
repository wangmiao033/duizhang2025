/**
 * 数据校验增强工具
 * 提供全面的数据校验规则和校验功能
 */

/**
 * 校验规则配置
 */
export const VALIDATION_RULES = {
  // 必填字段
  REQUIRED_FIELDS: ['game', 'gameFlow'],
  
  // 字段范围限制
  FIELD_RANGES: {
    gameFlow: { min: 0, max: Infinity },
    testingFee: { min: 0, max: Infinity },
    voucher: { min: 0, max: Infinity },
    refund: { min: 0, max: Infinity },
    channelFeeRate: { min: 0, max: 100 },
    taxPoint: { min: 0, max: 100 },
    revenueShareRatio: { min: 0, max: 100 },
    discount: { min: 0, max: 1 },
    settlementAmount: { min: 0, max: Infinity }
  },
  
  // 业务规则阈值
  BUSINESS_RULES: {
    maxFeeRatio: 0.5, // 费用占流水最大比例
    maxFeeRatioWarning: 0.3, // 费用占流水警告比例
    minSettlementRatio: 0.1, // 结算金额占流水最小比例（警告）
    maxSettlementRatio: 0.9, // 结算金额占流水最大比例（警告）
    duplicateThreshold: 0.95 // 重复记录相似度阈值
  }
}

/**
 * 校验结果类型
 */
export const VALIDATION_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * 校验单个记录的完整性
 */
export function validateRecordCompleteness(record, index) {
  const issues = []
  const recordId = record.id || index

  // 检查必填字段
  if (!record.game || record.game.trim() === '') {
    issues.push({
      type: VALIDATION_TYPES.ERROR,
      recordIndex: index + 1,
      recordId,
      field: '游戏名称',
      message: '游戏名称不能为空',
      fixable: true,
      category: 'completeness',
      suggestion: '请填写游戏名称'
    })
  }

  if (!record.gameFlow || parseFloat(record.gameFlow) <= 0) {
    issues.push({
      type: VALIDATION_TYPES.ERROR,
      recordIndex: index + 1,
      recordId,
      field: '游戏流水',
      message: '游戏流水必须大于0',
      fixable: true,
      category: 'completeness',
      suggestion: '请填写有效的游戏流水金额'
    })
  }

  // 检查建议字段
  if (!record.partner || record.partner.trim() === '') {
    issues.push({
      type: VALIDATION_TYPES.WARNING,
      recordIndex: index + 1,
      recordId,
      field: '合作方',
      message: '建议填写合作方信息',
      fixable: true,
      category: 'completeness',
      suggestion: '建议填写合作方名称以便于管理'
    })
  }

  if (!record.settlementMonth || record.settlementMonth.trim() === '') {
    issues.push({
      type: VALIDATION_TYPES.WARNING,
      recordIndex: index + 1,
      recordId,
      field: '结算月份',
      message: '建议填写结算月份',
      fixable: true,
      category: 'completeness',
      suggestion: '建议填写结算月份以便于周期管理'
    })
  }

  if (!record.settlementNumber || record.settlementNumber.trim() === '') {
    issues.push({
      type: VALIDATION_TYPES.INFO,
      recordIndex: index + 1,
      recordId,
      field: '结算单编号',
      message: '未设置结算单编号',
      fixable: true,
      category: 'completeness',
      suggestion: '系统将自动生成编号'
    })
  }

  return issues
}

/**
 * 校验字段范围
 */
export function validateFieldRanges(record, index) {
  const issues = []
  const recordId = record.id || index

  Object.entries(VALIDATION_RULES.FIELD_RANGES).forEach(([field, range]) => {
    const value = parseFloat(record[field] || 0)
    
    if (isNaN(value)) {
      issues.push({
        type: VALIDATION_TYPES.ERROR,
        recordIndex: index + 1,
        recordId,
        field: getFieldDisplayName(field),
        message: `${getFieldDisplayName(field)}格式不正确`,
        fixable: true,
        category: 'range',
        suggestion: `请输入有效的数字`
      })
      return
    }

    if (value < range.min) {
      issues.push({
        type: VALIDATION_TYPES.ERROR,
        recordIndex: index + 1,
        recordId,
        field: getFieldDisplayName(field),
        message: `${getFieldDisplayName(field)}不能小于${range.min}`,
        fixable: true,
        category: 'range',
        suggestion: `请将${getFieldDisplayName(field)}调整为${range.min}或以上`
      })
    }

    if (value > range.max && range.max !== Infinity) {
      issues.push({
        type: VALIDATION_TYPES.ERROR,
        recordIndex: index + 1,
        recordId,
        field: getFieldDisplayName(field),
        message: `${getFieldDisplayName(field)}不能大于${range.max}`,
        fixable: true,
        category: 'range',
        suggestion: `请将${getFieldDisplayName(field)}调整为${range.max}或以下`
      })
    }
  })

  return issues
}

/**
 * 校验业务规则
 */
export function validateBusinessRules(record, index, calculateSettlementAmount) {
  const issues = []
  const recordId = record.id || index

  const gameFlow = parseFloat(record.gameFlow || 0)
  const testingFee = parseFloat(record.testingFee || 0)
  const voucher = parseFloat(record.voucher || 0)
  const refund = parseFloat(record.refund || 0)
  const settlementAmount = parseFloat(record.settlementAmount || 0)

  // 检查费用合理性
  const totalFee = testingFee + voucher
  if (totalFee > gameFlow) {
    issues.push({
      type: VALIDATION_TYPES.ERROR,
      recordIndex: index + 1,
      recordId,
      field: '费用',
      message: '测试费和代金券之和大于游戏流水，数据异常',
      fixable: false,
      category: 'business',
      suggestion: '请检查测试费和代金券金额是否正确'
    })
  } else if (totalFee > gameFlow * VALIDATION_RULES.BUSINESS_RULES.maxFeeRatio) {
    issues.push({
      type: VALIDATION_TYPES.ERROR,
      recordIndex: index + 1,
      recordId,
      field: '费用',
      message: `测试费和代金券之和(${totalFee.toFixed(2)})占游戏流水比例过高(${((totalFee / gameFlow) * 100).toFixed(1)}%)`,
      fixable: false,
      category: 'business',
      suggestion: '请确认费用金额是否正确，费用不应超过流水的50%'
    })
  } else if (totalFee > gameFlow * VALIDATION_RULES.BUSINESS_RULES.maxFeeRatioWarning) {
    issues.push({
      type: VALIDATION_TYPES.WARNING,
      recordIndex: index + 1,
      recordId,
      field: '费用',
      message: `测试费和代金券之和(${totalFee.toFixed(2)})占游戏流水比例较高(${((totalFee / gameFlow) * 100).toFixed(1)}%)，请确认`,
      fixable: false,
      category: 'business',
      suggestion: '请确认费用金额是否正确'
    })
  }

  // 检查结算金额合理性
  if (gameFlow > 0 && settlementAmount > 0) {
    const settlementRatio = settlementAmount / gameFlow
    if (settlementRatio < VALIDATION_RULES.BUSINESS_RULES.minSettlementRatio) {
      issues.push({
        type: VALIDATION_TYPES.WARNING,
        recordIndex: index + 1,
        recordId,
        field: '结算金额',
        message: `结算金额(${settlementAmount.toFixed(2)})占游戏流水比例较低(${(settlementRatio * 100).toFixed(1)}%)，请确认`,
        fixable: false,
        category: 'business',
        suggestion: '请确认结算金额计算是否正确'
      })
    } else if (settlementRatio > VALIDATION_RULES.BUSINESS_RULES.maxSettlementRatio) {
      issues.push({
        type: VALIDATION_TYPES.WARNING,
        recordIndex: index + 1,
        recordId,
        field: '结算金额',
        message: `结算金额(${settlementAmount.toFixed(2)})占游戏流水比例较高(${(settlementRatio * 100).toFixed(1)}%)，请确认`,
        fixable: false,
        category: 'business',
        suggestion: '请确认结算金额计算是否正确'
      })
    }
  }

  // 检查结算金额计算一致性
  if (calculateSettlementAmount) {
    const calculatedAmount = calculateSettlementAmount(record)
    const difference = Math.abs(settlementAmount - calculatedAmount)
    const tolerance = 0.01 // 允许0.01的误差

    if (difference > tolerance) {
      issues.push({
        type: VALIDATION_TYPES.ERROR,
        recordIndex: index + 1,
        recordId,
        field: '结算金额',
        message: `结算金额(${settlementAmount.toFixed(2)})与计算值(${calculatedAmount.toFixed(2)})不一致，差异：${difference.toFixed(2)}`,
        fixable: true,
        category: 'consistency',
        suggestion: `建议将结算金额更新为${calculatedAmount.toFixed(2)}`,
        autoFixValue: calculatedAmount.toFixed(2)
      })
    }
  }

  return issues
}

/**
 * 校验数据一致性（跨记录校验）
 */
export function validateDataConsistency(records, record, index) {
  const issues = []
  const recordId = record.id || index

  // 检查重复记录
  const duplicates = records.filter(r => 
    r.id !== record.id &&
    r.game === record.game && 
    r.partner === record.partner &&
    r.settlementMonth === record.settlementMonth
  )

  if (duplicates.length > 0) {
    issues.push({
      type: VALIDATION_TYPES.WARNING,
      recordIndex: index + 1,
      recordId,
      field: '重复记录',
      message: `发现${duplicates.length}条重复记录（相同游戏、合作方、结算月份）`,
      fixable: false,
      category: 'consistency',
      suggestion: '请检查是否为重复录入，或考虑合并记录',
      relatedRecords: duplicates.map(d => d.id)
    })
  }

  // 检查相似记录（相同游戏和合作方，不同月份）
  const similarRecords = records.filter(r => 
    r.id !== record.id &&
    r.game === record.game && 
    r.partner === record.partner &&
    r.settlementMonth !== record.settlementMonth
  )

  if (similarRecords.length > 0) {
    // 检查费率是否一致
    similarRecords.forEach(similar => {
      const fieldsToCheck = ['channelFeeRate', 'taxPoint', 'revenueShareRatio', 'discount']
      fieldsToCheck.forEach(field => {
        const currentValue = parseFloat(record[field] || 0)
        const similarValue = parseFloat(similar[field] || 0)
        const difference = Math.abs(currentValue - similarValue)
        
        if (difference > 0.01) {
          issues.push({
            type: VALIDATION_TYPES.INFO,
            recordIndex: index + 1,
            recordId,
            field: getFieldDisplayName(field),
            message: `${getFieldDisplayName(field)}(${currentValue})与其他月份记录(${similarValue})不一致`,
            fixable: false,
            category: 'consistency',
            suggestion: `请确认${getFieldDisplayName(field)}是否正确，相同游戏和合作方的费率通常应保持一致`
          })
        }
      })
    })
  }

  return issues
}

/**
 * 校验结算月份格式
 */
export function validateSettlementMonthFormat(record, index) {
  const issues = []
  const recordId = record.id || index

  if (!record.settlementMonth) return issues

  // 支持多种格式：YYYY-MM, YYYY年MM月, YYYYMM
  const formats = [
    /^\d{4}-\d{1,2}$/, // YYYY-MM
    /^\d{4}年\d{1,2}月$/, // YYYY年MM月
    /^\d{6}$/ // YYYYMM
  ]

  const isValidFormat = formats.some(format => format.test(record.settlementMonth))

  if (!isValidFormat) {
    issues.push({
      type: VALIDATION_TYPES.WARNING,
      recordIndex: index + 1,
      recordId,
      field: '结算月份',
      message: '结算月份格式不规范',
      fixable: true,
      category: 'format',
      suggestion: '建议使用格式：YYYY-MM（如：2025-01）或 YYYY年MM月（如：2025年1月）'
    })
  }

  return issues
}

/**
 * 批量校验所有记录
 */
export function validateAllRecords(records, calculateSettlementAmount) {
  const allIssues = []

  records.forEach((record, index) => {
    // 完整性校验
    allIssues.push(...validateRecordCompleteness(record, index))
    
    // 范围校验
    allIssues.push(...validateFieldRanges(record, index))
    
    // 业务规则校验
    allIssues.push(...validateBusinessRules(record, index, calculateSettlementAmount))
    
    // 格式校验
    allIssues.push(...validateSettlementMonthFormat(record, index))
    
    // 一致性校验
    allIssues.push(...validateDataConsistency(records, record, index))
  })

  return allIssues
}

/**
 * 获取字段显示名称
 */
function getFieldDisplayName(field) {
  const fieldNames = {
    game: '游戏名称',
    gameFlow: '游戏流水',
    testingFee: '测试费',
    voucher: '代金券',
    refund: '退款',
    channelFeeRate: '通道费率',
    taxPoint: '税点',
    revenueShareRatio: '分成比例',
    discount: '折扣',
    settlementAmount: '结算金额',
    settlementMonth: '结算月份',
    partner: '合作方',
    settlementNumber: '结算单编号'
  }
  return fieldNames[field] || field
}

/**
 * 按类别分组校验问题
 */
export function groupIssuesByCategory(issues) {
  const grouped = {
    completeness: [],
    range: [],
    business: [],
    consistency: [],
    format: []
  }

  issues.forEach(issue => {
    if (grouped[issue.category]) {
      grouped[issue.category].push(issue)
    }
  })

  return grouped
}

/**
 * 获取校验统计信息
 */
export function getValidationStatistics(issues) {
  return {
    total: issues.length,
    errors: issues.filter(i => i.type === VALIDATION_TYPES.ERROR).length,
    warnings: issues.filter(i => i.type === VALIDATION_TYPES.WARNING).length,
    info: issues.filter(i => i.type === VALIDATION_TYPES.INFO).length,
    fixable: issues.filter(i => i.fixable).length,
    byCategory: groupIssuesByCategory(issues)
  }
}

import React, { useMemo } from 'react'
import './DataValidator.css'

function DataValidator({ records }) {
  const issues = useMemo(() => {
    const foundIssues = []

    records.forEach((record, index) => {
      // 检查必填字段
      if (!record.game) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          field: '游戏名称',
          message: '游戏名称不能为空'
        })
      }

      if (!record.gameFlow || parseFloat(record.gameFlow) <= 0) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          field: '游戏流水',
          message: '游戏流水必须大于0'
        })
      }

      // 检查数据合理性
      const gameFlow = parseFloat(record.gameFlow || 0)
      const testingFee = parseFloat(record.testingFee || 0)
      const voucher = parseFloat(record.voucher || 0)

      if (testingFee + voucher > gameFlow) {
        foundIssues.push({
          type: 'warning',
          recordIndex: index + 1,
          field: '费用',
          message: '测试费和代金券之和大于游戏流水，请检查'
        })
      }

      // 检查结算金额
      const settlementAmount = parseFloat(record.settlementAmount || 0)
      if (settlementAmount < 0) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          field: '结算金额',
          message: '结算金额不能为负数'
        })
      }

      // 检查费率范围
      const channelFeeRate = parseFloat(record.channelFeeRate || 0)
      if (channelFeeRate < 0 || channelFeeRate > 100) {
        foundIssues.push({
          type: 'warning',
          recordIndex: index + 1,
          field: '通道费率',
          message: '通道费率应在0-100%之间'
        })
      }
    })

    return foundIssues
  }, [records])

  if (issues.length === 0) {
    return (
      <div className="data-validator valid">
        <span className="validator-icon">✓</span>
        <span>数据校验通过</span>
      </div>
    )
  }

  const errorCount = issues.filter(i => i.type === 'error').length
  const warningCount = issues.filter(i => i.type === 'warning').length

  return (
    <div className="data-validator has-issues">
      <div className="validator-header">
        <span className="validator-icon">⚠️</span>
        <span>发现 {errorCount} 个错误，{warningCount} 个警告</span>
      </div>
      <div className="validator-issues">
        {issues.map((issue, idx) => (
          <div key={idx} className={`validator-issue ${issue.type}`}>
            <span className="issue-record">记录 #{issue.recordIndex}</span>
            <span className="issue-field">{issue.field}:</span>
            <span className="issue-message">{issue.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DataValidator


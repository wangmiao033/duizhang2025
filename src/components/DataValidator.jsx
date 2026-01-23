import React, { useMemo, useState } from 'react'
import './DataValidator.css'

function DataValidator({ records, onIssueClick }) {
  const [expanded, setExpanded] = useState(true)
  const [filterType, setFilterType] = useState('all') // all, error, warning

  const issues = useMemo(() => {
    const foundIssues = []

    records.forEach((record, index) => {
      const recordId = record.id || index
      
      // 检查必填字段
      if (!record.game || record.game.trim() === '') {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          recordId,
          field: '游戏名称',
          message: '游戏名称不能为空',
          fixable: true
        })
      }

      if (!record.partner || record.partner.trim() === '') {
        foundIssues.push({
          type: 'warning',
          recordIndex: index + 1,
          recordId,
          field: '合作方',
          message: '建议填写合作方信息',
          fixable: true
        })
      }

      if (!record.gameFlow || parseFloat(record.gameFlow) <= 0) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          recordId,
          field: '游戏流水',
          message: '游戏流水必须大于0',
          fixable: true
        })
      }

      // 检查数据合理性
      const gameFlow = parseFloat(record.gameFlow || 0)
      const testingFee = parseFloat(record.testingFee || 0)
      const voucher = parseFloat(record.voucher || 0)

      if (testingFee + voucher > gameFlow * 0.5) {
        foundIssues.push({
          type: 'warning',
          recordIndex: index + 1,
          recordId,
          field: '费用',
          message: `测试费和代金券之和(${testingFee + voucher})占游戏流水比例较高(${((testingFee + voucher) / gameFlow * 100).toFixed(1)}%)，请确认`,
          fixable: false
        })
      }

      if (testingFee + voucher > gameFlow) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          recordId,
          field: '费用',
          message: '测试费和代金券之和大于游戏流水，数据异常',
          fixable: false
        })
      }

      // 检查结算金额
      const settlementAmount = parseFloat(record.settlementAmount || 0)
      if (settlementAmount < 0) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          recordId,
          field: '结算金额',
          message: '结算金额不能为负数',
          fixable: false
        })
      }

      // 检查费率范围
      const channelFeeRate = parseFloat(record.channelFeeRate || 0)
      if (channelFeeRate < 0 || channelFeeRate > 100) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          recordId,
          field: '通道费率',
          message: '通道费率应在0-100%之间',
          fixable: true
        })
      }

      const taxPoint = parseFloat(record.taxPoint || 0)
      if (taxPoint < 0 || taxPoint > 100) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          recordId,
          field: '税点',
          message: '税点应在0-100%之间',
          fixable: true
        })
      }

      const revenueShareRatio = parseFloat(record.revenueShareRatio || 0)
      if (revenueShareRatio < 0 || revenueShareRatio > 100) {
        foundIssues.push({
          type: 'error',
          recordIndex: index + 1,
          recordId,
          field: '分成比例',
          message: '分成比例应在0-100%之间',
          fixable: true
        })
      }

      // 检查折扣范围
      const discount = parseFloat(record.discount || 1)
      if (discount < 0 || discount > 1) {
        foundIssues.push({
          type: 'warning',
          recordIndex: index + 1,
          recordId,
          field: '折扣',
          message: '折扣应在0-1之间（1表示无折扣）',
          fixable: true
        })
      }

      // 检查结算月份格式
      if (record.settlementMonth && !/^\d{4}年\d{1,2}月$/.test(record.settlementMonth)) {
        foundIssues.push({
          type: 'warning',
          recordIndex: index + 1,
          recordId,
          field: '结算月份',
          message: '结算月份格式建议为：YYYY年MM月（如：2025年1月）',
          fixable: true
        })
      }

      // 检查重复记录
      const duplicateRecords = records.filter(r => 
        r.game === record.game && 
        r.partner === record.partner &&
        r.settlementMonth === record.settlementMonth &&
        r.id !== record.id
      )
      if (duplicateRecords.length > 0) {
        foundIssues.push({
          type: 'warning',
          recordIndex: index + 1,
          recordId,
          field: '重复记录',
          message: `可能存在重复记录（相同游戏、合作方、结算月份）`,
          fixable: false
        })
      }
    })

    return foundIssues
  }, [records])

  const filteredIssues = filterType === 'all' 
    ? issues 
    : issues.filter(i => i.type === filterType)

  const errorCount = issues.filter(i => i.type === 'error').length
  const warningCount = issues.filter(i => i.type === 'warning').length

  if (issues.length === 0) {
    return (
      <div className="data-validator valid">
        <div className="validator-success-content">
          <span className="validator-icon success">✓</span>
          <div>
            <div className="success-title">数据校验通过</div>
            <div className="success-subtitle">所有记录均符合校验规则</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="data-validator has-issues">
      <div className="validator-header" onClick={() => setExpanded(!expanded)}>
        <div className="validator-header-left">
          <span className="validator-icon warning">⚠️</span>
          <div>
            <div className="validator-title">
              发现 {errorCount} 个错误，{warningCount} 个警告
            </div>
            <div className="validator-subtitle">点击展开查看详情</div>
          </div>
        </div>
        <button className="expand-btn">{expanded ? '▼' : '▶'}</button>
      </div>

      {expanded && (
        <>
          <div className="validator-filters">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              全部 ({issues.length})
            </button>
            <button
              className={`filter-btn ${filterType === 'error' ? 'active' : ''}`}
              onClick={() => setFilterType('error')}
            >
              错误 ({errorCount})
            </button>
            <button
              className={`filter-btn ${filterType === 'warning' ? 'active' : ''}`}
              onClick={() => setFilterType('warning')}
            >
              警告 ({warningCount})
            </button>
          </div>

          <div className="validator-issues">
            {filteredIssues.length === 0 ? (
              <div className="no-issues">当前筛选条件下无问题</div>
            ) : (
              filteredIssues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className={`validator-issue ${issue.type}`}
                  onClick={() => onIssueClick && onIssueClick(issue.recordId)}
                >
                  <div className="issue-header">
                    <span className="issue-type-badge">{issue.type === 'error' ? '错误' : '警告'}</span>
                    <span className="issue-record">记录 #{issue.recordIndex}</span>
                    {issue.fixable && <span className="fixable-badge">可修复</span>}
                  </div>
                  <div className="issue-content">
                    <span className="issue-field">{issue.field}:</span>
                    <span className="issue-message">{issue.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default DataValidator


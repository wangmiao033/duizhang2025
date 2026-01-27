import React, { useMemo, useState } from 'react'
import './DataValidator.css'
import {
  validateAllRecords,
  getValidationStatistics,
  VALIDATION_TYPES,
  groupIssuesByCategory
} from '../utils/dataValidation.js'

function DataValidator({ records, onIssueClick, calculateSettlementAmount, onAutoFix }) {
  const [expanded, setExpanded] = useState(true)
  const [filterType, setFilterType] = useState('all') // all, error, warning, info
  const [filterCategory, setFilterCategory] = useState('all') // all, completeness, range, business, consistency, format

  const issues = useMemo(() => {
    if (!records || records.length === 0) return []
    return validateAllRecords(records, calculateSettlementAmount)
  }, [records, calculateSettlementAmount])

  const statistics = useMemo(() => {
    return getValidationStatistics(issues)
  }, [issues])

  const filteredIssues = useMemo(() => {
    let filtered = issues

    // 按类型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(i => i.type === filterType)
    }

    // 按类别筛选
    if (filterCategory !== 'all') {
      filtered = filtered.filter(i => i.category === filterCategory)
    }

    return filtered
  }, [issues, filterType, filterCategory])

  const handleAutoFix = (issue) => {
    if (issue.autoFixValue !== undefined && onAutoFix) {
      onAutoFix(issue.recordId, issue.field, issue.autoFixValue)
    }
  }

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
              发现 {statistics.errors} 个错误，{statistics.warnings} 个警告，{statistics.info} 个提示
            </div>
            <div className="validator-subtitle">
              共 {statistics.total} 个问题，其中 {statistics.fixable} 个可自动修复
            </div>
          </div>
        </div>
        <button className="expand-btn">{expanded ? '▼' : '▶'}</button>
      </div>

      {expanded && (
        <>
          <div className="validator-filters">
            <div className="filter-group">
              <label>类型：</label>
              <button
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                全部 ({statistics.total})
              </button>
              <button
                className={`filter-btn ${filterType === VALIDATION_TYPES.ERROR ? 'active' : ''}`}
                onClick={() => setFilterType(VALIDATION_TYPES.ERROR)}
              >
                错误 ({statistics.errors})
              </button>
              <button
                className={`filter-btn ${filterType === VALIDATION_TYPES.WARNING ? 'active' : ''}`}
                onClick={() => setFilterType(VALIDATION_TYPES.WARNING)}
              >
                警告 ({statistics.warnings})
              </button>
              <button
                className={`filter-btn ${filterType === VALIDATION_TYPES.INFO ? 'active' : ''}`}
                onClick={() => setFilterType(VALIDATION_TYPES.INFO)}
              >
                提示 ({statistics.info})
              </button>
            </div>
            <div className="filter-group">
              <label>类别：</label>
              <button
                className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                全部
              </button>
              <button
                className={`filter-btn ${filterCategory === 'completeness' ? 'active' : ''}`}
                onClick={() => setFilterCategory('completeness')}
              >
                完整性 ({statistics.byCategory.completeness.length})
              </button>
              <button
                className={`filter-btn ${filterCategory === 'range' ? 'active' : ''}`}
                onClick={() => setFilterCategory('range')}
              >
                范围 ({statistics.byCategory.range.length})
              </button>
              <button
                className={`filter-btn ${filterCategory === 'business' ? 'active' : ''}`}
                onClick={() => setFilterCategory('business')}
              >
                业务规则 ({statistics.byCategory.business.length})
              </button>
              <button
                className={`filter-btn ${filterCategory === 'consistency' ? 'active' : ''}`}
                onClick={() => setFilterCategory('consistency')}
              >
                一致性 ({statistics.byCategory.consistency.length})
              </button>
              <button
                className={`filter-btn ${filterCategory === 'format' ? 'active' : ''}`}
                onClick={() => setFilterCategory('format')}
              >
                格式 ({statistics.byCategory.format.length})
              </button>
            </div>
          </div>

          <div className="validator-issues">
            {filteredIssues.length === 0 ? (
              <div className="no-issues">当前筛选条件下无问题</div>
            ) : (
              filteredIssues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className={`validator-issue ${issue.type}`}
                >
                  <div className="issue-header">
                    <div className="issue-header-left">
                      <span className={`issue-type-badge ${issue.type}`}>
                        {issue.type === VALIDATION_TYPES.ERROR ? '错误' : issue.type === VALIDATION_TYPES.WARNING ? '警告' : '提示'}
                      </span>
                      <span className="issue-category-badge">{getCategoryName(issue.category)}</span>
                      <span className="issue-record" onClick={() => onIssueClick && onIssueClick(issue.recordId)}>
                        记录 #{issue.recordIndex}
                      </span>
                    </div>
                    <div className="issue-header-right">
                      {issue.fixable && (
                        <span className="fixable-badge">
                          {issue.autoFixValue ? '可自动修复' : '可修复'}
                        </span>
                      )}
                      {issue.autoFixValue && onAutoFix && (
                        <button 
                          className="auto-fix-btn"
                          onClick={() => handleAutoFix(issue)}
                          title="自动修复"
                        >
                          修复
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="issue-content">
                    <div className="issue-main">
                      <span className="issue-field">{issue.field}:</span>
                      <span className="issue-message">{issue.message}</span>
                    </div>
                    {issue.suggestion && (
                      <div className="issue-suggestion">
                        <span className="suggestion-label">💡 建议：</span>
                        <span className="suggestion-text">{issue.suggestion}</span>
                        {issue.autoFixValue && (
                          <span className="auto-fix-value">（自动修复值：{issue.autoFixValue}）</span>
                        )}
                      </div>
                    )}
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

function getCategoryName(category) {
  const categoryNames = {
    completeness: '完整性',
    range: '范围',
    business: '业务规则',
    consistency: '一致性',
    format: '格式'
  }
  return categoryNames[category] || category
}

export default DataValidator


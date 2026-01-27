import React, { useState, useMemo } from 'react'
import './SettlementCycleManager.css'
import {
  CYCLE_TYPES,
  CYCLE_TYPE_NAMES,
  getAllCycles,
  getCurrentCycle,
  getCycleDisplayName,
  filterRecordsByCycle,
  getPreviousCycle,
  getNextCycle
} from '../utils/settlementCycle.js'

function SettlementCycleManager({ 
  records, 
  selectedCycleKey, 
  cycleType,
  onCycleChange,
  onCycleTypeChange 
}) {
  const [showCycleSelector, setShowCycleSelector] = useState(false)

  // 获取所有周期
  const cycles = useMemo(() => {
    return getAllCycles(records, cycleType)
  }, [records, cycleType])

  // 当前周期信息
  const currentCycleInfo = useMemo(() => {
    return cycles.find(c => c.key === selectedCycleKey) || cycles[0] || null
  }, [cycles, selectedCycleKey])

  // 当前周期记录
  const currentCycleRecords = useMemo(() => {
    if (!selectedCycleKey) return []
    return filterRecordsByCycle(records, selectedCycleKey, cycleType)
  }, [records, selectedCycleKey, cycleType])

  const handleCycleSelect = (cycleKey) => {
    if (onCycleChange) {
      onCycleChange(cycleKey)
    }
    setShowCycleSelector(false)
  }

  const handlePreviousCycle = () => {
    if (!selectedCycleKey) return
    const prevCycle = getPreviousCycle(selectedCycleKey, cycleType)
    if (prevCycle && onCycleChange) {
      onCycleChange(prevCycle)
    }
  }

  const handleNextCycle = () => {
    if (!selectedCycleKey) return
    const nextCycle = getNextCycle(selectedCycleKey, cycleType)
    if (nextCycle && onCycleChange) {
      onCycleChange(nextCycle)
    }
  }

  const handleGoToCurrent = () => {
    const current = getCurrentCycle(cycleType)
    if (onCycleChange) {
      onCycleChange(current)
    }
  }

  return (
    <div className="settlement-cycle-manager">
      <div className="cycle-controls">
        <div className="cycle-type-selector">
          <label>周期类型：</label>
          <select
            value={cycleType}
            onChange={(e) => onCycleTypeChange && onCycleTypeChange(e.target.value)}
            className="cycle-type-select"
          >
            {Object.entries(CYCLE_TYPES).map(([key, value]) => (
              <option key={key} value={value}>
                {CYCLE_TYPE_NAMES[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="cycle-navigation">
          <button
            className="cycle-nav-btn"
            onClick={handlePreviousCycle}
            disabled={!selectedCycleKey || !getPreviousCycle(selectedCycleKey, cycleType)}
            title="上一个周期"
          >
            ← 上一周期
          </button>

          <button
            className="cycle-select-btn"
            onClick={() => setShowCycleSelector(!showCycleSelector)}
            title="选择周期"
          >
            {currentCycleInfo ? (
              <>
                <span className="cycle-name">{currentCycleInfo.displayName}</span>
                <span className="cycle-stats">
                  ({currentCycleRecords.length}条 / ¥{currentCycleInfo.totalAmount.toFixed(2)})
                </span>
              </>
            ) : (
              '选择周期'
            )}
            <span className="dropdown-arrow">▼</span>
          </button>

          <button
            className="cycle-nav-btn"
            onClick={handleNextCycle}
            disabled={!selectedCycleKey || !getNextCycle(selectedCycleKey, cycleType)}
            title="下一个周期"
          >
            下一周期 →
          </button>

          <button
            className="cycle-current-btn"
            onClick={handleGoToCurrent}
            title="跳转到当前周期"
          >
            当前周期
          </button>
        </div>
      </div>

      {showCycleSelector && (
        <>
          <div 
            className="cycle-selector-overlay" 
            onClick={() => setShowCycleSelector(false)}
          />
          <div className="cycle-selector-menu">
            <div className="cycle-selector-header">
              <h4>选择{CYCLE_TYPE_NAMES[cycleType]}</h4>
              <button 
                className="close-btn"
                onClick={() => setShowCycleSelector(false)}
              >
                ×
              </button>
            </div>
            <div className="cycle-list">
              {cycles.length === 0 ? (
                <div className="empty-cycles">暂无周期数据</div>
              ) : (
                cycles.map(cycle => (
                  <button
                    key={cycle.key}
                    className={`cycle-item ${selectedCycleKey === cycle.key ? 'active' : ''}`}
                    onClick={() => handleCycleSelect(cycle.key)}
                  >
                    <div className="cycle-item-header">
                      <span className="cycle-item-name">{cycle.displayName}</span>
                      <span className="cycle-item-date">
                        {cycle.startDate && cycle.endDate 
                          ? `${cycle.startDate} ~ ${cycle.endDate}`
                          : ''}
                      </span>
                    </div>
                    <div className="cycle-item-stats">
                      <span className="stat-item">
                        <span className="stat-label">记录数：</span>
                        <span className="stat-value">{cycle.recordCount}</span>
                      </span>
                      <span className="stat-item">
                        <span className="stat-label">金额：</span>
                        <span className="stat-value amount">¥{cycle.totalAmount.toFixed(2)}</span>
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SettlementCycleManager

import React, { useState } from 'react'
import './FilterSort.css'
import { STATUS_OPTIONS } from './StatusManager.jsx'

const EMPTY_FILTERS = {
  partner: '',
  game: '',
  status: '',
  minAmount: '',
  maxAmount: ''
}

function FilterSort({
  onFilterChange,
  onSortChange,
  filterValues,
  sortField,
  sortOrder: sortOrderProp,
  variant = 'panel'
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [internalFilters, setInternalFilters] = useState({ ...EMPTY_FILTERS })
  const [internalSortBy, setInternalSortBy] = useState('')
  const [internalSortOrder, setInternalSortOrder] = useState('desc')

  const controlled = filterValues != null
  const filters = controlled ? { ...EMPTY_FILTERS, ...filterValues } : internalFilters
  const sortBy = sortField != null ? sortField : internalSortBy
  const sortOrder = sortOrderProp != null ? sortOrderProp : internalSortOrder

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    if (!controlled) {
      setInternalFilters(newFilters)
    }
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const clearFilters = () => {
    const clearedFilters = { ...EMPTY_FILTERS }
    if (!controlled) {
      setInternalFilters(clearedFilters)
    }
    if (onFilterChange) {
      onFilterChange(clearedFilters)
    }
  }

  const handleSortChange = (field) => {
    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      if (!controlled && sortField == null) {
        setInternalSortOrder(newOrder)
      }
      if (onSortChange) {
        onSortChange(field, newOrder)
      }
    } else {
      if (!controlled && sortField == null) {
        setInternalSortBy(field)
        setInternalSortOrder('desc')
      }
      if (onSortChange) {
        onSortChange(field, 'desc')
      }
    }
  }

  const hasActiveFilters =
    filters.partner || filters.game || filters.status || filters.minAmount || filters.maxAmount

  if (variant === 'inline') {
    const setSortField = (field) => {
      const f = field || ''
      if (!f) {
        if (onSortChange) onSortChange('', sortOrder)
        return
      }
      if (onSortChange) onSortChange(f, sortOrder)
    }
    const setSortOrderOnly = (order) => {
      if (onSortChange) onSortChange(sortBy || 'gameFlow', order)
    }
    return (
      <div className="filter-sort filter-sort--inline">
        <div className="filter-inline-group">
          <label>合作方</label>
          <input
            type="text"
            value={filters.partner}
            onChange={(e) => handleFilterChange('partner', e.target.value)}
            placeholder="合作方"
          />
        </div>
        <div className="filter-inline-group">
          <label>游戏</label>
          <input
            type="text"
            value={filters.game}
            onChange={(e) => handleFilterChange('game', e.target.value)}
            placeholder="游戏"
          />
        </div>
        <div className="filter-inline-group">
          <label>状态</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-inline-group filter-inline-group--narrow">
          <label>排序</label>
          <select
            value={sortBy || ''}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="">默认</option>
            <option value="gameFlow">游戏流水</option>
            <option value="settlementAmount">结算金额</option>
            <option value="game">游戏名称</option>
            <option value="partner">合作方</option>
          </select>
        </div>
        <div className="filter-inline-group filter-inline-group--narrow">
          <label>顺序</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrderOnly(e.target.value)}
            disabled={!sortBy}
          >
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button type="button" className="filter-inline-reset" onClick={clearFilters}>
            重置筛选
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="filter-sort">
      <button 
        type="button"
        className="filter-toggle-btn"
        onClick={() => setShowFilters(!showFilters)}
      >
        🔍 筛选和排序 {hasActiveFilters && <span className="filter-badge">●</span>}
      </button>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-section">
            <h4>筛选条件</h4>
            <div className="filter-row">
              <div className="filter-group">
                <label>合作方：</label>
                <input
                  type="text"
                  value={filters.partner}
                  onChange={(e) => handleFilterChange('partner', e.target.value)}
                  placeholder="输入合作方名称"
                />
              </div>
              <div className="filter-group">
                <label>游戏：</label>
                <input
                  type="text"
                  value={filters.game}
                  onChange={(e) => handleFilterChange('game', e.target.value)}
                  placeholder="输入游戏名称"
                />
              </div>
              <div className="filter-group">
                <label>状态：</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">全部状态</option>
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <label>最小金额：</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="filter-group">
                <label>最大金额：</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="无限制"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                清除筛选
              </button>
            )}
          </div>

          <div className="sort-section">
            <h4>排序方式</h4>
            <div className="sort-buttons">
              <button
                className={`sort-btn ${sortBy === 'gameFlow' ? 'active' : ''}`}
                onClick={() => handleSortChange('gameFlow')}
              >
                游戏流水 {sortBy === 'gameFlow' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`sort-btn ${sortBy === 'settlementAmount' ? 'active' : ''}`}
                onClick={() => handleSortChange('settlementAmount')}
              >
                结算金额 {sortBy === 'settlementAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`sort-btn ${sortBy === 'game' ? 'active' : ''}`}
                onClick={() => handleSortChange('game')}
              >
                游戏名称 {sortBy === 'game' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`sort-btn ${sortBy === 'partner' ? 'active' : ''}`}
                onClick={() => handleSortChange('partner')}
              >
                合作方 {sortBy === 'partner' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { EMPTY_FILTERS }
export default FilterSort


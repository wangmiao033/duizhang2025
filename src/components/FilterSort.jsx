import React, { useState } from 'react'
import './FilterSort.css'
import { STATUS_OPTIONS } from './StatusManager.jsx'

function FilterSort({ onFilterChange, onSortChange }) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    partner: '',
    game: '',
    status: '',
    minAmount: '',
    maxAmount: ''
  })
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const clearFilters = () => {
    const clearedFilters = {
      partner: '',
      game: '',
      status: '',
      minAmount: '',
      maxAmount: ''
    }
    setFilters(clearedFilters)
    if (onFilterChange) {
      onFilterChange(clearedFilters)
    }
  }

  const handleSortChange = (field) => {
    if (sortBy === field) {
      // 切换排序顺序
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      setSortOrder(newOrder)
      if (onSortChange) {
        onSortChange(field, newOrder)
      }
    } else {
      // 新的排序字段
      setSortBy(field)
      setSortOrder('desc')
      if (onSortChange) {
        onSortChange(field, 'desc')
      }
    }
  }

  const hasActiveFilters = filters.partner || filters.game || filters.status || filters.minAmount || filters.maxAmount

  return (
    <div className="filter-sort">
      <button 
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

export default FilterSort


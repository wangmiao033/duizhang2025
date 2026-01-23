import React from 'react'
import './SearchFilter.css'

function SearchFilter({ searchTerm, onSearchChange, resultCount, totalCount }) {
  return (
    <div className="search-filter">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="搜索游戏、合作方或结算月份..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search" 
            onClick={() => onSearchChange('')}
            title="清除搜索"
          >
            ×
          </button>
        )}
      </div>
      <div className="search-stats">
        {searchTerm ? (
          <span>找到 <strong>{resultCount}</strong> 条记录（共 {totalCount} 条）</span>
        ) : (
          <span>共 <strong>{totalCount}</strong> 条记录</span>
        )}
      </div>
    </div>
  )
}

export default SearchFilter


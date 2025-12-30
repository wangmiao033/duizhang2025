import React from 'react'
import './QuickActions.css'

function QuickActions({ 
  onClearAll, 
  onExportAll, 
  onImportData,
  recordCount 
}) {
  const handleClearAll = () => {
    if (window.confirm(`确定要清空所有 ${recordCount} 条记录吗？此操作无法撤销！`)) {
      if (onClearAll) {
        onClearAll()
      }
    }
  }

  return (
    <div className="quick-actions">
      <h4>快速操作</h4>
      <div className="actions-grid">
        <button 
          className="action-btn export-all-btn"
          onClick={onExportAll}
          title="导出所有数据"
        >
          📤 导出所有数据
        </button>
        <button 
          className="action-btn import-btn"
          onClick={onImportData}
          title="导入数据"
        >
          📥 导入数据
        </button>
        <button 
          className="action-btn clear-btn"
          onClick={handleClearAll}
          disabled={recordCount === 0}
          title="清空所有记录"
        >
          🗑️ 清空所有记录
        </button>
        <button 
          className="action-btn refresh-btn"
          onClick={() => window.location.reload()}
          title="刷新页面"
        >
          🔄 刷新页面
        </button>
      </div>
    </div>
  )
}

export default QuickActions


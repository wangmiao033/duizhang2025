import React, { useState } from 'react'
import './QuickActions.css'

function QuickActions({ 
  onClearAll, 
  onExportAll, 
  onImportData,
  onGenerateTemplate,
  onShowTags,
  onShowReminders,
  recordCount,
  statistics
}) {
  const [showMore, setShowMore] = useState(false)

  const handleClearAll = () => {
    if (window.confirm(`确定要清空所有 ${recordCount} 条记录吗？此操作无法撤销！`)) {
      if (onClearAll) {
        onClearAll()
      }
    }
  }

  const quickActions = [
    {
      icon: '📤',
      label: '导出所有数据',
      onClick: onExportAll,
      className: 'export-all-btn',
      description: '导出全部记录'
    },
    {
      icon: '📥',
      label: '导入数据',
      onClick: onImportData,
      className: 'import-btn',
      description: '从文件导入'
    },
    {
      icon: '📋',
      label: '生成模板',
      onClick: onGenerateTemplate,
      className: 'template-btn',
      description: '下载导入模板'
    },
    {
      icon: '🏷️',
      label: '标签管理',
      onClick: onShowTags,
      className: 'tags-btn',
      description: '管理标签'
    },
    {
      icon: '⏰',
      label: '提醒事项',
      onClick: onShowReminders,
      className: 'reminders-btn',
      description: '查看提醒'
    },
    {
      icon: '🗑️',
      label: '清空记录',
      onClick: handleClearAll,
      disabled: recordCount === 0,
      className: 'clear-btn',
      description: '清空所有数据'
    },
    {
      icon: '📊',
      label: '数据统计',
      onClick: () => {
        if (statistics) {
          alert(`记录总数: ${statistics.recordCount}\n结算总额: ¥${statistics.totalSettlementAmount.toFixed(2)}\n游戏流水: ¥${statistics.totalGameFlow.toFixed(2)}`)
        }
      },
      className: 'stats-btn',
      description: '查看统计'
    },
    {
      icon: '🔄',
      label: '刷新页面',
      onClick: () => window.location.reload(),
      className: 'refresh-btn',
      description: '重新加载'
    }
  ]

  const primaryActions = quickActions.slice(0, 4)
  const moreActions = quickActions.slice(4)

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <h4>快捷操作</h4>
        {moreActions.length > 0 && (
          <button 
            className="toggle-more-btn"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? '收起工具' : '全部工具'}
          </button>
        )}
      </div>
      <div className="actions-grid">
        {primaryActions.map((action, idx) => (
          <button
            key={idx}
            className={`action-btn ${action.className}`}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.description}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
      {showMore && moreActions.length > 0 && (
        <div className="actions-grid more-actions">
          {moreActions.map((action, idx) => (
            <button
              key={idx}
              className={`action-btn ${action.className}`}
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.description}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default QuickActions


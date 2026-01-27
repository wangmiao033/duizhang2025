import React, { useState } from 'react'
import './StatusManager.css'

// 状态定义
export const STATUS_OPTIONS = [
  { value: 'pending', label: '待确认', color: '#f59e0b', icon: '⏳' },
  { value: 'confirmed', label: '已确认', color: '#3b82f6', icon: '✓' },
  { value: 'settled', label: '已结算', color: '#10b981', icon: '💰' },
  { value: 'invoiced', label: '已开票', color: '#8b5cf6', icon: '📄' },
  { value: 'verified', label: '已核销', color: '#06b6d4', icon: '✅' }
]

export const getStatusInfo = (status) => {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
}

// 状态标签组件
export function StatusTag({ status, onClick, className = '' }) {
  const statusInfo = getStatusInfo(status)
  
  return (
    <span 
      className={`status-tag status-${status} ${className}`}
      onClick={onClick}
      style={{ 
        backgroundColor: `${statusInfo.color}15`,
        borderColor: statusInfo.color,
        color: statusInfo.color
      }}
      title={statusInfo.label}
    >
      <span className="status-icon">{statusInfo.icon}</span>
      <span className="status-label">{statusInfo.label}</span>
    </span>
  )
}

// 状态选择器组件
export function StatusSelector({ currentStatus, onStatusChange, disabled = false }) {
  const [showMenu, setShowMenu] = useState(false)
  const currentStatusInfo = getStatusInfo(currentStatus)

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus)
    }
    setShowMenu(false)
  }

  return (
    <div className="status-selector">
      <StatusTag 
        status={currentStatus} 
        onClick={() => !disabled && setShowMenu(!showMenu)}
        className={disabled ? 'disabled' : 'clickable'}
      />
      {showMenu && !disabled && (
        <>
          <div className="status-selector-overlay" onClick={() => setShowMenu(false)} />
          <div className="status-selector-menu">
            {STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`status-option ${currentStatus === option.value ? 'active' : ''}`}
                onClick={() => handleStatusChange(option.value)}
                style={{
                  backgroundColor: currentStatus === option.value ? `${option.color}15` : 'transparent',
                  borderColor: option.color,
                  color: option.color
                }}
              >
                <span className="status-icon">{option.icon}</span>
                <span className="status-label">{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// 批量状态修改组件
export function BatchStatusUpdate({ selectedIds, onBatchStatusUpdate }) {
  const [showDialog, setShowDialog] = useState(false)
  const [targetStatus, setTargetStatus] = useState('')

  const handleBatchUpdate = () => {
    if (targetStatus && onBatchStatusUpdate) {
      onBatchStatusUpdate(selectedIds, targetStatus)
      setShowDialog(false)
      setTargetStatus('')
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <>
      <button 
        className="batch-status-btn"
        onClick={() => setShowDialog(true)}
        title="批量修改状态"
      >
        🔄 批量修改状态 ({selectedIds.length})
      </button>
      
      {showDialog && (
        <>
          <div className="status-dialog-overlay" onClick={() => setShowDialog(false)} />
          <div className="status-dialog">
            <div className="status-dialog-header">
              <h4>批量修改状态</h4>
              <button className="close-btn" onClick={() => setShowDialog(false)}>×</button>
            </div>
            <div className="status-dialog-content">
              <p>已选择 <strong>{selectedIds.length}</strong> 条记录，请选择目标状态：</p>
              <div className="status-options-grid">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={`status-option-btn ${targetStatus === option.value ? 'selected' : ''}`}
                    onClick={() => setTargetStatus(option.value)}
                    style={{
                      backgroundColor: targetStatus === option.value ? `${option.color}15` : 'transparent',
                      borderColor: option.color,
                      color: option.color
                    }}
                  >
                    <span className="status-icon">{option.icon}</span>
                    <span className="status-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="status-dialog-footer">
              <button className="cancel-btn" onClick={() => setShowDialog(false)}>取消</button>
              <button 
                className="confirm-btn" 
                onClick={handleBatchUpdate}
                disabled={!targetStatus}
              >
                确认修改
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// 默认导出（如果需要）
export default { StatusTag, StatusSelector, BatchStatusUpdate, STATUS_OPTIONS, getStatusInfo }

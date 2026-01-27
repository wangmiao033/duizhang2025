import React, { useState, useEffect } from 'react'
import './DataRecoveryHelper.css'
import { checkLocalStorageData, restoreData } from '../utils/dataRecovery.js'

function DataRecoveryHelper({ records, onDataRestored }) {
  const [showDialog, setShowDialog] = useState(false)
  const [diagnostics, setDiagnostics] = useState(null)

  useEffect(() => {
    // 如果当前没有记录，自动检查数据
    if (records.length === 0) {
      const data = checkLocalStorageData()
      setDiagnostics(data)
      // 如果有备份或历史记录，或者localStorage中有数据但当前没有显示，显示恢复提示
      if (data.backups.length > 0 || data.history.length > 0 || (data.hasData && data.recordsCount > 0)) {
        // 延迟显示，避免干扰用户
        setTimeout(() => {
          setShowDialog(true)
        }, 1000)
      }
    }
  }, [records.length])

  const handleCheckData = () => {
    const data = checkLocalStorageData()
    setDiagnostics(data)
    setShowDialog(true)
  }

  const handleRestoreFromBackup = (backup) => {
    if (window.confirm(`确定要恢复此备份吗？\n\n备份时间：${new Date(backup.timestamp).toLocaleString('zh-CN')}\n记录数：${backup.recordCount} 条\n\n当前数据将被覆盖！`)) {
      const result = restoreData(backup.data)
      if (result.success) {
        if (onDataRestored) {
          onDataRestored(backup.data)
        }
        setShowDialog(false)
        window.alert(result.message)
        window.location.reload() // 刷新页面以重新加载数据
      } else {
        window.alert(result.message)
      }
    }
  }

  const handleRestoreFromHistory = (historyItem) => {
    if (window.confirm(`确定要恢复此历史状态吗？\n\n操作：${historyItem.action}\n时间：${historyItem.timeFormatted}\n\n当前数据将被覆盖！`)) {
      const result = restoreData(historyItem.data)
      if (result.success) {
        if (onDataRestored) {
          onDataRestored(historyItem.data)
        }
        setShowDialog(false)
        window.alert(result.message)
        window.location.reload() // 刷新页面以重新加载数据
      } else {
        window.alert(result.message)
      }
    }
  }

  if (!showDialog && records.length > 0) {
    return (
      <button 
        className="data-recovery-btn"
        onClick={handleCheckData}
        title="数据诊断和恢复"
      >
        🔍 数据诊断
      </button>
    )
  }

  if (!showDialog) return null

  return (
    <>
      <div className="recovery-overlay" onClick={() => setShowDialog(false)} />
      <div className="recovery-dialog">
        <div className="recovery-header">
          <h3>🔍 数据诊断和恢复</h3>
          <button className="close-btn" onClick={() => setShowDialog(false)}>×</button>
        </div>
        
        <div className="recovery-content">
          {diagnostics && (
            <>
              <div className="diagnostics-section">
                <h4>数据状态</h4>
                <div className="diagnostic-item">
                  <span className="label">当前记录数：</span>
                  <span className={`value ${diagnostics.recordsCount > 0 ? 'has-data' : 'no-data'}`}>
                    {diagnostics.recordsCount} 条
                  </span>
                </div>
                <div className="diagnostic-item">
                  <span className="label">localStorage中的记录数：</span>
                  <span className={`value ${diagnostics.hasData ? 'has-data' : 'no-data'}`}>
                    {diagnostics.hasData ? `${diagnostics.recordsCount} 条` : '无数据'}
                  </span>
                </div>
                <div className="diagnostic-item">
                  <span className="label">可用备份：</span>
                  <span className="value">{diagnostics.backups.length} 个</span>
                </div>
                <div className="diagnostic-item">
                  <span className="label">操作历史：</span>
                  <span className="value">{diagnostics.history.length} 条</span>
                </div>
              </div>

              {diagnostics.backups.length > 0 && (
                <div className="recovery-section">
                  <h4>📦 从备份恢复</h4>
                  <div className="recovery-list">
                    {diagnostics.backups.slice(0, 5).map((backup, idx) => (
                      <div key={backup.key} className="recovery-item">
                        <div className="recovery-item-info">
                          <div className="recovery-item-time">
                            {new Date(backup.timestamp).toLocaleString('zh-CN')}
                          </div>
                          <div className="recovery-item-stats">
                            记录数：{backup.recordCount} 条
                          </div>
                        </div>
                        <button 
                          className="recovery-btn"
                          onClick={() => handleRestoreFromBackup(backup)}
                        >
                          恢复
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diagnostics.history.length > 0 && (
                <div className="recovery-section">
                  <h4>📜 从操作历史恢复</h4>
                  <div className="recovery-list">
                    {diagnostics.history.slice(0, 5).map((item, idx) => (
                      <div key={item.id} className="recovery-item">
                        <div className="recovery-item-info">
                          <div className="recovery-item-action">{item.action}</div>
                          <div className="recovery-item-time">{item.timeFormatted}</div>
                        </div>
                        <button 
                          className="recovery-btn"
                          onClick={() => handleRestoreFromHistory(item)}
                        >
                          恢复
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diagnostics.backups.length === 0 && diagnostics.history.length === 0 && (
                <div className="no-recovery-options">
                  <p>⚠️ 没有找到可用的备份或历史记录</p>
                  <p className="hint">建议：</p>
                  <ul>
                    <li>检查浏览器是否清空了localStorage</li>
                    <li>检查是否使用了不同的浏览器或设备</li>
                    <li>如果之前导出过文件，可以尝试从文件导入</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default DataRecoveryHelper

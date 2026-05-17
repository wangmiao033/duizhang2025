import React, { useState, useEffect } from 'react'
import './DataRecoveryHelper.css'
import { checkLocalStorageData, restoreData } from '../utils/dataRecovery.js'

function DataRecoveryHelper({ records, onDataRestored }) {
  const [showDialog, setShowDialog] = useState(false)
  const [diagnostics, setDiagnostics] = useState(null)

  useEffect(() => {
    if (showDialog) {
      const data = checkLocalStorageData()
      setDiagnostics(data)
    }
  }, [showDialog])

  const handleCheckData = () => {
    const data = checkLocalStorageData()
    setDiagnostics(data)
    setShowDialog(true)
  }

  const handleRestoreFromBackup = (backup) => {
    if (window.confirm(`确定要恢复这个本机备份吗？\n\n备份时间：${new Date(backup.timestamp).toLocaleString('zh-CN')}\n记录数：${backup.recordCount} 条\n\n当前页面数据会被备份内容替换。`)) {
      const result = restoreData(backup.data)
      if (result.success) {
        if (onDataRestored) {
          onDataRestored(backup.data)
        }
        setShowDialog(false)
        window.alert(result.message)
        window.location.reload()
      } else {
        window.alert(result.message)
      }
    }
  }

  if (!showDialog) {
    return (
      <button
        className="data-recovery-btn"
        onClick={handleCheckData}
        title="查看本机浏览器中保存的备份"
      >
        本机备份
      </button>
    )
  }

  const currentRecordCount = Array.isArray(records) ? records.length : 0
  const cacheRecordCount = diagnostics?.recordsCount || 0
  const backupCount = diagnostics?.backups?.length || 0
  const hasBackups = backupCount > 0

  return (
    <>
      <div className="recovery-overlay" onClick={() => setShowDialog(false)} />
      <div className="recovery-dialog">
        <div className="recovery-header">
          <div>
            <h3>本机备份恢复</h3>
            <p>这是浏览器本机保存的应急备份。正常数据以服务器记录为准。</p>
          </div>
          <button className="close-btn" onClick={() => setShowDialog(false)}>×</button>
        </div>
        
        <div className="recovery-content">
          {diagnostics && (
            <>
              <div className="diagnostics-section">
                <h4>当前状态</h4>
                <div className="diagnostic-item">
                  <span className="label">页面当前记录</span>
                  <span className={`value ${currentRecordCount > 0 ? 'has-data' : 'no-data'}`}>
                    {currentRecordCount} 条
                  </span>
                </div>
                <div className="diagnostic-item">
                  <span className="label">本机缓存记录</span>
                  <span className={`value ${cacheRecordCount > 0 ? 'has-data' : 'no-data'}`}>
                    {cacheRecordCount > 0 ? `${cacheRecordCount} 条` : '无'}
                  </span>
                </div>
                <div className="diagnostic-item">
                  <span className="label">可恢复备份</span>
                  <span className={`value ${hasBackups ? 'has-data' : 'no-data'}`}>{backupCount} 个</span>
                </div>
              </div>

              <div className="recovery-note">
                <strong>说明</strong>
                <span>
                  只有在服务器数据异常、误删或需要找回本机旧备份时才使用这里。恢复前建议先导出当前数据。
                </span>
              </div>

              {hasBackups && (
                <div className="recovery-section">
                  <h4>可用本机备份</h4>
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

              {!hasBackups && (
                <div className="no-recovery-options">
                  <p>没有找到本机备份</p>
                  <p className="hint">可以这样处理：</p>
                  <ul>
                    <li>如果只是列表为空，先刷新页面或检查服务器连接。</li>
                    <li>如果之前导出过文件，可以使用“导入文件”恢复。</li>
                    <li>不同浏览器或电脑的本机备份不会互通。</li>
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

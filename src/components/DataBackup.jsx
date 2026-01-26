import React, { useRef, useState, useEffect } from 'react'
import './DataBackup.css'

function DataBackup({ records, partyA, partyB, settlementMonth, partners, deliveries, onImport }) {
  const fileInputRef = useRef(null)
  const [backupList, setBackupList] = useState([])
  const [showBackupPanel, setShowBackupPanel] = useState(false)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
  const [lastAutoBackup, setLastAutoBackup] = useState(null)

  const MAX_BACKUPS = 10 // 最多保留10个备份

  // 加载备份列表和设置
  useEffect(() => {
    loadBackupList()
    const savedAutoBackup = localStorage.getItem('autoBackupEnabled')
    if (savedAutoBackup !== null) {
      setAutoBackupEnabled(JSON.parse(savedAutoBackup))
    }
    const lastBackup = localStorage.getItem('lastAutoBackupTime')
    if (lastBackup) {
      setLastAutoBackup(new Date(lastBackup))
    }
  }, [])

  // 自动备份 - 每30分钟检查一次，如果数据有变化则备份
  useEffect(() => {
    if (!autoBackupEnabled) return

    const checkAndBackup = () => {
      const now = new Date()
      const lastBackupTime = localStorage.getItem('lastAutoBackupTime')
      const thirtyMinutes = 30 * 60 * 1000

      if (!lastBackupTime || (now - new Date(lastBackupTime)) > thirtyMinutes) {
        // 检查是否有数据需要备份
        if (records.length > 0 || partners.length > 0 || deliveries.length > 0) {
          createLocalBackup('auto')
        }
      }
    }

    // 立即检查一次
    checkAndBackup()

    // 每5分钟检查一次
    const interval = setInterval(checkAndBackup, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [autoBackupEnabled, records, partners, deliveries])

  // 保存自动备份设置
  useEffect(() => {
    localStorage.setItem('autoBackupEnabled', JSON.stringify(autoBackupEnabled))
  }, [autoBackupEnabled])

  const loadBackupList = () => {
    const backups = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('backup_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          backups.push({
            key,
            ...data._meta,
            data
          })
        } catch (e) {
          // 忽略无效数据
        }
      }
    }
    // 按时间倒序排列
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    setBackupList(backups)
  }

  const createLocalBackup = (type = 'manual') => {
    const timestamp = new Date().toISOString()
    const backupKey = `backup_${timestamp.replace(/[:.]/g, '-')}`
    
    const backupData = {
      records,
      partyA,
      partyB,
      settlementMonth,
      partners,
      deliveries,
      _meta: {
        timestamp,
        type,
        recordCount: records.length,
        partnerCount: partners.length,
        deliveryCount: deliveries.length,
        version: '1.0'
      }
    }

    try {
      localStorage.setItem(backupKey, JSON.stringify(backupData))
      
      if (type === 'auto') {
        localStorage.setItem('lastAutoBackupTime', timestamp)
        setLastAutoBackup(new Date(timestamp))
      }

      // 清理旧备份，只保留最近的 MAX_BACKUPS 个
      cleanOldBackups()
      loadBackupList()

      if (type === 'manual') {
        window.alert('本地备份创建成功！')
      }
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        window.alert('存储空间不足，请清理一些旧备份后重试')
      } else {
        window.alert('备份失败: ' + e.message)
      }
    }
  }

  const cleanOldBackups = () => {
    const backups = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('backup_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          backups.push({ key, timestamp: data._meta?.timestamp })
        } catch (e) {
          // 删除无效数据
          localStorage.removeItem(key)
        }
      }
    }

    // 按时间排序，保留最新的 MAX_BACKUPS 个
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS)
      toDelete.forEach(backup => {
        localStorage.removeItem(backup.key)
      })
    }
  }

  const restoreBackup = (backup) => {
    if (!window.confirm(`确定要恢复此备份吗？\n\n备份时间：${formatDate(backup.timestamp)}\n记录数：${backup.recordCount} 条\n\n当前数据将被覆盖！`)) {
      return
    }

    const { data } = backup
    if (onImport) {
      onImport({
        records: data.records || [],
        partyA: data.partyA,
        partyB: data.partyB,
        settlementMonth: data.settlementMonth,
        partners: data.partners || [],
        deliveries: data.deliveries || []
      })
      window.alert('备份恢复成功！')
      setShowBackupPanel(false)
    }
  }

  const deleteBackup = (backupKey) => {
    if (!window.confirm('确定要删除此备份吗？')) return
    localStorage.removeItem(backupKey)
    loadBackupList()
  }

  const deleteAllBackups = () => {
    if (!window.confirm('确定要删除所有本地备份吗？此操作不可恢复！')) return
    
    const keysToDelete = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('backup_')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key))
    loadBackupList()
    window.alert('所有备份已删除')
  }

  const exportToFile = () => {
    const data = {
      records,
      partyA,
      partyB,
      settlementMonth,
      partners,
      deliveries,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `对账数据备份_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importFromFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (onImport) {
          onImport(data)
          window.alert('数据导入成功！')
        }
      } catch (error) {
        window.alert('文件格式错误，请选择有效的JSON备份文件')
        console.error('文件格式错误', error)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBackupTypeLabel = (type) => {
    switch (type) {
      case 'auto': return '自动'
      case 'manual': return '手动'
      default: return type
    }
  }

  const getStorageUsage = () => {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('backup_')) {
        total += localStorage.getItem(key).length
      }
    }
    return (total / 1024).toFixed(2) // KB
  }

  return (
    <div className="data-backup">
      <div className="backup-buttons">
        <button className="backup-btn local-btn" onClick={() => createLocalBackup('manual')} title="保存到浏览器本地存储">
          💾 本地备份
        </button>
        <button className="backup-btn export-btn" onClick={exportToFile} title="导出为文件下载">
          📤 导出文件
        </button>
        <button className="backup-btn import-btn" onClick={importFromFile} title="从文件导入数据">
          📥 导入文件
        </button>
        <button 
          className="backup-btn history-btn" 
          onClick={() => setShowBackupPanel(!showBackupPanel)}
          title="查看备份历史"
        >
          📋 备份历史 ({backupList.length})
        </button>
      </div>

      {showBackupPanel && (
        <div className="backup-panel">
          <div className="backup-panel-header">
            <h4>📦 本地备份管理</h4>
            <div className="backup-settings">
              <label className="auto-backup-toggle">
                <input
                  type="checkbox"
                  checked={autoBackupEnabled}
                  onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                />
                <span>自动备份</span>
              </label>
              <span className="storage-info">已用: {getStorageUsage()} KB</span>
            </div>
          </div>

          {lastAutoBackup && autoBackupEnabled && (
            <div className="last-backup-info">
              上次自动备份: {formatDate(lastAutoBackup.toISOString())}
            </div>
          )}

          <div className="backup-list">
            {backupList.length === 0 ? (
              <div className="empty-backups">
                <p>暂无本地备份</p>
                <p className="hint">点击"本地备份"按钮创建第一个备份</p>
              </div>
            ) : (
              <>
                <div className="backup-list-header">
                  <span>共 {backupList.length} 个备份</span>
                  <button className="clear-all-btn" onClick={deleteAllBackups}>
                    🗑️ 清空全部
                  </button>
                </div>
                <div className="backup-items">
                  {backupList.map((backup) => (
                    <div key={backup.key} className="backup-item">
                      <div className="backup-info">
                        <div className="backup-time">
                          <span className={`backup-type ${backup.type}`}>
                            {getBackupTypeLabel(backup.type)}
                          </span>
                          {formatDate(backup.timestamp)}
                        </div>
                        <div className="backup-stats">
                          记录: {backup.recordCount} | 
                          客户: {backup.partnerCount} | 
                          快递: {backup.deliveryCount}
                        </div>
                      </div>
                      <div className="backup-actions">
                        <button 
                          className="restore-btn"
                          onClick={() => restoreBackup(backup)}
                          title="恢复此备份"
                        >
                          ↩️ 恢复
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteBackup(backup.key)}
                          title="删除此备份"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default DataBackup

/**
 * 数据恢复和诊断工具
 */

/**
 * 检查localStorage中的数据
 */
export function checkLocalStorageData() {
  const data = {
    records: null,
    recordsCount: 0,
    backups: [],
    history: [],
    hasData: false
  }

  // 检查主数据
  try {
    const savedRecords = localStorage.getItem('reconciliationRecords')
    if (savedRecords) {
      const records = JSON.parse(savedRecords)
      data.records = records
      data.recordsCount = Array.isArray(records) ? records.length : 0
      data.hasData = data.recordsCount > 0
    }
  } catch (e) {
    console.error('读取主数据失败', e)
  }

  // 检查备份
  try {
    const backups = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('backup_')) {
        try {
          const backupData = JSON.parse(localStorage.getItem(key))
          backups.push({
            key,
            timestamp: backupData._meta?.timestamp,
            recordCount: backupData._meta?.recordCount || 0,
            data: backupData
          })
        } catch (e) {
          // 忽略无效备份
        }
      }
    }
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    data.backups = backups
  } catch (e) {
    console.error('读取备份失败', e)
  }

  // 检查操作历史
  try {
    const savedHistory = localStorage.getItem('operationHistory')
    if (savedHistory) {
      const history = JSON.parse(savedHistory)
      data.history = Array.isArray(history) ? history : []
    }
  } catch (e) {
    console.error('读取历史失败', e)
  }

  return data
}

/**
 * 恢复数据
 */
export function restoreData(data) {
  if (!data || !data.records) {
    return { success: false, message: '数据格式错误' }
  }

  try {
    localStorage.setItem('reconciliationRecords', JSON.stringify(data.records))
    
    if (data.partyA) {
      localStorage.setItem('partyA', JSON.stringify(data.partyA))
    }
    if (data.partyB) {
      localStorage.setItem('partyB', JSON.stringify(data.partyB))
    }
    if (data.settlementMonth) {
      localStorage.setItem('settlementMonth', data.settlementMonth)
    }
    if (data.partners) {
      localStorage.setItem('partners', JSON.stringify(data.partners))
    }
    if (data.deliveries) {
      localStorage.setItem('deliveries', JSON.stringify(data.deliveries))
    }

    return { 
      success: true, 
      message: `成功恢复 ${data.records.length} 条记录`,
      recordCount: data.records.length
    }
  } catch (e) {
    return { success: false, message: '恢复失败: ' + e.message }
  }
}

/**
 * 获取所有localStorage键（用于调试）
 */
export function getAllStorageKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      try {
        const value = localStorage.getItem(key)
        keys.push({
          key,
          size: value ? value.length : 0,
          preview: value ? value.substring(0, 100) : ''
        })
      } catch (e) {
        keys.push({ key, error: e.message })
      }
    }
  }
  return keys
}

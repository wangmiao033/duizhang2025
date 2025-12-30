import React, { useRef } from 'react'
import './DataBackup.css'

function DataBackup({ records, partyA, partyB, settlementMonth, onImport }) {
  const fileInputRef = useRef(null)

  const exportData = () => {
    const data = {
      records,
      partyA,
      partyB,
      settlementMonth,
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

  const importData = () => {
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
        }
      } catch (error) {
        // 错误处理由父组件处理
        console.error('文件格式错误', error)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // 重置文件输入
  }

  return (
    <div className="data-backup">
      <button className="backup-btn export-btn" onClick={exportData} title="导出数据备份">
        💾 导出备份
      </button>
      <button className="backup-btn import-btn" onClick={importData} title="导入数据备份">
        📥 导入备份
      </button>
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


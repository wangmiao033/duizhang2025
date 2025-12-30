import React from 'react'
import './CopyRecord.css'

function CopyRecord({ record, onCopy }) {
  const handleCopy = () => {
    if (onCopy) {
      // 创建新记录，移除ID和时间戳
      const newRecord = {
        ...record,
        id: Date.now(),
        game: record.game ? `${record.game} (副本)` : record.game
      }
      onCopy(newRecord)
    }
  }

  return (
    <button 
      className="copy-record-btn" 
      onClick={handleCopy}
      title="复制此记录"
    >
      📋 复制
    </button>
  )
}

export default CopyRecord


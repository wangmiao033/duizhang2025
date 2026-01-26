import React from 'react'
import './SummaryCard.css'

function SummaryCard({ title, value, icon }) {
  // 检测值是否过长（超过10个字符）
  const valueStr = String(value)
  const isLongValue = valueStr.length > 10

  // 格式化大数字
  const formatValue = (val) => {
    if (typeof val === 'string' && val.startsWith('¥')) {
      const numStr = val.replace('¥', '').replace(/,/g, '')
      const num = parseFloat(numStr)
      if (!isNaN(num)) {
        if (num >= 100000000) {
          return `¥${(num / 100000000).toFixed(2)}亿`
        } else if (num >= 10000) {
          return `¥${(num / 10000).toFixed(2)}万`
        }
      }
    }
    return val
  }

  const displayValue = formatValue(value)

  return (
    <div className="summary-card">
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3>{title}</h3>
        <p className={`card-value ${isLongValue ? 'long-value' : ''}`} title={valueStr}>
          {displayValue}
        </p>
      </div>
    </div>
  )
}

export default SummaryCard


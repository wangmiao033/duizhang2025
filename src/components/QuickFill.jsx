import React, { useState } from 'react'
import './QuickFill.css'

function QuickFill({ onFill }) {
  const [showMenu, setShowMenu] = useState(false)

  const templates = [
    {
      name: '标准游戏记录',
      data: {
        channelFeeRate: '5',
        taxPoint: '0',
        revenueShareRatio: '30',
        discount: '0.005'
      }
    },
    {
      name: '高分成记录',
      data: {
        channelFeeRate: '5',
        taxPoint: '0',
        revenueShareRatio: '50',
        discount: '0.005'
      }
    },
    {
      name: '低折扣记录',
      data: {
        channelFeeRate: '5',
        taxPoint: '0',
        revenueShareRatio: '30',
        discount: '0.001'
      }
    },
    {
      name: '高税点记录',
      data: {
        channelFeeRate: '5',
        taxPoint: '6.72',
        revenueShareRatio: '30',
        discount: '0.005'
      }
    }
  ]

  const handleQuickFill = (template) => {
    if (onFill) {
      onFill(template.data)
      setShowMenu(false)
    }
  }

  return (
    <div className="quick-fill">
      <button 
        className="quick-fill-btn"
        onClick={() => setShowMenu(!showMenu)}
        title="快速填充模板"
      >
        ⚡ 快速填充
      </button>

      {showMenu && (
        <div className="quick-fill-menu">
          {templates.map((template, index) => (
            <button
              key={index}
              className="quick-fill-item"
              onClick={() => handleQuickFill(template)}
            >
              <span className="template-name">{template.name}</span>
              <span className="template-preview">
                费率: {template.data.channelFeeRate}% | 
                分成: {template.data.revenueShareRatio}% | 
                折扣: {template.data.discount}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default QuickFill


import React, { useState } from 'react'
import './HelpTooltip.css'

function HelpTooltip() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="help-tooltip">
      <button 
        className="help-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="快捷键帮助"
      >
        ❓ 帮助
      </button>
      
      {isOpen && (
        <div className="help-content">
          <div className="help-header">
            <h4>快捷键说明</h4>
            <button className="close-help" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="help-list">
            <div className="help-item">
              <kbd>Ctrl</kbd> + <kbd>F</kbd>
              <span>聚焦搜索框</span>
            </div>
            <div className="help-item">
              <kbd>Ctrl</kbd> + <kbd>P</kbd>
              <span>打印对账单</span>
            </div>
            <div className="help-item">
              <kbd>Enter</kbd>
              <span>提交表单（在表单中）</span>
            </div>
            <div className="help-item">
              <kbd>Esc</kbd>
              <span>关闭对话框/取消编辑</span>
            </div>
          </div>
          <div className="help-tips">
            <h5>使用提示</h5>
            <ul>
              <li>结算金额会根据公式自动计算</li>
              <li>支持从Excel导入数据</li>
              <li>可以保存多个账单模板</li>
              <li>数据自动保存到本地存储</li>
              <li>支持批量删除操作</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpTooltip


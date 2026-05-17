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
        ?
      </button>
      
      {isOpen && (
        <div className="help-content">
          <div className="help-header">
            <h4>快捷键说明</h4>
            <button className="close-help" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="help-list">
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
              <li>研发对账和渠道对账分别从对应模块新增</li>
              <li>勾选记录后会出现批量编辑和批量状态操作</li>
              <li>导出账单会优先导出当前勾选记录</li>
              <li>数据以服务器数据库为主，异常时才回退本地缓存</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpTooltip

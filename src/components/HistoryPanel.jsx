import React, { useState, useEffect } from 'react'
import './HistoryPanel.css'

function HistoryPanel({ onRestore }) {
  const [history, setHistory] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const saved = localStorage.getItem('operationHistory')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('加载历史记录失败', e)
      }
    }
  }

  const addHistory = (action, data) => {
    const historyItem = {
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleString('zh-CN')
    }

    const updated = [historyItem, ...history].slice(0, 50) // 只保留最近50条
    localStorage.setItem('operationHistory', JSON.stringify(updated))
    setHistory(updated)
  }

  const clearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      localStorage.removeItem('operationHistory')
      setHistory([])
    }
  }

  const restoreFromHistory = (item) => {
    if (onRestore && window.confirm('确定要恢复这个历史状态吗？当前数据将被替换。')) {
      onRestore(item.data)
    }
  }


  return (
    <div className="history-panel">
      <button 
        className="history-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        📜 操作历史 ({history.length})
      </button>

      {isOpen && (
        <div className="history-content">
          <div className="history-header">
            <h4>操作历史</h4>
            <div className="history-actions">
              <button className="clear-history-btn" onClick={clearHistory}>
                清空
              </button>
              <button className="close-history-btn" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-history">暂无操作历史</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-action">{item.action}</span>
                    <span className="history-time">{item.timeFormatted}</span>
                  </div>
                  <div className="history-item-actions">
                    <button 
                      className="restore-btn"
                      onClick={() => restoreFromHistory(item)}
                    >
                      恢复
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 导出添加历史的函数
export const addHistoryItem = (action, data) => {
  const saved = localStorage.getItem('operationHistory')
  const history = saved ? JSON.parse(saved) : []
  const historyItem = {
    id: Date.now(),
    action,
    data,
    timestamp: new Date().toISOString(),
    timeFormatted: new Date().toLocaleString('zh-CN')
  }
  const updated = [historyItem, ...history].slice(0, 50)
  localStorage.setItem('operationHistory', JSON.stringify(updated))
}

export default HistoryPanel


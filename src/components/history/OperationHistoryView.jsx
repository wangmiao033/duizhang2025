import React, { useMemo, useState, useCallback } from 'react'
import { getHistory, clearHistory as clearHistoryStorage } from '@/utils/history.js'
import './OperationHistoryView.css'

function OperationHistoryView({ onRestore, showToast }) {
  const [keyword, setKeyword] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [tick, setTick] = useState(0)

  const rawList = useMemo(() => {
    void tick
    return getHistory() || []
  }, [tick])

  const actionOptions = useMemo(() => {
    const set = new Set(rawList.map((i) => i.action).filter(Boolean))
    return Array.from(set).sort()
  }, [rawList])

  const filtered = useMemo(() => {
    let list = rawList
    if (actionFilter) {
      list = list.filter((i) => i.action === actionFilter)
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase()
      list = list.filter(
        (i) =>
          (i.action && i.action.toLowerCase().includes(k)) ||
          (i.timeFormatted && i.timeFormatted.toLowerCase().includes(k)) ||
          (i.timestamp && i.timestamp.toLowerCase().includes(k))
      )
    }
    return list
  }, [rawList, actionFilter, keyword])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const handleClear = () => {
    if (!window.confirm('确定清空全部操作历史？此操作不可恢复。')) return
    clearHistoryStorage()
    reload()
    showToast?.('已清空操作历史', 'info')
  }

  const handleRestore = (item) => {
    if (!onRestore) return
    if (window.confirm(`确定恢复到此快照？\n操作：${item.action}\n时间：${item.timeFormatted}\n当前数据将被替换。`)) {
      onRestore(item.data)
    }
  }

  return (
    <div className="operation-history-view">
      <div className="operation-history-view__toolbar">
        <div className="operation-history-view__field">
          <label htmlFor="oh-keyword">关键字</label>
          <input
            id="oh-keyword"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="操作说明、时间…"
          />
        </div>
        <div className="operation-history-view__field">
          <label htmlFor="oh-action">操作类型</label>
          <select
            id="oh-action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">全部类型</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="oh-btn oh-btn--secondary" onClick={reload}>
          刷新
        </button>
        <button type="button" className="oh-btn oh-btn--danger" onClick={handleClear}>
          清空历史
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="operation-history-view__empty">暂无记录（或筛选结果为空）</div>
      ) : (
        <div className="operation-history-view__table-wrap">
          <table className="operation-history-view__table">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作</th>
                <th style={{ width: 100 }}>恢复</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.timeFormatted || item.timestamp}</td>
                  <td>{item.action}</td>
                  <td>
                    <button
                      type="button"
                      className="oh-btn oh-btn--primary oh-btn--sm"
                      onClick={() => handleRestore(item)}
                    >
                      恢复
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default OperationHistoryView

// 历史记录工具函数
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
  const updated = [historyItem, ...history].slice(0, 50) // 只保留最近50条
  localStorage.setItem('operationHistory', JSON.stringify(updated))
  return updated
}

export const getHistory = () => {
  const saved = localStorage.getItem('operationHistory')
  return saved ? JSON.parse(saved) : []
}

export const clearHistory = () => {
  localStorage.removeItem('operationHistory')
}


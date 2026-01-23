import React, { useEffect, useState } from 'react'
import './PerformanceMonitor.css'

function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    recordCount: 0
  })

  useEffect(() => {
    // 监控性能指标
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            setMetrics(prev => ({
              ...prev,
              renderTime: entry.duration
            }))
          }
        })
      })
      observer.observe({ entryTypes: ['measure'] })
      return () => observer.disconnect()
    }
  }, [])

  // 只在开发环境显示
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="performance-monitor">
      <div className="metric">
        <span className="metric-label">渲染时间:</span>
        <span className="metric-value">{metrics.renderTime.toFixed(2)}ms</span>
      </div>
      <div className="metric">
        <span className="metric-label">记录数:</span>
        <span className="metric-value">{metrics.recordCount}</span>
      </div>
    </div>
  )
}

export default PerformanceMonitor


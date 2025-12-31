import React, { useMemo } from 'react'
import './AdvancedCharts.css'

function AdvancedCharts({ records }) {
  const chartData = useMemo(() => {
    if (records.length === 0) return null

    // 计算月度趋势
    const monthlyData = {}
    records.forEach(record => {
      const month = record.settlementMonth || '未设置'
      if (!monthlyData[month]) {
        monthlyData[month] = {
          count: 0,
          totalFlow: 0,
          totalSettlement: 0
        }
      }
      monthlyData[month].count++
      monthlyData[month].totalFlow += parseFloat(record.gameFlow || 0)
      monthlyData[month].totalSettlement += parseFloat(record.settlementAmount || 0)
    })

    // 计算游戏占比
    const gameDistribution = {}
    const totalSettlement = records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0)
    records.forEach(record => {
      const game = record.game || '未命名'
      if (!gameDistribution[game]) {
        gameDistribution[game] = 0
      }
      gameDistribution[game] += parseFloat(record.settlementAmount || 0)
    })

    return { monthlyData, gameDistribution, totalSettlement }
  }, [records])

  if (!chartData) {
    return (
      <div className="advanced-charts">
        <h3>高级图表分析</h3>
        <div className="empty-chart">暂无数据</div>
      </div>
    )
  }

  const maxMonthSettlement = Math.max(...Object.values(chartData.monthlyData).map(d => d.totalSettlement))
  const maxGameSettlement = Math.max(...Object.values(chartData.gameDistribution))

  return (
    <div className="advanced-charts">
      <h3>高级图表分析</h3>
      
      <div className="charts-grid">
        <div className="chart-card">
          <h4>月度趋势</h4>
          <div className="trend-chart">
            {Object.entries(chartData.monthlyData)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([month, data]) => (
                <div key={month} className="trend-item">
                  <div className="trend-label">{month}</div>
                  <div className="trend-bar-container">
                    <div 
                      className="trend-bar"
                      style={{ 
                        width: `${(data.totalSettlement / maxMonthSettlement) * 100}%`,
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <span className="trend-value">¥{data.totalSettlement.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="trend-meta">
                    <span>{data.count} 条记录</span>
                    <span>流水: ¥{data.totalFlow.toFixed(2)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="chart-card">
          <h4>游戏占比分析</h4>
          <div className="pie-chart-container">
            {Object.entries(chartData.gameDistribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([game, amount], index) => {
                const percentage = (amount / chartData.totalSettlement * 100).toFixed(1)
                const angle = (360 * amount / chartData.totalSettlement)
                return (
                  <div key={game} className="pie-item">
                    <div 
                      className="pie-segment"
                      style={{
                        background: `conic-gradient(from ${index * 45}deg, hsl(${index * 45}, 70%, 60%) 0deg ${angle}deg, #e9ecef ${angle}deg 360deg)`
                      }}
                    />
                    <div className="pie-info">
                      <span className="pie-label">{game}</span>
                      <span className="pie-percentage">{percentage}%</span>
                      <span className="pie-amount">¥{amount.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedCharts


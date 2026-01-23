import React, { useMemo } from 'react'
import './StatisticsChart.css'

function StatisticsChart({ records }) {
  const chartData = useMemo(() => {
    if (records.length === 0) return null

    // 按游戏分组统计
    const gameStats = {}
    records.forEach(record => {
      const game = record.game || '未命名游戏'
      if (!gameStats[game]) {
        gameStats[game] = {
          gameFlow: 0,
          settlementAmount: 0,
          count: 0
        }
      }
      gameStats[game].gameFlow += parseFloat(record.gameFlow || 0)
      gameStats[game].settlementAmount += parseFloat(record.settlementAmount || 0)
      gameStats[game].count += 1
    })

    // 按合作方分组统计
    const partnerStats = {}
    records.forEach(record => {
      const partner = record.partner || '未设置合作方'
      if (!partnerStats[partner]) {
        partnerStats[partner] = {
          gameFlow: 0,
          settlementAmount: 0,
          count: 0
        }
      }
      partnerStats[partner].gameFlow += parseFloat(record.gameFlow || 0)
      partnerStats[partner].settlementAmount += parseFloat(record.settlementAmount || 0)
      partnerStats[partner].count += 1
    })

    return { gameStats, partnerStats }
  }, [records])

  if (!chartData) {
    return (
      <div className="statistics-chart">
        <h3>数据统计</h3>
        <div className="empty-chart">暂无数据</div>
      </div>
    )
  }

  const maxGameFlow = Math.max(...Object.values(chartData.gameStats).map(s => s.gameFlow))
  const maxSettlement = Math.max(...Object.values(chartData.gameStats).map(s => s.settlementAmount))

  return (
    <div className="statistics-chart">
      <h3>数据统计</h3>
      
      <div className="chart-tabs">
        <div className="chart-section">
          <h4>按游戏统计</h4>
          <div className="chart-content">
            {Object.entries(chartData.gameStats).map(([game, stats]) => (
              <div key={game} className="chart-item">
                <div className="chart-item-header">
                  <span className="chart-label">{game}</span>
                  <span className="chart-value">¥{stats.settlementAmount.toFixed(2)}</span>
                </div>
                <div className="chart-bar">
                  <div 
                    className="chart-bar-fill" 
                    style={{ 
                      width: `${(stats.gameFlow / maxGameFlow) * 100}%`,
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                    }}
                  />
                </div>
                <div className="chart-item-footer">
                  <span>流水: ¥{stats.gameFlow.toFixed(2)}</span>
                  <span>记录: {stats.count} 条</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-section">
          <h4>按合作方统计</h4>
          <div className="chart-content">
            {Object.entries(chartData.partnerStats).map(([partner, stats]) => (
              <div key={partner} className="chart-item">
                <div className="chart-item-header">
                  <span className="chart-label">{partner}</span>
                  <span className="chart-value">¥{stats.settlementAmount.toFixed(2)}</span>
                </div>
                <div className="chart-bar">
                  <div 
                    className="chart-bar-fill" 
                    style={{ 
                      width: `${(stats.settlementAmount / maxSettlement) * 100}%`,
                      background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
                    }}
                  />
                </div>
                <div className="chart-item-footer">
                  <span>流水: ¥{stats.gameFlow.toFixed(2)}</span>
                  <span>记录: {stats.count} 条</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticsChart


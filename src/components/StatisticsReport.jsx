import React, { useMemo } from 'react'
import './StatisticsReport.css'

function StatisticsReport({ records }) {
  const reportData = useMemo(() => {
    if (records.length === 0) return null

    // 按游戏统计
    const gameStats = {}
    // 按合作方统计
    const partnerStats = {}
    // 按月份统计
    const monthStats = {}
    // 金额分布
    const amountRanges = {
      '0-1000': 0,
      '1000-5000': 0,
      '5000-10000': 0,
      '10000+': 0
    }

    records.forEach(record => {
      const game = record.game || '未命名游戏'
      const partner = record.partner || '未设置合作方'
      const month = record.settlementMonth || '未设置月份'
      const amount = parseFloat(record.settlementAmount || 0)

      // 游戏统计
      if (!gameStats[game]) {
        gameStats[game] = {
          count: 0,
          totalFlow: 0,
          totalSettlement: 0,
          avgSettlement: 0
        }
      }
      gameStats[game].count++
      gameStats[game].totalFlow += parseFloat(record.gameFlow || 0)
      gameStats[game].totalSettlement += amount

      // 合作方统计
      if (!partnerStats[partner]) {
        partnerStats[partner] = {
          count: 0,
          totalFlow: 0,
          totalSettlement: 0
        }
      }
      partnerStats[partner].count++
      partnerStats[partner].totalFlow += parseFloat(record.gameFlow || 0)
      partnerStats[partner].totalSettlement += amount

      // 月份统计
      if (!monthStats[month]) {
        monthStats[month] = {
          count: 0,
          totalSettlement: 0
        }
      }
      monthStats[month].count++
      monthStats[month].totalSettlement += amount

      // 金额分布
      if (amount < 1000) amountRanges['0-1000']++
      else if (amount < 5000) amountRanges['1000-5000']++
      else if (amount < 10000) amountRanges['5000-10000']++
      else amountRanges['10000+']++
    })

    // 计算平均值
    Object.keys(gameStats).forEach(game => {
      if (gameStats[game].count > 0) {
        gameStats[game].avgSettlement = gameStats[game].totalSettlement / gameStats[game].count
      }
    })

    return {
      gameStats,
      partnerStats,
      monthStats,
      amountRanges,
      totalRecords: records.length,
      totalSettlement: records.reduce((sum, r) => sum + parseFloat(r.settlementAmount || 0), 0),
      avgSettlement: records.length > 0 
        ? records.reduce((sum, r) => sum + parseFloat(r.settlementAmount || 0), 0) / records.length 
        : 0
    }
  }, [records])

  if (!reportData) {
    return (
      <div className="statistics-report">
        <h3>数据统计报表</h3>
        <div className="empty-report">暂无数据</div>
      </div>
    )
  }

  const topGames = Object.entries(reportData.gameStats)
    .sort((a, b) => b[1].totalSettlement - a[1].totalSettlement)
    .slice(0, 5)

  const topPartners = Object.entries(reportData.partnerStats)
    .sort((a, b) => b[1].totalSettlement - a[1].totalSettlement)
    .slice(0, 5)

  return (
    <div className="statistics-report">
      <h3>数据统计报表</h3>
      
      <div className="report-summary">
        <div className="summary-item">
          <span className="summary-label">总记录数</span>
          <span className="summary-value">{reportData.totalRecords}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">结算总额</span>
          <span className="summary-value">¥{reportData.totalSettlement.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">平均结算</span>
          <span className="summary-value">¥{reportData.avgSettlement.toFixed(2)}</span>
        </div>
      </div>

      <div className="report-sections">
        <div className="report-section">
          <h4>TOP 5 游戏</h4>
          <div className="top-list">
            {topGames.map(([game, stats], index) => (
              <div key={game} className="top-item">
                <div className="top-rank">#{index + 1}</div>
                <div className="top-info">
                  <div className="top-name">{game}</div>
                  <div className="top-details">
                    <span>记录: {stats.count} 条</span>
                    <span>流水: ¥{stats.totalFlow.toFixed(2)}</span>
                    <span>结算: ¥{stats.totalSettlement.toFixed(2)}</span>
                  </div>
                </div>
                <div className="top-amount">¥{stats.totalSettlement.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h4>TOP 5 合作方</h4>
          <div className="top-list">
            {topPartners.map(([partner, stats], index) => (
              <div key={partner} className="top-item">
                <div className="top-rank">#{index + 1}</div>
                <div className="top-info">
                  <div className="top-name">{partner}</div>
                  <div className="top-details">
                    <span>记录: {stats.count} 条</span>
                    <span>流水: ¥{stats.totalFlow.toFixed(2)}</span>
                  </div>
                </div>
                <div className="top-amount">¥{stats.totalSettlement.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h4>金额分布</h4>
          <div className="distribution-chart">
            {Object.entries(reportData.amountRanges).map(([range, count]) => {
              const percentage = reportData.totalRecords > 0 
                ? (count / reportData.totalRecords * 100).toFixed(1) 
                : 0
              return (
                <div key={range} className="distribution-item">
                  <div className="distribution-header">
                    <span className="distribution-label">¥{range}</span>
                    <span className="distribution-count">{count} 条 ({percentage}%)</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="report-section">
          <h4>月度统计</h4>
          <div className="month-stats">
            {Object.entries(reportData.monthStats)
              .sort((a, b) => b[1].totalSettlement - a[1].totalSettlement)
              .map(([month, stats]) => (
                <div key={month} className="month-item">
                  <span className="month-name">{month}</span>
                  <span className="month-count">{stats.count} 条记录</span>
                  <span className="month-amount">¥{stats.totalSettlement.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticsReport


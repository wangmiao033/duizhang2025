import React, { useState, useMemo } from 'react'
import './ProjectProfit.css'

function ProjectProfit({ records }) {
  const [sortBy, setSortBy] = useState('profit')
  const [sortOrder, setSortOrder] = useState('desc')
  const [expandedProject, setExpandedProject] = useState(null)

  // 按游戏名称分组统计
  const projectStats = useMemo(() => {
    const grouped = {}

    records.forEach(record => {
      const gameName = record.gameName || '未命名项目'
      
      if (!grouped[gameName]) {
        grouped[gameName] = {
          name: gameName,
          records: [],
          totalGameFlow: 0,
          totalSettlement: 0,
          totalVoucher: 0,
          totalTestingFee: 0,
          totalRefund: 0,
          partners: new Set()
        }
      }

      grouped[gameName].records.push(record)
      grouped[gameName].totalGameFlow += parseFloat(record.gameFlow || 0)
      grouped[gameName].totalSettlement += parseFloat(record.settlementAmount || 0)
      grouped[gameName].totalVoucher += parseFloat(record.voucher || 0)
      grouped[gameName].totalTestingFee += parseFloat(record.testingFee || 0)
      grouped[gameName].totalRefund += parseFloat(record.refund || 0)
      
      if (record.partner) {
        grouped[gameName].partners.add(record.partner)
      }
    })

    // 计算利润和利润率
    return Object.values(grouped).map(project => ({
      ...project,
      recordCount: project.records.length,
      partnerCount: project.partners.size,
      partners: Array.from(project.partners),
      // 利润 = 结算金额（我方收入）
      profit: project.totalSettlement,
      // 成本 = 代金券 + 测试费 + 退款
      cost: project.totalVoucher + project.totalTestingFee + project.totalRefund,
      // 净利润 = 结算金额 - 成本
      netProfit: project.totalSettlement - (project.totalVoucher + project.totalTestingFee + project.totalRefund),
      // 利润率 = 净利润 / 游戏流水
      profitRate: project.totalGameFlow > 0 
        ? ((project.totalSettlement - project.totalVoucher - project.totalTestingFee - project.totalRefund) / project.totalGameFlow * 100)
        : 0,
      // 平均结算金额
      avgSettlement: project.records.length > 0 
        ? project.totalSettlement / project.records.length 
        : 0
    }))
  }, [records])

  // 排序
  const sortedProjects = useMemo(() => {
    return [...projectStats].sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'name':
          aVal = a.name
          bVal = b.name
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal, 'zh-CN')
            : bVal.localeCompare(aVal, 'zh-CN')
        case 'gameFlow':
          aVal = a.totalGameFlow
          bVal = b.totalGameFlow
          break
        case 'settlement':
          aVal = a.totalSettlement
          bVal = b.totalSettlement
          break
        case 'profit':
          aVal = a.netProfit
          bVal = b.netProfit
          break
        case 'profitRate':
          aVal = a.profitRate
          bVal = b.profitRate
          break
        case 'recordCount':
          aVal = a.recordCount
          bVal = b.recordCount
          break
        default:
          aVal = a.netProfit
          bVal = b.netProfit
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [projectStats, sortBy, sortOrder])

  // 总计
  const totals = useMemo(() => {
    return projectStats.reduce((acc, project) => ({
      totalGameFlow: acc.totalGameFlow + project.totalGameFlow,
      totalSettlement: acc.totalSettlement + project.totalSettlement,
      totalCost: acc.totalCost + project.cost,
      totalNetProfit: acc.totalNetProfit + project.netProfit,
      totalRecords: acc.totalRecords + project.recordCount
    }), {
      totalGameFlow: 0,
      totalSettlement: 0,
      totalCost: 0,
      totalNetProfit: 0,
      totalRecords: 0
    })
  }, [projectStats])

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `¥${(amount / 100000000).toFixed(2)}亿`
    } else if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(2)}万`
    }
    return `¥${amount.toFixed(2)}`
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  if (records.length === 0) {
    return (
      <div className="project-profit">
        <div className="project-header">
          <h3>📊 项目利润统计</h3>
        </div>
        <div className="empty-projects">
          <p>暂无项目数据</p>
          <p className="hint">添加对账记录后，这里将按游戏显示利润统计</p>
        </div>
      </div>
    )
  }

  return (
    <div className="project-profit">
      <div className="project-header">
        <h3>📊 项目利润统计</h3>
        <div className="project-summary">
          <span className="summary-item">
            <span className="label">项目数</span>
            <span className="value">{projectStats.length}</span>
          </span>
          <span className="summary-item">
            <span className="label">总流水</span>
            <span className="value">{formatMoney(totals.totalGameFlow)}</span>
          </span>
          <span className="summary-item">
            <span className="label">总结算</span>
            <span className="value">{formatMoney(totals.totalSettlement)}</span>
          </span>
          <span className="summary-item highlight">
            <span className="label">总利润</span>
            <span className={`value ${totals.totalNetProfit >= 0 ? 'positive' : 'negative'}`}>
              {formatMoney(totals.totalNetProfit)}
            </span>
          </span>
        </div>
      </div>

      <div className="project-table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')} className="sortable">
                项目名称 {getSortIcon('name')}
              </th>
              <th onClick={() => toggleSort('recordCount')} className="sortable">
                记录数 {getSortIcon('recordCount')}
              </th>
              <th onClick={() => toggleSort('gameFlow')} className="sortable">
                游戏流水 {getSortIcon('gameFlow')}
              </th>
              <th onClick={() => toggleSort('settlement')} className="sortable">
                结算金额 {getSortIcon('settlement')}
              </th>
              <th onClick={() => toggleSort('profit')} className="sortable">
                净利润 {getSortIcon('profit')}
              </th>
              <th onClick={() => toggleSort('profitRate')} className="sortable">
                利润率 {getSortIcon('profitRate')}
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((project, index) => (
              <React.Fragment key={project.name}>
                <tr className={`project-row ${expandedProject === project.name ? 'expanded' : ''}`}>
                  <td className="project-name">
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{project.name}</span>
                  </td>
                  <td>{project.recordCount} 条</td>
                  <td>{formatMoney(project.totalGameFlow)}</td>
                  <td>{formatMoney(project.totalSettlement)}</td>
                  <td className={project.netProfit >= 0 ? 'positive' : 'negative'}>
                    {formatMoney(project.netProfit)}
                  </td>
                  <td>
                    <span className={`profit-rate ${project.profitRate >= 0 ? 'positive' : 'negative'}`}>
                      {project.profitRate.toFixed(2)}%
                    </span>
                  </td>
                  <td>
                    <button 
                      className="expand-btn"
                      onClick={() => setExpandedProject(
                        expandedProject === project.name ? null : project.name
                      )}
                    >
                      {expandedProject === project.name ? '收起' : '详情'}
                    </button>
                  </td>
                </tr>
                {expandedProject === project.name && (
                  <tr className="detail-row">
                    <td colSpan="7">
                      <div className="project-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="label">合作方</span>
                            <span className="value">
                              {project.partners.length > 0 
                                ? project.partners.join('、') 
                                : '无'}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">代金券总额</span>
                            <span className="value">{formatMoney(project.totalVoucher)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">测试费总额</span>
                            <span className="value">{formatMoney(project.totalTestingFee)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">退款总额</span>
                            <span className="value">{formatMoney(project.totalRefund)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">成本总计</span>
                            <span className="value cost">{formatMoney(project.cost)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">平均结算</span>
                            <span className="value">{formatMoney(project.avgSettlement)}</span>
                          </div>
                        </div>
                        <div className="detail-records">
                          <h5>关联记录（{project.recordCount}条）</h5>
                          <div className="records-list">
                            {project.records.slice(0, 5).map((record, idx) => (
                              <div key={record.id || idx} className="record-item">
                                <span className="month">{record.settlementMonth || '未设置'}</span>
                                <span className="partner">{record.partner || '未知'}</span>
                                <span className="flow">{formatMoney(parseFloat(record.gameFlow || 0))}</span>
                                <span className="settlement">{formatMoney(parseFloat(record.settlementAmount || 0))}</span>
                              </div>
                            ))}
                            {project.recordCount > 5 && (
                              <div className="more-records">
                                还有 {project.recordCount - 5} 条记录...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProjectProfit

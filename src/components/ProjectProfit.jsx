import React, { useState, useMemo } from 'react'
import './ProjectProfit.css'

function ProjectProfit({ records, channelRecords = [] }) {
  const [sortBy, setSortBy] = useState('profit')
  const [sortOrder, setSortOrder] = useState('desc')
  const [expandedProject, setExpandedProject] = useState(null)

  // 按游戏名称分组统计
  const projectStats = useMemo(() => {
    const grouped = {}

    // 处理研发对账（支出）
    records.forEach(record => {
      const gameName = record.gameName || '未命名项目'
      
      if (!grouped[gameName]) {
        grouped[gameName] = {
          name: gameName,
          devRecords: [],
          channelRecords: [],
          totalGameFlow: 0,
          totalDevSettlement: 0, // 研发结算（我方支出给研发）
          totalChannelSettlement: 0, // 渠道结算（渠道支付给我方）
          totalVoucher: 0,
          totalTestingFee: 0,
          totalRefund: 0,
          partners: new Set(),
          channels: new Set()
        }
      }

      grouped[gameName].devRecords.push(record)
      grouped[gameName].totalGameFlow += parseFloat(record.gameFlow || 0)
      grouped[gameName].totalDevSettlement += parseFloat(record.settlementAmount || 0)
      grouped[gameName].totalVoucher += parseFloat(record.voucher || 0)
      grouped[gameName].totalTestingFee += parseFloat(record.testingFee || 0)
      grouped[gameName].totalRefund += parseFloat(record.refund || 0)
      
      if (record.partner) {
        grouped[gameName].partners.add(record.partner)
      }
    })

    // 处理渠道对账（收入）
    channelRecords.forEach(record => {
      const gameName = record.gameName || '未命名项目'
      
      if (!grouped[gameName]) {
        grouped[gameName] = {
          name: gameName,
          devRecords: [],
          channelRecords: [],
          totalGameFlow: 0,
          totalDevSettlement: 0,
          totalChannelSettlement: 0,
          totalVoucher: 0,
          totalTestingFee: 0,
          totalRefund: 0,
          partners: new Set(),
          channels: new Set()
        }
      }

      grouped[gameName].channelRecords.push(record)
      grouped[gameName].totalChannelSettlement += parseFloat(record.settlementAmount || 0)
      
      if (record.channelName) {
        grouped[gameName].channels.add(record.channelName)
      }
    })

    // 计算利润和利润率
    return Object.values(grouped).map(project => ({
      ...project,
      recordCount: project.devRecords.length + project.channelRecords.length,
      devRecordCount: project.devRecords.length,
      channelRecordCount: project.channelRecords.length,
      partnerCount: project.partners.size,
      channelCount: project.channels.size,
      partners: Array.from(project.partners),
      channels: Array.from(project.channels),
      // 渠道收入
      channelIncome: project.totalChannelSettlement,
      // 研发支出
      devExpense: project.totalDevSettlement,
      // 其他成本 = 代金券 + 测试费 + 退款
      otherCost: project.totalVoucher + project.totalTestingFee + project.totalRefund,
      // 净利润 = 渠道收入 - 研发支出 - 其他成本
      netProfit: project.totalChannelSettlement - project.totalDevSettlement - (project.totalVoucher + project.totalTestingFee + project.totalRefund),
      // 利润率 = 净利润 / 渠道收入
      profitRate: project.totalChannelSettlement > 0 
        ? ((project.totalChannelSettlement - project.totalDevSettlement - project.totalVoucher - project.totalTestingFee - project.totalRefund) / project.totalChannelSettlement * 100)
        : 0,
      // 平均渠道收入
      avgChannelIncome: project.channelRecords.length > 0 
        ? project.totalChannelSettlement / project.channelRecords.length 
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
        case 'channelIncome':
          aVal = a.channelIncome
          bVal = b.channelIncome
          break
        case 'devExpense':
          aVal = a.devExpense
          bVal = b.devExpense
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
      totalChannelIncome: acc.totalChannelIncome + project.channelIncome,
      totalDevExpense: acc.totalDevExpense + project.devExpense,
      totalOtherCost: acc.totalOtherCost + project.otherCost,
      totalNetProfit: acc.totalNetProfit + project.netProfit,
      totalRecords: acc.totalRecords + project.recordCount
    }), {
      totalChannelIncome: 0,
      totalDevExpense: 0,
      totalOtherCost: 0,
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
          <span className="summary-item channel">
            <span className="label">渠道收入</span>
            <span className="value positive">{formatMoney(totals.totalChannelIncome)}</span>
          </span>
          <span className="summary-item dev">
            <span className="label">研发支出</span>
            <span className="value negative">{formatMoney(totals.totalDevExpense)}</span>
          </span>
          <span className="summary-item highlight">
            <span className="label">净利润</span>
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
              <th onClick={() => toggleSort('channelIncome')} className="sortable">
                渠道收入 {getSortIcon('channelIncome')}
              </th>
              <th onClick={() => toggleSort('devExpense')} className="sortable">
                研发支出 {getSortIcon('devExpense')}
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
                  <td>
                    <span className="record-counts">
                      {project.channelRecordCount > 0 && <span className="channel-count">渠道{project.channelRecordCount}</span>}
                      {project.devRecordCount > 0 && <span className="dev-count">研发{project.devRecordCount}</span>}
                    </span>
                  </td>
                  <td className="channel-income">{formatMoney(project.channelIncome)}</td>
                  <td className="dev-expense">{formatMoney(project.devExpense)}</td>
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
                            <span className="label">渠道方</span>
                            <span className="value">
                              {project.channels.length > 0 
                                ? project.channels.join('、') 
                                : '无'}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">研发合作方</span>
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
                            <span className="label">其他成本</span>
                            <span className="value cost">{formatMoney(project.otherCost)}</span>
                          </div>
                        </div>
                        
                        {project.channelRecords.length > 0 && (
                          <div className="detail-records channel-records">
                            <h5>📥 渠道收入记录（{project.channelRecordCount}条）</h5>
                            <div className="records-list">
                              {project.channelRecords.slice(0, 3).map((record, idx) => (
                                <div key={record.id || idx} className="record-item">
                                  <span className="month">{record.settlementMonth || '未设置'}</span>
                                  <span className="partner">{record.channelName || '未知渠道'}</span>
                                  <span className="flow">{formatMoney(parseFloat(record.channelFlow || 0))}</span>
                                  <span className="settlement positive">{formatMoney(parseFloat(record.settlementAmount || 0))}</span>
                                </div>
                              ))}
                              {project.channelRecordCount > 3 && (
                                <div className="more-records">还有 {project.channelRecordCount - 3} 条...</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {project.devRecords.length > 0 && (
                          <div className="detail-records dev-records">
                            <h5>📤 研发支出记录（{project.devRecordCount}条）</h5>
                            <div className="records-list">
                              {project.devRecords.slice(0, 3).map((record, idx) => (
                                <div key={record.id || idx} className="record-item">
                                  <span className="month">{record.settlementMonth || '未设置'}</span>
                                  <span className="partner">{record.partner || '未知'}</span>
                                  <span className="flow">{formatMoney(parseFloat(record.gameFlow || 0))}</span>
                                  <span className="settlement negative">{formatMoney(parseFloat(record.settlementAmount || 0))}</span>
                                </div>
                              ))}
                              {project.devRecordCount > 3 && (
                                <div className="more-records">还有 {project.devRecordCount - 3} 条...</div>
                              )}
                            </div>
                          </div>
                        )}
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

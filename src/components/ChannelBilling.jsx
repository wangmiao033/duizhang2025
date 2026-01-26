import React, { useState, useMemo } from 'react'
import './ChannelBilling.css'

function ChannelBilling({ channelRecords, onAddRecord, onUpdateRecord, onDeleteRecord }) {
  const [formData, setFormData] = useState({
    // 基本信息
    channelName: '',        // 渠道/公司简称（必填）
    gameName: '',           // 游戏名称（必填）
    startDate: '',          // 结算开始日期
    endDate: '',            // 结算结束日期
    // 流水与费用
    flow: '',               // 后台流水
    voucherCost: '',        // 代金券
    noWorryCost: '',        // 无忧试
    refundCost: '',         // 玩家退款
    testCost: '',           // 测试费
    welfareCost: '',        // 福利币
    // 分成计算
    shareRate: '30',        // 分成比例(%)
    taxRate: '5',           // 税率(%)
    gatewayCost: '',        // 支付通道费
    // 结算
    settlementAmount: '',   // 结算金额
    remark: ''
  })
  
  const [expandedGames, setExpandedGames] = useState({})
  const [viewMode, setViewMode] = useState('byGame') // 'byGame' or 'list'
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 计算计费金额 = 后台流水 - 代金券 - 无忧试 - 玩家退款 - 测试费 - 福利币
  const calculateBillingAmount = (data) => {
    const flow = parseFloat(data.flow || 0)
    const voucher = parseFloat(data.voucherCost || 0)
    const noWorry = parseFloat(data.noWorryCost || 0)
    const refund = parseFloat(data.refundCost || 0)
    const test = parseFloat(data.testCost || 0)
    const welfare = parseFloat(data.welfareCost || 0)
    return flow - voucher - noWorry - refund - test - welfare
  }

  // 计算分成金额 = 计费金额 * 分成比例
  const calculateShareAmount = (data) => {
    const billingAmount = calculateBillingAmount(data)
    const shareRate = parseFloat(data.shareRate || 0) / 100
    return billingAmount * shareRate
  }

  // 计算结算金额 = 分成金额 - 支付通道费 - 税费
  const calculateSettlement = (data) => {
    const shareAmount = calculateShareAmount(data)
    const gatewayCost = parseFloat(data.gatewayCost || 0)
    const taxRate = parseFloat(data.taxRate || 0) / 100
    const taxAmount = shareAmount * taxRate
    return shareAmount - gatewayCost - taxAmount
  }

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    
    // 自动计算结算金额
    if (['flow', 'voucherCost', 'noWorryCost', 'refundCost', 'testCost', 
         'welfareCost', 'shareRate', 'taxRate', 'gatewayCost'].includes(field)) {
      const settlement = calculateSettlement(newFormData)
      newFormData.settlementAmount = settlement.toFixed(2)
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.channelName || !formData.gameName) {
      window.alert('请填写必填项：渠道名称、游戏名称')
      return
    }

    const billingAmount = calculateBillingAmount(formData)
    const shareAmount = calculateShareAmount(formData)
    
    const record = {
      ...formData,
      flow: parseFloat(formData.flow || 0),
      voucherCost: parseFloat(formData.voucherCost || 0),
      noWorryCost: parseFloat(formData.noWorryCost || 0),
      refundCost: parseFloat(formData.refundCost || 0),
      testCost: parseFloat(formData.testCost || 0),
      welfareCost: parseFloat(formData.welfareCost || 0),
      billingAmount: billingAmount,
      shareRate: parseFloat(formData.shareRate || 0),
      shareAmount: shareAmount,
      taxRate: parseFloat(formData.taxRate || 0),
      gatewayCost: parseFloat(formData.gatewayCost || 0),
      settlementAmount: parseFloat(formData.settlementAmount || 0)
    }

    if (editingId) {
      onUpdateRecord(editingId, record)
      setEditingId(null)
    } else {
      onAddRecord(record)
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      channelName: '',
      gameName: '',
      startDate: '',
      endDate: '',
      flow: '',
      voucherCost: '',
      noWorryCost: '',
      refundCost: '',
      testCost: '',
      welfareCost: '',
      shareRate: '30',
      taxRate: '5',
      gatewayCost: '',
      settlementAmount: '',
      remark: ''
    })
    setEditingId(null)
  }

  const handleEdit = (record) => {
    setFormData({
      channelName: record.channelName || '',
      gameName: record.gameName || '',
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      flow: String(record.flow || ''),
      voucherCost: String(record.voucherCost || ''),
      noWorryCost: String(record.noWorryCost || ''),
      refundCost: String(record.refundCost || ''),
      testCost: String(record.testCost || ''),
      welfareCost: String(record.welfareCost || ''),
      shareRate: String(record.shareRate || '30'),
      taxRate: String(record.taxRate || '5'),
      gatewayCost: String(record.gatewayCost || ''),
      settlementAmount: String(record.settlementAmount || ''),
      remark: record.remark || ''
    })
    setEditingId(record.id)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条渠道记录吗？')) {
      onDeleteRecord(id)
    }
  }

  // 过滤记录
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return channelRecords
    const term = searchTerm.toLowerCase()
    return channelRecords.filter(record => 
      (record.channelName || '').toLowerCase().includes(term) ||
      (record.gameName || '').toLowerCase().includes(term)
    )
  }, [channelRecords, searchTerm])

  // 统计
  const statistics = useMemo(() => {
    return filteredRecords.reduce((acc, record) => ({
      totalFlow: acc.totalFlow + (parseFloat(record.flow) || 0),
      totalSettlement: acc.totalSettlement + (parseFloat(record.settlementAmount) || 0),
      totalServerCost: acc.totalServerCost + (parseFloat(record.serverCost) || 0),
      totalVoucherCost: acc.totalVoucherCost + (parseFloat(record.voucherCost) || 0)
    }), { totalFlow: 0, totalSettlement: 0, totalServerCost: 0, totalVoucherCost: 0 })
  }, [filteredRecords])

  // 按渠道分组（一个渠道下有多个游戏）
  const groupedByChannel = useMemo(() => {
    const grouped = {}
    
    filteredRecords.forEach(record => {
      const channelName = record.channelName || '未命名渠道'
      if (!grouped[channelName]) {
        grouped[channelName] = {
          channelName,
          records: [],
          totalFlow: 0,
          totalSettlement: 0,
          totalServerCost: 0,
          totalVoucherCost: 0,
          totalTestCost: 0,
          games: new Set()
        }
      }
      grouped[channelName].records.push(record)
      grouped[channelName].totalFlow += parseFloat(record.flow) || 0
      grouped[channelName].totalSettlement += parseFloat(record.settlementAmount) || 0
      grouped[channelName].totalVoucherCost += parseFloat(record.voucherCost) || 0
      grouped[channelName].totalNoWorryCost = (grouped[channelName].totalNoWorryCost || 0) + (parseFloat(record.noWorryCost) || 0)
      grouped[channelName].totalRefundCost = (grouped[channelName].totalRefundCost || 0) + (parseFloat(record.refundCost) || 0)
      grouped[channelName].totalTestCost += parseFloat(record.testCost) || 0
      grouped[channelName].totalWelfareCost = (grouped[channelName].totalWelfareCost || 0) + (parseFloat(record.welfareCost) || 0)
      grouped[channelName].games.add(record.gameName)
    })

    // 计算每个渠道的统计
    return Object.values(grouped).map(channel => ({
      ...channel,
      gameCount: channel.games.size,
      games: Array.from(channel.games),
      profitRate: channel.totalFlow > 0 
        ? ((channel.totalSettlement / channel.totalFlow) * 100).toFixed(1)
        : 0
    })).sort((a, b) => b.totalSettlement - a.totalSettlement)
  }, [filteredRecords])

  const toggleChannelExpand = (channelName) => {
    setExpandedGames(prev => ({
      ...prev,
      [channelName]: !prev[channelName]
    }))
  }

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `¥${(amount / 100000000).toFixed(2)}亿`
    } else if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(2)}万`
    }
    return `¥${amount.toFixed(2)}`
  }

  // 常用渠道列表
  const commonChannels = [
    '广州触点互联网科技有限公司',
    '广州能动科技有限公司',
    '深圳龙魂网络科技有限公司',
    '华为应用市场',
    'vivo应用商店',
    'OPPO应用商店',
    '小米应用商店',
    '百度移动游戏',
    '九游游戏中心',
    '爱趣聚合',
    '233乐园',
    '277游戏',
    '3733游戏',
    '3387游戏'
  ]

  return (
    <div className="channel-billing">
      <div className="channel-header">
        <h2>📤 渠道对账单</h2>
        <p className="subtitle">管理渠道分成与结算记录（参考渠道产品表格式）</p>
      </div>

      <div className="channel-stats">
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-content">
            <span className="stat-label">渠道流水总额</span>
            <span className="stat-value">{formatMoney(statistics.totalFlow)}</span>
          </div>
        </div>
        <div className="stat-card success">
          <span className="stat-icon">📥</span>
          <div className="stat-content">
            <span className="stat-label">结算总额</span>
            <span className="stat-value">{formatMoney(statistics.totalSettlement)}</span>
          </div>
        </div>
        <div className="stat-card warning">
          <span className="stat-icon">🖥️</span>
          <div className="stat-content">
            <span className="stat-label">服务器成本</span>
            <span className="stat-value">{formatMoney(statistics.totalServerCost)}</span>
          </div>
        </div>
        <div className="stat-card info">
          <span className="stat-icon">🎫</span>
          <div className="stat-content">
            <span className="stat-label">代金券成本</span>
            <span className="stat-value">{formatMoney(statistics.totalVoucherCost)}</span>
          </div>
        </div>
      </div>

      <div className="channel-content">
        <div className="channel-form-section">
          <h3>{editingId ? '✏️ 编辑渠道记录' : '➕ 添加渠道记录'}</h3>
          <form onSubmit={handleSubmit} className="channel-form">
            <div className="form-section-title">渠道信息</div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>渠道/公司简称 *</label>
                <input
                  type="text"
                  list="channel-list"
                  value={formData.channelName}
                  onChange={(e) => handleInputChange('channelName', e.target.value)}
                  placeholder="如：广州触点互联网科技有限公司"
                  required
                />
                <datalist id="channel-list">
                  {commonChannels.map(ch => (
                    <option key={ch} value={ch} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-section-title">游戏与结算周期</div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>游戏名称 *</label>
                <input
                  type="text"
                  value={formData.gameName}
                  onChange={(e) => handleInputChange('gameName', e.target.value)}
                  placeholder="如：一起来修仙(0.05折)"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>结算开始日期</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>结算结束日期</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">流水与费用</div>
            <div className="form-row">
              <div className="form-group">
                <label>后台流水</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.flow}
                  onChange={(e) => handleInputChange('flow', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>代金券</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.voucherCost}
                  onChange={(e) => handleInputChange('voucherCost', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>无忧试</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.noWorryCost}
                  onChange={(e) => handleInputChange('noWorryCost', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>玩家退款</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.refundCost}
                  onChange={(e) => handleInputChange('refundCost', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>测试费</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.testCost}
                  onChange={(e) => handleInputChange('testCost', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>福利币</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.welfareCost}
                  onChange={(e) => handleInputChange('welfareCost', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>计费金额（自动）</label>
                <input
                  type="text"
                  value={formatMoney(calculateBillingAmount(formData))}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>

            <div className="form-section-title">分成计算</div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>分成比例(%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.shareRate}
                  onChange={(e) => handleInputChange('shareRate', e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="form-group">
                <label>分成金额（自动）</label>
                <input
                  type="text"
                  value={formatMoney(calculateShareAmount(formData))}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>税率(%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => handleInputChange('taxRate', e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>支付通道费</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gatewayCost}
                  onChange={(e) => handleInputChange('gatewayCost', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-section-title">结算</div>
            <div className="form-row">
              <div className="form-group settlement-group">
                <label>结算金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.settlementAmount}
                  onChange={(e) => handleInputChange('settlementAmount', e.target.value)}
                  placeholder="自动计算或手动输入"
                  className="settlement-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>备注</label>
                <input
                  type="text"
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  placeholder="可选备注"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingId ? '💾 保存修改' : '➕ 添加记录'}
              </button>
              {editingId && (
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  取消编辑
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="channel-list-section">
          <div className="list-header">
            <h3>📋 渠道对账列表</h3>
            <div className="list-tools">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'byGame' ? 'active' : ''}`}
                  onClick={() => setViewMode('byGame')}
                >
                  按渠道
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  列表
                </button>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="搜索渠道、游戏..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="record-count">{groupedByChannel.length} 个渠道 / {filteredRecords.length} 条</span>
            </div>
          </div>

          {viewMode === 'byGame' ? (
            <div className="games-list">
              {groupedByChannel.length === 0 ? (
                <div className="empty-games">暂无渠道记录</div>
              ) : (
                groupedByChannel.map(channel => (
                  <div key={channel.channelName} className="game-card channel-card">
                    <div 
                      className="game-card-header"
                      onClick={() => toggleChannelExpand(channel.channelName)}
                    >
                      <div className="game-info">
                        <span className="expand-icon">
                          {expandedGames[channel.channelName] ? '▼' : '▶'}
                        </span>
                        <h4 className="game-title">{channel.channelName}</h4>
                        <span className="channel-badge">{channel.gameCount} 个游戏</span>
                      </div>
                      <div className="game-stats">
                        <span className="stat">
                          <span className="label">流水</span>
                          <span className="value">{formatMoney(channel.totalFlow)}</span>
                        </span>
                        <span className="stat">
                          <span className="label">结算</span>
                          <span className="value settlement">{formatMoney(channel.totalSettlement)}</span>
                        </span>
                        <span className="stat">
                          <span className="label">分成率</span>
                          <span className={`value ${parseFloat(channel.profitRate) >= 0 ? 'positive' : 'negative'}`}>
                            {channel.profitRate}%
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {expandedGames[channel.channelName] && (
                      <div className="game-channels">
                        <table className="channel-detail-table">
                          <thead>
                            <tr>
                              <th>游戏名称</th>
                              <th>后台流水</th>
                              <th>代金券</th>
                              <th>测试费</th>
                              <th>计费金额</th>
                              <th>分成比例</th>
                              <th>分成金额</th>
                              <th>税率</th>
                              <th>结算金额</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {channel.records.map(record => {
                              // 兼容旧数据
                              const flow = parseFloat(record.flow) || 0
                              const voucher = parseFloat(record.voucherCost) || 0
                              const noWorry = parseFloat(record.noWorryCost) || 0
                              const refund = parseFloat(record.refundCost) || 0
                              const test = parseFloat(record.testCost) || 0
                              const welfare = parseFloat(record.welfareCost) || 0
                              const billingAmount = flow - voucher - noWorry - refund - test - welfare
                              const shareRate = parseFloat(record.shareRate || record.cfChannelRate || 30)
                              const shareAmount = billingAmount * shareRate / 100
                              const settlement = parseFloat(record.settlementAmount) || shareAmount
                              
                              return (
                                <tr key={record.id}>
                                  <td className="game-name-cell">{record.gameName}</td>
                                  <td>{formatMoney(flow)}</td>
                                  <td>{voucher}</td>
                                  <td>{test}</td>
                                  <td>{formatMoney(billingAmount)}</td>
                                  <td>{shareRate}%</td>
                                  <td>{formatMoney(shareAmount)}</td>
                                  <td>{record.taxRate || 5}%</td>
                                  <td className="settlement">{formatMoney(settlement)}</td>
                                  <td className="actions">
                                    <button className="edit-btn" onClick={() => handleEdit(record)}>编辑</button>
                                    <button className="delete-btn" onClick={() => handleDelete(record.id)}>删除</button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td className="total-label">合计</td>
                              <td>{formatMoney(channel.totalFlow)}</td>
                              <td>{formatMoney(channel.totalVoucherCost)}</td>
                              <td>{formatMoney(channel.totalTestCost)}</td>
                              <td>{formatMoney(
                                channel.totalFlow - 
                                channel.totalVoucherCost - 
                                (channel.totalNoWorryCost || 0) - 
                                (channel.totalRefundCost || 0) - 
                                channel.totalTestCost - 
                                (channel.totalWelfareCost || 0)
                              )}</td>
                              <td>-</td>
                              <td>{formatMoney(
                                (channel.totalFlow - 
                                channel.totalVoucherCost - 
                                (channel.totalNoWorryCost || 0) - 
                                (channel.totalRefundCost || 0) - 
                                channel.totalTestCost - 
                                (channel.totalWelfareCost || 0)) * 
                                (channel.records[0] ? parseFloat(channel.records[0].shareRate || channel.records[0].cfChannelRate || 30) / 100 : 0.3)
                              )}</td>
                              <td>-</td>
                              <td className="settlement">{formatMoney(channel.totalSettlement)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="channel-table-wrapper">
              <table className="channel-table">
                <thead>
                  <tr>
                    <th>游戏</th>
                    <th>渠道</th>
                    <th>流水</th>
                    <th>折扣</th>
                    <th>渠道费</th>
                    <th>研发分成</th>
                    <th>业务毛利</th>
                    <th>服务器</th>
                    <th>代金券</th>
                    <th>结算金额</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="empty-row">
                        暂无渠道记录
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(record => (
                      <tr key={record.id}>
                        <td className="game-name" title={record.gameName}>{record.gameName}</td>
                        <td className="channel-name">{record.channelName}</td>
                        <td>{formatMoney(parseFloat(record.flow) || 0)}</td>
                        <td>{record.discountType}</td>
                        <td>{record.channelFeeRate}%</td>
                        <td>{record.devShareRate}%</td>
                        <td>
                          <span className={`profit-badge ${record.profitRate >= 0 ? 'positive' : 'negative'}`}>
                            {record.profitRate?.toFixed(1) || 0}%
                          </span>
                        </td>
                        <td>{record.serverCost || '-'}</td>
                        <td>{record.voucherCost || '-'}</td>
                        <td className="settlement">{formatMoney(parseFloat(record.settlementAmount) || 0)}</td>
                        <td className="actions">
                          <button className="edit-btn" onClick={() => handleEdit(record)}>编辑</button>
                          <button className="delete-btn" onClick={() => handleDelete(record.id)}>删除</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredRecords.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="2" className="total-label">合计</td>
                      <td>{formatMoney(statistics.totalFlow)}</td>
                      <td colSpan="4"></td>
                      <td>{formatMoney(statistics.totalServerCost)}</td>
                      <td>{formatMoney(statistics.totalVoucherCost)}</td>
                      <td className="settlement">{formatMoney(statistics.totalSettlement)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChannelBilling

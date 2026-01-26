import React, { useState, useMemo } from 'react'
import './ChannelBilling.css'

function ChannelBilling({ channelRecords, onAddRecord, onUpdateRecord, onDeleteRecord }) {
  const [formData, setFormData] = useState({
    gameName: '',           // 游戏名称（项目）
    channelName: '',        // 渠道
    flow: '',               // 流水
    discountType: '否',     // 是否0.1折/0.05折
    channelFeeRate: '70',   // 渠道费(%)
    gatewayFeeRate: '5',    // 通道费(%)
    cfChannelRate: '30',    // 超凡与渠道(%)
    cfDevRate: '20',        // 超凡与研发(%)
    ipRate: '0',            // IP授权(%)
    taxRate: '0',           // 税点(%)
    devShareRate: '80',     // 研发分成(%)
    privateRate: '0',       // 私点(%)
    serverCost: '',         // 服务器
    testCost: '',           // 测试
    voucherCost: '',        // 代金券
    gatewayCost: '',        // 通道费(金额)
    taxCost: '',            // 税点(金额)
    settlementAmount: '',   // 结算金额
    remark: ''
  })
  
  const [expandedGames, setExpandedGames] = useState({})
  const [viewMode, setViewMode] = useState('byGame') // 'byGame' or 'list'
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 计算业务毛利率
  const calculateProfitRate = (data) => {
    const channelFee = parseFloat(data.channelFeeRate || 0)
    const gatewayFee = parseFloat(data.gatewayFeeRate || 0)
    const cfChannel = parseFloat(data.cfChannelRate || 0)
    const devShare = parseFloat(data.devShareRate || 0)
    
    // 业务毛利 = 100% - 渠道费 - 通道费 - 超凡与渠道*研发分成 - ...
    // 简化计算: 我方收入比例
    const myShare = cfChannel * (100 - devShare) / 100
    const profitRate = myShare - gatewayFee
    return profitRate
  }

  // 计算结算金额
  const calculateSettlement = (data) => {
    const flow = parseFloat(data.flow || 0)
    const channelFee = parseFloat(data.channelFeeRate || 0) / 100
    const gatewayFee = parseFloat(data.gatewayFeeRate || 0) / 100
    const cfChannel = parseFloat(data.cfChannelRate || 0) / 100
    const cfDev = parseFloat(data.cfDevRate || 0) / 100
    const devShare = parseFloat(data.devShareRate || 0) / 100
    
    // 扣除各项费用后的金额
    const afterChannelFee = flow * (1 - channelFee)
    const afterGateway = afterChannelFee * (1 - gatewayFee)
    // 超凡与渠道的分成中，我方占比
    const myShare = afterGateway * cfChannel * (1 - devShare)
    
    // 扣除成本
    const serverCost = parseFloat(data.serverCost || 0)
    const testCost = parseFloat(data.testCost || 0)
    const voucherCost = parseFloat(data.voucherCost || 0)
    const gatewayCost = parseFloat(data.gatewayCost || 0)
    const taxCost = parseFloat(data.taxCost || 0)
    
    const settlement = myShare - serverCost - testCost - voucherCost - gatewayCost - taxCost
    return settlement
  }

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    
    // 自动计算结算金额
    if (['flow', 'channelFeeRate', 'gatewayFeeRate', 'cfChannelRate', 'cfDevRate', 
         'devShareRate', 'serverCost', 'testCost', 'voucherCost', 'gatewayCost', 'taxCost'].includes(field)) {
      const settlement = calculateSettlement(newFormData)
      newFormData.settlementAmount = settlement.toFixed(2)
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.gameName || !formData.channelName || !formData.flow) {
      window.alert('请填写必填项：游戏名称、渠道、流水')
      return
    }

    const profitRate = calculateProfitRate(formData)
    
    const record = {
      ...formData,
      flow: parseFloat(formData.flow || 0),
      channelFeeRate: parseFloat(formData.channelFeeRate || 0),
      gatewayFeeRate: parseFloat(formData.gatewayFeeRate || 0),
      cfChannelRate: parseFloat(formData.cfChannelRate || 0),
      cfDevRate: parseFloat(formData.cfDevRate || 0),
      ipRate: parseFloat(formData.ipRate || 0),
      taxRate: parseFloat(formData.taxRate || 0),
      devShareRate: parseFloat(formData.devShareRate || 0),
      privateRate: parseFloat(formData.privateRate || 0),
      profitRate: profitRate,
      serverCost: parseFloat(formData.serverCost || 0),
      testCost: parseFloat(formData.testCost || 0),
      voucherCost: parseFloat(formData.voucherCost || 0),
      gatewayCost: parseFloat(formData.gatewayCost || 0),
      taxCost: parseFloat(formData.taxCost || 0),
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
      gameName: '',
      channelName: '',
      flow: '',
      discountType: '否',
      channelFeeRate: '70',
      gatewayFeeRate: '5',
      cfChannelRate: '30',
      cfDevRate: '20',
      ipRate: '0',
      taxRate: '0',
      devShareRate: '80',
      privateRate: '0',
      serverCost: '',
      testCost: '',
      voucherCost: '',
      gatewayCost: '',
      taxCost: '',
      settlementAmount: '',
      remark: ''
    })
    setEditingId(null)
  }

  const handleEdit = (record) => {
    setFormData({
      gameName: record.gameName || '',
      channelName: record.channelName || '',
      flow: String(record.flow || ''),
      discountType: record.discountType || '否',
      channelFeeRate: String(record.channelFeeRate || '70'),
      gatewayFeeRate: String(record.gatewayFeeRate || '5'),
      cfChannelRate: String(record.cfChannelRate || '30'),
      cfDevRate: String(record.cfDevRate || '20'),
      ipRate: String(record.ipRate || '0'),
      taxRate: String(record.taxRate || '0'),
      devShareRate: String(record.devShareRate || '80'),
      privateRate: String(record.privateRate || '0'),
      serverCost: String(record.serverCost || ''),
      testCost: String(record.testCost || ''),
      voucherCost: String(record.voucherCost || ''),
      gatewayCost: String(record.gatewayCost || ''),
      taxCost: String(record.taxCost || ''),
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

  // 按游戏分组
  const groupedByGame = useMemo(() => {
    const grouped = {}
    
    filteredRecords.forEach(record => {
      const gameName = record.gameName || '未命名游戏'
      if (!grouped[gameName]) {
        grouped[gameName] = {
          gameName,
          records: [],
          totalFlow: 0,
          totalSettlement: 0,
          totalServerCost: 0,
          totalVoucherCost: 0,
          channels: new Set()
        }
      }
      grouped[gameName].records.push(record)
      grouped[gameName].totalFlow += parseFloat(record.flow) || 0
      grouped[gameName].totalSettlement += parseFloat(record.settlementAmount) || 0
      grouped[gameName].totalServerCost += parseFloat(record.serverCost) || 0
      grouped[gameName].totalVoucherCost += parseFloat(record.voucherCost) || 0
      grouped[gameName].channels.add(record.channelName)
    })

    // 计算每个游戏的业务毛利率
    return Object.values(grouped).map(game => ({
      ...game,
      channelCount: game.channels.size,
      channels: Array.from(game.channels),
      profitRate: game.totalFlow > 0 
        ? ((game.totalSettlement / game.totalFlow) * 100).toFixed(1)
        : 0
    })).sort((a, b) => b.totalSettlement - a.totalSettlement)
  }, [filteredRecords])

  const toggleGameExpand = (gameName) => {
    setExpandedGames(prev => ({
      ...prev,
      [gameName]: !prev[gameName]
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
    '233', '277游戏', '3733', '3387游戏', 'vivo', 'OPPO', 
    '华为', '小米', '百度', '九游', 'u2game', '爱趣聚合',
    '八门助手', '百分网', '冰火手游', '触点', '大熊游戏',
    '当乐', '瓜子手游', '广东安久', 'iOS', '3DMGame'
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
            <div className="form-section-title">基本信息</div>
            <div className="form-row">
              <div className="form-group">
                <label>游戏名称 *</label>
                <input
                  type="text"
                  value={formData.gameName}
                  onChange={(e) => handleInputChange('gameName', e.target.value)}
                  placeholder="如：一起来修仙005折混服"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>渠道 *</label>
                <input
                  type="text"
                  list="channel-list"
                  value={formData.channelName}
                  onChange={(e) => handleInputChange('channelName', e.target.value)}
                  placeholder="如：233, vivo, 华为"
                  required
                />
                <datalist id="channel-list">
                  {commonChannels.map(ch => (
                    <option key={ch} value={ch} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>流水(元) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.flow}
                  onChange={(e) => handleInputChange('flow', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>折扣类型</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => handleInputChange('discountType', e.target.value)}
                >
                  <option value="否">否</option>
                  <option value="0.1折">0.1折</option>
                  <option value="0.05折">0.05折</option>
                </select>
              </div>
            </div>

            <div className="form-section-title">分成比例</div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>渠道费(%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.channelFeeRate}
                  onChange={(e) => handleInputChange('channelFeeRate', e.target.value)}
                  placeholder="70"
                />
              </div>
              <div className="form-group">
                <label>通道费(%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.gatewayFeeRate}
                  onChange={(e) => handleInputChange('gatewayFeeRate', e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="form-group">
                <label>超凡与渠道(%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.cfChannelRate}
                  onChange={(e) => handleInputChange('cfChannelRate', e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>超凡与研发(%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.cfDevRate}
                  onChange={(e) => handleInputChange('cfDevRate', e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="form-group">
                <label>研发分成(%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.devShareRate}
                  onChange={(e) => handleInputChange('devShareRate', e.target.value)}
                  placeholder="80"
                />
              </div>
              <div className="form-group">
                <label>IP授权(%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.ipRate}
                  onChange={(e) => handleInputChange('ipRate', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>税点(%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.taxRate}
                  onChange={(e) => handleInputChange('taxRate', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>私点(%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.privateRate}
                  onChange={(e) => handleInputChange('privateRate', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-section-title">成本费用</div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>服务器</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.serverCost}
                  onChange={(e) => handleInputChange('serverCost', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>测试</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.testCost}
                  onChange={(e) => handleInputChange('testCost', e.target.value)}
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
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>通道费(金额)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gatewayCost}
                  onChange={(e) => handleInputChange('gatewayCost', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>税点(金额)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxCost}
                  onChange={(e) => handleInputChange('taxCost', e.target.value)}
                  placeholder="0.00"
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
            <h3>📦 游戏项目列表</h3>
            <div className="list-tools">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'byGame' ? 'active' : ''}`}
                  onClick={() => setViewMode('byGame')}
                >
                  按游戏
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
              <span className="record-count">{groupedByGame.length} 个游戏 / {filteredRecords.length} 条</span>
            </div>
          </div>

          {viewMode === 'byGame' ? (
            <div className="games-list">
              {groupedByGame.length === 0 ? (
                <div className="empty-games">暂无游戏记录</div>
              ) : (
                groupedByGame.map(game => (
                  <div key={game.gameName} className="game-card">
                    <div 
                      className="game-card-header"
                      onClick={() => toggleGameExpand(game.gameName)}
                    >
                      <div className="game-info">
                        <span className="expand-icon">
                          {expandedGames[game.gameName] ? '▼' : '▶'}
                        </span>
                        <h4 className="game-title">{game.gameName}</h4>
                        <span className="channel-badge">{game.channelCount} 个渠道</span>
                      </div>
                      <div className="game-stats">
                        <span className="stat">
                          <span className="label">流水</span>
                          <span className="value">{formatMoney(game.totalFlow)}</span>
                        </span>
                        <span className="stat">
                          <span className="label">结算</span>
                          <span className="value settlement">{formatMoney(game.totalSettlement)}</span>
                        </span>
                        <span className="stat">
                          <span className="label">毛利率</span>
                          <span className={`value ${parseFloat(game.profitRate) >= 0 ? 'positive' : 'negative'}`}>
                            {game.profitRate}%
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {expandedGames[game.gameName] && (
                      <div className="game-channels">
                        <table className="channel-detail-table">
                          <thead>
                            <tr>
                              <th>渠道</th>
                              <th>流水</th>
                              <th>折扣</th>
                              <th>渠道费</th>
                              <th>研发分成</th>
                              <th>服务器</th>
                              <th>代金券</th>
                              <th>结算金额</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {game.records.map(record => (
                              <tr key={record.id}>
                                <td className="channel-name">{record.channelName}</td>
                                <td>{formatMoney(parseFloat(record.flow) || 0)}</td>
                                <td>{record.discountType}</td>
                                <td>{record.channelFeeRate}%</td>
                                <td>{record.devShareRate}%</td>
                                <td>{record.serverCost || '-'}</td>
                                <td>{record.voucherCost || '-'}</td>
                                <td className="settlement">{formatMoney(parseFloat(record.settlementAmount) || 0)}</td>
                                <td className="actions">
                                  <button className="edit-btn" onClick={() => handleEdit(record)}>编辑</button>
                                  <button className="delete-btn" onClick={() => handleDelete(record.id)}>删除</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td className="total-label">合计</td>
                              <td>{formatMoney(game.totalFlow)}</td>
                              <td colSpan="4"></td>
                              <td>{formatMoney(game.totalVoucherCost)}</td>
                              <td className="settlement">{formatMoney(game.totalSettlement)}</td>
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

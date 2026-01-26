import React, { useState, useEffect, useMemo } from 'react'
import './ChannelBilling.css'

function ChannelBilling({ channelRecords, onAddRecord, onUpdateRecord, onDeleteRecord }) {
  const [formData, setFormData] = useState({
    settlementMonth: '',
    channelName: '',
    gameName: '',
    channelFlow: '',
    channelFeeRate: '',
    settlementAmount: '',
    paymentStatus: '未收款',
    remark: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 计算结算金额
  const calculateSettlement = (flow, feeRate) => {
    const channelFlow = parseFloat(flow || 0)
    const rate = parseFloat(feeRate || 0) / 100
    // 渠道结算 = 渠道流水 * (1 - 渠道分成比例)
    // 即我方作为研发，渠道扣除分成后支付给我们的金额
    return channelFlow * (1 - rate)
  }

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    
    // 自动计算结算金额
    if (field === 'channelFlow' || field === 'channelFeeRate') {
      const settlement = calculateSettlement(
        field === 'channelFlow' ? value : formData.channelFlow,
        field === 'channelFeeRate' ? value : formData.channelFeeRate
      )
      newFormData.settlementAmount = settlement.toFixed(2)
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.channelName || !formData.gameName || !formData.channelFlow) {
      window.alert('请填写必填项：渠道名称、游戏名称、渠道流水')
      return
    }

    const record = {
      ...formData,
      channelFlow: parseFloat(formData.channelFlow || 0),
      channelFeeRate: parseFloat(formData.channelFeeRate || 0),
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
      settlementMonth: '',
      channelName: '',
      gameName: '',
      channelFlow: '',
      channelFeeRate: '',
      settlementAmount: '',
      paymentStatus: '未收款',
      remark: ''
    })
    setEditingId(null)
  }

  const handleEdit = (record) => {
    setFormData({
      settlementMonth: record.settlementMonth || '',
      channelName: record.channelName || '',
      gameName: record.gameName || '',
      channelFlow: String(record.channelFlow || ''),
      channelFeeRate: String(record.channelFeeRate || ''),
      settlementAmount: String(record.settlementAmount || ''),
      paymentStatus: record.paymentStatus || '未收款',
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
      (record.gameName || '').toLowerCase().includes(term) ||
      (record.settlementMonth || '').toLowerCase().includes(term)
    )
  }, [channelRecords, searchTerm])

  // 统计
  const statistics = useMemo(() => {
    return filteredRecords.reduce((acc, record) => ({
      totalFlow: acc.totalFlow + (parseFloat(record.channelFlow) || 0),
      totalSettlement: acc.totalSettlement + (parseFloat(record.settlementAmount) || 0),
      received: acc.received + (record.paymentStatus === '已收款' ? (parseFloat(record.settlementAmount) || 0) : 0),
      pending: acc.pending + (record.paymentStatus !== '已收款' ? (parseFloat(record.settlementAmount) || 0) : 0)
    }), { totalFlow: 0, totalSettlement: 0, received: 0, pending: 0 })
  }, [filteredRecords])

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `¥${(amount / 100000000).toFixed(2)}亿`
    } else if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(2)}万`
    }
    return `¥${amount.toFixed(2)}`
  }

  return (
    <div className="channel-billing">
      <div className="channel-header">
        <h2>📤 渠道对账单</h2>
        <p className="subtitle">管理渠道方支付给我方的结算记录（我方为研发）</p>
      </div>

      <div className="channel-stats">
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-content">
            <span className="stat-label">渠道流水总额</span>
            <span className="stat-value">{formatMoney(statistics.totalFlow)}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📥</span>
          <div className="stat-content">
            <span className="stat-label">应收结算总额</span>
            <span className="stat-value">{formatMoney(statistics.totalSettlement)}</span>
          </div>
        </div>
        <div className="stat-card success">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-label">已收款</span>
            <span className="stat-value">{formatMoney(statistics.received)}</span>
          </div>
        </div>
        <div className="stat-card warning">
          <span className="stat-icon">⏳</span>
          <div className="stat-content">
            <span className="stat-label">待收款</span>
            <span className="stat-value">{formatMoney(statistics.pending)}</span>
          </div>
        </div>
      </div>

      <div className="channel-content">
        <div className="channel-form-section">
          <h3>{editingId ? '编辑渠道记录' : '添加渠道记录'}</h3>
          <form onSubmit={handleSubmit} className="channel-form">
            <div className="form-row">
              <div className="form-group">
                <label>结算月份</label>
                <input
                  type="text"
                  value={formData.settlementMonth}
                  onChange={(e) => handleInputChange('settlementMonth', e.target.value)}
                  placeholder="如：2025年1月"
                />
              </div>
              <div className="form-group">
                <label>渠道名称 *</label>
                <input
                  type="text"
                  value={formData.channelName}
                  onChange={(e) => handleInputChange('channelName', e.target.value)}
                  placeholder="如：华为应用市场"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>游戏名称 *</label>
                <input
                  type="text"
                  value={formData.gameName}
                  onChange={(e) => handleInputChange('gameName', e.target.value)}
                  placeholder="如：一起来修仙"
                  required
                />
              </div>
              <div className="form-group">
                <label>渠道流水(元) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.channelFlow}
                  onChange={(e) => handleInputChange('channelFlow', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>渠道分成比例(%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.channelFeeRate}
                  onChange={(e) => handleInputChange('channelFeeRate', e.target.value)}
                  placeholder="如：30 表示渠道拿30%"
                />
              </div>
              <div className="form-group">
                <label>结算金额(元)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.settlementAmount}
                  onChange={(e) => handleInputChange('settlementAmount', e.target.value)}
                  placeholder="自动计算或手动输入"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>收款状态</label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                >
                  <option value="未收款">未收款</option>
                  <option value="已收款">已收款</option>
                  <option value="部分收款">部分收款</option>
                </select>
              </div>
              <div className="form-group">
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
            <h3>渠道记录列表</h3>
            <div className="list-tools">
              <input
                type="text"
                className="search-input"
                placeholder="搜索渠道、游戏、月份..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="record-count">共 {filteredRecords.length} 条</span>
            </div>
          </div>

          <div className="channel-table-wrapper">
            <table className="channel-table">
              <thead>
                <tr>
                  <th>月份</th>
                  <th>渠道</th>
                  <th>游戏</th>
                  <th>渠道流水</th>
                  <th>分成比例</th>
                  <th>结算金额</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      暂无渠道记录
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.settlementMonth || '-'}</td>
                      <td className="channel-name">{record.channelName}</td>
                      <td>{record.gameName}</td>
                      <td>{formatMoney(parseFloat(record.channelFlow) || 0)}</td>
                      <td>{record.channelFeeRate}%</td>
                      <td className="settlement">{formatMoney(parseFloat(record.settlementAmount) || 0)}</td>
                      <td>
                        <span className={`status-badge ${record.paymentStatus === '已收款' ? 'received' : record.paymentStatus === '部分收款' ? 'partial' : 'pending'}`}>
                          {record.paymentStatus}
                        </span>
                      </td>
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
                    <td colSpan="3" className="total-label">合计</td>
                    <td>{formatMoney(statistics.totalFlow)}</td>
                    <td>-</td>
                    <td className="settlement">{formatMoney(statistics.totalSettlement)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChannelBilling

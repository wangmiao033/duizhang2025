import React, { useState } from 'react'
import './DataForm.css'

function DataForm({ onAddRecord, settlementMonth }) {
  const [formData, setFormData] = useState({
    settlementMonth: settlementMonth || '',
    partner: '',
    game: '',
    gameFlow: '',
    testingFee: '0',
    voucher: '0',
    channelFeeRate: '5',
    taxPoint: '0',
    revenueShareRatio: '30',
    discount: '0.005',
    refund: '0'
  })

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, settlementMonth: settlementMonth || '' }))
  }, [settlementMonth])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.game && formData.gameFlow) {
      onAddRecord(formData)
      setFormData({
        settlementMonth: settlementMonth || '',
        partner: '',
        game: '',
        gameFlow: '',
        testingFee: '0',
        voucher: '0',
        channelFeeRate: '5',
        taxPoint: '0',
        revenueShareRatio: '30',
        discount: '0.005',
        refund: '0'
      })
      alert('记录添加成功！')
    } else {
      alert('请至少填写游戏名称和游戏流水！')
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="data-form">
      <form onSubmit={handleSubmit} className="form">
        <h3>添加对账记录</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>结算月份 *</label>
            <input
              type="text"
              value={formData.settlementMonth}
              onChange={(e) => handleChange('settlementMonth', e.target.value)}
              required
              placeholder="如：2025年9月"
            />
          </div>
          <div className="form-group">
            <label>合作方</label>
            <input
              type="text"
              value={formData.partner}
              onChange={(e) => handleChange('partner', e.target.value)}
              placeholder="如：熊动"
            />
          </div>
        </div>

        <div className="form-group">
          <label>游戏 *</label>
          <input
            type="text"
            value={formData.game}
            onChange={(e) => handleChange('game', e.target.value)}
            required
            placeholder="如：一起来修仙(0.05折)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>游戏流水(元) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.gameFlow}
              onChange={(e) => handleChange('gameFlow', e.target.value)}
              required
              placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label>测试费(元)</label>
            <input
              type="number"
              step="0.01"
              value={formData.testingFee}
              onChange={(e) => handleChange('testingFee', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>代金券(元)</label>
            <input
              type="number"
              step="0.01"
              value={formData.voucher}
              onChange={(e) => handleChange('voucher', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label>通道费率(%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.channelFeeRate}
              onChange={(e) => handleChange('channelFeeRate', e.target.value)}
              placeholder="5"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>税点(%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.taxPoint}
              onChange={(e) => handleChange('taxPoint', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>分成比例(%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.revenueShareRatio}
              onChange={(e) => handleChange('revenueShareRatio', e.target.value)}
              placeholder="30"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>折扣</label>
            <input
              type="number"
              step="0.001"
              value={formData.discount}
              onChange={(e) => handleChange('discount', e.target.value)}
              placeholder="0.005"
            />
          </div>
          <div className="form-group">
            <label>退款(元)</label>
            <input
              type="number"
              step="0.01"
              value={formData.refund}
              onChange={(e) => handleChange('refund', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <button type="submit" className="submit-btn">添加记录</button>
      </form>
    </div>
  )
}

export default DataForm

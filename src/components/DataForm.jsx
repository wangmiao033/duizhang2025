import React, { useState } from 'react'
import './DataForm.css'

function DataForm({ onAddRecord, settlementMonth, onError, quickFillData }) {
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

  React.useEffect(() => {
    if (quickFillData) {
      setFormData(prev => ({
        ...prev,
        channelFeeRate: quickFillData.channelFeeRate || prev.channelFeeRate,
        taxPoint: quickFillData.taxPoint || prev.taxPoint,
        revenueShareRatio: quickFillData.revenueShareRatio || prev.revenueShareRatio,
        discount: quickFillData.discount || prev.discount
      }))
    }
  }, [quickFillData])

  const validateForm = () => {
    if (!formData.game || !formData.gameFlow) {
      return '请至少填写游戏名称和游戏流水！'
    }
    
    const gameFlow = parseFloat(formData.gameFlow)
    if (isNaN(gameFlow) || gameFlow <= 0) {
      return '游戏流水必须是大于0的数字！'
    }

    const testingFee = parseFloat(formData.testingFee || 0)
    if (isNaN(testingFee) || testingFee < 0) {
      return '测试费不能为负数！'
    }

    const voucher = parseFloat(formData.voucher || 0)
    if (isNaN(voucher) || voucher < 0) {
      return '代金券金额不能为负数！'
    }

    const channelFeeRate = parseFloat(formData.channelFeeRate || 0)
    if (isNaN(channelFeeRate) || channelFeeRate < 0 || channelFeeRate > 100) {
      return '通道费率必须在0-100%之间！'
    }

    const taxPoint = parseFloat(formData.taxPoint || 0)
    if (isNaN(taxPoint) || taxPoint < 0 || taxPoint > 100) {
      return '税点必须在0-100%之间！'
    }

    const revenueShareRatio = parseFloat(formData.revenueShareRatio || 0)
    if (isNaN(revenueShareRatio) || revenueShareRatio < 0 || revenueShareRatio > 100) {
      return '分成比例必须在0-100%之间！'
    }

    const discount = parseFloat(formData.discount || 0)
    if (isNaN(discount) || discount < 0 || discount > 1) {
      return '折扣必须在0-1之间！'
    }

    const refund = parseFloat(formData.refund || 0)
    if (isNaN(refund) || refund < 0) {
      return '退款金额不能为负数！'
    }

    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const error = validateForm()
    if (error) {
      if (onError) {
        onError(error)
      }
      return
    }

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
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 实时计算结算金额预览
  const calculatePreviewAmount = () => {
    const gameFlow = parseFloat(formData.gameFlow || 0)
    const testingFee = parseFloat(formData.testingFee || 0)
    const voucher = parseFloat(formData.voucher || 0)
    const channelFeeRate = parseFloat(formData.channelFeeRate || 0) / 100
    const taxPoint = parseFloat(formData.taxPoint || 0) / 100
    const revenueShareRatio = parseFloat(formData.revenueShareRatio || 0) / 100
    const discount = parseFloat(formData.discount || 1)
    const refund = parseFloat(formData.refund || 0)

    if (gameFlow <= 0) return 0

    const baseAmount = gameFlow - testingFee - voucher
    const afterChannelFee = baseAmount * (1 - channelFeeRate)
    const afterTax = afterChannelFee * (1 - taxPoint)
    const afterShare = afterTax * revenueShareRatio
    const afterDiscount = afterShare * discount
    const finalAmount = afterDiscount - refund

    return Math.max(0, finalAmount)
  }

  const previewAmount = calculatePreviewAmount()

  return (
    <div className="data-form">
      <form onSubmit={handleSubmit} className="form">
        <div className="form-header-row">
          <h3>添加对账记录</h3>
          <span className="form-hint">必填项已标 *</span>
        </div>

        <div className="form-section">
          <div className="section-title">基础信息</div>
          <div className="form-grid">
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
            <div className="form-group">
              <label>游戏流水(元) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.gameFlow}
                onChange={(e) => handleChange('gameFlow', e.target.value)}
                required
                placeholder="0.00"
                className="number-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-title">费用参数</div>
          <div className="form-grid">
            <div className="form-group">
              <label>测试费(元)</label>
              <input
                type="number"
                step="0.01"
                value={formData.testingFee}
                onChange={(e) => handleChange('testingFee', e.target.value)}
                placeholder="0.00"
                className="number-input"
              />
            </div>
            <div className="form-group">
              <label>代金券(元)</label>
              <input
                type="number"
                step="0.01"
                value={formData.voucher}
                onChange={(e) => handleChange('voucher', e.target.value)}
                placeholder="0.00"
                className="number-input"
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
                className="number-input"
              />
            </div>
            <div className="form-group">
              <label>税点(%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxPoint}
                onChange={(e) => handleChange('taxPoint', e.target.value)}
                placeholder="0"
                className="number-input"
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
                className="number-input"
              />
            </div>
            <div className="form-group">
              <label>折扣</label>
              <input
                type="number"
                step="0.001"
                value={formData.discount}
                onChange={(e) => handleChange('discount', e.target.value)}
                placeholder="0.005"
                className="number-input"
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
                className="number-input"
              />
            </div>
          </div>
        </div>

        <div className="form-preview">
          <div className="preview-card">
            <span className="preview-label">预计结算金额：</span>
            <span className="preview-amount">¥{previewAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">添加记录</button>
        </div>
      </form>
    </div>
  )
}

export default DataForm

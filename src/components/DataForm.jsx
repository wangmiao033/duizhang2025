import React, { useState, useEffect } from 'react'
import './DataForm.css'
import { findGamePreset } from './GamePresets.jsx'
import GamePresets from './GamePresets.jsx'
import { STATUS_OPTIONS } from './StatusManager.jsx'

function DataForm({
  onAddRecord,
  onUpdateRecord,
  settlementMonth,
  onError,
  quickFillData,
  partners = [],
  onAddPartner,
  layout = 'default',
  mode = 'add',
  editRecord = null,
  formId,
  showSubmitButton = true,
  onSubmitted,
  onPreviewChange,
  submitIntentRef
}) {
  const [formData, setFormData] = useState({
    settlementMonth: settlementMonth || '',
    settlementNumber: '',
    partner: '',
    game: '',
    gameFlow: '',
    testingFee: '0',
    voucher: '0',
    channelFeeRate: '0',
    taxPoint: '0',
    revenueShareRatio: '15',
    discount: '1',
    refund: '0',
    status: 'pending'
  })
  const [lastMatchedPreset, setLastMatchedPreset] = useState(null)

  React.useEffect(() => {
    if (mode === 'edit' && editRecord) {
      setFormData({
        settlementMonth: editRecord.settlementMonth ?? settlementMonth ?? '',
        settlementNumber: editRecord.settlementNumber ?? '',
        partner: editRecord.partner ?? '',
        game: editRecord.game ?? '',
        gameFlow: editRecord.gameFlow != null ? String(editRecord.gameFlow) : '',
        testingFee: editRecord.testingFee != null ? String(editRecord.testingFee) : '0',
        voucher: editRecord.voucher != null ? String(editRecord.voucher) : '0',
        channelFeeRate: editRecord.channelFeeRate != null ? String(editRecord.channelFeeRate) : '0',
        taxPoint: editRecord.taxPoint != null ? String(editRecord.taxPoint) : '0',
        revenueShareRatio: editRecord.revenueShareRatio != null ? String(editRecord.revenueShareRatio) : '15',
        discount: editRecord.discount != null ? String(editRecord.discount) : '1',
        refund: editRecord.refund != null ? String(editRecord.refund) : '0',
        status: editRecord.status || 'pending'
      })
      setLastMatchedPreset(null)
      return
    }
    setFormData((prev) => ({ ...prev, settlementMonth: settlementMonth || '' }))
  }, [settlementMonth, mode, editRecord])

  React.useEffect(() => {
    if (quickFillData) {
      setFormData(prev => ({
        ...prev,
        channelFeeRate: quickFillData.channelFeeRate || prev.channelFeeRate,
        taxPoint: quickFillData.taxPoint || prev.taxPoint,
        revenueShareRatio: quickFillData.revenueShareRatio || prev.revenueShareRatio,
        discount: quickFillData.discount || prev.discount,
        testingFee: quickFillData.testingFee || prev.testingFee
      }))
    }
  }, [quickFillData])

  // 根据游戏名称自动匹配预设
  useEffect(() => {
    if (formData.game && formData.game.trim()) {
      const matchedPreset = findGamePreset(formData.game)
      if (matchedPreset && matchedPreset.id !== lastMatchedPreset?.id) {
        // 自动应用匹配的预设参数
        setFormData(prev => ({
          ...prev,
          channelFeeRate: matchedPreset.channelFeeRate || prev.channelFeeRate,
          taxPoint: matchedPreset.taxPoint || prev.taxPoint,
          revenueShareRatio: matchedPreset.revenueShareRatio || prev.revenueShareRatio,
          discount: matchedPreset.discount || prev.discount,
          testingFee: matchedPreset.testingFee || prev.testingFee
        }))
        setLastMatchedPreset(matchedPreset)
      } else if (!matchedPreset && lastMatchedPreset) {
        setLastMatchedPreset(null)
      }
    } else if (lastMatchedPreset) {
      setLastMatchedPreset(null)
    }
  }, [formData.game])

  // 应用游戏预设
  const handleApplyGamePreset = (presetData) => {
    setFormData(prev => ({
      ...prev,
      channelFeeRate: presetData.channelFeeRate || prev.channelFeeRate,
      taxPoint: presetData.taxPoint || prev.taxPoint,
      revenueShareRatio: presetData.revenueShareRatio || prev.revenueShareRatio,
      discount: presetData.discount || prev.discount,
      testingFee: presetData.testingFee || prev.testingFee
    }))
  }

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

    const discount = parseFloat(formData.discount || 1)
    if (isNaN(discount) || discount < 0 || discount > 1) {
      return '折扣必须在0-1之间！支持0折(0)、0.05折(0.0005)、0.1折(0.001)、1折(1)等'
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

    if (mode === 'edit' && editRecord && onUpdateRecord) {
      const ok = onUpdateRecord(editRecord.id, {
        ...editRecord,
        ...formData,
        id: editRecord.id
      })
      if (ok === false) return
      if (onSubmitted) onSubmitted(undefined)
      return
    }

    onAddRecord(formData)
    setFormData({
      settlementMonth: settlementMonth || '',
      settlementNumber: '',
      partner: '',
      game: '',
      gameFlow: '',
      testingFee: '0',
      voucher: '0',
      channelFeeRate: '0',
      taxPoint: '0',
      revenueShareRatio: '15',
      discount: '1',
      refund: '0',
      status: 'pending'
    })
    setLastMatchedPreset(null)
    const intent = submitIntentRef?.current === 'continue' ? 'continue' : 'back'
    if (submitIntentRef) submitIntentRef.current = 'back'
    if (onSubmitted) onSubmitted(intent)
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
    const discount = parseFloat(formData.discount || 1) // 默认1，表示无折扣
    const refund = parseFloat(formData.refund || 0)

    if (gameFlow <= 0) return 0

    const baseAmount = gameFlow - testingFee - voucher
    const afterChannelFee = baseAmount * (1 - channelFeeRate)
    const afterTax = afterChannelFee * (1 - taxPoint)
    const afterShare = afterTax * revenueShareRatio
    const afterDiscount = afterShare * discount
    const finalAmount = afterDiscount - refund

    // 使用四舍五入确保精度，与Excel保持一致
    return Math.max(0, Math.round(finalAmount * 100) / 100)
  }

  const previewAmount = calculatePreviewAmount()

  React.useEffect(() => {
    if (!onPreviewChange) return
    onPreviewChange(previewAmount)
  }, [previewAmount, onPreviewChange])

  const isDrawer = layout === 'drawer'
  const isCreatePage = layout === 'createPage'

  return (
    <div
      className={`data-form ${isDrawer ? 'data-form--drawer' : ''} ${isCreatePage ? 'data-form--create-page' : ''}`}
    >
      <form id={formId || undefined} onSubmit={handleSubmit} className="form">
        {!isDrawer && !isCreatePage && (
          <div className="form-header-row">
            <div>
              <h3>{mode === 'edit' ? '编辑对账记录' : '添加对账记录'}</h3>
              <span className="form-hint">必填项已标 *</span>
            </div>
            <GamePresets onApplyPreset={handleApplyGamePreset} currentGameName={formData.game} />
          </div>
        )}
        {isDrawer && (
          <div className="form-header-row form-header-row--drawer">
            <GamePresets onApplyPreset={handleApplyGamePreset} currentGameName={formData.game} />
          </div>
        )}
        {isCreatePage && (
          <div className="form-header-row form-header-row--create-inline">
            <GamePresets onApplyPreset={handleApplyGamePreset} currentGameName={formData.game} />
          </div>
        )}
        {lastMatchedPreset && (
          <div className="preset-matched-hint">
            ✅ 已自动匹配预设：<strong>{lastMatchedPreset.gameName}</strong>
            {lastMatchedPreset.description && ` (${lastMatchedPreset.description})`}
          </div>
        )}

        <div className="form-section">
          <div className="section-title">基础信息</div>
          <div className="form-grid">
            {mode === 'edit' && (
              <div className="form-group">
                <label>结算单编号</label>
                <input
                  type="text"
                  value={formData.settlementNumber}
                  onChange={(e) => handleChange('settlementNumber', e.target.value)}
                  placeholder="结算单编号"
                  title="可手动修改编号"
                />
              </div>
            )}
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
              <div className="partner-select-wrapper">
                <input
                  type="text"
                  list="partner-list"
                  value={formData.partner}
                  onChange={(e) => handleChange('partner', e.target.value)}
                  placeholder="选择或输入合作方名称"
                  className="partner-input"
                />
                <datalist id="partner-list">
                  {partners.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.category ? `(${p.category})` : ''}
                    </option>
                  ))}
                </datalist>
                {formData.partner && !partners.find(p => p.name === formData.partner) && (
                  <button
                    type="button"
                    className="add-partner-quick-btn"
                    onClick={() => {
                      if (onAddPartner && formData.partner.trim()) {
                        onAddPartner(formData.partner.trim())
                      }
                    }}
                    title="添加到客户库"
                  >
                    ➕
                  </button>
                )}
              </div>
              {formData.partner && !partners.find(p => p.name === formData.partner) && (
                <div className="partner-hint">
                  <span>💡 此客户不在客户库中，点击 ➕ 可快速添加</span>
                </div>
              )}
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
          </div>
        </div>

        <div className="form-section">
          <div className="section-title">分成参数</div>
          <div className="form-grid">
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
                min="0"
                max="1"
                value={formData.discount}
                onChange={(e) => handleChange('discount', e.target.value)}
                placeholder="1（无折扣）"
                className="number-input"
              />
              <small className="field-hint">
                支持：0折(0)、0.05折(0.0005)、0.1折(0.001)、1折(1)等
              </small>
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

        {mode === 'edit' && (
          <div className="form-section">
            <div className="section-title">状态</div>
            <div className="form-grid">
              <div className="form-group">
                <label>记录状态</label>
                <select
                  value={formData.status || 'pending'}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {!isDrawer && !isCreatePage && (
          <div className="form-preview">
            <div className="preview-card">
              <span className="preview-label">预计结算金额：</span>
              <span className="preview-amount">¥{Math.round(previewAmount * 100) / 100}</span>
            </div>
          </div>
        )}

        {showSubmitButton && (
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {mode === 'edit' ? '保存修改' : '添加记录'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default DataForm

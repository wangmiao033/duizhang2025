import React, { useEffect, useState } from 'react'
import {
  initialForm,
  calculateBillingAmount,
  calculateShareAmount,
  calculateSettlement,
  buildRecordFromForm,
  recordToFormData
} from '@/domain/channel/channelBillingForm.js'
import '@/components/ChannelBilling.css'

const COMMON_CHANNELS = [
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

function formatMoney(amount) {
  if (amount >= 100000000) {
    return `¥${(amount / 100000000).toFixed(2)}亿`
  }
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${Number(amount).toFixed(2)}`
}

/**
 * 渠道对账完整表单（新增/编辑页共用，不复制计算公式，逻辑来自 domain/channelBillingForm）
 */
function ChannelBillingForm({
  formId,
  mode = 'add',
  recordId = null,
  sourceRecord = null,
  onAddRecord,
  onUpdateRecord,
  submitIntentRef,
  onAfterSubmit,
  onPreviewChange,
  onError,
  className = ''
}) {
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    onPreviewChange?.(calculateSettlement(formData))
  }, [formData, onPreviewChange])

  useEffect(() => {
    if (mode === 'edit' && sourceRecord) {
      setFormData(recordToFormData(sourceRecord))
    }
    if (mode === 'add') {
      setFormData({ ...initialForm })
    }
  }, [mode, sourceRecord?.id])

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }

    if (
      [
        'flow',
        'voucherCost',
        'noWorryCost',
        'refundCost',
        'testCost',
        'welfareCost',
        'shareRate',
        'taxRate',
        'gatewayCost'
      ].includes(field)
    ) {
      const settlement = calculateSettlement(newFormData)
      newFormData.settlementAmount = settlement.toFixed(2)
    }

    setFormData(newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.channelName || !formData.gameName) {
      const msg = '请填写必填项：渠道名称、游戏名称'
      if (onError) onError(msg)
      else window.alert(msg)
      return
    }

    const record = buildRecordFromForm(formData)
    const intent = submitIntentRef?.current ?? 'back'

    try {
      if (mode === 'edit' && recordId != null) {
        const res = onUpdateRecord?.(recordId, record)
        if (res && typeof res.then === 'function') await res
        onAfterSubmit?.('back')
      } else {
        const res = onAddRecord?.(record)
        if (res && typeof res.then === 'function') await res
        if (intent === 'continue') {
          setFormData({ ...initialForm })
        }
        onAfterSubmit?.(intent)
      }
    } catch {
      return
    }

    if (submitIntentRef) submitIntentRef.current = 'back'
  }

  const datalistId = `${formId}-channel-list`

  return (
    <form id={formId} onSubmit={handleSubmit} className={`channel-form channel-form--page ${className}`}>
      <div className="form-section-title">基础信息 · 渠道与游戏</div>
      <div className="form-row">
        <div className="form-group full-width">
          <label>渠道/公司简称 *</label>
          <input
            type="text"
            list={datalistId}
            value={formData.channelName}
            onChange={(e) => handleInputChange('channelName', e.target.value)}
            placeholder="如：广州触点互联网科技有限公司"
            required
            className="admin-input"
          />
          <datalist id={datalistId}>
            {COMMON_CHANNELS.map((ch) => (
              <option key={ch} value={ch} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group full-width">
          <label>游戏名称 *</label>
          <input
            type="text"
            value={formData.gameName}
            onChange={(e) => handleInputChange('gameName', e.target.value)}
            placeholder="如：一起来修仙(0.05折)"
            required
            className="admin-input"
          />
        </div>
      </div>

      <div className="form-section-title">渠道/游戏/月份 · 结算周期</div>
      <div className="form-row">
        <div className="form-group">
          <label>结算开始日期</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>结算结束日期</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="admin-input"
          />
        </div>
      </div>

      <div className="form-section-title">金额与分成参数</div>
      <div className="form-row">
        <div className="form-group">
          <label>后台流水</label>
          <input
            type="number"
            step="0.01"
            value={formData.flow}
            onChange={(e) => handleInputChange('flow', e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>代金券</label>
          <input
            type="number"
            step="0.01"
            value={formData.voucherCost}
            onChange={(e) => handleInputChange('voucherCost', e.target.value)}
            className="admin-input"
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
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>玩家退款</label>
          <input
            type="number"
            step="0.01"
            value={formData.refundCost}
            onChange={(e) => handleInputChange('refundCost', e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>测试费</label>
          <input
            type="number"
            step="0.01"
            value={formData.testCost}
            onChange={(e) => handleInputChange('testCost', e.target.value)}
            className="admin-input"
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
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>计费金额（自动）</label>
          <input
            type="text"
            value={formatMoney(calculateBillingAmount(formData))}
            readOnly
            className="admin-input readonly-input"
          />
        </div>
      </div>

      <div className="form-section-title">分成与税费</div>
      <div className="form-row three-col">
        <div className="form-group">
          <label>分成比例(%)</label>
          <input
            type="number"
            step="0.01"
            value={formData.shareRate}
            onChange={(e) => handleInputChange('shareRate', e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>分成金额（自动）</label>
          <input
            type="text"
            value={formatMoney(calculateShareAmount(formData))}
            readOnly
            className="admin-input readonly-input"
          />
        </div>
        <div className="form-group">
          <label>税率(%)</label>
          <input
            type="number"
            step="0.01"
            value={formData.taxRate}
            onChange={(e) => handleInputChange('taxRate', e.target.value)}
            className="admin-input"
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
            className="admin-input"
          />
        </div>
      </div>

      <div className="form-section-title">结果预览 · 结算</div>
      <div className="form-row">
        <div className="form-group settlement-group full-width">
          <label>结算金额</label>
          <input
            type="number"
            step="0.01"
            value={formData.settlementAmount}
            onChange={(e) => handleInputChange('settlementAmount', e.target.value)}
            className="admin-input settlement-input"
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
            className="admin-input"
          />
        </div>
      </div>
    </form>
  )
}

export default ChannelBillingForm

import React, { useEffect, useMemo, useState } from 'react'
import {
  initialHeaderForm,
  initialLineItem,
  calculateBillingAmount,
  calculateShareAmount,
  calculateSettlement,
  effectiveLineFlowFromFormData,
  buildFullChannelRecord,
  recordToHeaderForm,
  recordToLineForms
} from '@/domain/channel/channelBillingForm.js'
import '@/components/ChannelBilling.css'
import LineItemsTable from '@/components/shared/LineItemsTable.jsx'

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

function updateLineField(lines, index, field, value) {
  const next = lines.map((row, i) => (i === index ? { ...row, [field]: value } : { ...row }))
  const row = next[index]
  if (field === 'settlementAmount') {
    return next
  }
  if (
    [
      'flow',
      'discountFactor',
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
    const settlement = calculateSettlement(row)
    next[index] = { ...row, settlementAmount: settlement.toFixed(2) }
  }
  return next
}

/**
 * 渠道对账：公共信息 + 多行游戏明细（每行沿用 domain内单游戏计算公式）
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
  const [header, setHeader] = useState(initialHeaderForm)
  const [lines, setLines] = useState([initialLineItem()])

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, row) => {
        const rawFlow = parseFloat(row.flow || 0)
        const effFlow = effectiveLineFlowFromFormData(row)
        const voucher = parseFloat(row.voucherCost || 0)
        const refund = parseFloat(row.refundCost || 0)
        const settlement = parseFloat(row.settlementAmount || 0)
        return {
          rawFlow: acc.rawFlow + rawFlow,
          effectiveFlow: acc.effectiveFlow + effFlow,
          voucher: acc.voucher + voucher,
          refund: acc.refund + refund,
          settlement: acc.settlement + (Number.isFinite(settlement) ? settlement : 0)
        }
      },
      { rawFlow: 0, effectiveFlow: 0, voucher: 0, refund: 0, settlement: 0 }
    )
  }, [lines])

  const previewSettlement = useMemo(() => totals.settlement, [totals.settlement])

  useEffect(() => {
    onPreviewChange?.(previewSettlement)
  }, [previewSettlement, onPreviewChange])

  useEffect(() => {
    if (mode === 'edit' && sourceRecord) {
      setHeader(recordToHeaderForm(sourceRecord))
      const lf = recordToLineForms(sourceRecord)
      setLines(lf.length ? lf : [initialLineItem()])
    }
    if (mode === 'add') {
      setHeader(initialHeaderForm)
      setLines([initialLineItem()])
    }
  }, [mode, sourceRecord?.id])

  const handleHeaderChange = (field, value) => {
    setHeader((h) => ({ ...h, [field]: value }))
  }

  const handleLineChange = (index, field, value) => {
    setLines((prev) => updateLineField(prev, index, field, value))
  }

  const addLine = () => {
    setLines((prev) => [...prev, initialLineItem()])
  }

  const removeLine = (index) => {
    setLines((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!header.channelName?.trim()) {
      const msg = '请填写渠道/公司简称'
      onError?.(msg) ?? window.alert(msg)
      return
    }

    for (let i = 0; i < lines.length; i += 1) {
      const row = lines[i]
      if (!row.gameName?.trim()) {
        const msg = `第 ${i + 1} 行：请填写游戏名称`
        onError?.(msg) ?? window.alert(msg)
        return
      }
    }

    const record = buildFullChannelRecord(header, lines)
    const intent = submitIntentRef?.current ?? 'back'

    try {
      if (mode === 'edit' && recordId != null) {
        const res = onUpdateRecord?.(recordId, { ...record, id: recordId })
        if (res && typeof res.then === 'function') await res
        onAfterSubmit?.('back')
      } else {
        const res = onAddRecord?.(record)
        if (res && typeof res.then === 'function') await res
        if (intent === 'continue') {
          setHeader(initialHeaderForm)
          setLines([initialLineItem()])
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
      <div className="channel-form-section">
      <div className="form-section-title">1）公共信息</div>
      <div className="form-row">
        <div className="form-group full-width">
          <label>渠道/公司简称 *</label>
          <input
            type="text"
            list={datalistId}
            value={header.channelName}
            onChange={(e) => handleHeaderChange('channelName', e.target.value)}
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
          <label>合作方</label>
          <input
            type="text"
            value={header.partnerName}
            onChange={(e) => handleHeaderChange('partnerName', e.target.value)}
            placeholder="可选"
            className="admin-input"
          />
        </div>
      </div>
      <div className="form-row three-col">
        <div className="form-group">
          <label>结算周期（月份）</label>
          <input
            type="month"
            value={header.settlementMonth}
            onChange={(e) => handleHeaderChange('settlementMonth', e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>账期开始</label>
          <input
            type="date"
            value={header.startDate}
            onChange={(e) => handleHeaderChange('startDate', e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="form-group">
          <label>账期结束</label>
          <input
            type="date"
            value={header.endDate}
            onChange={(e) => handleHeaderChange('endDate', e.target.value)}
            className="admin-input"
          />
        </div>
      </div>
      </div>

      <div className="channel-form-section">
      <div className="form-section-title">2）游戏明细（每行独立按原公式计算结算金额）</div>
      <LineItemsTable
        onAddRow={addLine}
        hint="折扣系数仅填数字（如 0.005 表示 0.05 折）。结算与导出均以「折算后总流水」为准。"
      >
        <table className="channel-line-items-table">
          <thead>
            <tr>
              <th>游戏名称</th>
              <th>后台流水</th>
              <th>折扣系数</th>
              <th>总流水</th>
              <th>代金券</th>
              <th>无忧试</th>
              <th>玩家退款</th>
              <th>测试费</th>
              <th>福利币</th>
              <th>分成%</th>
              <th>税率%</th>
              <th>通道费</th>
              <th>计费额</th>
              <th>分成额</th>
              <th>结算额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((row, index) => (
              <tr key={row.id || `line-${index}`}>
                <td>
                  <input
                    type="text"
                    className="admin-input"
                    value={row.gameName}
                    onChange={(e) => handleLineChange(index, 'gameName', e.target.value)}
                    placeholder="必填"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.flow}
                    onChange={(e) => handleLineChange(index, 'flow', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    className="admin-input"
                    value={row.discountFactor}
                    onChange={(e) => handleLineChange(index, 'discountFactor', e.target.value)}
                    placeholder="默认1；0.05折填0.005"
                    title="仅填数字。0.05折请填 0.005，0.1折请填 0.01"
                  />
                </td>
                <td className="channel-line-num" title="后台流水×折扣系数">
                  {effectiveLineFlowFromFormData(row).toFixed(2)}
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.voucherCost}
                    onChange={(e) => handleLineChange(index, 'voucherCost', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.noWorryCost}
                    onChange={(e) => handleLineChange(index, 'noWorryCost', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.refundCost}
                    onChange={(e) => handleLineChange(index, 'refundCost', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.testCost}
                    onChange={(e) => handleLineChange(index, 'testCost', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.welfareCost}
                    onChange={(e) => handleLineChange(index, 'welfareCost', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.shareRate}
                    onChange={(e) => handleLineChange(index, 'shareRate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.taxRate}
                    onChange={(e) => handleLineChange(index, 'taxRate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.gatewayCost}
                    onChange={(e) => handleLineChange(index, 'gatewayCost', e.target.value)}
                  />
                </td>
                <td className="channel-line-num">{formatMoney(calculateBillingAmount(row))}</td>
                <td className="channel-line-num">{formatMoney(calculateShareAmount(row))}</td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={row.settlementAmount}
                    onChange={(e) => handleLineChange(index, 'settlementAmount', e.target.value)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="rec-btn rec-btn--ghost rec-btn--small"
                    onClick={() => removeLine(index)}
                    disabled={lines.length <= 1}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LineItemsTable>
      </div>

      <div className="channel-form-section">
      <div className="form-section-title">3）汇总</div>
      <div className="form-row four-col channel-totals-row">
        <div className="form-group">
          <label>原始后台流水合计</label>
          <input type="text" readOnly className="admin-input readonly-input" value={totals.rawFlow.toFixed(2)} />
        </div>
        <div className="form-group">
          <label>折算后总流水（结算用）</label>
          <input
            type="text"
            readOnly
            className="admin-input readonly-input"
            value={totals.effectiveFlow.toFixed(2)}
          />
        </div>
        <div className="form-group">
          <label>总代金券</label>
          <input type="text" readOnly className="admin-input readonly-input" value={totals.voucher.toFixed(2)} />
        </div>
        <div className="form-group">
          <label>总退款</label>
          <input type="text" readOnly className="admin-input readonly-input" value={totals.refund.toFixed(2)} />
        </div>
      </div>
      <div className="form-row four-col channel-totals-row">
        <div className="form-group">
          <label>总结算金额</label>
          <input
            type="text"
            readOnly
            className="admin-input readonly-input settlement-input"
            value={totals.settlement.toFixed(2)}
          />
        </div>
      </div>
      </div>

      <div className="channel-form-section">
      <div className="form-section-title">备注与其它</div>
      <div className="form-row">
        <div className="form-group full-width">
          <label>备注</label>
          <input
            type="text"
            value={header.remark}
            onChange={(e) => handleHeaderChange('remark', e.target.value)}
            className="admin-input"
          />
        </div>
      </div>
      </div>
    </form>
  )
}

export default ChannelBillingForm

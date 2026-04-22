import React, { useEffect, useMemo, useState } from 'react'
import { findGamePreset } from '@/components/GamePresets.jsx'
import GamePresets from '@/components/GamePresets.jsx'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import LineItemsTable from '@/components/shared/LineItemsTable.jsx'
import {
  calculateSettlementAmount,
  calculateSettlementGrossShare,
  rdLineItemToSettlementPayload
} from '@/domain/settlement/calculateSettlementAmount.js'
import '@/components/ChannelBilling.css'

export function createEmptyRdLine(sortOrder = 0) {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    gameName: '',
    revenue: '0',
    discountRate: '1',
    couponAmount: '0',
    testFee: '0',
    extraFee: '0',
    shareRatio: '15',
    taxRate: '0',
    sortOrder
  }
}

function cloneItemsFromRecord(record) {
  const raw = record?.items
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((line, idx) => ({
      id: line.id != null ? String(line.id) : `line-${idx}`,
      gameName: line.gameName != null ? String(line.gameName) : '',
      revenue: line.revenue != null ? String(line.revenue) : '0',
      discountRate: line.discountRate != null ? String(line.discountRate) : '1',
      couponAmount: line.couponAmount != null ? String(line.couponAmount) : '0',
      testFee: line.testFee != null ? String(line.testFee) : '0',
      extraFee: line.extraFee != null ? String(line.extraFee) : '0',
      shareRatio: line.shareRatio != null ? String(line.shareRatio) : '15',
      taxRate: line.taxRate != null ? String(line.taxRate) : '0',
      sortOrder: line.sortOrder != null ? Number(line.sortOrder) : idx
    }))
  }
  return [createEmptyRdLine(0)]
}

function toMonthInputValue(raw) {
  if (!raw) return ''
  const text = String(raw).trim()
  const ym = text.match(/^(\d{4})-(\d{1,2})$/)
  if (ym) {
    const month = String(Math.min(Math.max(Number(ym[2]), 1), 12)).padStart(2, '0')
    return `${ym[1]}-${month}`
  }
  const cn = text.match(/^(\d{4})年(\d{1,2})月$/)
  if (cn) {
    const month = String(Math.min(Math.max(Number(cn[2]), 1), 12)).padStart(2, '0')
    return `${cn[1]}-${month}`
  }
  const compact = text.match(/^(\d{4})(\d{2})$/)
  if (compact) {
    const month = String(Math.min(Math.max(Number(compact[2]), 1), 12)).padStart(2, '0')
    return `${compact[1]}-${month}`
  }
  return ''
}

function monthInputToCn(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})$/)
  if (!m) return ''
  return `${m[1]}年${Number(m[2])}月`
}

/**
 * 研发对账：布局与渠道 ChannelBillingForm 一致（channel-form-section + LineItemsTable + grid明细）
 */
function ReconciliationLineItemsForm({
  formId,
  layout = 'default',
  mode = 'add',
  editRecord = null,
  showSubmitButton = true,
  onAddRecord,
  onUpdateRecord,
  settlementMonth,
  onError,
  quickFillData,
  partners = [],
  onAddPartner,
  onSubmitted,
  onPreviewChange,
  submitIntentRef
}) {
  const partnerListId = `${formId || 'rd'}-partner-list`

  const [header, setHeader] = useState({
    settlementMonth: settlementMonth || '',
    settlementNumber: '',
    partner: '',
    channelFeeRate: '0',
    memo: '',
    status: 'pending'
  })
  const [lines, setLines] = useState([createEmptyRdLine(0)])

  useEffect(() => {
    if (mode === 'edit' && editRecord) {
      setHeader({
        settlementMonth: editRecord.settlementMonth ?? settlementMonth ?? '',
        settlementNumber: editRecord.settlementNumber != null ? String(editRecord.settlementNumber) : '',
        partner: editRecord.partner != null ? String(editRecord.partner) : '',
        channelFeeRate: editRecord.channelFeeRate != null ? String(editRecord.channelFeeRate) : '0',
        memo: editRecord.memo != null ? String(editRecord.memo) : '',
        status: editRecord.status || 'pending'
      })
      setLines(cloneItemsFromRecord(editRecord))
      return
    }
    setHeader((h) => ({ ...h, settlementMonth: settlementMonth || '' }))
    setLines([createEmptyRdLine(0)])
  }, [mode, editRecord, settlementMonth])

  useEffect(() => {
    if (!quickFillData) return
    setHeader((h) => ({
      ...h,
      channelFeeRate: quickFillData.channelFeeRate || h.channelFeeRate
    }))
    setLines((prev) =>
      prev.map((row) => ({
        ...row,
        shareRatio: quickFillData.revenueShareRatio || row.shareRatio,
        discountRate: quickFillData.discount || row.discountRate,
        taxRate: quickFillData.taxPoint || row.taxRate,
        testFee: quickFillData.testingFee || row.testFee
      }))
    )
  }, [quickFillData])

  const totals = useMemo(() => {
    let sumRevenue = 0
    let sumNet = 0
    let sumCoupon = 0
    let sumSettlement = 0
    for (const line of lines) {
      const rev = parseFloat(line.revenue || 0)
      const dRaw = parseFloat(line.discountRate)
      const d = Number.isFinite(dRaw) ? dRaw : 1
      sumRevenue += Number.isFinite(rev) ? rev : 0
      sumNet += (Number.isFinite(rev) ? rev : 0) * d
      sumCoupon += parseFloat(line.couponAmount || 0) || 0
      const payload = rdLineItemToSettlementPayload(line, header.channelFeeRate)
      sumSettlement += calculateSettlementAmount(payload)
    }
    return {
      sumRevenue,
      sumNet,
      sumCoupon,
      sumSettlement: Math.round(sumSettlement * 100) / 100
    }
  }, [lines, header.channelFeeRate])

  useEffect(() => {
    if (!onPreviewChange) return
    onPreviewChange(totals.sumSettlement)
  }, [totals.sumSettlement, onPreviewChange])

  const mergedRecordForSubmit = () => {
    const gameLabel = lines.map((l) => l.gameName.trim()).filter(Boolean).join('、')
    const first = lines[0]
    return {
      ...(mode === 'edit' && editRecord ? { id: editRecord.id } : {}),
      settlementMonth: header.settlementMonth,
      settlementNumber: header.settlementNumber,
      partner: header.partner,
      channelFeeRate: header.channelFeeRate,
      taxPoint: first ? first.taxRate : '0',
      revenueShareRatio: first ? first.shareRatio : '15',
      discount: first ? first.discountRate : '1',
      game: gameLabel,
      gameFlow: String(totals.sumRevenue),
      testingFee: String(
        lines.reduce((s, l) => s + (parseFloat(l.testFee || 0) || 0), 0)
      ),
      voucher: String(lines.reduce((s, l) => s + (parseFloat(l.couponAmount || 0) || 0), 0)),
      refund: String(lines.reduce((s, l) => s + (parseFloat(l.extraFee || 0) || 0), 0)),
      settlementAmount: totals.sumSettlement.toFixed(2),
      items: lines.map((row, idx) => ({ ...row, sortOrder: idx })),
      status: header.status,
      memo: header.memo
    }
  }

  const validate = () => {
    if (!header.settlementMonth || !String(header.settlementMonth).trim()) {
      return '请填写结算月份'
    }
    const cf = parseFloat(header.channelFeeRate || 0)
    if (Number.isNaN(cf) || cf < 0 || cf > 100) {
      return '通道费率必须在0-100%之间'
    }
    const okLine = lines.some(
      (l) => l.gameName && String(l.gameName).trim() && parseFloat(l.revenue || 0) > 0
    )
    if (!okLine) {
      return '请至少为一行填写游戏名称，且后台流水大于 0'
    }
    for (const l of lines) {
      if (!l.gameName || !String(l.gameName).trim()) continue
      const r = parseFloat(l.revenue || 0)
      if (Number.isNaN(r) || r <= 0) {
        return `游戏「${l.gameName}」的后台流水须大于 0`
      }
      const sr = parseFloat(l.shareRatio || 0)
      if (Number.isNaN(sr) || sr < 0 || sr > 100) {
        return `游戏「${l.gameName}」的分成比例须在 0–100%`
      }
      const tr = parseFloat(l.taxRate || 0)
      if (Number.isNaN(tr) || tr < 0 || tr > 100) {
        return `游戏「${l.gameName}」的税率须在 0–100%`
      }
      const disc = parseFloat(l.discountRate || 1)
      if (Number.isNaN(disc) || disc < 0 || disc > 1) {
        return `游戏「${l.gameName}」的折扣系数须在 0–1`
      }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      onError?.(err)
      return
    }
    const merged = mergedRecordForSubmit()

    if (mode === 'edit' && editRecord && onUpdateRecord) {
      const result = onUpdateRecord(editRecord.id, { ...editRecord, ...merged, id: editRecord.id })
      const ok = result && typeof result.then === 'function' ? await result : result
      if (ok === false) return
      onSubmitted?.(undefined)
      return
    }

    try {
      const result = onAddRecord(merged)
      if (result && typeof result.then === 'function') await result
    } catch {
      return
    }
    setHeader({
      settlementMonth: settlementMonth || '',
      settlementNumber: '',
      partner: '',
      channelFeeRate: '0',
      memo: '',
      status: 'pending'
    })
    setLines([createEmptyRdLine(0)])
    const intent = submitIntentRef?.current === 'continue' ? 'continue' : 'back'
    if (submitIntentRef) submitIntentRef.current = 'back'
    onSubmitted?.(intent)
  }

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const applyGamePresetToRow = (index, presetData) => {
    setLines((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              shareRatio: presetData.revenueShareRatio || row.shareRatio,
              discountRate: presetData.discount || row.discountRate,
              taxRate: presetData.taxPoint || row.taxRate,
              testFee: presetData.testingFee || row.testFee
            }
          : row
      )
    )
  }

  const onGameNameBlur = (index, name) => {
    const trimmed = String(name || '').trim()
    if (!trimmed) return
    const preset = findGamePreset(trimmed)
    if (preset) applyGamePresetToRow(index, preset)
  }

  const addRow = () => {
    setLines((prev) => [...prev, createEmptyRdLine(prev.length)])
  }

  const removeRow = (index) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const isDrawer = layout === 'drawer'
  const isCreatePage = layout === 'createPage'

  const formClass = `channel-form rd-recon-billing-form ${isDrawer ? 'channel-form--drawer' : 'channel-form--page'}`

  return (
    <div className="channel-rd">
      <form id={formId || undefined} onSubmit={handleSubmit} className={formClass}>
        {!isDrawer && !isCreatePage && (
          <div className="rd-recon-meta-header">
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--admin-font-title)' }}>
                {mode === 'edit' ? '编辑对账记录' : '添加对账记录'}
              </h3>
              <span className="channel-discount-hint" style={{ display: 'block', marginTop: 4 }}>
                必填项见标签；税点仅展示，不参与结算公式。
              </span>
            </div>
            <GamePresets
              onApplyPreset={(p) => applyGamePresetToRow(0, p)}
              currentGameName={lines[0]?.gameName}
            />
          </div>
        )}
        {isDrawer && (
          <div className="rd-recon-meta-header" style={{ justifyContent: 'flex-end' }}>
            <GamePresets
              onApplyPreset={(p) => applyGamePresetToRow(0, p)}
              currentGameName={lines[0]?.gameName}
            />
          </div>
        )}
        {isCreatePage && (
          <div className="rd-recon-meta-header" style={{ justifyContent: 'flex-end' }}>
            <GamePresets
              onApplyPreset={(p) => applyGamePresetToRow(0, p)}
              currentGameName={lines[0]?.gameName}
            />
          </div>
        )}

        <div className="channel-form-section">
          <div className="form-section-title">1）基础信息</div>
          <div className="form-row">
            {mode === 'edit' && (
              <div className="form-group">
                <label>结算单编号</label>
                <input
                  type="text"
                  className="admin-input"
                  value={header.settlementNumber}
                  onChange={(e) => setHeader((h) => ({ ...h, settlementNumber: e.target.value }))}
                  placeholder="结算单编号"
                />
              </div>
            )}
            <div className="form-group">
              <label>结算月份 *</label>
              <input
                type="month"
                className="admin-input"
                value={toMonthInputValue(header.settlementMonth)}
                onChange={(e) =>
                  setHeader((h) => ({
                    ...h,
                    settlementMonth: monthInputToCn(e.target.value)
                  }))
                }
                required
                title="请选择结算月份"
              />
            </div>
            <div className="form-group">
              <label>合作方</label>
              <div className="partner-select-wrapper" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  list={partnerListId}
                  className="admin-input"
                  style={{ flex: 1 }}
                  value={header.partner}
                  onChange={(e) => setHeader((h) => ({ ...h, partner: e.target.value }))}
                  placeholder="选择或输入合作方名称"
                />
                <datalist id={partnerListId}>
                  {partners.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.category ? `(${p.category})` : ''}
                    </option>
                  ))}
                </datalist>
                {header.partner && !partners.find((p) => p.name === header.partner) && (
                  <button
                    type="button"
                    className="rec-btn rec-btn--ghost"
                    onClick={() => {
                      if (onAddPartner && header.partner.trim()) onAddPartner(header.partner.trim())
                    }}
                    title="添加到客户库"
                  >
                    {'\u2795'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>通道费率（%）整单共用</label>
              <input
                type="number"
                step="0.01"
                className="admin-input channel-input-num"
                value={header.channelFeeRate}
                onChange={(e) => setHeader((h) => ({ ...h, channelFeeRate: e.target.value }))}
              />
            </div>
            <div className="form-group full-width">
              <label>备注</label>
              <input
                type="text"
                className="admin-input"
                value={header.memo}
                onChange={(e) => setHeader((h) => ({ ...h, memo: e.target.value }))}
                placeholder="内部备注"
              />
            </div>
          </div>
        </div>

        <div className="channel-form-section">
          <div className="form-section-title">2）游戏明细</div>
          <LineItemsTable
            onAddRow={addRow}
            hint="折扣系数与历史口径一致（如 1 无折扣，0.005 为 0.05 折档）。自动计算列不可编辑。"
          >
            <div className="rd-line-items-grid">
              <div className="rd-line-items-grid-head" aria-hidden="true">
                <div className="channel-cell">游戏名称</div>
                <div className="channel-cell channel-cell--num">后台流水</div>
                <div className="channel-cell channel-cell--num">折扣</div>
                <div className="channel-cell channel-cell--num">总流水</div>
                <div className="channel-cell channel-cell--num">代金券</div>
                <div className="channel-cell channel-cell--num">测试费</div>
                <div className="channel-cell channel-cell--num">额外费用</div>
                <div className="channel-cell channel-cell--num">分成%</div>
                <div className="channel-cell channel-cell--num">税率%</div>
                <div className="channel-cell channel-cell--num">分成金额</div>
                <div className="channel-cell channel-cell--num">结算金额</div>
                <div className="channel-cell channel-cell--actions">操作</div>
              </div>
              {lines.map((line, index) => {
                const rev = parseFloat(line.revenue || 0)
                const dRaw = parseFloat(line.discountRate)
                const d = Number.isFinite(dRaw) ? dRaw : 1
                const net = (Number.isFinite(rev) ? rev : 0) * d
                const payload = rdLineItemToSettlementPayload(line, header.channelFeeRate)
                const gross = calculateSettlementGrossShare(payload)
                const settlement = calculateSettlementAmount(payload)
                return (
                  <div key={line.id} className="rd-line-items-grid-row">
                    <div className="channel-cell">
                      <input
                        type="text"
                        className="admin-input"
                        value={line.gameName}
                        onChange={(e) => updateLine(index, 'gameName', e.target.value)}
                        onBlur={(e) => onGameNameBlur(index, e.target.value)}
                        placeholder="必填"
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="number"
                        step="0.01"
                        className="admin-input channel-input-num"
                        value={line.revenue}
                        onChange={(e) => updateLine(index, 'revenue', e.target.value)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        className="admin-input channel-input-num"
                        value={line.discountRate}
                        onChange={(e) => updateLine(index, 'discountRate', e.target.value)}
                        title="0.05折填0.005"
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="text"
                        readOnly
                        disabled
                        className="admin-input readonly-input channel-input-num"
                        value={net.toFixed(2)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="number"
                        step="0.01"
                        className="admin-input channel-input-num"
                        value={line.couponAmount}
                        onChange={(e) => updateLine(index, 'couponAmount', e.target.value)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="number"
                        step="0.01"
                        className="admin-input channel-input-num"
                        value={line.testFee}
                        onChange={(e) => updateLine(index, 'testFee', e.target.value)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="number"
                        step="0.01"
                        className="admin-input channel-input-num"
                        value={line.extraFee}
                        onChange={(e) => updateLine(index, 'extraFee', e.target.value)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="number"
                        step="0.01"
                        className="admin-input channel-input-num"
                        value={line.shareRatio}
                        onChange={(e) => updateLine(index, 'shareRatio', e.target.value)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="number"
                        step="0.01"
                        className="admin-input channel-input-num"
                        value={line.taxRate}
                        onChange={(e) => updateLine(index, 'taxRate', e.target.value)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="text"
                        readOnly
                        disabled
                        className="admin-input readonly-input channel-input-num"
                        value={gross.toFixed(2)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--num">
                      <input
                        type="text"
                        readOnly
                        disabled
                        className="admin-input readonly-input channel-input-num"
                        value={settlement.toFixed(2)}
                      />
                    </div>
                    <div className="channel-cell channel-cell--actions">
                      <button
                        type="button"
                        className="rec-btn rec-btn--danger-outline"
                        disabled={lines.length <= 1}
                        onClick={() => removeRow(index)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </LineItemsTable>
        </div>

        <div className="channel-form-section">
          <div className="form-section-title">3）汇总</div>
          <div className="channel-line-items-summary channel-line-items-summary--rd">
            <div className="summary-item summary-item--accent">
              <div className="label">总后台流水</div>
              <div className="value">¥{totals.sumRevenue.toFixed(2)}</div>
            </div>
            <div className="summary-item summary-item--accent">
              <div className="label">折后总流水</div>
              <div className="value">¥{totals.sumNet.toFixed(2)}</div>
            </div>
            <div className="summary-item">
              <div className="label">总代金券</div>
              <div className="value">¥{totals.sumCoupon.toFixed(2)}</div>
            </div>
            <div className="summary-item summary-item--hero">
              <div className="label">总结算金额</div>
              <div className="value">¥{totals.sumSettlement.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {mode === 'edit' && (
          <div className="channel-form-section">
            <div className="form-section-title">状态</div>
            <div className="form-row">
              <div className="form-group">
                <label>记录状态</label>
                <select
                  className="admin-input"
                  value={header.status || 'pending'}
                  onChange={(e) => setHeader((h) => ({ ...h, status: e.target.value }))}
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
          <div className="channel-form-section" style={{ padding: '12px 16px' }}>
            <div className="form-row" style={{ alignItems: 'center' }}>
              <span style={{ color: 'var(--admin-text-sub)', fontSize: 14 }}>预计结算金额</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-success)' }}>
                {`\u00a5${totals.sumSettlement.toFixed(2)}`}
              </span>
            </div>
          </div>
        )}

        {showSubmitButton && (
          <div className="form-actions" style={{ marginTop: 8 }}>
            <button type="submit" className="rec-btn rec-btn--primary">
              {mode === 'edit' ? '保存修改' : '添加记录'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default ReconciliationLineItemsForm

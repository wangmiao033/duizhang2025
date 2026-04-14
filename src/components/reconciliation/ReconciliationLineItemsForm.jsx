import React, { useEffect, useMemo, useState } from 'react'
import { findGamePreset } from '@/components/GamePresets.jsx'
import GamePresets from '@/components/GamePresets.jsx'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import {
  calculateSettlementAmount,
  calculateSettlementGrossShare,
  rdLineItemToSettlementPayload,
} from '@/domain/settlement/calculateSettlementAmount.js'
import '@/components/DataForm.css'

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

/**
 * 研发对账：公共信息 + 多行游戏（每行沿用 calculateSettlementAmount 口径）
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
    setLines((prev) => {
      const next = prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      return next
    })
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
            <GamePresets
              onApplyPreset={(p) => applyGamePresetToRow(0, p)}
              currentGameName={lines[0]?.gameName}
            />
          </div>
        )}
        {isDrawer && (
          <div className="form-header-row form-header-row--drawer">
            <GamePresets
              onApplyPreset={(p) => applyGamePresetToRow(0, p)}
              currentGameName={lines[0]?.gameName}
            />
          </div>
        )}
        {isCreatePage && (
          <div className="form-header-row form-header-row--create-inline">
            <GamePresets
              onApplyPreset={(p) => applyGamePresetToRow(0, p)}
              currentGameName={lines[0]?.gameName}
            />
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
                  value={header.settlementNumber}
                  onChange={(e) => setHeader((h) => ({ ...h, settlementNumber: e.target.value }))}
                  placeholder="结算单编号"
                />
              </div>
            )}
            <div className="form-group">
              <label>结算月份 *</label>
              <input
                type="text"
                value={header.settlementMonth}
                onChange={(e) => setHeader((h) => ({ ...h, settlementMonth: e.target.value }))}
                required
                placeholder="如：2025年9月"
              />
            </div>
            <div className="form-group">
              <label>合作方</label>
              <div className="partner-select-wrapper">
                <input
                  type="text"
                  list="rd-partner-list"
                  value={header.partner}
                  onChange={(e) => setHeader((h) => ({ ...h, partner: e.target.value }))}
                  placeholder="选择或输入合作方名称"
                  className="partner-input"
                />
                <datalist id="rd-partner-list">
                  {partners.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.category ? `(${p.category})` : ''}
                    </option>
                  ))}
                </datalist>
                {header.partner && !partners.find((p) => p.name === header.partner) && (
                  <button
                    type="button"
                    className="add-partner-quick-btn"
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
            <div className="form-group">
              <label>通道费率(%)（整单共用）</label>
              <input
                type="number"
                step="0.01"
                value={header.channelFeeRate}
                onChange={(e) => setHeader((h) => ({ ...h, channelFeeRate: e.target.value }))}
                className="number-input"
              />
            </div>
            <div className="form-group full-width">
              <label>备注</label>
              <input
                type="text"
                value={header.memo}
                onChange={(e) => setHeader((h) => ({ ...h, memo: e.target.value }))}
                placeholder="内部备注"
              />
            </div>
          </div>
        </div>

        <div className="rd-line-items-wrap">
          <div className="rd-line-items-toolbar">
            <span className="section-title" style={{ margin: 0 }}>
              游戏明细
            </span>
            <button type="button" className="rec-btn rec-btn--secondary" onClick={addRow}>
              + 新增一行游戏
            </button>
          </div>
          <p className="rd-line-items-hint">
            折扣系数含义与历史一致（如 1 无折扣，0.005 为 0.05 折档）；税点仅展示，不参与结算公式。
          </p>
          <div className="rd-line-items-table-wrap">
            <table className="rd-line-items-table">
              <thead>
                <tr>
                  <th>游戏名称</th>
                  <th className="num">后台流水</th>
                  <th className="num">折扣系数</th>
                  <th className="num">总流水</th>
                  <th className="num">代金券</th>
                  <th className="num">测试费</th>
                  <th className="num">额外费用</th>
                  <th className="num">分成比例%</th>
                  <th className="num">税率%</th>
                  <th className="num">分成金额</th>
                  <th className="num">结算金额</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const rev = parseFloat(line.revenue || 0)
                  const dRaw = parseFloat(line.discountRate)
                  const d = Number.isFinite(dRaw) ? dRaw : 1
                  const net = (Number.isFinite(rev) ? rev : 0) * d
                  const payload = rdLineItemToSettlementPayload(line, header.channelFeeRate)
                  const gross = calculateSettlementGrossShare(payload)
                  const settlement = calculateSettlementAmount(payload)
                  return (
                    <tr key={line.id}>
                      <td>
                        <input
                          type="text"
                          value={line.gameName}
                          onChange={(e) => updateLine(index, 'gameName', e.target.value)}
                          onBlur={(e) => onGameNameBlur(index, e.target.value)}
                          placeholder="游戏名称"
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          value={line.revenue}
                          onChange={(e) => updateLine(index, 'revenue', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          value={line.discountRate}
                          onChange={(e) => updateLine(index, 'discountRate', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="text"
                          readOnly
                          className="rd-line-items-readonly"
                          value={net.toFixed(2)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          value={line.couponAmount}
                          onChange={(e) => updateLine(index, 'couponAmount', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          value={line.testFee}
                          onChange={(e) => updateLine(index, 'testFee', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          value={line.extraFee}
                          onChange={(e) => updateLine(index, 'extraFee', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          value={line.shareRatio}
                          onChange={(e) => updateLine(index, 'shareRatio', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          value={line.taxRate}
                          onChange={(e) => updateLine(index, 'taxRate', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="text"
                          readOnly
                          className="rd-line-items-readonly"
                          value={gross.toFixed(2)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="text"
                          readOnly
                          className="rd-line-items-readonly"
                          value={settlement.toFixed(2)}
                        />
                      </td>
                      <td className="line-actions">
                        <button
                          type="button"
                          className="rec-btn rec-btn--ghost"
                          disabled={lines.length <= 1}
                          onClick={() => removeRow(index)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rd-line-items-summary">
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
            <div className="summary-item summary-item--accent">
              <div className="label">总结算金额</div>
              <div className="value">¥{totals.sumSettlement.toFixed(2)}</div>
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
          <div className="form-preview">
            <div className="preview-card">
              <span className="preview-label">预计结算金额：</span>
              <span className="preview-amount">¥{totals.sumSettlement.toFixed(2)}</span>
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

export default ReconciliationLineItemsForm

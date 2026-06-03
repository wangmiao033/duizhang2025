import React, { useEffect, useMemo, useState } from 'react'
import { findGamePreset } from '@/components/GamePresets.jsx'
import GamePresets from '@/components/GamePresets.jsx'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import LineItemsTable from '@/components/shared/LineItemsTable.jsx'
import {
  calculateRdSettlementRow
} from '@/domain/settlement/calculateSettlementAmount.js'
import {
  getQuickSdkGameFlow,
  listQuickSdkRdLines
} from '@/lib/api/quicksdk.ts'
import '@/components/ChannelBilling.css'

export function createEmptyRdLine(sortOrder = 0, settlementCycle = '') {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    settlementCycle,
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
      settlementCycle:
        line.settlementCycle != null
          ? String(line.settlementCycle)
          : record?.settlementMonth != null
            ? String(record.settlementMonth)
            : '',
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
  return [createEmptyRdLine(0, record?.settlementMonth != null ? String(record.settlementMonth) : '')]
}

function getCurrentCycleLabel() {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
}

function buildRecentCycleOptions(monthCount = 12) {
  const now = new Date()
  const out = []
  for (let i = 0; i < monthCount; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}年${d.getMonth() + 1}月`)
  }
  return out
}

function normalizeSettlementCycleLabel(raw) {
  const text = raw == null ? '' : String(raw).trim()
  if (!text) return ''
  let m = text.match(/^(\d{4})年(\d{1,2})月$/)
  if (m) return `${m[1]}年${Math.min(Math.max(Number(m[2]), 1), 12)}月`
  m = text.match(/^(\d{1,2})月$/)
  if (m) {
    const now = new Date()
    return `${now.getFullYear()}年${Math.min(Math.max(Number(m[1]), 1), 12)}月`
  }
  m = text.match(/^(\d{1,2})$/)
  if (m) {
    const now = new Date()
    return `${now.getFullYear()}年${Math.min(Math.max(Number(m[1]), 1), 12)}月`
  }
  m = text.match(/^(\d{4})[\/.](\d{1,2})$/)
  if (m) return `${m[1]}年${Math.min(Math.max(Number(m[2]), 1), 12)}月`
  m = text.match(/^(\d{1,2})[\/.](\d{4})$/)
  if (m) return `${m[2]}年${Math.min(Math.max(Number(m[1]), 1), 12)}月`
  m = text.match(/^(\d{4})-(\d{1,2})$/)
  if (m) return `${m[1]}年${Math.min(Math.max(Number(m[2]), 1), 12)}月`
  m = text.match(/^(\d{4})(\d{2})$/)
  if (m) return `${m[1]}年${Math.min(Math.max(Number(m[2]), 1), 12)}月`
  return text
}

function settlementCycleToQuickSdkMonth(raw) {
  const text = normalizeSettlementCycleLabel(raw)
  if (!text) return ''
  let m = text.match(/^(\d{4})年(\d{1,2})月$/)
  if (m) return `${m[1]}-${String(Math.min(Math.max(Number(m[2]), 1), 12)).padStart(2, '0')}`
  m = text.match(/^(\d{4})-(\d{1,2})$/)
  if (m) return `${m[1]}-${String(Math.min(Math.max(Number(m[2]), 1), 12)).padStart(2, '0')}`
  return text
}

function quickSdkMonthToSettlementCycle(raw) {
  const text = raw == null ? '' : String(raw).trim()
  const m = text.match(/^(\d{4})-(\d{1,2})$/)
  if (m) return `${m[1]}年${Number(m[2])}月`
  return normalizeSettlementCycleLabel(text)
}

function formatLineNumber(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  return String(Math.round(n * 100) / 100)
}

function formatMoney(value) {
  const n = Number(value || 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatIssueDateLabel(raw) {
  const d = raw ? new Date(raw) : new Date()
  const date = Number.isNaN(d.getTime()) ? new Date() : d
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function isMeaningfulRdLine(line) {
  return Boolean(
    line?.gameName &&
      String(line.gameName).trim() &&
      Number.parseFloat(line.revenue || 0) > 0
  )
}

function resolveCanonicalSettlementMonth(lines, fallbackMonth) {
  const normalizedFallback = normalizeSettlementCycleLabel(fallbackMonth)
  const cycles = Array.from(
    new Set(
      lines
        .filter(isMeaningfulRdLine)
        .map((line) => normalizeSettlementCycleLabel(line.settlementCycle || normalizedFallback))
        .filter(Boolean)
    )
  )

  if (cycles.length === 0) {
    return {
      month: normalizedFallback,
      error: normalizedFallback ? null : '请填写结算月份'
    }
  }

  if (cycles.length > 1) {
    return {
      month: null,
      error: '同一张研发对账单的结算周期必须一致，请统一后再保存'
    }
  }

  return { month: cycles[0], error: null }
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
  settlementCycles = [],
  onError,
  quickFillData,
  partners = [],
  onAddPartner,
  onSubmitted,
  onPreviewChange,
  submitIntentRef
}) {
  const partnerListId = `${formId || 'rd'}-partner-list`
  const cycleListId = `${formId || 'rd'}-cycle-list`
  const initialCycle = settlementMonth || getCurrentCycleLabel()

  const [header, setHeader] = useState({
    settlementMonth: initialCycle,
    issueDate: formatIssueDateLabel(),
    settlementNumber: '',
    partner: '',
    channelFeeRate: '0',
    memo: '',
    status: 'pending'
  })
  const [lines, setLines] = useState([createEmptyRdLine(0, initialCycle)])
  const [quickSdkQuery, setQuickSdkQuery] = useState('')
  const [quickSdkSuggestions, setQuickSdkSuggestions] = useState([])
  const [quickSdkLoading, setQuickSdkLoading] = useState(false)
  const [quickSdkMessage, setQuickSdkMessage] = useState(null)
  const [quickSdkCheck, setQuickSdkCheck] = useState(null)
  const quickSdkMonth = useMemo(
    () => settlementCycleToQuickSdkMonth(header.settlementMonth || lines[0]?.settlementCycle),
    [header.settlementMonth, lines]
  )
  const cycleOptions = useMemo(() => {
    const set = new Set()
    for (const recent of buildRecentCycleOptions(12)) {
      set.add(recent)
    }
    for (const raw of settlementCycles) {
      const normalized = normalizeSettlementCycleLabel(raw)
      if (normalized) set.add(normalized)
    }
    for (const row of lines) {
      const normalized = normalizeSettlementCycleLabel(row.settlementCycle)
      if (normalized) set.add(normalized)
    }
    const normalizedHeader = normalizeSettlementCycleLabel(header.settlementMonth)
    if (normalizedHeader) set.add(normalizedHeader)
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [settlementCycles, lines, header.settlementMonth])

  useEffect(() => {
    if (mode === 'edit' && editRecord) {
      setHeader({
        settlementMonth: editRecord.settlementMonth ?? initialCycle,
        issueDate: formatIssueDateLabel(editRecord.createdAt ?? editRecord.created_at),
        settlementNumber: editRecord.settlementNumber != null ? String(editRecord.settlementNumber) : '',
        partner: editRecord.partner != null ? String(editRecord.partner) : '',
        channelFeeRate: editRecord.channelFeeRate != null ? String(editRecord.channelFeeRate) : '0',
        memo: editRecord.memo != null ? String(editRecord.memo) : '',
        status: editRecord.status || 'pending'
      })
      setLines(cloneItemsFromRecord(editRecord))
      return
    }
    setHeader((h) => ({
      ...h,
      settlementMonth: settlementMonth || getCurrentCycleLabel(),
      issueDate: formatIssueDateLabel()
    }))
    setLines([createEmptyRdLine(0, settlementMonth || getCurrentCycleLabel())])
  }, [mode, editRecord, settlementMonth, initialCycle])

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
    let sumShareAmount = 0
    let sumSettlement = 0
    for (const line of lines) {
      const rev = parseFloat(line.revenue || 0)
      const dRaw = parseFloat(line.discountRate)
      const d = Number.isFinite(dRaw) ? dRaw : 1
      sumRevenue += Number.isFinite(rev) ? rev : 0
      sumNet += (Number.isFinite(rev) ? rev : 0) * d
      sumCoupon += parseFloat(line.couponAmount || 0) || 0
      const calc = calculateRdSettlementRow(line, header.channelFeeRate)
      sumShareAmount += calc.shareAmount
      sumSettlement += calc.settlementAmount
    }
    return {
      sumRevenue,
      sumNet,
      sumCoupon,
      sumShareAmount: Math.round(sumShareAmount * 100) / 100,
      sumSettlement: Math.round(sumSettlement * 100) / 100
    }
  }, [lines, header.channelFeeRate])

  useEffect(() => {
    if (!onPreviewChange) return
    onPreviewChange(totals.sumSettlement)
  }, [totals.sumSettlement, onPreviewChange])

  const mergedRecordForSubmit = () => {
    const { month: canonicalSettlementMonth } = resolveCanonicalSettlementMonth(
      lines,
      header.settlementMonth
    )
    const gameLabel = lines.map((l) => l.gameName.trim()).filter(Boolean).join('、')
    const first = lines[0]
    return {
      ...(mode === 'edit' && editRecord ? { id: editRecord.id } : {}),
      settlementMonth: canonicalSettlementMonth,
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
      items: lines.map((row, idx) => ({
        ...row,
        settlementCycle: normalizeSettlementCycleLabel(
          row.settlementCycle || canonicalSettlementMonth
        ),
        sortOrder: idx
      })),
      status: header.status,
      memo: header.memo
    }
  }

  const validate = () => {
    const { error: monthError } = resolveCanonicalSettlementMonth(lines, header.settlementMonth)
    if (monthError) return monthError
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
      settlementMonth: settlementMonth || getCurrentCycleLabel(),
      issueDate: formatIssueDateLabel(),
      settlementNumber: '',
      partner: '',
      channelFeeRate: '0',
      memo: '',
      status: 'pending'
    })
    setLines([createEmptyRdLine(0, settlementMonth || getCurrentCycleLabel())])
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
    setLines((prev) => [...prev, createEmptyRdLine(prev.length, header.settlementMonth || '')])
  }

  const removeRow = (index) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const makeQuickSdkLine = (item, index, baseLine = null) => {
    const defaults = baseLine || lines[0] || createEmptyRdLine(0, header.settlementMonth || '')
    const cycle =
      quickSdkMonthToSettlementCycle(item.settlement_month || quickSdkMonth) ||
      normalizeSettlementCycleLabel(header.settlementMonth)
    return {
      ...createEmptyRdLine(index, cycle),
      gameName: item.game_name || '',
      revenue: formatLineNumber(item.total_flow),
      discountRate: defaults.discountRate || '1',
      couponAmount: '0',
      testFee: defaults.testFee || '0',
      extraFee: '0',
      shareRatio: defaults.shareRatio || '15',
      taxRate: defaults.taxRate || '0',
      sortOrder: index,
      quicksdkFlow: Number(item.total_flow || 0),
      quicksdkFlowMonth: item.settlement_month || quickSdkMonth,
      quicksdkRowCount: item.row_count || 0,
      quicksdkChannelCount: item.channel_count || 0,
      quicksdkSourceGameCount: item.source_game_count || 0,
      quicksdkTopChannel: item.top_channel || ''
    }
  }

  const loadQuickSdkSuggestions = async () => {
    if (!quickSdkMonth) {
      setQuickSdkMessage({ type: 'warn', text: '请先填写结算周期' })
      return []
    }
    setQuickSdkLoading(true)
    try {
      const res = await listQuickSdkRdLines({
        settlement_month: quickSdkMonth,
        q: quickSdkQuery,
        limit: 300
      })
      setQuickSdkSuggestions(res.items || [])
      setQuickSdkMessage({
        type: 'ok',
        text: `已读取 ${res.items?.length || 0} 个产品`
      })
      return res.items || []
    } catch (err) {
      setQuickSdkMessage({
        type: 'warn',
        text: err instanceof Error ? err.message : 'QuickSDK 流水读取失败'
      })
      return []
    } finally {
      setQuickSdkLoading(false)
    }
  }

  const applyQuickSdkFlowToSingleLine = async (pickedItem = null) => {
    if (!quickSdkMonth) {
      setQuickSdkMessage({ type: 'warn', text: '请先填写结算周期' })
      return
    }
    const fallbackName = lines.find((line) => String(line.gameName || '').trim())?.gameName || ''
    const targetName = pickedItem?.game_name || quickSdkQuery.trim() || String(fallbackName).trim()
    if (!targetName) {
      setQuickSdkMessage({ type: 'warn', text: '请输入或选择产品名称' })
      return
    }
    setQuickSdkLoading(true)
    try {
      const item =
        pickedItem ||
        (await getQuickSdkGameFlow({
          settlement_month: quickSdkMonth,
          game_name: targetName
        }))
      if (!item || Number(item.row_count || 0) <= 0 || Number(item.total_flow || 0) <= 0) {
        setQuickSdkMessage({ type: 'warn', text: `未找到 ${targetName} 的当月流水` })
        return
      }
      setHeader((h) => ({
        ...h,
        settlementMonth: quickSdkMonthToSettlementCycle(item.settlement_month || quickSdkMonth) || h.settlementMonth
      }))
      setLines((prev) => {
        const matchIndex = prev.findIndex((line) => {
          const name = String(line.gameName || '').trim()
          return !name || name === targetName || name === item.game_name
        })
        const index = matchIndex >= 0 ? matchIndex : 0
        return prev.map((line, i) => (i === index ? makeQuickSdkLine(item, i, line) : line))
      })
      setQuickSdkQuery(item.game_name || targetName)
      setQuickSdkMessage({
        type: 'ok',
        text: `${item.game_name || targetName} 已填入 ￥${formatMoney(item.total_flow)}`
      })
      setQuickSdkCheck(null)
    } catch (err) {
      setQuickSdkMessage({
        type: 'warn',
        text: err instanceof Error ? err.message : 'QuickSDK 流水读取失败'
      })
    } finally {
      setQuickSdkLoading(false)
    }
  }

  const generateAllQuickSdkLines = async () => {
    if (!quickSdkMonth) {
      setQuickSdkMessage({ type: 'warn', text: '请先填写结算周期' })
      return
    }
    const hasMeaningfulLines = lines.some(isMeaningfulRdLine)
    if (hasMeaningfulLines && !window.confirm('将用 QuickSDK 当月产品流水替换当前游戏明细，是否继续？')) {
      return
    }
    setQuickSdkLoading(true)
    try {
      const res = await listQuickSdkRdLines({ settlement_month: quickSdkMonth, limit: 500 })
      const items = (res.items || []).filter((item) => Number(item.total_flow || 0) > 0)
      if (items.length === 0) {
        setQuickSdkMessage({ type: 'warn', text: `${quickSdkMonth} 暂无 QuickSDK 流水` })
        return
      }
      const baseLine = lines[0] || createEmptyRdLine(0, header.settlementMonth || '')
      setHeader((h) => ({
        ...h,
        settlementMonth: quickSdkMonthToSettlementCycle(quickSdkMonth) || h.settlementMonth
      }))
      setLines(items.map((item, idx) => makeQuickSdkLine(item, idx, baseLine)))
      setQuickSdkSuggestions(items)
      setQuickSdkMessage({
        type: 'ok',
        text: `已生成 ${items.length} 行，合计 ￥${formatMoney(
          items.reduce((sum, item) => sum + Number(item.total_flow || 0), 0)
        )}`
      })
      setQuickSdkCheck(null)
    } catch (err) {
      setQuickSdkMessage({
        type: 'warn',
        text: err instanceof Error ? err.message : 'QuickSDK 流水读取失败'
      })
    } finally {
      setQuickSdkLoading(false)
    }
  }

  const checkCurrentLinesWithQuickSdk = async () => {
    if (!quickSdkMonth) {
      setQuickSdkMessage({ type: 'warn', text: '请先填写结算周期' })
      return
    }
    const targets = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => String(line.gameName || '').trim())
    if (targets.length === 0) {
      setQuickSdkMessage({ type: 'warn', text: '暂无可核对的游戏明细' })
      return
    }
    setQuickSdkLoading(true)
    try {
      const results = await Promise.all(
        targets.map(async ({ line, index }) => {
          const name = String(line.gameName || '').trim()
          const remote = await getQuickSdkGameFlow({
            settlement_month: quickSdkMonth,
            game_name: name
          })
          const current = Number(line.revenue || 0)
          const expected = Number(remote.total_flow || 0)
          const diff = Math.round((current - expected) * 100) / 100
          return {
            index,
            name,
            current,
            expected,
            diff,
            rowCount: remote.row_count || 0,
            ok: Math.abs(diff) < 0.01 && Number(remote.row_count || 0) > 0
          }
        })
      )
      const matched = results.filter((item) => item.ok).length
      const missing = results.filter((item) => item.rowCount <= 0).length
      const mismatch = results.length - matched - missing
      setQuickSdkCheck({ matched, missing, mismatch, items: results })
      setQuickSdkMessage({
        type: mismatch || missing ? 'warn' : 'ok',
        text: `核对完成：一致 ${matched}，差异 ${mismatch}，未找到 ${missing}`
      })
    } catch (err) {
      setQuickSdkMessage({
        type: 'warn',
        text: err instanceof Error ? err.message : 'QuickSDK 核对失败'
      })
    } finally {
      setQuickSdkLoading(false)
    }
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
                必填项见标签；税率与通道费按比例参与结算公式计算。
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
              <label>出单日期</label>
              <input
                type="text"
                className="admin-input"
                value={header.issueDate}
                readOnly
                disabled
                title="系统自动生成出单日期"
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
          <details className="rd-recon-defaults-panel">
            <summary className="rd-recon-defaults-panel__summary">
              <span className="rd-recon-defaults-panel__title">默认整单值</span>
              <span className="rd-recon-defaults-panel__meta">
                通道费率 {header.channelFeeRate || '0'}% · 应用到所有明细行
              </span>
            </summary>
            <div className="rd-recon-defaults-panel__body">
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
                  <span className="channel-discount-hint">
                    这是默认值。下方每行的“通道费%”会同步显示这个整单费率。
                  </span>
                </div>
              </div>
            </div>
          </details>
        </div>

        <div className="channel-form-section">
          <div className="form-section-title">2）游戏明细</div>
          <div className="rd-quicksdk-panel">
            <div className="rd-quicksdk-panel__head">
              <div>
                <strong>QuickSDK 取数</strong>
                <span>{quickSdkMonth || '未设置月份'}</span>
              </div>
              <button
                type="button"
                className="rec-btn rec-btn--ghost"
                onClick={loadQuickSdkSuggestions}
                disabled={quickSdkLoading}
              >
                {quickSdkLoading ? '读取中...' : '刷新产品'}
              </button>
            </div>
            <div className="rd-quicksdk-panel__controls">
              <input
                type="text"
                className="admin-input"
                list={`${formId || 'rd'}-quicksdk-games`}
                value={quickSdkQuery}
                onChange={(e) => setQuickSdkQuery(e.target.value)}
                placeholder="产品 / 游戏名称"
              />
              <datalist id={`${formId || 'rd'}-quicksdk-games`}>
                {quickSdkSuggestions.map((item) => (
                  <option key={item.game_name} value={item.game_name} />
                ))}
              </datalist>
              <button
                type="button"
                className="rec-btn rec-btn--secondary"
                onClick={() => applyQuickSdkFlowToSingleLine()}
                disabled={quickSdkLoading}
              >
                填入产品流水
              </button>
              <button
                type="button"
                className="rec-btn rec-btn--primary"
                onClick={generateAllQuickSdkLines}
                disabled={quickSdkLoading}
              >
                一键生成本月产品
              </button>
              <button
                type="button"
                className="rec-btn rec-btn--ghost"
                onClick={checkCurrentLinesWithQuickSdk}
                disabled={quickSdkLoading}
              >
                核对当前明细
              </button>
            </div>
            {quickSdkSuggestions.length > 0 && (
              <div className="rd-quicksdk-panel__chips">
                {quickSdkSuggestions.slice(0, 8).map((item) => (
                  <button
                    type="button"
                    key={item.game_name}
                    onClick={() => applyQuickSdkFlowToSingleLine(item)}
                    title={`${item.row_count} 行 / ${item.channel_count} 渠道`}
                  >
                    <span>{item.game_name}</span>
                    <em>￥{formatMoney(item.total_flow)}</em>
                  </button>
                ))}
              </div>
            )}
            {quickSdkMessage && (
              <div className={`rd-quicksdk-panel__message is-${quickSdkMessage.type}`}>
                {quickSdkMessage.text}
              </div>
            )}
            {quickSdkCheck && (
              <div className="rd-quicksdk-check">
                <div className="rd-quicksdk-check__summary">
                  <span>一致 {quickSdkCheck.matched}</span>
                  <span>差异 {quickSdkCheck.mismatch}</span>
                  <span>未找到 {quickSdkCheck.missing}</span>
                </div>
                <div className="rd-quicksdk-check__list">
                  {quickSdkCheck.items.slice(0, 6).map((item) => (
                    <div
                      key={`${item.index}-${item.name}`}
                      className={`rd-quicksdk-check__row ${item.ok ? 'is-ok' : 'is-warn'}`}
                    >
                      <strong>{item.name}</strong>
                      <span>当前 ￥{formatMoney(item.current)}</span>
                      <span>库内 ￥{formatMoney(item.expected)}</span>
                      <span>差额 ￥{formatMoney(item.diff)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <LineItemsTable
            onAddRow={addRow}
            showAddButton={false}
            hint="折扣系数与历史口径一致（如 1 无折扣，0.005 为 0.05 折档）。自动计算列不可编辑。"
          >
            <div className="rd-line-items-grid">
              <div className="rd-line-items-grid-head" aria-hidden="true">
                <div className="channel-cell">结算周期</div>
                <div className="channel-cell">游戏名称</div>
                <div className="channel-cell channel-cell--num">后台流水</div>
                <div className="channel-cell channel-cell--num">折扣</div>
                <div className="channel-cell channel-cell--num">总流水</div>
                <div className="channel-cell channel-cell--num">代金券</div>
                <div className="channel-cell channel-cell--num">测试费</div>
                <div className="channel-cell channel-cell--num">额外费用</div>
                <div className="channel-cell channel-cell--num">通道费%</div>
                <div className="channel-cell channel-cell--num">税率%</div>
                <div className="channel-cell channel-cell--num">分成%</div>
                <div className="channel-cell channel-cell--num">参与分成金额</div>
                <div className="channel-cell channel-cell--num">结算金额</div>
                <div className="channel-cell channel-cell--actions">操作</div>
              </div>
              {lines.map((line, index) => {
                const calc = calculateRdSettlementRow(line, header.channelFeeRate)
                const net = calc.totalFlow
                const gross = calc.shareAmount
                const settlement = calc.settlementAmount
                return (
                  <div key={line.id} className="rd-line-items-grid-row">
                    <div className="channel-cell">
                      <input
                        type="text"
                        list={cycleListId}
                        className="admin-input"
                        value={line.settlementCycle || header.settlementMonth}
                        onChange={(e) => updateLine(index, 'settlementCycle', e.target.value)}
                        onBlur={(e) =>
                          updateLine(index, 'settlementCycle', normalizeSettlementCycleLabel(e.target.value))
                        }
                        placeholder="如：2025年10月"
                        title="可选历史周期，也支持自定义录入"
                      />
                    </div>
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
                        value={header.channelFeeRate}
                        onChange={(e) => setHeader((h) => ({ ...h, channelFeeRate: e.target.value }))}
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
                        type="number"
                        step="0.01"
                        className="admin-input channel-input-num"
                        value={line.shareRatio}
                        onChange={(e) => updateLine(index, 'shareRatio', e.target.value)}
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
                        className="rec-btn rec-btn--ghost"
                        onClick={addRow}
                        title="新增一行"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="rec-btn rec-btn--danger-outline"
                        disabled={lines.length <= 1}
                        onClick={() => removeRow(index)}
                        title="删除当前行"
                      >
                        -
                      </button>
                    </div>
                  </div>
                )
              })}
              <datalist id={cycleListId}>
                {cycleOptions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
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
            <div className="summary-item">
              <div className="label">总参与分成金额</div>
              <div className="value">¥{totals.sumShareAmount.toFixed(2)}</div>
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

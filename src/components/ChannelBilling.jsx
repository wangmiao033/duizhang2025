import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import AdminWorkspace from '@/components/admin/AdminWorkspace.jsx'
import AdminFilterBar from '@/components/admin/AdminFilterBar.jsx'
import AdminActionBar from '@/components/admin/AdminActionBar.jsx'
import AdminStatsRow from '@/components/admin/AdminStatsRow.jsx'
import '@/components/reconciliation/reconciliation-admin.css'
import { useAppState } from '@/app/AppStateContext.jsx'
import ChannelLightDrawer from '@/components/channel/ChannelLightDrawer.jsx'
import ChannelReceiptDrawer from '@/components/channel/ChannelReceiptDrawer.jsx'
import ChannelReceiptListDrawer from '@/components/channel/ChannelReceiptListDrawer.jsx'
import ChannelReceiptProgressBlock from '@/components/channel/ChannelReceiptProgressBlock.jsx'
import ChannelGroupCard from '@/components/channel/ChannelGroupCard.jsx'
import AdminListEmptyState from '@/components/admin/AdminListEmptyState.jsx'
import {
  initialForm,
  buildChannelBillFromSingleGameForm
} from '@/domain/channel/channelBillingForm.js'
import {
  getChannelGamesDisplay,
  getChannelLineItems,
  getChannelTotals,
  getChannelReceivedAmount,
  getChannelUnpaidAmount,
  getLineEffectiveFlow,
  getLineDiscountFactor,
  receiptStatusTagLabel,
  isChannelReceiptSettled,
  receiptProgressPercent
} from '@/domain/channel/channelAggregates.js'
import { getChannelRecordId } from '@/lib/api/channel.ts'
import { VIEWS } from '@/app/routes.js'
import {
  buildChannelSettlementWorkbook,
  writeChannelSettlementToFile
} from '@/domain/export/channelSettlementExport.js'
import { consumeChannelFocus } from '@/lib/exceptions/navFocus.ts'
import './ChannelBilling.css'

const PERIOD_OPTIONS = [
  { value: 'all', label: '全部周期' },
  { value: 'this_month', label: '本月' },
  { value: 'last_month', label: '上月' },
  { value: 'this_quarter', label: '本季度' }
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'dated', label: '已设结算区间' },
  { value: 'undated', label: '未设齐区间' }
]

function parseYmd(s) {
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function recordInCalendarMonth(record, year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const last = new Date(year, monthIndex + 1, 0)
  const s = parseYmd(record.startDate)
  const e = parseYmd(record.endDate)
  if (!s && !e) return false
  const rs = s || e
  const re = e || s
  return rs <= last && re >= first
}

function recordMatchesPeriod(record, period) {
  if (period === 'all') return true
  const now = new Date()
  if (period === 'this_month') {
    return recordInCalendarMonth(record, now.getFullYear(), now.getMonth())
  }
  if (period === 'last_month') {
    const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return recordInCalendarMonth(record, ly, lm)
  }
  if (period === 'this_quarter') {
    const q = Math.floor(now.getMonth() / 3)
    const start = new Date(now.getFullYear(), q * 3, 1)
    const end = new Date(now.getFullYear(), q * 3 + 3, 0)
    const s = parseYmd(record.startDate)
    const e = parseYmd(record.endDate)
    if (!s && !e) return false
    const rs = s || e
    const re = e || s
    return rs <= end && re >= start
  }
  return true
}

function formatYuanExact(n) {
  const x = Number(n) || 0
  return `¥${x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function recordMatchesStatusFilter(record, statusFilter) {
  if (statusFilter === 'all') return true
  const hasBoth = Boolean(record.startDate && record.endDate)
  if (statusFilter === 'dated') return hasBoth
  if (statusFilter === 'undated') return !hasBoth
  return true
}

function ChannelBilling({ channelRecords, onAddRecord, onAddRecordsBatch, onUpdateRecord, onDeleteRecord }) {
  const { showToast, setActiveView, openChannelReconciliationEdit, recon, settings } = useAppState()
  const { channelApiEnabled, onChannelRegisterReceipt, onChannelDeleteReceipt } = recon
  const { partyA, partyB } = settings
  const importRef = useRef(null)

  const [expandedGames, setExpandedGames] = useState({})
  const [viewMode, setViewMode] = useState('byGame')
  const [lightDrawerRecord, setLightDrawerRecord] = useState(null)
  const [receiptDrawerRecord, setReceiptDrawerRecord] = useState(null)
  const [receiptDrawerQuickFull, setReceiptDrawerQuickFull] = useState(false)
  const [receiptListDrawerRecord, setReceiptListDrawerRecord] = useState(null)

  const [periodFilter, setPeriodFilter] = useState('all')
  const [filterMonth, setFilterMonth] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedIds, setSelectedIds] = useState([])

  const openReceiptRegister = useCallback((record) => {
    setReceiptDrawerQuickFull(false)
    setReceiptDrawerRecord(record)
  }, [])

  const openReceiptQuickFull = useCallback((record) => {
    setReceiptDrawerQuickFull(true)
    setReceiptDrawerRecord(record)
  }, [])

  const closeReceiptDrawer = useCallback(() => {
    setReceiptDrawerRecord(null)
    setReceiptDrawerQuickFull(false)
  }, [])

  useEffect(() => {
    const id = consumeChannelFocus()
    if (id) setSearchTerm(id)
  }, [])

  const channelOptions = useMemo(() => {
    const set = new Set()
    channelRecords.forEach((r) => {
      if (r.channelName) set.add(r.channelName)
    })
    return Array.from(set).sort()
  }, [channelRecords])

  const gameOptions = useMemo(() => {
    const set = new Set()
    channelRecords.forEach((r) => {
      getChannelLineItems(r).forEach((line) => {
        if (line.gameName) set.add(String(line.gameName))
      })
    })
    return Array.from(set).sort()
  }, [channelRecords])

  const filteredRecords = useMemo(() => {
    let list = channelRecords

    list = list.filter((r) => recordMatchesPeriod(r, periodFilter))

    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number)
      if (y && m) {
        list = list.filter((r) => recordInCalendarMonth(r, y, m - 1))
      }
    }

    if (channelFilter) {
      list = list.filter((r) => (r.channelName || '') === channelFilter)
    }
    if (gameFilter) {
      list = list.filter((r) =>
        getChannelLineItems(r).some((line) => (line.gameName || '') === gameFilter)
      )
    }
    list = list.filter((r) => recordMatchesStatusFilter(r, statusFilter))

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      list = list.filter((record) => {
        const blob = [
          getChannelRecordId(record),
          record.channelName,
          record.partnerName,
          record.gameName,
          ...getChannelLineItems(record).map((l) => l.gameName)
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return blob.includes(term)
      })
    }

    return list
  }, [
    channelRecords,
    periodFilter,
    filterMonth,
    channelFilter,
    gameFilter,
    statusFilter,
    searchTerm
  ])

  const statistics = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        const t = getChannelTotals(record)
        const recv = getChannelReceivedAmount(record)
        return {
          totalFlow: acc.totalFlow + t.flow,
          totalSettlement: acc.totalSettlement + t.settlementAmount,
          totalServerCost: acc.totalServerCost + (parseFloat(record.serverCost) || 0),
          totalVoucherCost: acc.totalVoucherCost + t.voucherCost,
          totalRefundCost: acc.totalRefundCost + t.refundCost,
          totalReceived: acc.totalReceived + recv,
          totalUnpaid: acc.totalUnpaid + (t.settlementAmount - recv)
        }
      },
      {
        totalFlow: 0,
        totalSettlement: 0,
        totalServerCost: 0,
        totalVoucherCost: 0,
        totalRefundCost: 0,
        totalReceived: 0,
        totalUnpaid: 0
      }
    )
  }, [filteredRecords])

  const listFooterReceiptProgress = useMemo(
    () => ({
      pct: receiptProgressPercent(statistics.totalReceived, statistics.totalSettlement),
      received: statistics.totalReceived,
      receivable: statistics.totalSettlement
    }),
    [statistics.totalReceived, statistics.totalSettlement]
  )

  const uniqueChannelCount = useMemo(() => {
    return new Set(filteredRecords.map((r) => r.channelName || '')).size
  }, [filteredRecords])

  const groupedByChannel = useMemo(() => {
    const grouped = {}

    filteredRecords.forEach((record) => {
      const channelName = record.channelName || '未命名渠道'
      if (!grouped[channelName]) {
        grouped[channelName] = {
          channelName,
          records: [],
          totalFlow: 0,
          totalRawFlow: 0,
          totalSettlement: 0,
          totalReceived: 0,
          totalUnpaid: 0,
          totalServerCost: 0,
          totalVoucherCost: 0,
          totalTestCost: 0,
          games: new Set()
        }
      }
      grouped[channelName].records.push(record)
      const lines = getChannelLineItems(record)
      const t = getChannelTotals(record)
      grouped[channelName].totalFlow += t.flow
      grouped[channelName].totalRawFlow += lines.reduce((s, l) => s + (parseFloat(l.flow) || 0), 0)
      grouped[channelName].totalSettlement += t.settlementAmount
      grouped[channelName].totalReceived += getChannelReceivedAmount(record)
      grouped[channelName].totalUnpaid += getChannelUnpaidAmount(record)
      grouped[channelName].totalVoucherCost += t.voucherCost
      grouped[channelName].totalNoWorryCost =
        (grouped[channelName].totalNoWorryCost || 0) +
        lines.reduce((s, l) => s + (parseFloat(l.noWorryCost) || 0), 0)
      grouped[channelName].totalRefundCost =
        (grouped[channelName].totalRefundCost || 0) + t.refundCost
      grouped[channelName].totalTestCost += lines.reduce((s, l) => s + (parseFloat(l.testCost) || 0), 0)
      grouped[channelName].totalWelfareCost =
        (grouped[channelName].totalWelfareCost || 0) +
        lines.reduce((s, l) => s + (parseFloat(l.welfareCost) || 0), 0)
      lines.forEach((line) => {
        if (line.gameName) grouped[channelName].games.add(line.gameName)
      })
    })

    return Object.values(grouped)
      .map((channel) => ({
        ...channel,
        gameCount: channel.games.size,
        games: Array.from(channel.games),
        profitRate:
          channel.totalFlow > 0 ? ((channel.totalSettlement / channel.totalFlow) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalSettlement - a.totalSettlement)
  }, [filteredRecords])

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条渠道记录吗？')) {
      void onDeleteRecord(id)
      setSelectedIds((prev) => prev.filter((x) => String(x) !== String(id)))
    }
  }

  const toggleChannelExpand = (channelName) => {
    setExpandedGames((prev) => ({
      ...prev,
      [channelName]: !prev[channelName]
    }))
  }

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `¥${(amount / 100000000).toFixed(2)}亿`
    }
    if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(2)}万`
    }
    return `¥${Number(amount).toFixed(2)}`
  }

  const allFilteredIds = useMemo(
    () => filteredRecords.map((r) => String(getChannelRecordId(r) || r.id)),
    [filteredRecords]
  )
  const rowSelected = (id) => selectedIds.some((s) => String(s) === String(id))
  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => rowSelected(id))

  const toggleSelect = (id) => {
    const sid = String(id)
    setSelectedIds((prev) =>
      rowSelected(sid) ? prev.filter((x) => String(x) !== sid) : [...prev, sid]
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([])
    else setSelectedIds([...allFilteredIds])
  }

  const exportFilteredXlsx = () => {
    if (filteredRecords.length === 0) {
      showToast('没有可导出的记录', 'info')
      return
    }
    const rows = []
    filteredRecords.forEach((r) => {
      const lines = getChannelLineItems(r)
      const base = {
        渠道: r.channelName,
        合作方: r.partnerName,
        结算开始: r.startDate,
        结算结束: r.endDate,
        结算月份: r.settlementMonth,
        备注: r.remark,
        已收金额: getChannelReceivedAmount(r),
        未收金额: getChannelUnpaidAmount(r),
        收款状态: receiptStatusTagLabel(r.receiptStatus)
      }
      lines.forEach((line) => {
        rows.push({
          ...base,
          游戏: line.gameName,
          后台流水: line.flow,
          折扣系数: getLineDiscountFactor(line),
          '总流水(元)': getLineEffectiveFlow(line),
          代金券: line.voucherCost,
          无忧试: line.noWorryCost,
          玩家退款: line.refundCost,
          测试费: line.testCost,
          福利币: line.welfareCost,
          分成比例: line.shareRate,
          税率: line.taxRate,
          通道费: line.gatewayCost,
          计费金额: line.billingAmount,
          分成金额: line.shareAmount,
          结算金额: line.settlementAmount
        })
      })
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '渠道对账')
    XLSX.writeFile(wb, `渠道对账导出_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showToast('已导出当前筛选结果', 'success')
  }

  const exportSelectedXlsx = () => {
    const rows = channelRecords.filter((r) => rowSelected(r.id))
    if (rows.length === 0) {
      showToast('请先勾选记录', 'info')
      return
    }
    const data = []
    rows.forEach((r) => {
      getChannelLineItems(r).forEach((line) => {
        data.push({
          渠道: r.channelName,
          游戏: line.gameName,
          后台流水: line.flow,
          折扣系数: getLineDiscountFactor(line),
          '总流水(元)': getLineEffectiveFlow(line),
          结算金额: line.settlementAmount,
          已收金额: getChannelReceivedAmount(r),
          未收金额: getChannelUnpaidAmount(r),
          收款状态: receiptStatusTagLabel(r.receiptStatus)
        })
      })
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '选中')
    XLSX.writeFile(wb, `渠道对账选中_${rows.length}条.xlsx`)
    showToast('已导出选中记录', 'success')
  }

  const exportChannelSettlementSheets = () => {
    const source =
      selectedIds.length > 0
        ? filteredRecords.filter((r) => rowSelected(String(getChannelRecordId(r) || r.id)))
        : filteredRecords
    if (source.length === 0) {
      showToast(selectedIds.length > 0 ? '请先勾选要导出的记录' : '没有可导出的记录', 'info')
      return
    }
    try {
      const { wb, fileName } = buildChannelSettlementWorkbook(source)
      writeChannelSettlementToFile(wb, fileName)
      showToast('已导出渠道结算单', 'success')
    } catch (e) {
      console.error(e)
      showToast('导出结算单失败', 'error')
    }
  }

  const normalizeKey = (k) => String(k || '').trim().toLowerCase()

  const mapExcelRowToForm = (row) => {
    const out = { ...initialForm }
    const keyMap = {}
    Object.keys(row).forEach((k) => {
      keyMap[normalizeKey(k)] = row[k]
    })
    const get = (...names) => {
      for (const n of names) {
        const k = normalizeKey(n)
        if (!Object.prototype.hasOwnProperty.call(keyMap, k)) continue
        const v = keyMap[k]
        if (v !== undefined && v !== null && String(v).trim() !== '') return v
      }
      return undefined
    }
    const str = (v, fallback = '') => (v === undefined || v === null ? fallback : String(v))
    out.channelName = str(get('渠道', '渠道名称', 'channel', 'channelname'), '')
    out.gameName = str(get('游戏', '游戏名称', 'game', 'gamename'), '')
    out.startDate = str(get('结算开始', '开始日期', 'startdate'), '')
    out.endDate = str(get('结算结束', '结束日期', 'enddate'), '')
    out.flow = str(get('后台流水', '流水', 'flow'), '')
    out.discountFactor = str(get('折扣系数', 'discount_factor', 'discountfactor', '折扣'), '1')
    out.voucherCost = str(get('代金券', 'vouchercost'), '')
    out.noWorryCost = str(get('无忧试', 'noworrycost'), '')
    out.refundCost = str(get('玩家退款', '退款', 'refundcost'), '')
    out.testCost = str(get('测试费', 'testcost'), '')
    out.welfareCost = str(get('福利币', 'welfarecost'), '')
    out.shareRate = str(get('分成比例', 'sharerate', '分成%'), '30')
    out.taxRate = str(get('税率', 'taxrate'), '5')
    out.gatewayCost = str(get('支付通道费', '通道费', 'gatewaycost'), '')
    out.settlementAmount = str(get('结算金额', 'settlementamount'), '')
    out.remark = str(get('备注', 'remark'), '')
    return out
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        let count = 0
        const batch = []
        json.forEach((row) => {
          const fd = mapExcelRowToForm(row)
          if (!fd.channelName || !fd.gameName) return
          batch.push(buildChannelBillFromSingleGameForm(fd))
        })
        if (batch.length > 0) {
          if (onAddRecordsBatch) {
            onAddRecordsBatch(batch)
            count = batch.length
          } else {
            batch.forEach((rec) => onAddRecord(rec))
            count = batch.length
          }
        }
        if (!onAddRecordsBatch) {
          showToast(
            count > 0 ? `已导入 ${count} 条渠道记录` : '未解析到有效行（需含渠道、游戏列）',
            count > 0 ? 'success' : 'info'
          )
        } else if (count === 0) {
          showToast('未解析到有效行（需含渠道、游戏列）', 'info')
        }
      } catch (err) {
        console.error(err)
        showToast('Excel 解析失败', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const hasActiveFilters =
    periodFilter !== 'all' ||
    Boolean(filterMonth) ||
    Boolean(channelFilter) ||
    Boolean(gameFilter) ||
    statusFilter !== 'all' ||
    Boolean(searchTerm)

  const resetFilters = () => {
    setPeriodFilter('all')
    setFilterMonth('')
    setChannelFilter('')
    setGameFilter('')
    setStatusFilter('all')
    setSearchTerm('')
    setSelectedIds([])
    showToast('已重置筛选条件', 'info')
  }

  return (
    <AdminWorkspace className="channel-rd">
      <AdminFilterBar>
        <div className="channel-rd__filters">
          <label className="channel-rd__field">
            <span className="channel-rd__label">周期</span>
            <select
              className="admin-input channel-rd__select"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="channel-rd__field">
            <span className="channel-rd__label">月份</span>
            <input
              type="month"
              className="admin-input channel-rd__month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </label>
          <label className="channel-rd__field">
            <span className="channel-rd__label">渠道</span>
            <select
              className="admin-input channel-rd__select"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="">全部</option>
              {channelOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="channel-rd__field">
            <span className="channel-rd__label">游戏</span>
            <select
              className="admin-input channel-rd__select"
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
            >
              <option value="">全部</option>
              {gameOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="channel-rd__field">
            <span className="channel-rd__label">状态</span>
            <select
              className="admin-input channel-rd__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="channel-rd__field channel-rd__field--grow">
            <span className="channel-rd__label">搜索</span>
            <input
              type="search"
              className="admin-input channel-rd__search"
              placeholder="渠道、游戏关键词"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          {hasActiveFilters && (
            <button type="button" className="rec-btn rec-btn--ghost" onClick={resetFilters}>
              重置
            </button>
          )}
        </div>
      </AdminFilterBar>

      <AdminActionBar>
        <div className="rec-toolbar">
          <div className="rec-toolbar__primary">
            <button
              type="button"
              className="rec-btn rec-btn--primary"
              onClick={() => setActiveView(VIEWS.CHANNEL_RECON_CREATE)}
            >
              新增记录
            </button>
            <button type="button" className="rec-btn rec-btn--secondary" onClick={() => importRef.current?.click()}>
              Excel导入
            </button>
            <input ref={importRef} type="file" accept=".xlsx,.xls" className="channel-rd__file" onChange={handleImportFile} />
            <button type="button" className="rec-btn rec-btn--secondary" onClick={exportChannelSettlementSheets}>
              导出结算单
            </button>
            <button type="button" className="rec-btn rec-btn--secondary" onClick={exportFilteredXlsx}>
              导出数据
            </button>
            {selectedIds.length > 0 && (
              <button type="button" className="rec-btn rec-btn--secondary" onClick={exportSelectedXlsx}>
                导出数据（选中 {selectedIds.length}）
              </button>
            )}
          </div>
        </div>
      </AdminActionBar>

      <AdminStatsRow>
        <div className="rec-stats-cards rec-stats-cards--compact" aria-label="渠道筛选概览">
          {[
            { label: '记录数', value: String(filteredRecords.length), sub: '当前筛选' },
            { label: '渠道数', value: String(uniqueChannelCount) },
            { label: '流水合计', value: formatMoney(statistics.totalFlow) },
            { label: '结算合计', value: formatMoney(statistics.totalSettlement), emphasize: true },
            { label: '代金券成本', value: formatMoney(statistics.totalVoucherCost) },
            { label: '服务器成本', value: formatMoney(statistics.totalServerCost) }
          ].map((c) => (
            <div
              key={c.label}
              className={`rec-stat-card ${c.emphasize ? 'rec-stat-card--emphasis' : ''}`}
            >
              <div className="rec-stat-card__label">{c.label}</div>
              <div className="rec-stat-card__value">{c.value}</div>
              {c.sub && <div className="rec-stat-card__sub">{c.sub}</div>}
            </div>
          ))}
        </div>
      </AdminStatsRow>

      <div className="admin-table-card channel-rd__table-card">
        <div className="channel-rd__table-head">
          <div className="channel-rd__view-toggle">
            <button
              type="button"
              className={`channel-rd__toggle-btn ${viewMode === 'byGame' ? 'is-active' : ''}`}
              onClick={() => setViewMode('byGame')}
            >
              按渠道
            </button>
            <button
              type="button"
              className={`channel-rd__toggle-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
          </div>
          <span className="channel-rd__meta">
            {groupedByChannel.length} 个渠道 / {filteredRecords.length} 条
            {selectedIds.length > 0 ? ` · 已选 ${selectedIds.length}` : ''}
          </span>
          {viewMode === 'list' && filteredRecords.length > 0 && (
            <label className="channel-rd__select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              全选当页筛选
            </label>
          )}
        </div>
        <div className="admin-table-card__body channel-rd__table-body">
          {viewMode === 'byGame' ? (
            <div className="games-list">
              {groupedByChannel.length === 0 ? (
                <AdminListEmptyState
                  title="暂无渠道记录"
                  description="新增一条渠道对账记录，或使用 Excel 导入；也可放宽筛选条件。"
                  primaryAction={{
                    label: '新增记录',
                    onClick: () => setActiveView(VIEWS.CHANNEL_RECON_CREATE)
                  }}
                />
              ) : (
                groupedByChannel.map((channel) => (
                  <ChannelGroupCard
                    key={channel.channelName}
                    channel={channel}
                    expanded={Boolean(expandedGames[channel.channelName])}
                    onToggleExpand={() => toggleChannelExpand(channel.channelName)}
                    formatMoney={formatMoney}
                    onView={(record) => setLightDrawerRecord(record)}
                    onEdit={(rid) => openChannelReconciliationEdit(rid)}
                    onDelete={handleDelete}
                    onReceiptList={setReceiptListDrawerRecord}
                    onReceiptRegister={openReceiptRegister}
                    onReceiptQuickFull={openReceiptQuickFull}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="channel-table-wrapper">
              <table className="channel-table">
                <thead>
                  <tr>
                    <th className="channel-rd__th-check">
                      <span className="visually-hidden">选择</span>
                    </th>
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
                    <th>收款进度</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="admin-list-empty-cell">
                        <AdminListEmptyState
                          variant="inline"
                          title="暂无渠道记录"
                          description="新增记录或调整筛选；支持 Excel 导入与导出。"
                          primaryAction={{
                            label: '新增记录',
                            onClick: () => setActiveView(VIEWS.CHANNEL_RECON_CREATE)
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const rid = getChannelRecordId(record) || record.id
                      return (
                        <tr key={rid}>
                        <td>
                          <input
                            type="checkbox"
                            checked={rowSelected(rid)}
                            onChange={() => toggleSelect(rid)}
                            aria-label="选择行"
                          />
                        </td>
                        <td className="game-name" title={getChannelGamesDisplay(record)}>
                          {getChannelGamesDisplay(record)}
                        </td>
                        <td className="channel-name">{record.channelName}</td>
                        <td>{formatMoney(getChannelTotals(record).flow)}</td>
                        <td>{record.discountType}</td>
                        <td>{record.channelFeeRate}%</td>
                        <td>{record.devShareRate}%</td>
                        <td>
                          <span className={`profit-badge ${record.profitRate >= 0 ? 'positive' : 'negative'}`}>
                            {record.profitRate?.toFixed(1) || 0}%
                          </span>
                        </td>
                        <td>{record.serverCost || '-'}</td>
                        <td>{getChannelTotals(record).voucherCost || '-'}</td>
                        <td className="settlement">
                          {formatMoney(getChannelTotals(record).settlementAmount)}
                        </td>
                        <td className="channel-rd__receipt-col">
                          <ChannelReceiptProgressBlock record={record} compact />
                        </td>
                        <td className="actions">
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => setReceiptListDrawerRecord(record)}
                          >
                            收款记录
                          </button>
                          {!isChannelReceiptSettled(record) && getChannelUnpaidAmount(record) > 1e-6 ? (
                            <>
                              <button
                                type="button"
                                className="edit-btn channel-rd__btn-receipt"
                                onClick={() => openReceiptRegister(record)}
                              >
                                收款登记
                              </button>
                              <button
                                type="button"
                                className="edit-btn channel-rd__btn-receipt"
                                onClick={() => openReceiptQuickFull(record)}
                              >
                                快速收全款
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => setLightDrawerRecord(record)}
                          >
                            查看
                          </button>
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => openChannelReconciliationEdit(rid)}
                          >
                            编辑
                          </button>
                          <button type="button" className="delete-btn" onClick={() => handleDelete(rid)}>
                            删除
                          </button>
                        </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {filteredRecords.length > 0 && (
                  <tfoot>
                    <tr>
                      <td />
                      <td colSpan="2" className="total-label">
                        合计
                      </td>
                      <td>{formatMoney(statistics.totalFlow)}</td>
                      <td colSpan="4" />
                      <td>{formatMoney(statistics.totalServerCost)}</td>
                      <td>{formatMoney(statistics.totalVoucherCost)}</td>
                      <td className="settlement">{formatMoney(statistics.totalSettlement)}</td>
                      <td className="channel-rd__receipt-col">
                        <div className="channel-receipt-progress channel-receipt-progress--compact">
                          <div className="channel-receipt-progress__line">
                            <span className="channel-receipt-progress__ratio">
                              {formatYuanExact(listFooterReceiptProgress.received)} /{' '}
                              {formatYuanExact(listFooterReceiptProgress.receivable)}
                            </span>
                          </div>
                          <div className="channel-receipt-progress__bar" aria-hidden="true">
                            <div
                              className="channel-receipt-progress__fill"
                              style={{ width: `${listFooterReceiptProgress.pct}%` }}
                            />
                          </div>
                          <div className="channel-receipt-progress__pct">{listFooterReceiptProgress.pct}%</div>
                        </div>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      <ChannelReceiptDrawer
        open={Boolean(receiptDrawerRecord)}
        record={receiptDrawerRecord}
        quickFull={receiptDrawerQuickFull}
        partyA={partyA}
        partyB={partyB}
        channelApiEnabled={channelApiEnabled}
        showToast={showToast}
        onClose={closeReceiptDrawer}
        onRegisterReceipt={onChannelRegisterReceipt}
      />

      <ChannelReceiptListDrawer
        open={Boolean(receiptListDrawerRecord)}
        recordId={receiptListDrawerRecord ? getChannelRecordId(receiptListDrawerRecord) : ''}
        channelName={receiptListDrawerRecord?.channelName || ''}
        channelApiEnabled={channelApiEnabled}
        showToast={showToast}
        onClose={() => setReceiptListDrawerRecord(null)}
        onDeleteReceipt={onChannelDeleteReceipt}
      />

      <ChannelLightDrawer
        open={Boolean(lightDrawerRecord)}
        record={lightDrawerRecord}
        onClose={() => setLightDrawerRecord(null)}
        onUpdateRecord={onUpdateRecord}
        onNavigateToFullEdit={(id) => openChannelReconciliationEdit(id)}
      />
    </AdminWorkspace>
  )
}

export default ChannelBilling

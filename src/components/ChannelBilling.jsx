import React, { useState, useMemo, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import AdminWorkspace from '@/components/admin/AdminWorkspace.jsx'
import AdminFilterBar from '@/components/admin/AdminFilterBar.jsx'
import AdminActionBar from '@/components/admin/AdminActionBar.jsx'
import AdminStatsRow from '@/components/admin/AdminStatsRow.jsx'
import '@/components/reconciliation/reconciliation-admin.css'
import { useAppState } from '@/app/AppStateContext.jsx'
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

function recordMatchesStatusFilter(record, statusFilter) {
  if (statusFilter === 'all') return true
  const hasBoth = Boolean(record.startDate && record.endDate)
  if (statusFilter === 'dated') return hasBoth
  if (statusFilter === 'undated') return !hasBoth
  return true
}

const initialForm = {
  channelName: '',
  gameName: '',
  startDate: '',
  endDate: '',
  flow: '',
  voucherCost: '',
  noWorryCost: '',
  refundCost: '',
  testCost: '',
  welfareCost: '',
  shareRate: '30',
  taxRate: '5',
  gatewayCost: '',
  settlementAmount: '',
  remark: ''
}

function ChannelBilling({ channelRecords, onAddRecord, onAddRecordsBatch, onUpdateRecord, onDeleteRecord }) {
  const { showToast } = useAppState()
  const importRef = useRef(null)

  const [formData, setFormData] = useState(initialForm)
  const [expandedGames, setExpandedGames] = useState({})
  const [viewMode, setViewMode] = useState('byGame')
  const [editingId, setEditingId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [periodFilter, setPeriodFilter] = useState('all')
  const [filterMonth, setFilterMonth] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedIds, setSelectedIds] = useState([])

  const calculateBillingAmount = (data) => {
    const flow = parseFloat(data.flow || 0)
    const voucher = parseFloat(data.voucherCost || 0)
    const noWorry = parseFloat(data.noWorryCost || 0)
    const refund = parseFloat(data.refundCost || 0)
    const test = parseFloat(data.testCost || 0)
    const welfare = parseFloat(data.welfareCost || 0)
    return flow - voucher - noWorry - refund - test - welfare
  }

  const calculateShareAmount = (data) => {
    const billingAmount = calculateBillingAmount(data)
    const shareRate = parseFloat(data.shareRate || 0) / 100
    return billingAmount * shareRate
  }

  const calculateSettlement = (data) => {
    const shareAmount = calculateShareAmount(data)
    const gatewayCost = parseFloat(data.gatewayCost || 0)
    const taxRate = parseFloat(data.taxRate || 0) / 100
    const taxAmount = shareAmount * taxRate
    return shareAmount - gatewayCost - taxAmount
  }

  const buildRecordFromForm = (fd) => {
    const billingAmount = calculateBillingAmount(fd)
    const shareAmount = calculateShareAmount(fd)
    return {
      ...fd,
      flow: parseFloat(fd.flow || 0),
      voucherCost: parseFloat(fd.voucherCost || 0),
      noWorryCost: parseFloat(fd.noWorryCost || 0),
      refundCost: parseFloat(fd.refundCost || 0),
      testCost: parseFloat(fd.testCost || 0),
      welfareCost: parseFloat(fd.welfareCost || 0),
      billingAmount,
      shareRate: parseFloat(fd.shareRate || 0),
      shareAmount,
      taxRate: parseFloat(fd.taxRate || 0),
      gatewayCost: parseFloat(fd.gatewayCost || 0),
      settlementAmount: parseFloat(fd.settlementAmount || 0)
    }
  }

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
      if (r.gameName) set.add(r.gameName)
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
      list = list.filter((r) => (r.gameName || '') === gameFilter)
    }
    list = list.filter((r) => recordMatchesStatusFilter(r, statusFilter))

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      list = list.filter(
        (record) =>
          (record.channelName || '').toLowerCase().includes(term) ||
          (record.gameName || '').toLowerCase().includes(term)
      )
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
      (acc, record) => ({
        totalFlow: acc.totalFlow + (parseFloat(record.flow) || 0),
        totalSettlement: acc.totalSettlement + (parseFloat(record.settlementAmount) || 0),
        totalServerCost: acc.totalServerCost + (parseFloat(record.serverCost) || 0),
        totalVoucherCost: acc.totalVoucherCost + (parseFloat(record.voucherCost) || 0)
      }),
      { totalFlow: 0, totalSettlement: 0, totalServerCost: 0, totalVoucherCost: 0 }
    )
  }, [filteredRecords])

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
          totalSettlement: 0,
          totalServerCost: 0,
          totalVoucherCost: 0,
          totalTestCost: 0,
          games: new Set()
        }
      }
      grouped[channelName].records.push(record)
      grouped[channelName].totalFlow += parseFloat(record.flow) || 0
      grouped[channelName].totalSettlement += parseFloat(record.settlementAmount) || 0
      grouped[channelName].totalVoucherCost += parseFloat(record.voucherCost) || 0
      grouped[channelName].totalNoWorryCost =
        (grouped[channelName].totalNoWorryCost || 0) + (parseFloat(record.noWorryCost) || 0)
      grouped[channelName].totalRefundCost =
        (grouped[channelName].totalRefundCost || 0) + (parseFloat(record.refundCost) || 0)
      grouped[channelName].totalTestCost += parseFloat(record.testCost) || 0
      grouped[channelName].totalWelfareCost =
        (grouped[channelName].totalWelfareCost || 0) + (parseFloat(record.welfareCost) || 0)
      grouped[channelName].games.add(record.gameName)
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

  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

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

  const resetForm = () => {
    setFormData({ ...initialForm })
    setEditingId(null)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    resetForm()
  }

  const openDrawerAdd = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.channelName || !formData.gameName) {
      window.alert('请填写必填项：渠道名称、游戏名称')
      return
    }

    const record = buildRecordFromForm(formData)

    if (editingId) {
      onUpdateRecord(editingId, record)
    } else {
      onAddRecord(record)
    }

    closeDrawer()
  }

  const handleEdit = (record) => {
    setFormData({
      channelName: record.channelName || '',
      gameName: record.gameName || '',
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      flow: String(record.flow || ''),
      voucherCost: String(record.voucherCost || ''),
      noWorryCost: String(record.noWorryCost || ''),
      refundCost: String(record.refundCost || ''),
      testCost: String(record.testCost || ''),
      welfareCost: String(record.welfareCost || ''),
      shareRate: String(record.shareRate || '30'),
      taxRate: String(record.taxRate || '5'),
      gatewayCost: String(record.gatewayCost || ''),
      settlementAmount: String(record.settlementAmount || ''),
      remark: record.remark || ''
    })
    setEditingId(record.id)
    setDrawerOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条渠道记录吗？')) {
      onDeleteRecord(id)
      setSelectedIds((prev) => prev.filter((x) => x !== id))
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

  const fmtPlain = (n) => `¥${(Number(n) || 0).toFixed(2)}`

  const allFilteredIds = useMemo(() => filteredRecords.map((r) => r.id), [filteredRecords])
  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id))

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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
    const rows = filteredRecords.map((r) => ({
      渠道: r.channelName,
      游戏: r.gameName,
      结算开始: r.startDate,
      结算结束: r.endDate,
      后台流水: r.flow,
      代金券: r.voucherCost,
      无忧试: r.noWorryCost,
      玩家退款: r.refundCost,
      测试费: r.testCost,
      福利币: r.welfareCost,
      分成比例: r.shareRate,
      税率: r.taxRate,
      通道费: r.gatewayCost,
      结算金额: r.settlementAmount,
      备注: r.remark
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '渠道对账')
    XLSX.writeFile(wb, `渠道对账导出_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showToast('已导出当前筛选结果', 'success')
  }

  const exportSelectedXlsx = () => {
    const rows = channelRecords.filter((r) => selectedIds.includes(r.id))
    if (rows.length === 0) {
      showToast('请先勾选记录', 'info')
      return
    }
    const data = rows.map((r) => ({
      渠道: r.channelName,
      游戏: r.gameName,
      后台流水: r.flow,
      结算金额: r.settlementAmount
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '选中')
    XLSX.writeFile(wb, `渠道对账选中_${rows.length}条.xlsx`)
    showToast('已导出选中记录', 'success')
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
          batch.push(buildRecordFromForm(fd))
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

  const previewSettlement = calculateSettlement(formData)

  const commonChannels = [
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
            <button type="button" className="rec-btn rec-btn--primary" onClick={openDrawerAdd}>
              快速新增
            </button>
            <button
              type="button"
              className="rec-btn rec-btn--secondary"
              disabled
              title="渠道独立完整录入页将在后续版本提供"
            >
              完整录入
            </button>
            <button type="button" className="rec-btn rec-btn--secondary" onClick={() => importRef.current?.click()}>
              Excel导入
            </button>
            <input ref={importRef} type="file" accept=".xlsx,.xls" className="channel-rd__file" onChange={handleImportFile} />
            <button type="button" className="rec-btn rec-btn--secondary" onClick={exportFilteredXlsx}>
              导出
            </button>
            {selectedIds.length > 0 && (
              <button type="button" className="rec-btn rec-btn--secondary" onClick={exportSelectedXlsx}>
                导出选中 ({selectedIds.length})
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
                <div className="empty-games">暂无渠道记录</div>
              ) : (
                groupedByChannel.map((channel) => (
                  <div key={channel.channelName} className="game-card channel-card">
                    <div
                      className="game-card-header"
                      onClick={() => toggleChannelExpand(channel.channelName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleChannelExpand(channel.channelName)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="game-info">
                        <span className="expand-icon">{expandedGames[channel.channelName] ? '\u25be' : '\u25b8'}</span>
                        <h4 className="game-title">{channel.channelName}</h4>
                        <span className="channel-badge">{channel.gameCount} 个游戏</span>
                      </div>
                      <div className="game-stats">
                        <span className="stat">
                          <span className="label">流水</span>
                          <span className="value">{formatMoney(channel.totalFlow)}</span>
                        </span>
                        <span className="stat">
                          <span className="label">结算</span>
                          <span className="value settlement">{formatMoney(channel.totalSettlement)}</span>
                        </span>
                        <span className="stat">
                          <span className="label">占比</span>
                          <span
                            className={`value ${parseFloat(channel.profitRate) >= 0 ? 'positive' : 'negative'}`}
                          >
                            {channel.profitRate}%
                          </span>
                        </span>
                      </div>
                    </div>

                    {expandedGames[channel.channelName] && (
                      <div className="game-channels">
                        <table className="channel-detail-table">
                          <thead>
                            <tr>
                              <th className="channel-rd__th-check" aria-label="选择" />
                              <th>游戏名称</th>
                              <th>后台流水</th>
                              <th>代金券</th>
                              <th>测试费</th>
                              <th>计费金额</th>
                              <th>分成比例</th>
                              <th>分成金额</th>
                              <th>税率</th>
                              <th>结算金额</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {channel.records.map((record) => {
                              const flow = parseFloat(record.flow) || 0
                              const voucher = parseFloat(record.voucherCost) || 0
                              const noWorry = parseFloat(record.noWorryCost) || 0
                              const refund = parseFloat(record.refundCost) || 0
                              const test = parseFloat(record.testCost) || 0
                              const welfare = parseFloat(record.welfareCost) || 0
                              const billingAmount = flow - voucher - noWorry - refund - test - welfare
                              const shareRate = parseFloat(record.shareRate || record.cfChannelRate || 30)
                              const shareAmount = billingAmount * shareRate / 100
                              const settlement = parseFloat(record.settlementAmount) || shareAmount

                              return (
                                <tr key={record.id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.includes(record.id)}
                                      onChange={() => toggleSelect(record.id)}
                                      aria-label="选择行"
                                    />
                                  </td>
                                  <td className="game-name-cell">{record.gameName}</td>
                                  <td>{formatMoney(flow)}</td>
                                  <td>{voucher}</td>
                                  <td>{test}</td>
                                  <td>{formatMoney(billingAmount)}</td>
                                  <td>{shareRate}%</td>
                                  <td>{formatMoney(shareAmount)}</td>
                                  <td>{record.taxRate || 5}%</td>
                                  <td className="settlement">{formatMoney(settlement)}</td>
                                  <td className="actions">
                                    <button type="button" className="edit-btn" onClick={() => handleEdit(record)}>
                                      编辑
                                    </button>
                                    <button type="button" className="delete-btn" onClick={() => handleDelete(record.id)}>
                                      删除
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td />
                              <td className="total-label">合计</td>
                              <td>{formatMoney(channel.totalFlow)}</td>
                              <td>{formatMoney(channel.totalVoucherCost)}</td>
                              <td>{formatMoney(channel.totalTestCost)}</td>
                              <td>
                                {formatMoney(
                                  channel.totalFlow -
                                    channel.totalVoucherCost -
                                    (channel.totalNoWorryCost || 0) -
                                    (channel.totalRefundCost || 0) -
                                    channel.totalTestCost -
                                    (channel.totalWelfareCost || 0)
                                )}
                              </td>
                              <td>-</td>
                              <td>
                                {formatMoney(
                                  (channel.totalFlow -
                                    channel.totalVoucherCost -
                                    (channel.totalNoWorryCost || 0) -
                                    (channel.totalRefundCost || 0) -
                                    channel.totalTestCost -
                                    (channel.totalWelfareCost || 0)) *
                                    (channel.records[0]
                                      ? parseFloat(channel.records[0].shareRate || channel.records[0].cfChannelRate || 30) /
                                        100
                                      : 0.3)
                                )}
                              </td>
                              <td>-</td>
                              <td className="settlement">{formatMoney(channel.totalSettlement)}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
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
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="empty-row">
                        暂无渠道记录
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            aria-label="选择行"
                          />
                        </td>
                        <td className="game-name" title={record.gameName}>
                          {record.gameName}
                        </td>
                        <td className="channel-name">{record.channelName}</td>
                        <td>{formatMoney(parseFloat(record.flow) || 0)}</td>
                        <td>{record.discountType}</td>
                        <td>{record.channelFeeRate}%</td>
                        <td>{record.devShareRate}%</td>
                        <td>
                          <span className={`profit-badge ${record.profitRate >= 0 ? 'positive' : 'negative'}`}>
                            {record.profitRate?.toFixed(1) || 0}%
                          </span>
                        </td>
                        <td>{record.serverCost || '-'}</td>
                        <td>{record.voucherCost || '-'}</td>
                        <td className="settlement">{formatMoney(parseFloat(record.settlementAmount) || 0)}</td>
                        <td className="actions">
                          <button type="button" className="edit-btn" onClick={() => handleEdit(record)}>
                            编辑
                          </button>
                          <button type="button" className="delete-btn" onClick={() => handleDelete(record.id)}>
                            删除
                          </button>
                        </td>
                      </tr>
                    ))
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
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <>
          <button type="button" className="rec-drawer-backdrop" aria-label="关闭抽屉" onClick={closeDrawer} />
          <aside className="rec-drawer channel-rd__drawer" role="dialog" aria-modal="true" aria-labelledby="channel-drawer-title">
            <div className="rec-drawer__head">
              <h2 id="channel-drawer-title" className="rec-drawer__title">
                {editingId ? '编辑渠道记录' : '快速新增 · 渠道'}
              </h2>
              <button type="button" className="rec-drawer__close" onClick={closeDrawer} aria-label="关闭">
                ×
              </button>
            </div>
            <div className="rec-drawer__body">
              <form id="channel-drawer-form" onSubmit={handleSubmit} className="channel-form channel-form--drawer">
                <div className="form-section-title">渠道信息</div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>渠道/公司简称 *</label>
                    <input
                      type="text"
                      list="channel-list-drawer"
                      value={formData.channelName}
                      onChange={(e) => handleInputChange('channelName', e.target.value)}
                      placeholder="如：广州触点互联网科技有限公司"
                      required className="admin-input"
                    />
                    <datalist id="channel-list-drawer">
                      {commonChannels.map((ch) => (
                        <option key={ch} value={ch} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="form-section-title">游戏与结算周期</div>
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

                <div className="form-section-title">流水与费用</div>
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
                    <input type="text" value={formatMoney(calculateBillingAmount(formData))} readOnly className="admin-input readonly-input" />
                  </div>
                </div>

                <div className="form-section-title">分成计算</div>
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
                    <input type="text" value={formatMoney(calculateShareAmount(formData))} readOnly className="admin-input readonly-input" />
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

                <div className="form-section-title">结算</div>
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
            </div>
            <div className="rec-drawer__footer">
              <div className="rec-drawer__preview">
                <span className="rec-drawer__preview-label">预计结算金额</span>
                <span className="rec-drawer__preview-value">{fmtPlain(previewSettlement)}</span>
              </div>
              <div className="rec-drawer__footer-actions">
                <button type="button" className="rec-btn rec-btn--ghost" onClick={closeDrawer}>
                  取消
                </button>
                <button type="submit" className="rec-btn rec-btn--primary" form="channel-drawer-form">
                  保存
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </AdminWorkspace>
  )
}

export default ChannelBilling

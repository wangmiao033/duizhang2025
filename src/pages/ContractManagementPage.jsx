import React, { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import { createContract, deleteContract, listContracts, updateContract } from '@/lib/api/contract.ts'
import ContractStatusTag from '@/components/contract/ContractStatusTag.jsx'
import ContractDetailsDrawer from '@/components/contract/ContractDetailsDrawer.jsx'
import './contract-management.css'

const STORAGE_KEY = 'contractManagementRecords.v1'
const PAGE_SIZE_OPTIONS = [20, 50, 100]
const QUICK_TABS = ['全部', '生效中', '即将到期', '已过期', '本月新签', '已归档']
const STATUS_OPTIONS = ['全部', '生效中', '即将到期', '已过期', '待生效', '已归档']
const EXPIRY_OPTIONS = ['全部', '30天内到期', '90天内到期', '已过期']

const defaultContracts = [
  {
    id: 'sample-1',
    signingDate: '2026/4/23',
    channel: '3733游戏',
    platform: '厦门三七三三网络科技有限公司',
    address: '厦门市软件园二期观日路50号2F单元之07单元',
    validPeriod: '2025-07-21 至 2027-07-20',
    game: '一起来修仙（0.05折）',
    channelShare: '25%',
    issueShare: '75%',
    channelFee: '0%',
    remark: JSON.stringify({
      v: 2,
      note: '示例',
      contractNo: 'HT-2026-0001',
      contractType: '联运',
      owner: '王淼',
      startDate: '2025-07-21',
      endDate: '2027-07-20',
      games: ['一起来修仙（0.05折）'],
      archived: false
    })
  }
]

function readContractsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultContracts
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultContracts
    return parsed
  } catch {
    return defaultContracts
  }
}

function writeContractsToStorage(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function normalizePercentInput(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  const clean = trimmed.replace(/%/g, '')
  if (clean === '' || Number.isNaN(Number(clean))) return ''
  return `${clean}%`
}

function parseDate(value) {
  if (!value) return null
  const src = String(value).trim().replace(/\./g, '-').replace(/\//g, '-')
  if (!src) return null
  const d = new Date(src)
  return Number.isNaN(d.getTime()) ? null : d
}

function toDateString(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeDateInputValue(value) {
  const d = parseDate(value)
  if (!d) return ''
  return toDateString(d)
}

function splitValidPeriod(value) {
  const src = String(value || '').trim()
  if (!src) return { startDate: '', endDate: '' }
  const normalized = src.replace(/[至~—]+/g, '|')
  const [start, end] = normalized.split('|').map((s) => String(s || '').trim())
  return { startDate: start || '', endDate: end || '' }
}

function formatGamesDisplay(games) {
  if (!Array.isArray(games) || games.length === 0) return '-'
  if (games.length <= 2) return games.join('、')
  return `${games[0]} +${games.length - 1}`
}

function parseRemarkMeta(remark, game, validPeriod, channelShare, issueShare, id, updatedAt) {
  const fallbackPeriod = splitValidPeriod(validPeriod)
  const baseGames = String(game || '')
    .split(/[、,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
  try {
    const parsed = JSON.parse(String(remark || ''))
    if (parsed && parsed.v === 2) {
      const games = Array.isArray(parsed.games)
        ? parsed.games.map((s) => String(s).trim()).filter(Boolean)
        : baseGames
      return {
        note: parsed.note ? String(parsed.note) : '',
        contractNo: parsed.contractNo ? String(parsed.contractNo) : `HT-${String(id).slice(0, 8)}`,
        contractType: parsed.contractType ? String(parsed.contractType) : '未分类',
        owner: parsed.owner ? String(parsed.owner) : '未指定',
        startDate: parsed.startDate ? String(parsed.startDate) : fallbackPeriod.startDate,
        endDate: parsed.endDate ? String(parsed.endDate) : fallbackPeriod.endDate,
        games,
        archived: Boolean(parsed.archived),
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        updatedAt: parsed.updatedAt ? String(parsed.updatedAt) : updatedAt || ''
      }
    }
  } catch {
    // 非 JSON 备注兼容
  }
  return {
    note: String(remark || ''),
    contractNo: `HT-${String(id).slice(0, 8)}`,
    contractType: '未分类',
    owner: '未指定',
    startDate: fallbackPeriod.startDate,
    endDate: fallbackPeriod.endDate,
    games: baseGames.length > 0 ? baseGames : ['未填写游戏'],
    archived: false,
    attachments: [],
    logs: [],
    updatedAt: updatedAt || ''
  }
}

function computeStatus({ archived, startDate, endDate }) {
  if (archived) return '已归档'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (start && start > now) return '待生效'
  if (end) {
    if (end < now) return '已过期'
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 30) return '即将到期'
  }
  return '生效中'
}

function toApiPayload(record) {
  const validPeriod =
    record.startDate && record.endDate
      ? `${record.startDate} 至 ${record.endDate}`
      : record.validPeriod || ''
  return {
    signing_date: record.signingDate || null,
    channel: record.channel || null,
    platform: record.platform || null,
    address: record.address || null,
    valid_period: validPeriod || null,
    game: (record.games || []).join('、') || record.game || null,
    channel_share: normalizePercentInput(record.channelShare) || null,
    issue_share: normalizePercentInput(record.issueShare) || null,
    channel_fee: normalizePercentInput(record.channelFee) || null,
    remark: JSON.stringify({
      v: 2,
      note: record.note || '',
      contractNo: record.contractNo || '',
      contractType: record.contractType || '',
      owner: record.owner || '',
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      games: record.games || [],
      archived: Boolean(record.archived),
      attachments: record.attachments || [],
      logs: record.logs || [],
      updatedAt: toDateString(new Date())
    })
  }
}

function extractStatusCode(err) {
  const status = err?.status
  if (typeof status === 'number') return status
  const raw = err?.message
  if (typeof raw === 'string') {
    const m = raw.match(/\b(\d{3})\b/)
    if (m) return Number(m[1])
  }
  return null
}

function isSampleOrTempId(id) {
  const sid = String(id || '')
  return sid.startsWith('sample-') || sid.startsWith('temp-')
}

function createEmptyForm() {
  return {
    contractNo: '',
    contractType: '',
    owner: '',
    signingDate: '',
    startDate: '',
    endDate: '',
    channel: '',
    platform: '',
    address: '',
    validPeriod: '',
    game: '',
    gamesText: '',
    channelShare: '',
    issueShare: '',
    channelFee: '',
    note: '',
    archived: false
  }
}

function ContractManagementPage() {
  const [records, setRecords] = useState(() => readContractsFromStorage())
  const [keyword, setKeyword] = useState('')
  const [quickTab, setQuickTab] = useState('全部')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [statusFilter, setStatusFilter] = useState('全部')
  const [contractTypeFilter, setContractTypeFilter] = useState('全部')
  const [gameFilter, setGameFilter] = useState('全部')
  const [expiryFilter, setExpiryFilter] = useState('全部')
  const [ownerFilter, setOwnerFilter] = useState('全部')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(createEmptyForm())
  const [selectedRow, setSelectedRow] = useState(null)
  const [openMoreId, setOpenMoreId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErrorMsg('')
      try {
        const res = await listContracts({ limit: 1000, offset: 0 })
        if (cancelled) return
        const rows = Array.isArray(res.items) ? res.items : []
        if (rows.length > 0) {
          const mapped = rows.map((row) => {
            const meta = parseRemarkMeta(
              row.remark,
              row.game,
              row.valid_period,
              row.channel_share,
              row.issue_share,
              row.id,
              row.updated_at
            )
            const status = computeStatus(meta)
            return {
              id: row.id,
              contractNo: meta.contractNo,
              contractType: meta.contractType,
              owner: meta.owner,
              signingDate: row.signing_date || meta.startDate || '',
              startDate: meta.startDate,
              endDate: meta.endDate,
              channel: row.channel || '',
              platform: row.platform || '',
              address: row.address || '',
              validPeriod: row.valid_period || '',
              game: row.game || '',
              games: meta.games,
              gameDisplay: formatGamesDisplay(meta.games),
              channelShare: row.channel_share || '',
              issueShare: row.issue_share || '',
              channelFee: row.channel_fee || '',
              shareRatio: `${row.channel_share || '-'} / ${row.issue_share || '-'}`,
              note: meta.note,
              archived: meta.archived,
              status,
              attachments: meta.attachments,
              logs: meta.logs,
              updatedAt: row.updated_at || meta.updatedAt || ''
            }
          })
          setRecords(mapped)
          writeContractsToStorage(mapped)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setErrorMsg('合同接口暂不可用，已回退到本地缓存模式。')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(() => {
    const contractTypes = new Set()
    const games = new Set()
    const owners = new Set()
    records.forEach((r) => {
      if (r.contractType) contractTypes.add(r.contractType)
      ;(r.games || []).forEach((g) => games.add(g))
      if (r.owner) owners.add(r.owner)
    })
    return {
      contractTypes: ['全部', ...Array.from(contractTypes)],
      games: ['全部', ...Array.from(games)],
      owners: ['全部', ...Array.from(owners)]
    }
  }, [records])

  const matchesQuickTab = (row) => {
    if (quickTab === '全部') return true
    if (quickTab === '本月新签') {
      const d = parseDate(row.signingDate)
      if (!d) return false
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }
    return row.status === quickTab
  }

  const filteredRecords = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    return records.filter((row) => {
      if (!matchesQuickTab(row)) return false
      if (statusFilter !== '全部' && row.status !== statusFilter) return false
      if (contractTypeFilter !== '全部' && row.contractType !== contractTypeFilter) return false
      if (gameFilter !== '全部' && !(row.games || []).includes(gameFilter)) return false
      if (ownerFilter !== '全部' && row.owner !== ownerFilter) return false
      if (term) {
        const text = [row.contractNo, row.channel, row.platform, row.game, row.note].join(' ').toLowerCase()
        if (!text.includes(term)) return false
      }
      if (expiryFilter !== '全部') {
        const end = parseDate(row.endDate)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        if (!end) return false
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (expiryFilter === '已过期' && diff >= 0) return false
        if (expiryFilter === '30天内到期' && !(diff >= 0 && diff <= 30)) return false
        if (expiryFilter === '90天内到期' && !(diff >= 0 && diff <= 90)) return false
      }
      return true
    })
  }, [records, keyword, statusFilter, contractTypeFilter, gameFilter, ownerFilter, expiryFilter, quickTab])

  const stats = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const total = records.length
    const active = records.filter((r) => r.status === '生效中').length
    const expiring30 = records.filter((r) => {
      const end = parseDate(r.endDate)
      if (!end) return false
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 30 && r.status !== '已归档'
    }).length
    const expired = records.filter((r) => r.status === '已过期').length
    return { total, active, expiring30, expired }
  }, [records])

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [keyword, statusFilter, contractTypeFilter, gameFilter, ownerFilter, expiryFilter, quickTab, pageSize])

  const openCreateForm = () => {
    setEditingId(null)
    setFormData(createEmptyForm())
    setShowForm(true)
  }

  const openEditForm = (row) => {
    setEditingId(row.id)
    setFormData({
      contractNo: row.contractNo || '',
      contractType: row.contractType || '',
      owner: row.owner || '',
      signingDate: normalizeDateInputValue(row.signingDate),
      startDate: normalizeDateInputValue(row.startDate),
      endDate: normalizeDateInputValue(row.endDate),
      channel: row.channel || '',
      platform: row.platform || '',
      address: row.address || '',
      validPeriod: row.validPeriod || '',
      game: row.game || '',
      gamesText: (row.games || []).join('、'),
      channelShare: row.channelShare || '',
      issueShare: row.issueShare || '',
      channelFee: row.channelFee || '',
      note: row.note || '',
      archived: Boolean(row.archived)
    })
    setShowForm(true)
  }

  const openRenewForm = (row) => {
    const end = parseDate(row.endDate)
    const start = end ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : new Date()
    const nextEnd = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate())
    setEditingId(null)
    setFormData({
      contractNo: `${row.contractNo || ''}-R`,
      contractType: row.contractType || '',
      owner: row.owner || '',
      signingDate: toDateString(new Date()),
      startDate: toDateString(start),
      endDate: toDateString(nextEnd),
      channel: row.channel || '',
      platform: row.platform || '',
      address: row.address || '',
      validPeriod: '',
      game: row.game || '',
      gamesText: (row.games || []).join('、'),
      channelShare: row.channelShare || '',
      issueShare: row.issueShare || '',
      channelFee: row.channelFee || '',
      note: row.note || '',
      archived: false
    })
    setShowForm(true)
  }

  const handleCopyNew = (row) => {
    setEditingId(null)
    setFormData({
      contractNo: `${row.contractNo || ''}-COPY`,
      contractType: row.contractType || '',
      owner: row.owner || '',
      signingDate: row.signingDate || '',
      startDate: row.startDate || '',
      endDate: row.endDate || '',
      channel: row.channel || '',
      platform: row.platform || '',
      address: row.address || '',
      validPeriod: '',
      game: row.game || '',
      gamesText: (row.games || []).join('、'),
      channelShare: row.channelShare || '',
      issueShare: row.issueShare || '',
      channelFee: row.channelFee || '',
      note: row.note || '',
      archived: Boolean(row.archived)
    })
    setShowForm(true)
  }

  const handleDelete = async (rowId) => {
    if (!window.confirm('确定删除这条合同吗？')) return
    const prev = records
    const next = prev.filter((row) => row.id !== rowId)
    setRecords(next)
    writeContractsToStorage(next)
    try {
      await deleteContract(String(rowId))
    } catch (err) {
      console.error(err)
      setRecords(prev)
      writeContractsToStorage(prev)
      window.alert('删除失败：接口异常，已回滚。')
    }
  }

  const handleSave = async () => {
    if (!formData.channel.trim() || !formData.platform.trim() || !formData.game.trim()) {
      window.alert('请至少填写：渠道简称、平台方、签约游戏')
      return
    }
    const games = String(formData.gamesText || formData.game || '')
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const nextRecord = {
      ...formData,
      games,
      game: games.join('、'),
      validPeriod:
        formData.startDate && formData.endDate
          ? `${formData.startDate} 至 ${formData.endDate}`
          : formData.validPeriod,
      channelShare: normalizePercentInput(formData.channelShare),
      issueShare: normalizePercentInput(formData.issueShare),
      channelFee: normalizePercentInput(formData.channelFee),
      shareRatio: `${normalizePercentInput(formData.channelShare) || '-'} / ${
        normalizePercentInput(formData.issueShare) || '-'
      }`,
      status: computeStatus({
        archived: Boolean(formData.archived),
        startDate: formData.startDate,
        endDate: formData.endDate
      }),
      gameDisplay: formatGamesDisplay(games),
      updatedAt: new Date().toISOString()
    }

    if (editingId) {
      const prev = records
      const optimistic = prev.map((row) => (row.id === editingId ? { ...row, ...nextRecord } : row))
      setRecords(optimistic)
      writeContractsToStorage(optimistic)

      const replaceWithCreated = async () => {
        const created = await createContract(toApiPayload(nextRecord))
        const synced = optimistic.map((row) =>
          row.id === editingId
            ? {
                ...row,
                id: created.id
              }
            : row
        )
        setRecords(synced)
        writeContractsToStorage(synced)
      }

      try {
        if (isSampleOrTempId(editingId)) {
          await replaceWithCreated()
        } else {
          await updateContract(String(editingId), toApiPayload(nextRecord))
        }
      } catch (err) {
        const statusCode = extractStatusCode(err)
        // 兼容历史示例记录 / 服务端已删除记录：PUT 404 时自动转为创建新记录
        if (statusCode === 404) {
          try {
            await replaceWithCreated()
          } catch (fallbackErr) {
            console.error(fallbackErr)
            setRecords(prev)
            writeContractsToStorage(prev)
            window.alert('更新失败：接口异常（404 后自动转新增也失败），已回滚。')
            return
          }
        } else {
          console.error(err)
          setRecords(prev)
          writeContractsToStorage(prev)
          window.alert(statusCode ? `更新失败：接口异常（${statusCode}），已回滚。` : '更新失败：接口异常，已回滚。')
          return
        }
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const optimistic = [{ id: tempId, ...nextRecord }, ...records]
      setRecords(optimistic)
      writeContractsToStorage(optimistic)
      try {
        const created = await createContract(toApiPayload(nextRecord))
        const synced = optimistic.map((row) =>
          row.id === tempId
            ? {
                ...row,
                id: created.id
              }
            : row
        )
        setRecords(synced)
        writeContractsToStorage(synced)
      } catch (err) {
        console.error(err)
        const rollback = records
        setRecords(rollback)
        writeContractsToStorage(rollback)
        window.alert('新增失败：接口异常，已回滚。')
        return
      }
    }
    setShowForm(false)
    setEditingId(null)
    setFormData(createEmptyForm())
  }

  const resetFilters = () => {
    setKeyword('')
    setQuickTab('全部')
    setStatusFilter('全部')
    setContractTypeFilter('全部')
    setGameFilter('全部')
    setExpiryFilter('全部')
    setOwnerFilter('全部')
  }

  const archiveContract = async (row) => {
    const next = { ...row, archived: true, status: '已归档' }
    const prev = records
    const optimistic = records.map((r) => (r.id === row.id ? next : r))
    setRecords(optimistic)
    writeContractsToStorage(optimistic)
    setOpenMoreId('')
    try {
      await updateContract(String(row.id), toApiPayload(next))
    } catch (err) {
      console.error(err)
      setRecords(prev)
      writeContractsToStorage(prev)
      window.alert('归档失败：接口异常，已回滚。')
    }
  }

  const exportContracts = () => {
    const headers = [
      '合同编号',
      '渠道名称',
      '平台方',
      '签约游戏',
      '合同类型',
      '开始日期',
      '结束日期',
      '状态',
      '分成比例',
      '负责人',
      '更新时间'
    ]
    const lines = filteredRecords.map((r) =>
      [
        r.contractNo,
        r.channel,
        r.platform,
        (r.games || []).join('、'),
        r.contractType,
        r.startDate,
        r.endDate,
        r.status,
        r.shareRatio,
        r.owner,
        r.updatedAt || ''
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `合同台账_${toDateString(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageContainer hideHeader className="contract-page">
      <section className="contract-toolbar">
        <div className="contract-toolbar__left">
          <div>
            <h2 className="contract-page-title">合同管理台账</h2>
            <p className="contract-page-desc">面向 100+ 合同的高密度查询、筛选与续签管理</p>
          </div>
        </div>
        <div className="contract-toolbar__actions">
          <button type="button" className="btn-primary" onClick={openCreateForm}>
            新增合同
          </button>
          <button type="button" className="btn-secondary" onClick={exportContracts}>
            导出
          </button>
          <button type="button" className="btn-secondary" onClick={() => setShowAdvanced((v) => !v)}>
            高级筛选
          </button>
        </div>
      </section>

      <section className="contract-stats">
        <article>
          <span>合同总数</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>生效中</span>
          <strong>{stats.active}</strong>
        </article>
        <article>
          <span>30天内到期</span>
          <strong>{stats.expiring30}</strong>
        </article>
        <article>
          <span>已过期</span>
          <strong>{stats.expired}</strong>
        </article>
      </section>

      <section className="contract-filter-card">
        <div className="contract-quick-tabs">
          {QUICK_TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              className={quickTab === tab ? 'active' : ''}
              onClick={() => setQuickTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="contract-filters-grid">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="关键词：渠道/平台/游戏/合同编号"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={contractTypeFilter} onChange={(e) => setContractTypeFilter(e.target.value)}>
            {options.contractTypes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button type="button" className="btn-reset" onClick={resetFilters}>
            重置
          </button>
          {showAdvanced && (
            <>
              <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
                {options.games.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)}>
                {EXPIRY_OPTIONS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                {options.owners.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </section>

      <section className="contract-table-card">
        {loading && <div className="contract-state">合同数据加载中...</div>}
        {!loading && errorMsg && <div className="contract-state contract-state--warn">{errorMsg}</div>}
        <div className="contract-table-wrap">
          <table className="contract-table contract-table--dense">
            <thead>
              <tr>
                <th className="col-sticky-left">合同编号</th>
                <th>渠道名称</th>
                <th>平台方</th>
                <th>签约游戏</th>
                <th>合同类型</th>
                <th>开始日期</th>
                <th>结束日期</th>
                <th>状态</th>
                <th>分成比例</th>
                <th>负责人</th>
                <th>更新时间</th>
                <th className="col-sticky-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((row) => (
                <tr key={row.id} onClick={() => setSelectedRow(row)}>
                  <td className="col-sticky-left text-ellipsis">{row.contractNo || '-'}</td>
                  <td className="text-ellipsis">{row.channel || '-'}</td>
                  <td className="text-ellipsis">{row.platform || '-'}</td>
                  <td className="text-ellipsis" title={(row.games || []).join('、')}>
                    {row.gameDisplay || '-'}
                  </td>
                  <td>{row.contractType || '-'}</td>
                  <td>{row.startDate || '-'}</td>
                  <td>{row.endDate || '-'}</td>
                  <td>
                    <ContractStatusTag status={row.status} />
                  </td>
                  <td>{row.shareRatio || '-'}</td>
                  <td>{row.owner || '-'}</td>
                  <td>{row.updatedAt ? String(row.updatedAt).slice(0, 10) : '-'}</td>
                  <td className="col-sticky-right" onClick={(e) => e.stopPropagation()}>
                    <div className="contract-row-actions">
                      <button type="button" onClick={() => setSelectedRow(row)}>
                        查看
                      </button>
                      <button type="button" onClick={() => openEditForm(row)}>
                        编辑
                      </button>
                      <button type="button" onClick={() => openRenewForm(row)}>
                        续签
                      </button>
                      <div className="more-wrapper">
                        <button type="button" onClick={() => setOpenMoreId((cur) => (cur === row.id ? '' : row.id))}>
                          更多
                        </button>
                        {openMoreId === row.id && (
                          <div className="more-menu">
                            <button type="button" onClick={() => archiveContract(row)}>
                              归档
                            </button>
                            <button type="button" onClick={() => handleDelete(row.id)}>
                              删除
                            </button>
                            <button type="button" onClick={() => window.alert('下载附件：占位功能')}>
                              下载附件
                            </button>
                            <button type="button" onClick={() => handleCopyNew(row)}>
                              复制新增
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="contract-empty">
                    暂无匹配数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="contract-pagination">
          <span>
            共 {filteredRecords.length} 条，第 {page}/{pageCount} 页
          </span>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}条/页
              </option>
            ))}
          </select>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            上一页
          </button>
          <button type="button" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
            下一页
          </button>
        </div>
      </section>

      {showForm && (
        <div className="contract-editor-mask" onClick={() => setShowForm(false)}>
          <div className="contract-editor" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? '编辑合同' : '新增合同'}</h3>
            <div className="contract-form-grid">
              <label>合同编号<input value={formData.contractNo} onChange={(e)=>setFormData((s)=>({...s,contractNo:e.target.value}))} /></label>
              <label>合同类型<input value={formData.contractType} onChange={(e)=>setFormData((s)=>({...s,contractType:e.target.value}))} /></label>
              <label>负责人<input value={formData.owner} onChange={(e)=>setFormData((s)=>({...s,owner:e.target.value}))} /></label>
              <label>签约日期<input type="date" value={formData.signingDate} onChange={(e)=>setFormData((s)=>({...s,signingDate:e.target.value}))} /></label>
              <label>开始日期<input type="date" value={formData.startDate} onChange={(e)=>setFormData((s)=>({...s,startDate:e.target.value}))} /></label>
              <label>结束日期<input type="date" value={formData.endDate} onChange={(e)=>setFormData((s)=>({...s,endDate:e.target.value}))} /></label>
              <label>渠道简称 *<input value={formData.channel} onChange={(e)=>setFormData((s)=>({...s,channel:e.target.value}))} /></label>
              <label>平台方 *<input value={formData.platform} onChange={(e)=>setFormData((s)=>({...s,platform:e.target.value}))} /></label>
              <label>签约游戏 *<input value={formData.gamesText} onChange={(e)=>setFormData((s)=>({...s,gamesText:e.target.value, game:e.target.value}))} placeholder="多个游戏用 、 分隔" /></label>
              <label>渠道分成<input value={formData.channelShare} onChange={(e)=>setFormData((s)=>({...s,channelShare:e.target.value}))} /></label>
              <label>发行分成<input value={formData.issueShare} onChange={(e)=>setFormData((s)=>({...s,issueShare:e.target.value}))} /></label>
              <label>通道费<input value={formData.channelFee} onChange={(e)=>setFormData((s)=>({...s,channelFee:e.target.value}))} /></label>
              <label>地址<input value={formData.address} onChange={(e)=>setFormData((s)=>({...s,address:e.target.value}))} /></label>
              <label>备注<input value={formData.note} onChange={(e)=>setFormData((s)=>({...s,note:e.target.value}))} /></label>
            </div>
            <label className="contract-archive-toggle">
              <input
                type="checkbox"
                checked={Boolean(formData.archived)}
                onChange={(e) => setFormData((s) => ({ ...s, archived: e.target.checked }))}
              />
              标记为已归档
            </label>
            <div className="contract-form-actions">
              <button type="button" className="contract-save-btn" onClick={handleSave}>
                {editingId ? '保存修改' : '添加合同'}
              </button>
              <button type="button" className="contract-cancel-btn" onClick={() => setShowForm(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <ContractDetailsDrawer
        contract={selectedRow}
        onClose={() => setSelectedRow(null)}
        onEdit={(row) => {
          setSelectedRow(null)
          openEditForm(row)
        }}
        onRenew={(row) => {
          setSelectedRow(null)
          openRenewForm(row)
        }}
      />
    </PageContainer>
  )
}

export default ContractManagementPage

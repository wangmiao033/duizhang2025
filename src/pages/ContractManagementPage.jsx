import React, { useMemo, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import './contract-management.css'

const STORAGE_KEY = 'contractManagementRecords.v1'

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
    remark: '示例'
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

function createEmptyForm() {
  return {
    signingDate: '',
    channel: '',
    platform: '',
    address: '',
    validPeriod: '',
    game: '',
    channelShare: '',
    issueShare: '',
    channelFee: '',
    remark: ''
  }
}

function ContractManagementPage() {
  const [records, setRecords] = useState(() => readContractsFromStorage())
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(createEmptyForm())

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return records
    return records.filter((row) =>
      [
        row.signingDate,
        row.channel,
        row.platform,
        row.address,
        row.validPeriod,
        row.game,
        row.channelShare,
        row.issueShare,
        row.channelFee,
        row.remark
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    )
  }, [query, records])

  const openCreateForm = () => {
    setEditingId(null)
    setFormData(createEmptyForm())
    setShowForm(true)
  }

  const openEditForm = (row) => {
    setEditingId(row.id)
    setFormData({
      signingDate: row.signingDate || '',
      channel: row.channel || '',
      platform: row.platform || '',
      address: row.address || '',
      validPeriod: row.validPeriod || '',
      game: row.game || '',
      channelShare: row.channelShare || '',
      issueShare: row.issueShare || '',
      channelFee: row.channelFee || '',
      remark: row.remark || ''
    })
    setShowForm(true)
  }

  const handleDelete = (rowId) => {
    if (!window.confirm('确定删除这条合同吗？')) return
    const next = records.filter((row) => row.id !== rowId)
    setRecords(next)
    writeContractsToStorage(next)
  }

  const handleSave = () => {
    if (!formData.channel.trim() || !formData.platform.trim() || !formData.game.trim()) {
      window.alert('请至少填写：渠道简称、平台方、签约游戏')
      return
    }
    const nextRecord = {
      ...formData,
      channelShare: normalizePercentInput(formData.channelShare),
      issueShare: normalizePercentInput(formData.issueShare),
      channelFee: normalizePercentInput(formData.channelFee)
    }

    let next
    if (editingId) {
      next = records.map((row) => (row.id === editingId ? { ...row, ...nextRecord } : row))
    } else {
      next = [{ id: String(Date.now()), ...nextRecord }, ...records]
    }
    setRecords(next)
    writeContractsToStorage(next)
    setShowForm(false)
    setEditingId(null)
    setFormData(createEmptyForm())
  }

  return (
    <PageContainer hideHeader className="contract-page">
      <section className="contract-card">
        <div className="contract-card__head">
          <div>
            <h3 className="contract-card__title">合同列表</h3>
            <p className="contract-card__desc">支持新增、编辑、删除与关键词筛选（本地保存）</p>
          </div>
          <div className="contract-card__actions">
            <input
              className="contract-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索渠道 / 平台 / 游戏 / 备注"
            />
            <button type="button" className="contract-add-btn" onClick={openCreateForm}>
              新增合同
            </button>
          </div>
        </div>

        {showForm && (
          <div className="contract-form-card">
            <div className="contract-form-grid">
              <label>
                签约日期
                <input
                  value={formData.signingDate}
                  onChange={(e) => setFormData((s) => ({ ...s, signingDate: e.target.value }))}
                  placeholder="例如 2026/4/23"
                />
              </label>
              <label>
                渠道简称 *
                <input
                  value={formData.channel}
                  onChange={(e) => setFormData((s) => ({ ...s, channel: e.target.value }))}
                  placeholder="例如 3733游戏"
                />
              </label>
              <label>
                平台方 *
                <input
                  value={formData.platform}
                  onChange={(e) => setFormData((s) => ({ ...s, platform: e.target.value }))}
                  placeholder="平台公司名称"
                />
              </label>
              <label>
                地址
                <input
                  value={formData.address}
                  onChange={(e) => setFormData((s) => ({ ...s, address: e.target.value }))}
                  placeholder="平台公司地址"
                />
              </label>
              <label>
                合同有效时间
                <input
                  value={formData.validPeriod}
                  onChange={(e) => setFormData((s) => ({ ...s, validPeriod: e.target.value }))}
                  placeholder="例如 2025-07-21 至 2027-07-20"
                />
              </label>
              <label>
                签约游戏 *
                <input
                  value={formData.game}
                  onChange={(e) => setFormData((s) => ({ ...s, game: e.target.value }))}
                  placeholder="例如 一起来修仙（0.05折）"
                />
              </label>
              <label>
                渠道分成
                <input
                  value={formData.channelShare}
                  onChange={(e) => setFormData((s) => ({ ...s, channelShare: e.target.value }))}
                  placeholder="例如 25 或 25%"
                />
              </label>
              <label>
                发行分成
                <input
                  value={formData.issueShare}
                  onChange={(e) => setFormData((s) => ({ ...s, issueShare: e.target.value }))}
                  placeholder="例如 75 或 75%"
                />
              </label>
              <label>
                通道费
                <input
                  value={formData.channelFee}
                  onChange={(e) => setFormData((s) => ({ ...s, channelFee: e.target.value }))}
                  placeholder="例如 0 或 0%"
                />
              </label>
              <label>
                备注
                <input
                  value={formData.remark}
                  onChange={(e) => setFormData((s) => ({ ...s, remark: e.target.value }))}
                  placeholder="可选备注"
                />
              </label>
            </div>
            <div className="contract-form-actions">
              <button type="button" className="contract-save-btn" onClick={handleSave}>
                {editingId ? '保存修改' : '添加合同'}
              </button>
              <button
                type="button"
                className="contract-cancel-btn"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData(createEmptyForm())
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="contract-table-wrap">
          <table className="contract-table">
            <thead>
              <tr>
                <th>签约日期</th>
                <th>渠道简称</th>
                <th>平台方</th>
                <th>地址</th>
                <th>合同有效时间</th>
                <th>签约游戏</th>
                <th>渠道分成</th>
                <th>发行分成</th>
                <th>通道费</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row) => (
                <tr key={row.id}>
                  <td>{row.signingDate}</td>
                  <td>{row.channel}</td>
                  <td>{row.platform}</td>
                  <td>{row.address}</td>
                  <td>{row.validPeriod}</td>
                  <td>{row.game}</td>
                  <td>{row.channelShare}</td>
                  <td>{row.issueShare}</td>
                  <td>{row.channelFee}</td>
                  <td>{row.remark || '-'}</td>
                  <td className="contract-row-actions">
                    <button type="button" onClick={() => openEditForm(row)}>
                      编辑
                    </button>
                    <button type="button" className="danger" onClick={() => handleDelete(row.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={11} className="contract-empty">
                    暂无匹配数据，请调整筛选条件或新增合同
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  )
}

export default ContractManagementPage

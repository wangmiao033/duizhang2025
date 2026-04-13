import React, { useState, useMemo } from 'react'
import DragSort from './DragSort.jsx'
import { StatusSelector } from './StatusManager.jsx'
import AdminListEmptyState from '@/components/admin/AdminListEmptyState.jsx'
import { getReconciliationRecordId } from '@/lib/api/reconciliation.ts'
import './DataTable.css'

function rowSelected(selectedIds, record) {
  return selectedIds.some((sid) => String(sid) === String(record.id))
}

function DataTable({ 
  records, 
  onUpdateRecord, 
  onDeleteRecord, 
  calculateSettlementAmount, 
  onUpdateSuccess,
  selectedIds = [],
  onSelectAll,
  onSelectRecord,
  onBatchDelete,
  onReorder,
  sortOptions = { field: '', order: 'asc' },
  onSortChange,
  onStatusChange,
  columnPreset = 'full',
  useDrawerForEdit = false,
  onRequestEdit,
  onRequestPageEdit = null,
  onQuickView = null,
  onBankPayment = null
}) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'byPartner' or 'list'
  const [expandedPartners, setExpandedPartners] = useState({})
  const compact = columnPreset === 'compact'
  const showBankPay = typeof onBankPayment === 'function'
  const emptyListColSpan = compact ? (showBankPay ? 11 : 10) : showBankPay ? 17 : 16

  const startEdit = (record) => {
    if (onRequestPageEdit) {
      onRequestPageEdit(record)
      return
    }
    if (useDrawerForEdit && onRequestEdit) {
      onRequestEdit(record)
      return
    }
    setEditingId(getReconciliationRecordId(record) || record.id)
    setEditForm({ ...record })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    const settlementAmount = calculateSettlementAmount(editForm)
    // 使用四舍五入确保精度，与Excel保持一致
    const roundedAmount = Math.round(settlementAmount * 100) / 100
    const result = onUpdateRecord(editingId, {
      ...editForm,
      settlementAmount: roundedAmount.toFixed(2)
    })
    const ok = result && typeof result.then === 'function' ? await result : result
    if (ok === false) return
    setEditingId(null)
    setEditForm({})
    if (onUpdateSuccess) {
      onUpdateSuccess()
    }
  }

  // 快捷键支持
  React.useEffect(() => {
    if (!editingId) return
    
    const handleKeyDown = async (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const settlementAmount = calculateSettlementAmount(editForm)
        // 使用四舍五入确保精度，与Excel保持一致
        const roundedAmount = Math.round(settlementAmount * 100) / 100
        const result = onUpdateRecord(editingId, {
          ...editForm,
          settlementAmount: roundedAmount.toFixed(2)
        })
        const ok = result && typeof result.then === 'function' ? await result : result
        if (ok === false) return
        setEditingId(null)
        setEditForm({})
        if (onUpdateSuccess) {
          onUpdateSuccess()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setEditingId(null)
        setEditForm({})
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingId, editForm, calculateSettlementAmount, onUpdateRecord, onUpdateSuccess])

  const allSelected = records.length > 0 && selectedIds.length === records.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < records.length

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex || !onReorder) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newRecords = [...records]
    const draggedItem = newRecords[draggedIndex]
    newRecords.splice(draggedIndex, 1)
    newRecords.splice(dropIndex, 0, draggedItem)

    onReorder(newRecords)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSort = (field) => {
    if (!onSortChange) return
    
    if (sortOptions.field === field) {
      // 切换排序顺序
      const newOrder = sortOptions.order === 'asc' ? 'desc' : 'asc'
      onSortChange(field, newOrder)
    } else {
      // 新的排序字段，默认升序
      onSortChange(field, 'asc')
    }
  }

  const getSortIcon = (field) => {
    if (sortOptions.field !== field) {
      return <span className="sort-icon" style={{ opacity: 0.3 }}>⇅</span>
    }
    return sortOptions.order === 'asc' 
      ? <span className="sort-icon">↑</span>
      : <span className="sort-icon">↓</span>
  }

  // 按合作方分组
  const groupedByPartner = useMemo(() => {
    const grouped = {}
    
    records.forEach(record => {
      const partner = record.partner || '未分类'
      if (!grouped[partner]) {
        grouped[partner] = {
          partner,
          records: [],
          totalGameFlow: 0,
          totalSettlementAmount: 0,
          totalVoucher: 0,
          totalRefund: 0,
          games: new Set()
        }
      }
      
      grouped[partner].records.push(record)
      grouped[partner].totalGameFlow += parseFloat(record.gameFlow || 0)
      grouped[partner].totalSettlementAmount += parseFloat(record.settlementAmount || 0)
      grouped[partner].totalVoucher += parseFloat(record.voucher || 0)
      grouped[partner].totalRefund += parseFloat(record.refund || 0)
      if (record.game) {
        grouped[partner].games.add(record.game)
      }
    })
    
    return Object.values(grouped).map(group => ({
      ...group,
      gameCount: group.games.size,
      games: Array.from(group.games)
    })).sort((a, b) => b.totalSettlementAmount - a.totalSettlementAmount)
  }, [records])

  const togglePartnerExpand = (partner) => {
    setExpandedPartners(prev => ({
      ...prev,
      [partner]: !prev[partner]
    }))
  }

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `¥${(amount / 100000000).toFixed(2)}亿`
    } else if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(2)}万`
    }
    return `¥${amount.toFixed(2)}`
  }

  return (
    <div className="data-table">
      <div className="table-header">
        <h3>对账记录列表</h3>
        <div className="table-header-right">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'byPartner' ? 'active' : ''}`}
              onClick={() => setViewMode('byPartner')}
            >
              按合作方
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
          </div>
          {selectedIds.length > 0 && (
            <div className="batch-actions">
              <span className="selected-count">已选择 {selectedIds.length} 条</span>
              <button className="batch-delete-btn" onClick={onBatchDelete}>
                批量删除
              </button>
            </div>
          )}
        </div>
      </div>
      {viewMode === 'byPartner' && (
        <div className="partner-summary">
          {groupedByPartner.length} 个合作方 / {records.length} 条记录
        </div>
      )}
      {onReorder && viewMode === 'list' && <DragSort records={records} onReorder={onReorder} />}
      
      {viewMode === 'byPartner' ? (
        <div className="partner-group-view">
          {groupedByPartner.length === 0 ? (
            <div className="data-table__empty-block">
              <AdminListEmptyState
                title="暂无对账记录"
                description="新增一条记录、使用 Excel 导入，或调整筛选条件后再试。"
              />
            </div>
          ) : (
            groupedByPartner.map(group => (
              <div key={group.partner} className="partner-card">
                <div 
                  className="partner-card-header"
                  onClick={() => togglePartnerExpand(group.partner)}
                >
                  <div className="partner-info">
                    <span className="expand-icon">
                      {expandedPartners[group.partner] ? '▼' : '▶'}
                    </span>
                    <h4 className="partner-name">{group.partner}</h4>
                    <span className="game-badge">{group.gameCount} 个游戏</span>
                  </div>
                  <div className="partner-stats">
                    <span className="stat">
                      <span className="label">流水</span>
                      <span className="value">{formatMoney(group.totalGameFlow)}</span>
                    </span>
                    <span className="stat">
                      <span className="label">结算</span>
                      <span className="value settlement">{formatMoney(group.totalSettlementAmount)}</span>
                    </span>
                    <span className="stat">
                      <span className="label">代金券</span>
                      <span className="value">{formatMoney(group.totalVoucher)}</span>
                    </span>
                  </div>
                </div>
                
                {expandedPartners[group.partner] && (
                  <div className="partner-records">
                    <table className="partner-detail-table">
                      <thead>
                        <tr>
                          <th>结算单编号</th>
                          <th>结算月份</th>
                          <th>游戏</th>
                          <th>游戏流水</th>
                          <th>测试费</th>
                          <th>代金券</th>
                          <th>通道费率</th>
                          <th>税点</th>
                          <th>分成比例</th>
                          <th>折扣</th>
                          <th>退款</th>
                          <th>结算金额</th>
                          <th>状态</th>
                          <th className="data-table__col-actions">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.records.map((record, recIdx) => (
                          <tr key={getReconciliationRecordId(record) || `g-${recIdx}`}>
                            <td className="settlement-number-cell" title={record.settlementNumber || '未设置编号'}>
                              {record.settlementNumber || '-'}
                            </td>
                            <td>{record.settlementMonth || '-'}</td>
                            <td className="game-name-cell">{record.game || '-'}</td>
                            <td className="amount-cell">¥{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                            <td className="amount-cell">¥{parseFloat(record.testingFee || 0).toFixed(2)}</td>
                            <td className="amount-cell">¥{parseFloat(record.voucher || 0).toFixed(2)}</td>
                            <td>{record.channelFeeRate || '0'}%</td>
                            <td>{record.taxPoint || '0'}%</td>
                            <td>{record.revenueShareRatio || '0'}%</td>
                            <td>{record.discount || '1'}</td>
                            <td className="amount-cell">¥{parseFloat(record.refund || 0).toFixed(2)}</td>
                            <td className="amount-cell settlement-amount">
                              ¥{parseFloat(record.settlementAmount || 0).toFixed(2)}
                            </td>
                            <td>
                              <StatusSelector
                                menuInPortal
                                currentStatus={record.status || 'pending'}
                                onStatusChange={(newStatus) =>
                                  onStatusChange &&
                                  onStatusChange(getReconciliationRecordId(record) || record.id, newStatus)
                                }
                              />
                            </td>
                            <td className="data-table__col-actions">
                              <div className="data-table__row-actions">
                                {onQuickView && (
                                  <button type="button" className="edit-btn" onClick={() => onQuickView(record)}>
                                    查看
                                  </button>
                                )}
                                <button type="button" className="edit-btn" onClick={() => startEdit(record)}>
                                  编辑
                                </button>
                                <button
                                  type="button"
                                  className="delete-btn"
                                  onClick={() => onDeleteRecord(getReconciliationRecordId(record) || record.id)}
                                >
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="total-label" colSpan="3">合计</td>
                          <td className="amount-cell">
                            <strong>¥{group.totalGameFlow.toFixed(2)}</strong>
                          </td>
                          <td className="amount-cell">
                            <strong>¥{group.records.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0).toFixed(2)}</strong>
                          </td>
                          <td className="amount-cell">
                            <strong>¥{group.totalVoucher.toFixed(2)}</strong>
                          </td>
                          <td colSpan="4">-</td>
                          <td className="amount-cell">
                            <strong>¥{group.totalRefund.toFixed(2)}</strong>
                          </td>
                          <td className="amount-cell settlement-amount">
                            <strong>¥{group.totalSettlementAmount.toFixed(2)}</strong>
                          </td>
                          <td>-</td>
                          <td></td>
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
        <div className="table-wrapper">
          <table className={compact ? 'data-table--compact' : ''}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
                {records.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  />
                )}
              </th>
              <th>结算单编号</th>
              <th>结算月份</th>
              <th>合作方</th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('game')}
                style={{ cursor: onSortChange ? 'pointer' : 'default' }}
                title={onSortChange ? '点击按游戏名称排序' : ''}
              >
                游戏 {onSortChange && getSortIcon('game')}
              </th>
              {!compact && (
                <>
                  <th>游戏流水</th>
                  <th>测试费</th>
                  <th>代金券</th>
                  <th>通道费率</th>
                  <th>税点</th>
                  <th>分成比例</th>
                  <th>折扣</th>
                  <th>退款</th>
                  <th>结算金额</th>
                </>
              )}
              {compact && (
                <>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort('gameFlow')}
                    style={{ cursor: onSortChange ? 'pointer' : 'default' }}
                  >
                    游戏流水 {onSortChange && getSortIcon('gameFlow')}
                  </th>
                  <th>分成比例</th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort('settlementAmount')}
                    style={{ cursor: onSortChange ? 'pointer' : 'default' }}
                  >
                    结算金额 {onSortChange && getSortIcon('settlementAmount')}
                  </th>
                </>
              )}
              {showBankPay && <th className="data-table__th-bank-pay">付款状态</th>}
              <th>状态</th>
              <th className="data-table__col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={emptyListColSpan} className="admin-list-empty-cell">
                  <AdminListEmptyState
                    variant="inline"
                    title="暂无对账记录"
                    description="新增一条记录、使用 Excel 导入，或调整筛选条件后再试。"
                  />
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr 
                  key={getReconciliationRecordId(record) || `row-${index}`} 
                  className={`${rowSelected(selectedIds, record) ? 'selected-row' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable={!!onReorder}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {String(editingId) === String(record.id) && !useDrawerForEdit ? (
                    <>
                      <td>
                        <input
                          type="checkbox"
                          checked={rowSelected(selectedIds, record)}
                          onChange={(e) =>
                            onSelectRecord &&
                            onSelectRecord(getReconciliationRecordId(record) || record.id, e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.settlementNumber || ''}
                          onChange={(e) => setEditForm({ ...editForm, settlementNumber: e.target.value })}
                          className="edit-input"
                          placeholder="结算单编号"
                          title="可手动修改编号"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.settlementMonth || ''}
                          onChange={(e) => setEditForm({ ...editForm, settlementMonth: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.partner || ''}
                          onChange={(e) => setEditForm({ ...editForm, partner: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.game || ''}
                          onChange={(e) => setEditForm({ ...editForm, game: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.gameFlow || ''}
                          onChange={(e) => setEditForm({ ...editForm, gameFlow: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.testingFee || ''}
                          onChange={(e) => setEditForm({ ...editForm, testingFee: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.voucher || ''}
                          onChange={(e) => setEditForm({ ...editForm, voucher: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.channelFeeRate || ''}
                          onChange={(e) => setEditForm({ ...editForm, channelFeeRate: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.taxPoint || ''}
                          onChange={(e) => setEditForm({ ...editForm, taxPoint: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.revenueShareRatio || ''}
                          onChange={(e) => setEditForm({ ...editForm, revenueShareRatio: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.001"
                          value={editForm.discount || ''}
                          onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.refund || ''}
                          onChange={(e) => setEditForm({ ...editForm, refund: e.target.value })}
                          className="edit-input"
                        />
                      </td>
                      <td className="amount-cell">
                        ¥{(Math.round(calculateSettlementAmount(editForm) * 100) / 100).toFixed(2)}
                      </td>
                      <td>
                        <StatusSelector
                          menuInPortal
                          currentStatus={editForm.status || 'pending'}
                          onStatusChange={(newStatus) => setEditForm({ ...editForm, status: newStatus })}
                        />
                      </td>
                      <td>
                        <button className="save-btn" onClick={saveEdit}>保存</button>
                        <button className="cancel-btn" onClick={cancelEdit}>取消</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        {onReorder && (
                          <span className="drag-handle" title="拖拽调整顺序">↕️</span>
                        )}
                        <input
                          type="checkbox"
                          checked={rowSelected(selectedIds, record)}
                          onChange={(e) =>
                            onSelectRecord &&
                            onSelectRecord(getReconciliationRecordId(record) || record.id, e.target.checked)
                          }
                        />
                      </td>
                      <td className="settlement-number-cell" title={record.settlementNumber || '未设置编号'}>
                        {record.settlementNumber || '-'}
                      </td>
                      <td>{record.settlementMonth || '-'}</td>
                      <td>{record.partner || '-'}</td>
                      <td>{record.game || '-'}</td>
                      {compact ? (
                        <>
                          <td className="amount-cell">¥{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                          <td>{record.revenueShareRatio || '0'}%</td>
                          <td className="amount-cell settlement-amount">
                            ¥{parseFloat(record.settlementAmount || 0).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="amount-cell">¥{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                          <td className="amount-cell">¥{parseFloat(record.testingFee || 0).toFixed(2)}</td>
                          <td className="amount-cell">¥{parseFloat(record.voucher || 0).toFixed(2)}</td>
                          <td>{record.channelFeeRate || '0'}%</td>
                          <td>{record.taxPoint || '0'}%</td>
                          <td>{record.revenueShareRatio || '0'}%</td>
                          <td>{record.discount || '0'}</td>
                          <td className="amount-cell">¥{parseFloat(record.refund || 0).toFixed(2)}</td>
                          <td className="amount-cell settlement-amount">
                            ¥{parseFloat(record.settlementAmount || 0).toFixed(2)}
                          </td>
                                               </>
                      )}
                      {showBankPay && (
                        <td className="data-table__td-bank-pay">
                          {(() => {
                            const label = record.bankPaymentListStatus || '未登记'
                            const isWarn = label === '金额异常'
                            const isBad = label === '打款失败'
                            return (
                              <span
                                className={`bank-pay-list-status${isWarn ? ' bank-pay-list-status--warn' : ''}${isBad ? ' bank-pay-list-status--bad' : ''}`}
                              >
                                {label}
                              </span>
                            )
                          })()}
                        </td>
                      )}
                      <td>
                        <StatusSelector
                          menuInPortal
                          currentStatus={record.status || 'pending'}
                          onStatusChange={(newStatus) =>
                            onStatusChange &&
                            onStatusChange(getReconciliationRecordId(record) || record.id, newStatus)
                          }
                        />
                      </td>
                      <td className="data-table__col-actions">
                        <div className="data-table__row-actions">
                          {onBankPayment && (
                            <button
                              type="button"
                              className="edit-btn rec-bank-pay-entry"
                              onClick={() => onBankPayment(record)}
                            >
                              付款流水单
                            </button>
                          )}
                          {onQuickView && (
                            <button type="button" className="edit-btn" onClick={() => onQuickView(record)}>
                              查看
                            </button>
                          )}
                          <button type="button" className="edit-btn" onClick={() => startEdit(record)}>
                            编辑
                          </button>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => onDeleteRecord(getReconciliationRecordId(record) || record.id)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
            {records.length > 0 && !compact && (
              <tr className="total-row">
                <td colSpan="3"><strong>合计</strong></td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0).toFixed(2)}</strong>
                </td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0).toFixed(2)}</strong>
                </td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.voucher) || 0), 0).toFixed(2)}</strong>
                </td>
                <td colSpan="5">-</td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0).toFixed(2)}</strong>
                </td>
                <td className="amount-cell settlement-amount">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0).toFixed(2)}</strong>
                </td>
                {showBankPay && <td>—</td>}
                <td>-</td>
                <td></td>
              </tr>
            )}
            {records.length > 0 && compact && (
              <tr className="total-row">
                <td />
                <td colSpan={4}>
                  <strong>合计</strong>
                </td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0).toFixed(2)}</strong>
                </td>
                <td>—</td>
                <td className="amount-cell settlement-amount">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0).toFixed(2)}</strong>
                </td>
                {showBankPay && <td>—</td>}
                <td>—</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

export default DataTable

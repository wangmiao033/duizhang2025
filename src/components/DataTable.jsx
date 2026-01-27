import React, { useState } from 'react'
import DragSort from './DragSort.jsx'
import CopyRecord from './CopyRecord.jsx'
import './DataTable.css'

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
  onCopyRecord,
  onReorder,
  sortOptions = { field: '', order: 'asc' },
  onSortChange
}) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const startEdit = (record) => {
    setEditingId(record.id)
    setEditForm({ ...record })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = () => {
    const settlementAmount = calculateSettlementAmount(editForm)
    // 使用四舍五入确保精度，与Excel保持一致
    const roundedAmount = Math.round(settlementAmount * 100) / 100
    onUpdateRecord(editingId, { ...editForm, settlementAmount: roundedAmount.toFixed(2) })
    setEditingId(null)
    setEditForm({})
    if (onUpdateSuccess) {
      onUpdateSuccess()
    }
  }

  // 快捷键支持
  React.useEffect(() => {
    if (!editingId) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const settlementAmount = calculateSettlementAmount(editForm)
        // 使用四舍五入确保精度，与Excel保持一致
        const roundedAmount = Math.round(settlementAmount * 100) / 100
        onUpdateRecord(editingId, { ...editForm, settlementAmount: roundedAmount.toFixed(2) })
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

  return (
    <div className="data-table">
      <div className="table-header">
        <h3>对账记录列表</h3>
        {selectedIds.length > 0 && (
          <div className="batch-actions">
            <span className="selected-count">已选择 {selectedIds.length} 条</span>
            <button className="batch-delete-btn" onClick={onBatchDelete}>
              批量删除
            </button>
          </div>
        )}
      </div>
      {onReorder && <DragSort records={records} onReorder={onReorder} />}
      <div className="table-wrapper">
        <table>
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
              <th>游戏流水</th>
              <th>测试费</th>
              <th>代金券</th>
              <th>通道费率</th>
              <th>税点</th>
              <th>分成比例</th>
              <th>折扣</th>
              <th>退款</th>
              <th>结算金额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="14" className="empty-message">暂无对账记录</td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr 
                  key={record.id} 
                  className={`${selectedIds.includes(record.id) ? 'selected-row' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable={!!onReorder}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {editingId === record.id ? (
                    <>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={(e) => onSelectRecord && onSelectRecord(record.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
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
                          checked={selectedIds.includes(record.id)}
                          onChange={(e) => onSelectRecord && onSelectRecord(record.id, e.target.checked)}
                        />
                      </td>
                      <td>{record.settlementMonth || '-'}</td>
                      <td>{record.partner || '-'}</td>
                      <td>{record.game || '-'}</td>
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
                      <td>
                        {onCopyRecord && <CopyRecord record={record} onCopy={onCopyRecord} />}
                        <button className="edit-btn" onClick={() => startEdit(record)}>编辑</button>
                        <button className="delete-btn" onClick={() => onDeleteRecord(record.id)}>删除</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
            {records.length > 0 && (
              <tr className="total-row">
                <td colSpan="2"><strong>合计</strong></td>
                <td>-</td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0).toFixed(2)}</strong>
                </td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0).toFixed(2)}</strong>
                </td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.voucher) || 0), 0).toFixed(2)}</strong>
                </td>
                <td colSpan="4">-</td>
                <td className="amount-cell">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0).toFixed(2)}</strong>
                </td>
                <td className="amount-cell settlement-amount">
                  <strong>¥{records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0).toFixed(2)}</strong>
                </td>
                <td>-</td>
                <td>-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

import React, { useState } from 'react'
import './BatchEdit.css'
import ConfirmDialog from './ConfirmDialog.jsx'

function BatchEdit({ selectedIds, records, onBatchUpdate }) {
  const [showDialog, setShowDialog] = useState(false)
  const [editFields, setEditFields] = useState({
    channelFeeRate: '',
    taxPoint: '',
    revenueShareRatio: '',
    discount: ''
  })

  const handleBatchEdit = () => {
    if (selectedIds.length === 0) {
      alert('请先选择要编辑的记录！')
      return
    }
    setShowDialog(true)
  }

  const handleFieldChange = (field, value) => {
    setEditFields({ ...editFields, [field]: value })
  }

  const confirmBatchEdit = () => {
    const updates = {}
    Object.entries(editFields).forEach(([field, value]) => {
      if (value !== '') {
        updates[field] = value
      }
    })

    if (Object.keys(updates).length === 0) {
      alert('请至少修改一个字段！')
      return
    }

    if (onBatchUpdate) {
      onBatchUpdate(selectedIds, updates)
    }

    setShowDialog(false)
    setEditFields({
      channelFeeRate: '',
      taxPoint: '',
      revenueShareRatio: '',
      discount: ''
    })
  }

  if (selectedIds.length === 0) return null

  return (
    <>
      <button className="batch-edit-btn" onClick={handleBatchEdit}>
        ✏️ 批量编辑 ({selectedIds.length})
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        title="批量编辑"
        message={
          <div className="batch-edit-form">
            <p>将更新 {selectedIds.length} 条记录的以下字段：</p>
            <div className="edit-fields">
              <div className="edit-field">
                <label>通道费率(%)：</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFields.channelFeeRate}
                  onChange={(e) => handleFieldChange('channelFeeRate', e.target.value)}
                  placeholder="留空则不修改"
                />
              </div>
              <div className="edit-field">
                <label>税点(%)：</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFields.taxPoint}
                  onChange={(e) => handleFieldChange('taxPoint', e.target.value)}
                  placeholder="留空则不修改"
                />
              </div>
              <div className="edit-field">
                <label>分成比例(%)：</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFields.revenueShareRatio}
                  onChange={(e) => handleFieldChange('revenueShareRatio', e.target.value)}
                  placeholder="留空则不修改"
                />
              </div>
              <div className="edit-field">
                <label>折扣：</label>
                <input
                  type="number"
                  step="0.001"
                  value={editFields.discount}
                  onChange={(e) => handleFieldChange('discount', e.target.value)}
                  placeholder="留空则不修改"
                />
              </div>
            </div>
          </div>
        }
        onConfirm={confirmBatchEdit}
        onCancel={() => {
          setShowDialog(false)
          setEditFields({
            channelFeeRate: '',
            taxPoint: '',
            revenueShareRatio: '',
            discount: ''
          })
        }}
        confirmText="确认修改"
        cancelText="取消"
      />
    </>
  )
}

export default BatchEdit


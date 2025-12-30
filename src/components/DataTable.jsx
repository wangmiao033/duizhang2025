import React, { useState } from 'react'
import './DataTable.css'

function DataTable({ records, onUpdateRecord, onDeleteRecord, calculateSettlementAmount }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

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
    onUpdateRecord(editingId, { ...editForm, settlementAmount: settlementAmount.toFixed(2) })
    setEditingId(null)
    setEditForm({})
  }

  return (
    <div className="data-table">
      <h3>对账记录列表</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>结算月份</th>
              <th>合作方</th>
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
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="13" className="empty-message">暂无对账记录</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  {editingId === record.id ? (
                    <>
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
                        ¥{parseFloat(calculateSettlementAmount(editForm) || 0).toFixed(2)}
                      </td>
                      <td>
                        <button className="save-btn" onClick={saveEdit}>保存</button>
                        <button className="cancel-btn" onClick={cancelEdit}>取消</button>
                      </td>
                    </>
                  ) : (
                    <>
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
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

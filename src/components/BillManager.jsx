import React, { useState, useEffect } from 'react'
import './BillManager.css'
import ConfirmDialog from './ConfirmDialog.jsx'

function BillManager({ 
  records, 
  partyA, 
  partyB, 
  settlementMonth,
  onLoadBill 
}) {
  const [savedBills, setSavedBills] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteBillId, setDeleteBillId] = useState(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [billName, setBillName] = useState('')

  // 加载已保存的账单列表
  useEffect(() => {
    loadSavedBills()
  }, [])

  const loadSavedBills = () => {
    const saved = localStorage.getItem('savedBills')
    if (saved) {
      try {
        setSavedBills(JSON.parse(saved))
      } catch (e) {
        console.error('加载账单列表失败', e)
      }
    }
  }

  const saveBill = () => {
    if (!billName.trim()) {
      alert('请输入账单名称！')
      return
    }

    const billData = {
      id: Date.now(),
      name: billName.trim(),
      records: records,
      partyA: partyA,
      partyB: partyB,
      settlementMonth: settlementMonth,
      saveDate: new Date().toISOString(),
      saveDateFormatted: new Date().toLocaleString('zh-CN')
    }

    const updatedBills = [...savedBills, billData]
    localStorage.setItem('savedBills', JSON.stringify(updatedBills))
    setSavedBills(updatedBills)
    setShowSaveDialog(false)
    setBillName('')
    return true
  }

  const loadBill = (bill) => {
    if (onLoadBill) {
      onLoadBill({
        records: bill.records,
        partyA: bill.partyA,
        partyB: bill.partyB,
        settlementMonth: bill.settlementMonth
      })
    }
  }

  const deleteBill = (id) => {
    setDeleteBillId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (deleteBillId) {
      const updatedBills = savedBills.filter(bill => bill.id !== deleteBillId)
      localStorage.setItem('savedBills', JSON.stringify(updatedBills))
      setSavedBills(updatedBills)
      setShowDeleteConfirm(false)
      setDeleteBillId(null)
    }
  }

  const exportBill = (bill) => {
    const blob = new Blob([JSON.stringify(bill, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bill.name}_${new Date(bill.saveDate).toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bill-manager">
      <div className="bill-manager-header">
        <h3>账单管理</h3>
        <button 
          className="save-bill-btn" 
          onClick={() => setShowSaveDialog(true)}
        >
          💾 保存当前账单
        </button>
      </div>

      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>保存账单</h4>
            <div className="save-dialog-content">
              <label>账单名称：</label>
              <input
                type="text"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                placeholder="请输入账单名称，如：2025年9月对账单"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (saveBill()) {
                      // 成功保存
                    }
                  }
                }}
              />
              <div className="save-dialog-info">
                <p>将保存以下内容：</p>
                <ul>
                  <li>对账记录：{records.length} 条</li>
                  <li>结算月份：{settlementMonth || '未设置'}</li>
                  <li>甲方信息：{partyA.invoiceTitle || '未设置'}</li>
                  <li>乙方信息：{partyB.companyName || '未设置'}</li>
                </ul>
              </div>
            </div>
            <div className="save-dialog-buttons">
              <button className="cancel-btn" onClick={() => {
                setShowSaveDialog(false)
                setBillName('')
              }}>
                取消
              </button>
              <button className="confirm-btn" onClick={saveBill}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="saved-bills-list">
        {savedBills.length === 0 ? (
          <div className="empty-bills">
            <p>暂无已保存的账单</p>
            <p className="empty-hint">点击"保存当前账单"按钮保存您的对账单</p>
          </div>
        ) : (
          <div className="bills-grid">
            {savedBills.map((bill) => (
              <div key={bill.id} className="bill-card">
                <div className="bill-card-header">
                  <h4>{bill.name}</h4>
                  <span className="bill-date">{bill.saveDateFormatted}</span>
                </div>
                <div className="bill-card-info">
                  <div className="info-item">
                    <span className="info-label">记录数：</span>
                    <span className="info-value">{bill.records.length} 条</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">结算月份：</span>
                    <span className="info-value">{bill.settlementMonth || '未设置'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">流水总额：</span>
                    <span className="info-value">
                      ¥{bill.records.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">结算总额：</span>
                    <span className="info-value">
                      ¥{bill.records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="bill-card-actions">
                  <button 
                    className="load-btn" 
                    onClick={() => loadBill(bill)}
                    title="加载此账单"
                  >
                    📂 加载
                  </button>
                  <button 
                    className="export-btn" 
                    onClick={() => exportBill(bill)}
                    title="导出账单文件"
                  >
                    📥 导出
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteBill(bill.id)}
                    title="删除此账单"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这个已保存的账单吗？此操作无法撤销。"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteBillId(null)
        }}
        confirmText="删除"
        cancelText="取消"
      />
    </div>
  )
}

export default BillManager


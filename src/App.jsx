import React, { useState, useEffect } from 'react'
import './App.css'
import DataForm from './components/DataForm.jsx'
import DataTable from './components/DataTable.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import ExportButton from './components/ExportButton.jsx'
import CompanyInfo from './components/CompanyInfo.jsx'

function App() {
  const [records, setRecords] = useState([])
  const [partyA, setPartyA] = useState({
    invoiceTitle: '厦门巴掌互动科技有限公司',
    invoiceContent: '*信息系统服务*信息服务费',
    taxRegistrationNo: '91350203MA348H8D3Y',
    invoiceAddress: '厦门市软件园三期凤岐路199-1号1003单元',
    bankName: '兴业银行厦门集美支行',
    bankAccount: '129980100100171131',
    phone: '0592-6219126'
  })
  const [partyB, setPartyB] = useState({
    companyName: '广州能动科技有限公司',
    bankName: '中国工商银行股份有限公司广州兴华支行',
    bankAccount: '3602841509200157769'
  })
  const [settlementMonth, setSettlementMonth] = useState('')

  // 从localStorage加载数据
  useEffect(() => {
    const savedRecords = localStorage.getItem('reconciliationRecords')
    const savedPartyA = localStorage.getItem('partyA')
    const savedPartyB = localStorage.getItem('partyB')
    const savedMonth = localStorage.getItem('settlementMonth')
    
    if (savedRecords) setRecords(JSON.parse(savedRecords))
    if (savedPartyA) setPartyA(JSON.parse(savedPartyA))
    if (savedPartyB) setPartyB(JSON.parse(savedPartyB))
    if (savedMonth) setSettlementMonth(savedMonth)
  }, [])

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem('reconciliationRecords', JSON.stringify(records))
  }, [records])

  useEffect(() => {
    localStorage.setItem('partyA', JSON.stringify(partyA))
  }, [partyA])

  useEffect(() => {
    localStorage.setItem('partyB', JSON.stringify(partyB))
  }, [partyB])

  useEffect(() => {
    localStorage.setItem('settlementMonth', settlementMonth)
  }, [settlementMonth])

  // 计算结算金额
  const calculateSettlementAmount = (record) => {
    const gameFlow = parseFloat(record.gameFlow || 0)
    const testingFee = parseFloat(record.testingFee || 0)
    const voucher = parseFloat(record.voucher || 0)
    const channelFeeRate = parseFloat(record.channelFeeRate || 0) / 100
    const taxPoint = parseFloat(record.taxPoint || 0) / 100
    const revenueShareRatio = parseFloat(record.revenueShareRatio || 0) / 100
    const discount = parseFloat(record.discount || 0)
    const refund = parseFloat(record.refund || 0)

    // 结算金额 = (游戏流水 - 测试费 - 代金券) * (1 - 通道费率) * (1 - 税点) * 分成比例 * 折扣 - 退款
    const baseAmount = gameFlow - testingFee - voucher
    const afterChannelFee = baseAmount * (1 - channelFeeRate)
    const afterTax = afterChannelFee * (1 - taxPoint)
    const afterShare = afterTax * revenueShareRatio
    const afterDiscount = afterShare * discount
    const finalAmount = afterDiscount - refund

    return Math.max(0, finalAmount)
  }

  const addRecord = (record) => {
    const settlementAmount = calculateSettlementAmount(record)
    setRecords([...records, { 
      ...record, 
      id: Date.now(),
      settlementAmount: settlementAmount.toFixed(2)
    }])
  }

  const updateRecord = (id, updatedRecord) => {
    const settlementAmount = calculateSettlementAmount(updatedRecord)
    setRecords(records.map(r => 
      r.id === id 
        ? { ...updatedRecord, id, settlementAmount: settlementAmount.toFixed(2) }
        : r
    ))
  }

  const deleteRecord = (id) => {
    setRecords(records.filter(r => r.id !== id))
  }

  // 计算统计数据
  const totalGameFlow = records.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0)
  const totalTestingFee = records.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0)
  const totalVoucher = records.reduce((sum, r) => sum + (parseFloat(r.voucher) || 0), 0)
  const totalSettlementAmount = records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>对账管理系统</h1>
        <p>生成标准格式的对账单</p>
      </header>

      <div className="app-container">
        <div className="config-section">
          <div className="config-item">
            <label>结算月份：</label>
            <input
              type="text"
              value={settlementMonth}
              onChange={(e) => setSettlementMonth(e.target.value)}
              placeholder="如：2025年9月"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', width: '200px' }}
            />
          </div>
        </div>

        <div className="summary-section">
          <SummaryCard title="记录总数" value={records.length} icon="📋" />
          <SummaryCard title="游戏流水总额" value={`¥${totalGameFlow.toFixed(2)}`} icon="💰" />
          <SummaryCard title="代金券总额" value={`¥${totalVoucher.toFixed(2)}`} icon="🎫" />
          <SummaryCard title="结算金额总额" value={`¥${totalSettlementAmount.toFixed(2)}`} icon="💵" />
        </div>

        <div className="main-content">
          <div className="form-section">
            <DataForm
              onAddRecord={addRecord}
              settlementMonth={settlementMonth}
            />
          </div>

          <div className="table-section">
            <DataTable
              records={records}
              onUpdateRecord={updateRecord}
              onDeleteRecord={deleteRecord}
              calculateSettlementAmount={calculateSettlementAmount}
            />
          </div>
        </div>

        <div className="company-info-section">
          <CompanyInfo
            partyA={partyA}
            partyB={partyB}
            onUpdatePartyA={setPartyA}
            onUpdatePartyB={setPartyB}
          />
        </div>

        <div className="export-section">
          <ExportButton
            records={records}
            partyA={partyA}
            partyB={partyB}
            settlementMonth={settlementMonth}
            totalGameFlow={totalGameFlow}
            totalTestingFee={totalTestingFee}
            totalVoucher={totalVoucher}
            totalSettlementAmount={totalSettlementAmount}
          />
        </div>
      </div>
    </div>
  )
}

export default App


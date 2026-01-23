import React, { useState, useEffect } from 'react'
import './DataComparison.css'

function DataComparison({ records }) {
  const [savedBills, setSavedBills] = useState([])
  const [selectedBill1, setSelectedBill1] = useState(null)
  const [selectedBill2, setSelectedBill2] = useState(null)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    loadSavedBills()
  }, [])

  const loadSavedBills = () => {
    const saved = localStorage.getItem('savedBills')
    if (saved) {
      try {
        setSavedBills(JSON.parse(saved))
      } catch (e) {
        console.error('加载账单失败', e)
      }
    }
  }

  const compareBills = () => {
    if (!selectedBill1 || !selectedBill2) {
      alert('请选择两个账单进行对比！')
      return
    }
    setShowComparison(true)
  }

  const getComparisonData = () => {
    if (!selectedBill1 || !selectedBill2) return null

    const bill1 = savedBills.find(b => b.id === selectedBill1)
    const bill2 = savedBills.find(b => b.id === selectedBill2)

    if (!bill1 || !bill2) return null

    const calcStats = (billRecords) => {
      return {
        count: billRecords.length,
        totalFlow: billRecords.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0),
        totalSettlement: billRecords.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0),
        avgSettlement: billRecords.length > 0
          ? billRecords.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0) / billRecords.length
          : 0
      }
    }

    const stats1 = calcStats(bill1.records || [])
    const stats2 = calcStats(bill2.records || [])

    return {
      bill1: { ...bill1, stats: stats1 },
      bill2: { ...bill2, stats: stats2 },
      diff: {
        count: stats2.count - stats1.count,
        totalFlow: stats2.totalFlow - stats1.totalFlow,
        totalSettlement: stats2.totalSettlement - stats1.totalSettlement,
        avgSettlement: stats2.avgSettlement - stats1.avgSettlement
      }
    }
  }

  const comparisonData = showComparison ? getComparisonData() : null

  return (
    <div className="data-comparison">
      <h3>数据对比</h3>
      
      <div className="comparison-selector">
        <div className="selector-group">
          <label>选择账单1：</label>
          <select
            value={selectedBill1 || ''}
            onChange={(e) => setSelectedBill1(parseInt(e.target.value))}
          >
            <option value="">请选择</option>
            {savedBills.map(bill => (
              <option key={bill.id} value={bill.id}>
                {bill.name} ({bill.saveDateFormatted})
              </option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label>选择账单2：</label>
          <select
            value={selectedBill2 || ''}
            onChange={(e) => setSelectedBill2(parseInt(e.target.value))}
          >
            <option value="">请选择</option>
            {savedBills.map(bill => (
              <option key={bill.id} value={bill.id}>
                {bill.name} ({bill.saveDateFormatted})
              </option>
            ))}
          </select>
        </div>

        <button 
          className="compare-btn"
          onClick={compareBills}
          disabled={!selectedBill1 || !selectedBill2}
        >
          开始对比
        </button>
      </div>

      {comparisonData && (
        <div className="comparison-result">
          <div className="comparison-header">
            <h4>对比结果</h4>
            <button 
              className="close-comparison-btn"
              onClick={() => setShowComparison(false)}
            >
              ×
            </button>
          </div>

          <div className="comparison-table">
            <div className="comparison-row header">
              <div className="comparison-cell">项目</div>
              <div className="comparison-cell">{comparisonData.bill1.name}</div>
              <div className="comparison-cell">{comparisonData.bill2.name}</div>
              <div className="comparison-cell">差异</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell">记录数</div>
              <div className="comparison-cell">{comparisonData.bill1.stats.count}</div>
              <div className="comparison-cell">{comparisonData.bill2.stats.count}</div>
              <div className={`comparison-cell ${comparisonData.diff.count >= 0 ? 'positive' : 'negative'}`}>
                {comparisonData.diff.count >= 0 ? '+' : ''}{comparisonData.diff.count}
              </div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell">流水总额</div>
              <div className="comparison-cell">¥{comparisonData.bill1.stats.totalFlow.toFixed(2)}</div>
              <div className="comparison-cell">¥{comparisonData.bill2.stats.totalFlow.toFixed(2)}</div>
              <div className={`comparison-cell ${comparisonData.diff.totalFlow >= 0 ? 'positive' : 'negative'}`}>
                {comparisonData.diff.totalFlow >= 0 ? '+' : ''}¥{comparisonData.diff.totalFlow.toFixed(2)}
              </div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell">结算总额</div>
              <div className="comparison-cell">¥{comparisonData.bill1.stats.totalSettlement.toFixed(2)}</div>
              <div className="comparison-cell">¥{comparisonData.bill2.stats.totalSettlement.toFixed(2)}</div>
              <div className={`comparison-cell ${comparisonData.diff.totalSettlement >= 0 ? 'positive' : 'negative'}`}>
                {comparisonData.diff.totalSettlement >= 0 ? '+' : ''}¥{comparisonData.diff.totalSettlement.toFixed(2)}
              </div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell">平均结算</div>
              <div className="comparison-cell">¥{comparisonData.bill1.stats.avgSettlement.toFixed(2)}</div>
              <div className="comparison-cell">¥{comparisonData.bill2.stats.avgSettlement.toFixed(2)}</div>
              <div className={`comparison-cell ${comparisonData.diff.avgSettlement >= 0 ? 'positive' : 'negative'}`}>
                {comparisonData.diff.avgSettlement >= 0 ? '+' : ''}¥{comparisonData.diff.avgSettlement.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataComparison


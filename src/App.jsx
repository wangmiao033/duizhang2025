import React, { useState, useEffect } from 'react'
import './App.css'
import DataForm from './components/DataForm.jsx'
import DataTable from './components/DataTable.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import ExportButton from './components/ExportButton.jsx'

function App() {
  const [games, setGames] = useState([])
  const [gameFlows, setGameFlows] = useState([])
  const [vouchers, setVouchers] = useState([])

  // 从localStorage加载数据
  useEffect(() => {
    const savedGames = localStorage.getItem('games')
    const savedFlows = localStorage.getItem('gameFlows')
    const savedVouchers = localStorage.getItem('vouchers')
    
    if (savedGames) setGames(JSON.parse(savedGames))
    if (savedFlows) setGameFlows(JSON.parse(savedFlows))
    if (savedVouchers) setVouchers(JSON.parse(savedVouchers))
  }, [])

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem('games', JSON.stringify(games))
  }, [games])

  useEffect(() => {
    localStorage.setItem('gameFlows', JSON.stringify(gameFlows))
  }, [gameFlows])

  useEffect(() => {
    localStorage.setItem('vouchers', JSON.stringify(vouchers))
  }, [vouchers])

  const addGame = (game) => {
    setGames([...games, { ...game, id: Date.now() }])
  }

  const addGameFlow = (flow) => {
    setGameFlows([...gameFlows, { ...flow, id: Date.now() }])
  }

  const addVoucher = (voucher) => {
    setVouchers([...vouchers, { ...voucher, id: Date.now() }])
  }

  const deleteGame = (id) => {
    setGames(games.filter(g => g.id !== id))
  }

  const deleteGameFlow = (id) => {
    setGameFlows(gameFlows.filter(f => f.id !== id))
  }

  const deleteVoucher = (id) => {
    setVouchers(vouchers.filter(v => v.id !== id))
  }

  // 计算统计数据
  const totalFlowAmount = gameFlows.reduce((sum, flow) => sum + (parseFloat(flow.amount) || 0), 0)
  const totalVoucherAmount = vouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0)
  const totalGames = games.length

  return (
    <div className="app">
      <header className="app-header">
        <h1>对账管理系统</h1>
        <p>管理游戏、游戏流水和代金券数据</p>
      </header>

      <div className="app-container">
        <div className="summary-section">
          <SummaryCard title="游戏总数" value={totalGames} icon="🎮" />
          <SummaryCard title="流水总额" value={`¥${totalFlowAmount.toFixed(2)}`} icon="💰" />
          <SummaryCard title="代金券总额" value={`¥${totalVoucherAmount.toFixed(2)}`} icon="🎫" />
        </div>

        <div className="main-content">
          <div className="form-section">
            <DataForm
              onAddGame={addGame}
              onAddGameFlow={addGameFlow}
              onAddVoucher={addVoucher}
            />
          </div>

          <div className="table-section">
            <DataTable
              games={games}
              gameFlows={gameFlows}
              vouchers={vouchers}
              onDeleteGame={deleteGame}
              onDeleteGameFlow={deleteGameFlow}
              onDeleteVoucher={deleteVoucher}
            />
          </div>
        </div>

        <div className="export-section">
          <ExportButton
            games={games}
            gameFlows={gameFlows}
            vouchers={vouchers}
            totalFlowAmount={totalFlowAmount}
            totalVoucherAmount={totalVoucherAmount}
          />
        </div>
      </div>
    </div>
  )
}

export default App


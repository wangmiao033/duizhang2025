import React, { useState } from 'react'
import './DataForm.css'

function DataForm({ onAddGame, onAddGameFlow, onAddVoucher }) {
  const [activeTab, setActiveTab] = useState('game')
  
  const [gameForm, setGameForm] = useState({
    name: '',
    platform: '',
    type: ''
  })

  const [flowForm, setFlowForm] = useState({
    gameName: '',
    date: '',
    amount: '',
    type: '收入',
    description: ''
  })

  const [voucherForm, setVoucherForm] = useState({
    gameName: '',
    voucherCode: '',
    amount: '',
    date: '',
    status: '未使用'
  })

  const handleGameSubmit = (e) => {
    e.preventDefault()
    if (gameForm.name) {
      onAddGame(gameForm)
      setGameForm({ name: '', platform: '', type: '' })
      alert('游戏添加成功！')
    }
  }

  const handleFlowSubmit = (e) => {
    e.preventDefault()
    if (flowForm.gameName && flowForm.amount) {
      onAddGameFlow(flowForm)
      setFlowForm({ gameName: '', date: '', amount: '', type: '收入', description: '' })
      alert('游戏流水添加成功！')
    }
  }

  const handleVoucherSubmit = (e) => {
    e.preventDefault()
    if (voucherForm.gameName && voucherForm.amount) {
      onAddVoucher(voucherForm)
      setVoucherForm({ gameName: '', voucherCode: '', amount: '', date: '', status: '未使用' })
      alert('代金券添加成功！')
    }
  }

  return (
    <div className="data-form">
      <div className="form-tabs">
        <button
          className={activeTab === 'game' ? 'active' : ''}
          onClick={() => setActiveTab('game')}
        >
          添加游戏
        </button>
        <button
          className={activeTab === 'flow' ? 'active' : ''}
          onClick={() => setActiveTab('flow')}
        >
          添加流水
        </button>
        <button
          className={activeTab === 'voucher' ? 'active' : ''}
          onClick={() => setActiveTab('voucher')}
        >
          添加代金券
        </button>
      </div>

      <div className="form-content">
        {activeTab === 'game' && (
          <form onSubmit={handleGameSubmit} className="form">
            <h3>添加游戏</h3>
            <div className="form-group">
              <label>游戏名称 *</label>
              <input
                type="text"
                value={gameForm.name}
                onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                required
                placeholder="请输入游戏名称"
              />
            </div>
            <div className="form-group">
              <label>平台</label>
              <input
                type="text"
                value={gameForm.platform}
                onChange={(e) => setGameForm({ ...gameForm, platform: e.target.value })}
                placeholder="如：iOS、Android、PC"
              />
            </div>
            <div className="form-group">
              <label>游戏类型</label>
              <input
                type="text"
                value={gameForm.type}
                onChange={(e) => setGameForm({ ...gameForm, type: e.target.value })}
                placeholder="如：RPG、策略、休闲"
              />
            </div>
            <button type="submit" className="submit-btn">添加游戏</button>
          </form>
        )}

        {activeTab === 'flow' && (
          <form onSubmit={handleFlowSubmit} className="form">
            <h3>添加游戏流水</h3>
            <div className="form-group">
              <label>游戏名称 *</label>
              <input
                type="text"
                value={flowForm.gameName}
                onChange={(e) => setFlowForm({ ...flowForm, gameName: e.target.value })}
                required
                placeholder="请输入游戏名称"
              />
            </div>
            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                value={flowForm.date}
                onChange={(e) => setFlowForm({ ...flowForm, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>金额 *</label>
              <input
                type="number"
                step="0.01"
                value={flowForm.amount}
                onChange={(e) => setFlowForm({ ...flowForm, amount: e.target.value })}
                required
                placeholder="请输入金额"
              />
            </div>
            <div className="form-group">
              <label>类型</label>
              <select
                value={flowForm.type}
                onChange={(e) => setFlowForm({ ...flowForm, type: e.target.value })}
              >
                <option value="收入">收入</option>
                <option value="支出">支出</option>
              </select>
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea
                value={flowForm.description}
                onChange={(e) => setFlowForm({ ...flowForm, description: e.target.value })}
                placeholder="请输入备注信息"
                rows="3"
              />
            </div>
            <button type="submit" className="submit-btn">添加流水</button>
          </form>
        )}

        {activeTab === 'voucher' && (
          <form onSubmit={handleVoucherSubmit} className="form">
            <h3>添加代金券</h3>
            <div className="form-group">
              <label>游戏名称 *</label>
              <input
                type="text"
                value={voucherForm.gameName}
                onChange={(e) => setVoucherForm({ ...voucherForm, gameName: e.target.value })}
                required
                placeholder="请输入游戏名称"
              />
            </div>
            <div className="form-group">
              <label>代金券代码</label>
              <input
                type="text"
                value={voucherForm.voucherCode}
                onChange={(e) => setVoucherForm({ ...voucherForm, voucherCode: e.target.value })}
                placeholder="请输入代金券代码"
              />
            </div>
            <div className="form-group">
              <label>金额 *</label>
              <input
                type="number"
                step="0.01"
                value={voucherForm.amount}
                onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                required
                placeholder="请输入金额"
              />
            </div>
            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                value={voucherForm.date}
                onChange={(e) => setVoucherForm({ ...voucherForm, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>状态</label>
              <select
                value={voucherForm.status}
                onChange={(e) => setVoucherForm({ ...voucherForm, status: e.target.value })}
              >
                <option value="未使用">未使用</option>
                <option value="已使用">已使用</option>
                <option value="已过期">已过期</option>
              </select>
            </div>
            <button type="submit" className="submit-btn">添加代金券</button>
          </form>
        )}
      </div>
    </div>
  )
}

export default DataForm


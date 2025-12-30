import React, { useState } from 'react'
import './DataTable.css'

function DataTable({ games, gameFlows, vouchers, onDeleteGame, onDeleteGameFlow, onDeleteVoucher }) {
  const [activeTab, setActiveTab] = useState('games')

  return (
    <div className="data-table">
      <div className="table-tabs">
        <button
          className={activeTab === 'games' ? 'active' : ''}
          onClick={() => setActiveTab('games')}
        >
          游戏列表 ({games.length})
        </button>
        <button
          className={activeTab === 'flows' ? 'active' : ''}
          onClick={() => setActiveTab('flows')}
        >
          流水记录 ({gameFlows.length})
        </button>
        <button
          className={activeTab === 'vouchers' ? 'active' : ''}
          onClick={() => setActiveTab('vouchers')}
        >
          代金券 ({vouchers.length})
        </button>
      </div>

      <div className="table-content">
        {activeTab === 'games' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>游戏名称</th>
                  <th>平台</th>
                  <th>类型</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {games.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-message">暂无游戏数据</td>
                  </tr>
                ) : (
                  games.map((game) => (
                    <tr key={game.id}>
                      <td>{game.name}</td>
                      <td>{game.platform || '-'}</td>
                      <td>{game.type || '-'}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteGame(game.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'flows' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>游戏名称</th>
                  <th>日期</th>
                  <th>金额</th>
                  <th>类型</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {gameFlows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-message">暂无流水记录</td>
                  </tr>
                ) : (
                  gameFlows.map((flow) => (
                    <tr key={flow.id}>
                      <td>{flow.gameName}</td>
                      <td>{flow.date || '-'}</td>
                      <td className="amount-cell">¥{parseFloat(flow.amount || 0).toFixed(2)}</td>
                      <td>
                        <span className={`type-badge ${flow.type === '收入' ? 'income' : 'expense'}`}>
                          {flow.type}
                        </span>
                      </td>
                      <td>{flow.description || '-'}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteGameFlow(flow.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>游戏名称</th>
                  <th>代金券代码</th>
                  <th>金额</th>
                  <th>日期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-message">暂无代金券数据</td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => (
                    <tr key={voucher.id}>
                      <td>{voucher.gameName}</td>
                      <td>{voucher.voucherCode || '-'}</td>
                      <td className="amount-cell">¥{parseFloat(voucher.amount || 0).toFixed(2)}</td>
                      <td>{voucher.date || '-'}</td>
                      <td>
                        <span className={`status-badge ${voucher.status === '已使用' ? 'used' : voucher.status === '已过期' ? 'expired' : 'unused'}`}>
                          {voucher.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteVoucher(voucher.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataTable


import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import './contract-management.css'

const mockContracts = [
  {
    signingDate: '2026/4/23',
    channel: '3733游戏',
    platform: '厦门三七三三网络科技有限公司',
    address: '厦门市软件园二期观日路50号2F单元之07单元',
    validPeriod: '2025-07-21 至 2027-07-20',
    game: '一起来修仙（0.05折）',
    channelShare: '25%',
    issueShare: '75%',
    channelFee: '0%',
    remark: ''
  }
]

function ContractManagementPage() {
  return (
    <PageContainer hideHeader className="contract-page">
      <section className="contract-card">
        <div className="contract-card__head">
          <h3 className="contract-card__title">合同列表</h3>
          <p className="contract-card__desc">按签约日期、渠道与合作平台查看合同配置</p>
        </div>
        <div className="contract-table-wrap">
          <table className="contract-table">
            <thead>
              <tr>
                <th>签约日期</th>
                <th>渠道简称</th>
                <th>平台方</th>
                <th>地址</th>
                <th>合同有效时间</th>
                <th>签约游戏</th>
                <th>渠道分成</th>
                <th>发行分成</th>
                <th>通道费</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {mockContracts.map((row) => (
                <tr key={`${row.signingDate}-${row.channel}-${row.game}`}>
                  <td>{row.signingDate}</td>
                  <td>{row.channel}</td>
                  <td>{row.platform}</td>
                  <td>{row.address}</td>
                  <td>{row.validPeriod}</td>
                  <td>{row.game}</td>
                  <td>{row.channelShare}</td>
                  <td>{row.issueShare}</td>
                  <td>{row.channelFee}</td>
                  <td>{row.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  )
}

export default ContractManagementPage

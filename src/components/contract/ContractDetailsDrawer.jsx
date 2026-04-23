import React from 'react'
import ContractStatusTag from './ContractStatusTag.jsx'

function DetailRow({ label, value }) {
  return (
    <div className="contract-detail-row">
      <span className="contract-detail-label">{label}</span>
      <span className="contract-detail-value">{value || '-'}</span>
    </div>
  )
}

function ContractDetailsDrawer({ contract, onClose, onEdit, onRenew }) {
  if (!contract) return null

  return (
    <div className="contract-drawer-mask" onClick={onClose}>
      <aside className="contract-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="contract-drawer-head">
          <div>
            <h3>{contract.contractNo || '-'}</h3>
            <p>{contract.channel || '-'}</p>
          </div>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="contract-drawer-section">
          <h4>基础信息</h4>
          <DetailRow label="状态" value={<ContractStatusTag status={contract.status} />} />
          <DetailRow label="合同类型" value={contract.contractType} />
          <DetailRow label="负责人" value={contract.owner} />
          <DetailRow label="开始日期" value={contract.startDate} />
          <DetailRow label="结束日期" value={contract.endDate} />
        </div>

        <div className="contract-drawer-section">
          <h4>合同主体信息</h4>
          <DetailRow label="平台方" value={contract.platform} />
          <DetailRow label="地址" value={contract.address} />
        </div>

        <div className="contract-drawer-section">
          <h4>签约游戏</h4>
          <div className="contract-detail-games">
            {(contract.games || []).length > 0 ? (contract.games || []).map((g) => <span key={g}>{g}</span>) : '-'}
          </div>
        </div>

        <div className="contract-drawer-section">
          <h4>分成规则</h4>
          <DetailRow label="渠道分成" value={contract.channelShare} />
          <DetailRow label="发行分成" value={contract.issueShare} />
          <DetailRow label="通道费" value={contract.channelFee} />
        </div>

        <div className="contract-drawer-section">
          <h4>合同附件</h4>
          <p className="contract-placeholder">
            {(contract.attachments || []).length > 0 ? `${contract.attachments.length} 个附件` : '暂无附件（占位）'}
          </p>
        </div>

        <div className="contract-drawer-section">
          <h4>备注</h4>
          <p className="contract-note">{contract.note || '-'}</p>
        </div>

        <div className="contract-drawer-section">
          <h4>操作日志</h4>
          <p className="contract-placeholder">
            {(contract.logs || []).length > 0 ? `${contract.logs.length} 条日志` : '暂无日志（占位）'}
          </p>
        </div>

        <div className="contract-drawer-actions">
          <button type="button" onClick={() => onEdit?.(contract)}>
            编辑
          </button>
          <button type="button" onClick={() => onRenew?.(contract)}>
            续签
          </button>
        </div>
      </aside>
    </div>
  )
}

export default ContractDetailsDrawer

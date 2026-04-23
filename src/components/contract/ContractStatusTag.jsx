import React from 'react'

const STATUS_CLASS = {
  生效中: 'is-active',
  即将到期: 'is-warning',
  已过期: 'is-danger',
  待生效: 'is-pending',
  已归档: 'is-archived'
}

function ContractStatusTag({ status }) {
  const text = status || '生效中'
  const cls = STATUS_CLASS[text] || 'is-active'
  return <span className={`contract-status-tag ${cls}`}>{text}</span>
}

export default ContractStatusTag

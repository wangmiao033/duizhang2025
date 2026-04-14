import React from 'react'
import {
  getChannelTotals,
  getChannelReceivedAmount,
  receiptProgressPercent,
  isChannelReceiptSettled,
  receiptStatusTagLabel,
  receiptStatusTagClass
} from '@/domain/channel/channelAggregates.js'

function formatYuan(n) {
  const x = Number(n) || 0
  return `¥${x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * 已收/应收 + 进度条 + 状态 Tag（未收/部分收/已结清）
 */
function ChannelReceiptProgressBlock({ record, compact = false }) {
  const receivable = getChannelTotals(record).settlementAmount
  const received = getChannelReceivedAmount(record)
  const settled = isChannelReceiptSettled(record)
  const pct = receiptProgressPercent(received, receivable)

  if (settled) {
    return (
      <div className={`channel-receipt-progress ${compact ? 'channel-receipt-progress--compact' : ''}`}>
        <div className="channel-receipt-progress__line">
          <span className="channel-receipt-progress__ratio">
            {formatYuan(received)} / {formatYuan(receivable)}
          </span>
          <span className="channel-receipt-tag channel-receipt-tag--cleared">已结清</span>
        </div>
        <div className="channel-receipt-progress__bar" aria-hidden="true">
          <div className="channel-receipt-progress__fill channel-receipt-progress__fill--full" style={{ width: '100%' }} />
        </div>
        <div className="channel-receipt-progress__pct">100%</div>
      </div>
    )
  }

  return (
    <div className={`channel-receipt-progress ${compact ? 'channel-receipt-progress--compact' : ''}`}>
      <div className="channel-receipt-progress__line">
        <span className="channel-receipt-progress__ratio">
          {formatYuan(received)} / {formatYuan(receivable)}
        </span>
        <span className={receiptStatusTagClass(record.receiptStatus)}>{receiptStatusTagLabel(record.receiptStatus)}</span>
      </div>
      <div className="channel-receipt-progress__bar" aria-hidden="true">
        <div className="channel-receipt-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="channel-receipt-progress__pct">{pct}%</div>
    </div>
  )
}

export default ChannelReceiptProgressBlock

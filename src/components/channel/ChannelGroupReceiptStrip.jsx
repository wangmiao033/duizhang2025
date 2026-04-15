import React from 'react'
import ChannelReceiptProgressBlock from '@/components/channel/ChannelReceiptProgressBlock.jsx'
import { getChannelUnpaidAmount, isChannelReceiptSettled } from '@/domain/channel/channelAggregates.js'
import { getChannelRecordId } from '@/lib/api/channel.ts'

/**
 * 渠道块内：对账单维度的收款操作（非游戏行），紧凑排在头部下方。
 */
export default function ChannelGroupReceiptStrip({
  records,
  onReceiptList,
  onReceiptRegister,
  onReceiptQuickFull
}) {
  return (
    <div className="channel-bill-card__receipts" role="region" aria-label="渠道对账单收款">
      {records.map((rec) => {
        const rid = getChannelRecordId(rec) || rec.id
        const settled = isChannelReceiptSettled(rec)
        const unpaid = getChannelUnpaidAmount(rec)
        return (
          <div key={rid} className="channel-bill-card__receipt-row">
            <div className="channel-bill-card__receipt-meta">
              <span className="channel-bill-card__receipt-title">
                {rec.settlementMonth || '未设月份'} · {rec.startDate || '—'} ~ {rec.endDate || '—'}
              </span>
              <div className="channel-bill-card__receipt-progress">
                <ChannelReceiptProgressBlock record={rec} compact />
              </div>
            </div>
            <div className="channel-bill-card__receipt-actions">
              <button type="button" className="edit-btn" onClick={() => onReceiptList(rec)}>
                收款记录
              </button>
              {!settled && unpaid > 1e-6 ? (
                <>
                  <button
                    type="button"
                    className="edit-btn channel-rd__btn-receipt"
                    onClick={() => onReceiptRegister(rec)}
                  >
                    收款登记
                  </button>
                  <button
                    type="button"
                    className="edit-btn channel-rd__btn-receipt"
                    onClick={() => onReceiptQuickFull(rec)}
                  >
                    快速全收
                  </button>
                </>
              ) : (
                <span className="channel-receipt-tag channel-receipt-tag--cleared">已结清</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

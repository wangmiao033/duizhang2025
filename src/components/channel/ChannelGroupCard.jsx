import React from 'react'
import ChannelGroupHeader from '@/components/channel/ChannelGroupHeader.jsx'
import ChannelGroupReceiptStrip from '@/components/channel/ChannelGroupReceiptStrip.jsx'
import ChannelGroupTable from '@/components/channel/ChannelGroupTable.jsx'

/**
 * 按渠道视图：单渠道账单卡片（头部 + 收款条 + 游戏明细表）。
 */
export default function ChannelGroupCard({
  channel,
  expanded,
  onToggleExpand,
  formatMoney,
  onView,
  onEdit,
  onDelete,
  onReceiptList,
  onReceiptRegister,
  onReceiptQuickFull
}) {
  return (
    <article className="channel-bill-card">
      <ChannelGroupHeader
        channel={channel}
        expanded={expanded}
        onToggle={onToggleExpand}
        formatMoney={formatMoney}
      />
      {expanded && (
        <>
          <ChannelGroupReceiptStrip
            records={channel.records}
            onReceiptList={onReceiptList}
            onReceiptRegister={onReceiptRegister}
            onReceiptQuickFull={onReceiptQuickFull}
          />
          <div className="channel-bill-card__detail">
            <div className="channel-bill-card__detail-title">游戏明细</div>
            <div className="channel-bill-card__table-scroll">
              <ChannelGroupTable
                channel={channel}
                formatMoney={formatMoney}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
        </>
      )}
    </article>
  )
}

import React from 'react'

/**
 * 按渠道视图：渠道块顶栏（左标题/右汇总），与展开逻辑解耦，仅负责展示与触发折叠。
 */
export default function ChannelGroupHeader({ channel, expanded, onToggle, formatMoney }) {
  const unpaid = Number(channel.totalUnpaid) || 0
  const received = Number(channel.totalReceived) || 0
  const profit = channel.profitRate

  return (
    <div className="channel-bill-card__header">
      <button
        type="button"
        className="channel-bill-card__header-left"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className={`channel-bill-card__chevron ${expanded ? 'is-open' : ''}`} aria-hidden />
        <span className="channel-bill-card__name">{channel.channelName}</span>
        <span className="channel-bill-card__count">{channel.gameCount} 个游戏</span>
      </button>
      <div className="channel-bill-card__metrics">
        <div className="channel-bill-metric">
          <span className="channel-bill-metric__label">总流水</span>
          <span className="channel-bill-metric__value">{formatMoney(channel.totalFlow)}</span>
        </div>
        <div className="channel-bill-metric">
          <span className="channel-bill-metric__label">应收</span>
          <span className="channel-bill-metric__value channel-bill-metric__value--emph">
            {formatMoney(channel.totalSettlement)}
          </span>
        </div>
        <div className="channel-bill-metric">
          <span className="channel-bill-metric__label">已收</span>
          <span
            className={`channel-bill-metric__value channel-bill-metric__value--num ${
              received > 1e-6 ? 'channel-bill-metric__value--received' : ''
            }`}
          >
            {formatMoney(received)}
          </span>
        </div>
        <div className="channel-bill-metric">
          <span className="channel-bill-metric__label">未收</span>
          <span
            className={`channel-bill-metric__value channel-bill-metric__value--num ${
              unpaid > 1e-6 ? 'channel-bill-metric__value--unpaid' : 'channel-bill-metric__value--cleared'
            }`}
          >
            {formatMoney(unpaid)}
          </span>
        </div>
        <div className="channel-bill-metric">
          <span className="channel-bill-metric__label">占比</span>
          <span
            className={`channel-bill-metric__value channel-bill-metric__value--num ${
              parseFloat(profit) >= 0 ? 'channel-bill-metric__value--pos' : 'channel-bill-metric__value--neg'
            }`}
          >
            {profit}%
          </span>
        </div>
      </div>
    </div>
  )
}

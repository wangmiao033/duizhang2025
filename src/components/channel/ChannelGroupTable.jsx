import React from 'react'
import {
  getChannelLineItems,
  getLineDiscountFactor,
  getLineEffectiveFlow
} from '@/domain/channel/channelAggregates.js'
import { getChannelRecordId } from '@/lib/api/channel.ts'

/**
 * 按渠道展开后的游戏明细表（精简列，金额右对齐）。
 */
export default function ChannelGroupTable({
  channel,
  formatMoney,
  onView,
  onEdit,
  onDelete
}) {
  const billingTotal =
    channel.totalFlow -
    channel.totalVoucherCost -
    (channel.totalNoWorryCost || 0) -
    (channel.totalRefundCost || 0) -
    channel.totalTestCost -
    (channel.totalWelfareCost || 0)

  const shareTotal =
    billingTotal *
    (channel.records[0]
      ? parseFloat(channel.records[0].shareRate || channel.records[0].cfChannelRate || 30) / 100
      : 0.3)

  return (
    <table className="channel-group-table">
      <thead>
        <tr>
          <th>游戏名称</th>
          <th className="channel-group-table__num">后台流水</th>
          <th className="channel-group-table__num">折扣/系数</th>
          <th className="channel-group-table__num">总流水</th>
          <th className="channel-group-table__num">代金券/测试费</th>
          <th className="channel-group-table__num">计算金额</th>
          <th className="channel-group-table__num">分成比例</th>
          <th className="channel-group-table__num">分成金额</th>
          <th className="channel-group-table__num">结算金额</th>
          <th className="channel-group-table__actions">操作</th>
        </tr>
      </thead>
      <tbody>
        {channel.records.flatMap((record) => {
          const rid = getChannelRecordId(record) || record.id
          const lines = getChannelLineItems(record)
          return lines.map((line, lineIdx) => {
            const rawFlow = parseFloat(line.flow) || 0
            const effFlow = getLineEffectiveFlow(line)
            const voucher = parseFloat(line.voucherCost) || 0
            const noWorry = parseFloat(line.noWorryCost) || 0
            const refund = parseFloat(line.refundCost) || 0
            const test = parseFloat(line.testCost) || 0
            const welfare = parseFloat(line.welfareCost) || 0
            const billingAmount = effFlow - voucher - noWorry - refund - test - welfare
            const shareRate = parseFloat(line.shareRate || 30)
            const shareAmount = billingAmount * (shareRate / 100)
            const settlement = parseFloat(line.settlementAmount) || shareAmount
            const rowKey = `${rid}-${lineIdx}`
            return (
              <tr key={rowKey}>
                <td className="game-name-cell">{line.gameName}</td>
                <td className="channel-group-table__num">{formatMoney(rawFlow)}</td>
                <td className="channel-group-table__num">{getLineDiscountFactor(line)}</td>
                <td className="channel-group-table__num">{formatMoney(effFlow)}</td>
                <td className="channel-group-table__num channel-group-table__subnum">
                  <span className="channel-group-table__pair">
                    <span>券 {formatMoney(voucher)}</span>
                    <span>测 {formatMoney(test)}</span>
                  </span>
                </td>
                <td className="channel-group-table__num">{formatMoney(billingAmount)}</td>
                <td className="channel-group-table__num">{shareRate}%</td>
                <td className="channel-group-table__num">{formatMoney(shareAmount)}</td>
                <td className="channel-group-table__num channel-group-table__settlement">
                  {formatMoney(settlement)}
                </td>
                <td className="channel-group-table__actions">
                  {lineIdx === 0 ? (
                    <div className="actions">
                      <button type="button" className="edit-btn" onClick={() => onView(record)}>
                        查看
                      </button>
                      <button type="button" className="edit-btn" onClick={() => onEdit(rid)}>
                        编辑
                      </button>
                      <button type="button" className="delete-btn" onClick={() => onDelete(rid)}>
                        删除
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            )
          })
        })}
      </tbody>
      <tfoot>
        <tr className="channel-group-table__foot">
          <td className="channel-group-table__foot-label">合计</td>
          <td className="channel-group-table__num">{formatMoney(channel.totalRawFlow || 0)}</td>
          <td className="channel-group-table__num">—</td>
          <td className="channel-group-table__num">{formatMoney(channel.totalFlow)}</td>
          <td className="channel-group-table__num channel-group-table__subnum">
            <span className="channel-group-table__pair">
              <span>券 {formatMoney(channel.totalVoucherCost)}</span>
              <span>测 {formatMoney(channel.totalTestCost)}</span>
            </span>
          </td>
          <td className="channel-group-table__num">{formatMoney(billingTotal)}</td>
          <td className="channel-group-table__num">—</td>
          <td className="channel-group-table__num">{formatMoney(shareTotal)}</td>
          <td className="channel-group-table__num channel-group-table__settlement">
            {formatMoney(channel.totalSettlement)}
          </td>
          <td className="channel-group-table__actions" />
        </tr>
      </tfoot>
    </table>
  )
}

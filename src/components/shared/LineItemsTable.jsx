import React from 'react'

/**
 * 渠道对账 / 研发对账共用的「游戏明细」工具条与内容区外层。
 * 样式依赖 `@/components/ChannelBilling.css`（channel-line-items-*）
 *
 * @param {object} props
 * @param {React.ReactNode} [props.leading] 工具条左侧（如小标题）
 * @param {string|null} [props.hint] 提示文案
 * @param {() => void} props.onAddRow
 * @param {string} [props.addLabel]
 * @param {React.ReactNode} props.children 表格或 grid 容器
 */
export default function LineItemsTable({
  leading = null,
  hint = null,
  onAddRow,
  showAddButton = true,
  addLabel = '+ 新增一行游戏',
  children
}) {
  const split = Boolean(leading)
  return (
    <div className="channel-line-items-wrap">
      <div
        className={`channel-line-items-toolbar${split ? ' channel-line-items-toolbar--split' : ''}`}
      >
        {split ? <div className="channel-line-items-toolbar-leading">{leading}</div> : null}
        {showAddButton ? (
          <button
            type="button"
            className="rec-btn rec-btn--secondary channel-line-add"
            onClick={onAddRow}
          >
            {addLabel}
          </button>
        ) : null}
      </div>
      {hint ? <p className="channel-discount-hint">{hint}</p> : null}
      <div className="channel-line-items-table-wrap">{children}</div>
    </div>
  )
}

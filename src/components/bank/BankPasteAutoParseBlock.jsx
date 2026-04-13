import React from 'react'

/**
 * 银行页通用：顶部大文本粘贴 + 自动识别按钮
 */
function BankPasteAutoParseBlock({ title = '粘贴银行文本自动识别', pasteText, onPasteTextChange, onAutoFill }) {
  return (
    <div className="bank-paste-auto-parse" style={{ marginBottom: 20 }}>
      <h3 className="bank-paste-auto-parse__title" style={{ fontSize: '1rem', margin: '0 0 8px' }}>
        {title}
      </h3>
      <textarea
        className="admin-input"
        value={pasteText}
        onChange={(e) => onPasteTextChange(e.target.value)}
        rows={6}
        placeholder={'每行：字段名: 值 或 字段名：值'}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 120 }}
      />
      <div style={{ marginTop: 10 }}>
        <button type="button" className="rec-btn rec-btn--secondary" onClick={onAutoFill}>
          自动识别并填充
        </button>
      </div>
    </div>
  )
}

export default BankPasteAutoParseBlock

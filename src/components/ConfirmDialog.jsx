import React from 'react'
import './ConfirmDialog.css'

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = '确认', cancelText = '取消' }) {
  if (!isOpen) return null

  const isReactElement = React.isValidElement(message)

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className={`confirm-dialog ${isReactElement ? 'large' : ''}`} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {isReactElement ? <div className="dialog-message">{message}</div> : <p>{message}</p>}
        <div className="dialog-buttons">
          <button className="cancel-btn" onClick={onCancel}>{cancelText}</button>
          <button className="confirm-btn" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog


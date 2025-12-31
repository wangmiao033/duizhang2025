import React from 'react'
import './LoadingSpinner.css'

function LoadingSpinner({ size = 'medium', text = '加载中...' }) {
  return (
    <div className="loading-spinner-container">
      <div className={`spinner spinner-${size}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}

export default LoadingSpinner


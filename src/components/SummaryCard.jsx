import React from 'react'
import './SummaryCard.css'

function SummaryCard({ title, value, icon }) {
  return (
    <div className="summary-card">
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3>{title}</h3>
        <p className="card-value">{value}</p>
      </div>
    </div>
  )
}

export default SummaryCard


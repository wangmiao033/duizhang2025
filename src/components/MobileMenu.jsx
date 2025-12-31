import React, { useState } from 'react'
import './MobileMenu.css'

function MobileMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="菜单"
      >
        {isOpen ? '✕' : '☰'}
      </button>
      
      {isOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setIsOpen(false)} />
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default MobileMenu


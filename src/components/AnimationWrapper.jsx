import React from 'react'
import './AnimationWrapper.css'

function AnimationWrapper({ children, delay = 0 }) {
  return (
    <div 
      className="animation-wrapper"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default AnimationWrapper


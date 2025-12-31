import React, { useState } from 'react'
import './DragSort.css'

function DragSort({ records, onReorder }) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newRecords = [...records]
    const draggedItem = newRecords[draggedIndex]
    newRecords.splice(draggedIndex, 1)
    newRecords.splice(dropIndex, 0, draggedItem)

    if (onReorder) {
      onReorder(newRecords)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="drag-sort-hint">
      <span className="drag-icon">↕️</span>
      <span>拖拽行首可调整顺序</span>
    </div>
  )
}

export default DragSort


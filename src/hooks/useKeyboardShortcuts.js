import { useEffect } from 'react'

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 检查是否按下了Ctrl或Cmd键
      const isModifierPressed = e.ctrlKey || e.metaKey
      
      // 遍历所有快捷键配置
      Object.entries(shortcuts).forEach(([key, handler]) => {
        const [modifier, keyCode] = key.split('+')
        
        if (modifier === 'ctrl' && isModifierPressed && e.key === keyCode) {
          e.preventDefault()
          handler()
        } else if (modifier === 'key' && e.key === keyCode) {
          e.preventDefault()
          handler()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}


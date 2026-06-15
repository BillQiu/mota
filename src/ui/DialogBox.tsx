import { useCallback, useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function DialogBox() {
  const dialog = useGameStore((s) => s.dialog)
  const close = useGameStore((s) => s.closeDialog)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [dialog])

  const advance = useCallback(() => {
    if (!dialog) return
    setIdx((i) => {
      if (i + 1 < dialog.lines.length) return i + 1
      close()
      return 0
    })
  }, [dialog, close])

  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      } else if (e.key === 'Escape') {
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, advance, close])

  if (!dialog) return null
  const last = idx + 1 >= dialog.lines.length
  return (
    <div className="dialog-mask" onClick={advance}>
      <div className="dialog-box">
        {dialog.speaker && <div className="dialog-speaker">{dialog.speaker}</div>}
        <div className="dialog-text">{dialog.lines[idx]}</div>
        <div className="dialog-hint">{last ? '✕ 关闭（空格）' : '▼ 继续（空格）'}</div>
      </div>
    </div>
  )
}

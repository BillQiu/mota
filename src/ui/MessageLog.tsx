import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export function MessageLog() {
  const logs = useGameStore((s) => s.logs)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])
  return (
    <div className="log" ref={ref}>
      {logs.length === 0 && <div className="log-empty">方向键 / WASD 移动，点击地图自动寻路</div>}
      {logs.map((l) => (
        <div key={l.id} className={`log-line ${l.kind}`}>
          {l.text}
        </div>
      ))}
    </div>
  )
}

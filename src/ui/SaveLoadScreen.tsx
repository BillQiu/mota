import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { AUTO_SLOT, deleteSave, listSaves } from '../core/save'

const MANUAL_SLOTS = ['存档1', '存档2', '存档3', '存档4', '存档5']

function fmtTime(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function SaveLoadScreen() {
  const panel = useGameStore((s) => s.panel)
  const close = useGameStore((s) => s.closePanel)
  const save = useGameStore((s) => s.save)
  const load = useGameStore((s) => s.load)
  const [, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  useEffect(() => {
    if (panel !== 'saves') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel, close])

  if (panel !== 'saves') return null

  const metas = listSaves()
  const metaOf = (slot: string) => metas.find((m) => m.slot === slot)

  const Row = ({ slot, isAuto }: { slot: string; isAuto?: boolean }) => {
    const meta = metaOf(slot)
    return (
      <div className="save-row">
        <div className="save-info">
          <div className="save-slot">{isAuto ? '自动存档' : slot}</div>
          {meta ? (
            <div className="save-meta">
              第 {meta.floor} 层 · HP {meta.hp} · {meta.steps} 步 · {fmtTime(meta.savedAt)}
            </div>
          ) : (
            <div className="save-meta empty">— 空 —</div>
          )}
        </div>
        <div className="save-actions">
          {!isAuto && (
            <button
              className="btn small"
              onClick={() => {
                save(slot)
                refresh()
              }}
            >
              存
            </button>
          )}
          <button
            className="btn small"
            disabled={!meta}
            onClick={() => {
              if (load(slot)) close()
            }}
          >
            读
          </button>
          {!isAuto && (
            <button
              className="btn small danger"
              disabled={!meta}
              onClick={() => {
                deleteSave(slot)
                refresh()
              }}
            >
              删
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel-mask" onClick={close}>
      <div className="panel-box" onClick={(e) => e.stopPropagation()}>
        <div className="panel-title">💾 存档 / 读档</div>
        <div className="save-list">
          <Row slot={AUTO_SLOT} isAuto />
          {MANUAL_SLOTS.map((s) => (
            <Row key={s} slot={s} />
          ))}
        </div>
        <button className="btn small panel-close" onClick={close}>
          关闭（Esc）
        </button>
      </div>
    </div>
  )
}

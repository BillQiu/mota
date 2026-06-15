import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { MapCanvas } from './render/MapCanvas'
import { Hud } from './ui/Hud'
import { MessageLog } from './ui/MessageLog'
import { DialogBox } from './ui/DialogBox'
import { TitleScreen } from './ui/TitleScreen'
import { ResultOverlay } from './ui/ResultOverlay'
import { ShopModal } from './ui/ShopModal'
import { MonsterManual } from './ui/MonsterManual'
import { SaveLoadScreen } from './ui/SaveLoadScreen'
import type { Direction } from './core/types'
import './App.css'

const KEY_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
}

export default function App() {
  const screen = useGameStore((s) => s.screen)
  const move = useGameStore((s) => s.move)
  const toTitle = useGameStore((s) => s.toTitle)
  const openPanel = useGameStore((s) => s.openPanel)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== 'playing') return
      const s = useGameStore.getState()
      const busy = s.dialog || s.shop || s.panel !== 'none'
      if ((e.key === 'x' || e.key === 'X') && !busy) {
        openPanel('manual')
        return
      }
      const dir = KEY_DIR[e.key]
      if (dir) {
        e.preventDefault()
        move(dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, move, openPanel])

  if (screen === 'title') {
    return (
      <div className="app">
        <TitleScreen />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="game-layout">
        <div className="game-left">
          <MapCanvas />
        </div>
        <div className="game-right">
          <Hud />
          <MessageLog />
          <div className="toolbar">
            <button className="btn small" onClick={() => openPanel('manual')}>
              手册
            </button>
            <button className="btn small" onClick={() => openPanel('saves')}>
              存读档
            </button>
            <button className="btn small" onClick={toTitle}>
              标题
            </button>
          </div>
        </div>
      </div>
      <DialogBox />
      <ShopModal />
      <MonsterManual />
      <SaveLoadScreen />
      <ResultOverlay />
    </div>
  )
}

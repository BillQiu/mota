import { useGameStore } from '../store/gameStore'
import type { KeyColor } from '../core/types'

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${cls}`}>{value}</span>
    </div>
  )
}

const KEY_BG: Record<KeyColor, string> = {
  yellow: '#f1c40f',
  blue: '#3498db',
  red: '#e74c3c',
  green: '#2ecc71',
}

function KeyChip({ color, n }: { color: KeyColor; n: number }) {
  return (
    <div className="keychip" style={{ background: KEY_BG[color] }}>
      <span>匙</span>
      <span className="keychip-n">{n}</span>
    </div>
  )
}

export function Hud() {
  const game = useGameStore((s) => s.game)
  if (!game) return null
  const h = game.hero
  const map = game.maps[h.floor]
  return (
    <div className="hud">
      <div className="hud-floor">{map?.name ?? `第 ${h.floor} 层`}</div>
      <Stat label="生命" value={h.hp} cls="hp" />
      <Stat label="攻击" value={h.atk} cls="atk" />
      <Stat label="防御" value={h.def} cls="def" />
      <Stat label="金币" value={h.gold} cls="gold" />
      <Stat label="经验" value={h.exp} cls="exp" />
      <div className="hud-keys">
        <KeyChip color="yellow" n={h.keys.yellow} />
        <KeyChip color="blue" n={h.keys.blue} />
        <KeyChip color="red" n={h.keys.red} />
        <KeyChip color="green" n={h.keys.green} />
      </div>
    </div>
  )
}

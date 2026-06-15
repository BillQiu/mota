import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { getBlock } from '../core/blocks'
import { MONSTERS } from '../data/monsters'
import { previewDamage } from '../core/combat'

export function MonsterManual() {
  const panel = useGameStore((s) => s.panel)
  const game = useGameStore((s) => s.game)
  const close = useGameStore((s) => s.closePanel)

  useEffect(() => {
    if (panel !== 'manual') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel, close])

  if (panel !== 'manual' || !game) return null

  const map = game.maps[game.hero.floor]
  const counts: Record<string, number> = {}
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const b = getBlock(map.tiles[y][x])
      if (b.cls === 'monster' && b.monsterId) counts[b.monsterId] = (counts[b.monsterId] ?? 0) + 1
    }
  }
  const rows = Object.entries(counts).map(([id, count]) => {
    const m = MONSTERS[id]
    const p = previewDamage(game.hero, m)
    return { m, count, p }
  })

  return (
    <div className="panel-mask" onClick={close}>
      <div className="panel-box" onClick={(e) => e.stopPropagation()}>
        <div className="panel-title">📖 怪物手册 · {map.name}</div>
        {rows.length === 0 ? (
          <div className="panel-empty">本层没有怪物</div>
        ) : (
          <table className="manual-table">
            <thead>
              <tr>
                <th>怪物</th>
                <th>生命</th>
                <th>攻击</th>
                <th>防御</th>
                <th>金币</th>
                <th>经验</th>
                <th>伤害</th>
                <th>数量</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, count, p }) => (
                <tr key={m.id}>
                  <td>
                    <span className="manual-glyph" style={{ background: m.color }}>
                      {m.glyph}
                    </span>
                    {m.name}
                  </td>
                  <td>{m.hp}</td>
                  <td>{m.atk}</td>
                  <td>{m.def}</td>
                  <td className="c-gold">{m.gold}</td>
                  <td className="c-exp">{m.exp}</td>
                  <td className={!p.canWin ? 'dmg-no' : p.lethal ? 'dmg-lethal' : 'dmg-ok'}>
                    {!p.canWin ? '打不过' : p.damage}
                  </td>
                  <td>×{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="btn small panel-close" onClick={close}>
          关闭（X / Esc）
        </button>
      </div>
    </div>
  )
}

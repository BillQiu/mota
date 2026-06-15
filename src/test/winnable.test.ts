import { describe, it, expect } from 'vitest'
import { initGame } from '../core/game'
import { autoSolve } from '../core/solver'
import { isPassable, getBlock } from '../core/blocks'
import { FLOORS } from '../data/floors'
import type { FloorMap } from '../core/types'

// ============================================================
// 导入塔的「结构完整性」回归测试
//   说明：导入的是 justinmzt/mota 的真实经典关卡（人工设计的硬塔），
//   钥匙管理/通关需要人类规划，贪心求解器无法证明，故这里验证结构完整：
//   楼层尺寸、楼梯链连通、起点、魔王层有公主与承接楼梯。
// ============================================================

const DIRS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
]

/** 从起点出发，可达的可交互物（钥匙/门/怪/道具/商店/楼梯）数量 —— 判断能否进展 */
function reachableInteractables(map: FloorMap, sx: number, sy: number): number {
  const seen = new Set<number>([sy * map.width + sx])
  const q: Array<[number, number]> = [[sx, sy]]
  const interact = new Set<number>()
  while (q.length) {
    const [x, y] = q.shift()!
    for (const [dx, dy] of DIRS) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue
      const k = ny * map.width + nx
      const cls = getBlock(map.tiles[ny][nx]).cls
      if (cls !== 'floor' && cls !== 'wall' && cls !== 'special') interact.add(k)
      if (seen.has(k)) continue
      if (!isPassable(map.tiles[ny][nx])) continue
      seen.add(k)
      q.push([nx, ny])
    }
  }
  return interact.size
}

function has(map: FloorMap, cls: string): boolean {
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) if (getBlock(map.tiles[y][x]).cls === cls) return true
  return false
}

describe('导入塔结构完整性', () => {
  const s = initGame(FLOORS)

  it('所有楼层 11×11 且矩形', () => {
    for (const f of FLOORS) {
      const m = s.maps[f.floor]
      expect(m.height).toBe(11)
      for (const row of m.tiles) expect(row.length).toBe(11)
    }
  })

  it('勇士落在第 1 层起点且能开始进展', () => {
    expect(s.hero.floor).toBe(1)
    expect(s.status).toBe('playing')
    const m = s.maps[1]
    // 起点应能接触到可交互物（钥匙/门/怪/道具/商店/楼梯），而非被完全封死
    expect(reachableInteractables(m, s.hero.x, s.hero.y)).toBeGreaterThan(0)
  })

  it('楼梯链完整：非顶层都有上楼梯，2 层及以上都有下楼梯', () => {
    const top = FLOORS.length
    for (const f of FLOORS) {
      const m = s.maps[f.floor]
      if (f.floor < top) expect(has(m, 'stairUp')).toBe(true)
      if (f.floor > 1) expect(has(m, 'stairDown')).toBe(true)
    }
  })

  it('魔王殿有公主(胜利点)且有魔王把守', () => {
    const boss = s.maps[FLOORS.length]
    expect(boss.name).toBe('魔王殿')
    let hasPrincess = false
    let hasDemon = false
    for (let y = 0; y < boss.height; y++)
      for (let x = 0; x < boss.width; x++) {
        const b = getBlock(boss.tiles[y][x])
        if (b.win) hasPrincess = true
        if (b.monsterId === 'demonKing') hasDemon = true
      }
    expect(hasPrincess).toBe(true)
    expect(hasDemon).toBe(true)
  })

  it('全 24 层可通关（跨层求解器自动通关证明）', () => {
    const r = autoSolve(initGame(FLOORS))
    if (!r.won) {
      const h = r.state.hero
      console.error(`求解失败 stuck=${r.stuck} 第${h.floor}层 HP=${h.hp} ATK=${h.atk} DEF=${h.def}`)
    }
    expect(r.won).toBe(true)
    expect(r.state.hero.floor).toBe(24)
  })
})

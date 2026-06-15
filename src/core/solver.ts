import type { Direction, GameState } from './types'
import { getBlock } from './blocks'
import { MONSTERS } from '../data/monsters'
import { calcCombat } from './combat'
import { buyFromShop, tryMove } from './game'
import { GOLD_SHOP } from '../data/shops'

// ============================================================
// 全塔跨层求解器（贪心 + 钥匙保守 + 商店补给）
//   - 每步在「整座已探索的塔」里找最高优先级可达目标（BFS 穿楼梯跨层）
//   - 优先级：公主 > 钥匙 > 道具 > 可击杀且不致命的怪 > 商店 > 开门
//     （开门最低 => 先穷尽免费进展、囤钥匙，只在无路时才花钥匙，最大化通关率）
//   - 到商店补钥匙与属性
//   - 每步重规划（re-plan），对楼梯传送鲁棒
// ============================================================

const PRIO = { win: 100, key: 55, item: 50, monster: 40, shop: 20, door: 10 }
// 攒够这么多金币才进店（≥蓝钥匙价），避免零钱被黄钥匙/补血消耗掉、攒不出贵钥匙
const SHOP_TARGET_GOLD = 20

const DIRS: Array<{ dir: Direction; dx: number; dy: number }> = [
  { dir: 'up', dx: 0, dy: -1 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'right', dx: 1, dy: 0 },
]

interface Target {
  prio: number
  kind: 'normal' | 'shop'
  dist: number
  firstDir: Direction
}

function findStair(state: GameState, floor: number, cls: 'stairUp' | 'stairDown') {
  const m = state.maps[floor]
  if (!m) return null
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) if (getBlock(m.tiles[y][x]).cls === cls) return { x, y }
  return null
}

/** 评估某格作为目标的优先级（-1 表示非目标） */
function cellPrio(state: GameState, floor: number, x: number, y: number): { prio: number; kind: 'normal' | 'shop' } {
  const b = getBlock(state.maps[floor].tiles[y][x])
  const hero = state.hero
  if (b.win) return { prio: PRIO.win, kind: 'normal' }
  if (b.cls === 'key') return { prio: PRIO.key, kind: 'normal' }
  if (b.cls === 'item') return { prio: PRIO.item, kind: 'normal' }
  if (b.cls === 'monster' && b.monsterId) {
    const r = calcCombat(hero, MONSTERS[b.monsterId])
    // 留出血量缓冲，避免被小怪一点点磨死（保命）
    if (r.canWin && r.damage < hero.hp * 0.5) return { prio: PRIO.monster, kind: 'normal' }
  }
  if (b.cls === 'shop' && hero.gold >= SHOP_TARGET_GOLD) return { prio: PRIO.shop, kind: 'shop' }
  if (b.cls === 'door' && b.doorColor && hero.keys[b.doorColor] > 0) {
    // 钥匙非常充裕时才积极开门取门后战利品，否则保守（仅最后手段，节约钥匙）
    const rich = hero.keys[b.doorColor] >= 8
    return { prio: rich ? PRIO.item : PRIO.door, kind: 'normal' }
  }
  return { prio: -1, kind: 'normal' }
}

/** 全塔 BFS，返回最优可达目标（含到达它的第一步方向） */
function findGlobalTarget(state: GameState): Target | null {
  const hero = state.hero
  const key = (f: number, x: number, y: number) => f * 100000 + y * 1000 + x
  const visited = new Set<number>([key(hero.floor, hero.x, hero.y)])
  interface Node {
    floor: number
    x: number
    y: number
    dist: number
    firstDir: Direction | null
  }
  const queue: Node[] = [{ floor: hero.floor, x: hero.x, y: hero.y, dist: 0, firstDir: null }]
  let best: Target | null = null

  const consider = (prio: number, kind: 'normal' | 'shop', dist: number, firstDir: Direction) => {
    if (prio < 0) return
    if (!best || prio > best.prio || (prio === best.prio && dist < best.dist)) {
      best = { prio, kind, dist, firstDir }
    }
  }

  while (queue.length) {
    const node = queue.shift()!
    const map = state.maps[node.floor]

    for (const { dir, dx, dy } of DIRS) {
      const nx = node.x + dx
      const ny = node.y + dy
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue
      const fd = node.firstDir ?? dir
      const id = map.tiles[ny][nx]
      const block = getBlock(id)

      // 作为目标考察（即使不可通行）
      const { prio, kind } = cellPrio(state, node.floor, nx, ny)
      if (prio >= 0) consider(prio, kind, node.dist + 1, fd)

      // 可通行则继续扩展
      if (block.passable) {
        const k = key(node.floor, nx, ny)
        if (!visited.has(k)) {
          visited.add(k)
          queue.push({ floor: node.floor, x: nx, y: ny, dist: node.dist + 1, firstDir: fd })
        }
      }
    }

    // 楼梯传送（非起点节点，firstDir 已确定）
    if (node.firstDir !== null) {
      const here = getBlock(map.tiles[node.y][node.x])
      let toFloor = -1
      let landing = null
      if (here.cls === 'stairUp') {
        toFloor = node.floor + 1
        landing = findStair(state, toFloor, 'stairDown')
      } else if (here.cls === 'stairDown') {
        toFloor = node.floor - 1
        landing = findStair(state, toFloor, 'stairUp')
      }
      if (landing && state.maps[toFloor]) {
        const k = key(toFloor, landing.x, landing.y)
        if (!visited.has(k)) {
          visited.add(k)
          queue.push({ floor: toFloor, x: landing.x, y: landing.y, dist: node.dist + 1, firstDir: node.firstDir })
        }
      }
    }
  }

  return best
}

/** 在商店补给：买蓝/红钥匙 + 攻防血，余钱全换黄钥匙（确保金币耗尽，避免反复进店空转） */
function buyAtShop(state: GameState): GameState {
  let s = state
  const buy = (id: string) => {
    const o = GOLD_SHOP.find((x) => x.id === id && s.hero.gold >= x.cost)
    if (!o) return false
    s = buyFromShop(s, o).state
    return true
  }
  // 1) 最优先：囤蓝/红钥匙（稀缺、锁楼梯，留足库存）
  while (s.hero.keys.blue < 3 && buy('keyB')) {}
  while (s.hero.keys.red < 2 && buy('keyR')) {}
  // 2) 低血补血（保命）
  let healGuard = 0
  while (s.hero.hp < 400 && healGuard++ < 50 && buy('hp')) {}
  // 3) 较富裕时买攻防
  const rot = ['atk', 'def']
  let r = 0
  let guard = 0
  while (s.hero.gold >= 40 && guard++ < 300) {
    // 保留一点金币给钥匙
    if (!buy(rot[r % rot.length])) break
    r++
  }
  // 4) 余钱换黄钥匙（最便宜），把金币花到阈值以下避免反复进店空转
  let g2 = 0
  while (buy('keyY') && g2++ < 300) {}
  return s
}

/** 求解器单步：做一个决策（移动一步 / 补给）。无法推进时返回 null。可用于「一键自动」动画。 */
export function solveStep(state: GameState): GameState | null {
  if (state.status !== 'playing') return null
  const target = findGlobalTarget(state)
  if (!target) return null
  if (target.kind === 'shop' && target.dist === 1) {
    // 紧挨商店：直接补给（撞商店不会移动）
    return buyAtShop(state)
  }
  return tryMove(state, target.firstDir).state
}

export interface SolveResult {
  won: boolean
  state: GameState
  iterations: number
  stuck: boolean
}

export function autoSolve(initial: GameState, maxIter = 20000): SolveResult {
  let state = initial
  for (let iter = 0; iter < maxIter; iter++) {
    if (state.status === 'victory') return { won: true, state, iterations: iter, stuck: false }
    if (state.status === 'gameover') return { won: false, state, iterations: iter, stuck: false }
    const next = solveStep(state)
    if (next === null) return { won: false, state, iterations: iter, stuck: true }
    state = next
  }
  return { won: state.status === 'victory', state, iterations: maxIter, stuck: false }
}

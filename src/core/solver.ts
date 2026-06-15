import type { Direction, GameState } from './types'
import { getBlock } from './blocks'
import { findPath } from './pathfind'
import { MONSTERS } from '../data/monsters'
import { calcCombat } from './combat'
import { buyFromShop, tryMove } from './game'
import { GOLD_SHOP } from '../data/shops'

// ============================================================
// 贪心自动求解器
//   - 用于「可通关性」回归测试，也可作为「自动探索」QoL 的内核
//   - 策略：每步选当前层最高优先级且可达的交互目标
//     公主(胜利) > 道具/钥匙 > 可击杀且不致命的怪 > 有钥匙的门 > 上楼
//   - 同优先级取最短路径
// ============================================================

const PRIO = {
  win: 100,
  item: 50,
  monster: 40,
  door: 30,
  shop: 20,
  stairUp: 10,
}

const MIN_SHOP_COST = Math.min(...GOLD_SHOP.map((o) => o.cost))

interface Target {
  x: number
  y: number
  prio: number
  kind: 'normal' | 'shop'
  path: Direction[]
}

function pickTarget(state: GameState): Target | null {
  const map = state.maps[state.hero.floor]
  const hero = state.hero
  let best: Target | null = null

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const b = getBlock(map.tiles[y][x])
      let prio = -1
      let kind: 'normal' | 'shop' = 'normal'
      if (b.win) prio = PRIO.win
      else if (b.cls === 'item' || b.cls === 'key') prio = PRIO.item
      else if (b.cls === 'monster' && b.monsterId) {
        const m = MONSTERS[b.monsterId]
        const r = calcCombat(hero, m)
        if (r.canWin && r.damage < hero.hp) prio = PRIO.monster // 可击杀且不致命
      } else if (b.cls === 'door' && b.doorColor) {
        if (hero.keys[b.doorColor] > 0) prio = PRIO.door
      } else if (b.cls === 'shop') {
        if (hero.gold >= MIN_SHOP_COST) {
          prio = PRIO.shop
          kind = 'shop'
        }
      } else if (b.cls === 'stairUp') {
        prio = PRIO.stairUp
      }
      if (prio < 0) continue

      const path = findPath(map, { x: hero.x, y: hero.y }, { x, y })
      if (!path) continue

      if (
        !best ||
        prio > best.prio ||
        (prio === best.prio && path.length < best.path.length)
      ) {
        best = { x, y, prio, kind, path }
      }
    }
  }
  return best
}

export interface SolveResult {
  won: boolean
  state: GameState
  iterations: number
  stuck: boolean
}

export function autoSolve(initial: GameState, maxIter = 10000): SolveResult {
  let state = initial
  for (let iter = 0; iter < maxIter; iter++) {
    if (state.status === 'victory') return { won: true, state, iterations: iter, stuck: false }
    if (state.status === 'gameover') return { won: false, state, iterations: iter, stuck: false }

    const target = pickTarget(state)
    if (!target) return { won: false, state, iterations: iter, stuck: true }

    for (const dir of target.path) {
      const before = state.hero
      state = tryMove(state, dir).state
      if (state.status !== 'playing') break
      const after = state.hero
      if (after.floor !== before.floor) break // 上楼了，重新评估
      if (after.x === before.x && after.y === before.y) break // 交互完成（撞门/撞怪/到商店未移动）
    }

    // 到达商店：把金币花在 攻/防/血 上（轮转，代表聪明玩家）
    if (target.kind === 'shop') {
      const rotation = ['atk', 'def', 'hp']
      let i = 0
      while (state.hero.gold >= MIN_SHOP_COST) {
        const want = rotation[i % rotation.length]
        const opt = GOLD_SHOP.find((o) => o.id === want && state.hero.gold >= o.cost)
        const fallback = GOLD_SHOP.find((o) => state.hero.gold >= o.cost)
        const chosen = opt ?? fallback
        if (!chosen) break
        state = buyFromShop(state, chosen).state
        i++
      }
    }
  }
  return { won: state.status === 'victory', state, iterations: maxIter, stuck: false }
}

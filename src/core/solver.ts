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
  shop: 20,
  stairUp: 10,
  door: 5, // 最低：先穷尽免费进展，只在无路时才花钥匙开门（节约钥匙）
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

    // 到达商店：先囤钥匙（破解钥匙死锁），再把余钱买攻/防/血
    if (target.kind === 'shop') {
      const buy = (id: string) => {
        const o = GOLD_SHOP.find((x) => x.id === id && state.hero.gold >= x.cost)
        if (!o) return false
        state = buyFromShop(state, o).state
        return true
      }
      for (let k = 0; k < 4; k++) buy('keyY')
      buy('keyB')
      buy('keyR')
      const rot = ['atk', 'def', 'hp']
      let r = 0
      let guard = 0
      while (state.hero.gold >= MIN_SHOP_COST && guard++ < 300) {
        if (!buy(rot[r % rot.length])) break
        r++
      }
    }
  }
  return { won: state.status === 'victory', state, iterations: maxIter, stuck: false }
}

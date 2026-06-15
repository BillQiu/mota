import { describe, it, expect } from 'vitest'
import { initGame } from '../core/game'
import { autoSolve } from '../core/solver'
import { FLOORS } from '../data/floors'

describe('整座塔可通关（贪心求解器回归）', () => {
  it('从第 1 层贪心探索能到达胜利', () => {
    const result = autoSolve(initGame(FLOORS))
    const h = result.state.hero
    if (!result.won) {
      // 失败时给出诊断信息
      console.error(
        `求解失败: stuck=${result.stuck}, 卡在第 ${h.floor} 层 (${h.x},${h.y}), 状态=${result.state.status}, HP=${h.hp} ATK=${h.atk} DEF=${h.def} 金=${h.gold}`,
      )
    }
    expect(result.won).toBe(true)
  })
})

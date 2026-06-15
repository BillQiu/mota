import { describe, it, expect } from 'vitest'
import { buyFromShop, initGame } from '../core/game'
import { FLOORS } from '../data/floors'
import type { ShopOption } from '../core/types'

const atkOpt: ShopOption = { id: 'atk', label: '攻击 +4', cost: 25, effect: { atk: 4 } }

describe('buyFromShop', () => {
  it('金币足够：扣金币并加属性', () => {
    let s = initGame(FLOORS)
    s = { ...s, hero: { ...s.hero, gold: 100, atk: 10 } }
    const { state, events } = buyFromShop(s, atkOpt)
    expect(state.hero.gold).toBe(75)
    expect(state.hero.atk).toBe(14)
    expect(events.some((e) => e.type === 'message')).toBe(true)
  })

  it('金币不足：状态不变', () => {
    let s = initGame(FLOORS)
    s = { ...s, hero: { ...s.hero, gold: 10, atk: 10 } }
    const { state } = buyFromShop(s, atkOpt)
    expect(state.hero.gold).toBe(10)
    expect(state.hero.atk).toBe(10)
  })

  it('生命选项：加血', () => {
    let s = initGame(FLOORS)
    s = { ...s, hero: { ...s.hero, gold: 25, hp: 1000 } }
    const { state } = buyFromShop(s, { id: 'hp', label: '生命 +800', cost: 25, effect: { hp: 800 } })
    expect(state.hero.hp).toBe(1800)
    expect(state.hero.gold).toBe(0)
  })
})

import { describe, it, expect } from 'vitest'
import { calcCombat, previewDamage } from '../core/combat'
import type { MonsterDef } from '../core/types'

const monster = (o: Partial<MonsterDef>): MonsterDef => ({
  id: 'm',
  name: 'M',
  hp: 0,
  atk: 0,
  def: 0,
  gold: 0,
  exp: 0,
  ...o,
})

describe('calcCombat（经典标准模型）', () => {
  it('勇士先手，正常击杀', () => {
    // atk20 def5 vs hp50 atk20 def1
    // heroPerRound=19, rounds=ceil(50/19)=3, monsterPerRound=15, damage=(3-1)*15=30
    const r = calcCombat({ atk: 20, def: 5 }, monster({ hp: 50, atk: 20, def: 1 }))
    expect(r.canWin).toBe(true)
    expect(r.heroPerRound).toBe(19)
    expect(r.monsterPerRound).toBe(15)
    expect(r.rounds).toBe(3)
    expect(r.damage).toBe(30)
  })

  it('攻击 ≤ 防御 => 无法击杀', () => {
    const r = calcCombat({ atk: 10, def: 5 }, monster({ hp: 100, atk: 30, def: 10 }))
    expect(r.canWin).toBe(false)
    expect(r.damage).toBe(Infinity)
  })

  it('防御足够高 => 零伤害一回合击杀', () => {
    const r = calcCombat({ atk: 100, def: 100 }, monster({ hp: 50, atk: 20, def: 1 }))
    expect(r.rounds).toBe(1)
    expect(r.damage).toBe(0)
  })

  it('整除回合数', () => {
    // heroPerRound=10, hp=100 => rounds=10, monsterPerRound=5 => damage=(10-1)*5=45
    const r = calcCombat({ atk: 20, def: 5 }, monster({ hp: 100, atk: 10, def: 10 }))
    expect(r.rounds).toBe(10)
    expect(r.damage).toBe(45)
  })
})

describe('previewDamage（伤害预测）', () => {
  it('致命判定：损失 >= 当前生命', () => {
    const p = previewDamage({ atk: 20, def: 5, hp: 30 }, monster({ hp: 50, atk: 20, def: 1 }))
    expect(p.damage).toBe(30)
    expect(p.lethal).toBe(true)
  })

  it('非致命', () => {
    const p = previewDamage({ atk: 20, def: 5, hp: 1000 }, monster({ hp: 50, atk: 20, def: 1 }))
    expect(p.lethal).toBe(false)
  })

  it('无法击杀视为致命', () => {
    const p = previewDamage({ atk: 5, def: 5, hp: 1000 }, monster({ hp: 50, atk: 20, def: 10 }))
    expect(p.canWin).toBe(false)
    expect(p.lethal).toBe(true)
  })
})

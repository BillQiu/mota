import { describe, it, expect } from 'vitest'
import { initGame, tryMove } from '../core/game'
import type { GameState } from '../core/types'
import { FLOORS } from '../data/floors'
import { getBlock } from '../core/blocks'

describe('initGame', () => {
  it('加载所有楼层且尺寸为 11×11', () => {
    const s = initGame(FLOORS)
    expect(Object.keys(s.maps).length).toBe(FLOORS.length)
    for (const f of FLOORS) {
      expect(s.maps[f.floor].width).toBe(11)
      expect(s.maps[f.floor].height).toBe(11)
    }
  })

  it('勇士在第 1 层起点，初始属性正确', () => {
    const s = initGame(FLOORS)
    expect(s.hero.floor).toBe(1)
    expect(s.hero.hp).toBe(400)
    expect(s.hero.atk).toBe(10)
    expect(s.hero.def).toBe(10)
    expect(s.status).toBe('playing')
  })
})

// 在地图上找指定块的坐标
function find(s: GameState, floor: number, cls: string): { x: number; y: number } {
  const m = s.maps[floor]
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) if (getBlock(m.tiles[y][x]).cls === cls) return { x, y }
  throw new Error(`floor ${floor} 找不到 ${cls}`)
}

describe('tryMove 交互', () => {
  it('撞墙被阻挡，不移动', () => {
    const s = initGame(FLOORS)
    // 勇士起点在底部中央，向下应是墙
    const { state, events } = tryMove(s, 'down')
    expect(events.some((e) => e.type === 'blocked')).toBe(true)
    expect(state.hero.y).toBe(s.hero.y) // 未移动
    expect(state.hero.direction).toBe('down') // 但已转向
  })

  it('拾取钥匙后数量 +1，原格变地面', () => {
    let s = initGame(FLOORS)
    const key = find(s, 1, 'key')
    // 把勇士放到钥匙下方，向上撞钥匙
    s = { ...s, hero: { ...s.hero, x: key.x, y: key.y + 1 } }
    const before = s.hero.keys.yellow
    const { state, events } = tryMove(s, 'up')
    expect(events.some((e) => e.type === 'getKey')).toBe(true)
    expect(state.hero.keys.yellow).toBe(before + 1)
    expect(getBlock(state.maps[1].tiles[key.y][key.x]).cls).toBe('floor')
    expect(state.hero.x).toBe(key.x) // 走上去了
  })

  it('没钥匙撞门 => needKey 且不移动', () => {
    let s = initGame(FLOORS)
    const door = find(s, 1, 'door')
    s = { ...s, hero: { ...s.hero, x: door.x, y: door.y + 1, keys: { yellow: 0, blue: 0, red: 0, green: 0 } } }
    const { state, events } = tryMove(s, 'up')
    expect(events.some((e) => e.type === 'needKey')).toBe(true)
    expect(state.hero.y).toBe(door.y + 1)
  })

  it('有钥匙撞门 => 消耗钥匙、开门、走上去', () => {
    let s = initGame(FLOORS)
    const door = find(s, 1, 'door')
    s = { ...s, hero: { ...s.hero, x: door.x, y: door.y + 1, keys: { yellow: 1, blue: 0, red: 0, green: 0 } } }
    const { state, events } = tryMove(s, 'up')
    expect(events.some((e) => e.type === 'openDoor')).toBe(true)
    expect(state.hero.keys.yellow).toBe(0)
    expect(state.hero.x).toBe(door.x)
  })

  it('击杀弱怪：扣血、得金币经验、走上去', () => {
    let s = initGame(FLOORS)
    const mon = find(s, 1, 'monster') // 第1层是绿色史莱姆
    s = { ...s, hero: { ...s.hero, x: mon.x, y: mon.y + 1, atk: 100, def: 100 } }
    const { state, events } = tryMove(s, 'up')
    const battle = events.find((e) => e.type === 'battle')
    expect(battle).toBeTruthy()
    expect(state.hero.x).toBe(mon.x) // 击杀后走上去
    expect(state.hero.gold).toBeGreaterThan(0)
  })

  it('打不过的怪 => cannotWin 且不移动', () => {
    let s = initGame(FLOORS)
    const mon = find(s, 1, 'monster')
    s = { ...s, hero: { ...s.hero, x: mon.x, y: mon.y + 1, atk: 1, def: 1 } }
    const { state, events } = tryMove(s, 'up')
    expect(events.some((e) => e.type === 'cannotWin')).toBe(true)
    expect(state.hero.y).toBe(mon.y + 1)
  })

  it('缩放道具：红宝石加攻 = 当前楼层数', () => {
    const gemPickup = (floor: number) => {
      const s = initGame(FLOORS)
      s.hero.floor = floor
      s.hero.x = 5
      s.hero.y = 6
      const m = s.maps[floor]
      m.tiles[6][5] = 0 // 勇士脚下地面
      m.tiles[5][5] = 201 // 上方红宝石
      const before = s.hero.atk
      const { state } = tryMove(s, 'up')
      return state.hero.atk - before
    }
    expect(gemPickup(1)).toBe(1)
    expect(gemPickup(5)).toBe(5)
    expect(gemPickup(9)).toBe(9)
  })

  it('致命可撞 => 撞了就 gameover', () => {
    let s = initGame(FLOORS)
    const mon = find(s, 1, 'monster')
    // atk 刚好能砍，但血极低，撞上去会死
    s = { ...s, hero: { ...s.hero, x: mon.x, y: mon.y + 1, atk: 21, def: 1, hp: 1 } }
    const { state, events } = tryMove(s, 'up')
    expect(events.some((e) => e.type === 'gameover')).toBe(true)
    expect(state.status).toBe('gameover')
  })
})

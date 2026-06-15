import type {
  ActionResult,
  Direction,
  FloorData,
  FloorMap,
  GameEvent,
  GameState,
  Hero,
  KeyColor,
  ShopOption,
} from './types'
import { FLOOR_ID, getBlock } from './blocks'
import { MONSTERS } from '../data/monsters'
import { ITEMS } from '../data/items'
import { calcCombat } from './combat'

// ============================================================
// 游戏引擎：纯函数式状态机（每个动作返回新 state + 事件列表）
// ============================================================

export const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

/** 勇士初始属性（经典魔塔 1.1 风格） */
export function createHero(): Hero {
  return {
    x: 0,
    y: 0,
    floor: 1,
    direction: 'down',
    hp: 1000,
    atk: 10,
    def: 10,
    mdef: 0,
    gold: 0,
    exp: 0,
    level: 1,
    keys: { yellow: 0, blue: 0, red: 0 },
  }
}

function cloneTiles(tiles: number[][]): number[][] {
  return tiles.map((row) => row.slice())
}

function findBlockPos(map: FloorMap, predicate: (id: number) => boolean): { x: number; y: number } | null {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (predicate(map.tiles[y][x])) return { x, y }
    }
  }
  return null
}

/** 用楼层静态数据初始化一局游戏 */
export function initGame(floors: FloorData[]): GameState {
  const maps: Record<number, FloorMap> = {}
  for (const f of floors) {
    maps[f.floor] = {
      floor: f.floor,
      name: f.name,
      width: f.tiles[0]?.length ?? 0,
      height: f.tiles.length,
      tiles: cloneTiles(f.tiles),
    }
  }

  const hero = createHero()
  // 在第 1 层找起点（block 10），找不到就用 stairDown 或 (1,1)
  const f1 = maps[1]
  let start = f1 ? findBlockPos(f1, (id) => getBlock(id).cls === 'special' && getBlock(id).name === '起点') : null
  if (!start && f1) start = findBlockPos(f1, (id) => getBlock(id).cls === 'stairDown')
  hero.x = start?.x ?? 1
  hero.y = start?.y ?? 1
  hero.floor = 1
  // 起点格还原为地面
  if (f1 && start) f1.tiles[start.y][start.x] = FLOOR_ID

  return {
    hero,
    maps,
    flags: {},
    inventory: {},
    seenMonsters: [],
    maxFloorReached: 1,
    steps: 0,
    status: 'playing',
  }
}

/** 应用道具效果到勇士（返回新 hero） */
function applyItemEffect(hero: Hero, itemId: string): { hero: Hero; text: string } {
  const def = ITEMS[itemId]
  const h: Hero = { ...hero, keys: { ...hero.keys } }
  if (def?.effect) {
    const e = def.effect
    if (e.hp) h.hp += e.hp
    if (e.atk) h.atk += e.atk
    if (e.def) h.def += e.def
    if (e.mdef) h.mdef += e.mdef
    if (e.gold) h.gold += e.gold
    if (e.exp) h.exp += e.exp
    if (e.keyYellow) h.keys.yellow += e.keyYellow
    if (e.keyBlue) h.keys.blue += e.keyBlue
    if (e.keyRed) h.keys.red += e.keyRed
  }
  return { hero: h, text: def ? `获得 ${def.name}${def.text ? `（${def.text}）` : ''}` : '获得道具' }
}

/** 处理楼层切换（踏上楼梯） */
function changeFloor(state: GameState, toFloor: number, cameFrom: 'up' | 'down'): ActionResult {
  const target = state.maps[toFloor]
  const events: GameEvent[] = []
  if (!target) {
    // 没有目标层（如 1 层往下）—— 阻挡
    return { state, events: [{ type: 'blocked' }] }
  }
  // 上楼(cameFrom=up，踩 stairUp 去更高层) -> 落在目标层的 下楼梯
  // 下楼(cameFrom=down，踩 stairDown 去更低层) -> 落在目标层的 上楼梯
  const landCls = cameFrom === 'up' ? 'stairDown' : 'stairUp'
  const land = findBlockPos(target, (id) => getBlock(id).cls === landCls)
  const hero: Hero = { ...state.hero, keys: { ...state.hero.keys } }
  hero.floor = toFloor
  if (land) {
    hero.x = land.x
    hero.y = land.y
  }
  const maxFloorReached = Math.max(state.maxFloorReached, toFloor)
  events.push({ type: 'changeFloor', from: state.hero.floor, to: toFloor })
  return { state: { ...state, hero, maxFloorReached }, events }
}

/**
 * 尝试朝某方向移动一步（核心动作）。
 * 返回新状态与本次动作产生的事件。
 */
export function tryMove(state: GameState, direction: Direction): ActionResult {
  if (state.status !== 'playing') return { state, events: [] }

  const { hero } = state
  const map = state.maps[hero.floor]
  const { dx, dy } = DIR_DELTA[direction]
  const tx = hero.x + dx
  const ty = hero.y + dy

  // 先转向（即使撞墙也面向该方向）
  const facedHero: Hero = { ...hero, direction, keys: { ...hero.keys } }
  let nextState: GameState = { ...state, hero: facedHero }

  // 越界
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) {
    return { state: nextState, events: [{ type: 'blocked' }] }
  }

  const tileId = map.tiles[ty][tx]
  const block = getBlock(tileId)
  const events: GameEvent[] = []

  // 工具：移动一步后写入交互逻辑用的「移动并落到目标格」
  const moveOnto = (s: GameState): GameState => {
    const h: Hero = { ...s.hero, x: tx, y: ty, direction, keys: { ...s.hero.keys } }
    return { ...s, hero: h, steps: s.steps + 1 }
  }

  // 改某格为地面（拾取/开门/击杀后）
  const clearTile = (s: GameState): GameState => {
    const newMap: FloorMap = { ...map, tiles: cloneTiles(map.tiles) }
    newMap.tiles[ty][tx] = FLOOR_ID
    return { ...s, maps: { ...s.maps, [s.hero.floor]: newMap } }
  }

  switch (block.cls) {
    case 'floor':
    case 'decoration':
    case 'special': {
      if (block.win) {
        // 公主 / 胜利点
        return { state: { ...nextState, status: 'victory' }, events: [{ type: 'victory' }] }
      }
      if (!block.passable) {
        return { state: nextState, events: [{ type: 'blocked' }] }
      }
      nextState = moveOnto(nextState)
      return { state: nextState, events: triggerCellEvent(nextState, tx, ty, events) }
    }

    case 'wall':
      return { state: nextState, events: [{ type: 'blocked' }] }

    case 'stairUp': {
      // 踩上楼梯 -> 去更高层
      return changeFloor(moveOnto(nextState), hero.floor + 1, 'up')
    }
    case 'stairDown': {
      // 踩下楼梯 -> 去更低层
      return changeFloor(moveOnto(nextState), hero.floor - 1, 'down')
    }

    case 'key': {
      const color = block.keyColor as KeyColor
      const h: Hero = { ...facedHero, keys: { ...facedHero.keys } }
      h.keys[color] += 1
      let s: GameState = { ...nextState, hero: h }
      s = clearTile(s)
      s = moveOnto(s)
      events.push({ type: 'getKey', color })
      return { state: s, events }
    }

    case 'door': {
      const color = block.doorColor as KeyColor
      if (facedHero.keys[color] <= 0) {
        return { state: nextState, events: [{ type: 'needKey', color }] }
      }
      const h: Hero = { ...facedHero, keys: { ...facedHero.keys } }
      h.keys[color] -= 1
      let s: GameState = { ...nextState, hero: h }
      s = clearTile(s)
      s = moveOnto(s)
      events.push({ type: 'openDoor', color })
      return { state: s, events }
    }

    case 'item': {
      const itemId = block.itemId as string
      const def = ITEMS[itemId]
      let s: GameState = nextState
      if (def?.cls === 'tool') {
        // 工具进背包
        const inv = { ...s.inventory }
        inv[itemId] = (inv[itemId] ?? 0) + 1
        s = { ...s, inventory: inv }
        events.push({ type: 'getItem', itemId, text: `获得 ${def.name}` })
      } else {
        const applied = applyItemEffect(s.hero, itemId)
        s = { ...s, hero: applied.hero }
        events.push({ type: 'getItem', itemId, text: applied.text })
      }
      s = clearTile(s)
      s = moveOnto(s)
      return { state: s, events: triggerCellEvent(s, tx, ty, events) }
    }

    case 'monster': {
      const monsterId = block.monsterId as string
      const monster = MONSTERS[monsterId]
      const result = calcCombat(facedHero, monster)

      // 记录遭遇（怪物手册）
      const seen = nextState.seenMonsters.includes(monsterId)
        ? nextState.seenMonsters
        : [...nextState.seenMonsters, monsterId]
      nextState = { ...nextState, seenMonsters: seen }

      if (!result.canWin) {
        return {
          state: nextState,
          events: [{ type: 'cannotWin', monsterId, monsterName: monster.name }],
        }
      }

      const newHp = facedHero.hp - result.damage
      if (newHp <= 0) {
        // 致命可撞：撞了就死
        const dead: Hero = { ...facedHero, hp: 0 }
        return {
          state: { ...nextState, hero: dead, status: 'gameover' },
          events: [{ type: 'gameover', reason: `不敌 ${monster.name}` }],
        }
      }

      const h: Hero = {
        ...facedHero,
        hp: newHp,
        gold: facedHero.gold + monster.gold,
        exp: facedHero.exp + monster.exp,
        keys: { ...facedHero.keys },
      }
      let s: GameState = { ...nextState, hero: h }
      s = clearTile(s)
      s = moveOnto(s)
      events.push({
        type: 'battle',
        monsterId,
        monsterName: monster.name,
        damage: result.damage,
        gold: monster.gold,
        exp: monster.exp,
      })
      return { state: s, events }
    }

    case 'npc': {
      // NPC 对话（来自事件表），不走上去
      const ev = cellEvent(state, tx, ty)
      if (ev?.dialog) {
        events.push({ type: 'dialog', speaker: ev.dialog.speaker, lines: ev.dialog.lines })
        if (ev.setFlag) {
          nextState = { ...nextState, flags: { ...nextState.flags, [ev.setFlag]: true } }
        }
      } else {
        events.push({ type: 'message', text: '……' })
      }
      return { state: nextState, events }
    }

    case 'shop': {
      // 不走上去，打开商店
      return { state: nextState, events: [{ type: 'shop' }] }
    }

    default:
      return { state: nextState, events: [{ type: 'blocked' }] }
  }
}

/** 在商店购买一项（金币足够才成功） */
export function buyFromShop(state: GameState, option: ShopOption): ActionResult {
  const hero = state.hero
  if (hero.gold < option.cost) {
    return { state, events: [{ type: 'message', text: '金币不足' }] }
  }
  const h: Hero = { ...hero, keys: { ...hero.keys } }
  h.gold -= option.cost
  const e = option.effect
  if (e.hp) h.hp += e.hp
  if (e.atk) h.atk += e.atk
  if (e.def) h.def += e.def
  if (e.mdef) h.mdef += e.mdef
  return {
    state: { ...state, hero: h },
    events: [{ type: 'message', text: `购买 ${option.label}（-${option.cost} 金币）` }],
  }
}

/** 取某格的事件定义 */
function cellEvent(state: GameState, x: number, y: number) {
  // 事件表在 FloorData 上；这里通过 maps 暂不持有，留给后续接入剧情系统
  void state
  void x
  void y
  return undefined as undefined | { dialog?: { speaker?: string; lines: string[] }; setFlag?: string; once?: boolean }
}

/** 触发踩到某格后的事件（剧情），返回合并后的事件列表 */
function triggerCellEvent(state: GameState, x: number, y: number, events: GameEvent[]): GameEvent[] {
  const ev = cellEvent(state, x, y)
  if (ev?.dialog) {
    events.push({ type: 'dialog', speaker: ev.dialog.speaker, lines: ev.dialog.lines })
  }
  return events
}

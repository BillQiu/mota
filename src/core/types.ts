// ============================================================
// 魔塔核心类型定义（纯 TS，无 React 依赖）
// ============================================================

export type Direction = 'up' | 'down' | 'left' | 'right'

export type KeyColor = 'yellow' | 'blue' | 'red' | 'green'

/** 地块类别 —— 决定该格的交互逻辑 */
export type BlockCategory =
  | 'floor' // 地面（可走）
  | 'wall' // 墙（不可走）
  | 'door' // 门（需对应钥匙）
  | 'key' // 钥匙
  | 'stairUp' // 上楼梯
  | 'stairDown' // 下楼梯
  | 'monster' // 怪物
  | 'item' // 道具（宝石/血瓶/特殊道具）
  | 'npc' // NPC（对话/触发剧情）
  | 'shop' // 商店触发点
  | 'decoration' // 装饰（passable 决定能否走）
  | 'special' // 特殊机关（起点/终点/胜利点等）

/** 地块定义（数字 ID -> 这格是什么） */
export interface BlockDef {
  id: number
  cls: BlockCategory
  name: string
  /** 是否可以直接走过去（地面 true；墙/门/怪/道具 false，由各自逻辑处理后再决定） */
  passable: boolean
  doorColor?: KeyColor
  keyColor?: KeyColor
  monsterId?: string
  itemId?: string
  /** 无素材时的占位渲染色 */
  color?: string
  /** 占位渲染时格子中央显示的字符（如 怪→怪名首字、门→「门」） */
  glyph?: string
  /** 终点/胜利触发 */
  win?: boolean
}

/** 勇士状态 */
export interface Hero {
  x: number
  y: number
  floor: number
  direction: Direction
  hp: number
  atk: number
  def: number
  mdef: number // 魔防（复杂怪物机制预留）
  gold: number
  exp: number
  level: number
  keys: Record<KeyColor, number>
}

/** 怪物定义 */
export interface MonsterDef {
  id: string
  name: string
  hp: number
  atk: number
  def: number
  gold: number // 击杀获得金币
  exp: number // 击杀获得经验
  special?: number[] // 特殊属性 id（先攻/连击/魔攻… 后期机制）
  color?: string // 占位渲染色
  glyph?: string // 占位字符
}

/** 道具类别 */
export type ItemClass =
  | 'permanent' // 永久增益（宝石、装备）—— 拾取即生效
  | 'consumable' // 消耗品（血瓶、圣水）—— 拾取即生效
  | 'tool' // 工具（飞行器、怪物手册等）—— 进背包，主动使用
  | 'key' // 钥匙类

/** 道具定义 */
export interface ItemDef {
  id: string
  name: string
  cls: ItemClass
  /** 是否按当前楼层缩放效果（经典版宝石/血瓶：效果 × 楼层数） */
  scaling?: boolean
  /** 拾取时对勇士的即时效果 */
  effect?: Partial<{
    hp: number
    atk: number
    def: number
    mdef: number
    gold: number
    exp: number
    keyYellow: number
    keyBlue: number
    keyRed: number
  }>
  text?: string // 拾取/使用提示文案
  color?: string
  glyph?: string
}

/** 单层地图的「当前」状态（怪/门/道具被处理后会变化） */
export interface FloorMap {
  floor: number
  name: string
  width: number
  height: number
  tiles: number[][] // [y][x] = block id
}

/** 楼层静态数据（新游戏时克隆进 GameState.maps） */
export interface FloorData {
  floor: number
  name: string
  tiles: number[][]
  /** 事件表：key = "x,y" */
  events?: Record<string, FloorEvent>
}

/** 格子事件（剧情、触发器） */
export interface FloorEvent {
  /** 触发时显示的对话 */
  dialog?: { speaker?: string; lines: string[] }
  /** 一次性（触发后清除） */
  once?: boolean
  /** 触发后设置的 flag */
  setFlag?: string
}

/** 游戏整体状态 */
export interface GameState {
  hero: Hero
  maps: Record<number, FloorMap>
  flags: Record<string, number | boolean>
  inventory: Record<string, number> // 工具背包：itemId -> 数量
  seenMonsters: string[] // 怪物手册：已遭遇的怪
  maxFloorReached: number // 到达过的最高层（飞行器可达范围）
  steps: number // 总步数（统计/录像）
  status: GameStatus
}

export type GameStatus = 'playing' | 'gameover' | 'victory'

/** 引擎动作产生的事件（供 store / React / 音频层消费） */
export type GameEvent =
  | { type: 'message'; text: string }
  | { type: 'dialog'; speaker?: string; lines: string[] }
  | {
      type: 'battle'
      monsterId: string
      monsterName: string
      damage: number
      gold: number
      exp: number
    }
  | { type: 'getItem'; itemId: string; text: string }
  | { type: 'getKey'; color: KeyColor }
  | { type: 'openDoor'; color: KeyColor }
  | { type: 'needKey'; color: KeyColor }
  | { type: 'changeFloor'; from: number; to: number }
  | { type: 'blocked' }
  | { type: 'cannotWin'; monsterId: string; monsterName: string }
  | { type: 'levelUp'; level: number }
  | { type: 'gameover'; reason: string }
  | { type: 'victory' }
  | { type: 'shop' }
  | { type: 'sound'; name: string }

/** 商店选项 */
export interface ShopOption {
  id: string
  label: string
  cost: number
  effect: Partial<{ hp: number; atk: number; def: number; mdef: number }>
  /** 购买钥匙类选项 */
  key?: KeyColor
}

/** 引擎动作返回值 */
export interface ActionResult {
  state: GameState
  events: GameEvent[]
}

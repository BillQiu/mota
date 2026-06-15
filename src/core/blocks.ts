import type { BlockDef } from './types'
import { MONSTERS } from '../data/monsters'
import { ITEMS } from '../data/items'

// ============================================================
// 地块字典：数字 ID -> 这格是什么
// 约定区段：
//   0-49    静态块（地面/墙/门/钥匙/楼梯/特殊点）
//   101+    怪物块（固定映射到 monsterId）
//   201+    道具块（固定映射到 itemId）
// ============================================================

/** 静态块定义 */
const STATIC_BLOCKS: BlockDef[] = [
  { id: 0, cls: 'floor', name: '地面', passable: true, color: '#2b2b3a' },
  { id: 1, cls: 'wall', name: '墙', passable: false, color: '#6b5536' },
  { id: 2, cls: 'door', name: '黄门', passable: false, doorColor: 'yellow', color: '#f1c40f', glyph: '门' },
  { id: 3, cls: 'door', name: '蓝门', passable: false, doorColor: 'blue', color: '#3498db', glyph: '门' },
  { id: 4, cls: 'door', name: '红门', passable: false, doorColor: 'red', color: '#e74c3c', glyph: '门' },
  { id: 5, cls: 'key', name: '黄钥匙', passable: false, keyColor: 'yellow', color: '#f1c40f', glyph: '匙' },
  { id: 6, cls: 'key', name: '蓝钥匙', passable: false, keyColor: 'blue', color: '#3498db', glyph: '匙' },
  { id: 7, cls: 'key', name: '红钥匙', passable: false, keyColor: 'red', color: '#e74c3c', glyph: '匙' },
  { id: 8, cls: 'stairDown', name: '下楼梯', passable: true, color: '#7f8c8d', glyph: '下' },
  { id: 9, cls: 'stairUp', name: '上楼梯', passable: true, color: '#95a5a6', glyph: '上' },
  { id: 10, cls: 'special', name: '起点', passable: true, color: '#2b2b3a' },
  { id: 11, cls: 'special', name: '公主', passable: false, color: '#ff79c6', glyph: '公', win: true },
  { id: 12, cls: 'npc', name: 'NPC', passable: false, color: '#f39c12', glyph: '人' },
  { id: 20, cls: 'shop', name: '商店', passable: false, color: '#16a085', glyph: '商' },
  { id: 13, cls: 'decoration', name: '石柱', passable: false, color: '#4a4a55', glyph: '柱' },
]

/** 怪物 block id（固定映射，供楼层数据引用） */
export const MONSTER_BLOCK_IDS: Record<number, string> = {
  101: 'greenSlime',
  102: 'redSlime',
  103: 'blackSlime',
  104: 'bat',
  105: 'bigBat',
  106: 'redBat',
  107: 'skeleton',
  108: 'skeletonCaptain',
  109: 'zombie',
  110: 'zombieKing',
  111: 'slimeMan',
  112: 'bluePriest',
  113: 'redPriest',
  114: 'goblin',
  115: 'goblinKing',
  116: 'vampire',
  117: 'knight',
  118: 'demonKing',
}

/** 道具 block id（固定映射） */
export const ITEM_BLOCK_IDS: Record<number, string> = {
  201: 'redGem',
  202: 'blueGem',
  203: 'greenGem',
  204: 'sword1',
  205: 'shield1',
  206: 'sword2',
  207: 'shield2',
  208: 'redPotion',
  209: 'bluePotion',
  210: 'yellowPotion',
  211: 'greenPotion',
  212: 'fly',
  213: 'manual',
  214: 'cross',
  215: 'holyWater',
}

/** 反查：monsterId -> block id（数据构造时方便用） */
export const MONSTER_ID_TO_BLOCK: Record<string, number> = Object.fromEntries(
  Object.entries(MONSTER_BLOCK_IDS).map(([k, v]) => [v, Number(k)]),
)
export const ITEM_ID_TO_BLOCK: Record<string, number> = Object.fromEntries(
  Object.entries(ITEM_BLOCK_IDS).map(([k, v]) => [v, Number(k)]),
)

/** 组装完整地块字典 */
export const BLOCKS: Record<number, BlockDef> = (() => {
  const map: Record<number, BlockDef> = {}
  for (const b of STATIC_BLOCKS) map[b.id] = b

  for (const [idStr, monsterId] of Object.entries(MONSTER_BLOCK_IDS)) {
    const id = Number(idStr)
    const m = MONSTERS[monsterId]
    map[id] = {
      id,
      cls: 'monster',
      name: m.name,
      passable: false,
      monsterId,
      color: m.color,
      glyph: m.glyph,
    }
  }

  for (const [idStr, itemId] of Object.entries(ITEM_BLOCK_IDS)) {
    const id = Number(idStr)
    const it = ITEMS[itemId]
    map[id] = {
      id,
      cls: 'item',
      name: it.name,
      passable: false,
      itemId,
      color: it.color,
      glyph: it.glyph,
    }
  }

  return map
})()

export const FLOOR_ID = 0
export const WALL_ID = 1

export function getBlock(id: number): BlockDef {
  return BLOCKS[id] ?? BLOCKS[FLOOR_ID]
}

export function isPassable(id: number): boolean {
  return getBlock(id).passable
}

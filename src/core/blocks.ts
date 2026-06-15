import type { BlockDef } from './types'
import { MONSTERS } from '../data/monsters'
import { ITEMS } from '../data/items'
import { IMPORTED_MONSTER_BLOCKS } from '../data/imported'

// ============================================================
// 地块字典：数字 ID -> 这格是什么
//   0-49    静态块（地面/墙/门/钥匙/楼梯/特殊点）
//   101+    怪物块（来自导入数据 + 魔王）
//   201+    道具块
// ============================================================

const DOOR_SHEET = 'Event01-Door01.png'
const KEY_SHEET = 'Item01-01.png'

const STATIC_BLOCKS: BlockDef[] = [
  { id: 0, cls: 'floor', name: '地面', passable: true, sprite: { sheet: 'Other09.png', sx: 0, sy: 0 }, color: '#2b2b3a' },
  { id: 1, cls: 'wall', name: '墙', passable: false, sprite: { sheet: 'Event01-Wall01.png', sx: 0, sy: 0 }, color: '#6b5536' },
  { id: 2, cls: 'door', name: '黄门', passable: false, doorColor: 'yellow', sprite: { sheet: DOOR_SHEET, sx: 0, sy: 0 }, color: '#f1c40f', glyph: '门' },
  { id: 3, cls: 'door', name: '蓝门', passable: false, doorColor: 'blue', sprite: { sheet: DOOR_SHEET, sx: 32, sy: 0 }, color: '#3498db', glyph: '门' },
  { id: 4, cls: 'door', name: '红门', passable: false, doorColor: 'red', sprite: { sheet: DOOR_SHEET, sx: 64, sy: 0 }, color: '#e74c3c', glyph: '门' },
  { id: 15, cls: 'door', name: '绿门', passable: false, doorColor: 'green', sprite: { sheet: DOOR_SHEET, sx: 96, sy: 0 }, color: '#2ecc71', glyph: '门' },
  { id: 5, cls: 'key', name: '黄钥匙', passable: false, keyColor: 'yellow', sprite: { sheet: KEY_SHEET, sx: 0, sy: 0 }, color: '#f1c40f', glyph: '匙' },
  { id: 6, cls: 'key', name: '蓝钥匙', passable: false, keyColor: 'blue', sprite: { sheet: KEY_SHEET, sx: 32, sy: 0 }, color: '#3498db', glyph: '匙' },
  { id: 7, cls: 'key', name: '红钥匙', passable: false, keyColor: 'red', sprite: { sheet: KEY_SHEET, sx: 64, sy: 0 }, color: '#e74c3c', glyph: '匙' },
  { id: 16, cls: 'key', name: '绿钥匙', passable: false, keyColor: 'green', sprite: { sheet: KEY_SHEET, sx: 96, sy: 0 }, color: '#2ecc71', glyph: '匙' },
  { id: 8, cls: 'stairDown', name: '下楼梯', passable: true, sprite: { sheet: 'down_floor.png', sx: 0, sy: 0 }, color: '#7f8c8d', glyph: '下' },
  { id: 9, cls: 'stairUp', name: '上楼梯', passable: true, sprite: { sheet: 'up_floor.png', sx: 0, sy: 0 }, color: '#95a5a6', glyph: '上' },
  { id: 10, cls: 'special', name: '起点', passable: true, color: '#2b2b3a' },
  { id: 11, cls: 'special', name: '公主', passable: false, sprite: { sheet: 'NPC01-01.png', sx: 0, sy: 96 }, color: '#ff79c6', glyph: '公', win: true },
  { id: 12, cls: 'npc', name: 'NPC', passable: false, sprite: { sheet: 'NPC01-01.png', sx: 0, sy: 0 }, color: '#f39c12', glyph: '人' },
  { id: 13, cls: 'decoration', name: '石柱', passable: false, sprite: { sheet: 'Event01-Wall01.png', sx: 32, sy: 0 }, color: '#4a4a55', glyph: '柱' },
  { id: 20, cls: 'shop', name: '商店', passable: false, sprite: { sheet: 'NPC01-01.png', sx: 0, sy: 32 }, color: '#16a085', glyph: '商' },
]

/** 怪物 block id（导入数据 + 魔王 boss） */
export const MONSTER_BLOCK_IDS: Record<number, string> = {
  ...IMPORTED_MONSTER_BLOCKS,
  122: 'demonKing',
}

/** 道具 block id */
export const ITEM_BLOCK_IDS: Record<number, string> = {
  201: 'redGem',
  202: 'blueGem',
  208: 'redPotion',
  209: 'bluePotion',
}

export const MONSTER_ID_TO_BLOCK: Record<string, number> = Object.fromEntries(
  Object.entries(MONSTER_BLOCK_IDS).map(([k, v]) => [v, Number(k)]),
)
export const ITEM_ID_TO_BLOCK: Record<string, number> = Object.fromEntries(
  Object.entries(ITEM_BLOCK_IDS).map(([k, v]) => [v, Number(k)]),
)

export const BLOCKS: Record<number, BlockDef> = (() => {
  const map: Record<number, BlockDef> = {}
  for (const b of STATIC_BLOCKS) map[b.id] = b

  for (const [idStr, monsterId] of Object.entries(MONSTER_BLOCK_IDS)) {
    const id = Number(idStr)
    const m = MONSTERS[monsterId]
    if (!m) continue
    map[id] = { id, cls: 'monster', name: m.name, passable: false, monsterId, sprite: m.sprite, color: m.color, glyph: m.glyph }
  }

  for (const [idStr, itemId] of Object.entries(ITEM_BLOCK_IDS)) {
    const id = Number(idStr)
    const it = ITEMS[itemId]
    if (!it) continue
    map[id] = { id, cls: 'item', name: it.name, passable: false, itemId, sprite: it.sprite, color: it.color, glyph: it.glyph }
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

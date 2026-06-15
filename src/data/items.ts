import type { ItemDef } from '../core/types'

// ============================================================
// 道具表 —— 经典魔塔（justinmzt/mota）
//   宝石 / 血瓶按楼层缩放：效果 × 当前楼层数（scaling=true，base 为单位值）
//   红宝石 +楼层 攻击；蓝宝石 +楼层 防御；红瓶 回 50×楼层；蓝瓶 回 200×楼层
// ============================================================

export const ITEMS: Record<string, ItemDef> = {
  // —— 缩放宝石（base=1，实际 +楼层）——
  redGem: { id: 'redGem', name: '红宝石', cls: 'permanent', scaling: true, effect: { atk: 1 }, text: '攻击 +楼层', sprite: { sheet: 'Item01-Gem01.png', sx: 0, sy: 0 }, color: '#e74c3c', glyph: '攻' },
  blueGem: { id: 'blueGem', name: '蓝宝石', cls: 'permanent', scaling: true, effect: { def: 1 }, text: '防御 +楼层', sprite: { sheet: 'Item01-Gem01.png', sx: 32, sy: 0 }, color: '#3498db', glyph: '防' },

  // —— 缩放血瓶（base 50 / 200，实际 ×楼层）——
  redPotion: { id: 'redPotion', name: '红血瓶', cls: 'consumable', scaling: true, effect: { hp: 50 }, text: '生命 +50×楼层', sprite: { sheet: 'Item01-02.png', sx: 0, sy: 0 }, color: '#ff5a5a', glyph: '血' },
  bluePotion: { id: 'bluePotion', name: '蓝血瓶', cls: 'consumable', scaling: true, effect: { hp: 200 }, text: '生命 +200×楼层', sprite: { sheet: 'Item01-02.png', sx: 32, sy: 0 }, color: '#5a9aff', glyph: '血' },

  // —— 工具类（保留，供后续）——
  fly: { id: 'fly', name: '飞行器', cls: 'tool', text: '可飞往已到过的楼层', color: '#9b59b6', glyph: '飞' },
  manual: { id: 'manual', name: '怪物手册', cls: 'tool', text: '查看怪物属性与伤害', color: '#34495e', glyph: '册' },
}

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id]
}

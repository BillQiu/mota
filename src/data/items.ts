import type { ItemDef } from '../core/types'

// ============================================================
// 道具表 —— 经典魔塔风格（拾取即生效的增益 / 消耗品，以及工具类）
// ============================================================

export const ITEMS: Record<string, ItemDef> = {
  // —— 永久增益（宝石 / 装备）——
  redGem: { id: 'redGem', name: '红宝石', cls: 'permanent', effect: { atk: 3 }, text: '攻击 +3', color: '#e74c3c', glyph: '攻' },
  blueGem: { id: 'blueGem', name: '蓝宝石', cls: 'permanent', effect: { def: 3 }, text: '防御 +3', color: '#3498db', glyph: '防' },
  greenGem: { id: 'greenGem', name: '绿宝石', cls: 'permanent', effect: { mdef: 5 }, text: '魔防 +5', color: '#2ecc71', glyph: '魔' },
  sword1: { id: 'sword1', name: '铁剑', cls: 'permanent', effect: { atk: 10 }, text: '攻击 +10', color: '#bdc3c7', glyph: '剑' },
  shield1: { id: 'shield1', name: '铁盾', cls: 'permanent', effect: { def: 10 }, text: '防御 +10', color: '#95a5a6', glyph: '盾' },
  sword2: { id: 'sword2', name: '银剑', cls: 'permanent', effect: { atk: 30 }, text: '攻击 +30', color: '#ecf0f1', glyph: '剑' },
  shield2: { id: 'shield2', name: '银盾', cls: 'permanent', effect: { def: 30 }, text: '防御 +30', color: '#dfe6e9', glyph: '盾' },

  // —— 消耗品（血瓶 / 圣水）——
  redPotion: { id: 'redPotion', name: '红血瓶', cls: 'consumable', effect: { hp: 200 }, text: '生命 +200', color: '#ff5a5a', glyph: '血' },
  bluePotion: { id: 'bluePotion', name: '蓝血瓶', cls: 'consumable', effect: { hp: 500 }, text: '生命 +500', color: '#5a9aff', glyph: '血' },
  yellowPotion: { id: 'yellowPotion', name: '黄血瓶', cls: 'consumable', effect: { hp: 800 }, text: '生命 +800', color: '#ffd34a', glyph: '血' },
  greenPotion: { id: 'greenPotion', name: '绿血瓶', cls: 'consumable', effect: { hp: 1500 }, text: '生命 +1500', color: '#4ad36a', glyph: '血' },

  // —— 工具类（进背包，主动使用；逻辑在后续阶段实装）——
  fly: { id: 'fly', name: '飞行器', cls: 'tool', text: '可飞往已到过的楼层', color: '#9b59b6', glyph: '飞' },
  manual: { id: 'manual', name: '怪物手册', cls: 'tool', text: '查看怪物属性与伤害', color: '#34495e', glyph: '册' },
  cross: { id: 'cross', name: '十字架', cls: 'tool', text: '攻防翻倍（一次性）', color: '#f1c40f', glyph: '十' },
  holyWater: { id: 'holyWater', name: '圣水', cls: 'tool', text: '生命翻倍', color: '#1abc9c', glyph: '圣' },
}

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id]
}

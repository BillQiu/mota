import type { MonsterDef } from '../core/types'

// ============================================================
// 怪物表 —— 经典魔塔风格数值（数据驱动，可后续替换为源数据精确值）
// ============================================================

export const MONSTERS: Record<string, MonsterDef> = {
  greenSlime: { id: 'greenSlime', name: '绿色史莱姆', hp: 50, atk: 20, def: 1, gold: 1, exp: 1, color: '#3fb24f', glyph: '史' },
  redSlime: { id: 'redSlime', name: '红色史莱姆', hp: 70, atk: 15, def: 2, gold: 2, exp: 2, color: '#c0392b', glyph: '史' },
  blackSlime: { id: 'blackSlime', name: '黑色史莱姆', hp: 110, atk: 25, def: 3, gold: 3, exp: 3, color: '#2c2c34', glyph: '史' },
  bat: { id: 'bat', name: '小蝙蝠', hp: 55, atk: 35, def: 10, gold: 3, exp: 4, color: '#7d5ba6', glyph: '蝠' },
  bigBat: { id: 'bigBat', name: '大蝙蝠', hp: 90, atk: 50, def: 15, gold: 5, exp: 6, color: '#5b3b86', glyph: '蝠' },
  redBat: { id: 'redBat', name: '红蝙蝠', hp: 100, atk: 70, def: 20, gold: 8, exp: 9, color: '#a93226', glyph: '蝠' },
  skeleton: { id: 'skeleton', name: '骷髅人', hp: 120, atk: 30, def: 8, gold: 5, exp: 5, color: '#e8e8d8', glyph: '骷' },
  skeletonCaptain: { id: 'skeletonCaptain', name: '骷髅队长', hp: 200, atk: 65, def: 30, gold: 10, exp: 12, color: '#cfc9a8', glyph: '骷' },
  zombie: { id: 'zombie', name: '僵尸', hp: 150, atk: 50, def: 12, gold: 8, exp: 8, color: '#6b8e23', glyph: '尸' },
  zombieKing: { id: 'zombieKing', name: '僵尸王', hp: 450, atk: 100, def: 50, gold: 30, exp: 35, color: '#556b2f', glyph: '尸' },
  slimeMan: { id: 'slimeMan', name: '史莱姆人', hp: 300, atk: 75, def: 35, gold: 18, exp: 20, color: '#16a085', glyph: '史' },
  bluePriest: { id: 'bluePriest', name: '蓝衣法师', hp: 150, atk: 95, def: 40, gold: 15, exp: 16, color: '#2980b9', glyph: '法' },
  redPriest: { id: 'redPriest', name: '红衣法师', hp: 200, atk: 130, def: 50, gold: 25, exp: 28, color: '#c0392b', glyph: '法' },
  goblin: { id: 'goblin', name: '兽人', hp: 350, atk: 120, def: 55, gold: 22, exp: 24, color: '#8e6f3a', glyph: '兽' },
  goblinKing: { id: 'goblinKing', name: '兽人王', hp: 550, atk: 160, def: 70, gold: 40, exp: 45, color: '#6e5226', glyph: '兽' },
  vampire: { id: 'vampire', name: '吸血鬼', hp: 700, atk: 200, def: 90, gold: 55, exp: 60, color: '#7b241c', glyph: '吸' },
  knight: { id: 'knight', name: '黑暗骑士', hp: 900, atk: 250, def: 120, gold: 70, exp: 80, color: '#34495e', glyph: '骑' },
  demonKing: { id: 'demonKing', name: '魔王', hp: 20000, atk: 850, def: 350, gold: 0, exp: 0, color: '#900c3f', glyph: '魔' },
}

export function getMonster(id: string): MonsterDef | undefined {
  return MONSTERS[id]
}

import type { MonsterDef } from '../core/types'
import { IMPORTED_MONSTERS } from './imported'

// ============================================================
// 怪物表 = 导入的经典魔塔数据（justinmzt/mota）+ 追加最终 boss 魔王
// ============================================================

const BOSS: Record<string, MonsterDef> = {
  demonKing: { id: 'demonKing', name: '魔王', hp: 20000, atk: 600, def: 300, gold: 0, exp: 0, color: '#900c3f', glyph: '魔' },
}

export const MONSTERS: Record<string, MonsterDef> = { ...IMPORTED_MONSTERS, ...BOSS }

export function getMonster(id: string): MonsterDef | undefined {
  return MONSTERS[id]
}

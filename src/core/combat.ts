import type { MonsterDef } from './types'

// ============================================================
// 战斗结算（经典标准模型）
//   - 勇士先手、逐回合 (攻-防)、即时结算
//   - 勇士每回合对怪：max(0, 攻 - 怪防)
//   - 怪每回合对勇士：max(0, 怪攻 - 防)
//   - 击杀回合 n = ceil(怪生命 / 勇士每回合伤害)
//   - 勇士先手 => 怪只反击 (n-1) 次
//   - 勇士承受总伤害 = (n-1) * 怪每回合伤害
//   - 若勇士每回合伤害 <= 0 => 无法击杀（damage = Infinity）
// ============================================================

export interface CombatStats {
  atk: number
  def: number
  hp: number
}

export interface CombatResult {
  /** 能否击杀（勇士攻击 > 怪物防御） */
  canWin: boolean
  /** 勇士承受的总伤害（无法击杀时为 Infinity） */
  damage: number
  /** 击杀所需回合数 */
  rounds: number
  /** 勇士每回合对怪伤害 */
  heroPerRound: number
  /** 怪每回合对勇士伤害 */
  monsterPerRound: number
}

export function calcCombat(hero: Pick<CombatStats, 'atk' | 'def'>, monster: MonsterDef): CombatResult {
  const heroPerRound = Math.max(0, hero.atk - monster.def)
  const monsterPerRound = Math.max(0, monster.atk - hero.def)

  if (heroPerRound <= 0) {
    return {
      canWin: false,
      damage: Infinity,
      rounds: Infinity,
      heroPerRound,
      monsterPerRound,
    }
  }

  const rounds = Math.ceil(monster.hp / heroPerRound)
  const damage = (rounds - 1) * monsterPerRound

  return { canWin: true, damage, rounds, heroPerRound, monsterPerRound }
}

export interface DamagePreview {
  canWin: boolean
  /** 撞上去会损失的生命（无法击杀时 Infinity） */
  damage: number
  /** 是否致命（损失 >= 当前生命） */
  lethal: boolean
}

/** 伤害预测：撞上这只怪会损失多少血、是否致命（供 HUD / 怪物手册显示） */
export function previewDamage(hero: CombatStats, monster: MonsterDef): DamagePreview {
  const r = calcCombat(hero, monster)
  if (!r.canWin) return { canWin: false, damage: Infinity, lethal: true }
  return { canWin: true, damage: r.damage, lethal: r.damage >= hero.hp }
}

import type { ShopOption } from '../core/types'

// ============================================================
// 金币商店选项（经典魔塔风格：花金币买属性，可重复购买）
// ============================================================

export const GOLD_SHOP: ShopOption[] = [
  { id: 'hp', label: '生命 +800', cost: 25, effect: { hp: 800 } },
  { id: 'atk', label: '攻击 +4', cost: 25, effect: { atk: 4 } },
  { id: 'def', label: '防御 +4', cost: 25, effect: { def: 4 } },
]

export const SHOP_GREETING = '勇敢的勇士啊，给我金币，我能让你变得更强！'

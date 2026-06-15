import type { ShopOption } from '../core/types'

// ============================================================
// 金币商店选项（经典魔塔风格：花金币买属性，可重复购买）
// ============================================================

export const GOLD_SHOP: ShopOption[] = [
  { id: 'atk', label: '攻击 +4', cost: 25, effect: { atk: 4 } },
  { id: 'def', label: '防御 +4', cost: 25, effect: { def: 4 } },
  { id: 'hp', label: '生命 +300', cost: 15, effect: { hp: 300 } },
  { id: 'keyY', label: '黄钥匙 ×1', cost: 8, effect: {}, key: 'yellow' },
  { id: 'keyB', label: '蓝钥匙 ×1', cost: 30, effect: {}, key: 'blue' },
  { id: 'keyR', label: '红钥匙 ×1', cost: 60, effect: {}, key: 'red' },
]

export const SHOP_GREETING = '勇敢的勇士啊，给我金币，我能让你变得更强！'

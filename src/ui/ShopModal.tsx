import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { SHOP_GREETING } from '../data/shops'

export function ShopModal() {
  const shop = useGameStore((s) => s.shop)
  const game = useGameStore((s) => s.game)
  const buy = useGameStore((s) => s.buy)
  const close = useGameStore((s) => s.closeShop)

  useEffect(() => {
    if (!shop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shop, close])

  if (!shop || !game) return null
  const gold = game.hero.gold
  return (
    <div className="shop-mask" onClick={close}>
      <div className="shop-box" onClick={(e) => e.stopPropagation()}>
        <div className="shop-title">🛒 商店</div>
        <div className="shop-greeting">{SHOP_GREETING}</div>
        <div className="shop-gold">
          当前金币：<b>{gold}</b>
        </div>
        <div className="shop-options">
          {shop.map((o) => (
            <button
              key={o.id}
              className="btn shop-opt"
              disabled={gold < o.cost}
              onClick={() => buy(o.id)}
            >
              <span>{o.label}</span>
              <span className="shop-cost">{o.cost} 金</span>
            </button>
          ))}
        </div>
        <button className="btn small shop-close" onClick={close}>
          离开（Esc）
        </button>
      </div>
    </div>
  )
}

import { useGameStore } from '../store/gameStore'

export function ResultOverlay() {
  const game = useGameStore((s) => s.game)
  const newGame = useGameStore((s) => s.newGame)
  const toTitle = useGameStore((s) => s.toTitle)
  if (!game || game.status === 'playing') return null
  const win = game.status === 'victory'
  return (
    <div className="result-mask">
      <div className="result-box">
        <h2 className={win ? 'result-win' : 'result-lose'}>{win ? '🎉 恭喜通关！' : '💀 游戏结束'}</h2>
        <p className="result-info">
          到达第 {game.hero.floor} 层 · 共 {game.steps} 步
        </p>
        <div className="result-actions">
          <button className="btn" onClick={newGame}>
            重新开始
          </button>
          <button className="btn" onClick={toTitle}>
            返回标题
          </button>
        </div>
      </div>
    </div>
  )
}

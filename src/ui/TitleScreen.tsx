import { useGameStore } from '../store/gameStore'

export function TitleScreen() {
  const newGame = useGameStore((s) => s.newGame)
  const continueGame = useGameStore((s) => s.continueGame)
  const hasAuto = useGameStore((s) => s.hasAutoSave)()

  return (
    <div className="title">
      <div className="title-tower">🗼</div>
      <h1 className="title-name">魔　塔</h1>
      <p className="title-sub">经典 24 层 · Web 复刻</p>
      <div className="title-menu">
        <button className="btn" onClick={newGame}>
          新游戏
        </button>
        <button className="btn" disabled={!hasAuto} onClick={continueGame}>
          继续游戏
        </button>
      </div>
      <p className="title-foot">方向键 / WASD 移动 · 点击地图自动寻路 · 个人学习 / 致敬作品</p>
    </div>
  )
}

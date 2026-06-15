import { create } from 'zustand'
import type { Direction, GameEvent, GameState, KeyColor } from '../core/types'
import { initGame, tryMove } from '../core/game'
import { findPath } from '../core/pathfind'
import { FLOORS } from '../data/floors'
import { AUTO_SLOT, autoSave, loadGame, saveGame } from '../core/save'

export interface LogEntry {
  id: number
  text: string
  kind: 'normal' | 'good' | 'bad'
}

export interface DialogState {
  speaker?: string
  lines: string[]
}

type Screen = 'title' | 'playing'

interface GameStore {
  game: GameState | null
  screen: Screen
  logs: LogEntry[]
  dialog: DialogState | null
  moving: boolean // 正在自动寻路

  newGame: () => void
  move: (dir: Direction) => void
  moveTo: (x: number, y: number) => void
  closeDialog: () => void
  save: (slot: string) => void
  load: (slot: string) => boolean
  hasAutoSave: () => boolean
  continueGame: () => void
  toTitle: () => void
}

const COLOR_CN: Record<KeyColor, string> = { yellow: '黄', blue: '蓝', red: '红' }

let logId = 0
const MAX_LOGS = 60

function eventToLog(e: GameEvent): LogEntry | null {
  const mk = (text: string, kind: LogEntry['kind'] = 'normal'): LogEntry => ({
    id: logId++,
    text,
    kind,
  })
  switch (e.type) {
    case 'message':
      return mk(e.text)
    case 'battle':
      return mk(
        `击败 ${e.monsterName}，损失 ${e.damage} 生命，金币+${e.gold} 经验+${e.exp}`,
        'good',
      )
    case 'getItem':
      return mk(e.text, 'good')
    case 'getKey':
      return mk(`获得${COLOR_CN[e.color]}钥匙`, 'good')
    case 'openDoor':
      return mk(`打开${COLOR_CN[e.color]}门`)
    case 'needKey':
      return mk(`需要${COLOR_CN[e.color]}钥匙`, 'bad')
    case 'cannotWin':
      return mk(`无法击败 ${e.monsterName}（攻击不足）`, 'bad')
    case 'changeFloor':
      return mk(`前往第 ${e.to} 层`)
    case 'levelUp':
      return mk(`升级！当前等级 ${e.level}`, 'good')
    case 'gameover':
      return mk(`游戏结束：${e.reason}`, 'bad')
    case 'victory':
      return mk('🎉 恭喜通关！', 'good')
    default:
      return null
  }
}

export const useGameStore = create<GameStore>((set, get) => {
  const pushLogs = (events: GameEvent[]) => {
    const entries = events.map(eventToLog).filter((x): x is LogEntry => x !== null)
    if (entries.length === 0) return
    set((s) => ({ logs: [...s.logs, ...entries].slice(-MAX_LOGS) }))
  }

  const applyEvents = (events: GameEvent[]) => {
    pushLogs(events)
    const dialog = events.find((e) => e.type === 'dialog')
    if (dialog && dialog.type === 'dialog') {
      set({ dialog: { speaker: dialog.speaker, lines: dialog.lines } })
    }
  }

  return {
    game: null,
    screen: 'title',
    logs: [],
    dialog: null,
    moving: false,

    newGame: () => {
      logId = 0
      const game = initGame(FLOORS)
      set({ game, screen: 'playing', logs: [], dialog: null, moving: false })
      autoSave(game, Date.now())
    },

    move: (dir) => {
      const g = get().game
      if (!g || g.status !== 'playing' || get().dialog) return
      const { state, events } = tryMove(g, dir)
      set({ game: state })
      applyEvents(events)
      // 状态变化才自动存档
      if (state.steps !== g.steps || state.status !== g.status) {
        autoSave(state, Date.now())
      }
    },

    moveTo: (x, y) => {
      const g = get().game
      if (!g || g.status !== 'playing' || get().dialog || get().moving) return
      const map = g.maps[g.hero.floor]
      const path = findPath(map, { x: g.hero.x, y: g.hero.y }, { x, y })
      if (!path || path.length === 0) return

      set({ moving: true })
      let i = 0
      const step = () => {
        const cur = get().game
        if (!cur || cur.status !== 'playing' || get().dialog) {
          set({ moving: false })
          return
        }
        if (i >= path.length) {
          set({ moving: false })
          return
        }
        const before = cur.hero
        get().move(path[i++])
        const after = get().game!
        const blocked = after.hero.x === before.x && after.hero.y === before.y
        const floorChanged = after.hero.floor !== before.floor
        if (blocked || floorChanged || get().dialog) {
          set({ moving: false })
          return
        }
        window.setTimeout(step, 90)
      }
      step()
    },

    closeDialog: () => set({ dialog: null }),

    save: (slot) => {
      const g = get().game
      if (!g) return
      saveGame(slot, g, Date.now())
      pushLogs([{ type: 'message', text: '已保存' }])
    },

    load: (slot) => {
      const state = loadGame(slot)
      if (!state) return false
      logId = 0
      set({ game: state, screen: 'playing', logs: [], dialog: null, moving: false })
      return true
    },

    hasAutoSave: () => loadGame(AUTO_SLOT) !== null,

    continueGame: () => {
      get().load(AUTO_SLOT)
    },

    toTitle: () => set({ screen: 'title', dialog: null, moving: false }),
  }
})

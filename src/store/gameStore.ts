import { create } from 'zustand'
import type { Direction, GameEvent, GameState, KeyColor, ShopOption } from '../core/types'
import { buyFromShop, initGame, tryMove } from '../core/game'
import { findPath } from '../core/pathfind'
import { FLOORS } from '../data/floors'
import { GOLD_SHOP } from '../data/shops'
import { AUTO_SLOT, autoSave, loadGame, saveGame } from '../core/save'
import { sfx, type SoundName } from '../audio/sfx'

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
export type Panel = 'none' | 'manual' | 'saves'

interface GameStore {
  game: GameState | null
  screen: Screen
  logs: LogEntry[]
  dialog: DialogState | null
  shop: ShopOption[] | null // 当前打开的商店
  panel: Panel // 当前打开的面板（怪物手册/存读档）
  muted: boolean // 是否静音
  moving: boolean // 正在自动寻路

  newGame: () => void
  move: (dir: Direction) => void
  moveTo: (x: number, y: number) => void
  closeDialog: () => void
  buy: (optionId: string) => void
  closeShop: () => void
  openPanel: (p: Panel) => void
  closePanel: () => void
  toggleMute: () => void
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

  const SFX_OF: Partial<Record<GameEvent['type'], SoundName>> = {
    battle: 'battle',
    getItem: 'item',
    getKey: 'key',
    openDoor: 'door',
    changeFloor: 'stairs',
    needKey: 'denied',
    cannotWin: 'denied',
    victory: 'victory',
    gameover: 'gameover',
  }

  const applyEvents = (events: GameEvent[]) => {
    pushLogs(events)
    const dialog = events.find((e) => e.type === 'dialog')
    if (dialog && dialog.type === 'dialog') {
      set({ dialog: { speaker: dialog.speaker, lines: dialog.lines } })
    }
    if (events.some((e) => e.type === 'shop')) {
      set({ shop: GOLD_SHOP })
    }
    // 播放音效（每批只播一个最显著的，避免叠音）
    for (const e of events) {
      const s = SFX_OF[e.type]
      if (s) {
        sfx.play(s)
        break
      }
    }
  }

  return {
    game: null,
    screen: 'title',
    logs: [],
    dialog: null,
    shop: null,
    panel: 'none',
    muted: sfx.isMuted(),
    moving: false,

    newGame: () => {
      logId = 0
      sfx.resume()
      const game = initGame(FLOORS)
      set({ game, screen: 'playing', logs: [], dialog: null, shop: null, panel: 'none', moving: false })
      autoSave(game, Date.now())
    },

    move: (dir) => {
      const g = get().game
      if (!g || g.status !== 'playing' || get().dialog || get().shop || get().panel !== 'none') return
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
      if (!g || g.status !== 'playing' || get().dialog || get().shop || get().panel !== 'none' || get().moving)
        return
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

    buy: (optionId) => {
      const g = get().game
      const shop = get().shop
      if (!g || !shop) return
      const option = shop.find((o) => o.id === optionId)
      if (!option) return
      const { state, events } = buyFromShop(g, option)
      if (state !== g) sfx.play('buy')
      set({ game: state })
      pushLogs(events)
      autoSave(state, Date.now())
    },

    closeShop: () => set({ shop: null }),

    openPanel: (p) => set({ panel: p }),
    closePanel: () => set({ panel: 'none' }),

    toggleMute: () => {
      const m = !get().muted
      sfx.setMuted(m)
      set({ muted: m })
    },

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
      set({ game: state, screen: 'playing', logs: [], dialog: null, shop: null, panel: 'none', moving: false })
      return true
    },

    hasAutoSave: () => loadGame(AUTO_SLOT) !== null,

    continueGame: () => {
      get().load(AUTO_SLOT)
    },

    toTitle: () => set({ screen: 'title', dialog: null, shop: null, panel: 'none', moving: false }),
  }
})

// 开发调试钩子（仅 dev）：浏览器控制台可用 window.__mota 驱动游戏
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __mota: typeof useGameStore }).__mota = useGameStore
}

import type { GameState } from './types'

// ============================================================
// 存档：localStorage + 多手动档 + 自动档，全量 JSON 快照（带版本号）
// ============================================================

const SAVE_VERSION = 1
const PREFIX = 'mota.save.'
const AUTO_SLOT = 'auto'

export interface SaveMeta {
  slot: string
  version: number
  savedAt: number
  floor: number
  hp: number
  steps: number
}

interface SaveBlob {
  version: number
  savedAt: number
  state: GameState
}

function slotKey(slot: string): string {
  return `${PREFIX}${slot}`
}

/** 写入一个存档槽（savedAt 由调用方传入以保持确定性/可测） */
export function saveGame(slot: string, state: GameState, savedAt: number): void {
  const blob: SaveBlob = { version: SAVE_VERSION, savedAt, state }
  localStorage.setItem(slotKey(slot), JSON.stringify(blob))
}

export function autoSave(state: GameState, savedAt: number): void {
  saveGame(AUTO_SLOT, state, savedAt)
}

/** 读取一个存档槽 */
export function loadGame(slot: string): GameState | null {
  const raw = localStorage.getItem(slotKey(slot))
  if (!raw) return null
  try {
    const blob = JSON.parse(raw) as SaveBlob
    if (blob.version !== SAVE_VERSION) {
      // 版本不一致：此处可加迁移逻辑，暂直接拒绝
      return null
    }
    return blob.state
  } catch {
    return null
  }
}

export function deleteSave(slot: string): void {
  localStorage.removeItem(slotKey(slot))
}

/** 列出所有存档槽元信息 */
export function listSaves(): SaveMeta[] {
  const metas: SaveMeta[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(PREFIX)) continue
    try {
      const blob = JSON.parse(localStorage.getItem(k)!) as SaveBlob
      metas.push({
        slot: k.slice(PREFIX.length),
        version: blob.version,
        savedAt: blob.savedAt,
        floor: blob.state.hero.floor,
        hp: blob.state.hero.hp,
        steps: blob.state.steps,
      })
    } catch {
      // 跳过损坏的存档
    }
  }
  return metas.sort((a, b) => b.savedAt - a.savedAt)
}

export { AUTO_SLOT }

import type { FloorData } from '../../core/types'
import { MONSTER_ID_TO_BLOCK, ITEM_ID_TO_BLOCK } from '../../core/blocks'

// ============================================================
// 楼层构建器：用 ASCII 关卡图 + 图例生成楼层数据
// ============================================================

/** 通用图例（静态块） */
export const DEFAULT_LEGEND: Record<string, number> = {
  ' ': 0,
  '.': 0,
  '#': 1,
  Y: 2, // 黄门
  B: 3, // 蓝门
  R: 4, // 红门
  y: 5, // 黄钥匙
  b: 6, // 蓝钥匙
  r: 7, // 红钥匙
  v: 8, // 下楼梯
  '^': 9, // 上楼梯
  S: 10, // 起点
  P: 11, // 公主（胜利）
  N: 12, // NPC
  $: 20, // 商店
  O: 13, // 石柱
}

function resolve(value: number | string): number {
  if (typeof value === 'number') return value
  if (value in MONSTER_ID_TO_BLOCK) return MONSTER_ID_TO_BLOCK[value]
  if (value in ITEM_ID_TO_BLOCK) return ITEM_ID_TO_BLOCK[value]
  throw new Error(`未知图例值: ${value}`)
}

/**
 * 用关卡图构建楼层。
 * @param rows ASCII 行（每个字符一格）
 * @param extra 该层特有的字符 -> 块（数字 block id，或 monsterId / itemId 字符串）
 */
export function buildFloor(
  floor: number,
  name: string,
  rows: string[],
  extra: Record<string, number | string> = {},
): FloorData {
  const legend: Record<string, number> = { ...DEFAULT_LEGEND }
  for (const [ch, v] of Object.entries(extra)) legend[ch] = resolve(v)

  const tiles: number[][] = rows.map((row, y) =>
    [...row].map((ch, x) => {
      if (!(ch in legend)) {
        throw new Error(`第 ${floor} 层 (${x},${y}) 未知字符 "${ch}"`)
      }
      return legend[ch]
    }),
  )

  // 校验矩形
  const w = tiles[0]?.length ?? 0
  for (const row of tiles) {
    if (row.length !== w) throw new Error(`第 ${floor} 层地图行宽不一致`)
  }

  return { floor, name, tiles }
}

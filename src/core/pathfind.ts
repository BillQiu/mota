import type { Direction, FloorMap } from './types'
import { isPassable } from './blocks'

// ============================================================
// 网格 BFS 寻路（点击移动 / 自动寻路）
//   - 中间格必须可通行
//   - 目标格允许不可通行（怪/门/道具）—— 作为「撞上去交互」的终点
// ============================================================

export interface Point {
  x: number
  y: number
}

const DIRS: { dir: Direction; dx: number; dy: number }[] = [
  { dir: 'up', dx: 0, dy: -1 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'right', dx: 1, dy: 0 },
]

function inBounds(map: FloorMap, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height
}

/**
 * 从 from 走到 to 的方向序列。
 * @returns 方向数组；无路返回 null；已在原地返回 []
 */
export function findPath(map: FloorMap, from: Point, to: Point): Direction[] | null {
  if (from.x === to.x && from.y === to.y) return []
  if (!inBounds(map, to.x, to.y)) return null

  const key = (x: number, y: number) => y * map.width + x
  const visited = new Set<number>([key(from.x, from.y)])
  // 记录每个格子从哪个方向、哪个父格到达
  const prev = new Map<number, { px: number; py: number; dir: Direction }>()
  const queue: Point[] = [from]

  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const { dir, dx, dy } of DIRS) {
      const nx = cur.x + dx
      const ny = cur.y + dy
      if (!inBounds(map, nx, ny)) continue
      const k = key(nx, ny)
      if (visited.has(k)) continue

      const isTarget = nx === to.x && ny === to.y
      // 目标格允许不可通行；中间格必须可通行
      if (!isTarget && !isPassable(map.tiles[ny][nx])) continue

      visited.add(k)
      prev.set(k, { px: cur.x, py: cur.y, dir })

      if (isTarget) {
        // 回溯重建路径
        const path: Direction[] = []
        let cx = nx
        let cy = ny
        while (!(cx === from.x && cy === from.y)) {
          const p = prev.get(key(cx, cy))!
          path.push(p.dir)
          cx = p.px
          cy = p.py
        }
        path.reverse()
        return path
      }

      queue.push({ x: nx, y: ny })
    }
  }

  return null
}

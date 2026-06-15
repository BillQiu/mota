import { describe, it, expect } from 'vitest'
import { findPath } from '../core/pathfind'
import type { FloorMap } from '../core/types'

function mapFrom(rows: string[]): FloorMap {
  const tiles = rows.map((r) => [...r].map((c) => (c === '#' ? 1 : 0)))
  return { floor: 1, name: 't', width: tiles[0].length, height: tiles.length, tiles }
}

describe('findPath（网格 BFS）', () => {
  it('直线路径', () => {
    const m = mapFrom(['.....'])
    expect(findPath(m, { x: 0, y: 0 }, { x: 4, y: 0 })).toEqual(['right', 'right', 'right', 'right'])
  })

  it('绕墙', () => {
    const m = mapFrom([
      '...',
      '.#.',
      '...',
    ])
    const path = findPath(m, { x: 0, y: 0 }, { x: 2, y: 2 })
    expect(path).not.toBeNull()
    expect(path!.length).toBe(4) // 曼哈顿距离 4，绕开中间墙
  })

  it('无路返回 null', () => {
    const m = mapFrom(['.#.'])
    expect(findPath(m, { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull()
  })

  it('原地返回空数组', () => {
    const m = mapFrom(['...'])
    expect(findPath(m, { x: 1, y: 0 }, { x: 1, y: 0 })).toEqual([])
  })

  it('目标格不可通行仍可作为终点（撞上去交互）', () => {
    // 终点是墙，但允许作为路径终点
    const m = mapFrom(['..#'])
    const path = findPath(m, { x: 0, y: 0 }, { x: 2, y: 0 })
    expect(path).toEqual(['right', 'right'])
  })
})

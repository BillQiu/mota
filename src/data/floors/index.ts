import type { FloorData } from '../../core/types'
import { buildFloor } from './build'

// ============================================================
// 楼层数据（12 层完整塔，统一模板 + 权力曲线）
// 内容槽位（每层）：
//   row4: a c d e（顶排，c 为中心留空保持主路）
//   row6: f [钥匙] g
//   row8: h [special] i（h/i 两侧，special 居中，可为道具或商店20）
// 门(D) 与 钥匙 颜色循环 Y/B/R；顶层为公主 P + 魔王 M
// ============================================================

type SlotMap = Partial<Record<'a' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'm' | 's', number | string>>

function std(
  floor: number,
  name: string,
  cfg: {
    door: 'Y' | 'B' | 'R'
    key: 'y' | 'b' | 'r'
    hasDown: boolean
    start: boolean
    content: SlotMap
  },
): FloorData {
  const slots = ['a', 'm', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 's'] as const
  const extra: Record<string, number | string> = {}
  for (const k of slots) extra[k] = cfg.content[k] ?? 0
  const rows = [
    '#############',
    '#.....^.....#',
    `######${cfg.door}######`,
    '#...........#',
    '#.a.m.c.d.e.#',
    '#...........#',
    `#..f..${cfg.key}..g..#`,
    '#...........#',
    '#.h.O.s.O.i.#',
    '#...........#',
    cfg.hasDown ? '#.....v.....#' : '#...........#',
    cfg.start ? '#.....S.....#' : '#...........#',
    '#############',
  ]
  return buildFloor(floor, name, rows, extra)
}

const floors: FloorData[] = [
  std(1, '第 1 层', {
    door: 'Y',
    key: 'y',
    hasDown: false,
    start: true,
    content: { a: 'greenSlime', m: 'redGem', d: 'redGem', e: 'greenSlime', f: 'redPotion' },
  }),
  std(2, '第 2 层', {
    door: 'B',
    key: 'b',
    hasDown: true,
    start: false,
    content: { a: 'redSlime', m: 'blackSlime', d: 'bat', e: 'redSlime', f: 'blueGem', g: 'redPotion', s: 20, i: 'redGem' },
  }),
  std(3, '第 3 层', {
    door: 'R',
    key: 'r',
    hasDown: true,
    start: false,
    content: { a: 'bat', m: 'skeleton', d: 'bigBat', e: 'bat', f: 'sword1', g: 'shield1', h: 'redPotion', s: 'redGem', i: 'redGem' },
  }),
  std(4, '第 4 层', {
    door: 'Y',
    key: 'y',
    hasDown: true,
    start: false,
    content: { a: 'bigBat', m: 'zombie', d: 'skeleton', e: 'bat', f: 'redGem', g: 'redGem', h: 'bluePotion', s: 'blueGem', i: 'redGem' },
  }),
  std(5, '第 5 层', {
    door: 'B',
    key: 'b',
    hasDown: true,
    start: false,
    content: { a: 'redBat', m: 'skeletonCaptain', d: 'redBat', e: 'skeleton', f: 'sword2', g: 'blueGem', h: 'blueGem', s: 20, i: 'redPotion' },
  }),
  std(6, '第 6 层', {
    door: 'R',
    key: 'r',
    hasDown: true,
    start: false,
    content: { a: 'zombie', m: 'slimeMan', d: 'redBat', e: 'zombie', f: 'redGem', g: 'redGem', h: 'redGem', s: 'yellowPotion', i: 'shield1' },
  }),
  std(7, '第 7 层', {
    door: 'Y',
    key: 'y',
    hasDown: true,
    start: false,
    content: { a: 'bluePriest', m: 'goblin', d: 'bluePriest', e: 'bat', f: 'shield2', g: 'redGem', h: 'redGem', s: 'redPotion', i: 'redPotion' },
  }),
  std(8, '第 8 层', {
    door: 'B',
    key: 'b',
    hasDown: true,
    start: false,
    content: { a: 'zombieKing', m: 'redPriest', d: 'zombie', e: 'redBat', f: 'sword2', g: 'blueGem', h: 'blueGem', s: 20, i: 'bluePotion' },
  }),
  std(9, '第 9 层', {
    door: 'R',
    key: 'r',
    hasDown: true,
    start: false,
    content: { a: 'goblin', m: 'goblinKing', d: 'bluePriest', e: 'zombie', f: 'redGem', g: 'redGem', h: 'redGem', s: 'shield2', i: 'greenPotion' },
  }),
  std(10, '第 10 层', {
    door: 'Y',
    key: 'y',
    hasDown: true,
    start: false,
    content: { a: 'vampire', m: 'knight', d: 'goblin', e: 'redPriest', f: 'sword2', g: 'redGem', h: 'redGem', s: 'blueGem', i: 'blueGem' },
  }),
  std(11, '第 11 层', {
    door: 'B',
    key: 'b',
    hasDown: true,
    start: false,
    content: { a: 'knight', m: 'vampire', d: 'knight', e: 'goblinKing', f: 'sword2', g: 'yellowPotion', h: 'blueGem', s: 20, i: 'blueGem' },
  }),
  buildFloor(
    12,
    '魔王殿',
    [
      '#############',
      '#.....P.....#',
      '######M######',
      '#...........#',
      '#.k.......l.#',
      '#...........#',
      '#..w..h..x..#',
      '#...........#',
      '#.O.O.z.O.O.#',
      '#...........#',
      '#.....v.....#',
      '#...........#',
      '#############',
    ],
    { M: 'demonKing', k: 'knight', l: 'knight', w: 'greenPotion', h: 'yellowPotion', x: 'greenPotion', z: 'cross' },
  ),
]

export const FLOORS: FloorData[] = floors

export const TOTAL_FLOORS = FLOORS.length

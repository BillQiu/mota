import type { FloorData } from '../../core/types'
import { buildFloor } from './build'

// ============================================================
// 楼层数据（24 层完整塔，按楼层数缩放怪物/战利品的生成器）
// 内容槽位（每层）：
//   row4: a m c d e（c 中心留空保持主路）
//   row6: f [钥匙] g
//   row8: h [special] i（special 居中：商店或道具）
// 门(D)/钥匙颜色循环 Y/B/R；顶层为公主 P + 魔王 M
// ============================================================

type Slot = 'a' | 'm' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 's'
type SlotMap = Partial<Record<Slot, number | string>>

function std(
  floor: number,
  name: string,
  cfg: { door: 'Y' | 'B' | 'R'; key: 'y' | 'b' | 'r'; hasDown: boolean; start: boolean; content: SlotMap },
): FloorData {
  const slots: Slot[] = ['a', 'm', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 's']
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

const DOORS = ['Y', 'B', 'R'] as const
const KEYS = ['y', 'b', 'r'] as const

/** 按楼层挑 3 只怪（随层数升级） */
function monstersFor(n: number): [string, string, string] {
  if (n <= 2) return ['greenSlime', 'redSlime', 'blackSlime']
  if (n <= 4) return ['bat', 'bigBat', 'skeleton']
  if (n <= 6) return ['redBat', 'skeleton', 'skeletonCaptain']
  if (n <= 8) return ['zombie', 'redBat', 'skeletonCaptain']
  if (n <= 10) return ['slimeMan', 'zombie', 'bluePriest']
  if (n <= 12) return ['zombieKing', 'bluePriest', 'redBat']
  if (n <= 14) return ['redPriest', 'goblin', 'slimeMan']
  if (n <= 16) return ['goblin', 'goblinKing', 'redPriest']
  if (n <= 18) return ['vampire', 'goblin', 'goblinKing']
  if (n <= 20) return ['knight', 'vampire', 'goblinKing']
  return ['knight', 'vampire', 'knight']
}

function potionFor(n: number): string {
  if (n <= 6) return 'redPotion'
  if (n <= 12) return 'bluePotion'
  if (n <= 18) return 'yellowPotion'
  return 'greenPotion'
}

/** 部分楼层固定掉落剑/盾 */
function gearFor(n: number): string | null {
  const map: Record<number, string> = {
    3: 'sword1',
    4: 'shield1',
    7: 'sword2',
    8: 'shield2',
    11: 'sword2',
    12: 'shield2',
    15: 'sword2',
    16: 'shield2',
    19: 'sword2',
    20: 'shield2',
    22: 'sword2',
    23: 'shield2',
  }
  return map[n] ?? null
}

function genFloor(n: number): FloorData {
  const [a, m, d] = monstersFor(n)
  const content: SlotMap = {
    a,
    m,
    d,
    e: 'redGem',
    f: 'redGem',
    g: 'blueGem',
    h: potionFor(n),
    i: gearFor(n) ?? 'blueGem',
    s: n % 3 === 0 ? 20 : 'redGem', // 每 3 层一个商店
  }
  return std(n, `第 ${n} 层`, {
    door: DOORS[(n - 1) % 3],
    key: KEYS[(n - 1) % 3],
    hasDown: n > 1,
    start: n === 1,
    content,
  })
}

const floors: FloorData[] = []
for (let n = 1; n <= 23; n++) floors.push(genFloor(n))

// 顶层：魔王殿
floors.push(
  buildFloor(
    24,
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
    { M: 'demonKing', k: 'knight', l: 'vampire', w: 'greenPotion', h: 'greenPotion', x: 'greenPotion', z: 'cross' },
  ),
)

export const FLOORS: FloorData[] = floors

export const TOTAL_FLOORS = FLOORS.length

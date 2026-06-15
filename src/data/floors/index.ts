import type { FloorData } from '../../core/types'
import { IMPORTED_FLOORS } from '../imported'
import { MONSTER_ID_TO_BLOCK } from '../../core/blocks'

// ============================================================
// 楼层 = 经典导入数据 F1-F9（justinmzt/mota，完整连通段）
//        + 自建续塔 F10-F23（11×11，明处缩放宝石，门锁楼梯）
//        + 魔王殿 F24
// 凑满 24 层；续塔保证可通关（缩放宝石让高层战力暴涨）
// ============================================================

const CORE_FLOORS = IMPORTED_FLOORS.slice(0, 9) // 真实经典 F1-F9

// 块 id 常量
const W = 1
const F = 0
const UP = 9
const DOWN = 8
const PILLAR = 13
const SHOP = 20
const RGEM = 201
const BGEM = 202
const RPOT = 208
const BPOT = 209
const DOORS = [2, 3, 4] // 黄/蓝/红门
const KEYS = [5, 6, 7] // 黄/蓝/红钥匙

function monstersFor(n: number): number[] {
  const id = (k: string) => MONSTER_ID_TO_BLOCK[k]
  if (n <= 12) return [id('mon_zombie'), id('mon_big_bat'), id('mon_priest'), id('mon_skeleton_captain')]
  if (n <= 15) return [id('mon_zombie_knight'), id('mon_super_priest'), id('mon_red_bat'), id('mon_guard')]
  if (n <= 18) return [id('mon_magician'), id('mon_big_guard'), id('mon_slime_lord'), id('mon_super_magician')]
  if (n <= 21) return [id('mon_super_guard'), id('mon_red_bat'), id('mon_magician'), id('mon_zombie_knight')]
  return [id('mon_super_guard'), id('mon_super_magician'), id('mon_slime_lord'), id('mon_big_guard')]
}

function handFloor(n: number): FloorData {
  const door = DOORS[(n - 10) % 3]
  const key = KEYS[(n - 10) % 3]
  const m = monstersFor(n)
  const special = n % 3 === 0 ? SHOP : RGEM // 每 3 层一个商店
  const tiles = [
    [W, W, W, W, W, UP, W, W, W, W, W],
    [W, W, W, W, W, door, W, W, W, W, W],
    [W, F, m[0], F, BGEM, F, m[1], F, BGEM, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, RGEM, F, BGEM, key, RGEM, F, RPOT, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, m[2], F, RGEM, F, m[3], F, BGEM, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, PILLAR, F, F, special, F, F, PILLAR, F, W],
    [W, F, F, F, F, DOWN, F, F, BPOT, F, W],
    [W, W, W, W, W, W, W, W, W, W, W],
  ]
  return { floor: n, name: `第 ${n} 层`, tiles }
}

const handFloors: FloorData[] = []
for (let n = 10; n <= 23; n++) handFloors.push(handFloor(n))

const bossFloor: FloorData = {
  floor: 24,
  name: '魔王殿',
  tiles: [
    [W, W, W, W, W, 11, W, W, W, W, W],
    [W, F, F, F, F, 122, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, BPOT, F, F, F, F, F, BPOT, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, DOWN, F, F, F, F, W],
    [W, W, W, W, W, W, W, W, W, W, W],
  ],
}

export const FLOORS: FloorData[] = [...CORE_FLOORS, ...handFloors, bossFloor]

export const TOTAL_FLOORS = FLOORS.length

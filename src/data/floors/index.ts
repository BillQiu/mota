import type { FloorData } from '../../core/types'
import { IMPORTED_FLOORS } from '../imported'

// ============================================================
// 楼层 = 导入的经典魔塔数据（justinmzt/mota）F1-F9（完整连通段）+ 顶层魔王殿
// 注：源数据 F10 缺上楼梯、F13+ 无楼梯（原作未画完），故取连通的前 9 层
// 导入层为 11×11；魔王殿同尺寸，下楼梯(8)承接上一层，魔王(122)挡住公主(11)
// ============================================================

const CORE_FLOORS = IMPORTED_FLOORS.slice(0, 9) // 完整连通的 F1-F9

const W = 1 // 墙
const F = 0 // 地面

const bossFloor: FloorData = {
  floor: CORE_FLOORS.length + 1,
  name: '魔王殿',
  tiles: [
    [W, W, W, W, W, 11, W, W, W, W, W],
    [W, F, F, F, F, 122, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, 209, F, F, F, F, F, 209, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, 8, F, F, F, F, W],
    [W, W, W, W, W, W, W, W, W, W, W],
  ],
}

export const FLOORS: FloorData[] = [...CORE_FLOORS, bossFloor]

export const TOTAL_FLOORS = FLOORS.length

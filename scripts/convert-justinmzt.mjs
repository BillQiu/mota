import config from './config.mjs'
import { writeFileSync } from 'node:fs'

const { MAP, ITEM, MAP_ENTER } = config

// ---- 1. 怪物：从 ITEM 中提取 class===5 且有 name 的 ----
const PALETTE = ['#3fb24f', '#c0392b', '#2c2c34', '#7d5ba6', '#5b3b86', '#a93226', '#e8e8d8', '#cfc9a8', '#6b8e23', '#556b2f', '#16a085', '#2980b9', '#8e6f3a', '#6e5226', '#7b241c', '#34495e', '#900c3f', '#b9770e']
const monsters = {} // key(原 mon_xxx) -> def
const monsterBlock = {} // blockId -> key
const sheets = new Set()
let mBlockId = 101
let pi = 0
for (const [key, def] of Object.entries(ITEM)) {
  if (def.class !== 5) continue
  const o = def.option
  if (!o || !o.name || o.name === '勇者') continue
  const id = key // 保留原 key 作为 id
  const imgFile = config.IMAGES[o.image] // 'img/Monster01-01.png'
  const sheet = imgFile ? imgFile.split('/').pop() : null
  if (sheet) sheets.add(sheet)
  monsters[id] = {
    id,
    name: o.name,
    hp: o.life,
    atk: o.atk,
    def: o.def,
    gold: o.coin,
    exp: o.coin, // 原数据无经验，用金币近似
    color: PALETTE[pi % PALETTE.length],
    glyph: o.name[0],
    sprite: sheet ? { sheet, sx: (o.imgX || 0) * 32, sy: (o.imgY || 0) * 32 } : undefined,
  }
  monsterBlock[mBlockId] = id
  mBlockId++
  pi++
}
console.log('需要的怪物 sheet:', [...sheets].join(' '))
const monsterKeyToBlock = Object.fromEntries(Object.entries(monsterBlock).map(([b, k]) => [k, Number(b)]))

// ---- 2. 瓦片字符串 -> 我的 block id ----
const STATIC = {
  up_floor: 9,
  down_floor: 8,
  door_yellow: 2,
  door_blue: 3,
  door_red: 4,
  door_green: 15,
  key_yellow: 5,
  key_blue: 6,
  key_red: 7,
  key_green: 16,
  gem_red: 201,
  gem_blue: 202,
  liquid_red: 208,
  liquid_blue: 209,
}

function tileToBlock(t) {
  if (t === 0 || t === undefined || t === null) return 0
  if (t === 1) return 1
  if (typeof t === 'string') {
    if (t.startsWith('mon_')) return monsterKeyToBlock[t] ?? 0
    if (t.startsWith('npc_')) return 20 // NPC -> 商店（恢复商人经济：买钥匙/属性）
    if (t in STATIC) return STATIC[t]
    if (t === 'braver') return 0
  }
  return 0
}

function isEmpty(grid) {
  return grid.every((row) => row.every((c) => c === 0))
}

// ---- 3. 转换楼层（跳过空层），按顺序重编号 ----
const floors = []
let floorNo = 0
MAP.forEach((grid, idx) => {
  if (!Array.isArray(grid) || grid.length === 0) return
  if (isEmpty(grid)) return
  floorNo++
  const tiles = grid.map((row) => row.map(tileToBlock))
  // 第 1 个导入层放置起点
  if (floorNo === 1) {
    const enter = MAP_ENTER && MAP_ENTER[0] ? MAP_ENTER[0] : { X: 5, Y: 10 }
    if (tiles[enter.Y] && tiles[enter.Y][enter.X] === 0) tiles[enter.Y][enter.X] = 10
  }
  floors.push({ floor: floorNo, name: `第 ${floorNo} 层`, tiles, _origIdx: idx })
})

// ---- 4. 输出 TS ----
const out = `// 自动生成：由 justinmzt/mota 经典魔塔数据转换而来（勿手改）
// 来源 https://github.com/justinmzt/mota  生成脚本 scripts/convert-justinmzt.mjs
import type { FloorData, MonsterDef } from '../core/types'

export const IMPORTED_MONSTERS: Record<string, MonsterDef> = ${JSON.stringify(monsters, null, 2)}

export const IMPORTED_MONSTER_BLOCKS: Record<number, string> = ${JSON.stringify(monsterBlock, null, 2)}

export const IMPORTED_FLOORS: FloorData[] = ${JSON.stringify(
  floors.map(({ _origIdx, ...f }) => f),
  null,
  0,
)}
`

const target = '/Users/billqiu/workspace/mota/src/data/imported.ts'
writeFileSync(target, out)
console.log(`怪物 ${Object.keys(monsters).length} 种, 楼层 ${floors.length} 层`)
console.log('楼层原始索引:', floors.map((f) => f._origIdx).join(','))
console.log('写入', target)

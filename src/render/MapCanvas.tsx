import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { BLOCKS, getBlock } from '../core/blocks'
import { MONSTERS } from '../data/monsters'
import { previewDamage } from '../core/combat'
import type { BlockDef, GameState, Hero } from '../core/types'

export const TILE = 36
const SRC = 32 // 源精灵 32×32
const HERO_SHEET = 'Actor01-Braver01.png'
const HERO_DIR_ROW: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 }

// ---- 精灵图集加载 ----
const sheets: Record<string, HTMLImageElement> = {}
function spriteUrl(name: string) {
  return `${import.meta.env.BASE_URL}sprites/${name}`
}
function neededSheets(): string[] {
  const set = new Set<string>([HERO_SHEET])
  for (const b of Object.values(BLOCKS)) if (b.sprite) set.add(b.sprite.sheet)
  return [...set]
}
function loadSheets(onLoad: () => void) {
  for (const name of neededSheets()) {
    if (sheets[name]) continue
    const img = new Image()
    img.onload = onLoad
    img.src = spriteUrl(name)
    sheets[name] = img
  }
}
function ready(sheet: string): boolean {
  const img = sheets[sheet]
  return !!img && img.complete && img.naturalWidth > 0
}

// ---- 占位绘制（精灵未就绪时回退）----
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
function drawFloorFallback(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = (x + y) % 2 === 0 ? '#23232f' : '#1f1f2a'
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
}
function drawGlyphFallback(ctx: CanvasRenderingContext2D, x: number, y: number, b: BlockDef) {
  const px = x * TILE
  const py = y * TILE
  ctx.fillStyle = b.color ?? '#888'
  roundRect(ctx, px + 3, py + 3, TILE - 6, TILE - 6, 6)
  ctx.fill()
  if (b.glyph) {
    ctx.fillStyle = '#1a1a1a'
    ctx.font = `bold ${Math.floor(TILE * 0.5)}px "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(b.glyph, px + TILE / 2, py + TILE / 2 + 1)
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, b: BlockDef) {
  if (b.sprite && ready(b.sprite.sheet)) {
    ctx.drawImage(sheets[b.sprite.sheet], b.sprite.sx, b.sprite.sy, SRC, SRC, x * TILE, y * TILE, TILE, TILE)
  } else {
    drawGlyphFallback(ctx, x, y, b)
  }
}

function drawDamagePreview(ctx: CanvasRenderingContext2D, x: number, y: number, hero: Hero, monsterId: string) {
  const monster = MONSTERS[monsterId]
  if (!monster) return
  const p = previewDamage(hero, monster)
  const px = x * TILE
  const py = y * TILE
  let text: string
  let color: string
  if (!p.canWin) {
    text = '✗'
    color = '#ff4d4d'
  } else {
    text = p.damage >= 10000 ? `${Math.round(p.damage / 1000)}k` : String(p.damage)
    color = p.lethal ? '#ff4d4d' : p.damage === 0 ? '#7CFC00' : '#ffe08a'
  }
  ctx.font = `bold ${Math.floor(TILE * 0.3)}px "Microsoft YaHei", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'
  ctx.strokeText(text, px + TILE / 2, py + TILE - 1)
  ctx.fillStyle = color
  ctx.fillText(text, px + TILE / 2, py + TILE - 1)
}

function drawHero(ctx: CanvasRenderingContext2D, hero: Hero) {
  const px = hero.x * TILE
  const py = hero.y * TILE
  if (ready(HERO_SHEET)) {
    const img = sheets[HERO_SHEET]
    const row = HERO_DIR_ROW[hero.direction] ?? 0
    const frameH = Math.floor(img.naturalHeight / 4)
    ctx.drawImage(img, SRC, row * frameH, SRC, frameH, px, py, TILE, TILE)
    return
  }
  // 回退：圆形勇士
  const cx = px + TILE / 2
  const cy = py + TILE / 2
  ctx.fillStyle = '#3a7bd5'
  ctx.beginPath()
  ctx.arc(cx, cy, TILE * 0.34, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#cfe3ff'
  ctx.lineWidth = 2
  ctx.stroke()
}

const FLOOR_BLOCK = BLOCKS[0]

function drawMap(ctx: CanvasRenderingContext2D, game: GameState) {
  const map = game.maps[game.hero.floor]
  ctx.clearRect(0, 0, map.width * TILE, map.height * TILE)
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      // 地面背景
      if (FLOOR_BLOCK.sprite && ready(FLOOR_BLOCK.sprite.sheet)) drawBlock(ctx, x, y, FLOOR_BLOCK)
      else drawFloorFallback(ctx, x, y)
      const block = getBlock(map.tiles[y][x])
      if (block.cls === 'floor' || (block.cls === 'special' && !block.win)) continue
      drawBlock(ctx, x, y, block)
      if (block.cls === 'monster' && block.monsterId) drawDamagePreview(ctx, x, y, game.hero, block.monsterId)
    }
  }
  drawHero(ctx, game.hero)
}

export function MapCanvas() {
  const game = useGameStore((s) => s.game)
  const moveTo = useGameStore((s) => s.moveTo)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [atlasVersion, setAtlasVersion] = useState(0)

  useEffect(() => {
    loadSheets(() => setAtlasVersion((v) => v + 1))
  }, [])

  const map = game ? game.maps[game.hero.floor] : null
  const w = (map?.width ?? 11) * TILE
  const h = (map?.height ?? 11) * TILE

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !game) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    drawMap(ctx, game)
  }, [game, w, h, atlasVersion])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!game) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * (map?.width ?? 11))
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * (map?.height ?? 11))
    moveTo(x, y)
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ width: w, height: h, border: '2px solid var(--mota-border)', borderRadius: 6, cursor: 'pointer' }}
    />
  )
}

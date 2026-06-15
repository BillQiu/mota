import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { getBlock } from '../core/blocks'
import { MONSTERS } from '../data/monsters'
import { previewDamage } from '../core/combat'
import type { GameState, Hero } from '../core/types'

export const TILE = 36

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawFloorCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = x * TILE
  const py = y * TILE
  ctx.fillStyle = (x + y) % 2 === 0 ? '#23232f' : '#1f1f2a'
  ctx.fillRect(px, py, TILE, TILE)
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = x * TILE
  const py = y * TILE
  ctx.fillStyle = '#5a4a2f'
  ctx.fillRect(px, py, TILE, TILE)
  // 砖缝
  ctx.fillStyle = '#6e5b3a'
  const bh = TILE / 3
  for (let i = 0; i < 3; i++) {
    const offset = i % 2 === 0 ? 0 : TILE / 2
    ctx.fillRect(px + offset, py + i * bh, TILE / 2 - 2, bh - 2)
    ctx.fillRect(px + offset - TILE / 2, py + i * bh, TILE / 2 - 2, bh - 2)
  }
}

function drawGlyphBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glyph?: string) {
  const px = x * TILE
  const py = y * TILE
  const pad = 3
  ctx.fillStyle = color
  roundRect(ctx, px + pad, py + pad, TILE - pad * 2, TILE - pad * 2, 6)
  ctx.fill()
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  roundRect(ctx, px + pad, py + pad, TILE - pad * 2, (TILE - pad * 2) / 2, 6)
  ctx.fill()
  if (glyph) {
    ctx.fillStyle = '#1a1a1a'
    ctx.font = `bold ${Math.floor(TILE * 0.5)}px "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(glyph, px + TILE / 2, py + TILE / 2 + 1)
  }
}

function drawStair(ctx: CanvasRenderingContext2D, x: number, y: number, up: boolean) {
  const px = x * TILE
  const py = y * TILE
  ctx.fillStyle = up ? '#8a8a9a' : '#5a5a6a'
  ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8)
  ctx.fillStyle = '#e8e8f0'
  ctx.font = `bold ${Math.floor(TILE * 0.5)}px "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(up ? '上' : '下', px + TILE / 2, py + TILE / 2 + 1)
}

function drawHero(ctx: CanvasRenderingContext2D, hero: Hero) {
  const px = hero.x * TILE
  const py = hero.y * TILE
  const cx = px + TILE / 2
  const cy = py + TILE / 2
  // 身体
  ctx.fillStyle = '#3a7bd5'
  ctx.beginPath()
  ctx.arc(cx, cy, TILE * 0.34, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#cfe3ff'
  ctx.lineWidth = 2
  ctx.stroke()
  // 朝向小三角
  ctx.fillStyle = '#ffd700'
  const d = TILE * 0.22
  ctx.beginPath()
  if (hero.direction === 'up') {
    ctx.moveTo(cx, cy - d)
    ctx.lineTo(cx - 4, cy - d + 7)
    ctx.lineTo(cx + 4, cy - d + 7)
  } else if (hero.direction === 'down') {
    ctx.moveTo(cx, cy + d)
    ctx.lineTo(cx - 4, cy + d - 7)
    ctx.lineTo(cx + 4, cy + d - 7)
  } else if (hero.direction === 'left') {
    ctx.moveTo(cx - d, cy)
    ctx.lineTo(cx - d + 7, cy - 4)
    ctx.lineTo(cx - d + 7, cy + 4)
  } else {
    ctx.moveTo(cx + d, cy)
    ctx.lineTo(cx + d - 7, cy - 4)
    ctx.lineTo(cx + d - 7, cy + 4)
  }
  ctx.closePath()
  ctx.fill()
}

/** 在怪物格底部画伤害预测：安全=浅色，致命=红色，打不过=✗ */
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
  // 描边提升可读性
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'
  ctx.strokeText(text, px + TILE / 2, py + TILE - 1)
  ctx.fillStyle = color
  ctx.fillText(text, px + TILE / 2, py + TILE - 1)
}

function drawMap(ctx: CanvasRenderingContext2D, game: GameState) {
  const map = game.maps[game.hero.floor]
  ctx.clearRect(0, 0, map.width * TILE, map.height * TILE)
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      drawFloorCell(ctx, x, y)
      const block = getBlock(map.tiles[y][x])
      switch (block.cls) {
        case 'floor':
          break
        case 'wall':
          drawWall(ctx, x, y)
          break
        case 'stairUp':
          drawStair(ctx, x, y, true)
          break
        case 'stairDown':
          drawStair(ctx, x, y, false)
          break
        case 'monster':
          drawGlyphBlock(ctx, x, y, block.color ?? '#888', block.glyph)
          drawDamagePreview(ctx, x, y, game.hero, block.monsterId as string)
          break
        default:
          drawGlyphBlock(ctx, x, y, block.color ?? '#888', block.glyph)
      }
    }
  }
  drawHero(ctx, game.hero)
}

export function MapCanvas() {
  const game = useGameStore((s) => s.game)
  const moveTo = useGameStore((s) => s.moveTo)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const map = game ? game.maps[game.hero.floor] : null
  const w = (map?.width ?? 13) * TILE
  const h = (map?.height ?? 13) * TILE

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !game) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMap(ctx, game)
  }, [game, w, h])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!game) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * (map?.width ?? 13))
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * (map?.height ?? 13))
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

import { box, buildSprite, ellipse, INK, line, poly, type C } from './art.ts'

export const BCELL = 8
export const WATER_SPACING = 12
export const TOWER_HEIGHT = 164
export const TOWER_SPACING = 80
export const TOWER_HP = 500
export const TOWER_ROOF = 128
export const TOWER_COLLAPSE = 0.7
export const TREE_HEIGHT = 108
export const TREE_SPACING = 60
const MAX_PUDDLES = 3000

export function drawTree(c: C, x: number, y: number) {
  c.save()
  c.translate(x, y)
  c.lineJoin = c.lineCap = 'round'
  c.lineWidth = 2.2
  c.strokeStyle = 'rgba(34,31,51,.12)'
  ellipse(c, 2, 0, 30, 8, 'rgba(34,31,51,.12)')
  c.strokeStyle = INK
  poly(c, '#9b6b47', -13, 2, -7, -20, -8, -62, 7, -62, 6, -22, 15, 3, 4, -2, -2, 2, -6, -2)
  c.lineWidth = 7
  line(c, -3, -40, -21, -62)
  line(c, 3, -47, 19, -68)
  c.strokeStyle = '#9b6b47'
  c.lineWidth = 3.5
  line(c, -3, -40, -21, -62)
  line(c, 3, -47, 19, -68)
  c.strokeStyle = '#674a36'
  c.lineWidth = 1.2
  line(c, -3, -32, -2, -18, -5, -6)
  line(c, 3, -26, 2, -12, 7, -3)
  c.strokeStyle = INK
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(-24, -49)
  c.bezierCurveTo(-43, -49, -45, -71, -31, -78)
  c.bezierCurveTo(-36, -94, -19, -103, -9, -98)
  c.bezierCurveTo(-1, -113, 19, -108, 22, -94)
  c.bezierCurveTo(40, -98, 47, -78, 35, -68)
  c.bezierCurveTo(45, -52, 29, -40, 16, -46)
  c.bezierCurveTo(5, -35, -13, -39, -16, -49)
  c.quadraticCurveTo(-20, -47, -24, -49)
  c.closePath()
  c.fillStyle = '#72ad65'
  c.fill()
  c.stroke()
  c.strokeStyle = '#4c8251'
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(-29, -67)
  c.quadraticCurveTo(-22, -57, -13, -64)
  c.moveTo(-3, -54)
  c.quadraticCurveTo(6, -46, 16, -56)
  c.moveTo(22, -80)
  c.quadraticCurveTo(31, -76, 29, -67)
  c.stroke()
  c.strokeStyle = '#a7cf7e'
  line(c, -23, -83, -19, -88, -12, -88)
  line(c, -2, -94, 4, -98, 10, -94)
  c.restore()
}

export function buildTreeIcon() {
  return buildSprite((c) => {
    c.translate(24, 44)
    c.scale(0.37, 0.37)
    drawTree(c, 0, 0)
  }, undefined, [0, 0, 0], false)
}

export function drawTower(c: C, x: number, y: number, health = 1, collapse = 0) {
  c.save()
  c.translate(x, y)
  c.rotate(-collapse * 1.3)
  c.globalAlpha *= 1 - collapse * 0.8
  c.lineWidth = 2.2
  c.lineJoin = c.lineCap = 'round'
  c.strokeStyle = 'rgba(34,31,51,.12)'
  ellipse(c, 3, 0, 37, 10, 'rgba(34,31,51,.12)')
  c.strokeStyle = INK
  box(c, -28, -12, 56, 17, 4, '#a6a4b4')
  box(c, -23, -126, 46, 114, 3, '#d5d1dd')
  poly(c, '#aaa5bd', 12, -126, 23, -126, 23, -12, 12, -12)
  c.strokeStyle = '#aaa4ba'
  c.lineWidth = 1.1
  for (let row = 0; row < 6; row++) {
    const y = -112 + row * 17
    line(c, -22, y, 22, y)
    const seam = row % 2 ? -8 : 6
    line(c, seam, y, seam, y + 16)
  }
  c.strokeStyle = INK
  c.lineWidth = 2.2
  box(c, -6, -106, 12, 22, 6, '#565369')
  line(c, 0, -103, 0, -88)
  box(c, -6, -71, 12, 21, 6, '#565369')
  line(c, 0, -68, 0, -54)
  box(c, -9, -35, 18, 23, 8, '#766252')
  line(c, 0, -32, 0, -13)
  c.lineWidth = 1.2
  line(c, -5, -24, 5, -24)
  c.lineWidth = 2.2
  poly(c, '#e1dce8', -29, -117, -29, -140, -18, -140, -18, -130,
    -6, -130, -6, -140, 6, -140, 6, -130, 18, -130, 18, -140, 29, -140, 29, -117)
  line(c, 23, -141, 23, -TOWER_HEIGHT)
  poly(c, '#e8bb58', 24, -163, 45, -158, 38, -153, 24, -154)
  if (health < 0.7) {
    c.strokeStyle = INK
    c.lineWidth = 1.5
    line(c, -17, -115, -10, -99, -15, -86, -7, -73)
    if (health < 0.35) line(c, 18, -78, 9, -62, 15, -46, 7, -30, 12, -13)
  }
  c.restore()
  if (health < 1 && collapse === 0) {
    c.save()
    c.fillStyle = '#221f33'
    c.fillRect(x - 25, y + 10, 50, 6)
    c.fillStyle = health > 0.35 ? '#e8bb58' : '#e5484d'
    c.fillRect(x - 24, y + 11, 48 * Math.max(0, health), 4)
    c.restore()
  }
}

export function buildTowerIcon() {
  return buildSprite((c) => {
    c.translate(24, 44)
    c.scale(0.24, 0.24)
    drawTower(c, 0, 0)
  }, undefined, [0, 0, 0], false)
}

export class WaterTerrain {
  bmask = new Uint8Array(1)
  bcols = 1
  waterVer = 0
  private width = 1
  private height = 1
  private puddles: { x: number; y: number; radius: number }[] = []

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.bcols = Math.max(2, Math.ceil(width / BCELL))
    this.bmask = new Uint8Array(this.bcols * Math.max(2, Math.ceil(height / BCELL)))
    for (const puddle of this.puddles) this.stamp(puddle)
    this.waterVer++
  }

  paint(x: number, y: number, habitat = false) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > this.width || y > this.height) return
    if (this.puddles.length >= MAX_PUDDLES) {
      if (!habitat) return
      // A water-bound fighter still needs a home when the brush limit is full.
      this.puddles.shift()
      this.bmask.fill(0)
      for (const puddle of this.puddles) this.stamp(puddle)
    }
    const puddle = { x, y, radius: 18 * (0.85 + Math.random() * 0.3) }
    this.puddles.push(puddle)
    this.stamp(puddle)
    this.waterVer++
  }

  private stamp({ x, y, radius }: { x: number; y: number; radius: number }) {
    const rows = this.bmask.length / this.bcols
    for (let gy = Math.max(0, Math.floor((y - radius) / BCELL)); gy <= Math.min(rows - 1, Math.floor((y + radius) / BCELL)); gy++) {
      for (let gx = Math.max(0, Math.floor((x - radius) / BCELL)); gx <= Math.min(this.bcols - 1, Math.floor((x + radius) / BCELL)); gx++) {
        if (((gx + 0.5) * BCELL - x) ** 2 + ((gy + 0.5) * BCELL - y) ** 2 <= radius * radius) {
          this.bmask[gy * this.bcols + gx] = 2
        }
      }
    }
  }

  inWater(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false
    return this.bmask[Math.floor(y / BCELL) * this.bcols + Math.floor(x / BCELL)] === 2
  }

  clear() {
    this.puddles = []
    this.bmask.fill(0)
    this.waterVer++
  }
}

export function buildWaterIcon() {
  return buildSprite((c) => {
    c.lineWidth = 1.2
    c.strokeStyle = '#72c3cf'
    ellipse(c, 24, 27, 20, 13, '#9fe4eb')
    c.strokeStyle = '#5aa5d4'
    ellipse(c, 25, 28, 13, 8, '#66b9e6')
    c.strokeStyle = '#e4faff'
    c.beginPath()
    c.moveTo(15, 25)
    c.quadraticCurveTo(19, 23, 24, 25)
    c.stroke()
  }, undefined, [0, 0, 0], false)
}

import { BCELL, type WaterTerrain } from './terrain.ts'

// Water is drawn from the sim's puddle mask, so what you see is exactly where fighters slow down:
// blur the mask, trace smooth outlines through it (marching squares), then slide soft patches over it.
const SHALLOW = '#9fe4eb', SHORE = '#72c3cf', DEEP = '#66b9e6', DEEP_EDGE = '#5aa5d4'
const SHORE_ISO = 0.5 // halfway up the blurred mask = on the mask's edge
const DEEP_ISO = 0.82 // with the wider blur this sits ~25px in from the shore; thin strokes never get that deep
const SINK = 11, SINK_DEEP = 6 // px a wader goes under in the shallows, and how much more in the deep
const DRIFT = [[16, 6, 1], [-11, 10, 0.7]] as const // two patch layers sliding different ways, so the patches change shape

let source: WaterTerrain | undefined
let ver = -1, cw = 0, ch = 0, cols = 0, rows = 0
let shore = new Float32Array(0), deep = new Float32Array(0)
let x0 = 0, y0 = 0, x1 = -1, y1 = -1 // device-px box around the water; empty when x1 < x0
let still: HTMLCanvasElement | undefined // the water itself, redrawn only when the terrain changes
let moving: HTMLCanvasElement | undefined // this frame's patches, cut to the water's shape
let pattern: CanvasPattern | null = null
let patternDpr = 0

// box blur, run `passes` times (three passes is close to a gaussian); edges repeat outward
function blur(src: Float32Array, r: number, passes: number) {
  const a = Float32Array.from(src), b = new Float32Array(src.length), n = 2 * r + 1
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < rows; y++) {
      const o = y * cols
      let sum = 0
      for (let k = -r; k <= r; k++) sum += a[o + Math.min(cols - 1, Math.max(0, k))]
      for (let x = 0; x < cols; x++) {
        b[o + x] = sum / n
        sum += a[o + Math.min(cols - 1, x + r + 1)] - a[o + Math.max(0, x - r)]
      }
    }
    for (let x = 0; x < cols; x++) {
      let sum = 0
      for (let k = -r; k <= r; k++) sum += b[Math.min(rows - 1, Math.max(0, k)) * cols + x]
      for (let y = 0; y < rows; y++) {
        a[y * cols + x] = sum / n
        sum += b[Math.min(rows - 1, y + r + 1) * cols + x] - b[Math.max(0, y - r) * cols + x]
      }
    }
  }
  return a
}

// The area where f >= iso as one fill path, plus its outline as a stroke path. Each cell adds the
// polygon of its corners that are in plus the points where its edges cross iso; filling all of them
// in one go leaves no seams between cells.
function contour(f: Float32Array, iso: number, s: number, g0: number[], g1: number[]) {
  const fill = new Path2D(), edge = new Path2D()
  const px = (gx: number) => (gx === 0 ? 0 : gx === cols - 1 ? cw : (gx + 0.5) * s) // stretch to the canvas edge
  const py = (gy: number) => (gy === 0 ? 0 : gy === rows - 1 ? ch : (gy + 0.5) * s)
  const cx = [0, 1, 1, 0], cy = [0, 0, 1, 1]
  const v = [0, 0, 0, 0], pts: number[] = [], cross: boolean[] = []
  for (let gy = g0[1]; gy < g1[1]; gy++)
    for (let gx = g0[0]; gx < g1[0]; gx++) {
      const k = gy * cols + gx
      v[0] = f[k]; v[1] = f[k + 1]; v[2] = f[k + cols + 1]; v[3] = f[k + cols]
      if (v[0] < iso && v[1] < iso && v[2] < iso && v[3] < iso) continue
      pts.length = cross.length = 0
      for (let c = 0; c < 4; c++) {
        const d = (c + 1) & 3, a = v[c], b = v[d]
        const ax = px(gx + cx[c]), ay = py(gy + cy[c])
        if (a >= iso) { pts.push(ax, ay); cross.push(false) }
        if (a >= iso !== b >= iso) {
          const t = (iso - a) / (b - a)
          pts.push(ax + (px(gx + cx[d]) - ax) * t, ay + (py(gy + cy[d]) - ay) * t)
          cross.push(true)
        }
      }
      fill.moveTo(pts[0], pts[1])
      for (let p = 2; p < pts.length; p += 2) fill.lineTo(pts[p], pts[p + 1])
      fill.closePath()
      for (let p = 0; p < cross.length; p++) { // the shore runs between neighbouring crossing points
        const q = (p + 1) % cross.length
        if (!cross[p] || !cross[q]) continue
        edge.moveTo(pts[p * 2], pts[p * 2 + 1])
        edge.lineTo(pts[q * 2], pts[q * 2 + 1])
      }
    }
  return [fill, edge] as const
}

function build(sim: WaterTerrain, dpr: number) {
  const mask = sim.bmask
  cols = sim.bcols
  rows = mask.length / cols
  const m = new Float32Array(mask.length)
  let gx0 = cols, gy0 = rows, gx1 = -1, gy1 = -1
  for (let k = 0; k < mask.length; k++) {
    if (!(mask[k] & 2)) continue
    m[k] = 1
    const gx = k % cols, gy = (k / cols) | 0
    gx0 = Math.min(gx0, gx); gx1 = Math.max(gx1, gx); gy0 = Math.min(gy0, gy); gy1 = Math.max(gy1, gy)
  }
  still ??= document.createElement('canvas')
  still.width = cw // also wipes it
  still.height = ch
  x1 = y1 = -1
  if (gx1 < 0 || rows < 2) return
  shore = blur(m, 1, 2)
  deep = blur(m, 3, 3)
  for (let k = 0; k < m.length; k++) { // a gentle wobble, so the shore waves like a hand-drawn pond
    const gx = k % cols, gy = (k / cols) | 0
    const n = Math.sin(gx * 1.3 + Math.sin(gy * 0.7) * 2) + Math.sin(gy * 1.1 + gx * 0.4)
    shore[k] += n * 0.06
    deep[k] += n * 0.025
  }
  const g0 = [Math.max(0, gx0 - 3), Math.max(0, gy0 - 3)], g1 = [Math.min(cols - 1, gx1 + 3), Math.min(rows - 1, gy1 + 3)]
  const s = BCELL * dpr
  x0 = Math.floor(g0[0] === 0 ? 0 : g0[0] * s)
  y0 = Math.floor(g0[1] === 0 ? 0 : g0[1] * s)
  x1 = Math.ceil(g1[0] === cols - 1 ? cw : (g1[0] + 1) * s)
  y1 = Math.ceil(g1[1] === rows - 1 ? ch : (g1[1] + 1) * s)
  const [sf, se] = contour(shore, SHORE_ISO, s, g0, g1), [df, de] = contour(deep, DEEP_ISO, s, g0, g1)
  const g = still.getContext('2d')!
  g.fillStyle = SHALLOW
  g.fill(sf)
  g.fillStyle = DEEP
  g.fill(df)
  g.lineWidth = 1.2 * dpr
  g.lineCap = 'round'
  g.strokeStyle = DEEP_EDGE
  g.stroke(de)
  g.strokeStyle = SHORE
  g.stroke(se)
}

// a seamless tile of soft dark and light blotches
function makePattern(m: CanvasRenderingContext2D, dpr: number) {
  const T = Math.round(384 * dpr), tile = document.createElement('canvas')
  tile.width = tile.height = T
  const g = tile.getContext('2d')!
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let k = 0; k < 18; k++) {
    const x = rnd() * T, y = rnd() * T, r = (45 + rnd() * 55) * dpr, rgb = k % 3 ? '20,80,120' : '255,255,255'
    for (const ox of [-T, 0, T])
      for (const oy of [-T, 0, T]) { // drawn again one tile over in every direction, so the edges wrap
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
        gr.addColorStop(0, `rgba(${rgb},${k % 3 ? 0.13 : 0.1})`)
        gr.addColorStop(1, `rgba(${rgb},0)`)
        g.fillStyle = gr
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
      }
  }
  pattern = m.createPattern(tile, 'repeat')
  patternDpr = dpr
}

export function drawWater(c: CanvasRenderingContext2D, sim: WaterTerrain, tick: number, dpr: number, offsetX = 0, offsetY = 0) {
  if (source !== sim || ver !== sim.waterVer || cw !== c.canvas.width || ch !== c.canvas.height) {
    cw = c.canvas.width
    ch = c.canvas.height
    build(sim, dpr)
    ver = sim.waterVer
    source = sim
  }
  if (x1 < x0 || !still) return
  c.setTransform(1, 0, 0, 1, offsetX * dpr, offsetY * dpr)
  c.drawImage(still, 0, 0)

  const w = x1 - x0, h = y1 - y0
  moving ??= document.createElement('canvas')
  if (moving.width !== w || moving.height !== h) { moving.width = w; moving.height = h }
  const m = moving.getContext('2d')!
  if (patternDpr !== dpr) makePattern(m, dpr)
  m.setTransform(1, 0, 0, 1, 0, 0)
  m.globalCompositeOperation = 'copy' // the first layer replaces last frame's
  const t = tick / 60
  for (const [vx, vy, a] of DRIFT) {
    const ox = t * vx * dpr - x0, oy = t * vy * dpr - y0 // patterns are pinned to the origin, so move the origin
    m.setTransform(1, 0, 0, 1, ox, oy)
    m.globalAlpha = a
    m.fillStyle = pattern!
    m.fillRect(-ox, -oy, w, h)
    m.globalCompositeOperation = 'source-over'
  }
  m.setTransform(1, 0, 0, 1, 0, 0)
  m.globalAlpha = 1
  m.globalCompositeOperation = 'destination-in' // keep the patches only where there is water
  m.drawImage(still, -x0, -y0)
  c.drawImage(moving, x0, y0)
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// how many px of a fighter standing at (x, y) are under water
export function sinkAt(x: number, y: number) {
  if (x1 < x0) return 0
  const fx = x / BCELL - 0.5, fy = y / BCELL - 0.5
  const gx = Math.min(cols - 2, Math.max(0, Math.floor(fx))), gy = Math.min(rows - 2, Math.max(0, Math.floor(fy)))
  const tx = Math.min(1, Math.max(0, fx - gx)), ty = Math.min(1, Math.max(0, fy - gy)), k = gy * cols + gx
  const at = (f: Float32Array) =>
    (f[k] * (1 - tx) + f[k + 1] * tx) * (1 - ty) + (f[k + cols] * (1 - tx) + f[k + cols + 1] * tx) * ty
  return SINK * smooth(0.4, 0.6, at(shore)) + SINK_DEEP * smooth(0.75, 0.95, at(deep))
}

import type { C } from './art.ts'

// Ink-wind charge: tapered black-ink ribbons pulled out of the air along curved paths into a weapon anchor, tightening
// and speeding up as the charge fills, then a directional brush slash on release. Everything is drawn in the caller's
// current space (a fighter's mirrored, scaled sprite space), so it follows movement, facing and size for free.
// Deterministic: the same (progress, elapsed, seed) always draws the same frame, so nothing flickers or jitters.
export interface InkChargeOptions {
  ribbons: number // streams drawn, capped at INK_MAX_RIBBONS
  radius: number // how far from the anchor the streams are gathered from
  width: number // widest half-width of a stream
}
export const INK_CHARGE: InkChargeOptions = { ribbons: 7, radius: 26, width: 1.5 }
export const INK_MAX_RIBBONS = 10
// How long the release brush slash lasts, in seconds.
export const INK_SLASH_LIFE = 0.18

const SAMPLES = 12
// Scratch buffers reused every ribbon so drawing allocates nothing.
const px = new Float32Array(SAMPLES), py = new Float32Array(SAMPLES)
const nx = new Float32Array(SAMPLES), ny = new Float32Array(SAMPLES), pw = new Float32Array(SAMPLES)
// The brief's palette as rgb triples: deep ink, near-black, dark gray, smoke gray.
const DEEP = '34,31,51', BLACK = '21,21,29', GRAY = '80,80,94', SMOKE = '154,154,168'

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const frac = (x: number) => x - Math.floor(x)
const smooth = (from: number, to: number, x: number) => {
  const t = clamp01((x - from) / (to - from))
  return t * t * (3 - 2 * t)
}

// Fill the sampled ribbon as one tapered shape: out along one edge, back along the other.
function fillRibbon(c: C, scale: number, style: string) {
  c.beginPath()
  for (let j = 0; j < SAMPLES; j++) c.lineTo(px[j] + nx[j] * pw[j] * scale, py[j] + ny[j] * pw[j] * scale)
  for (let j = SAMPLES - 1; j >= 0; j--) c.lineTo(px[j] - nx[j] * pw[j] * scale, py[j] - ny[j] * pw[j] * scale)
  c.closePath()
  c.fillStyle = style
  c.fill()
}

// `progress` 0..1 through the charge, `elapsed` seconds since it began, (ax, ay) the weapon anchor.
// Phases: awakening (0–20%) faint slow wisps; gathering (20–65%) every stream flowing in; compression (65–95%)
// faster, tighter, thinner, longer streams and a dark wind knot round the anchor; past 95% they slam home.
export function drawInkCharge(c: C, ax: number, ay: number, progress: number, elapsed: number, seed: number, options = INK_CHARGE) {
  const p = clamp01(progress)
  const gather = smooth(0.2, 0.65, p), squeeze = smooth(0.65, 0.95, p)
  const count = Math.min(INK_MAX_RIBBONS, options.ribbons)
  c.save()
  for (let i = 0; i < count; i++) {
    const k = i + seed * 0.618
    const start = i / count * 0.45 // streams join one after another through awakening and gathering
    const alpha = smooth(start, start + 0.2, p) * (0.35 + 0.65 * gather)
    if (alpha <= 0.01) continue
    // Phase grows with time plus a p³ term, so the flow speeds up smoothly without the phase ever jumping.
    const u = frac(frac(k * 0.53) + elapsed * (0.6 + 0.3 * frac(k * 0.71)) + 1.6 * p * p * p)
    const envelope = smooth(0, 0.18, u) * (1 - smooth(0.82, 1, u)) // born in the air, swallowed by the weapon
    if (envelope <= 0.01) continue
    const turn = (i % 2 ? 1 : -1)
    const a0 = k * 2.39996 + elapsed * 0.5 * turn
    const reach = options.radius * (1 - 0.35 * squeeze) * (0.85 + 0.3 * frac(k * 0.29))
    const sx = ax + Math.cos(a0) * reach, sy = ay + Math.sin(a0) * reach * 0.75
    // The control point swings off the straight line, harder as the curl tightens.
    const curl = turn * (0.45 + 0.25 * frac(k * 0.37)) * (1 + 0.8 * squeeze)
    const cx = (sx + ax) / 2 - (ay - sy) * curl, cy = (sy + ay) / 2 + (ax - sx) * curl
    const head = u ** (1.6 - 0.5 * squeeze) // accelerates as it nears the weapon
    const tail = Math.max(0, head - (0.3 + 0.25 * squeeze))
    const wobble = 1.6 - 1.2 * squeeze, width = options.width * (1 - 0.45 * squeeze)
    for (let j = 0; j < SAMPLES; j++) {
      const s = j / (SAMPLES - 1), t = tail + (head - tail) * s, m = 1 - t
      let x = m * m * sx + 2 * m * t * cx + t * t * ax, y = m * m * sy + 2 * m * t * cy + t * t * ay
      const tx = 2 * m * (cx - sx) + 2 * t * (ax - cx), ty = 2 * m * (cy - sy) + 2 * t * (ay - cy)
      const length = Math.hypot(tx, ty) || 1
      nx[j] = -ty / length; ny[j] = tx / length
      const sway = wobble * Math.sin(t * 7 + elapsed * 6 + k) * m // sways in the wind, settling at the anchor
      x += nx[j] * sway; y += ny[j] * sway
      px[j] = x; py[j] = y
      pw[j] = width * Math.sin(Math.PI * s) ** 0.8 * (0.85 + 0.15 * Math.sin(s * 9 + k * 3))
    }
    const a = alpha * envelope
    fillRibbon(c, 2.3, `rgba(${SMOKE},${0.16 * a})`) // soft translucent edge
    fillRibbon(c, 1, `rgba(${i % 3 === 2 ? GRAY : DEEP},${0.6 * a})`) // brush body
    fillRibbon(c, 0.38, `rgba(${BLACK},${0.85 * a})`) // dark defined centre
  }
  if (squeeze > 0) { // compression: a small dark knot of wind turning round the blade
    const knot = c.createRadialGradient(ax, ay, 0, ax, ay, 6)
    knot.addColorStop(0, `rgba(${BLACK},${0.32 * squeeze})`)
    knot.addColorStop(1, `rgba(${BLACK},0)`)
    c.fillStyle = knot
    c.beginPath(); c.arc(ax, ay, 6, 0, Math.PI * 2); c.fill()
    c.lineCap = 'round'
    for (let m = 0; m < 3; m++) {
      const r = 2.6 + m * 1.5 + (1 - squeeze) * 2, spin = elapsed * (9 + m * 3) * (m % 2 ? -1 : 1) + m * 2.1
      c.strokeStyle = `rgba(${DEEP},${0.5 * squeeze})`; c.lineWidth = 0.6
      c.beginPath(); c.ellipse(ax, ay, r, r * 0.7, 0, spin, spin + 1.7); c.stroke()
    }
  }
  c.restore()
}

// The release: a fast tapered brushstroke shooting along `angle` from the anchor, gone after INK_SLASH_LIFE.
// `t` 0..1 through its life; `length` how far it reaches at full stretch.
export function drawInkSlash(c: C, ax: number, ay: number, angle: number, length: number, t: number) {
  if (t < 0 || t >= 1) return
  const out = 1 - (1 - t) ** 3, fade = (1 - t) ** 1.5
  const x0 = -length * 0.15, x1 = length * (0.35 + 0.65 * out), bow = -2.5, w = 3.2 * (1 - 0.6 * t)
  c.save()
  c.translate(ax, ay); c.rotate(angle)
  const stroke = (scale: number, style: string) => {
    c.beginPath()
    for (let j = 0; j < SAMPLES; j++) {
      const s = j / (SAMPLES - 1)
      c.lineTo(x0 + (x1 - x0) * s, Math.sin(Math.PI * s) * bow - w * scale * Math.sin(Math.PI * s) ** 0.6 * (1 - 0.5 * s))
    }
    for (let j = SAMPLES - 1; j >= 0; j--) {
      const s = j / (SAMPLES - 1)
      c.lineTo(x0 + (x1 - x0) * s, Math.sin(Math.PI * s) * bow + w * scale * Math.sin(Math.PI * s) ** 0.6 * (1 - 0.5 * s))
    }
    c.closePath()
    c.fillStyle = style
    c.fill()
  }
  stroke(1.8, `rgba(${SMOKE},${0.22 * fade})`)
  stroke(1, `rgba(${DEEP},${0.85 * fade})`)
  // Dry-brush hairs splitting off the trailing half.
  c.strokeStyle = `rgba(${BLACK},${0.6 * fade})`; c.lineWidth = 0.4; c.lineCap = 'round'
  for (const offset of [-1.6, 0.4, 2]) {
    c.beginPath()
    c.moveTo(x0 + (x1 - x0) * 0.45, bow * 0.9 + offset)
    c.quadraticCurveTo(x0 + (x1 - x0) * 0.75, bow * 0.6 + offset * 1.3, x1 * 0.98, offset * 0.6)
    c.stroke()
  }
  c.restore()
}

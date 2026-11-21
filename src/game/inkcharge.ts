import type { C } from './art.ts'

// Ink-wind charge: loose black-and-white gusts sweep inward and disappear into the weapon, then a directional brush
// slash on release. Everything is drawn in the caller's
// current space (a fighter's mirrored, scaled sprite space), so it follows movement, facing and size for free.
// Deterministic: the same (progress, elapsed, seed) always draws the same frame, so nothing flickers or jitters.
export interface InkChargeOptions {
  ribbons: number // streams drawn, capped at INK_MAX_RIBBONS
  radius: number // how far from the anchor the streams are gathered from
  width: number // widest half-width of a stream
}
export const INK_CHARGE: InkChargeOptions = { ribbons: 7, radius: 150, width: 3.8 }
export const INK_MAX_RIBBONS = 10
// How long the release brush slash lasts, in seconds.
export const INK_SLASH_LIFE = 0.18

const SAMPLES = 24
// Scratch buffers reused every ribbon so drawing allocates nothing.
const px = new Float32Array(SAMPLES), py = new Float32Array(SAMPLES)
const nx = new Float32Array(SAMPLES), ny = new Float32Array(SAMPLES), pw = new Float32Array(SAMPLES)
// RGB triples: deep ink, near-black, dark gray, smoke gray and white wind.
const DEEP = '34,31,51', BLACK = '21,21,29', GRAY = '80,80,94', SMOKE = '154,154,168', WHITE = '255,255,255'

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const frac = (x: number) => x - Math.floor(x)
const smooth = (from: number, to: number, x: number) => {
  const t = clamp01((x - from) / (to - from))
  return t * t * (3 - 2 * t)
}

// Fill the sampled ribbon as one tapered shape: out along one edge, back along the other.
function fillRibbon(c: C, scale: number, style: string, offset = 0) {
  c.beginPath()
  for (let j = 0; j < SAMPLES; j++) c.lineTo(px[j] + nx[j] * pw[j] * (offset + scale), py[j] + ny[j] * pw[j] * (offset + scale))
  for (let j = SAMPLES - 1; j >= 0; j--) c.lineTo(px[j] + nx[j] * pw[j] * (offset - scale), py[j] + ny[j] * pw[j] * (offset - scale))
  c.closePath()
  c.fillStyle = style
  c.fill()
}

// `progress` 0..1 through the charge, `elapsed` seconds since it began, (ax, ay) the weapon anchor.
// Each gust travels along a swept path; its head reaches the tip before its trailing wind is swallowed.
export function drawInkCharge(c: C, ax: number, ay: number, progress: number, elapsed: number, seed: number, options = INK_CHARGE) {
  const p = clamp01(progress)
  const gather = smooth(0.2, 0.65, p), squeeze = smooth(0.65, 0.95, p)
  const count = Math.min(INK_MAX_RIBBONS, options.ribbons)
  c.save()
  for (let i = 0; i < count; i++) {
    const k = i + seed * 0.618
    const start = frac(k * 0.37) * 0.3
    const alpha = smooth(start, start + 0.2, p) * (0.35 + 0.65 * gather)
    if (alpha <= 0.01) continue
    const phase = frac(k * 0.53) + elapsed * (0.65 + 0.25 * frac(k * 0.71)) + 0.2 * p * p
    const u = frac(phase), gust = k + Math.floor(phase) * 2.71
    const envelope = smooth(0, 0.12, u)
    if (envelope <= 0.01) continue
    // Uneven sources share one circulation; a new path appears only when the previous gust has vanished.
    const a0 = gust * 2.39996
    const reach = options.radius * (0.85 + 0.3 * frac(gust * 0.29))
    const sweep = 0.8 + 0.65 * frac(gust * 0.37), squash = 0.5 + 0.2 * frac(gust * 0.43)
    const head = Math.min(1, u / 0.65), tail = Math.max(0, (u - 0.55) / 0.45)
    const width = options.width * (0.75 + 0.35 * frac(gust * 0.61)) * Math.sqrt(head - tail)
    for (let j = 0; j < SAMPLES; j++) {
      const s = j / (SAMPLES - 1), t = tail + (head - tail) * s
      const angle = a0 + sweep * t, r = reach * (1 - t)
      const cos = Math.cos(angle), sin = Math.sin(angle)
      const x = ax + cos * r, y = ay + sin * r * squash
      const tx = -reach * cos - r * sin * sweep, ty = (-reach * sin + r * cos * sweep) * squash
      const length = Math.hypot(tx, ty) || 1
      nx[j] = -ty / length; ny[j] = tx / length
      px[j] = x; py[j] = y
      pw[j] = width * Math.sin(Math.PI * s) ** 0.7 * (1 - 0.35 * t)
    }
    const a = alpha * envelope
    fillRibbon(c, 2.6, `rgba(${SMOKE},${0.1 * a})`)
    fillRibbon(c, 1.5, `rgba(${WHITE},${0.12 * a})`, 0.8) // broad, faint wind veil
    fillRibbon(c, 1, `rgba(${i % 3 === 2 ? GRAY : DEEP},${0.55 * a})`)
    fillRibbon(c, 0.38, `rgba(${BLACK},${0.75 * a})`)
    fillRibbon(c, 0.12 + 0.12 * frac(gust * 0.83), `rgba(${WHITE},${(0.25 + 0.3 * frac(gust * 0.67)) * a})`, 1.1)
  }
  if (squeeze > 0) {
    const knot = c.createRadialGradient(ax, ay, 0, ax, ay, 6)
    knot.addColorStop(0, `rgba(${WHITE},${0.45 * squeeze})`)
    knot.addColorStop(0.25, `rgba(${BLACK},${0.25 * squeeze})`)
    knot.addColorStop(1, `rgba(${BLACK},0)`)
    c.fillStyle = knot
    c.beginPath(); c.arc(ax, ay, 6, 0, Math.PI * 2); c.fill()
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
  stroke(0.16, `rgba(${WHITE},${0.8 * fade})`)
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

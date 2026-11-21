import { bladeArc, box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2d2b0', HAIR = '#1e1c26', HAIR_SHINE = '#3e3b4c', GOLD = '#e0b04a', JADE = '#7fd8c0'
const ROBE = '#eef2f8', ROBE_SHADE = '#c9d3e3', TRIM = '#2f4f9a', TRIM_DARK = '#1f3570'
const STEEL = '#c7d0dc', EDGE = '#f4f8ff', VOLT = '#4aa8ff', VOLT_PALE = '#bfe6ff'

export const KUNLUN = {
  name: 'Kunlun Legend',
  blurb: 'A swordsman of the snowy Kunlun peaks in flowing robes, wielding a great curved blade that crackles with blue lightning',
  radius: 11, hp: 1150, speed: 165, damage: 40, range: 18, detection: 470,
  cooldown: 0.45, knockback: 100, spacing: 44, size: 1.25, color: TRIM,
} as const

// Lightning Step's timeline: circling, the dash through, then one strike every `every` seconds.
const STEP = { circle: 1, dash: 0.15, strikes: 4, every: 0.18 } as const

// His lightning kit (design: docs/superpowers/specs/2026-11-18-kunlun-lightning-kit-design.md). `time` is how long
// each skill's pose lasts; distances in px, times in seconds.
export const KUNLUN_SKILLS = {
  charge: { time: 0.8, damage: 20, stun: 0.3 }, // Thunder Charge, then a zap on every plain hit
  spin: { time: 0.6, cooldown: 9, chance: 0.3, far: 200, haste: 6, speed: 2, ghostEvery: 3, ghostLife: 0.3 },
  wall: { time: 0.3, cooldown: 6, life: 5, close: 40, distance: 45, width: 110, segments: 5, bend: 150, height: 34, block: 6 },
  dive: { time: 0.5, cooldown: 5, chance: 0.35, min: 60, max: 220, height: 50, radius: 85, damage: 75, air: 0.45, push: 40 },
  crescent: { time: 0.25, cooldown: 3, chance: 0.4, reach: 140, speed: 520, distance: 200, width: 70, damage: 55, knockback: 340 },
  strike: { time: 0.25, cooldown: 2.5, chance: 0.45, damage: 60, stun: 0.6, splash: 45, splashDamage: 30 },
  shield: { time: 0.3, cooldown: 9, chance: 0.5, below: 0.8, duration: 6, reduce: 0.6, radius: 27 }, // Thunder Shield
  step: { ...STEP, time: STEP.circle + STEP.dash + STEP.strikes * STEP.every, cooldown: 7, chance: 0.35, reach: 150,
    laps: 2, ring: 40, past: 30, slashDamage: 50, strikeDamage: 35, hold: 0.9, ghostEvery: 2 }, // Lightning Step
  clone: { time: 0.5, cooldown: 18, chance: 0.3, count: 3, hp: 120, power: 0.2, life: 8, spread: 45, daze: 1, dazeRadius: 220 }, // Lightning Clones
  sparks: { time: 0.9, cooldown: 5, chance: 0.4, orbit: 26, count: 5, speed: 600, damage: 35, stun: 0.3, life: 2 },
  rest: 50, // HP per second meditating with no enemy around, like the other heroes
  retry: 0.25, // out of sword reach with no skill rolled, he rolls again this often
} as const

// The great blade along +x from its guard: long wrapped two-hand grip with a ring pommel and blue tassel, a round
// bronze guard, and one broad blade whose back runs straight while the edge (+y) bellies out a little toward an
// up-swept tip. A thin blue groove runs its length.
function drawGreatBlade(c: C, length: number, width: number) {
  const w = width / 2, L = length
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1.1
  c.strokeStyle = VOLT
  line(c, -13.5, 0, -16, 1.5, -15, 4) // tassel
  c.strokeStyle = INK
  box(c, -12, -1.6, 12, 3.2, 1, TRIM_DARK)
  c.strokeStyle = '#4c6ab0'
  c.lineWidth = 0.7
  for (let x = -11; x < -1; x += 2) line(c, x, -1.3, x + 1, 1.3) // wrap
  c.strokeStyle = INK
  c.lineWidth = 1
  ellipse(c, -13, 0, 1.4, 1.4, GOLD)
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(1, -w)
  c.lineTo(L - 4, -w - 0.6)
  c.quadraticCurveTo(L + 0.5, -w - 0.8, L, -w + 1.6) // the tip, swept up toward the back
  c.quadraticCurveTo(L * 0.62, w + 1.4, 1, w) // the gently curved edge
  c.closePath()
  c.fillStyle = STEEL
  c.fill()
  c.stroke()
  c.strokeStyle = EDGE
  c.lineWidth = 0.8
  c.beginPath()
  c.moveTo(3, w - 0.8)
  c.quadraticCurveTo(L * 0.62, w + 0.4, L - 1.5, -w + 1.8)
  c.stroke()
  c.save()
  c.strokeStyle = VOLT
  c.shadowColor = VOLT
  c.shadowBlur = 3
  c.lineWidth = 0.9
  line(c, 3, -w * 0.35, L - 6, -w * 0.45) // the groove
  c.strokeStyle = VOLT_PALE
  c.lineWidth = 0.7
  line(c, L * 0.35, -w * 0.4, L * 0.42, w * 0.3, L * 0.5, -w * 0.2, L * 0.58, w * 0.35) // a spark along it
  c.restore()
  c.lineWidth = 1.1
  ellipse(c, 0.5, 0, 1.8, w + 2, '#b8893a') // round guard, seen edge-on
  c.restore()
}

export type KunlunPose = 'ready' | 'raise' | 'point' | 'slash'
// Where his front hand holds the grip (sprite units) and which way the blade points from it.
// Standing, the grip sits at his hip and the blade is a little shorter, so the tip stays inside the 48 px sprite.
const HANDS: Record<KunlunPose, readonly [number, number]> = { ready: [37.5, 32.5], raise: [34.5, 5], point: [40, 15], slash: [40, 27] }
const BLADE_ANGLE: Record<KunlunPose, number> = { ready: -1.38, raise: -1.75, point: -0.85, slash: -0.05 }
const BLADE_LENGTH: Record<KunlunPose, number> = { ready: 26, raise: 28, point: 28, slash: 28 }

// The front sleeve from the shoulder out to the hand on the grip, with its blue cuff and the hand itself.
function frontArm(c: C, pose: KunlunPose) {
  const [hx, hy] = HANDS[pose]
  const sx = 31, sy = 22, d = Math.hypot(hx - sx, hy - sy), px = -(hy - sy) / d, py = (hx - sx) / d
  poly(c, ROBE, sx + px * 4.5, sy + py * 4.5, hx + px * 2.4, hy + py * 2.4, hx - px * 2.4, hy - py * 2.4, sx - px * 4.5, sy - py * 4.5)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1.2
  const ux = (hx - sx) / d, uy = (hy - sy) / d
  line(c, hx - ux * 1.5 - uy * 2.4, hy - uy * 1.5 + ux * 2.4, hx - ux * 1.5 + uy * 2.4, hy - uy * 1.5 - ux * 2.4) // cuff
  c.restore()
  if (pose === 'ready') { // only the standing pose carries the blade in the sprite; skill poses draw it live
    c.save()
    c.translate(hx, hy)
    c.rotate(BLADE_ANGLE.ready)
    c.translate(5, 0)
    drawGreatBlade(c, BLADE_LENGTH.ready, 8.5)
    c.restore()
  }
  c.save()
  c.lineWidth = 1.2
  ellipse(c, hx, hy, 2.3, 2.3, SKIN)
  c.restore()
}

function drawKunlun(c: C, pose: KunlunPose, step?: number) {
  // Long black hair falling down his back from the topknot.
  poly(c, HAIR, 18, 9, 13.5, 15, 12.5, 26, 14.5, 31, 17, 27, 19.5, 18)

  // Back sleeve: wide hanging hanfu sleeve with a blue cuff.
  poly(c, ROBE_SHADE, 17, 20, 11.5, 25, 9.5, 33, 16.5, 33, 19, 26)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1.2
  line(c, 9.9, 31.8, 16.3, 31.8)
  c.restore()

  // Cloth shoes peeking out under the robe.
  leg(c, step, 20, 34, () => box(c, 15, 40, 8, 4, 1.5, TRIM_DARK))
  leg(c, opposite(step), 28, 34, () => box(c, 26, 40, 8, 4, 1.5, TRIM_DARK))

  // Ankle-length robe flaring at the hem, with a blue hem band.
  poly(c, ROBE, 16, 19, 32, 19, 36, 41, 12.5, 41)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1.6
  line(c, 13.2, 39.6, 35.3, 39.6)
  // Crossed collar: the right lapel over the left, down to the sash, and the overlap running to the hem.
  c.lineWidth = 2
  line(c, 21, 19.5, 28.5, 28.5)
  line(c, 30, 19.5, 27, 24)
  c.strokeStyle = ROBE_SHADE
  c.lineWidth = 0.8
  line(c, 28.5, 31.5, 30.5, 39)
  line(c, 17, 32, 15.5, 39)
  c.restore()

  // Sash with its hanging tails (team colour is drawn over it).
  c.save()
  c.lineWidth = 1.1
  box(c, 14.5, 28.5, 19.5, 3.2, 1, TRIM)
  c.strokeStyle = TRIM_DARK
  c.lineWidth = 1.3
  line(c, 25, 31.5, 24, 36.5)
  line(c, 26.5, 31.5, 27, 35.5)
  c.restore()

  // Front sleeve reaching to the hand on the grip; raised overhead it passes in front of the head instead.
  if (pose !== 'raise') frontArm(c, pose)

  // Head: neat black hair combed back into a topknot, a jade-tipped gold hairpin run through it.
  c.save()
  c.lineWidth = 1.6
  ellipse(c, 25, 13, 7.5, 7.5, SKIN)
  c.lineWidth = 1.3
  poly(c, HAIR, 31.5, 8.5, 29, 6, 24, 5.2, 19.5, 6.5, 17.5, 10, 17.2, 15.5, 18.6, 19.5, 21, 18, 21.5, 13, 24, 10, 28.5, 9.2)
  ellipse(c, 23.5, 4.2, 3.6, 3, HAIR)
  c.strokeStyle = HAIR_SHINE
  c.lineWidth = 0.7
  line(c, 20, 8.5, 27, 6.8)
  line(c, 22, 3.2, 25, 2.6)
  c.strokeStyle = INK
  c.lineWidth = 0.9
  box(c, 21, 5.6, 5, 1.8, 0.6, '#b9c2d0') // small silver crown cup under the bun
  box(c, 16.5, 3.4, 15, 1.4, 0.7, GOLD)
  ellipse(c, 31.8, 4.1, 1.4, 1.4, JADE)
  c.lineWidth = 1.2
  line(c, 26.8, 11.2, 31, 10.4) // brow
  c.restore()
  c.save()
  c.lineWidth = 1.2
  ellipse(c, 29, 13.6, 2, 1.5, '#fff')
  c.fillStyle = '#3d7fe0'
  c.beginPath()
  c.arc(29.7, 13.6, 1.1, 0, Math.PI * 2)
  c.fill()
  c.lineWidth = 0.9
  line(c, 28.6, 18.6, 30.8, 18.2)
  c.restore()
  if (pose === 'raise') frontArm(c, pose)
}

export function buildKunlunSprite(color?: string, pose: KunlunPose = 'ready', step?: number) {
  return buildSprite((c) => drawKunlun(c, pose, step), color, [15, 28.5, 18])
}

const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3

// The cut, in fighter-local units (feet at 0,0, facing right): a broad crescent edged in blue lightning.
export function drawKunlunSwing(c: C, progress: number) {
  const swing = ease(progress * 2.4)
  c.save()
  c.translate(30 - 24, 22 - 44)
  bladeArc(c, 25, -1.8, 0.5, 11, swing + Math.max(0, progress - 0.4) * 1.7, VOLT, VOLT_PALE)
  c.restore()
}

const rnd = (i: number, k: number) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v) }
const INK_BLUE = '#14254f' // the ink edge under every bolt, so the pale light reads on the paper

type Pt = readonly [number, number]
type Path = { pts: Pt[]; w: number }

// A jagged path from (x1, y1) to (x2, y2) by midpoint displacement: each level halves every segment and pushes the
// new point sideways, half as far as the level before. `rough` is the first push as a fraction of the length.
function boltPoints(x1: number, y1: number, x2: number, y2: number, seed: number, levels: number, rough: number) {
  let pts: Pt[] = [[x1, y1], [x2, y2]]
  let push = Math.hypot(x2 - x1, y2 - y1) * rough
  for (let level = 0; level < levels; level++) {
    const next: Pt[] = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1
      const off = (rnd(seed + level * 31, i) - 0.5) * 2 * push
      next.push([(ax + bx) / 2 - dy / d * off, (ay + by) / 2 + dx / d * off], pts[i])
    }
    pts = next
    push *= 0.5
  }
  return pts
}

// Every path stroked in layers, all paths per layer so forks merge: a soft glow, the ink edge, blue, pale blue,
// then a white-hot core.
function strokeBolt(c: C, paths: Path[]) {
  const layer = (color: string, scale: number, alpha: number, blur = 0) => {
    c.save()
    c.strokeStyle = color
    c.globalAlpha *= alpha
    if (blur) { c.shadowColor = color; c.shadowBlur = blur }
    for (const { pts, w } of paths) {
      c.beginPath()
      c.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1])
      c.lineWidth = w * scale
      c.stroke()
    }
    c.restore()
  }
  c.save()
  c.lineCap = c.lineJoin = 'round'
  layer(VOLT, 7, 0.22, 10)
  layer(INK_BLUE, 3.4, 0.85)
  layer(VOLT, 2.4, 1)
  layer(VOLT_PALE, 1.4, 1)
  layer('#ffffff', 0.6, 1)
  c.restore()
}

// A forked lightning bolt from (x1, y1) to (x2, y2). `width` 1 is a full sky strike; `branches` fork off the main
// channel (each may grow a twig); `seed` picks the shape, so changing it every few ticks makes the bolt flicker.
export function drawLightning(c: C, x1: number, y1: number, x2: number, y2: number, width: number, seed: number, branches = 2, rough = 0.2) {
  const length = Math.hypot(x2 - x1, y2 - y1)
  if (length < 1) return
  const levels = Math.max(2, Math.min(6, Math.round(Math.log2(length / 4))))
  const main = boltPoints(x1, y1, x2, y2, seed, levels, rough), paths: Path[] = [{ pts: main, w: width }]
  const angle = Math.atan2(y2 - y1, x2 - x1)
  for (let b = 0; b < branches; b++) {
    const r = (k: number) => rnd(seed + 97 + b * 13, k)
    const i = Math.floor((0.2 + r(1) * 0.55) * (main.length - 1)), [sx, sy] = main[i]
    const a = angle + (r(2) < 0.5 ? -1 : 1) * (0.35 + r(3) * 0.6), reach = length * (1 - i / main.length) * (0.25 + r(4) * 0.3)
    const ex = sx + Math.cos(a) * reach, ey = sy + Math.sin(a) * reach
    const fork = boltPoints(sx, sy, ex, ey, seed + 7 + b, Math.max(1, levels - 2), rough * 1.2)
    paths.push({ pts: fork, w: width * 0.5 })
    if (r(5) < 0.6) { // a twig off the fork
      const [tx, ty] = fork[Math.floor(fork.length / 2)], ta = a + (r(6) < 0.5 ? -1 : 1) * 0.7
      paths.push({ pts: boltPoints(tx, ty, tx + Math.cos(ta) * reach * 0.45, ty + Math.sin(ta) * reach * 0.45, seed + 19 + b, 1, rough * 1.4), w: width * 0.28 })
    }
  }
  strokeBolt(c, paths)
}

// Where lightning meets the ground at (x, y): a white-hot flash flattened onto the ground, a ring rushing out and
// sparks spraying up. `fade` runs 1 → 0.
export function drawLightningFlash(c: C, x: number, y: number, size: number, fade: number, seed: number) {
  if (fade <= 0) return
  c.save()
  c.translate(x, y)
  c.save()
  c.scale(1, 0.42)
  const g = c.createRadialGradient(0, 0, 0, 0, 0, size)
  g.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`)
  g.addColorStop(0.3, `rgba(191,230,255,${0.7 * fade})`)
  g.addColorStop(1, 'rgba(74,168,255,0)')
  c.fillStyle = g
  c.beginPath()
  c.arc(0, 0, size, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = INK_BLUE
  c.globalAlpha = fade * 0.5
  c.lineWidth = 2.2
  c.beginPath()
  c.arc(0, 0, size * (1.3 - fade * 0.7), 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = VOLT_PALE
  c.globalAlpha = fade
  c.lineWidth = 1.2
  c.stroke()
  c.restore()
  c.globalAlpha = fade
  for (let k = 0; k < 6; k++) { // sparks thrown up and out
    const a = Math.PI + (k + 0.5) / 6 * Math.PI + (rnd(seed, k) - 0.5) * 0.4, out = size * (0.5 + (1 - fade) * 0.8)
    drawLightning(c, Math.cos(a) * size * 0.2, Math.sin(a) * size * 0.08, Math.cos(a) * out, Math.sin(a) * out * 0.6, 0.3, seed + k, 0)
  }
  c.restore()
}

// Crackling lightning running up the blade (blade-local: grip at the origin, blade along +x), `power` 0..1.
function crackle(c: C, tick: number, power: number, length: number) {
  if (power <= 0) return
  const seed = Math.floor(tick / 2), tip = length - 1
  c.save()
  c.globalAlpha *= Math.min(1, power)
  drawLightning(c, 4, 0, tip, -1.5, 0.42, seed, power >= 1 ? 1 : 0, 0.12)
  if (power >= 1) { // arcs leaping off the edge and the tip
    const at = 10 + rnd(seed, 9) * (length - 18)
    drawLightning(c, at, 1, at + 3 + rnd(seed, 8) * 5, 6 + rnd(seed, 7) * 5, 0.3, seed + 3, 0)
    drawLightning(c, tip, -1.5, tip + 5 + rnd(seed, 6) * 4, -6 + rnd(seed, 5) * 10, 0.3, seed + 5, 0)
  }
  c.restore()
}

// Live drawing over his sprite, in fighter-local units (feet at 0,0, facing right). Skill poses carry the blade
// here, turned by `sway`; `power` (0..1) is how charged it is. The standing pose only gets its crackle.
export function drawKunlunBlade(c: C, pose: KunlunPose, tick: number, power: number, sway = 0) {
  const [hx, hy] = HANDS[pose]
  c.save()
  c.translate(hx - 24, hy - 44)
  c.rotate(BLADE_ANGLE[pose] + sway)
  c.translate(5, 0)
  if (pose !== 'ready') drawGreatBlade(c, BLADE_LENGTH[pose], 8.5)
  crackle(c, tick, power, BLADE_LENGTH[pose])
  c.restore()
}

// A blue silhouette of `sprite`, for the afterimages Storm Spin leaves behind him.
export function buildKunlunGhost(sprite: HTMLCanvasElement) {
  const canvas = document.createElement('canvas')
  canvas.width = sprite.width
  canvas.height = sprite.height
  const c = canvas.getContext('2d')!
  c.drawImage(sprite, 0, 0)
  c.globalCompositeOperation = 'source-in'
  c.fillStyle = VOLT
  c.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

// One Lightning Wall segment standing on the ground from (x1, y1) to (x2, y2): a glowing curtain inked along its
// foot, forked bolts climbing it and motes drifting up. `fade` 0..1 dims it out at the end.
export function drawKunlunWall(c: C, x1: number, y1: number, x2: number, y2: number, height: number, fade: number, tick: number, seed: number) {
  if (fade <= 0) return
  const flicker = 0.85 + 0.15 * Math.sin(tick * 0.9 + seed)
  c.save()
  c.globalAlpha *= fade * flicker
  const g = c.createLinearGradient(0, Math.min(y1, y2) - height, 0, Math.max(y1, y2))
  g.addColorStop(0, 'rgba(74,168,255,0)')
  g.addColorStop(0.6, 'rgba(74,168,255,.22)')
  g.addColorStop(1, 'rgba(191,230,255,.55)')
  c.fillStyle = g
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x2, y2)
  c.lineTo(x2, y2 - height)
  c.lineTo(x1, y1 - height)
  c.closePath()
  c.fill()
  const roll = Math.floor(tick / 2) + Math.round(seed * 17)
  drawLightning(c, x1, y1, x2, y2, 0.55, roll, 1, 0.12) // along the ground
  for (let k = 0; k < 2; k++) { // bolts climbing the curtain
    const t = 0.25 + k * 0.5 + (rnd(roll, k) - 0.5) * 0.3, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t
    drawLightning(c, x, y, x + (rnd(roll, k + 4) - 0.5) * 10, y - height * (0.75 + rnd(roll, k + 8) * 0.3), 0.5, roll + k * 5, 1, 0.18)
  }
  c.fillStyle = '#ffffff'
  for (let k = 0; k < 4; k++) { // motes rising off it
    const t = rnd(seed, k + 20), rise = (tick * 0.02 + rnd(seed, k + 30)) % 1
    c.globalAlpha = fade * (1 - rise)
    c.beginPath()
    c.arc(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t - rise * height * 1.2, 1.1, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// The Crescent Slash wave at ground point (x, y) flying along `angle`: the glowing crescent, inked lightning running
// along its edge and sparks trailing off its tips. `fade` 0..1.
export function drawKunlunCrescent(c: C, x: number, y: number, angle: number, width: number, fade: number, tick: number) {
  const r = width * 0.55, roll = Math.floor(tick / 2)
  c.save()
  c.translate(x, y - 18)
  c.rotate(angle)
  c.globalAlpha *= fade
  c.translate(-r * 0.7, 0)
  bladeArc(c, r, -1.15, 1.15, 13, 1, VOLT, VOLT_PALE)
  const at = (a: number, rr = r) => [Math.cos(a) * rr, Math.sin(a) * rr] as const
  for (let k = 0; k < 4; k++) { // the edge, in four linked bolts
    const [ax, ay] = at(-1.1 + k * 0.55), [bx, by] = at(-1.1 + (k + 1) * 0.55)
    drawLightning(c, ax, ay, bx, by, 0.55, roll + k * 7, k % 2, 0.2)
  }
  for (const side of [-1, 1]) { // sparks streaming off the tips
    const [tx, ty] = at(side * 1.1)
    drawLightning(c, tx, ty, tx - 14 - rnd(roll, side + 3) * 10, ty + side * (4 + rnd(roll, side + 5) * 6), 0.35, roll + side * 11, 0)
  }
  c.restore()
}

// A lightning spark (orbiting him, or flying as a bolt) at (x, y): an inked plasma ball with arcs licking off it.
// (trailX, trailY) is its heading, for a forked tail behind it.
export function drawKunlunSpark(c: C, x: number, y: number, tick: number, seed: number, trailX = 0, trailY = 0) {
  const roll = Math.floor(tick / 2) + Math.round(seed * 13)
  c.save()
  if (trailX || trailY) drawLightning(c, x - trailX * 30, y - trailY * 30, x, y, 0.6, roll, 1, 0.15)
  const g = c.createRadialGradient(x, y, 0, x, y, 10)
  g.addColorStop(0, 'rgba(255,255,255,.9)')
  g.addColorStop(0.35, 'rgba(159,216,255,.55)')
  g.addColorStop(1, 'rgba(74,168,255,0)')
  c.fillStyle = g
  c.beginPath()
  c.arc(x, y, 10, 0, Math.PI * 2)
  c.fill()
  for (let k = 0; k < 4; k++) {
    const a = rnd(roll, k) * Math.PI * 2, reach = 6 + rnd(roll, k + 4) * 6
    drawLightning(c, x, y, x + Math.cos(a) * reach, y + Math.sin(a) * reach, 0.3, roll + k, 0)
  }
  c.lineWidth = 1.2
  c.strokeStyle = INK_BLUE
  c.fillStyle = VOLT
  c.beginPath()
  c.arc(x, y, 3.4, 0, Math.PI * 2)
  c.fill()
  c.stroke()
  c.fillStyle = '#ffffff'
  c.beginPath()
  c.arc(x - 0.6, y - 0.6, 1.7, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

// Thunder Shield around him, in fighter-local units (feet at 0,0): a pale dome edged in ink with forked lightning
// crawling over it. `fade` 0..1 (it flickers out over its last moments).
export function drawKunlunShield(c: C, tick: number, fade: number, seed: number) {
  if (fade <= 0) return
  const R = KUNLUN_SKILLS.shield.radius, cy = -20, roll = Math.floor(tick / 2) + seed
  const at = (a: number) => [Math.cos(a) * R, cy + Math.sin(a) * R * 1.12] as const
  c.save()
  c.globalAlpha *= fade * (0.88 + 0.12 * Math.sin(tick * 0.6 + seed))
  const g = c.createRadialGradient(0, cy, R * 0.35, 0, cy, R * 1.05)
  g.addColorStop(0, 'rgba(191,230,255,0)')
  g.addColorStop(0.75, 'rgba(120,190,255,.16)')
  g.addColorStop(1, 'rgba(191,230,255,.45)')
  c.fillStyle = g
  c.beginPath()
  c.ellipse(0, cy, R, R * 1.12, 0, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = INK_BLUE
  c.lineWidth = 1.6
  c.globalAlpha *= 0.55
  c.stroke()
  c.globalAlpha /= 0.55
  c.strokeStyle = VOLT_PALE
  c.lineWidth = 0.8
  c.stroke()
  for (let k = 0; k < 4; k++) { // arcs crawling round the dome
    const a = tick * 0.05 * (k % 2 ? 1 : -1) + k * Math.PI / 2 + rnd(roll, k) * 0.4, span = 0.6 + rnd(roll, k + 4) * 0.5
    const [ax, ay] = at(a), [bx, by] = at(a + span)
    drawLightning(c, ax, ay, bx, by, 0.4, roll + k * 7, 1, 0.25)
  }
  c.restore()
}

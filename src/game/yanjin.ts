import { box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2d2b0', HAIR = '#eef0f5', HAIR_SHADE = '#bfc4d2', PINK = '#ef86a6', GOLD = '#e0b04a'
const COAT = '#3a3842', COAT_DARK = '#24222a', TRIM = '#8a8796', ROBE = '#f4f1ea', STRIPE = '#cfcabd'
const STRAP = '#7a5a3a', ROPE = '#cfa86a', STEEL = '#e3e8ef', GREAT = '#aeb8c4', GREAT_EDGE = '#f4f7fb'

export const YAN_JIN = {
  name: 'Yan Jin',
  blurb: 'Two swords: a long blade for three lightning-fast slices, then a colossal greatsword slam that knocks everyone up',
  radius: 11, hp: 560, speed: 150, damage: 12, range: 14, detection: 460,
  cooldown: 0.1, knockback: 40, spacing: 44, size: 1.25, color: COAT,
} as const

// `slices` long-sword cuts `interval` seconds apart, each stepping in with `lunge` px/s; then he raises the
// greatsword for `windup`, slams, and pauses for `recover`.
export const YAN_JIN_COMBO = { slices: 3, interval: 0.1, lunge: 110, windup: 0.28, recover: 0.75 } as const
// The slam lands `reach` px in front of him and hits grounded enemies within `radius` for `damage`,
// throwing them `height` px up for `air` seconds; they land with a `stun`. The crack lasts `crater` seconds.
export const YAN_JIN_SLAM = { reach: 16, radius: 72, damage: 40, knockback: 60, air: 0.75, height: 46, stun: 0.4, crater: 3 } as const
// An enemy within `range` px (but out of reach) makes him burst forward at `speed` px/s, every `cooldown` seconds.
export const YAN_JIN_DASH = { range: 150, speed: 520, cooldown: 2.2 } as const

// The colossal greatsword along +x from its guard: wrapped grip, broad chisel-tipped blade with a dark spine.
function drawGreatsword(c: C, length: number, width: number, blade = GREAT, edge = GREAT_EDGE) {
  const w = width / 2
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1.2
  box(c, -11, -1.7, 11, 3.4, 1, COAT_DARK)
  c.strokeStyle = ROPE
  c.lineWidth = 0.8
  for (let x = -9.5; x < -1; x += 2.2) line(c, x, -1.5, x + 1.3, 1.5)
  c.strokeStyle = INK
  c.lineWidth = 1.2
  ellipse(c, -12, 0, 2, 2, GOLD)
  poly(c, blade, 1, -w, length - 6, -w, length, -w + 3.5, length - 1, w, 1, w)
  c.fillStyle = '#7f8996'
  c.fillRect(1.6, -w + 0.6, length - 8, 1.6) // dark spine
  c.strokeStyle = edge
  c.lineWidth = 1.1
  line(c, 3, w - 1.1, length - 2, w - 1.1)
  c.strokeStyle = INK
  c.lineWidth = 1.2
  poly(c, '#4a4652', -1.5, -w - 2.5, 2, -w - 1.5, 2, w + 1.5, -1.5, w + 2.5)
  ellipse(c, 0.3, 0, 1.3, 1.3, GOLD)
  c.restore()
}

// The slender long sword with the hand at the origin: dark grip, spiked guard, thin bright blade along +x.
function drawLongsword(c: C, length: number) {
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1
  box(c, -5, -1.1, 7.5, 2.2, 0.8, COAT_DARK)
  ellipse(c, -5.6, 0, 1.2, 1.2, '#9a96a8')
  poly(c, STEEL, 3.5, -1, length - 3, -1, length, 0, length - 3, 1, 3.5, 1)
  c.strokeStyle = '#ffffff'
  c.lineWidth = 0.6
  line(c, 4.5, -0.2, length - 4, -0.2)
  c.strokeStyle = INK
  c.lineWidth = 0.9
  poly(c, '#4a4652', 2.4, -3.4, 3.6, -1, 3.6, 1, 2.4, 3.4, 1.8, 0)
  c.restore()
}

// 'charge' and 'cleave' are the raise and slam arms with no swords: during Catastrophe the long sword stays in the
// ground and the colossal greatsword is drawn live.
type YanPose = 'ready' | 'slice' | 'raise' | 'slam' | 'meditate' | 'pierce' | 'charge' | 'cleave'

// The slicing hand in sprite pixels; the battle swings the long sword from here (feet at 24,44).
const SLICE_HAND = [36, 22] as const

function drawYanJin(c: C, pose: YanPose, step?: number) {
  const twoHanded = pose === 'raise' || pose === 'slam', seated = pose === 'meditate'
  // Greatsword slung across his back, or lifted overhead, blade behind his head.
  c.save()
  if (pose === 'raise') { c.translate(33, 8.5); c.rotate(2.95) } else { c.translate(21, 28); c.rotate(-2.2) }
  if (pose !== 'slam' && pose !== 'charge' && pose !== 'cleave' && !seated) drawGreatsword(c, 32, 9) // otherwise drawn live
  c.restore()
  // With both hands on the greatsword, the long sword rides at his hip.
  if (twoHanded) {
    c.save()
    c.translate(18, 31)
    c.rotate(2.55)
    drawLongsword(c, 17)
    c.restore()
  }

  // Seated, his whole upper body drops a little onto his crossed legs.
  c.save()
  if (seated) c.translate(0, 4)
  // Back sleeve: wide coat sleeve with a pale trim and white wrapped forearm.
  poly(c, COAT, 17, 20, 12, 24, 10.5, 31, 16.5, 31, 19, 26)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1
  line(c, 10.8, 30, 16.4, 30)
  c.restore()

  // Striped trousers with dark wrapped boots.
  const trouser = (x1: number, x2: number, foot: number) => {
    poly(c, ROBE, x1, 33, x2, 33, x2 - 0.5, 40, x1 + 0.5, 40)
    c.save()
    c.strokeStyle = STRIPE
    c.lineWidth = 0.7
    line(c, x1 + 2, 34, x1 + 2, 39)
    line(c, x1 + 4, 34, x1 + 4, 39)
    c.restore()
    box(c, x1, 38, x2 - x1, 3, 1, COAT_DARK)
    box(c, foot, 40, 8, 4, 1.5, COAT_DARK)
  }
  if (!seated) {
    leg(c, step, 20, 34, () => trouser(17, 23, 15))
    leg(c, opposite(step), 28, 34, () => trouser(25, 31, 26))
  }

  // Long open coat with pale hem trim over the white inner robe, crossed straps, dark belt and knotted rope.
  poly(c, COAT, 15, 19, 33, 19, 36.5, 37.5, 11.5, 37.5)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1.1
  line(c, 12.3, 36, 20, 36)
  line(c, 30.5, 36, 35.7, 36)
  c.lineWidth = 0.6
  for (let x = 13.5; x < 20; x += 2) line(c, x, 35, x + 1, 37)
  c.restore()
  poly(c, ROBE, 21, 20, 30, 20, 31, 36.5, 20, 36.5)
  c.save()
  c.strokeStyle = STRIPE
  c.lineWidth = 0.6
  for (let x = 22.5; x < 30; x += 2) line(c, x, 31.5, x, 36)
  c.strokeStyle = STRAP
  c.lineWidth = 1.4
  line(c, 21.5, 21, 29.5, 28.5)
  line(c, 29.5, 21, 21.5, 28.5)
  c.strokeStyle = INK
  c.lineWidth = 1.1
  box(c, 14, 28.5, 20, 3.2, 1, COAT_DARK)
  c.strokeStyle = ROPE
  c.lineWidth = 1.4
  line(c, 15, 29.6, 33, 29.6)
  line(c, 26, 30, 25, 34.5, 26.5, 38)
  line(c, 27.2, 30, 28.4, 35.5)
  ellipse(c, 26.6, 30, 1.5, 1.3, ROPE)
  c.restore()

  // Crossed legs over the coat hem, feet tucked at either end.
  if (seated) {
    ellipse(c, 19, 37, 9, 3.6, ROBE)
    ellipse(c, 29, 37, 9, 3.6, ROBE)
    box(c, 9, 35, 5, 4, 1.5, COAT_DARK)
    box(c, 34, 35, 5, 4, 1.5, COAT_DARK)
  }

  // High dark scarf wrapped up to the chin, with a fold.
  poly(c, COAT_DARK, 17.5, 17, 32.5, 17, 34, 22, 28, 24.5, 22, 24.5, 16, 22)
  c.save()
  c.strokeStyle = '#4a4754'
  c.lineWidth = 0.8
  line(c, 19, 20.5, 27, 21.5, 32.5, 20)
  c.restore()

  // Front arm: the long sword held low, the slicing arm (sword drawn live), or both hands on the greatsword.
  const hand = (x: number, y: number) => {
    c.save()
    c.lineWidth = 1.2
    ellipse(c, x, y, 2.2, 2.2, SKIN)
    c.restore()
  }
  if (pose === 'ready') {
    poly(c, COAT, 28, 20, 35, 20.5, 39.5, 27, 36.5, 30.5, 30, 27)
    c.save()
    c.translate(38, 29)
    c.rotate(1.2)
    drawLongsword(c, 17)
    c.restore()
    hand(38, 29)
  } else if (pose === 'slice') {
    poly(c, COAT, 28, 20, 34, 19, 38.5, 20.5, 36.5, 25, 30, 27)
    hand(...SLICE_HAND)
  } else if (pose === 'pierce') {
    // The long sword driven point-first into the ground in front of him.
    poly(c, COAT, 28, 20, 34, 20, 37.5, 25, 34.5, 28.5, 30, 27)
    c.save()
    c.translate(35.5, 26)
    c.rotate(Math.PI / 2)
    drawLongsword(c, 18)
    c.restore()
    hand(35.5, 26)
  } else if (seated) {
    // Hand raised before his chest in a two-finger sword seal.
    poly(c, COAT, 28, 20, 33, 21.5, 31, 27.5, 26, 28.5, 25, 25)
    c.save()
    c.lineWidth = 1.5
    line(c, 26.2, 24, 26.8, 19.8)
    c.restore()
    hand(26.2, 25.6)
  } else if (pose === 'slam') {
    poly(c, COAT, 28, 20, 35, 19, 38, 24, 33, 27, 29, 26)
    c.save()
    c.translate(35, 21)
    c.rotate(1.12)
    drawGreatsword(c, 27, 9)
    c.restore()
    hand(33.5, 18.5)
    hand(36, 23)
  } else if (pose === 'cleave') {
    poly(c, COAT, 28, 20, 35, 19, 38, 24, 33, 27, 29, 26)
    hand(33.5, 18.5)
    hand(36, 23)
  }

  // Head: a full mass of swept, spiky white hair with a pink lock, thin outlines so it stays bright.
  c.save()
  c.lineWidth = 1.3
  poly(c, HAIR, 17, 6, 13.8, 12, 13.2, 20.5, 16.5, 23.5, 19.5, 21.5, 21, 15)
  c.lineWidth = 1.6
  ellipse(c, 25, 13, 7.5, 7.5, SKIN)
  c.lineWidth = 1.3
  poly(c, HAIR, 15.2, 15, 14.8, 8, 18, 3.8, 23, 2, 29, 2.4, 33, 5.3, 34.6, 10, 32.2, 9,
    32.9, 13, 29.7, 9.9, 27.7, 12.4, 25.9, 9.7, 22.6, 11.2, 21.2, 17.5)
  c.strokeStyle = HAIR_SHADE
  c.lineWidth = 0.7
  line(c, 18.5, 6.5, 25, 4.3)
  line(c, 22, 7.2, 30, 6.4)
  line(c, 17, 9.5, 17.5, 16)
  line(c, 15.5, 17, 16.5, 21.5)
  c.strokeStyle = INK
  c.lineWidth = 0.9
  poly(c, PINK, 30.8, 8.8, 33.8, 9.6, 34.2, 15, 32.2, 12.6)
  c.lineWidth = 1.2
  line(c, 26.8, 11.6, 31, 10.6) // sharp brow
  c.restore()
  // Narrow eye inside the gold mark.
  c.save()
  c.strokeStyle = GOLD
  c.lineWidth = 0.9
  c.beginPath()
  c.arc(29, 13.6, 3.4, -2.5, 0.9)
  c.stroke()
  line(c, 26.6, 16.2, 25.4, 18.6)
  line(c, 31.8, 11, 33.5, 9.8)
  c.lineWidth = 1.2
  c.strokeStyle = INK
  if (seated) {
    c.beginPath()
    c.arc(29, 13, 1.8, 0.3, Math.PI - 0.3) // eyes closed
    c.stroke()
  } else {
    ellipse(c, 29, 13.6, 2, 1.5, '#fff')
    c.fillStyle = '#7d6a9e'
    c.beginPath()
    c.arc(29.7, 13.6, 1.1, 0, Math.PI * 2)
    c.fill()
  }
  c.lineWidth = 0.9
  line(c, 28.6, 18.6, 30.8, 18.2)
  c.restore()
  c.restore()

  // Raised: both arms up gripping the greatsword above his head.
  if (pose === 'raise' || pose === 'charge') {
    poly(c, COAT, 28, 21, 33, 19.5, 39.5, 10, 35.5, 8, 31, 14)
    hand(37, 7.7)
    hand(40.8, 7)
  }
}

export function buildYanJinSprite(color?: string, pose: YanPose = 'ready', step?: number) {
  // Team colour is his sash, so the white hair stays clear.
  // Meditating, the battle draws his ground shadow, which stays put while he floats.
  return buildSprite((c) => drawYanJin(c, pose, step), color, pose === 'meditate' ? [15, 32.5, 18] : [15, 28.5, 18], pose !== 'meditate')
}

// Long-sword cuts in sprite-local units (feet at 0,0, facing right): overhead down, rising, level sweep.
const SWEEPS = [[-1.7, 0.8], [1.0, -1.4], [-0.9, 0.9]] as const
const SWORD_LENGTH = 21

// An ink-brush stroke along an arc around (0,0), as in a Chinese ink painting: pressed thick near the start,
// tapering into dry, split hairs and a few flicked drops. `reveal` 0..1 is how far the brush has travelled.
// `edge` outlines a pale stroke so white ink still reads on paper.
function brushArc(c: C, r: number, from: number, to: number, width: number, reveal: number, ink: string, edge?: string) {
  const end = Math.max(0.02, Math.min(1, reveal)), n = 28
  const at = (t: number, off: number) => {
    const a = from + (to - from) * t
    return [Math.cos(a) * (r + off), Math.sin(a) * (r + off)]
  }
  const w = (t: number) => width * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.06)) ** 0.6 * (1.15 - 0.55 * t)
  c.save()
  c.lineCap = c.lineJoin = 'round'
  c.beginPath()
  for (let i = 0; i <= n; i++) {
    const t = end * i / n, [x, y] = at(t, w(t) / 2)
    if (i) c.lineTo(x, y)
    else c.moveTo(x, y)
  }
  for (let i = n; i >= 0; i--) {
    const t = end * i / n, [x, y] = at(t, -w(t) / 2)
    c.lineTo(x, y)
  }
  c.closePath()
  c.fillStyle = ink
  c.fill()
  const hair = edge ?? ink
  if (edge) {
    c.strokeStyle = edge
    c.lineWidth = 0.6
    c.stroke()
  }
  // Dry-brush hairs splitting off the tail.
  c.strokeStyle = hair
  c.lineWidth = 0.7
  for (let k = 0; k < 4; k++) {
    const off = (k / 3 - 0.5) * width * 0.9, t0 = 0.45 + k * 0.08, t1 = Math.min(1, end * (1.04 + k * 0.03))
    if (t1 <= t0) continue
    c.beginPath()
    for (let i = 0; i <= 10; i++) {
      const t = t0 + (t1 - t0) * i / 10, [x, y] = at(t, off * (1 - t * 0.35))
      if (i) c.lineTo(x, y)
      else c.moveTo(x, y)
    }
    c.stroke()
  }
  // A few drops flicked off past the tail.
  if (end > 0.8) {
    c.fillStyle = hair
    for (let k = 0; k < 3; k++) {
      const [x, y] = at(end + 0.06 + k * 0.05, (k - 1) * width * 0.45)
      c.beginPath()
      c.arc(x, y, width * 0.07 * (3 - k) + 0.4, 0, Math.PI * 2)
      c.fill()
    }
  }
  c.restore()
}

// The long sword swinging from the slicing hand, leaving a white (yang) brush stroke; `progress` 0..1, `combo` 1..3.
export function drawYanSwing(c: C, progress: number, combo: number) {
  const k = (combo + 2) % 3, [from, to] = SWEEPS[k], flat = k === 2 ? 0.45 : 1
  const swing = 1 - (1 - Math.min(1, progress * 2.4)) ** 3
  const angle = from + (to - from) * swing
  c.save()
  c.translate(SLICE_HAND[0] - 24, SLICE_HAND[1] - 44)
  c.lineCap = c.lineJoin = 'round'
  c.save()
  c.scale(1, flat)
  c.globalAlpha = Math.max(0, 1 - Math.max(0, progress - 0.35) * 1.6)
  brushArc(c, SWORD_LENGTH - 2, from, to, 7, swing, '#ffffff', 'rgba(34,31,51,.55)')
  c.restore()
  // A level sweep foreshortens the blade.
  const tx = Math.cos(angle) * SWORD_LENGTH, ty = Math.sin(angle) * SWORD_LENGTH * flat
  c.rotate(Math.atan2(ty, tx))
  drawLongsword(c, Math.hypot(tx, ty))
  c.strokeStyle = INK
  c.lineWidth = 1.2
  ellipse(c, 0, 0, 2.2, 2.2, SKIN)
  c.restore()
}

// The greatsword's smash: a heavy black (yin) brush stroke from overhead into the ground, then an ink splash
// where it lands; `progress` 0..1.
export function drawYanSmash(c: C, progress: number) {
  c.save()
  c.globalAlpha = Math.max(0, 1 - Math.max(0, progress - 0.3) * 1.5)
  c.translate(8, -24)
  brushArc(c, 27, -2.7, 1.1, 12, progress * 3, INK)
  c.restore()
  if (progress < 0.25) return
  const p = (progress - 0.25) / 0.75
  c.save()
  c.globalAlpha = 1 - p
  c.fillStyle = INK
  c.beginPath()
  c.ellipse(20, 0, 7 + p * 9, 2 + p * 2.5, 0, 0, Math.PI * 2) // ink pooling on the ground
  c.fill()
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI + 0.35 + k * 0.4, d = 6 + p * (16 + (k % 3) * 6)
    c.beginPath()
    c.arc(20 + Math.cos(a) * d, -2 + Math.sin(a) * d * 0.6 + p * p * 10, 1.6 - (k % 3) * 0.4, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Speed lines streaming behind him during his dash; `strength` 0..1.
export function drawYanDash(c: C, strength: number) {
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = '#c9d3e6'
  c.globalAlpha = 0.8 * strength
  c.lineWidth = 1.6
  for (const [y, length] of [[-30, 16], [-21, 22], [-12, 14]]) line(c, -12, y, -12 - length * strength, y)
  c.restore()
}

// Meditation: he sits for `sit` seconds, both swords fly up over `rise`, plunge into the ground `spread` px to
// either side over `strike`, then he floats up `height` px over `float` seconds above a yin-yang, healing `heal` HP/s.
// After `hold` more seconds the swords pull free over `unearth` and circle him, opposite each other, at `orbit`
// rad/s on a ring `spread` px wide and `ring` px deep.
export const YAN_JIN_REST = {
  sit: 0.4, rise: 0.55, strike: 0.16, float: 0.6, height: 14, spread: 30, heal: 40,
  hold: 0.5, unearth: 0.4, orbit: 1.4, ring: 8,
} as const
const R = YAN_JIN_REST, STRUCK = R.sit + R.rise + R.strike, FREED = STRUCK + R.float + R.hold
const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3

// How high he floats (world px, before scaling) `time` seconds into his meditation.
export function yanFloat(time: number, tick: number) {
  return ease((time - STRUCK) / R.float) * (R.height + Math.sin(tick * 0.05) * 2)
}

// A yin-yang of ink and paper centred on (x, y).
function drawYinYang(c: C, x: number, y: number, r: number, spin: number) {
  c.save()
  c.translate(x, y)
  c.rotate(spin)
  c.fillStyle = '#fbf7ec'
  c.beginPath()
  c.arc(0, 0, r, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = INK
  c.beginPath()
  c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2)
  c.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true)
  c.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2)
  c.fill()
  c.beginPath()
  c.arc(0, -r / 2, r / 7, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#fbf7ec'
  c.beginPath()
  c.arc(0, r / 2, r / 7, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 1.2
  c.beginPath()
  c.arc(0, 0, r, 0, Math.PI * 2)
  c.stroke()
  c.restore()
}

// Where a sword is `time` seconds into his meditation: carried (greatsword on his back, long sword in his lap),
// spinning up overhead, driven point-first into the ground to one side, then pulled free to circle him.
function meditationSword(great: boolean, time: number, ground: number) {
  const length = great ? 30 : 22, side = great ? 1 : -1
  const rise = ease((time - R.sit) / R.rise), fall = Math.min(1, Math.max(0, (time - R.sit - R.rise) / R.strike)) ** 2
  const from = great ? { x: -3, y: -12, a: -2.2 } : { x: -9, y: -6, a: 0 }
  const top = { x: side * R.spread, y: great ? -64 : -58 }
  const dugY = ground + 5 - length
  const out = ease((time - FREED) / R.unearth)
  if (out <= 0) {
    return { length, front: !great && time < R.sit, streak: rise > 0 && fall < 1,
      x: from.x + (top.x - from.x) * rise,
      y: (from.y + (top.y - from.y) * rise) * (1 - fall) + dugY * fall,
      angle: from.a + (Math.PI / 2 + Math.PI * 2 * side - from.a) * rise }
  }
  // Circling, always opposite each other; the near half of the ring passes in front of him.
  const turn = (great ? 0 : Math.PI) + Math.max(0, time - FREED - R.unearth) * R.orbit
  const orbitY = -20 - length * 0.55 + Math.sin(turn) * R.ring
  return { length, front: Math.sin(turn) > 0, streak: false,
    x: side * R.spread + (Math.cos(turn) * R.spread - side * R.spread) * out,
    y: dugY + (orbitY - dugY) * out,
    angle: Math.PI / 2 + Math.cos(turn) * 0.2 * out }
}

// Swords, yin-yang and strike in sprite-local units (feet at 0,0) while he floats `lift` units up; the frame
// floats with him, so the ground is at y = lift. `back` draws the ground effects and every sword behind him;
// the front layer draws the swords passing in front of him.
export function drawYanMeditation(c: C, time: number, tick: number, lift: number, back: boolean) {
  const ground = lift
  const glow = ease((time - STRUCK) / R.float), circling = ease((time - FREED) / R.unearth)
  const swords = [false, true].map((great) => ({ great, ...meditationSword(great, time, ground) }))
  c.save()
  c.lineCap = c.lineJoin = 'round'
  if (back) {
    // Ground shadow, shrinking as he rises.
    c.fillStyle = 'rgba(34,31,51,.16)'
    c.beginPath()
    c.ellipse(0, ground, 10 - glow * 2, 3 - glow * 0.6, 0, 0, Math.PI * 2)
    c.fill()
    // The strike: cracks that stay where the blades went in, and a ring and dust burst at the moment of impact.
    const since = time - STRUCK
    if (since >= 0) {
      for (const side of [-1, 1]) {
        const x = side * R.spread
        c.strokeStyle = 'rgba(34,31,51,.55)'
        c.lineWidth = 1
        for (let k = 0; k < 4; k++) {
          const a = k * 0.8 + 0.3 + (side > 0 ? 0.4 : 0)
          line(c, x, ground, x + Math.cos(a) * 10, ground + Math.sin(a) * 3, x + Math.cos(a + 0.2) * 16, ground + Math.sin(a + 0.2) * 5)
        }
        if (since < 0.4) {
          const p = since / 0.4
          c.save()
          c.globalAlpha = 1 - p
          c.strokeStyle = '#f2d78a'
          c.lineWidth = 3
          c.beginPath()
          c.ellipse(x, ground, 6 + p * 20, 2 + p * 6, 0, 0, Math.PI * 2)
          c.stroke()
          c.fillStyle = 'rgba(120,108,90,.5)'
          for (let k = 0; k < 4; k++) {
            c.beginPath()
            c.arc(x + (k - 1.5) * (4 + p * 8), ground - 2 - p * (6 + (k % 2) * 5), 2 + p * 3, 0, Math.PI * 2)
            c.fill()
          }
          c.restore()
        }
      }
    }
    if (glow > 0) {
      // A soft halo behind him and the yin-yang turning flat on the ground beneath him as a seal.
      c.save()
      c.globalAlpha = 0.22 * glow
      c.fillStyle = '#f2d78a'
      c.beginPath()
      c.arc(0, -20, 22 + Math.sin(tick * 0.08) * 1.5, 0, Math.PI * 2)
      c.fill()
      // The glowing ring the circling swords follow.
      if (circling > 0) {
        c.globalAlpha = 0.3 * circling
        c.strokeStyle = '#f2d78a'
        c.lineWidth = 1.5
        c.beginPath()
        c.ellipse(0, -20, R.spread, R.ring, 0, 0, Math.PI * 2)
        c.stroke()
      }
      // Threads of light from the seal up to each blade.
      c.globalAlpha = 0.6 * glow * (0.7 + Math.sin(tick * 0.1) * 0.3)
      c.strokeStyle = '#f2d78a'
      c.lineWidth = 1.2
      for (const sword of swords) line(c, sword.x * 0.7, ground, sword.x, sword.y + sword.length * 0.55)
      c.translate(0, ground)
      c.scale(1, 0.4)
      c.globalAlpha = 0.35 * glow
      c.fillStyle = '#f2d78a'
      c.beginPath()
      c.arc(0, 0, 25 + Math.sin(tick * 0.08) * 1.5, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 0.9 * glow
      drawYinYang(c, 0, 0, 20, tick * 0.03)
      c.restore()
    }
  }
  for (const sword of swords) {
    if (sword.front === back) continue
    c.save()
    c.translate(sword.x, sword.y)
    c.rotate(sword.angle)
    if (sword.streak) {
      // A streak trailing the flying blade.
      c.globalAlpha = 0.5
      c.strokeStyle = '#c9d3e6'
      c.lineWidth = sword.great ? 6 : 3
      line(c, 0, 0, -12, 0)
      c.globalAlpha = 1
    }
    if (sword.great) drawGreatsword(c, sword.length, 9)
    else drawLongsword(c, sword.length)
    c.restore()
  }
  c.restore()
}

// Gravity Seal: when an enemy comes within `trigger` px he stabs the long sword into the ground and a circle of
// characters `radius` px wide (drawn and tested `squash` as deep) spreads under him. Enemies standing in it, or
// walking in, float up `height` px, helpless, until he pulls the sword out after `duration` seconds; then they
// slam down at `drop` px/s, taking `damage` and a `stun`. Every `cooldown` seconds.
export const YAN_JIN_SEAL = {
  trigger: 80, radius: 120, squash: 0.6, duration: 3, height: 40, drop: 600, damage: 30, stun: 1.6, cooldown: 9,
} as const

// Whether (dx, dy) from the seal's centre lies inside it.
export function inYanSeal(dx: number, dy: number) {
  const S = YAN_JIN_SEAL
  return (dx / S.radius) ** 2 + (dy / (S.radius * S.squash)) ** 2 <= 1
}

const SEAL_WORDS = '重力引浮天地陰陽' // gravity, force, pull, float, heaven, earth, yin, yang

// The white seal on the ground at (x, y), `time` seconds after the sword went in: inked rings that spread open,
// characters circling between them, and ink motes drifting up through it. It closes as the sword comes out.
export function drawYanSeal(c: C, x: number, y: number, time: number, tick: number) {
  const S = YAN_JIN_SEAL
  const open = ease(time / 0.35), fade = Math.min(1, Math.max(0, (S.duration - time) / 0.25))
  const r = S.radius * open
  c.save()
  c.translate(x, y)
  c.globalAlpha = fade
  c.save()
  c.scale(1, S.squash)
  // White is reverse gravity (things float); black, his black hole, is gravity.
  c.fillStyle = 'rgba(255,255,255,.9)'
  c.beginPath()
  c.arc(0, 0, r, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(34,31,51,.05)'
  c.beginPath()
  c.arc(0, 0, r * 0.66, 0, Math.PI * 2)
  c.fill()
  // Brushy outer ring: a few offset strokes with breaks, like a quick ink circle.
  c.strokeStyle = INK
  c.lineCap = 'round'
  const turn = tick * 0.004
  for (let k = 0; k < 3; k++) {
    c.globalAlpha = fade * (0.85 - k * 0.22)
    c.lineWidth = 3.4 - k
    c.beginPath()
    // The seal opens from radius 0; a negative radius makes arc() throw and stops the whole game loop.
    c.arc(0, 0, Math.max(0, r - k * 1.8), turn + k * 1.3, turn + k * 1.3 + Math.PI * 2 - 0.3 - k * 0.25)
    c.stroke()
  }
  c.globalAlpha = fade * 0.75
  c.lineWidth = 1.4
  c.beginPath()
  c.arc(0, 0, r * 0.68, -turn * 1.5, -turn * 1.5 + Math.PI * 2 - 0.2)
  c.stroke()
  // Characters circling between the rings, upright to the viewer.
  c.restore()
  c.fillStyle = INK
  c.font = `${Math.max(1, Math.round(r * 0.19))}px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let i = 0; i < SEAL_WORDS.length; i++) {
    const a = i / SEAL_WORDS.length * Math.PI * 2 + tick * 0.006
    c.save()
    c.translate(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84 * S.squash)
    c.scale(1, 0.8)
    c.globalAlpha = fade * (0.6 + Math.sin(a) * 0.3) // the far side is fainter
    c.fillText(SEAL_WORDS[i], 0, 0)
    c.restore()
  }
  // Ink splash where the sword went in, and motes drifting up through the seal.
  c.globalAlpha = fade * 0.6
  c.beginPath()
  c.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI * 2)
  c.fill()
  for (let k = 0; k < 12; k++) {
    const spread = ((k % 4) + 1) / 4 * 0.85, a = k * 2.4
    const rise = (tick * 0.5 + k * 11) % 46
    c.globalAlpha = fade * 0.55 * (1 - rise / 46) * open
    c.beginPath()
    c.arc(Math.cos(a) * r * spread, Math.sin(a) * r * spread * S.squash - rise, 1.3, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Catastrophe: with `crowd` enemies within `trigger` px he plants the long sword (a Gravity Seal lifts them),
// backflips `back` px away and `height` px up over `leap`, grows the greatsword into a colossal black blade over
// `charge`, then cleaves down over `slash`, landing `land` px short of the seal's centre: `slashDamage` to everyone
// floating. A black hole opens there `holeHeight` px up, spinning the floaters in for `hole` seconds, then explodes:
// `damage` to enemies within `radius` (and every floater), throwing them and him away at `throw` / `selfThrow` px/s.
export const YAN_JIN_CATASTROPHE = {
  trigger: 100, crowd: 2, cooldown: 22, opening: 6,
  pierce: 0.4, leap: 0.6, charge: 1.1, slash: 0.3, hole: 2,
  back: 50, height: 60, land: 40, slashDamage: 35,
  holeHeight: 50, orbit: 46, radius: 140, damage: 70, throw: 650, selfThrow: 520, burst: 0.8,
} as const
const K = YAN_JIN_CATASTROPHE

// Blend two #rrggbb colours.
function mix(a: string, b: string, t: number) {
  const at = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16)
  return `rgb(${[0, 1, 2].map((i) => Math.round(at(a, i) + (at(b, i) - at(a, i)) * t)).join(',')})`
}

// The greatsword growing into the colossal black blade, in sprite-local units (feet at 0,0). Charging, it grows
// overhead behind him (`progress` 0..1); slashing, it swings over his head and down in front through a huge black
// brush stroke; in the black-hole phase the blade and stroke dissolve back into ink.
export function drawYanColossus(c: C, phase: 'charge' | 'slash' | 'hole', progress: number, tick: number) {
  const grow = phase === 'charge' ? ease(progress) : 1
  const swing = phase === 'slash' ? progress ** 1.5 : 1
  const fadeOut = phase === 'hole' ? Math.max(0, 1 - progress * 2.5) : 1
  if (fadeOut <= 0) return
  const gx = phase === 'charge' ? 33 : 33 + 2 * swing, gy = phase === 'charge' ? 8.5 : 8.5 + 12.5 * swing
  const angle = phase === 'charge' ? 2.95 : 2.95 + (0.35 + Math.PI * 2 - 2.95) * swing
  const length = 32 + grow * 58, width = 9 + grow * 15
  c.save()
  c.globalAlpha = fadeOut
  if (phase !== 'charge') {
    // The cleaving stroke of black ink across everything in front of him.
    c.save()
    c.translate(8, -26)
    c.globalAlpha = fadeOut * (phase === 'hole' ? 0.8 : 1)
    brushArc(c, 60, -2.4, 1.0, 20, swing * 1.25, INK)
    c.restore()
  }
  c.translate(gx - 24, gy - 44)
  c.rotate(angle)
  drawGreatsword(c, length, width, mix(GREAT, '#1b1824', grow), mix(GREAT_EDGE, '#5b5470', grow))
  // Ink smoke peeling off the blade as it darkens.
  c.fillStyle = INK
  for (let k = 0; k < 8; k++) {
    const rise = (tick * 0.6 + k * 9) % 18
    c.globalAlpha = fadeOut * 0.45 * grow * (1 - rise / 18)
    c.beginPath()
    c.arc(4 + k / 7 * (length - 6) - rise * 0.3, -width / 2 - rise, 1.5 + (k % 3), 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// The long sword left standing point-down in the ground at (x, y), drawn at `size`.
export function drawYanPlantedSword(c: C, x: number, y: number, size: number) {
  c.save()
  c.translate(x, y)
  c.scale(size, size)
  c.translate(0, -14)
  c.rotate(Math.PI / 2)
  drawLongsword(c, 18)
  c.restore()
}

// The black hole `holeHeight` px above (x, y); `progress` 0..1 over its life. It opens, swirls ink in a
// brushed accretion ring and draws streaks inward, growing heavier until it bursts.
export function drawYanBlackHole(c: C, x: number, y: number, progress: number, tick: number) {
  const open = ease(progress / 0.25), r = (12 + 16 * progress) * open
  const shake = progress > 0.8 ? Math.sin(tick * 1.7) * (progress - 0.8) * 10 : 0
  c.save()
  c.translate(x + shake, y - K.holeHeight)
  const halo = c.createRadialGradient(0, 0, r, 0, 0, r * 3.2)
  halo.addColorStop(0, 'rgba(34,31,51,.45)')
  halo.addColorStop(1, 'rgba(34,31,51,0)')
  c.fillStyle = halo
  c.beginPath()
  c.arc(0, 0, r * 3.2, 0, Math.PI * 2)
  c.fill()
  // Streaks of ink being pulled in.
  c.strokeStyle = INK
  c.lineCap = 'round'
  c.lineWidth = 1.2
  for (let k = 0; k < 12; k++) {
    const a = k * 0.52 + tick * 0.04, d = r * 1.3 + r * 2.2 * (1 - (tick * 0.025 + k * 0.083) % 1)
    c.globalAlpha = 0.6 * open
    line(c, Math.cos(a) * d, Math.sin(a) * d * 0.7, Math.cos(a + 0.35) * (d - 7), Math.sin(a + 0.35) * (d - 7) * 0.7)
  }
  // A spinning accretion ring of brushed ink.
  for (let k = 0; k < 3; k++) {
    c.save()
    c.scale(1, 0.55)
    c.rotate(tick * 0.18 + k * 2.09)
    c.globalAlpha = 0.8 * open
    brushArc(c, r * 1.6, 0, 2.3, r * 0.5, 1, INK)
    c.restore()
  }
  c.globalAlpha = open
  c.fillStyle = '#0d0b12'
  c.beginPath()
  c.arc(0, 0, r, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = '#fbf7ec'
  c.lineWidth = 1.5
  c.beginPath()
  c.arc(0, 0, r + 1.5, 0, Math.PI * 2)
  c.stroke()
  c.restore()
}

// The black hole bursting at (x, y): a white flash, an ink shock ring racing across the ground, and spikes and
// drops of ink thrown outward; `progress` 0..1.
export function drawYanBurst(c: C, x: number, y: number, progress: number) {
  const p = progress, ring = 20 + p * K.radius * 1.1
  c.save()
  c.translate(x, y)
  c.globalAlpha = (1 - p) ** 2
  c.fillStyle = '#fffdf6'
  c.beginPath()
  c.arc(0, -K.holeHeight, 30 + p * 90, 0, Math.PI * 2)
  c.fill()
  c.globalAlpha = 1 - p
  c.strokeStyle = INK
  c.lineWidth = 10 * (1 - p) + 1
  c.beginPath()
  c.ellipse(0, 0, ring, ring * 0.45, 0, 0, Math.PI * 2)
  c.stroke()
  c.lineCap = 'round'
  for (let k = 0; k < 14; k++) {
    const a = k * 0.45 + 0.2, from = 10 + p * 30, to = 24 + p * 110 * (0.6 + (k % 3) * 0.2)
    c.lineWidth = (1 - p) * 6 + 0.5
    line(c, Math.cos(a) * from, -K.holeHeight + Math.sin(a) * from * 0.8, Math.cos(a) * to, -K.holeHeight + Math.sin(a) * to * 0.8)
  }
  c.fillStyle = INK
  for (let k = 0; k < 10; k++) {
    const a = k * 0.63 + 0.5, d = 30 + p * 140 * (0.5 + (k % 4) * 0.15)
    c.beginPath()
    c.arc(Math.cos(a) * d, -K.holeHeight + Math.sin(a) * d * 0.7 + p * p * 30, 2.2 - (k % 3) * 0.5, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Yang Ward: an enemy projectile within `trigger` px and heading at him makes him press the long sword into the
// ground. A white yang dome `radius` px wide stops every enemy projectile that enters it for `hold` seconds; then he
// spins for `spin` seconds and sends each one back at whoever threw it, `boost` times faster. Every `cooldown`.
export const YAN_JIN_WARD = { trigger: 120, radius: 46, hold: 1, spin: 0.35, boost: 1.2, cooldown: 7 } as const

// The white (yang) half of a yin-yang with its black eye, centred on (x, y).
function drawYang(c: C, x: number, y: number, r: number, spin: number) {
  c.save()
  c.translate(x, y)
  c.rotate(spin + Math.PI)
  c.beginPath()
  c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2)
  c.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true)
  c.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2)
  c.fillStyle = '#ffffff'
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 1.2
  c.stroke()
  c.fillStyle = INK
  c.beginPath()
  c.arc(0, -r / 2, r / 7, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

// The ward around his feet at (x, y): a white disc and translucent dome with the yang above it, opening over the
// first moments (`time` seconds in). Spinning (`spin` 0..1), a white brush stroke whirls around him.
export function drawYanWard(c: C, x: number, y: number, time: number, spin: number | null, tick: number) {
  const W = YAN_JIN_WARD, r = W.radius * ease(time / 0.2)
  c.save()
  c.translate(x, y)
  c.lineCap = c.lineJoin = 'round'
  c.save()
  c.scale(1, 0.45)
  c.globalAlpha = 0.9
  c.fillStyle = '#ffffff'
  c.beginPath()
  c.arc(0, 0, r, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 1.5
  c.stroke()
  c.restore()
  // The dome: a pale shell with an inked rim.
  c.beginPath()
  c.ellipse(0, 0, r, r * 1.05, 0, Math.PI, Math.PI * 2)
  c.globalAlpha = 0.3
  c.fillStyle = '#ffffff'
  c.fill()
  c.globalAlpha = 0.75
  c.strokeStyle = INK
  c.lineWidth = 1.2
  c.stroke()
  c.globalAlpha = 1
  if (r > 4) drawYang(c, 0, -r * 1.05 - 10, 7, tick * 0.03)
  if (spin !== null) {
    c.save()
    c.translate(0, -18)
    c.scale(1, 0.45)
    brushArc(c, W.radius * 0.9, spin * Math.PI * 4, spin * Math.PI * 4 + 2.8, 11, 1, '#ffffff', 'rgba(34,31,51,.6)')
    c.restore()
  }
  c.restore()
}

// A white halo marking a projectile held in the ward at (x, y).
export function drawYanHeld(c: C, x: number, y: number, tick: number) {
  c.save()
  c.globalAlpha = 0.85
  c.fillStyle = '#ffffff'
  c.strokeStyle = 'rgba(34,31,51,.5)'
  c.lineWidth = 1
  c.beginPath()
  c.arc(x, y, 7 + Math.sin(tick * 0.2) * 1, 0, Math.PI * 2)
  c.fill()
  c.stroke()
  c.restore()
}

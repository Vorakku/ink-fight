import { bladeArc, box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2d2b0', HAIR = '#eef0f5', HAIR_SHADE = '#bfc4d2', PINK = '#ef86a6', GOLD = '#e0b04a'
const COAT = '#3a3842', COAT_DARK = '#24222a', TRIM = '#8a8796', ROBE = '#f4f1ea', STRIPE = '#cfcabd'
const STRAP = '#7a5a3a', ROPE = '#cfa86a', STEEL = '#e3e8ef', GREAT = '#aeb8c4', GREAT_EDGE = '#f4f7fb'

export const YAN_JIN = {
  name: 'Yan Jin',
  blurb: 'Two swords: three lightning-fast slices, then a twin-bladed greatsword slam. At half HP he turns into a lifestealing red demon',
  radius: 11, hp: 760, speed: 150, damage: 16, range: 14, detection: 460,
  cooldown: 0.1, knockback: 40, spacing: 44, size: 1.25, color: COAT,
} as const

// `slices` long-sword cuts `interval` seconds apart, each stepping in with `lunge` px/s; then he raises the
// greatsword for `windup`, slams, and pauses for `recover`.
export const YAN_JIN_COMBO = { slices: 3, interval: 0.1, lunge: 110, windup: 0.28, recover: 0.6 } as const
// The slam lands `reach` px in front of him and hits grounded enemies within `radius` for `damage`,
// throwing them `height` px up for `air` seconds. His basic combo's slam lands them free to fight back; other knock-ups
// that reuse these numbers land with a `stun`. The crack lasts `crater` seconds.
export const YAN_JIN_SLAM = { reach: 16, radius: 72, damage: 52, knockback: 60, air: 0.75, height: 46, stun: 0.4, crater: 3 } as const
// Tempest Slash: a target between `min` and `range` px away makes him cut a white crescent that flies at `speed` px/s
// for `life` seconds, passing through enemies: each within `radius` px of it takes `damage` and is knocked back at
// `knockback` px/s. Every `cooldown` seconds.
export const YAN_JIN_TEMPEST = { min: 90, range: 320, speed: 520, life: 0.9, radius: 22, damage: 34, knockback: 320, cooldown: 6 } as const
// An enemy within `range` px (but out of reach) makes him burst forward at `speed` px/s, every `cooldown` seconds.
export const YAN_JIN_DASH = { range: 150, speed: 520, cooldown: 2.2 } as const

// The twin-bladed greatsword along +x from its guard: ribbed black grip, spiked silver pommel, ornate silver guard,
// and two broad parallel blades with a slit between, each with an engraved dark fuller and an angled tip.
function drawGreatsword(c: C, length: number, width: number, blade = GREAT, edge = GREAT_EDGE) {
  const w = width / 2, gap = Math.max(0.8, width * 0.12), bw = w - gap / 2
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1.2
  box(c, -11, -1.6, 11, 3.2, 1, '#1c1b22')
  c.strokeStyle = '#5a5764'
  c.lineWidth = 0.7
  for (let x = -10; x < -1; x += 1.6) line(c, x, -1.3, x, 1.3) // ribbed wrap
  c.strokeStyle = INK
  c.lineWidth = 1.1
  poly(c, STEEL, -11, -2, -14.5, 0, -11, 2)
  // Upper blade a touch shorter, its point on the top edge; the lower one's point on the bottom edge.
  for (const [top, len, upper] of [[-w, length - 3, true], [gap / 2, length, false]] as const) {
    const bottom = top + bw
    c.strokeStyle = INK
    c.lineWidth = 1.2
    if (upper) poly(c, blade, 1, top, len, top, len - 5, bottom, 1, bottom)
    else poly(c, blade, 1, top, len - 5, top, len, bottom, 1, bottom)
    c.fillStyle = 'rgba(28,26,40,.55)'
    c.fillRect(3, top + bw * 0.32, len - 11, bw * 0.36) // engraved fuller
    c.strokeStyle = edge
    c.lineWidth = 0.7
    line(c, 3, upper ? top + 0.7 : bottom - 0.7, len - 4, upper ? top + 0.7 : bottom - 0.7)
  }
  c.strokeStyle = INK
  c.lineWidth = 1.1
  poly(c, '#c9ced8', -1.5, -w - 3, 1.5, -w - 1.5, 3.5, -w + 1, 2, 0, 3.5, w - 1, 1.5, w + 1.5, -1.5, w + 3, 0, 0)
  c.strokeStyle = '#7f8796'
  c.lineWidth = 0.6
  c.beginPath()
  c.arc(0.8, 0, Math.max(1, w * 0.45), -1.2, 1.2) // the guard's swirl
  c.stroke()
  c.restore()
}

// The wooden sword case slung diagonally across his back, hilts up behind his shoulder: planks with a white
// bandage and leather straps with gold studs, holding whichever swords are not in his hands.
function drawCase(c: C, great: boolean, long: boolean) {
  c.save()
  c.translate(21, 28)
  c.rotate(-2.2)
  c.strokeStyle = INK
  c.lineWidth = 1.1
  box(c, -4, -5.5, 26, 11, 1.5, '#6e5d4b')
  poly(c, '#5d4e3f', 16, -6.5, 22.5, -6.5, 22.5, 6.5, 16, 6.5)
  c.strokeStyle = '#4f4235'
  c.lineWidth = 0.6
  line(c, -2, -2, 15, -2)
  line(c, -2, 1.8, 15, 1.8)
  c.strokeStyle = INK
  c.lineWidth = 0.8
  box(c, 2, -5.9, 3, 11.8, 0.5, '#f1eee6')
  for (const x of [8, 12.5]) {
    box(c, x, -6.2, 1.7, 12.4, 0.4, STRAP)
    ellipse(c, x + 0.85, -3, 0.8, 0.8, GOLD)
    ellipse(c, x + 0.85, 3, 0.8, 0.8, GOLD)
  }
  c.lineWidth = 1
  if (great) {
    box(c, 22.5, -4.4, 7.5, 3, 0.8, '#1c1b22')
    poly(c, STEEL, 30, -4.6, 32.5, -2.9, 30, -1.2)
  }
  if (long) {
    box(c, 22.5, 1.4, 6.5, 2.4, 0.8, COAT_DARK)
    ellipse(c, 29.6, 2.6, 1.2, 1.2, '#9a96a8')
  }
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
// ground and the colossal greatsword is drawn live. 'lift' is the long sword raised point-down before 'pierce'.
// 'idle' is out of combat, both swords in the case; 'seppuku' is both swords driven through him as he turns demon.
type YanPose = 'ready' | 'idle' | 'slice' | 'raise' | 'slam' | 'meditate' | 'lift' | 'pierce' | 'charge' | 'cleave' | 'seppuku'

// The slicing hand in sprite pixels; the battle swings the long sword from here (feet at 24,44).
const SLICE_HAND = [36, 22] as const

function drawYanJin(c: C, pose: YanPose, step?: number) {
  const twoHanded = pose === 'raise' || pose === 'slam', seated = pose === 'meditate'
  // Lifted overhead, the greatsword's blade is behind his head.
  if (pose === 'raise') {
    c.save()
    c.translate(33, 8.5)
    c.rotate(2.95)
    drawGreatsword(c, 32, 9)
    c.restore()
  }
  // The case holds the greatsword unless it is in his hands (or flying, or in him), and the long sword when he is
  // out of combat or swinging the greatsword two-handed.
  const greatOut = twoHanded || pose === 'charge' || pose === 'cleave' || seated || pose === 'seppuku'
  drawCase(c, !greatOut, pose === 'idle' || twoHanded)
  // Seppuku: both blades run through him and out his back, so they go behind his body.
  if (pose === 'seppuku') {
    c.save()
    c.translate(37, 29)
    c.rotate(Math.PI + 0.3)
    drawGreatsword(c, 30, 8)
    c.restore()
    c.save()
    c.translate(37, 26)
    c.rotate(Math.PI - 0.2)
    drawLongsword(c, 27)
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
  if (pose === 'idle') {
    poly(c, COAT, 28, 20, 33, 20.5, 34.5, 29, 30.5, 30, 28.5, 26)
    hand(32.5, 30.5)
  } else if (pose === 'seppuku') {
    // Both fists at his belly on the two hilts; red where the blades went in.
    poly(c, COAT, 28, 20, 34, 21, 37.5, 27, 33, 30, 29, 26)
    c.save()
    c.strokeStyle = '#d81a26'
    c.lineWidth = 1.4
    line(c, 31.5, 25, 30.5, 28.5)
    line(c, 32, 28, 30, 31.5)
    c.restore()
    hand(36.5, 26)
    hand(36.5, 29.5)
  } else if (pose === 'ready') {
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
  } else if (pose === 'lift') {
    // Both fists high in a reverse grip, the long sword hanging point-down in front of him, about to stab.
    c.save()
    c.translate(38, 6)
    c.rotate(Math.PI / 2)
    drawLongsword(c, 18)
    c.restore()
    poly(c, COAT, 28, 21, 33, 19.5, 40, 7, 36, 5, 31, 14)
    hand(38, 3.5)
    hand(38, 7)
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

// ---- Ink painting: the brushwork behind his skills ----

const PAPER = '#fbf7ec', VERMILION = '#c8231e', WASH = '#8a86a0'
const inkNoise = (i: number, k: number) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v) }

// The ragged edge of an ink blot `r` px wide at angle `a`: lumps where the ink bled, the same every frame for `seed`.
function blotRadius(r: number, a: number, seed: number) {
  return r * (1 + 0.16 * Math.sin(3 * a + seed) + 0.09 * Math.sin(7 * a + seed * 1.7) + 0.05 * Math.sin(13 * a + seed * 2.3))
}

// A ragged blob of ink around (0, 0), `squash` as deep as wide.
function blob(c: C, r: number, squash: number, seed: number) {
  c.beginPath()
  for (let i = 0; i <= 36; i++) {
    const a = i / 36 * Math.PI * 2, d = blotRadius(r, a, seed)
    c.lineTo(Math.cos(a) * d, Math.sin(a) * d * squash)
  }
  c.closePath()
  c.fill()
}

// An ink blot around (0, 0), spread `bloom` 0..1: a pale wash bleeding past a ragged dark body, tapered splashes
// shooting out of its edge and a drop flung past each one.
function inkBlot(c: C, r: number, squash: number, seed: number, bloom: number, ink: string, wash: string) {
  if (bloom <= 0 || r <= 0) return
  const R = r * bloom, base = c.globalAlpha
  c.fillStyle = wash
  c.globalAlpha = base * 0.22
  for (let k = 0; k < 3; k++) blob(c, R * (1.25 + k * 0.22), squash, seed + k * 5)
  c.globalAlpha = base
  c.fillStyle = ink
  blob(c, R, squash, seed)
  for (let k = 0; k < 9; k++) {
    const a = inkNoise(seed, k) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a)
    const from = blotRadius(R, a, seed) * 0.85, len = R * (0.35 + inkNoise(seed, k + 20) * 0.7), w = R * (0.07 + inkNoise(seed, k + 40) * 0.08)
    const px = (along: number, side: number) => ca * along - sa * side, py = (along: number, side: number) => (sa * along + ca * side) * squash
    c.beginPath()
    c.moveTo(px(from, w), py(from, w))
    c.quadraticCurveTo(px(from + len * 0.5, w * 0.7), py(from + len * 0.5, w * 0.7), px(from + len, 0), py(from + len, 0))
    c.quadraticCurveTo(px(from + len * 0.5, -w * 0.7), py(from + len * 0.5, -w * 0.7), px(from, -w), py(from, -w))
    c.fill()
    const d = from + len * (1.25 + inkNoise(seed, k + 60) * 0.6)
    c.beginPath()
    c.arc(px(d, 0), py(d, 0), w * 0.55, 0, Math.PI * 2)
    c.fill()
  }
}

// A flying drop of ink at (x, y) heading `angle`: a round head and a tail drawn out behind it.
function drop(c: C, x: number, y: number, angle: number, r: number, tail: number) {
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.beginPath()
  c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2)
  c.quadraticCurveTo(-tail * 0.5, r * 0.5, -tail, 0)
  c.quadraticCurveTo(-tail * 0.5, -r * 0.5, 0, -r)
  c.fill()
  c.restore()
}

// A dry-brush streak from (0, 0) back along -x for `len`: a pressed body tapering away and splitting into hairs.
function dryStreak(c: C, len: number, width: number, ink: string) {
  c.fillStyle = c.strokeStyle = ink
  c.beginPath()
  c.moveTo(0, -width / 2)
  c.quadraticCurveTo(-len * 0.4, -width * 0.5, -len * 0.7, 0)
  c.quadraticCurveTo(-len * 0.4, width * 0.5, 0, width / 2)
  c.closePath()
  c.fill()
  c.lineCap = 'round'
  c.lineWidth = Math.max(0.4, width * 0.13)
  for (let k = 0; k < 4; k++) {
    const off = (k / 3 - 0.5) * width * 0.8
    line(c, -len * 0.3, off, -len * (0.8 + (k % 2) * 0.2), off * 1.4)
  }
}

// Ink-wash mountains (shan shui) standing on the ground line, `w` wide and up to `h` tall around x = 0: three
// ranges, pale and far to dark and near, each fading into mist at its foot. `rise` 0..1 paints them up.
// `rgb` is the ink as "r,g,b".
function inkMountains(c: C, w: number, h: number, seed: number, rise: number, rgb: string) {
  if (rise <= 0) return
  const base = c.globalAlpha, n = 10
  for (let layer = 0; layer < 3; layer++) {
    const lh = h * (1 - layer * 0.25) * ease(rise - layer * 0.15), shift = (layer - 1) * w * 0.12
    if (lh <= 0) continue
    const mist = c.createLinearGradient(0, -lh, 0, 0)
    mist.addColorStop(0, `rgba(${rgb},1)`)
    mist.addColorStop(0.5, `rgba(${rgb},.85)`)
    mist.addColorStop(1, `rgba(${rgb},0)`)
    c.fillStyle = mist
    c.globalAlpha = base * [0.22, 0.4, 0.75][layer]
    c.beginPath()
    c.moveTo(shift - w / 2, 0)
    for (let i = 1; i < n; i++) {
      const peak = i % 2 ? 0.7 + inkNoise(seed + layer, i) * 0.3 : 0.3 + inkNoise(seed + layer, i + 9) * 0.25
      c.lineTo(shift - w / 2 + w * (i + (inkNoise(seed + layer, i + 30) - 0.5) * 0.5) / n, -lh * peak * Math.sin(Math.PI * i / n) ** 0.4)
    }
    c.lineTo(shift + w / 2, 0)
    c.closePath()
    c.fill()
  }
  c.globalAlpha = base
}

// A red artist's seal stamped at (x, y), `size` px square with `char` cut in white; `stamp` 0..1 presses it down.
function sealStamp(c: C, x: number, y: number, size: number, char: string, stamp: number) {
  if (stamp <= 0) return
  const k = 1 + (1 - ease(stamp)) * 0.8
  c.save()
  c.translate(x, y)
  c.scale(k, k)
  c.rotate(-0.06)
  c.globalAlpha *= Math.min(1, stamp * 2)
  c.fillStyle = VERMILION
  c.fillRect(-size / 2, -size / 2, size, size)
  c.fillStyle = PAPER
  c.font = `bold ${Math.round(size * 0.72)}px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(char, 0, size * 0.04)
  for (let i = 0; i < 6; i++) c.fillRect((inkNoise(i, 1) - 0.5) * size, (inkNoise(i, 2) - 0.5) * size, 1.2, 1.2) // worn stone
  c.restore()
}

// An ink splash left on the ground at (x, y), `age` of `life` seconds: it blooms fast, its wash keeps bleeding
// outward, then it dries away. Black for his yin strokes, vermilion with a dark heart as the demon.
export function drawYanInk(c: C, x: number, y: number, size: number, age: number, life: number, seed: number, red: boolean) {
  const bloom = ease(age / 0.16), dry = Math.min(1, (life - age) / (life * 0.6))
  if (dry <= 0) return
  c.save()
  c.translate(x, y)
  c.globalAlpha = dry * 0.9
  inkBlot(c, size * (1 + age / life * 0.15), 0.4, seed, bloom, red ? D_RED : INK, red ? '#ff6a6a' : WASH)
  if (red) {
    c.globalAlpha = dry * 0.85
    blob(c, size * 0.4 * bloom, 0.4, seed + 3)
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
  bladeArc(c, SWORD_LENGTH + 1, from, to, 8, swing + Math.max(0, progress - 0.42) * 1.6, '#d9e2f2', 'rgba(150,170,210,.9)')
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

// The greatsword's smash: a heavy black (yin) trail from overhead into the ground, then a crown of ink thrown up
// where the blade bites, falling back as drops (the blot itself stays on the ground: drawYanInk); `progress` 0..1.
export function drawYanSmash(c: C, progress: number) {
  c.save()
  c.globalAlpha = Math.max(0, 1 - Math.max(0, progress - 0.3) * 1.5)
  c.translate(8, -24)
  bladeArc(c, 28, -2.7, 1.1, 13, progress * 3, INK, 'rgba(90,80,130,.8)', '#4a4462')
  c.restore()
  if (progress < 0.25) return
  const p = (progress - 0.25) / 0.75
  c.save()
  c.translate(20, 0)
  c.globalAlpha = 1 - p
  c.fillStyle = INK
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI + 0.3 + k * (Math.PI - 0.6) / 10, v = 22 + (k % 3) * 12
    const x = Math.cos(a) * v * p * 1.4, y = Math.sin(a) * v * p * 1.7 + 34 * p * p
    drop(c, x, y, Math.atan2(Math.sin(a) * 1.7 + 68 * p / v, Math.cos(a) * 1.4), 2.3 - (k % 3) * 0.55, 7 - p * 3)
  }
  c.restore()
}

// Dry-brush streaks of ink trailing behind him during his dash; `strength` 0..1.
export function drawYanDash(c: C, strength: number) {
  c.save()
  c.globalAlpha = 0.6 * strength
  for (const [y, length, width] of [[-31, 20, 3], [-21, 28, 4.5], [-11, 18, 3]]) {
    c.save()
    c.translate(-10, y)
    dryStreak(c, length * strength, width, INK)
    c.restore()
  }
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

// Gravity Seal: when an enemy comes within `trigger` px he raises the long sword and, `plant` seconds later, stabs
// it into the ground; a circle of characters `radius` px wide (drawn and tested `squash` as deep) spreads under him.
// Enemies standing in it, or walking in, float up `height` px, helpless, until he pulls the sword out `duration`
// seconds after he started; then they slam down at `drop` px/s, taking `damage` and a `stun`. Every `cooldown` seconds.
export const YAN_JIN_SEAL = {
  trigger: 80, radius: 120, squash: 0.6, plant: 0.4, duration: 3.4, height: 40, drop: 600, damage: 40, stun: 1.6, cooldown: 7,
} as const

// Whether (dx, dy) from the seal's centre lies inside it.
export function inYanSeal(dx: number, dy: number) {
  const S = YAN_JIN_SEAL
  return (dx / S.radius) ** 2 + (dy / (S.radius * S.squash)) ** 2 <= 1
}

// The stab, in sprite-local units (feet at 0,0): a white streak down the sword's path, then a crown of ink thrown up
// where the point bites and a blot spreading under it; `progress` 0..1.
export function drawYanStab(c: C, progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  c.save()
  c.translate(11.5, 0)
  c.lineCap = 'round'
  c.globalAlpha = 1 - p
  c.strokeStyle = '#ffffff'
  c.lineWidth = 2.2
  line(c, 0, -40 + p * 30, 0, -4)
  inkBlot(c, 8, 0.4, 3, ease(p * 3), INK, WASH)
  c.fillStyle = INK
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.4, v = 16 + (k % 2) * 6
    drop(c, Math.cos(a) * v * p, Math.sin(a) * v * p + 18 * p * p, Math.atan2(Math.sin(a) + 2.2 * p, Math.cos(a)), 1.5 - (k % 2) * 0.4, 5)
  }
  c.restore()
}

const SEAL_WORDS = '重力引浮天地陰陽' // gravity, force, pull, float, heaven, earth, yin, yang

// The white seal on the ground at (x, y), `time` seconds after the sword went in: inked rings that spread open,
// characters circling between them, and ink motes drifting up through it. It closes as the sword comes out.
export function drawYanSeal(c: C, x: number, y: number, time: number, tick: number) {
  const S = YAN_JIN_SEAL
  if (time < S.plant) return // the sword is still on its way down
  const open = ease((time - S.plant) / 0.35), fade = Math.min(1, Math.max(0, (S.duration - time) / 0.25))
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
  // An ensō: one brushed circle pressed heavy and trailing off dry, painted as the seal opens, and a lighter one inside.
  const turn = tick * 0.004
  c.globalAlpha = fade * 0.18
  c.fillStyle = WASH
  blob(c, r * 1.08, 1, 4) // the wash bleeding past the circle
  c.globalAlpha = fade
  if (r > 1) brushArc(c, r, turn, turn + Math.PI * 1.88, 8, ease((time - S.plant) / 0.4), INK)
  c.globalAlpha = fade * 0.75
  if (r > 1) brushArc(c, r * 0.68, -turn * 1.5 + 2, -turn * 1.5 + 2 + Math.PI * 1.8, 3, ease((time - S.plant - 0.1) / 0.4), INK)
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
  c.globalAlpha = fade * 0.8
  inkBlot(c, 9, S.squash, 9, open, INK, WASH)
  c.fillStyle = INK
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
// The cleave's ink splash and the move's name over his head last `title` seconds.
export const YAN_JIN_CATASTROPHE = {
  trigger: 100, crowd: 1, cooldown: 16, opening: 6, title: 2,
  pierce: 0.55, leap: 0.6, charge: 1.1, slash: 0.3, hole: 2,
  back: 50, height: 60, land: 40, slashDamage: 50,
  holeHeight: 50, orbit: 46, radius: 140, damage: 90, throw: 650, selfThrow: 520, burst: 0.8,
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
    bladeArc(c, 64, -2.4, 1.0, 38, Math.min(1, swing * 1.2), INK, 'rgba(90,80,130,.8)', '#4a4462')
    bladeArc(c, 46, -2.3, 0.9, 8, Math.min(1, swing * 1.3), INK, 'rgba(90,80,130,.6)', '#4a4462') // a second, thinner cut inside
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

// The cleave landing at (x, y), `time` seconds ago, painted onto the battlefield like a sumi-e scroll: a white
// flash, a towering stroke of black ink split by a white cut, a huge bleeding ink blot, an ensō brushed round the
// strike, ink-wash mountains rising behind it in the mist, and drops flung outward. The stroke is gone after about a
// second; the painting lingers with the title and dissolves with it.
export function drawYanCleave(c: C, x: number, y: number, facing: number, time: number) {
  if (time > K.title) return
  const out = Math.min(1, (K.title - time) / 0.6)
  c.save()
  c.translate(x, y)
  c.lineCap = c.lineJoin = 'round'
  // The landscape painting itself up behind the strike.
  c.save()
  c.translate(-facing * 20, -12)
  c.globalAlpha = out
  inkMountains(c, 320, 130, 7, (time - 0.12) / 0.6, '34,31,51')
  c.restore()
  if (time < 0.2) {
    c.globalAlpha = (1 - time / 0.2) * 0.9
    c.fillStyle = PAPER
    c.beginPath()
    c.ellipse(0, -40, 40 + time * 400, 30 + time * 260, 0, 0, Math.PI * 2)
    c.fill()
  }
  // The blot where the blade struck, and the ensō brushed around it.
  c.globalAlpha = out * 0.92
  inkBlot(c, 72, 0.3, 11, ease(time / 0.14), INK, WASH)
  c.save()
  c.scale(1, 0.36)
  c.globalAlpha = out * 0.85
  brushArc(c, 112, facing > 0 ? 2.6 : 0.55, (facing > 0 ? 2.6 : 0.55) + Math.PI * 1.85, 10, ease((time - 0.05) / 0.35), INK)
  c.restore()
  // The towering stroke, brushed top-down in an instant (t 0 at the top, 1 at the ground), then cut open.
  const fade = Math.min(1, (1.1 - time) / 0.6)
  if (fade > 0) {
    const H = 190, sx = facing * 40, reveal = ease(time / 0.07), n = 20
    const at = (t: number) => [sx * (1 - t), -H * (1 - t)]
    const w = (t: number) => 26 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.04)) ** 0.6 * (0.4 + t * 0.8)
    c.globalAlpha = fade
    c.fillStyle = INK
    c.beginPath()
    for (let i = 0; i <= n; i++) {
      const t = reveal * i / n, [px, py] = at(t)
      if (i) c.lineTo(px - w(t) / 2, py)
      else c.moveTo(px - w(t) / 2, py)
    }
    for (let i = n; i >= 0; i--) {
      const t = reveal * i / n, [px, py] = at(t)
      c.lineTo(px + w(t) / 2, py)
    }
    c.fill()
    // Dry hairs splitting off the stroke's top.
    c.strokeStyle = INK
    c.lineWidth = 0.9
    for (let k = 0; k < 5; k++) {
      const [px, py] = at(0.02), off = (k - 2) * 3.5
      line(c, px + off, py, px + off * 1.6 + sx * 0.08, py - 10 - (k % 2) * 8)
    }
    if (time > 0.08) {
      const [ax, ay] = at(0.06), [bx, by] = at(0.06 + 0.9 * ease((time - 0.08) / 0.08))
      c.strokeStyle = PAPER
      c.lineWidth = 2.4
      line(c, ax, ay, bx, by)
    }
  }
  // Drops flung high and falling back.
  c.globalAlpha = out
  c.fillStyle = INK
  for (let k = 0; k < 22; k++) {
    const a = -Math.PI * (0.08 + 0.84 * ((k * 0.618) % 1)), v = 120 + (k % 5) * 45
    const px = Math.cos(a) * v * time, py = Math.sin(a) * v * time + 260 * time * time - 10
    if (py > 0) continue // landed
    drop(c, px, py, Math.atan2(Math.sin(a) * v + 520 * time, Math.cos(a) * v), 3 - (k % 3) * 0.8, 9)
  }
  c.restore()
}

export const YAN_JIN_TITLE = '天地浩劫' // "Heaven and Earth Catastrophe"

// The move's name over his head at (x, y), `time` seconds after the cleave: big brush characters rising up into
// place one after another, outlined in white, fading out together at the end.
export function drawYanTitle(c: C, x: number, y: number, time: number) {
  const out = Math.min(1, Math.max(0, (K.title - time) / 0.4)), size = 30, n = YAN_JIN_TITLE.length
  c.save()
  c.font = `bold ${size}px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.lineJoin = 'round'
  for (let i = 0; i < n; i++) {
    const p = ease((time - i * 0.09) / 0.25), scale = 1.35 - 0.35 * p
    if (p <= 0) continue
    c.save()
    c.translate(x + (i - (n - 1) / 2) * size * 1.05, y + (1 - p) * 26)
    c.scale(scale, scale)
    c.globalAlpha = p * out
    c.strokeStyle = '#fffdf6'
    c.lineWidth = 6
    c.strokeText(YAN_JIN_TITLE[i], 0, 0)
    c.fillStyle = INK
    c.fillText(YAN_JIN_TITLE[i], 0, 0)
    c.restore()
  }
  c.globalAlpha = out
  sealStamp(c, x + ((n - 1) / 2 + 0.95) * size * 1.05, y + size * 0.25, size * 0.6, '劫', (time - n * 0.09 - 0.2) / 0.15)
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

// The black hole `holeHeight` px above (x, y); `progress` 0..1 over its life. Ink wash swirls around it, drops of
// ink are pulled in along spiralling paths, a brushed accretion ring of ink spins against a thin white one, and ink
// drips from it, all growing heavier until it bursts.
export function drawYanBlackHole(c: C, x: number, y: number, progress: number, tick: number) {
  const open = ease(progress / 0.25), r = (12 + 16 * progress) * open
  const shake = progress > 0.8 ? Math.sin(tick * 1.7) * (progress - 0.8) * 10 : 0
  if (r <= 0.5) return
  c.save()
  c.translate(x + shake, y - K.holeHeight)
  // Swirling ink wash.
  c.fillStyle = WASH
  for (let k = 0; k < 3; k++) {
    c.save()
    c.rotate(tick * (0.02 + k * 0.012) + k * 2)
    c.globalAlpha = 0.2 * open
    blob(c, r * (2.2 + k * 0.5), 0.75, 13 + k * 4)
    c.restore()
  }
  // Drops of ink pulled in on spiralling paths.
  c.fillStyle = INK
  for (let k = 0; k < 14; k++) {
    const t = (tick * 0.025 + k * 0.071) % 1, a = k * 0.45 + t * 2.4, d = r * 1.2 + r * 2.4 * (1 - t)
    c.globalAlpha = 0.75 * open * Math.min(1, (1 - t) * 4)
    drop(c, Math.cos(a) * d, Math.sin(a) * d * 0.7, a + Math.PI * 0.62, 1.6 + (k % 3) * 0.4, 7)
  }
  // The accretion ring: brushed ink spinning one way, a thin white stroke the other.
  for (let k = 0; k < 3; k++) {
    c.save()
    c.scale(1, 0.55)
    c.rotate(tick * 0.18 + k * 2.09)
    c.globalAlpha = 0.85 * open
    brushArc(c, r * 1.6, 0, 2.3, r * 0.5, 1, INK)
    c.restore()
  }
  c.save()
  c.scale(1, 0.55)
  c.rotate(-tick * 0.12)
  c.globalAlpha = 0.8 * open
  brushArc(c, r * 2, 0, 2, 2.5, 1, '#ffffff', 'rgba(34,31,51,.5)')
  c.restore()
  c.globalAlpha = open
  c.fillStyle = '#0d0b12'
  blob(c, r, 1, Math.floor(tick / 6)) // its edge boils
  c.strokeStyle = PAPER
  c.lineWidth = 1.5
  c.beginPath()
  c.arc(0, 0, r + 2, 0, Math.PI * 2)
  c.stroke()
  // Ink dripping from it.
  c.fillStyle = INK
  for (let k = 0; k < 4; k++) {
    const t = (tick * 0.02 + k * 0.25) % 1
    c.globalAlpha = open * (1 - t)
    drop(c, (k - 1.5) * r * 0.45, r * 0.8 + t * t * 40, Math.PI / 2, 1.6, 6)
  }
  c.restore()
}

// The black hole bursting at (x, y): a white flash, an explosion of ink blooming where it hung, an ensō of ink
// racing out across the ground and drops of ink thrown everywhere; `progress` 0..1. The blot it leaves on the
// ground is drawYanInk.
export function drawYanBurst(c: C, x: number, y: number, progress: number) {
  const p = progress, ring = 20 + p * K.radius * 1.1
  c.save()
  c.translate(x, y)
  c.globalAlpha = (1 - p) ** 2
  c.fillStyle = PAPER
  c.beginPath()
  c.arc(0, -K.holeHeight, 30 + p * 90, 0, Math.PI * 2)
  c.fill()
  c.save()
  c.translate(0, -K.holeHeight)
  c.globalAlpha = (1 - p) ** 1.5
  inkBlot(c, 34 + p * 26, 0.85, 5, ease(p / 0.12), INK, WASH)
  c.restore()
  c.save()
  c.scale(1, 0.45)
  c.globalAlpha = 1 - p
  brushArc(c, ring, 0.4, 0.4 + Math.PI * 1.85, 12 * (1 - p) + 2, 1, INK)
  c.restore()
  c.globalAlpha = 1 - p
  c.fillStyle = INK
  for (let k = 0; k < 16; k++) {
    const a = k * 0.39 + 0.2, d = 30 + p * 150 * (0.5 + (k % 4) * 0.15)
    drop(c, Math.cos(a) * d, -K.holeHeight + Math.sin(a) * d * 0.7 + p * p * 30, a, 2.6 - (k % 3) * 0.6, 10 * (1 - p) + 3)
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
  if (r > 4) {
    c.save()
    c.scale(1, 0.45)
    brushArc(c, r + 5, tick * 0.01, tick * 0.01 + Math.PI * 1.85, 5, ease(time / 0.3), '#ffffff', 'rgba(34,31,51,.6)')
    c.restore()
    drawYang(c, 0, -r * 1.05 - 10, 7, tick * 0.03)
  }
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

// Demon form. At `health` of his HP he drives both swords into himself (`stab` seconds), flickers between himself
// and the demon over `fade` seconds, then roars for `roar` seconds: enemies within `roarRadius` take `roarDamage`
// and are blasted away through the air at `roarKnockback` px/s (about 150 px). He is immune to everything until the
// roar ends. As a demon he uses `stats`, and `lifesteal` of all the damage he deals heals him.
export const YAN_DEMON = {
  health: 0.5, stab: 0.5, fade: 1.6, roar: 0.9, roarRadius: 240, roarDamage: 20, roarKnockback: 720, lifesteal: 0.5,
  stats: { speed: 190, damage: 24, cooldown: 0.4, range: 18, knockback: 70 },
} as const
// Phantom Strikes: a target within `range` px makes him dash at `dash` px/s to its far side and knock it flying a
// random way at `knockback` px/s for `air` seconds (about 175 px, low and fast); once it lands he dashes to it and
// does it again, `hits` times in all, `damage` each. A dash gives up after `chase` seconds; he gives up waiting after
// `wait`. Every `cooldown` seconds.
export const YAN_DEMON_BLINK = { range: 200, hits: 5, behind: 18, damage: 18, knockback: 700, air: 0.25, dash: 1300, chase: 0.5, wait: 1.2, trail: 0.3, cooldown: 8 } as const
// Life Gather: the demon's Tempest Slash, a red crescent that also drains `drain` of the damage it does (on top of
// his lifesteal); the victim's blood flies back into him over `blood` seconds.
export const YAN_DEMON_GATHER = { ...YAN_JIN_TEMPEST, damage: 40, drain: 0.5, blood: 0.6, cooldown: 5 } as const
// Ram Deflect: a target between `min` and `range` px away makes him rush at it at `speed` px/s, sword forward,
// turning back every enemy projectile that comes within `deflect` px. Reaching it, he knocks up every enemy within
// `radius` of it for `damage`. He gives up after `chase` seconds. Every `cooldown` seconds.
export const YAN_DEMON_RAM = { min: 150, range: 380, speed: 560, deflect: 42, chase: 1.2, radius: 60, damage: 30, knockback: 120, cooldown: 9 } as const
// Ruin: a target within `trigger` px makes him raise the sword for `raise` seconds and slam it down: `slamDamage`
// and a `stun` within `slamRadius`. He holds it in the ground for `hold`, then rips it up through a band `length` px
// long and `width` px wide toward the target, `liftDamage` and a knock-up; `lift` seconds to recover. Stun-immune throughout.
export const YAN_DEMON_RUIN = {
  trigger: 140, raise: 0.55, hold: 0.6, lift: 0.8, slamRadius: 110, slamDamage: 35, stun: 0.8,
  length: 260, width: 130, liftDamage: 60, knockback: 160, cooldown: 11,
} as const

const D_SKIN = '#f1e4de', D_HAIR = '#d3202b', D_HAIR_DARK = '#8c0f19', D_VEIN = '#e01823', D_ARMOR = '#c8141f'
const D_ARMOR_HI = '#ff6a70', D_CLOTH = '#2a1418', D_TRIM = '#7a1a22', D_RED = '#d81a26'

// 'ram' has no sprite of its own: it uses the slash arm with the sword held level in front.
type DemonPose = 'ready' | 'slash' | 'raise' | 'plant' | 'lift' | 'roar' | 'ram'

// The demon sword along +x from the hand: grey ribbed grip and ring pommel, a jagged black blade with a
// glowing red crack down it and red light bleeding off its edges.
function drawDemonSword(c: C, length: number, tick: number) {
  const L = length
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1
  box(c, -6, -1.2, 7, 2.4, 0.8, '#4a484f')
  c.beginPath()
  c.arc(-7.2, 0, 1.4, 0, Math.PI * 2)
  c.stroke()
  c.shadowColor = '#ff2a2a'
  c.shadowBlur = 6
  poly(c, '#2b1114', 2, -2.8, L * 0.22, -2.3, L * 0.28, -3.7, L * 0.42, -2.1, L * 0.52, -3.3, L * 0.68, -1.8,
    L * 0.78, -2.7, L, 0, L * 0.76, 1.7, L * 0.6, 2.7, L * 0.42, 1.8, L * 0.26, 2.9, 2, 2.6)
  c.shadowBlur = 0
  c.strokeStyle = '#ff3b3b'
  c.lineWidth = 0.8
  line(c, 3, 0.2, L * 0.4, -0.4, L * 0.7, 0.3, L - 3, 0)
  c.strokeStyle = INK
  c.lineWidth = 1
  poly(c, '#6a6870', 0.5, -4.2, 3, -3, 3, 3, 0.5, 4.2, -0.5, 0)
  // Red vapor peeling off the blade.
  c.fillStyle = D_RED
  for (let k = 0; k < 5; k++) {
    const drift = (tick * 0.5 + k * 9) % 14
    c.globalAlpha = 0.5 * (1 - drift / 14)
    c.beginPath()
    c.arc(5 + k / 4 * (L - 8), -3 - drift, 1 + (k % 2) * 0.6, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Demon form: long red hair, bare pale chest split by glowing red veins, jagged red crystal pauldrons, three red
// marks on his brow. The sword is drawn live (drawYanDemonBlade); the hands are where it is held.
function drawYanDemon(c: C, pose: DemonPose, step?: number) {
  const hand = (x: number, y: number) => {
    c.save()
    c.lineWidth = 1.2
    ellipse(c, x, y, 2.2, 2.2, D_SKIN)
    c.restore()
  }
  // Hair streaming down his back.
  poly(c, D_HAIR, 18, 5, 12.5, 11, 10, 22, 9, 32, 12.5, 36, 15, 29, 18, 20)
  c.save()
  c.strokeStyle = D_HAIR_DARK
  c.lineWidth = 0.7
  line(c, 14, 14, 11.5, 30)
  line(c, 16.5, 16, 14, 31)
  c.restore()
  poly(c, D_ARMOR, 14, 21, 10, 12, 15.5, 16, 15, 9, 19.5, 16, 21, 21)
  if (pose === 'roar') {
    poly(c, D_SKIN, 17, 21, 10, 18, 5, 13, 7.5, 11, 12, 15, 19, 19)
    hand(6, 12)
  } else if (pose === 'ready' || pose === 'slash') poly(c, D_SKIN, 17, 20, 12.5, 24, 11.5, 31, 16, 31, 19, 26)

  const trouser = (x1: number, x2: number, foot: number) => {
    poly(c, D_CLOTH, x1, 33, x2, 33, x2 - 0.5, 40, x1 + 0.5, 40)
    box(c, x1, 38, x2 - x1, 3, 1, D_TRIM)
    box(c, foot, 40, 8, 4, 1.5, '#1a0c0f')
  }
  leg(c, step, 20, 34, () => trouser(17, 23, 15))
  leg(c, opposite(step), 28, 34, () => trouser(25, 31, 26))
  // Ragged dark skirt with a red belt, and the bare chest above it.
  poly(c, D_CLOTH, 14.5, 29, 33.5, 29, 36, 37.5, 31, 35.5, 27, 38, 22, 35.5, 17, 38, 12, 37)
  poly(c, D_SKIN, 16, 19, 32, 19, 33.5, 29, 14.5, 29)
  box(c, 14.5, 28.5, 19, 2.6, 1, D_TRIM)
  // Veins glowing red, spreading up from the wound over his heart.
  c.save()
  c.shadowColor = '#ff2030'
  c.shadowBlur = 3
  c.strokeStyle = D_VEIN
  c.lineWidth = 0.9
  line(c, 24.5, 28, 24, 24.5, 21.5, 21.5, 19, 20.5)
  line(c, 24, 25, 27.5, 22, 31, 20.5)
  line(c, 24.5, 27, 20.5, 25.5, 17, 23)
  line(c, 24.5, 26.5, 29, 25.5, 32.5, 23)
  line(c, 21.5, 21.5, 22.5, 19.5)
  c.lineWidth = 1.7
  line(c, 24.5, 28, 24.5, 25.5)
  c.restore()

  c.save()
  if (pose === 'roar') { c.translate(25, 18); c.rotate(-0.28); c.translate(-25, -18) } // head thrown back
  c.lineWidth = 1.6
  ellipse(c, 25, 13, 7.5, 7.5, D_SKIN)
  c.lineWidth = 1.3
  poly(c, D_HAIR, 15.5, 16, 15, 8, 18.5, 3.5, 24, 1.8, 29.5, 2.6, 33.5, 6, 34, 11, 31.5, 7.5, 27.5, 6.2, 25, 7.5,
    21.5, 9, 20, 17, 18, 24, 15.5, 22)
  c.strokeStyle = D_HAIR_DARK
  c.lineWidth = 0.7
  line(c, 19, 6, 25, 3.8)
  line(c, 17, 10, 17.5, 19)
  c.fillStyle = D_VEIN
  for (let k = 0; k < 3; k++) {
    c.beginPath()
    c.arc(28.8, 7.9 + k * 1.4, 0.6 - k * 0.12, 0, Math.PI * 2)
    c.fill()
  }
  c.strokeStyle = INK
  c.lineWidth = 1.2
  line(c, 26.6, 10.2, 31.2, 11.2) // brow drawn down in a glare
  ellipse(c, 29.2, 12.9, 1.8, 1.1, '#ffd9d9')
  c.fillStyle = '#e01020'
  c.beginPath()
  c.arc(29.8, 12.9, 0.9, 0, Math.PI * 2)
  c.fill()
  if (pose === 'roar') ellipse(c, 30, 17.4, 1.7, 1.5, '#3a0a10')
  else line(c, 28.6, 17.6, 31, 17.2)
  c.restore()

  // Front arm, then the jagged crystal pauldron over its shoulder.
  if (pose === 'ready') poly(c, D_SKIN, 30, 22, 35, 22, 39.5, 27.5, 36.5, 30.5, 31, 27)
  else if (pose === 'slash' || pose === 'ram') poly(c, D_SKIN, 30, 21, 34, 19.5, 38.5, 20.5, 36.5, 25, 31, 26)
  else if (pose === 'plant') poly(c, D_SKIN, 30, 22, 35, 22, 38.5, 26, 35.5, 29.5, 31, 27)
  else if (pose === 'raise') poly(c, D_SKIN, 29, 21, 33, 19.5, 37, 6, 33.5, 5, 30.5, 14)
  else if (pose === 'lift') poly(c, D_SKIN, 29, 21, 33, 19.5, 40, 9, 36.5, 7, 31, 15)
  else poly(c, D_SKIN, 30, 22, 35, 21, 42, 25, 41, 28.5, 33, 27)
  poly(c, D_ARMOR, 27.5, 22, 29, 15.5, 32, 18, 34, 10, 35.5, 17.5, 39.5, 13.5, 37.5, 21.5, 33, 24.5)
  c.save()
  c.strokeStyle = D_ARMOR_HI
  c.lineWidth = 0.7
  line(c, 30, 20, 34, 12.5)
  line(c, 34, 20, 38.5, 15)
  c.restore()
  const [hx, hy] = DEMON_GRIPS[pose]
  hand(hx, hy)
  if (pose === 'plant' || pose === 'raise' || pose === 'lift') hand(hx, hy + 3.5)
}

// Where the demon holds the sword in each pose (sprite pixels) and the blade's angle.
const DEMON_GRIPS: Record<DemonPose, readonly [number, number, number]> = {
  ready: [38, 29, 1.1], slash: [36, 22, 0], raise: [35, 4.5, -Math.PI / 2], plant: [37, 26, Math.PI / 2 - 0.05],
  lift: [38.5, 7.5, -1.0], roar: [42, 27, 0.7], ram: [36, 22, -0.15],
}

export function buildYanDemonSprite(color?: string, pose: DemonPose = 'ready', step?: number) {
  return buildSprite((c) => drawYanDemon(c, pose, step), color, [15, 28.5, 18])
}

// The demon sword in sprite-local units (feet at 0,0, facing right) for `pose`. Slashing (`progress` 0..1) it
// sweeps down through a red brush stroke; raising it, red light gathers at the point.
export function drawYanDemonBlade(c: C, pose: DemonPose, progress: number, tick: number) {
  const length = pose === 'plant' ? 21 : 24, [hx, hy, angle] = DEMON_GRIPS[pose]
  c.save()
  c.translate(hx - 24, hy - 44)
  c.lineCap = c.lineJoin = 'round'
  if (pose === 'slash') {
    const from = -1.9, to = 1.0, swing = 1 - (1 - Math.min(1, progress * 2.2)) ** 3
    c.save()
    c.globalAlpha = Math.max(0, 1 - Math.max(0, progress - 0.35) * 1.6)
    bladeArc(c, length + 1, from, to, 10, swing + Math.max(0, progress - 0.45) * 1.6, D_RED, '#ff3a3a', '#ffb0a8')
    c.restore()
    c.rotate(from + (to - from) * swing)
  } else c.rotate(angle)
  drawDemonSword(c, length, tick)
  c.strokeStyle = INK
  c.lineWidth = 1.2
  ellipse(c, 0, 0, 2.2, 2.2, D_SKIN)
  if (pose === 'raise') {
    const r = 3 + 9 * ease(progress), glow = c.createRadialGradient(length, 0, 0, length, 0, r * 2)
    glow.addColorStop(0, 'rgba(255,90,90,.95)')
    glow.addColorStop(0.4, 'rgba(216,26,38,.6)')
    glow.addColorStop(1, 'rgba(216,26,38,0)')
    c.fillStyle = glow
    c.beginPath()
    c.arc(length, 0, r * 2, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Ram Deflect's barrier, in sprite-local units (feet at 0,0, facing right): a spinning red crescent in front of
// him that projectiles glance off, with streaks raking back past him.
export function drawYanRamShield(c: C, tick: number) {
  c.save()
  c.translate(14, -20)
  c.lineCap = 'round'
  for (let k = 0; k < 3; k++) {
    c.save()
    c.scale(0.55, 1)
    c.rotate(tick * 0.25 + k * 2.09)
    c.globalAlpha = 0.75
    brushArc(c, 24, -1.1, 1.1, 6 - k, 1, k ? '#ff6a6a' : D_RED, 'rgba(60,0,8,.5)')
    c.restore()
  }
  c.strokeStyle = 'rgba(216,26,38,.6)'
  c.lineWidth = 1.6
  for (const [y, length] of [[-14, 22], [-4, 30], [6, 20], [14, 26]]) {
    const shift = (tick * 3 + y * 7) % 10
    line(c, -16 - shift, y, -16 - shift - length, y)
  }
  c.restore()
}

// Red ink smoke curling up around him, in sprite-local units; drawn behind the sprite. `strength` 0..1+.
export function drawYanDemonAura(c: C, tick: number, strength: number) {
  if (strength <= 0) return
  c.save()
  const glow = c.createRadialGradient(0, -20, 4, 0, -20, 34)
  glow.addColorStop(0, `rgba(220,20,35,${Math.min(0.6, 0.32 * strength)})`)
  glow.addColorStop(1, 'rgba(220,20,35,0)')
  c.fillStyle = glow
  c.beginPath()
  c.arc(0, -20, 34, 0, Math.PI * 2)
  c.fill()
  c.lineCap = 'round'
  for (let k = 0; k < 12; k++) {
    const rise = (tick * 0.6 + k * 17) % 46, t = rise / 46, x = Math.sin(k * 2.3) * 13, curl = Math.sin(t * Math.PI * 2 + k) * 7
    c.globalAlpha = Math.min(1, strength * 0.7 * (1 - t) * Math.min(1, t * 6))
    c.strokeStyle = k % 3 ? D_RED : '#2b1114'
    c.lineWidth = 3.6 - t * 2.6
    c.beginPath()
    c.moveTo(x, -2 - rise)
    c.quadraticCurveTo(x + curl, -10 - rise, x - curl * 0.6, -18 - rise)
    c.stroke()
  }
  c.restore()
}

// The roar at his feet (x, y); `progress` 0..1: broken ensō of red ink racing out across the ground, red drops and
// dark ink flung outward, red smoke curling up. The blot under him is drawYanInk.
export function drawYanRoar(c: C, x: number, y: number, progress: number) {
  const p = progress, D = YAN_DEMON
  c.save()
  c.translate(x, y)
  for (let k = 0; k < 3; k++) {
    const q = p * 1.6 - k * 0.25
    if (q <= 0 || q >= 1) continue
    c.save()
    c.scale(1, 0.45)
    c.globalAlpha = (1 - q) * 0.9
    brushArc(c, 20 + q * D.roarRadius * 1.3, k * 2.1, k * 2.1 + Math.PI * 1.7, 10 * (1 - q) + 2, 1, k === 1 ? '#2b1114' : D_RED)
    c.restore()
  }
  for (let k = 0; k < 18; k++) {
    const a = k * 0.35, d = 18 + p * (80 + (k % 4) * 14), lift = p * 50 * (0.6 + (k % 3) * 0.3) - p * p * 40
    c.globalAlpha = 1 - p
    c.fillStyle = k % 3 ? D_RED : '#2b1114'
    drop(c, Math.cos(a) * d, Math.sin(a) * d * 0.45 - lift, Math.atan2(Math.sin(a) * 0.45 - 0.6 + p * 1.6, Math.cos(a)), 2.6 - (k % 3) * 0.5, 9)
  }
  c.lineCap = 'round'
  for (let k = 0; k < 8; k++) {
    const a = k * 0.8, d = 16 + p * 40, rise = p * 60, curl = Math.sin(p * 6 + k) * 8
    c.globalAlpha = (1 - p) * 0.6
    c.strokeStyle = k % 2 ? D_RED : '#ff6a6a'
    c.lineWidth = 5 * (1 - p) + 1
    c.beginPath()
    c.moveTo(Math.cos(a) * d, Math.sin(a) * d * 0.45)
    c.quadraticCurveTo(Math.cos(a) * d + curl, Math.sin(a) * d * 0.45 - rise * 0.5, Math.cos(a) * d - curl, Math.sin(a) * d * 0.45 - rise)
    c.stroke()
  }
  c.restore()
}

// Ruin's cracks racing from the planted sword at (x, y) along (nx, ny): brushed strokes of black ink pressed
// thick at the sword and tapering to hairlines, glowing red underneath; `progress` 0..1 over the hold.
export function drawYanRuinCracks(c: C, x: number, y: number, nx: number, ny: number, progress: number) {
  const R = YAN_DEMON_RUIN, reach = 16 + (R.length - 16) * ease(progress)
  c.save()
  c.lineCap = c.lineJoin = 'round'
  for (let k = 0; k < 5; k++) {
    const spread = (k - 2) * R.width * 0.2, points: number[] = []
    for (let i = 0; i <= 6; i++) {
      const along = 16 + (reach - 16) * i / 6, off = spread * i / 6 + (((i * 7 + k * 3) % 5) - 2) * 3
      points.push(x + nx * along - ny * off, y + ny * along + nx * off)
    }
    for (let i = 0; i < 6; i++) {
      const taper = 1 - i / 6, seg = points.slice(i * 2, i * 2 + 4)
      c.strokeStyle = 'rgba(216,26,38,.5)'
      c.lineWidth = 9 * taper + 2
      line(c, ...seg)
      c.strokeStyle = INK
      c.lineWidth = 4.5 * taper + 0.6
      line(c, ...seg)
      c.strokeStyle = '#ff4a4a'
      c.lineWidth = 1.2 * taper + 0.3
      line(c, ...seg)
    }
  }
  c.restore()
}

// Ruin's eruption along the band from (x, y) toward (nx, ny): upright black crystal spikes edged in red bursting
// from the ground one after another, then crumbling; `progress` 0..1 over the recovery. Far spikes draw first.
export function drawYanRuinEruption(c: C, x: number, y: number, nx: number, ny: number, progress: number) {
  const R = YAN_DEMON_RUIN, p = progress, n = 14
  const spikes = Array.from({ length: n }, (_, k) => {
    const along = 24 + k / (n - 1) * (R.length - 24), off = (((k * 37) % 9) - 4) / 4 * R.width * 0.4
    return { k, x: x + nx * along - ny * off, y: y + ny * along + nx * off }
  }).sort((a, b) => a.y - b.y)
  c.save()
  c.lineJoin = 'round'
  c.strokeStyle = '#ff3040'
  c.lineWidth = 1.3
  for (const { k, x: sx, y: sy } of spikes) {
    const delay = k / (n - 1) * 0.25, q = Math.min(1, Math.max(0, (p - delay) / 0.18))
    const fade = 1 - Math.max(0, (p - delay - 0.3) / 0.4)
    if (q <= 0 || fade <= 0) continue
    const h = (40 + (k % 4) * 18) * ease(q), w = 7 + (k % 3) * 3
    c.globalAlpha = fade
    c.save()
    c.translate(sx, sy)
    inkBlot(c, w * 1.4, 0.4, k * 7 + 1, ease(q), D_RED, '#ff6a6a')
    c.fillStyle = '#2b1114'
    for (let d = 0; d < 3; d++) {
      const a = -Math.PI / 2 + (d - 1) * 0.7, v = 30 + d * 8
      drop(c, Math.cos(a) * v * q, -h * 0.8 + Math.sin(a) * v * q + 40 * q * q, Math.atan2(Math.sin(a) + 2 * q, Math.cos(a)), 1.6, 5)
    }
    c.restore()
    poly(c, '#2b1114', sx - w, sy, sx - w * 0.3, sy - h * 0.6, sx, sy - h, sx + w * 0.4, sy - h * 0.5, sx + w, sy)
  }
  c.restore()
}

// A dry-brush streak of red ink where he blinked from (x1, y1) to (x2, y2) (feet), a dark core inside it and drops
// shaken off its tail; `progress` 0..1.
export function drawYanTrail(c: C, x1: number, y1: number, x2: number, y2: number, progress: number) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 1) return
  c.save()
  c.translate(x2, y2 - 16)
  c.rotate(Math.atan2(y2 - y1, x2 - x1))
  c.globalAlpha = 1 - progress
  dryStreak(c, len * 1.3, 12 * (1 - progress) + 3, D_RED)
  dryStreak(c, len * 1.1, 4 * (1 - progress) + 1, '#2b1114')
  c.fillStyle = D_RED
  for (let k = 0; k < 4; k++) drop(c, -len * (0.3 + k * 0.2), (k % 2 ? 1 : -1) * (6 + progress * 10), Math.PI, 1.6, 4)
  c.restore()
}

// A flying crescent slash at (x, y) (ground point under it), heading `angle`, `age` seconds old: white ink edged in
// black for Tempest Slash, or blood red and glowing for Life Gather, with streaks trailing behind it.
export function drawYanCrescent(c: C, x: number, y: number, angle: number, demon: boolean, age: number, tick: number) {
  const grow = ease(age / 0.12), R = 24 * grow, fade = Math.min(1, (YAN_JIN_TEMPEST.life - age) / 0.15)
  if (R <= 1 || fade <= 0) return
  c.save()
  c.translate(x, y - 18)
  c.rotate(angle)
  c.globalAlpha = fade
  c.lineCap = c.lineJoin = 'round'
  // Streaks trailing behind.
  c.strokeStyle = demon ? 'rgba(216,26,38,.55)' : 'rgba(34,31,51,.35)'
  c.lineWidth = 1.4
  for (const off of [-14, -5, 5, 14]) {
    const length = 18 + ((tick + off * 3) % 8)
    line(c, -4, off, -4 - length, off * 0.9)
  }
  // The crescent: an outer arc ahead, an inner arc carving it thin at the tips.
  c.beginPath()
  c.arc(-R * 0.55, 0, R, -1.15, 1.15)
  c.arc(-R * 0.85, 0, R * 0.95, 1.05, -1.05, true)
  c.closePath()
  if (demon) {
    c.shadowColor = '#ff2a2a'
    c.shadowBlur = 10
  }
  c.fillStyle = demon ? D_RED : '#ffffff'
  c.fill()
  c.shadowBlur = 0
  c.strokeStyle = demon ? '#3a0a10' : INK
  c.lineWidth = 1.3
  c.stroke()
  if (demon) {
    // Red vapor boiling off it.
    c.fillStyle = '#ff6a6a'
    for (let k = 0; k < 5; k++) {
      const drift = (tick * 0.6 + k * 7) % 12
      c.globalAlpha = fade * 0.5 * (1 - drift / 12)
      c.beginPath()
      c.arc(-6 - drift * 1.5, (k - 2) * 7, 1.5 + (k % 2), 0, Math.PI * 2)
      c.fill()
    }
  }
  c.restore()
}

// A drop of blood drained by Life Gather, `progress` 0..1 of the way from (x1, y1) to (x2, y2) along a curve bent
// by `bend` px, shrinking as it is absorbed.
export function drawYanBlood(c: C, x1: number, y1: number, x2: number, y2: number, bend: number, progress: number) {
  const t = ease(progress), dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1
  const arc = Math.sin(progress * Math.PI) * bend
  const x = x1 + dx * t - dy / d * arc, y = y1 + dy * t + dx / d * arc
  const r = 2.4 * (1 - progress * 0.5)
  c.save()
  c.globalAlpha = Math.min(1, (1 - progress) * 3)
  c.strokeStyle = 'rgba(200,16,30,.5)'
  c.lineWidth = r
  c.lineCap = 'round'
  line(c, x - dx / d * 6, y - dy / d * 6, x, y)
  c.fillStyle = '#c8101e'
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

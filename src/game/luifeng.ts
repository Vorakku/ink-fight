import { box, buildSprite, ellipse, INK, line, poly, type C } from './art.ts'
import { CAVALRY_GALLOP_FRAMES, horseLeg, swoosh, type Swing } from './cavalry.ts'

// Legendary general: rides with the cavalry's gallop-and-circle slashing, but never falls from his horse.
export const LUI_FENG = {
  name: 'Lui Feng',
  blurb: 'A legendary army general in black-and-gold dragon armour on a white warhorse. Gallops circles around enemies, sweeping everything nearby with his crescent halberd, and never falls from his horse',
  color: '#f3f0e8', radius: 22, hp: 900, speed: 240, damage: 30, range: 40,
  cooldown: 0.6, knockback: 120, spacing: 64, size: 2.3,
} as const
// Enhance: whirls the halberd overhead for `spin` s, slams the ground knocking every enemy in `radius` away, then rides
// in a pulsing aura for `duration` s: speed × `speed`, damage and knockback × `power`, enemy damage cut by `armor`.
// It sets off when an enemy comes within `trigger`.
export const LUI_ENHANCE = { spin: 0.8, slam: 0.35, radius: 130, damage: 30, knockback: 360, duration: 10, cooldown: 18,
  trigger: 180, speed: 1.35, power: 1.5, armor: 0.4 } as const

// Piercing Charge: leans back gathering ink-wind into the spear for `windup` s, gallops at `speed` (for up to `dash` s)
// into a target `minRange`–`range` away, pierces it for `damage` (× Enhance power in the aura), lifts it on the
// spear for `lift` s, then swings and flings it `distance` px. Targets wider than him are only hit and knocked back.
export const LUI_CHARGE = { windup: 1, speed: 560, dash: 1.1, minRange: 90, range: 420, reach: 30, damage: 60,
  knockback: 260, lift: 0.55, swing: 0.3, distance: 280, cooldown: 9 } as const

// Normal attack: the halberd sweeps one full turn flat round him over `time` s, hitting every enemy within `reach` px
// of his body. Painted as one wide blue blade trail travelling round him: it cuts in, grows to a ring, then its tail
// chases the head away, gone after `life` s. `width` is the trail's thickness at its fattest.
export const LUI_SWEEP = { time: 0.32, life: 0.75, reach: 60, width: 52 } as const

type Pose = 'ride' | 'raise' | 'slam' | 'couch' | 'hold' | 'sweep'

const WHITE = '#f6f3ec', FAR = '#c4bdaf', MANE = '#ece7dc', SHADE = '#cfc8ba', GOLD = '#d9a93a', GOLD_DARK = '#8f6a1f'
const ARMOR = '#2b2730', RED = '#b3242b', RED_DARK = '#7a1a1f', HAIR = '#1d191e', SKIN = '#eac09c', TACK = '#3b2a20'
// Drawn 10% smaller about the hooves so his crown and halberd fit inside the 48-unit sprite.
const FIT = 0.9
// Where his raised hand holds the whirling halberd during Enhance (sprite units, before FIT).
const SPIN_HAND = [27.5, 0.5, 0] as const
// Piercing Charge: he leans back about the hip with the spear couched level; then holds it out in front (drawn live).
const LEAN = -0.14, HIP = [22, 20] as const, COUCH = [27, 17, 0.05 - LEAN] as const, HOLD_HAND = [28.5, 13, 0] as const
// Mid-sweep his hand pulls in to his chest and the halberd turns round it (drawn live by drawLuiSweepSpear).
const SWEEP_HAND = [26.5, 14.5, 0] as const
const BLADE = 16 // from the grip to the middle of the spear point, where the ink gathers and the victim hangs
const toRender = (x: number, y: number) => [(x - 24) * FIT, (y - 44) * FIT] as const

// The couched spear point in the fighter's space (feet at the origin, facing right, before scaling by size).
export const LUI_COUCH_TIP = (() => {
  const dx = COUCH[0] - HIP[0], dy = COUCH[1] - HIP[1], a = COUCH[2] + LEAN
  const gx = HIP[0] + dx * Math.cos(LEAN) - dy * Math.sin(LEAN), gy = HIP[1] + dx * Math.sin(LEAN) + dy * Math.cos(LEAN)
  return toRender(gx + Math.cos(a) * BLADE, gy + Math.sin(a) * BLADE)
})()

// The held spear's point at `angle`, in the same space: where a pierced victim is carried.
export function luiHeldTip(angle: number) {
  return toRender(HOLD_HAND[0] + Math.cos(angle) * BLADE, HOLD_HAND[1] + Math.sin(angle) * BLADE)
}

// The held spear's angle (0 level, negative up) `time` s into the lift (raising the victim high) or the swing
// (sweeping forward and down to fling it).
export function luiSpearAngle(phase: 'lift' | 'swing', time: number) {
  if (phase === 'lift') return 0.35 - 1.4 * (1 - (1 - Math.min(1, time / LUI_CHARGE.lift)) ** 2)
  return -1.05 + 1.55 * Math.min(1, time / LUI_CHARGE.swing) ** 2
}

// Overlapping armour scales: staggered rows of small gold-edged arcs.
function scales(c: C, x: number, y: number, w: number, h: number) {
  c.save()
  c.strokeStyle = 'rgba(217,169,58,.55)'; c.lineWidth = 0.4
  for (let row = 0; row * 1.6 < h; row++)
    for (let col = 0; col * 1.6 < w - 0.8; col++) {
      c.beginPath(); c.arc(x + col * 1.6 + (row % 2) * 0.8, y + row * 1.6, 0.8, 0, Math.PI); c.stroke()
    }
  c.restore()
}

// Black shaft with a gold butt spike, gold socket, leaf spear point, twin engraved crescents and a red tassel on a bead.
function halberd(c: C, x: number, y: number, angle: number, back: number, front: number) {
  c.save()
  c.translate(x, y); c.rotate(angle)
  c.strokeStyle = INK; c.lineWidth = 2.6
  line(c, -back, 0, front, 0)
  c.strokeStyle = '#2a2530'; c.lineWidth = 1.6
  line(c, -back, 0, front, 0)
  c.strokeStyle = INK; c.lineWidth = 0.6
  poly(c, GOLD, -back, -1.1, -back - 4, 0, -back, 1.1)
  for (const s of [-1, 1]) {
    c.beginPath()
    c.moveTo(front - 3, s * 1.3)
    c.quadraticCurveTo(front + 1.5, s * 8.5, front + 5.5, s * 2.6)
    c.quadraticCurveTo(front + 1.5, s * 5, front - 3, s * 1.3)
    c.closePath(); c.fillStyle = '#dfe3e6'; c.fill(); c.stroke()
    c.strokeStyle = GOLD_DARK; c.lineWidth = 0.4
    c.beginPath(); c.moveTo(front - 1, s * 2.4); c.quadraticCurveTo(front + 1.5, s * 6.2, front + 4, s * 3.2); c.stroke()
    c.strokeStyle = INK; c.lineWidth = 0.6
  }
  c.beginPath()
  c.moveTo(front + 1.5, -1.3)
  c.quadraticCurveTo(front + 7, -2.8, front + 12, 0)
  c.quadraticCurveTo(front + 7, 2.8, front + 1.5, 1.3)
  c.closePath(); c.fillStyle = '#efe8d6'; c.fill(); c.stroke()
  c.strokeStyle = 'rgba(143,106,31,.6)'; c.lineWidth = 0.4
  line(c, front + 2.5, 0, front + 10, 0)
  c.strokeStyle = INK; c.lineWidth = 0.6
  box(c, front - 3.5, -1.6, 2, 3.2, 0.6, GOLD)
  box(c, front - 1, -1.8, 2.8, 3.6, 0.8, GOLD)
  line(c, front - 4.5, 0.8, front - 5.5, 3.5)
  ellipse(c, front - 5.6, 3.8, 0.7, 0.7, '#f4efe2')
  poly(c, RED, front - 5.6, 4.4, front - 7.4, 9, front - 5.8, 9.6, front - 4.4, 9, front - 5, 4.4)
  c.restore()
}

function general(c: C, swing: Swing, frame: number, pose: Pose) {
  const stand = frame >= CAVALRY_GALLOP_FRAMES, t = frame / CAVALRY_GALLOP_FRAMES * Math.PI * 2
  const nod = stand ? 0 : Math.sin(t) * 1.2
  const flow = stand ? 0 : -1.5 - Math.sin(t * 2) * 0.8 // mane, tail, cape and hair stream back at speed

  c.fillStyle = 'rgba(34,31,51,.16)'
  c.beginPath(); c.ellipse(25, 44, 17, 3.2, 0, 0, Math.PI * 2); c.fill()
  // Not restored, so buildSprite's team headband lands on his head in the same space.
  c.translate(24, 44); c.scale(FIT, FIT); c.translate(-24, -44)

  // Long white tail.
  c.strokeStyle = INK; c.lineWidth = 1
  c.beginPath()
  c.moveTo(10.5, 22)
  c.quadraticCurveTo(4 + flow, 21, 1.5 + flow * 1.5, 27)
  c.quadraticCurveTo(flow * 1.6, 34, 2.5 + flow, 41)
  c.quadraticCurveTo(5, 35, 6.5, 31)
  c.quadraticCurveTo(8, 28, 10, 27)
  c.closePath(); c.fillStyle = MANE; c.fill(); c.stroke()
  c.strokeStyle = SHADE; c.lineWidth = 0.6
  for (const k of [0, 1, 2]) {
    c.beginPath(); c.moveTo(9.5, 23.5 + k); c.quadraticCurveTo(3 + flow * 1.3 + k, 28 + k, 3 + flow + k * 1.2, 36 + k); c.stroke()
  }

  horseLeg(c, 13, 30, t, false, stand, FAR)
  horseLeg(c, 31, 30, t - 2.4, true, stand, FAR)
  horseLeg(c, 15.5, 31, t - 0.7, false, stand, WHITE)
  horseLeg(c, 33.5, 30.5, t - 3.1, true, stand, WHITE)

  // White body with soft grey shading under the belly, neck and muzzle.
  const body = new Path2D()
  body.moveTo(10, 23)
  body.quadraticCurveTo(14, 19.5, 21, 21.5)
  body.quadraticCurveTo(27, 22.5, 31, 19)
  body.quadraticCurveTo(34, 13, 37, 10 + nod)
  body.quadraticCurveTo(40, 9 + nod, 42, 12 + nod)
  body.lineTo(46.5, 16.5 + nod)
  body.quadraticCurveTo(47.5, 19.5 + nod, 44.5, 20.5 + nod)
  body.lineTo(41, 20 + nod)
  body.quadraticCurveTo(38, 21, 37, 24)
  body.quadraticCurveTo(37.5, 30, 33, 32.5)
  body.quadraticCurveTo(23, 35, 15, 32.5)
  body.quadraticCurveTo(8.5, 31, 10, 23)
  body.closePath()
  c.fillStyle = WHITE; c.fill(body)
  c.save()
  c.clip(body)
  c.fillStyle = 'rgba(120,110,95,.22)'
  c.beginPath(); c.ellipse(23, 34, 14, 3.5, 0, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.ellipse(38.5, 23, 2.5, 5, 0, 0, Math.PI * 2); c.fill()
  c.fillStyle = 'rgba(110,100,95,.35)'
  c.beginPath(); c.ellipse(46, 18.5 + nod, 2.2, 2, 0, 0, Math.PI * 2); c.fill()
  c.restore()
  c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(body)
  c.strokeStyle = 'rgba(34,31,51,.3)'; c.lineWidth = 0.6
  line(c, 34, 23, 32.5, 29.5)
  c.beginPath(); c.arc(14.5, 27, 4.5, -2.2, 0.4); c.stroke()

  // Flowing white mane, forelock, ear, eye.
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, MANE, 38, 9.5 + nod, 32 + flow * 1.2, 8.5 + nod, 34.5, 12 + nod, 28.5 + flow * 1.3, 12.5, 31.5, 15.5,
    26.5 + flow * 1.2, 17, 29.5, 19.5, 31.5, 19.5)
  c.strokeStyle = SHADE; c.lineWidth = 0.5
  line(c, 36.5, 10.5 + nod, 32, 13.5); line(c, 34.5, 13 + nod, 30, 17.5)
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, MANE, 39, 9.5 + nod, 42.5, 10.5 + nod, 40.5, 13 + nod)
  poly(c, WHITE, 37.5, 10.5 + nod, 38.5, 5.5 + nod, 40.5, 10 + nod)
  c.fillStyle = INK
  c.fillRect(40.8, 13 + nod, 1.4, 1.4)
  c.fillRect(45.4, 18.2 + nod, 0.9, 0.9)

  // Gold bridle with a crest between the ears, and the rein back to his hand.
  c.strokeStyle = GOLD; c.lineWidth = 0.9
  line(c, 41.5, 11 + nod, 43, 19.5 + nod)
  line(c, 41.8, 16.4 + nod, 46.6, 17.4 + nod)
  line(c, 39.2, 11.2 + nod, 42.2, 10.6 + nod)
  c.strokeStyle = INK; c.lineWidth = 0.5
  poly(c, GOLD, 39.6, 9.2 + nod, 40.8, 5.6 + nod, 42.2, 9 + nod)
  ellipse(c, 41.8, 16.4 + nod, 0.8, 0.8, GOLD)
  ellipse(c, 43.4, 19.5 + nod, 1, 1, GOLD)
  c.strokeStyle = TACK; c.lineWidth = 0.8
  c.beginPath(); c.moveTo(43.4, 19.5 + nod); c.quadraticCurveTo(35, 24, 27.5, 16.5); c.stroke()

  // Gold breast collar with a medallion and red tassel; gold crupper strap with its own tassel.
  c.strokeStyle = GOLD; c.lineWidth = 1.4
  c.beginPath(); c.moveTo(29, 22.6); c.quadraticCurveTo(33.5, 26, 37.3, 24.5); c.stroke()
  c.lineWidth = 0.9
  c.beginPath(); c.moveTo(14.8, 23); c.quadraticCurveTo(11.5, 23.5, 10.4, 24.4); c.stroke()
  c.strokeStyle = INK; c.lineWidth = 0.5
  poly(c, RED, 35.2, 27, 34.4, 30.8, 36.4, 31, 36.2, 27)
  ellipse(c, 35.7, 25.6, 1.5, 1.4, GOLD)
  ellipse(c, 35.7, 25.6, 0.6, 0.6, RED)
  poly(c, RED, 12.6, 23.8, 11.6, 27.6, 13.4, 27.3)

  // Black saddle cloth with gold trim and a red fringe.
  c.lineWidth = 0.9
  poly(c, ARMOR, 14.5, 21, 29, 21.6, 28.6, 29.6, 15.5, 29.2)
  c.strokeStyle = GOLD; c.lineWidth = 0.7
  line(c, 15.4, 28.2, 28, 28.6)
  line(c, 28, 22.4, 27.7, 28.6)
  c.strokeStyle = RED; c.lineWidth = 0.7
  for (let x = 16; x <= 28; x += 1.2) line(c, x, 29.4, x - 0.3, 31)

  // Couched, he leans the whole rider back about the hip. Left applied, like FIT, so the headband leans with him.
  if (pose === 'couch') { c.translate(HIP[0], HIP[1]); c.rotate(LEAN); c.translate(-HIP[0], -HIP[1]) }

  // Great red cape streaming behind, embroidered with gold clouds and a gold hem.
  c.strokeStyle = INK; c.lineWidth = 1
  c.beginPath()
  c.moveTo(21.5, 10)
  c.quadraticCurveTo(14 + flow, 11, 7 + flow * 2, 16)
  c.quadraticCurveTo(3 + flow * 2.2, 20, 3.5 + flow * 2, 25)
  c.quadraticCurveTo(8 + flow, 22.5, 12, 24.5)
  c.quadraticCurveTo(15, 19, 18.5, 15)
  c.closePath(); c.fillStyle = RED; c.fill(); c.stroke()
  c.strokeStyle = RED_DARK; c.lineWidth = 0.8
  c.beginPath(); c.moveTo(19, 12); c.quadraticCurveTo(12 + flow, 15, 7 + flow * 1.8, 21); c.stroke()
  c.strokeStyle = GOLD; c.lineWidth = 0.6
  c.beginPath(); c.moveTo(3.9 + flow * 2, 24.2); c.quadraticCurveTo(8 + flow, 21.7, 11.8, 23.6); c.stroke()
  c.beginPath(); c.arc(11 + flow, 17.5, 1.2, 0, Math.PI * 1.5); c.stroke()
  c.beginPath(); c.arc(14.5 + flow * 0.6, 14.5, 0.9, Math.PI, Math.PI * 2.6); c.stroke()

  // Long black hair streaming back from under the crown.
  c.strokeStyle = INK; c.lineWidth = 0.8
  c.beginPath()
  c.moveTo(19, 3)
  c.quadraticCurveTo(13 + flow, 3.5, 8.5 + flow * 1.6, 8.5)
  c.quadraticCurveTo(12 + flow, 7.6, 13.5 + flow, 10)
  c.quadraticCurveTo(16.5, 8, 19, 9.5)
  c.closePath(); c.fillStyle = HAIR; c.fill(); c.stroke()

  // Leg, then the red robe and black scale tasset over the horse's flank, then the boot in a gold stirrup.
  c.strokeStyle = TACK; c.lineWidth = 0.7
  line(c, 21.5, 22, 24, 30.5)
  c.strokeStyle = INK; c.lineWidth = 3.8
  line(c, 21, 19, 26, 24, 24.5, 29.5)
  c.strokeStyle = '#3a2f36'; c.lineWidth = 2.4
  line(c, 21, 19, 26, 24, 24.5, 29.5)
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, RED, 17, 18.5, 27, 18.5, 29.5, 26.5, 26.5, 29.5, 18, 28.8, 15.5, 24.5)
  c.strokeStyle = GOLD; c.lineWidth = 0.7
  line(c, 16, 25.3, 18.3, 28.2, 26.3, 28.8, 28.8, 26.4)
  c.strokeStyle = INK; c.lineWidth = 0.8
  poly(c, ARMOR, 19, 18.8, 26.5, 18.8, 27.6, 25, 23.5, 26.8, 19.3, 26)
  scales(c, 19.8, 20, 7, 5.5)
  c.strokeStyle = GOLD; c.lineWidth = 0.5
  line(c, 19.3, 25.6, 23.5, 26.4, 27.4, 24.7)
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, ARMOR, 22.4, 28, 26.2, 28.4, 28.4, 31.4, 22.4, 31.8)
  c.strokeStyle = GOLD; c.lineWidth = 0.5
  line(c, 22.6, 29, 26.3, 29.3)
  c.lineWidth = 0.8
  line(c, 22, 32.2, 27.5, 32.2)

  // Black scale cuirass with gold trim, dragon coil on the chest, red collar and a gold lion belt.
  c.strokeStyle = INK; c.lineWidth = 0.8
  ellipse(c, 18, 10.5, 2.4, 2, GOLD_DARK)
  c.lineWidth = 1.2
  box(c, 17, 9, 10, 10.5, 3, ARMOR)
  scales(c, 18, 11, 8, 7)
  c.strokeStyle = GOLD; c.lineWidth = 0.6
  c.beginPath(); c.roundRect(17.8, 9.8, 8.4, 9, 2.4); c.stroke()
  c.lineWidth = 0.7
  c.beginPath(); c.arc(23.3, 14.2, 1.6, -0.5, Math.PI * 1.6); c.stroke()
  c.beginPath(); c.arc(23.3, 14.2, 0.7, 0, Math.PI * 1.8); c.stroke()
  c.strokeStyle = INK; c.lineWidth = 0.6
  poly(c, RED, 19.5, 8.6, 24.8, 8.6, 22.2, 12)
  c.strokeStyle = '#f4efe2'; c.lineWidth = 0.5
  line(c, 20.4, 8.9, 22.2, 11, 24, 8.9)
  c.strokeStyle = INK; c.lineWidth = 0.7
  box(c, 17, 17.8, 10, 2, 0.6, GOLD)
  ellipse(c, 23, 18.8, 1.4, 1.2, GOLD_DARK)
  ellipse(c, 23, 18.8, 0.5, 0.5, RED)

  // Head: hair with topknot, gold crown trailing bead strands, stern brow, moustache and goatee.
  c.lineWidth = 1.1
  ellipse(c, 22, 6, 4.3, 4.5, SKIN)
  c.lineWidth = 0.8
  c.beginPath()
  c.moveTo(17.8, 7.5); c.quadraticCurveTo(17.2, 1.4, 22.4, 1.4)
  c.quadraticCurveTo(26.4, 1.5, 26.2, 4.2)
  c.quadraticCurveTo(23.5, 3, 21.5, 3.8)
  c.quadraticCurveTo(20, 5.4, 20.4, 8.8)
  c.closePath(); c.fillStyle = HAIR; c.fill(); c.stroke()
  c.lineWidth = 0.6
  ellipse(c, 20.6, 6.6, 0.9, 1.2, SKIN)
  poly(c, GOLD, 20, 1.8, 20.6, -1.2, 22.6, -2.6, 25.2, -1.6, 25.4, 0.4, 24.6, 1.9)
  ellipse(c, 22.8, -0.3, 0.7, 0.7, RED)
  c.strokeStyle = GOLD; c.lineWidth = 0.4
  c.fillStyle = GOLD
  for (const [x, y] of [[19.8, 4.5], [18.6, 4], [17.4, 3.2]]) {
    line(c, 20.2, 0.5, x + flow * 0.3, y)
    c.fillRect(x + flow * 0.3 - 0.4, y - 0.2, 0.8, 0.8)
  }
  c.strokeStyle = INK; c.lineWidth = 0.7
  line(c, 23.4, 4.4, 25.9, 4.9)
  c.fillStyle = INK
  c.fillRect(24.3, 5.4, 1.3, 1.1)
  c.lineWidth = 0.5
  line(c, 26.2, 5.8, 26.6, 7.4, 26, 7.6)
  c.lineWidth = 0.4
  poly(c, HAIR, 24.2, 8.4, 26.4, 8, 25.6, 8.7)
  poly(c, HAIR, 24.9, 9, 26, 9, 25.3, 11.2)

  // Red-sleeved arm under a gold dragon pauldron, swinging the halberd round him, raising it to whirl (drawn live
  // by drawLuiSpin) or driving it into the ground.
  const grip = pose === 'raise' ? SPIN_HAND : pose === 'hold' ? HOLD_HAND : pose === 'sweep' ? SWEEP_HAND : pose === 'couch' ? COUCH : pose === 'slam' ? [28, 19, 1.15] as const
    : ([[27, 15, -0.75], [21, 9, -2.75], [28, 15, 0.05], [27, 19, 2.2]] as const)[swing]
  if (pose === 'ride' && swing === 2) swoosh(c, 24, 13, 20, 12, -2.7, 0.05)
  if (pose === 'ride' && swing === 3) swoosh(c, 24, 15, 20, 12, -1.6, 2.2)
  c.strokeStyle = INK; c.lineWidth = 3.6
  line(c, 24.5, 11, grip[0], grip[1])
  c.strokeStyle = RED; c.lineWidth = 2.3
  line(c, 24.5, 11, grip[0], grip[1])
  c.strokeStyle = INK; c.lineWidth = 0.8
  poly(c, GOLD, 21.6, 9.6, 23.6, 8, 26.6, 8.4, 28.6, 10.2, 27.8, 12.6, 25, 13.2, 22.2, 12.2)
  c.strokeStyle = GOLD_DARK; c.lineWidth = 0.5
  line(c, 23, 10, 25.5, 9.4, 27.6, 10.6)
  line(c, 23.4, 11.6, 27, 12)
  c.strokeStyle = INK; c.lineWidth = 0.4
  ellipse(c, 27.2, 10.4, 0.5, 0.5, RED)
  if (pose !== 'raise' && pose !== 'hold' && pose !== 'sweep') halberd(c, grip[0], grip[1], grip[2], pose === 'slam' ? 6 : 14, 10)
  c.lineWidth = 0.6
  ellipse(c, 24.5 + (grip[0] - 24.5) * 0.75, 11 + (grip[1] - 11) * 0.75, 1.5, 1.3, GOLD)
  c.lineWidth = 1
  ellipse(c, grip[0], grip[1], 2.3, 2.1, SKIN)
}

export function buildLuiFengSprite(color?: string, swing: Swing = 0, frame = CAVALRY_GALLOP_FRAMES, pose: Pose = 'ride') {
  // shortcut: pixel scale 4 keeps him sharp at size 2.3; raise it if he grows much bigger.
  return buildSprite((c) => general(c, swing, frame, pose), color, [18, 3, 8], false, 4)
}

export function buildLuiFengPoses(color?: string) {
  const still = (pose: Pose) => buildLuiFengSprite(color, 0, CAVALRY_GALLOP_FRAMES, pose)
  return { raise: still('raise'), slam: still('slam'), hold: still('hold'),
    // couch[frame]: galloping frames for the charge, plus the standing one for the windup
    couch: Array.from({ length: CAVALRY_GALLOP_FRAMES + 1 }, (_, frame) => buildLuiFengSprite(color, 0, frame, 'couch')),
    // sweep[frame]: the normal attack keeps galloping, so its pose gallops too
    sweep: Array.from({ length: CAVALRY_GALLOP_FRAMES + 1 }, (_, frame) => buildLuiFengSprite(color, 0, frame, 'sweep')) }
}

// The spear held out with a victim on it, at `angle`, over the hold pose (fighter's space, sprite units).
export function drawLuiHeld(c: C, angle: number) {
  c.save()
  c.scale(FIT, FIT); c.translate(HOLD_HAND[0] - 24, HOLD_HAND[1] - 44)
  c.lineJoin = c.lineCap = 'round'
  halberd(c, 0, 0, angle, 14, 10)
  c.strokeStyle = INK; c.lineWidth = 1
  ellipse(c, 0, 0, 2.3, 2.1, SKIN)
  c.restore()
}

// The halberd whirling flat above his head, `turn` radians round, with its blur disc. Drawn over the raise pose in the
// fighter's space (origin at his feet, sprite units).
export function drawLuiSpin(c: C, turn: number) {
  c.save()
  c.scale(FIT, FIT); c.translate(SPIN_HAND[0] - 24, SPIN_HAND[1] - 44)
  c.lineJoin = c.lineCap = 'round'
  c.fillStyle = 'rgba(255,240,200,.28)'; c.strokeStyle = 'rgba(217,169,58,.6)'; c.lineWidth = 0.8
  c.beginPath(); c.ellipse(0, 0, 22, 5.5, 0, 0, Math.PI * 2); c.fill(); c.stroke()
  c.save()
  c.scale(1, 0.28) // seen from the side, the flat spin squashes into an ellipse
  halberd(c, 0, 0, turn, 15, 5)
  c.restore()
  c.strokeStyle = INK; c.lineWidth = 1
  ellipse(c, 0, 0, 2.3, 2.1, SKIN)
  c.restore()
}

// Enhance aura: a pulsing gold ring on the ground and motes orbiting round him and his halberd on a tilted ring.
// Drawn twice: the far half (front = false) before his sprite, the near half after.
export function drawLuiAura(c: C, tick: number, fade: number, seed: number, front: boolean) {
  if (fade <= 0) return
  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.15 + seed)
  c.save()
  c.globalAlpha *= fade
  c.lineCap = 'round'
  if (!front) {
    const glow = c.createRadialGradient(0, -20, 4, 0, -20, 34)
    glow.addColorStop(0, 'rgba(255,214,107,.28)'); glow.addColorStop(1, 'rgba(255,214,107,0)')
    c.fillStyle = glow
    c.beginPath(); c.ellipse(0, -20, 34, 30, 0, 0, Math.PI * 2); c.fill()
    const r = 26 + pulse * 4
    c.strokeStyle = `rgba(255,214,107,${0.35 + 0.35 * pulse})`; c.lineWidth = 2
    c.beginPath(); c.ellipse(0, 0, r, r * 0.28, 0, 0, Math.PI * 2); c.stroke()
    c.strokeStyle = 'rgba(255,244,194,.8)'; c.lineWidth = 0.7; c.stroke()
  }
  const rx = 30, ry = 8, spin = tick * 0.09 + seed
  c.translate(0, -22); c.rotate(-0.18)
  c.strokeStyle = `rgba(255,214,107,${0.3 + 0.3 * pulse})`; c.lineWidth = 1.2
  c.beginPath(); c.ellipse(0, 0, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); c.stroke()
  for (let k = 0; k < 6; k++) {
    const a = spin + k * Math.PI / 3
    if ((Math.sin(a) >= 0) !== front) continue
    c.strokeStyle = 'rgba(255,214,107,.55)'; c.lineWidth = 1.6
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, a - 0.5, a); c.stroke()
    c.fillStyle = '#fff4c2'
    c.beginPath(); c.arc(Math.cos(a) * rx, Math.sin(a) * ry, 1.4 + pulse * 0.5, 0, Math.PI * 2); c.fill()
  }
  c.restore()
}

// frames[swing][frame], the same layout as buildCavalryFrames so the cavalry riding code draws him.
export function buildLuiFengFrames(color?: string) {
  return ([0, 1, 2, 3] as const).map((swing) =>
    Array.from({ length: CAVALRY_GALLOP_FRAMES + 1 }, (_, frame) => buildLuiFengSprite(color, swing, frame)))
}

// The halberd `progress` 0..1 through one flat sweep round him: seen from the side it foreshortens as it passes
// behind and in front of him. Fighter's space, over the sweep pose.
export function drawLuiSweepSpear(c: C, progress: number) {
  const a = progress * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a) * 0.32
  c.save()
  c.scale(FIT, FIT); c.translate(SWEEP_HAND[0] - 24, SWEEP_HAND[1] - 44)
  c.lineJoin = c.lineCap = 'round'
  c.save()
  c.rotate(Math.atan2(dy, dx)); c.scale(Math.hypot(dx, dy), 1)
  halberd(c, 0, 0, 0, 6, 14)
  c.restore()
  c.strokeStyle = INK; c.lineWidth = 1
  ellipse(c, 0, 0, 2.3, 2.1, SKIN)
  c.restore()
}

// The blade trail round (0,0) at radius `r`: past `reveal` 1 its tail catches up with the head and it is gone by 1.85.
// Unlike bladeArc it is fat almost from the start, sharp only at its very ends: glow, blue body, white core, razor edge.
function blueTrail(c: C, r: number, width: number, reveal: number) {
  const head = Math.min(1, reveal), tail = Math.min(1, Math.max(0, reveal - 0.85))
  if (head - tail < 0.02) return
  const n = 32, a = (t: number) => (tail + (head - tail) * t) * Math.PI * 2
  const crescent = (scale: number) => {
    c.beginPath()
    for (let i = 0; i <= n; i++) c.lineTo(Math.cos(a(i / n)) * r, Math.sin(a(i / n)) * r)
    for (let i = n; i >= 0; i--) {
      const t = i / n, w = width * scale * Math.sin(Math.PI * t) ** 0.3 * (0.75 + 0.25 * t)
      c.lineTo(Math.cos(a(t)) * (r - w), Math.sin(a(t)) * (r - w))
    }
    c.closePath()
    c.fill()
  }
  c.save()
  c.fillStyle = '#9fd2ff'
  c.shadowColor = '#4d9bff'
  c.shadowBlur = width * 0.8
  c.globalAlpha *= 0.45
  crescent(1.25)
  c.restore()
  c.save()
  c.fillStyle = '#3d8ef0'
  crescent(1)
  c.fillStyle = '#bfe4ff'
  crescent(0.55)
  c.fillStyle = '#ffffff'
  crescent(0.25)
  c.strokeStyle = '#ffffff'
  c.lineWidth = Math.max(0.8, width * 0.06)
  c.lineCap = 'round'
  c.beginPath()
  for (let i = 2; i <= n; i++) c.lineTo(Math.cos(a(i / n)) * r, Math.sin(a(i / n)) * r)
  c.stroke()
  c.restore()
}

// One normal attack's sweep round the fighter at ground point (x, y), `time` s after the swing began. `radius` is the
// hit reach; `facing` mirrors it so the trail turns the same way as his halberd.
export function drawLuiSweep(c: C, x: number, y: number, radius: number, facing: number, time: number) {
  const fade = Math.max(0, Math.min(1, (LUI_SWEEP.life - time) / 0.2))
  if (fade <= 0) return
  c.save()
  c.globalAlpha = fade
  c.translate(x, y - 18); c.scale(facing, 0.42) // lies on the ground's perspective at body height
  blueTrail(c, radius + 10, LUI_SWEEP.width, time / LUI_SWEEP.time)
  c.restore()
}

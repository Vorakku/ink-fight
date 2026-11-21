import { box, buildSprite, ellipse, INK, line, poly, type C } from './art.ts'
import { CAVALRY_GALLOP_FRAMES, horseLeg, swoosh, type Swing } from './cavalry.ts'

// Legendary general: rides with the cavalry's gallop-and-circle slashing, but never falls from his horse.
export const LUI_FENG = {
  name: 'Lui Feng',
  blurb: 'A legendary mounted general wielding a crescent spear and longbow. Sweeps through groups with ink-black Carnage, rains arrows from the sky and shatters the ground beneath his horse',
  color: '#f3f0e8', radius: 22, hp: 900, speed: 240, damage: 30, range: 40,
  cooldown: 0.6, knockback: 120, spacing: 64, size: 2.3, detection: 600,
} as const
// Enhance: whirls the halberd overhead for `spin` s, slams the ground knocking every enemy in `radius` away, then rides
// in a pulsing aura for `duration` s: speed × `speed`, damage and knockback × `power`, enemy damage cut by `armor`.
// It sets off when an enemy comes within `trigger`.
export const LUI_ENHANCE = { spin: 0.8, slam: 0.35, radius: 130, damage: 30, knockback: 360, duration: 10, cooldown: 18,
  trigger: 180, speed: 1.35, power: 1.5, armor: 0.4 } as const

export const LUI_REST = { spin: LUI_ENHANCE.spin, settle: LUI_ENHANCE.slam, heal: 50 } as const

// Piercing Charge: leans back gathering ink-wind into the spear for `windup` s, gallops at `speed` (for up to `dash` s)
// into a target `minRange`–`range` away, pierces it for `damage` (× Enhance power in the aura), lifts it on the
// spear for `lift` s, then swings and flings it `distance` px. Targets wider than him are only hit and knocked back.
export const LUI_CHARGE = { windup: 1, speed: 560, dash: 1.1, minRange: 90, range: 420, reach: 30, damage: 60,
  knockback: 260, lift: 0.55, swing: 0.3, distance: 280, cooldown: 9 } as const

// Carnage: gallop around an enemy group with the halberd overhead, cutting everyone near the rider on each beat.
export const LUI_CARNAGE = { duration: 3, cooldown: 18, groupRadius: 140, range: 220, orbit: 100, laps: 2.5,
  every: 0.25, damage: 20, radius: 110, knockback: 60, finishDamage: 50, finishRadius: 140, finishKnockback: 220,
  ghostEvery: 0.06, ghostLife: 0.3, trailLife: 0.42, finishLife: 0.6, spin: Math.PI * 12 } as const

export const LUI_BOW = {
  range: 500, enter: 180, exit: 140, spacing: 260, recover: 0.16,
  shot: { draw: 0.25, every: 0.9, damage: 26, knockback: 60, speed: 780 },
  rain: { charge: 1, flight: 0.6, radius: 130, waves: 6, every: 0.22, damage: 18, cooldown: 12 },
  ground: { charge: 0.85, flight: 0.12, radius: 125, damage: 50, knockback: 460, stun: 1, crater: 2, effect: 0.6, cooldown: 10 },
} as const

export interface LuiRainFx { x: number; y: number; time: number; released: boolean; seed: number; fromX: number; fromY: number; angle: number }
export interface LuiGroundFx { x: number; y: number; fromX: number; fromY: number; time: number }

// Normal attack: the halberd sweeps one full turn flat round him over `time` s, hitting every enemy within `reach` px
// of his body. Painted as a broad ink brushstroke with white streaks and trailing wind; its tail
// chases the head away, gone after `life` s. `width` is the trail's thickness at its fattest.
export const LUI_SWEEP = { time: 0.32, life: 0.75, reach: 60, width: 52 } as const

type Pose = 'ride' | 'raise' | 'slam' | 'couch' | 'hold' | 'sweep' | 'bow' | 'meditate' | 'riderless'

export const WHITE = '#f6f3ec', FAR = '#c4bdaf', MANE = '#ece7dc', SHADE = '#cfc8ba', GOLD = '#d9a93a', GOLD_DARK = '#8f6a1f'
export const ARMOR = '#2b2730', RED = '#b3242b', RED_DARK = '#7a1a1f', HAIR = '#1d191e', SKIN = '#eac09c', TACK = '#3b2a20'
// Drawn 10% smaller about the hooves so his crown and halberd fit inside the 48-unit sprite.
export const FIT = 0.9
// Where his raised hand holds the whirling halberd during Enhance (sprite units, before FIT).
const SPIN_HAND = [27.5, 0.5, 0] as const
// Piercing Charge: he leans back about the hip with the spear couched level; then holds it out in front (drawn live).
const LEAN = -0.14, HIP = [22, 20] as const, COUCH = [27, 17, 0.05 - LEAN] as const, HOLD_HAND = [28.5, 13, 0] as const
// Mid-sweep his hand pulls in to his chest and the halberd turns round it (drawn live by drawLuiSweepSpear).
const SWEEP_HAND = [26.5, 14.5, 0] as const
// Archery: the arrow lies on a line through ANCHOR (his cheek, where the draw hand ends at full draw). The bow hand
// reaches REACH units out along that line from it; at rest the string sits BRACE units behind the bow hand.
const SHOULDER = [24.5, 11] as const, ANCHOR = [24.5, 8] as const, REACH = 14, BRACE = 4
// Longbow limbs reach this far either side of the grip: taller than he sits in the saddle.
const BOW_LIMB = 21
// Arrow lengths (sprite units): an ordinary arrow, and Piercing Ground's ink arrow when fully charged.
export const LUI_ARROW = 17, LUI_INK_ARROW = 26
const REST_HAND = [27, 20, 1.25] as const
const BLADE = 16 // from the grip to the middle of the spear point, where the victim hangs
const toRender = (x: number, y: number) => [(x - 24) * FIT, (y - 44) * FIT] as const
export const LUI_BOW_ANCHOR = toRender(ANCHOR[0], ANCHOR[1])
// Where the archer's arms and bow sit in a sprite: mounted, or standing on foot (see luifeng-foot.ts). `fit` scales the
// sprite about the feet; `armor` shifts the pauldron from its mounted place.
export interface LuiBowRig { fit: number; shoulder: readonly [number, number]; anchor: readonly [number, number]; reach: number; limb: number; armor: readonly [number, number] }
const MOUNTED_RIG: LuiBowRig = { fit: FIT, shoulder: SHOULDER, anchor: ANCHOR, reach: REACH, limb: BOW_LIMB, armor: [0, 0] }
export const LUI_FOOT_BOW_RIG: LuiBowRig = { fit: 1, shoulder: [26.5, 19], anchor: [27.5, 14], reach: 12, limb: 19, armor: [2, 8.3] }
export const LUI_FOOT_BOW_ANCHOR = [LUI_FOOT_BOW_RIG.anchor[0] - 24, LUI_FOOT_BOW_RIG.anchor[1] - 44] as const
// The planted spear's 13-unit shaft and 12-unit point reach the ground beside his horse.
export const LUI_REST_TIP = toRender(REST_HAND[0] + Math.cos(REST_HAND[2]) * 25, REST_HAND[1] + Math.sin(REST_HAND[2]) * 25)

// The tip of a fully drawn arrow of `length` aimed at `angle`, where it leaves the bow.
export function luiBowTip(angle: number, length: number = LUI_ARROW, rig: LuiBowRig = MOUNTED_RIG) {
  const x = rig.anchor[0] + Math.cos(angle) * length, y = rig.anchor[1] + Math.sin(angle) * length
  return [(x - 24) * rig.fit, (y - 44) * rig.fit] as const
}

// The couched spear point in the fighter's space (feet at the origin, facing right, before scaling by size).
export const LUI_COUCH_TIP = (() => {
  const dx = COUCH[0] - HIP[0], dy = COUCH[1] - HIP[1], a = COUCH[2] + LEAN
  const gx = HIP[0] + dx * Math.cos(LEAN) - dy * Math.sin(LEAN), gy = HIP[1] + dx * Math.sin(LEAN) + dy * Math.cos(LEAN)
  const tip = 22 // couched halberd: 10 units of shaft plus its 12-unit spear point
  return toRender(gx + Math.cos(a) * tip, gy + Math.sin(a) * tip)
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
export function scales(c: C, x: number, y: number, w: number, h: number) {
  c.save()
  c.strokeStyle = 'rgba(217,169,58,.55)'; c.lineWidth = 0.4
  for (let row = 0; row * 1.6 < h; row++)
    for (let col = 0; col * 1.6 < w - 0.8; col++) {
      c.beginPath(); c.arc(x + col * 1.6 + (row % 2) * 0.8, y + row * 1.6, 0.8, 0, Math.PI); c.stroke()
    }
  c.restore()
}

// Black shaft with a gold butt spike, gold socket, leaf spear point, twin engraved crescents and a red tassel on a bead.
export function halberd(c: C, x: number, y: number, angle: number, back: number, front: number) {
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
  if (pose !== 'bow' && pose !== 'riderless') { c.beginPath(); c.moveTo(43.4, 19.5 + nod); c.quadraticCurveTo(35, 24, 27.5, 16.5); c.stroke() } // both hands are on the bow

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
  if (pose === 'riderless') return // his horse alone, coming back for him

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
  // by drawLuiSpin) or driving it into the ground. With the bow both arms are drawn live by drawLuiBow.
  if (pose === 'bow') { pauldron(c); return }
  const grip = pose === 'meditate' ? REST_HAND : pose === 'raise' ? SPIN_HAND : pose === 'hold' ? HOLD_HAND : pose === 'sweep' ? SWEEP_HAND : pose === 'couch' ? COUCH : pose === 'slam' ? [28, 19, 1.15] as const
    : ([[27, 15, -0.75], [21, 9, -2.75], [28, 15, 0.05], [27, 19, 2.2]] as const)[swing]
  if (pose === 'ride' && swing === 2) swoosh(c, 24, 13, 20, 12, -2.7, 0.05)
  if (pose === 'ride' && swing === 3) swoosh(c, 24, 15, 20, 12, -1.6, 2.2)
  c.strokeStyle = INK; c.lineWidth = 3.6
  line(c, 24.5, 11, grip[0], grip[1])
  c.strokeStyle = RED; c.lineWidth = 2.3
  line(c, 24.5, 11, grip[0], grip[1])
  pauldron(c)
  if (pose !== 'raise' && pose !== 'hold' && pose !== 'sweep') {
    halberd(c, grip[0], grip[1], grip[2], pose === 'slam' || pose === 'meditate' ? 6 : 14, pose === 'meditate' ? 13 : 10)
  }
  c.lineWidth = 0.6
  ellipse(c, 24.5 + (grip[0] - 24.5) * 0.75, 11 + (grip[1] - 11) * 0.75, 1.5, 1.3, GOLD)
  c.lineWidth = 1
  ellipse(c, grip[0], grip[1], 2.3, 2.1, SKIN)
}

export function pauldron(c: C) {
  c.strokeStyle = INK; c.lineWidth = 0.8
  poly(c, GOLD, 21.6, 9.6, 23.6, 8, 26.6, 8.4, 28.6, 10.2, 27.8, 12.6, 25, 13.2, 22.2, 12.2)
  c.strokeStyle = GOLD_DARK; c.lineWidth = 0.5
  line(c, 23, 10, 25.5, 9.4, 27.6, 10.6)
  line(c, 23.4, 11.6, 27, 12)
  c.strokeStyle = INK; c.lineWidth = 0.4
  ellipse(c, 27.2, 10.4, 0.5, 0.5, RED)
}

// A red sleeve through the given points.
export function sleeve(c: C, ...points: number[]) {
  c.strokeStyle = INK; c.lineWidth = 3.6
  line(c, ...points)
  c.strokeStyle = RED; c.lineWidth = 2.3
  line(c, ...points)
}

export function buildLuiFengSprite(color?: string, swing: Swing = 0, frame = CAVALRY_GALLOP_FRAMES, pose: Pose = 'ride') {
  // shortcut: pixel scale 4 keeps him sharp at size 2.3; raise it if he grows much bigger.
  return buildSprite((c) => general(c, swing, frame, pose), color, [18, 3, 8], false, 4)
}

export function buildLuiFengPoses(color?: string) {
  const still = (pose: Pose) => buildLuiFengSprite(color, 0, CAVALRY_GALLOP_FRAMES, pose)
  const carnage = Array.from({ length: CAVALRY_GALLOP_FRAMES }, (_, frame) => buildLuiFengSprite(color, 0, frame, 'raise'))
  const ghost = carnage.map((sprite) => {
    const canvas = document.createElement('canvas')
    canvas.width = sprite.width; canvas.height = sprite.height
    const c = canvas.getContext('2d')!
    c.drawImage(sprite, 0, 0)
    c.globalCompositeOperation = 'source-in'
    c.fillStyle = '#15151d'; c.fillRect(0, 0, canvas.width, canvas.height)
    c.globalCompositeOperation = 'source-atop'
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = canvas.width / 100
    for (let k = 0; k < 3; k++) {
      line(c, 0, canvas.height * (0.35 + k * 0.2), canvas.width, canvas.height * (0.29 + k * 0.2))
    }
    return canvas
  })
  return { raise: still('raise'), slam: still('slam'), horse: buildLuiFengSprite(undefined, 0, CAVALRY_GALLOP_FRAMES, 'riderless'), hold: still('hold'), meditate: still('meditate'),
    carnage, ghost,
    bow: Array.from({ length: CAVALRY_GALLOP_FRAMES + 1 }, (_, frame) => buildLuiFengSprite(color, 0, frame, 'bow')),
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

// Both arms and the longbow, drawn live over the bow pose so he can aim anywhere (fighter's space, sprite units).
// `draw` 0..1 pulls the string from rest back to his cheek. `after` is seconds since release (negative while an
// arrow is still nocked): the string snaps forward and quivers, and the draw hand flies back past his ear before
// reaching for the next arrow. `ink` 0..1 turns the nocked arrow into Piercing Ground's growing ink arrow.
export function drawLuiBow(c: C, angle: number, draw: number, after = -1, ink = 0, rig: LuiBowRig = MOUNTED_RIG) {
  const { anchor: ANCHOR, shoulder: SHOULDER, reach: REACH, limb: BOW_LIMB } = rig
  const ux = Math.cos(angle), uy = Math.sin(angle), released = after >= 0
  const d = released ? 0 : Math.max(0, Math.min(1, draw)), pull = BRACE + d * (REACH - BRACE)
  const bx = ANCHOR[0] + ux * REACH, by = ANCHOR[1] + uy * REACH // bow hand
  let hx = bx - ux * pull, hy = by - uy * pull // draw hand, on the string
  if (released) {
    const fly = Math.min(1, after / 0.05), reach = Math.max(0, Math.min(1, (after - 0.06) / 0.1)) ** 2
    const fx = ANCHOR[0] - ux * 3.5 * fly, fy = ANCHOR[1] - uy * 3.5 * fly - 1.2 * fly // follow-through
    hx = fx + (bx - ux * BRACE - fx) * reach; hy = fy + (by - uy * BRACE - fy) * reach
  }
  // The draw elbow swings out behind his head as the string comes back.
  const ex = hx - ux * 5.5 + (SHOULDER[0] - hx + ux * 5.5) * 0.35, ey = hy - uy * 5.5 + (SHOULDER[1] - hy + uy * 5.5) * 0.35 - 0.8
  const flex = 2.5 + d * 4 // the limb tips bend back towards him under the draw
  const string = released ? -BRACE + Math.sin(after * 95) * 1.6 * Math.max(0, 1 - after / 0.16) : -pull
  c.save()
  c.scale(rig.fit, rig.fit); c.translate(-24, -44)
  c.lineCap = c.lineJoin = 'round'
  sleeve(c, SHOULDER[0], SHOULDER[1], ex, ey, hx, hy)
  c.save()
  c.translate(bx, by); c.rotate(angle)
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.55
  line(c, -flex, -BOW_LIMB, string, 0, -flex, BOW_LIMB)
  if (!released) {
    if (ink > 0) {
      const length = LUI_ARROW + (LUI_INK_ARROW - LUI_ARROW) * ink
      c.save(); c.translate(-pull + length, 0); inkArrow(c, length); c.restore()
    } else {
      const tip = -pull + LUI_ARROW
      c.strokeStyle = INK; c.lineWidth = 1.1; line(c, -pull - 1, 0, tip - 4, 0)
      c.lineWidth = 0.5; poly(c, '#f5f4ef', tip, 0, tip - 5, -1.7, tip - 5, 1.7)
      poly(c, '#d8d6dc', -pull + 4, 0, -pull, -2, -pull + 1, 0, -pull, 2)
    }
  }
  for (const s of [-1, 1]) { // black lacquered limbs with a gold inlay and gold-capped recurved ears
    c.beginPath(); c.moveTo(0, 0)
    c.quadraticCurveTo(4.5 - d, s * BOW_LIMB * 0.55, -flex, s * BOW_LIMB)
    c.quadraticCurveTo(-flex - 0.6, s * (BOW_LIMB + 2), -flex + 2.2, s * (BOW_LIMB + 3.2))
    c.strokeStyle = INK; c.lineWidth = 3.2; c.stroke()
    c.strokeStyle = '#3a2f36'; c.lineWidth = 1.7; c.stroke()
    c.strokeStyle = GOLD; c.lineWidth = 0.45
    c.beginPath(); c.moveTo(1.2, s * 3); c.quadraticCurveTo(3.8 - d, s * BOW_LIMB * 0.55, -flex + 0.4, s * (BOW_LIMB - 2.5)); c.stroke()
    c.strokeStyle = INK; c.lineWidth = 0.5
    poly(c, GOLD, -flex - 0.3, s * (BOW_LIMB + 0.6), -flex + 2.4, s * (BOW_LIMB + 3.4), -flex + 1, s * (BOW_LIMB + 1.2))
  }
  c.strokeStyle = INK; c.lineWidth = 0.6
  box(c, -0.4, -2.8, 2.2, 5.6, 0.6, RED) // wrapped grip
  c.restore()
  sleeve(c, SHOULDER[0], SHOULDER[1], bx, by)
  c.save(); c.translate(rig.armor[0], rig.armor[1]); pauldron(c); c.restore()
  c.strokeStyle = INK; c.lineWidth = 0.8
  ellipse(c, bx, by, 2.1, 1.9, SKIN)
  ellipse(c, hx, hy, 1.8, 1.6, SKIN)
  c.restore()
}

// A heavy arrow of solid black ink, tip at the origin pointing along +x: brushy shaft, broad white-edged head and
// torn ink fletching, with loose wisps trailing off the tail.
export function inkArrow(c: C, length: number) {
  const w = length / LUI_INK_ARROW
  c.save()
  c.lineCap = c.lineJoin = 'round'
  c.strokeStyle = 'rgba(21,21,29,.2)'; c.lineWidth = 5 * w
  line(c, -length * 1.15, 0, -3 * w, 0)
  c.fillStyle = '#15151d'
  c.beginPath()
  c.moveTo(-length + w, -0.6 * w); c.quadraticCurveTo(-length * 0.5, -1.4 * w, -5 * w, -1.1 * w)
  c.lineTo(-5 * w, 1.1 * w); c.quadraticCurveTo(-length * 0.5, 1.2 * w, -length + w, 0.6 * w)
  c.closePath(); c.fill()
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-7 * w, -3.4 * w); c.lineTo(-5.2 * w, 0); c.lineTo(-7 * w, 3.4 * w); c.closePath(); c.fill()
  for (const s of [-1, 1]) {
    c.beginPath()
    c.moveTo(-length + 8 * w, s * 0.8 * w); c.lineTo(-length + 1.5 * w, s * 4 * w)
    c.lineTo(-length - 1.5 * w, s * 3.6 * w); c.lineTo(-length + 2.5 * w, s * 0.6 * w)
    c.closePath(); c.fill()
  }
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.4 * w
  line(c, -0.8 * w, -0.5 * w, -6.2 * w, -3 * w)
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.35 * w
  line(c, -length * 0.82, -0.4 * w, -length * 0.3, -0.5 * w)
  c.strokeStyle = 'rgba(21,21,29,.55)'; c.lineWidth = 0.5 * w
  for (const s of [-1, 0, 1]) {
    c.beginPath(); c.moveTo(-length, s * 2 * w)
    c.quadraticCurveTo(-length - 4 * w, s * 3 * w - w, -length - 8 * w, s * 4 * w + w); c.stroke()
  }
  c.restore()
}

export function drawLuiArrow(c: C, x: number, y: number, angle: number, size = 1) {
  c.save()
  c.translate(x, y); c.rotate(angle); c.scale(size, size)
  c.lineCap = 'round'
  c.strokeStyle = 'rgba(34,31,51,.22)'; c.lineWidth = 3
  c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(-30, -3, -43, 1); c.stroke()
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 0.7
  c.beginPath(); c.moveTo(-12, -1); c.quadraticCurveTo(-25, -4, -37, -1); c.stroke()
  c.strokeStyle = '#15151d'; c.lineWidth = 2.4; line(c, -20, 0, 0, 0)
  c.strokeStyle = '#fff'; c.lineWidth = 0.6; line(c, -17, -0.5, -3, -0.5)
  c.strokeStyle = INK; c.lineWidth = 0.8
  poly(c, '#fff', 0, 0, -6, -2.7, -4.5, 0, -6, 2.7)
  poly(c, '#d8d6dc', -16, 0, -22, -3, -20, 0, -22, 3)
  c.restore()
}

// Warning ink lies below bodies; the released volley and its individual impacts draw above them.
export function drawLuiRain(c: C, area: LuiRainFx, front: boolean) {
  const R = LUI_BOW.rain, end = R.flight + (R.waves - 1) * R.every, fade = Math.max(0, Math.min(1, (end + 0.4 - area.time) / 0.4))
  c.save()
  c.globalAlpha *= fade
  if (!front) {
    c.fillStyle = 'rgba(34,31,51,.07)'; c.strokeStyle = 'rgba(21,21,29,.8)'; c.lineWidth = 2
    c.beginPath(); c.arc(area.x, area.y, R.radius, 0, Math.PI * 2); c.fill(); c.stroke()
    const progress = area.released ? 1 : Math.max(0, Math.min(1, 1 + area.time / R.charge))
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2
    c.beginPath(); c.arc(area.x, area.y, R.radius - 4, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2); c.stroke()
    c.strokeStyle = 'rgba(34,31,51,.55)'; c.lineWidth = 1
    line(c, area.x - 7, area.y, area.x + 7, area.y); line(c, area.x, area.y - 7, area.x, area.y + 7)
  } else if (area.released) {
    if (area.time < 0.35) {
      const p = area.time / 0.35, travel = 320 * p
      c.save(); c.globalAlpha *= 1 - p
      drawLuiArrow(c, area.fromX + Math.cos(area.angle) * travel, area.fromY + Math.sin(area.angle) * travel, area.angle, 1.5)
      c.restore()
    }
    for (let wave = 0; wave < R.waves; wave++) {
      const age = area.time - R.flight - wave * R.every
      if (age < -0.35 || age > 0.4) continue
      for (let j = 0; j < 18; j++) {
        const k = j + wave * 19 + area.seed * 0.17, a = k * 2.39996
        const spread = Math.sqrt(((k * 0.618) % 1 + 1) % 1) * R.radius * 0.94
        const x = area.x + Math.cos(a) * spread, y = area.y + Math.sin(a) * spread, t = age - j * 0.004
        if (t >= -0.35 && t < 0) {
          const p = (t + 0.35) / 0.35
          drawLuiArrow(c, x - 24 * (1 - p), y - 230 * (1 - p * p), 1.47, 0.65 + j % 3 * 0.12)
        } else if (t >= 0 && t < 0.25) {
          c.save(); c.globalAlpha *= 1 - t / 0.25
          c.fillStyle = '#15151d'; c.beginPath(); c.ellipse(x, y, 3 + t * 9, 1.5, a, 0, Math.PI * 2); c.fill()
          c.strokeStyle = '#fff'; c.lineWidth = 0.8; line(c, x - 2, y - 1, x + 2, y + 1)
          c.restore()
        }
      }
    }
  }
  c.restore()
}

// Piercing Ground: the charged ink arrow leaves the bow, swells as it drives down and stays planted head-first in
// the ground, quivering, while the shockwave spreads beneath it.
export function drawLuiGround(c: C, shot: LuiGroundFx, front: boolean) {
  const G = LUI_BOW.ground, angle = Math.atan2(shot.y - shot.fromY, shot.x - shot.fromX)
  const length = LUI_INK_ARROW * FIT * LUI_FENG.size // as it left the bow, in world px
  if (shot.time < G.flight) {
    if (front) {
      const p = shot.time / G.flight
      c.save()
      c.translate(shot.fromX + (shot.x - shot.fromX) * p, shot.fromY + (shot.y - shot.fromY) * p); c.rotate(angle)
      inkArrow(c, length * (1 + 0.5 * p))
      c.restore()
    }
    return
  }
  const p = (shot.time - G.flight) / G.effect
  if (p >= 1) return
  if (front) {
    const t = shot.time - G.flight, planted = length * 1.5
    c.save()
    c.globalAlpha *= Math.min(1, (1 - p) / 0.4)
    c.translate(shot.x, shot.y); c.rotate(angle + Math.sin(t * 70) * 0.07 * (1 - p) ** 2)
    c.beginPath(); c.rect(-planted * 2, -planted, planted * 2, planted * 2); c.clip() // the head is under the ground
    c.translate(planted * 0.16, 0)
    inkArrow(c, planted)
    c.restore()
    return
  }
  c.save()
  c.translate(shot.x, shot.y); c.scale(1, 0.42)
  c.globalAlpha *= 1 - p
  const radius = Math.max(1, G.radius * (1 - (1 - p) ** 3))
  inkBrushArc(c, radius, 18 * (1 - p), 0, Math.PI * 2)
  for (let k = 0; k < 7; k++) {
    const a = k * 2.39996, reach = Math.min(radius, 35 + k * 4)
    c.strokeStyle = '#15151d'; c.lineWidth = 2 * (1 - p) + 0.4
    line(c, Math.cos(a) * 5, Math.sin(a) * 5, Math.cos(a + 0.12) * reach * 0.55, Math.sin(a + 0.12) * reach * 0.55,
      Math.cos(a) * reach, Math.sin(a) * reach)
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 0.6; c.stroke()
  }
  c.restore()
}

// The halberd whirling flat above his head, `turn` radians round, with its blur disc. Drawn over the raise pose in the
// fighter's space (origin at his feet, sprite units).
export function drawLuiSpin(c: C, turn: number) {
  c.save()
  c.scale(FIT, FIT); c.translate(SPIN_HAND[0] - 24, SPIN_HAND[1] - 44)
  c.lineJoin = c.lineCap = 'round'
  c.save()
  c.scale(1, 0.28) // seen from the side, the flat spin squashes into an ellipse
  inkBrushArc(c, 22, 4, turn - 2.8, turn)
  c.globalAlpha *= 0.45
  inkBrushArc(c, 25, 1.8, turn - 3.5, turn - 0.5)
  c.restore()
  c.save()
  c.scale(1, 0.28)
  halberd(c, 0, 0, turn, 15, 5)
  c.restore()
  c.strokeStyle = INK; c.lineWidth = 1
  ellipse(c, 0, 0, 2.3, 2.1, SKIN)
  c.restore()
}

// Enhance aura: drifting ink wash and loose black-and-white brushstrokes circling his horse and halberd.
// Drawn twice: the far half (front = false) before his sprite, the near half after.
export function drawLuiAura(c: C, tick: number, fade: number, seed: number, front: boolean) {
  if (fade <= 0) return
  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.055 + seed), spin = tick * 0.035 + seed
  c.save()
  c.globalAlpha *= fade
  c.lineCap = 'round'
  if (!front) {
    const glow = c.createRadialGradient(0, -20, 4, 0, -20, 34)
    glow.addColorStop(0, 'rgba(34,31,51,.14)'); glow.addColorStop(1, 'rgba(34,31,51,0)')
    c.fillStyle = glow
    c.beginPath(); c.ellipse(0, -20, 34, 30, 0, 0, Math.PI * 2); c.fill()
    c.save()
    c.scale(1, 0.28)
    c.globalAlpha *= 0.65
    inkBrushArc(c, 27 + pulse * 2, 2.8, spin - 2.8, spin)
    inkBrushArc(c, 29 + pulse * 2, 1.6, spin + 0.7, spin + 2.1)
    c.restore()
  }
  c.translate(0, -22); c.rotate(-0.18)
  // Clip the actual trails at the depth boundary so they pass cleanly behind and in front of him.
  c.beginPath(); c.rect(-52, front ? 0 : -20, 104, 20); c.clip()
  c.scale(1, 0.28)
  c.globalAlpha *= 0.8
  for (let k = 0; k < 3; k++) {
    const a = spin + k * 2.39996, drift = Math.sin(tick * 0.025 + seed + k)
    inkBrushArc(c, 30 + k * 2 + drift * 1.5, 3.5 + k * 0.6, a - 1.8 - drift * 0.3, a)
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

// One tapered brushstroke: uneven ink pressure, a pale edge and broken dry-brush hairs. Shared by slash and buff.
export function inkBrushArc(c: C, r: number, width: number, from: number, to: number) {
  if (to - from < 0.02) return
  const n = 32, a = (t: number) => from + (to - from) * t
  const pressure = (t: number) => Math.sin(Math.PI * t) ** 0.45 * (0.75 + 0.25 * t)
    * (0.84 + 0.1 * Math.sin(a(t) * 7) + 0.06 * Math.sin(a(t) * 17))
  const edge = (t: number) => r + Math.sin(a(t) * 5 + 0.7) * width * 0.07 * Math.sin(Math.PI * t)
  const crescent = (scale: number) => {
    c.beginPath()
    for (let i = 0; i <= n; i++) {
      const t = i / n, radius = edge(t)
      c.lineTo(Math.cos(a(t)) * radius, Math.sin(a(t)) * radius)
    }
    for (let i = n; i >= 0; i--) {
      const t = i / n, radius = edge(t) - width * scale * pressure(t)
      c.lineTo(Math.cos(a(t)) * radius, Math.sin(a(t)) * radius)
    }
    c.closePath()
    c.fill()
  }
  c.save()
  c.fillStyle = 'rgba(90,88,101,.16)'
  crescent(1.2)
  c.fillStyle = '#15151d'
  crescent(1)
  c.fillStyle = 'rgba(86,82,94,.5)'
  crescent(0.6)
  c.fillStyle = 'rgba(255,255,255,.85)'
  crescent(0.12)
  c.lineWidth = Math.max(0.25, width * 0.018)
  c.lineCap = 'round'
  for (let strand = 0; strand < 3; strand++) {
    c.strokeStyle = strand === 1 ? 'rgba(21,21,29,.6)' : 'rgba(255,255,255,.5)'
    c.beginPath()
    for (let i = 2; i < n - 1; i++) {
      const t = i / n, radius = edge(t) - width * (0.3 + strand * 0.2) * pressure(t)
      const x = Math.cos(a(t)) * radius, y = Math.sin(a(t)) * radius
      if (i === 2 || Math.sin(a(t) * 13 + strand * 4) > 0.65) c.moveTo(x, y)
      else c.lineTo(x, y)
    }
    c.stroke()
  }
  c.restore()
}

// One normal attack's sweep round the fighter at ground point (x, y), `time` s after the swing began. `radius` is the
// hit reach; `facing` mirrors it so the trail turns the same way as his halberd.
export function drawLuiSweep(c: C, x: number, y: number, radius: number, facing: number, time: number) {
  const fade = Math.max(0, Math.min(1, (LUI_SWEEP.life - time) / 0.2))
  const reveal = time / LUI_SWEEP.time, head = Math.min(1, reveal), tail = Math.min(1, Math.max(0, reveal - 0.85))
  if (fade <= 0 || reveal <= 0) return
  c.save()
  c.globalAlpha = fade
  c.translate(x, y - 18); c.scale(facing, 0.42) // lies on the ground's perspective at body height
  inkBrushArc(c, radius + 10, LUI_SWEEP.width, tail * Math.PI * 2, head * Math.PI * 2)
  c.globalAlpha *= 0.4
  for (let k = 0; k < 2; k++) {
    const wind = reveal - 0.07 * (k + 1)
    const windHead = Math.min(1, wind), windTail = Math.min(1, Math.max(0, wind - 0.7))
    inkBrushArc(c, radius + 21 + k * 12, 7 - k * 2, windTail * Math.PI * 2, windHead * Math.PI * 2)
  }
  c.restore()
}

// Carnage's cuts stay where they were thrown, so their trailing wind draws the path of his gallop.
export function drawLuiCarnageSlash(c: C, x: number, y: number, radius: number, facing: number, time: number, finish: boolean) {
  const life = finish ? LUI_CARNAGE.finishLife : LUI_CARNAGE.trailLife, p = time / life
  if (p < 0 || p >= 1) return
  const head = Math.min(1, p / 0.55), tail = Math.max(0, (p - 0.35) / 0.65)
  c.save()
  c.translate(x, y - 18); c.scale(facing, 0.42)
  c.globalAlpha *= Math.sqrt(1 - p) * (finish ? 1 : 0.72)
  inkBrushArc(c, radius, finish ? 44 : 24, tail * Math.PI * 2, head * Math.PI * 2)
  c.globalAlpha *= 0.45
  for (let k = 0; k < 2; k++) {
    inkBrushArc(c, radius + 14 + k * 12, 6 - k * 2,
      Math.max(0, tail - 0.08) * Math.PI * 2, (head - 0.08 * (k + 1)) * Math.PI * 2)
  }
  c.restore()
}

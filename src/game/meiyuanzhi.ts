import { box, buildSprite, ellipse, eye, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f3dcc8', HAIR = '#2b2436', ROBE = '#8e8b9c', VEST = '#4a3b5c', SASH = '#8a3a4a'
const TALISMAN = '#9b5de5'
const FOX = '#8e4fd6', FOX_TIP = '#eadcff', FOX_DARK = '#2a2238', FOX_DARK_FUR = '#6a3aa8', MARK = '#c8413c', HORN = '#3a2a3e'

// Stable pseudo-random in [0, 1) for effect placement: a given index lands in the same spot every frame.
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const MEI_YUANZHI = {
  name: 'Mei Yuanzhi',
  blurb: 'A calm cultivator who throws purple talisman bombs that burst on impact',
  radius: 12, hp: 580, speed: 115, damage: 20, range: 280, detection: 560,
  cooldown: 0.7, knockback: 80, spacing: 46, size: 1.3, color: VEST,
} as const

// Talismans fly straight and burst on the first enemy, or where the target stood.
// `burst` is visual only: how long the flash, ink splash and ground seal linger.
export const MEI_TALISMAN = { speed: 380, radius: 40, color: '#a35ee0', burst: 0.7 } as const

// Flying Fox Talisman: with its own cooldown ready, each throw has `chance` to be a fox head (`size` × scale).
// It explodes on the first enemy, or where the target stood: every enemy within `radius` px is
// knocked back, stunned and set burning (purple flames) for `burn` seconds. The blast shows for `blast` s.
export const MEI_FOX = { chance: 0.35, cooldown: 3, damage: 35, knockback: 180, stun: 1.3, burn: 2.5, radius: 90, size: 2.2, blast: 0.75 } as const
export const MEI_FLAME = ['#6b3fa0', '#a35ee0', '#e6d4ff']

// Pressure: each hit adds 1 to a melee or ranged count that drains `decay` per second; `hits` triggers a skill.
// A hit counts as melee when the attacker stands within `closeReach` px of touching him.
export const MEI_PRESSURE = { hits: 3, decay: 1, closeReach: 40 } as const
// Escape: backflip for `flip` s to `height` px, dropping a stun bomb at `bomb` s; vanish at the top for
// `vanish` s, then reappear `blink` × range from the target, as far from other enemies as possible. Smoke lasts `smoke` s.
export const MEI_ESCAPE = { flip: 0.35, height: 56, bomb: 0.18, radius: 75, stun: 1.6, vanish: 0.35, blink: 0.8, smoke: 1, cooldown: 4 } as const
// Shield: absorb every hit for `time` s, then throw it back for `returnRate` × the absorbed damage.
export const MEI_SHIELD = { time: 2, returnRate: 1.5, growth: 0.3, maxGrowth: 50, cooldown: 5 } as const
// Talisman Barrage: with its own cooldown ready, each attack has `chance` to start a barrage of `count`
// bomb talismans, one every `interval` s. Each appears on an arc `ring` px around his upper body, hovers for
// `hover` s, then flies at a point within `scatter` px of the target.
export const MEI_BARRAGE = { chance: 0.25, cooldown: 6, count: 16, interval: 0.08, ring: 26, hover: 0.4, scatter: 50 } as const
export const MEI_AURA = ['#a35ee0', '#e6d4ff']
// Talisman Mine: with its own cooldown ready, each throw has `chance` to stick a bomb talisman on the ground
// `place` of the way to the target instead (at most `max` per Mei, each lasting `life` s). It arms after `arm` s.
// An enemy stepping within `trigger` px sets it off: every grounded enemy within `radius` px takes `damage`
// and is sent flying away from it (the T-Rex throw arc), crashing down dizzy.
export const MEI_MINE = { chance: 0.3, cooldown: 4, place: 0.45, max: 4, life: 25, arm: 0.5, trigger: 10, radius: 60, damage: 28 } as const
// Meditation (no enemy around, hurt): heal `heal` HP per second.
export const MEI_REST = { heal: 50 } as const
// Nine-Tailed Fox: once, at `health` × max HP, he rises immune to `height` px over `rise` s, hangs for `hover` s,
// slams down in `slam` s and wakes in fox form. The landing hits every enemy within `radius` px for `damage`,
// knockback and a `stun`. In fox form his melee pressure no longer makes him flee.
export const MEI_TRANSFORM = { health: 0.75, rise: 0.8, hover: 0.35, slam: 0.15, height: 80, radius: 110, damage: 45, knockback: 260, stun: 0.8 } as const
// Fox claw: in fox form, an enemy within `reach` px of touching him is clawed instead of getting a talisman.
export const MEI_CLAW = { reach: 30, damage: 32, knockback: 150, show: 0.3 } as const
// Fox Spirits: once in fox form, at `health` × max HP he summons `count` nine-tailed foxes beside him.
export const MEI_SPIRITS = { health: 0.5, count: 3 } as const
// Star Dash (once his spirits are out): with its own cooldown ready, each attack has `chance` to dash in, then
// trace the five strokes of a star `radius` px around the target (squashed by `squash` to lie on the ground),
// each of the `strokes` dashes taking `dash` s, immune throughout. From the last point he throws a talisman
// into the centre; after `flight` s it explodes: every enemy within `blast` px takes `damage`, knockback,
// a `stun` and a purple `burn`.
export const MEI_STAR = { chance: 0.3, cooldown: 8, radius: 90, squash: 0.65, strokes: 6, dash: 0.08, flight: 0.35,
  blast: 150, damage: 70, knockback: 300, stun: 1.2, burn: 2.5 } as const

// The j-th point of the star around (x, y); point 0 faces where the dash started and the points are
// visited 144° apart, which draws a five-pointed star.
export function starVertex(fromX: number, fromY: number, x: number, y: number, j: number) {
  const angle = Math.atan2(fromY - y, fromX - x) + j * Math.PI * 4 / 5
  return { x: x + Math.cos(angle) * MEI_STAR.radius, y: y + Math.sin(angle) * MEI_STAR.radius * MEI_STAR.squash }
}

// Where the dash is `elapsed` s in: first from his start to point 0, then point to point round the star.
export function starDashAt(fromX: number, fromY: number, x: number, y: number, elapsed: number) {
  const s = Math.min(MEI_STAR.strokes, Math.max(0, elapsed) / MEI_STAR.dash)
  const j = Math.min(MEI_STAR.strokes - 1, Math.floor(s)), t = s - j
  const a = j === 0 ? { x: fromX, y: fromY } : starVertex(fromX, fromY, x, y, j - 1)
  const b = starVertex(fromX, fromY, x, y, j)
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, facing: b.x > a.x ? 1 : -1 }
}
export const MEI_SPIRIT = {
  name: 'Fox Spirit', blurb: 'A purple nine-tailed fox summoned by Mei Yuanzhi. Claws his enemies',
  color: FOX, radius: 11, hp: 160, speed: 170, damage: 12, range: 4, cooldown: 0.55, knockback: 40,
  spacing: 34, size: 1.4, scare: 0,
} as const

type MeiPose = 'ready' | 'meditate' | 'throwFront' | 'throwBack'
// Where each hand releases a talisman, in px at size 1: [front (right) hand, back (left) hand].
// Eyeballed against the throw poses below.
export const MEI_HANDS = [{ forward: 20, height: 18 }, { forward: 16, height: 26 }] as const

// Purple claw tips on a hand at (x, y), pointing along `angle`.
function claws(c: C, x: number, y: number, angle: number) {
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.lineWidth = 0.7
  for (const k of [-1.6, 0, 1.6]) poly(c, FOX, 1.5, k - 0.5, 5.5, k * 1.3, 1.5, k + 0.6)
  c.restore()
}

// The far (left) arm: at his side holding a talisman, or swung up and forward after throwing.
// In fox form the arm is bare and the hand ends in purple claws.
function backArm(c: C, pose: MeiPose, fox: boolean) {
  c.save()
  c.lineWidth = 1.6
  if (pose === 'throwBack') {
    poly(c, fox ? SKIN : ROBE, 17, 21, 22, 19, 38, 14, 39, 19, 21, 26)
    if (!fox) box(c, 35, 13.5, 5, 5, 1.5, '#3a3242')
    ellipse(c, 41, 16, 2.2, 2.2, SKIN)
    if (fox) claws(c, 42, 16, -0.2)
  } else {
    poly(c, fox ? SKIN : ROBE, 17, 21, 12, 26, 13, 32, 18, 30)
    if (!fox) {
      box(c, 11, 28.5, 5, 4.5, 1.5, '#3a3242')
      drawTalisman(c, 11, 44, 0.2) // drawn 10 px up, so it sits just above the hand
    }
    ellipse(c, 12.5, 33, 2.2, 2.2, SKIN)
    if (fox) claws(c, 12.5, 34, 1.7)
  }
  c.restore()
}

// Calm: grey layered robe, purple vest, red sash. Fox form: horns, wild hair, a bare marked chest,
// flowing dark trousers with a purple hem and clawed hands (the nine tails are drawn live behind him).
function mei(c: C, pose: MeiPose, step?: number, fox = false) {
  // Seated, everything drops 7 px (the team band too, since buildSprite draws it afterwards) onto crossed legs.
  const seated = pose === 'meditate'
  if (seated) c.translate(0, 7)
  if (fox) poly(c, HAIR, 17, 12, 10, 40, 15, 37, 18, 42, 22, 22, 30, 18, 33, 12)
  else poly(c, HAIR, 17, 12, 15, 30, 19, 34, 22, 20, 30, 18, 33, 12)
  backArm(c, pose, fox) // behind the robe and head
  if (fox) {
    if (seated) ellipse(c, 24, 33, 14, 4.5, FOX_DARK)
    else {
      poly(c, FOX_DARK, 15, 30, 33, 30, 37, 43, 11, 43)
      poly(c, FOX, 12, 39.5, 36, 39.5, 37, 43, 11, 43)
    }
    poly(c, SKIN, 16, 20, 32, 20, 32, 31, 16, 31)
    c.save()
    c.strokeStyle = MARK
    c.lineWidth = 1
    line(c, 19, 22, 22, 26, 20, 29)
    line(c, 29, 22, 27, 25.5)
    line(c, 24, 21, 24, 24)
    c.restore()
  } else if (seated) {
    ellipse(c, 24, 33, 14, 4.5, ROBE)
    poly(c, ROBE, 15, 20, 33, 20, 35, 32, 13, 32)
    poly(c, '#cfcad9', 21, 21, 27, 21, 28, 32, 20, 32)
  } else {
    poly(c, ROBE, 15, 20, 33, 20, 37, 43, 11, 43)
    poly(c, '#cfcad9', 21, 21, 27, 21, 29, 43, 19, 43)
  }
  if (!fox) {
    poly(c, VEST, 15, 20, 22, 20, 24, 30, 16, 30)
    poly(c, VEST, 33, 20, 26, 20, 24, 30, 32, 30)
  }
  box(c, 15, 29, 18, 3.5, 1, fox ? FOX : SASH)
  c.save()
  c.lineWidth = 1
  line(c, 24, 32.5, 24, 38)
  ellipse(c, 24, 39, 1.3, 1.6, '#f1eee6')
  c.strokeStyle = fox ? '#5b3f86' : '#6c6a7a'
  if (!seated) {
    line(c, 14, 36, 16, 42)
    line(c, 34, 36, 32, 42)
  }
  c.restore()
  if (!seated) { // shoes (bare feet as the fox) shuffle from under the robe
    const feet = fox ? SKIN : '#3a3242'
    leg(c, step, 20, 30, () => box(c, 16, 41.5, 7, 3, 1.4, feet), 0.3, 1)
    leg(c, opposite(step), 29, 30, () => box(c, 26, 41.5, 8, 3, 1.4, feet), 0.3, 1)
  }

  ellipse(c, 25, 13, 7.5, 7.5, SKIN)
  if (fox) {
    poly(c, HORN, 20.5, 7.5, 17, 1.5, 15.5, 3, 18.5, 9)
    poly(c, HORN, 28, 6, 30.5, 0.8, 32.5, 2.5, 30.5, 7.5)
  }
  poly(c, HAIR, 17.5, 13, 18, 7, 24, 4.5, 31, 6, 33, 11, 28, 8.5, 25, 11, 22, 8.5)
  if (!fox) ellipse(c, 23, 4, 3, 2.4, HAIR)
  c.save()
  c.lineWidth = 1
  c.strokeStyle = '#5a4d6c'
  line(c, 20, 7, 24, 5.5)
  c.strokeStyle = INK
  line(c, 27.5, 17.5, 30, 17.3)
  if (seated) line(c, 27.2, 13.3, 30.8, 13.3) // eyes closed in meditation
  if (fox) {
    c.strokeStyle = MARK
    line(c, 31.5, 14.5, 33, 16) // red mark under the eye
  }
  c.restore()
  if (!seated) eye(c, 29, 13, 2.2, 1.1)

  // The near (right) arm: holding a talisman in front, or flung straight forward after throwing (or clawing).
  c.save()
  c.lineWidth = 1.6
  if (pose === 'throwFront') {
    poly(c, fox ? SKIN : ROBE, 29, 21, 35, 22, 42, 21, 42, 26, 33, 28)
    if (!fox) box(c, 39, 20.5, 5, 5, 1.5, '#3a3242')
    ellipse(c, 45, 23, 2.2, 2.2, SKIN)
    if (fox) claws(c, 46, 23, 0)
    c.restore()
    return
  }
  poly(c, fox ? SKIN : ROBE, 29, 21, 35, 24, 34, 30, 28, 29)
  if (!fox) box(c, 30, 25, 5, 5, 1.5, '#3a3242')
  c.restore()
  if (!fox) drawTalisman(c, 34, 34, -0.15) // drawn 10 px up, so it sits just above the hand
  ellipse(c, 33, 28, 2.2, 2.2, SKIN)
  if (fox) claws(c, 33, 29, 1.2)
}

export function buildMeiSprite(color?: string, pose: MeiPose = 'ready', step?: number, fox = false) {
  return buildSprite((c) => mei(c, pose, step, fox), color, [18, 7, 14])
}

// One bushy fox tail growing along `angle` from (0, 0). Its spine bends segment by segment with a wave
// that starts at the root and reaches the tip later, so the tip lags, overshoots and curls like a real tail.
// Thin root, thick fluffy middle, pointed pale tip.
function foxTail(c: C, length: number, angle: number, time: number, swing: number) {
  const n = 8, seg = length / n, spine = [{ x: 0, y: 0, a: angle }]
  let a = angle, x = 0, y = 0
  for (let i = 1; i <= n; i++) {
    a += Math.sin(time - i * 0.6) * swing * i / n
    x += Math.cos(a) * seg
    y += Math.sin(a) * seg
    spine.push({ x, y, a })
  }
  const width = (u: number) => Math.max(0.9, length * 0.17 * Math.sin(Math.PI * u ** 0.75))
  const side = (sign: number) => spine.map((p, i) => {
    const w = width(i / n) * sign
    return [p.x - Math.sin(p.a) * w, p.y + Math.cos(p.a) * w] as const
  })
  const outline = [...side(1), ...side(-1).reverse()]
  c.beginPath() // a smooth curve through the midpoints of the outline
  c.moveTo(outline[0][0], outline[0][1])
  for (let i = 1; i < outline.length - 1; i++) {
    const [px, py] = outline[i], [nx, ny] = outline[i + 1]
    c.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2)
  }
  c.closePath()
  const fur = c.createLinearGradient(0, 0, x, y)
  fur.addColorStop(0, FOX_DARK_FUR)
  fur.addColorStop(0.35, FOX)
  fur.addColorStop(0.72, FOX)
  fur.addColorStop(0.84, FOX_TIP)
  c.fillStyle = fur
  c.fill()
  c.stroke()
}

// Nine fox tails fanning out from (x, y) in sprite-local units (feet at 0,0, facing right), drawn before
// the sprite. Idle, they fan high and sway slowly; on the move (`motion` 0 → 1) they sweep back behind
// the body and swish faster. Each tail moves out of step with its neighbours.
export function drawFoxTails(c: C, tick: number, seed: number, x: number, y: number, length: number, motion: number) {
  const time = tick * (0.07 + motion * 0.09)
  const centre = Math.PI * (1.22 - motion * 0.12) + Math.sin(tick * 0.03 + seed) * 0.05
  const spread = Math.PI * (0.58 - motion * 0.28)
  c.save()
  c.translate(x, y)
  c.strokeStyle = INK
  c.lineWidth = 0.8
  for (let k = 0; k < 9; k++) {
    const angle = centre + (k / 8 - 0.5) * spread
    foxTail(c, length * (0.88 + (k % 3) * 0.07), angle, time + k * 0.9 + seed, 0.16 + motion * 0.08)
  }
  c.restore()
}

// Three purple claw streaks raked across (x, y); progress 0 → 1 fades them.
export function drawFoxClaw(c: C, x: number, y: number, facing: number, progress: number) {
  c.save()
  c.translate(x, y)
  c.scale(facing, 1)
  c.globalAlpha = 1 - progress
  c.lineCap = 'round'
  for (let k = -1; k <= 1; k++) {
    for (const [width, color] of [[5, FOX], [1.6, FOX_TIP]] as const) {
      c.strokeStyle = color
      c.lineWidth = width
      c.beginPath()
      c.moveTo(-11 + k * 6, -15)
      c.quadraticCurveTo(5 + k * 6, -4, -4 + k * 6, 13)
      c.stroke()
    }
  }
  c.fillStyle = FOX_TIP
  for (let k = 0; k < 5; k++) {
    const a = hash(k) * Math.PI * 2
    c.beginPath()
    c.arc(Math.cos(a) * (10 + hash(k + 5) * 8), Math.sin(a) * 12, 1, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// A summoned purple nine-tailed fox spirit.
function foxSpirit(c: C, step?: number) { // its nine tails are drawn live behind the sprite
  const paw = (s: number | undefined, x: number, fill: string) => leg(c, s, x, 32, () => {
    c.lineWidth = 3.6; line(c, x, 32, x, 42.5)
    c.strokeStyle = fill; c.lineWidth = 2; line(c, x, 32, x, 42.5)
  }, 0.35, 1.2)
  // Diagonal pairs step together, as for the dragon.
  paw(opposite(step), 19, FOX_DARK_FUR)
  paw(step, 32, FOX_DARK_FUR)
  c.lineWidth = 1.3
  ellipse(c, 24, 30, 11, 6, FOX)
  paw(step, 16, FOX)
  paw(opposite(step), 29, FOX)
  c.lineWidth = 1.3
  poly(c, FOX, 31, 20, 32.5, 12, 36, 18)
  poly(c, FOX, 36, 18, 39.5, 11.5, 40.5, 19.5)
  ellipse(c, 36, 23, 6, 5.5, FOX)
  poly(c, FOX, 39, 20.5, 46, 25, 39.5, 27.5)
  poly(c, FOX_TIP, 31.5, 24, 37, 25.5, 41, 27.5, 35, 29.5)
  c.lineWidth = 1
  line(c, 36.5, 21.5, 39.5, 22.5) // slanted eye
  c.fillStyle = INK
  c.beginPath()
  c.arc(45.6, 25, 0.9, 0, Math.PI * 2)
  c.fill()
}

export function buildFoxSpiritSprite(color?: string, step?: number) {
  return buildSprite((c) => foxSpirit(c, step), color, [30, 26, 5])
}

export function drawTalisman(c: C, x: number, y: number, angle: number, glow = 0) {
  c.save()
  c.translate(x, y - 10)
  c.rotate(angle)
  if (glow > 0) {
    c.fillStyle = 'rgba(163,94,224,.35)'
    c.beginPath()
    c.arc(0, 0, 7 + glow * 2, 0, Math.PI * 2)
    c.fill()
  }
  c.strokeStyle = INK
  c.lineWidth = 1
  box(c, -2.8, -4.5, 5.6, 9, 0.6, TALISMAN)
  c.strokeStyle = '#f2e6ff'
  c.lineWidth = 0.8
  line(c, 0, -3.2, 0, 3.4)
  line(c, -1.5, -1.6, 1.5, -1.6)
  line(c, -1.5, 1, 1.2, 0.2)
  c.restore()
}

// A talisman in flight: spinning paper with an ink-brush trail and shed embers behind it.
// `heading` is the flight angle; `power` is the shield's returned damage, which widens the glow.
export function drawTalismanShot(c: C, x: number, y: number, heading: number, tick: number, power: number) {
  const dx = Math.cos(heading), dy = Math.sin(heading), glow = 1 + Math.min(3, power / 40)
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = MEI_AURA[0]
  for (let k = 0; k < 3; k++) {
    c.globalAlpha = 0.2 - k * 0.05
    c.lineWidth = 6 - k * 1.6
    line(c, x - dx * (10 + k * 6), y - 10 - dy * (10 + k * 6), x - dx * 4, y - 10 - dy * 4)
  }
  c.globalAlpha = 0.25
  drawTalisman(c, x - dx * 12, y - dy * 12, heading + 0.4, glow * 0.5)
  c.globalAlpha = 0.12
  drawTalisman(c, x - dx * 24, y - dy * 24, heading + 0.8, glow * 0.3)
  c.globalAlpha = 1
  c.fillStyle = FOX_TIP
  for (let k = 0; k < 3; k++) {
    const back = 8 + hash((tick | 0) + k * 7) * 16, off = (hash((tick | 0) + k * 13) - 0.5) * 7
    c.beginPath()
    c.arc(x - dx * back - dy * off, y - 10 - dy * back + dx * off, 1 + hash(k) * 0.6, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
  drawTalisman(c, x, y, heading + Math.sin(tick * 0.4) * 0.25, glow)
}

// A barrage talisman waiting on the arc: a pulsing halo marks it as conjured before it flies.
export function drawTalismanHover(c: C, x: number, y: number, tick: number) {
  c.save()
  c.globalAlpha = 0.25 + Math.sin(tick * 0.2) * 0.12
  c.strokeStyle = FOX_TIP
  c.lineWidth = 1
  c.beginPath()
  c.arc(x, y - 10, MEI_BARRAGE.ring * 0.55, 0, Math.PI * 2)
  c.stroke()
  c.globalAlpha = 0.3
  c.fillStyle = MEI_AURA[0]
  c.beginPath()
  c.arc(x, y - 10, 4, 0, Math.PI * 2)
  c.fill()
  c.globalAlpha = 0.4
  c.strokeStyle = FOX_TIP
  c.lineWidth = 1
  c.beginPath()
  c.arc(x, y - 10, MEI_BARRAGE.ring * 0.75, tick * 0.12, tick * 0.12 + 1.1)
  c.stroke()
  c.restore()
  drawTalisman(c, x, y, Math.PI / 2 + tick * 0.06, 1)
}

// A fox talisman in flight: flame wisps trail the paper head.
export function drawFoxShot(c: C, x: number, y: number, heading: number, tick: number) {
  const dx = Math.cos(heading), dy = Math.sin(heading)
  c.save()
  for (let k = 3; k >= 1; k--) {
    c.globalAlpha = 0.2
    c.fillStyle = k === 1 ? FOX_TIP : FOX
    c.beginPath()
    c.arc(x - dx * k * 9, y - 10 - dy * k * 9 + Math.sin(tick * 0.3 + k) * 2, 8 - k * 1.8, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
  drawFoxTalisman(c, x, y, tick)
}

// A bomb talisman's burst: a white core, an irregular ink splash, tumbling paper scraps and a
// rune seal left on the ground. `progress` runs 0 → 1 over MEI_TALISMAN.burst.
export function drawTalismanBurst(c: C, x: number, y: number, radius: number, progress: number, tick: number) {
  const p = Math.min(1, Math.max(0, progress)), grow = 0.35 + p * 0.65
  c.save()
  // The seal stays under the splash.
  c.globalAlpha = (1 - p) * 0.7
  c.strokeStyle = FOX
  c.lineWidth = 1.2
  c.beginPath()
  c.ellipse(x, y, radius * 0.55, radius * 0.2, 0, 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = FOX_TIP
  c.lineWidth = 0.8
  for (let k = 0; k < 5; k++) {
    const a = k * Math.PI * 2 / 5 + tick * 0.02
    line(c, x + Math.cos(a) * radius * 0.32, y + Math.sin(a) * radius * 0.12,
      x + Math.cos(a) * radius * 0.5, y + Math.sin(a) * radius * 0.18)
  }
  // Ink splash: an eight-lobed blot that swells and fades.
  c.globalAlpha = (1 - p) * 0.5
  c.fillStyle = '#7b4bc4'
  c.beginPath()
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2
    const r = radius * grow * (0.65 + hash(k + 3) * 0.35)
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.6
    if (k === 0) c.moveTo(px, py); else c.lineTo(px, py)
  }
  c.closePath()
  c.fill()
  c.globalAlpha = (1 - p) * 0.75
  c.strokeStyle = FOX_TIP
  c.lineWidth = 1.4
  c.beginPath()
  c.arc(x, y, radius * grow, 0, Math.PI * 2)
  c.stroke()
  if (p < 0.25) {
    c.globalAlpha = 1 - p / 0.25
    c.fillStyle = '#f7efff'
    c.beginPath()
    c.arc(x, y, radius * 0.34 * (1 - p), 0, Math.PI * 2)
    c.fill()
  }
  for (let k = 0; k < 9; k++) {
    const a = hash(k) * Math.PI * 2, score = radius * (0.35 + p * 1.1)
    c.save()
    c.globalAlpha = 1 - p
    c.translate(x + Math.cos(a) * score, y + Math.sin(a) * score * 0.7 - p * 10)
    c.rotate(a + p * 6)
    c.fillStyle = k % 3 === 0 ? FOX_TIP : TALISMAN
    c.fillRect(-2, -3.4, 4, 6.8)
    c.restore()
  }
  c.restore()
}

// The barrage's conjuring circle, in world space with (x, y) on the ground under his feet.
export function drawMeiConjure(c: C, x: number, y: number, tick: number, progress: number) {
  c.save()
  c.translate(x, y)
  c.globalAlpha = Math.min(0.75, 0.35 + progress * 0.35)
  c.strokeStyle = MEI_AURA[0]
  c.lineWidth = 1.2
  c.beginPath()
  c.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = FOX_TIP
  c.lineWidth = 0.8
  for (const [spin, radius] of [[tick * 0.03, 20], [-tick * 0.045, 13]] as const) {
    c.beginPath()
    for (let k = 0; k < 5; k++) {
      const a = spin + k * Math.PI * 2 / 5
      const px = Math.cos(a) * radius, py = Math.sin(a) * radius * 0.35
      if (k === 0) c.moveTo(px, py); else c.lineTo(px, py)
    }
    c.closePath()
    c.stroke()
  }
  for (let k = 0; k < 6; k++) {
    const a = tick * 0.04 + k * Math.PI / 3
    drawTalisman(c, Math.cos(a) * 24, -10 + Math.sin(a) * 24, a + Math.PI / 2)
  }
  c.fillStyle = FOX_TIP
  for (let k = 0; k < 5; k++) {
    const age = (tick * 0.02 + k / 5) % 1
    c.globalAlpha = (1 - age) * 0.5
    c.beginPath()
    c.arc(Math.sin(k * 2.4) * 15, -age * 34, 1.2, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// The crescent left by his backflip, in world space so it does not spin with him.
export function drawMeiFlipStreak(c: C, x: number, y: number, progress: number, facing: number) {
  c.save()
  c.translate(x, y - 16)
  c.scale(facing, 1)
  c.globalAlpha = 0.35 * (1 - progress)
  c.strokeStyle = FOX
  c.lineWidth = 4
  c.lineCap = 'round'
  c.beginPath()
  c.arc(0, 0, 22, Math.PI * 0.15, Math.PI * 0.85)
  c.stroke()
  c.globalAlpha = 0.7 * (1 - progress)
  c.strokeStyle = FOX_TIP
  c.lineWidth = 1.2
  c.stroke()
  c.restore()
}

// The transformation: a column of purple ink-light from the ground to his feet, rings and charms
// spiralling around it, and a seal under him. `rise` is 0 → 1 up, 1 → 0 down.
export function drawMeiTransform(c: C, x: number, y: number, groundY: number, tick: number, rise: number) {
  c.save()
  const height = Math.max(8, groundY - y)
  const beam = c.createLinearGradient(x, y, x, groundY)
  beam.addColorStop(0, 'rgba(163,94,224,.45)')
  beam.addColorStop(1, 'rgba(163,94,224,0)')
  c.fillStyle = beam
  c.globalAlpha = Math.min(1, 0.35 + rise * 0.5)
  c.beginPath()
  c.moveTo(x - 10, groundY)
  c.lineTo(x - 5, y - 10)
  c.lineTo(x + 5, y - 10)
  c.lineTo(x + 10, groundY)
  c.closePath()
  c.fill()
  c.strokeStyle = FOX_TIP
  c.lineWidth = 1
  for (let k = 0; k < 2; k++) {
    const a = tick * (k ? -0.05 : 0.04)
    c.globalAlpha = 0.55 * rise
    c.beginPath()
    c.ellipse(x, y + k * height * 0.35, 24 - k * 6, 8, a, 0, Math.PI * 2)
    c.stroke()
  }
  for (let k = 0; k < 6; k++) {
    const a = tick * 0.05 + k * Math.PI / 3
    const px = x + Math.cos(a) * (20 - rise * 6), py = y - 14 + Math.sin(a) * 14 - rise * 34
    c.globalAlpha = 0.75 * rise
    drawTalisman(c, px, py, a + Math.PI / 2, 0.5)
  }
  c.globalAlpha = 0.5 + rise * 0.35
  c.strokeStyle = FOX
  c.lineWidth = 1.4
  c.beginPath()
  c.ellipse(x, groundY, 40 * (0.6 + rise * 0.4), 13 * (0.6 + rise * 0.4), 0, 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = FOX_TIP
  c.lineWidth = 0.8
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3
    line(c, x + Math.cos(a) * 22, groundY + Math.sin(a) * 7, x + Math.cos(a) * 38, groundY + Math.sin(a) * 12)
  }
  c.restore()
}

// The quiet aura that marks his fox form between skills: a ground ember ring and drifting motes,
// in world space with (x, y) on the ground under his feet.
export function drawFoxAura(c: C, x: number, y: number, tick: number, id: number) {
  c.save()
  c.translate(x, y)
  c.globalAlpha = 0.12 + 0.04 * Math.sin(tick * 0.05 + id)
  c.strokeStyle = FOX
  c.lineWidth = 1.1
  c.beginPath()
  c.ellipse(0, 0, 19, 6, 0, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = FOX_TIP
  for (let k = 0; k < 3; k++) {
    const age = (tick * 0.012 + k / 3 + id * 0.17) % 1
    c.globalAlpha = (1 - age) * 0.28
    c.beginPath()
    c.arc(Math.sin(k * 2.1 + id) * 13, -age * 30, 1.1, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Charms orbiting a seated Mei, in sprite-local units with his feet at (0, 0).
export function drawMeiMeditate(c: C, tick: number, id: number) {
  c.save()
  c.globalAlpha = 0.4
  for (let k = 0; k < 4; k++) {
    const a = tick * 0.03 + k * Math.PI / 2 + id * 0.4
    drawTalisman(c, Math.cos(a) * 22, -12 + Math.sin(a) * 22, a + Math.PI / 2)
  }
  c.fillStyle = FOX_TIP
  for (let k = 0; k < 6; k++) {
    const age = (tick * 0.01 + k / 6) % 1
    c.globalAlpha = (1 - age) * 0.3
    c.beginPath()
    c.arc(Math.sin(k * 1.9) * 12, -age * 38, 1, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// The glowing star trail he leaves on the ground, then the big talisman flying into its centre.
export function drawMeiStar(c: C, fromX: number, fromY: number, x: number, y: number, elapsed: number) {
  const S = MEI_STAR, s = Math.min(S.strokes, elapsed / S.dash)
  if (s <= 1) return
  const head = starDashAt(fromX, fromY, x, y, elapsed), dashed = S.strokes * S.dash
  const thrown = Math.min(1, Math.max(0, (elapsed - dashed) / S.flight))
  c.save()
  c.lineCap = c.lineJoin = 'round'
  for (const [width, color, alpha] of [[9 + thrown * 6, FOX, 0.35], [2.2, FOX_TIP, 0.95], [0.9, '#f7efff', 0.9]] as const) {
    c.globalAlpha = alpha
    c.strokeStyle = color
    c.lineWidth = width
    c.beginPath()
    const start = starVertex(fromX, fromY, x, y, 0)
    c.moveTo(start.x, start.y)
    for (let j = 1; j <= s - 1; j++) {
      const v = starVertex(fromX, fromY, x, y, j)
      c.lineTo(v.x, v.y)
    }
    c.lineTo(head.x, head.y)
    c.stroke()
  }
  // A rune flash at each vertex as he turns it.
  c.strokeStyle = FOX_TIP
  c.lineWidth = 1
  for (let j = 0; j < s; j++) {
    const v = starVertex(fromX, fromY, x, y, j), fade = Math.max(0, 1 - (s - j) / 1.5)
    c.globalAlpha = fade
    c.beginPath()
    c.moveTo(v.x - 5, v.y); c.lineTo(v.x + 5, v.y)
    c.moveTo(v.x, v.y - 5); c.lineTo(v.x, v.y + 5)
    c.stroke()
  }
  // The seal forming under the centre before the blast.
  c.globalAlpha = 0.2 + thrown * 0.35
  c.strokeStyle = FOX
  c.lineWidth = 1.2
  const seal = 20 * (1 - thrown * 0.4)
  c.beginPath()
  c.ellipse(x, y, seal, seal * 0.5, 0, 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = FOX_TIP
  c.lineWidth = 0.8
  for (let k = 0; k < 5; k++) {
    const a = k * Math.PI * 2 / 5 + thrown
    line(c, x + Math.cos(a) * seal * 0.4, y + Math.sin(a) * seal * 0.2,
      x + Math.cos(a) * seal * 0.85, y + Math.sin(a) * seal * 0.42)
  }
  for (let k = 0; k < 3; k++) {
    const a = elapsed * 1.6 + k * Math.PI * 2 / 3
    c.globalAlpha = 0.55
    drawTalisman(c, x + Math.cos(a) * 28, y + Math.sin(a) * 15, a + Math.PI / 2, 0.4)
  }
  c.fillStyle = FOX_TIP
  for (let k = 0; k < 5; k++) {
    c.globalAlpha = (1 - thrown) * 0.5
    c.beginPath()
    c.arc(head.x + (hash(k) - 0.5) * 14, head.y + (hash(k + 9) - 0.5) * 14, 1, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
  if (elapsed < dashed) return
  const start = starVertex(fromX, fromY, x, y, 0)
  c.save()
  c.translate(start.x + (x - start.x) * thrown, start.y + (y - start.y) * thrown - 16 - Math.sin(thrown * Math.PI) * 30)
  c.scale(2, 2)
  drawTalisman(c, 0, 10, elapsed * 20, 1)
  c.restore()
}

// A bomb talisman lying flat on the ground at (x, y); once armed its rune ring pulses and motes rise.
export function drawTalismanMine(c: C, x: number, y: number, tick: number, armed: boolean) {
  c.save()
  c.translate(x, y)
  if (armed) {
    const pulse = 0.5 + Math.sin(tick * 0.15 + x) * 0.5
    c.strokeStyle = TALISMAN
    c.lineWidth = 1
    c.setLineDash([3, 3])
    c.globalAlpha = 0.35 + pulse * 0.3
    c.beginPath()
    c.ellipse(0, 0, 14, 5.5, 0, 0, Math.PI * 2)
    c.stroke()
    c.setLineDash([])
    c.globalAlpha = 0.18 + pulse * 0.2
    c.beginPath()
    c.ellipse(0, 0, 19, 7, 0, 0, Math.PI * 2)
    c.stroke()
    const blink = Math.max(0, Math.sin(tick * 0.11 + x) - 0.72) / 0.28
    if (blink > 0) {
      c.globalAlpha = blink * 0.7
      c.strokeStyle = '#f7efff'
      c.lineWidth = 1.4
      c.beginPath()
      c.ellipse(0, 0, 17 + blink * 4, 6 + blink * 1.5, 0, 0, Math.PI * 2)
      c.stroke()
    }
    c.fillStyle = FOX_TIP
    for (let k = 0; k < 3; k++) {
      const age = (tick * 0.015 + k / 3) % 1
      c.globalAlpha = (1 - age) * 0.45
      c.beginPath()
      c.arc(Math.sin(k * 2.3 + x) * 8, -age * 18, 1.1, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1
  }
  c.scale(1, 0.5) // flat on the page
  drawTalisman(c, 0, 10, Math.PI / 2 - 0.3, armed ? 0.6 : 0)
  c.restore()
}

// A talisman barrier in fighter space: a segmented purple bubble with paper charms circling him,
// a highlight sweeping round, and a glow that strengthens as it fills.
export function drawMeiShield(c: C, tick: number, fill: number) {
  c.save()
  c.globalAlpha = 0.16 + fill * 0.22
  c.fillStyle = '#b98cf0'
  c.beginPath()
  c.arc(0, -20, 24, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = '#8a4fd0'
  c.lineWidth = 1.5
  c.globalAlpha = 0.5 + fill * 0.4
  c.beginPath()
  for (let k = 0; k <= 6; k++) {
    const a = k * Math.PI / 3
    const px = Math.cos(a) * 24, py = -20 + Math.sin(a) * 24
    if (k === 0) c.moveTo(px, py); else c.lineTo(px, py)
  }
  c.stroke()
  c.globalAlpha = 0.7
  c.strokeStyle = FOX_TIP
  c.lineWidth = 1
  c.beginPath()
  c.arc(0, -20, 21, tick * 0.05, tick * 0.05 + Math.PI * 0.7)
  c.stroke()
  c.globalAlpha = 1
  for (let k = 0; k < 6; k++) {
    const angle = tick * 0.08 + k * Math.PI / 3
    drawTalisman(c, Math.cos(angle) * 22, -10 + Math.sin(angle) * 22, angle + Math.PI / 2)
  }
  c.restore()
}

// Purple smoke puffs that swell and fade as `progress` goes 0 → 1.
export function drawMeiSmoke(c: C, x: number, y: number, radius: number, progress: number) {
  c.save()
  c.globalAlpha = (1 - progress) * 0.55
  c.fillStyle = '#9a7ab8'
  for (let k = 0; k < 7; k++) {
    const angle = k * 2.4, spread = radius * (0.3 + progress * 0.6)
    c.beginPath()
    c.arc(x + Math.cos(angle) * spread, y - 8 + Math.sin(angle) * spread * 0.5 - progress * 12,
      radius * (0.35 + progress * 0.3), 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// A purple paper fox head: pointed ears, slanted eyes and a little nose, bobbing as it flies.
export function drawFoxTalisman(c: C, x: number, y: number, tick: number, size: number = MEI_FOX.size) {
  c.save()
  c.translate(x, y - 10 + Math.sin(tick * 0.3) * 1.5)
  c.scale(size, size)
  c.fillStyle = 'rgba(163,94,224,.35)'
  c.beginPath()
  c.arc(0, 0, 11, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 1
  poly(c, TALISMAN, -7, -8, -4, -3, 4, -3, 7, -8, 7.5, 0, 4, 3, 0, 7, -4, 3, -7.5, 0)
  poly(c, '#e6d4ff', -6, -6, -4.5, -3.5, -2.8, -3.5)
  poly(c, '#e6d4ff', 6, -6, 4.5, -3.5, 2.8, -3.5)
  c.strokeStyle = '#f2e6ff'
  c.lineWidth = 1.1
  line(c, -4.5, -0.8, -1.8, 0.4)
  line(c, 4.5, -0.8, 1.8, 0.4)
  c.fillStyle = INK
  c.beginPath()
  c.ellipse(0, 4.6, 1.1, 0.8, 0, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

// The fox explosion: a white flash, a purple bloom, two heavy rings, rays, tumbling paper and a
// rune seal on the ground, with a ghost fox head rising through the smoke.
export function drawFoxBlast(c: C, x: number, y: number, radius: number, progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  const r = radius * (0.35 + p * 0.65), fade = 1 - p
  c.save()
  c.globalAlpha = (1 - p) * 0.55
  c.strokeStyle = '#8a4fd0'
  c.lineWidth = 1.4
  c.beginPath()
  c.ellipse(x, y, radius * 0.6, radius * 0.24, 0, 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = '#e6d4ff'
  c.lineWidth = 0.8
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3 + p * 0.5
    line(c, x + Math.cos(a) * radius * 0.34, y + Math.sin(a) * radius * 0.14,
      x + Math.cos(a) * radius * 0.58, y + Math.sin(a) * radius * 0.24)
  }
  c.globalAlpha = fade * 0.45
  c.fillStyle = '#a35ee0'
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
  if (p < 0.18) {
    c.globalAlpha = 1 - p / 0.18
    c.fillStyle = '#fff8ff'
    c.beginPath()
    c.arc(x, y, r * 0.55 * (1 - p), 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = fade * 0.85
  c.fillStyle = '#f2e6ff'
  c.beginPath()
  c.arc(x, y, r * 0.45 * fade, 0, Math.PI * 2)
  c.fill()
  for (const [ring, alpha] of [[r, 1], [r * 0.7, Math.max(0, 1 - p * 1.6)]] as const) {
    if (alpha <= 0) continue
    c.globalAlpha = fade * alpha
    c.strokeStyle = '#6b3fa0'
    c.lineWidth = ring === r ? 3 : 1.8
    c.beginPath()
    c.arc(x, y, ring, 0, Math.PI * 2)
    c.stroke()
  }
  c.globalAlpha = fade
  c.strokeStyle = '#c9a3f5'
  c.lineWidth = 2
  for (let k = 0; k < 12; k++) {
    const angle = k * Math.PI / 6 + 0.3
    line(c, x + Math.cos(angle) * r * 0.5, y + Math.sin(angle) * r * 0.5, x + Math.cos(angle) * r * 1.15, y + Math.sin(angle) * r * 1.15)
  }
  for (let k = 0; k < 7; k++) {
    const a = hash(k + 20) * Math.PI * 2, score = r * (0.5 + hash(k + 30) * 0.7)
    c.save()
    c.globalAlpha = fade * 0.9
    c.translate(x + Math.cos(a) * score, y + Math.sin(a) * score * 0.6 - p * 14)
    c.rotate(a + p * 7)
    c.fillStyle = k % 2 ? '#e6d4ff' : '#9b5de5'
    c.fillRect(-2, -3.4, 4, 6.8)
    c.restore()
  }
  c.globalAlpha = fade * 0.7
  c.save()
  c.translate(x, y - p * 24)
  c.scale(1.5 + p * 2.5, 1.5 + p * 2.5)
  c.fillStyle = FOX_DARK
  c.beginPath()
  c.moveTo(-5, 3); c.lineTo(5, 3); c.lineTo(3, 10 + p * 4); c.lineTo(-3, 10 + p * 4)
  c.closePath()
  c.fill()
  c.fillStyle = '#f2e6ff'
  for (const side of [-1, 1] as const) {
    c.beginPath()
    c.moveTo(side * 2.5, 4); c.lineTo(side * 4, 7); c.lineTo(side * 1.2, 7)
    c.closePath()
    c.fill()
  }
  c.restore()
  drawFoxTalisman(c, x, y + 10 - p * 24, 0, 1.5 + p * 2.5)
  c.restore()
}

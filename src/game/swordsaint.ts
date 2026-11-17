import { box, buildSprite, ellipse, eye, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2d2b0', ROBE = '#3f9461', ROBE_DARK = '#2c6b47', JADE = '#7fd8a0', HAIR = '#2a2633', STEEL = '#dfe8e4'

export const SWORD_SAINT = {
  name: 'Sword Saint',
  blurb: 'Rides a flying sword. Up to ten spirit swords float around him and fly at enemies one by one',
  radius: 11, hp: 550, speed: 130, damage: 18, range: 300, detection: 520,
  cooldown: 0.5, knockback: 50, spacing: 44, size: 1.2, color: ROBE,
} as const

// Swords gather around him (one per `summon` seconds, up to `max`) and launch one per attack, every `cooldown`.
// Each hangs for `aim` seconds while turning horizontal, then homes in, weaving up to `weave` radians side to side
// and setting off `launchAngle` to one side. Hover is visual only.
export const SWORD_SAINT_SWORDS = { max: 10, summon: 0.5, speed: 400, turn: 0.12, aim: 0.15, life: 2.2, hover: 12, weave: 0.9, launchAngle: 0.9 } as const

// Skills share `cooldown`. Each ranged attack while ready rolls once: below GIANT.chance the giant sword,
// then up to GIANT.chance + STORM.chance Sword Storm (needs `min` floating swords), otherwise a normal shot.
// Sword Storm launches every floating sword at once.
export const SWORD_SAINT_STORM = { chance: 0.3, min: 5, cooldown: 6 } as const
// Giant sword: spirit swords (not his floating ones) converge over `form` seconds into one huge blade
// `height` px up, which charges the enemy over `flight` seconds. Impact leaves a crater for `crater` seconds
// and hits enemies within `radius` for `damage`, `knockback` and a `stun`.
export const SWORD_SAINT_GIANT = {
  chance: 0.2, form: 0.8, flight: 0.45, height: 70, radius: 75, damage: 60, knockback: 420, stun: 1.5, crater: 6,
} as const

// Close combat: an enemy within `trigger` px (beyond both radii) makes him backflip off his sword while every
// floating sword and the ridden one fly at it. After `flip` seconds he blinks behind the enemy with a sonic
// slash, then fights on foot: `combo` quick slashes `slashCooldown` apart, then a dash through the enemy and a
// `recover` pause. Swords that flew return and stab with each slash (`perSword` / `dashPerSword` bonus) and
// can deflect a hit outright (`deflectPerSword` chance each, up to `deflectMax`). When the enemy falls he
// backflips back onto his sword over `mount` seconds.
export const SWORD_SAINT_MELEE = {
  trigger: 36, flip: 0.45, mount: 0.45, flipHeight: 30, hop: 70, blinkDamage: 50, blinkKnockback: 160,
  combo: 5, damage: 10, perSword: 2, slashCooldown: 0.16, dashDamage: 30, dashPerSword: 4, dashKnockback: 220,
  recover: 0.7, reach: 12, deflectPerSword: 0.05, deflectMax: 0.5, returnSpeed: 420, trail: 0.3,
} as const

// Fishing: waits `wait` seconds (min, extra random), then adjusts the rod, reels in a catch or moves along the
// pond (`adjustChance`, then `reelChance`, else move); after a reel he moves with `moveChance`.
// Hit while fishing, he flings a fish into the attacker's face: `damage` and `blind` seconds of stun.
export const SWORD_SAINT_FISHING = {
  wait: [2, 2.5], adjust: 1.2, reel: 2.4, adjustChance: 0.45, reelChance: 0.4, moveChance: 0.5,
  counterFlight: 0.45, damage: 8, blind: 2,
} as const
export const CATCH_COUNT = 5 // fish, boot, tin can, seaweed, fish bone

// With no enemy around: meditate to heal `heal` HP/s when hurt; at full health fly to water and fish.
export const SWORD_SAINT_REST = { heal: 40 } as const

// Sword Ward, a skill only while riding: his floating swords circle him and turn aside every attack for
// `duration` seconds, while `strikers` of them dart at the enemy, return and strike again. He only uses it
// with at least `strikers` swords floating. Rolled after Sword Storm, with `chance`.
export const SWORD_SAINT_WARD = { chance: 0.25, duration: 5, strikers: 2 } as const

// At `threshold` of his HP his swords become lightning bamboo sticks for the rest of the fight, multiplying
// damage, knockback, sword speed and size, summon speed, sword count, attack and skill speed by `power`.
export const SWORD_SAINT_BAMBOO = { threshold: 0.5, power: 2 } as const

// Guard position of the k-th floating sword in sprite-local units (feet at 0,0, facing right, y up negative).
// Golden-angle spacing scatters them; slow drift keeps them wandering close by.
export function swordSlot(k: number, time: number, seed: number) {
  const angle = k * 2.4 + seed, r = 26 + (k * 7 % 5) * 4
  return {
    x: Math.cos(angle) * r * 1.4 + Math.sin(time * 0.03 + k * 1.7) * 5,
    y: -28 + Math.sin(angle) * r * 0.6 + Math.cos(time * 0.025 + k * 2.3) * 5,
    tilt: Math.sin(time * 0.04 + k) * 0.25,
    front: k % 2 === 1,
  }
}

// Soft green vapour streaming back along -x; `strength` 0..1.
function drawVapor(c: C, time: number, strength: number, length = 6) {
  c.save()
  for (let i = 1; i <= length; i++) {
    const back = i * 5, drift = Math.sin(time * 0.3 + i * 1.3) * i * 0.7
    c.globalAlpha = 0.32 * (1 - i / (length + 1)) * strength
    c.fillStyle = i % 2 ? JADE : '#b9f0cc'
    c.beginPath()
    c.arc(-back, drift, 2 + i * 0.8, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Sword Ward: the k-th of `count` swords spinning in a ring around his waist, pointing the way it travels.
function orbitSlot(k: number, count: number, time: number) {
  const angle = k / count * Math.PI * 2 + time * 0.08, rx = 30, ry = 12
  return { x: Math.cos(angle) * rx, y: -22 + Math.sin(angle) * ry,
    tilt: Math.atan2(Math.cos(angle) * ry, -Math.sin(angle) * rx) + Math.PI / 2, front: Math.sin(angle) > 0 }
}

// The floating swords, either the ones behind his sprite or the ones in front.
// `jab` 0..1 swings them level and thrusts them forward to stab alongside his slash.
// `orbit` spins them in the Sword Ward ring; `scale` and `bamboo` come from his bamboo form.
export function drawSwordFan(c: C, count: number, time: number, seed: number, front: boolean, jab = 0, orbit = false, scale = 1, bamboo = false) {
  for (let k = 0; k < count; k++) {
    const { x, y, tilt, front: inFront } = orbit ? orbitSlot(k, count, time) : swordSlot(k, time, seed)
    if (inFront !== front) continue
    c.save()
    c.translate(x + jab * 12, y)
    c.rotate((-Math.PI / 2 + tilt) * (1 - jab))
    drawVapor(c, time + k * 17, 0.6, 4)
    drawBlade(c, 16 * scale, bamboo, time + k * 17)
    c.restore()
  }
}

// A crackling lightning bamboo stick pointing along +x, its butt end where a jian's pommel would be.
export function drawBambooStick(c: C, length = 22, time = 0) {
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = '#fff27a'
  c.globalAlpha = 0.35
  c.lineWidth = 6
  line(c, -10, 0, length, 0)
  c.globalAlpha = 1
  c.strokeStyle = INK
  c.lineWidth = 1.1
  box(c, -10, -1.8, length + 10, 3.6, 1.2, '#7cc35e')
  c.strokeStyle = '#3f7a35'
  for (let x = -4; x < length - 2; x += 7) line(c, x, -1.8, x, 1.8) // nodes
  c.lineWidth = 0.9
  for (let arc = 0; arc < 2; arc++) {
    const points: number[] = []
    for (let i = 0; i <= 6; i++) points.push(-10 + (length + 12) * i / 6, Math.sin(time * 0.9 + i * 2.7 + arc * 3) * 3.5)
    c.strokeStyle = arc ? '#9fe8ff' : '#fff27a'
    line(c, ...points)
  }
  c.restore()
}

function drawBlade(c: C, length: number, bamboo: boolean, time = 0) {
  if (bamboo) drawBambooStick(c, length, time)
  else drawJian(c, length)
}

// A small jian pointing along +x, centred on its guard.
export function drawJian(c: C, length = 22) {
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1.1
  poly(c, STEEL, -2, -1.6, length - 4, -1.6, length, 0, length - 4, 1.6, -2, 1.6)
  c.strokeStyle = '#9fb3ab'
  line(c, 0, 0, length - 5, 0)
  c.strokeStyle = INK
  box(c, -3, -4, 2.5, 8, 1, '#c9a94e')
  box(c, -9, -1.5, 6, 3, 1, ROBE_DARK)
  ellipse(c, -10, 0, 1.6, 1.6, JADE)
  c.restore()
}

// A launched sword in a stream of green vapour; `speed` 0..1 builds the trail once it starts flying.
export function drawFlyingSword(c: C, x: number, y: number, angle: number, time: number, speed = 1, length = 16, bamboo = false) {
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.lineCap = 'round'
  drawVapor(c, time, 0.5 + speed * 0.5, 8)
  c.strokeStyle = bamboo ? '#fff27a' : JADE
  c.globalAlpha = 0.4 * speed
  c.lineWidth = 3
  line(c, -16, 0, 4, 0)
  c.globalAlpha = 1
  drawBlade(c, length, bamboo, time)
  c.restore()
}

// The jade streak left by his sonic-slash blink; `fade` 1..0.
export function drawSonicTrail(c: C, fromX: number, fromY: number, toX: number, toY: number, fade: number) {
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = JADE
  c.globalAlpha = 0.3 * fade
  c.lineWidth = 14
  line(c, fromX, fromY, toX, toY)
  c.globalAlpha = 0.8 * fade
  c.lineWidth = 5
  line(c, fromX, fromY, toX, toY)
  c.strokeStyle = '#f2fff6'
  c.globalAlpha = fade
  c.lineWidth = 1.8
  line(c, fromX, fromY, toX, toY)
  c.restore()
}

// Pulsing jade aura and rising motes while he meditates, in sprite-local units.
// `colors` are [ring, motes]; Mei Yuanzhi meditates in purple.
export function drawMeditationAura(c: C, time: number, colors = [JADE, '#b9f0cc']) {
  c.save()
  const pulse = 0.5 + Math.sin(time * 0.06) * 0.5
  c.strokeStyle = colors[0]
  c.globalAlpha = 0.25 + pulse * 0.25
  c.lineWidth = 2
  c.beginPath()
  c.ellipse(0, -20, 20 + pulse * 4, 24 + pulse * 4, 0, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = colors[1]
  for (let k = 0; k < 5; k++) {
    const rise = (time * 0.4 + k * 9) % 40
    c.globalAlpha = 0.6 * (1 - rise / 40)
    c.beginPath()
    c.arc(Math.sin(k * 2.1 + time * 0.03) * 16, -4 - rise, 1.5, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

const smooth = (t: number) => t * t * (3 - 2 * t)

// Rod lift 0..1 (smoothed) and whether a catch dangles, for a fishing action with `time` seconds left.
export function fishingPose(action: 'wait' | 'adjust' | 'reel', time: number, tick: number) {
  if (action === 'adjust') return { lift: Math.sin((1 - time / SWORD_SAINT_FISHING.adjust) * Math.PI) * 0.45, caught: false }
  if (action === 'reel') {
    const p = 1 - time / SWORD_SAINT_FISHING.reel
    return { lift: p < 0.25 ? smooth(p / 0.25) : p < 0.75 ? 1 : smooth((1 - p) / 0.25), caught: p > 0.2 && p < 0.8 }
  }
  return { lift: 0.04 + Math.sin(tick * 0.03) * 0.04, caught: false }
}

// A small catch hanging at (x, y): 0 fish, 1 boot, 2 tin can, 3 seaweed, 4 fish bone.
export function drawCatch(c: C, kind: number, x: number, y: number, sway = 0, scale = 1) {
  c.save()
  c.translate(x, y)
  c.rotate(sway)
  c.scale(scale, scale)
  c.strokeStyle = INK
  c.lineWidth = 0.8
  if (kind === 0) {
    poly(c, '#f0a24a', -1, 0, 3, 5, 3, 10, 0, 13, -3, 10, -3, 5)
    poly(c, '#f0a24a', 0, 12, 3, 16, -3, 16)
    c.fillStyle = INK
    c.fillRect(-1.5, 3.5, 1.2, 1.2)
  } else if (kind === 1) {
    box(c, -2.5, 0, 5, 9, 1.5, '#6b4f2a')
    box(c, -2.5, 7, 9, 4, 1.5, '#6b4f2a')
  } else if (kind === 2) {
    box(c, -3, 1, 6, 9, 1, '#b9c2cf')
    c.strokeStyle = '#e5484d'
    c.lineWidth = 2
    line(c, -2.5, 5, 2.5, 5)
  } else if (kind === 3) {
    c.strokeStyle = '#3f8f4f'
    c.lineWidth = 1.6
    line(c, 0, 0, 2, 4, -1, 8, 2, 12)
    line(c, 0, 0, -2, 5, 0, 10)
  } else {
    c.strokeStyle = '#f2ead8'
    c.lineWidth = 1.4
    line(c, 0, 0, 0, 11)
    for (let k = 3; k <= 8; k += 2.5) line(c, -2.5, k, 2.5, k)
    ellipse(c, 0, 0, 2, 1.6, '#f2ead8')
  }
  c.restore()
}

// The bamboo rod in sprite-local units (feet at 0,0, facing right). `lift` 0 rests, 1 raises it upright,
// negative swings it forward. `groundY` is the water surface; null draws only a short loose line.
export function drawFishingRod(c: C, lift: number, groundY: number | null, time: number, caught: number | null) {
  const baseX = 10, baseY = -13, rest = -1.09, up = -1.75, length = 30
  const angle = rest + (up - rest) * lift
  const tipX = baseX + Math.cos(angle) * length, tipY = baseY + Math.sin(angle) * length
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = INK
  c.lineWidth = 2.6
  line(c, baseX, baseY, tipX, tipY)
  c.strokeStyle = '#8a6a3a'
  c.lineWidth = 1.4
  line(c, baseX, baseY, tipX, tipY)
  const lineEnd = groundY === null ? tipY + 6
    : groundY - 2 + Math.sin(time * 0.08) * 1.2 * (1 - lift) + (tipY + 14 - groundY) * Math.max(0, lift)
  c.strokeStyle = 'rgba(34,31,51,.55)'
  c.lineWidth = 0.6
  line(c, tipX, tipY, tipX, lineEnd)
  if (groundY !== null && lift < 0.3) {
    c.strokeStyle = '#e4faff'
    c.lineWidth = 0.8
    c.globalAlpha = (0.5 + Math.sin(time * 0.08) * 0.3) * (1 - lift / 0.3)
    c.beginPath()
    c.ellipse(tipX, groundY + 1, 5 + Math.sin(time * 0.05) * 1.5, 1.6, 0, 0, Math.PI * 2)
    c.stroke()
    c.globalAlpha = 1
  }
  if (caught !== null) drawCatch(c, caught, tipX, lineEnd, Math.sin(time * 0.15) * 0.3)
  else if (groundY !== null) {
    c.strokeStyle = INK
    c.lineWidth = 0.8
    ellipse(c, tipX, lineEnd, 1.6, 1.6, '#e5484d')
  }
  c.restore()
}

// The giant sword, with spirit swords converging into it while it forms (`form` 0..1).
export function drawGiantSword(c: C, x: number, y: number, angle: number, form: number, time: number, scale = 1, bamboo = false) {
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)
  if (form < 1) {
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 + time * 0.05, r = (1 - form) * 60 + 6
      c.save()
      c.globalAlpha = 0.4 + form * 0.6
      c.translate(Math.cos(a) * r, Math.sin(a) * r * 0.7)
      c.rotate(a + Math.PI)
      drawVapor(c, time + k * 11, 0.7, 4)
      drawBlade(c, 14, bamboo, time + k * 11)
      c.restore()
    }
  }
  c.rotate(angle)
  c.translate(-50, 0) // keep the tip near (x, y)
  c.fillStyle = JADE
  c.globalAlpha = 0.25 * form
  c.beginPath()
  c.ellipse(28, 0, 48, 12, 0, 0, Math.PI * 2)
  c.fill()
  c.globalAlpha = form
  c.scale(3, 3)
  drawVapor(c, time, form, 6)
  drawBlade(c, 22, bamboo, time)
  c.restore()
}

// A cracked crater left by the giant sword; `fade` 1..0.
export function drawCrater(c: C, x: number, y: number, fade: number) {
  c.save()
  c.globalAlpha = Math.min(1, fade * 2)
  c.fillStyle = 'rgba(34,31,51,.22)'
  c.beginPath()
  c.ellipse(x, y, 38, 14, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(34,31,51,.18)'
  c.beginPath()
  c.ellipse(x, y + 2, 24, 8, 0, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = 'rgba(34,31,51,.5)'
  c.lineWidth = 1.2
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9 + 0.3
    line(c, x + Math.cos(a) * 22, y + Math.sin(a) * 8, x + Math.cos(a + 0.15) * 34, y + Math.sin(a + 0.15) * 12,
      x + Math.cos(a) * 46, y + Math.sin(a) * 17)
  }
  c.restore()
}

// One pointed bamboo leaf along +x with a midrib.
function bambooLeaf(c: C, length: number) {
  c.beginPath()
  c.moveTo(0, 0)
  c.quadraticCurveTo(length * 0.45, -length * 0.22, length, 0)
  c.quadraticCurveTo(length * 0.45, length * 0.22, 0, 0)
  c.fillStyle = '#6fbf5e'
  c.fill()
  c.strokeStyle = '#2f6b3a'
  c.lineWidth = 0.8
  c.stroke()
  line(c, length * 0.1, 0, length * 0.85, 0)
}

export const SAINT_SLASH_DURATION = 0.5

// His own slash: a jade crescent cut that widens and fades while bamboo leaves burst out, spin and drift down.
// `progress` runs 0..1 over the slash's life.
export function drawSaintSlash(c: C, x: number, y: number, angle: number, progress: number) {
  c.save()
  c.translate(x, y - 14)
  c.save()
  c.rotate(angle)
  const radius = 24 + progress * 18, fade = 1 - progress
  c.beginPath()
  c.moveTo(-radius * 0.6, -radius)
  c.bezierCurveTo(radius * 1.25, -radius * 0.6, radius * 1.25, radius * 0.6, -radius * 0.6, radius)
  c.quadraticCurveTo(radius * 0.6, 0, -radius * 0.6, -radius)
  c.closePath()
  c.globalAlpha = 0.35 * fade
  c.fillStyle = JADE
  c.fill()
  c.globalAlpha = fade
  c.strokeStyle = '#3f9461'
  c.lineWidth = 2.2
  c.stroke()
  c.strokeStyle = '#f2fff6'
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(-radius * 0.5, -radius * 0.85)
  c.bezierCurveTo(radius * 1.05, -radius * 0.5, radius * 1.05, radius * 0.5, -radius * 0.5, radius * 0.85)
  c.stroke()
  c.restore()
  for (let k = 0; k < 6; k++) {
    const a = angle + (k - 2.5) * 0.55, burst = 10 + progress * (26 + (k % 3) * 8)
    c.save()
    c.globalAlpha = Math.min(1, fade * 1.6)
    c.translate(Math.cos(a) * burst, Math.sin(a) * burst + progress * progress * 18)
    c.rotate(a + progress * (k % 2 ? 4 : -4))
    bambooLeaf(c, 7 + (k % 3) * 1.5)
    c.restore()
  }
  c.restore()
}

type SaintPose = 'ride' | 'stand' | 'slash' | 'meditate' | 'fish'

function drawSwordSaint(c: C, pose: SaintPose, step?: number, bamboo = false) {
  const seated = pose === 'meditate' || pose === 'fish', riding = pose === 'ride' || seated
  // Spirit glow and the sword he rides, hilt trailing behind.
  if (riding) {
    c.save()
    c.fillStyle = 'rgba(127,216,160,.35)'
    c.beginPath()
    c.ellipse(26, 42, 19, 3.5, 0, 0, Math.PI * 2)
    c.fill()
    c.translate(12, 41.5)
    drawBlade(c, 32, bamboo)
    c.strokeStyle = '#c94a3a'
    c.lineWidth = 1.2
    line(c, -10, 0, -13, 4, -11, 7) // red tassel
    c.restore()
  }

  // Flowing ribbon and long hair behind him.
  c.save()
  c.lineWidth = 1.2
  poly(c, '#b7e3c3', 16, 27, 8, 25, 3, 29, 7, 31, 4, 35, 12, 31, 16, 31)
  c.restore()
  poly(c, HAIR, 18, 10, 16, 18, 14, 26, 19, 24, 22, 14)

  // Cloth shoes on the blade, or legs and shoes on the ground; seated, his crossed legs hide under the robe.
  if (seated) box(c, 33, 36, 5, 3.5, 1.5, HAIR)
  else if (pose === 'ride') {
    box(c, 17, 37, 6, 4, 1.5, HAIR)
    box(c, 26, 37, 7, 4, 1.5, HAIR)
  } else {
    leg(c, step, 20, 36, () => { line(c, 20, 36, 19, 41); box(c, 15, 40, 7, 4, 1.5, HAIR) })
    leg(c, opposite(step), 28, 36, () => { line(c, 28, 36, 30, 41); box(c, 27, 40, 8, 4, 1.5, HAIR) })
  }

  // Long robe with a crossed white collar, dark sash and jade pendant.
  poly(c, ROBE, 16, 20, 32, 20, 36, 38, 12, 38)
  if (seated) ellipse(c, 24, 37, 14, 3.8, ROBE) // robe pooled over crossed legs
  c.save()
  c.fillStyle = 'rgba(255,255,255,.14)'
  c.beginPath()
  c.ellipse(20, 30, 3.5, 7, -0.15, 0, Math.PI * 2)
  c.fill()
  c.lineWidth = 1.4
  c.strokeStyle = '#eef5ea'
  line(c, 19, 20.5, 25, 28, 29, 20.5)
  c.strokeStyle = INK
  c.lineWidth = 1.2
  box(c, 14, 28, 20, 3.5, 1, ROBE_DARK)
  line(c, 27, 31.5, 27, 35)
  ellipse(c, 27, 36, 1.8, 1.8, JADE)
  c.restore()

  // Wide sleeve: the two-finger sword gesture while riding, hands together to meditate,
  // a hand ready for the bamboo rod (drawn live by the battle) to fish, otherwise his sword in hand.
  if (pose === 'slash') poly(c, ROBE, 29, 22, 39, 23, 44, 27, 39, 31, 31, 28)
  else if (pose === 'meditate') poly(c, ROBE, 28, 22, 33, 24, 32, 31, 26, 30)
  else if (pose === 'fish') poly(c, ROBE, 29, 22, 35, 23, 38, 28, 33, 31, 30, 28)
  else poly(c, ROBE, 29, 22, 37, 22, 41, 27, 36, 32, 31, 28)
  const handX = pose === 'slash' ? 43 : pose === 'meditate' ? 28.5 : pose === 'fish' ? 37 : 40
  const handY = pose === 'slash' ? 26 : pose === 'meditate' ? 26.5 : pose === 'fish' ? 27 : 23.5
  if (pose === 'stand' || pose === 'slash') {
    c.save()
    c.translate(handX, handY)
    c.rotate(pose === 'slash' ? 0.1 : -1.1)
    drawBlade(c, pose === 'slash' ? 24 : 20, bamboo)
    c.restore()
  }
  c.save()
  c.lineWidth = 1.2
  ellipse(c, handX, handY, 2.2, 2.2, SKIN)
  c.lineWidth = 1.6
  if (pose === 'ride') line(c, 40.5, 22, 41.5, 17.5)
  c.restore()

  // Head under a wide conical bamboo hat with a chin strap.
  ellipse(c, 25, 13, 7.5, 7.5, SKIN)
  poly(c, HAIR, 17.5, 13, 18.5, 8, 31, 8, 32, 10, 26, 10, 21, 11)
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1
  line(c, 27, 11, 30.5, 10.5) // calm brow
  c.strokeStyle = '#6b4f2a'
  line(c, 19, 9.5, 21.5, 19.5, 27, 20.5)
  c.restore()
  if (pose === 'meditate') {
    c.save()
    c.lineWidth = 1
    c.beginPath()
    c.arc(28.5, 12.5, 1.8, 0.2, Math.PI - 0.2) // eyes closed
    c.stroke()
    c.restore()
  } else eye(c, 28.5, 13, 2.1, 1.1)
  c.save()
  c.lineWidth = 1.6
  poly(c, '#d9b56a', 25, 0.8, 39.5, 9, 37, 10.5, 13, 10.5, 10.5, 9)
  c.lineWidth = 0.8
  c.strokeStyle = '#a8843f'
  line(c, 25, 1.5, 17, 10)
  line(c, 25, 1.5, 21, 10.2)
  line(c, 25, 1.5, 29, 10.2)
  line(c, 25, 1.5, 33, 10)
  line(c, 15, 7.6, 35, 7.6)
  c.restore()
}

export function buildSwordSaintSprite(color?: string, pose: SaintPose = 'ride', step?: number, bamboo = false) {
  // Riding has no ground shadow: the battle draws his hover shadow separately. Team colour is the hat band.
  return buildSprite((c) => drawSwordSaint(c, pose, step, bamboo), color, [18, 4.5, 14], pose === 'stand' || pose === 'slash')
}

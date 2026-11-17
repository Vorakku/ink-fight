import { box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

export const SPARTAN = {
  name: 'Spartan',
  blurb: 'Six form ranks; over 50 troops summon a commander. At 40% survivors, the army unleashes one dragon charge',
  color: '#b98b43', radius: 11, hp: 240, speed: 85, damage: 18, range: 44,
  cooldown: 0.8, knockback: 65, spacing: 36, size: 1.15,
} as const
export const SPARTAN_BASH = { range: 8, cooldown: 5, damage: 24, knockback: 220, stun: 0.6 } as const
export const SPARTAN_THROW = { opening: 2, cooldown: 8, minRange: 90, range: 320, speed: 520, damage: 36, knockback: 90 } as const
export const SPARTAN_KNIFE = { damage: 10, range: 7, cooldown: 0.45, knockback: 25 } as const
export const SPARTAN_FORMATION = {
  min: 6, max: 12, join: 180, leash: 280, threat: 360, spacing: 28, fireSpacing: 56,
  hold: 3, settle: 20, lowHealth: 0.4, chargeHealth: 0.65,
  wallArmor: 0.3, circleArmor: 0.35, rearReach: 28, circleDamage: 0.8,
  wallSpeed: 0.45, wedgeSpeed: 0.9, bashInterval: 0.25,
} as const
export const SPARTAN_CHARGE = {
  survivors: 0.4, rally: 3, windup: 2.4, speed: 460, damage: 90, knockback: 300, stun: 0.6, recover: 0.7,
  lane: 70,
} as const
export const SPARTAN_COMMANDER = { troops: 50, power: 3, scale: 1.6, throwCooldown: 1.2 } as const

type SpartanPose = 'ready' | 'poke' | 'bash' | 'guard' | 'throw'
type SpartanWeapon = 'spear' | 'knife'

function spartan(c: C, pose: SpartanPose, weapon: SpartanWeapon, commander: boolean, step?: number) {
  c.lineWidth = 1.5
  // Red cloak, bronze greaves and a crested helmet keep the silhouette readable.
  poly(c, '#9e343d', 18, 20, 9, 23, 5, 39, 15, 36, 22, 39, 23, 23)
  poly(c, '#d65c4c', 17, 22, 12, 25, 10, 35, 18, 32)
  c.lineWidth = 0.8
  c.strokeStyle = '#702b38'
  line(c, 11, 26, 8, 36, 14, 34)
  line(c, 18, 26, 16, 33, 20, 36)
  c.strokeStyle = '#ee8b69'
  line(c, 13, 26, 11, 32)
  c.strokeStyle = INK
  // Thigh, bronze greave and sandal swing together from the hip.
  const shin = (s: number | undefined, hipX: number, footX: number, x: number, sandal: number) => leg(c, s, hipX, 34, () => {
    c.lineWidth = 5
    line(c, hipX, 34, footX, 42)
    c.lineWidth = 1.2
    box(c, x, 37, 6, 7, 1.5, '#c69a51')
    c.lineWidth = 0.7
    c.strokeStyle = '#f5d991'
    line(c, x + 2, 38, x + 1.5, 41)
    c.strokeStyle = '#805331'
    line(c, x + 1, 42, x + 5, 42)
    c.strokeStyle = INK; c.lineWidth = 1.2
    box(c, x - 1, 42, sandal, 3, 1, '#6b4a34')
  })
  shin(step, 20, 17, 14, 8)
  shin(opposite(step), 27, pose === 'bash' ? 32 : 29, pose === 'bash' ? 29 : 26, 10)
  c.lineWidth = 1.2
  box(c, 16, 21, 17, 16, 4, '#c69a51')
  poly(c, '#edd08b', 18, 22, 25, 25, 31, 22, 29, 30, 20, 30)
  c.lineWidth = 0.65
  c.strokeStyle = '#9a683b'
  line(c, 19, 25, 22, 27, 25, 26, 28, 27, 30, 25)
  line(c, 25, 27.5, 25, 30)
  line(c, 28, 29, 30, 30, 30, 32)
  c.strokeStyle = '#fff0b5'
  line(c, 19, 23, 22, 24)
  line(c, 28, 23.5, 30, 23)
  c.strokeStyle = INK; c.lineWidth = 0.9
  box(c, 17, 30.5, 15, 2.5, 0.6, '#6b4635')
  box(c, 25, 30, 4, 3.5, 0.6, '#f1c86b')
  poly(c, '#714b37', 16, 32, 32, 32, 34, 39, 28, 38, 25, 40, 21, 38, 16, 39)
  c.lineWidth = 0.7
  for (const x of [19, 24, 29]) {
    c.strokeStyle = '#362c30'
    line(c, x, 33, x, 37)
    c.strokeStyle = '#d8ac58'
    line(c, x + 1, 37, x + 3, 37.5)
  }

  // Face opening, cheek guards and a horsehair crest rather than a crown.
  c.strokeStyle = INK; c.lineWidth = 1.2
  ellipse(c, 27, 14, 8, 8, '#eac09c')
  poly(c, '#c49a51', 18, 15, 19, 8, 24, 4, 31, 5, 35, 10, 35, 14,
    29, 12, 22, 13, 23, 20, 19, 22)
  poly(c, '#ebca7e', 29, 12, 32, 13, 32, 22, 28, 24, 27, 18)
  poly(c, '#b33741', 18, 8, 17, 3, 22, 1, 30, 1, 35, 5, 35, 9, 29, 5, 23, 5)
  c.lineWidth = 0.65
  c.strokeStyle = '#702b38'
  for (const x of [20, 23, 26, 29, 32]) line(c, x, x > 29 ? 4 : 2, x + 1, x > 29 ? 7 : 4.5)
  c.strokeStyle = '#ef8b71'
  line(c, 20, 3, 23, 2, 29, 2.5)
  c.strokeStyle = '#855d36'
  line(c, 20, 12, 21, 17, 20, 20)
  line(c, 29, 16, 30, 20, 28.5, 22)
  c.strokeStyle = '#f4d791'
  c.lineWidth = 0.9
  line(c, 21, 9, 25, 6, 30, 7)
  line(c, 23, 11, 28, 10, 32, 11)
  line(c, 30, 14, 31, 18)
  c.strokeStyle = INK
  c.fillStyle = INK
  c.fillRect(31, 14, 1.6, 1.8)
  line(c, 30, 12.5, 34, 13.5)
  line(c, 31, 20, 34, 19)

  // The spear leaves the hand during the throw; the short knife has its own blade.
  if (pose !== 'throw') {
    c.save()
    c.translate(pose === 'poke' && weapon === 'spear' ? 22 : 31, 27)
    c.rotate(pose === 'poke' ? Math.PI / 2 : 0.12)
    c.strokeStyle = '#725038'
    c.lineWidth = 2.4
    line(c, 0, weapon === 'spear' ? 14 : 5, 0, weapon === 'spear' ? -19 : 0)
    c.strokeStyle = INK
    c.lineWidth = 0.8
    if (weapon === 'spear') {
      poly(c, '#b98b43', -1.4, 11, 0, 15, 1.4, 11)
      poly(c, '#dce6e8', 0, -25, -2.2, -18, 0, -16, 2.2, -18)
      c.strokeStyle = '#8796a2'; c.lineWidth = 0.6
      line(c, 0, -24, 0, -17, 1.8, -18)
      c.strokeStyle = '#fff7d8'
      line(c, -0.5, -22, -1.3, -18.5)
    } else {
      poly(c, '#dce6e8', -1.5, 0, -2, -9, 0, -14, 2, -9, 1.5, 0)
      c.strokeStyle = '#fff7d8'
      line(c, 0, -11, 0, -2)
      c.strokeStyle = '#b98939'
      line(c, -3, 0, 3, 0)
    }
    c.strokeStyle = '#d2ae78'; c.lineWidth = 0.7
    for (const y of [1, 3, 5]) line(c, -1, y - 0.5, 1, y + 0.5)
    c.restore()
  } else {
    c.strokeStyle = '#eac09c'; c.lineWidth = 4
    line(c, 31, 24, 39, 20)
  }
  c.strokeStyle = INK
  c.lineWidth = 1.1
  ellipse(c, pose === 'poke' ? 34 : 31, 27, 2.8, 2.5, '#eac09c')

  // A round bronze shield with the Spartan lambda advances during the bash.
  const shieldX = pose === 'bash' ? 34 : pose === 'guard' ? 31 : 21
  ellipse(c, shieldX, 30, 9.5, 11, '#926535')
  ellipse(c, shieldX, 29.5, 7.8, 9, '#d8ac58')
  c.beginPath()
  c.moveTo(shieldX + 3, 21.5)
  c.bezierCurveTo(shieldX + 10, 25, shieldX + 9, 35, shieldX + 2, 38)
  c.bezierCurveTo(shieldX + 6, 32, shieldX + 6, 26, shieldX + 3, 21.5)
  c.fillStyle = '#bd8742'; c.fill()
  c.lineWidth = 0.45
  c.strokeStyle = '#694b32'
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4
    ellipse(c, shieldX + Math.cos(angle) * 8.6, 30 + Math.sin(angle) * 10, 0.55, 0.55, '#f5d791')
  }
  c.strokeStyle = '#f7d990'
  c.lineWidth = 0.8
  c.beginPath(); c.ellipse(shieldX, 29.5, 6.6, 7.6, 0, Math.PI, Math.PI * 1.8); c.stroke()
  c.strokeStyle = '#946338'; c.lineWidth = 0.65
  line(c, shieldX - 5.5, 29, shieldX - 3.5, 27)
  line(c, shieldX + 3, 35.5, shieldX + 5, 33.5)
  c.strokeStyle = '#9b3438'
  c.lineWidth = 2.3
  line(c, shieldX - 4, 34, shieldX, 24, shieldX + 4, 34)
  if (commander) {
    c.strokeStyle = '#70412e'; c.lineWidth = 0.8
    poly(c, '#f1c86b', 15, 21, 20, 20, 21, 25, 14, 27, 12, 24)
    poly(c, '#f1c86b', 29, 21, 34, 22, 37, 26, 30, 27)
    poly(c, '#f5d47f', 18, 7, 17, 2, 23, 0, 31, 1, 36, 5, 35, 9,
      30, 6, 23, 5)
    c.strokeStyle = '#ac7639'; c.lineWidth = 0.6
    line(c, 21, 1.5, 22, 4)
    line(c, 26, 1.5, 27, 4.5)
    line(c, 31, 3, 33, 6)
    c.strokeStyle = '#9f393b'; c.lineWidth = 1.1
    line(c, 20, 4, 24, 2, 30, 3, 33, 5)
    c.strokeStyle = '#ffe7a0'; c.lineWidth = 1.5
    c.beginPath(); c.ellipse(shieldX, 29.5, 8.7, 10.1, 0, 0, Math.PI * 2); c.stroke()
    c.lineWidth = 0.65
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = shieldX + side * (5.5 - i * 0.6), y = 33 - i * 3
      line(c, x, y, x + side * 1.6, y - 1.5)
    }
    poly(c, '#fff0b5', 23, 24, 25, 23, 27, 24, 25, 27)
  }
  c.strokeStyle = INK
}

export function buildSpartanSprite(color?: string, pose: SpartanPose = 'ready', weapon: SpartanWeapon = 'spear', commander = false, step?: number) {
  return buildSprite((c) => spartan(c, pose, weapon, commander, step), color, [12, 22, 7])
}

export function drawSpartanSpear(c: C, x: number, y: number, angle: number, commander = false) {
  c.save()
  c.translate(x, y); c.rotate(angle)
  if (commander) c.scale(1.25, 1.25)
  c.strokeStyle = INK; c.lineWidth = 3
  line(c, -22, 0, 14, 0)
  c.strokeStyle = commander ? '#edc875' : '#a57c48'; c.lineWidth = 1.6
  line(c, -22, 0, 14, 0)
  c.strokeStyle = '#e3c18c'; c.lineWidth = 0.7
  for (const x of [-5, -2, 1, 4]) line(c, x - 0.5, -1, x + 0.5, 1)
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, commander ? '#fff0bd' : '#dce6e8', 23, 0, 13, -3, 10, 0, 13, 3)
  c.strokeStyle = '#8796a2'; c.lineWidth = 0.6
  line(c, 12, 0, 22, 0, 13, 2)
  c.strokeStyle = '#fff8d6'; c.lineWidth = 0.7
  line(c, 13, 0, 21, 0)
  c.restore()
}

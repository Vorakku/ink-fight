import { box, buildSprite, ellipse, eye, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2c9a5', TUNIC = '#4d5f8a', IRON = '#b9c2cf'
type Pose = 'ready' | 'empty' | 'throw' | 'catch' | 'cast' | 'charge' | 'fly' | 'slam' | 'heal'

export const THOR_MELEE = { reach: 70, radius: 75, damage: 32, knockback: 240 } as const
export const THOR_REST = { windup: 2, heal: 120 } as const

// Chances are per eligible attack; the remaining 5% uses the returning hammer.
export const THOR_SKILLS = {
  cooldown: 3,
  shot: { chance: 0.4, damage: 28, windup: 0.7, duration: 0.3, width: 10, range: 400, maxTargets: 5, chainRange: 130 },
  storm: { chance: 0.3, damage: 24, radius: 70, warning: 0.9, stun: 1.1 },
  charge: { chance: 0.25, damage: 36, radius: 65, knockback: 460, windup: 0.4, flight: 0.45 },
} as const

// The same short-handled hammer is used in his hand and in flight.
export function drawHammer(c: C) {
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1.1
  box(c, -1.8, -4, 3.6, 10, 1, '#866040')
  c.strokeStyle = '#c3a47c'
  line(c, -1, 0, 1, 1)
  line(c, -1, 3, 1, 4)
  c.strokeStyle = INK
  box(c, -7, -12, 14, 9, 2, IRON)
  c.fillStyle = '#e5ebf2' // a pale top facet and darker right face
  c.beginPath()
  c.moveTo(-5, -11); c.lineTo(5, -11); c.lineTo(3, -8.5); c.lineTo(-5, -8.5)
  c.closePath()
  c.fill()
  c.fillStyle = '#8491a6'
  c.fillRect(4, -10, 2, 5.5)
  c.strokeStyle = '#715f37'
  c.lineWidth = 0.8
  line(c, 0.5, -10, -1.5, -7.5, 1, -7.5, -0.5, -5) // a small lightning rune
  c.restore()
}

// Iron cap, red beard and a blue tunic: keep his small silhouette readable.
function body(c: C, step?: number) {
  c.save()
  c.lineWidth = 1.4
  leg(c, step, 20, 34, () => { c.lineWidth = 2.2; line(c, 20, 34, 20, 39); c.lineWidth = 1.4; box(c, 16, 38, 7, 6, 1.8, '#594334') })
  leg(c, opposite(step), 28, 34, () => { c.lineWidth = 2.2; line(c, 28, 34, 28, 39); c.lineWidth = 1.4; box(c, 25, 38, 8, 6, 1.8, '#594334') })
  line(c, 13, 25, 11, 31)
  ellipse(c, 12, 32, 2.3, 2.7, '#8a93a3')
  c.restore()
  box(c, 13, 20, 22, 19, 7, TUNIC)
  c.fillStyle = 'rgba(255,255,255,.15)'
  c.beginPath()
  c.ellipse(20, 28, 4, 6, -0.2, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(20,28,52,.18)'
  c.beginPath()
  c.ellipse(30, 30, 3, 7, 0, 0, Math.PI * 2)
  c.fill()
  c.save()
  c.lineWidth = 1.2
  box(c, 13, 32, 22, 3.5, 1.5, '#5e4632')
  box(c, 25, 31, 5, 5, 1, '#dfbb57')
  box(c, 26.5, 32.5, 2, 2, 0.4, '#715336')
  c.restore()

  ellipse(c, 25, 13, 7.5, 7.5, SKIN)
  poly(c, '#d2552b', 18, 15, 33.5, 15, 34, 20, 31, 25.5, 26, 28, 21, 25.5, 18, 20)
  c.save()
  c.lineWidth = 1
  c.strokeStyle = '#a63d28'
  line(c, 22, 20, 24, 25)
  line(c, 27, 21, 27, 26)
  line(c, 31, 19, 30, 23)
  c.strokeStyle = INK
  ellipse(c, 33, 14.5, 1.9, 1.7, SKIN)
  c.restore()
  eye(c, 28.5, 12.3, 2.4, 1.2)
  poly(c, IRON, 16.5, 10, 18, 5.5, 25, 3.2, 32, 5.5, 33.5, 10)
  c.save()
  c.lineWidth = 1
  c.strokeStyle = '#edf2f7'
  line(c, 19.5, 6.5, 25, 4.8, 29, 6)
  c.strokeStyle = '#7d899c'
  line(c, 25, 5, 25, 8.5)
  c.restore()
}

function drawThor(c: C, pose: Pose, step?: number) {
  body(c, step)
  const handX = pose === 'heal' ? 38 : pose === 'throw' ? 42 : pose === 'empty' ? 40 : pose === 'cast' || pose === 'charge' ? 32 : 37
  const handY = pose === 'heal' ? 12 : pose === 'cast' ? 14 : pose === 'charge' || pose === 'catch' ? 17
    : pose === 'fly' || pose === 'throw' ? 16 : pose === 'slam' ? 29 : 21
  c.save()
  c.lineWidth = 5
  line(c, 31, 26, pose === 'heal' ? 38 : 35, 24, handX, handY)
  c.strokeStyle = SKIN
  c.lineWidth = 2.8
  line(c, 31, 26, pose === 'heal' ? 38 : 35, 24, handX, handY)
  c.restore()
  if (pose !== 'empty' && pose !== 'throw') {
    c.save()
    c.translate(handX, handY)
    c.rotate(pose === 'catch' ? -0.2 : 0.12)
    drawHammer(c)
    c.restore()
  }
  c.save()
  c.lineWidth = 1.4
  ellipse(c, handX, handY + 1, 2.6, 2.6, '#8a93a3')
  c.strokeStyle = '#d4dce7'
  line(c, handX - 1, handY, handX + 1, handY)
  c.restore()
}

export const THOR = {
  name: 'Thor',
  blurb: 'Smashes up close. Summons tower lightning on enemies and healing lightning on himself while resting',
  radius: 13, hp: 600, speed: 95, damage: 26, range: 320, detection: 640,
  cooldown: 1.1, knockback: 240, spacing: 60, size: 1.4, color: TUNIC,
} as const

// Shared by Thor's strikes and the dragon's lightning breath.
export function drawLightningBolt(c: C, length: number, fade: number, scale = 1) {
  if (length <= 0) return
  c.save()
  c.scale(scale, scale)
  length /= scale
  const opacity = c.globalAlpha
  c.lineJoin = c.lineCap = 'round'
  c.beginPath()
  c.moveTo(0, 0)
  for (let k = 1; k < 8; k++) c.lineTo(length * k / 8, (k % 2 ? -1 : 1) * Math.min(11, length * 0.09))
  c.lineTo(length, 0)
  c.strokeStyle = '#3e9de8'
  c.globalAlpha = opacity * fade * 0.2
  c.lineWidth = 24
  c.stroke()
  c.globalAlpha = opacity * fade * 0.5
  c.lineWidth = 13
  c.stroke()
  c.strokeStyle = '#67cfff'
  c.globalAlpha = opacity * fade
  c.lineWidth = 7
  c.stroke()
  c.strokeStyle = '#e8f8ff'
  c.lineWidth = 2.5
  c.stroke()
  c.strokeStyle = '#3e9de8'
  c.lineWidth = 1.5
  c.globalAlpha = opacity * fade * 0.65
  c.beginPath()
  for (let k = 2; k < 7; k += 2) {
    const x = length * k / 8, side = k % 4 ? -1 : 1
    c.moveTo(x, 8)
    c.lineTo(x + 8, side * 18)
    c.lineTo(x + 18, side * 13)
  }
  c.stroke()
  c.globalAlpha = opacity * fade * 0.7
  c.beginPath()
  c.arc(length, 0, 5 + (1 - fade) * 15, 0, Math.PI * 2)
  c.stroke()
  c.restore()
}

export function buildThorSprite(color?: string, pose: Pose = 'ready', step?: number) {
  return buildSprite((c) => drawThor(c, pose, step), color, [18, 7, 14], pose !== 'fly')
}

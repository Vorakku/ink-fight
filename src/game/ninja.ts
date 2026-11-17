import { box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

export const NINJA = {
  name: 'No Thanks',
  blurb: 'Hides in trees. Blinks through enemies with a katana slash, then backflips into cover',
  color: '#46516a', radius: 9, hp: 70, speed: 115, damage: 9, range: 155,
  cooldown: 0.75, knockback: 35, spacing: 26, size: 1,
} as const

export const NINJA_DASH = {
  duration: 0.22, cooldown: 3.2, speed: 520, range: 125,
  reach: 12, damageMultiplier: 2.2, knockback: 180,
} as const
export const SHURIKEN_SPEED = 420
export const KATANA_SLASH_DURATION = 0.3
export const NINJA_AMBUSH = {
  seekRange: 420, range: 180, perch: 62, blinkTime: 0.18, pokeReach: 8,
  returnTime: 0.55, returnRange: 64, jumpHeight: 44, recovery: 2,
} as const

type NinjaPose = 'ready' | 'poke' | 'slash'

function ninja(c: C, pose: NinjaPose, step?: number) {
  c.lineWidth = 1.6
  // A trailing mint scarf, layered hood and fitted armour keep the old silhouette.
  poly(c, '#68aaa2', 17, 21, 4, 19, 8, 24, 3, 29, 16, 25)
  poly(c, '#96cfc3', 16, 21, 6, 13, 7, 20, 3, 23, 16, 25)
  leg(c, step, 19, 35, () => { line(c, 19, 35, 18, 42); box(c, 13, 40, 10, 5, 2, '#30394e') })
  leg(c, opposite(step), 27, 35, () => { line(c, 27, 35, 30, 42); box(c, 26, 40, 11, 5, 2, '#30394e') })
  box(c, 13, 23, 22, 16, 6, NINJA.color)
  poly(c, '#596780', 15, 24, 24, 29, 32, 24, 31, 35, 17, 35)
  c.lineWidth = 1
  line(c, 17, 27, 22, 31, 29, 27)
  box(c, 13, 33, 22, 4, 1, '#283345')
  box(c, 22, 33, 4, 4, 0.5, '#d6b86b')
  box(c, 12, 32, 5, 7, 1.5, '#68837e')
  c.lineWidth = 1.7
  ellipse(c, 24, 14.5, 10, 10, NINJA.color)
  poly(c, '#596780', 17, 8, 24, 4.5, 29, 7, 24, 7.5, 20, 10)
  box(c, 16, 11.5, 18, 6.5, 2, '#f7d7bc')
  poly(c, '#30394e', 15, 17, 34, 17, 31, 24, 22, 25, 16, 21)
  c.lineWidth = 1.3
  line(c, 18, 12.5, 23, 13.5)
  line(c, 27, 13.5, 32, 12.5)
  c.fillStyle = INK
  c.fillRect(21, 14, 1.7, 2)
  c.fillRect(28, 14, 1.7, 2)
  c.strokeStyle = '#8796aa'
  line(c, 21, 20, 29, 20)
  c.strokeStyle = INK
  c.lineWidth = 4
  const handX = pose === 'poke' ? 22 : pose === 'slash' ? 30 : 35
  const handY = pose === 'ready' ? 29 : 31
  line(c, 15, 27, 10, 31, 14, 33)
  line(c, 32, 26, handX, handY)
  c.lineWidth = 1
  box(c, 9, 30, 7, 5, 1.5, '#96cfc3')
  box(c, handX - 3, handY - 2, 6, 5, 1.5, '#96cfc3')
  // The blade and guard rotate around the grip for the stab and slash poses.
  c.save()
  c.translate(handX, handY)
  c.rotate(pose === 'poke' ? 1 : pose === 'slash' ? 0.45 : 0)
  box(c, -1.5, -2, 3, 9, 0.8, '#594a59')
  c.strokeStyle = '#96cfc3'
  line(c, -1, 1, 1, 2)
  line(c, -1, 4, 1, 5)
  c.strokeStyle = INK
  poly(c, '#d6b86b', -5, -3, 4, -3, 4, -1, -5, -1)
  c.beginPath()
  c.moveTo(-1, -4)
  c.quadraticCurveTo(0, -19, 7, -25)
  c.quadraticCurveTo(4, -15, 2, -4)
  c.closePath()
  c.fillStyle = '#dbe7ee'
  c.fill()
  c.stroke()
  c.strokeStyle = '#fff'
  line(c, 1, -6, 3, -16, 6, -22)
  c.restore()
}

export function buildNinjaSprite(color?: string, pose: NinjaPose = 'ready', step?: number) {
  return buildSprite((c) => ninja(c, pose, step), color, [16, 8, 17], false)
}

export function drawKatanaSlash(c: C, progress: number) {
  c.save()
  c.strokeStyle = '#b5e3e8'
  c.lineWidth = 8
  c.globalAlpha = Math.sin(progress * Math.PI) * 0.9
  c.beginPath()
  c.arc(7, -24, 30, -1.5 + progress, 0.5 + progress)
  c.stroke()
  c.strokeStyle = '#fff'
  c.lineWidth = 1.5
  c.stroke()
  c.restore()
}

export function drawKatanaImpact(c: C, x: number, y: number, angle: number, progress: number) {
  c.save()
  c.translate(x, y - 14)
  c.rotate(angle)
  c.globalAlpha = 1 - progress
  const radius = 26 + progress * 16
  c.beginPath()
  c.moveTo(-radius * 0.7, -radius)
  c.bezierCurveTo(radius * 1.2, -radius * 0.6, radius * 1.2, radius * 0.6, -radius * 0.7, radius)
  c.quadraticCurveTo(radius * 0.55, 0, -radius * 0.7, -radius)
  c.closePath()
  c.fillStyle = '#f1ffff'
  c.fill()
  c.strokeStyle = '#67aaa7'
  c.lineWidth = 1.5
  c.stroke()
  c.strokeStyle = '#a1ded5'
  c.lineWidth = 2
  for (const side of [-1, 1]) {
    line(c, radius * 0.7, side * 9, radius * 1.2, side * 18)
    line(c, 1, side * radius * 0.8, 5, side * radius * 1.15)
  }
  c.restore()
}

export function drawShuriken(c: C, x: number, y: number, angle: number) {
  c.save()
  c.translate(x, y - 10)
  c.rotate(angle)
  c.strokeStyle = INK
  c.fillStyle = '#c4d0de'
  c.lineWidth = 1.1
  c.beginPath()
  for (let k = 0; k < 8; k++) {
    const angle = k * Math.PI / 4, radius = k & 1 ? 1.7 : 5.5
    if (k === 0) c.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else c.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  c.closePath()
  c.fill()
  c.stroke()
  c.restore()
}

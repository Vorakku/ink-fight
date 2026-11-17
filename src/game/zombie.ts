import { box, buildSprite, ellipse, INK, legs, line, poly, type C } from './art.ts'

export const ZOMBIE = {
  name: 'Zombie',
  blurb: 'Shambles over and bites. Survive it and join the other side, a bit green',
  color: '#86a86a', radius: 9, hp: 90, speed: 95, damage: 7,
  range: 4, cooldown: 0.75, knockback: 30, spacing: 24, size: 1, scare: 0,
} as const
export const ZOMBIE_INFECTION = 2

// The original outstretched arms, ragged shirt and mismatched vacant eyes.
function zombie(c: C, step?: number) {
  const rot = '#9cc47e'
  legs(c, 19, 28, step)
  c.save()
  c.lineWidth = 7
  line(c, 22, 25, 40, 24)
  c.strokeStyle = rot
  c.lineWidth = 3.5
  line(c, 22, 25, 40, 24)
  c.restore()
  box(c, 15, 22, 17, 16, 6, '#7d8f9e')
  poly(c, '#7d8f9e', 15, 34, 32, 34, 32, 40, 29, 37, 26, 40, 23, 37, 20, 40, 17, 37, 15, 39)
  ellipse(c, 24, 14, 8, 8, rot)
  c.save()
  c.lineWidth = 1.2
  line(c, 19, 9, 23, 7.5)
  for (const x of [20, 22]) line(c, x, 7.6, x + 0.6, 9.6)
  c.restore()
  ellipse(c, 23.5, 13.5, 2.6, 2.6, '#e4ecb8')
  ellipse(c, 29, 14, 1.8, 1.8, '#e4ecb8')
  for (const [x, y, radius, color] of [[23, 14, 0.9, INK], [28.7, 14.4, 0.7, INK], [19, 26, 1.6, '#6c8a55']] as const) {
    c.fillStyle = color
    c.beginPath()
    c.arc(x, y, radius, 0, Math.PI * 2)
    c.fill()
  }
  line(c, 22, 19, 24, 18, 26, 19.5, 28, 18.5)
}

export function buildZombieSprite(color?: string, step?: number) {
  return buildSprite((c) => zombie(c, step), color, [18, 22, 11])
}

export function buildZombieVariant(sprite: HTMLCanvasElement) {
  const canvas = document.createElement('canvas')
  canvas.width = sprite.width
  canvas.height = sprite.height
  const c = canvas.getContext('2d')!
  c.drawImage(sprite, 0, 0)
  c.globalCompositeOperation = 'source-atop'
  c.fillStyle = 'rgba(112,150,82,.48)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

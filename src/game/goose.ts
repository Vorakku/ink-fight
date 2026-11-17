import { buildSprite, ellipse, INK, legs, line, poly, type C } from './art.ts'

// Honk's artwork migrated from main, with reduced peck damage for V2.
export const GOOSE = {
  name: 'Honk',
  blurb: 'Might fly into your face. Definitely honks',
  radius: 9, hp: 45, speed: 150, damage: 5,
  range: 3, cooldown: 0.3, knockback: 40, spacing: 22, scare: 0.35,
} as const

export const GOOSE_SWOOP = { chance: 0.25, range: 120, cooldown: 2, flight: 0.35 } as const

function goose(c: C, flying: boolean, flap: number, step?: number) {
  c.save()
  c.strokeStyle = '#f08c1b'
  if (flying) {
    line(c, 19, 36, 14, 39, 11, 38)
    line(c, 25, 36, 20, 40, 17, 39)
  } else legs(c, 19, 25, step)
  c.restore()
  poly(c, '#fff', 10, 30, 4, 24, 12, 26) // tail
  ellipse(c, 21, 31, 12, 8.5, '#fff')
  c.save() // neck: fat ink stroke with a white one on top
  c.lineWidth = 9
  line(c, 29, 28, 33, 13)
  c.strokeStyle = '#fff'
  c.lineWidth = 4.5
  line(c, 29, 28, 33, 13)
  c.restore()
  ellipse(c, 34, 12, 5.5, 5.5, '#fff')
  poly(c, '#f08c1b', 38.5, 9, 46.5, 10.5, 39, 12.5) // beak, mid-honk
  poly(c, '#f08c1b', 38.5, 13.5, 44.5, 16.5, 37.5, 16)
  c.save()
  c.lineWidth = 1.4
  ellipse(c, 35, 11, 2.2, 2.2, '#fff')
  c.beginPath()
  c.arc(35 + 2.2 * 0.3, 11, 1.1, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.restore()
  line(c, 31.5, 6.5, 38, 8.5)
  if (flying) {
    c.save()
    c.translate(23, 29)
    c.scale(1, 0.2 + flap * 0.8)
    c.translate(-23, -29)
    poly(c, '#fff', 14, 32, 5, 15, 12, 18, 11, 10, 18, 15, 21, 11, 25, 28)
    line(c, 12, 20, 19, 29)
    line(c, 16, 18, 22, 27)
    c.restore()
  } else {
    c.beginPath() // wing
    c.arc(19, 30, 6, Math.PI * 0.1, Math.PI * 0.9)
    c.stroke()
  }
}

export function buildGooseSprite(color?: string, flying = false, flap = 1, step?: number) {
  return buildSprite((c) => goose(c, flying, flap, step), color, [29, 9, 10], !flying)
}

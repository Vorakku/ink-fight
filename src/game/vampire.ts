import { box, buildSprite, ellipse, eye, leg, line, opposite, poly, type C } from './art.ts'

export const VAMPIRE = {
  name: 'Count Chomp',
  blurb: 'Spots supper from afar, swoops in as a bat, then bites to heal. Fire makes him toast',
  color: '#794f85', radius: 10, hp: 90, speed: 65, damage: 16,
  range: 5, cooldown: 0.6, knockback: 12, spacing: 30, size: 1, detection: 480,
} as const
export const VAMPIRE_BAT = { speed: 290, height: 18, landing: 10, takeoff: 35 } as const
export const VAMPIRE_FIRE_WEAKNESS = 8

function vampire(c: C, step?: number) {
  // The original oversized collar, formal shoes and smug little fangs.
  poly(c, '#36263f', 10, 18, 32, 18, 39, 42, 9, 42)
  poly(c, '#a83351', 12, 20, 24, 28, 34, 20, 31, 38, 17, 38)
  leg(c, step, 20, 37, () => line(c, 20, 37, 20, 44, 24, 44))
  leg(c, opposite(step), 29, 37, () => line(c, 29, 37, 29, 44, 33, 44))
  box(c, 19, 23, 12, 15, 3, '#f3e9da')
  poly(c, '#a83351', 23, 25, 27, 27, 23, 29)
  poly(c, '#a83351', 31, 25, 27, 27, 31, 29)
  ellipse(c, 27, 15, 10, 10, '#dfd9ed')
  poly(c, '#36263f', 17, 13, 18, 5, 26, 3, 35, 6, 36, 13, 29, 8, 26, 13, 23, 8)
  eye(c, 25, 15, 2.5, 1)
  eye(c, 32, 15, 2.5, 1)
  line(c, 24, 20, 33, 20)
  poly(c, '#fff', 25, 20, 28, 20, 26.5, 24)
  poly(c, '#fff', 30, 20, 33, 20, 31.5, 24)
}

function bat(c: C, flap: number) {
  poly(c, '#584069', 23, 29, 4, 18, 7, 31, 13, 28, 17, 35)
  ellipse(c, 25, 29, 7, 8, '#584069')
  poly(c, '#584069', 21, 21, 19, 12, 26, 20, 30, 13, 33, 24)
  ellipse(c, 28, 24, 7, 6, '#584069')
  eye(c, 27, 23, 2.3, 1)
  eye(c, 32, 23, 2, 0.9)
  poly(c, '#fff', 29, 28, 32, 28, 30.5, 31)
  c.save()
  c.translate(23, 27)
  c.scale(1, 0.2 + flap * 0.8)
  c.translate(-23, -27)
  poly(c, '#794f85', 22, 27, 29, 15, 44, 9, 42, 25, 37, 22, 34, 30, 29, 27, 25, 34)
  c.lineWidth = 1
  line(c, 23, 27, 37, 22, 44, 9)
  line(c, 23, 27, 34, 30)
  c.restore()
}

export function buildVampireSprite(color?: string, flap?: number, step?: number) {
  return buildSprite(flap === undefined ? (c) => vampire(c, step) : (c) => bat(c, flap), color,
    flap === undefined ? [20, 25, 10] : [22, 29, 9], flap === undefined)
}

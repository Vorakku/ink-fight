import { buildSprite, ellipse, eye, leg, line, opposite, poly, type C } from './art.ts'

export const ANT = {
  name: 'Ant',
  blurb: 'Ten build a base. More workers upgrade it. Haul food for recruits; twenty defenders march out one at a time',
  color: '#ad5640', radius: 4, hp: 24, speed: 85, damage: 3,
  range: 2, cooldown: 0.45, knockback: 8, spacing: 14, size: 0.65,
} as const
export const ANTHILL = {
  name: 'Anthill', blurb: 'An evolving fortress with an underground army. Food funds recruits; upgrades unlock soldier castes',
  color: '#b98b61', radius: 16, hp: 200, speed: 0, damage: 0,
  range: 0, cooldown: 4, knockback: 0, spacing: 70, size: 1,
} as const
export const COLONY_BUILD = 3
export const ANT_ARMY = { defenders: 20, exit: 0.25, tiers: 5, food: 4 } as const
export const ANT_TANK = {
  ...ANT, name: 'Tank Ant', blurb: 'Armored base guard. Provoke draws nearby enemies into its jaws',
  color: '#66513f', radius: 11, hp: 340, speed: 56, damage: 15,
  range: 5, cooldown: 0.85, knockback: 45, size: 1.65,
} as const
export const ANT_SLASHER = {
  ...ANT, name: 'Slasher Ant', blurb: 'Fast assault soldier with serrated jaws and bleeding bites',
  color: '#953c38', radius: 6, hp: 85, speed: 115, damage: 17,
  range: 6, cooldown: 0.5, knockback: 12, size: 0.95,
} as const
export const ANT_FLY = {
  ...ANT, name: 'Flying Ant', blurb: 'A winged carrier that airlifts soldiers to the front',
  color: '#ac7850', radius: 6, hp: 65, speed: 160, damage: 5,
  range: 4, cooldown: 0.7, knockback: 8, size: 1,
} as const
export const ANT_PROVOKE = { radius: 125, duration: 3, cooldown: 7, armor: 0.3 } as const
export const ANT_QUEEN = {
  name: 'Ant Queen', blurb: 'Earned at the fourth base tier. Sheltered inside, she doubles the ordinary brood',
  color: ANT.color, radius: 12, hp: 180, speed: 45, damage: 9,
  range: 4, cooldown: 0.8, knockback: 25, spacing: 36, size: 1.35,
} as const

function ant(c: C, step?: number) {
  c.save()
  c.lineWidth = 1.5
  // Tripod gait: the middle leg steps with the outer legs of the other side.
  for (let k = 0; k < 3; k++) {
    const x = 16 + k * 7, s = k === 1 ? opposite(step) : step
    leg(c, s, x, 33, () => line(c, x, 33, x - 5, 38, x - 7, 43), 0.3, 1.2)
    leg(c, opposite(s), x + 1, 34, () => line(c, x + 1, 34, x + 5, 39, x + 8, 42), 0.3, 1.2)
  }
  c.restore()
  ellipse(c, 13, 31, 9, 7, '#9b4535')
  ellipse(c, 25, 31, 6, 5, '#ad5640')
  ellipse(c, 35, 26, 7, 7, '#ad5640')
  ellipse(c, 11, 29, 4, 2, 'rgba(255,255,255,.2)')
  line(c, 32, 20, 28, 14, 25, 14)
  line(c, 37, 19, 40, 13, 44, 12)
  eye(c, 37, 24, 2.3, 1)
  line(c, 35, 21, 40, 22)
  line(c, 40, 29, 44, 30, 42, 33)
}

function anthill(c: C) {
  poly(c, '#b98b61', 4, 42, 8, 35, 13, 32, 18, 23, 23, 20, 29, 25, 34, 34, 40, 36, 45, 43)
  poly(c, '#d2aa7c', 8, 38, 16, 30, 20, 24, 23, 22, 22, 30, 18, 36)
  ellipse(c, 28, 37, 5.5, 6, '#4e342d')
  c.save()
  c.lineWidth = 1
  line(c, 10, 40, 15, 38)
  line(c, 26, 27, 30, 30)
  line(c, 35, 38, 39, 40)
  ellipse(c, 20, 34, 1, 1, '#805b43')
  ellipse(c, 17, 40, 0.9, 0.9, '#805b43')
  c.restore()
}

export function buildAntSprite(color?: string, step?: number) {
  return buildSprite((c) => ant(c, step), color, [20, 29, 9])
}

export function buildAnthillSprite(color?: string, tier = 1) {
  return buildSprite((c) => {
    anthill(c)
    if (tier >= 2) {
      c.lineWidth = 1.2
      for (const x of [5, 11, 17, 36, 42]) {
        poly(c, '#79583d', x - 1, 42, x - 2, 31, x, 27, x + 2, 32, x + 1, 43)
      }
      line(c, 4, 37, 19, 37)
      line(c, 35, 37, 44, 37)
    }
    if (tier >= 3) {
      c.strokeStyle = '#efe1be'
      c.lineWidth = 2.6
      line(c, 9, 29, 19, 22)
      line(c, 10, 21, 18, 30)
      for (const [x, y] of [[9, 29], [19, 22], [10, 21], [18, 30]]) ellipse(c, x, y, 1.2, 1.2, '#efe1be')
      c.strokeStyle = '#221f33'
    }
    if (tier >= 4) {
      c.lineWidth = 1.1
      // Horned dragon skull, with hollow sockets and a long snout above the gate.
      poly(c, '#d9ccb0', 20, 18, 16, 9, 22, 12, 25, 8, 30, 9, 36, 6, 33, 17, 30, 21, 25, 24, 22, 21)
      poly(c, '#f5e9cb', 22, 14, 29, 12, 32, 16, 27, 21, 23, 21)
      poly(c, '#352f2d', 21, 15, 25, 16, 24, 19, 21, 18)
      poly(c, '#352f2d', 28, 14, 31, 14, 30, 17, 27, 18)
      line(c, 25, 21, 26, 19, 28, 20)
    }
    if (tier >= 5) {
      // Paired T-Rex hands: wrist bones and two hooked claws on each side.
      for (const side of [-1, 1]) {
        c.save()
        c.translate(24, 0); c.scale(side, 1)
        poly(c, '#e3d6b9', 13, 28, 16, 17, 19, 15, 20, 18, 17, 22, 17, 29)
        poly(c, '#eee2c8', 18, 18, 20, 11, 23, 10, 22, 15, 20, 20)
        poly(c, '#eee2c8', 16, 19, 16, 12, 19, 9, 18, 15, 18, 21)
        c.restore()
      }
      poly(c, '#756150', 20, 29, 24, 25, 30, 26, 34, 31, 32, 39, 31, 33, 27, 30, 24, 33, 22, 39)
    }
  }, color, [13, 36, 7])
}

export function buildAntTankSprite(color?: string, step?: number) {
  return buildSprite((c) => {
    ant(c, step)
    ellipse(c, 12, 29, 10, 8, '#66513f')
    ellipse(c, 24, 29, 7, 7, '#857157')
    ellipse(c, 35, 25, 8, 8, '#66513f')
    poly(c, '#bca77f', 4, 25, 8, 21, 15, 22, 21, 26, 18, 29, 8, 29)
    line(c, 12, 23, 12, 28)
    poly(c, '#d2bd91', 39, 28, 46, 28, 44, 34, 40, 32)
    eye(c, 38, 24, 2.2, 1)
    line(c, 34, 20, 41, 22)
  }, color, [19, 27, 9])
}

export function buildAntSlasherSprite(color?: string, step?: number) {
  return buildSprite((c) => {
    ant(c, step)
    poly(c, '#e8d6aa', 38, 27, 46, 25, 46, 31, 42, 36, 43, 30)
    poly(c, '#fff0c7', 36, 30, 42, 32, 45, 39, 38, 35, 36, 33)
    poly(c, '#742d35', 19, 26, 22, 21, 25, 26, 29, 22, 31, 27)
    line(c, 34, 20, 40, 22)
  }, color, [19, 28, 9])
}

export function buildAntFlySprite(color?: string, flap = 1, step?: number) {
  return buildSprite((c) => {
    const lift = flap * 13
    c.save()
    c.lineWidth = 1
    for (const side of [-1, 1]) {
      // Both pairs pivot at the thorax through an obvious upstroke and downstroke.
      poly(c, 'rgba(190,220,210,.7)', 22, 30, 22 + side * 13, 29 - lift * 0.65,
        22 + side * 15, 34 - lift * 0.65, 22 + side * 6, 34, 22, 32)
      poly(c, 'rgba(214,235,226,.85)', 24, 28, 24 + side * 18, 25 - lift, 24 + side * 20, 21 - lift,
        24 + side * 11, 18 - lift, 23, 26)
      line(c, 24, 28, 24 + side * 16, 23 - lift)
    }
    c.restore()
    ant(c, step)
  }, color, [20, 29, 9])
}

export function buildAntQueenSprite(color?: string, step?: number) {
  return buildSprite((c) => {
    ant(c, step)
    poly(c, '#f4c955', 25, 18, 23, 8, 29, 12, 33, 5, 37, 12, 43, 8, 41, 18)
    ellipse(c, 33, 14, 1.6, 1.6, '#cf4568')
  }, color, [20, 29, 9])
}

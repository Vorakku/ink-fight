import { buildSprite, ellipse, eye, INK, legs, line, opposite, poly, stride, type C } from './art.ts'
import { drawDragonLightning, type DragonElement } from './dragon.ts'

const BREATH_COLORS = {
  fire: { glow: 'rgba(255,173,44,0.25)', clear: 'rgba(255,102,24,0)',
    root: ['#ffdf76', '#fff2af', '#fffde8'], middle: ['#ff9d28', '#ffd34b', '#fff3ae'], tip: ['#ed4c20', '#ff9c26', '#ffd35b'] },
  ice: { glow: 'rgba(94,210,255,0.25)', clear: 'rgba(94,210,255,0)',
    root: ['#d5faff', '#effdff', '#ffffff'], middle: ['#63cdeb', '#b3f1ff', '#effdff'], tip: ['#4796d4', '#74d8f5', '#c5f4ff'] },
} as const

export const PHOENIX = {
  name: 'Encore',
  blurb: 'Resists fire and heals 20 HP per kill. Evolves at 50 and 100 kills into a fireball caster and an Encore legend. Reborn once',
  radius: 12, hp: 400, speed: 90, damage: 4, range: 85,
  cooldown: 0.15, knockback: 10, spacing: 44, size: 1.25, color: '#ff6b2c',
} as const
export const PHOENIX_CHICK = {
  ...PHOENIX, hp: 70, speed: 190, damage: 4, range: 3, cooldown: 0.16, knockback: 15, scare: 0,
} as const
export const PHOENIX_REBIRTH = { egg: 2.5, chick: 8 } as const
export const PHOENIX_FIRE = { burn: 2, chickBurn: 1.5, damagePerSecond: 9, heal: 10, radius: 80, halfAngle: Math.PI / 3 } as const
export const PHOENIX_DIVE = {
  opening: 2, cooldown: 10, rise: 0.65, hover: 0.2, fall: 0.25, height: 180,
  range: 300, radius: 140, damage: 100, knockback: 160, burn: 6,
  fireLife: 3, fireDamage: 12, fireTick: 0.3,
} as const
export type PhoenixForm = 0 | 1 | 2
export const PHOENIX_FORMS = [
  { name: 'Phoenix', kills: 0, hp: PHOENIX.hp, damage: PHOENIX.damage, range: PHOENIX.range, speed: PHOENIX.speed, size: PHOENIX.size, radius: PHOENIX.radius },
  { name: 'Adult Phoenix', kills: 50, hp: 650, damage: 5, range: 105, speed: 100, size: 1.8, radius: 16 },
  { name: 'Legend Phoenix', kills: 100, hp: 900, damage: 6, range: 120, speed: 110, size: 2.1, radius: 18 },
] as const
export const PHOENIX_FIRE_RESISTANCE = 0.6
export const PHOENIX_KILL_HEAL = 20
export const PHOENIX_BARRAGE = {
  cooldown: 9, rise: 0.65, volley: 0.8, fall: 0.4, height: 200, range: 360,
  count: 8, flight: 0.75, spread: 95, radius: 52, damage: 36, knockback: 35,
  burn: 4, fireLife: 4, fireDamage: 12,
} as const
export const PHOENIX_ENCORE = {
  cooldown: 18, rise: 0.7, pass: 0.7, waves: 3, fall: 0.4, height: 160,
  range: 400, length: 340, radius: 44, damage: 50, knockback: 25,
  spacing: 40, burn: 5, fireLife: 4, fireDamage: 15,
} as const

function feet(c: C, x1: number, x2: number, step?: number) {
  c.save()
  c.strokeStyle = '#f08c1b'
  legs(c, x1, x2, step)
  c.restore()
}

// Feather shafts and overlapping vanes give the simplified shapes bird anatomy.
function feather(c: C, x: number, y: number, tx: number, ty: number, width: number, color: string | CanvasGradient) {
  const dx = tx - x, dy = ty - y, distance = Math.hypot(dx, dy) || 1
  const nx = -dy / distance * width, ny = dx / distance * width
  c.beginPath()
  c.moveTo(x, y)
  c.quadraticCurveTo((x + tx) / 2 + nx, (y + ty) / 2 + ny, tx, ty)
  c.quadraticCurveTo((x + tx) / 2 - nx * 0.6, (y + ty) / 2 - ny * 0.6, x, y)
  c.closePath()
  c.fillStyle = color
  c.fill(); c.stroke()
  c.save()
  c.strokeStyle = '#ffd783'
  c.lineWidth = 0.3
  line(c, x + dx * 0.15, y + dy * 0.15, x + dx * 0.82, y + dy * 0.82)
  c.restore()
}

function phoenix(c: C, flap?: number, form: PhoenixForm = 0, step?: number) {
  const plumage = (color: string, red: string, gold: string) => {
    if (form !== 2) return color
    const gradient = c.createLinearGradient(3, 44, 40, 5)
    gradient.addColorStop(0, red)
    gradient.addColorStop(0.52, color)
    gradient.addColorStop(1, gold)
    return gradient
  }
  const red = plumage('#c43b29', '#a51f35', '#f5c34d')
  const dark = plumage('#9a3029', '#771c30', '#c98036')
  const orange = plumage('#f16a29', '#d82c38', '#ffe69a')
  const gold = plumage('#ffc344', '#ed4b38', '#fff0ac')
  const cream = plumage('#fff0ad', '#ff9753', '#fff8d2')
  const flying = flap !== undefined
  c.save()
  c.lineWidth = 1.1
  if (form > 0) {
    // Tapered body, swept flight feathers and trailing streamers distinguish adults.
    c.translate(2, -2)
    c.scale(0.96, 1.04)
    c.lineWidth = 0.7
    for (let k = 0; k < 3; k++) {
      feather(c, 19 + k * 2, 29, 1 + k * 4, 45 - k, 1.4, k === 1 ? cream : gold)
      if (flap !== undefined) feather(c, 21, 25, 1 + k * 3, 3 + k * 4, 1.8, k === 1 ? cream : gold)
    }
  }

  // Long tail feathers grow from the rump and sweep behind the bird's stance.
  c.beginPath()
  c.moveTo(18, 28)
  c.bezierCurveTo(14, 34, 11, 38, 5, 38)
  c.quadraticCurveTo(2, 37, 3, 34)
  c.bezierCurveTo(-1, 39, 5, 44, 12, 40)
  c.quadraticCurveTo(21, 37, 23, 30)
  c.closePath()
  c.fillStyle = dark
  c.fill(); c.stroke()
  c.beginPath()
  c.moveTo(20, 30)
  c.bezierCurveTo(18, 37, 16, 43, 8, 44)
  c.quadraticCurveTo(4, 45, 3, 42)
  c.quadraticCurveTo(5, 48, 13, 45)
  c.bezierCurveTo(23, 42, 25, 36, 25, 31)
  c.closePath()
  c.fillStyle = red
  c.fill(); c.stroke()
  c.lineWidth = 0.7
  feather(c, 19, 31, 5, 41, 2.4, orange)
  feather(c, 22, 31, 12, 45, 2.6, gold)
  feather(c, 23, 31, 20, 44, 2.1, orange)
  c.strokeStyle = '#ffe395'
  c.lineWidth = 0.4
  c.beginPath()
  c.moveTo(20, 32)
  c.bezierCurveTo(16, 40, 10, 44, 6, 42)
  c.stroke()

  // The far wing has its own shoulder and perspective, rather than mirroring a fan.
  c.save()
  c.strokeStyle = dark
  c.lineWidth = 0.85
  if (flying) {
    c.translate(28, 25)
    c.scale(1, 0.6 + flap * 0.3)
    c.translate(-28, -25)
    poly(c, red, 27, 27, 31, 16, 40, 7, 44, 5, 42, 13, 46, 11,
      43, 20, 45, 20, 39, 27, 33, 29)
    for (const [tx, ty] of [[43, 6], [46, 12], [44, 20], [39, 26]]) {
      feather(c, 29, 25, tx, ty, 2.3, '#dc612b')
    }
    feather(c, 28, 25, 37, 17, 2.2, gold)
  } else {
    poly(c, red, 21, 26, 24, 20, 29, 21, 32, 28, 28, 31, 23, 29)
    feather(c, 26, 23, 29, 30, 1.8, '#e88a32')
  }
  c.restore()

  const talon = (x: number, y: number, far: boolean) => {
    c.save()
    stride(c, far ? step : opposite(step), x, y)
    c.translate(x, y)
    if (far) c.scale(0.85, 0.9)
    const ankle = flying ? 5 : 7
    for (const [width, color] of [[2.5, INK], [1.45, far ? '#bd7736' : '#e8a344']] as const) {
      c.strokeStyle = color
      c.lineWidth = width
      line(c, 0, 0, -1, 3, 0, ankle)
      line(c, 0, ankle, 3, ankle, 4.5, ankle + 1)
      line(c, 0, ankle, 1, ankle + 1.5, 3.5, ankle + 2)
      line(c, 0, ankle, -2.5, ankle + 0.5, -3.5, ankle + 1.5)
    }
    c.strokeStyle = '#93632f'
    c.lineWidth = 0.35
    for (const y of [2.5, 4, 5.5]) line(c, -1.5, y, 0, y + 0.3)
    c.strokeStyle = INK
    c.lineWidth = 0.5
    poly(c, cream, 3.5, ankle, 5.3, ankle + 0.5, 4.5, ankle + 2)
    poly(c, cream, 2.6, ankle + 1.4, 4.3, ankle + 1.8, 3.4, ankle + 3)
    c.restore()
  }
  talon(27, 32, true)

  // One continuous rump, keel and rising neck makes the adult read as a firebird.
  c.strokeStyle = INK
  c.lineWidth = 1.3
  c.beginPath()
  c.moveTo(15, 27)
  c.bezierCurveTo(19, 23, 24, 23, 27, 24)
  c.quadraticCurveTo(29, 21, 30, 16)
  c.lineTo(36, 17)
  c.bezierCurveTo(33, 22, 35, 27, 32, 32)
  c.bezierCurveTo(29, 37, 21, 37, 16, 33)
  c.quadraticCurveTo(12, 30, 15, 27)
  c.closePath()
  c.fillStyle = orange
  c.fill(); c.stroke()
  c.strokeStyle = '#b74a28'
  c.lineWidth = 0.65
  feather(c, 31, 18, 27, 29, 2.8, gold)
  feather(c, 33, 20, 31, 31, 2.5, '#ffda70')
  feather(c, 29, 26, 26, 35, 2.5, cream)
  feather(c, 25, 28, 21, 35, 2, gold)
  for (const [x, y] of [[29, 23], [31, 26], [28, 29], [30, 31], [25, 32]]) {
    c.beginPath()
    c.moveTo(x - 1, y)
    c.quadraticCurveTo(x, y + 1.6, x + 1.1, y + 0.2)
    c.stroke()
  }
  talon(23, 33, false)

  // A folded flight surface on the ground; jointed primary and secondary rows aloft.
  c.save()
  c.strokeStyle = dark
  c.lineWidth = 1
  if (flying) {
    c.translate(23, 26)
    c.scale(1, 0.6 + flap * 0.35)
    c.translate(-23, -26)
    poly(c, red, 24, 27, 18, 15, 9, 4, 3, 2, 7, 12, 2, 10,
      4, 19, 2, 19, 7, 27, 12, 27, 16, 32, 22, 29)
    c.lineWidth = 0.7
    for (const [tx, ty] of [[4, 3], [2, 10], [3, 18], [6, 25], [12, 30]]) {
      feather(c, 18, 23, tx, ty, 2.6, orange)
    }
    for (const [tx, ty] of [[10, 12], [10, 19], [15, 26], [19, 30]]) {
      feather(c, 24, 26, tx, ty, 2.5, gold)
    }
    feather(c, 23, 25, 17, 19, 2.6, '#ffe394')
  } else {
    c.beginPath()
    c.moveTo(24, 23)
    c.bezierCurveTo(19, 20, 13, 23, 13, 28)
    c.lineTo(10, 32)
    c.lineTo(15, 32)
    c.lineTo(14, 35)
    c.lineTo(18, 34)
    c.lineTo(18, 36)
    c.bezierCurveTo(25, 33, 28, 27, 24, 23)
    c.closePath()
    c.fillStyle = red
    c.fill(); c.stroke()
    c.lineWidth = 0.65
    feather(c, 23, 25, 12, 32, 2, orange)
    feather(c, 24, 26, 16, 35, 2.1, '#e89132')
    feather(c, 24, 27, 20, 35, 1.8, gold)
    feather(c, 23, 24, 16, 28, 2.2, gold)
    c.strokeStyle = '#b65429'
    c.lineWidth = 0.55
    for (const [x, y] of [[18, 25], [21, 24], [24, 25], [17, 28], [20, 27], [23, 28]]) {
      c.beginPath()
      c.moveTo(x - 1.2, y)
      c.quadraticCurveTo(x, y + 1.8, x + 1.4, y + 0.2)
      c.stroke()
    }
  }
  c.restore()

  // Swept hackle feathers connect a small raptor head to the chest.
  c.strokeStyle = '#a13b26'
  c.lineWidth = 0.7
  feather(c, 32, 16, 26, 25, 2.4, gold)
  feather(c, 34, 17, 30, 27, 1.9, '#ffe18a')
  c.strokeStyle = INK
  c.lineWidth = 1.1
  c.beginPath()
  c.moveTo(30, 14)
  c.quadraticCurveTo(32, 10.5, 36, 12)
  c.quadraticCurveTo(39, 12.7, 40, 16)
  c.lineTo(37, 19)
  c.lineTo(33, 20)
  c.quadraticCurveTo(29, 19, 30, 14)
  c.closePath()
  c.fillStyle = orange
  c.fill(); c.stroke()

  c.strokeStyle = dark
  c.lineWidth = 0.7
  c.beginPath()
  c.moveTo(32, 13)
  c.bezierCurveTo(28, 10, 25, 12, 23, 7)
  c.quadraticCurveTo(27, 9, 25, 3)
  c.quadraticCurveTo(30, 6, 33, 11)
  c.lineTo(32, 6)
  c.quadraticCurveTo(36, 9, 36, 13)
  c.closePath()
  c.fillStyle = red
  c.fill(); c.stroke()
  c.strokeStyle = '#cf7a2d'
  c.lineWidth = 0.45
  feather(c, 32, 12, 27, 7, 1.6, gold)
  feather(c, 34, 12, 33, 8, 1.1, '#ffe18a')

  // The hooked beak retains the fire-breath attachment at (45,18).
  c.strokeStyle = INK
  c.lineWidth = 0.75
  poly(c, '#dfb464', 38, 14.5, 42, 15.2, 45, 17, 46, 19, 43, 20,
    43, 18, 38, 18.3)
  poly(c, '#9e7444', 38, 18.4, 43, 18, 41, 20, 38, 20)
  c.strokeStyle = '#bc843b'
  c.lineWidth = 0.4
  line(c, 39, 15.5, 42.5, 16.6)
  ellipse(c, 40, 16.2, 0.35, 0.3, '#68492d')
  c.strokeStyle = '#763b28'
  c.lineWidth = 0.6
  ellipse(c, 34.4, 15.5, 1.8, 1.25, '#ffea9a')
  ellipse(c, 35, 15.4, 0.55, 0.95, INK)
  c.fillStyle = '#fff9e8'
  c.beginPath(); c.arc(35.2, 15, 0.3, 0, Math.PI * 2); c.fill()
  c.strokeStyle = '#9c3927'
  c.lineWidth = 1
  line(c, 31.7, 13.3, 36.2, 14.3)
  c.strokeStyle = cream
  c.lineWidth = 0.45
  line(c, 30.5, 15.5, 31, 14, 32, 13.7)
  c.restore()
}

function egg(c: C) {
  ellipse(c, 24, 30, 10, 13, '#ffd98a')
  c.lineWidth = 1.4
  poly(c, '#ff6b2c', 16, 36, 19, 30, 22, 35, 24.5, 28, 27, 35, 30, 30, 32, 36, 28, 41.5, 20, 41.5)
  for (const x of [20.5, 28]) {
    c.beginPath()
    c.arc(x, 23, 2, 0.15, Math.PI - 0.15)
    c.stroke()
  }
}

function chick(c: C, step?: number) {
  feet(c, 21, 27, step)
  poly(c, '#ff6b2c', 21, 19, 20, 9, 24, 13, 26, 7, 28, 19)
  line(c, 14, 28, 8, 22)
  line(c, 34, 28, 40, 22)
  ellipse(c, 24, 28, 10, 10, '#ffd23f')
  eye(c, 20.5, 26, 3.2, 1.4)
  eye(c, 28.5, 26, 3.2, 1.4)
  line(c, 16.5, 21, 22.5, 23.5)
  line(c, 32.5, 21, 26.5, 23.5)
  poly(c, '#f08c1b', 22.5, 30, 26.5, 30, 24.5, 34.5)
}

export function buildPhoenixSprite(color?: string, pose: 'adult' | 'egg' | 'chick' = 'adult', flap?: number, form: PhoenixForm = 0, step?: number) {
  return buildSprite(pose === 'egg' ? egg : pose === 'chick' ? (c) => chick(c, step) : (c) => phoenix(c, flap, form, step),
    pose === 'egg' ? undefined : color, pose === 'chick' ? [17, 18, 14] : [27, 20, 6],
    pose !== 'adult' || flap === undefined)
}

let glitterLayer: HTMLCanvasElement | undefined

export function drawPhoenixGlitter(c: C, sprite: HTMLCanvasElement, tick: number, id: number) {
  glitterLayer ??= document.createElement('canvas')
  if (glitterLayer.width !== sprite.width || glitterLayer.height !== sprite.height) {
    glitterLayer.width = sprite.width
    glitterLayer.height = sprite.height
  }
  const g = glitterLayer.getContext('2d')!
  g.clearRect(0, 0, glitterLayer.width, glitterLayer.height)
  g.save()
  g.scale(sprite.width / 48, sprite.height / 48)
  const sweep = (tick / 180 + id * 0.17) % 1 * 96 - 48
  const shimmer = g.createLinearGradient(sweep, 40, sweep + 48, 0)
  shimmer.addColorStop(0, 'rgba(224,46,52,.04)')
  shimmer.addColorStop(0.4, 'rgba(241,94,39,.12)')
  shimmer.addColorStop(0.6, 'rgba(255,225,131,.32)')
  shimmer.addColorStop(1, 'rgba(236,61,45,.04)')
  g.fillStyle = shimmer
  g.fillRect(0, 0, 48, 48)
  for (let k = 0; k < 20; k++) {
    const sparkle = Math.max(0, Math.sin(tick * 0.1 + id * 1.7 + k * 2.4)) ** 5
    if (sparkle < 0.08) continue
    const x = 3 + k * 17 % 43, y = 4 + k * 23 % 40
    const size = 0.4 + sparkle * 1.2
    g.globalAlpha = sparkle * 0.95
    g.fillStyle = k % 3 ? '#fff4bd' : '#ffb53f'
    g.beginPath()
    g.moveTo(x, y - size * 1.6); g.lineTo(x + size * 0.5, y)
    g.lineTo(x, y + size * 1.6); g.lineTo(x - size * 0.5, y)
    g.closePath(); g.fill()
  }
  g.restore()
  // Mask the shimmer to this wing pose, keeping gaps between feathers clear.
  g.globalCompositeOperation = 'destination-in'
  g.drawImage(sprite, 0, 0)
  g.globalCompositeOperation = 'source-over'
  c.drawImage(glitterLayer, -24, -44, 48, 48)
}

// `colors` are [outline, body, core]; Mei Yuanzhi's fox talisman burns purple.
export function drawFlame(c: C, x: number, y: number, size: number, colors = ['#bf542c', '#ff9b35', '#ffe08a']) {
  c.save()
  c.translate(x, y)
  c.scale(size, size)
  c.strokeStyle = colors[0]
  c.lineWidth = 0.8
  poly(c, colors[1], -4, 3, -5, -1, -2, -3, -1, -8, 2, -3, 4, -5, 5, 1, 3, 4, -2, 5)
  c.fillStyle = colors[2]
  c.beginPath()
  c.ellipse(0, 1, 2, 3, 0, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

export function drawPhoenixHealing(c: C, x: number, y: number, radius: number, life: number, phase: number) {
  c.save()
  c.strokeStyle = '#d95668'
  c.fillStyle = 'rgba(228,99,110,.07)'
  c.globalAlpha = Math.min(1, life * 3)
  c.lineWidth = 1.5
  c.beginPath()
  c.ellipse(x, y, radius, radius * 0.45, 0, 0, Math.PI * 2)
  c.fill(); c.stroke()
  c.lineWidth = 0.7
  c.beginPath()
  c.ellipse(x, y, radius * 0.86, radius * 0.38, 0, 0, Math.PI * 2)
  c.stroke()
  for (let k = 0; k < 10; k++) {
    const angle = k * 2.399963, distance = radius * (0.25 + k % 3 * 0.25)
    const rise = (1 - life + k / 10 + phase) % 1
    const px = x + Math.cos(angle) * distance
    const py = y + Math.sin(angle) * distance * 0.45 - rise * 38
    const size = 2.5 + rise * 1.5
    c.globalAlpha = Math.sin(rise * Math.PI) * Math.min(1, life * 3)
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(px - size, py); c.lineTo(px + size, py)
    c.moveTo(px, py - size); c.lineTo(px, py + size)
    c.stroke()
  }
  c.restore()
}

export function drawPhoenixFire(c: C, x: number, y: number, radius: number, life: number, time: number) {
  c.save()
  const fade = Math.min(1, life * 2)
  const heat = c.createRadialGradient(x, y, 0, x, y, radius)
  heat.addColorStop(0, 'rgba(255,198,65,.2)')
  heat.addColorStop(0.7, 'rgba(242,99,35,.12)')
  heat.addColorStop(1, 'rgba(242,99,35,0)')
  c.fillStyle = heat
  c.globalAlpha = fade
  c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill()
  for (let k = 0; k < Math.min(24, Math.max(6, Math.ceil(radius / 6))); k++) {
    const angle = k * 2.399963, reach = radius * (0.2 + k % 4 * 0.22)
    const flicker = 0.85 + Math.sin(time * 11 + k * 2.7) * 0.15
    c.globalAlpha = fade * (0.65 + k % 3 * 0.12)
    drawFlame(c, x + Math.cos(angle) * reach, y + Math.sin(angle) * reach, (1.2 + k % 3 * 0.35) * flicker)
  }
  c.restore()
}

export function drawPhoenixBreath(c: C, x: number, y: number, angle: number, length: number, time: number, power: number) {
  if (length <= 0) return
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  const opacity = c.globalAlpha * power
  for (let layer = 0; layer < 3; layer++) {
    const reach = length * (1 - layer * 0.14)
    const spread = PHOENIX_FIRE.halfAngle * (1 - layer * 0.12)
    const heat = c.createRadialGradient(0, 0, 0, 0, 0, reach)
    heat.addColorStop(0, BREATH_COLORS.fire.root[layer])
    heat.addColorStop(0.45, BREATH_COLORS.fire.middle[layer])
    heat.addColorStop(0.82, BREATH_COLORS.fire.tip[layer])
    heat.addColorStop(1, BREATH_COLORS.fire.clear)
    c.fillStyle = heat
    c.globalAlpha = opacity * (0.65 + layer * 0.1)
    c.beginPath(); c.moveTo(0, 0)
    for (let step = 0; step <= 32; step++) {
      const a = -spread + spread * 2 * step / 32
      const ripple = 0.95 + Math.sin(time * 15 - step * 1.7 + layer) * 0.05
      c.lineTo(Math.cos(a) * reach * ripple, Math.sin(a) * reach * ripple)
    }
    c.closePath(); c.fill()
  }
  c.restore()
}

export function drawFireBreath(c: C, x: number, y: number, angle: number, length: number, width: number, time: number, power: number, element: DragonElement = 'fire') {
  if (length <= 0) return
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.globalAlpha *= power
  const opacity = c.globalAlpha
  if (element === 'lightning') {
    drawDragonLightning(c, length, time, 0.88 + Math.sin(time * 18) * 0.12, 0.7)
    c.restore()
    return
  }
  if (element === 'gold') {
    c.lineCap = c.lineJoin = 'round'
    const spread = width * 0.4
    const beam = c.createLinearGradient(0, 0, length, 0)
    beam.addColorStop(0, '#fffef0'); beam.addColorStop(0.35, '#fff5b6')
    beam.addColorStop(0.8, '#ffd254'); beam.addColorStop(1, 'rgba(255,184,45,0)')
    c.beginPath(); c.moveTo(0, -1.5)
    c.quadraticCurveTo(length * 0.35, -spread, length * 0.9, -spread * 0.65)
    c.quadraticCurveTo(length * 1.05, 0, length * 0.9, spread * 0.65)
    c.quadraticCurveTo(length * 0.35, spread, 0, 1.5); c.closePath()
    c.strokeStyle = 'rgba(255,190,46,.2)'; c.lineWidth = 7; c.stroke()
    c.fillStyle = beam; c.fill()
    c.strokeStyle = '#fffce0'; c.lineWidth = 1.8
    line(c, 0, 0, length * 0.93, 0)
    for (let k = 0; k < 5; k++) {
      const travel = (time * 2 + k / 5) % 1
      c.globalAlpha = opacity * Math.sin(travel * Math.PI)
      c.strokeStyle = '#ffeb93'; c.lineWidth = 0.8
      c.beginPath(); c.ellipse(length * travel, 0, 1.2, spread * (0.4 + travel), 0, -Math.PI * 0.7, Math.PI * 0.7); c.stroke()
      c.fillStyle = '#fff8c2'
      c.fillRect(length * travel, Math.sin(k * 2.7 + time * 9) * spread * 1.3, 1.2, 1.2)
    }
    c.restore()
    return
  }
  const colors = BREATH_COLORS[element]
  c.lineCap = c.lineJoin = 'round'
  const glow = c.createRadialGradient(0, 0, 0, 0, 0, 8)
  glow.addColorStop(0, colors.glow)
  glow.addColorStop(1, colors.clear)
  c.fillStyle = glow
  c.fillRect(-8, -8, 16, 16)

  // A single connected plume: waves travel downstream instead of wobbling in place.
  for (let layer = 0; layer < 3; layer++) {
    const reach = length * [1, 0.88, 0.58][layer]
    const spread = width * [1, 0.6, 0.22][layer]
    const heat = c.createLinearGradient(0, 0, reach, 0)
    heat.addColorStop(0, colors.root[layer])
    heat.addColorStop(0.45, colors.middle[layer])
    heat.addColorStop(0.78, colors.tip[layer])
    heat.addColorStop(1, colors.clear)
    c.fillStyle = heat
    c.globalAlpha = opacity * (element === 'ice' ? 0.55 : 0.92)
    c.beginPath()
    let px = 0, py = -1.2
    c.moveTo(px, py)
    for (const side of [-1, 1]) {
      for (let step = 0; step <= 18; step++) {
        const t = side === -1 ? step / 18 : 1 - step / 18
        const phase = time * 17 - t * 10 + layer * 0.8
        const envelope = (1.2 + spread * Math.pow(t, 0.8)) * Math.pow(1 - t, 0.6)
        const ripple = 1 + Math.sin(phase) * 0.18 + Math.sin(phase * 1.8) * 0.08
        const sway = Math.sin(time * 12 - t * 8) * spread * 0.12 * t
        const nx = reach * t, ny = sway + side * envelope * ripple
        c.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2)
        px = nx; py = ny
      }
    }
    c.quadraticCurveTo(px, py, 0, -1.2)
    c.closePath()
    c.fill()
  }

  // Small packets leave the muzzle, spread, then cool and drift off the jet.
  for (let k = 0; k < 10; k++) {
      const travel = (time * 1.65 + k * 0.1) % 1
      const ex = length * travel
      const ey = Math.sin(k * 12.7) * width * travel * 0.65 - travel * travel * width * 0.25
      c.globalAlpha = opacity * Math.sin(travel * Math.PI) * (element === 'ice' ? 0.5 : 0.65)
      c.strokeStyle = colors.root[1]
      c.fillStyle = colors.middle[k % 3]
      c.lineWidth = 0.7
      c.beginPath()
      if (element === 'ice') {
        const radius = 0.8 + travel * 1.8
        for (let arm = 0; arm < 3; arm++) {
          const a = arm * Math.PI / 3 + travel
          c.moveTo(ex - Math.cos(a) * radius, ey - Math.sin(a) * radius)
          c.lineTo(ex + Math.cos(a) * radius, ey + Math.sin(a) * radius)
        }
        c.stroke()
      } else {
        c.ellipse(ex, ey, 1.4 + travel * 2, 0.6 + travel, -0.2, 0, Math.PI * 2)
        c.fill()
      }
  }
  c.restore()
}

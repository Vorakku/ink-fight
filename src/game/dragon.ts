import { box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

export const DRAGON = {
  name: 'Scorch', blurb: 'Evolves every 50 progress. Eating bigger prey gives more progress and permanent health',
  color: '#3fae6b', radius: 16, hp: 700, speed: 42, damage: 5,
  range: 95, cooldown: 0.15, knockback: 25, spacing: 70, size: 1.7,
} as const
export const DRAGON_FIRE = { burn: 3.5 } as const
export type DragonForm = 0 | 1 | 2 | 3
export type DragonElement = 'fire' | 'ice' | 'lightning' | 'gold'
export const DRAGON_FORMS = [
  { name: 'Fire Dragon', progress: 0, element: 'fire', hp: 700, damage: 5, range: 95, scale: 1,
    body: '#3fae6b', shade: '#287d53', light: '#82ce83', wing: '#b99b65', belly: '#c8e6a0', horns: '#e6ba66' },
  { name: 'Ice Dragon', progress: 50, element: 'ice', hp: 900, damage: 6, range: 110, scale: 1.2,
    body: '#70cde7', shade: '#367cba', light: '#ddfbff', wing: '#bcebf4', belly: '#edfaff', horns: '#d6f9ff' },
  { name: 'Lightning Dragon', progress: 100, element: 'lightning', hp: 1100, damage: 7, range: 125, scale: 1.45,
    body: '#9860d5', shade: '#57358e', light: '#e4c6ff', wing: '#c493eb', belly: '#ffe28b', horns: '#ffd447' },
  { name: 'Super Dragon', progress: 150, element: 'gold', hp: 1800, damage: 18, range: 145, scale: 1.75,
    body: '#f3bd4e', shade: '#b87736', light: '#fff4bb', wing: '#8dd9ce', belly: '#fff0c2', horns: '#e8faff' },
] as const
export const DRAGON_ICE = { duration: 1.4, speed: 0.45 } as const
export const DRAGON_FEED = { health: 25, bite: 0.45, corpseLife: 30 } as const
export const DRAGON_NEST = {
  name: 'Dragon Nest', blurb: 'A round bed of sticks, bones and straw, with a soft pile for two dragon eggs',
  color: '#817c8d', radius: 110, hp: 1800, speed: 0, damage: 0,
  range: 0, cooldown: 1, knockback: 0, spacing: 300, size: 6,
  build: 3, quiet: 2, lay: 12, heal: 0.03,
} as const
export const DRAGON_EGG = {
  name: 'Dragon Egg', blurb: 'Twenty seconds until a hungry baby dragon hatches',
  color: '#e9dce9', radius: 7, hp: 60, speed: 0, damage: 0,
  range: 0, cooldown: 1, knockback: 0, spacing: 18, size: 0.65,
  hatch: 20, max: 2, maxPerDragon: 2,
} as const
export const DRAGON_BABY = { scale: 0.45, training: 120, nutrition: 4 } as const
export const DRAGON_DOMAIN = {
  threshold: 0.5, radius: 340, rise: 0.8, scream: 0.9, fall: 0.4, height: 140,
  hold: 3, shrink: 12, finalRadius: 24,
} as const
export const DRAGON_LIGHTNING = { cooldown: 1.2, range: 110, targets: 3, stun: 0.25 } as const
export const DRAGON_LIGHTNING_SWORD = {
  windup: 0.45, slash: 0.28, recovery: 0.22, cooldown: 6, range: 300,
  blade: 42, damage: 36, waveDamage: 18, waveSpeed: 460, waveRange: 420, waveRadius: 28,
} as const

export function drawDragonLightning(c: C, length: number, time: number, power = 1, scale = 1) {
  if (length <= 0) return
  c.save()
  c.lineJoin = c.lineCap = 'round'
  const opacity = c.globalAlpha * Math.max(0, Math.min(1, power))
  const flash = Math.floor(time * 18)
  const noise = (n: number) => Math.sin(n * 127.1 + flash * 37.7) * Math.cos(n * 53.3 + flash * 11.1)
  const segments = Math.max(6, Math.ceil(length / (12 * scale)))
  const points = Array.from({ length: segments + 1 }, (_, i) => ({
    x: length * i / segments,
    y: i === 0 || i === segments ? 0 : noise(i) * Math.min(15 * scale, length * 0.17),
  }))
  c.beginPath(); c.moveTo(0, 0)
  for (const p of points) c.lineTo(p.x, p.y)
  for (const [width, color, alpha] of [[10, '#9853ed', 0.16], [4, '#c58dff', 0.7], [1.25, '#fffbe1', 1]] as const) {
    c.strokeStyle = color; c.lineWidth = width * scale; c.globalAlpha = opacity * alpha; c.stroke()
  }
  for (let i = 1; i < segments; i += 2) {
    const p = points[i], side = noise(i + 20) > 0 ? 1 : -1
    const fork = Math.min(length * 0.32, (12 + Math.abs(noise(i + 9)) * 22) * scale)
    c.beginPath(); c.moveTo(p.x, p.y)
    let x = p.x, y = p.y
    for (let j = 1; j <= 4; j++) {
      x = p.x + fork * j / 6 + noise(i * 5 + j) * 3 * scale
      y = p.y + side * fork * j / 4
      c.lineTo(x, y)
      if (j === 2) {
        c.lineTo(x - fork * 0.25, y + side * fork * 0.22)
        c.moveTo(x, y)
      }
    }
    c.strokeStyle = '#ad74f6'; c.lineWidth = 2 * scale; c.globalAlpha = opacity * 0.65; c.stroke()
    c.strokeStyle = '#f9eaff'; c.lineWidth = 0.55 * scale; c.globalAlpha = opacity; c.stroke()
  }
  c.strokeStyle = '#fff0b5'; c.lineWidth = 0.8 * scale
  for (let k = 0; k < 7; k++) {
    const angle = k * Math.PI * 2 / 7 + flash * 0.7
    const reach = (4 + Math.abs(noise(k + 40)) * 8) * scale
    line(c, length + Math.cos(angle) * 2 * scale, Math.sin(angle) * 2 * scale,
      length + Math.cos(angle) * reach, Math.sin(angle) * reach)
  }
  c.restore()
}

export function drawDragonDomain(c: C, x: number, y: number, radius: number, time: number, sealed: boolean, remaining: number, front = false) {
  c.save()
  c.translate(x, y)
  c.lineJoin = c.lineCap = 'round'
  const closing = Math.max(0, Math.min(1, (DRAGON_DOMAIN.radius - radius) / (DRAGON_DOMAIN.radius - DRAGON_DOMAIN.finalRadius)))
  const fury = 1 + closing * 0.65 + (sealed && remaining < 3 ? Math.sin(time * 22) * 0.12 : 0)
  const noise = (n: number) => Math.sin(n * 127.1) * 0.5 + 0.5
  if (!front) {
    const heat = c.createRadialGradient(0, 0, Math.max(0, radius - 55), 0, 0, radius + 25)
    heat.addColorStop(0, 'rgba(110,37,32,.035)')
    heat.addColorStop(0.55, sealed ? 'rgba(213,68,20,.1)' : 'rgba(213,68,20,.035)')
    heat.addColorStop(0.8, sealed ? 'rgba(255,143,36,.24)' : 'rgba(255,143,36,.1)')
    heat.addColorStop(1, 'rgba(255,143,36,0)')
    c.fillStyle = heat; c.beginPath(); c.arc(0, 0, radius + 25, 0, Math.PI * 2); c.fill()

    // An uneven scorched rim contains the moving molten seam.
    c.beginPath()
    const stones = Math.max(32, Math.ceil(radius / 4))
    for (let k = 0; k <= stones; k++) {
      const angle = k * Math.PI * 2 / stones, edge = radius + (noise(k % stones) - 0.5) * 9
      if (k === 0) c.moveTo(Math.cos(angle) * edge, Math.sin(angle) * edge)
      else c.lineTo(Math.cos(angle) * edge, Math.sin(angle) * edge)
    }
    c.closePath()
    for (const [width, color] of [[18, '#5b3630'], [10, '#9f432a'], [5, '#ed842b'], [1.5, '#ffe99b']] as const) {
      c.globalAlpha = sealed ? 0.9 : 0.35; c.lineWidth = width; c.strokeStyle = color; c.stroke()
    }
    c.globalAlpha = 1
    for (let k = 0; k < 16; k++) {
      const angle = k * Math.PI / 8 + noise(k + 40) * 0.13
      const length = Math.min(radius * 0.3, 14 + noise(k + 50) * 30)
      c.save(); c.rotate(angle); c.beginPath()
      c.moveTo(radius + 6, 0); c.lineTo(radius - length * 0.35, 2)
      c.lineTo(radius - length * 0.65, -4); c.lineTo(radius - length, -2)
      c.moveTo(radius - length * 0.35, 2); c.lineTo(radius - length * 0.65, 10)
      c.strokeStyle = '#743728'; c.lineWidth = 3; c.globalAlpha = sealed ? 0.7 : 0.2; c.stroke()
      c.strokeStyle = '#ffc158'; c.lineWidth = 0.8; c.globalAlpha = sealed ? 0.9 : 0.35; c.stroke()
      c.restore()
    }

    // Opposing rune bands turn slowly inside the boundary, with angular claw-like glyphs.
    const runeRadius = Math.max(9, radius - 23), glyph = Math.min(8, radius * 0.06)
    c.save(); c.rotate(time * 0.07)
    c.strokeStyle = '#da793a'; c.lineWidth = 0.8; c.globalAlpha = sealed ? 0.5 : 0.25
    c.setLineDash([9, 18]); c.beginPath(); c.arc(0, 0, runeRadius, 0, Math.PI * 2); c.stroke(); c.setLineDash([])
    for (let k = 0; k < 12; k++) {
      c.save(); c.rotate(k * Math.PI / 6 - time * 0.13); c.translate(runeRadius, 0)
      c.globalAlpha = (sealed ? 0.7 : 0.3) + Math.sin(time * 4 + k) * 0.12
      c.strokeStyle = '#e69543'; c.lineWidth = 1.5
      line(c, -glyph, -glyph, 0, 0, -glyph, glyph)
      line(c, glyph, -glyph, 0, 0, glyph, glyph)
      if (k % 2) line(c, -glyph, 0, glyph, 0)
      else line(c, 0, -glyph * 1.3, 0, glyph * 1.3)
      c.restore()
    }
    c.restore()

    // A dragon-shaped seal sits beneath the arena rather than covering its occupants.
    c.save(); c.scale(Math.min(1, radius / 160), Math.min(1, radius / 160))
    c.globalAlpha = sealed ? 0.1 + closing * 0.08 : 0.07
    c.lineWidth = 2; c.strokeStyle = '#b34b2b'
    poly(c, '#a94b2c', -39, -50, -16, -26, 0, -38, 16, -26, 39, -50,
      28, -8, 37, 8, 20, 12, 11, 35, 0, 46, -11, 35, -20, 12, -37, 8, -28, -8)
    poly(c, '#ffe59a', -24, -9, -5, -3, -13, 7, -24, 2)
    poly(c, '#ffe59a', 24, -9, 5, -3, 13, 7, 24, 2)
    line(c, -9, 20, 0, 26, 9, 20)
    c.restore()

    // During collapse, embers spiral toward the dragon seal instead of just floating in place.
    if (sealed) for (let k = 0; k < 24; k++) {
      const travel = (time * (0.28 + closing * 0.6) + noise(k + 70)) % 1
      const angle = k * 2.4 + time * 0.55 + travel * 2
      const orbit = radius * (1 - travel * (0.2 + closing * 0.8))
      const px = Math.cos(angle) * orbit, py = Math.sin(angle) * orbit - travel * 12
      c.globalAlpha = Math.sin(travel * Math.PI) * 0.7; c.strokeStyle = '#ed9d3b'; c.lineWidth = 1.1
      line(c, px, py, px + Math.sin(angle) * (4 + closing * 8), py - Math.cos(angle) * (4 + closing * 8))
    }
    c.globalAlpha = 1
  }

  if (sealed) {
    const tongues = Math.max(24, Math.ceil(radius * Math.PI * 2 / 18))
    for (let k = 0; k < tongues; k++) {
      const angle = k * Math.PI * 2 / tongues
      if ((Math.sin(angle) >= 0) !== front) continue
      const sway = Math.sin(time * (7 + noise(k) * 4) + k * 2.3)
      const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius
      const height = (22 + noise(k + 2) * 24 + (Math.sin(time * 8 + k * 1.7) + 1) * 8) * fury
      const width = 7 + noise(k + 3) * 6, twist = sway * 12
      // Three connected, forked flame layers keep a crisp cartoon silhouette.
      for (let layer = 0; layer < 3; layer++) {
        const h = height * [1, 0.76, 0.43][layer], w = width * [1, 0.66, 0.32][layer]
        c.beginPath(); c.moveTo(px - w, py + 4)
        c.bezierCurveTo(px - w * 1.8, py - h * 0.3, px + twist, py - h * 0.55, px + twist * 0.6, py - h)
        c.quadraticCurveTo(px + twist + w, py - h * 0.65, px + w * 0.3, py - h * 0.38)
        c.lineTo(px + w * 1.3, py - h * 0.58)
        c.quadraticCurveTo(px + w * 1.5, py - h * 0.1, px + w, py + 4)
        c.closePath(); c.globalAlpha = layer ? 0.95 : 0.85
        c.fillStyle = ['#c94320', '#ff922c', '#ffe99a'][layer]; c.fill()
      }
      const ember = (time * (0.6 + noise(k + 6) * 0.6) + noise(k + 5)) % 1
      const ex = px + sway * 10 + Math.sin(ember * 6 + k) * ember * 12
      const ey = py - height * 0.6 - ember * (45 + closing * 35)
      c.globalAlpha = (1 - ember) * 0.8; c.strokeStyle = '#f6b349'; c.lineWidth = 1.5
      line(c, ex - sway * 2, ey + 5, ex, ey)
      if (k % 4 === 0) {
        c.globalAlpha = (1 - ember) * 0.2; c.fillStyle = '#71534a'
        c.beginPath(); c.ellipse(ex + sway * 5, ey - 12, 4 + ember * 6, 3 + ember * 4, 0, 0, Math.PI * 2); c.fill()
      }
      c.globalAlpha = 1
    }
  }
  if (front) {
    const labelY = Math.max(-y + 24, -radius - 65)
    c.fillStyle = 'rgba(62,35,33,.92)'; c.strokeStyle = '#e69b42'; c.lineWidth = 1
    c.beginPath(); c.roundRect(-116, labelY - 16, 232, sealed ? 47 : 29, 8); c.fill(); c.stroke()
    c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillStyle = '#ffe9ad'
    c.fillText(sealed ? `FIRE DOMAIN · ${Math.max(0, remaining).toFixed(1)}s` : 'FIRE DOMAIN · SEALING', 0, labelY)
    if (sealed) {
      c.font = '10px system-ui'; c.fillStyle = '#eac49b'; c.fillText('Defeat the dragon to break the seal', 0, labelY + 14)
      c.fillStyle = '#ef9a39'; c.fillRect(-104, labelY + 23, 208 * Math.max(0, Math.min(1, remaining / (DRAGON_DOMAIN.hold + DRAGON_DOMAIN.shrink))), 2)
    }
  }
  c.restore()
}

export function drawDragonDomainCollapse(c: C, x: number, y: number, radius: number, progress: number) {
  c.save(); c.translate(x, y)
  const fade = 1 - progress, spread = 16 + radius * Math.pow(progress, 0.65)
  c.lineCap = c.lineJoin = 'round'
  c.globalAlpha = fade * 0.65
  c.strokeStyle = '#ed7a2d'; c.lineWidth = 12 * fade + 1
  c.beginPath(); c.arc(0, 0, spread, 0, Math.PI * 2); c.stroke()
  c.strokeStyle = '#ffe3a0'; c.lineWidth = 2 * fade
  c.beginPath(); c.arc(0, 0, spread * 0.92, 0, Math.PI * 2); c.stroke()
  for (let k = 0; k < 28; k++) {
    const angle = k * Math.PI / 14, reach = spread * (0.45 + Math.sin(k * 13.7) ** 2 * 0.55)
    const px = Math.cos(angle) * reach, py = Math.sin(angle) * reach
    c.globalAlpha = fade
    c.strokeStyle = k % 2 ? '#f5a33d' : '#c85829'; c.lineWidth = 1 + fade * 2
    line(c, px * 0.65, py * 0.65, px, py)
    c.fillStyle = '#ffeab0'
    c.beginPath(); c.arc(px, py, 1 + fade * 2, 0, Math.PI * 2); c.fill()
  }
  const core = 12 + Math.sin(progress * Math.PI) * 65
  c.globalAlpha = fade * 0.85
  c.beginPath()
  for (let k = 0; k <= 24; k++) {
    const angle = k * Math.PI / 12, reach = core * (k % 2 ? 0.45 : 1)
    if (k === 0) c.moveTo(Math.cos(angle) * reach, Math.sin(angle) * reach)
    else c.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach)
  }
  c.closePath(); c.fillStyle = '#ffc554'; c.fill()
  c.beginPath(); c.arc(0, 0, core * 0.35, 0, Math.PI * 2); c.fillStyle = '#fff5cf'; c.fill()
  c.restore()
}

export function drawDragonSword(c: C, x: number, y: number, angle: number, charge: number, sweep: number, time: number) {
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.lineCap = c.lineJoin = 'round'
  const length = DRAGON_LIGHTNING_SWORD.blade * charge
  if (sweep > 0 && sweep < 1) {
    c.save()
    c.globalAlpha *= Math.sin(sweep * Math.PI) * 0.6
    c.strokeStyle = '#c69cff'
    c.lineWidth = 7
    c.beginPath()
    c.arc(0, 0, length * 0.84, -0.95, -0.95 + sweep * 1.9)
    c.stroke()
    c.strokeStyle = '#fff4b5'
    c.lineWidth = 1.8
    c.stroke()
    c.restore()
  }
  c.rotate(-0.95 + sweep * 1.9)
  c.globalAlpha *= Math.min(1, charge * 2)
  c.beginPath()
  c.moveTo(2, -1.5)
  c.lineTo(length * 0.7, -3)
  c.lineTo(length, 0)
  c.lineTo(length * 0.7, 3)
  c.lineTo(2, 1.5)
  c.closePath()
  c.fillStyle = 'rgba(188,146,255,.45)'
  c.strokeStyle = 'rgba(161,103,246,.25)'
  c.lineWidth = 9
  c.stroke()
  c.fill()
  c.strokeStyle = '#ffe28a'
  c.lineWidth = 1.5
  c.stroke()
  c.strokeStyle = '#fffdf1'
  c.lineWidth = 1.1
  c.beginPath()
  c.moveTo(2, 0)
  for (let k = 1; k <= 8; k++) {
    c.lineTo(length * k / 8, k === 8 ? 0 : Math.sin(time * 32 + k * 3.7) * 1.6)
  }
  c.stroke()
  c.strokeStyle = '#c79af7'
  c.lineWidth = 1.2
  line(c, 5, -5, 3, -2, 3, 2, 5, 5)
  c.strokeStyle = '#fff2b5'
  c.lineWidth = 0.8
  line(c, 3, -4, 3, 4)
  c.restore()
}

export function drawLightningWave(c: C, x: number, y: number, angle: number, radius: number, age: number, fade: number) {
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.globalAlpha *= Math.min(1, fade * 4, age * 15)
  c.lineCap = c.lineJoin = 'round'
  c.beginPath()
  c.moveTo(-radius * 0.25, -radius)
  c.quadraticCurveTo(radius * 0.95, 0, -radius * 0.25, radius)
  c.quadraticCurveTo(radius * 0.3, 0, -radius * 0.25, -radius)
  const glow = c.createLinearGradient(-radius * 0.4, 0, radius * 0.5, 0)
  glow.addColorStop(0, 'rgba(161,111,246,0)')
  glow.addColorStop(0.65, 'rgba(189,150,255,.5)')
  glow.addColorStop(1, '#fff5b8')
  c.fillStyle = glow
  c.fill()
  c.strokeStyle = 'rgba(168,112,247,.3)'
  c.lineWidth = 8
  c.stroke()
  c.strokeStyle = '#e6c5ff'
  c.lineWidth = 2.5
  c.stroke()
  c.strokeStyle = '#fff9db'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(-radius * 0.25, -radius)
  c.quadraticCurveTo(radius * 0.95, 0, -radius * 0.25, radius)
  c.stroke()
  c.strokeStyle = '#ffe385'
  c.lineWidth = 1.2
  for (let k = 0; k < 5; k++) {
    const y = (k - 2) * radius * 0.32
    const spark = Math.sin(age * 31 + k * 4.7) * 4
    line(c, -8, y, -16, y + spark, -23, y - 3, -31, y + spark * 0.5)
  }
  c.restore()
}
export const DRAGON_ICE_DIVE = {
  rise: 0.65, hover: 0.18, fall: 0.2, height: 140, cooldown: 8,
  radius: 110, damage: 28, freeze: 1.8, effect: 1.2,
} as const

export function drawIceRing(c: C, x: number, y: number, radius: number, progress: number) {
  c.save()
  c.translate(x, y)
  const spread = 1 - Math.pow(1 - progress, 3)
  const edge = radius * (0.25 + spread * 0.75)
  c.globalAlpha *= Math.min(1, (1 - progress) * 2)
  const frost = c.createRadialGradient(0, 0, 0, 0, 0, edge)
  frost.addColorStop(0, 'rgba(218,249,255,0.12)')
  frost.addColorStop(0.75, 'rgba(113,204,241,0.22)')
  frost.addColorStop(1, 'rgba(162,229,250,0.08)')
  c.fillStyle = frost
  c.beginPath()
  c.arc(0, 0, edge, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = '#81d1ed'
  c.lineWidth = 4 * (1 - progress) + 1
  c.stroke()
  c.strokeStyle = '#f0fdff'
  c.lineWidth = 1.5
  c.beginPath()
  c.arc(0, 0, edge - 3, 0, Math.PI * 2)
  c.stroke()
  for (let k = 0; k < 18; k++) {
    const angle = k * Math.PI / 9
    const reach = edge * (k % 2 ? 0.65 : 0.83)
    c.strokeStyle = '#8dcee7'
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10)
    c.lineTo(Math.cos(angle + 0.08) * reach * 0.55, Math.sin(angle + 0.08) * reach * 0.55)
    c.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach)
    c.stroke()
    c.save()
    c.translate(Math.cos(angle) * edge, Math.sin(angle) * edge)
    c.rotate(angle)
    const height = (8 + k % 3 * 4) * Math.sin(Math.min(1, progress * 3) * Math.PI / 2)
    c.lineWidth = 0.8
    poly(c, k % 2 ? '#d8f6ff' : '#b0e6f5', -4, -4, height, -1, 2, 5, -6, 2)
    c.strokeStyle = '#fff'
    line(c, -3, 0, height - 2, -1)
    c.restore()
  }
  c.restore()
}

// Keep the muzzle at (45, 17), where the battle renderer attaches fire breath.
function dragonHead(c: C, form: DragonForm, breathing = false, sleeping = false) {
  const p = DRAGON_FORMS[form]
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1.25
  // Swept horns and cheek spines frame a broad, angular skull.
  poly(c, p.horns, 33, 9, 26 - form * 0.7, 2, 28, 7, 28, 10, 32, 13)
  poly(c, p.horns, 37, 9, 33, 3, 34, 8, 33, 11)
  poly(c, p.shade, 31, 11, 25, 9, 28, 14, 25, 14, 29, 18, 33, 16)
  poly(c, p.body, 29, 10, 34, 8, 39, 10, 44, 11, 46, 14, 44.5, 17,
    37, 18, 33, 20, 29, 17, 30, 13)
  poly(c, p.light, 36, 10, 40, 11, 44, 12.5, 40, 12, 37, 12)
  poly(c, p.shade, 29, 14, 33, 14, 36, 17, 32, 19, 29, 17)
  c.lineWidth = 0.8
  if (sleeping) {
    c.strokeStyle = INK
    line(c, 32, 12, 34, 13, 37, 11.8)
  } else {
    // A narrow gold eye and a heavy downward brow read as a cartoon scowl.
    poly(c, form === 1 ? '#e8fbff' : '#ffe58a', 31.8, 10.7, 37.5, 11.8, 35.8, 14, 32.3, 13)
    ellipse(c, 34.8, 12, 0.6, 1.25, INK)
    ellipse(c, 35.1, 11.4, 0.3, 0.3, '#fff')
    c.lineWidth = 1.7
    line(c, 30.5, 9.5, 37.4, 11)
  }
  c.lineWidth = 0.8
  c.beginPath()
  c.ellipse(43, 13.7, 1, 0.55, -0.3, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  if (breathing) {
    poly(c, '#402333', 34, 15.3, 39, 16, 45.7, 14.8, 45, 19.7, 39, 21, 33, 18)
    ellipse(c, 40.5, 18.5, 3.8, 1.2, p.light)
    poly(c, p.belly, 36, 15.6, 38, 16, 37.2, 18)
    poly(c, p.belly, 42, 15.5, 44, 15.1, 43, 17.8)
    c.strokeStyle = p.shade
    line(c, 34, 18.5, 39, 21, 44, 20)
  } else {
    c.strokeStyle = INK
    line(c, 33, 15.8, 37, 17, 44.8, 16)
    poly(c, p.belly, 37, 17, 39, 16.8, 38.2, 19)
    poly(c, p.belly, 42, 16.4, 43.8, 16.2, 43, 18.2)
    c.strokeStyle = p.light
    line(c, 35, 18.4, 39, 19, 43, 18.4)
  }
  if (form > 0) {
    c.strokeStyle = INK
    poly(c, p.horns, 29, 10, 25, 5, 30, 7, 33, 10)
    if (form === 3) poly(c, '#e8faff', 32, 9, 30, 2, 34, 5, 35, 9)
  }
  c.restore()
}

function dragon(c: C, flap: number | undefined, form: DragonForm, breathing: boolean, step?: number) {
  const p = DRAGON_FORMS[form]
  const spread = flap === undefined ? 1 : 0.65 + flap * 0.35
  c.save()
  c.lineWidth = 1.5

  // The far wing stays behind the neck; both wings have broad bat-like membranes.
  c.save()
  c.translate(28, 28)
  c.scale(1, spread)
  c.translate(-28, -28)
  poly(c, p.shade, 28, 28, 30, 14, 39, 6, 46, 3, 41, 11, 40, 20,
    36, 18, 34, 26, 31, 24)
  c.lineWidth = 0.8
  c.strokeStyle = p.wing
  line(c, 29, 26, 34, 16, 44, 5)
  line(c, 34, 16, 39, 19)
  line(c, 34, 16, 34, 25)
  c.restore()

  // A long muscular tail curls up behind the hindquarters.
  c.beginPath()
  c.moveTo(19, 28)
  c.bezierCurveTo(10, 33, 3, 36, 2, 29)
  c.quadraticCurveTo(1, 25, 5, 22)
  c.quadraticCurveTo(3, 30, 8, 29)
  c.lineTo(17, 24)
  c.closePath()
  c.fillStyle = p.shade
  c.fill(); c.stroke()
  c.lineWidth = 0.7
  poly(c, p.horns, 4, 29, 3, 25, 6, 28)
  poly(c, p.horns, 8, 30, 7, 26, 11, 28)
  poly(c, p.horns, 12, 28, 12, 24, 15, 26)

  // Two far legs remain visible between the nearer pair.
  // Diagonal pairs step together: near hind with far fore, far hind with near fore.
  leg(c, opposite(step), 20, 31, () => {
    c.lineWidth = 1.1
    poly(c, p.shade, 19, 30, 23, 32, 22, 37, 23, 40, 26, 41, 26, 42,
      19, 42, 18, 39, 17, 35)
    c.lineWidth = 0.6
    poly(c, p.horns, 24, 40.5, 27, 42, 23, 42)
  })
  leg(c, step, 34, 29, () => {
    c.lineWidth = 1.1
    poly(c, p.shade, 32, 28, 36, 29, 36, 36, 38, 39, 39, 41, 33, 41, 31, 36)
    c.lineWidth = 0.6
    poly(c, p.horns, 37, 39.5, 40, 41, 36, 41)
  })

  // A low back rises into a heavy shoulder and upright, armored neck.
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(13, 28)
  c.bezierCurveTo(16, 23, 23, 24, 26, 24)
  c.bezierCurveTo(29, 21, 28, 16, 31, 12)
  c.lineTo(36, 15)
  c.bezierCurveTo(32, 20, 37, 25, 35, 30)
  c.bezierCurveTo(34, 35, 27, 37, 22, 35)
  c.bezierCurveTo(14, 37, 9, 34, 13, 28)
  c.closePath()
  c.fillStyle = p.body
  c.fill(); c.stroke()
  poly(c, p.belly, 33, 17, 34, 21, 33, 25, 35, 28, 32, 33, 28, 34,
    29, 28, 30, 24, 30, 20)
  c.strokeStyle = p.shade
  c.lineWidth = 0.8
  line(c, 30.5, 21, 33.8, 22)
  line(c, 30, 24.5, 33.2, 25.5)
  line(c, 29.4, 28, 34, 29)
  line(c, 28.5, 31.5, 32, 32)
  c.strokeStyle = INK
  for (const [x, y] of [[14, 26], [19, 24.5], [24, 24], [27, 20], [28.5, 16]]) {
    poly(c, p.horns, x - 1.5, y + 1, x - 3, y - 3 - form * 0.4, x + 2.5, y)
  }

  // The near wing fills the upper-left silhouette with long fingers and scallops.
  c.save()
  c.translate(24, 28)
  c.scale(1, spread)
  c.translate(-24, -28)
  c.lineWidth = 1.4
  c.beginPath()
  c.moveTo(25, 29)
  c.quadraticCurveTo(23, 14, 17, 6)
  c.quadraticCurveTo(10, 3, 3, 2)
  c.lineTo(6, 7)
  c.quadraticCurveTo(3, 10, 2, 17)
  c.quadraticCurveTo(8, 13, 8, 18)
  c.lineTo(6, 24)
  c.quadraticCurveTo(13, 19, 13, 25)
  c.lineTo(14, 30)
  c.quadraticCurveTo(19, 25, 21, 30)
  c.lineTo(25, 31)
  c.closePath()
  c.fillStyle = p.wing
  if (form === 3) {
    const membrane = c.createLinearGradient(3, 5, 25, 28)
    membrane.addColorStop(0, '#c9b5eb')
    membrane.addColorStop(0.5, p.wing)
    membrane.addColorStop(1, '#f4d992')
    c.fillStyle = membrane
  }
  c.fill(); c.stroke()
  c.lineWidth = 0.8
  c.strokeStyle = p.shade
  line(c, 24, 29, 20, 15, 17, 6, 4, 3)
  line(c, 20, 15, 7, 9, 2, 17)
  line(c, 20, 15, 12, 16, 6, 24)
  line(c, 20, 15, 17, 23, 14, 30)
  line(c, 20, 15, 22, 25, 21, 30)
  c.strokeStyle = p.light
  c.lineWidth = 0.6
  line(c, 8, 6, 15, 8, 20, 17)
  if (form === 1) {
    c.strokeStyle = INK
    poly(c, p.light, 7, 7, 8, 2, 11, 7, 14, 9)
    poly(c, p.light, 13, 24, 10, 20, 15, 22, 17, 27)
  } else if (form >= 2) {
    c.strokeStyle = p.shade
    poly(c, p.horns, 10, 11, 15, 13, 12, 17, 18, 16, 16, 23, 16, 19, 10, 20, 13, 15)
    if (form === 3) poly(c, '#fff1bf', 18, 8, 20, 4, 23, 12, 22, 18)
  }
  c.restore()

  // Powerful near haunch and foreleg give the dragon four weight-bearing feet.
  c.lineWidth = 1.25
  c.strokeStyle = INK
  ellipse(c, 16, 32, 5.5, 5.5, p.body)
  const claws = (...xs: number[]) => {
    c.lineWidth = 0.8
    for (const x of xs) poly(c, p.horns, x - 1, 42, x + 1.5, 44.5, x - 1.5, 44.5)
    c.strokeStyle = p.shade
  }
  leg(c, step, 15, 34, () => {
    poly(c, p.body, 12, 33, 17, 34, 16, 38, 17, 41, 20, 42, 20, 44,
      11, 44, 11, 41, 13, 38, 10, 36)
    claws(13, 16)
    line(c, 13, 37, 15, 38)
  })
  leg(c, opposite(step), 30, 28, () => {
    poly(c, p.body, 27, 27, 33, 27, 33, 34, 32, 39, 35, 41, 37, 42,
      37, 44, 29, 44, 27, 41, 28, 35, 26, 31)
    c.lineWidth = 0.8
    poly(c, p.shade, 27, 31, 30, 32, 32, 30, 31, 35, 28, 36)
    claws(30, 33, 36)
    line(c, 29, 36, 30, 40)
  })
  c.lineWidth = 0.8
  poly(c, p.light, 26, 27, 29, 24, 34, 26, 33, 30, 29, 32, 26, 30)
  poly(c, p.light, 12, 32, 15, 29, 19, 31, 17, 34)
  if (form > 0) {
    c.strokeStyle = INK
    for (let k = 0; k <= form; k++) {
      const y = 22 + k * 3
      poly(c, k % 2 ? p.light : p.horns, 27, y, 30, y - 2, 32, y, 29, y + 2)
    }
  }
  dragonHead(c, form, breathing)
  c.restore()
}

export function buildDragonSprite(color?: string, flap?: number, form: DragonForm = 0, breathing = false, step?: number) {
  return buildSprite((c) => dragon(c, flap, form, breathing, step), color, [28, 20, 6], flap === undefined)
}

export function buildDragonNestSprite(color?: string) {
  return buildSprite((c) => {
    const twig = (x: number, y: number, length: number, angle: number) => {
      c.save()
      c.translate(x, y)
      c.rotate(angle)
      c.strokeStyle = '#483629'
      c.lineWidth = 1.7
      line(c, -length / 2, 0, length / 2, 0)
      c.strokeStyle = '#aa7950'
      c.lineWidth = 0.9
      line(c, -length / 2, 0, length / 2, 0)
      c.lineWidth = 0.55
      line(c, length * 0.15, 0, length * 0.35, -1.3)
      c.strokeStyle = '#ddb587'
      c.lineWidth = 0.2
      line(c, -length / 2 + 0.5, -0.25, -0.6, -0.2, length / 2 - 0.4, -0.3)
      c.strokeStyle = '#68462e'
      line(c, -length * 0.15, 0.25, length * 0.3, 0.2)
      ellipse(c, -length * 0.22, 0, 0.45, 0.23, '#845734')
      c.strokeStyle = '#765039'
      c.lineWidth = 0.18
      ellipse(c, length / 2 - 0.1, 0, 0.45, 0.5, '#d3ad79')
      c.restore()
    }
    const bone = (x: number, y: number, length: number, angle: number) => {
      c.save()
      c.translate(x, y)
      c.rotate(angle)
      c.strokeStyle = INK
      c.lineWidth = 2.4
      line(c, -length / 2, 0, length / 2, 0)
      c.strokeStyle = '#f3e7cc'
      c.lineWidth = 1.5
      line(c, -length / 2, 0, length / 2, 0)
      c.strokeStyle = '#7c6c53'
      c.lineWidth = 0.45
      for (const side of [-1, 1]) {
        ellipse(c, side * length / 2, -0.65, 1, 0.85, '#f3e7cc')
        ellipse(c, side * length / 2, 0.65, 1, 0.85, '#f3e7cc')
      }
      c.strokeStyle = '#fffaf0'
      c.lineWidth = 0.3
      line(c, -length / 2 + 0.8, -0.3, length / 2 - 0.6, -0.3)
      c.strokeStyle = '#b8a381'
      c.lineWidth = 0.18
      line(c, length * 0.2, 0.6, length * 0.3, 0, length * 0.15, -0.4)
      c.restore()
    }
    const wheat = (x: number, y: number, angle: number) => {
      c.save()
      c.translate(x, y)
      c.rotate(angle)
      c.lineWidth = 0.4
      c.strokeStyle = '#9b713a'
      line(c, 0, 3, 0, -5.5)
      for (let k = 0; k < 3; k++) {
        const y = -k * 1.5
        poly(c, '#e8c775', 0, y, -2, y - 1.1, -1.5, y - 2.3, 0, y - 0.8)
        poly(c, '#f2d88f', 0, y - 0.4, 1.8, y - 1.4, 1.3, y - 2.5, 0, y - 1)
        c.lineWidth = 0.16
        line(c, -1.5, y - 1.7, -0.3, y - 0.7)
        line(c, 1.3, y - 1.9, 0.2, y - 0.9)
        c.lineWidth = 0.4
      }
      c.restore()
    }

    // A shallow, round bowl sits flat on the ground, with an open straw bed.
    c.lineWidth = 0.8
    c.strokeStyle = 'rgba(34,31,51,.1)'
    ellipse(c, 24, 34, 22, 10.5, 'rgba(34,31,51,.13)')
    c.strokeStyle = INK
    ellipse(c, 24, 31, 21, 12, '#765039')
    ellipse(c, 24, 28.5, 20, 10.5, '#b18a55')
    ellipse(c, 24, 29, 15.5, 7.5, '#80603c')
    c.strokeStyle = '#b88b4c'
    c.lineWidth = 0.6
    ellipse(c, 24, 29.5, 13.5, 6, '#c7a66c')
    for (let k = 0; k < 54; k++) {
      const angle = k * 2.399963, radius = 0.2 + k % 7 * 0.12
      const x = 24 + Math.cos(angle) * 13 * radius
      const y = 29 + Math.sin(angle) * 6 * radius
      c.strokeStyle = k % 2 ? '#f1d99a' : '#a57c43'
      c.lineWidth = k % 3 ? 0.2 : 0.35
      line(c, x - 1.6, y + 0.7, x, y - 0.1, x + 1.6, y - 0.7)
    }

    // Interlocking branches make an irregular woven rim, rather than a wall.
    for (let k = 0; k < 28; k++) {
      const angle = k * Math.PI / 14
      twig(24 + Math.cos(angle) * 19, 29.5 + Math.sin(angle) * 10,
        5.5 + k % 3, Math.atan2(10 * Math.cos(angle), -19 * Math.sin(angle)))
    }
    wheat(10, 25, -0.75)
    wheat(35, 24, 0.8)
    wheat(7, 34, -1.1)
    wheat(32, 38, 1.2)
    bone(7, 29, 5.5, -0.65)
    bone(39, 32, 6.5, 0.7)
    bone(16, 39.5, 6, -0.15)

    // A raised pile of short sticks and soft straw cradles the two eggs.
    c.strokeStyle = '#8b6239'
    c.lineWidth = 0.6
    ellipse(c, 24, 32, 11.5, 4.8, '#b98d50')
    ellipse(c, 24, 31.7, 8.5, 3, '#967040')
    for (let k = 0; k < 9; k++) {
      const angle = k * 2.399963
      twig(24 + Math.cos(angle) * (6 + k % 2 * 3), 32 + Math.sin(angle) * 3,
        4 + k % 3, angle * 0.6)
    }
    c.strokeStyle = '#f0d18a'
    c.lineWidth = 0.45
    for (const [x, y] of [[18, 31], [22, 29.5], [27, 30], [29, 33], [21, 34]]) {
      line(c, x - 1.5, y + 0.7, x + 1.8, y - 0.6)
    }
    // Fine, individually drawn fibers stay sharp at the nest's full world size.
    for (let k = 0; k < 38; k++) {
      const angle = k * 2.399963, radius = 0.2 + k % 6 * 0.14
      const x = 24 + Math.cos(angle) * 8 * radius, y = 32 + Math.sin(angle) * 2.8 * radius
      c.strokeStyle = k % 2 ? '#f5dea2' : '#694a2c'
      c.lineWidth = 0.17
      c.beginPath()
      c.moveTo(x - 1.5, y + 0.5)
      c.quadraticCurveTo(x, y - 0.6, x + 1.8, y - 0.2)
      c.stroke()
    }

    // A small, simplified skull is another keepsake caught in the outer sticks.
    c.strokeStyle = '#7c6c53'
    c.lineWidth = 0.55
    ellipse(c, 36, 39.5, 2.5, 2, '#eee1c4')
    poly(c, '#eee1c4', 35, 40, 37.5, 40, 37, 42, 35.5, 42)
    ellipse(c, 35, 39.3, 0.55, 0.7, '#5c4c3b')
    ellipse(c, 37, 39.3, 0.55, 0.7, '#5c4c3b')
    c.lineWidth = 0.18
    line(c, 36, 37.8, 35.7, 38.2, 36.1, 38.6)
    line(c, 36, 40.8, 36, 41.8)
    line(c, 36.7, 40.8, 36.6, 41.8)
  // The nest renders at 6x size and the battlefield supports up to 2x pixel density.
  }, color, [8, 31, 6], false, DRAGON_NEST.size * 2)
}

export function buildDragonEggSprite(color?: string) {
  return buildSprite((c) => {
    ellipse(c, 24, 30, 9, 13, '#e9dce9')
    for (let k = 0; k < 5; k++) {
      ellipse(c, 19 + k % 3 * 4, 25 + Math.floor(k / 3) * 9, 2, 2,
        ['#82ce83', '#70cde7', '#c493eb', '#ffd447', '#ffe8d2'][k])
    }
  }, color, [20, 29, 9])
}

export function buildSleepingDragonSprite(color?: string, form: DragonForm = 0) {
  return buildSprite((c) => {
    const p = DRAGON_FORMS[form]
    c.lineWidth = 1.3
    c.strokeStyle = INK

    // The tail loops around the entire resting body like a protective cradle.
    c.beginPath()
    c.moveTo(16, 29)
    c.bezierCurveTo(5, 23, 0, 33, 5, 39)
    c.bezierCurveTo(11, 46, 33, 46, 41, 39)
    c.quadraticCurveTo(44, 35, 39, 34)
    c.bezierCurveTo(35, 40, 13, 42, 9, 35)
    c.quadraticCurveTo(7, 31, 16, 33)
    c.closePath()
    c.fillStyle = p.shade
    c.fill(); c.stroke()

    // Rounded shoulders and a tucked neck replace the upright standing posture.
    c.beginPath()
    c.moveTo(9, 32)
    c.bezierCurveTo(7, 25, 15, 22, 23, 24)
    c.bezierCurveTo(30, 24, 34, 28, 35, 32)
    c.bezierCurveTo(37, 38, 30, 41, 22, 40)
    c.bezierCurveTo(14, 41, 9, 38, 9, 32)
    c.closePath()
    c.fillStyle = p.body
    c.fill(); c.stroke()
    c.lineWidth = 0.8
    for (const [x, y] of [[11, 27], [16, 24.5], [22, 25]]) {
      poly(c, p.horns, x - 1, y + 1, x - 2.5, y - 2 - form * 0.3, x + 2, y)
    }
    ellipse(c, 24, 36, 7.5, 3.5, p.belly)
    c.strokeStyle = p.shade
    line(c, 20, 34, 21, 37, 23, 39)
    line(c, 24, 33, 25, 36, 27, 38)

    // Leathery wings lie folded along the back instead of sticking up.
    c.strokeStyle = INK
    poly(c, p.shade, 14, 27, 20, 23, 28, 26, 31, 32, 26, 34, 20, 31)
    poly(c, p.wing, 10, 29, 13, 24, 20, 27, 23, 25, 27, 32,
      25, 35, 21, 33, 17, 36, 15, 32)
    c.strokeStyle = p.shade
    c.lineWidth = 0.7
    line(c, 13, 25, 19, 30, 17, 35)
    line(c, 19, 30, 23, 27)
    line(c, 19, 30, 25, 34)
    c.strokeStyle = p.light
    c.lineWidth = 0.5
    line(c, 14, 26, 18, 29)

    // Folded hind feet and overlapping front paws make a pillow for the jaw.
    c.strokeStyle = INK
    c.lineWidth = 0.9
    ellipse(c, 16, 36, 4.5, 3, p.body)
    box(c, 17, 38, 8, 3, 1.5, p.body)
    box(c, 29, 38, 11, 3.5, 1.7, p.shade)
    box(c, 27, 40, 13, 3, 1.5, p.body)
    c.lineWidth = 0.6
    for (const x of [22, 34, 37]) poly(c, p.horns, x, 40.7, x + 2, 42.7, x - 0.7, 42.7)
    c.save()
    c.translate(-1, 23)
    c.scale(0.95, 0.85)
    dragonHead(c, form, false, true)
    c.restore()

    // The tapering tail rests across the foreground of the curled silhouette.
    c.strokeStyle = INK
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(8, 36)
    c.bezierCurveTo(12, 42, 25, 43, 31, 40)
    c.quadraticCurveTo(27, 45, 17, 43)
    c.quadraticCurveTo(9, 42, 8, 36)
    c.closePath()
    c.fillStyle = p.body
    c.fill(); c.stroke()
    c.strokeStyle = p.light
    c.lineWidth = 0.6
    line(c, 12, 40, 17, 41.5, 23, 41.5)
  }, color, [15, 29, 6])
}

import { buildSprite, ellipse, eye, INK, leg, line, opposite, poly, stride, type C } from './art.ts'

export const TREX = {
  name: 'Tiny Arms', blurb: 'Fifty meals make an albino alpha. A hundred kills forge black armored scales and a wall ram',
  color: '#d9773a', radius: 19, hp: 850, speed: 80, damage: 40,
  range: 5, detection: 520, cooldown: 0.9, knockback: 120, spacing: 74, size: 2,
} as const
export const TREX_GRAB = {
  chance: 0.35, shake: 0.7, speed: 330, distance: 264,
  landingDamage: 18, landingRadius: 22, dizzy: 1.5,
} as const
export const TREX_ROAR = { chance: 0.25, radius: 180, fear: 1.5, cooldown: 5, duration: 0.55 } as const
export const TREX_FEED = { health: 8, growth: 0.4 } as const
export const TREX_EGG = {
  name: 'Tiny Arms Egg', blurb: 'One egg per parent. Hatches into a young Tiny Arms after twenty seconds',
  color: '#e2bf86', radius: 8, hp: 75, speed: 0, damage: 0, range: 0,
  cooldown: 1, knockback: 0, spacing: 20, size: 0.8,
  lay: 12, hatch: 20, maxPerRex: 1, babyScale: 0.55, matureMeals: 5,
} as const
export const TREX_ALPHA = {
  meals: 50, hp: 1500, damage: 75, cooldown: 0.8, speed: 110,
  color: '#f1eee5', bleed: 4, bleedDamage: 8,
} as const
export const TREX_BLACK = { kills: 100, armor: 0.25, color: '#363b45' } as const
export const TREX_BLOODLUST = {
  threshold: 0.5, call: 0.9, helpers: 3, speed: 1.4, damage: 1.3,
  terrorRadius: 280, fear: 3, shock: 0.35,
} as const
export const TREX_THROW = {
  range: 420, duration: 0.8, height: 90, damage: 100, splashDamage: 75,
  radius: 140, knockback: 360, stun: 2, lift: 1,
} as const
export const TREX_STOMP = { charge: 0.45, cooldown: 3, radius: 100, power: 1.25, knockback: 180 } as const
export const TREX_RAM = {
  windup: 0.4, dash: 1.3, cooldown: 10, range: 420, minRange: 60, speed: 360,
  damage: 50, wallDamage: 100, stun: 2, pin: 0.45,
} as const
export type RexForm = 0 | 1 | 2

const BLOODLUST_OUTLINE = [[-21, 3], [-18, -7], [-25, -12], [-18, -16], [-24, -25],
  [-14, -23], [-20, -36], [-9, -32], [-12, -45], [-4, -39], [0, -55],
  [5, -40], [12, -47], [11, -32], [21, -38], [17, -24], [25, -29],
  [21, -13], [26, -8], [20, 3]]

export function drawRexBloodlust(c: C, tick: number, id: number, callProgress: number | null) {
  c.save()
  const pulse = tick * 0.16 + id
  const surge = callProgress === null ? 1 + Math.sin(pulse) * 0.025 : 0.9 + callProgress * 0.25
  c.scale(surge, surge)
  for (let layer = 0; layer < 3; layer++) {
    c.save()
    c.scale(1 - layer * 0.11, 1 - layer * 0.09)
    const glow = c.createLinearGradient(0, 3, 0, -55)
    glow.addColorStop(0, layer ? 'rgba(255,190,60,.24)' : 'rgba(234,65,36,.22)')
    glow.addColorStop(0.6, 'rgba(255,184,63,.1)')
    glow.addColorStop(1, 'rgba(255,235,155,.03)')
    c.fillStyle = glow
    c.strokeStyle = ['#e85831', '#ffbc4b', '#fff0ac'][layer]
    c.lineWidth = [1.1, 0.75, 0.45][layer]
    c.globalAlpha = 0.7 + Math.sin(pulse + layer) * 0.15
    c.shadowColor = '#f37532'
    c.shadowBlur = layer === 0 ? 6 : 0
    c.beginPath()
    for (let k = 0; k < BLOODLUST_OUTLINE.length; k++) {
      const [x, y] = BLOODLUST_OUTLINE[k]
      const sway = Math.sin(pulse + k * 1.7) * 1.1
      if (k === 0) c.moveTo(x, y)
      else c.lineTo(x + sway, y + Math.cos(pulse * 1.3 + k) * 0.9)
    }
    c.closePath()
    c.fill(); c.stroke()
    c.restore()
  }
  // Fast, angular sparks climb up both sides without drawing over the face.
  c.strokeStyle = '#ffd87a'
  c.lineWidth = 0.8
  for (let k = 0; k < 12; k++) {
    const rise = (tick / 28 + k / 12 + id * 0.17) % 1
    const x = (k % 2 ? 1 : -1) * (18 + Math.sin(k * 2.4 + rise * 5) * 5)
    const y = 4 - rise * 62
    c.globalAlpha = (1 - rise) * 0.9
    line(c, x - 1.2, y + 3, x + 0.5, y - 3, x + 1.5, y + 0.5)
  }
  // White-gold electrical cracks flicker outside the spiked silhouette.
  const flash = Math.floor(tick / 4) + id
  for (const side of [-1, 1]) {
    const x = side * (24 + Math.sin(flash * 1.7 + side) * 2)
    const y = -5 - (flash + (side + 1) * 4) % 12
    for (let layer = 0; layer < 2; layer++) {
      c.strokeStyle = layer ? '#fff6d3' : '#ffb740'
      c.lineWidth = layer ? 0.4 : 1.3
      c.globalAlpha = 0.45 + Math.abs(Math.sin(pulse * 2 + side)) * 0.5
      line(c, x, y, x - side * 3, y - 7, x + side * 2, y - 11,
        x - side * 2, y - 19, x + side * 1.5, y - 23)
    }
  }
  // Small stones and dust rise from the feet as the energy surges.
  c.fillStyle = '#b99870'
  c.strokeStyle = '#80654b'
  c.lineWidth = 0.4
  for (let k = 0; k < 6; k++) {
    const rise = (tick / 48 + k / 6 + id * 0.11) % 1
    const x = (k - 2.5) * 7 + Math.sin(pulse + k)
    const y = 5 - rise * 17
    c.globalAlpha = (1 - rise) * 0.6
    poly(c, '#b99870', x - 1.3, y, x, y - 1.5, x + 1.7, y - 0.2, x + 0.5, y + 1)
  }
  c.restore()
}

function dot(c: C, x: number, y: number, r: number, fill: string) {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fillStyle = fill
  c.fill()
}


const REX_PALETTES = [
  { body: TREX.color, belly: '#f8dba8', shade: '#ad542f', light: '#efa266' },
  { body: TREX_ALPHA.color, belly: '#fff9e9', shade: '#bcb6b2', light: '#fffefa' },
  { body: TREX_BLACK.color, belly: '#777f87', shade: '#252b34', light: '#64717e' },
] as const
export const REX_JAW = [29, 17], REX_ARM = [30, 27] // hinges, in sprite px: the renderer swings the parts around these

// The T-rex comes in three pieces so the jaw can snap and the tiny arms can flail.
function rexBody(c: C, form: RexForm = 0, stomping = false, step?: number) {
  const { body: REX, belly: BELLY, shade: SHADE, light } = REX_PALETTES[form]
  const alpha = form > 0
  c.save()
  c.lineWidth = 1.8
  // The far leg sits behind one continuous tail, body, neck and skull silhouette.
  leg(c, opposite(step), 25, 34, () => {
    c.beginPath()
    c.moveTo(24, 33)
    c.quadraticCurveTo(29, 34, 27, 39)
    c.quadraticCurveTo(32, 39, 32, 43)
    c.lineTo(23, 43)
    c.quadraticCurveTo(20, 39, 21, 35)
    c.closePath()
    c.fillStyle = SHADE
    c.fill()
    c.stroke()
  }, 0.3)
  c.beginPath()
  c.moveTo(3, 19)
  c.bezierCurveTo(8, 24, 11, 26, 15, 24)
  c.bezierCurveTo(19, 21, 22, 21, 26, 23)
  c.bezierCurveTo(27, 19, 24, 14, 25, 9)
  c.quadraticCurveTo(25, 3.5, 31, 3.5)
  c.bezierCurveTo(36, 3.5, 37, 6, 41, 6)
  c.quadraticCurveTo(46, 6, 46, 10.5)
  c.lineTo(46, 14)
  c.quadraticCurveTo(46, 17.5, 42.5, 17.5)
  c.lineTo(30, 17.5)
  c.quadraticCurveTo(31, 22, 32.5, 28)
  c.bezierCurveTo(35, 37, 25, 40, 17, 36)
  c.bezierCurveTo(11, 33, 7, 29, 3, 19)
  c.closePath()
  c.fillStyle = REX
  c.fill()
  c.stroke()
  if (form === 2) {
    c.lineWidth = 0.8
    for (const [x, y] of [[8, 25], [13, 24.5], [18, 23], [23, 23], [25, 18], [24, 12], [26, 6]]) {
      poly(c, '#84909b', x - 1, y + 1, x - 3, y - 4, x + 3, y - 0.5)
    }
  }
  // Broad, simple patches stay readable at battlefield size.
  c.beginPath()
  c.moveTo(29.5, 20)
  c.bezierCurveTo(27, 25, 25, 28, 19, 30)
  c.bezierCurveTo(19, 35, 26, 38, 30.5, 33.5)
  c.quadraticCurveTo(33, 29, 29.5, 20)
  c.fillStyle = BELLY
  c.fill()
  c.fillStyle = light
  c.beginPath()
  c.ellipse(19, 25.8, 5, 1.8, -0.2, 0, Math.PI * 2)
  c.fill()
  c.beginPath()
  c.moveTo(27.5, 7.3)
  c.quadraticCurveTo(30, 4.5, 35.5, 7)
  c.quadraticCurveTo(30.5, 6.5, 27.5, 9)
  c.fill()
  c.strokeStyle = SHADE
  c.lineWidth = 2
  for (const [x, y] of [[10, 26], [15, 25], [20, 24]]) {
    c.beginPath()
    c.moveTo(x, y)
    c.quadraticCurveTo(x - 1, y + 1.5, x + 0.5, y + 3)
    c.stroke()
  }
  // A bent, weight-bearing near leg and broad toes replace the stick feet.
  c.strokeStyle = INK
  c.lineWidth = 1.8
  c.save()
  stride(c, step, 19, 31, 0.3)
  c.beginPath()
  if (stomping) {
    c.moveTo(17, 30)
    c.bezierCurveTo(23, 28, 26, 32, 23, 35)
    c.quadraticCurveTo(29, 34, 30, 38)
    c.lineTo(20, 38)
    c.quadraticCurveTo(16, 38, 17, 35)
    c.quadraticCurveTo(13, 34, 17, 30)
  } else {
    c.moveTo(17, 30)
    c.bezierCurveTo(23, 28, 26, 34, 22, 38)
    c.lineTo(22, 40)
    c.quadraticCurveTo(28, 40, 28, 44)
    c.lineTo(16, 44)
    c.quadraticCurveTo(14, 42, 16, 37)
    c.quadraticCurveTo(12, 34, 17, 30)
  }
  c.closePath()
  c.fillStyle = REX
  c.fill()
  c.stroke()
  c.strokeStyle = SHADE
  c.lineWidth = 1.1
  c.beginPath()
  c.arc(19, 33.6, 3, -1.1, 0.8)
  c.stroke()
  c.strokeStyle = INK
  c.lineWidth = 0.8
  const toeY = stomping ? 35 : 41
  for (const x of [20, 24, 28.5]) poly(c, '#fff3d7', x, toeY, x + 2.2, toeY + 2.5, x, toeY + 2.5)
  c.restore()
  c.lineWidth = 0.8
  if (form === 2) {
    c.strokeStyle = '#8995a1'
    c.lineWidth = 0.55
    for (const [x, y] of [[15, 28], [20, 27], [25, 26], [28, 22], [27, 16], [17, 33]]) {
      poly(c, '#454e5b', x - 2, y - 1, x, y - 2.5, x + 2.5, y - 1, x + 1, y + 2, x - 1, y + 1.5)
    }
    c.strokeStyle = INK
  }
  // A large eye, lifted cheek and a blunt snout give him a readable expression.
  eye(c, 31.8, 10.8, 3.1, 1.5)
  if (alpha) {
    dot(c, 31.8, 10.8, 2.2, '#d93245')
    dot(c, 32.2, 10.9, 0.9, '#5e1827')
  }
  dot(c, 32.6, 10, 0.55, '#fff')
  c.lineWidth = alpha ? 2.2 : 1.7
  c.beginPath()
  c.moveTo(28.5, 6.8)
  c.quadraticCurveTo(31, 6.8, 34, 8.6)
  c.stroke()
  dot(c, 42.7, 10.7, 0.9, INK)
  dot(c, 40.2, 10.4, 0.45, SHADE)
  c.lineWidth = 1
  c.strokeStyle = SHADE
  c.beginPath()
  c.moveTo(32.5, 14.8)
  c.quadraticCurveTo(34.5, 15.8, 36.5, 14.8)
  c.stroke()
  c.strokeStyle = INK
  c.lineWidth = 0.8
  poly(c, '#703d3b', 29, 17.3, 44, 17.3, 42, 22.5, 29, 21)
  for (const x of [35, 39, 43]) poly(c, '#fff9e9', x - 1.2, 17.4, x, 20, x + 1.2, 17.4)
  c.restore()
}

function rexJaw(c: C, form: RexForm = 0) {
  const { body: REX, belly: BELLY } = REX_PALETTES[form]
  c.save()
  c.lineWidth = 0.8
  for (const x of [34, 38.5, 42]) poly(c, '#fff9e9', x - 1, 20, x, 17.7, x + 1, 20)
  c.lineWidth = 1.7
  c.beginPath()
  c.moveTo(28.5, 18.5)
  c.quadraticCurveTo(35, 20, 44, 19)
  c.quadraticCurveTo(45, 23, 40, 24)
  c.lineTo(32, 24)
  c.quadraticCurveTo(27, 23.5, 28.5, 18.5)
  c.closePath()
  c.fillStyle = REX
  c.fill()
  c.stroke()
  c.strokeStyle = BELLY
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(31, 22)
  c.quadraticCurveTo(36, 23, 41, 21.8)
  c.stroke()
  c.restore()
}

function rexArm(c: C, form: RexForm = 0) { // can't reach anything, waves anyway
  const REX = REX_PALETTES[form].body
  c.save()
  for (const [w, col] of [[4.8, INK], [2.5, REX]] as const) {
    c.lineWidth = w
    c.strokeStyle = col
    line(c, 30, 27, 32.5, 29, 35, 28.5)
  }
  c.strokeStyle = INK
  c.lineWidth = 0.8
  poly(c, '#fff3d7', 34.5, 27.4, 37, 28, 34.8, 29)
  poly(c, '#fff3d7', 34.5, 29, 36.5, 30.5, 34, 30)
  c.restore()
}

function rex(c: C, form: RexForm = 0, step?: number) { // tray icon: all the pieces, mouth open
  rexBody(c, form, false, step)
  rexArm(c, form)
  c.save()
  c.translate(REX_JAW[0], REX_JAW[1])
  c.rotate(0.18)
  c.translate(-REX_JAW[0], -REX_JAW[1])
  rexJaw(c, form)
  c.restore()
}

export function buildRexSprite(color?: string, form: RexForm = 0, step?: number) {
  return buildSprite((c) => rex(c, form, step), color, [25, 23, 6])
}

export function buildRexEggSprite(color?: string) {
  return buildSprite((c) => {
    ellipse(c, 24, 32, 11, 13, '#e2bf86')
    ellipse(c, 20, 25, 4, 6, '#f8e4ba')
    c.lineWidth = 1
    ellipse(c, 29, 24, 2.3, 3, '#a87343')
    ellipse(c, 19, 34, 2.5, 2, '#a87343')
    ellipse(c, 29, 37, 3, 2.5, '#a87343')
    line(c, 23, 23, 25, 28, 22, 31)
  }, color, [18, 33, 12])
}

export function buildRexParts(color?: string, form: RexForm = 0) {
  return {
    body: buildSprite((c) => rexBody(c, form), color, [25, 23, 6]),
    walkingBody: (step: number) => buildSprite((c) => rexBody(c, form, false, step), color, [25, 23, 6]),
    stompingBody: buildSprite((c) => rexBody(c, form, true), color, [25, 23, 6]),
    jaw: buildSprite((c) => rexJaw(c, form), undefined, [0, 0, 0], false),
    arm: buildSprite((c) => rexArm(c, form), undefined, [0, 0, 0], false),
  }
}

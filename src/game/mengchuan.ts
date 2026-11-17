import { box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2d8c4', HAIR = '#1c1f2b', HAIR_SHADE = '#3a4258', TIE = '#2fa8e8'
const ARMOR = '#262a3a', ARMOR_DARK = '#171a26', SILVER = '#aab4c8', GLOW = '#4d9bff', GLOW_PALE = '#9fd2ff'
const SILK = '#2f6be0', SILK_PALE = '#5fc0f0', STEEL = '#dfe6ef'

// Normal form of three; the other two forms and switching between them come later.
export const MENG_CHUAN = {
  name: 'Meng Chuan',
  blurb: 'A swordsman in dark spiked armour trailing torn blue silk. Autumn Breeze: dashes through foes, binding them, and painted slashes burst across his cut',
  radius: 11, hp: 820, speed: 140, damage: 28, range: 16, detection: 480,
  cooldown: 0.5, knockback: 90, spacing: 44, size: 1.25, color: SILK,
} as const

type MengPose = 'ready' | 'slash' | 'parry'

function drawJian(c: C, length: number) {
  c.save()
  c.lineWidth = 1
  box(c, -5, -1.1, 7, 2.2, 0.8, ARMOR_DARK)
  poly(c, STEEL, 3.5, -1, length - 3, -1, length, 0, length - 3, 1, 3.5, 1)
  c.strokeStyle = '#ffffff'
  c.lineWidth = 0.6
  line(c, 4.5, -0.2, length - 4, -0.2)
  c.strokeStyle = INK
  c.lineWidth = 0.9
  poly(c, SILVER, 2.4, -3, 3.6, -1, 3.6, 1, 2.4, 3, 1.8, 0)
  c.restore()
}

// A thin glowing blue seam, the armour's inlay.
function seam(c: C, ...points: number[]) {
  c.save()
  c.strokeStyle = GLOW
  c.lineWidth = 0.9
  line(c, ...points)
  c.restore()
}

function drawMengChuan(c: C, pose: MengPose, step?: number) {
  // Long ponytail falling down his back.
  c.save()
  c.lineWidth = 1.3
  poly(c, HAIR, 19, 5, 13, 9, 10.5, 19, 12, 27, 15.5, 22, 17, 14)
  c.restore()

  // Back arm: dark gauntlet hanging at his side.
  poly(c, ARMOR, 16.5, 20, 12.5, 23, 12, 31, 16, 31.5, 18.5, 25)
  seam(c, 13.2, 29.5, 15.6, 29.8)

  // Armoured legs and pointed boots.
  const armouredLeg = (x1: number, x2: number) => {
    poly(c, ARMOR_DARK, x1, 33, x2, 33, x2 - 0.5, 40, x1 + 0.5, 40)
    seam(c, x1 + 2.5, 35, x1 + 2.5, 39)
    poly(c, ARMOR, x1 - 1, 39.5, x2 + 0.5, 39.5, x2 + 3.5, 44, x1 - 1, 44)
  }
  leg(c, step, 20, 34, () => armouredLeg(17, 23))
  leg(c, opposite(step), 28, 34, () => armouredLeg(25, 31))

  // Torn silk tassets: dark under-layer, then blue strips with jagged hems.
  poly(c, ARMOR_DARK, 15, 28, 33, 28, 35, 38, 31, 36, 28, 39, 24, 36, 20, 39, 17, 36, 13, 38)
  c.save()
  c.lineWidth = 1
  poly(c, SILK, 15.5, 29, 19.5, 29, 18.5, 40, 16.8, 37.5, 14, 39)
  poly(c, SILK_PALE, 21, 29, 24, 29, 24.5, 37, 23, 35.5, 21.2, 37.5)
  poly(c, SILK, 26, 29, 30, 29, 31, 41, 29, 38.5, 26.8, 40)
  poly(c, SILK_PALE, 31, 29, 33.5, 29, 35.5, 37, 33.5, 36, 32.5, 38)
  c.restore()

  // Breastplate with layered silver ridges and blue inlay.
  poly(c, ARMOR, 16, 18.5, 32, 18.5, 33.5, 28.5, 14.5, 28.5)
  c.save()
  c.strokeStyle = SILVER
  c.lineWidth = 0.8
  line(c, 18, 20, 24, 25, 30, 20)
  line(c, 17, 23, 24, 27.5, 31, 23)
  c.restore()
  seam(c, 24, 19.5, 24, 26)
  seam(c, 19.5, 21.5, 22, 24)
  seam(c, 28.5, 21.5, 26, 24)
  // Belt with a glowing gem.
  c.save()
  c.lineWidth = 1
  box(c, 14.5, 27, 19, 2.6, 1, ARMOR_DARK)
  ellipse(c, 24, 28.3, 1.4, 1.4, GLOW_PALE)
  c.restore()

  // High collar.
  poly(c, ARMOR_DARK, 19, 16.5, 30, 16.5, 31, 20, 18, 20)

  const hand = (x: number, y: number) => {
    c.save()
    c.lineWidth = 1.2
    ellipse(c, x, y, 2.2, 2.2, ARMOR_DARK)
    c.restore()
  }

  // Front arm: the jian held low, or extended at the end of a cut with a blue brush arc ahead of it.
  if (pose === 'ready') {
    poly(c, ARMOR, 28, 20, 34, 20.5, 38.5, 28, 35.5, 30.5, 30, 26)
    seam(c, 35, 27, 37, 28.5)
    c.save()
    c.translate(37, 29.5)
    c.rotate(1.05)
    drawJian(c, 14)
    c.restore()
    hand(37, 29.5)
  } else if (pose === 'parry') {
    // Front arm raised, the jian held up across his face to turn a blow aside.
    poly(c, ARMOR, 28, 20, 34, 19, 37.5, 22.5, 35, 25.5, 30, 25)
    seam(c, 34.5, 21, 36.5, 22.5)
    c.save()
    c.translate(36, 22)
    c.rotate(-1.2)
    drawJian(c, 14)
    c.restore()
    hand(36, 22)
  } else {
    c.save()
    c.strokeStyle = GLOW_PALE
    c.lineWidth = 3
    c.globalAlpha = 0.85
    c.beginPath()
    c.arc(30, 24, 15, -1.2, 0.75)
    c.stroke()
    c.strokeStyle = GLOW
    c.lineWidth = 1.2
    c.beginPath()
    c.arc(30, 24, 17, -1.0, 0.6)
    c.stroke()
    c.restore()
    poly(c, ARMOR, 28, 20, 34, 19.5, 38, 22, 36.5, 26, 30, 25.5)
    c.save()
    c.translate(37, 24)
    c.rotate(0.35)
    drawJian(c, 10)
    c.restore()
    hand(37, 24)
  }

  // Spiked pauldron on the front shoulder, horn sweeping up.
  poly(c, ARMOR, 25.5, 17.5, 32, 15.5, 35.5, 19, 34.5, 23.5, 29, 23, 26, 21)
  poly(c, ARMOR_DARK, 31, 16, 33.5, 7.5, 34.5, 17)
  seam(c, 28, 19.5, 31.5, 18, 33.5, 20.5)

  // Head: pale face, black hair with long side bangs, high topknot bound in blue.
  c.save()
  c.lineWidth = 1.6
  ellipse(c, 25, 13, 7.2, 7.5, SKIN)
  c.lineWidth = 1.3
  poly(c, HAIR, 17.5, 15, 17.2, 8, 20, 4.5, 25, 3.2, 30, 4.2, 33, 7.5, 32.5, 10.5, 29, 8.5, 26.5, 10.5, 24, 8.5, 21.5, 11, 20.5, 18)
  poly(c, HAIR, 31.5, 8.5, 33.2, 10, 33, 16.5, 31.2, 13)
  ellipse(c, 22.5, 2.6, 2.6, 2, HAIR)
  c.lineWidth = 0.9
  box(c, 21.4, 3.2, 2.4, 2, 0.6, TIE)
  c.strokeStyle = HAIR_SHADE
  c.lineWidth = 0.7
  line(c, 20.5, 6.5, 27, 5)
  line(c, 18.5, 10, 19, 15.5)
  c.restore()
  // Stern brow and a cold narrow eye.
  c.save()
  c.lineWidth = 1.2
  line(c, 26.5, 11.3, 31, 11.9)
  ellipse(c, 29, 13.8, 1.9, 1.3, '#fff')
  c.fillStyle = '#4a5f8c'
  c.beginPath()
  c.arc(29.6, 13.8, 1, 0, Math.PI * 2)
  c.fill()
  c.lineWidth = 0.9
  line(c, 28.4, 18.4, 30.6, 18.2)
  c.restore()
}

export function buildMengChuanSprite(color?: string, pose: MengPose = 'ready', step?: number) {
  // Team colour is his belt sash.
  return buildSprite((c) => drawMengChuan(c, pose, step), color, [15, 26.5, 18])
}

// First skill, Autumn Breeze (秋风): a dash through the target that cuts and binds every enemy on the line,
// then curved painted slashes burst across the cut and a painting of the autumn wind blooms along it.
export const MENG_BREEZE = { min: 50, range: 220, past: 22, speed: 950, width: 20, damage: 42, paint: 2.4, cooldown: 7 } as const

const GOLD = '#f2c230', GOLD_DARK = '#c98f1a', GOLD_PALE = '#fff1a8', LEAF = '#5fae4a', LEAF_DARK = '#3d7f34', LEAF_TIP = '#9ccf6a'
const TEAL = '#2fb3a6', CYAN = '#3fd6ff', JADE = '#2fd27a', JADE_PALE = '#b4ffc8', PAPER = '#fbf7ec'
const SEAL = '#d8452f', FADE = 0.5, UNROLL = 0.5, HALF = 20 // the painting's half-height
const LIFT = 18 // the effect floats at body height above the ground line
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
export const ease = (t: number) => 1 - (1 - clamp01(t)) ** 3
const rand = (i: number, k: number) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s) }

// A ginkgo leaf, stem at the origin, fan pointing up (-y).
function ginkgo(c: C, s: number) {
  c.beginPath()
  c.moveTo(0, 0)
  c.quadraticCurveTo(-s * 1.15, -s * 0.35, -s, -s * 1.2)
  c.quadraticCurveTo(-s * 0.55, -s * 1.5, -s * 0.1, -s * 1.22)
  c.lineTo(0, -s * 0.95)
  c.lineTo(s * 0.1, -s * 1.22)
  c.quadraticCurveTo(s * 0.55, -s * 1.5, s, -s * 1.2)
  c.quadraticCurveTo(s * 1.15, -s * 0.35, 0, 0)
  const g = c.createLinearGradient(0, 0, 0, -s * 1.4)
  g.addColorStop(0, GOLD_DARK)
  g.addColorStop(1, GOLD)
  c.fillStyle = g
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.45
  c.stroke()
  c.strokeStyle = 'rgba(150,100,20,.65)'
  c.lineWidth = 0.3
  for (const a of [-0.75, -0.35, 0.35, 0.75]) line(c, 0, 0, Math.sin(a) * s * 1.15, -Math.cos(a) * s * 1.2)
  c.strokeStyle = INK
  c.lineWidth = 0.5
  line(c, 0, 0, 0, s * 0.7)
}

// A slender bamboo leaf along x, base at -x, tip at +x.
function bamboo(c: C, s: number) {
  c.beginPath()
  c.moveTo(-s * 1.7, 0)
  c.quadraticCurveTo(-s * 0.3, -s * 0.62, s * 1.7, 0)
  c.quadraticCurveTo(-s * 0.3, s * 0.5, -s * 1.7, 0)
  const g = c.createLinearGradient(-s * 1.7, 0, s * 1.7, 0)
  g.addColorStop(0, LEAF_DARK)
  g.addColorStop(0.55, LEAF)
  g.addColorStop(1, LEAF_TIP)
  c.fillStyle = g
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.45
  c.stroke()
  c.strokeStyle = 'rgba(255,255,230,.6)'
  c.lineWidth = 0.35
  line(c, -s * 1.5, 0, s * 1.4, -s * 0.05)
}

// A leaf tumbling in the wind: `flip` squashes it across its width as it turns over.
function leaf(c: C, green: boolean, x: number, y: number, angle: number, flip: number, size: number, alpha: number) {
  if (alpha <= 0.01) return
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.scale(1, Math.sign(flip || 1) * Math.max(0.15, Math.abs(flip)))
  c.globalAlpha *= alpha
  if (green) bamboo(c, size)
  else ginkgo(c, size)
  c.restore()
}

// A cloud curl (卷云纹): a spiral winding in from radius r.
function curl(c: C, x: number, y: number, r: number, dir: number, spin: number) {
  c.beginPath()
  for (let k = 0; k <= 24; k++) {
    const p = k / 24, a = spin + dir * p * Math.PI * 3, rr = r * (1 - p * 0.85)
    if (k) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8)
    else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8)
  }
  c.stroke()
}

const ribbonY = (u: number, v0: number, amp: number, wave: number, phase: number) => v0 + Math.sin(u / wave + phase) * amp

// A flowing wind ribbon from `from` to `to`: a soft wash under a crisp line, waves travelling with `phase`,
// ending in a curl.
function ribbon(c: C, from: number, to: number, v0: number, amp: number, wave: number, phase: number, color: string, dir: number) {
  if (to - from < 4) return
  c.beginPath()
  for (let u = from; u <= to; u += 3) {
    const v = ribbonY(u, v0, amp, wave, phase)
    if (u === from) c.moveTo(u, v)
    else c.lineTo(u, v)
  }
  c.strokeStyle = color
  const alpha = c.globalAlpha
  c.globalAlpha = alpha * 0.25
  c.lineWidth = 3.4
  c.stroke()
  c.globalAlpha = alpha
  c.lineWidth = 1.1
  c.stroke()
  curl(c, to, ribbonY(to, v0, amp, wave, phase) + dir * 3.2, 4, dir, phase * 0.5)
}

// The autumn-wind painting along the cut, `t` seconds after the dash, painted straight onto the battlefield:
// it spreads from the start of the cut to its end, plays, then dissolves.
function drawPainting(c: C, x1: number, y1: number, x2: number, y2: number, t: number, tick: number) {
  const L = Math.hypot(x2 - x1, y2 - y1), fade = clamp01((MENG_BREEZE.paint - t) / FADE)
  const flip = x2 < x1 ? -1 : 1 // keeps the painting's top up when he dashes left
  const open = L * ease(t / UNROLL), scene = fade * ease((t - 0.1) / 0.4)
  c.save()
  c.translate(x1, y1 - LIFT)
  c.rotate(Math.atan2(y2 - y1, x2 - x1))
  c.scale(1, flip)
  c.lineCap = c.lineJoin = 'round'
  // Pale autumn sun.
  if (L * 0.72 < open) {
    c.globalAlpha = scene * 0.55
    c.fillStyle = GOLD
    c.beginPath()
    c.arc(L * 0.72, -10, 4.5, 0, Math.PI * 2)
    c.fill()
  }
  // Far blue peaks and near green hills rising out of nothing at both ends, washed into mist at their feet,
  // ridges touched with ink.
  const hills = (base: number, height: number, f1: number, f2: number, seed: number, fill: string, ink: number) => {
    const ridge = (u: number) => HALF - (HALF - base + height * (0.55 + 0.3 * Math.sin(u * f1 + seed) + 0.15 * Math.sin(u * f2 + seed * 2)))
      * Math.sin(Math.PI * clamp01(u / L)) ** 0.5
    c.beginPath()
    c.moveTo(0, HALF)
    for (let u = 0; u <= open; u += 4) c.lineTo(u, ridge(u))
    c.lineTo(open, ridge(open))
    c.lineTo(open, HALF)
    const g = c.createLinearGradient(0, base - height, 0, HALF)
    g.addColorStop(0, fill)
    g.addColorStop(1, 'rgba(251,247,236,0)')
    c.fillStyle = g
    c.fill()
    c.beginPath()
    for (let u = 0; u <= open; u += 4) c.lineTo(u, ridge(u))
    c.strokeStyle = `rgba(34,31,51,${ink})`
    c.lineWidth = 0.5
    c.stroke()
    // A few texture strokes (皴) down the slopes.
    for (let u = 14 + seed * 3; u < open - 6; u += 31) {
      const v = ridge(u)
      if (v > HALF - 4) continue
      line(c, u, v + 1.5, u - 2, v + 5)
      line(c, u + 3, v + 2, u + 1.5, v + 6.5)
    }
  }
  c.globalAlpha = scene
  hills(4, 22, 0.05, 0.13, 1.7, 'rgba(62,123,250,.5)', 0.2)
  hills(13, 15, 0.08, 0.21, 4.1, 'rgba(47,160,120,.6)', 0.3)
  // Drifting mist bands.
  c.fillStyle = 'rgba(251,247,236,.75)'
  for (let k = 0; k < 3; k++) {
    const u = ((k * (L + 40)) / 3 + t * 14) % (L + 40) - 20
    if (u > open) continue
    c.beginPath()
    c.ellipse(u, 9 + k * 2.5, 22, 2.6, 0, 0, Math.PI * 2)
    c.fill()
  }
  // Wild geese (雁) crossing the sky.
  c.strokeStyle = INK
  c.lineWidth = 0.55
  for (let k = 0; k < 3; k++) {
    const gu = L * 0.28 + t * 11 + k * 7, gv = -13 + Math.abs(k - 1) * 2.2, wing = 1.2 + Math.sin(tick * 0.3 + k) * 0.9
    if (gu < open) line(c, gu - 2.2, gv - wing, gu, gv, gu + 2.2, gv - wing)
  }
  // Wind: three ribbons with cloud curls blowing toward the far end.
  const flow = tick * 0.07
  ribbon(c, 0, open, -9, 3, 9, flow, SILK, 1)
  ribbon(c, 6, open - 6, -1, 2.5, 7, flow + 2, SILK_PALE, -1)
  ribbon(c, 2, open - 12, 6, 2, 11, flow + 4, TEAL, 1)
  c.strokeStyle = SILK_PALE
  c.lineWidth = 0.9
  for (let u = 40; u < open - 20; u += 70) curl(c, u, ribbonY(u, -9, 3, 9, flow) - 4, 3, -1, flow)
  // A ginkgo branch reaching in over the start, swaying, its leaves fluttering.
  const grow = ease((t - 0.25) / 0.5), reach = Math.min(72, L * 0.45), sway = Math.sin(tick * 0.05) * 1.5
  const twig = (s: number) => [reach * s, -HALF + 1 + 13 * s * s + Math.sin(s * 3) * 2 + sway * s] as const
  c.globalAlpha = scene
  c.strokeStyle = INK
  for (let k = 0; k < 8 && k / 8 < grow; k++) {
    const [ua, va] = twig(k / 8), [ub, vb] = twig(Math.min(grow, (k + 1) / 8))
    c.lineWidth = 2.2 - k * 0.2
    line(c, ua, va, ub, vb)
  }
  for (let k = 0; k < 6; k++) {
    const s = 0.3 + k * 0.13
    if (s > grow) break
    const [u, v] = twig(s), side = k % 2 ? 1 : -1
    c.strokeStyle = INK
    c.lineWidth = 0.5
    line(c, u, v, u + side * 2, v + 3)
    leaf(c, false, u + side * 2, v + 3, Math.PI + side * 0.5 + Math.sin(tick * 0.08 + k) * 0.25, 1, 3.1, 1)
  }
  // Inscription 秋风 and the seal, written once it has spread; kept upright when the painting is flipped.
  const write = (u: number, v: number, draw: () => void) => {
    c.save()
    c.translate(u, v)
    c.scale(flip, 1)
    draw()
    c.restore()
  }
  c.font = `bold 11px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let k = 0; k < 2; k++) {
    const p = ease((t - 0.5 - k * 0.15) / 0.25)
    if (p <= 0) continue
    c.globalAlpha = fade * p
    write(L - 12, -10 + k * 11, () => {
      c.scale(1.3 - p * 0.3, 1.3 - p * 0.3)
      c.strokeStyle = PAPER
      c.lineWidth = 2.5
      c.strokeText('秋风'[k], 0, 0)
      c.fillStyle = INK
      c.fillText('秋风'[k], 0, 0)
    })
  }
  const stamp = ease((t - 0.95) / 0.15)
  if (stamp > 0) {
    c.globalAlpha = fade * stamp
    write(L - 12, 13, () => {
      c.scale(1.6 - stamp * 0.6, 1.6 - stamp * 0.6)
      c.fillStyle = SEAL
      c.fillRect(-3.5, -3.5, 7, 7)
      c.strokeStyle = PAPER
      c.lineWidth = 0.4
      c.strokeRect(-2.6, -2.6, 5.2, 5.2)
      c.fillStyle = PAPER
      c.font = '5px KaiTi, STKaiti, "Noto Serif CJK SC", serif'
      c.fillText('孟', 0, 0.3)
    })
  }
  // Gust strokes racing past above and below.
  c.strokeStyle = SILK_PALE
  c.lineWidth = 1
  for (let k = 0; k < 6; k++) {
    const u = (t * 260 + k * 53) % (L + 60) - 30, v = (k % 2 ? 1 : -1) * (HALF + 7 + (k % 3) * 4)
    c.globalAlpha = fade * 0.6 * scene
    line(c, u, v, u + 16, v + Math.sin(u * 0.05) * 1.5)
  }
  // Leaves blown out of the painting, tumbling past its edges.
  const count = Math.max(10, Math.min(22, Math.round(L / 10)))
  for (let i = 0; i < count; i++) {
    const born = 0.15 + rand(i, 1) * 0.5 + rand(i, 2) * 0.9, age = t - born
    if (age <= 0) continue
    const u0 = rand(i, 3) * L * 0.8, v0 = (rand(i, 4) - 0.5) * 26
    const u = u0 + age * (50 + rand(i, 5) * 60) + age * age * 20
    const v = v0 + Math.sin(age * 2.4 + rand(i, 6) * 6) * 7 + (rand(i, 7) - 0.5) * 34 * age
    const spin = (rand(i, 8) < 0.5 ? -1 : 1) * (1.5 + rand(i, 9) * 2.5)
    c.globalAlpha = fade
    leaf(c, i % 5 > 2, u, v, rand(i, 10) * 6 + age * spin, Math.cos(age * (5 + rand(i, 11) * 4)), 2.8 + rand(i, 12) * 1.4, clamp01(age / 0.15))
  }
  c.restore()
}

// One painted slash from tail (ax, ay) to head (bx, by), `w` wide at its belly; `start` is when it is painted.
// `bend` bows it sideways as a fraction of its length (0 is straight).
type Stroke = { ax: number; ay: number; bx: number; by: number; w: number; bend: number; start: number; dark: string; light: string; ghost: string; seed: number }
const PALETTES = [[SILK, CYAN, GOLD], [JADE, JADE_PALE, SILK_PALE], [GOLD_DARK, GOLD_PALE, JADE], [SILK, GLOW_PALE, JADE]] as const

// The main cut along the dash, five slashes crossing it and two long hairline cuts, the same every frame.
// `curve` scales how much they sweep: 0 straight, 1 curved arcs.
function breezeStrokes(x1: number, y1: number, x2: number, y2: number, curve: number) {
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, angle = Math.atan2(uy, ux)
  const seed = Math.round(x1 * 3.1 + y1 * 7.7), size = Math.min(1.3, 0.6 + L / 300), up = ux >= 0 ? -1 : 1 // bows upward on screen
  const strokes: Stroke[] = [{ ax: x1 - ux * 14, ay: y1 - uy * 14, bx: x2 + ux * 18, by: y2 + uy * 18, w: 8, bend: 0.14 * up * curve, start: 0,
    dark: SILK, light: CYAN, ghost: GOLD, seed }]
  for (let i = 0; i < 5; i++) {
    const r = (k: number) => rand(seed + i * 13, k), s = 0.15 + 0.7 * r(1), off = (r(2) - 0.5) * 16
    const cx = x1 + ux * L * s - uy * off, cy = y1 + uy * L * s + ux * off
    const a = angle + (i % 2 ? 1 : -1) * (0.35 + r(3) * 0.85), half = (26 + r(4) * 26) * size
    const [dark, light, ghost] = PALETTES[(i + 1) % PALETTES.length]
    strokes.push({ ax: cx - Math.cos(a) * half, ay: cy - Math.sin(a) * half, bx: cx + Math.cos(a) * half, by: cy + Math.sin(a) * half,
      w: 3 + r(5) * 3, bend: (i % 2 ? 1 : -1) * (0.18 + r(6) * 0.2) * curve, start: 0.06 + i * 0.07, dark, light, ghost, seed: seed + i * 13 })
  }
  for (const [k, tilt] of [[0, 0.12], [1, -0.09]] as const) {
    const a = angle + tilt, half = L / 2 + 40, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + (k ? 6 : -6)
    strokes.push({ ax: cx - Math.cos(a) * half, ay: cy - Math.sin(a) * half, bx: cx + Math.cos(a) * half, by: cy + Math.sin(a) * half,
      w: 1.4, bend: 0.06 * up * curve, start: 0.4 + k * 0.07, dark: GLOW_PALE, light: '#ffffff', ghost: CYAN, seed: seed + 97 + k })
  }
  return strokes
}

// A stroke's curve: at(s, off, along) is the point `off` px to its left and `along` px ahead at s (0 tail, 1 head).
function strokePath(st: Stroke) {
  const len = Math.hypot(st.bx - st.ax, st.by - st.ay)
  const cx = (st.ax + st.bx) / 2 - (st.by - st.ay) * st.bend, cy = (st.ay + st.by) / 2 + (st.bx - st.ax) * st.bend
  const at = (s: number, off = 0, along = 0) => {
    const u = 1 - s, dx = u * (cx - st.ax) + s * (st.bx - cx), dy = u * (cy - st.ay) + s * (st.by - cy), d = Math.hypot(dx, dy) || 1
    const tx = dx / d, ty = dy / d
    return [u * u * st.ax + 2 * u * s * cx + s * s * st.bx - ty * off + tx * along, u * u * st.ay + 2 * u * s * cy + s * s * st.by + tx * off + ty * along] as const
  }
  return { at, len }
}

// Paints one slash: colour ghosts fringing it like misregistered print, an ink body, a colour wash brightening to
// white at the head, broken dry-brush hairs and a razor-white edge, then ink flicked past the head.
// `reveal` paints it from tail to head, `thin` wastes it away, `jitter` shakes the fringe.
function slash(c: C, st: Stroke, reveal: number, thin: number, jitter: number) {
  const { at, len } = strokePath(st)
  if (len < 1 || reveal <= 0 || thin <= 0) return
  const N = 24, base = c.globalAlpha
  // One edge stays clean like a blade, the other frays like a dragged brush.
  const edge = (side: number, scale: number, offN: number, offT: number, out: number[]) => {
    for (let k = 0; k <= N; k++) {
      const s = (side > 0 ? k : N - k) / N * reveal
      const taper = Math.sin(Math.PI * s) ** 0.6 * (0.55 + 0.45 * s) * Math.min(1, (reveal - s) * len / 8 + 0.15)
      const rough = 1 + (rand(st.seed + k, side > 0 ? 20 : 21) - 0.5) * (side > 0 ? 0.15 : 0.6)
      out.push(...at(s, st.w * scale * thin * taper * rough * side + offN, offT))
    }
    return out
  }
  const fill = (scale: number, offN: number, offT: number, style: string | CanvasGradient, alpha: number) => {
    const pts = edge(-1, scale, offN, offT, edge(1, scale, offN, offT, []))
    c.beginPath()
    c.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
    c.closePath()
    c.fillStyle = style
    c.globalAlpha = base * alpha
    c.fill()
  }
  const trace = (s0: number, s1: number, off: number) => {
    c.beginPath()
    for (let k = 0; k <= 12; k++) {
      const [x, y] = at(s0 + (s1 - s0) * k / 12, off)
      if (k) c.lineTo(x, y)
      else c.moveTo(x, y)
    }
    c.stroke()
  }
  fill(1.05, 2 + jitter, 0, st.ghost, 0.45)
  fill(1.05, -1.5 - jitter, 0, st.light, 0.35)
  fill(1.25, 0, -1.5, INK, 0.9)
  const wash = c.createLinearGradient(st.ax, st.ay, st.bx, st.by)
  wash.addColorStop(0, st.dark)
  wash.addColorStop(0.6, st.light)
  wash.addColorStop(1, '#ffffff')
  fill(0.8, 0.6, 0, wash, 1)
  c.lineCap = 'round'
  c.lineWidth = 0.5
  for (let h = 0; h < 4; h++) {
    const off = (h / 3 - 0.5) * st.w * 0.9 * thin, s0 = rand(st.seed, 30 + h) * 0.3, s1 = Math.min(reveal, 0.6 + rand(st.seed, 40 + h) * 0.4)
    if (s1 <= s0) continue
    c.setLineDash([2 + rand(st.seed, 50 + h) * 6, 1.5 + rand(st.seed, 60 + h) * 3])
    c.strokeStyle = h % 2 ? INK : PAPER
    c.globalAlpha = base * (h % 2 ? 0.55 : 0.7)
    trace(s0, s1, off)
  }
  c.setLineDash([])
  c.strokeStyle = '#ffffff'
  c.lineWidth = 0.9 * thin + 0.2
  c.globalAlpha = base
  trace(0.12, reveal, st.w * 0.25 * thin)
  if (reveal >= 1) {
    c.fillStyle = INK
    c.globalAlpha = base * 0.8
    for (let k = 0; k < 5; k++) {
      const [x, y] = at(1, (rand(st.seed, 80 + k) - 0.5) * 10, 3 + rand(st.seed, 70 + k) * 14)
      c.beginPath()
      c.arc(x, y, 0.4 + rand(st.seed, 90 + k) * 1.2 * thin, 0, Math.PI * 2)
      c.fill()
    }
  }
  c.globalAlpha = base
}

// Sharp coloured shards breaking off a slash `age` seconds after it lands, spinning away from it.
function shards(c: C, st: Stroke, age: number) {
  const life = 1.2, base = c.globalAlpha, { at, len } = strokePath(st)
  if (age <= 0 || age >= life || len < 1) return
  c.lineWidth = 0.4
  c.strokeStyle = INK
  for (let k = 0; k < 6; k++) {
    const r = (n: number) => rand(st.seed + k * 7, n), side = r(2) < 0.5 ? -1 : 1, speed = 40 + r(3) * 50
    const travel = speed * age * (1 - age / (life * 2)), size = (1.5 + r(4) * 2) * (st.w > 2 ? 1 : 0.6)
    const [x, y] = at(r(1), side * travel, travel * 0.4)
    c.save()
    c.translate(x, y)
    c.rotate(r(5) * 6 + age * (4 + r(6) * 6) * side)
    c.globalAlpha = base * (1 - age / life)
    c.fillStyle = k % 3 ? st.light : st.ghost
    c.beginPath()
    c.moveTo(size * 1.6, 0)
    c.lineTo(-size * 0.6, size * 0.55)
    c.lineTo(-size * 0.3, -size * 0.6)
    c.closePath()
    c.fill()
    c.stroke()
    c.restore()
  }
}

// The painted slashes alone along the cut from (x1, y1) to (x2, y2), ground points. While `dashing` a thin cut
// chases him; `time` seconds after the dash the slashes are painted on one after another, shed shards while their
// colour fringes shimmer, then waste away. `curve` 0 gives the straight version.
export function drawMengSlashes(c: C, x1: number, y1: number, x2: number, y2: number, dashing: boolean, time: number, tick: number, curve = 1) {
  if (Math.hypot(x2 - x1, y2 - y1) < 1) return
  const strokes = breezeStrokes(x1, y1, x2, y2, curve)
  c.save()
  c.translate(0, -LIFT)
  c.lineJoin = 'round'
  if (dashing) slash(c, { ...strokes[0], ax: x1, ay: y1, bx: x2, by: y2, w: 3 }, 1, 1, 0)
  else {
    const fade = clamp01((MENG_BREEZE.paint - time) / FADE), jitter = Math.sin(tick * 0.9) * 0.8 * fade
    strokes.forEach((st, i) => {
      c.globalAlpha = fade
      const grow = i === 0 ? 0.4 + 0.6 * ease(time / 0.08) : 1 // the dash's thin cut swells into the main stroke
      slash(c, st, ease((time - st.start) / 0.1), grow * (0.35 + 0.65 * fade), jitter)
      shards(c, st, time - st.start - 0.08)
    })
  }
  c.restore()
}

// Autumn Breeze: the painting blooms along the cut behind the curved slashes.
export function drawMengBreeze(c: C, x1: number, y1: number, x2: number, y2: number, dashing: boolean, time: number, tick: number) {
  if (!dashing && Math.hypot(x2 - x1, y2 - y1) >= 1) drawPainting(c, x1, y1, x2, y2, time, tick)
  drawMengSlashes(c, x1, y1, x2, y2, dashing, time, tick)
}

// An enemy bound by the breeze at ground point (x, y): a turning ring of wind with leaves circling it.
// `left` is the painting's time left, for the fade-out.
export function drawMengBind(c: C, x: number, y: number, left: number, tick: number) {
  const alpha = clamp01(left * 4), spin = tick * 0.06
  if (alpha <= 0) return
  c.save()
  c.translate(x, y - 10)
  c.globalAlpha = alpha
  c.lineCap = 'round'
  c.lineWidth = 1.3
  c.strokeStyle = SILK
  c.beginPath()
  c.ellipse(0, 0, 14, 4.5, 0, spin, spin + 2.4)
  c.stroke()
  c.strokeStyle = TEAL
  c.beginPath()
  c.ellipse(0, 0, 14, 4.5, 0, spin + Math.PI, spin + Math.PI + 2.4)
  c.stroke()
  c.strokeStyle = SILK_PALE
  c.lineWidth = 0.8
  curl(c, Math.cos(spin + 2.4) * 14, Math.sin(spin + 2.4) * 4.5, 2.5, 1, spin)
  for (let k = 0; k < 3; k++) {
    const a = -spin * 1.3 + k * 2.09
    leaf(c, k === 1, Math.cos(a) * 15, Math.sin(a) * 5 - 2, a + Math.PI / 2, Math.cos(tick * 0.2 + k), 2.6, 1)
  }
  c.restore()
}

// Parry: he turns most attacks aside with the jian (`chance` of each enemy hit), holding a guard pose for `pose` seconds.
export const MENG_PARRY = { chance: 0.75, pose: 0.25, spark: 0.35 } as const

// The parry at ground point (x, y), the blow coming from `angle`: a curved blade flash meeting it, a glint at the
// point of contact, a pale ring, gold sparks sprayed back toward the attacker and a ginkgo leaf knocked loose.
// `progress` runs 0..1 over the spark's life; `seed` varies the spray.
export function drawMengParry(c: C, x: number, y: number, angle: number, progress: number, seed: number) {
  const p = clamp01(progress), out = 1 - p, ca = Math.cos(angle), sa = Math.sin(angle)
  const hx = x + ca * 12, hy = y - 22 + sa * 5 // where blade meets blow
  c.save()
  c.lineCap = c.lineJoin = 'round'
  // The blade's flash: a short crescent sweeping across the blow, ink under cyan under white.
  const sweep = ease(p / 0.35), from = angle - 1.1, to = from + 2.2 * sweep
  c.globalAlpha = out
  for (const [width, color] of [[4.5, INK], [3, CYAN], [1.1, '#ffffff']] as const) {
    c.strokeStyle = color
    c.lineWidth = width * (0.5 + out * 0.5)
    c.beginPath()
    c.ellipse(x, y - 22, 15, 11, 0, from, to)
    c.stroke()
  }
  // Pale blue ring spreading from the contact.
  c.globalAlpha = out * 0.7
  c.strokeStyle = GLOW_PALE
  c.lineWidth = 1
  c.beginPath()
  c.arc(hx, hy, 3 + ease(p) * 13, 0, Math.PI * 2)
  c.stroke()
  // Gold sparks sprayed back the way the blow came, falling as they fly.
  for (let k = 0; k < 9; k++) {
    const a = angle + (rand(seed + k, 1) - 0.5) * 1.8, speed = 22 + rand(seed + k, 2) * 26, d = speed * ease(p) * 0.9
    const sx = hx + Math.cos(a) * d, sy = hy + Math.sin(a) * d * 0.7 + p * p * 10, tail = 3 + out * 4
    c.globalAlpha = out
    c.strokeStyle = k % 3 ? GOLD : GOLD_PALE
    c.lineWidth = k % 3 ? 1 : 1.4
    line(c, sx, sy, sx - Math.cos(a) * tail, sy - Math.sin(a) * tail * 0.7 - p * 2)
  }
  // A four-point glint at the contact, flaring then gone.
  const g = Math.sin(Math.PI * clamp01(p / 0.5)) * 7
  if (g > 0.2) {
    c.globalAlpha = 1
    c.fillStyle = '#ffffff'
    c.strokeStyle = SILK
    c.lineWidth = 0.5
    c.beginPath()
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? g * 0.22 : g, a = k * Math.PI / 4 + 0.2
      c.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r)
    }
    c.closePath()
    c.fill()
    c.stroke()
  }
  // A ginkgo leaf knocked loose, fluttering away.
  leaf(c, rand(seed, 3) < 0.3, hx + ca * 16 * p, hy - 6 * p + p * p * 14, rand(seed, 4) * 6 + p * 5, Math.cos(p * 12), 2.6, out)
  c.restore()
}

// Five Autumn Shadows (五影秋斩): a parry can split him into five that surround the enemy. Unsure which is real, it strikes
// a clone; it shatters, and he and the other three dash through it to the far side and cut, freezing it under the straight slashes.
export const MENG_CLONE = {
  chance: 0.3, cooldown: 10, range: 260, count: 5, ring: 62, behind: 30,
  split: 0.4, feint: 0.6, strike: 0.35, dash: 0.2, damage: 64,
} as const
export const MENG_CLONE_TITLE = '五影秋斩'

const TITLE_COLORS = [SILK, CYAN, JADE, GOLD] as const

// The skill's name in big brush characters at (x, y), `time` seconds into the cut: each character slides in and
// settles, floats, carries colour fringes like the slashes, and is filled with the slash colours flowing through it,
// over a brush stroke that sweeps under them. Everything drifts up and fades as the cut ends.
export function drawMengTitle(c: C, x: number, y: number, time: number, tick: number) {
  const n = MENG_CLONE_TITLE.length, size = 24, gap = size * 1.08, width = gap * n
  const out = clamp01((MENG_BREEZE.paint - time) / FADE), left = x - width / 2, shift = (tick * 1.2) % width
  if (out <= 0) return
  c.save()
  c.lineJoin = c.lineCap = 'round'
  // The brush stroke under the name.
  const under: Stroke = { ax: left - 12, ay: y + size * 0.62, bx: left + width + 12, by: y + size * 0.55, w: 3.5, bend: -0.03, start: 0,
    dark: SILK, light: JADE_PALE, ghost: GOLD, seed: 7 }
  c.globalAlpha = out
  slash(c, under, ease((time - 0.15) / 0.3), out, Math.sin(tick * 0.9) * 0.6)
  c.font = `bold ${size}px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let i = 0; i < n; i++) {
    const p = ease((time - 0.05 - i * 0.08) / 0.22)
    if (p <= 0) continue
    const ch = MENG_CLONE_TITLE[i], scale = 1.6 - 0.6 * p, rise = (1 - out) * 14 + (1 - out) * i * 2
    const cx = left + gap * (i + 0.5) + (1 - p) * 22, cy = y + Math.sin(tick * 0.08 + i * 1.3) * 1.5 - rise
    c.save()
    c.translate(cx, cy)
    c.scale(scale, scale)
    c.globalAlpha = p * out
    const jitter = Math.sin(tick * 0.9 + i) * 0.7
    c.fillStyle = GOLD
    c.globalAlpha = p * out * 0.5
    c.fillText(ch, 1.6 + jitter, 0.8)
    c.fillStyle = CYAN
    c.fillText(ch, -1.6 - jitter, -0.6)
    c.globalAlpha = p * out
    c.strokeStyle = INK
    c.lineWidth = 5
    c.strokeText(ch, 0, 0)
    c.strokeStyle = '#ffffff'
    c.lineWidth = 1.6
    c.strokeText(ch, 0, 0)
    // The slash colours flow along the whole name; two repeats so the loop is seamless.
    const g0 = (left - shift - cx) / scale, g = c.createLinearGradient(g0, 0, g0 + (width * 2) / scale, 0)
    for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, TITLE_COLORS[k % 4])
    c.fillStyle = g
    c.fillText(ch, 0, 0)
    c.restore()
  }
  c.restore()
}

// A clone at ground point (x, y) breaking up into ink `p` (0..1) of the way: blots, cyan shards and a leaf flung off.
// `burst` throws them harder (a clone struck down rather than fading).
export function drawMengDissolve(c: C, x: number, y: number, p: number, seed: number, burst: number) {
  if (p <= 0 || p >= 1) return
  const out = 1 - p, spread = ease(p) * (16 + burst * 14)
  c.save()
  c.lineWidth = 0.4
  c.strokeStyle = INK
  for (let k = 0; k < 10; k++) {
    const a = rand(seed + k, 1) * Math.PI * 2, d = spread * (0.5 + rand(seed + k, 2) * 0.6)
    c.globalAlpha = out
    c.fillStyle = k % 4 ? INK : SILK
    c.beginPath()
    c.arc(x + Math.cos(a) * d, y - 20 + Math.sin(a) * d * 0.8 - p * 8, (0.8 + rand(seed + k, 3) * 1.8) * out, 0, Math.PI * 2)
    c.fill()
  }
  for (let k = 0; k < 4; k++) {
    const a = rand(seed + k, 4) * Math.PI * 2, d = spread * 1.2, s = 2 + rand(seed + k, 5) * 1.5
    c.save()
    c.translate(x + Math.cos(a) * d, y - 20 + Math.sin(a) * d * 0.8)
    c.rotate(a + p * 6)
    c.globalAlpha = out
    c.fillStyle = k % 2 ? CYAN : GLOW_PALE
    c.beginPath()
    c.moveTo(s * 1.6, 0)
    c.lineTo(-s * 0.6, s * 0.55)
    c.lineTo(-s * 0.3, -s * 0.6)
    c.closePath()
    c.fill()
    c.stroke()
    c.restore()
  }
  leaf(c, rand(seed, 6) < 0.4, x + spread * 0.6, y - 26 - spread * 0.4, p * 6, Math.cos(p * 10), 2.6, out)
  c.restore()
}

// The enemy, unsure which Meng Chuan is real: a brush question mark bobbing over the head at ground point (x, y).
export function drawMengConfused(c: C, x: number, y: number, tick: number) {
  c.save()
  c.font = `bold 15px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.translate(x + Math.sin(tick * 0.2) * 2, y - 52 + Math.sin(tick * 0.15) * 1.5)
  c.rotate(Math.sin(tick * 0.2) * 0.2)
  c.strokeStyle = PAPER
  c.lineWidth = 3
  c.strokeText('?', 0, 0)
  c.fillStyle = INK
  c.fillText('?', 0, 0)
  c.restore()
}

import { bladeArc, box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2d2b0', HAIR = '#1e1c26', HAIR_SHINE = '#3e3b4c', GOLD = '#e0b04a', JADE = '#7fd8c0'
const ROBE = '#eef2f8', ROBE_SHADE = '#c9d3e3', TRIM = '#2f4f9a', TRIM_DARK = '#1f3570'
const STEEL = '#c7d0dc', EDGE = '#f4f8ff', VOLT = '#4aa8ff', VOLT_PALE = '#bfe6ff'

export const KUNLUN = {
  name: 'Kunlun Legend',
  blurb: 'A swordsman of the snowy Kunlun peaks in flowing robes, wielding a great curved blade that crackles with blue lightning',
  radius: 11, hp: 800, speed: 145, damage: 30, range: 18, detection: 470,
  cooldown: 0.6, knockback: 100, spacing: 44, size: 1.25, color: TRIM,
} as const

// The great blade along +x from its guard: long wrapped two-hand grip with a ring pommel and blue tassel, a round
// bronze guard, and one broad blade whose back runs straight while the edge (+y) bellies out a little toward an
// up-swept tip. A thin blue groove runs its length.
function drawGreatBlade(c: C, length: number, width: number) {
  const w = width / 2, L = length
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 1.1
  c.strokeStyle = VOLT
  line(c, -13.5, 0, -16, 1.5, -15, 4) // tassel
  c.strokeStyle = INK
  box(c, -12, -1.6, 12, 3.2, 1, TRIM_DARK)
  c.strokeStyle = '#4c6ab0'
  c.lineWidth = 0.7
  for (let x = -11; x < -1; x += 2) line(c, x, -1.3, x + 1, 1.3) // wrap
  c.strokeStyle = INK
  c.lineWidth = 1
  ellipse(c, -13, 0, 1.4, 1.4, GOLD)
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(1, -w)
  c.lineTo(L - 4, -w - 0.6)
  c.quadraticCurveTo(L + 0.5, -w - 0.8, L, -w + 1.6) // the tip, swept up toward the back
  c.quadraticCurveTo(L * 0.62, w + 1.4, 1, w) // the gently curved edge
  c.closePath()
  c.fillStyle = STEEL
  c.fill()
  c.stroke()
  c.strokeStyle = EDGE
  c.lineWidth = 0.8
  c.beginPath()
  c.moveTo(3, w - 0.8)
  c.quadraticCurveTo(L * 0.62, w + 0.4, L - 1.5, -w + 1.8)
  c.stroke()
  c.save()
  c.strokeStyle = VOLT
  c.shadowColor = VOLT
  c.shadowBlur = 3
  c.lineWidth = 0.9
  line(c, 3, -w * 0.35, L - 6, -w * 0.45) // the groove
  c.strokeStyle = VOLT_PALE
  c.lineWidth = 0.7
  line(c, L * 0.35, -w * 0.4, L * 0.42, w * 0.3, L * 0.5, -w * 0.2, L * 0.58, w * 0.35) // a spark along it
  c.restore()
  c.lineWidth = 1.1
  ellipse(c, 0.5, 0, 1.8, w + 2, '#b8893a') // round guard, seen edge-on
  c.restore()
}

type KunlunPose = 'ready'

function drawKunlun(c: C, _pose: KunlunPose, step?: number) {
  // Long black hair falling down his back from the topknot.
  poly(c, HAIR, 18, 9, 13.5, 15, 12.5, 26, 14.5, 31, 17, 27, 19.5, 18)

  // Back sleeve: wide hanging hanfu sleeve with a blue cuff.
  poly(c, ROBE_SHADE, 17, 20, 11.5, 25, 9.5, 33, 16.5, 33, 19, 26)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1.2
  line(c, 9.9, 31.8, 16.3, 31.8)
  c.restore()

  // Cloth shoes peeking out under the robe.
  leg(c, step, 20, 34, () => box(c, 15, 40, 8, 4, 1.5, TRIM_DARK))
  leg(c, opposite(step), 28, 34, () => box(c, 26, 40, 8, 4, 1.5, TRIM_DARK))

  // Ankle-length robe flaring at the hem, with a blue hem band.
  poly(c, ROBE, 16, 19, 32, 19, 36, 41, 12.5, 41)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1.6
  line(c, 13.2, 39.6, 35.3, 39.6)
  // Crossed collar: the right lapel over the left, down to the sash, and the overlap running to the hem.
  c.lineWidth = 2
  line(c, 21, 19.5, 28.5, 28.5)
  line(c, 30, 19.5, 27, 24)
  c.strokeStyle = ROBE_SHADE
  c.lineWidth = 0.8
  line(c, 28.5, 31.5, 30.5, 39)
  line(c, 17, 32, 15.5, 39)
  c.restore()

  // Sash with its hanging tails (team colour is drawn over it).
  c.save()
  c.lineWidth = 1.1
  box(c, 14.5, 28.5, 19.5, 3.2, 1, TRIM)
  c.strokeStyle = TRIM_DARK
  c.lineWidth = 1.3
  line(c, 25, 31.5, 24, 36.5)
  line(c, 26.5, 31.5, 27, 35.5)
  c.restore()

  // Front sleeve reaching forward to the hand on the grip, the great blade held upright before him.
  poly(c, ROBE, 28, 20, 34, 21, 38.5, 27, 35.5, 31.5, 30, 27)
  c.save()
  c.strokeStyle = TRIM
  c.lineWidth = 1.2
  line(c, 35.4, 30.6, 38, 26.8)
  c.restore()
  c.save()
  c.translate(37.5, 29)
  c.rotate(-1.38)
  c.translate(5, 0)
  drawGreatBlade(c, 28, 8.5)
  c.restore()
  c.save()
  c.lineWidth = 1.2
  ellipse(c, 37.5, 29, 2.3, 2.3, SKIN)
  c.restore()

  // Head: neat black hair combed back into a topknot, a jade-tipped gold hairpin run through it.
  c.save()
  c.lineWidth = 1.6
  ellipse(c, 25, 13, 7.5, 7.5, SKIN)
  c.lineWidth = 1.3
  poly(c, HAIR, 31.5, 8.5, 29, 6, 24, 5.2, 19.5, 6.5, 17.5, 10, 17.2, 15.5, 18.6, 19.5, 21, 18, 21.5, 13, 24, 10, 28.5, 9.2)
  ellipse(c, 23.5, 4.2, 3.6, 3, HAIR)
  c.strokeStyle = HAIR_SHINE
  c.lineWidth = 0.7
  line(c, 20, 8.5, 27, 6.8)
  line(c, 22, 3.2, 25, 2.6)
  c.strokeStyle = INK
  c.lineWidth = 0.9
  box(c, 21, 5.6, 5, 1.8, 0.6, '#b9c2d0') // small silver crown cup under the bun
  box(c, 16.5, 3.4, 15, 1.4, 0.7, GOLD)
  ellipse(c, 31.8, 4.1, 1.4, 1.4, JADE)
  c.lineWidth = 1.2
  line(c, 26.8, 11.2, 31, 10.4) // brow
  c.restore()
  c.save()
  c.lineWidth = 1.2
  ellipse(c, 29, 13.6, 2, 1.5, '#fff')
  c.fillStyle = '#3d7fe0'
  c.beginPath()
  c.arc(29.7, 13.6, 1.1, 0, Math.PI * 2)
  c.fill()
  c.lineWidth = 0.9
  line(c, 28.6, 18.6, 30.8, 18.2)
  c.restore()
}

export function buildKunlunSprite(color?: string, pose: KunlunPose = 'ready', step?: number) {
  return buildSprite((c) => drawKunlun(c, pose, step), color, [15, 28.5, 18])
}

const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3

// The cut, in fighter-local units (feet at 0,0, facing right): a broad crescent edged in blue lightning.
export function drawKunlunSwing(c: C, progress: number) {
  const swing = ease(progress * 2.4)
  c.save()
  c.translate(30 - 24, 22 - 44)
  bladeArc(c, 25, -1.8, 0.5, 11, swing + Math.max(0, progress - 0.4) * 1.7, VOLT, VOLT_PALE)
  c.restore()
}

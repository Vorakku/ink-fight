import { box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

export const CAVALRY = {
  name: 'Cavalry',
  blurb: 'A spear rider who gallops circles around enemies, slashing everything nearby without stopping. Falls from the horse at 40% health',
  color: '#8a5a3b', radius: 14, hp: 320, speed: 230, damage: 16, range: 34,
  cooldown: 0.7, knockback: 90, spacing: 44, size: 1.45,
} as const
// orbit: gap kept from the target while circling; swap: ticks before switching circling direction.
export const CAVALRY_RIDE = { orbit: 22, approach: 90, swap: 84, slash: 34, dismount: 0.4, fall: 0.8 } as const
export const CAVALRY_FOOT = { radius: 10, speed: 90, damage: 14, range: 40, cooldown: 0.8, knockback: 60, size: 1.1 } as const

type Swing = 0 | 1 | 2 | 3 // 0 ride, then slash windup → sweep → follow-through
type FootPose = 'ready' | 'poke'
export const CAVALRY_GALLOP_FRAMES = 8 // frame index 8 is the horse standing still

const HORSE = '#8a5a3b', HORSE_FAR = '#5e3d29', MANE = '#3b2a20', STEEL = '#9aa6b3', MAIL = '#7d8a99', SKIN = '#eac09c'

function spear(c: C, x: number, y: number, angle: number, back: number, front: number) {
  c.save()
  c.translate(x, y); c.rotate(angle)
  c.strokeStyle = '#725038'; c.lineWidth = 2
  line(c, -back, 0, front, 0)
  // Curved glaive blade so the swing reads as a cut, plus a tassel at the socket.
  c.strokeStyle = INK; c.lineWidth = 0.8
  c.beginPath()
  c.moveTo(front, -1.6)
  c.quadraticCurveTo(front + 5, -3.6, front + 8, -1)
  c.lineTo(front + 5, 1.6)
  c.quadraticCurveTo(front + 2, 1.4, front, 1.6)
  c.closePath()
  c.fillStyle = '#dce6e8'; c.fill(); c.stroke()
  poly(c, '#b8323a', front - 1, 0.5, front - 3.5, 3.5, front - 1.5, 4)
  c.restore()
}

// Crescent trail behind the blade: wide pale smear with a bright leading edge.
function swoosh(c: C, cx: number, cy: number, rx: number, ry: number, from: number, to: number) {
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = 'rgba(238,244,246,.55)'; c.lineWidth = 4.5
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, from, to); c.stroke()
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.4
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, from + (to - from) * 0.45, to); c.stroke()
  c.restore()
}

// One horse leg: s is its place in the stride; the lower leg folds back while it swings forward.
function horseLeg(c: C, hx: number, hy: number, s: number, front: boolean, stand: boolean, fill: string) {
  const a = stand ? 0 : 0.55 * Math.sin(s), lift = stand ? 0 : Math.max(0, Math.cos(s))
  const upper = a + (front ? 0 : 0.3), lower = a - (front ? 1.6 : 1.2) * lift - (front ? 0 : 0.3)
  const kx = hx + Math.sin(upper) * 7, ky = hy + Math.cos(upper) * 7
  const fx = kx + Math.sin(lower) * 7, fy = ky + Math.cos(lower) * 7
  c.strokeStyle = INK; c.lineWidth = 3.6
  line(c, hx, hy, kx, ky, fx, fy)
  c.strokeStyle = fill; c.lineWidth = 2
  line(c, hx, hy, kx, ky, fx, fy)
  c.strokeStyle = '#2a2230'; c.lineWidth = 3.4
  line(c, fx - Math.sin(lower) * 1.6, fy - Math.cos(lower) * 1.6, fx, fy)
}

function horseman(c: C, swing: Swing, frame: number, team: string | undefined) {
  const stand = frame >= CAVALRY_GALLOP_FRAMES, t = frame / CAVALRY_GALLOP_FRAMES * Math.PI * 2
  const nod = stand ? 0 : Math.sin(t) * 1.2
  const flow = stand ? 0 : -1.5 - Math.sin(t * 2) * 0.8 // mane, tail, cape and plume stream back at speed
  const cloth = team ?? '#5d6b7d', cape = team ?? '#9b3b3b'

  // Transverse gallop: hind pair lands, then the front pair, each leg slightly after its partner.
  horseLeg(c, 13, 30, t, false, stand, HORSE_FAR)
  horseLeg(c, 31, 30, t - 2.4, true, stand, HORSE_FAR)
  horseLeg(c, 15.5, 31, t - 0.7, false, stand, HORSE)
  horseLeg(c, 33.5, 30.5, t - 3.1, true, stand, HORSE)

  c.strokeStyle = INK; c.lineWidth = 1.2
  poly(c, MANE, 10.5, 22.5, 5 + flow, 24, 2 + flow * 1.3, 30, 3.5 + flow, 36.5, 6.5, 31, 9.5, 27)
  c.beginPath()
  c.moveTo(10, 23)
  c.quadraticCurveTo(14, 19.5, 21, 21.5)
  c.quadraticCurveTo(27, 22.5, 31, 19)
  c.quadraticCurveTo(34, 13, 37, 10 + nod)
  c.quadraticCurveTo(40, 9 + nod, 42, 12 + nod)
  c.lineTo(46.5, 16.5 + nod)
  c.quadraticCurveTo(47.5, 19.5 + nod, 44.5, 20.5 + nod)
  c.lineTo(41, 20 + nod)
  c.quadraticCurveTo(38, 21, 37, 24)
  c.quadraticCurveTo(37.5, 30, 33, 32.5)
  c.quadraticCurveTo(23, 35, 15, 32.5)
  c.quadraticCurveTo(8.5, 31, 10, 23)
  c.closePath()
  c.fillStyle = HORSE; c.fill(); c.stroke()
  c.strokeStyle = 'rgba(34,31,51,.4)'; c.lineWidth = 0.7
  line(c, 34, 23, 32.5, 29.5)
  c.beginPath(); c.arc(14.5, 27, 4.5, -2.2, 0.4); c.stroke()

  // Mane, forelock, ear, eye and bridle.
  c.strokeStyle = INK; c.lineWidth = 1
  poly(c, MANE, 38, 9.5 + nod, 33 + flow, 9 + nod, 35, 12.5 + nod, 30 + flow, 13, 32.5, 16.5, 27.5 + flow, 18, 30, 21, 32, 20)
  poly(c, MANE, 39, 9.5 + nod, 42, 11 + nod, 40, 12.8 + nod)
  poly(c, HORSE, 37.5, 10.5 + nod, 38.5, 6 + nod, 40.5, 10 + nod)
  c.fillStyle = INK
  c.fillRect(40.8, 13 + nod, 1.4, 1.4)
  c.fillRect(45.4, 18.2 + nod, 0.9, 0.9)
  c.strokeStyle = MANE; c.lineWidth = 0.9
  line(c, 41.5, 11 + nod, 43, 19.5 + nod)
  line(c, 41.8, 16.4 + nod, 46.6, 17.4 + nod)
  c.beginPath(); c.moveTo(43.4, 19.5 + nod); c.quadraticCurveTo(35, 24, 27, 18.5); c.stroke()
  c.strokeStyle = INK; c.lineWidth = 0.6
  ellipse(c, 43.4, 19.5 + nod, 1, 1, '#c9d2d6')

  // Saddle cloth in team colours with a zig-zag hem, saddle and girth.
  c.lineWidth = 1
  poly(c, cloth, 15.5, 21.2, 28.5, 21.8, 28, 28.5, 25.5, 27.2, 23, 28.8, 20.5, 27.2, 18, 28.8, 16, 27.5)
  poly(c, '#6b4630', 17, 21, 18, 18.5, 19.5, 20.5, 25, 20.5, 26.5, 18.8, 27.5, 21.5)
  c.strokeStyle = MANE; c.lineWidth = 1.2
  line(c, 25.5, 28, 25.5, 33.5)

  // Rider: cape behind, leg in the stirrup, mail coat, helmet with a horsehair plume.
  c.strokeStyle = INK; c.lineWidth = 1
  poly(c, cape, 18, 10, 21.5, 10.5, 14 + flow * 1.2, 22, 10 + flow * 1.6, 20, 13 + flow, 15)
  c.strokeStyle = MANE; c.lineWidth = 0.7
  line(c, 21.5, 22, 24, 30.5)
  c.strokeStyle = INK; c.lineWidth = 3.6
  line(c, 21, 19, 26, 24, 24.5, 29.5)
  c.strokeStyle = '#5d4a3d'; c.lineWidth = 2.2
  line(c, 21, 19, 26, 24, 24.5, 29.5)
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, '#3b3037', 22.6, 28.3, 26, 28.8, 28, 31.3, 22.6, 31.6)
  c.lineWidth = 1.2
  box(c, 17, 9, 10, 13, 3, MAIL)
  c.save()
  c.strokeStyle = 'rgba(34,31,51,.35)'; c.lineWidth = 0.6; c.setLineDash([1.2, 1.2])
  for (const y of [12, 14.5, 17]) line(c, 18.2, y, 25.8, y)
  c.restore()
  c.strokeStyle = INK; c.lineWidth = 0.8
  box(c, 17.2, 18.6, 9.6, 1.8, 0.5, '#5a3b2a')
  ellipse(c, 22.5, 19.5, 1, 0.9, '#d6b55a')
  poly(c, '#d9c7a0', 23.5, 1.2, 20.5, 0.3, 15.5 + flow, 1.6, 12.5 + flow * 1.3, 4.5, 16.5, 3.4, 19.5, 2.6)
  c.lineWidth = 1.2
  ellipse(c, 22, 6, 4.5, 4.5, SKIN)
  poly(c, STEEL, 17, 6, 19, 1, 25, 1, 27, 6)
  c.lineWidth = 1
  line(c, 25.6, 4, 26, 7.8)
  c.fillStyle = INK
  c.fillRect(24, 6, 1.4, 1.6)
  ellipse(c, 25, 10.5, 3.2, 2.4, STEEL)

  // Arm and glaive: carried up at the ride, then a big swing round the rider.
  const grip = ([[27, 15, -0.75], [21, 9, -2.75], [28, 15, 0.05], [27, 19, 2.2]] as const)[swing]
  if (swing === 2) swoosh(c, 24, 13, 19, 11, -2.7, 0.05)
  if (swing === 3) swoosh(c, 24, 15, 19, 11, -1.6, 2.2)
  c.strokeStyle = INK; c.lineWidth = 3.4
  line(c, 24, 11, grip[0], grip[1])
  c.strokeStyle = MAIL; c.lineWidth = 2
  line(c, 24, 11, grip[0], grip[1])
  spear(c, grip[0], grip[1], grip[2], 12, 12)
  c.strokeStyle = INK; c.lineWidth = 1
  ellipse(c, grip[0], grip[1], 2.3, 2.1, SKIN)
}

function footman(c: C, pose: FootPose, team: string | undefined, step?: number) {
  c.lineWidth = 1
  poly(c, team ?? '#9b3b3b', 17, 22, 21, 22, 14, 36, 11, 33)
  leg(c, step, 20, 34, () => {
    c.lineWidth = 4; line(c, 20, 34, 18, 42)
    c.lineWidth = 0.9; poly(c, '#3b3037', 15.5, 40, 19.5, 40, 20, 43.5, 15, 43.5)
  })
  leg(c, opposite(step), 27, 34, () => {
    c.lineWidth = 4; line(c, 27, 34, 29, 42)
    c.lineWidth = 0.9; poly(c, '#3b3037', 27.5, 40, 31.5, 40, 32.5, 43.5, 27.5, 43.5)
  })
  c.lineWidth = 1.2
  box(c, 16, 21, 15, 15, 4, MAIL)
  c.lineWidth = 0.8
  box(c, 16.2, 31, 14.6, 2, 0.6, '#5a3b2a')
  poly(c, '#d9c7a0', 25, 6.3, 21, 5.4, 14, 7.5, 11, 12, 16, 9.5, 20, 8)
  c.lineWidth = 1.2
  ellipse(c, 24, 14, 7, 7, SKIN)
  poly(c, STEEL, 16, 13, 18, 6, 30, 6, 32, 13)
  c.fillStyle = INK
  c.fillRect(27, 14, 1.6, 1.8)
  // The "poke" slot is drawn as a downward cut so unhorsed riders slash too.
  if (pose === 'poke') {
    swoosh(c, 24, 25, 17, 10, -2.4, 0.9)
    spear(c, 30, 27, 0.7, 14, 9)
  } else spear(c, 32, 30, -Math.PI / 2, 12, 16)
  c.strokeStyle = INK; c.lineWidth = 1
  ellipse(c, pose === 'poke' ? 30 : 32, pose === 'poke' ? 27 : 27, 2.6, 2.4, SKIN)
}

export function buildCavalrySprite(color?: string, swing: Swing = 0, frame = CAVALRY_GALLOP_FRAMES) {
  return buildSprite((c) => horseman(c, swing, frame, color), color, [18, 3, 8])
}

// frames[swing][frame]: four swing stages × eight gallop frames plus a standing one.
export function buildCavalryFrames(color?: string) {
  return ([0, 1, 2, 3] as const).map((swing) =>
    Array.from({ length: CAVALRY_GALLOP_FRAMES + 1 }, (_, frame) => buildCavalrySprite(color, swing, frame)))
}

export function buildCavalryFootSprite(color?: string, pose: FootPose = 'ready', step?: number) {
  return buildSprite((c) => footman(c, pose, color, step), color, [18, 9, 12])
}

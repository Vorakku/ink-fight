import { buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'
import type { Fighter } from './battle.ts'

export const MANTIS = {
  name: 'Praying Mantis', blurb: 'Evolves at 25 / 50 / 75 kills: Moon Slash blades, wings, then invisible hunting. Guards fight club',
  color: '#82b95b', radius: 9, hp: 85, speed: 145, damage: 10, range: 4,
  cooldown: 0.6, knockback: 30, spacing: 28, size: 1,
} as const
export const MANTIS_DUEL = {
  members: 4, maxMembers: 6, recruit: 180, windup: 0.15, transport: 6,
  hopRange: 170, hopTime: 0.35, hopHeight: 48,
  bow: 0.5, handoff: 0.6, cooldown: 8, grace: 2, setupTimeout: 30, carrySpeed: 1.1,
  radius: 150, wallPadding: 8,
} as const
export const MANTIS_DODGE = { cooldown: 1.8, duration: 0.22, distance: 36, height: 12 } as const
export const MANTIS_GUARD = { escortRadius: 52, watch: 100, reach: 12, knockback: 180, stun: 0.2, speed: 1.2 } as const
export const MANTIS_MOON_SLASH = {
  radius: 170, halfAngle: Math.PI * 0.6, windup: 0.28, cooldown: 7,
  damageMultiplier: 3, knockback: 150, life: 0.32,
} as const
export interface MantisMoonSlash {
  x: number; y: number; angle: number; radius: number; life: number
}
export const MANTIS_EVOLUTION = {
  blades: 25, wings: 50, hunter: 75, growthMeals: 75, bladeReach: 22,
  leapRange: 260, leapTime: 0.3, leapHeight: 52, huntRange: 360,
  ambushReach: 85, moltTime: 1.1, shedLife: 4,
} as const
export type MantisForm = 0 | 1 | 2 | 3
export function mantisForm(kills: number): MantisForm {
  return kills >= MANTIS_EVOLUTION.hunter ? 3 : kills >= MANTIS_EVOLUTION.wings ? 2 : kills >= MANTIS_EVOLUTION.blades ? 1 : 0
}
export interface MantisMolt {
  x: number; y: number; size: number; facing: number; team: Fighter['team']; form: MantisForm; life: number
}
export interface MantisDuel {
  x: number; y: number; radius: number
  state: 'windup' | 'hop' | 'transport' | 'bow' | 'duel' | 'handoff'
  members: Fighter[]; team: Fighter['team']
  captive: Fighter; captiveTeam: Fighter['team']; carrier: Fighter; challenger: Fighter | null
  time: number; age: number
  hopFromX: number; hopFromY: number
  guardVacancies: number; guardRecruitTime: number
}

export function buildMantisSprite(color?: string, pose: 'ready' | 'strike' | 'carry' | 'hop' | 'guard' = 'ready', form: MantisForm = 0, step?: number) {
  return buildSprite((c) => {
    c.lineWidth = 1.3
    if (form >= 2 && pose !== 'hop') {
      c.strokeStyle = INK; c.lineWidth = 1
      poly(c, form === 3 ? '#6eaf8c' : '#b5ca7e', 22, 22, 8, 15, 4, 22, 6, 34, 14, 41, 25, 29)
      poly(c, '#d2df9e', 20, 24, 9, 20, 10, 33, 15, 37, 22, 28)
      c.strokeStyle = '#65875b'; c.lineWidth = 0.6
      line(c, 9, 20, 15, 29, 15, 37)
      line(c, 15, 29, 9, 30)
    }
    if (pose === 'hop') {
      c.save()
      if (form >= 2) { c.translate(-1, -1); c.scale(1.07, 1.06) }
      c.globalAlpha = 0.85
      c.strokeStyle = '#54724b'; c.lineWidth = 0.9
      c.beginPath()
      c.moveTo(24, 27)
      c.bezierCurveTo(16, 7, 7, 3, 3, 9)
      c.bezierCurveTo(1, 18, 10, 28, 24, 31)
      c.closePath(); c.fillStyle = '#dce9b7'; c.fill(); c.stroke()
      c.beginPath()
      c.moveTo(23, 28)
      c.bezierCurveTo(9, 16, 2, 21, 3, 28)
      c.bezierCurveTo(6, 36, 16, 35, 24, 31)
      c.closePath(); c.fillStyle = '#b9d294'; c.fill(); c.stroke()
      c.strokeStyle = '#8caa6c'; c.lineWidth = 0.6
      line(c, 23, 28, 8, 10, 9, 18)
      line(c, 17, 21, 17, 13)
      line(c, 22, 30, 6, 26, 10, 31)
      c.restore()
    }

    // Four jointed walking legs sit behind the body; the two claws are its forelegs.
    const legs = pose === 'hop'
      ? [[18, 29, 9, 30, 13, 37, 16, 36], [22, 31, 30, 32, 28, 39, 32, 38],
        [19, 32, 12, 35, 18, 40, 21, 38], [25, 30, 35, 30, 33, 36, 37, 35]]
      : [[18, 28, 8, 32, 4, 41, 7, 41], [22, 29, 31, 32, 38, 40, 41, 40],
        [18, 33, 11, 36, 9, 44, 13, 44], [24, 32, 29, 36, 32, 44, 36, 44]]
    legs.forEach((points, k) => leg(c, k === 0 || k === 3 ? step : opposite(step), points[0], points[1], () => {
      c.strokeStyle = INK; c.lineWidth = 2.8; line(c, ...points)
      c.strokeStyle = '#729e50'; c.lineWidth = 1.3; line(c, ...points)
    }, 0.3, 1.2))
    c.strokeStyle = INK; c.lineWidth = 1.3
    poly(c, '#527f3f', 15, 25, 22, 24, 27, 30, 24, 37, 17, 42, 11, 36, 11, 30)
    c.strokeStyle = '#345c35'; c.lineWidth = 0.8
    line(c, 13, 31, 23, 34)
    line(c, 13, 35, 21, 38)
    line(c, 15, 39, 19, 40)
    c.strokeStyle = INK; c.lineWidth = 1.2
    poly(c, '#88b452', 14, 24, 21, 24, 25, 29, 18, 38, 13, 36, 11, 30)
    poly(c, '#a6ca69', 16, 25, 22, 26, 23, 29, 17, 35, 14, 33)
    c.strokeStyle = '#608a43'; c.lineWidth = 0.8
    line(c, 16, 27, 18, 30, 15, 35)

    // A long, tapered thorax gives the head and folded claws room to read.
    c.strokeStyle = INK; c.lineWidth = 1.4
    poly(c, form === 3 ? '#529d76' : '#7ca749', 20, 29, 24, 19, 28, 16, 32, 18, 28, 29, 24, 33)
    poly(c, '#b9d57a', 25, 20, 28, 18, 30, 19, 26, 29, 23, 30)
    c.strokeStyle = '#476d38'; c.lineWidth = 0.8
    line(c, 23, 29, 27, 21)

    const claws = pose === 'strike'
      ? [[24, 23, 34, 25, 43, 18, 40, 24], [28, 24, 37, 26, 46, 15, 44, 23]]
      : pose === 'carry'
        ? [[24, 23, 34, 32, 43, 28, 39, 25], [28, 23, 37, 29, 44, 21, 40, 26]]
        : pose === 'guard'
          ? [[24, 23, 30, 33, 41, 32, 36, 28], [28, 24, 36, 27, 41, 12, 37, 19]]
          : pose === 'hop'
            ? [[24, 23, 30, 28, 39, 19, 35, 23], [28, 23, 37, 25, 45, 15, 41, 22]]
            : [[24, 23, 31, 30, 35, 20, 31, 24], [28, 24, 37, 32, 41, 19, 36, 25]]
    for (const claw of claws) {
      const [sx, sy] = claw
      let [, , ex, ey, wx, wy, tx, ty] = claw
      if (form >= 1) {
        ex -= 4; ey += 3
        wx = Math.min(46, wx + 3); wy = Math.max(8, wy - 3)
        tx = Math.min(45, tx + 3); ty -= 2
      }
      c.strokeStyle = INK; c.lineWidth = 4; line(c, sx, sy, ex, ey)
      c.strokeStyle = '#8eb858'; c.lineWidth = 2.2; line(c, sx, sy, ex, ey)
      const length = Math.hypot(wx - ex, wy - ey), nx = -(wy - ey) / length, ny = (wx - ex) / length
      c.strokeStyle = INK; c.lineWidth = 1.1
      poly(c, form === 3 ? '#b9e3b0' : form >= 1 ? '#cfdf8b' : '#a9ca68', ex - nx * 1.5, ey - ny * 1.5, wx - nx * 2, wy - ny * 2,
        wx, wy, tx, ty, wx + nx * 2, wy + ny * 2, ex + nx * 1.5, ey + ny * 1.5)
      c.strokeStyle = '#e9edb4'; c.lineWidth = 1.1
      line(c, ex - nx, ey - ny, wx - nx, wy - ny, tx, ty)
      c.strokeStyle = '#476c39'; c.lineWidth = 0.9
      for (const p of [0.3, 0.55]) {
        const x = ex + (wx - ex) * p, y = ey + (wy - ey) * p
        line(c, x + nx * 1.7, y + ny * 1.7, x + nx * 3.4, y + ny * 3.4)
      }
      c.strokeStyle = INK; c.lineWidth = 0.8
      ellipse(c, ex, ey, 1.7, 1.7, '#729b47')
    }

    c.strokeStyle = INK; c.lineWidth = 1.1
    c.beginPath(); c.moveTo(25, 9); c.quadraticCurveTo(23, 3, 17, 2); c.stroke()
    c.beginPath(); c.moveTo(34, 8); c.quadraticCurveTo(37, 2, 43, 3); c.stroke()
    c.lineWidth = 1.5
    poly(c, form === 3 ? '#8bcca2' : '#a9cb64', 20, 9, 29, 7, 39, 9, 37, 15, 30, 21, 23, 16)
    c.lineWidth = 0.7
    poly(c, '#d6e494', 23, 10, 29, 9, 35, 10, 30, 17)
    poly(c, '#7fa64c', 30, 17, 36, 13, 36, 16, 30, 20, 27, 17)
    c.strokeStyle = INK; c.lineWidth = 1.2
    ellipse(c, 22.5, 10.5, 3.8, 3.3, '#e7efb2')
    ellipse(c, 37, 10.5, 4, 3.5, '#e7efb2')
    c.fillStyle = INK
    c.beginPath(); c.ellipse(23.8, 10.8, 1.1, 2, 0.2, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.ellipse(38.2, 10.8, 1.1, 2.1, 0.15, 0, Math.PI * 2); c.fill()
    c.fillStyle = '#fff9da'
    c.beginPath(); c.arc(22.5, 9.3, 0.8, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.arc(36.9, 9.2, 0.9, 0, Math.PI * 2); c.fill()
    c.strokeStyle = '#527337'; c.lineWidth = 1.1
    line(c, 20, 8, 25, 9)
    line(c, 34, 9, 39, 7.8)
    c.strokeStyle = INK; c.lineWidth = 0.8
    line(c, 27, 17, 29, 18, 31, 17, 33, 17)
  }, color, [24, 22, 6])
}

export function buildMantisShedSprite(form: MantisForm) {
  return buildSprite((c) => {
    c.strokeStyle = '#998a69'; c.lineWidth = 1
    if (form === 1) {
      poly(c, '#ded3ad', 12, 32, 25, 17, 28, 15, 24, 25, 21, 24, 14, 35)
      poly(c, '#ede1bb', 26, 37, 36, 24, 40, 21, 37, 31, 33, 29, 28, 39)
      line(c, 14, 32, 24, 20)
    } else if (form === 2) {
      poly(c, '#ded8b7', 23, 35, 8, 16, 5, 23, 9, 34, 22, 39)
      poly(c, '#eee4c5', 24, 35, 36, 16, 42, 21, 37, 34, 24, 39)
      c.lineWidth = 0.6
      line(c, 9, 22, 22, 37, 14, 32)
      line(c, 37, 22, 25, 37, 34, 32)
    } else if (form === 3) {
      poly(c, '#e5d8b6', 19, 24, 25, 20, 31, 24, 29, 34, 22, 41, 16, 35)
      poly(c, '#f4eace', 20, 10, 37, 9, 30, 21, 24, 18)
      c.strokeStyle = '#a69472'
      line(c, 28, 10, 25, 14, 30, 17, 27, 23, 23, 28, 26, 32, 21, 39)
      line(c, 20, 27, 10, 30, 6, 39)
      line(c, 27, 29, 37, 32, 42, 39)
      line(c, 24, 24, 35, 26, 39, 18)
      line(c, 20, 30, 13, 36, 15, 43)
    }
  }, undefined, [0, 0, 0], false)
}

export function drawMantisMolt(c: C, molt: MantisMolt, sprite: HTMLCanvasElement) {
  const age = MANTIS_EVOLUTION.shedLife - molt.life
  c.save()
  c.translate(molt.x, molt.y + Math.min(8, age * 12))
  c.scale(molt.facing * molt.size, molt.size)
  c.globalAlpha = Math.min(0.7, molt.life / 1.5)
  c.rotate(Math.min(0.25, age * 0.5) * (molt.form % 2 ? 1 : -1))
  c.drawImage(sprite, -24, -44, 48, 48)
  c.restore()
}

export function drawMantisMoonSlash(c: C, slash: MantisMoonSlash) {
  const elapsed = MANTIS_MOON_SLASH.life - slash.life
  const start = 0.035, sweepTime = 0.14, finishTime = 0.12
  const sweep = Math.max(0, Math.min(1, (elapsed - start) / sweepTime))
  const finish = Math.max(0, Math.min(1, (elapsed - start - sweepTime) / finishTime))
  const arc = MANTIS_MOON_SLASH.halfAngle
  const tip = -arc + arc * 2 * (sweep * sweep * (3 - 2 * sweep))
  const span = Math.min(tip + arc, 1.7) * (1 - finish)
  const radius = slash.radius * (0.82 + sweep * 0.18)
  c.save()
  c.translate(slash.x, slash.y - 12)
  c.rotate(slash.angle)
  c.lineJoin = 'miter'; c.lineCap = 'butt'

  // Contact: one brief, pointed impact at the beginning of the cut.
  if (elapsed < start + 0.02) {
    c.save()
    c.translate(Math.cos(-arc) * slash.radius * 0.82, Math.sin(-arc) * slash.radius * 0.82)
    c.rotate(-arc + Math.PI / 2)
    c.globalAlpha = Math.max(0, 1 - elapsed / (start + 0.02))
    c.fillStyle = '#f4ffe8'; c.strokeStyle = '#315e50'; c.lineWidth = 0.8
    c.beginPath(); c.moveTo(-9, 0); c.lineTo(0, -2.5); c.lineTo(16, 0); c.lineTo(0, 2.5)
    c.closePath(); c.fill(); c.stroke()
    c.restore()
  }

  // Travel: a single tapered blade moves along the arc instead of appearing whole.
  if (span > 0.001) {
    const tail = tip - span
    const width = slash.radius * 0.19 * Math.sin(Math.min(1, sweep * 3) * Math.PI / 2) * (1 - finish)
    const bladePath = (depth: number) => {
      c.beginPath()
      for (let i = 0; i <= 24; i++) {
        const angle = tail + span * i / 24
        if (i === 0) c.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
        else c.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      }
      for (let i = 24; i >= 0; i--) {
        const p = i / 24, angle = tail + span * p
        const inner = radius - Math.sin(p * Math.PI) ** 0.65 * width * depth
        c.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      }
      c.closePath()
    }
    c.globalAlpha = 1 - finish * 0.65
    bladePath(1)
    c.fillStyle = '#89bfa0'; c.fill()
    c.strokeStyle = '#315e50'; c.lineWidth = 1; c.stroke()
    bladePath(0.4)
    c.fillStyle = '#f4ffe8'; c.fill()
  }

  // Release: the blade contracts to a fine finishing cut, then disappears.
  if (finish > 0) {
    c.save()
    c.translate(Math.cos(arc) * slash.radius, Math.sin(arc) * slash.radius)
    c.rotate(arc + Math.PI / 2)
    c.globalAlpha = (1 - finish) * 0.7
    c.fillStyle = '#315e50'
    c.beginPath(); c.moveTo(-14 - finish * 10, 0); c.lineTo(0, -(1 - finish) * 1.5)
    c.lineTo(18 + finish * 8, 0); c.lineTo(0, (1 - finish) * 1.5); c.closePath(); c.fill()
    c.restore()
  }
  c.restore()
}

export function drawMantisDuel(c: C, duel: MantisDuel) {
  c.save()
  const locked = duel.state !== 'windup' && duel.state !== 'hop' && duel.state !== 'transport'
  c.strokeStyle = '#73955b'; c.fillStyle = 'rgba(130,185,91,.04)'
  c.lineWidth = locked ? 2.4 : 1.2
  if (!locked) c.setLineDash([4, 7])
  c.beginPath(); c.arc(duel.x, duel.y, duel.radius, 0, Math.PI * 2); c.fill(); c.stroke()
  c.setLineDash([])
  if (locked) {
    c.lineWidth = 0.7; c.strokeStyle = 'rgba(115,149,91,.4)'
    c.beginPath(); c.arc(duel.x, duel.y, duel.radius - MANTIS_DUEL.wallPadding, 0, Math.PI * 2); c.stroke()
  }
  c.fillStyle = '#65804f'; c.font = '10px system-ui'; c.textAlign = 'center'
  c.fillText(duel.state === 'bow' ? 'A POLITE BOW' : duel.state === 'duel' ? 'ONE AT A TIME' : 'FIGHT CLUB',
    duel.x, duel.y - duel.radius - 10)
  c.restore()
}

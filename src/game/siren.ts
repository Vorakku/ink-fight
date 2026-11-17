import { buildSprite, ellipse, INK, line, poly, stride, type C } from './art.ts'

export const SIREN = {
  name: 'Coral Chorus', blurb: 'A pond-bound diva. Irresistible ballads, unexpected death metal',
  color: '#2bb8a6', radius: 10, hp: 90, speed: 40, damage: 7,
  range: 220, cooldown: 0.2, knockback: 45, spacing: 40, size: 1,
} as const
export const SIREN_SONG = { radius: 70, metal: 3, ballad: 2, lure: 0.3 } as const

// Flowing hair, a curling scaled tail and a pearl-trimmed stage outfit.
function siren(c: C, step?: number) {
  const skin = '#f2c9a5', hair = '#ed579a', gold = '#e7bb65'
  c.save()
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(19, 5)
  c.bezierCurveTo(8, 7, 14, 18, 9, 23)
  c.quadraticCurveTo(13, 25, 17, 21)
  c.quadraticCurveTo(12, 28, 20, 29)
  c.bezierCurveTo(26, 24, 32, 20, 31, 10)
  c.quadraticCurveTo(28, 1, 19, 5)
  c.closePath()
  c.fillStyle = '#b93878'
  c.fill()
  c.stroke()

  // The two broad fin lobes frame a curved tail rather than a pair of feet; it sways as she moves.
  c.save()
  stride(c, step, 22, 29, 0.2, 0)
  poly(c, '#7fe3d4', 13, 39, 6, 33, 3, 32, 5, 39, 2, 45, 8, 44, 14, 41)
  c.lineWidth = 0.8
  c.strokeStyle = '#299a91'
  line(c, 11, 40, 5, 36)
  line(c, 11, 40, 5, 43)
  c.strokeStyle = INK
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(19, 28)
  c.bezierCurveTo(21, 32, 22, 37, 14, 37)
  c.quadraticCurveTo(8, 37, 10, 41)
  c.bezierCurveTo(25, 46, 33, 36, 29, 28)
  c.closePath()
  c.fillStyle = SIREN.color
  c.fill()
  c.stroke()
  c.strokeStyle = '#a3efcf'
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(27, 32)
  c.quadraticCurveTo(28, 38, 20, 40)
  c.stroke()
  c.strokeStyle = '#198f89'
  c.lineWidth = 0.8
  for (const [x, y] of [[23, 32], [26, 34], [22, 36], [18, 39]]) {
    c.beginPath()
    c.arc(x, y, 1.5, 0.1, Math.PI - 0.1)
    c.stroke()
  }
  c.restore()
  c.strokeStyle = INK
  c.lineWidth = 1.3
  c.beginPath()
  c.moveTo(21, 20)
  c.quadraticCurveTo(17, 25, 20, 29)
  c.quadraticCurveTo(24, 32, 29, 28)
  c.lineTo(30, 22)
  c.closePath()
  c.fillStyle = skin
  c.fill()
  c.stroke()
  c.strokeStyle = gold
  c.lineWidth = 1.5
  line(c, 20, 29, 24, 30, 29, 28)

  // A scalloped seashell top, pearl necklace and a little coral hair ornament.
  c.strokeStyle = INK
  c.lineWidth = 0.8
  poly(c, '#b98cf0', 21, 26, 20, 23, 22, 22, 24, 23, 26, 22, 28, 24, 26, 27, 24, 26)
  c.strokeStyle = '#7855aa'
  line(c, 22, 23, 24, 26, 25, 23)
  c.strokeStyle = INK
  c.lineWidth = 1.3
  c.fillStyle = '#b98cf0'
  ellipse(c, 26, 13, 7, 7, skin)
  c.beginPath()
  c.moveTo(18, 12)
  c.bezierCurveTo(17, 4, 26, 2, 31, 7)
  c.quadraticCurveTo(28, 11, 24, 8)
  c.quadraticCurveTo(24, 13, 18, 16)
  c.closePath()
  c.fillStyle = hair
  c.fill()
  c.stroke()
  c.strokeStyle = '#ffacd2'
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(15, 12)
  c.bezierCurveTo(12, 18, 18, 20, 14, 23)
  c.stroke()
  c.strokeStyle = INK
  c.lineWidth = 1.1
  c.beginPath()
  c.arc(28.5, 11, 2, 0.15, Math.PI - 0.15)
  c.stroke()
  line(c, 30.2, 12, 31.5, 11.5)
  c.fillStyle = '#ed91a0'
  c.beginPath()
  c.ellipse(27, 16.5, 1.8, 0.9, -0.2, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = INK
  c.beginPath()
  c.ellipse(31.2, 16, 1.6, 2.2, -0.15, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#ff9ca8'
  c.beginPath()
  c.ellipse(31.5, 17, 0.8, 0.5, 0, 0, Math.PI * 2)
  c.fill()
  c.lineWidth = 0.5
  for (const [x, y] of [[23, 20], [25, 21], [27, 20.5]]) ellipse(c, x, y, 0.8, 0.8, '#fff5dc')
  poly(c, gold, 17, 9, 14, 7, 15, 5, 17, 6, 18, 3, 20, 5, 19, 8)
  ellipse(c, 18, 8, 1.2, 1.2, '#bcefe1')

  // Bent arm, bracelet and a silver grille make the microphone read clearly.
  c.lineWidth = 4.6
  line(c, 29, 25, 33, 27, 38, 20)
  c.strokeStyle = skin
  c.lineWidth = 2.3
  line(c, 29, 25, 33, 27, 38, 20)
  c.strokeStyle = gold
  c.lineWidth = 1.3
  line(c, 34, 24, 36, 25)
  c.strokeStyle = INK
  c.lineWidth = 2.5
  line(c, 36, 23, 39, 17)
  c.lineWidth = 1
  ellipse(c, 40, 16, 3.2, 3.5, '#b9c2cf')
  c.strokeStyle = '#667087'
  c.lineWidth = 0.6
  line(c, 38, 14.5, 42, 15.5)
  line(c, 37.5, 16, 42, 17)
  c.strokeStyle = INK
  ellipse(c, 37, 22, 1.5, 1.7, skin)
  c.restore()
}

export function buildSirenSprite(color?: string, step?: number) {
  return buildSprite((c) => siren(c, step), color, [19, 6, 12], false)
}

export function drawSirenSong(c: C, tick: number, id: number, metal: boolean) {
  c.save()
  c.strokeStyle = INK
  c.lineWidth = 0.9
  for (let k = 0; k < 4; k++) {
    const progress = (tick * (metal ? 0.05 : 0.012) + k / 4 + id * 0.37) % 1
    const angle = k * Math.PI / 2 + id + progress
    c.save()
    c.translate(metal ? Math.cos(angle) * progress * SIREN_SONG.radius : (k - 1.5) * 13 + Math.sin(progress * 7 + k) * 6,
      metal ? Math.sin(angle) * progress * SIREN_SONG.radius - 14 : -34 - progress * 36)
    c.globalAlpha = 1 - progress
    if (metal) poly(c, '#b6ff3c', 1, -8, -5, 1, -1, 1, -3, 8, 5, -2, 1, -2)
    else {
      line(c, 1, 3, 1, -7, 6, -4)
      ellipse(c, -1.5, 3, 3, 2, '#ff8fb1')
    }
    c.restore()
  }
  c.restore()
}

export function drawCharmHeart(c: C, tick: number, id: number) {
  c.save()
  c.translate(Math.sin(tick * 0.08 + id) * 3, -45)
  c.fillStyle = '#ff5d8f'
  c.strokeStyle = INK
  c.lineWidth = 0.7
  c.beginPath()
  c.moveTo(0, 3)
  c.bezierCurveTo(-9, -3, -4, -9, 0, -4)
  c.bezierCurveTo(4, -9, 9, -3, 0, 3)
  c.fill()
  c.stroke()
  c.restore()
}

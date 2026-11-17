export type C = CanvasRenderingContext2D
export const INK = '#221f33'

export function ellipse(c: C, x: number, y: number, rx: number, ry: number, fill: string) {
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fillStyle = fill
  c.fill()
  c.stroke()
}

export function line(c: C, ...points: number[]) {
  c.beginPath()
  c.moveTo(points[0], points[1])
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1])
  c.stroke()
}

export function poly(c: C, fill: string | CanvasGradient, ...points: number[]) {
  c.beginPath()
  c.moveTo(points[0], points[1])
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1])
  c.closePath()
  c.fillStyle = fill
  c.fill()
  c.stroke()
}

export function box(c: C, x: number, y: number, w: number, h: number, radius: number, fill: string) {
  c.beginPath()
  c.roundRect(x, y, w, h, radius)
  c.fillStyle = fill
  c.fill()
  c.stroke()
}

// Walk cycle: s is the place in the stride (0..1, undefined when standing); a partner leg uses s + 0.5.
// Swings what is drawn next around the hip (x, y): forward, then back, lifted while it swings forward.
export function stride(c: C, s: number | undefined, x: number, y: number, angle = 0.4, lift = 1.5) {
  if (s === undefined) return
  const a = s * Math.PI * 2
  c.translate(x, y - Math.max(0, -Math.sin(a)) * lift)
  c.rotate(-Math.cos(a) * angle)
  c.translate(-x, -y)
}

// Draws one leg swung by stride(), keeping the canvas state untouched.
export function leg(c: C, s: number | undefined, x: number, y: number, draw: () => void, angle?: number, lift?: number) {
  c.save()
  stride(c, s, x, y, angle, lift)
  draw()
  c.restore()
}

// The partner leg's place in the stride.
export const opposite = (s: number | undefined) => s === undefined ? s : s + 0.5

export function legs(c: C, x1: number, x2: number, s?: number) {
  leg(c, s, x1, 36, () => line(c, x1, 36, x1, 43, x1 + 3, 43))
  leg(c, opposite(s), x2, 36, () => line(c, x2, 36, x2, 43, x2 + 3, 43))
}

export function eye(c: C, x: number, y: number, radius: number, pupil: number) {
  c.save()
  c.lineWidth = 1.4
  ellipse(c, x, y, radius, radius, '#fff')
  c.beginPath()
  c.arc(x + radius * 0.3, y, pupil, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.restore()
}

export function buildSprite(draw: (c: C) => void, color: string | undefined, band: [number, number, number], shadow = true, pixelScale = 3) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 48 * pixelScale
  const c = canvas.getContext('2d')!
  c.scale(pixelScale, pixelScale)
  c.fillStyle = 'rgba(34,31,51,.16)'
  c.beginPath()
  c.ellipse(24, 44, 10, 3, 0, 0, Math.PI * 2)
  if (shadow) c.fill()
  c.strokeStyle = INK
  c.lineWidth = 2.2
  c.lineJoin = c.lineCap = 'round'
  draw(c)
  if (color) {
    const [x, y, width] = band
    c.lineWidth = 0.8
    poly(c, color, x, y + 1, x - 6, y - 1, x - 4, y + 2, x - 6, y + 4, x + 1, y + 3)
    box(c, x, y, width, 3, 1, color)
  }
  return canvas
}

export function buildShockedSprite(sprite: HTMLCanvasElement, headX: number, headY: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = sprite.width
  const c = canvas.getContext('2d')!
  c.drawImage(sprite, 0, 0)
  c.globalCompositeOperation = 'source-in'
  c.fillStyle = INK
  c.fillRect(0, 0, canvas.width, canvas.height)
  c.globalCompositeOperation = 'source-atop'
  c.scale(canvas.width / 48, canvas.height / 48)
  c.strokeStyle = '#fff'
  c.lineWidth = 1.5
  c.beginPath()
  c.ellipse(headX, headY, 3.5, 3.5, 0, 0, Math.PI * 2)
  c.stroke()
  line(c, headX, headY + 4, 24, 30, 24, 37)
  for (let y = 26; y <= 34; y += 4) line(c, 19, y - 1, 24, y + 1, 29, y - 1)
  line(c, 24, 36, 19, 43)
  line(c, 24, 36, 28, 43)
  return canvas
}

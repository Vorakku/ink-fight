import { KING, LEAP_T, MAXO, MAXR, MAXS, MOSH_R, RING_R, SCRAP_T, SLAM_R, SPIN_T, type Sim } from './sim.ts'
import { BUSH_BASE, REX_ARM, REX_JAW, UNITS, WING, type Sprites } from './units.ts'
import { drawWater, sinkAt } from './water.ts'

let bushes = new Int32Array(0) // bush stamps sorted top to bottom, so they can be drawn between fighters
let bushVer = -1

// alpha: how far we are between the last two sim ticks (0..1), so motion stays
// smooth on displays faster than the 60 Hz simulation.
export function render(c: CanvasRenderingContext2D, sim: Sim, sprites: Sprites, alpha: number, dpr: number) {
  if (sim.dirty) sim.buildGrid()
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)

  for (let k = 0; k < MAXS; k++) {
    const life = sim.sLife[k]
    if (life <= 0) continue
    const s = sim.sSize[k] * dpr, r = sim.sRot[k]
    c.globalAlpha = Math.min(1, life * 2) * 0.5
    c.setTransform(Math.cos(r) * s, Math.sin(r) * s, -Math.sin(r) * s, Math.cos(r) * s, sim.sX[k] * dpr, sim.sY[k] * dpr)
    c.drawImage(sprites.splat[sim.sType[k]], -24, -24, 48, 48)
  }
  c.globalAlpha = 1

  drawWater(c, sim, dpr)
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#fff'
  for (let k = 0; k < MAXO; k++) { // wakes: foam that spreads and fades behind waders
    const life = sim.oLife[k]
    if (life <= 0 || sim.oK[k]) continue
    const g = 1 - life
    c.globalAlpha = life * 0.55
    c.beginPath()
    c.ellipse(sim.oX[k], sim.oY[k], 3 + g * 9, 1.5 + g * 2.5, sim.oA[k], 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1

  if (bushVer !== sim.terrainVer) {
    const list: number[] = []
    for (let b = 0; b < sim.bn; b++) if (sim.bT[b] === 0) list.push(b)
    bushes = Int32Array.from(list.sort((a, b) => sim.bY[a] - sim.bY[b]))
    bushVer = sim.terrainVer
  }
  let bk = 0 // next bush to draw
  const bushesTo = (feet: number) => { // every bush whose base is above these feet goes behind them
    for (; bk < bushes.length && sim.bY[bushes[bk]] + BUSH_BASE * sim.bS[bushes[bk]] <= feet; bk++) {
      const b = bushes[bk], s = sim.bS[b] * dpr
      c.setTransform(b & 1 ? -s : s, 0, 0, s, sim.bX[b] * dpr, sim.bY[b] * dpr) // every other one mirrored
      c.drawImage(sprites.bush[b % 3], -24, -24, 48, 48)
    }
  }

  for (let k = 0; k < MAXR; k++) { // healing rings: a circle of little flames that spreads as it fades
    const life = sim.rLife[k]
    if (life <= 0) continue
    const rad = RING_R * (1 - life * 0.5), s = 0.45 * dpr
    c.globalAlpha = Math.min(1, life * 2)
    for (let a = 0; a < 12; a++) {
      const ang = a * 0.5236 + life * 2
      c.setTransform(s, 0, 0, s, (sim.rX[k] + Math.cos(ang) * rad) * dpr, (sim.rY[k] + Math.sin(ang) * rad) * dpr)
      c.drawImage(sprites.flame, -24, -40, 48, 48)
    }
  }
  c.globalAlpha = 1

  const spriteOf = (j: number) => (sim.stage[j] === 1 ? sprites.egg : sim.stage[j] === 2 ? sprites.chick : sprites.unit[sim.type[j]])
  const part = (img: HTMLCanvasElement, [hx, hy]: number[], ang: number) => { // a sprite piece swung around its hinge
    c.save()
    c.translate(hx - 24, hy - 44)
    c.rotate(ang)
    c.drawImage(img, -hx, -hy, 48, 48)
    c.restore()
  }

  // grid order is row by row, which gives a free back-to-front sort
  for (let q = 0; q < sim.itemN; q++) {
    const i = sim.items[q]
    if (!sim.alive[i] || sim.heldBy[i] >= 0) continue // whoever is holding it draws it, between its teeth
    if (sim.scrapT[i] > 0 || sim.brawling(i)) continue // their paws emerge from the cloud drawn over the fighters below
    const wings = sprites.fly[sim.type[i]], grabs = !!UNITS[sim.type[i]].grab && !wings, g = sim.grab[i] // grabs: holds its catch in a jaw (a flier carries it in its talons)
    const fly = wings ? (g >= 0 ? 30 : 12) + Math.sin(sim.tick * 0.1 + i) * 2 : 0 // hovering this far off the ground
    const air = sim.airT[i] > 0 ? 1 - sim.airT[i] / sim.airD[i] : 0 // thrown: 0 -> 1 along the arc
    const t = sim.type[i], face = sim.face[i], atk = sim.atkT[i], st = sim.stage[i]
    const def = UNITS[t], jump = sim.leapT[i] > 0 ? 1 - sim.leapT[i] / LEAP_T : 0
    const ph = st === 1 ? sim.tick * 0.25 + i : sim.phase[i] // eggs wobble on the spot
    const sings = UNITS[t].kind === 'sing' && sim.cd[i] > -0.3, metal = sings && sim.song[i] > 0 // cd keeps ticking down once she stops
    const x = sim.px[i] + (sim.x[i] - sim.px[i]) * alpha + atk * 4 * face + (metal ? Math.sin(sim.tick * 1.9 + i) * 2 : 0)
    const jumpHeight = Math.sin(jump * Math.PI) * (def.leap === 'slam' ? 65 : 42)
    const y = sim.py[i] + (sim.y[i] - sim.py[i]) * alpha + UNITS[t].r - (fly || Math.abs(Math.sin(ph)) * 2.5) - Math.sin(air * Math.PI) * 56 * sim.airD[i] - jumpHeight
    const rot = (Math.sin(ph) * 0.1 + atk * 0.45 + air * 15.7 * sim.airD[i] + (g >= 0 ? Math.sin(sim.tick * 1.1) * 0.2 : 0) + (sim.rush[i] ? 0.3 : 0) + (jump ? (def.leap === 'slam' ? -0.6 : -0.25) : 0)) * face
    const meals = sim.grow[i] // snakes get bigger with every meal, up to a point
    const size = st === 1 ? 0.9 : st === 2 ? 0.8 : (UNITS[t].size ?? 1) * (UNITS[t].eats ? 1 + Math.min(meals, KING + 3) * 0.1 : 1)
    const s = (1 + sim.hitT[i] * 0.22) * size * dpr
    const cos = Math.cos(rot) * s, sin = Math.sin(rot) * s
    bushesTo(sim.py[i] + (sim.y[i] - sim.py[i]) * alpha + UNITS[t].r)
    if (fly || jump) { // hovering and jumping shadows stay on the ground
      c.setTransform(dpr, 0, 0, dpr, x * dpr, (y + fly + jumpHeight) * dpr)
      c.fillStyle = 'rgba(34,31,51,.14)'
      c.beginPath()
      c.ellipse(0, 0, 9 * size, 2.6 * size, 0, 0, Math.PI * 2)
      c.fill()
    }
    c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    if (def.key === 'mochi') c.scale(1 + sim.hitT[i] * 0.3, 1 - sim.hitT[i] * 0.25) // retaliatory squish
    if (sim.spinT[i] > 0) c.scale(Math.cos((SPIN_T - sim.spinT[i]) * 32), 1) // paper-thin turn as the sword goes around
    if (wings && g >= 0) { // its catch dangles from the talons, kicking
      const vs = (UNITS[sim.type[g]].size ?? 1) / size
      c.save()
      c.translate(3, -3)
      c.rotate(Math.sin(sim.tick * 0.5 + i) * 0.3)
      c.scale(vs, vs)
      c.drawImage(spriteOf(g), -24, -9, 48, 48)
      c.restore()
    }
    const img = grabs ? sprites.rex[0] : wings ? wings[0] : spriteOf(i), a0 = sim.hidden[i] ? 0.45 : 1
    // wading: below the waterline shows faintly through the water, with a white line at the surface.
    // Local units here are sprite px (feet at 0), so big fighters sink less of themselves.
    const sink = air || fly || jump ? 0 : sinkAt(sim.px[i] + (sim.x[i] - sim.px[i]) * alpha, sim.py[i] + (sim.y[i] - sim.py[i]) * alpha + UNITS[t].r) / size
    if (UNITS[t].eats) { // drawn segment by segment, so it really does get longer
      // shortcut: a wading snake gets no waterline, add the clip from the branch below if that looks wrong
      const n = Math.max(3, Math.min(16, 6 + meals))
      c.fillStyle = '#221f33' // ground shadow, as long as the snake
      c.globalAlpha = a0 * 0.16
      c.beginPath()
      c.ellipse(6 - n * 2.1, 0, n * 2.1 + 7, 2.6, 0, 0, 6.29)
      c.fill()
      c.globalAlpha = a0
      for (const [pad, col] of [[1.1, '#221f33'], [0, '#8e6fe0']] as const) { // outline pass, then the fill on top
        c.fillStyle = col
        c.beginPath()
        for (let k = n; k >= 1; k--) {
          const sx = 4 - k * 4.2, sy = -6 + Math.sin(ph * 2 - k * 0.8) * 2.2, r = 5 - (k / n) * 3.2 + pad // slithers, tapers to the tail
          c.moveTo(sx + r, sy)
          c.arc(sx, sy, r, 0, 6.29)
        }
        c.fill()
      }
      c.fillStyle = '#c6f25c' // spots
      c.beginPath()
      for (let k = 2; k < n; k += 2) {
        const sx = 4 - k * 4.2, sy = -7 + Math.sin(ph * 2 - k * 0.8) * 2.2
        c.moveTo(sx + 1.3, sy)
        c.arc(sx, sy, 1.3, 0, 6.29)
      }
      c.fill()
      c.drawImage(sprites.snake[0], -24, -44, 48, 48)
      if (meals >= KING) c.drawImage(sprites.snake[1], -24, -44, 48, 48)
    } else if (sink > 0.5) {
      const wl = -sink, hw = (UNITS[t].r * 1.15) / size
      c.save()
      c.beginPath()
      c.rect(-28, -60, 56, 60 + wl)
      c.clip()
      c.globalAlpha = a0
      c.drawImage(img, -24, -44, 48, 48)
      c.restore()
      c.save()
      c.beginPath()
      c.rect(-28, wl, 56, 8 - wl)
      c.clip()
      c.globalAlpha = a0 * 0.28
      c.drawImage(img, -24, -44, 48, 48)
      c.restore()
      c.globalAlpha = a0 * 0.85
      c.strokeStyle = '#fff'
      c.lineWidth = 1.6
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(-hw, wl)
      c.lineTo(hw, wl)
      c.stroke()
    } else {
      c.globalAlpha = a0
      c.drawImage(img, -24, -44, 48, 48)
    }
    c.globalAlpha = 1
    if (sim.shockT[i] > 0) {
      c.globalAlpha = Math.min(0.95, sim.shockT[i] * 8)
      c.drawImage(sprites.xray[t], -24, -44, 48, 48)
      c.globalAlpha = 1
    }
    if (sim.spinT[i] > 0) { // restore the width before drawing the sword's circular swishes
      c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
      c.strokeStyle = '#bcc6d7'
      c.lineWidth = 2
      for (let k = 0; k < 3; k++) {
        const a = sim.tick * 0.4 + k * 2.09
        c.beginPath()
        c.ellipse(0, -17, 31, 10, 0, a, a + 1.3)
        c.stroke()
      }
    }
    if (sim.rush[i] || sim.dashT[i] > 0 || sim.fearT[i] > 0) { // charge, dash, or a very committed nope
      c.strokeStyle = '#9a9aa8'
      c.lineWidth = 1.2
      c.lineCap = 'round'
      c.beginPath()
      for (let k = 0; k < 3; k++) {
        const lx = -15 - ((sim.tick * 3 + k * 5 + i) % 9), ly = -11 - k * 8
        c.moveTo(lx, ly)
        c.lineTo(lx - 9, ly)
      }
      c.stroke()
    }
    if (sim.fearT[i] > 0) { // one blue sweat drop, no floating text
      c.fillStyle = '#7ac6ec'
      c.beginPath()
      c.moveTo(-12, -39)
      c.quadraticCurveTo(-19, -30, -12, -30)
      c.quadraticCurveTo(-7, -30, -12, -39)
      c.fill()
    }
    if (sim.slowT[i] > 0 && !air && !jump) { // sticky footing makes slowing hits readable
      c.fillStyle = '#a3b5cf'
      c.globalAlpha = Math.min(0.65, sim.slowT[i])
      for (let k = 0; k < 3; k++) {
        c.beginPath()
        c.ellipse((k - 1) * 5, -1, 2.5, 1, 0, 0, Math.PI * 2)
        c.fill()
      }
      c.globalAlpha = 1
    }
    if (def.regen && sim.atkT[i] === 0) { // sleeping bubbles instead of a ZZZ label
      c.strokeStyle = '#aab8d5'
      c.lineWidth = 1
      for (let k = 0; k < 2; k++) {
        const u = (sim.tick * 0.012 + k * 0.5 + i) % 1
        c.globalAlpha = 1 - u
        c.beginPath()
        c.arc(-5 + u * 7, -26 - u * 15, 1 + u * 2, 0, Math.PI * 2)
        c.stroke()
      }
      c.globalAlpha = 1
    }
    if (wings) part(wings[1], WING, Math.sin(sim.tick * 0.4 + i) * 0.55 - 0.1) // flap
    const aim = sim.target[i]
    if (atk > 0 && aim >= 0 && sim.alive[aim] && (def.shock || def.key === 'pizza')) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      const ex = sim.x[aim], ey = sim.y[aim] - 15
      c.strokeStyle = def.shock ? '#b5d9ff' : '#ffd775'
      c.lineWidth = def.shock ? 1.8 : 2.5
      c.globalAlpha = atk
      c.beginPath()
      c.moveTo(x, y - 18)
      for (let k = 1; k <= 7; k++) {
        const u = k / 7, bend = k === 7 ? 0 : (def.shock ? (k & 1 ? 3 : -3) : Math.sin(u * Math.PI) * 7)
        c.lineTo(x + (ex - x) * u, y - 18 + (ey - y + 18) * u + bend)
      }
      c.stroke()
      c.globalAlpha = 1
      c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    }
    if (def.key === 'touchgrass' && atk > 0) {
      c.strokeStyle = '#91a84d'
      c.lineWidth = 1.5
      c.beginPath()
      for (let k = 0; k < 3; k++) {
        c.moveTo(16 + k * 3, -5)
        c.lineTo(20 + k * 3 + atk * 5, -14 - k * 3)
      }
      c.stroke()
    }
    if (sim.beam[i] && !air && aim >= 0 && sim.alive[aim]) { // the rainbow: six bands arching from the rump to the target
      const bx = x - face * 15 * size, by = y - 15 * size, ex = sim.x[aim], ey = sim.y[aim] - 4
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.lineWidth = 1.7
      c.lineCap = 'round'
      c.globalAlpha = 0.8 + 0.15 * Math.sin(sim.tick * 0.5 + i)
      for (const [k, col] of ['#ff5d5d', '#ffb13c', '#ffe45c', '#5fd16b', '#5aa9ff', '#b07cf0'].entries()) {
        c.strokeStyle = col
        c.beginPath()
        c.moveTo(bx, by + k * 1.5)
        c.quadraticCurveTo((bx + ex) / 2, (by + ey) / 2 - 22 + k * 1.5, ex, ey + k * 1.5)
        c.stroke()
      }
      c.globalAlpha = 1
      c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    }
    if (grabs) { // tiny arms flail, the jaw snaps on a bite and clamps on a mouthful
      part(sprites.rex[2], REX_ARM, Math.sin(ph * 2.3) * 0.7 - 0.2)
      if (g >= 0) {
        const vs = (UNITS[sim.type[g]].size ?? 1) / size
        c.save()
        c.translate(17, -24) // the mouth, in sprite px from the feet
        c.rotate(1.2 + Math.sin(sim.tick * 0.9) * 0.4) // dangling, wriggling
        c.scale(vs, vs)
        c.drawImage(spriteOf(g), -24, -26, 48, 48)
        c.restore()
      }
      part(sprites.rex[1], REX_JAW, g >= 0 ? 0.3 : 0.06 + atk * 0.7)
    }
    if (sim.dizzyT[i] > 0 && !air) { // seeing stars after a rough landing
      c.setTransform(dpr, 0, 0, dpr, x * dpr, (y - 38 * size) * dpr)
      c.fillStyle = '#ffd23f'
      c.strokeStyle = '#221f33'
      c.lineWidth = 0.6
      c.globalAlpha = Math.min(1, sim.dizzyT[i] * 3)
      for (let a = 0; a < 3; a++) {
        const ang = sim.tick * 0.14 + a * 2.09, sx = Math.cos(ang) * 9, sy = Math.sin(ang) * 2.5
        c.beginPath()
        for (let k = 0; k < 8; k++) c.lineTo(sx + Math.cos(k * 0.785) * (k & 1 ? 1.1 : 3), sy + Math.sin(k * 0.785) * (k & 1 ? 1.1 : 3))
        c.closePath()
        c.fill()
        c.stroke()
      }
      c.globalAlpha = 1
    }
    if (sim.burnT[i] > 0) { // flickering flame on its head
      const f = (0.5 + 0.12 * Math.sin(sim.tick * 0.6 + i)) * dpr
      c.setTransform(f, 0, 0, f, x * dpr, (y - 40 * size) * dpr)
      c.drawImage(sprites.flame, -24, -40, 48, 48)
    }
    if (sim.lureT[i] > 0 && st !== 1) { // smitten
      const f = (0.3 + 0.04 * Math.sin(sim.tick * 0.3 + i)) * dpr
      c.setTransform(f, 0, 0, f, x * dpr, (y - 46 * size) * dpr)
      c.drawImage(sprites.heart, -24, -24, 48, 48)
    }
    if (sings) {
      for (let a = 0; a < 4; a++) { // ballad: notes drift up and fade. Metal: bolts fly out to the edge of the pit
        const u = (sim.tick * (metal ? 0.05 : 0.012) + a / 4 + i * 0.37) % 1, ang = a * 1.57 + i + u
        const nx = metal ? Math.cos(ang) * u * MOSH_R : (a - 1.5) * 13 + Math.sin(u * 7 + a) * 6
        const ny = metal ? Math.sin(ang) * u * MOSH_R - 14 : -34 - u * 36
        const f = (metal ? 0.5 : 0.4) * dpr
        c.globalAlpha = 1 - u
        c.setTransform(f, 0, 0, f, (x + nx) * dpr, (y + ny) * dpr)
        c.drawImage(metal ? sprites.bolt : sprites.note, -24, -24, 48, 48)
      }
      c.globalAlpha = 1
    }
    if (sim.pulseT[i] > 0) {
      const life = sim.pulseT[i], radius = def.pulse ?? SLAM_R, progress = 1 - life / (def.pulse ? 0.5 : 0.55)
      c.setTransform(dpr, 0, 0, dpr, x * dpr, (sim.y[i] + def.r) * dpr)
      c.globalAlpha = life * 1.5
      c.strokeStyle = def.pulse ? '#edb5d1' : '#baa78d'
      c.lineWidth = 1.4
      c.beginPath()
      c.ellipse(0, -3, Math.max(1, radius * progress), Math.max(1, radius * progress * 0.4), 0, 0, Math.PI * 2)
      c.stroke()
      c.globalAlpha = 1
    }
  }
  bushesTo(Infinity)

  // The opening cat fight: smoke hides both fighters; paws and little claws do the storytelling.
  for (let i = 0; i < sim.n; i++) {
    if (!sim.alive[i] || sim.scrapT[i] <= 0) continue
    const life = sim.scrapT[i] / SCRAP_T
    c.setTransform(dpr, 0, 0, dpr, sim.x[i] * dpr, (sim.y[i] - 12) * dpr)
    c.globalAlpha = Math.min(1, life * 5)
    c.strokeStyle = '#aaa6af'
    c.lineWidth = 1.2
    c.fillStyle = '#f3f0ee'
    c.beginPath()
    for (let k = 0; k < 7; k++) {
      const a = k * Math.PI * 2 / 7 + Math.sin(sim.tick * 0.3 + k) * 0.15
      const px = Math.cos(a) * 13, py = Math.sin(a) * 10, r = 10 + Math.sin(sim.tick * 0.5 + k) * 2
      c.moveTo(px + r, py)
      c.arc(px, py, r, 0, Math.PI * 2)
    }
    c.fill()
    c.stroke()
    for (let k = 0; k < 2; k++) {
      c.save()
      c.rotate(sim.tick * (k ? -0.22 : 0.18) + k * Math.PI)
      c.strokeStyle = '#221f33'
      c.fillStyle = '#cd997c'
      c.beginPath()
      c.roundRect(12, -3, 16, 7, 3)
      c.fill()
      c.stroke()
      c.fillStyle = '#edb0b5'
      c.beginPath()
      c.arc(24, 0, 2, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = '#fff'
      c.beginPath()
      for (let claw = 0; claw < 3; claw++) {
        c.moveTo(27, claw * 2 - 2)
        c.lineTo(31 + Math.sin(sim.tick + k) * 2, claw * 3 - 4)
      }
      c.stroke()
      c.restore()
    }
    c.globalAlpha = 1
  }

  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#5daa52'
  for (let k = 0; k < MAXO; k++) { // leaves kicked out of a bush: pop up, flutter, drop
    const life = sim.oLife[k]
    if (life <= 0 || !sim.oK[k]) continue
    const g = 1 - life
    c.globalAlpha = Math.min(1, life * 2)
    c.beginPath()
    c.ellipse(sim.oX[k] + Math.cos(sim.oA[k]) * g * 14, sim.oY[k] - Math.sin(g * Math.PI) * 12 + g * 6, 2.6, 1.3, sim.oA[k] + g * 7, 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1

  for (let p = 0; p < sim.fn; p++) {
    const life = sim.fLife[p], s = Math.max(0.3, 1.1 - life * 1.6) * dpr // grows as it travels
    const r = Math.sin(p * 1.7 + life * 18) * 0.5
    c.globalAlpha = Math.min(1, life * 5)
    c.setTransform(Math.cos(r) * s, Math.sin(r) * s, -Math.sin(r) * s, Math.cos(r) * s, sim.fX[p] * dpr, sim.fY[p] * dpr)
    c.drawImage(sprites.flame, -24, -24, 48, 48)
  }
  c.globalAlpha = 1

  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.lineCap = 'round'
  for (let p = 0; p < sim.pn; p++) {
    const def = UNITS[sim.pType[p]], shot = def.shot
    if (def.projectile) {
      c.save()
      c.translate(sim.pX[p], sim.pY[p] - 10)
      c.rotate(Math.atan2(sim.pVy[p], sim.pVx[p]))
      c.strokeStyle = '#39364b'
      c.fillStyle = def.color
      c.lineWidth = 1.1
      c.beginPath()
      if (def.projectile === 'spear') {
        c.strokeStyle = '#8e6b49'
        c.moveTo(-15, 0); c.lineTo(7, 0); c.stroke()
        c.strokeStyle = '#39364b'
        c.fillStyle = '#d8e5eb'
        c.beginPath()
        c.moveTo(11, 0); c.lineTo(4, -2.8); c.lineTo(4, 2.8); c.closePath()
      } else if (def.projectile === 'shuriken') {
        c.rotate(sim.tick * 0.7 + p)
        c.fillStyle = '#c4d0de'
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4, r = k & 1 ? 1.7 : 5.5
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        }
        c.closePath()
      } else if (def.projectile === 'water') {
        c.fillStyle = '#71cde9'
        c.strokeStyle = '#56b6d8'
        c.moveTo(-10, 0)
        c.bezierCurveTo(6, -7, 8, 7, -10, 0)
      } else if (def.projectile === 'notification' || def.projectile === 'bubble') {
        c.fillStyle = def.projectile === 'bubble' ? '#f0f7ff' : '#d9eaff'
        c.roundRect(-6, -4, 12, 8, 2)
      } else {
        c.fillStyle = def.projectile === 'pearl' ? '#4a2941' : '#fff1b8'
        c.arc(0, 0, def.projectile === 'pearl' ? 3.5 : 3, 0, Math.PI * 2)
      }
      c.fill()
      c.stroke()
      if (def.projectile === 'notification') {
        c.fillStyle = '#ec6b7b'
        c.beginPath(); c.arc(5, -4, 2, 0, Math.PI * 2); c.fill()
      } else if (def.projectile === 'bubble') {
        c.beginPath(); c.moveTo(-3, 3); c.lineTo(-4, 6); c.lineTo(0, 4); c.stroke()
      }
      c.restore()
      continue
    }
    c.strokeStyle = shot ?? '#55596b'
    c.lineWidth = shot ? 4 : 2
    c.beginPath()
    c.moveTo(sim.pX[p], sim.pY[p])
    c.lineTo(sim.pX[p] - sim.pVx[p] * 0.022, sim.pY[p] - sim.pVy[p] * 0.022)
    c.stroke()
  }
}

import { COLONY_BUILD, GRUDGE_MAX, KING, MAXK, TETHER_LEN, LEAP_T, MAXO, MAXR, MAXS, MOSH_R, RAINBOW_BLAST, RAINBOW_CHARGE, RING_R, SCRAP_T, SLAM_R, SPIN_T, type Sim } from './sim.ts'
import { BUSH_BASE, REX_ARM, REX_JAW, UNITS, WING, type Sprites } from './units.ts'
import { drawWater, sinkAt } from './water.ts'

let bushes = new Int32Array(0) // bush stamps sorted top to bottom, so they can be drawn between fighters
let syrups = new Int32Array(0) // syrup stamps, drawn flat on the ground
let bushVer = -1

export const TEAM_COLORS = ['#e5484d', '#3e7bfa'] // red, blue: the bandanna and the tally
const RAINBOW = ['#ff5d5d', '#ffb13c', '#ffe45c', '#5fd16b', '#5aa9ff', '#b07cf0']
const MILLIPEDE = UNITS.findIndex((u) => u.bug === 'millipede')
const bands = new Map<HTMLCanvasElement, Map<number, number[]>>() // per sprite, per band height: [y, left, right]

// where a sprite's bandanna goes, in sprite px: just under its top edge (or at `at`), as wide as the drawing is there.
// shortcut: guesses the head from the top edge; set the fighter's `band` where it lands on a wing, crest or prop
function bandOf(img: HTMLCanvasElement, at = -1) {
  let byAt = bands.get(img)
  if (!byAt) bands.set(img, (byAt = new Map()))
  let b = byAt.get(at)
  if (b) return b
  const w = img.width, k = w / 48, a = img.getContext('2d')!.getImageData(0, 0, w, img.height).data
  let top = 20 * k
  find: for (let py = 0; py < 40 * k; py++) // below 40 is the ground shadow
    for (let px = 0; px < w; px++) if (a[(py * w + px) * 4 + 3] > 128) { top = py; break find }
  const row = Math.min(img.height - 1, Math.round(at >= 0 ? at * k : top + 3 * k))
  let x0 = w, x1 = 0
  for (let px = 0; px < w; px++) if (a[(row * w + px) * 4 + 3] > 128) { if (px < x0) x0 = px; x1 = px }
  const mid = x1 >= x0 ? (x0 + x1) / 2 / k : 24, half = Math.max(4, (x1 - x0) / 2 / k) // never thinner than a stub
  b = [row / k, mid - half, mid + half]
  byAt.set(at, b)
  return b
}

// a team bandanna in sprite space (feet at 0): a band round the head, knotted at the back, two tails fluttering behind
function bandanna(c: CanvasRenderingContext2D, img: HTMLCanvasElement, at: number | undefined, color: string, wave: number) {
  const [by, x0, x1] = bandOf(img, at), y = by - 45.5, l = x0 - 24.5, r = x1 - 23.5
  c.fillStyle = color
  c.strokeStyle = '#221f33'
  c.lineWidth = 0.8
  c.lineJoin = 'round'
  c.beginPath()
  for (let k = 0; k < 2; k++) {
    const len = 6 - k, sw = Math.sin(wave + k * 1.3) * 1.5
    c.moveTo(l, y + 1)
    c.lineTo(l - len, y + 0.5 + k * 2.5 + sw)
    c.lineTo(l - len + 1.5, y + 2.5 + k * 2.5 + sw)
    c.closePath()
  }
  c.roundRect(l, y, r - l, 3, 1)
  c.fill()
  c.stroke()
  c.beginPath()
  c.arc(l, y + 1.5, 1.4, 0, Math.PI * 2) // the knot
  c.fill()
  c.stroke()
}

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
    const list: number[] = [], sticky: number[] = []
    for (let b = 0; b < sim.bn; b++) if (sim.bT[b] === 0) list.push(b); else if (sim.bT[b] === 2) sticky.push(b)
    bushes = Int32Array.from(list.sort((a, b) => sim.bY[a] - sim.bY[b]))
    syrups = Int32Array.from(sticky)
    bushVer = sim.terrainVer
  }
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.strokeStyle = '#221f33'
  c.lineWidth = 1.2
  for (let k = 0; k < syrups.length; k++) { // a syrup spot with the pancake that fell in it
    const b = syrups[k], sx = sim.bX[b], sy = sim.bY[b], s = sim.bS[b]
    c.fillStyle = 'rgba(138,75,28,.55)'
    c.beginPath()
    for (let m = 0; m < 4; m++) {
      const ox = Math.cos(m * 1.7 + b) * 7 * s, oy = Math.sin(m * 1.7 + b) * 3 * s
      c.moveTo(sx + ox + 9 * s, sy + oy)
      c.ellipse(sx + ox, sy + oy, 9 * s, 4.5 * s, 0, 0, Math.PI * 2)
    }
    c.fill()
    c.fillStyle = '#e2a95a'
    c.beginPath()
    c.ellipse(sx, sy - 1, 7, 2.6, 0, 0, Math.PI * 2)
    c.fill()
    c.stroke()
  }
  for (let i = 0; i < sim.n; i++) { // a sandal lying where it landed, waiting for its dad
    if (!sim.alive[i] || sim.away[i] !== 2) continue
    c.save()
    c.translate(sim.itemX[i], sim.itemY[i])
    c.rotate(-0.3)
    c.fillStyle = '#ff8fb1'
    c.beginPath()
    c.ellipse(0, 0, 5.5, 2.6, 0, 0, Math.PI * 2)
    c.fill()
    c.stroke()
    c.restore()
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

  const spriteOf = (j: number) => {
    if (sim.stage[j] === 1) return sprites.egg
    if (sim.stage[j] === 2) return sprites.chick
    const t = sim.type[j], d = UNITS[t], stack = sprites.stack[t], alt = sprites.alt[t]
    if (stack) return stack[Math.max(0, sim.layers[j] - 1)]
    // its second look: sandal out, curled into a ball, or promoted
    if (alt && (sim.away[j] > 0 || sim.rollT[j] > 0 || (d.bug === 'millipede' && sim.millipedes.curlT[j] < 0.18) || (!!d.promote && sim.grow[j] >= d.promote))) return alt
    return sprites.unit[t]
  }
  const part = (img: HTMLCanvasElement, [hx, hy]: number[], ang: number) => { // a sprite piece swung around its hinge
    c.save()
    c.translate(hx - 24, hy - 44)
    c.rotate(ang)
    c.drawImage(img, -hx, -hy, 48, 48)
    c.restore()
  }

  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  for (const scene of sim.mantises.scenes) {
    if (!scene || scene.state === 'windup') continue
    c.strokeStyle = '#b6ac98'
    c.lineWidth = 1.4
    c.globalAlpha = scene.state === 'transport' ? 0.35 : 0.65
    c.setLineDash([4, 11])
    c.beginPath()
    c.ellipse(scene.x, scene.y, scene.r, scene.r, 0, 0, Math.PI * 2)
    c.stroke()
    c.setLineDash([])
    if (scene.challenger >= 0 && sim.alive[scene.challenger]) {
      const i = scene.challenger
      c.strokeStyle = '#c79c47'
      c.beginPath()
      c.arc(sim.x[i], sim.y[i] + UNITS[sim.type[i]].r, 11, 0.15, Math.PI - 0.15)
      c.stroke()
    }
  }
  c.globalAlpha = 1

  for (let i = 0; i < sim.n; i++) {
    if (!sim.alive[i]) continue
    const body = sim.spiders.body[i]
    if (body < 0 || !sim.cAlive[body]) continue
    c.strokeStyle = '#aaa0b6'
    c.lineWidth = 1.2
    c.beginPath()
    c.moveTo(sim.x[i], sim.y[i] - 3)
    c.lineTo(sim.cX[body], sim.cY[body])
    c.stroke()
  }

  for (let k = 0; k < sim.cn; k++) {
    if (!sim.cAlive[k]) continue
    const t = sim.cType[k], fade = 1 - sim.cEnter[k], size = sim.cSize[k] * fade
    const x = sim.cPx[k] + (sim.cX[k] - sim.cPx[k]) * alpha, y = sim.cPy[k] + (sim.cY[k] - sim.cPy[k]) * alpha
    const stack = sprites.deadStack[t]
    const img = sim.cStage[k] === 2 ? sprites.deadChick : stack ? stack[Math.max(0, sim.cLook[k] - 1)]
      : sim.cLook[k] && sprites.deadAlt[t] ? sprites.deadAlt[t]! : sprites.dead[t]
    c.save()
    c.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr)
    c.globalAlpha = 0.16 * fade
    c.fillStyle = '#221f33'
    c.beginPath()
    c.ellipse(0, 4, 18 * size, 5 * size, 0, 0, Math.PI * 2)
    c.fill()
    c.globalAlpha = 0.85 * fade
    c.rotate(sim.cFace[k] * 1.45) // tipped onto its side, no bobbing or living animation
    c.scale(size * sim.cFace[k], size * 0.8)
    c.filter = 'saturate(0.55)'
    c.drawImage(img, -24, -24, 48, 48)
    if (sim.cTeam[k] < 2) { // keep the fallen fighter's side readable
      c.translate(0, 20)
      bandanna(c, img, UNITS[t].band, TEAM_COLORS[sim.cTeam[k]], 0)
    }
    c.restore()
    const spider = sim.cSpider[k]
    if (spider >= 0 && sim.alive[spider] && sim.spiders.wrapT[spider] > 0) {
      const wrapped = Math.min(1, sim.spiders.wrapT[spider] / 2)
      c.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr)
      c.strokeStyle = '#f7f4fa'
      c.lineWidth = 2
      for (let band = 0; band < Math.ceil(wrapped * 7); band++) {
        c.beginPath()
        c.ellipse((band - 3) * 3 * size, 0, 3 * size, 12 * size, -0.2, 0, Math.PI * 2)
        c.stroke()
      }
    }
  }

  for (let i = 0; i < sim.n; i++) { // builders shrink through the doorway, then work below ground
    if (!sim.alive[i] || sim.inside[i] < 0 || sim.entryT[i] >= 1) continue
    const home = sim.inside[i], u = sim.entryT[i], size = (UNITS[sim.type[i]].size ?? 1) * (1 - u)
    const x = sim.px[i] + (sim.x[i] - sim.px[i]) * alpha, y = sim.py[i] + (sim.y[i] - sim.py[i]) * alpha + UNITS[sim.type[i]].r
    c.save()
    c.setTransform(size * dpr * sim.face[i], 0, 0, size * dpr, x * dpr, y * dpr)
    c.globalAlpha = 1 - u
    c.drawImage(sprites.unit[sim.type[i]], -24, -44, 48, 48)
    c.restore()
    c.setTransform(dpr, 0, 0, dpr, sim.x[home] * dpr, (sim.y[home] + 10) * dpr)
    c.globalAlpha = 1 - u
    c.fillStyle = '#b98b61'
    c.beginPath(); c.arc(-4 + u * 8, -2 - Math.sin(u * Math.PI) * 4, 1.2, 0, Math.PI * 2); c.fill()
    c.globalAlpha = 1
  }

  // grid order is row by row, which gives a free back-to-front sort
  for (let q = 0; q < sim.itemN; q++) {
    const i = sim.items[q]
    if (!sim.alive[i] || sim.heldBy[i] >= 0 || sim.inside[i] >= 0) continue // jaws and anthills draw their own occupants
    if (sim.scrapT[i] > 0 || sim.brawling(i)) continue // their paws emerge from the cloud drawn over the fighters below
    const wings = sprites.fly[sim.type[i]], grabs = !!UNITS[sim.type[i]].grab && !wings, g = sim.grab[i] // grabs: holds its catch in a jaw (a flier carries it in its talons)
    const fly = wings ? (g >= 0 ? 30 : 12) + Math.sin(sim.tick * 0.1 + i) * 2 : 0 // hovering this far off the ground
    const air = sim.airT[i] > 0 ? 1 - sim.airT[i] / sim.airD[i] : 0 // thrown: 0 -> 1 along the arc
    const charging = sim.beam[i] === 1, blasting = sim.beam[i] === 2
    const charge = charging ? 1 - sim.beamT[i] / RAINBOW_CHARGE : 0
    const turn = charging ? Math.min(1, (RAINBOW_CHARGE - sim.beamT[i]) / 0.22) : 1
    const t = sim.type[i], face = sim.face[i], atk = UNITS[t].building ? 0 : sim.atkT[i], st = sim.stage[i]
    const def = UNITS[t], jump = sim.leapT[i] > 0 ? 1 - sim.leapT[i] / LEAP_T : 0
    const site = sim.buildFor[i]
    const hauling = sim.haulFor[i] >= 0 || sim.spiders.body[i] >= 0
    const digging = site >= 0 && Math.hypot(sim.x[i] - sim.x[site], sim.y[i] - sim.y[site]) <= Math.max(40, Math.sqrt(sim.nextColony[sim.team[i]]) * 10)
    const built = def.colony ? sim.colonyT[i] / COLONY_BUILD : def.bug === 'nest' ? Math.min(1, sim.spiders.nestT[i] / 3) : 1
    const sceneId = sim.mantises.member[i], scene = sceneId >= 0 ? sim.mantises.scenes[sceneId] : null
    const bow = def.bug === 'mantis' && scene?.state === 'bow' && scene.challenger === i ? Math.sin(Math.min(1, scene.t / 0.5) * Math.PI) : 0
    const assembly = sim.millipedes.assemblyT[i] / 0.6
    const spiderJump = sim.spiders.jumpT[i] > 0 ? 1 - sim.spiders.jumpT[i] / 0.3 : 0
    const ph = st === 1 ? sim.tick * 0.25 + i : sim.phase[i] // eggs wobble on the spot
    const sings = UNITS[t].kind === 'sing' && sim.cd[i] > -0.3, metal = sings && sim.song[i] > 0 // cd keeps ticking down once she stops
    const wired = !!def.crash && sim.moodT[i] > 0, asleep = !!def.crash && sim.moodT[i] < 0 // caffeine, then the crash
    const scrolling = sim.phoneT[i] > 0 && !def.distract // handed a phone (the doomscroller already has one drawn)
    const flat = sim.downT[i] > 0 ? -1.6 - Math.sin(sim.tick * 0.9 + i) * 0.15 : asleep ? 1.45 : 0 // lying down: rocking on its back, or face-first asleep
    const x = sim.px[i] + (sim.x[i] - sim.px[i]) * alpha + atk * 4 * face + (metal ? Math.sin(sim.tick * 1.9 + i) * 2 : 0) + (wired ? Math.sin(sim.tick * 2.3 + i) * 1.2 : 0) + (charging ? Math.sin(sim.tick * 1.7 + i) * charge * 1.5 : 0)
    const jumpHeight = Math.sin(jump * Math.PI) * (def.leap === 'slam' ? 65 : 42) + Math.sin(spiderJump * Math.PI) * 35
    const y = sim.py[i] + (sim.y[i] - sim.py[i]) * alpha + UNITS[t].r - (def.building ? 0 : fly || Math.abs(Math.sin(ph)) * (def.bug === 'car' ? 1 : 2.5)) - Math.sin(air * Math.PI) * 56 * sim.airD[i] - jumpHeight - (flat ? 8 : 0) - (sim.away[i] === 2 ? Math.abs(Math.sin(ph * 2)) * 4 : 0) // one sandal: hopping
    const rot = (Math.sin(ph) * 0.1 + atk * 0.45 + air * 15.7 * sim.airD[i] + (g >= 0 ? Math.sin(sim.tick * 1.1) * 0.2 : 0) + (sim.rush[i] ? 0.3 : 0) + (jump ? (def.leap === 'slam' ? -0.6 : -0.25) : 0) + flat
      + (scrolling ? 0.25 : 0) // head down over the phone
      + (sim.rollT[i] > 0 ? sim.tick * 0.5 : 0) // a rolling ball
      + (sim.latchT[i] > 0 ? -0.2 + Math.sin(sim.tick * 0.3 + i) * 0.1 : 0) // leaning into the leg it's hugging
      + (sim.blindT[i] > 0 ? Math.sin(sim.tick * 0.3 + i) * 0.15 : 0) // spat on: stumbling
      + (charging ? -0.2 * charge + Math.sin(sim.tick * 1.1 + i) * charge * 0.08 : 0) // bracing very seriously for something very silly
      + (digging ? 0.2 + Math.sin(ph * 1.5) * 0.12 : 0) // head down, antennae on the job
      + (hauling ? -0.16 + Math.sin(ph) * 0.06 : 0) // walking backwards with a very serious grip
      + bow * 0.65
      + (def.bug === 'mantis' && g >= 0 ? -0.2 : 0)
      + (assembly > 0 ? Math.sin(sim.tick * 1.5 + i) * assembly * 0.18 : 0)
      + (def.swell ? Math.sin(sim.tick * 0.5 + i) * 0.08 * sim.grow[i] / def.swell : 0)) * face // too full to fly straight
    const meals = sim.grow[i] // snakes get bigger with every meal, up to a point
    const size = st === 1 ? 0.9 : st === 2 ? 0.8 : (UNITS[t].size ?? 1) * (UNITS[t].eats ? 1 + Math.min(meals, KING + 3) * 0.1 : def.swell ? 1 + meals * 0.12 : 1)
    const s = (1 + sim.hitT[i] * 0.22) * size * dpr
    const cos = def.building ? s : Math.cos(rot) * s, sin = def.building ? 0 : Math.sin(rot) * s
    bushesTo(sim.py[i] + (sim.y[i] - sim.py[i]) * alpha + UNITS[t].r)
    if (fly || jump || spiderJump) { // hovering and jumping shadows stay on the ground
      c.setTransform(dpr, 0, 0, dpr, x * dpr, (y + fly + jumpHeight) * dpr)
      c.fillStyle = 'rgba(34,31,51,.14)'
      c.beginPath()
      c.ellipse(0, 0, 9 * size, 2.6 * size, 0, 0, Math.PI * 2)
      c.fill()
    }
    c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    if (def.colony) c.scale(1, 0.18 + built * 0.82) // the dirt pile rises as the crew digs
    if (def.bug === 'millipede' && sim.millipedes.curlT[i] >= 0.18) {
      const curl = 1 - sim.millipedes.curlT[i] / 0.35
      c.scale(1 - curl * 0.45, 1 + curl * 0.2)
    }
    if (def.bug === 'spider' && sim.spiders.windT[i] > 0) c.scale(1.15, 0.7)
    if (charging) c.scale(-Math.cos(turn * Math.PI) * (1 + charge * 0.12), 1 - charge * 0.16) // turn paper-thin, then clench
    if (def.squish) c.scale(1 + sim.hitT[i] * 0.45, 1 - sim.hitT[i] * 0.4) // flattens under a hit, then springs back
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
    const sink = air || fly || jump || spiderJump || def.building ? 0 : sinkAt(sim.px[i] + (sim.x[i] - sim.px[i]) * alpha, sim.py[i] + (sim.y[i] - sim.py[i]) * alpha + UNITS[t].r) / size
    if (def.bug === 'nest' && built < 1) {
      c.save()
      c.globalAlpha = 0.2
      c.drawImage(img, -24, -44, 48, 48)
      c.globalAlpha = 1
      c.beginPath()
      c.rect(-24, -built * 44, 48, built * 44 + 4)
      c.clip()
      c.drawImage(img, -24, -44, 48, 48)
      c.restore()
    } else if (def.bug === 'millipede' && sim.millipedes.curlT[i] < 0.18) {
      c.save()
      c.translate(0, -15)
      c.rotate(sim.millipedes.wheelPhase[i] * face)
      c.drawImage(img, -24, -29, 48, 48)
      c.restore()
    } else if (UNITS[t].eats) { // drawn segment by segment, so it really does get longer
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
    if (sim.team[i] < 2 && st !== 1) { // red or blue: a bandanna (eggs are all shell); fades with a hider
      c.globalAlpha = a0
      bandanna(c, def.eats ? sprites.snake[0] : img, def.band, TEAM_COLORS[sim.team[i]], sim.tick * 0.3 + i)
    }
    c.globalAlpha = 1
    if (def.bug === 'millipede' || def.bug === 'car') {
      c.save()
      if (def.bug === 'car') {
        const wheel = sprites.alt[MILLIPEDE]!
        for (const [wx, wy] of [[-13, -19], [12, -19], [-13, -6], [12, -6]]) {
          c.save()
          c.translate(wx, wy + Math.sin(sim.tick * 0.45 + wx) * 0.7)
          c.rotate(sim.millipedes.wheelPhase[i] * face)
          c.scale(0.43, 0.43)
          c.drawImage(wheel, -24, -29, 48, 48)
          c.restore()
        }
      }
      c.strokeStyle = '#a58b75'
      c.lineWidth = 1
      c.globalAlpha = 0.55
      for (let k = 0; k < 2; k++) {
        const drift = (sim.tick * 0.09 + k * 0.5 + i) % 1
        c.beginPath()
        c.moveTo(-17 - drift * 8, -4 - k * 5)
        c.lineTo(-22 - drift * 8, -4 - k * 5)
        c.stroke()
      }
      if (sim.millipedes.group[i] >= 0 && assembly > 0) {
        c.strokeStyle = '#e2ad46'
        c.globalAlpha = assembly
        c.beginPath()
        for (let k = 0; k < 3; k++) {
          const a = k * Math.PI * 2 / 3 + sim.millipedes.heading[i]
          c.moveTo(Math.cos(a) * 21, -15 + Math.sin(a) * 21)
          c.lineTo(Math.cos(a) * 25, -15 + Math.sin(a) * 25)
        }
        c.stroke()
      }
      c.restore()
    }
    if (def.bug === 'mantis') {
      c.save()
      c.strokeStyle = '#4d7a3c'
      c.lineWidth = 1.8
      const reach = g >= 0 ? 13 : atk * 9
      c.beginPath()
      c.moveTo(4, -19); c.lineTo(11 + reach, -22); c.lineTo(12 + reach, -29)
      c.moveTo(1, -18); c.lineTo(8 + reach, -16); c.lineTo(10 + reach, -25)
      c.stroke()
      if (sim.mantises.role[i] === 2) {
        const tap = Math.abs(Math.sin(sim.tick * 0.2 + i)) * 2
        c.beginPath(); c.moveTo(-8, -1); c.lineTo(-14, -tap); c.stroke()
      }
      if (g >= 0 && sim.alive[g]) { // the actual captive, skipped by the normal held-fighter pass
        const victim = UNITS[sim.type[g]], vs = (victim.size ?? 1) / size, captiveImg = spriteOf(g)
        c.translate(18, -13)
        c.rotate(-0.35 + Math.sin(sim.tick * 0.5 + g) * 0.15)
        c.scale(vs, vs)
        c.drawImage(captiveImg, -24, -28, 48, 48)
        if (sim.team[g] < 2 && sim.stage[g] !== 1) {
          c.translate(0, 16)
          bandanna(c, captiveImg, victim.band, TEAM_COLORS[sim.team[g]], sim.tick * 0.3 + g)
        }
      }
      c.restore()
    }
    if (def.bug === 'nest') {
      c.save()
      const birth = sim.spiders.birthT[i] / 0.8, stock = Math.min(5, sim.spiders.cocoons[i])
      c.lineWidth = 1
      for (let k = 0; k < stock; k++) {
        const a = Math.PI * 0.13 + k * Math.PI * 0.19
        const cx = Math.cos(a) * 20, cy = -3 + Math.sin(a) * 4
        const twitch = birth > 0 ? Math.sin(sim.tick * 0.9 + k) * birth : 0
        c.fillStyle = '#f7f3f9'
        c.strokeStyle = '#9a8fa4'
        c.beginPath()
        c.ellipse(cx + twitch, cy, 4.2, 6, -0.25 + twitch * 0.1, 0, Math.PI * 2)
        c.fill(); c.stroke()
        c.beginPath()
        c.moveTo(cx - 3, cy - 2); c.lineTo(cx + 3, cy)
        c.moveTo(cx - 3, cy + 1); c.lineTo(cx + 3, cy + 3)
        c.stroke()
      }
      if (birth > 0) {
        c.globalAlpha = 0.5 + Math.sin(sim.tick * 0.4) * 0.2
        c.strokeStyle = '#fff8dc'
        c.lineWidth = 1.5
        c.beginPath()
        c.arc(3, -8, 7 + birth * 9, Math.PI, Math.PI * 2)
        c.stroke()
      }
      c.restore()
    }
    if (def.bug === 'spider') {
      c.save()
      const home = sim.spiders.home[i]
      if (sim.spiders.weaving[i] && home >= 0 && sim.alive[home]) {
        c.strokeStyle = '#c6bbd1'
        c.lineWidth = 1
        c.beginPath()
        c.moveTo(8, -12)
        c.lineTo((sim.x[home] - sim.x[i]) * face / size, (sim.y[home] - sim.y[i]) / size - 4 - Math.sin(sim.tick * 0.3) * 4)
        c.stroke()
      }
      if (sim.spiders.mount[i] >= 0 && sim.spiders.clingT[i] > 0) {
        c.strokeStyle = '#77618c'
        c.lineWidth = 1.3
        const nibble = Math.sin(sim.tick * 0.8 + i) * 2
        c.beginPath()
        c.moveTo(9, -12); c.lineTo(17, -8 + nibble)
        c.moveTo(13, -10); c.lineTo(19, -12 - nibble)
        c.stroke()
      }
      c.restore()
    }
    if (sim.spiders.webT[i] > 0 && !def.building) {
      c.save()
      c.strokeStyle = '#f3edf8'
      c.lineWidth = 1.2
      c.globalAlpha = Math.min(1, sim.spiders.webT[i] * 3)
      c.beginPath()
      for (let strand = 0; strand < 5; strand++) {
        const a = strand * Math.PI / 5
        c.moveTo(Math.cos(a) * 12, -5 + Math.sin(a) * 5)
        c.lineTo(-Math.cos(a) * 12, -5 - Math.sin(a) * 5)
      }
      c.ellipse(0, -5, 10, 4.5, 0, 0, Math.PI * 2)
      c.stroke()
      c.restore()
    }
    if (def.colony) {
      c.save()
      c.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr)
      if (built < 1) {
        const by = -12 - built * 23
        c.strokeStyle = '#ded6c9'
        c.lineWidth = 2
        c.beginPath(); c.moveTo(-13, by); c.lineTo(13, by); c.stroke()
        c.strokeStyle = sim.team[i] < 2 ? TEAM_COLORS[sim.team[i]] : '#ad5640'
        c.beginPath(); c.moveTo(-13, by); c.lineTo(-13 + built * 26, by); c.stroke()
        c.fillStyle = '#77717a'
        c.font = '10px system-ui'
        c.textAlign = 'center'
        c.fillText(`${sim.colonyWorkers[i]}/${sim.nextColony[sim.team[i]]}`, 0, by - 5)
      }
      if (sim.atkT[i] > 0) { // a new tenant kicks a little dirt out of the doorway
        c.fillStyle = '#b98b61'
        for (let k = 0; k < 3; k++) {
          const u = 1 - sim.atkT[i]
          c.globalAlpha = sim.atkT[i]
          c.beginPath()
          c.arc(face * (6 + u * (7 + k * 3)), -5 - Math.sin(u * Math.PI) * (4 + k * 2), 1.2, 0, Math.PI * 2)
          c.fill()
        }
      }
      if (built < 1 && sim.colonyWorkers[i] > 0) { // busy underground: little clods hop from the entrance
        c.fillStyle = '#b98b61'
        for (let k = 0; k < 3; k++) {
          const u = (sim.tick * 0.04 + k / 3 + i * 0.17) % 1
          c.globalAlpha = 1 - u
          c.beginPath()
          c.arc(face * (4 + u * (6 + k * 3)), -2 - Math.sin(u * Math.PI) * (5 + k), 1.2, 0, Math.PI * 2)
          c.fill()
        }
      }
      c.restore()
      c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    }
    if (def.ant) {
      c.save()
      c.lineWidth = 1
      c.strokeStyle = '#221f33'
      const wave = Math.sin(ph * 1.5) * (digging ? 3 : 1)
      c.beginPath()
      c.moveTo(8, -24); c.lineTo(4 + wave, -31); c.lineTo(1 + wave, -31)
      c.moveTo(13, -25); c.lineTo(16 - wave, -31); c.lineTo(20 - wave, -32)
      c.stroke()
      if (digging) {
        c.fillStyle = '#b98b61'
        for (let k = 0; k < 3; k++) {
          const u = (sim.tick * 0.08 + k / 3 + i * 0.17) % 1
          c.globalAlpha = 1 - u
          c.beginPath()
          c.arc(16 - u * 20, -3 - Math.sin(u * Math.PI) * (6 + k * 2), 1.3, 0, Math.PI * 2)
          c.fill()
        }
      }
      c.restore()
    }
    if (def.grudge && meals > 0) { // toasting: scorched darker by every hit from the one it hates, steaming once it's furious
      c.globalAlpha = (a0 * meals / GRUDGE_MAX) * 0.55
      c.drawImage(sprites.char[t]!, -24, -44, 48, 48)
      if (meals >= 3) {
        c.fillStyle = '#b9a69e'
        for (let k = 0; k < 2; k++) {
          const u = (sim.tick * 0.02 + k * 0.5 + i * 0.37) % 1
          c.globalAlpha = (1 - u) * 0.8
          c.beginPath()
          c.arc((k ? 5 : -5) + Math.sin(u * 6 + k) * 2, -36 - u * 12, 1.5 + u * 2, 0, Math.PI * 2)
          c.fill()
        }
      }
      c.globalAlpha = 1
    }
    if (def.swell && meals > 0) { // a belly full of somebody else
      c.fillStyle = '#c0392b'
      c.globalAlpha = Math.min(0.7, 0.2 + meals * 0.08)
      c.beginPath()
      c.ellipse(-3, -18, 3 + meals * 0.5, 2 + meals * 0.35, 0, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
    }
    if (sim.blindT[i] > 0) { // spat on: a blob over the face with a drip under it
      c.fillStyle = '#9fd3e8'
      c.strokeStyle = '#221f33'
      c.lineWidth = 0.8
      c.globalAlpha = Math.min(1, sim.blindT[i] * 3)
      c.beginPath()
      c.ellipse(6, -30, 4, 3, 0, 0, Math.PI * 2)
      c.moveTo(8.3, -25)
      c.ellipse(7, -25, 1.3, 2.4, 0, 0, Math.PI * 2)
      c.fill()
      c.stroke()
      c.globalAlpha = 1
    }
    if (scrolling) { // a little phone held up to its face
      c.globalAlpha = Math.min(1, sim.phoneT[i] * 4)
      c.fillStyle = '#38384b'
      c.strokeStyle = '#221f33'
      c.lineWidth = 0.8
      c.beginPath()
      c.roundRect(8, -28, 5, 8, 1)
      c.fill()
      c.stroke()
      c.fillStyle = '#addde8'
      c.fillRect(9, -27, 3, 5.5)
      c.globalAlpha = 1
    }
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
    if (sim.rush[i] || sim.dashT[i] > 0 || sim.fearT[i] > 0 || wired || sim.rollT[i] > 0) { // charge, dash, a very committed nope, or too much coffee
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
    if (sim.fearT[i] > 0 || sim.bossTick[i] >= sim.tick - 1 || charging || hauling) { // one blue sweat drop: panic, management, rainbow pressure or a very heavy delivery
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
    if ((def.regen && sim.atkT[i] === 0) || asleep) { // sleeping bubbles instead of a ZZZ label
      if (asleep) c.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr) // it's lying on its face; the bubbles still rise straight up
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
      if (asleep) c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    }
    if (wings) part(wings[1], WING, Math.sin(sim.tick * (charging ? 0.9 : 0.4) + i) * (charging ? 0.18 : 0.55) - 0.1) // tiny frantic flaps while bracing
    const aim = sim.target[i]
    if (atk > 0 && aim >= 0 && sim.alive[aim] && def.shock) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      const ex = sim.x[aim], ey = sim.y[aim] - 15
      c.strokeStyle = '#b5d9ff'
      c.lineWidth = 1.8
      c.globalAlpha = atk
      c.beginPath()
      c.moveTo(x, y - 18)
      for (let k = 1; k <= 7; k++) {
        const u = k / 7, bend = k === 7 ? 0 : k & 1 ? 3 : -3
        c.lineTo(x + (ex - x) * u, y - 18 + (ey - y + 18) * u + bend)
      }
      c.stroke()
      c.globalAlpha = 1
      c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    }
    const strung = sim.tethered(i)
    if (strung >= 0) { // the cheese strand: droops when slack, thins as it pulls tight
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      const ex = sim.x[strung], ey = sim.y[strung] - 15, sy = y - 18, d = Math.hypot(ex - x, ey - sy)
      c.strokeStyle = '#ffd775'
      c.lineWidth = 2.5 - Math.min(1, d / TETHER_LEN) * 1.3
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(x, sy)
      c.quadraticCurveTo((x + ex) / 2, (sy + ey) / 2 + Math.max(2, (TETHER_LEN - d) * 0.3), ex, ey)
      c.stroke()
      c.setTransform(cos * face, sin * face, -sin, cos, x * dpr, y * dpr)
    }
    if (def.lawn && atk > 0) {
      c.strokeStyle = '#91a84d'
      c.lineWidth = 1.5
      c.beginPath()
      for (let k = 0; k < 3; k++) {
        c.moveTo(16 + k * 3, -5)
        c.lineTo(20 + k * 3 + atk * 5, -14 - k * 3)
      }
      c.stroke()
    }
    if (def.scare && atk > 0) { // the honk: three little sound arcs off the beak
      c.strokeStyle = '#9a9aa8'
      c.lineWidth = 1.1
      c.globalAlpha = atk
      for (let k = 0; k < 3; k++) {
        c.beginPath()
        c.arc(23, -32, 3 + k * 2.5, -0.6, 0.6)
        c.stroke()
      }
      c.globalAlpha = 1
    }
    if (charging && !air && turn === 1) { // sparkles get sucked into the business end
      c.save()
      c.translate(-15, -13)
      c.lineWidth = 1.1
      for (let k = 0; k < RAINBOW.length; k++) {
        const u = (sim.tick * 0.035 + k / 6 + i * 0.13) % 1, a = k * Math.PI / 3 + charge * 2
        const r = 3 + (1 - u) * (10 + charge * 8), sx = Math.cos(a) * r, sy = Math.sin(a) * r
        c.strokeStyle = RAINBOW[k]
        c.globalAlpha = u
        c.beginPath()
        c.moveTo(sx - 2, sy); c.lineTo(sx + 2, sy)
        c.moveTo(sx, sy - 2); c.lineTo(sx, sy + 2)
        c.stroke()
        c.globalAlpha = 0.4 + charge * 0.6
        c.beginPath()
        c.arc(0, 0, 2 + charge * 4, k * Math.PI / 3, (k + 1) * Math.PI / 3)
        c.stroke()
      }
      c.restore()
    }
    if (blasting && !air) { // six parallel stripes, locked at release; never an arch or a homing hose
      const bx = x + (-15 * cos * face + 13 * sin) / dpr, by = y + (-15 * sin * face - 13 * cos) / dpr
      const nx = sim.beamX[i], ny = sim.beamY[i], life = sim.beamT[i] / RAINBOW_BLAST
      const ex = bx + nx * def.range, ey = by + ny * def.range, width = 0.6 + life * 0.4
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.lineWidth = 1.8 * width
      c.lineCap = 'round'
      c.globalAlpha = Math.min(1, life * 3)
      for (const [k, col] of RAINBOW.entries()) {
        const offset = (k - 2.5) * 1.6 * width
        c.strokeStyle = col
        c.beginPath()
        c.moveTo(bx - ny * offset, by + nx * offset)
        c.lineTo(ex - ny * offset, ey + nx * offset)
        c.stroke()
      }
      c.strokeStyle = '#fff4cd'
      c.lineWidth = 1.4
      c.globalAlpha = life
      c.beginPath()
      c.arc(bx, by, 4 + (1 - life) * 12, 0, Math.PI * 2)
      c.stroke()
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
    if (sim.spotT[i] > 0) { // caught by a pose: a sparkle over its head, like the ring light's
      c.setTransform(dpr, 0, 0, dpr, x * dpr, (y - 40 * size) * dpr)
      c.fillStyle = '#fff7ca'
      c.strokeStyle = '#221f33'
      c.lineWidth = 0.6
      c.globalAlpha = Math.min(1, sim.spotT[i] * 3)
      c.beginPath()
      for (let k = 0; k < 8; k++) c.lineTo(Math.cos(k * 0.785) * (k & 1 ? 1 : 3.5), Math.sin(k * 0.785) * (k & 1 ? 1 : 3.5))
      c.closePath()
      c.fill()
      c.stroke()
      c.globalAlpha = 1
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

  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  for (let k = 0; k < MAXK; k++) { // stink clouds: wobbling green puffs with a few wavy lines rising off them
    const life = sim.kLife[k]
    if (life <= 0) continue
    const R = UNITS[sim.kType[k]].stink ?? 60, age = 1 - life, kx = sim.kX[k], ky = sim.kY[k]
    c.globalAlpha = 0.3 * Math.min(1, life * 3)
    c.fillStyle = 'rgb(150,190,80)'
    c.beginPath()
    for (let b = 0; b < 4; b++) {
      const a = b * 1.57 + k, rr = R * 0.5
      const ox = Math.cos(a) * R * (0.3 + age * 0.15) + Math.sin(sim.tick * 0.05 + b) * 2, oy = Math.sin(a) * R * 0.18 - 6
      c.moveTo(kx + ox + rr, ky + oy)
      c.ellipse(kx + ox, ky + oy, rr, rr * 0.6, 0, 0, Math.PI * 2)
    }
    c.fill()
    c.globalAlpha = 0.6 * Math.min(1, life * 3)
    c.strokeStyle = '#7a9a3a'
    c.lineWidth = 1
    c.beginPath()
    for (let w = 0; w < 3; w++) {
      const lx = kx + (w - 1) * R * 0.35, ly = ky - 10 - ((sim.tick * 0.4 + w * 5) % 10)
      c.moveTo(lx, ly)
      c.quadraticCurveTo(lx + 3, ly - 3, lx, ly - 6)
      c.quadraticCurveTo(lx - 3, ly - 9, lx, ly - 12)
    }
    c.stroke()
  }
  c.globalAlpha = 1

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
      const o = def.knock < 0 ? sim.owner(p) : -1 // pearls on a string: a line of tea back to the straw that fired it
      if (o >= 0) {
        const os = def.size ?? 1
        c.strokeStyle = '#8a5a3c'
        c.lineWidth = 1
        c.globalAlpha = 0.6
        c.beginPath()
        c.moveTo(sim.x[o] + sim.face[o] * 10 * os, sim.y[o] + def.r - 40 * os)
        c.lineTo(sim.pX[p], sim.pY[p] - 10)
        c.stroke()
        c.globalAlpha = 1
      }
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
      } else if (def.projectile === 'web') {
        c.strokeStyle = '#b8aec4'
        c.fillStyle = '#faf7fc'
        c.arc(0, 0, 3.5, 0, Math.PI * 2)
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
      } else if (def.projectile === 'web') {
        c.strokeStyle = '#d0c5dc'
        c.beginPath()
        c.moveTo(-3, -1); c.quadraticCurveTo(-9, -5, -13, -2)
        c.moveTo(-3, 1); c.quadraticCurveTo(-8, 5, -11, 3)
        c.stroke()
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

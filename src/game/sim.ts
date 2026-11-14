import { UNITS, type UnitDef } from './units.ts'

export const MAX = 4000
export const DT = 1 / 60
export const MAXS = 256
export const MAXF = 600
const BURN = 9 // burn damage per second
export const MAXB = 3000
export const BUSH_R = 18 // a hider whose centre is this close to a bush stamp is hidden
export const BCELL = 8 // terrain mask resolution, px
const REVEAL = 30 // enemies only spot a hidden unit this close
const AMBUSH = 80 // a hider breaks cover when an enemy is this much beyond its reach
const CELL = 32
const SIGHT = 5 // cells a unit scans for a target; beyond that it walks at the enemy crowd
const MAXP = 1024
const NT = UNITS.length
export const MAXR = 64
export const MAXO = 768
export const RING_R = 80 // a phoenix's fire ring heals its own kind this close
const EGG_T = 2.5, CHICK_T = 8 // seconds as an egg, then as a chick
export const MOSH_R = 70 // a siren's death metal hurts enemies this close
const METAL_T = 3, ENCORE = 2 // seconds of metal, then at least this much ballad before the next set
const SWIMS = UNITS.map((u) => u.category === 'Water') // puddles only slow the rest
const GRAB_T = 0.7, FLING = 330, FLING_D = 264, LAND_DMG = 18, LAND_R = 22 // shake time, throw speed px/s and distance, the fall, who it lands on
export const KING = 5 // meals that make a snake a king
export const LEAP_T = 0.48, DASH_T = 0.22, SPIN_T = 0.8, SCRAP_T = 0.8
export const SLAM_R = 48
const BABY = -4, SUMMON = 300 // a summoned snake starts this many meals short; ticks between a king's summons
const CARRY_T = 3, THROW_R = 110, BOUNCE = 130 // a carrier gives up looking after this long; throws from this close; how far a collision sends both
const CHICKS = UNITS.map((u) => u.rebirth && { ...u, ...u.rebirth })

const f32 = (n: number) => new Float32Array(n)

// Units live in parallel typed arrays (no per-unit objects, no garbage), and every
// type is its own team. A dead slot is reused by the next spawn.
export class Sim {
  w = 1
  h = 1
  tick = 0
  n = 0 // high-water mark of used slots
  dirty = false // grid is stale (spawn/clear/resize since the last build)

  x = f32(MAX)
  y = f32(MAX)
  px = f32(MAX) // position one tick ago, for render interpolation
  py = f32(MAX)
  vx = f32(MAX)
  vy = f32(MAX)
  hp = f32(MAX)
  cd = f32(MAX)
  hitT = f32(MAX) // 1 -> 0 pop when hit or spawned
  atkT = f32(MAX) // 1 -> 0 lunge when attacking
  phase = f32(MAX) // walk cycle
  burnT = f32(MAX) // seconds left on fire
  hidden = new Uint8Array(MAX) // a hider standing in a bush
  ambush = new Uint8Array(MAX) // its first strike out of cover hits double
  slowT = f32(MAX) // seconds left slowed
  lureT = f32(MAX) // seconds left charmed by a siren's ballad, walking to (lureX, lureY)
  lureX = f32(MAX)
  lureY = f32(MAX)
  song = f32(MAX) // siren: playing death metal while > 0, crooning otherwise
  stage = new Uint8Array(MAX) // phoenix lives: 0 fresh, 1 egg, 2 chick, 3 grown back (no more encores)
  stageT = f32(MAX) // seconds left as an egg or chick
  grab = new Int32Array(MAX).fill(-1) // who this one has in its jaws
  heldBy = new Int32Array(MAX).fill(-1) // whose jaws this one is in
  private grabT = f32(MAX) // seconds of shaking left before the throw
  airT = f32(MAX) // seconds left in the air after being thrown
  airD = f32(MAX) // how long that whole flight is (the renderer's arc)
  private bounce = new Uint8Array(MAX) // thrown at someone: whoever it lands on is sent flying, and it bounces off them
  private airBy = new Uint8Array(MAX) // type that threw it (its own kind is spared at the landing)
  rush = new Uint8Array(MAX) // mid-charge: sprinting at a far-off target, and the next poke launches it
  beam = new Uint8Array(MAX) // pegasus: turned round and firing the rainbow at its target
  dizzyT = f32(MAX) // seconds of seeing stars after landing
  grow = f32(MAX) // snake: meals eaten (negative for a summoned little one)
  shockT = f32(MAX) // stunned, showing cartoon bones
  fearT = f32(MAX) // ninja's tactical reassessment of the vibes
  dashT = f32(MAX)
  leapT = f32(MAX)
  spinT = f32(MAX)
  pulseT = f32(MAX) // a pose or a rump-first landing's fading ring
  scrapT = f32(MAX) // cat's opening dust-cloud brawl
  scrapBy = new Int32Array(MAX).fill(-1) // victim: which cat is currently in the cloud with it
  opened = new Uint8Array(MAX) // cat only gets one opening leap per life
  private abilityCd = f32(MAX)
  private generation = new Uint32Array(MAX) // a recycled slot is a new fighter
  private focus = new Int32Array(MAX).fill(-1) // target locked when a dash/leap starts
  private focusGen = new Uint32Array(MAX)
  private died = false // the last damage() was a real kill
  private ringAt = new Int32Array(MAX) // tick when it may next leave a healing ring (phoenix) or summon (king snake)
  type = new Uint8Array(MAX)
  alive = new Uint8Array(MAX)
  face = new Int8Array(MAX)
  target = new Int32Array(MAX)
  counts = new Int32Array(NT)
  private free = new Int32Array(MAX)
  private freeN = 0

  // uniform grid, rebuilt each tick with a counting sort
  cols = 1
  rows = 1
  cellStart = new Int32Array(2)
  items = new Int32Array(MAX)
  itemN = 0
  private cursor = new Int32Array(2)

  // projectiles (staples)
  pn = 0
  pX = f32(MAXP)
  pY = f32(MAXP)
  pVx = f32(MAXP)
  pVy = f32(MAXP)
  pLife = f32(MAXP)
  pDmg = f32(MAXP)
  pType = new Uint8Array(MAXP)

  // dragon-breath flames (visual only; the damage is a cone check)
  fn = 0
  fX = f32(MAXF)
  fY = f32(MAXF)
  fVx = f32(MAXF)
  fVy = f32(MAXF)
  fLife = f32(MAXF)

  // healing fire rings (the heal lands at once; this is the afterglow), a ring buffer
  rX = f32(MAXR)
  rY = f32(MAXR)
  rLife = f32(MAXR)
  private rHead = 0

  // terrain: bush and puddle stamps (for drawing) plus a coarse mask (for "am I in a bush / in water?")
  bn = 0
  bX = f32(MAXB)
  bY = f32(MAXB)
  bS = f32(MAXB)
  bT = new Uint8Array(MAXB) // 0 bush, 1 puddle
  terrainVer = 0 // bumped on every change so the renderer knows to redraw its cached layer
  bmask = new Uint8Array(1) // per cell: bit 0 bush, bit 1 water (the renderer draws the water from this)
  bcols = 1

  // foam left behind by anyone moving through water, or leaves kicked up in a bush (visual only), a ring buffer
  oK = new Uint8Array(MAXO) // 0 foam, 1 leaf
  oX = f32(MAXO)
  oY = f32(MAXO)
  oA = f32(MAXO) // heading
  oLife = f32(MAXO)
  private oHead = 0

  // ink splats, a ring buffer
  sX = f32(MAXS)
  sY = f32(MAXS)
  sLife = f32(MAXS)
  sSize = f32(MAXS)
  sRot = f32(MAXS)
  sType = new Uint8Array(MAXS)
  private sHead = 0

  private cx = f32(NT)
  private cy = f32(NT)

  resize(w: number, h: number) {
    this.w = Math.max(1, w)
    this.h = Math.max(1, h)
    this.cols = Math.ceil(this.w / CELL)
    this.rows = Math.ceil(this.h / CELL)
    this.cellStart = new Int32Array(this.cols * this.rows + 1)
    this.cursor = new Int32Array(this.cols * this.rows + 1)
    this.bcols = Math.ceil(this.w / BCELL)
    this.bmask = new Uint8Array(this.bcols * Math.ceil(this.h / BCELL))
    for (let b = 0; b < this.bn; b++) this.stampBush(b)
    this.terrainVer++
    this.clamp()
    this.dirty = true
  }

  clear() {
    this.alive.fill(0)
    this.counts.fill(0)
    this.sLife.fill(0)
    this.rLife.fill(0)
    this.oLife.fill(0)
    this.n = this.freeN = this.pn = this.fn = this.bn = 0
    this.bmask.fill(0)
    this.terrainVer++
    this.dirty = true
  }

  spawn(t: number, x: number, y: number) {
    if (!this.freeN && this.n >= MAX) return -1
    const def = UNITS[t]
    x = Math.min(this.w - def.r, Math.max(def.r, x))
    y = Math.min(this.h - def.r, Math.max(def.r, y))
    if (def.waterbound && !this.inWater(x, y)) {
      this.addTerrain(x, y, 1) // a misplaced fish gets a tiny home, not a dry-land death sentence
      if (!this.inWater(x, y)) return -1
    }
    const i = this.freeN ? this.free[--this.freeN] : this.n < MAX ? this.n++ : -1
    if (i < 0) return -1
    this.x[i] = this.px[i] = Math.min(this.w - def.r, Math.max(def.r, x))
    this.y[i] = this.py[i] = Math.min(this.h - def.r, Math.max(def.r, y))
    this.vx[i] = this.vy[i] = this.atkT[i] = this.burnT[i] = this.slowT[i] = this.lureT[i] = this.song[i] = 0
    this.hp[i] = def.hp
    this.cd[i] = Math.random() * def.cd
    this.hitT[i] = 1
    this.phase[i] = Math.random() * 6
    this.type[i] = t
    this.face[i] = x < this.w / 2 ? 1 : -1
    this.target[i] = -1
    this.stage[i] = this.ringAt[i] = this.airT[i] = this.dizzyT[i] = 0
    this.grab[i] = this.heldBy[i] = -1
    this.rush[i] = this.beam[i] = this.grow[i] = 0
    this.shockT[i] = this.fearT[i] = this.dashT[i] = this.leapT[i] = this.spinT[i] = this.pulseT[i] = this.scrapT[i] = this.abilityCd[i] = this.opened[i] = 0
    this.scrapBy[i] = this.focus[i] = -1
    this.focusGen[i] = 0
    this.generation[i]++
    this.hidden[i] = this.ambush[i] = def.hides && this.inBush(this.x[i], this.y[i]) ? 1 : 0
    this.alive[i] = 1
    this.counts[t]++
    this.dirty = true
    return i
  }

  addTerrain(x: number, y: number, kind = 0) {
    if (this.bn >= MAXB) return
    const b = this.bn++
    this.bT[b] = kind
    this.bX[b] = x
    this.bY[b] = y
    this.bS[b] = 0.85 + Math.random() * 0.3
    this.stampBush(b)
    this.terrainVer++
  }

  private stampBush(b: number) {
    const R = BUSH_R * this.bS[b], bx = this.bX[b], by = this.bY[b], rows = this.bmask.length / this.bcols
    const x1 = Math.min(this.bcols - 1, ((bx + R) / BCELL) | 0), y1 = Math.min(rows - 1, ((by + R) / BCELL) | 0)
    for (let gy = Math.max(0, ((by - R) / BCELL) | 0); gy <= y1; gy++)
      for (let gx = Math.max(0, ((bx - R) / BCELL) | 0); gx <= x1; gx++) {
        const dx = (gx + 0.5) * BCELL - bx, dy = (gy + 0.5) * BCELL - by
        if (dx * dx + dy * dy <= R * R) this.bmask[gy * this.bcols + gx] |= 1 << this.bT[b]
      }
  }

  private mask(x: number, y: number) {
    const gx = (x / BCELL) | 0, gy = (y / BCELL) | 0
    return gx >= 0 && gx < this.bcols && gy >= 0 ? this.bmask[gy * this.bcols + gx] : 0
  }

  inBush(x: number, y: number) {
    return (this.mask(x, y) & 1) === 1
  }

  inWater(x: number, y: number) {
    return (this.mask(x, y) & 2) === 2
  }

  private cell(i: number) {
    return Math.min(this.cols - 1, (this.x[i] / CELL) | 0) + Math.min(this.rows - 1, (this.y[i] / CELL) | 0) * this.cols
  }

  buildGrid() {
    const cs = this.cellStart, cur = this.cursor, alive = this.alive
    cs.fill(0)
    for (let i = 0; i < this.n; i++) if (alive[i]) cs[this.cell(i) + 1]++
    for (let c = 1; c < cs.length; c++) cs[c] += cs[c - 1]
    cur.set(cs)
    for (let i = 0; i < this.n; i++) if (alive[i]) this.items[cur[this.cell(i)]++] = i
    this.itemN = cs[cs.length - 1]
    this.dirty = false
  }

  private clamp() {
    for (let i = 0; i < this.n; i++) {
      const r = UNITS[this.type[i]].r
      this.x[i] = Math.min(this.w - r, Math.max(r, this.x[i]))
      this.y[i] = Math.min(this.h - r, Math.max(r, this.y[i]))
      if (this.alive[i] && UNITS[this.type[i]].waterbound) this.keepWet(i)
    }
  }

  private keepWet(i: number) {
    const ox = this.px[i], oy = this.py[i], r = UNITS[this.type[i]].r
    if (!this.inWater(ox, oy) || ox < r || ox > this.w - r || oy < r || oy > this.h - r) {
      if (this.inWater(this.x[i], this.y[i])) {
        this.px[i] = this.x[i]; this.py[i] = this.y[i]
        return
      }
      // Resize can erase the old pond; rehome to the nearest remaining wet cell.
      let best = Infinity, bx = this.x[i], by = this.y[i]
      for (let k = 0; k < this.bmask.length; k++) {
        if (!(this.bmask[k] & 2)) continue
        const x = (k % this.bcols + 0.5) * BCELL, y = (((k / this.bcols) | 0) + 0.5) * BCELL
        if (x < r || x > this.w - r || y < r || y > this.h - r) continue
        const d = (x - bx) ** 2 + (y - by) ** 2
        if (d < best) { best = d; this.x[i] = x; this.y[i] = y }
      }
      if (best === Infinity) this.addTerrain(this.x[i], this.y[i], 1)
      this.px[i] = this.x[i]; this.py[i] = this.y[i]
      this.vx[i] = this.vy[i] = 0
      return
    }
    const dx = this.x[i] - ox, dy = this.y[i] - oy
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (BCELL * 0.5)))
    for (let k = 1; k <= steps; k++) {
      if (this.inWater(ox + dx * k / steps, oy + dy * k / steps)) continue
      this.x[i] = ox + dx * (k - 1) / steps
      this.y[i] = oy + dy * (k - 1) / steps
      this.vx[i] = this.vy[i] = 0
      break // neither a shove nor separation may skip over a dry gap
    }
  }

  private splat(x: number, y: number, t: number, size: number) {
    const k = this.sHead
    this.sHead = (k + 1) % MAXS
    this.sX[k] = x
    this.sY[k] = y
    this.sType[k] = t
    this.sSize[k] = size
    this.sRot[k] = Math.random() * 6.28
    this.sLife[k] = 1
  }

  private def(i: number) {
    return this.stage[i] === 2 ? CHICKS[this.type[i]]! : UNITS[this.type[i]]
  }

  private kill(i: number) {
    this.endScrap(i)
    this.leapT[i] = this.dashT[i] = this.spinT[i] = 0
    if (UNITS[this.type[i]].rebirth && !this.stage[i]) { // first death: curl up in an egg instead
      this.stage[i] = 1
      this.stageT[i] = EGG_T
      this.hp[i] = this.hitT[i] = 1
      this.vx[i] = this.vy[i] = this.burnT[i] = this.slowT[i] = this.atkT[i] = this.airT[i] = 0
      this.splat(this.x[i], this.y[i], this.type[i], 1.2)
      return
    }
    this.alive[i] = 0
    this.died = true
    this.free[this.freeN++] = i
    this.counts[this.type[i]]--
    this.splat(this.x[i], this.y[i], this.type[i], 0.8 + Math.random() * 0.5)
    const hatch = UNITS[this.type[i]].hatch // reuses the slot that just died
    if (hatch) this.spawn(UNITS.findIndex((u) => u.key === hatch), this.x[i], this.y[i])
  }

  private damage(j: number, dmg: number, kx: number, ky: number) {
    if (!this.alive[j] || this.stage[j] === 1) return // eggs shrug everything off
    this.hp[j] -= dmg
    this.hitT[j] = 1
    this.vx[j] += kx
    this.vy[j] += ky
    if (this.hp[j] <= 0) this.kill(j)
  }

  // a landed attack: damage plus whatever extras the attacker carries
  private hit(j: number, def: UnitDef, kx: number, ky: number, from: number, mult = 1) {
    if (!this.alive[j] || this.stage[j] === 1) return
    if (def.burn) this.burnT[j] = def.burn
    if (def.slow) this.slowT[j] = def.slow
    if (def.shock) this.shockT[j] = def.shock
    const thorns = UNITS[this.type[j]].thorns
    this.died = false
    this.damage(j, def.dmg * mult, kx, ky)
    if (this.died && def.eats && from >= 0) { // down in one gulp: bigger, and back to full health
      this.grow[from]++
      this.hp[from] = this.maxHp(from)
      this.hitT[from] = 1
    }
    if (thorns && from >= 0) this.damage(from, thorns, 0, 0)
  }

  private maxHp(i: number) {
    const def = this.def(i)
    return def.eats ? Math.max(def.hp * 0.4, def.hp + this.grow[i] * def.eats) : def.hp
  }

  private lockOn(i: number, t: number) {
    this.focus[i] = t
    this.focusGen[i] = this.generation[t]
  }

  private focusAlive(i: number) {
    const t = this.focus[i]
    return t >= 0 && !!this.alive[t] && this.generation[t] === this.focusGen[i] && this.type[t] !== this.type[i] && this.stage[t] !== 1 && this.heldBy[t] < 0
  }

  brawling(i: number) {
    const cat = this.scrapBy[i]
    return cat >= 0 && !!this.alive[cat] && this.scrapT[cat] > 0 && this.focus[cat] === i && this.focusGen[cat] === this.generation[i]
  }

  private endScrap(i: number) {
    const t = this.focus[i]
    if (t >= 0 && this.scrapBy[t] === i) this.scrapBy[t] = -1
    this.scrapT[i] = 0
  }

  // Spins, fit checks and capybara landings use the same small enemy-only circle.
  private sweep(i: number, R: number, mult = 1) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const def = this.def(i)
    const x0 = Math.max(0, ((x[i] - R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + R) / CELL) | 0)
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const cell = yy * cols + xx
        for (let q = cs[cell]; q < cs[cell + 1]; q++) {
          if (!alive[i]) return // reflected damage can stop a spin mid-sweep
          const j = items[q]
          if (!alive[j] || type[j] === type[i] || this.heldBy[j] >= 0 || this.airT[j] > 0) continue
          const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1
          if (d < R + UNITS[type[j]].r) this.hit(j, def, dx / d * def.knock, dy / d * def.knock, i, mult)
        }
      }
  }

  private dangerous(i: number, t: number, distance: number) {
    if (t < 0 || distance > 130) return false
    const enemy = UNITS[this.type[t]], def = this.def(i)
    if (this.hp[i] < def.hp * 0.4 || enemy.r > def.r * 1.4 || enemy.dmg >= this.hp[i] * 0.65) return true
    const gx = (this.x[i] / CELL) | 0, gy = (this.y[i] / CELL) | 0
    let enemies = 0
    for (let yy = Math.max(0, gy - 2); yy <= Math.min(this.rows - 1, gy + 2); yy++)
      for (let xx = Math.max(0, gx - 2); xx <= Math.min(this.cols - 1, gx + 2); xx++) {
        const cell = yy * this.cols + xx
        for (let q = this.cellStart[cell]; q < this.cellStart[cell + 1]; q++) {
          const j = this.items[q]
          if (!this.alive[j] || this.type[j] === this.type[i] || this.hidden[j] || this.heldBy[j] >= 0 || this.stage[j] === 1) continue
          if ((this.x[j] - this.x[i]) ** 2 + (this.y[j] - this.y[i]) ** 2 < 80 * 80 && ++enemies >= 3) return true
        }
      }
    return false
  }

  private finishLeap(i: number) {
    this.leapT[i] = 0
    this.vx[i] = this.vy[i] = 0
    this.atkT[i] = this.hitT[i] = 1
    const def = this.def(i)
    if (def.leap === 'slam') {
      this.pulseT[i] = 0.55
      this.sweep(i, SLAM_R, 2)
    } else if (this.focusAlive(i)) {
      const t = this.focus[i]
      if (this.airT[t] <= 0 && Math.hypot(this.x[t] - this.x[i], this.y[t] - this.y[i]) < 55) {
        this.scrapT[i] = SCRAP_T
        this.scrapBy[t] = i
        this.vx[t] = this.vy[t] = 0
        this.hit(t, def, 0, 0, i)
        if (!this.alive[i] || !this.focusAlive(i)) this.endScrap(i)
      }
    }
  }

  private findTarget(i: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const ty = type[i]
    const gx = Math.min(cols - 1, (x[i] / CELL) | 0), gy = Math.min(this.rows - 1, (y[i] / CELL) | 0)
    const sight = Math.max(SIGHT, Math.ceil((this.def(i).range + this.def(i).r + 24) / CELL))
    const x1 = Math.min(cols - 1, gx + sight), y1 = Math.min(this.rows - 1, gy + sight)
    let best = -1, bd = Infinity
    for (let yy = Math.max(0, gy - sight); yy <= y1; yy++)
      for (let xx = Math.max(0, gx - sight); xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || type[j] === ty || j === this.grab[i] || this.heldBy[j] >= 0 || this.stage[j] === 1) continue
          const dx = x[j] - x[i], dy = y[j] - y[i], d = dx * dx + dy * dy
          if (this.hidden[j] && d > REVEAL * REVEAL) continue
          if (d < bd) { bd = d; best = j }
        }
      }
    return best
  }

  private explode(i: number, mult: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const def = UNITS[type[i]], R = def.range, ty = type[i]
    const x0 = Math.max(0, ((x[i] - R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + R) / CELL) | 0)
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || type[j] === ty) continue
          const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1
          if (d < R + UNITS[type[j]].r) this.hit(j, def, (dx / d) * def.knock, (dy / d) * def.knock, -1, mult)
        }
      }
    this.kill(i)
    this.splat(x[i], y[i], ty, 2.6)
  }

  // fire cone in front of the dragon: burns every enemy inside it
  private breathe(i: number, nx: number, ny: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const def = UNITS[type[i]], R = def.range + def.r, ty = type[i]
    const x0 = Math.max(0, ((x[i] - R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + R) / CELL) | 0)
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || type[j] === ty) continue
          const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1
          if (d < R + UNITS[type[j]].r && (dx * nx + dy * ny) / d > 0.55) {
            if (def.heal && this.tick >= this.ringAt[i]) this.ring(i, x[j], y[j])
            this.hit(j, def, nx * def.knock, ny * def.knock, -1)
          }
        }
      }
    for (let k = 0; k < 2 && this.fn < MAXF; k++) {
      const f = this.fn++, a = Math.atan2(ny, nx) + (Math.random() - 0.5) * 0.8, sp = 170 + Math.random() * 90
      this.fX[f] = x[i] + nx * def.r * 1.2 // roughly the mouth
      this.fY[f] = y[i] + ny * def.r - 16.5 * (def.size ?? 1)
      this.fVx[f] = Math.cos(a) * sp
      this.fVy[f] = Math.sin(a) * sp
      this.fLife[f] = R / sp
    }
  }

  // ring of fire where the breath landed: heals the breather and its own kind (every type is its own team)
  private ring(i: number, rx: number, ry: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const ty = type[i], heal = UNITS[ty].heal!
    this.ringAt[i] = this.tick + 60
    const k = this.rHead
    this.rHead = (k + 1) % MAXR
    this.rX[k] = rx
    this.rY[k] = ry
    this.rLife[k] = 1
    this.hp[i] = Math.min(UNITS[ty].hp, this.hp[i] + heal)
    const x0 = Math.max(0, ((rx - RING_R) / CELL) | 0), x1 = Math.min(cols - 1, ((rx + RING_R) / CELL) | 0)
    const y0 = Math.max(0, ((ry - RING_R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((ry + RING_R) / CELL) | 0)
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (j === i || !alive[j] || type[j] !== ty) continue
          const dx = x[j] - rx, dy = y[j] - ry
          if (dx * dx + dy * dy < RING_R * RING_R) this.hp[j] = Math.min(this.def(j).hp, this.hp[j] + heal)
        }
      }
  }

  // the siren's set list: a ballad that reels enemies in, then death metal for whoever came close.
  // Metal breaks the spell, so the fans in the pit fight back until the ballad starts again.
  private sing(i: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const def = UNITS[type[i]], ty = type[i], metal = this.song[i] > 0, R = metal ? MOSH_R : def.range
    const x0 = Math.max(0, ((x[i] - R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + R) / CELL) | 0)
    let fan = false
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || type[j] === ty || this.hidden[j]) continue // leaves make fine earplugs
          const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1, rj = UNITS[type[j]].r
          if (d >= R + rj) continue
          if (metal) this.hit(j, def, (dx / d) * def.knock, (dy / d) * def.knock, -1)
          else {
            this.lureT[j] = 0.3
            this.lureX[j] = x[i]
            this.lureY[j] = y[i]
            if (d < MOSH_R + rj) fan = true
          }
        }
      }
    if (metal) this.atkT[i] = 1 // headbang
    else if (fan && this.song[i] < -ENCORE) this.song[i] = METAL_T
  }

  // the shaking is done: throw it the way the thrower is facing, give or take
  private fling(i: number, g: number) {
    this.grab[i] = this.heldBy[g] = -1
    this.atkT[i] = 1
    const a = (Math.random() - 0.5) * 1.2
    this.toss(g, Math.cos(a) * this.face[i], Math.sin(a), this.type[i])
  }

  // send a fighter through the air along (nx, ny); `by` is the type that did it
  private toss(g: number, nx: number, ny: number, by: number, dist = FLING_D, bounce = 0) {
    if (!this.alive[g] || this.stage[g] === 1 || this.heldBy[g] >= 0) return // eggs stay put; a jaw doesn't let go
    this.endScrap(g)
    this.leapT[g] = this.dashT[g] = this.spinT[g] = 0
    this.vx[g] = nx * FLING
    this.vy[g] = ny * FLING
    this.airT[g] = this.airD[g] = dist / FLING
    this.airBy[g] = by
    this.bounce[g] = bounce
  }

  // a thrown fighter comes down: it takes the fall and sees stars, and whoever it lands on is bowled over
  private land(j: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const by = this.airBy[j], bounce = this.bounce[j]
    let ox = 0, oy = 0 // which way the last fighter it hit went
    const x0 = Math.max(0, ((x[j] - LAND_R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[j] + LAND_R) / CELL) | 0)
    const y0 = Math.max(0, ((y[j] - LAND_R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[j] + LAND_R) / CELL) | 0)
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const k = items[q]
          if (k === j || !alive[k] || type[k] === by) continue
          const dx = x[k] - x[j], dy = y[k] - y[j], d = Math.hypot(dx, dy) || 1
          if (d >= LAND_R + UNITS[type[k]].r) continue
          this.damage(k, LAND_DMG * 0.5, (dx / d) * 150, (dy / d) * 150)
          if (bounce) { this.toss(k, dx / d, dy / d, by, BOUNCE); ox = dx / d; oy = dy / d }
        }
      }
    this.vx[j] = this.vy[j] = 0
    this.dizzyT[j] = 1.5
    this.slowT[j] = Math.max(this.slowT[j], 1.5) // staggers about for a bit
    this.damage(j, LAND_DMG, 0, 0)
    if (ox || oy) this.toss(j, -ox, -oy, by, BOUNCE) // and it bounces off the other way
  }

  private attack(i: number, t: number, nx: number, ny: number) {
    const def = this.def(i)
    const rush = this.rush[i], mult = (this.ambush[i] ? 2 : 1) * (rush ? 2 : 1)
    this.ambush[i] = this.rush[i] = 0
    this.cd[i] = def.cd * (0.85 + Math.random() * 0.3)
    if (def.kind === 'sing') return this.sing(i)
    if (def.kind === 'beam') return this.hit(t, def, nx * def.knock, ny * def.knock, -1, mult)
    if (def.kind !== 'fire') this.atkT[i] = 1
    if (def.spin) {
      this.spinT[i] = SPIN_T
      return this.sweep(i, def.spin, mult)
    }
    if (def.pulse) {
      this.pulseT[i] = 0.5
      return this.sweep(i, def.pulse, mult)
    }
    if (def.kind === 'boom') this.explode(i, mult)
    else if (def.kind === 'fire') this.breathe(i, nx, ny)
    else if (def.kind === 'melee') {
      this.hit(t, def, nx * def.knock, ny * def.knock, i, mult)
      if (rush) this.toss(t, nx, ny, this.type[i]) // the charge ends in one enormous poke; the pokes after it are ordinary
      if (def.lifesteal) this.hp[i] = Math.min(def.hp, this.hp[i] + def.dmg * def.lifesteal)
      if (def.grab && this.alive[t] && this.stage[t] !== 1 && this.heldBy[t] < 0 && this.airT[t] <= 0 && UNITS[this.type[t]].r < def.r && Math.random() < def.grab) {
        this.grab[i] = t // only someone smaller fits in the mouth
        this.heldBy[t] = i
        this.grabT[i] = def.carry ? CARRY_T : GRAB_T
      }
    } else {
      const count = def.burst ?? 1, angle = Math.atan2(ny, nx), speed = 420
      for (let k = 0; k < count && this.pn < MAXP; k++) {
        const p = this.pn++, a = angle + (k - (count - 1) * 0.5) * 0.15
        this.pX[p] = this.x[i] + nx * def.r
        this.pY[p] = this.y[i] + ny * def.r
        this.pVx[p] = Math.cos(a) * speed
        this.pVy[p] = Math.sin(a) * speed
        this.pLife[p] = ((def.range + def.r + 30) * 1.25) / speed
        this.pDmg[p] = def.dmg
        this.pType[p] = this.type[i]
      }
    }
  }

  step() {
    const { x, y, vx, vy, type, alive, target, cx, cy, counts, items, cellStart: cs, cols, rows } = this
    this.buildGrid()

    cx.fill(0)
    cy.fill(0)
    for (let i = 0; i < this.n; i++) {
      if (!alive[i]) continue
      cx[type[i]] += x[i]
      cy[type[i]] += y[i]
      this.hidden[i] = UNITS[type[i]].hides && this.inBush(x[i], y[i]) ? 1 : 0
      if (this.hidden[i]) this.ambush[i] = 1
    }
    for (let t = 0; t < NT; t++) if (counts[t]) { cx[t] /= counts[t]; cy[t] /= counts[t] }

    // think + steer
    for (let i = 0; i < this.n; i++) {
      if (!alive[i]) continue
      this.px[i] = x[i]
      this.py[i] = y[i]
      const ty = type[i]
      this.hitT[i] = Math.max(0, this.hitT[i] - DT * 6)
      if (this.stage[i] === 1 || this.stage[i] === 2) {
        if ((this.stageT[i] -= DT) <= 0) { // egg hatches into a chick; chick grows back up at full health
          this.hitT[i] = 1
          if (this.stage[i]++ === 1) { this.stageT[i] = CHICK_T; this.hp[i] = CHICKS[ty]!.hp } else this.hp[i] = UNITS[ty].hp
        }
        if (this.stage[i] === 1) continue // eggs just sit there
      }
      const def = this.def(i)
      this.cd[i] -= DT
      this.atkT[i] = Math.max(0, this.atkT[i] - DT * 5)
      this.abilityCd[i] = Math.max(0, this.abilityCd[i] - DT)
      this.fearT[i] = Math.max(0, this.fearT[i] - DT)
      this.pulseT[i] = Math.max(0, this.pulseT[i] - DT)
      if (this.slowT[i] > 0) this.slowT[i] -= DT
      this.song[i] -= DT
      if (this.burnT[i] > 0) {
        this.burnT[i] -= DT
        if ((this.hp[i] -= BURN * DT) <= 0) { this.kill(i); continue }
      }
      if (this.dizzyT[i] > 0) this.dizzyT[i] -= DT
      if (this.airT[i] > 0) { // thrown: no steering until it lands, and the throw's speed isn't bled off
        if ((this.airT[i] -= DT) <= 0) this.land(i)
        continue
      }
      const h = this.heldBy[i]
      if (h >= 0) {
        if (alive[h] && this.grab[h] === i) {
          this.endScrap(i)
          this.leapT[i] = this.dashT[i] = this.spinT[i] = 0
          vx[i] = vy[i] = 0
          continue
        }
        this.heldBy[i] = -1 // the jaw died or let go
      }
      if (this.shockT[i] > 0) {
        this.shockT[i] = Math.max(0, this.shockT[i] - DT)
        this.endScrap(i)
        this.leapT[i] = this.dashT[i] = this.spinT[i] = 0
        vx[i] *= 0.75; vy[i] *= 0.75
        continue
      }
      if (this.brawling(i) && this.lureT[i] <= 0) { vx[i] = vy[i] = 0; continue }
      if (this.brawling(i)) this.endScrap(this.scrapBy[i])
      this.scrapBy[i] = -1
      const g = this.grab[i]
      if (g >= 0) {
        if (!alive[g] || this.heldBy[g] !== i) this.grab[i] = -1 // it died in there
        else {
          if ((this.grabT[i] -= DT) <= 0) this.fling(i, g) // (a carrier only runs out of time if there's nobody to throw at)
          else if (!def.carry && this.tick % 10 === 0) this.damage(g, def.dmg * 0.25, 0, 0) // shake shake shake
          if (!def.carry) {
            vx[i] *= 0.87 // mouth full: stands still, no biting
            vy[i] *= 0.87
            continue
          }
        }
      }

      let t = target[i]
      if (t < 0 || !alive[t] || type[t] === ty || this.hidden[t] || this.heldBy[t] >= 0 || this.stage[t] === 1 || t === this.grab[i] || (i + this.tick) % 12 === 0) t = target[i] = this.findTarget(i)
      const lured = this.lureT[i] > 0 // charmed: forget the fight, shuffle toward the singing
      if (lured) {
        this.lureT[i] -= DT; t = -1
        this.endScrap(i)
        this.leapT[i] = this.dashT[i] = this.spinT[i] = 0
      }
      if (this.scrapT[i] > 0) {
        const victim = this.focus[i]
        if (!this.focusAlive(i) || this.airT[victim] > 0 || this.scrapBy[victim] !== i) this.endScrap(i)
        else {
          this.scrapT[i] = Math.max(0, this.scrapT[i] - DT)
          if (this.tick % 12 === 0) this.hit(victim, def, 0, 0, i)
          if (!this.alive[i] || !this.focusAlive(i) || this.scrapT[i] <= 0) this.endScrap(i)
          vx[i] = vy[i] = 0
          continue
        }
      }
      if (this.leapT[i] > 0) {
        if (!this.focusAlive(i) || (this.leapT[i] -= DT) <= 0) this.finishLeap(i)
        this.phase[i] += DT * 15
        continue // a missing target ends the jump with one landing, never a new target
      }
      if (this.dashT[i] > 0) {
        this.dashT[i] -= DT
        if (this.focusAlive(i)) {
          const victim = this.focus[i], dx = x[victim] - x[i], dy = y[victim] - y[i], distance = Math.hypot(dx, dy) || 1
          if (distance < def.r + UNITS[type[victim]].r + 12) {
            this.hit(victim, def, dx / distance * 180, dy / distance * 180, i, 2.2)
            this.atkT[i] = 1
            this.dashT[i] = 0 // one strike per dash
          }
        } else this.dashT[i] = 0
        if (this.dashT[i] <= 0) vx[i] = vy[i] = 0
        this.phase[i] += DT * 25
        continue
      }
      if (this.spinT[i] > 0) {
        this.spinT[i] = Math.max(0, this.spinT[i] - DT)
        if (this.tick % 10 === 0) this.sweep(i, def.spin!)
        if (!alive[i]) continue
      }
      if (def.regen && !this.atkT[i]) this.hp[i] = Math.min(this.maxHp(i), this.hp[i] + def.regen * DT)
      if (t < 0) this.rush[i] = this.beam[i] = 0
      if (def.eats && this.grow[i] >= KING && t >= 0 && this.tick >= this.ringAt[i]) { // a king with a fight on raises a soldier
        this.ringAt[i] = this.tick + SUMMON
        const b = this.spawn(ty, x[i] - this.face[i] * def.r * 2, y[i])
        if (b >= 0) { this.grow[b] = BABY; this.hp[b] = this.maxHp(b) }
      }

      let tx = 0, tyy = 0, has = false, reach = def.r + def.range * (def.kind === 'boom' ? 0.4 : def.kind === 'fire' ? 0.8 : 1)
      if (t >= 0) {
        tx = x[t]; tyy = y[t]; has = true
        reach += UNITS[type[t]].r
      } else if (lured) {
        tx = this.lureX[i]; tyy = this.lureY[i]; has = true
      } else {
        let bd = Infinity // nobody in sight: head for the nearest enemy crowd
        for (let k = 0; k < NT; k++) {
          if (k === ty || !counts[k]) continue
          const dx = cx[k] - x[i], dy = cy[k] - y[i], d = dx * dx + dy * dy
          if (d < bd) { bd = d; tx = cx[k]; tyy = cy[k]; has = true }
        }
      }

      let dvx = 0, dvy = 0
      if (has) {
        const dx = tx - x[i], dy = tyy - y[i], d = Math.hypot(dx, dy) || 1e-6
        const speed = def.speed * (this.slowT[i] > 0 ? 0.4 : 1) * (SWIMS[ty] || def.flies || !this.inWater(x[i], y[i]) ? 1 : 0.5)
        if (Math.abs(dx) > 2) this.face[i] = dx > 0 ? 1 : -1
        if (def.timid && !lured && this.dangerous(i, t, d)) this.fearT[i] = 1.1
        if (!lured && this.fearT[i] <= 0 && t >= 0 && this.abilityCd[i] <= 0 && this.airT[t] <= 0) {
          if (def.leap && d < 175 && (def.leap === 'slam' || !this.opened[i])) {
            this.lockOn(i, t)
            this.leapT[i] = LEAP_T - DT
            this.abilityCd[i] = 3.6
            this.opened[i] = 1
            vx[i] = dx / LEAP_T; vy[i] = dy / LEAP_T
            continue
          }
          if (def.dash && d > def.r + UNITS[type[t]].r + 12 && d < 125) {
            this.lockOn(i, t)
            this.dashT[i] = DASH_T - DT
            this.abilityCd[i] = 3.2
            vx[i] = dx / d * 520; vy[i] = dy / d * 520
            continue
          }
        }
        if (def.charge && t >= 0 && d > def.charge + reach) this.rush[i] = 1 // far enough for a run-up
        // the rainbow only starts once it has flown right up to the target, then keeps going until the target is out of range
        if (def.kind === 'beam') this.beam[i] = t >= 0 && d < reach && (this.beam[i] || d < def.r + UNITS[type[t]].r + 14) ? 1 : 0
        const cargo = this.grab[i]
        if (this.fearT[i] > 0 && !lured) { // tactical nope: attacks stop until the panic passes
          dvx = -dx / d * speed * 1.9
          dvy = -dy / d * speed * 1.9
          this.face[i] = dx > 0 ? -1 : 1
        } else if (def.orbit && t >= 0 && d < reach && !lured) {
          const turn = i & 1 ? -1 : 1, radial = Math.max(-1, Math.min(1, (d - def.orbit) / 45))
          dvx = (dx / d * radial - dy / d * turn) * speed * 0.7
          dvy = (dy / d * radial + dx / d * turn) * speed * 0.7
          if (this.cd[i] <= 0) this.attack(i, t, dx / d, dy / d)
        } else if (cargo >= 0 && t >= 0) { // carrying someone: no clawing, just get close and throw them at the next enemy
          if (d < THROW_R) {
            this.grab[i] = this.heldBy[cargo] = -1
            this.atkT[i] = 1
            this.toss(cargo, dx / d, dy / d, ty, d, 1)
          } else {
            dvx = (dx / d) * def.speed
            dvy = (dy / d) * def.speed
          }
        } else if (t >= 0 && d < reach && (def.kind !== 'beam' || this.beam[i])) {
          if (this.cd[i] <= 0 && this.spinT[i] <= 0) this.attack(i, t, dx / d, dy / d)
          if (this.beam[i]) { // butt to the enemy, drifting slowly away
            this.face[i] = dx > 0 ? -1 : 1
            dvx = (-dx / d) * def.speed * 0.25
            dvy = (-dy / d) * def.speed * 0.25
          }
        } else if (!this.hidden[i] || (t >= 0 && d < reach + AMBUSH)) { // hiders lie in wait
          const sp = speed * (this.ambush[i] ? 1.6 : 1) * (this.rush[i] ? 3.5 : 1)
          dvx = (dx / d) * sp
          dvy = (dy / d) * sp
        }
      }
      vx[i] += (dvx - vx[i]) * 0.13 // ease toward the wanted velocity; also bleeds off knockback
      vy[i] += (dvy - vy[i]) * 0.13
      this.phase[i] += Math.hypot(vx[i], vy[i]) * DT * 0.12
    }

    for (let i = 0; i < this.n; i++) if (alive[i]) { x[i] += vx[i] * DT; y[i] += vy[i] * DT }
    if ((this.tick & 3) === 0)
      for (let i = 0; i < this.n; i++) {
        const r = UNITS[type[i]].r, sp = Math.hypot(vx[i], vy[i])
        if (!alive[i] || sp < 25 || UNITS[type[i]].flies) continue
        const wet = this.inWater(x[i], y[i] + r * 0.5)
        if (!wet && ((this.tick & 7) || !this.inBush(x[i], y[i]))) continue // rustling is half as often as splashing
        const k = this.oHead
        this.oHead = (k + 1) % MAXO
        this.oK[k] = wet ? 0 : 1
        this.oX[k] = wet ? x[i] - (vx[i] / sp) * r : x[i]
        this.oY[k] = wet ? y[i] + r * 0.7 : y[i]
        this.oA[k] = Math.atan2(vy[i], vx[i]) + (wet ? 0 : Math.PI + Math.random() * 2 - 1) // leaves fly off behind
        this.oLife[k] = 1
      }
    this.clamp()

    // push overlapping units apart (grid is one move stale, close enough)
    for (let i = 0; i < this.n; i++) {
      if (!alive[i]) continue
      if (this.heldBy[i] >= 0 || this.leapT[i] > 0 || this.scrapT[i] > 0 || this.brawling(i)) continue
      const ri = UNITS[type[i]].r
      const gx = Math.min(cols - 1, (x[i] / CELL) | 0), gy = Math.min(rows - 1, (y[i] / CELL) | 0)
      const x1 = Math.min(cols - 1, gx + 1), y1 = Math.min(rows - 1, gy + 1)
      for (let yy = Math.max(0, gy - 1); yy <= y1; yy++)
        for (let xx = Math.max(0, gx - 1); xx <= x1; xx++) {
          const c = yy * cols + xx
          for (let q = cs[c]; q < cs[c + 1]; q++) {
            const j = items[q]
            if (j <= i || !alive[j] || this.heldBy[j] >= 0 || this.leapT[j] > 0 || this.scrapT[j] > 0 || this.brawling(j)) continue
            const min = ri + UNITS[type[j]].r
            let dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy
            if (d2 >= min * min) continue
            if (d2 < 1e-4) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = dx * dx + dy * dy + 1e-6 }
            const d = Math.sqrt(d2), push = ((min - d) * 0.5) / d
            x[i] -= dx * push; y[i] -= dy * push
            x[j] += dx * push; y[j] += dy * push
          }
        }
    }
    for (let i = 0; i < this.n; i++) { // whoever is in a jaw goes where the jaw goes
      const g = this.grab[i]
      if (alive[i] && g >= 0) { x[g] = x[i] + this.face[i] * UNITS[type[i]].r; y[g] = y[i] }
    }
    this.clamp()

    // staples
    for (let p = this.pn - 1; p >= 0; p--) {
      const nx = (this.pX[p] += this.pVx[p] * DT), ny = (this.pY[p] += this.pVy[p] * DT)
      let dead = (this.pLife[p] -= DT) <= 0 || nx < 0 || ny < 0 || nx >= this.w || ny >= this.h
      if (!dead) {
        const gx = (nx / CELL) | 0, gy = (ny / CELL) | 0
        const x1 = Math.min(cols - 1, gx + 1), y1 = Math.min(rows - 1, gy + 1)
        scan: for (let yy = Math.max(0, gy - 1); yy <= y1; yy++)
          for (let xx = Math.max(0, gx - 1); xx <= x1; xx++) {
            const c = yy * cols + xx
            for (let q = cs[c]; q < cs[c + 1]; q++) {
              const j = items[q]
              if (!alive[j] || type[j] === this.pType[p]) continue
              const dx = x[j] - nx, dy = y[j] - ny, r = UNITS[type[j]].r + 3
              if (dx * dx + dy * dy < r * r) {
                const src = UNITS[this.pType[p]]
                this.hit(j, src, (this.pVx[p] / 420) * src.knock, (this.pVy[p] / 420) * src.knock, -1)
                dead = true
                break scan
              }
            }
          }
      }
      if (dead) {
        const l = --this.pn
        this.pX[p] = this.pX[l]; this.pY[p] = this.pY[l]
        this.pVx[p] = this.pVx[l]; this.pVy[p] = this.pVy[l]
        this.pLife[p] = this.pLife[l]; this.pDmg[p] = this.pDmg[l]; this.pType[p] = this.pType[l]
      }
    }

    for (let f = this.fn - 1; f >= 0; f--) {
      this.fX[f] += this.fVx[f] * DT
      this.fY[f] += (this.fVy[f] += 70 * DT) * DT // sinks from the mouth to ground level
      if ((this.fLife[f] -= DT) <= 0) {
        const l = --this.fn
        this.fX[f] = this.fX[l]; this.fY[f] = this.fY[l]
        this.fVx[f] = this.fVx[l]; this.fVy[f] = this.fVy[l]; this.fLife[f] = this.fLife[l]
      }
    }

    for (let k = 0; k < MAXS; k++) if (this.sLife[k] > 0) this.sLife[k] -= DT * 0.2
    for (let k = 0; k < MAXR; k++) if (this.rLife[k] > 0) this.rLife[k] -= DT * 1.2
    for (let k = 0; k < MAXO; k++) if (this.oLife[k] > 0) this.oLife[k] -= DT * 0.8
    this.tick++
  }
}

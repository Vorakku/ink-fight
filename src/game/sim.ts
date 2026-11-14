import { UNITS, type UnitDef } from './units.ts'
import { Millipedes } from './millipedes.ts'
import { MantisDuels } from './mantises.ts'
import { Spiders } from './spiders.ts'

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
export const RED = 0, BLUE = 1, FFA = -1 // spawn() sides; free-for-all is stored as 2 + type, so every type is its own side
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
export const RAINBOW_CHARGE = 1.1, RAINBOW_BLAST = 0.4
export const COLONY_BUILD = 3
export const MAXC = MAX // independent body slots, so dead fighters can still be recycled
const ANT = UNITS.findIndex((u) => u.ant), ANTHILL = UNITS.findIndex((u) => u.colony)
export const SLAM_R = 48
const SCARE_T = 0.8 // seconds a scared fighter runs for
const LAWN_MAX = 12 // grass tufts one fighter can plant in a life
const BULLY_SIGHT = 16 // cells a bully scans for the toughest target
export const GRUDGE_MAX = 5 // hits a grudge keeps counting
const POP_R = 26, POP_MULT = 3 // an overfull mozzie's splash: radius, and damage as a multiple of its bite
const TOPPLE_T = 1.2 // seconds a toppled fighter spends on its back
const WIRED_T = 3.5 // seconds of caffeine before the crash
const SPREAD_MIN = 0.8, SPREAD_KEEP = 0.6 // wildfire: a burn must have this long left to spread, and passes on this share (about three hops)
const PANIC_T = 0.9 // seconds a fighter set alight by wildfire runs for
const PHONE_SPREAD = 0.8, PHONE_KEEP = 0.7, PHONE_IMMUNE = 1.5 // scrolling spreads while this much is left, passes on this share, then can't be caught again for this long
const LATCH_T = 2.5, NIBBLE = 30 // seconds a leg-hug lasts; ticks between nibbles
const SQUISH_THROW = 200 // a shove sprung back at least this hard throws the attacker
const SPOT_T = 1.4 // seconds a pose holds everyone's attention
export const TETHER_LEN = 70 // px of cheese before it pulls the victim back
const SNAP = 1.8, DRAIN = 3, DRAIN_EVERY = 30 // strand snaps past this many lengths; hp drained (and healed) every this many ticks
const ROLL_T = 1.4, ROLL_CD = 5 // seconds curled up rolling; seconds before it can again
export const MAXK = 48 // stink clouds alive at once
const STINK_T = 4, STINK_CD = 6, STINK_DPS = 4, STINK_PUSH = 20 // cloud lifetime, recharge, damage per second inside, shove out per tick
const BOSS_R = 90 // px a manager keeps an eye on its staff from
const BABY = -4, SUMMON = 300 // a summoned snake starts this many meals short; ticks between a king's summons
const CARRY_T = 3, THROW_R = 110, BOUNCE = 130 // a carrier gives up looking after this long; throws from this close; how far a collision sends both
const CHICKS = UNITS.map((u) => u.rebirth && { ...u, ...u.rebirth })

const f32 = (n: number) => new Float32Array(n)

// Units live in parallel typed arrays (no per-unit objects, no garbage). Each one is red, blue or
// free-for-all (every type its own side): friend or foe compares `team`, never `type`. A dead slot is
// reused by the next spawn.
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
  private airBy = new Uint8Array(MAX) // side that threw it (its own side is spared at the landing)
  rush = new Uint8Array(MAX) // mid-charge: sprinting at a far-off target, and the next poke launches it
  beam = new Uint8Array(MAX) // pegasus: 0 ready, 1 charging, 2 blasting
  beamT = f32(MAX)
  beamX = f32(MAX) // locked firing direction; recoil follows the same straight line
  beamY = f32(MAX)
  dizzyT = f32(MAX) // seconds of seeing stars after landing
  grow = f32(MAX) // a per-fighter count: snake meals (negative for a summoned little one), mozzie sips, toast grudge hits
  shockT = f32(MAX) // stunned, showing cartoon bones
  fearT = f32(MAX) // ninja's tactical reassessment of the vibes
  dashT = f32(MAX)
  leapT = f32(MAX)
  spinT = f32(MAX)
  pulseT = f32(MAX) // a pose or a rump-first landing's fading ring
  scrapT = f32(MAX) // cat's opening dust-cloud brawl
  scrapBy = new Int32Array(MAX).fill(-1) // victim: which cat is currently in the cloud with it
  opened = new Uint8Array(MAX) // cat only gets one opening leap per life
  private walked = f32(MAX) // lawn: px walked since the last tuft
  private planted = new Uint8Array(MAX) // lawn: tufts planted this life
  downT = f32(MAX) // toppled: seconds left on its back
  blindT = f32(MAX) // spat on: seconds left stumbling about with nobody to aim at
  moodT = f32(MAX) // crash: seconds left wired (> 0) or asleep (< 0)
  hot = new Uint8Array(MAX) // its burn came from a wildfire and spreads to whoever it bumps into
  phoneT = f32(MAX) // > 0 scrolling its phone, < 0 just put it down and can't be distracted again yet
  latchT = f32(MAX) // seconds left hugging focus[i]'s leg
  spotT = f32(MAX) // seconds left staring at whoever struck a pose (spotBy)
  private spotBy = new Int32Array(MAX).fill(-1)
  private spotGen = new Uint32Array(MAX)
  away = new Uint8Array(MAX) // fetch: 0 in hand, 1 in the air, 2 lying on the floor at (itemX, itemY)
  itemX = f32(MAX)
  itemY = f32(MAX)
  layers = new Uint8Array(MAX) // stack: pancakes still on
  tetherT = f32(MAX) // seconds left on a cheese strand to focus[i]
  rollT = f32(MAX) // seconds left curled up and rolling
  bossTick = new Int32Array(MAX).fill(-9) // tick a manager last hurried this one along
  abilityCd = f32(MAX)
  generation = new Uint32Array(MAX) // a recycled slot is a new fighter
  focus = new Int32Array(MAX).fill(-1) // target locked when a dash/leap starts, who a grudge is against, whose leg is hugged, or who is on the cheese strand
  focusGen = new Uint32Array(MAX)
  private died = false // the last damage() was a real kill
  private ringAt = new Int32Array(MAX) // tick when it may next leave a healing ring (phoenix) or summon (king snake)
  type = new Uint8Array(MAX)
  team = new Uint8Array(MAX) // RED, BLUE, or 2 + type for free-for-all
  alive = new Uint8Array(MAX)
  face = new Int8Array(MAX)
  target = new Int32Array(MAX)
  counts = new Int32Array(NT)
  teamCounts = new Int32Array(NT + 2) // live fighters per side
  buildFor = new Int32Array(MAX).fill(-1) // ant: the unfinished anthill it is helping
  colonyT = f32(MAX) // seconds dug; COLONY_BUILD means finished
  colonyWorkers = new Int32Array(MAX) // available workers currently at the site
  nextColony = new Float32Array(NT + 2).fill(10) // living ants required for each side's next build
  private colonySite = new Int32Array(NT + 2).fill(-1)
  private antCount = new Int32Array(NT + 2)
  private antReady = new Int32Array(NT + 2)
  private antSeed = new Int32Array(NT + 2)
  inside = new Int32Array(MAX).fill(-1) // ant: anthill it entered; still alive and counted
  entryT = f32(MAX) // 0 -> 1 shrinking through the doorway
  haulFor = new Int32Array(MAX).fill(-1) // ant: body it is helping carry
  haulSlot = new Uint8Array(MAX) // its grip around the body

  cn = 0
  cAlive = new Uint8Array(MAXC)
  cX = f32(MAXC)
  cY = f32(MAXC)
  cPx = f32(MAXC)
  cPy = f32(MAXC)
  cType = new Uint8Array(MAXC)
  cTeam = new Uint8Array(MAXC)
  cFace = new Int8Array(MAXC)
  cSize = f32(MAXC)
  cStage = new Uint8Array(MAXC)
  cLook = new Uint8Array(MAXC)
  cNeed = new Uint8Array(MAXC)
  cEnter = f32(MAXC) // 0 on the ground, 0 -> 1 disappearing into the hill
  cHome = new Int32Array(MAXC).fill(-1)
  cSpider = new Int32Array(MAXC).fill(-1) // a spider's exclusive body claim; cHome remains the ants' destination
  cGeneration = new Uint32Array(MAXC)
  private cHomeGen = new Uint32Array(MAXC)
  private cCrew = new Uint8Array(MAXC)
  private cReady = new Uint8Array(MAXC)
  private cSeats = new Uint8Array(MAXC)
  private haulHead = new Int32Array(NT + 2)
  private haulNext = new Int32Array(MAX)
  private haulFree = new Int32Array(NT + 2)
  private haulHomes = new Int32Array(MAX)
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
  pTeam = new Uint8Array(MAXP) // side that fired it
  private pFrom = new Int32Array(MAXP) // slot that fired it
  private pGen = new Uint32Array(MAXP) // that slot's generation when it fired

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
  waterVer = 0 // bumped only when water changes; water.ts rebuilds its cache from this
  bmask = new Uint8Array(1) // per cell: bit 0 bush, bit 1 water (the renderer draws the water from this)
  bcols = 1

  // foam left behind by anyone moving through water, or leaves kicked up in a bush (visual only), a ring buffer
  oK = new Uint8Array(MAXO) // 0 foam, 1 leaf
  oX = f32(MAXO)
  oY = f32(MAXO)
  oA = f32(MAXO) // heading
  oLife = f32(MAXO)
  private oHead = 0

  // stink clouds, a ring buffer
  kX = f32(MAXK)
  kY = f32(MAXK)
  kLife = f32(MAXK) // 1 -> 0 over STINK_T seconds
  kType = new Uint8Array(MAXK) // who sprayed it (sets the cloud's size)
  kTeam = new Uint8Array(MAXK) // side that sprayed it (its own side doesn't mind)
  private kHead = 0

  // ink splats, a ring buffer
  sX = f32(MAXS)
  sY = f32(MAXS)
  sLife = f32(MAXS)
  sSize = f32(MAXS)
  sRot = f32(MAXS)
  sType = new Uint8Array(MAXS)
  private sHead = 0

  private cx = f32(NT + 2) // per side: where its crowd is
  private cy = f32(NT + 2)
  millipedes = new Millipedes(this)
  mantises = new MantisDuels(this)
  spiders = new Spiders(this)

  // while the sim isn't stepping (setup, pause): spawn and hit pops still ease back, so nobody sits oversized
  settle() {
    for (let i = 0; i < this.n; i++) if (this.alive[i]) this.hitT[i] = Math.max(0, this.hitT[i] - DT * 6)
  }

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
    this.waterVer++
    this.mantises.resize()
    this.clamp()
    for (let k = 0; k < this.cn; k++) if (this.cAlive[k]) {
      this.cX[k] = this.cPx[k] = Math.max(0, Math.min(this.w, this.cX[k]))
      this.cY[k] = this.cPy[k] = Math.max(0, Math.min(this.h, this.cY[k]))
    }
    this.dirty = true
  }

  clear() {
    this.alive.fill(0)
    this.counts.fill(0)
    this.teamCounts.fill(0)
    this.buildFor.fill(-1)
    this.colonyT.fill(0)
    this.colonyWorkers.fill(0)
    this.colonySite.fill(-1)
    this.nextColony.fill(10)
    this.inside.fill(-1)
    this.entryT.fill(0)
    this.haulFor.fill(-1)
    this.cAlive.fill(0)
    this.cSpider.fill(-1)
    this.millipedes.reset()
    this.mantises.reset()
    this.spiders.reset()
    this.cn = 0
    this.sLife.fill(0)
    this.rLife.fill(0)
    this.kLife.fill(0)
    this.oLife.fill(0)
    this.n = this.freeN = this.pn = this.fn = this.bn = 0
    this.bmask.fill(0)
    this.terrainVer++
    this.waterVer++
    this.dirty = true
  }

  spawn(t: number, x: number, y: number, team = FFA) {
    if (!this.freeN && this.n >= MAX) return -1
    const def = UNITS[t]
    const rx = Math.min(def.r, this.w * 0.5), ry = Math.min(def.r, this.h * 0.5)
    x = Math.min(this.w - rx, Math.max(rx, x))
    y = Math.min(this.h - ry, Math.max(ry, y))
    if (def.waterbound && !this.inWater(x, y)) {
      this.addTerrain(x, y, 1) // a misplaced fish gets a tiny home, not a dry-land death sentence
      if (!this.inWater(x, y)) return -1
    }
    const i = this.freeN ? this.free[--this.freeN] : this.n < MAX ? this.n++ : -1
    if (i < 0) return -1
    this.x[i] = this.px[i] = x
    this.y[i] = this.py[i] = y
    this.vx[i] = this.vy[i] = this.atkT[i] = this.burnT[i] = this.slowT[i] = this.lureT[i] = this.song[i] = 0
    this.hp[i] = def.hp
    this.cd[i] = Math.random() * def.cd
    this.hitT[i] = 1
    this.phase[i] = Math.random() * 6
    this.type[i] = t
    this.team[i] = team < 0 ? 2 + t : team
    this.face[i] = x < this.w / 2 ? 1 : -1
    this.target[i] = -1
    this.stage[i] = this.ringAt[i] = this.airT[i] = this.dizzyT[i] = 0
    this.grab[i] = this.heldBy[i] = -1
    this.rush[i] = this.beam[i] = this.grow[i] = 0
    this.beamT[i] = this.beamX[i] = this.beamY[i] = 0
    this.shockT[i] = this.fearT[i] = this.dashT[i] = this.leapT[i] = this.spinT[i] = this.pulseT[i] = this.scrapT[i] = this.abilityCd[i] = this.opened[i] = 0
    this.scrapBy[i] = this.focus[i] = this.spotBy[i] = -1
    this.focusGen[i] = this.walked[i] = this.planted[i] = this.downT[i] = this.blindT[i] = 0
    this.hot[i] = this.phoneT[i] = this.latchT[i] = this.spotT[i] = 0
    this.away[i] = this.tetherT[i] = this.rollT[i] = 0
    this.layers[i] = def.stack?.length ?? 0
    this.bossTick[i] = -9
    this.buildFor[i] = -1
    this.colonyT[i] = this.colonyWorkers[i] = 0
    this.inside[i] = this.haulFor[i] = -1
    this.entryT[i] = this.haulSlot[i] = 0
    this.moodT[i] = def.crash ? WIRED_T * (0.5 + Math.random() * 0.5) : 0 // staggered, so a crowd doesn't crash in step
    this.generation[i]++
    this.hidden[i] = this.ambush[i] = def.hides && this.inBush(this.x[i], this.y[i]) ? 1 : 0
    this.alive[i] = 1
    this.counts[t]++
    this.teamCounts[this.team[i]]++
    this.millipedes.onSpawn(i)
    this.mantises.onSpawn(i)
    this.spiders.onSpawn(i)
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
    if (kind === 1) this.waterVer++
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

  inSyrup(x: number, y: number) {
    return (this.mask(x, y) & 4) === 4
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
    for (let i = 0; i < this.n; i++) if (alive[i] && this.inside[i] < 0) cs[this.cell(i) + 1]++
    for (let c = 1; c < cs.length; c++) cs[c] += cs[c - 1]
    cur.set(cs)
    for (let i = 0; i < this.n; i++) if (alive[i] && this.inside[i] < 0) this.items[cur[this.cell(i)]++] = i
    this.itemN = cs[cs.length - 1]
    this.dirty = false
  }

  private clamp() {
    for (let i = 0; i < this.n; i++) {
      const r = UNITS[this.type[i]].r
      const rx = Math.min(r, this.w * 0.5), ry = Math.min(r, this.h * 0.5)
      this.x[i] = Math.min(this.w - rx, Math.max(rx, this.x[i]))
      this.y[i] = Math.min(this.h - ry, Math.max(ry, this.y[i]))
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

  effectiveRadius(i: number) {
    const def = this.def(i)
    return def.r * (def.size ?? 1) * (def.eats ? Math.max(0.4, 1 + Math.min(this.grow[i], KING + 3) * 0.1) : def.swell ? 1 + this.grow[i] * 0.12 : 1)
  }

  canAct(i: number) {
    return i >= 0 && !!this.alive[i] && this.stage[i] !== 1 && this.heldBy[i] < 0 && this.inside[i] < 0
      && this.airT[i] <= 0 && this.shockT[i] <= 0 && this.downT[i] <= 0 && this.phoneT[i] <= 0
      && this.lureT[i] <= 0 && this.blindT[i] <= 0 && this.fearT[i] <= 0 && this.spotT[i] <= 0 && !this.brawling(i)
  }

  merge(members: number[], type: number) {
    if (members.length !== 4 || new Set(members).size !== 4 || UNITS[type]?.bug !== 'car') return -1
    const side = this.team[members[0]]
    if (members.some((i) => !this.canAct(i) || this.team[i] !== side || UNITS[this.type[i]].bug !== 'millipede')) return -1
    members = [...members] // lifecycle callbacks may clear the assembly's original member list
    let x = 0, y = 0, hp = 0, hot = 0
    const timers = [this.cd, this.burnT, this.slowT, this.shockT, this.dizzyT, this.fearT, this.blindT, this.lureT, this.phoneT, this.spiders.webT]
    const keep = timers.map((values) => Math.max(...members.map((i) => values[i])))
    for (const i of members) { x += this.x[i]; y += this.y[i]; hp += this.hp[i]; hot |= this.hot[i] }
    for (const i of members) {
      this.millipedes.onRemove(i)
      this.mantises.onRemove(i)
      this.spiders.onRemove(i)
      this.stopMoves(i)
      this.alive[i] = 0
      this.counts[this.type[i]]--
      this.teamCounts[side]--
      this.free[this.freeN++] = i
    }
    const car = this.spawn(type, x / 4, y / 4, side)
    this.hp[car] = hp
    this.hot[car] = hot
    for (let k = 0; k < timers.length; k++) timers[k][car] = keep[k]
    return car
  }

  private kill(i: number) {
    this.mantises.onRemove(i)
    this.millipedes.onRemove(i)
    this.spiders.onRemove(i)
    this.stopMoves(i)
    if (UNITS[this.type[i]].colony) this.releaseColony(i, true)
    if (UNITS[this.type[i]].rebirth && !this.stage[i]) { // first death: curl up in an egg instead
      this.stage[i] = 1
      this.stageT[i] = EGG_T
      this.hp[i] = this.hitT[i] = 1
      this.vx[i] = this.vy[i] = this.burnT[i] = this.slowT[i] = this.atkT[i] = this.airT[i] = 0
      this.splat(this.x[i], this.y[i], this.type[i], 1.2)
      return
    }
    this.leaveBody(i)
    this.inside[i] = -1
    this.alive[i] = 0
    this.died = true
    this.free[this.freeN++] = i
    this.counts[this.type[i]]--
    this.teamCounts[this.team[i]]--
    this.splat(this.x[i], this.y[i], this.type[i], 0.8 + Math.random() * 0.5)
    const hatch = UNITS[this.type[i]].hatch // reuses the slot that just died
    if (hatch) this.spawn(UNITS.findIndex((u) => u.key === hatch), this.x[i], this.y[i], this.side(i))
  }

  damage(j: number, dmg: number, kx: number, ky: number, by = -1) {
    if (!this.alive[j] || this.stage[j] === 1 || this.inside[j] >= 0) return // eggs and ants underground are out of reach
    if (by >= 0) this.mantises.onHit(j, by)
    if (UNITS[this.type[j]].building) kx = ky = 0 // anthills are rooted, not portable fighters
    this.hp[j] -= dmg
    this.hitT[j] = 1
    this.vx[j] += kx
    this.vy[j] += ky
    const topple = UNITS[this.type[j]].topple
    if (topple && kx * kx + ky * ky >= topple * topple) this.downT[j] = TOPPLE_T
    if (this.hp[j] <= 0) this.kill(j)
  }

  // a landed attack: damage plus whatever extras the attacker carries.
  // from: who is touching it (thorns, eating). by: who gets the blame, also at range (grudges)
  hit(j: number, def: UnitDef, kx: number, ky: number, from: number, mult = 1, by = from) {
    if (!this.alive[j] || this.stage[j] === 1 || this.inside[j] >= 0) return
    if (by >= 0 && !this.mantises.canTarget(by, j)) return
    this.mantises.onHit(j, by)
    const victim = UNITS[this.type[j]], thorns = victim.thorns
    if (def.burn) {
      this.burnT[j] = def.burn
      this.hot[j] = def.wildfire && !this.fireproof(j) ? 1 : 0 // a plain burn on top puts the wildfire out
      if (this.hot[j] && !victim.building) this.fearT[j] = Math.max(this.fearT[j], PANIC_T)
    }
    if (!victim.building) {
      if (def.distract && this.canScroll(j)) this.phoneT[j] = def.distract
      if (def.slow) this.slowT[j] = def.slow
      if (def.shock) this.shockT[j] = def.shock
      if (def.scare && from >= 0 && Math.random() < def.scare) { // runs from whoever pecked it
        this.fearT[j] = Math.max(this.fearT[j], SCARE_T)
        this.target[j] = from
      }
      if (def.blind) this.blindT[j] = def.blind
    }
    if (victim.grudge && by >= 0) { // the first to hurt it becomes the grudge; every hit from them after that stokes it
      if (!this.focusAlive(j)) { this.lockOn(j, by); this.grow[j] = 1 }
      else if (this.focus[j] === by) this.grow[j] = Math.min(GRUDGE_MAX, this.grow[j] + 1)
    }
    if (victim.squish) { // flattens instead of flying, then springs the shove back at whoever is touching it
      const k = Math.hypot(kx, ky)
      if (from >= 0 && this.alive[from] && k > 0) {
        this.damage(from, 0, -kx * victim.squish, -ky * victim.squish, j)
        if (k * victim.squish >= SQUISH_THROW) this.toss(from, -kx / k, -ky / k, this.team[j], 120)
        this.atkT[j] = 1
      }
      kx = ky = 0
    }
    this.died = false
    this.damage(j, def.dmg * mult, kx, ky, by)
    if (this.died && by >= 0 && UNITS[this.type[by]].promote) this.grow[by]++ // a kill on the record
    if (this.died && def.eats && from >= 0) { // down in one gulp: bigger, and back to full health
      this.grow[from]++
      this.hp[from] = this.maxHp(from)
      this.hitT[from] = 1
    }
    if (thorns && from >= 0) this.damage(from, thorns, 0, 0, j)
  }

  private maxHp(i: number) {
    const def = this.def(i)
    return def.eats ? Math.max(def.hp * 0.4, def.hp + this.grow[i] * def.eats) : def.hp
  }

  lockOn(i: number, t: number) {
    this.focus[i] = t
    this.focusGen[i] = this.generation[t]
  }

  // the side its offspring and summons join: red or blue, or free-for-all (which then follows their own type)
  private side(i: number) {
    return this.team[i] < 2 ? this.team[i] : FFA
  }

  focusAlive(i: number) {
    const t = this.focus[i]
    return t >= 0 && !!this.alive[t] && this.generation[t] === this.focusGen[i] && this.team[t] !== this.team[i] && this.stage[t] !== 1 && this.heldBy[t] < 0 && this.inside[t] < 0
  }

  brawling(i: number) {
    const cat = this.scrapBy[i]
    return cat >= 0 && !!this.alive[cat] && this.scrapT[cat] > 0 && this.focus[cat] === i && this.focusGen[cat] === this.generation[i]
  }

  // cancel anything mid-move, including a rainbow wind-up or blast
  stopMoves(i: number) {
    this.millipedes.interrupt(i)
    this.mantises.interrupt(i)
    this.spiders.interrupt(i)
    this.endScrap(i)
    this.leapT[i] = this.dashT[i] = this.spinT[i] = this.latchT[i] = this.rollT[i] = 0
    this.beam[i] = this.beamT[i] = 0
    this.buildFor[i] = -1
    this.haulFor[i] = -1
  }

  private endScrap(i: number) {
    const t = this.focus[i]
    if (t >= 0 && this.scrapBy[t] === i) this.scrapBy[t] = -1
    this.scrapT[i] = 0
  }

  // Spins, fit checks and capybara landings use the same small enemy-only circle.
  sweep(i: number, R: number, mult = 1) {
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
          if (!alive[j] || this.team[j] === this.team[i] || this.heldBy[j] >= 0 || this.airT[j] > 0) continue
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
          if (!this.alive[j] || this.team[j] === this.team[i] || this.hidden[j] || this.heldBy[j] >= 0 || this.stage[j] === 1) continue
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

  findTarget(i: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const gx = Math.min(cols - 1, (x[i] / CELL) | 0), gy = Math.min(this.rows - 1, (y[i] / CELL) | 0)
    const def = this.def(i), bully = def.bully
    // shortcut: a bully scans 33x33 cells every 12 ticks, cap or cache it if a big crowd of them stutters
    const sight = bully ? BULLY_SIGHT : Math.max(SIGHT, Math.ceil((def.range + def.r + 24) / CELL))
    const x1 = Math.min(cols - 1, gx + sight), y1 = Math.min(this.rows - 1, gy + sight)
    let best = -1, bd = Infinity, bh = 0 // bh: the toughest max hp seen so far (bullies only)
    for (let yy = Math.max(0, gy - sight); yy <= y1; yy++)
      for (let xx = Math.max(0, gx - sight); xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || this.team[j] === this.team[i] || j === this.grab[i] || this.heldBy[j] >= 0 || this.stage[j] === 1 || this.inside[j] >= 0 || !this.mantises.canTarget(i, j)) continue
          const dx = x[j] - x[i], dy = y[j] - y[i], d = dx * dx + dy * dy
          if (this.hidden[j] && d > REVEAL * REVEAL) continue
          const tough = bully ? UNITS[type[j]].hp : 0 // everyone else just takes the nearest
          if (tough > bh || (tough === bh && d < bd)) { bh = tough; bd = d; best = j }
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
          if (!alive[j] || this.team[j] === this.team[i]) continue
          const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1
          if (d < R + UNITS[type[j]].r) this.hit(j, def, (dx / d) * def.knock, (dy / d) * def.knock, -1, mult, i)
        }
      }
    for (let k = 0; k < (def.brine ?? 0); k++) { // the first puddle lands dead centre, the rest around it
      const a = k * 2.1 + Math.random(), d = k ? Math.random() * R * 0.35 : 0
      this.addTerrain(Math.min(this.w - 1, Math.max(1, x[i] + Math.cos(a) * d)), Math.min(this.h - 1, Math.max(1, y[i] + Math.sin(a) * d)), 1)
    }
    this.kill(i)
    this.splat(x[i], y[i], ty, 2.6)
  }

  // fire cone in front of the dragon: burns every enemy inside it
  private breathe(i: number, nx: number, ny: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const def = UNITS[type[i]], R = def.range + def.r
    const x0 = Math.max(0, ((x[i] - R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + R) / CELL) | 0)
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || this.team[j] === this.team[i]) continue
          const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1
          if (d < R + UNITS[type[j]].r && (dx * nx + dy * ny) / d > 0.55) {
            if (def.heal && this.tick >= this.ringAt[i]) this.ring(i, x[j], y[j])
            this.hit(j, def, nx * def.knock, ny * def.knock, -1, 1, i)
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

  // ring of fire where the breath landed: heals the breather and its own side
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
          if (j === i || !alive[j] || this.team[j] !== this.team[i]) continue
          const dx = x[j] - rx, dy = y[j] - ry
          if (dx * dx + dy * dy < RING_R * RING_R) this.hp[j] = Math.min(this.def(j).hp, this.hp[j] + heal)
        }
      }
  }

  // the siren's set list: a ballad that reels enemies in, then death metal for whoever came close.
  // Metal breaks the spell, so the fans in the pit fight back until the ballad starts again.
  private sing(i: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const def = UNITS[type[i]], metal = this.song[i] > 0, R = metal ? MOSH_R : def.range
    const x0 = Math.max(0, ((x[i] - R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + R) / CELL) | 0)
    let fan = false
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || this.team[j] === this.team[i] || this.hidden[j] || this.inside[j] >= 0) continue // leaves and an anthill make fine earplugs
          const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1, rj = UNITS[type[j]].r
          if (d >= R + rj) continue
          if (metal) this.hit(j, def, (dx / d) * def.knock, (dy / d) * def.knock, -1, 1, i)
          else if (!UNITS[type[j]].building) {
            this.mantises.onHit(j, i)
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
    this.toss(g, Math.cos(a) * this.face[i], Math.sin(a), this.team[i])
  }

  // send a fighter through the air along (nx, ny); `by` is the side that did it
  toss(g: number, nx: number, ny: number, by: number, dist = FLING_D, bounce = 0) {
    if (!this.alive[g] || this.stage[g] === 1 || this.heldBy[g] >= 0 || this.inside[g] >= 0) return // eggs stay put; jaws and anthills don't let go
    if (UNITS[this.type[g]].building) return
    if (UNITS[this.type[g]].squish) { this.hitT[g] = 1; return } // flattens on the spot instead of flying
    this.stopMoves(g)
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
          if (k === j || !alive[k] || this.team[k] === by) continue
          const dx = x[k] - x[j], dy = y[k] - y[j], d = Math.hypot(dx, dy) || 1
          if (d >= LAND_R + UNITS[type[k]].r) continue
          this.mantises.onHit(k, -1)
          this.damage(k, LAND_DMG * 0.5, (dx / d) * 150, (dy / d) * 150)
          if (bounce) { this.toss(k, dx / d, dy / d, by, BOUNCE); ox = dx / d; oy = dy / d }
        }
      }
    this.vx[j] = this.vy[j] = 0
    this.dizzyT[j] = 1.5
    this.slowT[j] = Math.max(this.slowT[j], 1.5) // staggers about for a bit
    this.mantises.onHit(j, -1)
    this.damage(j, LAND_DMG, 0, 0)
    if (ox || oy) this.toss(j, -ox, -oy, by, BOUNCE) // and it bounces off the other way
  }

  attack(i: number, t: number, nx: number, ny: number) {
    const def = this.def(i)
    const rush = this.rush[i], mult = (this.ambush[i] ? 2 : 1) * (rush ? 2 : 1) * (def.grudge ? 1 + def.grudge * this.grow[i] : 1)
    this.ambush[i] = this.rush[i] = 0
    this.cd[i] = def.cd * (0.85 + Math.random() * 0.3) * (def.crash && this.moodT[i] > 0 ? 0.5 : 1) // wired: twice the pokes
    if (def.kind === 'sing') return this.sing(i)
    if (def.kind === 'beam') {
      this.lockOn(i, t)
      this.beam[i] = 1
      this.beamT[i] = RAINBOW_CHARGE
      this.face[i] = nx >= 0 ? -1 : 1
      return
    }
    if (def.kind !== 'fire') this.atkT[i] = 1
    if (def.spin) {
      this.spinT[i] = SPIN_T
      return this.sweep(i, def.spin, mult)
    }
    if (def.pulse) {
      this.pulseT[i] = 0.5
      if (def.spotlight) this.dazzle(i, def.spotlight)
      return this.sweep(i, def.pulse, mult)
    }
    if (def.kind === 'boom') this.explode(i, mult)
    else if (def.kind === 'fire') this.breathe(i, nx, ny)
    else if (def.kind === 'melee') {
      this.hit(t, def, nx * def.knock, ny * def.knock, i, mult)
      if (rush) this.toss(t, nx, ny, this.team[i]) // the charge ends in one enormous poke; the pokes after it are ordinary
      if (def.launch && this.alive[t] && this.airT[t] <= 0 && UNITS[this.type[t]].r <= def.r * 1.5) this.toss(t, nx, ny, this.team[i], def.launch, 1) // too big to throw: it just gets the shove
      if (def.lifesteal) this.hp[i] = Math.min(def.hp, this.hp[i] + def.dmg * def.lifesteal)
      if (def.swell && this.alive[i] && ++this.grow[i] >= def.swell) return this.pop(i)
      if (def.latch && !UNITS[this.type[t]].building && this.latchT[i] <= 0 && this.alive[i] && this.alive[t] && this.stage[t] !== 1 && this.heldBy[t] < 0 && this.airT[t] <= 0 && Math.random() < def.latch) {
        this.lockOn(i, t) // grabs a leg
        this.latchT[i] = LATCH_T
      }
      if (def.tether && !UNITS[this.type[t]].building && this.alive[i] && this.alive[t] && this.stage[t] !== 1 && this.heldBy[t] < 0 && this.airT[t] <= 0) { // ties them up in cheese
        this.lockOn(i, t)
        this.tetherT[i] = def.tether
      }
      if (def.grab && !UNITS[this.type[t]].building && this.alive[t] && this.stage[t] !== 1 && this.heldBy[t] < 0 && this.airT[t] <= 0 && UNITS[this.type[t]].r < def.r && Math.random() < def.grab) {
        this.grab[i] = t // only someone smaller fits in the mouth
        this.heldBy[t] = i
        this.grabT[i] = def.carry ? CARRY_T : GRAB_T
      }
    } else {
      if (def.fetch) { // only the one sandal: no throw until it's back in hand
        if (this.away[i] || this.pn >= MAXP) return
        this.away[i] = 1
      }
      const count = def.burst ?? 1, angle = Math.atan2(ny, nx)
      for (let k = 0; k < count; k++) this.shoot(i, angle + (k - (count - 1) * 0.5) * 0.15)
    }
  }

  // one projectile from i along `angle`, with its def's damage and range
  private shoot(i: number, angle: number) {
    if (this.pn >= MAXP) return
    const def = this.def(i), p = this.pn++, speed = 420, nx = Math.cos(angle), ny = Math.sin(angle)
    this.pX[p] = this.x[i] + nx * def.r
    this.pY[p] = this.y[i] + ny * def.r
    this.pVx[p] = nx * speed
    this.pVy[p] = ny * speed
    this.pLife[p] = ((def.range + def.r + 30) * 1.25) / speed
    this.pDmg[p] = def.dmg
    this.pType[p] = this.type[i]
    this.pTeam[p] = this.team[i]
    this.pFrom[p] = i
    this.pGen[p] = this.generation[i]
  }

  // fighters that set fires don't catch them
  private fireproof(j: number) {
    const def = this.def(j)
    return !!def.burn || def.kind === 'fire'
  }

  // can be handed a phone: not already scrolling, not just done, and not a fighter that lives on its phone anyway
  private canScroll(j: number) {
    return this.phoneT[j] === 0 && !this.def(j).distract && !this.def(j).building
  }

  // two fighters bumped into each other this tick: fire and phones are catching
  private touch(i: number, j: number) {
    if (this.stage[i] === 1 || this.stage[j] === 1) return
    for (let k = 0; k < 2; k++) {
      const a = k ? j : i, b = k ? i : j // a passes it on to b
      if (this.hot[a] && this.burnT[a] > SPREAD_MIN && this.burnT[b] <= 0 && !this.fireproof(b)) {
        this.mantises.onHit(b, a)
        this.burnT[b] = this.burnT[a] * SPREAD_KEEP // each hop burns shorter, so it dies out instead of taking the page
        this.hot[b] = 1
        this.fearT[b] = Math.max(this.fearT[b], PANIC_T)
      }
      if (this.phoneT[a] > PHONE_SPREAD && this.canScroll(b)) {
        this.mantises.onHit(b, a)
        this.phoneT[b] = this.phoneT[a] * PHONE_KEEP
      }
    }
  }

  // a pose: every enemy within R drops what it's doing and comes to look
  private dazzle(i: number, R: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this
    const x0 = Math.max(0, ((x[i] - R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + R) / CELL) | 0)
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (!alive[j] || this.team[j] === this.team[i] || this.stage[j] === 1 || UNITS[type[j]].building || this.inside[j] >= 0) continue
          const dx = x[j] - x[i], dy = y[j] - y[i]
          if (dx * dx + dy * dy >= (R + UNITS[type[j]].r) ** 2) continue
          this.mantises.onHit(j, i)
          this.spotT[j] = SPOT_T
          this.spotBy[j] = i
          this.spotGen[j] = this.generation[i]
        }
      }
  }

  // who is on the other end of i's cheese strand, or -1
  tethered(i: number) {
    return this.tetherT[i] > 0 && this.focusAlive(i) ? this.focus[i] : -1
  }

  // stink clouds: an enemy inside is slowed, hurt and shoved back out. True if that finished it off.
  // shortcut: every fighter checks every live cloud (up to MAXK), stamp clouds into a coarse mask if crowds of skunks stutter
  private stinky(i: number) {
    for (let k = 0; k < MAXK; k++) {
      if (this.kLife[k] <= 0 || this.kTeam[k] === this.team[i]) continue
      const dx = this.x[i] - this.kX[k], dy = this.y[i] - this.kY[k], d = Math.hypot(dx, dy) || 1
      if (d >= UNITS[this.kType[k]].stink!) continue
      this.mantises.onHit(i, -1)
      this.slowT[i] = Math.max(this.slowT[i], 0.3)
      if (!UNITS[this.type[i]].building) {
        this.vx[i] += dx / d * STINK_PUSH // steering eases back at 0.13 a tick, so this settles near 150 px/s outward
        this.vy[i] += dy / d * STINK_PUSH
      }
      if ((this.hp[i] -= STINK_DPS * DT) <= 0) { this.kill(i); return true }
    }
    return false
  }

  // a manager hurries its own side within BOSS_R along (one extra tick of cooldown each, however many managers
  // are watching) and returns the nearest of them, or -1 if there's nobody left to manage
  private staff(i: number) {
    const { x, y, type, alive, items, cellStart: cs, cols } = this, promote = this.def(i).promote!
    const x0 = Math.max(0, ((x[i] - BOSS_R) / CELL) | 0), x1 = Math.min(cols - 1, ((x[i] + BOSS_R) / CELL) | 0)
    const y0 = Math.max(0, ((y[i] - BOSS_R) / CELL) | 0), y1 = Math.min(this.rows - 1, ((y[i] + BOSS_R) / CELL) | 0)
    let best = -1, bd = BOSS_R * BOSS_R
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const c = yy * cols + xx
        for (let q = cs[c]; q < cs[c + 1]; q++) {
          const j = items[q]
          if (j === i || !alive[j] || this.team[j] !== this.team[i] || this.grow[j] >= promote) continue
          const d = (x[j] - x[i]) ** 2 + (y[j] - y[i]) ** 2
          if (d >= BOSS_R * BOSS_R) continue
          if (this.bossTick[j] !== this.tick) { this.cd[j] -= DT; this.bossTick[j] = this.tick }
          if (d < bd) { bd = d; best = j }
        }
      }
    return best
  }

  // who fired projectile p, or -1 if that fighter is gone (or its slot now belongs to someone else)
  owner(p: number) {
    const o = this.pFrom[p]
    return this.alive[o] && this.generation[o] === this.pGen[p] && this.type[o] === this.pType[p] ? o : -1
  }

  // one sip too many: a small splash on everyone around it, and that's the end of the mozzie
  private blastRainbow(i: number, t: number) {
    const def = this.def(i), size = def.size ?? 1
    const bx = this.x[i] - this.face[i] * 15 * size, by = this.y[i] - 15
    const dx = this.x[t] - bx, dy = this.y[t] - 15 - by, d = Math.hypot(dx, dy) || 1
    const nx = this.beamX[i] = dx / d, ny = this.beamY[i] = dy / d
    this.beam[i] = 2
    this.beamT[i] = RAINBOW_BLAST
    this.cd[i] = def.cd
    this.atkT[i] = 1
    this.vx[i] -= nx * 600
    this.vy[i] -= ny * 600
    // One hit along the straight stripe; the afterglow cannot track or keep damaging a victim.
    for (let q = 0; q < this.itemN; q++) {
      const j = this.items[q]
      if (!this.alive[j] || this.team[j] === this.team[i] || this.heldBy[j] >= 0 || this.stage[j] === 1) continue
      const rx = this.x[j] - bx, ry = this.y[j] - 15 - by, along = rx * nx + ry * ny
      if (along >= 0 && along <= def.range && Math.abs(rx * ny - ry * nx) < UNITS[this.type[j]].r + 5)
        this.hit(j, def, nx * def.knock, ny * def.knock, -1, 1, i)
    }
  }

  private pop(i: number) {
    this.sweep(i, POP_R, POP_MULT)
    if (!this.alive[i]) return // thorns in the splash got there first; killing it again would free its slot twice
    this.splat(this.x[i], this.y[i], this.type[i], 1.6)
    this.kill(i)
  }

  private leaveBody(i: number) {
    const def = UNITS[this.type[i]]
    if (def.building || this.inside[i] >= 0) return
    let collector = false
    for (let j = 0; j < this.n; j++) if (this.alive[j] && this.team[j] !== this.team[i]
      && (this.type[j] === ANT || (def.prey && UNITS[this.type[j]].bug === 'spider'))) { collector = true; break }
    if (!collector) return
    let k = 0
    while (k < MAXC && this.cAlive[k]) k++
    if (k === MAXC) return // shortcut: retain at most 4,000 bodies; raise MAXC if longer battles need more
    this.cn = Math.max(this.cn, k + 1)
    this.cAlive[k] = 1
    this.cGeneration[k]++
    this.cSpider[k] = -1
    this.cX[k] = this.cPx[k] = this.x[i]
    this.cY[k] = this.cPy[k] = this.y[i]
    this.cType[k] = this.type[i]
    this.cTeam[k] = this.team[i]
    this.cFace[k] = this.face[i]
    this.cStage[k] = this.stage[i]
    this.cLook[k] = def.stack ? this.layers[i] : def.alt && (this.away[i] > 0 || this.rollT[i] > 0 || (def.promote && this.grow[i] >= def.promote)) ? 1 : 0
    this.cSize[k] = this.stage[i] === 2 ? 0.8 : (def.size ?? 1) * (def.eats ? 1 + Math.min(this.grow[i], KING + 3) * 0.1 : def.swell ? 1 + this.grow[i] * 0.12 : 1)
    this.cNeed[k] = Math.max(2, Math.min(8, Math.ceil(def.r * this.cSize[k] / 6)))
    this.cHome[k] = -1
    this.cEnter[k] = this.cCrew[k] = this.cReady[k] = this.cSeats[k] = 0
  }

  dropBody(k: number, remove = false) {
    for (let i = 0; i < this.n; i++) if (this.haulFor[i] === k) this.haulFor[i] = -1
    this.cHome[k] = -1
    this.spiders.releaseBody(k)
    this.cSpider[k] = -1
    this.cEnter[k] = this.cCrew[k] = this.cReady[k] = this.cSeats[k] = 0
    if (remove) this.cAlive[k] = 0
  }

  private bodyHome(k: number) {
    const h = this.cHome[k]
    return h >= 0 && !!this.alive[h] && !!UNITS[this.type[h]].colony && this.generation[h] === this.cHomeGen[k]
      && this.colonyT[h] >= COLONY_BUILD && this.team[h] !== this.cTeam[k]
  }

  private canHaul(i: number) {
    return this.antAvailable(i) && this.buildFor[i] < 0 && this.inside[i] < 0
  }

  private bodyRadius(k: number) {
    return Math.max(12, UNITS[this.cType[k]].r * this.cSize[k]) + 6
  }

  private stepHauling() {
    this.haulHead.fill(-1)
    this.haulFree.fill(0)
    let homes = 0
    for (let k = 0; k < this.cn; k++) if (this.cAlive[k]) {
      this.cPx[k] = this.cX[k]; this.cPy[k] = this.cY[k]
      this.cCrew[k] = this.cReady[k] = this.cSeats[k] = 0
      if (this.cHome[k] >= 0 && !this.bodyHome(k)) this.dropBody(k)
    }
    for (let i = 0; i < this.n; i++) {
      if (this.alive[i] && UNITS[this.type[i]].colony && this.colonyT[i] >= COLONY_BUILD) this.haulHomes[homes++] = i
      const k = this.haulFor[i]
      if (k >= 0) {
        if (!this.cAlive[k] || !this.bodyHome(k) || !this.canHaul(i) || this.team[i] !== this.team[this.cHome[k]]) this.haulFor[i] = -1
        else { this.cCrew[k]++; this.cSeats[k] |= 1 << this.haulSlot[i] }
      }
      if (this.haulFor[i] < 0 && this.canHaul(i)) {
        const side = this.team[i]
        this.haulNext[i] = this.haulHead[side]
        this.haulHead[side] = i
        this.haulFree[side]++
      }
    }
    if (this.tick % 15) return
    for (let k = 0; k < this.cn; k++) {
      if (!this.cAlive[k] || this.cEnter[k] > 0 || this.cSpider[k] >= 0) continue
      if (this.cHome[k] >= 0 && !this.cCrew[k] && this.haulFree[this.team[this.cHome[k]]] < this.cNeed[k]) {
        this.dropBody(k)
        continue
      }
      if (this.cHome[k] < 0) {
        let best = -1, distance = Infinity
        for (let h = 0; h < homes; h++) {
          const j = this.haulHomes[h], side = this.team[j]
          if (side === this.cTeam[k] || this.haulFree[side] < this.cNeed[k]) continue
          const d = (this.x[j] - this.cX[k]) ** 2 + (this.y[j] - this.cY[k]) ** 2
          if (d < distance) { distance = d; best = j }
        }
        if (best < 0) continue
        this.cHome[k] = best
        this.cHomeGen[k] = this.generation[best]
      }
      const side = this.team[this.cHome[k]]
      while (this.cCrew[k] < this.cNeed[k] && this.haulFree[side] > 0) {
        const i = this.haulHead[side]
        this.haulHead[side] = this.haulNext[i]
        this.haulFree[side]--
        let seat = 0
        while (this.cSeats[k] & (1 << seat)) seat++
        this.haulSlot[i] = seat
        this.haulFor[i] = k
        this.cSeats[k] |= 1 << seat
        this.cCrew[k]++
      }
    }
  }

  private haulBody(i: number) {
    const k = this.haulFor[i]
    if (k < 0 || !this.cAlive[k] || !this.bodyHome(k) || !this.canHaul(i)) return false
    const a = this.haulSlot[i] * Math.PI * 2 / this.cNeed[k], r = this.bodyRadius(k)
    const tx = Math.min(this.w - 4, Math.max(4, this.cX[k] + Math.cos(a) * r))
    const ty = Math.min(this.h - 4, Math.max(4, this.cY[k] + Math.sin(a) * r))
    const dx = tx - this.x[i], dy = ty - this.y[i], d = Math.hypot(dx, dy) || 1
    const speed = d < 5 ? 0 : UNITS[ANT].speed * (this.slowT[i] > 0 || this.spiders.webT[i] > 0 || this.inWater(this.x[i], this.y[i]) ? 0.4 : 1)
    this.vx[i] += (dx / d * speed - this.vx[i]) * 0.2
    this.vy[i] += (dy / d * speed - this.vy[i]) * 0.2
    this.target[i] = -1
    this.face[i] = this.cX[k] > this.x[i] ? 1 : -1
    this.phase[i] += DT * 16
    return true
  }

  private moveBodies() {
    this.cReady.fill(0)
    for (let i = 0; i < this.n; i++) {
      const k = this.haulFor[i]
      if (k < 0 || !this.cAlive[k] || !this.canHaul(i)) continue
      const a = this.haulSlot[i] * Math.PI * 2 / this.cNeed[k], r = this.bodyRadius(k)
      const tx = Math.min(this.w - 4, Math.max(4, this.cX[k] + Math.cos(a) * r))
      const ty = Math.min(this.h - 4, Math.max(4, this.cY[k] + Math.sin(a) * r))
      if (Math.hypot(this.x[i] - tx, this.y[i] - ty) < 12) this.cReady[k]++
    }
    for (let k = 0; k < this.cn; k++) {
      if (!this.cAlive[k] || !this.bodyHome(k)) continue
      const h = this.cHome[k], dx = this.x[h] + this.face[h] * 4 - this.cX[k], dy = this.y[h] + 10 - this.cY[k], d = Math.hypot(dx, dy) || 1
      if (this.cEnter[k] > 0) {
        this.cEnter[k] = Math.min(1, this.cEnter[k] + DT / 0.6)
        this.cX[k] += dx * 0.15; this.cY[k] += dy * 0.15
        if (this.cEnter[k] >= 1) this.dropBody(k, true)
      } else if (this.cReady[k] >= this.cNeed[k]) {
        if (d < 14) this.cEnter[k] = DT / 0.6
        else {
          const speed = 36 / Math.sqrt(this.cNeed[k] / 2) * (this.inWater(this.cX[k], this.cY[k]) ? 0.4 : 1)
          this.cX[k] += dx / d * speed * DT
          this.cY[k] += dy / d * speed * DT
        }
      }
    }
    for (let i = 0; i < this.n; i++) {
      const k = this.haulFor[i]
      if (k < 0 || !this.cAlive[k] || !this.canHaul(i)) continue
      this.x[i] = Math.min(this.w - 4, Math.max(4, this.x[i] + this.cX[k] - this.cPx[k]))
      this.y[i] = Math.min(this.h - 4, Math.max(4, this.y[i] + this.cY[k] - this.cPy[k]))
    }
  }

  private antAvailable(i: number) {
    return !!this.alive[i] && this.type[i] === ANT && this.heldBy[i] < 0 && this.airT[i] <= 0
      && this.shockT[i] <= 0 && this.fearT[i] <= 0 && this.lureT[i] <= 0 && this.blindT[i] <= 0
      && this.phoneT[i] <= 0 && this.downT[i] <= 0 && this.dizzyT[i] <= 0 && this.spotT[i] <= 0 && !this.brawling(i)
  }

  private canBuild(i: number) {
    return this.antAvailable(i) && this.haulFor[i] < 0
  }

  private releaseColony(site: number, destroyed = false) {
    const side = this.team[site]
    if (this.colonySite[side] === site) this.colonySite[side] = -1
    for (let i = 0; i < this.n; i++) {
      if (this.inside[i] === site) {
        this.inside[i] = -1
        this.entryT[i] = 0
        if (this.alive[i]) {
          const a = i * 2.399963, r = UNITS[ANTHILL].r + UNITS[ANT].r + 5
          this.x[i] = this.px[i] = Math.min(this.w - 4, Math.max(4, this.x[site] + Math.cos(a) * r))
          this.y[i] = this.py[i] = Math.min(this.h - 4, Math.max(4, this.y[site] + Math.sin(a) * r))
          this.vx[i] = Math.cos(a) * 35; this.vy[i] = Math.sin(a) * 35
          this.hitT[i] = 1
        }
        this.dirty = true
      }
      if (this.buildFor[i] === site) this.buildFor[i] = -1
    }
    if (destroyed)
      for (let k = 0; k < this.cn; k++) if (this.cAlive[k] && this.cHome[k] === site) this.dropBody(k)
  }

  private startColony(side: number, seed: number) {
    const r = UNITS[ANTHILL].r
    if (this.w < r * 2 || this.h < r * 2) return -1
    const margin = Math.min(24 + Math.sqrt(this.nextColony[side]) * 10, this.w * 0.4, this.h * 0.4)
    for (let k = 0; k < 40; k++) {
      const a = k * 2.4, d = k ? 24 + Math.floor(k / 8) * 24 : 0
      const x = Math.min(this.w - margin, Math.max(margin, this.x[seed] + Math.cos(a) * d))
      const y = Math.min(this.h - margin, Math.max(margin, this.y[seed] + Math.sin(a) * d))
      if (this.inWater(x, y) || this.inWater(x - r, y) || this.inWater(x + r, y)
        || this.inWater(x, y - r) || this.inWater(x, y + r)) continue
      let clear = true
      for (let j = 0; j < this.n; j++) if (this.alive[j] && UNITS[this.type[j]].building
        && Math.hypot(this.x[j] - x, this.y[j] - y) < 70) { clear = false; break }
      if (clear) return this.spawn(ANTHILL, x, y, side)
    }
    return -1
  }

  private stepColonies() {
    this.antCount.fill(0)
    this.antReady.fill(0)
    this.antSeed.fill(-1)
    for (let i = 0; i < this.n; i++) {
      if (!this.alive[i] || this.type[i] !== ANT) continue
      const side = this.team[i]
      this.antCount[side]++
      if (this.canBuild(i)) { this.antReady[side]++; this.antSeed[side] = i }
    }
    for (let side = 0; side < this.nextColony.length; side++) {
      const need = this.nextColony[side]
      let site = this.colonySite[side]
      if (site < 0 && this.tick % 30 === 0 && this.antCount[side] >= need && this.antReady[side] >= need) {
        site = this.colonySite[side] = this.startColony(side, this.antSeed[side])
      }
      if (site < 0) continue
      let assigned = 0, nearby = 0
      for (let i = 0; i < this.n; i++) if (this.buildFor[i] === site) {
        if (this.team[i] !== side || !this.canBuild(i)) this.buildFor[i] = -1
        else assigned++
      }
      for (let i = 0; i < this.n && assigned < need; i++) if (this.team[i] === side && this.buildFor[i] < 0 && this.canBuild(i)) {
        this.buildFor[i] = site
        assigned++
      }
      for (let i = 0; i < this.n; i++) if (this.buildFor[i] === site && this.inside[i] === site && this.entryT[i] >= 1) nearby++
      this.colonyWorkers[site] = nearby
      if (nearby < need) continue
      this.colonyT[site] = Math.min(COLONY_BUILD, this.colonyT[site] + DT)
      if (this.colonyT[site] >= COLONY_BUILD) {
        this.nextColony[side] *= 2
        this.cd[site] = UNITS[ANTHILL].cd
        this.hitT[site] = 1
        this.releaseColony(site)
      }
    }
  }

  private workColony(i: number) {
    const site = this.buildFor[i]
    if (site < 0 || !this.canBuild(i)) return false
    const tx = this.x[site] + this.face[site] * 4, ty = this.y[site] + 10
    const dx = tx - this.x[i], dy = ty - this.y[i], d = Math.hypot(dx, dy) || 1
    if (d < 8) {
      this.inside[i] = site
      this.entryT[i] = 0
      this.x[i] = tx; this.y[i] = ty
      this.vx[i] = this.vy[i] = 0
      this.target[i] = -1
      this.dirty = true
      return true
    }
    const speed = Math.min(UNITS[ANT].speed, d / DT) * (this.slowT[i] > 0 || this.spiders.webT[i] > 0 || this.inWater(this.x[i], this.y[i]) ? 0.4 : 1)
    this.vx[i] += (dx / d * speed - this.vx[i]) * 0.18
    this.vy[i] += (dy / d * speed - this.vy[i]) * 0.18
    this.target[i] = -1
    this.face[i] = this.x[site] > this.x[i] ? 1 : -1
    this.phase[i] += DT * 14
    return true
  }

  private hatchAnt(i: number) {
    const r = UNITS[ANTHILL].r + UNITS[ANT].r + 6
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6 + this.phase[i], x = this.x[i] + Math.cos(a) * r, y = this.y[i] + Math.sin(a) * r
      if (x < 4 || y < 4 || x > this.w - 4 || y > this.h - 4 || this.inWater(x, y)) continue
      if (this.spawn(ANT, x, y, this.team[i]) >= 0) { // keep the exact side, including the ants' free-for-all side
        this.cd[i] = UNITS[ANTHILL].cd
        this.atkT[i] = 1
      }
      return // at capacity, leave the timer ready and try again next tick
    }
  }

  // quirks that change how fast it walks: a stoked grudge, a full belly, caffeine, spit in the eye
  private pace(i: number) {
    const def = this.def(i), n = this.grow[i]
    return (def.grudge ? 1 + def.grudge * n : 1) * (def.swell ? 1 - n * 0.08 : 1) * (def.crash && this.moodT[i] > 0 ? 2 : 1) * (this.blindT[i] > 0 ? 0.5 : 1)
      * (def.stack ? 1 + (def.stack.length - this.layers[i]) * 0.35 : 1) * (def.fetch && this.away[i] === 2 ? 0.8 : 1)
  }

  step() {
    const { x, y, vx, vy, type, alive, target, cx, cy, teamCounts, items, cellStart: cs, cols, rows } = this
    this.stepColonies()
    this.millipedes.step()
    this.mantises.step()
    this.spiders.step()
    this.stepHauling()
    this.buildGrid()

    cx.fill(0)
    cy.fill(0)
    for (let i = 0; i < this.n; i++) {
      if (!alive[i]) continue
      cx[this.team[i]] += x[i]
      cy[this.team[i]] += y[i]
      this.hidden[i] = UNITS[type[i]].hides && this.inBush(x[i], y[i]) ? 1 : 0
      if (this.hidden[i]) this.ambush[i] = 1
      if (!UNITS[type[i]].flies && !UNITS[type[i]].stack && this.inSyrup(x[i], y[i])) this.slowT[i] = Math.max(this.slowT[i], 0.25) // gummed up (pancakes walk on syrup fine)
    }
    for (let t = 0; t < NT + 2; t++) if (teamCounts[t]) { cx[t] /= teamCounts[t]; cy[t] /= teamCounts[t] }

    let clouds = false // any stink in the air this tick?
    for (let k = 0; k < MAXK && !clouds; k++) clouds = this.kLife[k] > 0

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
      if (this.blindT[i] > 0) this.blindT[i] -= DT
      const phone = this.phoneT[i]
      if (phone > 0) this.phoneT[i] = phone > DT ? phone - DT : -PHONE_IMMUNE // puts it down, and is immune for a moment
      else if (phone < 0) this.phoneT[i] = Math.min(0, phone + DT)
      this.song[i] -= DT
      if (this.burnT[i] > 0) {
        if ((this.burnT[i] -= DT) <= 0) this.hot[i] = 0
        if ((this.hp[i] -= BURN * DT) <= 0) { this.kill(i); continue }
        if (def.pops && Math.random() < def.pops * DT) { // popcorn in a hot pan (yes, even from inside a jaw)
          this.shoot(i, Math.random() * Math.PI * 2)
          this.atkT[i] = 1
        }
      }
      if (this.dizzyT[i] > 0) this.dizzyT[i] -= DT
      if (this.inside[i] >= 0) {
        const home = this.inside[i]
        this.entryT[i] = Math.min(1, this.entryT[i] + DT * 4)
        x[i] = x[home] + this.face[home] * 4; y[i] = y[home] + 10
        vx[i] = vy[i] = 0
        target[i] = -1
        continue
      }
      if (this.airT[i] > 0) { // thrown: no steering until it lands, and the throw's speed isn't bled off
        if ((this.airT[i] -= DT) <= 0) this.land(i)
        continue
      }
      if (clouds && this.stinky(i)) continue
      if (def.building) {
        vx[i] = vy[i] = 0
        target[i] = -1
        if (def.colony && this.colonyT[i] >= COLONY_BUILD && this.cd[i] <= 0) this.hatchAnt(i)
        continue
      }
      if (def.stack) { // every lost third of its health knocks a pancake off, and it lands as a syrup spot
        const left = Math.max(1, Math.ceil(this.hp[i] / def.hp * def.stack.length))
        for (; left < this.layers[i]; this.layers[i]--) {
          this.addTerrain(Math.min(this.w - 1, Math.max(1, x[i] - this.face[i] * 14)), Math.min(this.h - 1, y[i] + 4), 2)
          this.hitT[i] = 1
        }
      }
      const h = this.heldBy[i]
      if (h >= 0) {
        if (alive[h] && this.grab[h] === i) {
          this.stopMoves(i)
          vx[i] = vy[i] = 0
          continue
        }
        this.heldBy[i] = -1 // the jaw died or let go
      }
      if (this.shockT[i] > 0) {
        this.shockT[i] = Math.max(0, this.shockT[i] - DT)
        this.stopMoves(i)
        vx[i] *= 0.75; vy[i] *= 0.75
        continue
      }
      if (this.phoneT[i] > 0) { // scrolling: the fight can wait
        this.stopMoves(i)
        vx[i] *= 0.8; vy[i] *= 0.8
        continue
      }
      if (this.downT[i] > 0) { // toppled: flat on its back, going nowhere
        this.downT[i] -= DT
        this.stopMoves(i)
        vx[i] *= 0.8; vy[i] *= 0.8
        continue
      }
      if (def.crash) { // caffeine: wired until it runs out, then out cold wherever it stands
        if (this.moodT[i] > 0) {
          if ((this.moodT[i] -= DT) <= 0) this.moodT[i] = -def.crash
        } else {
          if ((this.moodT[i] += DT) >= 0) this.moodT[i] = WIRED_T
          vx[i] *= 0.75; vy[i] *= 0.75
          continue
        }
      }
      if (this.brawling(i) && this.lureT[i] <= 0) { vx[i] = vy[i] = 0; continue }
      if (this.brawling(i)) this.endScrap(this.scrapBy[i])
      this.scrapBy[i] = -1
      if (this.workColony(i)) continue
      if (this.haulBody(i)) continue
      if (this.mantises.steer(i, this.target[i])) continue
      const g = this.grab[i]
      if (g >= 0) {
        if (!alive[g] || this.heldBy[g] !== i) this.grab[i] = -1 // it died in there
        else {
          if ((this.grabT[i] -= DT) <= 0) this.fling(i, g) // (a carrier only runs out of time if there's nobody to throw at)
          else if (!def.carry && this.tick % 10 === 0) this.damage(g, def.dmg * 0.25, 0, 0, i) // shake shake shake
          if (!def.carry) {
            vx[i] *= 0.87 // mouth full: stands still, no biting
            vy[i] *= 0.87
            continue
          }
        }
      }

      let t = target[i]
      if (t < 0 || !alive[t] || this.team[t] === this.team[i] || this.hidden[t] || this.heldBy[t] >= 0 || this.stage[t] === 1 || this.inside[t] >= 0 || t === this.grab[i] || !this.mantises.canTarget(i, t) || (i + this.tick) % 12 === 0) t = target[i] = this.findTarget(i)
      if (def.grudge) { // only one fighter matters to it, even one hiding in a bush
        if (this.focusAlive(i)) t = target[i] = this.focus[i]
        else if (this.grow[i] > 0) { this.grow[i] = 0; this.hitT[i] = 1 } // they're gone: it cools off
      }
      if (this.spotT[i] > 0) { // someone struck a pose: go and look (this beats even a grudge)
        this.spotT[i] -= DT
        const star = this.spotBy[i]
        if (alive[star] && this.generation[star] === this.spotGen[i] && this.team[star] !== this.team[i] && this.heldBy[star] < 0) t = target[i] = star
      }
      const lured = this.lureT[i] > 0 // charmed: forget the fight, shuffle toward the singing
      if (lured) {
        this.lureT[i] -= DT; t = -1
        this.stopMoves(i)
      }
      const blind = this.blindT[i] > 0 // spat on: nobody to aim at, not even a grudge
      if (blind) {
        t = target[i] = -1
        this.stopMoves(i)
      }
      const duel = this.mantises.opponent(i)
      if (duel >= 0) t = target[i] = duel
      if (this.fearT[i] > 0 || this.spotT[i] > 0) this.spiders.interrupt(i)
      if (!lured && !blind && this.fearT[i] <= 0) {
        if ((duel < 0 && this.millipedes.steer(i, t)) || this.spiders.steer(i, t)) continue
      }
      if (this.beam[i]) {
        if (this.beam[i] === 1 && (!this.focusAlive(i) || this.hidden[this.focus[i]])) this.stopMoves(i)
        else {
          this.beamT[i] = Math.max(0, this.beamT[i] - DT)
          vx[i] *= this.beam[i] === 2 ? 0.92 : 0.7
          vy[i] *= this.beam[i] === 2 ? 0.92 : 0.7
          if (this.beam[i] === 1) {
            t = target[i] = this.focus[i]
            const dx = x[t] - x[i], dy = y[t] - y[i]
            if (Math.abs(dx) > 2) this.face[i] = dx > 0 ? -1 : 1
            if (Math.hypot(dx, dy) > def.range) this.stopMoves(i)
            else if (this.beamT[i] <= 0) this.blastRainbow(i, t)
          } else if (this.beamT[i] <= 0) this.beam[i] = 0
          continue
        }
      }
      if (this.tetherT[i] > 0) { // a cheese strand: drains whoever is on the other end
        const v = this.focus[i]
        if (!this.focusAlive(i) || this.airT[v] > 0 || (this.tetherT[i] -= DT) <= 0) this.tetherT[i] = 0
        else if ((this.tick + i) % DRAIN_EVERY === 0) {
          this.damage(v, DRAIN, 0, 0, i)
          this.hp[i] = Math.min(this.maxHp(i), this.hp[i] + DRAIN)
        }
      }
      if (this.latchT[i] > 0) { // hugging a leg: slows it, nibbles it, goes where it goes
        const leg = this.focus[i]
        if (!this.focusAlive(i) || this.airT[leg] > 0 || (this.latchT[i] -= DT) <= 0) { // shaken off
          this.latchT[i] = 0
          this.dizzyT[i] = 0.8
          this.slowT[i] = Math.max(this.slowT[i], 0.8)
        } else {
          this.slowT[leg] = Math.max(this.slowT[leg], 0.2)
          if ((this.tick + i) % NIBBLE === 0) this.hit(leg, def, 0, 0, i)
          vx[i] = vy[i] = 0
          continue
        }
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
      if (this.rollT[i] > 0) { // curled up: bowling through the crowd, bouncing off the edges of the page
        if ((this.rollT[i] -= DT) <= 0) { this.rollT[i] = 0; vx[i] *= 0.3; vy[i] *= 0.3 }
        else {
          const nx = x[i] + vx[i] * DT, ny = y[i] + vy[i] * DT
          if ((nx < def.r && vx[i] < 0) || (nx > this.w - def.r && vx[i] > 0)) vx[i] = -vx[i]
          if ((ny < def.r && vy[i] < 0) || (ny > this.h - def.r && vy[i] > 0)) vy[i] = -vy[i]
          if ((this.tick + i) % 6 === 0) this.sweep(i, def.r + 6)
          this.phase[i] += DT * 30
          continue // keeps its speed: no easing while rolling
        }
      }
      if (this.spinT[i] > 0) {
        this.spinT[i] = Math.max(0, this.spinT[i] - DT)
        if (this.tick % 10 === 0) this.sweep(i, def.spin!)
        if (!alive[i]) continue
      }
      if (def.regen && !this.atkT[i]) this.hp[i] = Math.min(this.maxHp(i), this.hp[i] + def.regen * DT)
      if (t < 0) this.rush[i] = 0
      if (def.eats && this.grow[i] >= KING && t >= 0 && this.tick >= this.ringAt[i]) { // a king with a fight on raises a soldier
        this.ringAt[i] = this.tick + SUMMON
        const b = this.spawn(ty, x[i] - this.face[i] * def.r * 2, y[i], this.side(i))
        if (b >= 0) { this.grow[b] = BABY; this.hp[b] = this.maxHp(b) }
      }

      let tx = 0, tyy = 0, has = false, reach = def.r + def.range * (def.kind === 'boom' ? 0.4 : def.kind === 'fire' ? 0.8 : 1)
      if (t >= 0) {
        tx = x[t]; tyy = y[t]; has = true
        reach += UNITS[type[t]].r
      } else if (lured) {
        tx = this.lureX[i]; tyy = this.lureY[i]; has = true
      } else if (blind) { // stumbles in loose circles
        tx = x[i] + Math.cos(this.tick * 0.05 + i) * 40; tyy = y[i] + Math.sin(this.tick * 0.07 + i) * 40; has = true
      } else {
        let bd = Infinity // nobody in sight: head for the nearest enemy crowd
        for (let k = 0; k < NT + 2; k++) {
          if (k === this.team[i] || !teamCounts[k]) continue
          const dx = cx[k] - x[i], dy = cy[k] - y[i], d = dx * dx + dy * dy
          if (d < bd) { bd = d; tx = cx[k]; tyy = cy[k]; has = true }
        }
      }

      if (def.fetch && this.away[i] && !lured && this.fearT[i] <= 0) { // one sandal: wait for it to land, then hop over and get it
        t = -1
        has = false
        if (this.away[i] === 2) {
          tx = this.itemX[i]; tyy = this.itemY[i]; has = true
          if (Math.hypot(tx - x[i], tyy - y[i]) < def.r + 8) { this.away[i] = 0; this.hitT[i] = 1; has = false } // picked up
        }
      } else if (def.promote && this.grow[i] >= def.promote) {
        const sub = this.staff(i)
        if (sub >= 0 && !lured && this.fearT[i] <= 0) { // management: hangs back behind its staff instead of working
          let ax = 0, ay = 0
          if (t >= 0) { ax = x[t] - x[sub]; ay = y[t] - y[sub] }
          const al = Math.hypot(ax, ay) || 1
          tx = x[sub] - ax / al * 40; tyy = y[sub] - ay / al * 40
          has = Math.hypot(tx - x[i], tyy - y[i]) > 6
          t = -1
        }
      }

      let dvx = 0, dvy = 0
      if (has) {
        const dx = tx - x[i], dy = tyy - y[i], d = Math.hypot(dx, dy) || 1e-6
        const speed = def.speed * ((this.slowT[i] > 0 || this.spiders.webT[i] > 0) ? 0.4 : 1) * (SWIMS[ty] || def.flies || !this.inWater(x[i], y[i]) ? 1 : 0.5) * this.pace(i)
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
          if (def.roll && this.dangerous(i, t, d)) { // cornered: curls into a ball and bowls through them
            this.rollT[i] = ROLL_T
            this.abilityCd[i] = ROLL_CD
            vx[i] = dx / d * def.roll; vy[i] = dy / d * def.roll
            continue
          }
          if (def.stink && d < def.stink) { // turns tail and sprays
            const k = this.kHead
            this.kHead = (k + 1) % MAXK
            this.kX[k] = x[i] + dx * 0.5; this.kY[k] = y[i] + dy * 0.5
            this.kType[k] = ty
            this.kTeam[k] = this.team[i]
            this.kLife[k] = 1
            this.abilityCd[i] = STINK_CD
            this.atkT[i] = 1
            this.face[i] = dx > 0 ? -1 : 1
            continue
          }
        }
        if (def.charge && t >= 0 && d > def.charge + reach) this.rush[i] = 1 // far enough for a run-up
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
            this.toss(cargo, dx / d, dy / d, this.team[i], d, 1)
          } else {
            dvx = (dx / d) * def.speed
            dvy = (dy / d) * def.speed
          }
        } else if (t >= 0 && d < (def.kind === 'beam' ? def.range : reach)) {
          if (this.cd[i] <= 0 && this.spinT[i] <= 0) this.attack(i, t, dx / d, dy / d)
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

    for (let i = 0; i < this.n; i++) {
      if (!alive[i]) continue
      x[i] += vx[i] * DT
      y[i] += vy[i] * DT
      const lawn = UNITS[type[i]].lawn
      if (!lawn || this.airT[i] > 0 || (this.walked[i] += Math.hypot(vx[i], vy[i]) * DT) < lawn) continue
      this.walked[i] = 0
      // behind it, not underfoot: a hider standing in its own tuft would lie in wait forever
      const bx = x[i] - this.face[i] * 34, by = y[i]
      if (this.planted[i] < LAWN_MAX && bx > 0 && bx < this.w && by > 0 && by < this.h && !this.inBush(bx, by) && !this.inWater(bx, by)) {
        this.addTerrain(bx, by)
        this.planted[i]++
      }
    }
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
      if (this.heldBy[i] >= 0 || this.inside[i] >= 0 || this.leapT[i] > 0 || this.scrapT[i] > 0 || this.latchT[i] > 0 || this.spiders.jumpT[i] > 0 || this.spiders.clingT[i] > 0 || this.brawling(i)) continue
      const ri = UNITS[type[i]].r
      const gx = Math.min(cols - 1, (x[i] / CELL) | 0), gy = Math.min(rows - 1, (y[i] / CELL) | 0)
      const x1 = Math.min(cols - 1, gx + 1), y1 = Math.min(rows - 1, gy + 1)
      for (let yy = Math.max(0, gy - 1); yy <= y1; yy++)
        for (let xx = Math.max(0, gx - 1); xx <= x1; xx++) {
          const c = yy * cols + xx
          for (let q = cs[c]; q < cs[c + 1]; q++) {
            const j = items[q]
            if (j <= i || !alive[j] || this.heldBy[j] >= 0 || this.inside[j] >= 0 || this.leapT[j] > 0 || this.scrapT[j] > 0 || this.latchT[j] > 0 || this.spiders.jumpT[j] > 0 || this.spiders.clingT[j] > 0 || this.brawling(j)) continue
            if (this.buildFor[i] === j || this.buildFor[j] === i || this.spiders.home[i] === j || this.spiders.home[j] === i
              || (this.haulFor[i] >= 0 && this.cHome[this.haulFor[i]] === j)
              || (this.haulFor[j] >= 0 && this.cHome[this.haulFor[j]] === i)) continue // workers can pass through their own doorway
            const min = ri + UNITS[type[j]].r
            let dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy
            if (d2 >= min * min) continue
            this.touch(i, j)
            if (d2 < 1e-4) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = dx * dx + dy * dy + 1e-6 }
            const d = Math.sqrt(d2), push = (min - d) / d
            const wi = UNITS[type[i]].building ? 0 : UNITS[type[j]].building ? 1 : 0.5
            const wj = UNITS[type[j]].building ? 0 : UNITS[type[i]].building ? 1 : 0.5
            x[i] -= dx * push * wi; y[i] -= dy * push * wi
            x[j] += dx * push * wj; y[j] += dy * push * wj
          }
        }
    }
    for (let i = 0; i < this.n; i++) { // whoever is in a jaw goes where the jaw goes
      const g = this.grab[i]
      if (alive[i] && g >= 0) { x[g] = x[i] + this.face[i] * UNITS[type[i]].r; y[g] = y[i] }
      if (alive[i] && this.latchT[i] > 0 && this.focusAlive(i)) { // and a leg-hugger goes where the leg goes
        const leg = this.focus[i]
        // stays on the side it grabbed: placing it by the victim's facing would flip it every tick as the victim turns to look
        x[i] = x[leg] + (x[i] < x[leg] ? -1 : 1) * UNITS[type[leg]].r * 0.6
        y[i] = y[leg] + 2
      }
      const v = alive[i] ? this.tethered(i) : -1
      if (v >= 0) { // the cheese strand: stretches so far, then pulls back, or snaps
        const dx = x[v] - x[i], dy = y[v] - y[i], d = Math.hypot(dx, dy) || 1
        if (d > TETHER_LEN * SNAP) { // yanked too far: both bounce back toward each other
          this.tetherT[i] = 0
          vx[v] -= dx / d * 160; vy[v] -= dy / d * 160
          vx[i] += dx / d * 160; vy[i] += dy / d * 160
          this.hitT[i] = this.hitT[v] = 1
        } else if (d > TETHER_LEN) { x[v] = x[i] + dx / d * TETHER_LEN; y[v] = y[i] + dy / d * TETHER_LEN }
      }
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
              if (!alive[j] || this.team[j] === this.pTeam[p] || this.inside[j] >= 0 || this.heldBy[j] >= 0 || this.stage[j] === 1) continue
              const dx = x[j] - nx, dy = y[j] - ny, r = UNITS[type[j]].r + 3
              if (dx * dx + dy * dy < r * r) {
                const src = UNITS[this.pType[p]]
                this.hit(j, src, (this.pVx[p] / 420) * src.knock, (this.pVy[p] / 420) * src.knock, -1, src.projectile === 'web' ? 0.5 : 1, this.owner(p))
                if (src.projectile === 'web' && alive[j] && !UNITS[type[j]].building) this.spiders.webT[j] = 1.8
                dead = true
                break scan
              }
            }
          }
      }
      if (dead) {
        const o = UNITS[this.pType[p]].fetch ? this.owner(p) : -1
        if (o >= 0 && this.away[o] === 1) { // the sandal lands where it stopped
          this.away[o] = 2
          this.itemX[o] = Math.min(this.w - 8, Math.max(8, this.pX[p]))
          this.itemY[o] = Math.min(this.h - 8, Math.max(8, this.pY[p]))
        }
        const l = --this.pn
        this.pX[p] = this.pX[l]; this.pY[p] = this.pY[l]
        this.pVx[p] = this.pVx[l]; this.pVy[p] = this.pVy[l]
        this.pLife[p] = this.pLife[l]; this.pDmg[p] = this.pDmg[l]; this.pType[p] = this.pType[l]; this.pTeam[p] = this.pTeam[l]
        this.pFrom[p] = this.pFrom[l]; this.pGen[p] = this.pGen[l]
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
    for (let k = 0; k < MAXK; k++) if (this.kLife[k] > 0) this.kLife[k] -= DT / STINK_T
    for (let k = 0; k < MAXO; k++) if (this.oLife[k] > 0) this.oLife[k] -= DT * 0.8
    this.moveBodies()
    this.spiders.afterStep()
    this.tick++
  }
}

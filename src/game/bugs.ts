import { DT, type Sim } from './sim.ts'
import { UNITS } from './units.ts'

const LINK = 90, BLINK_CD = 3, HOP = 0.32
const STING_DMG = 4 // a left-in stinger throbs for this much every half second
const CICADA_CYCLE = 17 * 60 // ticks from the first mound in a cohort to their shared surfacing
const SCREAM_STUN = 1.5, PIT_PULL = 14 // seconds stunned by the scream; px/s added per tick toward an antlion (settles near 90 px/s)
const GRAZE_SIGHT = 400 // px a locust can smell a bush from
export const MAX_BALLS = 128

export class Bugs {
  private s: Sim
  ballR: Float32Array
  ballAngle: Float32Array
  ballPhase: Float32Array
  flashR: Float32Array
  hopT: Float32Array
  revivals: Uint8Array
  private body: Int32Array
  private bodyGen: Uint32Array
  private group: Int32Array
  private seen: Uint8Array

  life = new Float32Array(MAX_BALLS)
  x = new Float32Array(MAX_BALLS)
  y = new Float32Array(MAX_BALLS)
  px = new Float32Array(MAX_BALLS)
  py = new Float32Array(MAX_BALLS)
  vx = new Float32Array(MAX_BALLS)
  vy = new Float32Array(MAX_BALLS)
  radius = new Float32Array(MAX_BALLS)
  phase = new Float32Array(MAX_BALLS)
  private side = new Uint8Array(MAX_BALLS)
  private owner = new Int32Array(MAX_BALLS)
  private ownerGen = new Uint32Array(MAX_BALLS)
  private struck: Uint32Array
  private beetle: number
  age: Float32Array // seconds since it was placed: a mayfly's whole life, a cicada's time underground
  stingT: Float32Array // seconds a bee's stinger keeps hurting
  private stingBeat: Float32Array // time accumulated toward the next half-second sting
  egg: Int16Array // side of the wasp whose egg it carries, or -1
  private grazeX: Float32Array // locust: the bush it is walking to (NaN for none)
  private grazeY: Float32Array
  private wasp: number
  private cicadaAt = Infinity
  private broods: { x: number; y: number; side: number; left: number }[] = [] // deaths only: independent of recycled fighter slots

  constructor(s: Sim) {
    this.s = s
    const n = s.x.length
    this.ballR = new Float32Array(n)
    this.ballAngle = new Float32Array(n)
    this.ballPhase = new Float32Array(n)
    this.flashR = new Float32Array(n)
    this.hopT = new Float32Array(n)
    this.revivals = new Uint8Array(n)
    this.body = new Int32Array(n).fill(-1)
    this.bodyGen = new Uint32Array(n)
    this.group = new Int32Array(n)
    this.seen = new Uint8Array(n)
    this.struck = new Uint32Array(MAX_BALLS * n)
    this.beetle = UNITS.findIndex((u) => u.dung)
    this.age = new Float32Array(n)
    this.stingT = new Float32Array(n)
    this.stingBeat = new Float32Array(n)
    this.egg = new Int16Array(n).fill(-1)
    this.grazeX = new Float32Array(n).fill(NaN)
    this.grazeY = new Float32Array(n)
    this.wasp = UNITS.findIndex((u) => u.implant)
  }

  reset() {
    this.ballR.fill(0)
    this.ballAngle.fill(0)
    this.ballPhase.fill(0)
    this.flashR.fill(0)
    this.hopT.fill(0)
    this.revivals.fill(0)
    this.body.fill(-1)
    this.life.fill(0)
    this.age.fill(0)
    this.stingT.fill(0)
    this.stingBeat.fill(0)
    this.egg.fill(-1)
    this.grazeX.fill(NaN)
    this.cicadaAt = Infinity
    this.broods.length = 0
  }

  onSpawn(i: number) {
    const s = this.s, def = UNITS[s.type[i]]
    this.ballR[i] = def.dung ? 7 : 0
    this.ballAngle[i] = s.face[i] > 0 ? 0 : Math.PI
    this.ballPhase[i] = this.flashR[i] = this.hopT[i] = this.revivals[i] = 0
    this.body[i] = -1
    if (def.flash) s.abilityCd[i] = BLINK_CD
    this.age[i] = this.stingT[i] = this.stingBeat[i] = 0
    this.egg[i] = -1
    this.grazeX[i] = NaN
    if (def.buried) {
      s.stage[i] = 1; s.stageT[i] = Infinity
      if (this.cicadaAt === Infinity) this.cicadaAt = s.tick + CICADA_CYCLE
    }
  }

  interrupt(i: number) { this.hopT[i] = 0 }

  // picky eaters: a bed bug only wants someone who can't fight back, a termite only wants a building
  ignores(i: number, j: number) {
    if (j < 0) return false
    const s = this.s, def = UNITS[s.type[i]], other = UNITS[s.type[j]]
    return s.feignT[j] > 0 || (!!def.sleeper && !(s.shockT[j] > 0 || s.downT[j] > 0 || s.phoneT[j] > 0 || s.isStatue(j)
      || (!!other.crash && s.moodT[j] < 0) || (!!other.regen && !other.troll && s.atkT[j] <= 0)))
      || (!!def.wrecker && !other.building)
  }

  behind(i: number, j: number) {
    const s = this.s
    return j >= 0 && !!s.alive[j] && (s.x[i] - s.x[j]) * s.face[j] < 0
  }

  // a stick insect that isn't moving is a stick
  still(i: number) {
    const s = this.s
    return !!UNITS[s.type[i]].still && s.vx[i] * s.vx[i] + s.vy[i] * s.vy[i] < 64
  }

  // The bee's sting landed: the persistent effect belongs to that victim, and only that bee dies.
  bitten(i: number, t: number, gen: number, ownGen: number, def: (typeof UNITS)[number]) {
    if (!def.sting) return false
    const s = this.s, mine = !!s.alive[i] && s.generation[i] === ownGen
    const there = !!s.alive[t] && s.generation[t] === gen && s.stage[t] !== 1 && !UNITS[s.type[t]].building
    if (there) { this.stingT[t] = def.sting; this.stingBeat[t] = 0 }
    if (mine) s.damage(i, Infinity, 0, 0)
    return true
  }

  // called while i is dying for good, before its slot is freed: the wasp egg hatches
  onDeath(i: number) {
    const side = this.egg[i]
    if (side < 0) return
    this.egg[i] = -1
    this.broods.push({ x: this.s.x[i], y: this.s.y[i], side, left: 2 })
    this.hatchBroods()
  }

  private hatchBroods() {
    while (this.broods.length) {
      const brood = this.broods[this.broods.length - 1]
      if (this.s.spawn(this.wasp, brood.x + (brood.left === 2 ? -6 : 6), brood.y, brood.side) < 0) return
      if (--brood.left === 0) this.broods.pop()
    }
  }

  // Shared spatial grid: no per-blink arrays or full-page searches for each light.
  private near(x: number, y: number, r: number, visit: (j: number) => void) {
    const s = this.s
    const x0 = Math.max(0, Math.floor((x - r) / 32)), x1 = Math.min(s.cols - 1, Math.floor((x + r) / 32))
    const y0 = Math.max(0, Math.floor((y - r) / 32)), y1 = Math.min(s.rows - 1, Math.floor((y + r) / 32))
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const cell = yy * s.cols + xx
      for (let q = s.cellStart[cell]; q < s.cellStart[cell + 1]; q++) visit(s.items[q])
    }
  }

  step() {
    const s = this.s
    this.hatchBroods()
    if (s.dirty) s.buildGrid()
    const surface = s.tick >= this.cicadaAt
    if (surface) this.cicadaAt = Infinity
    let emerging = 0
    if (surface) for (let i = 0; i < s.n; i++) {
      if (!s.alive[i] || !UNITS[s.type[i]].buried || s.stage[i] !== 1) continue
      this.group[emerging++] = i
      s.stage[i] = 0
      s.hitT[i] = 1
      s.pulseT[i] = 0.5
    }
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i]) continue
      const def = UNITS[s.type[i]]
      const generation = s.generation[i]
      this.age[i] += DT
      if (this.stingT[i] > 0) {
        this.stingBeat[i] += Math.min(DT, this.stingT[i])
        this.stingT[i] = Math.max(0, this.stingT[i] - DT)
        if (this.stingBeat[i] >= 0.5 - DT * 0.5) {
          this.stingBeat[i] = Math.max(0, this.stingBeat[i] - 0.5)
          s.damage(i, STING_DMG, 0, 0)
        }
        if (!s.alive[i] || s.generation[i] !== generation) continue
      }
      if (def.lifespan && this.age[i] >= def.lifespan - DT * 0.5) { s.damage(i, Infinity, 0, 0); continue } // old age, including while held or stunned
      if (def.pit && s.canAct(i)) this.near(s.x[i], s.y[i], def.pit, (j) => { // loose sand: whoever is on the slope slides toward the jaws
        if (!s.alive[j] || s.team[j] === s.team[i] || s.stage[j] === 1 || s.heldBy[j] >= 0 || s.airT[j] > 0 || s.leapT[j] > 0
          || s.bugs.hopT[j] > 0 || s.spiders.jumpT[j] > 0 || s.latchT[j] > 0 || s.spiders.clingT[j] > 0
          || s.isFlying(j) || s.isRooted(j)) return
        const dx = s.x[i] - s.x[j], dy = s.y[i] - s.y[j], d = Math.hypot(dx, dy)
        if (d > def.pit! || d < 1) return
        s.vx[j] += dx / d * PIT_PULL
        s.vy[j] += dy / d * PIT_PULL
      })
    }
    // Surface the whole cohort before any scream: opposing cicadas can stun one another fairly.
    for (let k = 0; k < emerging; k++) {
      const i = this.group[k], radius = UNITS[s.type[i]].buried!
      if (!s.alive[i] || !radius) continue
      this.near(s.x[i], s.y[i], radius, (j) => {
        if (!s.alive[j] || s.team[j] === s.team[i] || s.stage[j] === 1 || s.inside[j] >= 0 || UNITS[s.type[j]].building
          || !s.mantises.canTarget(i, j) || Math.hypot(s.x[j] - s.x[i], s.y[j] - s.y[i]) > radius) return
        s.mantises.onHit(j, i)
        s.shockT[j] = Math.max(s.shockT[j], SCREAM_STUN)
        s.stone[j] = 0
      })
    }
    this.seen.fill(0)
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i] || !UNITS[s.type[i]].flash || this.seen[i] || !s.canAct(i)) continue
      let count = 1, ready = s.abilityCd[i] <= 0
      this.group[0] = i
      this.seen[i] = 1
      for (let k = 0; k < count; k++) {
        const a = this.group[k]
        this.near(s.x[a], s.y[a], LINK, (j) => {
          if (this.seen[j] || !s.alive[j] || !UNITS[s.type[j]].flash || s.team[j] !== s.team[i] || !s.canAct(j)
            || Math.hypot(s.x[j] - s.x[a], s.y[j] - s.y[a]) > LINK) return
          this.seen[j] = 1
          this.group[count++] = j
          ready ||= s.abilityCd[j] <= 0
        })
      }
      if (!ready) continue
      const radius = Math.min(240, 55 + Math.sqrt(count - 1) * 24)
      for (let k = 0; k < count; k++) {
        const a = this.group[k]
        s.abilityCd[a] = BLINK_CD
        s.pulseT[a] = 0.5
        s.atkT[a] = 1
        this.flashR[a] = radius
        this.near(s.x[a], s.y[a], radius, (j) => {
          if (!s.alive[j] || s.team[j] === s.team[a] || s.stage[j] === 1 || s.inside[j] >= 0
            || s.heldBy[j] >= 0 || UNITS[s.type[j]].building || !s.mantises.canTarget(a, j)
            || Math.hypot(s.x[j] - s.x[a], s.y[j] - s.y[a]) > radius) return
          s.mantises.onHit(j, a)
          s.blindT[j] = Math.max(s.blindT[j], 1.6)
        })
      }
    }

    for (let b = 0; b < MAX_BALLS; b++) {
      if (this.life[b] <= 0) continue
      this.px[b] = this.x[b]; this.py[b] = this.y[b]
      this.life[b] = Math.max(0, this.life[b] - DT)
      this.x[b] += this.vx[b] * DT; this.y[b] += this.vy[b] * DT
      const r = this.radius[b], rx = Math.min(r, s.w / 2), ry = Math.min(r, s.h / 2)
      if (this.x[b] < rx || this.x[b] > s.w - rx) this.vx[b] *= -1
      if (this.y[b] < ry || this.y[b] > s.h - ry) this.vy[b] *= -1
      this.x[b] = Math.max(rx, Math.min(s.w - rx, this.x[b]))
      this.y[b] = Math.max(ry, Math.min(s.h - ry, this.y[b]))
      this.phase[b] += 300 * DT / r
      const owner = this.owner[b]
      const by = s.alive[owner] && s.generation[owner] === this.ownerGen[b] && s.team[owner] === this.side[b] ? owner : -1
      this.near(this.x[b], this.y[b], r + 80, (j) => {
        const stamp = b * s.x.length + j
        if (!s.alive[j] || s.team[j] === this.side[b] || s.heldBy[j] >= 0 || s.inside[j] >= 0
          || s.stage[j] === 1 || s.airT[j] > 0 || s.isFlying(j) || this.struck[stamp] === s.generation[j]) return
        const dx = s.x[j] - this.x[b], dy = s.y[j] - this.y[b], d = Math.hypot(dx, dy)
        if (d > r + s.effectiveRadius(j)) return
        this.struck[stamp] = s.generation[j]
        const nx = d > 0.01 ? dx / d : this.vx[b] / 300, ny = d > 0.01 ? dy / d : this.vy[b] / 300
        s.hit(j, UNITS[this.beetle], nx * 250, ny * 250, -1, 3, by)
      })
    }
  }

  private freeBody(k: number) {
    const s = this.s
    return k >= 0 && !!s.cAlive[k] && s.cHome[k] < 0 && s.cSpider[k] < 0 && s.cEnter[k] <= 0
  }

  pushedX(i: number) { return this.s.x[i] + Math.cos(this.ballAngle[i]) * (this.s.effectiveRadius(i) + this.ballR[i]) }
  pushedY(i: number) { return this.s.y[i] + Math.sin(this.ballAngle[i]) * (this.s.effectiveRadius(i) + this.ballR[i]) }

  steer(i: number, t: number): boolean {
    const s = this.s, def = UNITS[s.type[i]]
    if (!def.dung && !def.ride && !def.lamp && !def.graze && !def.still) return false
    if (!s.canAct(i)) return false

    if (def.still) {
      let victim = -1, distance = 80
      this.near(s.x[i], s.y[i], distance, (j) => {
        if (s.team[j] === s.team[i] || !this.behind(i, j) || s.stage[j] === 1 || s.inside[j] >= 0 || s.heldBy[j] >= 0
          || s.hidden[j] || s.airT[j] > 0 || !s.mantises.canTarget(i, j)) return
        const d = Math.hypot(s.x[j] - s.x[i], s.y[j] - s.y[i])
        if (d < distance) { victim = j; distance = d }
      })
      s.target[i] = victim
      let vx = 0, vy = 0
      if (victim >= 0) {
        const dx = s.x[victim] - s.x[i], dy = s.y[victim] - s.y[i], d = distance || 1
        s.face[i] = dx > 0 ? 1 : -1
        if (distance < def.r + def.range + s.effectiveRadius(victim)) {
          if (s.cd[i] <= 0) s.attack(i, victim, dx / d, dy / d)
        } else {
          const speed = def.speed * (s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1) * (s.inWater(s.x[i], s.y[i]) ? 0.5 : 1)
          vx = dx / d * speed; vy = dy / d * speed
        }
      }
      s.vx[i] += (vx - s.vx[i]) * 0.13
      s.vy[i] += (vy - s.vy[i]) * 0.13
      s.phase[i] += Math.hypot(s.vx[i], s.vy[i]) * DT * 0.12
      return true // remains a stick until someone walks past it
    }

    if (def.ride) {
      if (s.latchT[i] > 0) {
        if (!s.focusAlive(i)) s.latchT[i] = 0
        else {
          s.vx[i] = s.vy[i] = 0
          if ((s.tick + i) % 30 === 0) { s.atkT[i] = 1; s.hit(s.focus[i], def, 0, 0, i) }
          return true
        }
      }
      if (this.hopT[i] > 0) {
        if (!s.focusAlive(i)) { this.hopT[i] = 0; s.vx[i] = s.vy[i] = 0 }
        else {
          const host = s.focus[i], left = Math.max(DT, this.hopT[i])
          s.vx[i] = (s.x[host] - s.x[i]) / left
          s.vy[i] = (s.y[host] - s.y[i]) / left
          this.hopT[i] = Math.max(0, this.hopT[i] - DT)
          if (this.hopT[i] <= 0) { s.latchT[i] = 1; s.vx[i] = s.vy[i] = 0 }
          return true
        }
      }
      if (t >= 0 && Math.hypot(s.x[t] - s.x[i], s.y[t] - s.y[i]) < 160 && s.airT[t] <= 0) {
        s.lockOn(i, t)
        this.hopT[i] = HOP
        s.vx[i] = s.vy[i] = 0
        s.atkT[i] = 1
        return true
      }
      return false
    }

    let tx: number, ty: number
    if (def.lamp) {
      // Fire has no side. Once alight, keep flying through it toward the next collision.
      s.target[i] = -1
      let fire = -1, best = 512 ** 2
      if (s.burnT[i] <= 0) this.near(s.x[i], s.y[i], 512, (j) => {
        if (j === i || !s.alive[j] || s.stage[j] === 1 || s.inside[j] >= 0 || s.heldBy[j] >= 0
          || (s.burnT[j] <= 0 && UNITS[s.type[j]].kind !== 'fire')) return
        const d = (s.x[j] - s.x[i]) ** 2 + (s.y[j] - s.y[i]) ** 2
        if (d < best) { best = d; fire = j }
      })
      if (fire >= 0) {
        this.ballAngle[i] = Math.atan2(s.y[fire] - s.y[i], s.x[fire] - s.x[i])
        if (s.abilityCd[i] <= 0 && Math.sqrt(best) < s.effectiveRadius(fire) + def.r + 8) {
          s.ignite(i, 4)
          s.hot[i] = 1
          s.hitT[i] = 1
        }
      } else if (s.burnT[i] <= 0) this.ballAngle[i] += Math.sin(s.tick * 0.025 + i) * DT
      const angle = this.ballAngle[i]
      if ((s.x[i] < 12 && Math.cos(angle) < 0) || (s.x[i] > s.w - 12 && Math.cos(angle) > 0)) this.ballAngle[i] = Math.PI - angle
      if ((s.y[i] < 12 && Math.sin(angle) < 0) || (s.y[i] > s.h - 12 && Math.sin(angle) > 0)) this.ballAngle[i] *= -1
      tx = s.x[i] + Math.cos(this.ballAngle[i]) * 100
      ty = s.y[i] + Math.sin(this.ballAngle[i]) * 100
    } else if (def.graze) {
      // shortcut: each locust scans every terrain stamp every 12 ticks; bucket bushes by cell if a big lawn stutters
      if ((s.tick + i) % 12 === 0) {
        let best = GRAZE_SIGHT ** 2, bush = -1
        for (let b = 0; b < s.bn; b++) {
          if (s.bT[b] !== 0) continue
          const d = (s.bX[b] - s.x[i]) ** 2 + (s.bY[b] - s.y[i]) ** 2
          if (d < best) { best = d; bush = b }
        }
        this.grazeX[i] = bush < 0 ? NaN : s.bX[bush]
        this.grazeY[i] = bush < 0 ? NaN : s.bY[bush]
        if (bush >= 0 && best < 14 ** 2 && s.abilityCd[i] <= 0) { // lunch: the bush is gone and there is one more mouth
          const baby = s.spawn(s.type[i], s.x[i], s.y[i], s.team[i])
          if (baby < 0) return true // leave the meal intact until there is room for its offspring
          s.removeTerrain(bush)
          this.grazeX[i] = NaN
          s.abilityCd[i] = 1
          s.atkT[i] = s.hitT[i] = 1
          s.abilityCd[baby] = 1
        }
      }
      if (!Number.isNaN(this.grazeX[i]) && !s.inBush(this.grazeX[i], this.grazeY[i])) this.grazeX[i] = NaN
      if (Number.isNaN(this.grazeX[i])) return false // nothing green in sight: an ordinary, underwhelming fighter
      tx = this.grazeX[i]; ty = this.grazeY[i]
    } else {
      // ponytail: corpse searches every 12 ticks; add a corpse grid if 4,000 beetles need it.
      if ((s.tick + i) % 12 === 0 || (this.body[i] >= 0 && (!this.freeBody(this.body[i]) || this.bodyGen[i] !== s.cGeneration[this.body[i]]))) {
        let best = 512 ** 2, body = -1
        for (let k = 0; k < s.cn; k++) {
          if (!this.freeBody(k)) continue
          const d = (s.cX[k] - s.x[i]) ** 2 + (s.cY[k] - s.y[i]) ** 2
          if (d < best) { best = d; body = k }
        }
        this.body[i] = body
        if (body >= 0) this.bodyGen[i] = s.cGeneration[body]
      }
      const body = this.body[i]
      if (body < 0 && t < 0) {
        const angle = this.ballAngle[i]
        if ((s.x[i] < 12 && Math.cos(angle) < 0) || (s.x[i] > s.w - 12 && Math.cos(angle) > 0)) this.ballAngle[i] = Math.PI - angle
        if ((s.y[i] < 12 && Math.sin(angle) < 0) || (s.y[i] > s.h - 12 && Math.sin(angle) > 0)) this.ballAngle[i] *= -1
      }
      tx = body >= 0 ? s.cX[body] : t >= 0 ? s.x[t] : s.x[i] + Math.cos(this.ballAngle[i]) * 80
      ty = body >= 0 ? s.cY[body] : t >= 0 ? s.y[t] : s.y[i] + Math.sin(this.ballAngle[i]) * 80
      this.ballAngle[i] = Math.atan2(ty - s.y[i], tx - s.x[i])
      if (body < 0 && t >= 0 && Math.hypot(tx - s.x[i], ty - s.y[i]) < def.r + s.effectiveRadius(t) + def.range && s.cd[i] <= 0) s.attack(i, t, Math.cos(this.ballAngle[i]), Math.sin(this.ballAngle[i]))
    }
    const d = Math.hypot(tx - s.x[i], ty - s.y[i]) || 1
    const speed = def.speed * (s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1) * (!s.isFlying(i) && s.inWater(s.x[i], s.y[i]) ? 0.5 : 1)
    s.vx[i] += ((tx - s.x[i]) / d * speed - s.vx[i]) * 0.13
    s.vy[i] += ((ty - s.y[i]) / d * speed - s.vy[i]) * 0.13
    if (Math.abs(tx - s.x[i]) > 1) s.face[i] = tx > s.x[i] ? 1 : -1
    s.phase[i] += Math.hypot(s.vx[i], s.vy[i]) * DT * 0.12
    return true
  }

  afterMove() {
    const s = this.s
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i] || !UNITS[s.type[i]].dung || !s.canAct(i)) continue
      const distance = Math.hypot(s.x[i] - s.px[i], s.y[i] - s.py[i])
      this.ballPhase[i] += distance / this.ballR[i]
      if (distance < 0.01) continue
      const x = this.pushedX(i), y = this.pushedY(i)
      for (let k = 0; k < s.cn && this.ballR[i] < 19; k++) {
        if (!this.freeBody(k) || Math.hypot(s.cX[k] - x, s.cY[k] - y) > this.ballR[i] + 8) continue
        s.dropBody(k, true)
        this.ballR[i] += 4
        s.hitT[i] = 1
        if (this.ballR[i] >= 19) break
      }
      if (this.ballR[i] < 19) continue
      const b = this.life.findIndex((life) => life <= 0)
      if (b < 0) { this.ballR[i] = 19; continue } // keep the grown ball until an effect slot is free
      const target = s.target[i]
      const angle = target >= 0 && s.alive[target] ? Math.atan2(s.y[target] - y, s.x[target] - x) : this.ballAngle[i]
      this.x[b] = this.px[b] = x; this.y[b] = this.py[b] = y
      this.vx[b] = Math.cos(angle) * 300; this.vy[b] = Math.sin(angle) * 300
      this.radius[b] = this.ballR[i]; this.phase[b] = this.ballPhase[i]
      this.side[b] = s.team[i]; this.owner[b] = i; this.ownerGen[b] = s.generation[i]
      this.struck.fill(0, b * s.x.length, (b + 1) * s.x.length)
      this.life[b] = 4
      this.ballR[i] = 7
      s.atkT[i] = 1
    }
  }
}

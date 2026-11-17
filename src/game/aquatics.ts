import { DT, type Sim } from './sim.ts'
import { UNITS } from './units.ts'

type Ink = { x: number; y: number; life: number; side: number; owner: number; gen: number }
type Snap = { x: number; y: number; vx: number; vy: number; life: number; owner: number; gen: number; side: number; type: number }
type Limb = { x: number; y: number; life: number; owner: number; gen: number; bit: number; side: number }
const LIMIT = 128 // bounded pools; a full pool defers another effect instead of overwriting a live one

export class Aquatics {
  private s: Sim
  puff: Float32Array
  wind: Float32Array
  jet: Float32Array
  lunge: Float32Array
  flop: Float32Array
  missing: Uint8Array
  claws: Int32Array
  private clawGen: Uint32Array
  private clawT: Float32Array
  private gripT: Float32Array
  private bait: Int32Array
  private baitGen: Uint32Array
  private baitT: Float32Array
  private dx: Float32Array
  private dy: Float32Array
  private homeX: Float32Array
  private homeY: Float32Array
  private bitten: Uint8Array
  inks: Ink[] = []
  snaps: Snap[] = []
  limbs: Limb[] = []

  constructor(s: Sim) {
    this.s = s
    const n = s.x.length
    this.puff = new Float32Array(n)
    this.wind = new Float32Array(n)
    this.jet = new Float32Array(n)
    this.lunge = new Float32Array(n)
    this.flop = new Float32Array(n)
    this.missing = new Uint8Array(n)
    this.claws = new Int32Array(n * 2).fill(-1)
    this.clawGen = new Uint32Array(n * 2)
    this.clawT = new Float32Array(n)
    this.gripT = new Float32Array(n)
    this.bait = new Int32Array(n).fill(-1)
    this.baitGen = new Uint32Array(n)
    this.baitT = new Float32Array(n)
    this.dx = new Float32Array(n)
    this.dy = new Float32Array(n)
    this.homeX = new Float32Array(n)
    this.homeY = new Float32Array(n)
    this.bitten = new Uint8Array(n)
  }

  reset() {
    for (const a of [this.puff, this.wind, this.jet, this.lunge, this.flop, this.clawT, this.gripT, this.baitT]) a.fill(0)
    this.missing.fill(0)
    this.claws.fill(-1)
    this.bait.fill(-1)
    this.inks.length = this.snaps.length = this.limbs.length = 0
  }

  onSpawn(i: number) {
    this.puff[i] = this.wind[i] = this.jet[i] = this.lunge[i] = this.flop[i] = 0
    this.clawT[i] = this.gripT[i] = this.baitT[i] = this.missing[i] = this.bitten[i] = 0
    this.claws[i * 2] = this.claws[i * 2 + 1] = this.bait[i] = -1
    this.homeX[i] = this.s.x[i]; this.homeY[i] = this.s.y[i]
  }

  carries(i: number, j: number) {
    const s = this.s
    for (let k = i * 2; k < i * 2 + 2; k++) {
      if (this.claws[k] === j && s.alive[j] && s.generation[j] === this.clawGen[k] && s.heldBy[j] === i) return true
    }
    return false
  }

  private drop(k: number) {
    const s = this.s, j = this.claws[k], i = k >> 1
    if (j >= 0 && s.alive[j] && s.generation[j] === this.clawGen[k] && s.heldBy[j] === i) {
      s.heldBy[j] = -1
      s.vx[j] = s.vx[i]; s.vy[j] = s.vy[i]
    }
    this.claws[k] = -1
  }

  private unhook(i: number) {
    const s = this.s, j = this.bait[i]
    if (j >= 0 && s.alive[j] && s.generation[j] === this.baitGen[i]
      && s.lureX[j] === this.homeX[i] && s.lureY[j] === this.homeY[i]) s.lureT[j] = 0
    this.bait[i] = -1
    this.baitT[i] = 0
  }

  interrupt(i: number) {
    this.wind[i] = this.jet[i] = this.lunge[i] = 0
    this.unhook(i)
    this.drop(i * 2); this.drop(i * 2 + 1)
    this.gripT[i] = 0
    // A disabled or grabbed shark returns under the ordinary pond-clamping rule.
    this.flop[i] = 0
  }

  private near(x: number, y: number, r: number, visit: (j: number) => void) {
    const s = this.s
    const x0 = Math.max(0, Math.floor((x - r) / 32)), x1 = Math.min(s.cols - 1, Math.floor((x + r) / 32))
    const y0 = Math.max(0, Math.floor((y - r) / 32)), y1 = Math.min(s.rows - 1, Math.floor((y + r) / 32))
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const c = yy * s.cols + xx
      for (let q = s.cellStart[c]; q < s.cellStart[c + 1]; q++) visit(s.items[q])
    }
  }

  private enemy(i: number, j: number) {
    const s = this.s
    return j >= 0 && !!s.alive[j] && s.team[j] !== s.team[i] && s.stage[j] !== 1
      && s.feignT[j] <= 0 && s.inside[j] < 0 && s.heldBy[j] < 0 && !s.hidden[j] && s.mantises.canTarget(i, j) && !s.spares(i, j)
  }

  onDamage(i: number, dmg: number) {
    const s = this.s, kind = UNITS[s.type[i]].aquatic
    if (!s.alive[i] || dmg <= 0) return
    if (kind === 'puffer' && this.puff[i] < 0.05 && s.canAct(i)) {
      this.puff[i] = 1
      s.pulseT[i] = 0.45
      this.near(s.x[i], s.y[i], 70, (j) => {
        if (!this.enemy(i, j)) return
        const dx = s.x[j] - s.x[i], dy = s.y[j] - s.y[i], d = Math.hypot(dx, dy)
        if (d > 60 + UNITS[s.type[j]].r) return
        s.damage(j, 0, (d ? dx / d : s.face[i]) * 280, (d ? dy / d : 0) * 280, i)
      })
    }
    if (kind === 'axolotl' && dmg >= 12 && this.limbs.length < LIMIT) {
      let bit = 1
      while (bit < 16 && (this.missing[i] & bit)) bit <<= 1
      if (bit >= 16) return
      this.missing[i] |= bit
      const a = Math.log2(bit) * Math.PI / 2 + i
      this.limbs.push({ x: s.x[i] + Math.cos(a) * 24, y: s.y[i] + Math.sin(a) * 24,
        life: 8, owner: i, gen: s.generation[i], bit, side: s.team[i] })
      const limb = this.limbs[this.limbs.length - 1]
      limb.x = Math.max(4, Math.min(s.w - 4, limb.x)); limb.y = Math.max(4, Math.min(s.h - 4, limb.y))
    }
  }

  // These two replace an ordinary attack; the other five still use shared melee hits.
  attack(i: number, t: number, nx: number, ny: number) {
    const s = this.s, def = UNITS[s.type[i]]
    if (def.aquatic === 'shrimp') {
      if (this.wind[i] <= 0) {
        this.wind[i] = 0.6
        this.dx[i] = nx; this.dy[i] = ny
        s.lockOn(i, t)
      }
      return true
    }
    if (def.aquatic !== 'crab') return false
    const slot = this.claws[i * 2] < 0 ? i * 2 : this.claws[i * 2 + 1] < 0 ? i * 2 + 1 : -1
    const gen = s.generation[t], own = s.generation[i]
    s.hit(t, def, nx * def.knock, ny * def.knock, i)
    if (slot >= 0 && s.alive[i] && s.generation[i] === own && this.enemy(i, t) && s.generation[t] === gen
      && !s.isRooted(t) && !UNITS[s.type[t]].squish && !s.isFlying(t) && s.airT[t] <= 0
      && s.effectiveRadius(t) <= s.effectiveRadius(i) * 1.25) {
      s.stopMoves(t)
      this.claws[slot] = t; this.clawGen[slot] = gen
      s.heldBy[t] = i
      this.gripT[i] = 3.6
    }
    return true
  }

  step() {
    const s = this.s
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i]) continue
      this.puff[i] = Math.max(0, this.puff[i] - DT / 3)
      const kind = UNITS[s.type[i]].aquatic
      if (kind && !s.canAct(i)) this.interrupt(i)
      if (kind === 'crab') {
        for (let k = i * 2; k < i * 2 + 2; k++) {
          const j = this.claws[k]
          if (j >= 0 && (!this.carries(i, j) || s.team[j] === s.team[i] || s.isRooted(j))) this.drop(k)
        }
        if (this.gripT[i] > 0 && (this.gripT[i] -= DT) <= 0) { this.drop(i * 2); this.drop(i * 2 + 1) }
      }
    }
    for (let k = this.inks.length - 1; k >= 0; k--) {
      const ink = this.inks[k]
      if ((ink.life -= DT) <= 0) { this.inks.splice(k, 1); continue }
      this.near(ink.x, ink.y, 44, (j) => {
        if (!s.alive[j] || s.team[j] === ink.side || s.stage[j] === 1 || s.inside[j] >= 0 || s.heldBy[j] >= 0
          || UNITS[s.type[j]].building || UNITS[s.type[j]].domain || Math.hypot(s.x[j] - ink.x, s.y[j] - ink.y) > 44) return
        if (s.alive[ink.owner] && s.generation[ink.owner] === ink.gen && !s.mantises.canTarget(ink.owner, j)) return
        s.blindT[j] = Math.max(s.blindT[j], 0.65)
      })
    }
  }

  // Called only after the shared disabled/charmed/blind checks, before ordinary steering.
  steer(i: number, t: number) {
    const s = this.s, def = UNITS[s.type[i]], kind = def.aquatic
    if (!kind) return false
    if (this.wind[i] > 0) {
      if (!s.focusAlive(i)) { this.wind[i] = 0; return true }
      s.vx[i] *= 0.7; s.vy[i] *= 0.7
      if ((this.wind[i] -= DT) <= 0 && this.snaps.length < LIMIT) {
        this.snaps.push({ x: s.x[i] + this.dx[i] * def.r, y: s.y[i] + this.dy[i] * def.r,
          vx: this.dx[i] * 360, vy: this.dy[i] * 360, life: 0.9,
          owner: i, gen: s.generation[i], side: s.team[i], type: s.type[i] })
        s.atkT[i] = 1
      }
      return true
    }
    if (kind === 'octopus') {
      if (this.jet[i] > 0) {
        this.jet[i] = Math.max(0, this.jet[i] - DT)
        const slow = s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1
        s.vx[i] = this.dx[i] * 260 * slow; s.vy[i] = this.dy[i] * 260 * slow
        return true
      }
      if (t >= 0 && s.abilityCd[i] <= 0 && Math.hypot(s.x[t] - s.x[i], s.y[t] - s.y[i]) < 80) {
        if (this.inks.length >= LIMIT) return false
        this.inks.push({ x: s.x[i], y: s.y[i], life: 2.2, side: s.team[i], owner: i, gen: s.generation[i] })
        const away = Math.atan2(s.y[i] - s.y[t], s.x[i] - s.x[t])
        let best = -1, angle = away
        for (let k = 0; k < 12; k++) {
          const a = away + k * Math.PI / 6
          let wet = 0
          for (let d = 4; d <= 92; d += 4) {
            if (!s.inWater(s.x[i] + Math.cos(a) * d, s.y[i] + Math.sin(a) * d)) break
            wet = d
          }
          const score = wet + Math.cos(a - away) * 16
          if (score > best) { best = score; angle = a }
        }
        this.dx[i] = Math.cos(angle); this.dy[i] = Math.sin(angle)
        this.jet[i] = 0.36; s.abilityCd[i] = 5
        return true
      }
    }
    if (kind === 'angler') {
      let j = this.bait[i]
      if (j >= 0 && (!this.enemy(i, j) || s.generation[j] !== this.baitGen[i] || s.isRooted(j)
        || s.airT[j] > 0 || s.shockT[j] > 0 || s.downT[j] > 0 || (this.baitT[i] -= DT) <= 0
        || Math.hypot(s.x[j] - s.x[i], s.y[j] - s.y[i]) > 220)) { this.unhook(i); j = -1 }
      if (j < 0 && s.abilityCd[i] <= 0) {
        let best = 190
        this.near(s.x[i], s.y[i], 190, (v) => {
          if (!this.enemy(i, v) || !s.canAct(v) || s.isFlying(v) || s.isRooted(v) || s.burnT[v] > 0) return
          const d = Math.hypot(s.x[v] - s.x[i], s.y[v] - s.y[i])
          if (d < best) { best = d; j = v }
        })
        if (j >= 0) {
          this.bait[i] = j; this.baitGen[i] = s.generation[j]; this.baitT[i] = 3
          s.abilityCd[i] = 5
        }
      }
      if (j >= 0) {
        const dx = s.x[j] - s.x[i], dy = s.y[j] - s.y[i], d = Math.hypot(dx, dy) || 1
        s.face[i] = dx < 0 ? -1 : 1
        if (d <= def.r + UNITS[s.type[j]].r + def.range) {
          this.unhook(i)
          if (s.cd[i] <= 0) s.attack(i, j, dx / d, dy / d)
        } else {
          s.lureT[j] = 0.2; s.lureX[j] = s.x[i]; s.lureY[j] = s.y[i]
          this.homeX[i] = s.x[i]; this.homeY[i] = s.y[i]
        }
        s.vx[i] *= 0.75; s.vy[i] *= 0.75
        return true
      }
    }
    if (kind === 'crab' && (this.claws[i * 2] >= 0 || this.claws[i * 2 + 1] >= 0)) {
      this.clawT[i] -= DT
      const a = this.claws[i * 2], b = this.claws[i * 2 + 1]
      if (a >= 0 && b >= 0 && this.clawT[i] <= 0) {
        this.clawT[i] = 0.8
        const ga = this.clawGen[i * 2], gb = this.clawGen[i * 2 + 1], own = s.generation[i]
        s.hit(a, def, 0, 0, -1, 0.7, i)
        if (s.alive[i] && s.generation[i] === own && s.alive[b] && s.generation[b] === gb) s.hit(b, def, 0, 0, -1, 0.7, i)
        if (s.alive[a] && s.generation[a] === ga) s.hitT[a] = 1
        s.atkT[i] = 1
      }
      // Sideways shuffle; one empty claw still reaches for a second passenger.
      const slow = s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1
      s.vx[i] += (Math.sin(s.tick * 0.025 + i) * 45 * slow - s.vx[i]) * 0.13
      s.vy[i] += (Math.cos(s.tick * 0.025 + i) * 45 * slow - s.vy[i]) * 0.13
      if (t >= 0 && s.cd[i] <= 0 && Math.hypot(s.x[t] - s.x[i], s.y[t] - s.y[i]) < def.r + UNITS[s.type[t]].r + def.range) {
        const d = Math.hypot(s.x[t] - s.x[i], s.y[t] - s.y[i]) || 1
        s.attack(i, t, (s.x[t] - s.x[i]) / d, (s.y[t] - s.y[i]) / d)
      }
      return true
    }
    if (kind === 'shark') return this.shark(i, t)
    return false
  }

  private shark(i: number, t: number) {
    const s = this.s, def = UNITS[s.type[i]]
    if (this.flop[i] > 0) {
      this.flop[i] = Math.max(0, this.flop[i] - DT)
      const dx = this.homeX[i] - s.x[i], dy = this.homeY[i] - s.y[i], d = Math.hypot(dx, dy) || 1
      s.vx[i] = dx / d * 110; s.vy[i] = dy / d * 110
      if (d < 8 || this.flop[i] <= 0) {
        s.x[i] = this.homeX[i]; s.y[i] = this.homeY[i]
        s.px[i] = s.x[i]; s.py[i] = s.y[i]
        this.flop[i] = 0; s.vx[i] = s.vy[i] = 0
      }
      return true
    }
    if (this.lunge[i] > 0) {
      this.lunge[i] = Math.max(0, this.lunge[i] - DT)
      const slow = s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1
      s.vx[i] = this.dx[i] * 300 * slow; s.vy[i] = this.dy[i] * 300 * slow
      if (!s.inWater(s.x[i], s.y[i]) && Math.hypot(s.x[i] - this.homeX[i], s.y[i] - this.homeY[i]) > 115) this.lunge[i] = 0
      if (this.lunge[i] <= 0) {
        s.vx[i] *= 0.25; s.vy[i] *= 0.25
        if (!s.inWater(s.x[i], s.y[i])) this.flop[i] = 1.6
      }
      return true
    }
    if (t < 0) return false
    const dx = s.x[t] - s.x[i], dy = s.y[t] - s.y[i], d = Math.hypot(dx, dy) || 1
    s.face[i] = dx < 0 ? -1 : 1
    if (s.cd[i] <= 0 && d < 155) {
      this.dx[i] = dx / d; this.dy[i] = dy / d
      this.homeX[i] = s.x[i]; this.homeY[i] = s.y[i]
      this.lunge[i] = 0.42; this.bitten[i] = 0
      s.cd[i] = def.cd
    } else {
      const radial = Math.max(-1, Math.min(1, (d - 80) / 35)), turn = i & 1 ? -1 : 1
      const slow = s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1
      s.vx[i] += (((dx / d * radial - dy / d * turn) * def.speed * slow) - s.vx[i]) * 0.13
      s.vy[i] += (((dy / d * radial + dx / d * turn) * def.speed * slow) - s.vy[i]) * 0.13
    }
    return true
  }

  mayBeach(i: number) { return this.lunge[i] > 0 || this.flop[i] > 0 }

  afterMove() {
    const s = this.s
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i]) continue
      if (this.lunge[i] > 0 && !this.bitten[i] && s.canAct(i)) {
        let victim = -1, best = Infinity
        this.near(s.x[i], s.y[i], 70, (j) => {
          if (!this.enemy(i, j) || s.isFlying(j) || s.airT[j] > 0) return
          const d = Math.hypot(s.x[j] - s.x[i], s.y[j] - s.y[i])
          if (d < UNITS[s.type[i]].r + UNITS[s.type[j]].r + 8 && d < best) { victim = j; best = d }
        })
        if (victim >= 0) {
          this.bitten[i] = 1; s.atkT[i] = 1
          s.hit(victim, UNITS[s.type[i]], this.dx[i] * 130, this.dy[i] * 130, i)
        }
      }
      for (let k = i * 2; k < i * 2 + 2; k++) {
        const j = this.claws[k]
        if (j < 0 || !this.carries(i, j)) continue
        const offset = s.atkT[i] > 0.5 && this.claws[i * 2] >= 0 && this.claws[i * 2 + 1] >= 0 ? 7 : 23
        const r = UNITS[s.type[j]].r
        const x = Math.max(r, Math.min(s.w - r, s.x[i] + (k & 1 ? 1 : -1) * offset))
        const y = Math.max(r, Math.min(s.h - r, s.y[i] - 7))
        if (UNITS[s.type[j]].waterbound) {
          const dx = x - s.x[j], dy = y - s.y[j], steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4))
          let wet = true
          for (let p = 0; p <= steps; p++) if (!s.inWater(s.x[j] + dx * p / steps, s.y[j] + dy * p / steps)) { wet = false; break }
          if (!wet) { this.drop(k); continue }
        }
        s.x[j] = x; s.y[j] = y; s.vx[j] = s.vy[j] = 0
      }
    }
    for (let k = this.snaps.length - 1; k >= 0; k--) {
      const b = this.snaps[k], own = s.alive[b.owner] && s.generation[b.owner] === b.gen && s.team[b.owner] === b.side
      const ox = b.x, oy = b.y
      b.x += b.vx * DT; b.y += b.vy * DT
      let victim = -1, best = Infinity
      this.near(b.x, b.y, 80, (j) => {
        if (!s.alive[j] || s.team[j] === b.side || s.stage[j] === 1 || s.inside[j] >= 0 || s.heldBy[j] >= 0
          || UNITS[s.type[j]].domain
          || (own && (!s.mantises.canTarget(b.owner, j) || s.spares(b.owner, j)))) return
        const dx = b.x - ox, dy = b.y - oy, len = dx * dx + dy * dy
        const u = Math.max(0, Math.min(1, ((s.x[j] - ox) * dx + (s.y[j] - oy) * dy) / (len || 1)))
        if (Math.hypot(s.x[j] - ox - dx * u, s.y[j] - oy - dy * u) < UNITS[s.type[j]].r + 5 && u < best) { victim = j; best = u }
      })
      if (victim >= 0) {
        const gen = s.generation[victim], def = UNITS[b.type]
        s.hit(victim, def, b.vx / 360 * def.knock, b.vy / 360 * def.knock, -1, 1, own ? b.owner : -1)
        if (s.alive[victim] && s.generation[victim] === gen) s.toss(victim, b.vx / 360, b.vy / 360, b.side, 130, 1)
        this.snaps.splice(k, 1)
      } else if ((b.life -= DT) <= 0 || b.x < 0 || b.y < 0 || b.x > s.w || b.y > s.h) this.snaps.splice(k, 1)
    }
    for (let k = this.limbs.length - 1; k >= 0; k--) {
      const limb = this.limbs[k], i = limb.owner
      if (!s.alive[i] || s.generation[i] !== limb.gen || s.team[i] !== limb.side || UNITS[s.type[i]].aquatic !== 'axolotl') {
        this.limbs.splice(k, 1); continue
      }
      let stomped = false
      this.near(limb.x, limb.y, 70, (j) => {
        if (!s.alive[j] || s.team[j] === limb.side || s.stage[j] === 1 || s.heldBy[j] >= 0 || s.inside[j] >= 0
          || s.isFlying(j) || s.airT[j] > 0 || s.leapT[j] > 0 || !s.mantises.canTarget(i, j) || s.spares(i, j)) return
        if (Math.hypot(s.x[j] - limb.x, s.y[j] - limb.y) < UNITS[s.type[j]].r + 3) stomped = true
      })
      let recovered = false
      if (!stomped && s.canAct(i)) {
        const dx = s.x[i] - limb.x, dy = s.y[i] - limb.y, d = Math.hypot(dx, dy)
        if (d < UNITS[s.type[i]].r + 4) recovered = true
        else { limb.x += dx / d * Math.min(d, DT * 24); limb.y += dy / d * Math.min(d, DT * 24) }
      }
      if (stomped || recovered || (limb.life -= DT) <= 0) {
        this.missing[i] &= ~limb.bit
        if (recovered) { s.hp[i] = Math.min(UNITS[s.type[i]].hp, s.hp[i] + 18); s.hitT[i] = 1 }
        this.limbs.splice(k, 1)
      }
    }
  }
}

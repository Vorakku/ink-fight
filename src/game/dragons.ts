import { DT, type Sim } from './sim.ts'
import { UNITS } from './units.ts'

export const DRAGON_MEALS = [0, 3, 8, 15, 25] as const
export const MOLT_T = 2, CAVE_T = 3, DRAGON_EGG_T = 20, DIVE_T = 0.7
export const DRAGON_GROW_T = 60 // seconds for an unfed hatchling to reach adult size
const MEAL_MATURITY = 0.15 // a hatchling's meal advances its growth by 15% of the juvenile period
const BEAM_CHARGE = 1.2, BEAM_SHOW = 0.45, BEAM_RANGE = 620

export class Dragons {
  private s: Sim
  tier: Uint8Array // completed form, also the decoration level of a cave
  home: Int32Array // personal cave, or the cave sheltering an egg
  private homeGen: Uint32Array
  private parent: Int32Array // cave's owner; eggs can survive that owner's death
  private parentGen: Uint32Array
  sleep: Uint8Array
  hatchling: Uint8Array
  maturity: Float32Array // egg-born juvenile progress, 0 at hatching and 1 before evolution is allowed
  caveT: Float32Array
  moltT: Float32Array
  eggT: Float32Array
  diveT: Float32Array
  ray: Uint8Array // 0 ready, 1 charging, 2 showing the released beam
  rayT: Float32Array
  rayX: Float32Array
  rayY: Float32Array
  private tx: Float32Array
  private ty: Float32Array
  private quietT: Float32Array
  private alarmT: Float32Array
  private fireCd: Float32Array
  private stormCd: Float32Array
  private diveCd: Float32Array
  private beamCd: Float32Array
  private laid: Float32Array // spent four-meal credits, never advanced until an egg really exists
  private eggs: Uint16Array
  private chain: Int32Array = new Int32Array(4)
  private dragon: number
  private cave: number
  private egg: number

  constructor(s: Sim) {
    this.s = s
    const n = s.x.length
    this.tier = new Uint8Array(n); this.sleep = new Uint8Array(n); this.hatchling = new Uint8Array(n)
    this.maturity = new Float32Array(n).fill(1)
    this.home = new Int32Array(n).fill(-1); this.homeGen = new Uint32Array(n)
    this.parent = new Int32Array(n).fill(-1); this.parentGen = new Uint32Array(n)
    this.caveT = new Float32Array(n); this.moltT = new Float32Array(n); this.eggT = new Float32Array(n)
    this.diveT = new Float32Array(n); this.ray = new Uint8Array(n); this.rayT = new Float32Array(n)
    this.rayX = new Float32Array(n); this.rayY = new Float32Array(n)
    this.tx = new Float32Array(n); this.ty = new Float32Array(n)
    this.quietT = new Float32Array(n); this.alarmT = new Float32Array(n)
    this.fireCd = new Float32Array(n); this.stormCd = new Float32Array(n)
    this.diveCd = new Float32Array(n); this.beamCd = new Float32Array(n)
    this.laid = new Float32Array(n); this.eggs = new Uint16Array(n)
    this.dragon = UNITS.findIndex((u) => u.dragon)
    this.cave = UNITS.findIndex((u) => u.lair)
    this.egg = UNITS.findIndex((u) => u.dragonEgg)
  }

  reset() {
    this.home.fill(-1); this.parent.fill(-1)
    this.maturity.fill(1)
    for (const a of [this.tier, this.sleep, this.hatchling, this.caveT, this.moltT, this.eggT, this.diveT,
      this.ray, this.rayT, this.rayX, this.rayY, this.tx, this.ty, this.quietT, this.alarmT,
      this.fireCd, this.stormCd, this.diveCd, this.beamCd, this.laid, this.eggs]) a.fill(0)
  }

  onSpawn(i: number) {
    this.home[i] = this.parent[i] = -1
    this.homeGen[i] = this.parentGen[i] = 0
    this.tier[i] = this.sleep[i] = this.hatchling[i] = this.ray[i] = this.eggs[i] = 0
    this.maturity[i] = 1 // painted dragons begin as adults; hatching explicitly starts a juvenile
    this.caveT[i] = this.moltT[i] = this.eggT[i] = this.diveT[i] = this.rayT[i] = 0
    this.rayX[i] = this.rayY[i] = this.tx[i] = this.ty[i] = this.quietT[i] = this.alarmT[i] = 0
    this.fireCd[i] = this.stormCd[i] = this.diveCd[i] = this.beamCd[i] = this.laid[i] = 0
  }

  validHome(i: number) {
    const s = this.s, h = this.home[i]
    return h >= 0 && !!s.alive[h] && !!UNITS[s.type[h]].lair && s.generation[h] === this.homeGen[i]
      && s.team[h] === s.team[i] && s.w >= 72 && s.h >= 72
  }

  private juvenileScale(i: number) {
    return this.hatchling[i] ? 0.45 + this.maturity[i] * 0.55 : 1
  }

  onMeal(i: number) {
    if (UNITS[this.s.type[i]].dragon && this.hatchling[i]) this.maturity[i] = Math.min(1, this.maturity[i] + MEAL_MATURITY)
  }

  bodyScale(i: number) {
    return this.juvenileScale(i) * (1 + this.tier[i] * 0.08)
  }

  vitality(i: number) {
    return this.juvenileScale(i) * (1 + this.tier[i] * 0.25)
  }

  power(i: number) {
    return this.juvenileScale(i) * (1 + this.tier[i] * 0.15)
  }

  flying(i: number) {
    return this.tier[i] >= 3 && !this.sleep[i] && this.moltT[i] <= 0
  }

  look(i: number) {
    return this.tier[i] < 4 ? this.tier[i] : 4 + Math.floor(this.s.tick / 90) % 6
  }

  interrupt(i: number) {
    this.sleep[i] = this.ray[i] = 0
    this.moltT[i] = this.diveT[i] = this.rayT[i] = this.quietT[i] = 0
  }

  onDamage(i: number, by: number) {
    const s = this.s, def = UNITS[s.type[i]]
    let dragon = def.dragon ? i : -1
    if (def.lair) {
      const p = this.parent[i]
      if (p >= 0 && s.alive[p] && s.generation[p] === this.parentGen[i] && UNITS[s.type[p]].dragon) dragon = p
    }
    if (dragon < 0) return
    this.interrupt(dragon)
    this.alarmT[dragon] = 5
    if (by >= 0 && s.alive[by] && s.team[by] !== s.team[dragon]) s.target[dragon] = by
  }

  onRemove(i: number) {
    const s = this.s, def = UNITS[s.type[i]], h = this.home[i]
    if (def.lair) {
      for (let j = 0; j < s.n; j++) if (s.alive[j] && this.home[j] === i && this.homeGen[j] === s.generation[i]) {
        this.home[j] = -1
        this.interrupt(j)
        if (UNITS[s.type[j]].dragonEgg) s.damage(j, Infinity, 0, 0)
      }
      this.eggs[i] = 0; this.parent[i] = -1
    } else if (def.dragon && this.validHome(i) && this.parent[h] === i && this.parentGen[h] === s.generation[i]) this.parent[h] = -1
    else if (def.dragonEgg && this.validHome(i) && this.eggs[h] > 0) this.eggs[h]--
    this.home[i] = -1
    this.interrupt(i)
  }

  private enemy(i: number, j: number) {
    const s = this.s
    return j >= 0 && !!s.alive[j] && s.team[j] !== s.team[i] && s.stage[j] !== 1 && s.inside[j] < 0
      && s.heldBy[j] < 0 && !s.hidden[j] && s.feignT[j] <= 0 && s.mantises.canTarget(i, j) && !s.spares(i, j)
  }

  private nearest(i: number, x: number, y: number, radius: number, used = 0) {
    const s = this.s
    const x0 = Math.max(0, Math.floor((x - radius) / 32)), x1 = Math.min(s.cols - 1, Math.floor((x + radius) / 32))
    const y0 = Math.max(0, Math.floor((y - radius) / 32)), y1 = Math.min(s.rows - 1, Math.floor((y + radius) / 32))
    let best = -1, distance = radius * radius
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const cell = yy * s.cols + xx
      for (let q = s.cellStart[cell]; q < s.cellStart[cell + 1]; q++) {
        const j = s.items[q]
        if (!this.enemy(i, j)) continue
        let seen = false
        for (let k = 0; k < used; k++) if (this.chain[k] === j) seen = true
        if (seen) continue
        const d = (s.x[j] - x) ** 2 + (s.y[j] - y) ** 2
        if (d < distance) { best = j; distance = d }
      }
    }
    return best
  }

  private chooseHome(i: number) {
    const s = this.s, margin = 36
    if (s.w < margin * 2 || s.h < margin * 2) return
    for (let k = 0; k < 80; k++) {
      const a = k * 2.4 + i, r = k ? 40 + Math.floor((k - 1) / 16) * 20 : 0
      const x = Math.min(s.w - margin, Math.max(margin, s.x[i] + Math.cos(a) * r))
      const y = Math.min(s.h - margin, Math.max(margin, s.y[i] + Math.sin(a) * r))
      if (Math.hypot(x - s.x[i], y - s.y[i]) > 120) continue
      let clear = true
      for (let dx = -28; dx <= 28 && clear; dx += 7) for (let dy = -28; dy <= 28; dy += 7)
        if (s.inWater(x + dx, y + dy) || s.inBush(x + dx, y + dy)) { clear = false; break }
      if (!clear) continue
      for (let j = 0; j < s.n; j++) if (s.alive[j] && UNITS[s.type[j]].building
        && Math.hypot(x - s.x[j], y - s.y[j]) < UNITS[s.type[j]].r + margin) { clear = false; break }
      if (!clear) continue
      const h = s.spawn(this.cave, x, y, s.team[i])
      if (h < 0) return
      this.home[i] = h; this.homeGen[i] = s.generation[h]
      this.parent[h] = i; this.parentGen[h] = s.generation[i]
      this.tier[h] = this.tier[i]
      return
    }
  }

  private move(i: number, x: number, y: number) {
    const s = this.s, dx = x - s.x[i], dy = y - s.y[i], d = Math.hypot(dx, dy)
    if (d < 12) { s.vx[i] = s.vy[i] = 0; return true }
    const speed = (s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1) * UNITS[s.type[i]].speed
    s.vx[i] = dx / d * speed; s.vy[i] = dy / d * speed
    s.face[i] = dx >= 0 ? 1 : -1
    s.phase[i] += speed * DT * 0.12
    return false
  }

  step() {
    const s = this.s
    this.eggs.fill(0)
    for (let i = 0; i < s.n; i++) if (s.alive[i]) {
      if (UNITS[s.type[i]].dragon && this.hatchling[i] && this.maturity[i] < 1) {
        const oldMax = s.maxHp(i)
        const next = this.maturity[i] + DT / DRAGON_GROW_T
        this.maturity[i] = next >= 1 - DT / DRAGON_GROW_T * 0.5 ? 1 : next
        const max = s.maxHp(i)
        s.hp[i] = Math.min(max, s.hp[i] + max - oldMax) // growth adds capacity while preserving existing wounds
      }
      if (UNITS[s.type[i]].dragonEgg && this.validHome(i)) this.eggs[this.home[i]]++
      this.fireCd[i] = Math.max(0, this.fireCd[i] - DT)
      this.stormCd[i] = Math.max(0, this.stormCd[i] - DT)
      this.diveCd[i] = Math.max(0, this.diveCd[i] - DT)
      this.beamCd[i] = Math.max(0, this.beamCd[i] - DT)
      this.alarmT[i] = Math.max(0, this.alarmT[i] - DT)
    }
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i] || !UNITS[s.type[i]].dragonEgg) continue
      if (!this.validHome(i)) { s.damage(i, Infinity, 0, 0); continue }
      const h = this.home[i]
      if (this.caveT[h] < CAVE_T) continue
      this.eggT[i] = Math.min(DRAGON_EGG_T, this.eggT[i] + DT)
      if (this.eggT[i] < DRAGON_EGG_T - DT * 0.5) continue
      const parent = this.parent[h]
      const exit = parent >= 0 && s.alive[parent] && s.generation[parent] === this.parentGen[h]
        ? Math.max(65, s.effectiveRadius(parent) + 45) : 65 // leave room for a fully grown boss at the entrance
      for (let k = 0; k < 12; k++) {
        const a = k * Math.PI / 6, x = s.x[h] + Math.cos(a) * exit, y = s.y[h] + Math.sin(a) * exit
        if (x < 20 || y < 20 || x > s.w - 20 || y > s.h - 20 || s.inWater(x, y)) continue
        let clear = true
        for (let j = 0; j < s.n; j++) if (s.alive[j] && j !== i && Math.hypot(s.x[j] - x, s.y[j] - y) < s.effectiveRadius(j) + 10) { clear = false; break }
        if (!clear) continue
        const child = s.spawn(this.dragon, x, y, s.team[i])
        if (child < 0) break // page full: keep the incubated egg intact
        this.hatchling[child] = 1
        this.maturity[child] = 0
        s.hp[child] = s.maxHp(child)
        s.damage(i, Infinity, 0, 0)
        break
      }
    }
  }

  private lay(i: number, h: number) {
    const s = this.s
    if (this.tier[i] < 4 || this.eggs[h] >= 2 || Math.floor((s.meals[i] - 25) / 4) <= this.laid[i]) return
    const side = this.eggs[h] ? 1 : -1
    const egg = s.spawn(this.egg, s.x[h] + side * 12, s.y[h] + 8, s.team[i])
    if (egg < 0) return
    this.home[egg] = h; this.homeGen[egg] = s.generation[h]
    this.eggs[h]++; this.laid[i]++
    s.atkT[i] = 1
  }

  private blast(x: number, y: number, radius: number, type: number, team: number, by: number, mult: number, explosion = false) {
    const s = this.s, def = UNITS[type]
    const x0 = Math.max(0, Math.floor((x - radius) / 32)), x1 = Math.min(s.cols - 1, Math.floor((x + radius) / 32))
    const y0 = Math.max(0, Math.floor((y - radius) / 32)), y1 = Math.min(s.rows - 1, Math.floor((y + radius) / 32))
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const cell = yy * s.cols + xx
      for (let q = s.cellStart[cell]; q < s.cellStart[cell + 1]; q++) {
        const j = s.items[q]
        if (!s.alive[j] || s.team[j] === team || s.stage[j] === 1 || s.inside[j] >= 0 || s.heldBy[j] >= 0) continue
        const dx = s.x[j] - x, dy = s.y[j] - y, d = Math.hypot(dx, dy) || 1
        if (d < radius + UNITS[s.type[j]].r) s.hit(j, def, dx / d * 150, dy / d * 150, -1, mult, by, explosion)
      }
    }
  }

  explode(p: number) {
    const s = this.s, by = s.owner(p)
    this.blast(s.pX[p], s.pY[p], 42, s.pType[p], s.pTeam[p], by, 8, true)
    s.impact(s.pX[p], s.pY[p], 42)
  }

  private lightning(i: number, t: number) {
    const s = this.s, def = UNITS[s.type[i]]
    let x = s.x[i], y = s.y[i], victim = t
    for (let k = 0; k < 4 && victim >= 0; k++) {
      const gen = s.generation[victim], vx = s.x[victim], vy = s.y[victim]
      this.chain[k] = victim
      s.bolt(x, y, vx, vy)
      s.hit(victim, def, 0, 0, -1, 4, i)
      if (s.alive[victim] && s.generation[victim] === gen && !UNITS[s.type[victim]].building) s.shockT[victim] = 0.45
      x = vx; y = vy
      victim = this.nearest(i, x, y, 100, k + 1)
    }
    s.atkT[i] = 1
  }

  private beam(i: number) {
    const s = this.s, def = UNITS[s.type[i]], nx = this.rayX[i], ny = this.rayY[i]
    for (let j = 0; j < s.n; j++) {
      if (!this.enemy(i, j)) continue
      const dx = s.x[j] - s.x[i], dy = s.y[j] - s.y[i], along = dx * nx + dy * ny
      if (along >= 0 && along <= BEAM_RANGE && Math.abs(dx * ny - dy * nx) < 14 + UNITS[s.type[j]].r)
        s.hit(j, def, nx * 220, ny * 220, -1, 18, i)
    }
  }

  steer(i: number, t: number) {
    const s = this.s
    if (!UNITS[s.type[i]].dragon) return false
    if (this.ray[i]) {
      this.rayT[i] = Math.max(0, this.rayT[i] - DT)
      s.vx[i] = s.vy[i] = 0
      if (this.rayT[i] <= DT * 0.5) {
        if (this.ray[i] === 1) { this.ray[i] = 2; this.rayT[i] = BEAM_SHOW; this.beam(i) }
        else this.ray[i] = 0
      }
      return true
    }
    if (this.diveT[i] > 0) {
      this.diveT[i] = Math.max(0, this.diveT[i] - DT)
      if (this.diveT[i] <= DT * 0.5) {
        this.diveT[i] = 0
        s.x[i] = this.tx[i]; s.y[i] = this.ty[i]; s.vx[i] = s.vy[i] = 0
        this.blast(s.x[i], s.y[i], 60, s.type[i], s.team[i], i, 7)
        s.impact(s.x[i], s.y[i], 60)
      }
      return true
    }
    const enemy = this.enemy(i, t), distance = enemy ? Math.hypot(s.x[t] - s.x[i], s.y[t] - s.y[i]) : Infinity
    const threat = this.nearest(i, s.x[i], s.y[i], 180)
    if (threat >= 0 || this.alarmT[i] > 0) {
      this.sleep[i] = 0; this.moltT[i] = this.quietT[i] = 0
    } else this.quietT[i] += DT

    if (enemy && !this.sleep[i] && this.moltT[i] <= 0) {
      const dx = s.x[t] - s.x[i], dy = s.y[t] - s.y[i], d = distance || 1
      if (this.tier[i] >= 4 && distance < BEAM_RANGE && this.beamCd[i] <= 0) {
        this.ray[i] = 1; this.rayT[i] = BEAM_CHARGE
        this.rayX[i] = dx / d; this.rayY[i] = dy / d; this.beamCd[i] = 10
        s.face[i] = dx >= 0 ? 1 : -1
        s.vx[i] = s.vy[i] = 0
        return true
      }
      if (this.tier[i] >= 3 && distance > 80 && distance < 280 && this.diveCd[i] <= 0) {
        this.tx[i] = Math.min(s.w - 16, Math.max(16, s.x[t])); this.ty[i] = Math.min(s.h - 16, Math.max(16, s.y[t]))
        this.diveT[i] = DIVE_T; this.diveCd[i] = 8
        s.vx[i] = (this.tx[i] - s.x[i]) / DIVE_T; s.vy[i] = (this.ty[i] - s.y[i]) / DIVE_T
        return true
      }
      if (this.tier[i] >= 2 && distance < 300 && this.stormCd[i] <= 0) { this.lightning(i, t); this.stormCd[i] = 5 }
      if (this.tier[i] >= 1 && distance < 420 && this.fireCd[i] <= 0 && s.fireball(i, Math.atan2(dy, dx))) this.fireCd[i] = 3.5
    }
    if (threat >= 0 || this.alarmT[i] > 0) return false
    const next = this.maturity[i] >= 1 && this.tier[i] < 4 && s.meals[i] >= DRAGON_MEALS[this.tier[i] + 1]
    if (!this.validHome(i)) {
      this.home[i] = -1; this.sleep[i] = 0; this.moltT[i] = 0
      if ((this.tier[i] > 0 || next) && this.quietT[i] >= 1 && (s.tick + i) % 30 === 0) this.chooseHome(i)
      if (!this.validHome(i)) return false
    }
    const h = this.home[i]
    if (this.caveT[h] < CAVE_T || next || distance > 350) {
      if (!this.move(i, s.x[h] + 5, s.y[h] + 12)) { this.sleep[i] = 0; return true }
      if (this.caveT[h] < CAVE_T) {
        this.caveT[h] = Math.min(CAVE_T, this.caveT[h] + DT)
        s.atkT[i] = 0.3
        return true
      }
      if (next) {
        this.sleep[i] = 0
        if (this.moltT[i] <= 0) this.moltT[i] = MOLT_T
        else if ((this.moltT[i] -= DT) <= DT * 0.5) {
          this.moltT[i] = 0
          this.tier[i]++; this.tier[h] = this.tier[i]
          s.hp[i] = s.maxHp(i); s.hitT[i] = 1
        }
        return true
      }
      this.lay(i, h)
      if (this.quietT[i] >= 2) {
        this.sleep[i] = 1
        s.hp[i] = Math.min(s.maxHp(i), s.hp[i] + s.maxHp(i) * 0.03 * DT)
      }
      return true
    }
    this.sleep[i] = 0
    return false
  }
}

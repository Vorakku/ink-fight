import { DT, type Sim } from './sim.ts'
import { UNITS } from './units.ts'

export class Spiders {
  private s: Sim
  home: Int32Array
  nestT: Float32Array
  cocoons: Uint8Array
  birthT: Float32Array
  webT: Float32Array
  windT: Float32Array
  jumpT: Float32Array
  mount: Int32Array
  clingT: Float32Array
  wrapT: Float32Array
  body: Int32Array
  weaving: Uint8Array
  private homeGen: Uint32Array
  private mountGen: Uint32Array
  private bodyGen: Uint32Array
  private builder: Int32Array
  private wrapper: Int32Array
  private quietT: Float32Array
  private jobT: Float32Array
  private biteT: Float32Array
  private dragging: Uint8Array

  constructor(s: Sim) {
    this.s = s
    const n = s.x.length
    this.home = new Int32Array(n).fill(-1)
    this.mount = new Int32Array(n).fill(-1)
    this.body = new Int32Array(n).fill(-1)
    this.builder = new Int32Array(n).fill(-1)
    this.wrapper = new Int32Array(n).fill(-1)
    this.homeGen = new Uint32Array(n)
    this.mountGen = new Uint32Array(n)
    this.bodyGen = new Uint32Array(n)
    this.nestT = new Float32Array(n)
    this.cocoons = new Uint8Array(n)
    this.birthT = new Float32Array(n)
    this.webT = new Float32Array(n)
    this.windT = new Float32Array(n)
    this.jumpT = new Float32Array(n)
    this.clingT = new Float32Array(n)
    this.wrapT = new Float32Array(n)
    this.weaving = new Uint8Array(n)
    this.quietT = new Float32Array(n)
    this.jobT = new Float32Array(n)
    this.biteT = new Float32Array(n)
    this.dragging = new Uint8Array(n)
  }

  reset() {
    for (const a of [this.home, this.mount, this.body, this.builder, this.wrapper]) a.fill(-1)
    for (const a of [this.nestT, this.cocoons, this.birthT, this.webT, this.windT, this.jumpT, this.clingT,
      this.wrapT, this.weaving, this.quietT, this.jobT, this.biteT, this.dragging]) a.fill(0)
  }

  onSpawn(i: number) {
    this.home[i] = this.mount[i] = this.body[i] = this.builder[i] = this.wrapper[i] = -1
    this.nestT[i] = this.cocoons[i] = this.birthT[i] = this.webT[i] = this.windT[i] = this.jumpT[i] = 0
    this.clingT[i] = this.wrapT[i] = this.weaving[i] = this.quietT[i] = this.jobT[i] = this.biteT[i] = this.dragging[i] = 0
  }

  private validHome(i: number) {
    const s = this.s, h = this.home[i]
    return h >= 0 && !!s.alive[h] && UNITS[s.type[h]].bug === 'nest'
      && s.generation[h] === this.homeGen[i] && s.team[h] === s.team[i]
      && s.w >= (UNITS[s.type[h]].r + 20) * 2 && s.h >= (UNITS[s.type[h]].r + 20) * 2
  }

  private target(i: number, t: number) {
    const s = this.s
    return t >= 0 && !!s.alive[t] && s.team[t] !== s.team[i] && s.stage[t] !== 1
      && s.heldBy[t] < 0 && s.inside[t] < 0 && !s.hidden[t] && s.mantises.canTarget(i, t)
  }

  private mountedTarget(i: number) {
    const s = this.s, t = this.mount[i]
    return this.target(i, t) && s.generation[t] === this.mountGen[i] && s.airT[t] <= 0
  }

  private detach(i: number) {
    this.windT[i] = this.jumpT[i] = this.clingT[i] = 0
    this.mount[i] = -1
    this.s.vx[i] *= 0.3; this.s.vy[i] *= 0.3
  }

  releaseBody(k: number) {
    const s = this.s, i = s.cSpider[k]
    if (i >= 0 && this.body[i] === k) {
      const h = this.home[i]
      if (h >= 0 && this.wrapper[h] === i) this.wrapper[h] = -1
      this.body[i] = -1
      this.wrapT[i] = this.dragging[i] = this.jobT[i] = 0
    }
    s.cSpider[k] = -1
  }

  interrupt(i: number) {
    const s = this.s, h = this.home[i]
    if (this.body[i] >= 0) s.dropBody(this.body[i])
    if (h >= 0 && this.builder[h] === i) this.builder[h] = -1
    if (h >= 0 && this.wrapper[h] === i) this.wrapper[h] = -1
    this.weaving[i] = this.quietT[i] = 0
    if (this.mount[i] >= 0) this.detach(i)
  }

  onRemove(i: number) {
    const s = this.s
    this.interrupt(i)
    if (UNITS[s.type[i]].bug === 'nest') {
      for (let j = 0; j < s.n; j++) if (this.home[j] === i) {
        this.interrupt(j)
        this.home[j] = -1
      }
      this.nestT[i] = this.cocoons[i] = this.birthT[i] = 0
      this.builder[i] = this.wrapper[i] = -1
    }
    for (let j = 0; j < s.n; j++) if (this.mount[j] === i) this.detach(j)
  }

  step() {
    const s = this.s
    this.weaving.fill(0)
    for (let i = 0; i < s.n; i++) {
      this.webT[i] = Math.max(0, this.webT[i] - DT)
      if (!s.alive[i]) continue
      if (UNITS[s.type[i]].bug === 'nest') {
        if (this.builder[i] >= 0 && (!s.canAct(this.builder[i]) || this.home[this.builder[i]] !== i)) this.builder[i] = -1
        if (this.cocoons[i] >= 5 && this.nestT[i] >= 3) {
          this.birthT[i] = Math.min(0.8, this.birthT[i] + DT)
          if (this.birthT[i] >= 0.8 && s.tick % 15 === 0) this.hatch(i)
        }
      } else if (UNITS[s.type[i]].bug === 'spider' && this.home[i] >= 0 && !this.validHome(i)) {
        this.interrupt(i)
        this.home[i] = -1
      }
    }
  }

  private hatch(h: number) {
    const s = this.s, type = UNITS.findIndex((u) => u.bug === 'spider'), r = UNITS[s.type[h]].r + UNITS[type].r + 8
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6, x = s.x[h] + Math.cos(a) * r, y = s.y[h] + Math.sin(a) * r
      if (x < 8 || y < 8 || x > s.w - 8 || y > s.h - 8 || s.inWater(x, y)) continue
      let clear = true
      for (let j = 0; j < s.n; j++) if (s.alive[j] && s.inside[j] < 0 && s.heldBy[j] < 0
        && Math.hypot(s.x[j] - x, s.y[j] - y) < UNITS[s.type[j]].r + UNITS[type].r) { clear = false; break }
      if (!clear) continue
      const child = s.spawn(type, x, y, s.team[h])
      if (child >= 0) {
        this.cocoons[h] -= 5
        this.birthT[h] = 0
        this.home[child] = h
        this.homeGen[child] = s.generation[h]
        s.atkT[h] = 1
      }
      return // full pages retain all five cocoons and their pending brood
    }
  }

  private move(i: number, x: number, y: number, speed = UNITS[this.s.type[i]].speed) {
    const s = this.s, dx = x - s.x[i], dy = y - s.y[i], d = Math.hypot(dx, dy) || 1
    const slow = s.slowT[i] > 0 || this.webT[i] > 0 ? 0.4 : 1
    const wet = s.inWater(s.x[i], s.y[i]) ? 0.5 : 1
    const pace = d < 4 ? 0 : Math.min(speed * slow * wet, d / DT)
    s.vx[i] += (dx / d * pace - s.vx[i]) * 0.2
    s.vy[i] += (dy / d * pace - s.vy[i]) * 0.2
    if (Math.abs(dx) > 1) s.face[i] = dx > 0 ? 1 : -1
    s.phase[i] += Math.hypot(s.vx[i], s.vy[i]) * DT * 0.15
    return d
  }

  private chooseHome(i: number) {
    const s = this.s
    const type = UNITS.findIndex((u) => u.bug === 'nest'), margin = UNITS[type].r + 20
    if (s.w < margin * 2 || s.h < margin * 2) return
    let best = -1, distance = 180
    for (let j = 0; j < s.n; j++) if (s.alive[j] && UNITS[s.type[j]].bug === 'nest' && s.team[j] === s.team[i]) {
      const d = Math.hypot(s.x[j] - s.x[i], s.y[j] - s.y[i])
      if (d < distance) { distance = d; best = j }
    }
    if (best < 0) {
      for (let k = 0; k < 24; k++) {
        const a = k * 2.4, r = k ? 30 + Math.floor(k / 8) * 24 : 0
        const x = Math.min(s.w - margin, Math.max(margin, s.x[i] + Math.cos(a) * r))
        const y = Math.min(s.h - margin, Math.max(margin, s.y[i] + Math.sin(a) * r))
        let clear = true
        for (let dx = -24; dx <= 24 && clear; dx += 8) for (let dy = -24; dy <= 24; dy += 8)
          if (s.inWater(x + dx, y + dy) || s.inBush(x + dx, y + dy)) { clear = false; break }
        if (!clear) continue
        for (let j = 0; j < s.n; j++) if (s.alive[j] && UNITS[s.type[j]].building
          && Math.hypot(s.x[j] - x, s.y[j] - y) < UNITS[s.type[j]].r + margin) { clear = false; break }
        if (clear) { best = s.spawn(type, x, y, s.team[i]); break }
      }
    }
    if (best >= 0) { this.home[i] = best; this.homeGen[i] = s.generation[best] }
  }

  private claimBody(i: number) {
    const s = this.s
    let best = -1, distance = 640 * 640
    // shortcut: idle spiders scan the bounded body store; index corpses spatially if giant scavenger battles stutter
    for (let k = 0; k < s.cn; k++) {
      if (!s.cAlive[k] || s.cHome[k] >= 0 || s.cSpider[k] >= 0 || s.cEnter[k] > 0
        || s.cTeam[k] === s.team[i] || !UNITS[s.cType[k]].prey) continue
      const d = (s.cX[k] - s.x[i]) ** 2 + (s.cY[k] - s.y[i]) ** 2
      if (d < distance) { distance = d; best = k }
    }
    if (best >= 0) {
      s.cSpider[best] = i
      this.body[i] = best
      this.bodyGen[i] = s.cGeneration[best]
      this.wrapT[i] = this.jobT[i] = this.dragging[i] = 0
    }
  }

  private validBody(i: number) {
    const s = this.s, k = this.body[i]
    return k >= 0 && !!s.cAlive[k] && s.cGeneration[k] === this.bodyGen[i] && s.cSpider[k] === i
      && this.validHome(i) && this.nestT[this.home[i]] >= 3 && this.cocoons[this.home[i]] < 5
  }

  private collect(i: number) {
    const s = this.s, k = this.body[i], h = this.home[i]
    if (!this.validBody(i) || (this.jobT[i] += DT) > 20) { s.dropBody(k); return }
    const dx = s.x[h] - s.cX[k], dy = s.y[h] + 10 - s.cY[k], d = Math.hypot(dx, dy) || 1
    const grip = Math.max(12, UNITS[s.cType[k]].r * s.cSize[k]) + 10
    if (d < UNITS[s.type[h]].r + 12) {
      const a = i * 2.4
      const wx = Math.min(s.w - 8, Math.max(8, s.cX[k] + Math.cos(a) * grip))
      const wy = Math.min(s.h - 8, Math.max(8, s.cY[k] + Math.sin(a) * grip))
      if (this.move(i, wx, wy) > 12) return
      if (this.wrapper[h] >= 0 && this.wrapper[h] !== i) return
      s.vx[i] = s.vy[i] = 0
      this.wrapper[h] = i
      this.dragging[i] = 2
      this.weaving[i] = 1
      this.wrapT[i] += DT
      s.phase[i] += DT * 18
      if (this.wrapT[i] >= 2) {
        s.dropBody(k, true)
        this.cocoons[h]++
      }
      return
    }
    const gx = Math.min(s.w - 8, Math.max(8, s.cX[k] + dx / d * grip))
    const gy = Math.min(s.h - 8, Math.max(8, s.cY[k] + dy / d * grip))
    const distance = this.move(i, gx, gy)
    if (distance < 12) this.dragging[i] = 1
    s.face[i] = s.cX[k] > s.x[i] ? 1 : -1
  }

  private pounce(i: number) {
    const s = this.s, t = this.mount[i]
    if (this.windT[i] > 0) {
      s.vx[i] *= 0.6; s.vy[i] *= 0.6
      this.windT[i] = Math.max(0, this.windT[i] - DT)
      if (this.windT[i] <= 0) {
        if (!this.mountedTarget(i)) { this.detach(i); return }
        this.jumpT[i] = 0.3
        s.vx[i] = (s.x[t] - s.x[i]) / 0.3
        s.vy[i] = (s.y[t] - s.y[i]) / 0.3
      }
    } else if (this.jumpT[i] > 0) {
      this.jumpT[i] = Math.max(0, this.jumpT[i] - DT)
      if (this.jumpT[i] <= 0) {
        s.vx[i] = s.vy[i] = 0
        if (!this.mountedTarget(i) || Math.hypot(s.x[t] - s.x[i], s.y[t] - s.y[i]) > s.effectiveRadius(t) + s.effectiveRadius(i) + 14) { this.detach(i); return }
        s.atkT[i] = 1
        s.hit(t, UNITS[s.type[i]], 0, 0, i)
        if (!s.alive[i] || !this.mountedTarget(i) || s.effectiveRadius(t) < s.effectiveRadius(i) * 0.65) { this.detach(i); return }
        this.clingT[i] = 0.9
        this.biteT[i] = 0.3
      }
    } else if (this.clingT[i] > 0) {
      if (!this.mountedTarget(i)) { this.detach(i); return }
      this.clingT[i] = Math.max(0, this.clingT[i] - DT)
      this.biteT[i] -= DT
      s.vx[i] = s.vy[i] = 0
      if (this.clingT[i] <= 0) {
        this.detach(i)
        s.vx[i] = -s.face[i] * 90; s.vy[i] = 25
        s.cd[i] = Math.max(s.cd[i], 0.3)
      } else if (this.biteT[i] <= 0) {
        this.biteT[i] = 0.3
        s.atkT[i] = 1
        s.hit(t, UNITS[s.type[i]], 0, 0, i)
      }
    }
  }

  steer(i: number, t: number) {
    const s = this.s, def = UNITS[s.type[i]]
    if (def.bug !== 'spider' || !s.canAct(i)) return false
    if (this.mount[i] >= 0) { this.pounce(i); return true }
    const distance = this.target(i, t) ? Math.hypot(s.x[t] - s.x[i], s.y[t] - s.y[i]) : Infinity
    if (distance <= def.range) {
      this.quietT[i] = this.weaving[i] = 0
      if (this.body[i] >= 0) s.dropBody(this.body[i])
      const h = this.home[i]
      if (h >= 0 && this.builder[h] === i) this.builder[h] = -1
      const enemy = UNITS[s.type[t]], dx = s.x[t] - s.x[i], dy = s.y[t] - s.y[i], d = distance || 1
      s.face[i] = dx >= 0 ? 1 : -1
      const canMount = !enemy.building && !enemy.flies && !enemy.waterbound && s.airT[t] <= 0
      if (distance < 100 && canMount && s.abilityCd[i] <= 0) {
        this.mount[i] = t
        this.mountGen[i] = s.generation[t]
        this.windT[i] = 0.15
        s.abilityCd[i] = 3.2
        s.vx[i] *= 0.4; s.vy[i] *= 0.4
      } else {
        s.vx[i] *= 0.8; s.vy[i] *= 0.8
        if (s.cd[i] <= 0) {
          if (distance < def.r + enemy.r + 6) {
            s.cd[i] = 0.45; s.atkT[i] = 1
            s.hit(t, def, dx / d * def.knock, dy / d * def.knock, i)
          } else s.attack(i, t, dx / d, dy / d)
        }
      }
      return true
    }
    this.quietT[i] += DT
    if (this.quietT[i] < 0.75) { s.vx[i] *= 0.8; s.vy[i] *= 0.8; return true }
    if (!this.validHome(i)) {
      this.home[i] = -1
      if ((s.tick + i) % 30 === 0) this.chooseHome(i)
    }
    if (!this.validHome(i)) { s.vx[i] *= 0.8; s.vy[i] *= 0.8; return true }
    const h = this.home[i]
    if (this.nestT[h] < 3) {
      if (this.builder[h] < 0) this.builder[h] = i
      if (this.builder[h] === i) {
        if (this.move(i, s.x[h] + 5, s.y[h] + 12) < 15) {
          this.weaving[i] = 1
          this.nestT[h] = Math.min(3, this.nestT[h] + DT)
          s.phase[i] += DT * 12
        }
      } else this.move(i, s.x[h] + Math.cos(i * 2.4) * 40, s.y[h] + Math.sin(i * 2.4) * 40)
      return true
    }
    if (this.body[i] >= 0) { this.collect(i); return true }
    if (this.cocoons[h] < 5 && (s.tick + i) % 15 === 0) this.claimBody(i)
    if (this.body[i] >= 0) this.collect(i)
    else {
      if (this.move(i, s.x[h] + Math.cos(i * 2.4) * 32, s.y[h] + Math.sin(i * 2.4) * 32) < 10) this.weaving[i] = 1
    }
    return true
  }

  afterStep() {
    const s = this.s
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i] || UNITS[s.type[i]].bug !== 'spider') continue
      if (this.clingT[i] > 0 && this.mountedTarget(i) && s.canAct(i)) {
        const t = this.mount[i]
        s.x[i] = Math.min(s.w - 8, Math.max(8, s.x[t] - s.face[t] * Math.min(8, s.effectiveRadius(t) * 0.3)))
        s.y[i] = Math.max(8, s.y[t] - Math.min(12, s.effectiveRadius(t) * 0.65))
        continue
      }
      const k = this.body[i]
      if (k < 0) continue
      if (!s.canAct(i) || !this.validBody(i)) { s.dropBody(k); continue }
      if (this.dragging[i] !== 1) continue
      const h = this.home[i], dx = s.x[h] - s.cX[k], dy = s.y[h] + 10 - s.cY[k], d = Math.hypot(dx, dy) || 1
      const grip = Math.max(12, UNITS[s.cType[k]].r * s.cSize[k]) + 10
      const gx = Math.min(s.w - 8, Math.max(8, s.cX[k] + dx / d * grip)), gy = Math.min(s.h - 8, Math.max(8, s.cY[k] + dy / d * grip))
      if (Math.hypot(s.x[i] - gx, s.y[i] - gy) > 16 || d < UNITS[s.type[h]].r + 12) continue
      const weight = Math.max(1, UNITS[s.cType[k]].r * s.cSize[k] / 8)
      const slow = s.slowT[i] > 0 || this.webT[i] > 0 ? 0.4 : 1
      const wet = s.inWater(s.cX[k], s.cY[k]) || s.inWater(s.x[i], s.y[i]) ? 0.5 : 1
      const distance = Math.min(d, Math.max(12, 50 / Math.sqrt(weight)) * slow * wet * DT)
      const mx = dx / d * distance, my = dy / d * distance
      s.cX[k] += mx; s.cY[k] += my
      s.x[i] = Math.min(s.w - 8, Math.max(8, s.x[i] + mx)); s.y[i] = Math.min(s.h - 8, Math.max(8, s.y[i] + my))
      s.phase[i] += distance * 0.3
    }
  }
}

import { BCELL, DT, type Sim } from './sim.ts'
import { UNITS } from './units.ts'

export interface MantisScene {
  x: number
  y: number
  r: number
  state: 'windup' | 'transport' | 'bow' | 'duel' | 'handoff'
  members: number[]
  generations: number[]
  team: number
  captive: number
  captiveGen: number
  captiveTeam: number
  carrier: number
  challenger: number
  t: number
  age: number
}

export class MantisDuels {
  private s: Sim
  member: Int32Array
  role: Uint8Array // 1 carrier/clamp, 2 waiting, 3 challenger/bowing, 4 captive
  scenes: (MantisScene | null)[] = []
  private cooldown: Float32Array
  private grace: Float32Array

  constructor(s: Sim) {
    this.s = s
    this.member = new Int32Array(s.x.length).fill(-1)
    this.role = new Uint8Array(s.x.length)
    this.cooldown = new Float32Array(s.x.length)
    this.grace = new Float32Array(s.x.length)
  }

  reset() {
    for (const scene of this.scenes) if (scene) this.end(scene)
    this.scenes.length = 0
    this.member.fill(-1)
    this.role.fill(0)
    this.cooldown.fill(0)
    this.grace.fill(0)
  }

  onSpawn(i: number) {
    this.onRemove(i)
    this.member[i] = -1
    this.role[i] = 0
    this.cooldown[i] = this.grace[i] = 0
  }

  private current(i: number, generation: number) {
    const s = this.s
    return i >= 0 && !!s.alive[i] && s.generation[i] === generation && s.stage[i] !== 1
  }

  private scene(i: number) {
    const k = this.member[i]
    return k >= 0 ? this.scenes[k] : null
  }

  private attached(scene: MantisScene, i: number) {
    const k = scene.members.indexOf(i)
    return k >= 0 && this.current(i, scene.generations[k]) && this.scene(i) === scene
      && this.s.team[i] === scene.team && UNITS[this.s.type[i]].bug === 'mantis'
  }

  private available(i: number) {
    const s = this.s
    return s.canAct(i) && s.grab[i] < 0 && !s.dashT[i] && !s.leapT[i]
      && !s.spinT[i] && !s.scrapT[i] && !s.latchT[i] && !s.rollT[i]
      && !s.beam[i] && !s.tetherT[i] && !s.brawling(i) && s.spotT[i] <= 0
  }

  private prey(i: number, j: number) {
    const s = this.s, def = UNITS[s.type[j]]
    return j >= 0 && !!s.alive[j] && s.team[j] !== s.team[i] && !s.hidden[j]
      && !def.building && !def.colony && !def.flies && !def.waterbound && def.prey !== false
      && s.stage[j] !== 1 && s.airT[j] <= 0 && s.inside[j] < 0 && s.heldBy[j] < 0
      && s.grab[j] < 0 && this.member[j] < 0 && this.grace[j] <= 0
      && s.effectiveRadius(j) <= s.effectiveRadius(i) * 1.5
  }

  private clearMember(i: number) {
    this.member[i] = -1
    this.role[i] = 0
    this.cooldown[i] = Math.max(this.cooldown[i], 8)
    this.s.target[i] = -1
  }

  private release(scene: MantisScene) {
    const s = this.s, c = scene.carrier, v = scene.captive
    const carrierValid = this.current(c, scene.generations[0])
    const victimValid = this.current(v, scene.captiveGen)
    if (carrierValid && s.grab[c] === v) s.grab[c] = -1
    if (victimValid && s.heldBy[v] === c) {
      s.heldBy[v] = -1
      if (carrierValid) {
        s.x[v] = s.x[c]; s.y[v] = s.y[c]
        s.px[v] = s.x[v]; s.py[v] = s.y[v]
      }
    }
  }

  private end(scene: MantisScene) {
    this.release(scene)
    const k = this.scenes.indexOf(scene)
    if (k < 0) return
    this.scenes[k] = null
    for (let m = 0; m < scene.members.length; m++) {
      const i = scene.members[m]
      if (this.member[i] === k && this.s.generation[i] === scene.generations[m]) this.clearMember(i)
    }
    const v = scene.captive
    if (this.member[v] === k && this.s.generation[v] === scene.captiveGen) {
      this.clearMember(v)
      this.grace[v] = 2
    }
  }

  onRemove(i: number) {
    const scene = this.scene(i)
    if (!scene) return
    if (i === scene.captive || ((scene.state === 'windup' || scene.state === 'transport') && i === scene.carrier)) {
      this.end(scene)
      return
    }
    this.clearMember(i) // death cleanup runs before stopMoves, while the slot is still alive
    if (i === scene.challenger) {
      scene.challenger = -1
      scene.state = 'handoff'
      scene.t = 0
    }
  }

  interrupt(i: number) {
    const scene = this.scene(i)
    if (!scene) return
    if (scene.state === 'duel' && (i === scene.captive || i === scene.challenger)) return
    if (i === scene.captive && scene.state === 'transport' && this.s.heldBy[i] === scene.carrier) return
    if (i === scene.captive || i === scene.carrier || i === scene.challenger) this.end(scene)
    else this.clearMember(i)
  }

  onHit(i: number, by: number) {
    const scene = this.scene(i)
    if (!scene) return
    if (scene.state === 'duel' && this.opponent(i) === by && by >= 0) return
    if (i === scene.captive || i === scene.challenger
      || ((scene.state === 'windup' || scene.state === 'transport') && i === scene.carrier)) this.end(scene)
    else this.clearMember(i)
  }

  opponent(i: number) {
    const scene = this.scene(i)
    if (!scene || scene.state !== 'duel' || !this.current(scene.captive, scene.captiveGen)
      || !this.attached(scene, scene.challenger)) return -1
    return i === scene.captive ? scene.challenger : i === scene.challenger ? scene.captive : -1
  }

  canTarget(i: number, j: number) {
    const scene = this.scene(j)
    if (!scene || j !== scene.captive || this.scene(i) !== scene) return true
    return scene.state === 'duel' && i === scene.challenger
  }

  private dry(x: number, y: number, r: number) {
    const s = this.s
    if (x < r || y < r || x > s.w - r || y > s.h - r) return false
    const x0 = Math.floor((x - r) / BCELL), x1 = Math.floor((x + r) / BCELL)
    const y0 = Math.floor((y - r) / BCELL), y1 = Math.floor((y + r) / BCELL)
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const dx = Math.max(xx * BCELL - x, 0, x - (xx + 1) * BCELL)
      const dy = Math.max(yy * BCELL - y, 0, y - (yy + 1) * BCELL)
      if (dx * dx + dy * dy <= r * r && (s.bmask[yy * s.bcols + xx] & 3)) return false
    }
    return true
  }

  private start(i: number, v: number) {
    const s = this.s
    if (!this.prey(i, v) || !this.available(i)) return false
    const reach = s.effectiveRadius(i) + s.effectiveRadius(v) + UNITS[s.type[i]].range
    if (Math.hypot(s.x[i] - s.x[v], s.y[i] - s.y[v]) > reach) return false
    const nearby: number[] = []
    for (let j = 0; j < s.n; j++) {
      if (j !== i && s.team[j] === s.team[i] && UNITS[s.type[j]].bug === 'mantis'
        && this.member[j] < 0 && this.cooldown[j] <= 0 && this.available(j)
        && Math.hypot(s.x[j] - s.x[i], s.y[j] - s.y[i]) <= 180) nearby.push(j)
    }
    nearby.sort((a, b) => ((s.x[a] - s.x[i]) ** 2 + (s.y[a] - s.y[i]) ** 2)
      - ((s.x[b] - s.x[i]) ** 2 + (s.y[b] - s.y[i]) ** 2) || a - b)
    if (nearby.length < 3) return false
    this.cooldown[i] = 8
    const members = [i, ...nearby.slice(0, 5)]
    let cx = 0, cy = 0, mr = 0
    for (const j of members) { cx += s.x[j]; cy += s.y[j]; mr = Math.max(mr, s.effectiveRadius(j)) }
    cx /= members.length; cy /= members.length
    const r = Math.max(55, s.effectiveRadius(v) * 2 + mr * 2 + 18), extent = r + mr + 6
    let x = 0, y = 0, found = false
    for (let attempt = 0; attempt < 25; attempt++) {
      const distance = attempt ? Math.ceil(attempt / 8) * 36 : 0
      const angle = (attempt - 1) % 8 * Math.PI / 4
      x = Math.max(extent, Math.min(s.w - extent, cx + Math.cos(angle) * distance))
      y = Math.max(extent, Math.min(s.h - extent, cy + Math.sin(angle) * distance))
      if (this.dry(x, y, extent)) { found = true; break }
    }
    if (!found) return false
    for (const j of [...members, v]) s.stopMoves(j)
    let k = this.scenes.indexOf(null)
    if (k < 0) k = this.scenes.length
    const scene: MantisScene = { x, y, r, state: 'windup', members,
      generations: members.map((j) => s.generation[j]), team: s.team[i],
      captive: v, captiveGen: s.generation[v], captiveTeam: s.team[v],
      carrier: i, challenger: i, t: 0, age: 0 }
    this.scenes[k] = scene
    for (const j of members) { this.member[j] = k; this.role[j] = j === i ? 1 : 2; s.target[j] = -1 }
    this.member[v] = k; this.role[v] = 4
    return true
  }

  private ring(scene: MantisScene, i: number) {
    const a = scene.members.indexOf(i) / scene.members.length * Math.PI * 2 + Math.PI
    return { x: scene.x + Math.cos(a) * scene.r, y: scene.y + Math.sin(a) * scene.r }
  }

  private challenge(scene: MantisScene) {
    for (const i of scene.members) {
      if (!this.attached(scene, i) || !this.available(i)) continue
      scene.challenger = i
      this.role[i] = 3
      scene.state = 'bow'
      scene.t = 0
      return
    }
    this.end(scene)
  }

  step() {
    const s = this.s
    for (let i = 0; i < s.n; i++) {
      this.cooldown[i] = Math.max(0, this.cooldown[i] - DT)
      this.grace[i] = Math.max(0, this.grace[i] - DT)
    }
    for (const scene of this.scenes) {
      if (!scene) continue
      scene.t += DT; scene.age += DT
      const v = scene.captive, c = scene.carrier
      if (scene.age >= 30 || !this.current(v, scene.captiveGen) || s.team[v] !== scene.captiveTeam
        || s.inside[v] >= 0 || UNITS[s.type[v]].building) { this.end(scene); continue }
      for (const i of scene.members) {
        if (this.scene(i) !== scene) continue
        if (!this.attached(scene, i)) this.onRemove(i)
        else if (i !== scene.challenger && !this.available(i)) this.clearMember(i)
      }
      if (this.scene(v) !== scene) continue
      if (scene.state === 'windup' || scene.state === 'transport') {
        const count = scene.members.filter((i) => this.attached(scene, i)).length
        if (count < 4 || !this.attached(scene, c) || !s.canAct(c)
          || (scene.state === 'windup' && s.grab[c] >= 0)) { this.end(scene); continue }
        if (scene.state === 'windup') {
          const reach = s.effectiveRadius(c) + s.effectiveRadius(v) + UNITS[s.type[c]].range + 6
          if (s.hidden[v] || s.heldBy[v] >= 0 || s.airT[v] > 0
            || Math.hypot(s.x[c] - s.x[v], s.y[c] - s.y[v]) > reach) { this.end(scene); continue }
          if (scene.t >= 0.35) {
            s.grab[c] = v; s.heldBy[v] = c
            s.vx[v] = s.vy[v] = 0
            scene.state = 'transport'; scene.t = 0
          }
        } else {
          if (scene.t >= 4 || s.grab[c] !== v || s.heldBy[v] !== c) { this.end(scene); continue }
          if (Math.hypot(s.x[c] - scene.x, s.y[c] - scene.y) > 8) continue
          let ready = true
          for (const i of scene.members) if (i !== c && this.attached(scene, i)) {
            const p = this.ring(scene, i)
            if (Math.hypot(s.x[i] - p.x, s.y[i] - p.y) > 14) ready = false
          }
          if (!ready) continue
          this.release(scene)
          s.x[v] = s.px[v] = scene.x; s.y[v] = s.py[v] = scene.y
          this.role[c] = 3
          scene.state = 'bow'; scene.t = 0
        }
      } else {
        if (Math.hypot(s.x[v] - scene.x, s.y[v] - scene.y) > scene.r + s.effectiveRadius(v)
          || (scene.challenger >= 0 && Math.hypot(s.x[scene.challenger] - scene.x,
            s.y[scene.challenger] - scene.y) > scene.r + s.effectiveRadius(scene.challenger))) {
          this.end(scene); continue
        }
        if (scene.state === 'handoff') {
          if (scene.t >= 0.6) this.challenge(scene)
        } else if (scene.state === 'bow') {
          if (!this.attached(scene, scene.challenger) || !this.available(scene.challenger)) { this.end(scene); continue }
          const p = this.ring(scene, scene.challenger)
          if (Math.hypot(s.x[scene.challenger] - (scene.x + (p.x - scene.x) * 0.45),
            s.y[scene.challenger] - (scene.y + (p.y - scene.y) * 0.45)) > 10) scene.t = 0
          if (scene.t >= 0.5) { scene.state = 'duel'; scene.t = 0 }
        }
      }
    }
  }

  private move(i: number, x: number, y: number, slow = 1) {
    const s = this.s, dx = x - s.x[i], dy = y - s.y[i], d = Math.hypot(dx, dy)
    const speed = d < 4 ? 0 : Math.min(UNITS[s.type[i]].speed * slow
      * (s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1) * (s.inWater(s.x[i], s.y[i]) ? 0.5 : 1), d / DT)
    s.vx[i] += ((d ? dx / d * speed : 0) - s.vx[i]) * 0.2
    s.vy[i] += ((d ? dy / d * speed : 0) - s.vy[i]) * 0.2
    if (Math.abs(dx) > 2) s.face[i] = dx > 0 ? 1 : -1
    s.phase[i] += Math.hypot(s.vx[i], s.vy[i]) * DT * 0.12
    s.target[i] = -1
  }

  steer(i: number, t: number) {
    const s = this.s
    let scene = this.scene(i)
    if (!scene && UNITS[s.type[i]].bug === 'mantis' && this.cooldown[i] <= 0) {
      if (t < 0 || !s.alive[t] || s.team[t] === s.team[i] || s.hidden[t]) t = s.findTarget(i)
      if (t >= 0 && this.start(i, t)) scene = this.scene(i)
    }
    if (!scene || (scene.state === 'duel' && (i === scene.captive || i === scene.challenger))) return false
    if (i === scene.captive) {
      if (scene.state !== 'transport') this.move(i, s.x[i], s.y[i])
      return true
    }
    if (i === scene.carrier && scene.state === 'windup') {
      this.move(i, s.x[i], s.y[i])
      const dx = s.x[scene.captive] - s.x[i]
      if (Math.abs(dx) > 2) s.face[i] = dx > 0 ? 1 : -1
    } else if (i === scene.carrier && scene.state === 'transport') this.move(i, scene.x, scene.y, 0.65)
    else {
      const p = this.ring(scene, i), scale = i === scene.challenger ? 0.45 : 1
      this.move(i, scene.x + (p.x - scene.x) * scale, scene.y + (p.y - scene.y) * scale)
      const dx = scene.x - s.x[i]
      if (Math.abs(dx) > 2) s.face[i] = dx > 0 ? 1 : -1
    }
    return true
  }

  resize() {
    const s = this.s
    for (const scene of this.scenes) {
      if (!scene) continue
      let mr = s.effectiveRadius(scene.captive)
      for (const i of scene.members) if (this.attached(scene, i)) mr = Math.max(mr, s.effectiveRadius(i))
      const extent = scene.r + mr + 6
      const x = Math.max(extent, Math.min(s.w - extent, scene.x))
      const y = Math.max(extent, Math.min(s.h - extent, scene.y))
      if (!this.dry(x, y, extent)) { this.end(scene); continue }
      const dx = x - scene.x, dy = y - scene.y
      scene.x = x; scene.y = y
      for (const i of [...scene.members, scene.captive]) {
        if (this.scene(i) !== scene) continue
        s.x[i] += dx; s.px[i] += dx; s.y[i] += dy; s.py[i] += dy
      }
    }
  }
}

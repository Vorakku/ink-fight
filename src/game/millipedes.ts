import { DT, type Sim } from './sim.ts'
import { UNITS } from './units.ts'

const CURL = 0.35, ASSEMBLE = 0.6

export class Millipedes {
  private s: Sim
  private carType: number
  curlT: Float32Array
  group: Int32Array // leader slot, or -1; each leader owns exactly four members
  assemblyT: Float32Array // seconds assembled, copied to all four members
  heading: Float32Array
  wheelPhase: Float32Array
  private members: Int32Array
  private memberGen: Uint32Array
  private seat: Uint8Array
  private meetX: Float32Array
  private meetY: Float32Array
  private gap: Float32Array
  private retryT: Float32Array
  private pending: Int32Array
  private pendingN: Uint8Array

  constructor(s: Sim) {
    this.s = s
    this.carType = UNITS.findIndex((u) => u.bug === 'car')
    const n = s.x.length
    this.curlT = new Float32Array(n)
    this.group = new Int32Array(n).fill(-1)
    this.assemblyT = new Float32Array(n)
    this.heading = new Float32Array(n)
    this.wheelPhase = new Float32Array(n)
    this.members = new Int32Array(n * 4).fill(-1)
    this.memberGen = new Uint32Array(n)
    this.seat = new Uint8Array(n)
    this.meetX = new Float32Array(n)
    this.meetY = new Float32Array(n)
    this.gap = new Float32Array(n)
    this.retryT = new Float32Array(n)
    this.pending = new Int32Array(n * 4)
    this.pendingN = new Uint8Array(n)
  }

  reset() {
    this.curlT.fill(0)
    this.group.fill(-1)
    this.assemblyT.fill(0)
    this.heading.fill(0)
    this.wheelPhase.fill(0)
    this.members.fill(-1)
    this.memberGen.fill(0)
    this.seat.fill(0)
    this.meetX.fill(0)
    this.meetY.fill(0)
    this.gap.fill(0)
    this.retryT.fill(0)
    this.pendingN.fill(0)
  }

  onSpawn(i: number) {
    this.interrupt(i)
    this.curlT[i] = UNITS[this.s.type[i]].bug === 'millipede' ? CURL : 0
    this.assemblyT[i] = this.wheelPhase[i] = this.retryT[i] = 0
    this.heading[i] = Math.random() * Math.PI * 2
    this.memberGen[i] = this.s.generation[i]
  }

  onRemove(i: number) {
    this.interrupt(i)
    this.curlT[i] = this.assemblyT[i] = this.wheelPhase[i] = this.retryT[i] = 0
  }

  interrupt(i: number) {
    const leader = this.group[i]
    if (leader < 0) return
    for (let k = 0; k < 4; k++) {
      const j = this.members[leader * 4 + k]
      if (j >= 0 && this.group[j] === leader) {
        this.group[j] = -1
        this.assemblyT[j] = 0
        this.retryT[j] = 0.75
      }
      this.members[leader * 4 + k] = -1
    }
  }

  private available(i: number) {
    const s = this.s
    return !!s.alive[i] && UNITS[s.type[i]].bug === 'millipede' && s.canAct(i)
      && s.mantises.member[i] < 0 && this.curlT[i] <= 0
      && s.shockT[i] <= 0 && s.dizzyT[i] <= 0 && s.downT[i] <= 0
      && s.phoneT[i] <= 0 && s.fearT[i] <= 0 && s.lureT[i] <= 0
      && s.blindT[i] <= 0 && s.spotT[i] <= 0
  }

  private meeting(leader: number, mx: number, my: number, gap: number) {
    const s = this.s
    if (s.w < gap * 4 || s.h < gap * 4) return false
    for (let ring = 0; ring <= 2; ring++) {
      for (let yy = -ring; yy <= ring; yy++) for (let xx = -ring; xx <= ring; xx++) {
        if (Math.abs(xx) !== ring && Math.abs(yy) !== ring) continue
        const x = Math.max(gap * 2, Math.min(s.w - gap * 2, mx + xx * (gap * 4 + 8)))
        const y = Math.max(gap * 2, Math.min(s.h - gap * 2, my + yy * (gap * 4 + 8)))
        let free = true
        for (let j = 0; j < s.n; j++) {
          if (this.group[j] !== j) continue
          const separation = (gap + this.gap[j]) * 2 + 4
          if (Math.abs(x - this.meetX[j]) < separation && Math.abs(y - this.meetY[j]) < separation) { free = false; break }
        }
        if (!free) continue
        this.meetX[leader] = x
        this.meetY[leader] = y
        return true
      }
    }
    return false
  }

  step() {
    const s = this.s
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i]) continue
      this.retryT[i] = Math.max(0, this.retryT[i] - DT)
      if (this.curlT[i] > 0 && s.canAct(i) && s.mantises.member[i] < 0)
        this.curlT[i] = Math.max(0, this.curlT[i] - DT)
    }

    for (let leader = 0; leader < s.n; leader++) {
      if (this.group[leader] !== leader) continue
      let valid = true, settled = true
      const gap = this.gap[leader]
      if (s.w < gap * 4 || s.h < gap * 4) { this.interrupt(leader); continue }
      this.meetX[leader] = Math.max(gap * 2, Math.min(s.w - gap * 2, this.meetX[leader]))
      this.meetY[leader] = Math.max(gap * 2, Math.min(s.h - gap * 2, this.meetY[leader]))
      for (let k = 0; k < 4; k++) {
        const j = this.members[leader * 4 + k]
        if (j < 0 || this.group[j] !== leader || this.memberGen[j] !== s.generation[j]
          || s.team[j] !== s.team[leader] || !this.available(j)) { valid = false; break }
        const tx = this.meetX[leader] + (k & 1 ? gap : -gap)
        const ty = this.meetY[leader] + (k & 2 ? gap : -gap)
        if (Math.hypot(tx - s.x[j], ty - s.y[j]) > 7) settled = false
      }
      if (!valid) { this.interrupt(leader); continue }
      const progress = settled ? this.assemblyT[leader] + DT : 0
      for (let k = 0; k < 4; k++) this.assemblyT[this.members[leader * 4 + k]] = progress
      if (progress < ASSEMBLE) continue
      const heading = this.heading[leader], phase = this.wheelPhase[leader]
      const members = Array.from(this.members.subarray(leader * 4, leader * 4 + 4))
      const car = s.merge(members, this.carType)
      if (car < 0) this.interrupt(leader)
      else { this.heading[car] = heading; this.wheelPhase[car] = phase }
    }

    if (this.carType < 0) return
    this.pendingN.fill(0)
    for (let i = 0; i < s.n; i++) {
      if (this.group[i] >= 0 || this.retryT[i] > 0 || !this.available(i)) continue
      const side = s.team[i], count = this.pendingN[side]++
      this.pending[side * 4 + count] = i
      if (count !== 3) continue
      this.pendingN[side] = 0
      const start = side * 4, leader = this.pending[start]
      let mx = 0, my = 0, gap = 0
      for (let k = 0; k < 4; k++) {
        const j = this.pending[start + k]
        mx += s.x[j]; my += s.y[j]
        gap = Math.max(gap, s.effectiveRadius(j) + 3)
      }
      if (!this.meeting(leader, mx / 4, my / 4, gap)) {
        for (let k = 0; k < 4; k++) this.retryT[this.pending[start + k]] = 0.75
        continue
      }
      this.gap[leader] = gap
      for (let k = 0; k < 4; k++) {
        const j = this.pending[start + k]
        this.members[leader * 4 + k] = j
        this.memberGen[j] = s.generation[j]
        this.group[j] = leader
        this.seat[j] = k
        this.assemblyT[j] = 0
      }
    }
  }

  steer(i: number, t: number): boolean {
    const s = this.s, def = UNITS[s.type[i]]
    if (def.bug !== 'millipede' && def.bug !== 'car') return false
    if (!s.canAct(i) || s.mantises.member[i] >= 0) { this.interrupt(i); return false }
    if (s.lureT[i] > 0 || s.fearT[i] > 0 || s.blindT[i] > 0) { this.interrupt(i); return false }
    if (this.curlT[i] > 0) { s.vx[i] *= 0.7; s.vy[i] *= 0.7; return true }

    let desired = this.heading[i], approach = Infinity
    const leader = this.group[i]
    if (leader >= 0) {
      const k = this.seat[i], gap = this.gap[leader]
      const dx = this.meetX[leader] + (k & 1 ? gap : -gap) - s.x[i]
      const dy = this.meetY[leader] + (k & 2 ? gap : -gap) - s.y[i]
      approach = Math.hypot(dx, dy)
      desired = Math.atan2(dy, dx)
    } else if (t >= 0 && s.alive[t] && s.team[t] !== s.team[i]) {
      desired = Math.atan2(s.y[t] - s.y[i], s.x[t] - s.x[i])
    } else desired += Math.sin(s.tick * 0.013 + i * 2.4) * DT * 0.9

    const turn = Math.atan2(Math.sin(desired - this.heading[i]), Math.cos(desired - this.heading[i]))
    const limit = DT * (leader >= 0 ? 5 : def.bug === 'car' ? 1.65 : 2.15)
    let angle = this.heading[i] + Math.max(-limit, Math.min(limit, turn))
    const r = s.effectiveRadius(i), edge = r + 2
    let nx = Math.cos(angle), ny = Math.sin(angle)
    if ((s.x[i] <= edge && nx < 0) || (s.x[i] >= s.w - edge && nx > 0)) nx = -nx
    if ((s.y[i] <= edge && ny < 0) || (s.y[i] >= s.h - edge && ny > 0)) ny = -ny
    angle = this.heading[i] = Math.atan2(ny, nx)
    const slowed = (s.slowT[i] > 0 || s.spiders.webT[i] > 0 ? 0.4 : 1) * (s.inWater(s.x[i], s.y[i]) ? 0.5 : 1)
    const speed = Math.min(def.speed * slowed, approach < 5 ? 0 : approach * 3)
    s.vx[i] += (nx * speed - s.vx[i]) * 0.16
    s.vy[i] += (ny * speed - s.vy[i]) * 0.16
    if (Math.abs(nx) > 0.05) s.face[i] = nx > 0 ? 1 : -1
    const distance = Math.hypot(s.vx[i], s.vy[i]) * DT
    this.wheelPhase[i] += distance / (def.bug === 'car' ? 6 : Math.max(3, r))
    s.phase[i] += distance * 0.12
    if (s.cd[i] <= 0) {
      s.cd[i] = Math.max(0.35, def.cd)
      s.sweep(i, r + 2)
    }
    return true
  }
}

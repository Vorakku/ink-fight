// Unrun. Run only with owner permission: node checks/animals.check.ts
import assert from 'node:assert/strict'
import { BLUE, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const t = UNITS.findIndex((u) => u.key === key)
  assert.ok(t >= 0, `missing ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(1200, 700); return s }
const advance = (s: Sim, ticks: number) => { for (let k = 0; k < ticks; k++) s.step() }
const incoming = (s: Sim, from: number, to: number) => {
  const p = s.pn++, def = UNITS[s.type[from]]
  s.pX[p] = s.x[to] - 7; s.pY[p] = s.y[to]
  s.pVx[p] = 420; s.pVy[p] = 0; s.pLife[p] = 2
  s.pType[p] = s.type[from]; s.pTeam[p] = s.team[from]; s.pDmg[p] = def.dmg
  s.pFrom[p] = from; s.pGen[p] = s.generation[from]; s.pPass[p] = 0
}

{ // Catch one shot, take the next hit with a full pouch, and return the original shot with new ownership.
  const s = scene(), roo = s.spawn(unit('kangaroo'), 300, 300, RED)
  const shooter = s.spawn(unit('intern'), 100, 300, BLUE)
  s.cd[roo] = 100; s.shockT[shooter] = 100
  const hp = s.hp[roo], shot = s.type[shooter]
  incoming(s, shooter, roo); s.step()
  assert.equal(s.hp[roo], hp)
  assert.equal(s.pouchType[roo], shot)
  assert.equal(s.pn, 0)
  incoming(s, shooter, roo); s.step()
  assert.equal(s.hp[roo], hp - UNITS[shot].dmg, 'a full pouch cannot catch another shot')
  assert.equal(s.pouchType[roo], shot)
  for (let t = 0; t < 45 && s.pouchType[roo] >= 0; t++) s.step()
  assert.equal(s.pouchType[roo], -1)
  assert.equal(s.pn, 1)
  assert.equal(s.pType[0], shot, 'the returned shot keeps its original appearance and effects')
  assert.equal(s.pTeam[0], RED)
  assert.equal(s.owner(0), roo, 'the kangaroo gets credit despite a different projectile type')
  const targetHp = s.hp[shooter]
  advance(s, 30)
  assert.equal(s.hp[shooter], targetHp - UNITS[shot].dmg)
}

{ // Friendly shots pass through; stunned kangaroos and large spears cannot be pocketed.
  const s = scene(), roo = s.spawn(unit('kangaroo'), 300, 300, RED)
  const friend = s.spawn(unit('intern'), 100, 300, RED)
  const foe = s.spawn(unit('centaur'), 100, 500, BLUE)
  s.cd[roo] = 100; s.shockT[friend] = s.shockT[foe] = 100
  const hp = s.hp[roo]
  incoming(s, friend, roo); s.step()
  assert.equal(s.pouchType[roo], -1)
  assert.equal(s.hp[roo], hp)
  s.pn = 0
  incoming(s, foe, roo); s.step()
  assert.equal(s.pouchType[roo], -1)
  assert.equal(s.hp[roo], hp - UNITS[s.type[foe]].dmg)
  s.team[friend] = BLUE
  s.shockT[roo] = 1
  const before = s.hp[roo]
  incoming(s, friend, roo); s.step()
  assert.equal(s.pouchType[roo], -1)
  assert.equal(s.hp[roo], before - UNITS[s.type[friend]].dmg)
}

{ // A replacement in the shooter's slot does not inherit the returning parcel.
  const s = scene(), roo = s.spawn(unit('kangaroo'), 300, 300, RED)
  const shooter = s.spawn(unit('intern'), 100, 300, BLUE)
  s.cd[roo] = 100; s.shockT[shooter] = 100
  incoming(s, shooter, roo); s.step()
  assert.ok(s.pouchType[roo] >= 0)
  s.damage(shooter, Infinity, 0, 0)
  const replacement = s.spawn(unit('toast'), 100, 300, BLUE)
  assert.equal(replacement, shooter)
  s.shockT[replacement] = 100
  advance(s, 45)
  assert.equal(s.pouchType[roo], -1)
  assert.equal(s.pn, 0)
  assert.equal(s.hp[replacement], UNITS[s.type[replacement]].hp)
}

{ // Interruption drops the stored shot; a reused kangaroo slot starts empty.
  const s = scene(), roo = s.spawn(unit('kangaroo'), 300, 300, RED)
  const shooter = s.spawn(unit('intern'), 100, 300, BLUE)
  s.cd[roo] = 100; s.shockT[shooter] = 100
  incoming(s, shooter, roo); s.step()
  assert.ok(s.pouchType[roo] >= 0)
  s.shockT[roo] = 1; s.step()
  assert.equal(s.pouchType[roo], -1)
  s.damage(roo, Infinity, 0, 0)
  const next = s.spawn(unit('kangaroo'), 800, 300, RED)
  assert.equal(next, roo)
  assert.equal(s.pouchType[next], -1)
  assert.equal(s.feignT[next], 0)
}

{ // Playing dead drops pursuit, keeps the fighter alive, and does not block damage or bite friends.
  const s = scene(), p = s.spawn(unit('opossum'), 300, 300, RED)
  const foe = s.spawn(unit('giant'), 600, 300, BLUE)
  s.shockT[foe] = 100; s.target[foe] = p
  s.damage(p, 60, 0, 0, foe)
  assert.ok(s.feignT[p] > 0)
  assert.equal(s.hp[p], 30)
  assert.equal(s.alive[p], 1)
  assert.equal(s.stage[p], 0, 'this is a pose, not a death or revival')
  assert.equal(s.cn, 0)
  assert.equal(s.target[foe], -1)
  s.buildGrid(); assert.equal(s.findTarget(foe), -1)
  s.damage(p, 1, 0, 0, foe)
  assert.equal(s.hp[p], 29, 'existing shots and area damage can still hurt it')
  const friend = s.spawn(unit('toast'), 303, 300, RED)
  s.shockT[friend] = 100
  s.step()
  assert.ok(s.feignT[p] > 0)
  assert.equal(s.hp[friend], UNITS[s.type[friend]].hp)
  s.x[foe] = 303; s.y[foe] = 300
  const before = s.hp[foe]
  s.step()
  assert.equal(s.feignT[p], 0)
  assert.equal(s.hp[foe], before - 2 * UNITS[s.type[p]].dmg)
  assert.ok(s.fearT[p] > 1.7)
  assert.ok(s.vx[p] < 0, 'it flees from the bitten ankle')
  s.step()
  assert.equal(s.hp[foe], before - 2 * UNITS[s.type[p]].dmg, 'one surprise bite per performance')
}

{ // With no visitor it stands without healing; cooldown prevents immediately feigning again.
  const s = scene(), p = s.spawn(unit('opossum'), 300, 300, RED)
  s.damage(p, 60, 0, 0)
  advance(s, 242)
  assert.equal(s.feignT[p], 0)
  assert.equal(s.hp[p], 30)
  s.damage(p, 1, 0, 0)
  assert.equal(s.feignT[p], 0)
  advance(s, 365)
  s.damage(p, 1, 0, 0)
  assert.ok(s.feignT[p] > 0)
  s.shockT[p] = 1; s.step()
  assert.equal(s.feignT[p], 0, 'a stun cancels the pose')
}

{ // Lethal damage is lethal: an opossum never heals or revives itself.
  const s = scene(), p = s.spawn(unit('opossum'), 300, 300, RED)
  s.damage(p, Infinity, 0, 0)
  assert.equal(s.alive[p], 0)
  assert.equal(s.counts[unit('opossum')], 0)
  const next = s.spawn(unit('opossum'), 300, 300, RED)
  assert.equal(next, p)
  assert.equal(s.feignT[next], 0)
  assert.equal(s.abilityCd[next], 0)
}

console.log('Animal checks passed')

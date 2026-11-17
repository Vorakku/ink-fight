// Run only with owner permission: node checks/queens.check.ts
import assert from 'node:assert/strict'
import { BLUE, COLONY_BUILD, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const type = UNITS.findIndex((u) => u.key === key)
  assert.ok(type >= 0, `missing unit: ${key}`)
  return type
}
const scene = () => { const s = new Sim(); s.resize(1000, 700); return s }

for (const species of ['ant', 'spider'] as const) {
  const s = scene(), building = unit(species === 'ant' ? 'anthill' : 'nest')
  const queen = unit(`${species}-queen`), child = unit(species)
  const homes: number[] = []
  const finish = (k: number) => {
    const h = s.spawn(building, 100 + k % 4 * 220, 120 + Math.floor(k / 4) * 300, RED)
    s.colonyT[h] = COLONY_BUILD
    s.spiders.nestT[h] = 3
    s.cd[h] = 100
    homes.push(h)
    s.step()
  }
  for (let k = 0; k < 3; k++) finish(k)
  assert.equal(s.counts[queen], 0, 'three completed homes do not earn a queen')
  finish(3)
  assert.equal(s.counts[queen], 1, 'four completed homes earn one queen')
  {
    const q = Array.from({ length: s.n }, (_, i) => i).find((i) => s.alive[i] && s.type[i] === queen)!
    assert.equal(s.inside[q], homes[3], 'queen stays inside the home that produced her')
    assert.equal(s.entryT[q], 1, 'queen is fully sheltered')
    assert.equal(s.canAct(q), false, 'sheltered queen does not fight, forage or build')
    s.damage(q, 10000, 0, 0)
    assert.equal(s.alive[q], 1, 'outside attacks cannot directly hit a sheltered queen')
  }
  assert.equal(s.broodSize(homes[0]), 2, 'queen doubles allied brood size')
  const enemyHome = s.spawn(building, 900, 600, BLUE)
  assert.equal(s.broodSize(enemyHome), 1, 'enemy homes get no bonus')
  const otherHome = s.spawn(unit(species === 'ant' ? 'nest' : 'anthill'), 700, 600, RED)
  assert.equal(s.broodSize(otherHome), 1, 'the bonus only affects the same species')

  const before = s.counts[child]
  if (species === 'ant') s.cd[homes[0]] = 0
  else { s.spiders.cocoons[homes[0]] = 5; s.spiders.birthT[homes[0]] = 0.8 }
  for (let k = 0; k < 20; k++) s.step()
  assert.equal(s.counts[child] - before, 2, 'a boosted home hatches two children per batch')
  if (species === 'spider') assert.equal(s.spiders.cocoons[homes[0]], 0, 'one batch spends five cocoons')
  assert.equal(s.counts[queen], 1, 'completed homes are counted only once')

  for (let k = 4; k < 8; k++) finish(k)
  assert.equal(s.counts[queen], 2, 'eight completed homes earn two queens')
  assert.equal(s.broodSize(homes[0]), 2, 'multiple queens cap the bonus at two')
  const queens = Array.from({ length: s.n }, (_, i) => i).filter((i) => s.alive[i] && s.type[i] === queen)
  s.damage(s.inside[queens[0]], 10000, 0, 0)
  assert.equal(s.alive[queens[0]], 0, 'destroying a queen shelter also kills its queen')
  assert.equal(s.broodSize(homes[0]), 2, 'one surviving queen retains the bonus')
  s.damage(s.inside[queens[1]], 10000, 0, 0)
  assert.equal(s.broodSize(homes[0]), 1, 'losing the last queen removes the bonus')
  s.step()
  assert.equal(s.counts[queen], 0, 'old milestones do not replace dead queens')
  s.clear()
  for (let k = 0; k < 4; k++) finish(k)
  assert.equal(s.counts[queen], 1, 'clearing the scene resets queen milestones')
}

{
  const s = scene(), nest = unit('nest')
  s.spawn(unit('spider'), 450, 350, RED)
  for (let k = 0; k < 90 * 60 && s.counts[unit('spider-queen')] === 0; k++) s.step()
  assert.ok(s.counts[nest] >= 4, 'a lone idle spider keeps expanding beyond its first nest')
  assert.ok(s.counts[unit('spider-queen')] >= 1, 'four completed expansion nests earn a queen')
  const homes = Array.from({ length: s.n }, (_, i) => i).filter((i) => s.alive[i] && s.type[i] === nest)
  for (let a = 0; a < homes.length; a++) for (let b = a + 1; b < homes.length; b++) {
    assert.ok(Math.hypot(s.x[homes[a]] - s.x[homes[b]], s.y[homes[a]] - s.y[homes[b]]) >= 69, 'nearby nests retain space for their entrances')
  }
}

console.log('ok: queen milestones, allied brood bonuses, queen deaths, reset, and spider expansion')

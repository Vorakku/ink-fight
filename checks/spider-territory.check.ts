// Run only with owner permission: node checks/spider-territory.check.ts
import assert from 'node:assert/strict'
import { BLUE, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const type = UNITS.findIndex((u) => u.key === key)
  assert.ok(type >= 0, `missing unit: ${key}`)
  return type
}
const advance = (s: Sim, seconds: number) => {
  for (let k = 0; k < seconds * 60; k++) s.step()
}
const scene = (workers = 1) => {
  const s = new Sim()
  s.resize(4600, 700)
  const home = s.spawn(unit('nest'), 250, 350, RED)
  s.spiders.nestT[home] = 3
  const residents = Array.from({ length: workers }, (_, k) => s.spawn(unit('spider'), 250 + k * 20, 370, RED))
  advance(s, 1.5)
  for (const worker of residents) assert.equal(s.spiders.home[worker], home, 'worker adopts the completed nest')
  return { s, home, residents }
}

{
  const { s, home, residents: [worker] } = scene()
  s.spiders.cocoons[home] = 4
  advance(s, 20)
  assert.equal(s.spiders.home[worker], home, 'the last worker stays with an unfinished cocoon batch')
  assert.equal(s.counts[unit('nest')], 1, 'a lone worker does not abandon its stocked nest to expand')

  const victim = s.spawn(unit('goose'), 350, 350, BLUE)
  s.damage(victim, 10000, 0, 0)
  for (let k = 0; k < 30 * 60 && s.counts[unit('spider')] === 1; k++) s.step()
  assert.equal(s.counts[unit('spider')], 2, 'the retained worker completes the batch when another body arrives')
  assert.equal(s.spiders.cocoons[home], 0, 'the completed batch spends exactly five cocoons')
}

{
  const { s, home, residents } = scene(2)
  s.spiders.cocoons[home] = 4
  advance(s, 20)
  assert.ok(residents.some((i) => s.spiders.home[i] === home), 'a stocked nest retains a worker')
  assert.ok(residents.some((i) => s.spiders.home[i] !== home), 'a spare worker can still expand')
  assert.ok(s.counts[unit('nest')] > 1, 'protecting cocoon stock does not block spare builders')
}

for (const staffed of [false, true]) {
  const { s, home, residents: [worker] } = scene()
  const remote = s.spawn(unit('nest'), 1700, 350, RED)
  if (staffed) {
    const builder = s.spawn(unit('spider'), 1700, 360, RED)
    advance(s, 1.5)
    assert.equal(s.spiders.home[builder], remote, 'remote builder adopts its unfinished nest')
    // A displaced builder still owns a distant site while walking back to it.
    s.x[builder] = s.px[builder] = 3500
    s.vx[builder] = s.vy[builder] = 0
  }
  for (let k = 0; k < 20 * 60 && s.spiders.home[worker] === home; k++) s.step()
  const expansion = s.spiders.home[worker]
  assert.notEqual(expansion, home, 'a distant construction site does not block local expansion')
  assert.notEqual(expansion, remote, 'local expansion does not send workers to an unrelated distant site')
  assert.ok(expansion >= 0 && Math.hypot(s.x[expansion] - 250, s.y[expansion] - 350) <= 153,
    'the worker expands within 120px of its 32px patrol around home')
}

for (const distance of [300, 470]) {
  const { s, residents: [worker] } = scene()
  const victim = s.spawn(unit('goose'), 900, 350, BLUE)
  s.damage(victim, 10000, 0, 0)
  advance(s, 0.5)
  const body = s.spiders.body[worker]
  assert.ok(body >= 0, 'worker reserves a body before the threat appears')
  assert.equal(s.spiders.dragging[worker], 0, 'a distant reservation is not physical pickup')
  const threat = s.spawn(unit('nest'), s.x[worker] + distance, s.y[worker], BLUE)
  s.cd[worker] = 0
  s.spiders.steer(worker, threat)
  assert.equal(s.spiders.body[worker], -1, 'an enemy in web range interrupts collection')
  assert.equal(s.cSpider[body], -1, 'combat releases the body for other collectors')
  assert.equal(s.pn, 1, 'the spider shoots at enemies beyond the former 180px limit')
}

console.log('ok: cocoon staffing, local expansion, remote builders, and ranged defense while foraging')

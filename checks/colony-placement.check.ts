// Unrun. Run only with owner permission: node checks/colony-placement.check.ts
import assert from 'node:assert/strict'
import { COLONY_BUILD, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const t = UNITS.findIndex((u) => u.key === key)
  assert.ok(t >= 0, `missing ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(1800, 1000); return s }

for (const expanding of [false, true]) {
  const s = scene(), ant = unit('ant'), hill = unit('anthill')
  const home = expanding ? s.spawn(hill, 400, 400, RED) : -1
  if (home >= 0) { s.colonyT[home] = COLONY_BUILD; s.cd[home] = 100; s.nextColony[RED] = 20 }
  let seed = -1
  for (let i = 0; i < (expanding ? 20 : 10); i++) seed = s.spawn(ant, 400 + i % 3, 420, RED)
  const x = s.x[seed], y = s.y[seed]
  s.step()
  const site = s.buildFor[seed]
  assert.ok(site >= 0 && site !== home, 'eligible ants create their next hill')
  assert.ok(Math.hypot(s.x[site] - x, s.y[site] - y) <= 120.01, 'new hills stay near their builders')
  if (home >= 0) assert.ok(Math.hypot(s.x[site] - s.x[home], s.y[site] - s.y[home]) >= 69.99,
    'adjacent hills retain entrance space')
}

{
  const s = scene(), hill = unit('anthill')
  for (let i = 0; i < 10; i++) s.spawn(unit('ant'), 400, 400, RED)
  for (let dx = -180; dx <= 180; dx += 16) for (let dy = -180; dy <= 180; dy += 16) s.addTerrain(400 + dx, 400 + dy, 1)
  s.step()
  assert.equal(s.counts[hill], 0, 'blocked local terrain makes ants wait instead of building far away')
}

{
  const s = scene(), nest = unit('nest')
  const home = s.spawn(nest, 400, 400, RED)
  s.spiders.nestT[home] = 3
  const worker = s.spawn(unit('spider'), 400, 420, RED)
  let built = false
  for (let k = 0; k < 15 * 60 && !built; k++) {
    const x = s.x[worker], y = s.y[worker]
    s.step()
    for (let j = 0; j < s.n; j++) if (j !== home && s.alive[j] && s.type[j] === nest) {
      assert.ok(Math.hypot(s.x[j] - x, s.y[j] - y) <= 120.01, 'expansion stays near the spider that builds it')
      assert.ok(Math.hypot(s.x[j] - s.x[home], s.y[j] - s.y[home]) >= 69.99, 'nests keep their entrances clear')
      built = true
    }
  }
  assert.ok(built, 'an idle spider can still expand locally')
}

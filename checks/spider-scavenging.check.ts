// Run only with owner permission: node checks/spider-scavenging.check.ts
import assert from 'node:assert/strict'
import { BLUE, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const type = UNITS.findIndex((u) => u.key === key)
  assert.ok(type >= 0, `missing unit: ${key}`)
  return type
}

const s = new Sim()
s.resize(1800, 700)
const spider = unit('spider'), nest = s.spawn(unit('nest'), 150, 350, RED)
s.spiders.nestT[nest] = 3
const worker = s.spawn(spider, 160, 360, RED)
for (let k = 0; k < 90; k++) s.step()
assert.equal(s.spiders.home[worker], nest, 'worker adopts the completed nest')

const corpse = (x: number, y: number) => {
  const victim = s.spawn(unit('goose'), x, y, BLUE)
  s.damage(victim, 10000, 0, 0)
  const body = Array.from({ length: s.cn }, (_, i) => i).find((i) => s.cAlive[i] && s.cX[i] === x && s.cY[i] === y)
  assert.ok(body !== undefined, 'a dead creature leaves collectible food')
  return body
}

const far = corpse(1400, 350)
let claimed = false, travelled = false, returned = false
for (let k = 0; k < 120 * 60 && s.spiders.cocoons[nest] === 0; k++) {
  s.step()
  claimed ||= s.cSpider[far] === worker
  travelled ||= s.x[worker] > 1000
  returned ||= s.cX[far] < 1000
  if (k === 35 * 60) assert.equal(s.cAlive[far], 1, 'food being fetched survives the usual corpse expiry')
}
assert.ok(claimed && travelled && returned, 'worker claims a distant corpse, travels out and drags it back')
assert.equal(s.spiders.cocoons[nest], 1, 'a trip lasting over twenty seconds still finishes as a cocoon')
assert.equal(s.cAlive[far], 0, 'wrapping consumes the corpse')

for (let meal = 1; meal < 5; meal++) {
  corpse(400, 350)
  for (let k = 0; k < 40 * 60 && s.spiders.cocoons[nest] === meal; k++) s.step()
  if (meal < 4) assert.equal(s.spiders.cocoons[nest], meal + 1, 'each fetched creature adds a cocoon')
}
for (let k = 0; k < 120 && s.counts[spider] === 1; k++) s.step()
assert.equal(s.counts[spider], 2, 'five fetched creatures produce a new spider')

console.log('ok: distant corpse search, collection priority, long return trips, wrapping and offspring')

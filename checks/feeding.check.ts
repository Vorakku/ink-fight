// Unrun. Run only with owner permission: node checks/feeding.check.ts
import assert from 'node:assert/strict'
import { BLUE, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const t = UNITS.findIndex((u) => u.key === key)
  assert.ok(t >= 0, `missing ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(1800, 900); return s }
const advance = (s: Sim, ticks: number) => { for (let k = 0; k < ticks; k++) s.step() }
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} != ${expected}`)
const meal = (s: Sim, eater: number, key = 'goose', side = BLUE) => {
  const prey = s.spawn(unit(key), 800, 400, side)
  s.damage(prey, Infinity, 0, 0, eater)
  return prey
}

{ // Repeated enemy meals keep increasing size, health and actual attack damage beyond the old snake caps.
  const s = scene(), cat = s.spawn(unit('cat'), 300, 400, RED), def = UNITS[s.type[cat]]
  for (let n = 1; n <= 32; n++) {
    s.hp[cat] = 1
    meal(s, cat)
    assert.equal(s.meals[cat], n)
    close(s.growth(cat), 1 + n * 0.05)
    close(s.hp[cat], def.hp * (1 + n * 0.1))
  }
  const target = s.spawn(unit('giant'), 600, 400, BLUE), before = s.hp[target]
  s.hit(target, def, 0, 0, cat)
  close(before - s.hp[target], def.dmg * 4.2)
  assert.equal(s.grow[cat], 0, 'eating never reuses a special-ability counter')
  assert.equal(s.counts[unit('snake')], 0, 'other eaters do not summon little snakes')
}

for (const key of ['hedgehog', 'mantis', 'antlion']) {
  const s = scene(), eater = s.spawn(unit(key), 300, 400, RED)
  meal(s, eater, 'goose')
  assert.equal(s.meals[eater], 0, `${key} uses the conservative Bug-only diet`)
  meal(s, eater, 'ant')
  assert.equal(s.meals[eater], 1, `${key} can eat a defeated bug`)
}

for (const key of ['goose', 'llama', 'capybara', 'kangaroo', 'mozzie', 'flea', 'bedbug', 'millipede',
  'dungbeetle', 'firefly', 'moth', 'bee', 'hercules', 'mayfly', 'twig', 'termite', 'wasp', 'cicada', 'locust',
  'phoenix', 'unicorn', 'pegasus', 'centaur', 'giant', 'gargoyle']) {
  const s = scene(), fighter = s.spawn(unit(key), 300, 400, RED), originalSize = s.growth(fighter)
  meal(s, fighter)
  assert.equal(s.meals[fighter], 0, `${key} is not an enemy eater`)
  assert.equal(s.growth(fighter), originalSize)
}

{ // Allied, artificial and undead casualties do not become meals; Food fighters can.
  const s = scene(), cat = s.spawn(unit('cat'), 300, 400, RED)
  meal(s, cat, 'goose', RED)
  for (const key of ['anthill', 'nest', 'car', 'gargoyle', 'zombie', 'vampire']) meal(s, cat, key)
  const copy = s.spawn(unit('wukong'), 800, 400, BLUE)
  s.grow[copy] = -1
  s.damage(copy, Infinity, 0, 0, cat)
  assert.equal(s.meals[cat], 0)
  meal(s, cat, 'toast')
  assert.equal(s.meals[cat], 1)
}

{ // The body is consumed once; other dead bodies remain available to colony collectors.
  const s = scene(), cat = s.spawn(unit('cat'), 300, 400, RED)
  s.spawn(unit('ant'), 350, 400, RED)
  meal(s, cat)
  assert.equal(s.cAlive.some(Boolean), false, 'an eaten enemy leaves no collectible corpse')
  const other = s.spawn(unit('goose'), 800, 400, BLUE)
  s.damage(other, Infinity, 0, 0)
  assert.equal(s.cAlive.some(Boolean), true, 'unattributed remains can still feed the colony system')
  assert.equal(s.meals[cat], 1)
}

{ // Recovery is not a meal. A roach's third, final death is exactly one meal.
  const s = scene(), cat = s.spawn(unit('cat'), 100, 400, RED)
  const roach = s.spawn(unit('cockroach'), 1000, 400, BLUE)
  s.shockT[cat] = 100
  for (let life = 0; life < 3; life++) {
    s.damage(roach, Infinity, 0, 0, cat)
    assert.equal(s.meals[cat], life === 2 ? 1 : 0)
    if (life < 2) { assert.equal(s.stage[roach], 1); advance(s, 181) }
  }
  const phoenix = s.spawn(unit('phoenix'), 1000, 400, BLUE)
  s.damage(phoenix, Infinity, 0, 0, cat)
  assert.equal(s.stage[phoenix], 1)
  assert.equal(s.meals[cat], 1, 'a phoenix egg is not a final death')
}

{ // Named ranged kills feed their live owner without confusing the projectile with a touching bite.
  const s = scene(), spider = s.spawn(unit('spider'), 300, 400, RED)
  const prey = s.spawn(unit('goose'), 450, 400, BLUE)
  s.hp[prey] = 1; s.shockT[prey] = s.shockT[spider] = 100
  s.attack(spider, prey, 1, 0)
  assert.equal(s.pn, 1)
  advance(s, 30)
  assert.equal(s.alive[prey], 0)
  assert.equal(s.meals[spider], 1)
}

{ // A dead projectile owner's recycled slot cannot receive its meal.
  const s = scene(), shooter = s.spawn(unit('spider'), 300, 400, RED)
  const prey = s.spawn(unit('goose'), 450, 400, BLUE)
  s.hp[prey] = 1; s.shockT[prey] = 100
  s.attack(shooter, prey, 1, 0)
  s.damage(shooter, Infinity, 0, 0)
  const replacement = s.spawn(unit('spider'), 100, 400, RED)
  assert.equal(replacement, shooter)
  s.shockT[replacement] = 100
  advance(s, 30)
  assert.equal(s.alive[prey], 0)
  assert.equal(s.meals[replacement], 0)
}

for (const recycle of [false, true]) {
  const s = scene(), dragon = s.spawn(unit('dragon'), 100, 400, RED)
  const prey = s.spawn(unit('goose'), 1000, 400, BLUE)
  s.hp[prey] = 0.1; s.shockT[prey] = s.shockT[dragon] = 100
  s.ignite(prey, 2, dragon)
  if (recycle) {
    s.damage(dragon, Infinity, 0, 0)
    assert.equal(s.spawn(unit('dragon'), 100, 400, RED), dragon)
    s.shockT[dragon] = 100
  }
  s.step()
  assert.equal(s.alive[prey], 0)
  assert.equal(s.meals[dragon], recycle ? 0 : 1, 'burn kills retain generation-safe attribution')
}

for (const recycle of [false, true]) {
  const s = scene(), skunk = s.spawn(unit('skunk'), 300, 400, RED)
  const prey = s.spawn(unit('goose'), 340, 400, BLUE)
  s.shockT[prey] = 100; s.hp[prey] = 0.01
  s.abilityCd[skunk] = 0
  s.step() // spray a cloud instead of making a melee attack
  assert.ok(s.kLife.some((life) => life > 0))
  if (recycle) {
    s.damage(skunk, Infinity, 0, 0)
    assert.equal(s.spawn(unit('skunk'), 300, 400, RED), skunk)
    s.shockT[skunk] = 100
  }
  s.step()
  assert.equal(s.alive[prey], 0)
  assert.equal(s.meals[skunk], recycle ? 0 : 1, 'cloud kills retain generation-safe attribution')
}

{ // Noodle keeps its original tail/health growth; ants keep their separate ability counter.
  const s = scene(), snake = s.spawn(unit('snake'), 100, 400, RED)
  for (let k = 0; k < 12; k++) meal(s, snake)
  assert.equal(s.grow[snake], 12)
  assert.equal(s.meals[snake], 12)
  close(s.growth(snake), 2.2)
  close(s.hp[snake], UNITS[s.type[snake]].hp + 12 * 30)
  close(s.strength(snake), 2.2)
  const ant = s.spawn(unit('ant'), 200, 400, RED)
  s.grow[ant] = 7
  meal(s, ant)
  assert.equal(s.meals[ant], 1)
  assert.equal(s.grow[ant], 7)
}

{ // Wolf-only eating; grown hydras use their new max health for head thresholds.
  const s = scene(), wolf = s.spawn(unit('werewolf'), 100, 400, RED)
  meal(s, wolf)
  assert.equal(s.meals[wolf], 0)
  s.moodT[wolf] = 5
  meal(s, wolf)
  assert.equal(s.meals[wolf], 1)
  const hydra = s.spawn(unit('hydra'), 200, 400, RED)
  for (let k = 0; k < 8; k++) meal(s, hydra)
  s.damage(hydra, s.maxHp(hydra) * 0.4, 0, 0)
  assert.equal(s.layers[hydra], 2)
}

{ // Grown roaches revive to the correct maximum; recycled and cleared slots lose their meals.
  const s = scene(), roach = s.spawn(unit('cockroach'), 100, 400, RED)
  meal(s, roach)
  const max = s.maxHp(roach)
  s.damage(roach, Infinity, 0, 0)
  advance(s, 181)
  close(s.hp[roach], max)
  assert.equal(s.meals[roach], 1)
  const cat = s.spawn(unit('cat'), 300, 400, RED)
  meal(s, cat)
  s.damage(cat, Infinity, 0, 0)
  const next = s.spawn(unit('cat'), 300, 400, RED)
  assert.equal(next, cat)
  assert.equal(s.meals[next], 0)
  assert.equal(s.growth(next), 1)
  meal(s, next)
  s.clear()
  assert.equal(s.meals.some(Boolean), false)
}

console.log('Feeding checks passed')

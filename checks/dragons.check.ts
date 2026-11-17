// Unrun. Run only with owner permission: node checks/dragons.check.ts
import assert from 'node:assert/strict'
import { BLUE, MAX, RED, Sim } from '../src/game/sim.ts'
import { CAVE_T, DRAGON_EGG_T, DRAGON_GROW_T, DRAGON_MEALS } from '../src/game/dragons.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const t = UNITS.findIndex((u) => u.key === key)
  assert.ok(t >= 0, `missing ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(5000, 1200); return s }
const advance = (s: Sim, ticks: number) => { for (let k = 0; k < ticks; k++) s.step() }
const feedTo = (s: Sim, dragon: number, meals: number) => {
  while (s.meals[dragon] < meals) {
    const food = s.spawn(unit('goose'), 4500, 1000, BLUE)
    s.damage(food, Infinity, 0, 0, dragon)
  }
}
const evolve = (s: Sim, dragon: number, tier: number) => {
  feedTo(s, dragon, DRAGON_MEALS[tier])
  for (let k = 0; k < 2400 && s.dragons.tier[dragon] < tier; k++) s.step()
  assert.equal(s.dragons.tier[dragon], tier, `reaches tier ${tier} at its cave`)
}
const eggs = (s: Sim) => Array.from({ length: s.n }, (_, i) => i).filter((i) => s.alive[i] && UNITS[s.type[i]].dragonEgg)
const boss = (side = RED) => {
  const s = scene(), dragon = s.spawn(unit('dragon'), 500, 600, side)
  evolve(s, dragon, 4)
  return { s, dragon, home: s.dragons.home[dragon] }
}

{
  const s = scene(), dragon = s.spawn(unit('dragon'), 500, 600, RED)
  assert.equal(s.dragons.tier[dragon], 0)
  const x = s.x[dragon], y = s.y[dragon]
  for (let tier = 1; tier <= 4; tier++) {
    const previousSize = s.growth(dragon)
    feedTo(s, dragon, DRAGON_MEALS[tier])
    assert.equal(s.growth(dragon), previousSize, 'eating does not increase dragon size, even at an evolution threshold')
    evolve(s, dragon, tier)
    assert.ok(s.growth(dragon) > previousSize && s.growth(dragon) <= previousSize * 1.09,
      'a completed adult evolution makes the dragon only slightly bigger')
    assert.equal(s.hp[dragon], s.maxHp(dragon), 'evolution emerges at the new full health')
    const h = s.dragons.home[dragon]
    assert.ok(s.dragons.validHome(dragon))
    assert.equal(s.dragons.tier[h], tier, 'cave decoration follows completed evolution')
    assert.equal(s.dragons.caveT[h], CAVE_T)
    assert.ok(Math.hypot(s.x[h] - x, s.y[h] - y) <= 120, 'the personal cave is local')
  }
  assert.equal(s.counts[unit('dragon-cave')], 1, 'evolution does not spam caves')
  assert.ok(s.isFlying(dragon), 'an awake ancient or boss dragon flies')
  const bossSize = s.growth(dragon)
  feedTo(s, dragon, 28)
  assert.equal(s.growth(dragon), bossSize, 'a rainbow boss does not keep getting bigger from meals')
  assert.equal(s.hp[dragon], s.maxHp(dragon), 'meals still fully heal it')
  const second = s.spawn(unit('dragon'), 2500, 600, RED)
  evolve(s, second, 4)
  assert.equal(s.dragons.tier[dragon], 4)
  assert.equal(s.dragons.tier[second], 4, 'multiple surviving dragons on one team may become bosses')
}

{
  const s = scene(), dragon = s.spawn(unit('dragon'), 500, 600, RED)
  feedTo(s, dragon, 3)
  for (let k = 0; k < 900 && s.dragons.moltT[dragon] <= 0; k++) s.step()
  assert.ok(s.dragons.moltT[dragon] > 0)
  assert.equal(s.canAct(dragon), false, 'a molting dragon is not available for another job')
  s.damage(dragon, 1, 0, 0)
  assert.equal(s.dragons.moltT[dragon], 0, 'damage interrupts the shell ritual')
  assert.equal(s.dragons.tier[dragon], 0)
  assert.equal(s.meals[dragon], 3, 'interruption does not spend meals')
  evolve(s, dragon, 1)
  for (let k = 0; k < 600 && !s.dragons.sleep[dragon]; k++) s.step()
  assert.equal(s.dragons.sleep[dragon], 1)
  s.damage(dragon, s.maxHp(dragon) * 0.3, 0, 0)
  const wounded = s.hp[dragon]
  assert.equal(s.dragons.sleep[dragon], 0, 'wounds wake a sleeper')
  advance(s, 900)
  assert.ok(s.hp[dragon] > wounded && s.hp[dragon] <= s.maxHp(dragon), 'rest slowly heals without exceeding the maximum')
  const foe = s.spawn(unit('giant'), s.x[dragon] + 100, s.y[dragon], BLUE)
  s.shockT[foe] = 100; s.cd[dragon] = 100
  s.step()
  assert.equal(s.dragons.sleep[dragon], 0, 'nearby enemies wake the dragon')
  s.dragons.sleep[dragon] = 1
  s.damage(s.dragons.home[dragon], 1, 0, 0, foe)
  assert.equal(s.dragons.sleep[dragon], 0, 'attacking its cave also wakes its owner')
  assert.equal(s.target[dragon], foe)
}

{ // Red fireballs explode into enemy-only damage while the original fire breath remains available.
  const s = scene(), dragon = s.spawn(unit('dragon'), 300, 400, RED)
  s.dragons.tier[dragon] = 1; s.meals[dragon] = 3; s.hp[dragon] = s.maxHp(dragon); s.cd[dragon] = 100
  const foe = s.spawn(unit('giant'), 500, 400, BLUE), friend = s.spawn(unit('goose'), 510, 415, RED)
  s.hp[foe] = 10000; s.shockT[foe] = s.shockT[friend] = 100
  const friendlyHp = s.hp[friend]
  s.step()
  assert.ok(s.pDragon.subarray(0, s.pn).some(Boolean))
  advance(s, 70)
  assert.ok(s.hp[foe] < 10000)
  assert.equal(s.hp[friend], friendlyHp)
}

{ // Blue lightning chains to nearby enemies and spares friends.
  const s = scene(), dragon = s.spawn(unit('dragon'), 300, 400, RED)
  s.dragons.tier[dragon] = 2; s.cd[dragon] = 100
  const first = s.spawn(unit('giant'), 400, 400, BLUE), second = s.spawn(unit('giant'), 470, 400, BLUE)
  const friend = s.spawn(unit('goose'), 430, 430, RED)
  s.shockT[first] = s.shockT[second] = s.shockT[friend] = 100
  const hp = s.hp[first], friendlyHp = s.hp[friend]
  s.step()
  assert.ok(s.hp[first] < hp && s.hp[second] < hp)
  assert.equal(s.hp[friend], friendlyHp)
  assert.ok(s.zLife.some((life) => life > 0), 'chain lightning is visible')
}

{ // Violet dragons fly, commit a dive to a ground spot, and can have that move interrupted.
  const s = scene(), dragon = s.spawn(unit('dragon'), 300, 400, RED)
  s.dragons.tier[dragon] = 3; s.cd[dragon] = 100
  const foe = s.spawn(unit('giant'), 500, 400, BLUE)
  s.hp[foe] = 10000; s.shockT[foe] = 100
  s.step()
  assert.equal(s.isFlying(dragon), true)
  assert.ok(s.dragons.diveT[dragon] > 0)
  advance(s, 43)
  assert.ok(s.hp[foe] < 10000)
  assert.ok(s.qLife.some((life) => life > 0), 'the dive leaves a small impact ring')
  s.dragons.diveT[dragon] = 0.5
  s.stopMoves(dragon)
  assert.equal(s.dragons.diveT[dragon], 0)
}

{ // Rainbow breath charges before a single enemy-only line hit; damage cancels another charge.
  const s = scene(), dragon = s.spawn(unit('dragon'), 300, 400, RED)
  s.dragons.tier[dragon] = 4; s.meals[dragon] = 25; s.hp[dragon] = s.maxHp(dragon); s.cd[dragon] = 100
  const foe = s.spawn(unit('giant'), 650, 400, BLUE), friend = s.spawn(unit('goose'), 500, 400, RED)
  s.hp[foe] = 10000; s.shockT[foe] = s.shockT[friend] = 100
  const friendlyHp = s.hp[friend]
  s.step()
  assert.equal(s.dragons.ray[dragon], 1)
  assert.equal(s.hp[foe], 10000)
  advance(s, 74)
  assert.equal(s.dragons.ray[dragon], 2)
  assert.ok(s.hp[foe] < 10000)
  assert.equal(s.hp[friend], friendlyHp)
  s.dragons.ray[dragon] = 1; s.dragons.rayT[dragon] = 1
  s.damage(dragon, 1, 0, 0, foe)
  assert.equal(s.dragons.ray[dragon], 0)
}

{
  const { s, dragon, home } = boss()
  advance(s, 5)
  assert.equal(eggs(s).length, 0, 'boss status alone does not produce eggs')
  feedTo(s, dragon, 33)
  advance(s, 10)
  assert.equal(eggs(s).length, 2, 'eight additional meals pay for exactly two eggs')
  for (const egg of eggs(s)) assert.equal(s.team[egg], s.team[dragon])
  feedTo(s, dragon, 37)
  advance(s, 10)
  assert.equal(eggs(s).length, 2, 'a cave cannot incubate more than two eggs')
  s.damage(home, Infinity, 0, 0)
  assert.equal(eggs(s).length, 0, 'destroying the cave destroys its eggs')
  assert.equal(s.dragons.home[dragon], -1)
  assert.equal(s.dragons.tier[dragon], 4, 'losing a cave does not erase evolution')
  advance(s, 600)
  assert.ok(s.dragons.validHome(dragon), 'a surviving dragon rebuilds its cave')
}

{ // Parent death leaves sheltered eggs; children inherit the exact FFA side and start green and small.
  const { s, dragon } = boss(-1)
  const side = s.team[dragon]
  feedTo(s, dragon, 33); advance(s, 10)
  const waiting = eggs(s)
  assert.equal(waiting.length, 2)
  s.damage(dragon, Infinity, 0, 0)
  for (const egg of waiting) s.dragons.eggT[egg] = DRAGON_EGG_T
  s.dragons.step()
  assert.equal(s.counts[unit('dragon')], 2)
  for (let i = 0; i < s.n; i++) if (s.alive[i] && UNITS[s.type[i]].dragon) {
    assert.equal(s.team[i], side)
    assert.equal(s.dragons.tier[i], 0)
    assert.equal(s.meals[i], 0)
    assert.equal(s.dragons.hatchling[i], 1)
    assert.equal(s.dragons.maturity[i], 0, 'an egg-born dragon starts as an immature juvenile')
    assert.ok(s.growth(i) < 1)
    assert.equal(s.hp[i], s.maxHp(i))
  }
}

{ // A hatchling grows naturally to adult size while staying in its green, unevolved form.
  const s = scene(), child = s.spawn(unit('dragon'), 500, 600, RED)
  s.dragons.hatchling[child] = 1; s.dragons.maturity[child] = 0; s.hp[child] = s.maxHp(child)
  const bornSize = s.growth(child), bornPower = s.strength(child)
  advance(s, 15 * 60)
  assert.ok(s.growth(child) > bornSize && s.growth(child) < 1, 'size increases gradually before evolution')
  assert.ok(s.strength(child) > bornPower, 'natural maturation also develops its power')
  assert.equal(s.dragons.tier[child], 0)
  advance(s, (DRAGON_GROW_T - 15) * 60)
  assert.equal(s.dragons.maturity[child], 1)
  assert.equal(s.growth(child), 1)
  assert.equal(s.dragons.tier[child], 0, 'adulthood alone does not grant an evolution without meals')
}

{ // Meals speed up juvenile growth, but reaching a meal threshold cannot evolve an immature child.
  const s = scene(), child = s.spawn(unit('dragon'), 500, 600, RED)
  s.dragons.hatchling[child] = 1; s.dragons.maturity[child] = 0; s.hp[child] = s.maxHp(child)
  const bornSize = s.growth(child)
  feedTo(s, child, 3)
  assert.ok(s.growth(child) > bornSize && s.growth(child) < 1, 'juveniles get bigger by eating')
  assert.ok(Math.abs(s.hp[child] - s.maxHp(child)) < 0.001, 'a meal heals to the juvenile’s new maximum')
  advance(s, 10 * 60)
  assert.ok(s.dragons.maturity[child] < 1)
  assert.equal(s.dragons.tier[child], 0, 'three meals cannot skip the juvenile period')
  assert.equal(s.dragons.home[child], -1, 'the child waits until adulthood to start its evolution cave')
  feedTo(s, child, 6)
  assert.equal(s.dragons.maturity[child], 1, 'enough food plus time can mature a hatchling sooner')
  assert.equal(s.growth(child), 1)
  evolve(s, child, 1)
  assert.equal(s.meals[child], 6, 'juvenile meals are retained toward evolution')
  const adultSize = s.growth(child)
  feedTo(s, child, 7)
  assert.equal(s.growth(child), adultSize, 'eating stops changing size after adulthood')
  s.damage(child, Infinity, 0, 0)
  const replacement = s.spawn(unit('dragon'), 500, 600, RED)
  assert.equal(replacement, child)
  assert.equal(s.dragons.hatchling[replacement], 0)
  assert.equal(s.dragons.maturity[replacement], 1, 'painted replacements start as adults')
  s.clear()
  assert.equal(s.dragons.maturity.every((m) => m === 1), true, 'clear resets juvenile progress')
}

{ // A full page defers hatching and keeps the paid-for egg until a slot is available.
  const { s, dragon } = boss()
  feedTo(s, dragon, 29); advance(s, 10)
  const egg = eggs(s)[0]
  assert.ok(egg >= 0)
  s.dragons.eggT[egg] = DRAGON_EGG_T
  let filler = -1
  while (true) {
    const next = s.spawn(unit('goose'), 20, 20, RED)
    if (next < 0) break
    filler = next
  }
  assert.equal(s.alive.reduce((a, b) => a + b, 0), MAX)
  s.dragons.step()
  assert.equal(s.alive[egg], 1)
  assert.equal(s.counts[unit('dragon')], 1)
  s.damage(filler, Infinity, 0, 0)
  s.dragons.step()
  assert.equal(s.counts[unit('dragon')], 2)
  assert.equal(s.alive[egg], 0)
  s.clear()
  assert.equal(s.dragons.tier.some(Boolean), false)
  assert.equal(s.dragons.home.some((h) => h >= 0), false)
  assert.equal(s.dragons.ray.some(Boolean), false)
}

console.log('Dragon checks passed')

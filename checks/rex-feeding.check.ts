// Run only with the owner's permission: node checks/rex-feeding.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, type Fighter } from '../src/game/battle.ts'
import { TREX, TREX_ALPHA, TREX_FEED } from '../src/game/rex.ts'
import type { Species } from '../src/game/units.ts'

const scene = () => {
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const rex = battle.spawn(400, 500, 'red', 'rex')!
  rex.skillCooldown = 100 // Isolate feeding and bites from random roars.
  rex.rexStompCooldown = 100
  return { battle, rex }
}
const advance = (battle: Battle, ticks: number) => { for (let k = 0; k < ticks; k++) battle.step() }
const kill = (battle: Battle, rex: Fighter, species: Species = 'goose') => {
  const prey = battle.spawn(rex.x + 20, rex.y, 'blue', species)!
  prey.hp = 1
  prey.stun = 100
  rex.cooldown = 0
  battle.step()
  const body = battle.splats.find((body) => body.meal?.victim === prey)!
  assert.ok(body, 'A T-Rex kill leaves an owned body')
  assert.equal(body.meal?.owner, rex)
  return body
}
const eat = (battle: Battle, rex: Fighter, species: Species = 'goose') => {
  const before = rex.rexMeals, body = kill(battle, rex, species)
  for (let k = 0; k < 180 && rex.rexMeals === before; k++) battle.step()
  assert.equal(rex.rexMeals, before + 1)
  assert.ok(body.life <= 0)
}

// Meals heal and grant permanent health; bigger animals are still one meal each.
{
  const { battle, rex } = scene()
  rex.hp = 100
  kill(battle, rex)
  assert.equal(rex.rexMeals, 0, 'A kill alone is not a completed meal')
  assert.equal(rex.hp, 100)
  for (let k = 0; k < 180 && rex.rexMeals === 0; k++) battle.step()
  assert.equal(rex.rexMeals, 1)
  assert.equal(rex.rexNutrition, 1)
  assert.equal(rex.hp, TREX.hp + TREX_FEED.health)
  advance(battle, 60)
  assert.equal(rex.rexMeals, 1, 'An eaten body cannot grant a second reward')
  eat(battle, rex, 'rex')
  assert.equal(rex.rexMeals, 2)
  assert.equal(rex.rexNutrition, 5, 'A larger body grants more nutrition')
  assert.equal(rex.hp, TREX.hp + 5 * TREX_FEED.health)
}

// The actual fiftieth meal transforms; alpha bites are stronger, faster and bleed.
{
  const { battle, rex } = scene()
  rex.rexMeals = rex.rexNutrition = TREX_ALPHA.meals - 2
  eat(battle, rex)
  assert.equal(rex.rexMeals, 49)
  assert.equal(rex.hp, TREX.hp + 49 * TREX_FEED.health)
  const enemy = battle.spawn(rex.x + 30, rex.y, 'blue', 'thor')!
  enemy.hp = 1000
  enemy.stun = 100
  rex.cooldown = 0
  battle.step()
  assert.equal(enemy.hp, 1000 - TREX.damage, 'Forty-nine meals retain the normal bite')
  assert.equal(enemy.bleed, 0)
  enemy.hp = 0
  battle.step()
  eat(battle, rex)
  assert.equal(rex.rexMeals, TREX_ALPHA.meals)
  assert.equal(rex.hp, TREX_ALPHA.hp + TREX_ALPHA.meals * TREX_FEED.health)
  assert.ok(rex.evolution > 0)
  const victim = battle.spawn(rex.x + 30, rex.y, 'blue', 'thor')!
  victim.hp = 1000
  victim.stun = 100
  rex.skillCooldown = 100
  rex.cooldown = 0
  battle.step()
  assert.ok(Math.abs(victim.hp - (1000 - TREX_ALPHA.damage - TREX_ALPHA.bleedDamage * DT)) < 0.001)
  assert.equal(rex.cooldown, TREX_ALPHA.cooldown)
  assert.ok(victim.bleed > TREX_ALPHA.bleed - DT * 1.1)
  assert.equal(victim.bleedOwner, rex)
}

// Growth changes bite reach gradually and stops increasing at the alpha threshold.
for (const meals of [0, 25, 50, 500]) {
  const { battle, rex } = scene()
  rex.rexMeals = meals
  const victim = battle.spawn(rex.x + 46, rex.y, 'blue', 'rex')!
  victim.hp = 1000
  victim.stun = 100
  battle.step()
  assert.equal(victim.hp < 1000, meals > 0, 'Growing collision and reach let larger T-Rexes bite farther')
}
for (const meals of [50, 500]) {
  const { battle, rex } = scene()
  rex.rexMeals = meals
  const victim = battle.spawn(rex.x + 54, rex.y, 'blue', 'rex')!
  victim.hp = 1000
  victim.stun = 100
  battle.step()
  assert.equal(victim.hp, 1000, 'Even hundreds of meals cannot extend reach past the growth cap')
}

// Combat takes priority both before a meal starts and after feeding has begun.
{
  const { battle, rex } = scene()
  const body = kill(battle, rex)
  const enemy = battle.spawn(rex.x + 30, rex.y, 'blue', 'thor')!
  enemy.hp = 10000
  enemy.stun = 100
  rex.cooldown = 0
  battle.step()
  assert.ok(enemy.hp < 10000)
  assert.equal(rex.feeding, null)
  assert.equal(rex.rexMeals, 0)
  enemy.hidden = true
  battle.step()
  assert.equal(rex.feeding?.body, body)
  enemy.hidden = false
  rex.cooldown = 0
  const hp = enemy.hp
  battle.step()
  assert.ok(enemy.hp < hp)
  assert.equal(rex.feeding, null)
  assert.ok(body.life > 0)
  enemy.hp = 0
  for (let k = 0; k < 180 && rex.rexMeals === 0; k++) battle.step()
  assert.equal(rex.rexMeals, 1)
}

// Bleeding expires, never stacks, and lethal ticks preserve meal ownership.
{
  const { battle, rex } = scene()
  rex.rexMeals = TREX_ALPHA.meals
  const victim = battle.spawn(rex.x + 30, rex.y, 'blue', 'thor')!
  victim.hp = 1000
  victim.stun = 100
  battle.step()
  rex.stun = 100
  advance(battle, 300)
  assert.equal(victim.bleed, 0)
  assert.equal(victim.bleedOwner, null)
  assert.ok(Math.abs(victim.hp - (1000 - TREX_ALPHA.damage - TREX_ALPHA.bleedDamage * TREX_ALPHA.bleed)) < 0.001)
  const hp = victim.hp
  advance(battle, 60)
  assert.equal(victim.hp, hp)
  rex.stun = 0
  rex.cooldown = 0
  victim.x = rex.x + 30; victim.y = rex.y
  battle.step()
  rex.cooldown = 0
  victim.x = rex.x + 30; victim.y = rex.y
  battle.step()
  assert.ok(victim.bleed <= TREX_ALPHA.bleed, 'Another bite refreshes a single timer')
  victim.hp = TREX_ALPHA.bleedDamage * DT * 0.5
  rex.stun = 100
  battle.step()
  assert.equal(victim.hp <= 0, true)
  assert.ok(battle.splats.some((body) => body.meal?.victim === victim && body.meal.owner === rex))
}

// Buildings and allies never bleed, and death/Clear/conversion remove status.
{
  const { battle, rex } = scene()
  rex.rexMeals = TREX_ALPHA.meals
  const ally = battle.spawn(rex.x - 30, rex.y, 'red', 'goose')!
  ally.stun = 100
  const hill = battle.spawn(rex.x + 30, rex.y, 'blue', 'anthill')!
  battle.step()
  assert.equal(hill.hp, 200 - TREX_ALPHA.damage)
  assert.equal(hill.bleed, 0)
  assert.equal(ally.hp, 45)
  assert.equal(ally.bleed, 0)
  rex.bleed = 2
  rex.bleedOwner = ally
  rex.infection = { time: 0.001, team: 'blue' }
  battle.step()
  assert.equal(rex.zombie, true)
  assert.equal(rex.bleed, 0)
  assert.equal(rex.bleedOwner, null)
  assert.equal(rex.feeding, null)
  battle.clear()
  assert.equal(rex.rexMeals, 0)
  assert.equal(rex.rexNutrition, 0)
  assert.equal(ally.bleedOwner, null)
  const fresh = battle.spawn(400, 500, 'red', 'rex')!
  assert.equal(fresh.rexMeals, 0)
  assert.equal(fresh.bleed, 0)
}

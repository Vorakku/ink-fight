import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'

// Run only with the owner's permission.

// Enemies take priority over available food and interrupt an unfinished meal.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  const victim = battle.spawn(330, 450, 'blue', 'goose')!
  victim.hp = 1
  victim.stun = 100
  battle.step()
  const body = battle.splats.find((body) => body.meal?.owner === dragon)!
  const enemy = battle.spawn(370, 450, 'blue', 'goose')!
  enemy.hp = 10000
  enemy.stun = 100
  dragon.cooldown = 0
  battle.step()
  assert.equal(dragon.target, enemy)
  assert.ok(enemy.hp < 10000, 'The dragon attacks instead of starting a meal')
  assert.equal(dragon.feeding, null)
  assert.equal(dragon.dragonMeals, 0)

  enemy.hidden = true
  battle.step()
  assert.equal(dragon.feeding?.body, body, 'Feeding starts when there is no target')
  enemy.hidden = false
  dragon.cooldown = 0
  const hp = enemy.hp
  battle.step()
  assert.equal(dragon.feeding, null, 'A new threat cancels an unfinished meal')
  assert.ok(enemy.hp < hp, 'The dragon resumes attacking immediately')
  assert.equal(dragon.dragonMeals, 0)
  assert.ok(body.life > 0, 'Interrupted food remains available')

  enemy.hp = 0
  for (let k = 0; k < 240 && dragon.dragonMeals === 0; k++) battle.step()
  assert.equal(dragon.dragonMeals, 1, 'The dragon can eat after combat ends')
}

// A kill leaves prey to eat; feeding heals and permanently increases health exactly once.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  dragon.hp = 300
  const victim = battle.spawn(370, 450, 'blue', 'goose')!
  victim.hp = 1
  victim.stun = 100
  battle.step()
  assert.equal(dragon.dragonKills, 1)
  assert.equal(dragon.dragonMeals, 0)
  assert.equal(dragon.hp, 300, 'Health is earned by eating, rather than by a distant kill alone')
  assert.equal(battle.splats.filter((body) => body.meal?.owner === dragon).length, 1)
  for (let k = 0; k < 240 && dragon.dragonMeals === 0; k++) battle.step()
  assert.equal(dragon.dragonMeals, 1)
  assert.equal(dragon.hp, 725)
  assert.ok(dragon.x > 300, 'The dragon approaches its prey before eating')
  assert.equal(battle.splats.filter((body) => body.meal?.owner === dragon).length, 0)
  for (let k = 0; k < 30; k++) battle.step()
  assert.equal(dragon.dragonMeals, 1)
  dragon.hp = 200
  const next = battle.spawn(dragon.x + 50, dragon.y, 'blue', 'goose')!
  next.hp = 1
  next.stun = 100
  dragon.cooldown = 0
  battle.step()
  for (let k = 0; k < 240 && dragon.dragonMeals === 1; k++) battle.step()
  assert.equal(dragon.dragonMeals, 2)
  assert.equal(dragon.hp, 750)
  assert.equal(dragon.dragonForm, 0)
}

// Stun pauses feeding; another dragon cannot consume a kill it did not earn.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  const other = battle.spawn(380, 450, 'red', 'dragon')!
  other.stun = 100
  const victim = battle.spawn(370, 450, 'blue', 'goose')!
  victim.hp = 1
  victim.stun = 100
  battle.step()
  dragon.stun = 100
  other.stun = 0
  for (let k = 0; k < 60; k++) battle.step()
  assert.equal(dragon.dragonMeals, 0)
  assert.equal(other.dragonMeals, 0)
  assert.equal(battle.splats.filter((body) => body.meal?.owner === dragon).length, 1)
  dragon.stun = 0
  for (let k = 0; k < 240 && dragon.dragonMeals === 0; k++) battle.step()
  assert.equal(dragon.dragonMeals, 1)
  assert.equal(other.dragonMeals, 0)
}

// Evolution preserves earned health capacity; rebirth never becomes a meal.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  dragon.dragonKills = 49
  dragon.dragonProgress = 49
  dragon.dragonMeals = 2
  dragon.dragonNutrition = 2
  dragon.hp = 400
  dragon.iceDiveCooldown = dragon.lightningSwordCooldown = 100
  const victim = battle.spawn(370, 450, 'blue', 'goose')!
  victim.hp = 1
  victim.stun = 100
  battle.step()
  assert.equal(dragon.dragonForm, 1)
  assert.equal(dragon.hp, 600, 'Evolution adds form health while preserving existing wounds')
  for (let k = 0; k < 240 && dragon.dragonMeals === 2; k++) battle.step()
  assert.equal(dragon.dragonMeals, 3)
  assert.equal(dragon.hp, 975, 'Ice health includes the permanent bonus from every meal')
  const phoenix = battle.spawn(dragon.x + 60, dragon.y, 'blue', 'phoenix')!
  phoenix.hp = 1
  phoenix.stun = 100
  dragon.cooldown = 0
  battle.step()
  assert.equal(phoenix.stage, 'egg')
  assert.equal(dragon.dragonKills, 50)
  assert.equal(battle.splats.filter((body) => body.meal).length, 0)
  battle.clear()
  assert.equal(dragon.feeding, null)
  assert.equal(battle.splats.length, 0)
  const fresh = battle.spawn(300, 450, 'red', 'dragon')!
  assert.equal(fresh.dragonMeals, 0)
  assert.equal(fresh.dragonNutrition, 0)
  assert.equal(fresh.dragonProgress, 0)
  assert.equal(fresh.hp, 700)
}

// Burn kills also leave food, while conversion prevents the former dragon from feeding.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  const victim = battle.spawn(370, 450, 'blue', 'goose')!
  victim.hp = 6
  victim.stun = 100
  battle.step()
  dragon.stun = 100
  for (let k = 0; k < 30; k++) battle.step()
  assert.equal(dragon.dragonKills, 1)
  assert.equal(battle.splats.filter((body) => body.meal?.owner === dragon).length, 1)
  dragon.infection = { time: 0.001, team: 'blue' }
  battle.step()
  dragon.stun = 0
  for (let k = 0; k < 120; k++) battle.step()
  assert.equal(dragon.zombie, true)
  assert.equal(dragon.feeding, null)
  assert.equal(dragon.dragonMeals, 0)
}

// Larger bodies award more health and evolution progress only after being eaten.
for (const [species, form, value, health] of [
  ['goose', 0, 1, 725],
  ['rex', 0, 4, 800],
  ['dragon', 3, 9, 925],
] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  dragon.hp = 300
  const victim = battle.spawn(370, 450, 'blue', species)!
  victim.dragonForm = form
  victim.hp = 1
  victim.stun = 100
  battle.step()
  assert.equal(dragon.dragonKills, 1)
  assert.equal(dragon.dragonProgress, 1, 'The kill grants one point before the body is eaten')
  assert.equal(dragon.dragonNutrition, 0)
  assert.equal(dragon.hp, 300)
  for (let k = 0; k < 240 && dragon.dragonMeals === 0; k++) battle.step()
  assert.equal(dragon.dragonMeals, 1)
  assert.equal(dragon.dragonKills, 1, 'A big meal still represents just one actual kill')
  assert.equal(dragon.dragonNutrition, value)
  assert.equal(dragon.dragonProgress, value)
  assert.equal(dragon.hp, health)
  for (let k = 0; k < 30; k++) battle.step()
  assert.equal(dragon.dragonProgress, value, 'An eaten body cannot grant its bonus again')
}

// A large meal can trigger each evolution early, carrying its extra progress forward.
for (const [form, progress, nextForm, health] of [
  [0, 48, 1, 1000],
  [1, 98, 2, 1200],
  [2, 148, 3, 1500],
] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  dragon.dragonForm = form
  dragon.dragonKills = dragon.dragonProgress = progress
  dragon.iceDiveCooldown = dragon.lightningSwordCooldown = 100
  dragon.hp = 300
  const victim = battle.spawn(370, 450, 'blue', 'rex')!
  victim.hp = 1
  victim.stun = 100
  battle.step()
  assert.equal(dragon.dragonProgress, progress + 1)
  assert.equal(dragon.dragonForm, form, 'The larger reward waits until feeding finishes')
  for (let k = 0; k < 240 && dragon.dragonMeals === 0; k++) battle.step()
  assert.equal(dragon.dragonForm, nextForm)
  assert.equal(dragon.dragonProgress, progress + 4, 'Surplus progress carries into the next stage')
  assert.equal(dragon.dragonKills, progress + 1)
  assert.equal(dragon.hp, health)
}

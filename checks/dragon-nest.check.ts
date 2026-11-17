// Run only with the owner's permission: node checks/dragon-nest.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, MAX_FIGHTERS, type Fighter } from '../src/game/battle.ts'
import { DRAGON_BABY, DRAGON_EGG, DRAGON_FEED, DRAGON_NEST } from '../src/game/dragon.ts'
import type { Team } from '../src/game/units.ts'

const advance = (battle: Battle, ticks: number) => { for (let k = 0; k < ticks; k++) battle.step() }
const scene = () => { const battle = new Battle(() => 0.99); battle.resize(1600, 1000); return battle }
const eggs = (battle: Battle, home: Fighter) => battle.fighters.filter((f) => f.hp > 0 && f.species === 'dragon-egg' && f.dragonHome === home)
const settle = (battle: Battle, team: Team = 'red') => {
  const dragon = battle.spawn(500, 500, team, 'dragon')!
  for (let k = 0; k < 900 && !dragon.dragonSleeping; k++) battle.step()
  assert.ok(dragon.dragonSleeping, 'An adult builds a nest and settles down')
  const home = dragon.dragonHome!
  assert.equal(home.nest!.time, DRAGON_NEST.build)
  assert.ok(DRAGON_NEST.size > 1.7 * 1.75 * 1.5, 'The nest is massive even beside a super dragon')
  return { dragon, home }
}
const lay = (battle: Battle, dragon: Fighter) => {
  dragon.dragonLayTime = DRAGON_NEST.lay
  battle.step()
}

// Rest heals, eggs use a timer, and each dragon lays at most two eggs in its lifetime.
for (const team of ['red', 'ffa'] as const) {
  const battle = scene(), { dragon, home } = settle(battle, team)
  assert.equal(eggs(battle, home).length, 0, 'A completed nest does not instantly create eggs')
  dragon.hp -= 20
  const hp = dragon.hp
  advance(battle, 60)
  assert.ok(dragon.hp > hp && dragon.hp <= 700)
  assert.equal(dragon.dragonMeals, 0, 'Egg laying does not require meals')
  lay(battle, dragon)
  const egg = eggs(battle, home)[0]
  assert.ok(egg)
  assert.equal(egg.team, team)
  lay(battle, dragon)
  lay(battle, dragon)
  assert.equal(eggs(battle, home).length, 2)
  assert.equal(dragon.dragonEggsLaid, DRAGON_EGG.maxPerDragon)
  const identity = egg.id
  advance(battle, 60)
  assert.equal(egg.species, 'dragon-egg', 'Incubation lasts longer than a second')
  egg.stageTime = DT
  battle.step()
  assert.equal(egg.species, 'dragon')
  assert.equal(egg.id, identity, 'Hatching reuses the egg slot')
  assert.equal(egg.team, team)
  assert.equal(egg.dragonMaturity, 0)
  assert.equal(egg.dragonForm, 0)
  assert.equal(egg.hp, 700 * DRAGON_BABY.scale)
  assert.equal(egg.dragonHome, null, 'Children eventually make their own nest')
  assert.equal(egg.dragonKills, 0)
  assert.equal(egg.dragonMeals, 0)
  assert.equal(egg.dragonEggsLaid, 0, 'Each baby starts with its own independent lifetime allowance')
  lay(battle, dragon)
  assert.equal(eggs(battle, home).length, 1, 'Hatching does not free up a third birth')
  const second = eggs(battle, home)[0]
  second.stageTime = DT
  battle.step()
  assert.equal(second.species, 'dragon')
  egg.hp = second.hp = 0
  battle.step()
  lay(battle, dragon)
  assert.equal(eggs(battle, home).length, 0, 'Losing children does not reset the allowance')
  assert.equal(dragon.hp, 700, 'Allied nests and eggs do not become FFA combat targets')
}

// Babies must fight AND eat; earned evolution progress waits for adulthood.
{
  const battle = scene()
  const baby = battle.spawn(500, 500, 'red', 'dragon')!
  baby.dragonMaturity = 0
  baby.hp = 700 * DRAGON_BABY.scale - 30
  advance(battle, 180)
  assert.equal(baby.dragonMaturity, 0, 'Idle time alone cannot grow a baby')
  assert.equal(baby.dragonHome, null)
  const enemy = battle.spawn(baby.x + 40, baby.y, 'blue', 'thor')!
  enemy.hp = 10000
  enemy.stun = 100
  const hp = baby.hp
  battle.step()
  assert.ok(baby.dragonTraining > 0, 'Successful attacks earn training')
  assert.ok(baby.dragonMaturity > 0 && baby.dragonMaturity < 1)
  assert.ok(baby.hp > hp, 'Growth adds health capacity without erasing wounds')
  baby.dragonTraining = DRAGON_BABY.training
  baby.cooldown = 0
  battle.step()
  assert.equal(baby.dragonMaturity, 0.5, 'Combat alone supplies only half of adulthood')
  enemy.hp = 0
  battle.step()
  const prey = battle.spawn(baby.x + 30, baby.y, 'blue', 'goose')!
  prey.hp = 1
  prey.stun = 100
  baby.cooldown = 0
  battle.step()
  const meal = battle.splats.find((body) => body.meal?.owner === baby)!
  assert.ok(meal)
  // One normal meal completes the last quarter of the food requirement.
  baby.dragonNutrition = DRAGON_BABY.nutrition - 1
  baby.dragonProgress = 50
  baby.feeding = { body: meal, time: DRAGON_FEED.bite }
  meal.x = baby.x; meal.y = baby.y
  battle.step()
  assert.equal(baby.dragonMaturity, 1)
  assert.equal(baby.dragonForm, 1, 'Saved progress unlocks normal evolution once adult')
  assert.equal(baby.hp, 900 + DRAGON_BABY.nutrition * DRAGON_FEED.health)
}

// An attack on the home wakes its parent; losing the parent leaves eggs intact.
{
  const battle = scene(), { dragon, home } = settle(battle)
  lay(battle, dragon)
  const egg = eggs(battle, home)[0]
  const attacker = battle.spawn(home.x + 115, home.y, 'blue', 'goose')!
  attacker.retaliation = home
  battle.step()
  assert.ok(home.hp < DRAGON_NEST.hp)
  assert.equal(dragon.dragonSleeping, false)
  assert.equal(dragon.target, attacker)
  attacker.hp = 0
  dragon.hp = 0
  battle.step()
  assert.ok(home.hp > 0)
  assert.equal(egg.hp, DRAGON_EGG.hp)
  assert.equal(home.nest!.owner, null)
  egg.stageTime = 0
  battle.step()
  assert.equal(egg.species, 'dragon', 'An orphaned egg can still hatch')
}

// Destroying a nest destroys its eggs and frees the surviving parent to rebuild.
{
  const battle = scene(), { dragon, home } = settle(battle)
  lay(battle, dragon)
  const egg = eggs(battle, home)[0]
  home.hp = 0
  battle.step()
  assert.equal(egg.hp, 0)
  assert.equal(dragon.dragonHome, null)
  assert.equal(dragon.dragonSleeping, false)
  for (let k = 0; k < 900 && !dragon.dragonSleeping; k++) battle.step()
  assert.ok(dragon.dragonHome && dragon.dragonHome !== home)
  assert.equal(dragon.dragonSleeping, true)
  assert.equal(dragon.dragonEggsLaid, 1, 'Rebuilding preserves eggs already laid')
  lay(battle, dragon)
  assert.equal(dragon.dragonEggsLaid, 2)
  const lastEgg = eggs(battle, dragon.dragonHome!)[0]
  assert.ok(lastEgg)
  lastEgg.hp = 0
  battle.step()
  lay(battle, dragon)
  assert.equal(eggs(battle, dragon.dragonHome!).length, 0, 'Destroyed eggs still use a lifetime birth slot')
  battle.clear()
  assert.equal(battle.fighters.length, 0)
  assert.equal(dragon.dragonHome, null)
  assert.equal(dragon.dragonSleeping, false)
}

// A failed spawn at capacity does not consume the parent's birth allowance.
{
  const battle = scene(), { dragon, home } = settle(battle)
  while (battle.fighters.length < MAX_FIGHTERS) {
    const ant = battle.spawn(1400, 850, 'red', 'ant')!
    ant.stun = 100
  }
  lay(battle, dragon)
  assert.equal(dragon.dragonEggsLaid, 0)
  assert.equal(eggs(battle, home).length, 0)
  battle.fighters.find((f) => f.species === 'ant')!.hp = 0
  battle.step()
  lay(battle, dragon)
  assert.equal(dragon.dragonEggsLaid, 1)
  assert.equal(eggs(battle, home).length, 1)
}

// A blocked exit preserves a ready egg; hatching also works at the entity cap.
{
  const battle = scene(), { dragon, home } = settle(battle)
  lay(battle, dragon)
  const egg = eggs(battle, home)[0]
  egg.stageTime = 0
  for (let k = 0; k < 12; k++) {
    const angle = k * Math.PI / 6, exit = DRAGON_NEST.radius + 24
    battle.water.paint(home.x + Math.cos(angle) * exit, home.y + Math.sin(angle) * exit)
  }
  battle.step()
  assert.equal(egg.species, 'dragon-egg')
  assert.ok(egg.hp > 0)
  battle.water.clear()
  while (battle.fighters.length < MAX_FIGHTERS) {
    const ant = battle.spawn(1400, 850, 'red', 'ant')!
    ant.stun = 100
  }
  battle.step()
  assert.equal(egg.species, 'dragon')
  assert.equal(battle.fighters.length, MAX_FIGHTERS)
}

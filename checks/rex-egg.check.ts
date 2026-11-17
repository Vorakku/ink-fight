// Run only with the owner's permission: node checks/rex-egg.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, MAX_FIGHTERS } from '../src/game/battle.ts'
import { TREX, TREX_EGG, TREX_FEED } from '../src/game/rex.ts'
import type { Team } from '../src/game/units.ts'

const advance = (battle: Battle, ticks: number) => { for (let i = 0; i < ticks; i++) battle.step() }
const scene = (team: Team = 'red') => {
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 1100)
  const rex = battle.spawn(500, 500, team, 'rex')!
  return { battle, rex }
}
const eggs = (battle: Battle) => battle.fighters.filter((f) => f.species === 'rex-egg' && f.hp > 0)

// Each adult gets one lifetime egg; the egg becomes an independent young T-Rex.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const { battle, rex } = scene(team)
  advance(battle, Math.ceil(TREX_EGG.lay / DT) + 2)
  assert.equal(rex.rexEggsLaid, 1)
  assert.equal(eggs(battle).length, 1)
  const egg = eggs(battle)[0], identity = egg.id
  assert.equal(egg.team, team)
  assert.equal(egg.hp, TREX_EGG.hp, 'Allied parents do not attack their eggs')
  egg.stageTime = DT
  battle.step()
  assert.equal(egg.species, 'rex')
  assert.equal(egg.id, identity, 'Hatching reuses the same population slot')
  assert.equal(egg.rexBaby, true)
  assert.equal(egg.rexEggsLaid, 0)
  assert.equal(egg.hp, TREX.hp * TREX_EGG.babyScale)
  assert.equal(egg.rexKills, 0)
  assert.equal(egg.rexMeals, 0)
  rex.rexLayTime = TREX_EGG.lay
  advance(battle, Math.ceil(TREX_EGG.lay / DT) + 2)
  assert.equal(eggs(battle).length, 0, 'Neither the spent parent nor the immature baby lays another egg')
  egg.hp = 0
  battle.step()
  rex.rexLayTime = TREX_EGG.lay
  battle.step()
  assert.equal(eggs(battle).length, 0, 'Losing offspring never resets the lifetime limit')
}

// Combat and zombies cannot produce an egg.
{
  const { battle, rex } = scene()
  rex.rexLayTime = TREX_EGG.lay
  const enemy = battle.spawn(800, 500, 'blue', 'goose')!
  enemy.stun = 100
  battle.step()
  assert.equal(eggs(battle).length, 0)
  assert.equal(rex.rexLayTime, 0)
  enemy.hp = 0
  battle.step()
  rex.zombie = true
  rex.rexLayTime = TREX_EGG.lay
  battle.step()
  assert.equal(eggs(battle).length, 0)
}

// Eggs survive a parent's death, and destroying an egg does not refund it.
for (const destroy of ['parent', 'egg'] as const) {
  const { battle, rex } = scene()
  rex.rexLayTime = TREX_EGG.lay
  battle.step()
  const egg = eggs(battle)[0]
  if (destroy === 'parent') {
    rex.hp = 0
    egg.stageTime = DT
    battle.step()
    assert.equal(egg.species, 'rex')
  } else {
    egg.hp = 0
    battle.step()
    rex.rexLayTime = TREX_EGG.lay
    battle.step()
    assert.equal(eggs(battle).length, 0)
  }
}

// Full capacity retains a ready birth, and hatching needs no additional slot.
{
  const { battle, rex } = scene()
  while (battle.fighters.length < MAX_FIGHTERS) {
    const ant = battle.spawn(1500, 850, 'red', 'ant')!
    ant.stun = 100
  }
  rex.rexLayTime = TREX_EGG.lay
  battle.step()
  assert.equal(rex.rexEggsLaid, 0)
  battle.fighters.find((f) => f.species === 'ant')!.hp = 0
  battle.step()
  battle.step()
  const egg = eggs(battle)[0]
  assert.ok(egg)
  assert.equal(rex.rexEggsLaid, 1)
  assert.equal(battle.fighters.length, MAX_FIGHTERS)
  egg.stageTime = DT
  battle.step()
  assert.equal(egg.species, 'rex')
  assert.equal(battle.fighters.length, MAX_FIGHTERS)
}

// The existing feeding path matures a hatchling, with its own egg allowance.
{
  const { battle, rex } = scene()
  rex.rexBaby = true
  rex.hp = TREX.hp * TREX_EGG.babyScale
  const feeding = battle as unknown as { stepFeeding(owner: typeof rex): boolean }
  for (let i = 0; i < TREX_EGG.matureMeals; i++) {
    const victim = battle.spawn(rex.x + 20, rex.y, 'blue', 'goose')!
    victim.hp = 0
    const body = { x: rex.x, y: rex.y, life: 30, color: '#aaa', size: 1, meal: { owner: rex, victim }, body: victim }
    battle.splats.push(body)
    rex.feeding = { body, time: 1 }
    feeding.stepFeeding(rex)
    assert.equal(rex.rexMeals, i + 1)
    assert.equal(rex.rexBaby, i + 1 < TREX_EGG.matureMeals)
  }
  assert.equal(rex.hp, TREX.hp + TREX_EGG.matureMeals * TREX_FEED.health)
  rex.rexLayTime = TREX_EGG.lay
  battle.step()
  assert.equal(rex.rexEggsLaid, 1)
}

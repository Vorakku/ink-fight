// Run only with the owner's permission: node checks/nest-bloodlust.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, MAX_FIGHTERS, type Fighter } from '../src/game/battle.ts'
import { CHARACTERS, type Team } from '../src/game/units.ts'
import { DRAGON_NEST } from '../src/game/dragon.ts'
import { TREX_ALPHA, TREX_BLACK, TREX_BLOODLUST } from '../src/game/rex.ts'

const advance = (battle: Battle, ticks: number) => { for (let k = 0; k < ticks; k++) battle.step() }
const scene = (team: Team = 'red') => {
  const battle = new Battle(() => 0.99)
  battle.resize(2000, 1200)
  const rex = battle.spawn(500, 500, team, 'rex')!
  rex.rexKills = TREX_BLACK.kills
  rex.hp = TREX_ALPHA.hp
  rex.skillCooldown = rex.rexStompCooldown = rex.rexRamCooldown = 100
  return { battle, rex }
}
const helpers = (battle: Battle, caller: { id: number }) => battle.fighters.filter((f) => f.species === 'rex' && f.id !== caller.id)
const finishCall = (battle: Battle) => advance(battle, Math.ceil(TREX_BLOODLUST.call / DT) + 1)

// Every species and side can overlap a nest without collision displacement.
for (const nestTeam of ['red', 'ffa'] as const) {
  for (const team of ['red', 'blue', 'ffa'] as const) {
    for (const species of CHARACTERS) {
      const battle = new Battle(() => 0.99)
      battle.resize(1600, 1000)
      const nest = battle.spawn(600, 500, nestTeam, 'dragon-nest')!
      nest.nest!.time = DRAGON_NEST.build
      const creature = battle.spawn(600, 500, team, species)!
      creature.stun = 100
      battle.step()
      assert.equal(creature.x, 600, `${team} ${species} is not pushed out of the nest`)
      assert.equal(creature.y, 500)
      assert.equal(nest.x, 600)
      assert.equal(nest.y, 500)
    }
  }
}

// A creature can walk across the entire footprint rather than sticking at its rim.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const nest = battle.spawn(600, 500, 'red', 'dragon-nest')!
  nest.nest!.time = DRAGON_NEST.build
  const walker = battle.spawn(450, 500, 'red', 'goose')!
  const enemy = battle.spawn(950, 500, 'blue', 'goose')!
  enemy.hp = 10000; enemy.stun = 100
  walker.retaliation = enemy
  advance(battle, 180)
  assert.ok(walker.x > nest.x + DRAGON_NEST.radius)
}

// Black calls only below half HP, completes its scream first and summons three allies.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const { battle, rex } = scene(team)
  rex.hp = TREX_ALPHA.hp * TREX_BLOODLUST.threshold
  battle.step()
  assert.equal(rex.rexBloodlustCall, 0, 'Exactly half health is not below half')
  rex.hp -= 1
  battle.step()
  assert.ok(rex.rexBloodlustCall > 0)
  assert.ok(rex.roar > 0)
  assert.equal((battle as unknown as { hit(t: Fighter, d: number): boolean }).hit(rex, 50), false, 'The scream is immune')
  assert.equal(rex.rexBloodlust, false)
  assert.equal(helpers(battle, rex).length, 0, 'Helpers wait until the scream finishes')
  finishCall(battle)
  assert.equal(rex.rexBloodlust, true)
  assert.equal(rex.rexBloodlustCall, 0)
  assert.equal(rex.rexReinforcements, 0)
  assert.equal(helpers(battle, rex).length, TREX_BLOODLUST.helpers)
  for (const helper of helpers(battle, rex)) {
    assert.equal(helper.team, team)
    assert.equal(helper.rexKills, 0)
    assert.equal(helper.rexMeals, 0)
  }
  rex.hp = TREX_ALPHA.hp
  advance(battle, 60)
  rex.hp = 400
  advance(battle, 60)
  assert.equal(helpers(battle, rex).length, TREX_BLOODLUST.helpers, 'Healing and reinjury never duplicate the call')
  assert.equal(rex.rexBloodlustCall, 0)
}

// The opening call precedes boosted bites; healing removes the low-health bonus.
{
  const { battle, rex } = scene()
  rex.hp = TREX_ALPHA.hp * 0.45
  finishCall(battle)
  for (const helper of helpers(battle, rex)) helper.stun = 100
  const target = battle.spawn(rex.x + 30, rex.y, 'blue', 'goose')!
  target.hp = 1000; target.stun = 100
  rex.cooldown = 0
  battle.step()
  assert.ok(Math.abs(target.hp - (1000 - TREX_ALPHA.damage * TREX_BLOODLUST.damage - TREX_ALPHA.bleedDamage * DT)) < 0.001)
  rex.hp = TREX_ALPHA.hp
  const next = battle.spawn(rex.x + 30, rex.y, 'blue', 'goose')!
  next.hp = 1000; next.stun = 100
  rex.retaliation = next; rex.cooldown = 0
  battle.step()
  assert.ok(Math.abs(next.hp - (1000 - TREX_ALPHA.damage - TREX_ALPHA.bleedDamage * DT)) < 0.001)
  const distant = battle.spawn(rex.x + 500, rex.y, 'blue', 'goose')!
  distant.stun = 100
  rex.retaliation = distant
  rex.vx = rex.vy = 0
  battle.step()
  const normalSpeed = rex.vx
  rex.hp = TREX_ALPHA.hp * 0.45
  rex.vx = rex.vy = 0
  distant.x = rex.x + 500; distant.y = rex.y
  battle.step()
  assert.ok(Math.abs(rex.vx / normalSpeed - TREX_BLOODLUST.speed) < 0.001)
}

// Normal and albino T-Rexes cannot call helpers, even when badly injured.
for (const meals of [0, 50]) {
  const { battle, rex } = scene()
  rex.rexKills = 0; rex.rexMeals = meals; rex.hp = 1
  finishCall(battle)
  assert.equal(rex.rexBloodlust, false)
  assert.equal(helpers(battle, rex).length, 0)
}

// Incapacitation cancels an unfinished scream without consuming the lifetime call.
for (const status of ['stun', 'frozen', 'fear'] as const) {
  const { battle, rex } = scene()
  rex.hp = TREX_ALPHA.hp * 0.45
  battle.step()
  rex[status] = 1
  battle.step()
  assert.equal(rex.rexBloodlustCall, 0)
  assert.equal(rex.rexBloodlust, false)
  assert.equal(helpers(battle, rex).length, 0)
  rex[status] = 0
  finishCall(battle)
  assert.equal(helpers(battle, rex).length, 3)
}

// Only unfilled helper slots remain pending when the battlefield is at capacity.
{
  const { battle, rex } = scene()
  rex.hp = TREX_ALPHA.hp * 0.45
  while (battle.fighters.length < MAX_FIGHTERS) {
    const filler = battle.spawn(1700, 900, 'red', 'goose')!
    filler.stun = 100
  }
  finishCall(battle)
  assert.equal(rex.rexReinforcements, 3)
  assert.equal(helpers(battle, rex).length, 0)
  battle.fighters.filter((f) => f.species === 'goose').slice(0, 2).forEach((f) => { f.hp = 0 })
  battle.step()
  advance(battle, 16)
  assert.equal(helpers(battle, rex).length, 2)
  assert.equal(rex.rexReinforcements, 1)
  assert.equal(battle.fighters.length, MAX_FIGHTERS)
  battle.fighters.find((f) => f.species === 'goose')!.hp = 0
  battle.step()
  advance(battle, 16)
  assert.equal(helpers(battle, rex).length, 3)
  assert.equal(rex.rexReinforcements, 0)
}

// Blocked dry ground delays helpers; death, conversion and Clear cancel the queue.
for (const end of ['unblock', 'death', 'conversion', 'clear'] as const) {
  const { battle, rex } = scene()
  for (let x = 260; x <= 740; x += 16) for (let y = 260; y <= 740; y += 16) battle.water.paint(x, y)
  rex.hp = TREX_ALPHA.hp * 0.45
  finishCall(battle)
  assert.equal(rex.rexReinforcements, 3)
  assert.equal(helpers(battle, rex).length, 0)
  battle.water.clear()
  if (end === 'death') rex.hp = 0
  if (end === 'conversion') rex.infection = { time: 0.001, team: 'blue' }
  if (end === 'clear') battle.clear()
  else advance(battle, 16)
  assert.equal(helpers(battle, rex).length, end === 'unblock' ? 3 : 0)
  assert.equal(rex.rexReinforcements, 0)
  if (end === 'clear' || end === 'conversion' || end === 'death') assert.equal(rex.rexBloodlust, false)
}

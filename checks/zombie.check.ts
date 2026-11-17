import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'

// Run only with the owner's permission. These exercise real combat and lifecycle steps.

// Surviving a bite turns the same fighter after two seconds, even if the biter dies.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const zombie = battle.spawn(300, 400, 'red', 'zombie')!
  const victim = battle.spawn(320, 400, 'blue', 'thor')!
  victim.stun = 100
  battle.step()
  assert.equal(victim.hp, 593)
  assert.ok(victim.infection)
  assert.equal(victim.team, 'blue')
  zombie.hp = 0
  for (let k = 0; k < 118; k++) battle.step()
  assert.equal(victim.zombie, false, 'Conversion must wait for incubation')
  for (let k = 0; k < 3; k++) battle.step()
  assert.equal(victim.zombie, true)
  assert.equal(victim.team, 'red')
  assert.equal(victim.species, 'thor', 'Conversion preserves the original body')
  assert.equal(victim.hp, 593, 'Conversion never heals or replaces the victim')
  assert.equal(battle.fighters.length, 1)
  victim.stun = 0
  const next = battle.spawn(victim.x + 20, victim.y, 'blue', 'dragon')!
  next.stun = 100
  battle.step()
  assert.equal(next.hp, 693, 'Converted Thor bites instead of using his hammer')
  assert.ok(next.infection, 'Converted fighters spread the infection')
  assert.equal(battle.hammers.length, 0)
  assert.equal(battle.storms.length, 0)
  battle.clear()
  assert.equal(next.infection, null)
  assert.equal(battle.fighters.length, 0)
}

// Different converted bodies share the zombie side in free-for-all.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const zombie = battle.spawn(300, 400, 'ffa', 'zombie')!
  const converted = battle.spawn(325, 400, 'ffa', 'goose')!
  converted.zombie = true
  converted.stun = 100
  const healthy = battle.spawn(345, 400, 'ffa', 'goose')!
  healthy.stun = 100
  zombie.stun = 100
  converted.stun = 0
  battle.step()
  assert.equal(zombie.hp, 90)
  assert.equal(converted.hp, 45)
  assert.equal(healthy.hp, 38, 'A zombie goose fights healthy geese in free-for-all')
  assert.ok(healthy.infection)
}

// The first bite owns the infection; later bites neither reset nor steal it.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const victim = battle.spawn(320, 400, 'blue', 'dragon')!
  const first = battle.spawn(300, 400, 'red', 'zombie')!
  victim.stun = 100
  battle.step()
  first.stun = 100
  for (let k = 0; k < 30; k++) battle.step()
  const remaining = victim.infection!.time
  const second = battle.spawn(victim.x + 20, victim.y, 'ffa', 'zombie')!
  battle.step()
  second.stun = 100
  assert.equal(victim.infection!.team, 'red')
  assert.ok(victim.infection!.time < remaining)
}

// Death into a phoenix egg cancels infection, while an undead phoenix cannot rebirth.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const phoenix = battle.spawn(300, 400, 'blue', 'phoenix')!
  phoenix.infection = { time: 1, team: 'red' }
  phoenix.hp = 0
  battle.step()
  assert.equal(phoenix.stage, 'egg')
  assert.equal(phoenix.infection, null)
  const undead = battle.spawn(600, 400, 'red', 'phoenix')!
  undead.zombie = true
  undead.hp = 0
  battle.step()
  assert.ok(!battle.fighters.includes(undead))
}

// Turning frees tree cover, cancels abilities and releases a held fighter.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  battle.placeTree(300, 400)
  const ninja = battle.spawn(300, 400, 'blue', 'ninja')!
  const tree = ninja.tree!
  assert.equal(tree.occupant, ninja)
  ninja.infection = { time: 0.001, team: 'red' }
  battle.step()
  assert.equal(ninja.zombie, true)
  assert.equal(ninja.hidden, false)
  assert.equal(tree.occupant, null)
  assert.equal(ninja.tree, null)
  assert.equal(ninja.ambush, null)
  const rex = battle.spawn(700, 400, 'blue', 'rex')!
  const held = battle.spawn(720, 400, 'blue', 'goose')!
  rex.grab = { target: held, time: 0.5 }
  held.heldBy = rex
  rex.infection = { time: 0.001, team: 'red' }
  held.stun = 100
  battle.step()
  assert.equal(rex.zombie, true)
  assert.equal(rex.grab, null)
  assert.equal(held.heldBy, null)
}

import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import type { DragonForm } from '../src/game/dragon.ts'

// Run only with the owner's permission.

// Evolution enlarges the dragon's real collision space, not just its drawing.
for (const [form, separation] of [[0, 32], [1, 38.4], [2, 46.4], [3, 56]] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const a = battle.spawn(300, 400, 'red', 'dragon')!
  const b = battle.spawn(310, 400, 'red', 'dragon')!
  a.dragonForm = b.dragonForm = form
  a.stun = b.stun = 100
  battle.step()
  assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - separation) < 0.001)
}

// An ice dive rises before hitting, freezes on landing, and spares allies and airborne enemies.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  dragon.dragonForm = 1
  const victim = battle.spawn(360, 400, 'blue', 'thor')!
  const ally = battle.spawn(300, 450, 'red', 'goose')!
  const airborne = battle.spawn(280, 440, 'blue', 'goose')!
  victim.cooldown = 100
  ally.stun = 100
  airborne.thrown = { owner: ally, time: 5 }
  battle.step()
  assert.ok(dragon.iceDive)
  assert.ok(dragon.elevation > 0)
  assert.equal(victim.hp, 600)
  assert.equal(battle.iceRings.length, 0)
  for (let k = 0; k < 40; k++) battle.step()
  assert.ok(dragon.elevation >= 130)
  assert.equal(victim.frozen, 0)
  for (let k = 0; k < 30 && dragon.iceDive; k++) battle.step()
  assert.equal(dragon.iceDive, null)
  assert.equal(dragon.elevation, 0)
  assert.equal(victim.hp, 572)
  assert.ok(victim.frozen > 1.7)
  assert.ok(victim.stun > 1.7)
  assert.equal(ally.hp, 45)
  assert.equal(ally.frozen, 0)
  assert.equal(airborne.hp, 45)
  assert.equal(airborne.frozen, 0)
  assert.equal(battle.iceRings.length, 1)
  assert.ok(dragon.iceDiveCooldown > 6)
  dragon.stun = 100
  victim.cooldown = 0
  const hp = dragon.hp
  for (let k = 0; k < 30; k++) battle.step()
  assert.equal(dragon.hp, hp, 'A frozen enemy cannot attack')
  for (let k = 0; k < 90; k++) battle.step()
  assert.equal(victim.frozen, 0)
  assert.equal(battle.iceRings.length, 0)
}

// Every later form retains the ice skill, while fire dragons and zombies do not gain it.
for (const form of [0, 1, 2, 3] as DragonForm[]) {
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'ffa', 'dragon')!
  dragon.lightningSwordCooldown = 100
  dragon.dragonForm = form
  const victim = battle.spawn(370, 400, 'blue', 'thor')!
  const ally = battle.spawn(310, 450, 'ffa', 'dragon')!
  victim.stun = ally.stun = 100
  battle.step()
  assert.equal(dragon.iceDive !== null, form > 0)
  if (form > 0) {
    for (let k = 0; k < 65 && dragon.iceDive; k++) battle.step()
    assert.ok(victim.frozen > 0)
    assert.equal(ally.frozen, 0)
  }
  battle.clear()
  const undead = battle.spawn(300, 400, 'red', 'dragon')!
  undead.dragonForm = form
  undead.zombie = true
  const enemy = battle.spawn(330, 400, 'blue', 'thor')!
  enemy.stun = 100
  battle.step()
  assert.equal(undead.iceDive, null)
}

// Interruption and death cannot leave a delayed ice slam; Clear removes active flight and rings.
for (const interruption of ['stun', 'death', 'conversion', 'clear'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  dragon.dragonForm = 1
  const victim = battle.spawn(370, 400, 'blue', 'thor')!
  victim.stun = 100
  battle.step()
  assert.ok(dragon.iceDive)
  for (let k = 0; k < 15; k++) battle.step()
  if (interruption === 'stun') dragon.stun = 100
  else if (interruption === 'death') dragon.hp = 0
  else if (interruption === 'conversion') dragon.infection = { time: 0.001, team: 'blue' }
  else battle.clear()
  for (let k = 0; k < 70; k++) battle.step()
  assert.equal(dragon.iceDive, null)
  assert.equal(battle.iceRings.length, 0)
  assert.equal(victim.frozen, 0)
}

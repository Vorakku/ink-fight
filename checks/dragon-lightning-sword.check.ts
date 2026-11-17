import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import { DRAGON_FORMS } from '../src/game/dragon.ts'

// Run only with the owner's permission.

// The mouth blade charges before striking; its waves pierce enemies without stacking overlaps.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  dragon.dragonForm = 2
  dragon.iceDiveCooldown = 100
  const close = battle.spawn(380, 450, 'blue', 'thor')!
  const distant = battle.spawn(550, 450, 'blue', 'thor')!
  const behind = battle.spawn(220, 450, 'blue', 'thor')!
  const ally = battle.spawn(430, 450, 'red', 'goose')!
  close.stun = distant.stun = behind.stun = ally.stun = 100
  battle.step()
  assert.ok(dragon.lightningSword)
  assert.equal(dragon.iceDive, null)
  assert.equal(battle.flames.length, 0)
  for (let k = 0; k < 19; k++) battle.step()
  assert.equal(close.hp, 600)
  assert.equal(battle.lightningWaves.length, 0)
  for (let k = 0; k < 20 && battle.lightningWaves.length === 0; k++) battle.step()
  assert.equal(battle.lightningWaves.length, 3)
  dragon.stun = 100
  for (let k = 0; k < 90; k++) battle.step()
  assert.equal(close.hp, 546, 'One blade hit and one wave hit, even where crescents overlap')
  assert.equal(distant.hp, 582, 'Released waves reach enemies beyond the sword')
  assert.equal(behind.hp, 600)
  assert.equal(ally.hp, 45)
  assert.equal(battle.lightningWaves.length, 0)
  assert.ok(dragon.lightningSwordCooldown > 3)
}

// Lightning and Super Dragons gain the blade; the final form hits harder and spares its FFA allies.
for (const form of [2, 3] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'ffa', 'dragon')!
  dragon.dragonForm = form
  dragon.hp = DRAGON_FORMS[form].hp
  dragon.iceDiveCooldown = 100
  const victim = battle.spawn(390, 450, 'blue', 'thor')!
  const ally = battle.spawn(440, 480, 'ffa', 'dragon')!
  victim.stun = ally.stun = 100
  battle.step()
  assert.ok(dragon.lightningSword)
  for (let k = 0; k < 40 && battle.lightningWaves.length === 0; k++) battle.step()
  dragon.stun = 100
  for (let k = 0; k < 30; k++) battle.step()
  assert.equal(victim.hp, form === 2 ? 546 : 528)
  assert.equal(ally.hp, 700)
}

// Interrupted windups cannot release a delayed sword or waves.
for (const interruption of ['stun', 'death', 'conversion', 'clear'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  dragon.dragonForm = 2
  dragon.iceDiveCooldown = 100
  const victim = battle.spawn(390, 450, 'blue', 'thor')!
  victim.stun = 100
  battle.step()
  assert.ok(dragon.lightningSword)
  for (let k = 0; k < 10; k++) battle.step()
  if (interruption === 'stun') dragon.stun = 100
  else if (interruption === 'death') dragon.hp = 0
  else if (interruption === 'conversion') dragon.infection = { time: 0.001, team: 'blue' }
  else battle.clear()
  for (let k = 0; k < 70; k++) battle.step()
  assert.equal(dragon.lightningSword, null)
  assert.equal(battle.lightningWaves.length, 0)
  assert.equal(victim.hp, 600)
}

// Projectile kills earn evolution credit, and Clear removes already released waves.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const dragon = battle.spawn(300, 450, 'red', 'dragon')!
  dragon.dragonForm = 2
  dragon.dragonKills = 100
  dragon.dragonProgress = 100
  dragon.iceDiveCooldown = 100
  const victim = battle.spawn(570, 450, 'blue', 'thor')!
  dragon.target = victim // already-spotted enemies remain pursued beyond passive sight
  victim.hp = 1
  victim.stun = 100
  for (let k = 0; k < 90 && victim.hp > 0; k++) battle.step()
  assert.equal(dragon.dragonKills, 101)
  assert.ok(victim.hp <= 0)
  battle.clear()
  assert.equal(dragon.lightningSword, null)
  assert.equal(battle.lightningWaves.length, 0)
}

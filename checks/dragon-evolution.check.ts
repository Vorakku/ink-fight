import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import { DRAGON_FORMS } from '../src/game/dragon.ts'

// Run only with the owner's permission.

// Each permanent kill counts once and the agreed thresholds preserve existing wounds.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  dragon.hp = 600
  dragon.iceDiveCooldown = 100
  dragon.lightningSwordCooldown = 100
  for (let kills = 1; kills <= 151; kills++) {
    const victim = battle.spawn(370, 400, 'blue', 'goose')!
    victim.hp = 1
    victim.stun = 100
    dragon.cooldown = 0
    battle.step()
    battle.splats = [] // isolate kill-based evolution from the separately checked feeding behavior
    assert.equal(dragon.dragonKills, kills)
    assert.equal(dragon.dragonProgress, kills, 'Small kills retain the original 50-per-stage progression')
    assert.equal(dragon.dragonForm, kills >= 150 ? 3 : kills >= 100 ? 2 : kills >= 50 ? 1 : 0)
    assert.equal(dragon.hp, DRAGON_FORMS[dragon.dragonForm].hp - 100)
  }
  assert.ok(dragon.evolution > 0)
  battle.clear()
  const fresh = battle.spawn(300, 400, 'red', 'dragon')!
  assert.equal(fresh.dragonForm, 0)
  assert.equal(fresh.dragonKills, 0)
}

// Lingering fire earns kill credit without counting the same corpse on later ticks.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  const victim = battle.spawn(370, 400, 'blue', 'goose')!
  victim.hp = 6
  victim.stun = 100
  battle.step()
  assert.equal(dragon.dragonKills, 0)
  dragon.stun = 100
  for (let k = 0; k < 30; k++) battle.step()
  assert.equal(dragon.dragonKills, 1)
}

// Ice breath slows enemies, spares allies and does not inherit fire's vampire multiplier.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  dragon.dragonForm = 1
  dragon.iceDiveCooldown = 100
  dragon.lightningSwordCooldown = 100
  const victim = battle.spawn(370, 400, 'blue', 'vampire')!
  const ally = battle.spawn(380, 420, 'red', 'goose')!
  victim.stun = ally.stun = 100
  battle.step()
  assert.equal(victim.hp, 84)
  assert.ok(victim.chill > 1)
  assert.equal(victim.burn, 0)
  assert.equal(ally.chill, 0)
  assert.equal(ally.hp, 45)
  assert.equal(battle.flames[0].element, 'ice')
  dragon.stun = 100
  for (let k = 0; k < 90; k++) battle.step()
  assert.equal(victim.chill, 0)
}

// Lightning can jump outside the breath cone, with a cooldown rather than constant stun.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'ffa', 'dragon')!
  dragon.dragonForm = 2
  dragon.iceDiveCooldown = 100
  dragon.lightningSwordCooldown = 100
  const front = battle.spawn(370, 400, 'blue', 'thor')!
  const side = battle.spawn(330, 490, 'blue', 'goose')!
  const ally = battle.spawn(350, 450, 'ffa', 'dragon')!
  front.stun = side.stun = ally.stun = 100
  battle.step()
  assert.equal(front.hp, 579)
  assert.equal(side.hp, 31)
  assert.equal(ally.hp, 700)
  assert.equal(front.burn, 0)
  assert.equal(front.chill, 0)
  assert.equal(battle.shots.length, 2)
  dragon.cooldown = 0
  battle.step()
  assert.equal(side.hp, 31, 'The lightning jump waits for its own cooldown')
  assert.equal(battle.shots.length, 2)
}

// The final form uses golden energy and retains chain lightning; phoenix rebirth is not a permanent kill.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  dragon.dragonForm = 3
  dragon.hp = DRAGON_FORMS[3].hp
  dragon.iceDiveCooldown = 100
  dragon.lightningSwordCooldown = 100
  const victim = battle.spawn(370, 400, 'blue', 'thor')!
  victim.stun = 0.01
  battle.step()
  assert.equal(victim.burn, 0)
  assert.equal(victim.chill, 0)
  assert.ok(victim.stun > 0)
  assert.equal(victim.hp, 600 - DRAGON_FORMS[3].damage * 3)
  assert.equal(battle.flames[0].element, 'gold')
  victim.hp = 0
  const phoenix = battle.spawn(370, 400, 'blue', 'phoenix')!
  phoenix.hp = 1
  phoenix.stun = 100
  dragon.cooldown = 0
  battle.step()
  assert.equal(phoenix.stage, 'egg')
  assert.equal(dragon.dragonKills, 0)
}

// Conversion keeps a dragon's evolved body but removes evolution and elemental attacks.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  dragon.dragonForm = 2
  dragon.dragonKills = 100
  dragon.dragonProgress = 100
  dragon.infection = { time: 0.001, team: 'blue' }
  battle.step()
  assert.equal(dragon.zombie, true)
  assert.equal(dragon.dragonForm, 2)
  const victim = battle.spawn(325, 400, 'red', 'thor')!
  victim.hp = 1
  victim.stun = 100
  battle.step()
  assert.equal(dragon.dragonKills, 100)
  assert.equal(battle.flames.length, 0)
  assert.equal(battle.shots.length, 0)
}

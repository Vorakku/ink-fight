import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'

// Run only with the owner's permission. Catch cone, burn and healing regressions.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'red', 'dragon')!
  const front = battle.spawn(370, 400, 'blue', 'thor')!
  const flank = battle.spawn(400, 440, 'blue', 'thor')!
  const behind = battle.spawn(210, 400, 'blue')!
  const outsideCone = battle.spawn(300, 510, 'blue')!
  const ally = battle.spawn(400, 380, 'red')!
  front.stun = flank.stun = behind.stun = outsideCone.stun = ally.stun = 100
  dragon.hp = 650
  ally.hp = 25
  battle.step()
  assert.ok(front.hp <= 595 && flank.hp <= 595, 'Fire breath hits multiple enemies in its cone')
  assert.equal(behind.hp, 45, 'Enemies behind the dragon are spared')
  assert.equal(outsideCone.hp, 45, 'Enemies beside the dragon are outside the cone')
  assert.equal(ally.hp, 25, 'Dragon fire neither damages nor heals allies')
  assert.equal(ally.burn, 0)
  assert.equal(dragon.hp, 650, 'Scorch does not gain Encore healing')
  assert.equal(battle.rings.length, 0)
  assert.ok(battle.flames.length > 0)
  dragon.stun = 100
  for (let i = 0; i < 240; i++) battle.step()
  assert.equal(front.burn, 0, 'Burns expire')
  assert.ok(Math.abs(front.hp - 563.5) < 0.001, 'A single breath leaves 3.5 seconds of burning at 9 HP/s')
  dragon.hp = 0
  battle.step()
  assert.ok(!battle.fighters.includes(dragon), 'Dragon death is final')
  battle.clear()
  assert.equal(battle.flames.length, 0)
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const dragon = battle.spawn(300, 400, 'ffa', 'dragon')!
  const ally = battle.spawn(380, 430, 'ffa', 'dragon')!
  const enemy = battle.spawn(370, 400, 'ffa', 'phoenix')!
  ally.stun = enemy.stun = 100
  battle.step()
  assert.equal(ally.hp, 700, 'Free-for-all dragons cooperate with their own species')
  assert.equal(ally.burn, 0)
  assert.ok(enemy.hp <= 195, 'Free-for-all dragons fight other species')
  assert.equal(dragon.hp, 700)
}

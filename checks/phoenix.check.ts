import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import { PHOENIX, PHOENIX_CHICK, PHOENIX_FIRE, PHOENIX_FORMS } from '../src/game/phoenix.ts'
import type { Fighter } from '../src/game/battle.ts'

// Run only with the owner's permission.

// Every grown Phoenix form hits the whole forward fan, including both flanks.
for (const form of [0, 1, 2] as const) for (const team of ['red', 'ffa'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const phoenix = battle.spawn(300, 400, team, 'phoenix')!
  phoenix.phoenixForm = form
  phoenix.skillCooldown = 100
  const foe = team === 'ffa' ? 'ffa' : 'blue'
  const enemies = [0, -50, 50].map((degrees) => {
    const angle = degrees * Math.PI / 180
    return battle.spawn(300 + Math.cos(angle) * 70, 400 + Math.sin(angle) * 70, foe, 'goose')!
  })
  const outside = battle.spawn(318, 468, foe, 'goose')!
  const behind = battle.spawn(240, 400, foe, 'goose')!
  const distant = battle.spawn(800, 400, foe, 'goose')!
  const ally = battle.spawn(350, 420, team, 'phoenix')!
  const airborne = battle.spawn(350, 400, foe, 'goose')!
  airborne.elevation = 100
  const api = battle as unknown as { fireAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void }
  api.fireAttack(phoenix, enemies[0], 1, 0)
  for (const enemy of enemies) {
    assert.equal(enemy.hp, 45 - PHOENIX_FORMS[form].damage)
    assert.equal(enemy.burn, PHOENIX_FIRE.burn)
    assert.equal(enemy.burnOwner, phoenix)
  }
  for (const spared of [outside, behind, distant, airborne]) {
    assert.equal(spared.hp, 45)
    assert.equal(spared.burn, 0)
  }
  assert.equal(ally.hp, PHOENIX.hp)
  assert.equal(ally.burn, 0)
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const phoenix = battle.spawn(300, 400, 'red', 'phoenix')!
  const enemy = battle.spawn(370, 400, 'blue', 'thor')!
  const behind = battle.spawn(240, 400, 'blue')!
  const ally = battle.spawn(360, 435, 'red')!
  phoenix.retaliation = enemy
  enemy.stun = behind.stun = ally.stun = 100
  phoenix.hp -= 20
  ally.hp -= 20
  battle.step()
  assert.ok(enemy.hp <= 600 - PHOENIX.damage, 'Fire breath hits enemies in front')
  assert.ok(enemy.burn > 0, 'Breath leaves a lingering burn')
  assert.equal(behind.hp, 45, 'Breath spares enemies behind Encore')
  assert.equal(ally.hp, 35, 'The ring heals nearby allies without burning them')
  assert.equal(ally.burn, 0)
  assert.equal(phoenix.hp, PHOENIX.hp - 10, 'The ring also heals Encore')
  assert.equal(battle.rings.length, 1)
  battle.step()
  assert.ok(enemy.hp < 600 - PHOENIX.damage, 'Burn damage continues between attacks')
  assert.equal(battle.rings.length, 1, 'Healing rings have a one-second cooldown')
  battle.clear()
  assert.equal(battle.flames.length, 0)
  assert.equal(battle.rings.length, 0)
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const phoenix = battle.spawn(300, 400, 'red', 'phoenix')!
  phoenix.hp = 0
  phoenix.burn = 2
  phoenix.thrown = { owner: phoenix, time: 0.4 }
  battle.step()
  assert.equal(phoenix.stage, 'egg', 'First death becomes an egg')
  assert.ok(battle.fighters.includes(phoenix), 'Rebirth keeps the fighter and its team')
  assert.equal(phoenix.burn, 0)
  assert.equal(phoenix.thrown, null)
  const x = phoenix.x, y = phoenix.y
  const enemy = battle.spawn(340, 400, 'blue')!
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(phoenix.stage, 'egg')
  assert.equal(phoenix.x, x, 'Eggs stay put')
  assert.equal(phoenix.y, y)
  assert.equal(phoenix.hp, 1, 'Eggs cannot be damaged')
  assert.equal(enemy.target, null, 'Enemies ignore eggs')
  enemy.hp = 0
  for (let i = 0; i < 91; i++) battle.step()
  assert.equal(phoenix.stage, 'chick', 'The egg hatches after 2.5 seconds')
  assert.equal(phoenix.hp, PHOENIX_CHICK.hp)
  for (let i = 0; i < 481; i++) battle.step()
  assert.equal(phoenix.stage, 'reborn', 'The chick grows up after eight seconds')
  assert.equal(phoenix.hp, PHOENIX.hp)
  phoenix.hp = 0
  battle.step()
  assert.ok(!battle.fighters.includes(phoenix), 'Encore only gets one rebirth')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const phoenix = battle.spawn(300, 400, 'ffa', 'phoenix')!
  const flock = battle.spawn(360, 435, 'ffa', 'phoenix')!
  const goose = battle.spawn(370, 400, 'ffa')!
  flock.hp -= 20
  flock.stun = goose.stun = 100
  battle.step()
  assert.ok(goose.hp <= 45 - PHOENIX.damage, 'Free-for-all fights other species')
  assert.equal(flock.hp, PHOENIX.hp - 10, 'Free-for-all heals the same species')
  assert.equal(phoenix.stage, 'adult')
}

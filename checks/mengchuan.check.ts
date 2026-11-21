// Run only with the owner's permission: node checks/mengchuan.check.ts
import assert from 'node:assert/strict'
import { Battle, type Fighter } from '../src/game/battle.ts'
import { MENG_ASSAULT, MENG_BREEZE, MENG_CHUAN, MENG_CLONE, MENG_PARRY } from '../src/game/mengchuan.ts'

// Autumn Breeze: he dashes through the target, cutting and binding every enemy on the line once, sparing allies;
// the painting plays after the dash and then clears.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const meng = battle.spawn(300, 500, 'red', 'mengchuan')!
  const near = battle.spawn(390, 504, 'blue', 'goose')!
  const far = battle.spawn(450, 500, 'blue', 'goose')!
  const ally = battle.spawn(420, 496, 'red', 'goose')!
  near.hp = far.hp = ally.hp = 1000
  battle.step()
  assert.ok(meng.mengDash, 'An enemy in range starts the dash')
  assert.ok(meng.skillCooldown > MENG_BREEZE.cooldown - 0.1, 'The dash starts its cooldown')
  for (let i = 0; i < 60 && meng.mengDash; i++) battle.step()
  assert.equal(meng.mengDash, null, 'The dash ends')
  assert.ok(meng.x > far.x, 'He ends up past the target')
  assert.equal(near.hp, 1000 - MENG_BREEZE.damage, 'Enemies on the line are cut once')
  assert.equal(far.hp, 1000 - MENG_BREEZE.damage)
  assert.ok(near.stun > 0 && far.stun > 0, 'and bound in place')
  assert.equal(ally.hp, 1000, 'Allies are spared')
  assert.equal(battle.mengBreezes.length, 1, 'The painting follows the cut')
  const [x, y] = [far.x, far.y]
  for (let i = 0; i < MENG_BREEZE.paint * 60 - 10; i++) battle.step()
  assert.ok(far.stun > 0 && Math.hypot(far.x - x, far.y - y) < 4, 'The cut stay frozen while the painting plays')
  for (let i = 0; i < 15; i++) battle.step()
  assert.equal(battle.mengBreezes.length, 0, 'and it clears once it has played')
  assert.equal(far.stun, 0, 'then they can move again')
}

// Parry: a roll under the chance turns an enemy's attack aside into the guard pose; a roll over it lands.
for (const [roll, parried] of [[MENG_PARRY.chance - 0.01, true], [MENG_PARRY.chance + 0.01, false]] as const) {
  const battle = new Battle(() => roll)
  battle.resize(1600, 1000)
  const meng = battle.spawn(300, 500, 'red', 'mengchuan')!
  const foe = battle.spawn(260, 500, 'blue', 'goose')!
  const api = battle as unknown as { hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean }
  assert.equal(api.hit(meng, 30, 0, 0, foe), !parried)
  assert.equal(meng.hp, parried ? MENG_CHUAN.hp : MENG_CHUAN.hp - 30, parried ? 'A parried blow does no damage' : 'An unparried blow lands')
  assert.equal(meng.mengParry > 0, parried, 'Parrying raises his guard')
  if (parried) {
    assert.equal(meng.facing, -1, 'He turns to the attacker')
    meng.stun = 1
    assert.equal(api.hit(meng, 30, 0, 0, foe), true, 'He cannot parry while stunned')
  }
}

// Five Autumn Shadows: a lucky parry splits him; untouchable among his shadows, he ends behind the enemy,
// which takes the cut and stays frozen while it plays.
{
  const battle = new Battle(() => 0.2) // under both the parry and the clone chance
  battle.resize(1600, 1000)
  const meng = battle.spawn(300, 500, 'red', 'mengchuan')!
  const foe = battle.spawn(260, 500, 'blue', 'goose')!
  foe.hp = 1000
  const api = battle as unknown as { hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean }
  assert.equal(api.hit(meng, 30, 0, 0, foe), false)
  assert.ok(meng.mengClone, 'The parry splits him into shadows')
  assert.equal(api.hit(meng, 30, 0, 0, foe), false, 'He cannot be hit among them')
  assert.equal(meng.hp, MENG_CHUAN.hp)
  for (let i = 0; i < 120 && meng.mengClone; i++) battle.step()
  assert.equal(meng.mengClone, null, 'The assault finishes')
  assert.ok(meng.mengCloneCooldown > MENG_CLONE.cooldown - 0.1, 'and goes on cooldown')
  assert.ok(meng.x < foe.x, 'He ends behind the enemy')
  assert.equal(foe.hp, 1000 - MENG_CLONE.damage, 'which takes the cut')
  assert.ok(foe.stun > 0, 'and freezes')
}

// Demon Assault (Divine-Demon form): a barrage of sha fists, every one landing on a target straight ahead.
{
  const battle = new Battle(() => 0.5) // no fan: every fist flies dead on
  battle.resize(1600, 1000)
  const meng = battle.spawn(500, 500, 'red', 'mengchuan', false, 1)! // variant 1: the Divine-Demon form
  meng.skillCooldown = meng.mengSonicCooldown = meng.mengLotusCooldown = meng.mengKasayaCooldown = 99
  const foe = battle.spawn(650, 500, 'blue', 'goose')!
  foe.hp = 1000
  foe.stun = 100
  battle.step()
  assert.ok(meng.mengAssault, 'He starts the barrage')
  for (let i = 0; i < 180 && meng.mengAssault; i++) battle.step()
  for (let i = 0; i < 30; i++) battle.step()
  assert.equal(battle.shaShots.length, 0, 'Every fist has landed or gone')
  assert.ok(foe.hp <= 1000 - MENG_ASSAULT.count * MENG_ASSAULT.damage, `All ${MENG_ASSAULT.count} fists hit (${foe.hp})`)
}

console.log('mengchuan checks passed')

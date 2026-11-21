// Run only with the owner's permission: node checks/luifeng.check.ts
import assert from 'node:assert/strict'
import { Battle, type Fighter } from '../src/game/battle.ts'
import { CAVALRY_RIDE } from '../src/game/cavalry.ts'
import { LUI_CHARGE, LUI_ENHANCE, LUI_FENG, LUI_SWEEP } from '../src/game/luifeng.ts'
import { CHARACTER_CATEGORIES, CHARACTERS } from '../src/game/units.ts'

assert.ok(CHARACTERS.includes('luifeng'))
assert.equal(CHARACTER_CATEGORIES.luifeng, 'Hero')
type Hit = { hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean }

// Enhance: an enemy close sets off the overhead spin; the slam hurts and knocks it away, sparing allies, and the aura
// makes him hit harder and take less damage.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const general = battle.spawn(600, 500, 'red', 'luifeng')!
  const foe = battle.spawn(700, 500, 'blue', 'goose')!
  const ally = battle.spawn(560, 500, 'red', 'goose')!
  foe.stun = 100
  foe.hp = ally.hp = 1000
  battle.step()
  assert.notEqual(general.luiEnhance, null, 'An enemy in range starts the spin')
  assert.ok(general.skillCooldown > LUI_ENHANCE.cooldown - 0.1, 'and its cooldown')
  const [x, y] = [general.x, general.y]
  for (let i = 0; i < 120 && general.luiEnhance !== null; i++) battle.step()
  assert.equal(general.luiEnhance, null, 'The cast ends')
  assert.ok(Math.hypot(general.x - x, general.y - y) < 2, 'He holds still while casting')
  assert.equal(foe.hp, 1000 - LUI_ENHANCE.damage, 'The slam hits the enemy once')
  assert.ok(foe.x > 700, 'and knocks it away')
  assert.equal(ally.hp, 1000, 'Allies are spared')
  assert.ok(general.luiAura > LUI_ENHANCE.duration - 1, 'The aura takes hold')
  const hp = general.hp
  ;(battle as unknown as Hit).hit(general, 100, 0, 0, foe)
  assert.ok(Math.abs(hp - general.hp - 100 * (1 - LUI_ENHANCE.armor)) < 1e-9, 'The aura cuts enemy damage')
}

// His swing sweeps all round him (both sides at once), harder in the aura, and paints its slashes, which fade;
// and a legend never falls from his horse.
for (const aura of [0, 5]) {
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const general = battle.spawn(400, 400, 'red', 'luifeng')!
  const foe = battle.spawn(440, 400, 'blue', 'goose')!
  const behind = battle.spawn(360, 400, 'blue', 'goose')!
  general.skillCooldown = 100
  general.luiAura = aura
  foe.stun = behind.stun = 100
  foe.hp = behind.hp = 1000
  battle.step()
  assert.equal(foe.hp, 1000 - LUI_FENG.damage * (aura ? LUI_ENHANCE.power : 1), 'The mounted sweep hits')
  assert.equal(behind.hp, foe.hp, 'enemies on every side at once')
  assert.equal(battle.luiSweeps.length, 1, 'and paints its slashes')
  const [painted] = battle.luiSweeps
  for (let i = 0; i < LUI_SWEEP.life * 60 + 2; i++) battle.step()
  assert.ok(!battle.luiSweeps.includes(painted), 'which fade away')
  general.hp = LUI_FENG.hp * CAVALRY_RIDE.dismount - 1
  battle.step()
  assert.equal(general.cavalryMounted, true, 'He stays mounted at low health')
}

// Piercing Charge: a target at gallop distance sets off the windup; he gallops in, pierces it, carries it high on the
// spear, then flings it away ahead of him. Enhance is left on cooldown so only the charge plays.
{
  const battle = new Battle(() => 0.5)
  battle.resize(1600, 1000)
  const general = battle.spawn(400, 500, 'red', 'luifeng')!
  const foe = battle.spawn(700, 500, 'blue', 'goose')!
  general.skillCooldown = 100
  foe.stun = 100
  foe.hp = 1000
  battle.step()
  assert.equal(general.luiCharge?.phase, 'windup', 'A target at gallop distance starts the windup')
  assert.ok(general.luiChargeCooldown > LUI_CHARGE.cooldown - 0.1, 'and its cooldown')
  for (let i = 0; i < 60 * LUI_CHARGE.windup - 3; i++) battle.step()
  assert.equal(general.luiCharge?.phase, 'windup', 'He holds still through the windup')
  assert.ok(Math.abs(general.x - 400) < 2)
  for (let i = 0; i < 120 && general.luiCharge?.phase !== 'lift'; i++) battle.step()
  assert.equal(general.luiCharge?.phase, 'lift', 'The gallop ends in a pierce')
  assert.equal(foe.hp, 1000 - LUI_CHARGE.damage, 'The pierce hits once')
  assert.equal(foe.heldBy, general, 'and the target is carried on the spear')
  for (let i = 0; i < 20; i++) battle.step()
  assert.ok(foe.elevation > 20, 'lifted high')
  for (let i = 0; i < 120 && general.luiCharge; i++) battle.step()
  assert.equal(general.luiCharge, null, 'The charge ends')
  assert.equal(foe.heldBy, null, 'with the target flung off the spear')
  assert.ok(foe.thrown, 'into the air')
  const from = foe.x
  for (let i = 0; i < 120 && foe.thrown; i++) battle.step()
  assert.ok((foe.x - from) * general.facing > LUI_CHARGE.distance * 0.8, 'It lands well away, ahead of him')
}

// Stunned while carrying, he drops the victim, which falls back to the ground.
{
  const battle = new Battle(() => 0.5)
  battle.resize(1600, 1000)
  const general = battle.spawn(400, 500, 'red', 'luifeng')!
  const foe = battle.spawn(700, 500, 'blue', 'goose')!
  general.skillCooldown = 100
  foe.stun = 100
  foe.hp = 1000
  for (let i = 0; i < 240 && general.luiCharge?.phase !== 'lift'; i++) battle.step()
  for (let i = 0; i < 20; i++) battle.step()
  general.stun = 1
  battle.step()
  assert.equal(general.luiCharge, null, 'A stun breaks the charge')
  assert.equal(foe.heldBy, null, 'and frees the victim')
  for (let i = 0; i < 120 && foe.elevation > 0; i++) battle.step()
  assert.equal(foe.elevation, 0, 'which falls back down')
}

console.log('luifeng checks passed')

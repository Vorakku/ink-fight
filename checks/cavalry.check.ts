// Run only with the owner's permission: node checks/cavalry.check.ts
import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import { CAVALRY, CAVALRY_RIDE } from '../src/game/cavalry.ts'
import { CHARACTER_CATEGORIES, CHARACTERS } from '../src/game/units.ts'

assert.ok(CHARACTERS.includes('cavalry'))
assert.equal(CHARACTER_CATEGORIES.cavalry, 'People')

// One mounted slash hits every enemy around the rider, and the horse keeps moving.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const rider = battle.spawn(400, 400, 'red', 'cavalry')!
  const a = battle.spawn(430, 400, 'blue', 'goose')!, b = battle.spawn(370, 410, 'blue', 'goose')!
  a.stun = b.stun = 100
  battle.step()
  assert.equal(a.hp, 45 - CAVALRY.damage)
  assert.equal(b.hp, 45 - CAVALRY.damage)
  assert.ok(Math.hypot(rider.vx, rider.vy) > 0, 'Slashing does not stop the gallop')
}

// At 40% health the rider falls off, is briefly stunned, then fights on foot.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const rider = battle.spawn(400, 400, 'red', 'cavalry')!
  assert.equal(rider.cavalryMounted, true)
  rider.hp = CAVALRY.hp * CAVALRY_RIDE.dismount + 1
  battle.step()
  assert.equal(rider.cavalryMounted, true)
  rider.hp = CAVALRY.hp * CAVALRY_RIDE.dismount
  battle.step()
  assert.equal(rider.cavalryMounted, false)
  assert.ok(rider.stun > 0)
}

console.log('cavalry checks passed')

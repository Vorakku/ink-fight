import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import { TOWER_ROOF } from '../src/game/terrain.ts'
import { PHOENIX } from '../src/game/phoenix.ts'

// Run only with the owner's permission.

// Bites heal only after landing a real enemy hit and never exceed full health.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const vampire = battle.spawn(300, 400, 'red', 'vampire')!
  const victim = battle.spawn(325, 400, 'blue', 'dragon')!
  const ally = battle.spawn(280, 400, 'red', 'goose')!
  vampire.hp = 50
  victim.stun = ally.stun = 100
  battle.step()
  assert.equal(victim.hp, 684)
  assert.equal(vampire.hp, 66)
  assert.equal(ally.hp, 45)
  assert.equal(victim.retaliation, vampire)
  vampire.hp = 85
  vampire.cooldown = 0
  battle.step()
  assert.equal(vampire.hp, 90)
}

// Long-range pursuit uses a bat, then lands before its first healing bite.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const vampire = battle.spawn(300, 400, 'red', 'vampire')!
  const victim = battle.spawn(650, 400, 'blue', 'thor')!
  victim.stun = 100
  vampire.hp = 50
  battle.step()
  assert.equal(vampire.target, victim, 'The vampire spots enemies beyond ordinary melee sight')
  assert.equal(vampire.bat, true)
  assert.ok(vampire.elevation > 0)
  assert.equal(victim.hp, 600)
  for (let k = 0; k < 180 && victim.hp === 600; k++) battle.step()
  assert.equal(victim.hp, 584)
  assert.equal(vampire.bat, false)
  assert.equal(vampire.elevation, 0)
  assert.equal(vampire.hp, 66)
}

// Both fire breath and its lingering burn apply the original eightfold weakness.
for (const species of ['dragon', 'phoenix'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const fire = battle.spawn(300, 400, 'red', species)!
  const vampire = battle.spawn(370, 400, 'blue', 'vampire')!
  vampire.stun = 100
  battle.step()
  const expected = species === 'dragon' ? 48.8 : 90 - PHOENIX.damage * 8 - 1.2
  assert.ok(Math.abs(vampire.hp - expected) < 0.001)
  fire.stun = 100
  const before = vampire.hp
  battle.step()
  assert.ok(Math.abs(vampire.hp - (before - 1.2)) < 0.001)
}

// Free-for-all vampires cooperate and do not gain health without an enemy bite.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const vampire = battle.spawn(300, 400, 'ffa', 'vampire')!
  const ally = battle.spawn(325, 400, 'ffa', 'vampire')!
  vampire.hp = 40
  battle.step()
  assert.equal(vampire.hp, 40)
  assert.equal(ally.hp, 90)
  assert.equal(vampire.target, null)
  assert.equal(vampire.bat, false)
}

// Control effects and conversion stop bat flight; Clear removes it as well.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const vampire = battle.spawn(300, 400, 'red', 'vampire')!
  const victim = battle.spawn(700, 400, 'blue', 'thor')!
  victim.stun = 100
  battle.step()
  assert.equal(vampire.bat, true)
  vampire.stun = 1
  battle.step()
  assert.equal(vampire.bat, false)
  assert.equal(vampire.elevation, 0)
  vampire.stun = 0
  battle.step()
  assert.equal(vampire.bat, true)
  vampire.infection = { time: 0.001, team: 'blue' }
  battle.step()
  assert.equal(vampire.zombie, true)
  assert.equal(vampire.bat, false)
  assert.equal(vampire.team, 'blue')
  const another = battle.spawn(900, 400, 'red', 'vampire')!
  battle.step()
  assert.equal(another.bat, true)
  battle.clear()
  assert.equal(another.bat, false)
  assert.equal(battle.fighters.length, 0)
}

// A tower occupant can be bitten after the bat reaches roof height, without draining the tower.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const vampire = battle.spawn(480, 400, 'red', 'vampire')!
  const tower = battle.placeTower(500, 400)!
  const occupant = battle.spawn(500, 400, 'blue', 'thor')!
  tower.occupant = occupant
  occupant.tower = tower
  occupant.elevation = TOWER_ROOF + 12
  occupant.stun = 100
  vampire.hp = 50
  for (let k = 0; k < 90 && occupant.hp === 600; k++) battle.step()
  assert.equal(occupant.hp, 584)
  assert.equal(tower.hp, 500)
  assert.equal(vampire.hp, 66)
  assert.equal(vampire.bat, false)
}

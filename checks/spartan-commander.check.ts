// Run only with the owner's permission: node checks/spartan-commander.check.ts
import assert from 'node:assert/strict'
import { Battle, MAX_FIGHTERS, type Fighter } from '../src/game/battle.ts'
import { SPARTAN, SPARTAN_COMMANDER } from '../src/game/spartan.ts'
import type { Team } from '../src/game/units.ts'

const scene = () => { const b = new Battle(() => 0.99); b.resize(2000, 1200); return b }
const troops = (b: Battle, count: number, team: Team = 'red') => Array.from({ length: count }, (_, i) => {
  const f = b.spawn(1100 + i % 10 * 30, 700 + Math.floor(i / 10) * 30, team, 'spartan')!
  f.stun = 100
  return f
})
const commander = (b: Battle, team: Team = 'red') => b.fighters.find((f) => f.team === team && f.spartanCommander)!
const api = (b: Battle) => b as unknown as {
  hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean
  spartanAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
  trySpartanThrow(owner: Fighter, target: Fighter): boolean
  stepShuriken(): void
  claimMeal(owner: Fighter, victim: Fighter): void
  turnZombie(fighter: Fighter, team: Team): void
}
const foe = (b: Battle, x = 500, species: 'goose' | 'rex' = 'goose') => {
  const f = b.spawn(x, 500, 'blue', species)!
  f.hp = 10000; f.stun = 100
  return f
}

// Fifty is ordinary; the fifty-first troop creates one additional leader on each side.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const b = scene()
  troops(b, 50, team)
  assert.equal(commander(b, team), undefined)
  troops(b, 1, team)
  const leader = commander(b, team)
  assert.ok(leader)
  assert.equal(leader.hp, 720)
  assert.equal(b.fighters.length, 52)
  assert.equal(b.spartanArmies.get(team)?.total, 51)
  troops(b, 10, team)
  assert.equal(b.fighters.filter((f) => f.spartanCommander).length, 1)
  assert.equal(commander(b, team), leader)
}

// The larger leader deals triple spear-thrust and shield-bash damage.
{
  const b = scene(); troops(b, 51)
  const leader = commander(b), target = foe(b, 360)
  leader.x = 300; leader.y = 500; leader.skillCooldown = 100
  api(b).spartanAttack(leader, target, 1, 0)
  assert.equal(target.hp, 10000 - 54)
  target.x = 320; leader.skillCooldown = 0
  api(b).spartanAttack(leader, target, 1, 0)
  assert.equal(target.hp, 10000 - 54 - 72)
}

// Repeated throws keep a fresh spear and their projectiles still fly and hit.
{
  const b = scene(); troops(b, 51)
  const leader = commander(b), target = foe(b)
  leader.x = 300; leader.y = 500
  for (let i = 0; i < 3; i++) {
    leader.cooldown = leader.spartanThrowCooldown = 0
    assert.equal(api(b).trySpartanThrow(leader, target), true)
    assert.equal(leader.spartanSpear, true)
    assert.equal(leader.spartanMark, null)
    assert.equal(api(b).trySpartanThrow(leader, target), false)
    for (let tick = 0; tick < 90 && b.shuriken.length; tick++) api(b).stepShuriken()
    assert.equal(target.hp, 10000 - (i + 1) * 108)
  }
  leader.cooldown = leader.spartanThrowCooldown = 0
  api(b).trySpartanThrow(leader, target); target.y += 200
  for (let tick = 0; tick < 90 && b.shuriken.length; tick++) api(b).stepShuriken()
  assert.equal(leader.spartanSpear, true)
}

// Troops protect against hits, burns, bleeding, executions and infection; death unlocks it.
{
  const b = scene(), army = troops(b, 51), leader = commander(b), attacker = foe(b, 200, 'rex')
  leader.stun = 100
  api(b).hit(leader, 1000000, 0, 0, attacker)
  assert.equal(leader.hp, 1)
  assert.equal(attacker.rexKills, 0)
  leader.burn = leader.bleed = 1; leader.burnOwner = leader.bleedOwner = attacker
  b.step()
  assert.equal(leader.hp, 1)
  leader.hp = 0; api(b).claimMeal(attacker, leader)
  assert.equal(leader.hp, 1)
  assert.equal(attacker.rexKills, 0)
  api(b).turnZombie(leader, 'blue')
  assert.equal(leader.zombie, false)
  for (const f of army) f.hp = 0
  api(b).hit(leader, 2, 0, 0, attacker)
  assert.equal(leader.hp, -1)
  assert.equal(attacker.rexKills, 1)
  b.step()
  assert.ok(!b.fighters.includes(leader))
}

// Converted troops stop protecting immediately, and the leader can then convert too.
{
  const b = scene(), army = troops(b, 51), leader = commander(b)
  for (const f of army) api(b).turnZombie(f, 'blue')
  api(b).turnZombie(leader, 'blue')
  assert.equal(leader.zombie, true)
  assert.equal(leader.spartanCommander, null)
}

// Fresh troops protect the surviving leader, without creating a duplicate commander.
{
  const b = scene(), army = troops(b, 51), leader = commander(b), attacker = foe(b)
  for (const f of army) f.hp = 0
  const recruit = troops(b, 1)[0]
  api(b).hit(leader, 1000000, 0, 0, attacker)
  assert.equal(leader.hp, 1)
  assert.equal(commander(b), leader)
  recruit.hp = 0
  api(b).hit(leader, 2, 0, 0, attacker)
  assert.ok(leader.hp <= 0)
}

// The leader joins the army ram but neither advances nor delays its 40% troop threshold.
{
  const b = scene(), army = troops(b, 51), leader = commander(b)
  foe(b, 1700)
  for (const f of army.slice(21)) f.hp = 0
  b.step()
  assert.equal(b.spartanFormations.some((g) => g.charge), false)
  army[20].hp = 0; b.step()
  const group = b.spartanFormations.find((g) => g.charge)!
  assert.ok(group)
  assert.equal(group.charge?.total, 51)
  assert.equal(group.members.length, 21)
  assert.equal(group.members[0], leader)
}

// The fighter cap is respected, and the pending leader spawns once a slot is freed.
{
  const b = scene()
  const filler = Array.from({ length: MAX_FIGHTERS - 51 }, () => {
    const f = b.spawn(100, 100, 'blue', 'goose')!; f.stun = 100; return f
  })
  troops(b, 51)
  assert.equal(commander(b), undefined)
  assert.equal(b.fighters.length, MAX_FIGHTERS)
  filler[0].hp = 0; b.step(); b.step()
  assert.ok(commander(b))
  assert.ok(b.fighters.length <= MAX_FIGHTERS)
}

// Clear resets troop protection and allows a fresh army to receive its own commander.
{
  const b = scene(); troops(b, 51)
  const previous = commander(b)
  b.clear()
  assert.equal(previous.spartanCommander, null)
  assert.equal(b.spartanArmies.size, 0)
  assert.equal(b.shuriken.length, 0)
  troops(b, 51)
  assert.ok(commander(b))
  assert.notEqual(commander(b), previous)
  assert.equal(commander(b).hp, SPARTAN.hp * SPARTAN_COMMANDER.power)
}

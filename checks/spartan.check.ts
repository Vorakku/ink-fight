// Run only with the owner's permission: node checks/spartan.check.ts
import assert from 'node:assert/strict'
import { Battle, type Fighter } from '../src/game/battle.ts'
import { SPARTAN, SPARTAN_BASH } from '../src/game/spartan.ts'
import { ZOMBIE } from '../src/game/zombie.ts'
import { CHARACTER_CATEGORIES, CHARACTERS } from '../src/game/units.ts'

assert.ok(CHARACTERS.includes('spartan'))
assert.equal(CHARACTER_CATEGORIES.spartan, 'People')

// Spear thrusts hit beyond ordinary peck range and spare allied Spartans on every side.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const spartan = battle.spawn(300, 400, team, 'spartan')!
  const foe = battle.spawn(355, 400, team === 'red' ? 'blue' : team === 'blue' ? 'red' : 'ffa', 'goose')!
  const ally = battle.spawn(340, 450, team, 'spartan')!
  foe.stun = ally.stun = 100
  battle.step()
  assert.equal(foe.hp, 45 - SPARTAN.damage)
  assert.equal(ally.hp, SPARTAN.hp)
  assert.equal(spartan.skillCooldown, 0, 'A spear thrust does not spend the bash')
  battle.step()
  assert.equal(foe.hp, 45 - SPARTAN.damage, 'Attacks respect the normal cooldown')
}

// Close enemies take a shield bash, then normal spear damage while it recharges.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const spartan = battle.spawn(300, 400, 'red', 'spartan')!
  const foe = battle.spawn(320, 400, 'blue', 'goose')!
  foe.hp = 200
  battle.step()
  assert.equal(foe.hp, 200 - SPARTAN_BASH.damage)
  assert.ok(foe.stun > 0.5)
  assert.ok(foe.vx > 0)
  assert.equal(spartan.skillCooldown, SPARTAN_BASH.cooldown)
  assert.equal(spartan.slam, 1)
  spartan.cooldown = 0
  foe.x = spartan.x + 20; foe.y = spartan.y
  battle.step()
  assert.equal(foe.hp, 200 - SPARTAN_BASH.damage - SPARTAN.damage)
}

// Allies, airborne foes and out-of-range foes cannot take spear or bash damage.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const spartan = battle.spawn(300, 400, 'red', 'spartan')!
  const ally = battle.spawn(320, 400, 'red', 'goose')!
  const flyer = battle.spawn(320, 400, 'blue', 'goose')!
  const distant = battle.spawn(600, 400, 'blue', 'goose')!
  flyer.elevation = 80
  const api = battle as unknown as { spartanAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void }
  for (const target of [ally, flyer, distant]) {
    api.spartanAttack(spartan, target, 1, 0)
    assert.equal(target.hp, 45)
  }
  assert.equal(spartan.skillCooldown, 0)
  const nest = battle.spawn(340, 400, 'blue', 'dragon-nest')!
  const hp = nest.hp
  api.spartanAttack(spartan, nest, 1, 0)
  assert.equal(nest.hp, hp - SPARTAN.damage)
  assert.equal(spartan.skillCooldown, 0, 'Structures take spear damage without wasting a stun')
  assert.equal(nest.stun, 0)
}

// Converted Spartans use the shared zombie bite and infection, with no shield bash.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const spartan = battle.spawn(300, 400, 'red', 'spartan')!
  const foe = battle.spawn(320, 400, 'blue', 'goose')!
  spartan.zombie = true
  foe.stun = 100
  battle.step()
  assert.equal(foe.hp, 45 - ZOMBIE.damage)
  assert.equal(foe.infection?.team, 'red')
  assert.equal(spartan.skillCooldown, 0)
}

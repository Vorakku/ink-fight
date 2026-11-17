// Run only with the owner's permission: node checks/spartan-spear.check.ts
import assert from 'node:assert/strict'
import { Battle, type Fighter } from '../src/game/battle.ts'
import { SPARTAN_KNIFE, SPARTAN_THROW } from '../src/game/spartan.ts'
import type { Species, Team } from '../src/game/units.ts'

const scene = (team: Team = 'red', species: Species = 'goose') => {
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const spartan = battle.spawn(300, 500, team, 'spartan')!
  const target = battle.spawn(500, 500, team === 'ffa' ? 'ffa' : team === 'red' ? 'blue' : 'red', species)!
  target.hp = 1000; target.stun = 100
  spartan.spartanThrowCooldown = 0
  const api = battle as unknown as {
    trySpartanThrow(owner: Fighter, target: Fighter): boolean
    stepShuriken(): void
    spartanAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
    hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean
    turnZombie(target: Fighter, team: Team): void
  }
  const land = () => { for (let i = 0; i < 90 && battle.shuriken.length; i++) api.stepShuriken() }
  return { battle, spartan, target, api, land }
}

// Throwing is automatic at range, launches one physical spear, then switches to knife.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const { battle, spartan, target, api, land } = scene(team)
  battle.step()
  assert.equal(spartan.spartanSpear, false)
  assert.equal(spartan.spartanMark, target)
  assert.equal(battle.shuriken.filter((p) => p.kind === 'spear').length, 1)
  assert.equal(api.trySpartanThrow(spartan, target), false, 'One Spartan cannot duplicate its spear')
  land()
  assert.equal(target.hp, 1000 - SPARTAN_THROW.damage)
  assert.equal(target.shock, 0, 'A spear is physical, with no lightning skeleton effect')
  assert.equal(spartan.spartanSpear, false)
  target.x = spartan.x + 24; target.y = spartan.y
  spartan.skillCooldown = 100
  api.spartanAttack(spartan, target, 1, 0)
  assert.equal(target.hp, 1000 - SPARTAN_THROW.damage - SPARTAN_KNIFE.damage)
  target.x = spartan.x + 55
  const hp = target.hp
  api.spartanAttack(spartan, target, 1, 0)
  assert.equal(target.hp, hp, 'The knife cannot retain spear reach')
  target.x = spartan.x + 24; target.hp = 1
  api.spartanAttack(spartan, target, 1, 0)
  assert.equal(spartan.spartanSpear, true)
  assert.equal(spartan.spartanMark, null)
  assert.ok(spartan.spartanThrowCooldown > 0, 'Retrieval does not bypass the throw cooldown')
}

// An enemy crossing the trajectory catches the spear and becomes the recovery target.
{
  const { battle, spartan, target, api, land } = scene()
  const blocker = battle.spawn(400, 500, 'blue', 'thor')!
  blocker.hp = 1000
  const ally = battle.spawn(350, 500, 'red', 'goose')!
  api.trySpartanThrow(spartan, target)
  land()
  assert.equal(ally.hp, 45)
  assert.equal(blocker.hp, 1000 - SPARTAN_THROW.damage)
  assert.equal(target.hp, 1000)
  assert.equal(spartan.spartanMark, blocker)
  api.hit(target, 10000, 0, 0, spartan)
  assert.equal(spartan.spartanSpear, false, 'Killing another enemy does not retrieve this spear')
  api.hit(blocker, 10000, 0, 0, spartan)
  assert.equal(spartan.spartanSpear, true)
}

// A spear kill retrieves immediately; a stolen kill or a miss leaves the knife.
{
  const { spartan, target, api, land } = scene()
  target.hp = 1
  api.trySpartanThrow(spartan, target); land()
  assert.equal(spartan.spartanSpear, true)
  assert.equal(spartan.spartanMark, null)
}
for (const outcome of ['stolen', 'miss'] as const) {
  const { battle, spartan, target, api, land } = scene()
  api.trySpartanThrow(spartan, target)
  if (outcome === 'miss') target.y += 200
  land()
  if (outcome === 'stolen') {
    const ally = battle.spawn(600, 500, 'red', 'thor')!
    api.hit(target, 10000, 0, 0, ally)
    battle.step()
  }
  assert.equal(spartan.spartanSpear, false)
  assert.equal(spartan.spartanMark, null)
}

// Temporary Phoenix rebirth does not grant recovery; the final marked kill does.
{
  const { spartan, target, api, land } = scene('red', 'phoenix')
  target.hp = 1
  api.trySpartanThrow(spartan, target); land()
  assert.equal(spartan.spartanSpear, false)
  assert.equal(spartan.spartanMark, target)
  target.stage = 'reborn'; target.hp = 1
  api.hit(target, 100, 0, 0, spartan)
  assert.equal(spartan.spartanSpear, true)
}

// Controls, allies, airborne targets and structures cannot start a spear special.
for (const blocked of ['stun', 'frozen', 'fear', 'ally', 'airborne', 'structure', 'too-close'] as const) {
  const { spartan, target, api } = scene('red', blocked === 'structure' ? 'anthill' : 'goose')
  if (blocked === 'ally') target.team = spartan.team
  else if (blocked === 'airborne') target.elevation = 80
  else if (blocked === 'too-close') target.x = spartan.x + 30
  else if (blocked !== 'structure') spartan[blocked] = 1
  assert.equal(api.trySpartanThrow(spartan, target), false)
  assert.equal(spartan.spartanSpear, true)
}

// Death, conversion and Clear remove projectiles and recovery ownership.
for (const cause of ['death', 'conversion', 'clear'] as const) {
  const { battle, spartan, target, api } = scene()
  api.trySpartanThrow(spartan, target)
  if (cause === 'death') spartan.hp = 0
  else if (cause === 'conversion') api.turnZombie(spartan, 'blue')
  else battle.clear()
  battle.step()
  assert.equal(battle.shuriken.filter((p) => p.kind === 'spear').length, 0)
  assert.equal(spartan.spartanMark, null)
  assert.equal(target.hp, 1000)
  if (cause === 'clear') assert.equal(spartan.spartanSpear, true)
}

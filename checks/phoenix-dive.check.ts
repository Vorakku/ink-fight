// Run only with the owner's permission: node checks/phoenix-dive.check.ts
import assert from 'node:assert/strict'
import { Battle, DT } from '../src/game/battle.ts'
import { PHOENIX, PHOENIX_DIVE, PHOENIX_FIRE } from '../src/game/phoenix.ts'
import { TREX_BLACK } from '../src/game/rex.ts'
import { TOWER_ROOF } from '../src/game/terrain.ts'
import { VAMPIRE_FIRE_WEAKNESS } from '../src/game/vampire.ts'
import type { Team } from '../src/game/units.ts'

const advance = (battle: Battle, ticks: number) => { for (let k = 0; k < ticks; k++) battle.step() }
const scene = (team: Team = 'red') => {
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const phoenix = battle.spawn(300, 500, team, 'phoenix')!
  const enemy = battle.spawn(500, 500, team === 'ffa' ? 'ffa' : 'blue', 'thor')!
  enemy.hp = 5000; enemy.stun = 100
  phoenix.phoenixDiveCooldown = 0
  return { battle, phoenix, enemy }
}
const land = (battle: Battle, phoenix: { phoenixDive: unknown }) => {
  for (let k = 0; k < 120 && phoenix.phoenixDive; k++) battle.step()
  assert.equal(phoenix.phoenixDive, null)
}

// The visual circle and actual healing share the caster rather than the victim.
{
  const { battle, phoenix, enemy } = scene()
  phoenix.phoenixDiveCooldown = 100
  enemy.x = 370
  phoenix.retaliation = enemy
  const near = battle.spawn(250, 500, 'red', 'goose')!
  const far = battle.spawn(420, 500, 'red', 'goose')!
  phoenix.hp = 180
  near.hp = far.hp = 20
  near.stun = far.stun = 100
  battle.step()
  assert.equal(phoenix.hp, 190)
  assert.equal(near.hp, 30, 'An ally near the phoenix heals even behind her')
  assert.equal(far.hp, 20, 'An ally near the victim but outside the caster circle does not heal')
  assert.equal(near.burn, 0)
  assert.equal(battle.rings[0].owner, phoenix, 'The circle follows its caster')
  battle.step()
  assert.equal(battle.rings.length, 1, 'Healing retains its one-second cooldown')
}

// Adult and reborn birds rise before an enemy-only landing blast and ground fire.
for (const team of ['red', 'ffa'] as const) {
  for (const stage of ['adult', 'reborn'] as const) {
    const { battle, phoenix, enemy } = scene(team)
    phoenix.stage = stage
    const ally = battle.spawn(550, 520, team, 'phoenix')!
    ally.hp = 100; ally.stun = 100
    battle.step()
    assert.ok(phoenix.phoenixDive)
    assert.ok(phoenix.elevation > 0)
    assert.equal(enemy.hp, 5000, 'Ascent does no immediate damage')
    advance(battle, Math.floor((PHOENIX_DIVE.rise + PHOENIX_DIVE.hover) / DT) - 2)
    assert.equal(enemy.hp, 5000)
    land(battle, phoenix)
    assert.equal(phoenix.elevation, 0)
    assert.ok(Math.abs(phoenix.x - 500) < 1)
    assert.ok(enemy.hp <= 5000 - PHOENIX_DIVE.damage)
    assert.ok(enemy.burn > PHOENIX_DIVE.burn - DT * 2)
    assert.equal(enemy.burnOwner, phoenix)
    assert.equal(ally.burn, 0)
    assert.equal(ally.hp, 100 + PHOENIX_FIRE.heal)
    assert.equal(battle.phoenixFires.length, 1)
    assert.ok(phoenix.phoenixDiveCooldown > 0)
    phoenix.stun = 100
    const hp = enemy.hp
    advance(battle, 30)
    assert.ok(enemy.hp < hp - PHOENIX_FIRE.damagePerSecond * 0.5, 'Ground fire deals extra damage between burns')
    advance(battle, Math.ceil(PHOENIX_DIVE.fireLife / DT) + 2)
    assert.equal(battle.phoenixFires.length, 0)
    assert.ok(enemy.burn > 0, 'Burns can outlast the fire zone')
  }
}

// Structures protect perched occupants from the blast and its ground fire.
{
  const { battle, phoenix } = scene()
  battle.placeTower(540, 500)
  const tower = battle.towers[0]
  const perched = battle.spawn(540, 500, 'blue', 'thor')!
  perched.tower = tower; tower.occupant = perched
  perched.elevation = TOWER_ROOF + 12
  perched.hp = 5000; perched.stun = 100
  battle.step()
  land(battle, phoenix)
  assert.equal(perched.hp, 5000)
  assert.equal(perched.burn, 0)
  assert.equal(tower.hp, 500 - PHOENIX_DIVE.damage)
  phoenix.stun = 100
  advance(battle, 30)
  assert.ok(tower.hp < 500 - PHOENIX_DIVE.damage)
  assert.equal(perched.hp, 5000)
}

// The dive respects the established vampire weakness and black armor rules.
for (const species of ['vampire', 'rex'] as const) {
  const { battle, phoenix, enemy } = scene()
  enemy.hp = 0
  const victim = battle.spawn(500, 500, 'blue', species)!
  victim.hp = 5000; victim.stun = 100
  if (species === 'rex') victim.rexKills = TREX_BLACK.kills
  battle.step()
  land(battle, phoenix)
  const multiplier = species === 'vampire' ? VAMPIRE_FIRE_WEAKNESS : 1 - TREX_BLACK.armor
  assert.ok(Math.abs(victim.hp - (5000 - (PHOENIX_DIVE.damage + PHOENIX_FIRE.damagePerSecond * DT) * multiplier)) < 0.001)
}

// Eggs, chicks and converted phoenixes cannot begin a dive.
for (const stage of ['egg', 'chick', 'zombie'] as const) {
  const { battle, phoenix } = scene()
  if (stage === 'zombie') phoenix.zombie = true
  else { phoenix.stage = stage; phoenix.stageTime = 100 }
  battle.step()
  assert.equal(phoenix.phoenixDive, null)
  assert.equal(battle.phoenixFires.length, 0)
}

// A committed dive retains its landing point even after the target dies.
{
  const { battle, phoenix, enemy } = scene()
  battle.step()
  enemy.hp = 0
  land(battle, phoenix)
  assert.equal(battle.phoenixFires.length, 1)
  assert.ok(Math.abs(phoenix.x - 500) < 1)
}

// Control effects, conversion, death and Clear cancel flight without an explosion.
for (const interruption of ['stun', 'frozen', 'fear', 'lure', 'conversion', 'death', 'clear'] as const) {
  const { battle, phoenix, enemy } = scene()
  battle.step()
  advance(battle, 10)
  assert.ok(phoenix.elevation > 0)
  if (interruption === 'clear') battle.clear()
  else {
    if (interruption === 'death') phoenix.hp = 0
    else if (interruption === 'conversion') phoenix.infection = { time: 0.001, team: 'blue' }
    else if (interruption === 'lure') phoenix.lure = { owner: enemy, time: 1 }
    else phoenix[interruption] = 1
    battle.step()
  }
  assert.equal(phoenix.phoenixDive, null, interruption)
  assert.equal(battle.phoenixFires.length, 0, interruption)
  if (interruption === 'death') {
    assert.equal(phoenix.stage, 'egg')
    assert.equal(phoenix.elevation, 0)
  }
}

// Finished fire may outlive a rebirth, while conversion and Clear remove it.
{
  const { battle, phoenix } = scene()
  battle.step()
  land(battle, phoenix)
  phoenix.hp = 0
  battle.step()
  assert.equal(phoenix.stage, 'egg')
  assert.ok(battle.phoenixFires.length > 0)
  battle.clear()
  assert.equal(battle.phoenixFires.length, 0)
  assert.equal(battle.rings.length, 0)
}
{
  const { battle, phoenix } = scene()
  battle.step()
  land(battle, phoenix)
  phoenix.infection = { time: 0.001, team: 'blue' }
  battle.step()
  assert.equal(phoenix.zombie, true)
  assert.equal(battle.phoenixFires.length, 0)
  assert.equal(phoenix.phoenixDive, null)
  assert.ok(phoenix.hp <= PHOENIX.hp)
}

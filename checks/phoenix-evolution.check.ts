// Run only with the owner's permission: node checks/phoenix-evolution.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, type Fighter } from '../src/game/battle.ts'
import { PHOENIX, PHOENIX_FORMS, PHOENIX_FIRE, PHOENIX_FIRE_RESISTANCE, PHOENIX_KILL_HEAL, PHOENIX_BARRAGE, PHOENIX_ENCORE } from '../src/game/phoenix.ts'
import { DRAGON_FORMS } from '../src/game/dragon.ts'
import { TREX, TREX_ALPHA } from '../src/game/rex.ts'
import { TOWER_ROOF } from '../src/game/terrain.ts'
import type { Team } from '../src/game/units.ts'

const actions = (battle: Battle) => battle as unknown as {
  hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean
  fireAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
  tryPhoenixDive(owner: Fighter, target: Fighter): boolean
  stepPhoenixDive(owner: Fighter): boolean
  stepPhoenixFireballs(): void
  stepPhoenixFires(): void
  turnZombie(fighter: Fighter, team: Team): void
}
const scene = (team: Team = 'red') => {
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 1100)
  const phoenix = battle.spawn(300, 550, team, 'phoenix')!
  const enemy = battle.spawn(550, 550, team === 'ffa' ? 'ffa' : 'blue', 'thor')!
  enemy.hp = 5000; enemy.stun = 100
  phoenix.phoenixDiveCooldown = 0
  return { battle, phoenix, enemy, api: actions(battle) }
}
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`)

// HP remains below the corresponding Dragon/T-Rex stages; flight is the advantage.
assert.ok(PHOENIX.hp < DRAGON_FORMS[0].hp && PHOENIX.hp < TREX.hp)
assert.ok(PHOENIX_FORMS[1].hp < DRAGON_FORMS[1].hp && PHOENIX_FORMS[1].hp < TREX_ALPHA.hp)
assert.ok(PHOENIX_FORMS[2].hp < DRAGON_FORMS[2].hp && PHOENIX_FORMS[2].hp < TREX_ALPHA.hp)

// The resistance affects fire breath and burn, but never physical/other elements.
{
  const { battle, phoenix, enemy, api } = scene()
  enemy.hp = 0
  const dragon = battle.spawn(370, 550, 'blue', 'dragon')!
  dragon.stun = phoenix.stun = 100
  dragon.skillCooldown = 100
  api.fireAttack(dragon, phoenix, -1, 0)
  close(phoenix.hp, PHOENIX.hp - DRAGON_FORMS[0].damage * (1 - PHOENIX_FIRE_RESISTANCE))
  const before = phoenix.hp
  battle.step()
  close(phoenix.hp, before - PHOENIX_FIRE.damagePerSecond * DT * (1 - PHOENIX_FIRE_RESISTANCE))
  api.hit(phoenix, 40, 0, 0, dragon)
  close(phoenix.hp, before - PHOENIX_FIRE.damagePerSecond * DT * (1 - PHOENIX_FIRE_RESISTANCE) - 40)
  for (const form of [1, 2, 3] as const) {
    dragon.dragonForm = form
    const hp = phoenix.hp
    api.fireAttack(dragon, phoenix, -1, 0)
    close(phoenix.hp, hp - DRAGON_FORMS[form].damage)
  }
  phoenix.zombie = true
  dragon.dragonForm = 0
  const hp = phoenix.hp
  api.fireAttack(dragon, phoenix, -1, 0)
  close(phoenix.hp, hp - DRAGON_FORMS[0].damage)
}

// Real final kills evolve at exactly 50 and 100, preserving existing wounds.
{
  const { battle, phoenix, api } = scene()
  phoenix.hp = 177
  for (let k = 1; k <= 100; k++) {
    phoenix.hp = 177
    const victim = battle.spawn(370, 550, 'blue', 'goose')!
    api.hit(victim, 1000, 0, 0, phoenix)
    assert.equal(phoenix.phoenixKills, k)
    assert.equal(phoenix.phoenixForm, k < 50 ? 0 : k < 100 ? 1 : 2)
    assert.equal(phoenix.hp, 177 + PHOENIX_KILL_HEAL + (k === 50 || k === 100 ? 250 : 0))
  }
  const hp = phoenix.hp
  const structure = battle.spawn(800, 550, 'blue', 'anthill')!
  api.hit(structure, 10000, 0, 0, phoenix)
  const ally = battle.spawn(370, 550, 'red', 'goose')!
  api.hit(ally, 1000, 0, 0, phoenix)
  const rebirthing = battle.spawn(370, 550, 'blue', 'phoenix')!
  api.hit(rebirthing, 1000, 0, 0, phoenix)
  assert.equal(phoenix.phoenixKills, 100, 'Buildings, allies and temporary rebirth grant no kill')
  assert.equal(phoenix.hp, hp, 'Buildings, allies and temporary rebirth grant no healing')
  rebirthing.stage = 'reborn'; rebirthing.hp = 1
  api.hit(rebirthing, 1000, 0, 0, phoenix)
  api.hit(rebirthing, 1000, 0, 0, phoenix)
  assert.equal(phoenix.phoenixKills, 101, 'Final deaths count only once')
  assert.equal(phoenix.hp, hp + PHOENIX_KILL_HEAL)
}

// Kill healing caps at current maximum health, including a reborn chick's cap.
for (const stage of ['adult', 'chick', 'reborn'] as const) {
  const { phoenix, enemy, api } = scene()
  phoenix.stage = stage
  const maxHp = stage === 'chick' ? 70 : PHOENIX.hp
  phoenix.hp = maxHp - 5
  api.hit(enemy, 10000, 0, 0, phoenix)
  assert.equal(phoenix.hp, maxHp)
}

// Burns heal their living owner too; converted Phoenixes cannot gain kill healing.
{
  const { battle, phoenix, enemy, api } = scene()
  phoenix.hp = 100; phoenix.stun = 100
  enemy.hp = PHOENIX_FIRE.damagePerSecond * DT / 2
  enemy.burn = 1; enemy.burnOwner = phoenix
  battle.step()
  assert.equal(phoenix.hp, 100 + PHOENIX_KILL_HEAL)
  phoenix.zombie = true
  const victim = battle.spawn(550, 550, 'blue', 'goose')!
  api.hit(victim, 1000, 0, 0, phoenix)
  assert.equal(phoenix.hp, 100 + PHOENIX_KILL_HEAL)
}

// Burn kills share attribution and can evolve their owner while she is stunned.
{
  const { battle, phoenix, enemy } = scene()
  phoenix.phoenixKills = 49
  phoenix.stun = 100
  enemy.hp = PHOENIX_FIRE.damagePerSecond * DT / 2
  enemy.burn = 1; enemy.burnOwner = phoenix
  battle.step()
  assert.equal(phoenix.phoenixKills, 50)
  assert.equal(phoenix.phoenixForm, 1)
  assert.equal(phoenix.hp, PHOENIX_FORMS[1].hp)
}

// Adults launch eight distinct mortar shots; every landing leaves ground fire.
for (const team of ['red', 'ffa'] as const) {
  const { battle, phoenix, enemy, api } = scene(team)
  phoenix.phoenixForm = 1; phoenix.phoenixKills = 50; phoenix.hp = PHOENIX_FORMS[1].hp
  const ally = battle.spawn(550, 550, team, 'phoenix')!
  const airborne = battle.spawn(550, 550, enemy.team, 'goose')!
  airborne.elevation = 100
  assert.equal(api.tryPhoenixDive(phoenix, enemy), true)
  assert.equal(phoenix.phoenixDive?.kind, 'barrage')
  assert.equal(battle.phoenixFireballs.length, 0, 'The ascent warns before firing')
  for (let tick = 0; tick < Math.ceil((PHOENIX_BARRAGE.rise + PHOENIX_BARRAGE.volley) / DT); tick++) api.stepPhoenixDive(phoenix)
  assert.equal(battle.phoenixFireballs.length, 8)
  assert.equal(new Set(battle.phoenixFireballs.map((ball) => `${ball.x},${ball.y}`)).size, 8)
  assert.equal(enemy.hp, 5000, 'Shots deal damage when they land')
  while (phoenix.phoenixDive) api.stepPhoenixDive(phoenix)
  assert.equal(phoenix.elevation, 0)
  for (let tick = 0; tick < Math.ceil(PHOENIX_BARRAGE.flight / DT) + 1; tick++) api.stepPhoenixFireballs()
  assert.equal(battle.phoenixFireballs.length, 0)
  assert.equal(battle.phoenixFires.length, 8)
  assert.ok(enemy.hp < 5000)
  assert.equal(ally.hp, PHOENIX.hp)
  assert.equal(ally.burn, 0)
  assert.equal(airborne.hp, 45)
  assert.equal(airborne.burn, 0)
}

// Projectiles award kills, unlock legend, and then select the signature Encore.
{
  const { battle, phoenix, enemy, api } = scene()
  phoenix.phoenixForm = 1; phoenix.phoenixKills = 99; phoenix.hp = PHOENIX_FORMS[1].hp
  enemy.hp = 1
  battle.phoenixFireballs.push({ owner: phoenix, fromX: phoenix.x, fromY: phoenix.y,
    height: 200, x: enemy.x, y: enemy.y, time: PHOENIX_BARRAGE.flight - DT / 2 })
  api.stepPhoenixFireballs()
  assert.equal(phoenix.phoenixKills, 100)
  assert.equal(phoenix.phoenixForm, 2)
  assert.equal(phoenix.hp, PHOENIX_FORMS[2].hp)
  const next = battle.spawn(550, 550, 'blue', 'thor')!
  api.tryPhoenixDive(phoenix, next)
  assert.equal(phoenix.phoenixDive?.kind, 'encore')
}

// Encore sweeps back and forth three times, hits once per pass, and burns a line.
for (const team of ['red', 'ffa'] as const) {
  const { battle, phoenix, enemy, api } = scene(team)
  phoenix.phoenixForm = 2; phoenix.phoenixKills = 100; phoenix.hp = PHOENIX_FORMS[2].hp
  const ally = battle.spawn(550, 550, team, 'phoenix')!
  const offLine = battle.spawn(550, 700, enemy.team, 'goose')!
  const perched = battle.spawn(550, 550, enemy.team, 'thor')!
  const tower = { x: 550, y: 550, hp: 500, occupant: perched, fall: 0 }
  battle.towers.push(tower)
  perched.tower = tower; perched.elevation = TOWER_ROOF + 12
  api.tryPhoenixDive(phoenix, enemy)
  const directions = new Set<number>()
  while (phoenix.phoenixDive) {
    const x = phoenix.x
    api.stepPhoenixDive(phoenix)
    if (phoenix.x !== x) directions.add(Math.sign(phoenix.x - x))
  }
  assert.deepEqual(directions, new Set([1, -1]))
  close(enemy.hp, 5000 - PHOENIX_ENCORE.damage * PHOENIX_ENCORE.waves)
  assert.equal(tower.hp, 500 - PHOENIX_ENCORE.damage * PHOENIX_ENCORE.waves)
  assert.equal(perched.hp, 600)
  assert.equal(ally.hp, PHOENIX.hp)
  assert.equal(ally.burn, 0)
  assert.equal(offLine.hp, 45)
  assert.ok(battle.phoenixFires.length >= PHOENIX_ENCORE.waves * 8)
  assert.ok(battle.phoenixFires.every((fire) => fire.y === 550))
  assert.equal(phoenix.elevation, 0)
  assert.ok(phoenix.phoenixEncoreCooldown > 0)
  phoenix.phoenixDiveCooldown = 0
  api.tryPhoenixDive(phoenix, enemy)
  assert.equal(phoenix.phoenixDive?.kind, 'barrage', 'Mortar attacks remain available between Encore casts')
}

// Overlapping patches from the same Phoenix use only their strongest damage.
{
  const { battle, phoenix, enemy, api } = scene()
  for (const damage of [12, 15, 12]) battle.phoenixFires.push({ owner: phoenix, x: enemy.x,
    y: enemy.y, radius: 60, damage, burn: 4, life: 4 })
  api.stepPhoenixFires()
  close(enemy.hp, 5000 - 15 * 0.3)
  assert.equal(enemy.burnOwner, phoenix)
}

// All control/death paths cancel unreleased attacks and restore normal falling.
for (const form of [1, 2] as const) for (const cause of ['stun', 'frozen', 'fear', 'lure', 'held', 'thrown', 'death'] as const) {
  const { phoenix, enemy, api } = scene()
  phoenix.phoenixForm = form
  api.tryPhoenixDive(phoenix, enemy)
  assert.ok(phoenix.elevation > 0)
  if (cause === 'lure') phoenix.lure = { owner: enemy, time: 1 }
  else if (cause === 'held') phoenix.heldBy = enemy
  else if (cause === 'thrown') phoenix.thrown = { owner: enemy, time: 1 }
  else if (cause === 'death') phoenix.hp = 0
  else phoenix[cause] = 1
  api.stepPhoenixDive(phoenix)
  assert.equal(phoenix.phoenixDive, null, `${form}: ${cause}`)
  assert.equal(phoenix.falling, cause !== 'held' && cause !== 'thrown')
}

// A lingering fire can evolve its rebirthing owner without changing egg health.
{
  const { battle, phoenix, enemy } = scene()
  phoenix.phoenixKills = 49
  phoenix.hp = 0
  battle.step()
  assert.equal(phoenix.stage, 'egg')
  enemy.hp = 1
  battle.phoenixFires.push({ owner: phoenix, x: enemy.x, y: enemy.y,
    radius: 60, damage: 12, burn: 4, life: 4 })
  battle.tick = 17
  battle.step()
  assert.equal(phoenix.phoenixForm, 1)
  assert.equal(phoenix.phoenixKills, 50)
  assert.equal(phoenix.hp, 1)
  for (let tick = 0; tick < 650; tick++) battle.step()
  assert.equal(phoenix.stage, 'reborn')
  assert.equal(phoenix.phoenixForm, 1)
  assert.equal(phoenix.hp, PHOENIX_FORMS[1].hp)
  phoenix.hp = 0
  battle.step()
  assert.ok(!battle.fighters.includes(phoenix), 'Evolution never grants additional rebirths')
}

// Fired balls are canceled on death; conversion and Clear remove all owned fire.
for (const cleanup of ['death', 'conversion', 'clear'] as const) {
  const { battle, phoenix, enemy, api } = scene()
  phoenix.phoenixForm = 1; phoenix.phoenixKills = 50
  api.tryPhoenixDive(phoenix, enemy)
  for (let tick = 0; tick < Math.ceil(PHOENIX_BARRAGE.rise / DT) + 1; tick++) api.stepPhoenixDive(phoenix)
  assert.ok(battle.phoenixFireballs.length > 0)
  battle.phoenixFires.push({ owner: phoenix, x: enemy.x, y: enemy.y,
    radius: 60, damage: 12, burn: 4, life: 4 })
  if (cleanup === 'death') { phoenix.hp = 0; api.stepPhoenixFireballs() }
  else if (cleanup === 'conversion') api.turnZombie(phoenix, 'blue')
  else battle.clear()
  assert.equal(battle.phoenixFireballs.length, 0)
  assert.equal(battle.phoenixFires.length, cleanup === 'death' ? 1 : 0)
  if (cleanup !== 'death') assert.equal(phoenix.phoenixDive, null)
  if (cleanup === 'clear') { assert.equal(phoenix.phoenixKills, 0); assert.equal(phoenix.phoenixForm, 0) }
}

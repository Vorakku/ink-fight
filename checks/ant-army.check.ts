// Run only with the owner's permission: node checks/ant-army.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, MAX_FIGHTERS, type Fighter } from '../src/game/battle.ts'
import { ANT_ARMY, ANT_PROVOKE, COLONY_BUILD } from '../src/game/ant.ts'
import type { Species, Team } from '../src/game/units.ts'

const advance = (battle: Battle, ticks: number) => { for (let i = 0; i < ticks; i++) battle.step() }
const scene = (roll = 0.99, team: Team = 'red') => {
  const battle = new Battle(() => roll)
  battle.resize(1800, 1100)
  const home = battle.spawn(500, 500, team, 'anthill')!
  home.colony!.time = COLONY_BUILD
  home.colony!.level = 1
  home.cooldown = 100
  battle.nextColony[team] = 10000
  return { battle, home }
}
const resident = (battle: Battle, home: Fighter, species: Species = 'ant') => {
  const ant = battle.spawn(home.x, home.y, home.team, species)!
  ant.antHome = ant.inside = home
  ant.entry = 1
  return ant
}

// Both painted creatures and sheltered residents use the same 1,000 slots.
{
  const { battle, home } = scene()
  assert.equal(MAX_FIGHTERS, 1000)
  while (battle.fighters.length < MAX_FIGHTERS) resident(battle, home)
  assert.equal(battle.spawn(900, 600, 'blue'), undefined)
  home.colony!.recruits = 6
  home.cooldown = 0
  battle.step()
  assert.equal(home.colony!.recruits, 6, 'Capacity never spends food recruits')
  assert.equal(battle.fighters.length, MAX_FIGHTERS)
}

// Real construction keeps its workers alive and funds the first twenty residents.
{
  const { battle, home } = scene()
  home.colony!.time = 0
  home.colony!.level = 0
  home.colony!.need = 10
  for (let i = 0; i < 10; i++) resident(battle, home).buildFor = home
  advance(battle, Math.ceil(COLONY_BUILD / DT) + 1)
  assert.equal(home.colony!.level, 1)
  assert.equal(home.colony!.recruits, 10)
  assert.equal(battle.fighters.filter((f) => f.species === 'ant').length, 10)
  assert.ok(battle.fighters.filter((f) => f.species === 'ant').every((f) => f.inside === home && !f.buildFor))
  home.cooldown = 0
  advance(battle, 100)
  assert.ok(battle.fighters.filter((f) => f.species === 'ant').length >= 20)
}

// New worker milestones grow one fortress, rather than placing a second hill.
{
  const { battle, home } = scene()
  battle.nextColony.red = 20
  for (let i = 0; i < 20; i++) resident(battle, home)
  advance(battle, 240)
  assert.equal(battle.fighters.filter((f) => f.species === 'anthill').length, 1)
  assert.equal(home.colony!.level, 2)
  assert.equal(home.hp, 450)
}

// Twenty defenders leave at intervals, with no teleporting wave or extra defenders.
for (const team of ['red', 'ffa'] as const) {
  const { battle, home } = scene(0.99, team)
  for (let i = 0; i < 30; i++) resident(battle, home)
  battle.nextColony[team] = 100
  const enemy = battle.spawn(700, 500, team === 'ffa' ? 'ffa' : 'blue', 'rex')!
  enemy.hp = 100000
  enemy.stun = 100
  battle.step()
  const deployed = () => battle.fighters.filter((f) => f.antHome === home && f.antDeployed)
  assert.equal(deployed().length, 1)
  advance(battle, 5)
  assert.equal(deployed().length, 1)
  advance(battle, 6 * 60)
  assert.equal(deployed().length, ANT_ARMY.defenders)
  enemy.hp = 0
  advance(battle, 4 * 60)
  assert.equal(deployed().length, 0, 'Survivors return after combat')
}

// A completed food delivery grants recruits once and frees the surviving crew.
{
  const { battle, home } = scene()
  const crew = [resident(battle, home), resident(battle, home)]
  for (const ant of crew) ant.inside = null
  const body = { x: 504, y: 509, life: Infinity, color: '#aaa', size: 2,
    body: battle.spawn(1000, 700, 'blue')!, haul: { home, crew, entry: 0.99 } }
  battle.splats.push(body)
  for (const ant of crew) ant.haulFor = body
  // The simulation's delivered-body transition; crew assignment is already complete.
  const hauling = battle as unknown as { moveBodies(): void }
  hauling.moveBodies()
  assert.equal(home.colony!.recruits, 8)
  assert.equal(body.life, 0)
  assert.ok(crew.every((ant) => !ant.haulFor))
  hauling.moveBodies()
  assert.equal(home.colony!.recruits, 8)
}

// Birth rolls unlock castes only at their respective tiers.
for (const [tier, roll, expected] of [
  [1, 0.2, 'ant'], [2, 0.2, 'ant-tank'], [3, 0.5, 'ant-slasher'], [4, 0.05, 'ant-fly'],
] as const) {
  const { battle, home } = scene(roll)
  home.colony!.level = tier
  home.cooldown = 0
  battle.step()
  const newborn = battle.fighters.find((f) => f.antHome === home)!
  assert.equal(newborn.species, expected)
  assert.equal(newborn.inside, home)
}

// Tanks provoke nearby enemies, spare allies, and absorb part of incoming damage.
{
  const { battle, home } = scene()
  const tank = resident(battle, home, 'ant-tank')
  tank.inside = null
  tank.antDeployed = true
  const enemy = battle.spawn(560, 500, 'blue', 'goose')!
  enemy.stun = 100
  const ally = battle.spawn(530, 550, 'red', 'goose')!
  battle.step()
  assert.equal(enemy.taunt?.owner, tank)
  assert.equal(ally.taunt, null)
  const actions = battle as unknown as { hit(target: Fighter, damage: number): boolean }
  const hp = tank.hp
  actions.hit(tank, 100)
  assert.equal(tank.hp, hp - 100 * (1 - ANT_PROVOKE.armor))
  advance(battle, Math.ceil(ANT_PROVOKE.duration / DT) + 2)
  assert.ok(!enemy.taunt || enemy.taunt.time <= 0)
}

// Slasher bites produce the shared bleeding status.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 1100)
  const ant = battle.spawn(500, 500, 'red', 'ant-slasher')!
  const enemy = battle.spawn(515, 500, 'blue', 'rex')!
  enemy.stun = 100
  battle.step()
  assert.ok(enemy.bleed > 0)
  assert.equal(enemy.bleedOwner, ant)
}

// Flyers lift allies, deliver them toward combat, and release them on interruption.
for (const interrupt of ['deliver', 'stun', 'death', 'conversion'] as const) {
  const { battle, home } = scene()
  const fly = resident(battle, home, 'ant-fly')
  const passenger = resident(battle, home, 'ant-slasher')
  for (const ant of [fly, passenger]) { ant.inside = null; ant.antDeployed = true }
  const enemy = battle.spawn(730, 500, 'blue', 'rex')!
  enemy.stun = 100
  enemy.hp = 10000
  home.colony!.enemy = enemy
  battle.step()
  assert.equal(passenger.heldBy, fly)
  assert.ok(fly.elevation > 0)
  if (interrupt === 'stun') fly.stun = 2
  if (interrupt === 'death') fly.hp = 0
  if (interrupt === 'conversion') fly.infection = { time: DT / 2, team: 'blue' }
  advance(battle, interrupt === 'deliver' ? 180 : 2)
  assert.equal(passenger.heldBy, null, interrupt)
  assert.equal(passenger.elevation, 0, interrupt)
  if (interrupt === 'deliver') assert.ok(passenger.x > home.x + 100, 'The passenger reaches the front faster')
}

// Destroying the shelter releases its residents and leaves no dead-home membership.
{
  const { battle, home } = scene()
  const ant = resident(battle, home, 'ant-slasher')
  home.hp = 0
  battle.step()
  assert.equal(ant.inside, null)
  assert.equal(ant.antHome, null)
}

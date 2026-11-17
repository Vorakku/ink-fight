// Run only with the owner's permission: node checks/dragon-domain.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, type Fighter } from '../src/game/battle.ts'
import { DRAGON_DOMAIN, DRAGON_FORMS, type DragonForm } from '../src/game/dragon.ts'
import { TREX_BLACK } from '../src/game/rex.ts'
import type { Team } from '../src/game/units.ts'

const sealTime = DRAGON_DOMAIN.rise + DRAGON_DOMAIN.scream
const endTime = sealTime + DRAGON_DOMAIN.hold + DRAGON_DOMAIN.shrink
const advance = (battle: Battle, ticks: number) => { for (let i = 0; i < ticks; i++) battle.step() }
const scene = (form: DragonForm = 3, team: Team = 'red') => {
  const battle = new Battle(() => 0.99)
  battle.resize(2200, 1500)
  const dragon = battle.spawn(900, 700, team, 'dragon')!
  dragon.dragonForm = form
  dragon.hp = DRAGON_FORMS[form].hp * 0.49
  dragon.cooldown = dragon.skillCooldown = dragon.iceDiveCooldown = dragon.lightningSwordCooldown = 100
  const enemy = battle.spawn(1100, 700, team === 'ffa' ? 'ffa' : 'blue', 'goose')!
  enemy.hp = 100000
  enemy.stun = 100
  return { battle, dragon, enemy }
}
const seal = (battle: Battle, dragon: Fighter) => {
  advance(battle, Math.ceil(sealTime / DT) + 3)
  assert.ok(dragon.dragonDomain?.sealed)
  return dragon.dragonDomain!
}

// Fire, ice and lightning dragons cannot cast or spend their future golden use.
for (const form of [0, 1, 2] as const) {
  const { battle, dragon } = scene(form)
  battle.step()
  assert.equal(dragon.dragonDomain, null)
  assert.equal(dragon.dragonDomainUsed, false)
  assert.equal(battle.dragonDomains.length, 0)
}

// Only golden adults can cast below, but not at, half maximum health.
{
  const form = 3
  const { battle, dragon } = scene(form)
  dragon.hp = DRAGON_FORMS[form].hp * DRAGON_DOMAIN.threshold
  battle.step()
  assert.equal(dragon.dragonDomain, null)
  dragon.hp -= 1
  battle.step()
  assert.ok(dragon.dragonDomain)
  assert.equal(dragon.dragonDomainUsed, true)
  advance(battle, 20)
  assert.ok(dragon.elevation > 0, 'The opening takes the caster into the air')
  assert.equal(dragon.dragonDomain!.sealed, false)
  const domain = seal(battle, dragon)
  assert.equal(domain.radius, DRAGON_DOMAIN.radius)
  advance(battle, Math.ceil(DRAGON_DOMAIN.fall / DT) + 2)
  assert.equal(dragon.elevation, 0, 'The caster lands so ground enemies can kill it')
}

// Babies and zombies cannot use the emergency domain.
for (const kind of ['baby', 'zombie'] as const) {
  const { battle, dragon } = scene()
  if (kind === 'baby') dragon.dragonMaturity = 0
  else dragon.zombie = true
  dragon.hp = 50
  battle.step()
  assert.equal(dragon.dragonDomain, null)
}

// Enemy flyers are trapped too; allies, buildings, and sheltered residents are spared.
for (const team of ['red', 'ffa'] as const) {
  const { battle, dragon, enemy } = scene(3, team)
  const ally = battle.spawn(950, 750, team, 'dragon')!
  ally.stun = 100
  const flyer = battle.spawn(1050, 750, team === 'ffa' ? 'ffa' : 'blue', 'vampire')!
  flyer.bat = true
  flyer.elevation = 45
  flyer.stun = 100
  const home = battle.spawn(1000, 800, team === 'ffa' ? 'ffa' : 'blue', 'anthill')!
  const resident = battle.spawn(home.x, home.y, home.team, 'ant')!
  resident.inside = resident.antHome = home
  resident.entry = 1
  const domain = seal(battle, dragon)
  assert.ok(domain.captives.has(enemy))
  assert.ok(domain.captives.has(flyer))
  assert.equal(domain.captives.has(ally), false)
  assert.equal(domain.captives.has(home), false)
  assert.equal(domain.captives.has(resident), false)
  assert.equal(enemy.retaliation, dragon)
  enemy.x = domain.x + domain.radius + 500
  enemy.elevation = 100
  enemy.vx = 1500
  battle.step()
  assert.ok(Math.hypot(enemy.x - domain.x, enemy.y - domain.y) < domain.radius)
  assert.ok(enemy.elevation > 0, 'The wall constrains airborne escape as well as walkers')
  domain.time = sealTime + DRAGON_DOMAIN.hold + DRAGON_DOMAIN.shrink / 2
  const before = domain.radius
  dragon.hp = DRAGON_FORMS[3].hp
  battle.step()
  assert.ok(domain.radius < before, 'Healing does not stop the shrinking ring')
}

// Captives focus the caster rather than a different retaliation or provoke target.
{
  const { battle, dragon, enemy } = scene()
  seal(battle, dragon)
  const distraction = battle.spawn(1000, 650, 'red', 'ant-tank')!
  enemy.stun = 0
  enemy.retaliation = distraction
  enemy.taunt = { owner: distraction, time: 3 }
  battle.step()
  assert.equal(enemy.target, dragon)
}

// An actual lethal bite on the final frame breaks the arena before its execution.
{
  const { battle, dragon, enemy } = scene()
  const domain = seal(battle, dragon)
  domain.time = endTime - DT / 2
  dragon.hp = 1
  dragon.elevation = 0
  const killer = battle.spawn(dragon.x + 20, dragon.y, 'blue', 'rex')!
  killer.skillCooldown = killer.rexStompCooldown = killer.rexRamCooldown = 100
  battle.step()
  assert.ok(dragon.hp <= 0)
  assert.equal(battle.dragonDomains.length, 0)
  assert.ok(enemy.hp > 0, 'Killing the caster wins even at the collapse deadline')
}

// Collapse kills armored captives, credits the caster, and honors Phoenix rebirth.
{
  const { battle, dragon, enemy } = scene()
  const armored = battle.spawn(1000, 750, 'blue', 'rex')!
  armored.rexKills = TREX_BLACK.kills
  armored.hp = 100000
  armored.stun = 100
  const phoenix = battle.spawn(1050, 650, 'blue', 'phoenix')!
  phoenix.stun = 100
  const domain = seal(battle, dragon)
  domain.time = endTime - DT / 2
  battle.step()
  assert.ok(enemy.hp <= 0)
  assert.ok(armored.hp <= 0)
  assert.equal(dragon.dragonKills, 2)
  assert.equal(phoenix.stage, 'egg')
  assert.ok(phoenix.hp > 0)
  assert.equal(dragon.dragonDomain, null)
  assert.equal(battle.dragonDomains.length, 0)
  dragon.hp = 100
  battle.spawn(1100, 700, 'blue', 'goose')!.stun = 100
  battle.step()
  assert.equal(dragon.dragonDomain, null, 'The same dragon cannot recharge its domain')
}

// Conversion, an interrupted opening, and Clear release the arena without executing captives.
for (const cause of ['conversion', 'interrupt', 'clear'] as const) {
  const { battle, dragon, enemy } = scene()
  if (cause === 'interrupt') battle.step()
  else seal(battle, dragon)
  if (cause === 'conversion') dragon.infection = { time: DT / 2, team: 'blue' }
  if (cause === 'interrupt') dragon.stun = 1
  if (cause === 'clear') battle.clear()
  else battle.step()
  assert.equal(dragon.dragonDomain, null, cause)
  assert.equal(battle.dragonDomains.length, 0, cause)
  assert.ok(enemy.hp > 0, cause)
}

// The golden basic attack changes its element while retaining the chain skill.
{
  const { battle, dragon, enemy } = scene(3)
  dragon.hp = DRAGON_FORMS[3].hp
  dragon.cooldown = dragon.skillCooldown = 0
  enemy.x = dragon.x + 80
  battle.step()
  assert.equal(battle.flames[0]?.element, 'gold')
  assert.equal(enemy.burn, 0)
  assert.equal(enemy.chill, 0)
  assert.ok(battle.shots.length > 0)
}

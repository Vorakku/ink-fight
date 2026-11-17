// Run only with the owner's permission: node checks/rex-power.check.ts
import assert from 'node:assert/strict'
import { Battle, DT } from '../src/game/battle.ts'
import { GOOSE } from '../src/game/goose.ts'
import { TREX_ALPHA, TREX_BLACK, TREX_BLOODLUST, TREX_THROW } from '../src/game/rex.ts'
import { TOWER_ROOF } from '../src/game/terrain.ts'
import type { Team } from '../src/game/units.ts'

const advance = (battle: Battle, ticks: number) => { for (let k = 0; k < ticks; k++) battle.step() }
const scene = (roll = 0.1, team: Team = 'red') => {
  const battle = new Battle(() => roll)
  battle.resize(1800, 1100)
  const rex = battle.spawn(400, 500, team, 'rex')!
  rex.rexKills = TREX_BLACK.kills
  rex.hp = TREX_ALPHA.hp
  rex.skillCooldown = rex.rexStompCooldown = rex.rexRamCooldown = 100
  return { battle, rex }
}

// The scream's climax shocks exposed enemies, then fear sends them fleeing.
for (const team of ['red', 'ffa'] as const) {
  const { battle, rex } = scene(0.99, team)
  rex.hp = TREX_ALPHA.hp * 0.45
  const enemyTeam = team === 'ffa' ? 'ffa' : 'blue'
  const enemy = battle.spawn(600, 500, enemyTeam, 'goose')!
  enemy.hp = 5000; enemy.cooldown = 100
  const ally = battle.spawn(350, 650, team, 'rex')!
  ally.cooldown = ally.skillCooldown = ally.rexStompCooldown = 100
  const nest = battle.spawn(550, 650, enemyTeam, 'dragon-nest')!
  const sheltered = battle.spawn(550, 650, enemyTeam, 'ant')!
  sheltered.inside = nest; sheltered.entry = 1
  const egg = battle.spawn(300, 500, enemyTeam, 'phoenix')!
  egg.stage = 'egg'; egg.stageTime = 100
  battle.step()
  assert.equal(enemy.fear, 0, 'An unfinished windup has not pulsed terror yet')
  for (let k = 0; k < 90 && !rex.rexBloodlust; k++) battle.step()
  assert.ok(enemy.stun > 0)
  assert.ok(enemy.fear > 2.5)
  assert.equal(enemy.scaredBy, rex)
  assert.equal(ally.fear, 0)
  assert.equal(ally.stun, 0)
  assert.equal(sheltered.fear, 0)
  assert.equal(egg.fear, 0)
  assert.equal(nest.fear, 0)
  for (const f of battle.fighters) if (f.species === 'rex') f.stun = 100
  const before = Math.hypot(enemy.x - rex.x, enemy.y - rex.y)
  advance(battle, Math.ceil(TREX_BLOODLUST.shock / DT) + 20)
  assert.ok(Math.hypot(enemy.x - rex.x, enemy.y - rex.y) > before + 20, 'The shocked enemy runs away when the stun ends')
}

// Stopping the opening call cannot repeatedly stun enemies for free.
{
  const { battle, rex } = scene(0.99)
  rex.hp = TREX_ALPHA.hp * 0.45
  const enemy = battle.spawn(650, 500, 'blue', 'goose')!
  enemy.cooldown = 100
  battle.step()
  rex.stun = 1
  battle.step()
  assert.equal(rex.rexBloodlustCall, 0)
  assert.equal(enemy.stun, 0)
  assert.equal(enemy.fear, 0)
}

const throwScene = () => {
  const { battle, rex } = scene()
  const victim = battle.spawn(430, 500, 'blue', 'dragon')!
  victim.dragonForm = 2
  victim.hp = 5000; victim.stun = 100
  const first = battle.spawn(730, 500, 'blue', 'goose')!
  const second = battle.spawn(780, 520, 'blue', 'goose')!
  first.hp = second.hp = 5000
  first.stun = second.stun = 100
  const ally = battle.spawn(760, 570, 'red', 'goose')!
  ally.stun = 100
  battle.step()
  assert.equal(rex.grab?.target, victim, 'Black can lift a lightning dragon smaller than itself')
  const aim = rex.grab!.landing!
  assert.ok(aim)
  assert.ok(Math.hypot(aim.x - first.x, aim.y - first.y) < TREX_THROW.radius)
  assert.ok(Math.hypot(aim.x - second.x, aim.y - second.y) < TREX_THROW.radius)
  rex.cooldown = 100
  for (let k = 0; k < 90 && !victim.thrown; k++) battle.step()
  assert.ok(victim.thrown?.smash)
  assert.equal(victim.heldBy, null)
  victim.bleed = 0; victim.bleedOwner = null
  victim.stun = 0
  return { battle, rex, victim, first, second, ally, aim }
}

// Aimed flight reaches its marked area and knocks out enemies, while sparing allies.
{
  const { battle, victim, first, second, ally, aim } = throwScene()
  const before = victim.hp
  const startX = victim.x
  for (let k = 0; k < 90 && victim.thrown && victim.thrown.time > DT * 1.1; k++) battle.step()
  assert.ok(victim.x > startX + 100, 'The victim follows a flight instead of teleporting')
  first.stun = second.stun = 0
  battle.step()
  assert.equal(victim.thrown, null)
  assert.ok(Math.hypot(victim.x - aim.x, victim.y - aim.y) < 40)
  assert.equal(victim.hp, before - TREX_THROW.damage)
  assert.ok(victim.stun > 1.9)
  assert.equal(first.hp, 5000 - TREX_THROW.splashDamage)
  assert.equal(second.hp, 5000 - TREX_THROW.splashDamage)
  assert.ok(first.stun > 1.9 && second.stun > 1.9)
  assert.ok(Math.hypot(first.vx, first.vy) > 100)
  assert.equal(ally.hp, GOOSE.hp)
  assert.equal(ally.fear, 0)
  assert.ok(battle.impacts.some((impact) => impact.radius === TREX_THROW.radius))
}

// Armor applies to the splash; towers protect their occupants.
{
  const { battle, victim, aim } = throwScene()
  const armored = battle.spawn(aim.x + 90, aim.y - 50, 'blue', 'rex')!
  armored.rexKills = TREX_BLACK.kills
  armored.hp = 5000; armored.stun = 100
  battle.placeTower(aim.x + 80, aim.y + 40)
  const tower = battle.towers[0]
  const perched = battle.spawn(tower.x, tower.y, 'blue', 'thor')!
  perched.tower = tower; tower.occupant = perched
  perched.elevation = TOWER_ROOF + 12
  perched.hp = 5000; perched.stun = 100
  for (let k = 0; k < 90 && victim.thrown; k++) battle.step()
  assert.equal(armored.hp, 5000 - TREX_THROW.splashDamage * (1 - TREX_BLACK.armor))
  assert.equal(perched.hp, 5000)
  assert.equal(tower.hp, 500 - TREX_THROW.splashDamage)
}

// Splash kills retain the thrower's kill and food credit.
{
  const { battle, rex, victim, first, second } = throwScene()
  first.hp = second.hp = 1
  const kills = rex.rexKills
  for (let k = 0; k < 90 && victim.thrown; k++) battle.step()
  assert.equal(rex.rexKills, kills + 2)
  assert.ok(battle.splats.some((body) => body.meal?.victim === first && body.meal.owner === rex))
  assert.ok(battle.splats.some((body) => body.meal?.victim === second && body.meal.owner === rex))
}

// Changing sides in flight cancels the special blast instead of hitting new enemies.
{
  const { battle, rex, victim, first, second } = throwScene()
  rex.infection = { time: 0.001, team: 'blue' }
  battle.step()
  assert.equal(rex.zombie, true)
  for (let k = 0; k < 90 && victim.thrown; k++) battle.step()
  assert.equal(first.hp, 5000)
  assert.equal(second.hp, 5000)
  assert.equal(battle.impacts.length, 0)
}

// Clear removes both held landing targets and in-flight smash metadata.
{
  const { battle, rex, victim } = throwScene()
  battle.clear()
  assert.equal(rex.grab, null)
  assert.equal(victim.heldBy, null)
  assert.equal(victim.thrown, null)
  assert.equal(battle.impacts.length, 0)
}

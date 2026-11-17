// Run only with the owner's permission: node checks/rex-black.check.ts
import assert from 'node:assert/strict'
import { Battle, DT } from '../src/game/battle.ts'
import { GOOSE } from '../src/game/goose.ts'
import { PHOENIX_FIRE } from '../src/game/phoenix.ts'
import { TREX, TREX_ALPHA, TREX_BLACK, TREX_RAM, TREX_STOMP } from '../src/game/rex.ts'

const scene = () => {
  const battle = new Battle(() => 0.99)
  battle.resize(1000, 700)
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  rex.skillCooldown = 100
  rex.rexStompCooldown = 100
  return { battle, rex }
}
const advance = (battle: Battle, ticks: number) => { for (let k = 0; k < ticks; k++) battle.step() }

// The hundredth actual kill unlocks black before food is eaten; growth is capped.
{
  const { battle, rex } = scene()
  rex.rexKills = TREX_BLACK.kills - 1
  rex.hp = 300
  const prey = battle.spawn(320, 400, 'blue', 'goose')!
  prey.hp = 1; prey.stun = 100
  battle.step()
  assert.equal(rex.rexKills, TREX_BLACK.kills)
  assert.equal(rex.rexMeals, 0, 'The black milestone counts kills rather than meals')
  assert.equal(rex.hp, 300 + TREX_ALPHA.hp - TREX.hp, 'Added capacity preserves existing wounds')
  assert.ok(rex.evolution > 0)
  const target = battle.spawn(rex.x + 46, rex.y, 'blue', 'rex')!
  target.hp = 10000; target.stun = 100
  rex.cooldown = 0
  battle.step()
  assert.ok(target.hp < 10000 - TREX_ALPHA.damage, 'Black receives capped adult reach, alpha damage and bleeding')
}

// Buildings and temporary phoenix rebirth cannot farm the kill counter.
{
  const { battle, rex } = scene()
  rex.rexKills = 99
  const hill = battle.spawn(325, 400, 'blue', 'anthill')!
  hill.hp = 1
  battle.step()
  assert.equal(rex.rexKills, 99)
  const phoenix = battle.spawn(rex.x + 25, rex.y, 'blue', 'phoenix')!
  phoenix.hp = 1; phoenix.stun = 100
  rex.cooldown = 0
  battle.step()
  assert.equal(phoenix.stage, 'egg')
  assert.equal(rex.rexKills, 99)
}

// Armor reduces direct enemy damage as well as attributed burn and bleed.
for (const black of [false, true]) {
  const { battle, rex } = scene()
  rex.rexKills = black ? TREX_BLACK.kills : 0
  rex.stun = 100
  const enemy = battle.spawn(rex.x + 30, rex.y, 'blue', 'goose')!
  const hp = rex.hp
  battle.step()
  const resistance = black ? 1 - TREX_BLACK.armor : 1
  assert.ok(Math.abs(rex.hp - (hp - GOOSE.damage * resistance)) < 0.001)
  enemy.stun = 100
  rex.burn = rex.bleed = 1
  rex.burnOwner = rex.bleedOwner = enemy
  const before = rex.hp
  advance(battle, 60)
  assert.ok(Math.abs(rex.hp - (before - (PHOENIX_FIRE.damagePerSecond + TREX_ALPHA.bleedDamage) * resistance)) < 0.001)
  rex.falling = true; rex.elevation = 1
  const wounded = rex.hp
  battle.step()
  assert.ok(Math.abs(rex.hp - (wounded - 25)) < 0.001, 'Environmental fall damage ignores enemy armor')
}

// Every form charges before an enemy-only area stomp.
for (const form of [0, 1, 2]) {
  const { battle, rex } = scene()
  rex.rexStompCooldown = 0
  rex.rexMeals = form === 1 ? TREX_ALPHA.meals : 0
  rex.rexKills = form === 2 ? TREX_BLACK.kills : 0
  if (form === 2) rex.hp = TREX_ALPHA.hp
  rex.rexRamCooldown = 100
  const first = battle.spawn(360, 400, 'blue', 'goose')!
  const second = battle.spawn(240, 400, 'blue', 'goose')!
  const ally = battle.spawn(300, 450, 'red', 'goose')!
  first.hp = second.hp = 5000
  first.stun = second.stun = ally.stun = 100
  battle.step()
  assert.ok(rex.rexStomp > 0)
  assert.equal(first.hp, 5000, 'The windup does no immediate damage')
  assert.equal(second.hp, 5000)
  advance(battle, Math.ceil(TREX_STOMP.charge / DT))
  const damage = (form ? TREX_ALPHA.damage : TREX.damage) * TREX_STOMP.power
  assert.equal(first.hp, 5000 - damage)
  assert.equal(second.hp, 5000 - damage)
  assert.equal(ally.hp, GOOSE.hp)
  assert.equal(rex.rexStomp, 0)
  assert.ok(rex.rexStompCooldown > 0)
  assert.ok(battle.impacts.some((impact) => impact.color === '#ac8057'))
}

// A lone enemy is enough; a ready stomp beats a roar and becomes ready again.
{
  const battle = new Battle(() => 0) // A roar would succeed if it could preempt the stomp.
  battle.resize(1000, 700)
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  const target = battle.spawn(330, 400, 'blue', 'goose')!
  target.hp = 10000; target.stun = 100
  battle.step()
  assert.ok(rex.rexStomp > 0, 'Stomp triggers against a single nearby enemy')
  assert.equal(rex.roar, 0, 'A ready stomp takes priority over roaring')
  advance(battle, Math.ceil(TREX_STOMP.charge / DT))
  assert.equal(target.hp, 10000 - TREX.damage * TREX_STOMP.power)
  rex.cooldown = 100 // Keep intervening bites/grabs separate from the stomp cooldown.
  advance(battle, Math.ceil(TREX_STOMP.cooldown / DT))
  assert.equal(rex.rexStompCooldown, 0)
  target.x = rex.x + 30; target.y = rex.y
  rex.cooldown = 0
  battle.step()
  assert.ok(rex.rexStomp > 0, 'The next available attack can stomp again')
  assert.equal(rex.roar, 0)
}

const ramScene = () => {
  const { battle, rex } = scene()
  rex.rexKills = TREX_BLACK.kills
  rex.hp = TREX_ALPHA.hp
  rex.rexStompCooldown = 100
  const target = battle.spawn(450, 400, 'blue', 'thor')!
  target.hp = 10000; target.stun = 100
  battle.step()
  assert.equal(rex.rexRam?.phase, 'windup')
  assert.equal(target.hp, 10000)
  for (let k = 0; k < 90 && target.heldBy !== rex; k++) battle.step()
  assert.equal(target.heldBy, rex)
  assert.equal(target.hp, 10000 - TREX_RAM.damage)
  return { battle, rex, target }
}

// The carried enemy reaches the wall, takes one slam, is stunned and released.
{
  const { battle, rex, target } = ramScene()
  target.stun = 0
  for (let k = 0; k < 240 && rex.rexRam?.phase !== 'pin'; k++) battle.step()
  assert.equal(rex.rexRam?.phase, 'pin')
  assert.equal(target.heldBy, rex)
  assert.equal(target.hp, 10000 - TREX_RAM.damage - TREX_RAM.wallDamage)
  assert.ok(target.x > battle.width - 80)
  assert.ok(target.stun > TREX_RAM.stun - DT * 2)
  for (let k = 0; k < 60 && rex.rexRam; k++) battle.step()
  assert.equal(rex.rexRam, null)
  assert.equal(target.heldBy, null)
  assert.equal(target.thrown, null)
  assert.ok(target.stun > 1)
}

// Other forms cannot ram; a dodge after windup makes a black ram miss.
for (const meals of [0, TREX_ALPHA.meals]) {
  const { battle, rex } = scene()
  rex.rexMeals = meals
  const target = battle.spawn(450, 400, 'blue', 'goose')!
  target.stun = 100
  battle.step()
  assert.equal(rex.rexRam, null)
}
{
  const { battle, rex } = scene()
  rex.rexKills = TREX_BLACK.kills
  rex.hp = TREX_ALPHA.hp
  const target = battle.spawn(450, 400, 'blue', 'goose')!
  target.hp = 10000; target.stun = 100
  battle.step()
  for (let k = 0; k < 60 && rex.rexRam?.phase === 'windup'; k++) battle.step()
  target.y = 550
  advance(battle, Math.ceil(TREX_RAM.dash / DT) + 2)
  assert.equal(rex.rexRam, null)
  assert.equal(target.heldBy, null)
  assert.equal(target.hp, 10000)
  assert.equal(battle.impacts.length, 0, 'A miss does not invent a wall hit')
}

// Interruptions release captures without a throw or a free wall stun.
for (const interruption of ['stun', 'frozen', 'fear', 'lure', 'death', 'conversion', 'clear', 'victim-death'] as const) {
  const { battle, rex, target } = ramScene()
  if (interruption === 'clear') battle.clear()
  else {
    if (interruption === 'death') rex.hp = 0
    else if (interruption === 'victim-death') target.hp = 0
    else if (interruption === 'conversion') rex.infection = { time: 0.001, team: 'blue' }
    else if (interruption === 'lure') rex.lure = { owner: target, time: 1 }
    else rex[interruption] = 1
    battle.step()
  }
  assert.equal(rex.rexRam, null, interruption)
  assert.equal(target.heldBy, null, interruption)
  assert.equal(target.thrown, null, interruption)
}

// Clear cancels a charged foot and resets all progression and ability timers.
{
  const { battle, rex } = scene()
  rex.rexKills = TREX_BLACK.kills
  rex.hp = TREX_ALPHA.hp
  rex.rexStomp = TREX_STOMP.charge
  rex.rexStompCooldown = TREX_STOMP.cooldown
  rex.rexRamCooldown = TREX_RAM.cooldown
  battle.clear()
  assert.equal(rex.rexKills, 0)
  assert.equal(rex.rexStomp, 0)
  assert.equal(rex.rexStompCooldown, 0)
  assert.equal(rex.rexRamCooldown, 0)
  assert.equal(rex.rexRam, null)
}

// Run only with the owner's permission: node checks/swordsaint.check.ts
import assert from 'node:assert/strict'
import { Battle, type Fighter } from '../src/game/battle.ts'
import { SWORD_SAINT, SWORD_SAINT_FISHING, SWORD_SAINT_GIANT, SWORD_SAINT_MELEE, SWORD_SAINT_STORM, SWORD_SAINT_SWORDS } from '../src/game/swordsaint.ts'

// He starts with a full set of floating swords and looses them one at a time; they home in and spare allies.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  const target = battle.spawn(500, 560, 'blue', 'goose')!
  const ally = battle.spawn(400, 440, 'red', 'goose')!
  target.hp = ally.hp = 1000
  target.stun = ally.stun = 100
  battle.step()
  assert.equal(battle.shuriken.filter((p) => p.kind === 'sword').length, 1, 'Only one sword launches per attack')
  assert.equal(Math.floor(saint.swordStack), SWORD_SAINT_SWORDS.max - 1)
  let ticks = 1
  while (target.hp > 1000 - SWORD_SAINT.damage * 3 && ticks < 600) { battle.step(); ticks++ }
  assert.equal(target.hp, 1000 - SWORD_SAINT.damage * 3, 'Homing swords land')
  assert.ok(ticks >= 2 * SWORD_SAINT.cooldown * 60, 'Swords are spaced by the attack cooldown')
  assert.equal(ally.hp, 1000, 'Swords pass allies')
}

// Sword Storm: a roll past the giant-sword chance launches every floating sword at once, then goes on cooldown.
{
  const battle = new Battle(() => SWORD_SAINT_GIANT.chance + 0.01)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  const target = battle.spawn(500, 560, 'blue', 'goose')!
  target.hp = 1000
  target.stun = 100
  battle.step()
  assert.equal(battle.shuriken.filter((p) => p.kind === 'sword').length, SWORD_SAINT_SWORDS.max, 'Storm launches every sword')
  assert.ok(saint.swordStack < 1)
  assert.ok(saint.skillCooldown > SWORD_SAINT_STORM.cooldown - 0.1, 'Storm starts its cooldown')
}

// Close combat: leap off, every sword flies out, blink behind the enemy, swords return, remount after the kill.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  const target = battle.spawn(340, 500, 'blue', 'goose')!
  target.hp = 5000 // survives until the swords are back
  target.stun = 100
  battle.step()
  assert.equal(saint.saint?.phase, 'flip', 'A close enemy makes him backflip off his sword')
  const api = battle as unknown as { hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean }
  assert.equal(api.hit(saint, 50, 0, 0, target), false)
  assert.equal(saint.hp, SWORD_SAINT.hp, 'He is immune while backflipping')
  assert.equal(battle.shuriken.filter((p) => p.comeback).length, SWORD_SAINT_SWORDS.max, 'Every floating sword flies out')
  assert.equal(battle.shuriken.filter((p) => p.ride).length, 1, 'So does the sword he rides')
  for (let i = 0; i < 40 && saint.saint?.phase === 'flip'; i++) battle.step()
  assert.equal(saint.saint?.phase, 'melee')
  assert.ok(saint.x > target.x, 'The sonic slash blinks him behind the enemy')
  assert.equal(battle.shuriken.filter((p) => p.ride).length, 0, 'He catches his ridden sword')
  for (let i = 0; i < 300 && saint.swordStack < SWORD_SAINT_SWORDS.max; i++) battle.step()
  assert.equal(Math.floor(saint.swordStack), SWORD_SAINT_SWORDS.max, 'Thrown swords return to fight beside him')
  let sawFinisher = false
  for (let i = 0; i < 180 && !(sawFinisher && saint.saint?.combo === 0); i++) {
    battle.step()
    if (saint.saint?.combo === SWORD_SAINT_MELEE.combo) sawFinisher = true
  }
  assert.ok(sawFinisher && saint.saint?.combo === 0, 'Five quick slashes end in a dash')
  target.hp = 1
  for (let i = 0; i < 120 && saint.saint?.phase === 'melee'; i++) battle.step()
  assert.equal(target.hp <= 0, true)
  assert.equal(saint.saint?.phase, 'mount', 'He backflips back onto his sword once the enemy falls')
  for (let i = 0; i < 60 && saint.saint; i++) battle.step()
  assert.equal(saint.saint, null)
}

// On foot, a sword standing guard deflects a whole hit.
{
  const battle = new Battle(() => 0.01)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  const enemy = battle.spawn(900, 500, 'blue', 'goose')!
  saint.saint = { phase: 'melee', time: 0, target: enemy, trail: null, combo: 0, helpers: [{ k: 0, guard: true }] }
  const api = battle as unknown as { hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean }
  assert.equal(api.hit(saint, 20, 0, 0, enemy), false)
  assert.equal(saint.hp, SWORD_SAINT.hp, 'Deflected hits deal no damage')
}

// With no enemy: meditate to heal, then fly to water and fish.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  saint.hp = 100
  battle.step()
  assert.equal(saint.saintRest?.kind, 'meditate', 'A hurt saint meditates')
  assert.ok(saint.hp > 100, 'Meditation heals')
  saint.hp = SWORD_SAINT.hp
  battle.water.paint(600, 500)
  for (let i = 0; i < 420; i++) battle.step()
  assert.equal(saint.saintRest?.kind, 'fish', 'At full health he goes fishing')
  assert.ok(Math.hypot(saint.x - saint.saintRest!.x, saint.y - saint.saintRest!.y) < 12, 'He flies to the water')
  const enemy = battle.spawn(800, 500, 'blue', 'goose')!
  enemy.stun = 100
  battle.step()
  assert.equal(saint.saintRest?.kind, 'fish', 'He keeps fishing while an enemy is merely in sight')
}

// Giant sword: forms, charges, leaves a crater, knocks back and stuns; floating swords stay put.
{
  const battle = new Battle(() => 0.1)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  const target = battle.spawn(500, 500, 'blue', 'goose')!
  target.hp = 1000
  target.stun = 100
  battle.step()
  assert.equal(battle.giantSwords.length, 1, 'A low roll summons the giant sword')
  assert.equal(Math.floor(saint.swordStack), SWORD_SAINT_SWORDS.max, 'It does not use his floating swords')
  const x = target.x
  for (let i = 0; i < 120 && battle.giantSwords.length; i++) battle.step()
  assert.equal(battle.craters.length, 1, 'Impact leaves a crater')
  assert.equal(target.hp, 1000 - SWORD_SAINT_GIANT.damage)
  for (let i = 0; i < 10; i++) battle.step()
  assert.ok(target.x > x, 'The enemy is knocked away')
}

// Hit while fishing: he flings a fish into the attacker's face, blinding it.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  battle.water.paint(300, 500)
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(saint.saintRest?.kind, 'fish')
  const enemy = battle.spawn(600, 500, 'blue', 'goose')!
  const api = battle as unknown as { hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean }
  api.hit(saint, 5, 0, 0, enemy)
  assert.equal(battle.fishThrows.length, 1, 'He swings a fish at the attacker')
  assert.equal(saint.saintRest, null)
  for (let i = 0; i < 40 && battle.fishThrows.length; i++) battle.step()
  assert.ok(enemy.stun > SWORD_SAINT_FISHING.blind - 0.5, 'The fish blinds the attacker')
  assert.equal(battle.blinded.length, 1)
}

// A real attacker walking up to a fishing saint gets a fish in the face.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const saint = battle.spawn(300, 500, 'red', 'swordsaint')!
  battle.water.paint(300, 500)
  for (let i = 0; i < 60; i++) battle.step()
  const goose = battle.spawn(420, 500, 'blue', 'goose')!
  for (let i = 0; i < 240 && !battle.fishThrows.length && !battle.blinded.length; i++) battle.step()
  assert.ok(battle.fishThrows.length || battle.blinded.length, 'Attacking a fishing saint triggers the fish counter')
  assert.ok(goose.hp > 0)
}

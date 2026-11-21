// Run only with the owner's permission: node checks/kunlun.check.ts
import assert from 'node:assert/strict'
import { Battle, type Fighter } from '../src/game/battle.ts'
import { KUNLUN, KUNLUN_SKILLS as K } from '../src/game/kunlun.ts'

type Api = { hit(target: Fighter, damage: number, kx: number, ky: number, owner?: Fighter): boolean }

// A battle whose rolls all pass (roll 0) or all fail (roll 0.99), with Kunlun charged and only `ready` skills off cooldown.
function setup(roll: number, ready: (keyof Fighter['kunlunCd'])[], charged = true) {
  const battle = new Battle(() => roll)
  battle.resize(1600, 1000)
  const kunlun = battle.spawn(500, 500, 'red', 'kunlun')!
  kunlun.kunlunCharged = charged
  for (const key of Object.keys(kunlun.kunlunCd) as (keyof Fighter['kunlunCd'])[]) kunlun.kunlunCd[key] = ready.includes(key) ? 0 : 99
  return { battle, kunlun }
}

function dummy(battle: Battle, x: number, y = 500) {
  const target = battle.spawn(x, y, 'blue', 'goose')!
  target.hp = 1000
  target.stun = 100
  return target
}

const run = (battle: Battle, steps: number) => { for (let i = 0; i < steps; i++) battle.step() }

// Thunder Charge: once, before his first fight, and it never repeats.
{
  const { battle, kunlun } = setup(0.99, [], false)
  dummy(battle, 800)
  battle.step()
  assert.equal(kunlun.kunlun?.kind, 'charge', 'He raises his sword before fighting')
  run(battle, Math.ceil(K.charge.time * 60) + 2)
  assert.ok(kunlun.kunlunCharged, 'Lightning charges the sword')
  run(battle, 120)
  assert.notEqual(kunlun.kunlun?.kind, 'charge', 'The charge happens once')
}

// The charged blade zaps on plain hits.
{
  const { battle } = setup(0.99, [])
  const target = dummy(battle, 530)
  run(battle, 3)
  assert.equal(target.hp, 1000 - KUNLUN.damage - K.charge.damage, 'A plain hit plus the zap')
}

// Heaven Strike lands instantly on a far target.
{
  const { battle } = setup(0, ['strike'])
  const target = dummy(battle, 850)
  battle.step()
  assert.equal(target.hp, 1000 - K.strike.damage, 'Lightning strikes with no warning')
}

// Crescent Slash flies out and knocks the target away.
{
  const { battle } = setup(0, ['crescent'])
  const target = dummy(battle, 590)
  const x = target.x
  run(battle, 20)
  assert.equal(target.hp, 1000 - K.crescent.damage, 'The crescent hits once')
  assert.ok(target.x > x + 20, 'and knocks the target away')
}

// Thunder Dive: immune mid-flip, then the slam hits and knocks up.
{
  const { battle, kunlun } = setup(0, ['dive'])
  const target = dummy(battle, 660)
  battle.step()
  assert.equal(kunlun.kunlun?.kind, 'dive', 'He dives at a target in range')
  assert.equal((battle as unknown as Api).hit(kunlun, 50, 0, 0, target), false, 'Out of reach mid-flip')
  for (let i = 0; i < 60 && kunlun.kunlun; i++) battle.step()
  assert.equal(target.hp, 1000 - K.dive.damage, 'The slam hits')
  assert.ok(target.knockup > 0 || target.elevation > 0, 'and knocks the target up')
}

// Spark Sway: a bolt at each of three enemies, the main (nearest) target taking the spares.
{
  const { battle } = setup(0, ['sparks'])
  const [high, main, low] = [dummy(battle, 800, 400), dummy(battle, 800, 500), dummy(battle, 800, 600)]
  run(battle, 150)
  assert.equal(high.hp, 1000 - K.sparks.damage, 'Each other enemy takes one bolt')
  assert.equal(low.hp, 1000 - K.sparks.damage)
  assert.equal(main.hp, 1000 - (K.sparks.count - 2) * K.sparks.damage, 'The main target takes the rest')
}

// Storm Spin: a far target makes him spin up double speed, shedding afterimages as he runs.
{
  const { battle, kunlun } = setup(0.99, ['spin'])
  dummy(battle, 1000)
  run(battle, Math.ceil(K.spin.time * 60) + 2)
  assert.ok(kunlun.kunlunHaste > 0, 'Lightning speeds him up')
  run(battle, 10)
  assert.ok(battle.kunlunGhosts.length > 0, 'He leaves afterimages')
}

// Thunder Shield: hurt, he raises it, and enemy blows land at half strength while it lasts.
{
  const { battle, kunlun } = setup(0, ['shield'])
  const brawler = dummy(battle, 800)
  kunlun.hp = 500
  battle.step()
  assert.equal(kunlun.kunlun?.kind, 'shield', 'Hurt, he calls the shield')
  run(battle, Math.ceil(K.shield.time * 60) + 2)
  assert.ok(kunlun.kunlunShield > 0, 'The shield is up')
  const hp = kunlun.hp
  ;(battle as unknown as Api).hit(kunlun, 40, 0, 0, brawler)
  assert.equal(kunlun.hp, hp - 40 * (1 - K.shield.reduce), 'Damage is cut')
}

// Lightning Step: untouchable while circling, then the slice and four strikes.
{
  const { battle, kunlun } = setup(0, ['step'])
  const target = dummy(battle, 600)
  battle.step()
  assert.equal(kunlun.kunlun?.kind, 'step', 'He steps around a close target')
  run(battle, 20)
  assert.equal((battle as unknown as Api).hit(kunlun, 50, 0, 0, target), false, 'Too fast to hit while circling')
  for (let i = 0; i < 200 && kunlun.kunlun; i++) battle.step()
  assert.equal(target.hp, 1000 - K.step.slashDamage - K.step.strikes * K.step.strikeDamage, 'The slice, then four strikes')
}

// Lightning Clones: three weak clones, nearby enemies dazed, and they fade after their time.
{
  const { battle, kunlun } = setup(0, ['clone'])
  const target = dummy(battle, 650) // inside the daze radius wherever he reappears
  target.hp = 100000
  battle.step()
  assert.equal(kunlun.kunlun?.kind, 'clone', 'He calls his clones')
  run(battle, Math.ceil(K.clone.time * 60) + 2)
  const clones = battle.fighters.filter((f) => f.kunlunOwner === kunlun)
  assert.equal(clones.length, K.clone.count, 'Three clones appear')
  assert.equal(battle.kunlunDazed.length, 1, 'The enemy nearby is dazed')
  const hp = target.hp
  ;(battle as unknown as Api).hit(target, 40, 0, 0, clones[0])
  assert.equal(target.hp, hp - 40 * K.clone.power, 'A clone hits weakly')
  run(battle, Math.ceil(K.clone.life * 60) + 5)
  assert.equal(battle.fighters.filter((f) => f.kunlunOwner === kunlun).length, 0, 'The clones fade')
  assert.equal(battle.splats.length, 0, 'leaving no bodies')
}

// Lightning Walls: a ranged hit raises them; they stop a shuriken and turn Thor's hammer back.
{
  const { battle, kunlun } = setup(0.99, ['wall'])
  const archer = dummy(battle, 800)
  ;(battle as unknown as Api).hit(kunlun, 1, 0, 0, archer)
  battle.step()
  assert.equal(battle.kunlunWalls.length, 1, 'He raises the walls toward the shooter')
  const hp = kunlun.hp
  battle.shuriken.push({ kind: 'shuriken', owner: archer, x: 600, y: 500, vx: -400, vy: 0, elevation: 10, vz: 0, life: 2 })
  run(battle, 30)
  assert.equal(battle.shuriken.length, 0, 'The shuriken fizzles on the wall')
  assert.equal(kunlun.hp, hp, 'and never reaches him')
  const thor = battle.spawn(800, 560, 'blue', 'thor')!
  thor.stun = 100
  battle.hammers.push({ owner: thor, x: 600, y: 500, vx: -500, vy: 0, remaining: 400, returning: false, age: 0, homeTime: 2, hits: new Set() })
  run(battle, 15)
  assert.ok(battle.hammers.length === 0 || battle.hammers[0].returning, 'The hammer is turned back to Thor')
}

console.log('kunlun checks passed')

// Run only with the owner's permission: node checks/meiyuanzhi.check.ts
import assert from 'node:assert/strict'
import { Battle, type Fighter } from '../src/game/battle.ts'
import { MEI_BARRAGE, MEI_CLAW, MEI_ESCAPE, MEI_FOX, MEI_MINE, MEI_SHIELD, MEI_SPIRITS, MEI_STAR, MEI_TRANSFORM, MEI_YUANZHI } from '../src/game/meiyuanzhi.ts'

type Api = { hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean }

// Talisman bombs fly to the target and burst there.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  battle.spawn(300, 500, 'red', 'meiyuanzhi')
  const target = battle.spawn(480, 500, 'blue', 'goose')!
  target.hp = 1000
  target.stun = 100
  battle.step()
  assert.equal(battle.shuriken.filter((p) => p.kind === 'talisman').length, 1, 'He throws a talisman')
  for (let i = 0; i < 60 && target.hp === 1000; i++) battle.step()
  assert.equal(target.hp, 1000 - MEI_YUANZHI.damage, 'The talisman bursts on the target')
}

// Three close hits: backflip (immune), stun bomb, vanish, reappear at throwing range.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const mei = battle.spawn(800, 500, 'red', 'meiyuanzhi')!
  const brawler = battle.spawn(820, 500, 'blue', 'goose')!
  brawler.hp = 1000
  const api = battle as unknown as Api
  for (let i = 0; i < 3; i++) api.hit(mei, 1, 0, 0, brawler)
  battle.step()
  assert.equal(mei.mei?.kind, 'flip', 'Close pressure triggers the escape')
  assert.equal(api.hit(mei, 50, 0, 0, brawler), false, 'He is immune while flipping')
  for (let i = 0; i < 60 && mei.mei; i++) battle.step()
  assert.ok(brawler.stun > 0, 'The bomb stuns enemies around him')
  const d = Math.hypot(mei.x - brawler.x, mei.y - brawler.y)
  assert.ok(d > 100 && d < MEI_YUANZHI.range + 40, `He reappears at throwing range (${d.toFixed(0)} px)`)
  assert.ok(mei.skillCooldown > MEI_ESCAPE.cooldown - 0.1)
}

// Three ranged hits: shield soaks damage for its duration, then throws it back.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const mei = battle.spawn(300, 500, 'red', 'meiyuanzhi')!
  const archer = battle.spawn(480, 500, 'blue', 'goose')!
  archer.hp = 1000
  archer.stun = 100
  const api = battle as unknown as Api
  for (let i = 0; i < 3; i++) api.hit(mei, 1, 0, 0, archer)
  battle.step()
  assert.equal(mei.mei?.kind, 'shield', 'Ranged pressure raises the shield')
  const hp = mei.hp
  api.hit(mei, 80, 0, 0, archer)
  assert.equal(mei.hp, hp, 'The shield absorbs hits')
  for (let i = 0; i < MEI_SHIELD.time * 60 + 2 && mei.mei; i++) battle.step()
  assert.equal(battle.shuriken.find((p) => p.kind === 'talisman' && p.power)?.power, 80 * MEI_SHIELD.returnRate, 'It throws back what it absorbed, amplified')
}

// Flying Fox Talisman: a lucky throw becomes a fox head that stuns and burns, then waits out its cooldown.
{
  const battle = new Battle(() => 0)
  battle.resize(1600, 1000)
  const mei = battle.spawn(300, 500, 'red', 'meiyuanzhi')!
  const target = battle.spawn(480, 500, 'blue', 'goose')!
  target.hp = 1000
  target.stun = 100 // hold still so the goose cannot swoop away
  mei.meiBarrage = 100 // a zero roll would start a barrage first
  battle.step()
  assert.ok(battle.shuriken.some((p) => p.kind === 'talisman' && p.fox), 'He throws a fox talisman')
  assert.ok(mei.meiFox > MEI_FOX.cooldown - 0.1, 'The fox starts its cooldown')
  for (let i = 0; i < 60 && target.hp === 1000; i++) battle.step()
  assert.ok(target.burn > 0 && target.burnOwner === mei, 'The fox burns')
  const fresh = battle.spawn(900, 500, 'blue', 'goose')!
  const bystander = battle.spawn(950, 500, 'blue', 'goose')!
  const api = battle as unknown as { meiFoxBlast(owner: Fighter, x: number, y: number, elevation: number): void }
  api.meiFoxBlast(mei, fresh.x, fresh.y, 0)
  assert.equal(fresh.stun, MEI_FOX.stun, 'The fox stuns')
  assert.equal(bystander.stun, MEI_FOX.stun, 'The blast stuns everyone inside it')
}

// Talisman Barrage: a lucky attack lobs a whole volley of bombs around the target.
{
  const battle = new Battle(() => 0)
  battle.resize(1600, 1000)
  const mei = battle.spawn(300, 500, 'red', 'meiyuanzhi')!
  const target = battle.spawn(480, 500, 'blue', 'goose')!
  target.hp = 5000
  target.stun = 100
  battle.step()
  assert.equal(mei.mei?.kind, 'barrage', 'A zero roll starts the barrage')
  const seen = new Set<object>()
  for (let i = 0; i < MEI_BARRAGE.count * MEI_BARRAGE.interval * 60 + 2; i++) {
    battle.step()
    for (const p of battle.shuriken) seen.add(p)
  }
  assert.ok(seen.size >= MEI_BARRAGE.count - 1, `It throws a volley (${seen.size})`)
  assert.equal(mei.mei, null, 'The barrage ends')
}

// Hurt with no enemy around, he meditates and heals.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const mei = battle.spawn(300, 500, 'red', 'meiyuanzhi')!
  mei.hp = 100
  mei.meiForm = 2 // already transformed, so low health does not start the fox transformation
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(mei.saintRest?.kind, 'meditate', 'He sits to meditate')
  assert.ok(mei.hp > 100, 'Meditation heals')
}

// Nine-Tailed Fox: at 75% he rises immune and slams down in fox form, claws up close, and at 50% summons fox spirits.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const mei = battle.spawn(800, 500, 'red', 'meiyuanzhi')!
  const brawler = battle.spawn(830, 500, 'blue', 'goose')!
  brawler.hp = 1000
  const api = battle as unknown as Api
  mei.hp = MEI_YUANZHI.hp * MEI_TRANSFORM.health
  battle.step()
  assert.equal(mei.mei?.kind, 'transform', 'At 75% health he starts transforming')
  assert.equal(api.hit(mei, 50, 0, 0, brawler), false, 'He is immune while transforming')
  for (let i = 0; i < 120 && mei.mei; i++) battle.step()
  assert.equal(mei.meiForm, 1, 'He lands in fox form')
  assert.ok(brawler.hp <= 1000 - MEI_TRANSFORM.damage, 'The slam hits enemies nearby')
  const victim = battle.spawn(mei.x + 25, mei.y, 'blue', 'goose')!
  victim.hp = 1000
  victim.stun = 100
  for (let i = 0; i < 60 && victim.hp === 1000; i++) battle.step()
  assert.equal(victim.hp, 1000 - MEI_CLAW.damage, 'Up close he claws instead of throwing')
  mei.hp = MEI_YUANZHI.hp * MEI_SPIRITS.health
  battle.step()
  assert.equal(mei.meiForm, 2)
  assert.equal(battle.fighters.filter((f) => f.species === 'mei-fox' && f.team === 'red').length, MEI_SPIRITS.count,
    'At 50% health three fox spirits appear')
}

// Talisman Mine: a lucky throw sticks a bomb on the ground; an enemy stepping on it is hurt and sent flying.
{
  let roll = 0.27 // no barrage (0.25), but a mine (0.3)
  const battle = new Battle(() => roll)
  battle.resize(1600, 1000)
  const mei = battle.spawn(300, 500, 'red', 'meiyuanzhi')!
  const target = battle.spawn(500, 500, 'blue', 'goose')!
  target.hp = 1000
  target.stun = 100
  for (let i = 0; i < 60 && battle.mines.length === 0; i++) battle.step()
  assert.equal(battle.mines.length, 1, 'He sticks a talisman mine on the ground')
  roll = 0.99
  mei.cooldown = 100 // no more throws to push the walker around
  const mine = battle.mines[0]
  const walker = battle.spawn(mine.x, mine.y, 'blue', 'goose')!
  walker.hp = 1000
  walker.stun = 100
  for (let i = 0; i < 60 && !walker.thrown; i++) battle.step()
  assert.ok(walker.thrown, 'Stepping on the armed mine sends the enemy flying')
  assert.equal(walker.hp, 1000 - MEI_MINE.damage, 'The mine blast hurts')
  assert.equal(battle.mines.length, 0, 'The mine is used up')
}

// Star Dash: with his spirits out he dashes a star round the target, immune, then blows up its centre.
{
  const battle = new Battle(() => 0)
  battle.resize(1600, 1000)
  const mei = battle.spawn(500, 500, 'red', 'meiyuanzhi')!
  mei.meiForm = 2
  const target = battle.spawn(750, 500, 'blue', 'goose')!
  target.hp = 1000
  target.stun = 100
  const api = battle as unknown as Api
  for (let i = 0; i < 60 && mei.mei?.kind !== 'star'; i++) battle.step()
  assert.equal(mei.mei?.kind, 'star', 'With his spirits out he starts a star dash')
  assert.equal(api.hit(mei, 50, 0, 0, target), false, 'He is immune while dashing')
  for (let i = 0; i < 120 && mei.mei; i++) battle.step()
  assert.ok(target.hp <= 1000 - MEI_STAR.damage, 'The star centre explodes on the target')
  assert.ok(target.burn > 0, 'The blast sets it burning')
}

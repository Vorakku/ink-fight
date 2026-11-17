import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import { THOR } from '../src/game/thor.ts'

// Run only with the owner's permission. Catch early healing and missing repeat/cap behavior.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 900)
  const thor = battle.spawn(300, 400, 'red', 'thor')!
  thor.hp = 300
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(thor.saintRest?.kind, 'meditate')
  assert.equal(thor.hp, 300, 'Thor must finish charging before lightning heals him')
  assert.equal(thor.x, 300)
  assert.equal(thor.y, 400)
  for (let i = 0; i < 61; i++) battle.step()
  assert.equal(thor.hp, 420, 'A completed self-strike restores 120 HP')
  assert.ok(battle.shots.some((shot) => shot.owner === thor && shot.healing), 'The strike has a visible lightning bolt')
  assert.equal(battle.storms.length, 0, 'Healing does not cast a damaging storm')
  for (let i = 0; i < 300; i++) battle.step()
  assert.equal(thor.hp, THOR.hp, 'Repeated lightning caps healing at full health')
  assert.equal(thor.saintRest, null, 'A fully healed Thor stops the ritual')
}

// A newly detected enemy cancels the pending heal and returns Thor to combat.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 900)
  const thor = battle.spawn(300, 400, 'red', 'thor')!
  thor.hp = 300
  for (let i = 0; i < 110; i++) battle.step()
  const enemy = battle.spawn(750, 400, 'blue', 'goose')!
  enemy.stun = 100
  for (let i = 0; i < 20; i++) battle.step()
  assert.equal(thor.hp, 300)
  assert.equal(thor.saintRest, null)
  assert.equal(thor.target, enemy)
  assert.ok(!battle.shots.some((shot) => shot.healing))
}

for (const effect of ['stun', 'frozen', 'fear', 'burn', 'bleed', 'hammerOut', 'zombie', 'death'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 900)
  const thor = battle.spawn(300, 400, 'red', 'thor')!
  thor.hp = 300
  for (let i = 0; i < 110; i++) battle.step()
  if (effect === 'death') thor.hp = 0
  else if (effect === 'hammerOut' || effect === 'zombie') thor[effect] = true
  else thor[effect] = 10
  for (let i = 0; i < 20; i++) battle.step()
  assert.ok(thor.hp <= 300, `${effect} prevents the pending heal`)
  assert.equal(thor.saintRest, null, `${effect} removes the meditation pose and shake`)
  assert.ok(!battle.shots.some((shot) => shot.healing))
}

// Perched Thor also heals when the battlefield is quiet, despite attack cooldowns.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 900)
  const thor = battle.spawn(300, 400, 'red', 'thor')!
  const tower = battle.placeTower(300, 400)!
  battle.step()
  assert.equal(thor.tower, tower)
  for (let i = 0; i < 60; i++) battle.step()
  thor.hp = 300
  thor.cooldown = thor.skillCooldown = 20
  for (let i = 0; i < 121; i++) battle.step()
  assert.equal(thor.hp, 420)
  assert.equal(thor.tower, tower)
  const enemy = battle.spawn(750, 400, 'blue', 'goose')!
  enemy.stun = 100
  battle.step()
  assert.equal(thor.saintRest, null, 'A tower detects threats even during attack cooldown')
}

for (const species of ['swordsaint', 'meiyuanzhi'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 900)
  const hero = battle.spawn(300, 400, 'red', species)!
  hero.hp = 100
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(hero.saintRest?.kind, 'meditate')
  assert.ok(hero.hp > 100, `${species} retains meditation healing`)
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1800, 900)
  const thor = battle.spawn(300, 400, 'red', 'thor')!
  thor.hp = 300
  battle.step()
  battle.clear()
  assert.equal(thor.saintRest, null, 'Clear removes an unfinished ritual')
  assert.equal(battle.shots.length, 0)
}

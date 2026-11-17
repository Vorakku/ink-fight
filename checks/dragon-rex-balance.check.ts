// Run only with the owner's permission: node checks/dragon-rex-balance.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, type Fighter } from '../src/game/battle.ts'
import { DRAGON_FORMS } from '../src/game/dragon.ts'
import { TREX, TREX_ALPHA, TREX_BLACK, TREX_FEED, TREX_RAM } from '../src/game/rex.ts'

// A golden dragon must seriously threaten every T-Rex form across seeds and spawn orders.
// Both sides keep their real AI and skills, including bloodlust helpers and the fire domain.
for (const form of ['normal', 'alpha', 'black'] as const) {
  for (const seed of [1, 7, 23]) for (const rexFirst of [false, true]) {
    let state = seed
    const battle = new Battle(() => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return state / 0x100000000
    })
    battle.resize(1800, 1100)
    let dragon: Fighter, rex: Fighter
    if (rexFirst) {
      rex = battle.spawn(900, 550, 'blue', 'rex')!
      dragon = battle.spawn(650, 550, 'red', 'dragon')!
    } else {
      dragon = battle.spawn(650, 550, 'red', 'dragon')!
      rex = battle.spawn(900, 550, 'blue', 'rex')!
    }
    dragon.dragonForm = 3
    dragon.dragonProgress = 150
    dragon.hp = DRAGON_FORMS[3].hp
    if (form !== 'normal') rex.rexMeals = rex.rexNutrition = TREX_ALPHA.meals
    if (form === 'black') rex.rexKills = TREX_BLACK.kills
    const startingHp = form === 'normal' ? TREX.hp : TREX_ALPHA.hp + rex.rexNutrition * TREX_FEED.health
    rex.hp = startingHp
    let lowestHp = rex.hp
    for (let tick = 0; tick < 45 / DT && rex.hp > 0 && dragon.hp > 0; tick++) {
      battle.step()
      lowestHp = Math.min(lowestHp, rex.hp)
    }
    assert.ok(lowestHp <= startingHp * 0.5,
      `Golden dragon must reach ${form} Tiny Arms' half-health threshold (seed ${seed}, rex first ${rexFirst}); lowest HP ${lowestHp}/${startingHp}`)
  }
}

// A larger dragon takes bite/ram damage but cannot be carried, pinned, or thrown.
// A smaller lightning dragon still uses the ordinary grab-and-throw path.
{
  const battle = new Battle(() => 0)
  battle.resize(1800, 1100)
  const rex = battle.spawn(600, 550, 'red', 'rex')!
  rex.rexKills = TREX_BLACK.kills
  rex.hp = TREX_ALPHA.hp
  const dragon = battle.spawn(645, 550, 'blue', 'dragon')!
  dragon.dragonForm = 3
  dragon.hp = DRAGON_FORMS[3].hp
  const actions = battle as unknown as {
    bite(owner: Fighter, target: Fighter): void
    stepRexRam(owner: Fighter): boolean
  }
  actions.bite(rex, dragon)
  assert.equal(dragon.hp, DRAGON_FORMS[3].hp - TREX_ALPHA.damage)
  assert.equal(dragon.heldBy, null)
  assert.equal(rex.grab, null)

  dragon.x = rex.x + 60
  const before = dragon.hp
  rex.rexRam = { phase: 'dash', time: 1, target: dragon, nx: 1, ny: 0 }
  actions.stepRexRam(rex)
  assert.equal(dragon.hp, before - TREX_RAM.damage)
  assert.equal(dragon.heldBy, null)
  assert.equal(rex.rexRam, null)
  assert.ok(dragon.vx > 0, 'A heavy target still feels the impact')

  const smaller = battle.spawn(rex.x + 40, rex.y, 'blue', 'dragon')!
  smaller.dragonForm = 2
  smaller.hp = DRAGON_FORMS[2].hp
  actions.bite(rex, smaller)
  assert.equal(smaller.heldBy, rex)
  assert.equal(rex.grab?.target, smaller)
}

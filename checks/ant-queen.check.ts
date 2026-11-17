// Run only with the owner's permission: node checks/ant-queen.check.ts
import assert from 'node:assert/strict'
import { Battle, MAX_FIGHTERS } from '../src/game/battle.ts'
import { COLONY_BUILD } from '../src/game/ant.ts'
import type { Team } from '../src/game/units.ts'

for (const team of ['red', 'ffa'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const queens = () => battle.fighters.filter((f) => f.species === 'ant-queen' && f.hp > 0)
  const ants = (side: Team) => battle.fighters.filter((f) => f.species === 'ant' && f.team === side).length
  const finish = (k: number) => {
    const hill = battle.spawn(150 + k % 4 * 300, 250 + Math.floor(k / 4) * 300, team, 'anthill')!
    hill.colony!.time = COLONY_BUILD
    hill.cooldown = 100
    battle.step()
    return hill
  }
  const homes = [finish(0), finish(1), finish(2)]
  assert.equal(queens().length, 0)
  homes.push(finish(3))
  assert.equal(queens().length, 1, 'Four completed hills earn one queen')
  assert.equal(queens()[0].inside, homes[3])
  assert.equal(queens()[0].entry, 1, 'The queen stays sheltered')
  homes[0].cooldown = 0
  battle.step()
  assert.equal(ants(team), 2, 'A living queen doubles allied brood')
  const enemy = battle.spawn(1250, 750, 'blue', 'anthill')!
  enemy.colony!.time = COLONY_BUILD
  battle.step()
  assert.equal(ants('blue'), 1, 'Enemy hills receive no bonus')

  for (let k = 4; k < 8; k++) homes.push(finish(k))
  assert.equal(queens().length, 2)
  const before = ants(team)
  homes[0].cooldown = 0
  battle.step()
  assert.equal(ants(team) - before, 2, 'Multiple queens do not stack')
  queens()[0].inside!.hp = 0
  battle.step()
  assert.equal(queens().length, 1)
  queens()[0].inside!.hp = 0
  battle.step()
  assert.equal(queens().length, 0, 'Losing both shelters kills both queens')
  const unboosted = ants(team)
  homes[0].cooldown = 0
  battle.step()
  assert.equal(ants(team) - unboosted, 1, 'Losing the last queen removes the bonus')
  assert.equal(queens().length, 0, 'Spent milestones do not replace dead queens')

  battle.clear()
  for (let k = 0; k < 4; k++) finish(k)
  assert.equal(queens().length, 1, 'Clear resets queen milestones')
}

// A full page defers a queen, and a partial brood retains its second hatchling.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1400, 900)
  const homes = Array.from({ length: 4 }, (_, k) => {
    const home = battle.spawn(150 + k * 300, 450, 'red', 'anthill')!
    home.colony!.time = COLONY_BUILD
    home.cooldown = 100
    return home
  })
  while (battle.fighters.length < MAX_FIGHTERS) {
    const ant = battle.spawn(700, 750, 'red', 'ant')!
    ant.stun = 100
  }
  battle.step()
  assert.equal(battle.fighters.some((f) => f.species === 'ant-queen'), false)
  battle.fighters.find((f) => f.species === 'ant')!.hp = 0
  battle.step()
  battle.step()
  assert.equal(battle.fighters.filter((f) => f.species === 'ant-queen').length, 1)
  battle.fighters.find((f) => f.species === 'ant')!.hp = 0
  battle.step()
  homes[0].cooldown = 0
  battle.step()
  assert.equal(homes[0].colony!.brood, 1, 'One available slot leaves one hatchling pending')
  battle.fighters.find((f) => f.species === 'ant')!.hp = 0
  battle.step()
  battle.step()
  assert.equal(homes[0].colony!.brood, 0, 'The pending hatchling uses the next free slot')
  assert.ok(homes[0].cooldown > 0)
}

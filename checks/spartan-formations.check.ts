// Run only with the owner's permission: node checks/spartan-formations.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, type Fighter } from '../src/game/battle.ts'
import { SPARTAN, SPARTAN_BASH, SPARTAN_FORMATION as F } from '../src/game/spartan.ts'
import { activeSpartanSlot, type SpartanFormation } from '../src/game/spartan-formations.ts'
import type { Team } from '../src/game/units.ts'

const scene = () => { const battle = new Battle(() => 0.99); battle.resize(1800, 1100); return battle }
const squad = (battle: Battle, count = 6, team: Team = 'red', x = 500) =>
  Array.from({ length: count }, (_, i) => battle.spawn(x + i % 3 * 28, 500 + Math.floor(i / 3) * 28, team, 'spartan')!)
const api = (battle: Battle) => battle as unknown as {
  hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter): boolean
  fireAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
  spartanAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
  turnZombie(fighter: Fighter, team: Team): void
}
const settle = (battle: Battle, group: SpartanFormation) => {
  for (const member of group.members) {
    const slot = group.slots.get(member)!
    member.x = slot.x; member.y = slot.y; member.vx = member.vy = 0
  }
  battle.step()
  assert.ok(group.formed)
}
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`)

// Six nearby allied Spartans form; five, mixed sides and unrelated species do not.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const battle = scene(), members = squad(battle, 5, team)
  battle.spawn(530, 530, team, 'thor')!.stun = 100
  battle.step()
  assert.equal(battle.spartanFormations.length, 0)
  members.push(battle.spawn(556, 528, team, 'spartan')!)
  battle.step()
  assert.equal(battle.spartanFormations.length, 1)
  assert.equal(battle.spartanFormations[0].kind, 'wall')
  assert.ok(members.every((f) => f.spartanFormation === battle.spartanFormations[0]))
}
{
  const battle = scene()
  squad(battle, 3, 'red'); squad(battle, 3, 'blue'); squad(battle, 3, 'ffa')
  battle.step()
  assert.equal(battle.spartanFormations.length, 0)
}

// Separate squads stay local; crowded armies split without leaving five stranded.
{
  const battle = scene()
  squad(battle, 6, 'red', 400); squad(battle, 6, 'red', 1100)
  battle.step()
  assert.equal(battle.spartanFormations.length, 2)
  const crowded = scene()
  squad(crowded, 13)
  crowded.step()
  assert.deepEqual(crowded.spartanFormations.map((g) => g.members.length).sort(), [6, 7])
}

// A front cluster uses two wall ranks. One isolated enemy opens a triangular wedge.
for (const count of [1, 4]) {
  const battle = scene()
  squad(battle)
  for (let i = 0; i < count; i++) battle.spawn(780, 490 + i * 12, 'blue', 'goose')!.stun = 100
  battle.step()
  const group = battle.spartanFormations[0]
  assert.equal(group.kind, count === 1 ? 'wedge' : 'wall')
  const roles = [...group.slots.values()].map((slot) => slot.role)
  assert.equal(roles.filter((role) => role === (count === 1 ? 'tip' : 'front')).length, count === 1 ? 1 : 3)
}

// Wounded squads, surrounding enemies and overwhelming numbers use the circle.
for (const reason of ['health', 'surrounded', 'outnumbered'] as const) {
  const battle = scene(), members = squad(battle)
  if (reason === 'health') for (const member of members) member.hp = SPARTAN.hp * 0.3
  else if (reason === 'surrounded') {
    for (const [x, y] of [[728, 514], [328, 514], [528, 314], [528, 714]]) {
      battle.spawn(x, y, 'blue', 'goose')!.stun = 100
    }
  } else for (let i = 0; i < 9; i++) battle.spawn(780, 470 + i * 10, 'blue', 'goose')!.stun = 100
  battle.step()
  assert.equal(battle.spartanFormations[0].kind, 'circle', reason)
}
{
  const battle = scene(), members = squad(battle)
  for (const member of members.slice(2)) member.hp = 12
  battle.step()
  const group = battle.spartanFormations[0]
  assert.equal(group.kind, 'circle')
  const centers = members.filter((f) => group.slots.get(f)?.role === 'center')
  assert.equal(centers.length, 2)
  assert.ok(centers.every((f) => f.hp === 12))
  assert.ok(members.slice(0, 2).every((f) => group.slots.get(f)?.role === 'guard'))
  assert.ok([...group.slots.values()].filter((p) => p.role === 'guard')
    .every((p) => (p.x - group.x) * p.nx + (p.y - group.y) * p.ny > 0))
}

// Tactical changes wait three simulation seconds instead of flickering each tick.
{
  const battle = scene(), members = squad(battle)
  battle.step()
  const group = battle.spartanFormations[0]
  for (const member of members) member.hp = 20
  battle.step()
  assert.equal(group.kind, 'wall')
  for (let tick = 0; tick < Math.ceil(F.hold / DT) + 2; tick++) battle.step()
  assert.equal(battle.spartanFormations[0], group)
  assert.equal(group.kind, 'circle')
}

// Fire threats widen every shape; slots remain inside a small battlefield.
{
  const battle = scene()
  squad(battle)
  battle.step()
  const group = battle.spartanFormations[0]
  const width = () => Math.max(...[...group.slots.values()].map((p) => p.y)) - Math.min(...[...group.slots.values()].map((p) => p.y))
  const compact = width()
  battle.spawn(780, group.y, 'blue', 'phoenix')!.stun = 100
  battle.step()
  assert.equal(group.spread, true)
  assert.ok(width() > compact * 1.5)
  battle.resize(360, 400)
  battle.step()
  for (const g of battle.spartanFormations) for (const slot of g.slots.values()) {
    assert.ok(Number.isFinite(slot.x) && Number.isFinite(slot.y))
    assert.ok(slot.x >= 0 && slot.x <= 360 && slot.y >= 0 && slot.y <= 400)
  }
}

// Only settled walls resist frontal direct hits; flanks, fire and burns bypass it.
{
  const battle = scene(), members = squad(battle)
  battle.step()
  const group = battle.spartanFormations[0]
  assert.equal(group.formed, false)
  assert.equal(activeSpartanSlot(members[0]), null)
  settle(battle, group)
  const target = members[0], slot = group.slots.get(target)!
  const attacker = battle.spawn(target.x + slot.nx * 80, target.y + slot.ny * 80, 'blue', 'goose')!
  attacker.hp = 10000; attacker.stun = 100
  api(battle).hit(target, 20, 0, 0, attacker)
  near(target.hp, SPARTAN.hp - 20 * (1 - F.wallArmor))
  attacker.x = target.x - slot.nx * 80; attacker.y = target.y - slot.ny * 80
  api(battle).hit(target, 20, 0, 0, attacker)
  near(target.hp, SPARTAN.hp - 20 * (1 - F.wallArmor) - 20)
  const fire = battle.spawn(target.x + 60, target.y, 'blue', 'dragon')!
  fire.stun = 100
  const before = target.hp
  api(battle).fireAttack(fire, target, -1, 0)
  near(target.hp, before - 5)
  const burned = target.hp
  battle.step()
  near(target.hp, burned - 9 * DT)
}

// Rear wall ranks reach through the front line and shield bashes are staggered.
{
  const battle = scene()
  squad(battle); battle.step()
  const group = battle.spartanFormations[0]
  settle(battle, group)
  const rear = group.members.find((f) => group.slots.get(f)?.role === 'rear')!
  const distant = battle.spawn(rear.x + 80, rear.y, 'blue', 'goose')!
  distant.hp = 200
  api(battle).spartanAttack(rear, distant, 1, 0)
  assert.equal(distant.hp, 200 - SPARTAN.damage)
  const front = group.members.filter((f) => group.slots.get(f)?.role === 'front')
  const enemies = front.slice(0, 2).map((f) => {
    const enemy = battle.spawn(f.x + 20, f.y, 'blue', 'goose')!
    enemy.hp = 200
    return enemy
  })
  api(battle).spartanAttack(front[0], enemies[0], 1, 0)
  api(battle).spartanAttack(front[1], enemies[1], 1, 0)
  assert.equal(enemies[0].hp, 200 - SPARTAN_BASH.damage)
  assert.equal(enemies[1].hp, 200 - SPARTAN.damage)
  assert.equal(front[1].skillCooldown, 0)
}

// A wedge actually assembles, advances and reaches shield-bash distance.
{
  const battle = scene()
  squad(battle)
  const enemy = battle.spawn(850, 514, 'blue', 'thor')!
  enemy.hp = 10000; enemy.stun = 100
  battle.step()
  const group = battle.spartanFormations[0]
  const x = group.x
  let bashed = false
  for (let tick = 0; tick < 600 && !bashed; tick++) {
    battle.step()
    bashed = group.members.some((f) => f.skillCooldown > SPARTAN_BASH.cooldown - DT * 2)
  }
  assert.ok(group.x > x + 100)
  assert.equal(bashed, true)
}

// Losing the sixth member breaks the formation immediately, including conversion.
for (const cause of ['death', 'conversion', 'clear'] as const) {
  const battle = scene(), members = squad(battle)
  battle.step()
  if (cause === 'death') {
    const enemy = battle.spawn(800, 500, 'blue', 'goose')!
    api(battle).hit(members[0], 10000, 0, 0, enemy)
  } else if (cause === 'conversion') api(battle).turnZombie(members[0], 'blue')
  else battle.clear()
  assert.ok(members.every((f) => f.spartanFormation === null))
  battle.step()
  assert.equal(battle.spartanFormations.length, 0)
}

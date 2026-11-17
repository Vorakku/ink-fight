// Run only with the owner's permission: node checks/spartan-charge.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, type Fighter } from '../src/game/battle.ts'
import { SPARTAN, SPARTAN_CHARGE as CHARGE, SPARTAN_COMMANDER } from '../src/game/spartan.ts'
import { spartanChargeAuraBounds } from '../src/game/spartan-formations.ts'

const scene = () => { const b = new Battle(() => 0.99); b.resize(1800, 1100); return b }
const squad = (b: Battle, count = 12, team: 'red' | 'blue' | 'ffa' = 'red') => Array.from({ length: count }, (_, i) =>
  b.spawn(500 + i % 4 * 28, 500 + Math.floor(i / 4) * 28, team, 'spartan')!)
const enemy = (b: Battle, x: number, y: number) => {
  const f = b.spawn(x, y, 'blue', 'goose')!
  f.hp = 10000; f.stun = 100
  return f
}
const kill = (members: Fighter[], keep: number) => {
  for (const f of members.slice(keep)) f.hp = 0
}
const readyDash = (b: Battle) => {
  const group = b.spartanFormations.find((g) => g.charge)!
  assert.ok(group?.charge)
  for (let i = 0; i < Math.ceil((CHARGE.windup + 5) / DT) && group.charge.phase !== 'dash'; i++) {
    for (const f of group.members) {
      const slot = group.slots.get(f)!
      f.x = slot.x; f.y = slot.y; f.vx = f.vy = 0
    }
    b.step()
  }
  assert.equal(group.charge.phase, 'dash')
  return group
}

// A ten-Spartan army waits above 40% and summons the dragon at exactly four survivors.
{
  const b = scene(), members = squad(b, 10)
  enemy(b, 1000, 514); b.step()
  kill(members, 5); b.step()
  assert.equal(b.spartanFormations.some((g) => g.charge), false)
  kill(members, 4); b.step()
  const group = b.spartanFormations[0]
  assert.ok(group.charge)
  assert.equal(group.members.length, 4)
  assert.equal(group.kind, 'arrow')
  assert.equal(members[0].hp, SPARTAN.hp)
  b.clear()
  assert.equal(b.spartanFormations.length, 0)
  assert.equal(b.spartanArmies.size, 0)
  assert.ok(members.every((f) => f.spartanFormation === null))
}

// Status effects are not casualties, and six -> one still permits a last stand.
{
  const b = scene(), members = squad(b, 6)
  enemy(b, 1000, 514); b.step()
  for (const f of members.slice(1)) f.frozen = 100
  b.step()
  assert.equal(b.spartanFormations.some((g) => g.charge), false)
  kill(members, 1); b.step()
  assert.ok(b.spartanFormations[0].charge)
}

// Health never triggers the last stand: only the number of surviving soldiers does.
{
  const b = scene(), members = squad(b, 10)
  enemy(b, 1000, 514)
  for (const f of members) f.hp = SPARTAN.hp * 0.1
  b.step()
  assert.equal(b.spartanFormations.some((g) => g.charge), false)
}

// Reinforcements belong to the original army total even after earlier casualties.
{
  const b = scene(), original = squad(b, 10)
  enemy(b, 1200, 500); b.step()
  kill(original, 6); b.step()
  assert.equal(b.spartanFormations.some((g) => g.charge), false)
  const recruits = squad(b, 10)
  kill(original, 0); kill(recruits, 8); b.step()
  assert.equal(b.spartanArmies.get('red')?.total, 20)
  const group = b.spartanFormations.find((g) => g.charge)!
  assert.ok(group)
  assert.equal(group.members.length, 8)
  assert.equal(group.charge?.total, 20)
}

// All survivors gather and ram naturally, even with individual fear, stun or freeze.
{
  const b = scene(), members = squad(b, 20)
  enemy(b, 1400, 600)
  for (const f of members.slice(4, 8)) { f.x += 650; f.y += 200 }
  b.step(); kill(members, 8)
  members.slice(0, 8).forEach((f, i) => {
    if (i % 3 === 0) f.fear = 100
    else if (i % 3 === 1) f.stun = 100
    else f.frozen = 100
  })
  let screams = 0
  b.onSpartanScream = () => { screams++ }
  b.step()
  const group = b.spartanFormations.find((g) => g.charge)!
  assert.ok(group)
  assert.equal(group.members.length, 8)
  for (let i = 0; i < Math.ceil((CHARGE.rally + CHARGE.windup + 1) / DT) && group.charge?.phase !== 'dash'; i++) b.step()
  assert.equal(group.charge?.phase, 'dash')
  assert.equal(screams, 1)
  const before = group.members.map((f) => ({ f, x: f.x, y: f.y }))
  for (let i = 0; i < 10; i++) b.step()
  assert.ok(before.every(({ f, x, y }) => (f.x - x) * group.nx + (f.y - y) * group.ny > 40))
}

// Enemy flight does not block summoning: the army aims at a direction, not a reachable victim.
{
  const b = scene(), members = squad(b, 10)
  enemy(b, 1300, 550).elevation = 100
  kill(members, 4); b.step()
  const group = b.spartanFormations.find((g) => g.charge)!
  assert.ok(group)
  assert.equal(group.members.length, 4)
  assert.ok(group.nx > 0.9)
}

// A late recruit joins the shared rally, and jostling one soldier cannot restart summoning.
{
  const b = scene(), members = squad(b, 10)
  enemy(b, 1300, 550); b.step(); kill(members, 4); b.step()
  const group = b.spartanFormations.find((g) => g.charge)!
  const recruit = b.spawn(1200, 800, 'red', 'spartan')!
  b.step()
  assert.ok(group.roster.includes(recruit))
  assert.equal(recruit.spartanFormation, group)
  for (let i = 0; i < Math.ceil((CHARGE.rally + CHARGE.windup + 1) / DT) && group.charge?.phase !== 'dash'; i++) {
    if (group.charge?.phase === 'windup') members[0].x -= 35
    b.step()
  }
  assert.equal(group.charge?.phase, 'dash')
  assert.ok(group.members.includes(recruit))
}

// Conversion counts as a loss, without giving a converted soldier the charge.
{
  const b = scene(), members = squad(b)
  enemy(b, 1000, 514); b.step()
  const convert = b as unknown as { turnZombie(fighter: Fighter, team: 'blue'): void }
  for (const f of members.slice(2)) convert.turnZombie(f, 'blue')
  b.step()
  const group = b.spartanFormations[0]
  assert.ok(group.charge)
  assert.deepEqual(group.members, members.slice(0, 2))
  assert.ok(members.slice(2).every((f) => !f.spartanFormation))
}

// A depleted squad waits for the army threshold; distant survivors then charge together.
{
  const b = scene(), first = squad(b)
  const second = squad(b)
  for (const f of second) { f.x += 650; f.y += 200 }
  enemy(b, 900, 500); b.step()
  assert.equal(b.spartanFormations.length, 2)
  kill(first, 2); b.step()
  assert.equal(b.spartanFormations.some((g) => g.charge), false)
  kill(second, 2); b.step()
  assert.equal(b.spartanFormations.filter((g) => g.charge).length, 1)
  const group = b.spartanFormations.find((g) => g.charge)!
  assert.equal(group.members.length, 4)
  assert.ok([...first.slice(0, 2), ...second.slice(0, 2)].every((f) => f.spartanFormation === group))
  assert.equal(group.charge?.phase, 'rally')
  readyDash(b)
}

// The aura's filled skull encloses full sprites, both while rallying and after assembly.
{
  const b = scene(), members = squad(b, 120)
  enemy(b, 1100, 650); b.step(); kill(members, 24); b.step()
  const group = b.spartanFormations.find((g) => g.charge)!
  assert.equal(group.members.length, 25)
  assert.ok(group.members[0].spartanCommander)
  const skull = () => {
    const aura = spartanChargeAuraBounds(group)
    for (const member of group.members) {
      const size = SPARTAN.size * (member.spartanCommander ? SPARTAN_COMMANDER.scale : 1)
      const slot = group.slots.get(member)!
      for (const point of [member, slot]) {
        for (const x of [-28, 28]) for (const y of [-30, 30]) {
          const dx = point.x + x * size - aura.x
          const dy = point.y - 16 * size + y * size - aura.y
          const forward = (dx * group.nx + dy * group.ny) / aura.scale
          const side = (-dx * group.ny + dy * group.nx) / aura.scale
          // The angular dragon skull encloses this full rectangle without a circular backing.
          assert.ok(Math.abs(forward) < 30 && Math.abs(side) < 26)
        }
      }
    }
    return aura.scale
  }
  const rallyScale = skull()
  const alone = spartanChargeAuraBounds({ ...group, members: [group.members[0]], slots: new Map() })
  assert.ok(rallyScale > alone.scale)
  readyDash(b); skull()
}

// Separate sides have separate army thresholds and separate shared charges.
{
  const b = scene(), red = squad(b), blue = squad(b, 12, 'blue')
  for (const f of blue) f.x += 600
  b.step()
  kill(red, 2); b.step()
  assert.equal(b.spartanFormations.filter((g) => g.charge).length, 1)
  assert.equal(b.spartanFormations.find((g) => g.charge)?.team, 'red')
  assert.equal(b.spartanFormations.find((g) => g.team === 'blue')?.charge, null)
}

// Aim toward the larger distant cluster, lock direction and never chase a mark.
{
  const b = scene(), members = squad(b)
  const near = enemy(b, 410, 510)
  for (let i = 0; i < 5; i++) enemy(b, 1100, 500 + i * 8)
  b.step(); kill(members, 2)
  members[0].spartanSpear = false; members[0].spartanMark = near
  b.step()
  const group = b.spartanFormations[0], nx = group.nx, ny = group.ny
  assert.ok(nx > 0.9)
  const origin = group.x
  const charged = readyDash(b)
  for (const f of b.fighters) if (f.team === 'blue') f.hp = 0
  for (let i = 0; i < 30; i++) b.step()
  assert.equal(charged.nx, nx); assert.equal(charged.ny, ny)
  assert.equal(charged.target, null)
  assert.ok(charged.x > origin + 100)
  for (let i = 0; i < 400; i++) b.step()
  assert.equal(charged.charge, null)
  assert.equal(charged.chargeUsed, true)
  b.step(); assert.equal(charged.charge, null)
}

// Crossing enemies takes one shared hit per charge; allies and flyers are spared.
{
  const b = scene(), members = squad(b)
  enemy(b, 1000, 514); b.step(); kill(members, 2); b.step()
  const group = readyDash(b), tip = group.members[0]
  const victim = enemy(b, tip.x + group.nx * 80, tip.y + group.ny * 80)
  const ally = b.spawn(victim.x, victim.y + 40, 'red', 'goose')!
  ally.stun = 100
  const allyHp = ally.hp
  const flying = enemy(b, victim.x, victim.y)
  flying.elevation = 100
  for (let i = 0; i < 40; i++) b.step()
  assert.equal(victim.hp, 10000 - CHARGE.damage)
  assert.ok(group.charge?.hits.has(victim))
  assert.equal(ally.hp, allyHp)
  assert.equal(flying.hp, 10000)
}

// Diagonal lanes stop at the first arena edge, including a resize during the dash.
{
  const b = scene(), members = squad(b)
  enemy(b, 1100, 900); b.step(); kill(members, 2); b.step()
  const group = readyDash(b)
  const survivors = [...group.members]
  assert.ok(group.nx > 0 && group.ny > 0)
  b.resize(900, 720)
  for (let i = 0; i < 300; i++) b.step()
  assert.equal(group.charge, null)
  for (const f of survivors) {
    assert.ok(f.x >= 0 && f.x <= b.width)
    assert.ok(f.y >= 0 && f.y <= b.height)
  }
}

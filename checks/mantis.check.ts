// Run only with the owner's permission: node checks/mantis.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, type Fighter } from '../src/game/battle.ts'
import { MANTIS, MANTIS_DUEL, MANTIS_DODGE, MANTIS_GUARD, MANTIS_EVOLUTION, MANTIS_MOON_SLASH, type MantisDuel, type MantisForm } from '../src/game/mantis.ts'
import { CHARACTER_CATEGORIES, CHARACTERS, UNITS, type Species, type Team } from '../src/game/units.ts'

assert.ok(CHARACTERS.includes('mantis'))
assert.equal(CHARACTER_CATEGORIES.mantis, 'Bug')
const actions = (battle: Battle) => battle as unknown as {
  tryMantisDuel(owner: Fighter, target: Fighter): boolean
  stepMantisDuels(): void
  mantisRingPosition(duel: MantisDuel, fighter: Fighter, scale?: number): { x: number; y: number }
  mantisAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
  stepMantisDodge(fighter: Fighter): boolean
  stepMantisLeap(fighter: Fighter): boolean
  tryMantisHunt(fighter: Fighter, target: Fighter): boolean
  stepMantisCloak(fighter: Fighter): void
  tryMantisMoonSlash(fighter: Fighter, target: Fighter): boolean
  stepMantisMoonSlash(fighter: Fighter): boolean
  buildFighterGrid(): void
  steerMantisDuel(fighter: Fighter): boolean
  hit(target: Fighter, damage: number, kx: number, ky: number, owner: Fighter, shock?: number, dodgeable?: boolean): boolean
  turnZombie(fighter: Fighter, team: Team): void
}
const scene = (count = 4, team: Team = 'red', species: Species = 'goose') => {
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 1000)
  const members = Array.from({ length: count }, (_, i) =>
    battle.spawn(i === 0 ? 500 : 460 + i * 12, i === 0 ? 500 : 535, team, 'mantis')!)
  const target = battle.spawn(520, 500, team === 'ffa' ? 'ffa' : team === 'red' ? 'blue' : 'red', species)!
  target.hp = 1000
  return { battle, members, target, api: actions(battle) }
}
const begin = (battle: Battle, owner: Fighter, target: Fighter) => {
  assert.equal(actions(battle).tryMantisDuel(owner, target), true)
  return battle.mantisDuels[0]
}
const bow = (battle: Battle, duel: MantisDuel) => {
  const api = actions(battle)
  for (let i = 0; i < Math.ceil(MANTIS_DUEL.windup / DT) + Math.ceil(MANTIS_DUEL.hopTime / DT) + 2; i++) api.stepMantisDuels()
  assert.equal(duel.state, 'transport')
  assert.equal(duel.captive.heldBy, duel.carrier)
  duel.carrier.x = duel.x; duel.carrier.y = duel.y
  for (const member of duel.members) if (member !== duel.carrier) {
    const p = api.mantisRingPosition(duel, member)
    member.x = p.x; member.y = p.y
  }
  api.stepMantisDuels()
  assert.equal(duel.state, 'bow')
  assert.equal(duel.captive.heldBy, null)
  const position = api.mantisRingPosition(duel, duel.challenger!, 0.45)
  duel.challenger!.x = position.x; duel.challenger!.y = position.y
  for (let i = 0; i < Math.ceil(MANTIS_DUEL.bow / DT) + 1; i++) api.stepMantisDuels()
  assert.equal(duel.state, 'duel')
}

// A distant pickup visibly leaves the ground before taking hold of its guest.
{
  const { battle, members, target, api } = scene()
  target.x = members[0].x + 150
  const start = members[0].x
  const duel = begin(battle, members[0], target)
  for (let i = 0; i < Math.ceil(MANTIS_DUEL.windup / DT) + 5; i++) api.stepMantisDuels()
  assert.equal(duel.state, 'hop')
  assert.ok(members[0].elevation > 0)
  assert.ok(members[0].x > start)
  assert.equal(target.heldBy, null, 'Prey is picked up on landing')
  for (let i = 0; i < Math.ceil(MANTIS_DUEL.hopTime / DT) + 1; i++) api.stepMantisDuels()
  assert.equal(duel.state, 'transport')
  assert.equal(target.heldBy, members[0])
  assert.equal(members[0].elevation, 0)
}

// An unrelated crowd makes the carrier choose another club location.
{
  const { battle, members, target } = scene()
  const crowd = battle.spawn(540, 535, 'blue', 'spartan')!
  const duel = begin(battle, members[0], target)
  assert.ok(Math.hypot(duel.x - crowd.x, duel.y - crowd.y) > duel.radius + 32)
}

// A dodge avoids one direct hit, animates sideways, then has a vulnerable recovery.
{
  const { members, target, api } = scene(1)
  const mantis = members[0], x = mantis.x, y = mantis.y, hp = mantis.hp
  assert.equal(api.hit(mantis, 10, 0, 0, target, 0, true), false)
  assert.equal(mantis.hp, hp)
  assert.ok(mantis.mantisDodge)
  api.stepMantisDodge(mantis)
  assert.ok(mantis.elevation > 0)
  assert.equal(api.hit(mantis, 10, 0, 0, target, 0, true), true, 'A dodge does not give continuous invulnerability')
  assert.equal(mantis.hp, hp - 10)
  for (let i = 0; i < Math.ceil(MANTIS_DODGE.duration / DT) + 1; i++) api.stepMantisDodge(mantis)
  assert.equal(mantis.mantisDodge, null)
  assert.equal(mantis.elevation, 0)
  assert.ok(Math.hypot(mantis.x - x, mantis.y - y) >= MANTIS_DODGE.distance - 0.001)
  assert.ok(mantis.mantisDodgeCooldown > 0)
  assert.equal(api.hit(mantis, 10, 0, 0, target, 0, true), true)
}

// Stun blocks dodging, while area damage never triggers it in the first place.
for (const stunned of [true, false]) {
  const { members, target, api } = scene(1)
  const mantis = members[0]
  mantis.stun = stunned ? 1 : 0
  assert.equal(api.hit(mantis, 10, 0, 0, target, 0, stunned), true)
  assert.equal(mantis.mantisDodge, null)
}

// A lone mantis uses its own claw damage, rather than the goose's peck behavior.
{
  const { battle, members, target } = scene(1)
  target.stun = 100
  battle.step()
  assert.equal(target.hp, 1000 - MANTIS.damage)
  assert.equal(target.fear, 0)
  assert.equal(battle.mantisDuels.length, 0)
}

// Four allied mantises kidnap, carry, bow and duel; FFA groups cooperate too.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const { battle, members, target, api } = scene(4, team)
  const duel = begin(battle, members[0], target)
  assert.equal(duel.members.length, 4)
  assert.ok(duel.radius >= 150, 'Fight club has a much larger arena')
  assert.equal(target.retaliation, members[0], 'The captive rallies its allies for a rescue')
  bow(battle, duel)
  target.x = duel.x; target.y = duel.y
  const challenger = duel.challenger!
  challenger.x = target.x - 20; challenger.y = target.y
  const before = target.hp
  api.mantisAttack(challenger, target, 1, 0)
  assert.equal(target.hp, before - MANTIS.damage)
  const waiting = members.find((f) => f !== challenger)!
  waiting.x = target.x + 20; waiting.y = target.y
  api.mantisAttack(waiting, target, -1, 0)
  assert.equal(target.hp, before - MANTIS.damage, 'Waiting mantises never dogpile the guest')
  const outsider = battle.spawn(target.x + 20, target.y, team, 'mantis')!
  api.mantisAttack(outsider, target, -1, 0)
  assert.equal(api.hit(target, 10, 0, 0, outsider), false, 'Unrecruited mantises must also wait their turn')
  assert.equal(target.hp, before - MANTIS.damage)
  const waitingHp = waiting.hp
  assert.equal(api.hit(waiting, 10, 0, 0, target), false, 'The captive fights the one challenger, not the audience')
  assert.equal(waiting.hp, waitingHp)
  assert.equal(target.mantisDuel, duel, 'Opponent damage does not end the duel')
}

// Captive and challenger remain inside after fleeing, knockback or airborne movement.
{
  const { battle, members, target, api } = scene()
  const duel = begin(battle, members[0], target)
  bow(battle, duel)
  const challenger = duel.challenger!
  target.x = duel.x + duel.radius + 300; target.y = duel.y
  target.vx = 1500; target.elevation = 100; target.stun = 1
  challenger.x = duel.x - duel.radius - 200; challenger.y = duel.y
  challenger.vx = -1500; challenger.stun = 1
  battle.step()
  assert.equal(target.mantisDuel, duel, 'Crossing the boundary does not cancel the fight')
  assert.equal(challenger.mantisDuel, duel)
  for (const fighter of [target, challenger]) {
    assert.ok(Math.hypot(fighter.x - duel.x, fighter.y - duel.y) <= duel.radius - MANTIS_DUEL.wallPadding)
    const outward = (fighter.x - duel.x) * fighter.vx + (fighter.y - duel.y) * fighter.vy
    assert.ok(outward <= 0.00001, 'The boundary removes outward momentum')
  }
  assert.ok(target.elevation > 0, 'The boundary also applies above the ground')
  duel.age = MANTIS_DUEL.setupTimeout + 20
  api.stepMantisDuels()
  assert.equal(target.mantisDuel, duel, 'An active duel cannot be escaped by waiting for the setup timeout')
}

// Too few companions, allied prey, large enemies and structures cannot be kidnapped.
for (const blocked of ['three', 'ally', 'large', 'building', 'flying'] as const) {
  const { members, target, api } = scene(blocked === 'three' ? 3 : 4, 'red', blocked === 'large' ? 'rex' : blocked === 'building' ? 'anthill' : 'goose')
  if (blocked === 'ally') target.team = 'red'
  if (blocked === 'flying') target.elevation = 80
  assert.equal(api.tryMantisDuel(members[0], target), false)
}

// Only final Bug kills feed the mantis, increasing size, max health and damage.
{
  const { battle, members, target, api } = scene(1)
  const mantis = members[0]
  api.hit(target, 10000, 0, 0, mantis)
  assert.equal(mantis.mantisMeals, 0, 'Other species are not Bug meals')
  mantis.hp = 10
  const ant = battle.spawn(520, 500, 'blue', 'ant')!
  api.hit(ant, 100, 0, 0, mantis)
  assert.equal(mantis.mantisMeals, 1)
  assert.equal(mantis.hp, MANTIS.hp * 1.1)
  assert.equal(ant.mantisEaten, true)
  battle.step()
  assert.ok(battle.splats.every((splat) => splat.body !== ant && splat.meal?.victim !== ant))
  const next = battle.spawn(mantis.x + 18, mantis.y, 'blue', 'thor')!
  const before = next.hp
  api.mantisAttack(mantis, next, 1, 0)
  assert.equal(next.hp, before - MANTIS.damage * 1.1)
}

// A defeated challenger yields the floor to another mantis after a short handoff.
{
  const { battle, members, target, api } = scene()
  const duel = begin(battle, members[0], target)
  bow(battle, duel)
  const first = duel.challenger!
  api.hit(first, 1000, 0, 0, target)
  assert.equal(duel.state, 'handoff')
  for (let i = 0; i < Math.ceil(MANTIS_DUEL.handoff / DT) + 1; i++) api.stepMantisDuels()
  assert.equal(duel.state, 'bow')
  assert.ok(duel.challenger && duel.challenger !== first)
}

// Escorts stay with the carrier and drive off an approaching enemy during pickup.
{
  const { battle, members, target, api } = scene()
  const duel = begin(battle, members[0], target), guard = members[1]
  guard.x = duel.carrier.x + MANTIS_GUARD.escortRadius; guard.y = duel.carrier.y
  const intruder = battle.spawn(guard.x + 15, guard.y, 'blue', 'spartan')!
  intruder.target = duel.carrier
  api.buildFighterGrid()
  assert.equal(api.steerMantisDuel(guard), true)
  assert.equal(guard.target, intruder)
  assert.equal(intruder.hp, 240 - MANTIS.damage)
  assert.ok(intruder.vx > 0, 'The escort pushes the attacker away from its carrier')
  assert.equal(guard.mantisDuel, duel)
  duel.carrier.x += 80
  const escort = api.mantisRingPosition(duel, guard)
  assert.ok(Math.abs(Math.hypot(escort.x - duel.carrier.x, escort.y - duel.carrier.y) - MANTIS_GUARD.escortRadius) < 0.001)
}

// Guards repel intruders without joining the duel, abandoning the club or chasing forever.
{
  const { battle, members, target, api } = scene()
  const duel = begin(battle, members[0], target)
  bow(battle, duel)
  const challenger = duel.challenger!, guard = members.find((f) => f !== challenger)!
  guard.x = duel.x + duel.radius; guard.y = duel.y
  const intruder = battle.spawn(guard.x + 15, guard.y, 'blue', 'spartan')!
  intruder.target = target
  const hp = intruder.hp, captiveHp = target.hp
  api.buildFighterGrid()
  api.steerMantisDuel(guard)
  assert.equal(guard.target, intruder)
  assert.equal(intruder.hp, hp - MANTIS.damage)
  assert.ok(intruder.vx > 0)
  assert.ok(intruder.stun > 0)
  assert.equal(target.hp, captiveHp, 'The guard only fights outsiders')
  assert.equal(duel.challenger, challenger)
  api.hit(guard, 1, 0, 0, intruder)
  api.hit(target, 1, 0, 0, intruder)
  assert.equal(guard.mantisDuel, duel, 'Damage does not make a guard abandon its club')
  assert.equal(target.mantisDuel, duel, 'An outside hit does not instantly cancel the duel')
  guard.frozen = 1
  api.stepMantisDuels()
  api.steerMantisDuel(guard)
  assert.equal(guard.mantisDuel, duel, 'A frozen guard can resume defending after thawing')
  assert.equal(guard.target, null)
  guard.frozen = 0
  intruder.x = duel.x + duel.radius + MANTIS_GUARD.watch + 100
  api.buildFighterGrid()
  const home = api.mantisRingPosition(duel, guard)
  const before = Math.hypot(guard.x - home.x, guard.y - home.y)
  guard.vx = guard.vy = 0
  api.steerMantisDuel(guard)
  assert.equal(guard.target, null, 'Guards stop pursuing enemies outside their defensive area')
  assert.ok(Math.hypot(guard.x - home.x, guard.y - home.y) < before, 'The guard returns to its ring position')
  api.hit(guard, 1000, 0, 0, intruder)
  assert.equal(guard.mantisDuel, null, 'A defeated guard still leaves the club')
  assert.equal(duel.challenger, challenger)
  assert.equal(target.mantisDuel, duel)
}

// A dead guard recruits one existing ally without changing the active duel or teleporting it.
for (const team of ['red', 'blue', 'ffa'] as const) {
  const { battle, members, target, api } = scene(4, team)
  const duel = begin(battle, members[0], target)
  bow(battle, duel)
  const challenger = duel.challenger!, guard = members.find((f) => f !== challenger)!
  const reserve = battle.spawn(duel.x + duel.radius + 30, duel.y, team, 'mantis')!
  const extra = battle.spawn(duel.x + duel.radius + 60, duel.y, team, 'mantis')!
  const wrongTeam = battle.spawn(duel.x + duel.radius + 10, duel.y, team === 'red' ? 'blue' : 'red', 'mantis')!
  reserve.hp = 50
  const x = reserve.x, y = reserve.y
  api.hit(guard, 1000, 0, 0, wrongTeam)
  assert.equal(guard.mantisDuel, null)
  assert.equal(reserve.mantisDuel, duel)
  assert.equal(duel.members.length, 4)
  assert.equal(duel.guardVacancies, 0)
  assert.equal(extra.mantisDuel, null, 'One dead guard calls only one replacement')
  assert.equal(wrongTeam.mantisDuel, null, 'Only the club team can provide guards')
  assert.equal(reserve.hp, 50, 'Joining does not heal a replacement')
  assert.equal(reserve.x, x)
  assert.equal(reserve.y, y, 'The replacement must run to its post')
  assert.equal(duel.challenger, challenger)
  assert.equal(target.mantisDuel, duel)
}

// Unfilled guard vacancies wait for a suitable ally, then stop recruiting on Clear.
{
  const { battle, members, target, api } = scene()
  const duel = begin(battle, members[0], target)
  bow(battle, duel)
  const guard = members[1]
  const intruder = battle.spawn(duel.x + duel.radius + 250, duel.y, 'blue', 'thor')!
  api.hit(guard, 1000, 0, 0, intruder)
  assert.equal(duel.guardVacancies, 1)
  assert.equal(target.mantisDuel, duel)
  const reserve = battle.spawn(duel.x + duel.radius + 50, duel.y, 'red', 'mantis')!
  reserve.stun = 1
  for (let i = 0; i < Math.ceil(0.5 / DT) + 1; i++) api.stepMantisDuels()
  assert.equal(reserve.mantisDuel, null, 'A controlled Mantis cannot reinforce the club')
  reserve.stun = 0
  for (let i = 0; i < Math.ceil(0.5 / DT) + 1; i++) api.stepMantisDuels()
  assert.equal(reserve.mantisDuel, duel)
  assert.equal(duel.guardVacancies, 0)
  api.hit(members[2], 1000, 0, 0, intruder)
  assert.equal(duel.guardVacancies, 1)
  battle.clear()
  assert.equal(duel.guardVacancies, 0)
  assert.equal(reserve.mantisDuel, null)
  assert.equal(battle.mantisDuels.length, 0)
}

// Each threshold counts a final creature kill and sheds the matching old body part.
for (const [kills, form] of [[25, 1], [50, 2], [75, 3]] as const) {
  const { battle, members, target, api } = scene(1)
  const mantis = members[0]
  mantis.mantisKills = kills - 1
  mantis.mantisForm = (form - 1) as MantisForm
  api.hit(target, 10000, 0, 0, mantis)
  assert.equal(mantis.mantisKills, kills)
  assert.equal(mantis.mantisForm, form)
  assert.equal(mantis.mantisMeals, 0, 'Non-Bug kills evolve without granting meals')
  assert.equal(mantis.hp, MANTIS.hp, 'Evolution does not grant a free heal')
  assert.equal(battle.mantisMolts.length, 1)
  assert.equal(battle.mantisMolts[0].form, form)
  assert.equal(battle.mantisMolts[0].size, MANTIS.size, 'Kill evolutions do not add body size without meals')
  assert.ok(mantis.evolution > 0)
}

// Evolved blades reach prey that an ordinary mantis cannot strike.
{
  const { battle, members, target, api } = scene(1)
  const mantis = members[0]
  const distant = battle.spawn(mantis.x + 40, mantis.y, 'blue', 'goose')!
  distant.hp = 1000
  api.mantisAttack(mantis, distant, 1, 0)
  assert.equal(distant.hp, 1000)
  mantis.mantisKills = 24
  api.hit(target, 10000, 0, 0, mantis)
  api.mantisAttack(mantis, distant, 1, 0)
  assert.equal(distant.hp, 1000 - MANTIS.damage)
}

// Meals grow the body gradually to normal Dragon size at 75, with no overshoot from meals or evolution.
for (const [meals, progress] of [[0, 0], [25, 1 / 3], [50, 2 / 3], [75, 1], [150, 1]] as const) {
  const { battle, members, target, api } = scene(1)
  const mantis = members[0]
  mantis.mantisMeals = meals
  mantis.mantisKills = 24
  api.hit(target, 10000, 0, 0, mantis)
  const expected = MANTIS.size + (UNITS.dragon.size - MANTIS.size) * progress
  assert.ok(Math.abs(battle.mantisMolts[0].size - expected) < 0.000001)
  assert.ok(battle.mantisMolts[0].size <= UNITS.dragon.size)
  mantis.mantisKills = 74
  const next = battle.spawn(mantis.x + 20, mantis.y, 'blue', 'goose')!
  api.hit(next, 10000, 0, 0, mantis)
  assert.equal(mantis.mantisForm, 3)
  assert.ok(battle.mantisMolts.every((molt) => Math.abs(molt.size - expected) < 0.000001),
    'Sword, wing and skin evolutions keep the meal-based size')
}

// Buildings, allied victims, undead owners and a Phoenix rebirth are not evolution kills.
for (const excluded of ['building', 'ally', 'zombie', 'rebirth'] as const) {
  const { members, target, api } = scene(1, 'red', excluded === 'building' ? 'anthill' : excluded === 'rebirth' ? 'phoenix' : 'goose')
  if (excluded === 'ally') target.team = 'red'
  if (excluded === 'zombie') members[0].zombie = true
  api.hit(target, 10000, 0, 0, members[0])
  assert.equal(members[0].mantisKills, 0)
}

// Wing evolution immediately chains a kill into an airborne approach and landing strike.
{
  const { battle, members, target, api } = scene(1)
  const mantis = members[0], start = mantis.x
  mantis.mantisKills = 49; mantis.mantisForm = 1; mantis.cooldown = 5
  const next = battle.spawn(mantis.x + 200, mantis.y, 'blue', 'goose')!
  next.hp = 1000
  api.hit(target, 10000, 0, 0, mantis)
  assert.equal(mantis.mantisForm, 2)
  assert.equal(mantis.mantisLeap?.target, next)
  api.stepMantisLeap(mantis)
  assert.ok(mantis.elevation > 0)
  for (let i = 0; i < Math.ceil(MANTIS_EVOLUTION.leapTime / DT) + 1; i++) api.stepMantisLeap(mantis)
  assert.equal(mantis.elevation, 0)
  assert.equal(mantis.mantisLeap, null)
  assert.ok(mantis.x > start)
  assert.equal(next.hp, 1000 - MANTIS.damage)
  const another = battle.spawn(next.x + 100, next.y, 'blue', 'goose')!
  api.hit(next, 10000, 0, 0, mantis)
  assert.equal(mantis.mantisLeap?.target, another)
  mantis.stun = 1
  assert.equal(api.stepMantisLeap(mantis), false)
  assert.equal(mantis.mantisLeap, null)
  assert.equal(mantis.elevation, 0)
}

// Every newly detected prey triggers stealth, lasting through the approach without a timer or cooldown.
{
  const { battle, members, target, api } = scene(1)
  const mantis = members[0]
  mantis.mantisKills = 74; mantis.mantisForm = 2
  api.hit(target, 10000, 0, 0, mantis)
  const prey = battle.spawn(mantis.x + 200, mantis.y, 'blue', 'goose')!
  prey.hp = 1000
  assert.equal(api.tryMantisHunt(mantis, prey), true)
  prey.target = mantis
  battle.step()
  assert.ok(mantis.mantisCloak > 0)
  assert.notEqual(prey.target, mantis)
  assert.equal(mantis.mantisMoon, null, 'A ready Moon Slash does not interrupt the stealth approach')
  for (let i = 0; i < 240; i++) api.stepMantisCloak(mantis)
  assert.ok(mantis.mantisCloak > 0, 'Hunting invisibility does not expire during a long approach')
  api.hit(mantis, 1, 0, 0, prey)
  assert.equal(mantis.mantisCloak, 0)
  assert.equal(api.tryMantisHunt(mantis, prey), false, 'A revealed mantis does not blink invisible every combat frame')
  const nextPrey = battle.spawn(mantis.x + 180, mantis.y, 'blue', 'goose')!
  nextPrey.hp = 1000
  assert.equal(api.tryMantisHunt(mantis, nextPrey), true, 'New prey guarantees immediate stealth without waiting')
  nextPrey.x = mantis.x + 40
  api.mantisAttack(mantis, nextPrey, 1, 0)
  assert.equal(mantis.mantisCloak, 0)
  assert.equal(nextPrey.hp, 1000 - MANTIS.damage)
  api.turnZombie(mantis, 'blue')
  assert.equal(mantis.mantisLeap, null)
  assert.equal(api.tryMantisHunt(mantis, prey), false)
  battle.clear()
  assert.equal(mantis.mantisKills, 0)
  assert.equal(mantis.mantisForm, 0)
  assert.equal(mantis.mantisCloak, 0)
  assert.equal(mantis.mantisPrey, null)
  assert.equal(battle.mantisMolts.length, 0)
}

// Detecting prey cloaks the hunter before either side can choose an ordinary attack.
{
  const { battle, members, target } = scene(1)
  const mantis = members[0]
  mantis.mantisForm = 3
  target.x = mantis.x + 160
  battle.step()
  assert.equal(mantis.mantisPrey, target)
  assert.ok(mantis.mantisCloak > 0)
  assert.equal(mantis.mantisMoon, null)
  assert.notEqual(target.target, mantis)
}

// Moon Slash needs blade evolution, hits a broad area once, and respects teams and its cooldown.
{
  const { battle, members, target, api } = scene(1)
  const mantis = members[0]
  target.x = mantis.x + 140
  assert.equal(api.tryMantisMoonSlash(mantis, target), false)
  mantis.mantisForm = 1
  const side = battle.spawn(mantis.x + 80, mantis.y + 120, 'blue', 'goose')!
  const behind = battle.spawn(mantis.x - 100, mantis.y, 'blue', 'goose')!
  const far = battle.spawn(mantis.x + MANTIS_MOON_SLASH.radius + 40, mantis.y, 'blue', 'goose')!
  const ally = battle.spawn(mantis.x + 100, mantis.y, 'red', 'goose')!
  const ghost = battle.spawn(mantis.x + 60, mantis.y + 40, 'blue', 'mantis')!
  ghost.mantisForm = 3; ghost.mantisCloak = 1
  for (const fighter of [side, behind, far, ally]) fighter.hp = 1000
  assert.equal(api.tryMantisMoonSlash(mantis, target), true)
  api.stepMantisMoonSlash(mantis)
  assert.equal(target.hp, 1000, 'The windup does not deal damage early')
  for (let i = 0; i < Math.ceil(MANTIS_MOON_SLASH.windup / DT) + 1; i++) api.stepMantisMoonSlash(mantis)
  const damage = MANTIS.damage * MANTIS_MOON_SLASH.damageMultiplier
  assert.equal(target.hp, 1000 - damage)
  assert.equal(side.hp, 1000 - damage, 'The wide arc damages several enemies')
  assert.equal(ghost.hp, MANTIS.hp - damage, 'Invisible enemies can take collateral area damage')
  assert.equal(ghost.mantisCloak, 0)
  assert.equal(behind.hp, 1000)
  assert.equal(far.hp, 1000)
  assert.equal(ally.hp, 1000)
  assert.ok(target.vx > 0)
  assert.equal(mantis.mantisMoon, null)
  assert.equal(battle.mantisMoonSlashes.length, 1)
  mantis.cooldown = 0
  assert.equal(api.tryMantisMoonSlash(mantis, target), false, 'The skill cannot repeat during its own cooldown')
  api.stepMantisMoonSlash(mantis)
  assert.equal(target.hp, 1000 - damage, 'The visual tail never applies another hit')
}

// A guard can sweep intruders without hitting the captive; the duelist still fights only its opponent.
{
  const { battle, members, target, api } = scene()
  const duel = begin(battle, members[0], target)
  bow(battle, duel)
  const guard = members[1], challenger = duel.challenger!
  guard.mantisForm = challenger.mantisForm = 1
  guard.x = duel.x - 60; guard.y = duel.y
  const intruder = battle.spawn(duel.x + 80, duel.y, 'blue', 'goose')!
  intruder.hp = 1000
  assert.equal(api.tryMantisMoonSlash(guard, intruder), true)
  for (let i = 0; i < Math.ceil(MANTIS_MOON_SLASH.windup / DT) + 1; i++) api.stepMantisMoonSlash(guard)
  const damage = MANTIS.damage * MANTIS_MOON_SLASH.damageMultiplier
  assert.equal(intruder.hp, 1000 - damage)
  assert.equal(target.hp, 1000, 'The waiting guard never damages the captive')
  assert.equal(api.tryMantisMoonSlash(challenger, target), true)
  for (let i = 0; i < Math.ceil(MANTIS_MOON_SLASH.windup / DT) + 1; i++) api.stepMantisMoonSlash(challenger)
  assert.equal(target.hp, 1000 - damage)
  assert.equal(intruder.hp, 1000 - damage, 'The duelist cannot use the sweep to fight outsiders')
  assert.equal(target.mantisDuel, duel)
}

// Interrupted windups deal no damage or lingering crescent; Clear removes the skill state.
for (const interruption of ['stun', 'frozen', 'death', 'conversion', 'clear'] as const) {
  const { battle, members, target, api } = scene(1)
  const mantis = members[0]
  mantis.mantisForm = 1
  assert.equal(api.tryMantisMoonSlash(mantis, target), true)
  if (interruption === 'death') mantis.hp = 0
  else if (interruption === 'conversion') api.turnZombie(mantis, 'blue')
  else if (interruption === 'clear') battle.clear()
  else mantis[interruption] = 1
  const hpAfterInterruption = target.hp
  for (let i = 0; i < Math.ceil(MANTIS_MOON_SLASH.windup / DT) + 1; i++) api.stepMantisMoonSlash(mantis)
  assert.equal(mantis.mantisMoon, null)
  assert.equal(target.hp, hpAfterInterruption)
  assert.equal(battle.mantisMoonSlashes.length, 0)
  if (interruption === 'clear') assert.equal(mantis.mantisMoonCooldown, 0)
}

// Captive death, conversion, Clear and failed-setup timeouts release all participants.
for (const cause of ['death', 'conversion', 'clear', 'timeout'] as const) {
  const { battle, members, target, api } = scene()
  const duel = begin(battle, members[0], target)
  if (cause !== 'timeout') bow(battle, duel)
  if (cause === 'death') {
    const rescuer = battle.spawn(700, 500, 'blue', 'thor')!
    api.hit(target, 10000, 0, 0, rescuer)
  } else if (cause === 'conversion') api.turnZombie(target, 'red')
  else if (cause === 'clear') battle.clear()
  else { duel.age = MANTIS_DUEL.setupTimeout; api.stepMantisDuels() }
  assert.equal(battle.mantisDuels.length, 0)
  assert.equal(target.heldBy, null)
  assert.equal(target.mantisDuel, null)
  assert.ok(members.every((f) => f.mantisDuel === null && f.grab === null))
}

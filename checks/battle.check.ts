import assert from 'node:assert/strict'
import './phoenix.check.ts'
import './phoenix-evolution.check.ts'
import './dragon.check.ts'
import './siren-water.check.ts'
import './spartan.check.ts'
import './spartan-formations.check.ts'
import './spartan-spear.check.ts'
import './mantis.check.ts'
import './stun-visuals.check.ts'
import './swordsaint.check.ts'
import './kunlun.check.ts'
import { Battle, MAX_FIGHTERS } from '../src/game/battle.ts'
import { GOOSE } from '../src/game/goose.ts'
import { THOR_MELEE, THOR_SKILLS } from '../src/game/thor.ts'
import { TREX, TREX_GRAB, TREX_ROAR } from '../src/game/rex.ts'

// Roar chance, fear, alliances and detection. Run only with the owner's permission.
{
  const battle = new Battle(() => 0.1)
  battle.resize(1400, 800)
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  const front = battle.spawn(440, 400, 'blue')!
  const behind = battle.spawn(160, 400, 'blue')!
  const ally = battle.spawn(300, 440, 'red')!
  const distant = battle.spawn(510, 400, 'blue')!
  ally.stun = distant.stun = 100
  battle.step()
  assert.equal(rex.roar, TREX_ROAR.duration, 'A successful roll starts a roar')
  assert.equal(rex.skillCooldown, TREX_ROAR.cooldown)
  assert.ok(front.fear > 1.4 && behind.fear > 1.4, 'A roar frightens enemies on both sides')
  assert.equal(front.scaredBy, rex)
  assert.equal(behind.scaredBy, rex)
  assert.ok(front.x > 440 && behind.x < 160, 'Frightened enemies flee away from T-Rex')
  assert.equal(ally.fear, 0, 'The roar spares teammates')
  assert.equal(distant.fear, 0, 'Enemies beyond the roar radius stay calm')
  assert.equal(front.hp, GOOSE.hp, 'A roar does not deal bite damage')
  assert.equal(rex.grab, null, 'Roaring does not also grab an enemy')
}

{
  let rolls = 0
  const battle = new Battle(() => { rolls++; return 0.99 })
  battle.resize(1400, 800)
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  const target = battle.spawn(450, 400, 'blue')!
  target.stun = 100
  for (let i = 0; i < 30; i++) battle.step()
  assert.equal(rex.roar, 0, 'A failed chance roll does not roar')
  assert.equal(target.fear, 0)
  assert.equal(rolls, 1, 'Failed rolls are rate-limited instead of retried every frame')
  assert.ok(rex.x > 300, 'A failed roll keeps T-Rex pursuing its enemy')
}

for (const distance of [500, 550]) {
  const battle = new Battle(() => 0.99)
  battle.resize(1600, 800)
  const rex = battle.spawn(100, 400, 'red', 'rex')!
  const target = battle.spawn(100 + distance, 400, 'blue')!
  target.stun = 100
  battle.step()
  assert.equal(rex.target, distance <= TREX.detection ? target : null, 'Detection respects the expanded 520 px radius')
  assert.equal(rex.roar, 0, 'Spotting a distant enemy does not trigger an out-of-range roar')
}

for (const team of ['red', 'blue', 'ffa'] as const) {
  const battle = new Battle(() => 0.1)
  battle.resize(1400, 800)
  const rex = battle.spawn(300, 400, team, 'rex')!
  const ally = battle.spawn(250, 400, team, 'rex')!
  const enemy = battle.spawn(440, 400, team === 'red' ? 'blue' : team === 'blue' ? 'red' : 'ffa', 'goose')!
  ally.stun = 100
  battle.step()
  assert.ok(rex.roar > 0)
  assert.equal(ally.fear, 0, `${team} allied T-Rex stays calm`)
  assert.equal(enemy.scaredBy, rex, `${team} opposing species is scared`)
}

for (const interruption of ['stun', 'fear', 'death', 'clear'] as const) {
  const battle = new Battle(() => 0.1)
  battle.resize(1400, 800)
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  const target = battle.spawn(450, 400, 'blue')!
  target.stun = 100
  battle.step()
  assert.ok(rex.roar > 0)
  if (interruption === 'clear') battle.clear()
  else {
    if (interruption === 'death') rex.hp = 0
    else rex[interruption] = 1
    battle.step()
  }
  assert.equal(rex.roar, 0, `${interruption} removes the roaring pose`)
}

{
  const battle = new Battle(() => 0.1)
  battle.resize(1400, 800)
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  const target = battle.spawn(450, 400, 'blue')!
  target.stun = 100
  battle.step()
  for (let i = 0; i < 70; i++) battle.step()
  assert.equal(rex.roar, 0, 'The roar pose finishes')
  assert.ok(rex.skillCooldown > 3, 'The skill cooldown prevents an immediate second roar')
}

// T-Rex recovery checks. Written here for the next approved test run.
function rexScene(roll = 0.1) {
  const battle = new Battle(() => roll)
  battle.resize(1400, 800)
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  rex.skillCooldown = 100 // Isolate bites and grabs from the roar chance.
  rex.rexStompCooldown = 100
  const target = battle.spawn(323, 400, 'blue', 'goose')!
  target.hp = 500 // Survive the bite, shaking and landing so each phase is observable.
  target.stun = 100
  return { battle, rex, target }
}

{
  const { battle, rex, target } = rexScene(0.99)
  battle.step()
  assert.equal(target.hp, 500 - TREX.damage, 'A failed grab roll still bites')
  assert.equal(rex.grab, null)
  assert.equal(target.heldBy, null)
  assert.ok(target.vx > 0, 'A normal bite knocks its victim away')
}

{
  const { battle, rex, target } = rexScene()
  battle.step()
  assert.equal(target.hp, 500 - TREX.damage)
  assert.equal(rex.grab?.target, target, 'A successful bite grabs a smaller enemy')
  assert.equal(target.heldBy, rex)
  target.stun = 0
  for (let i = 0; i < 12; i++) battle.step()
  assert.ok(target.hp < 500 - TREX.damage, 'Shaking deals damage before the throw')
  assert.equal(rex.hp, TREX.hp, 'A held fighter cannot attack its captor')
  target.stun = 100
  rex.cooldown = 100
  for (let i = 0; i < 60 && rex.grab; i++) battle.step()
  assert.equal(rex.grab, null, 'The jaw releases after shaking')
  assert.equal(target.heldBy, null)
  assert.ok(target.thrown, 'The released victim enters a thrown flight')
  const flight = target.thrown!
  const landingX = target.x + target.vx * flight.time
  const landingY = target.y + target.vy * flight.time
  const ally = battle.spawn(landingX, landingY + 18, 'red')!
  const enemy = battle.spawn(landingX, landingY - 18, 'blue')!
  ally.stun = enemy.stun = 100
  enemy.hp = 500
  const beforeLanding = target.hp, startX = target.x
  for (let i = 0; i < 60 && target.thrown; i++) battle.step()
  assert.ok(target.x > startX + 100, 'The throw travels instead of teleporting')
  assert.equal(target.thrown, null, 'The thrown flight finishes')
  assert.equal(target.hp, beforeLanding - TREX_GRAB.landingDamage, 'Landing damages the victim once')
  assert.ok(target.dizzy > 0, 'The landed victim sees stars')
  assert.equal(ally.hp, GOOSE.hp, 'The landing spares the thrower\'s allies')
  assert.equal(enemy.hp, 500 - TREX_GRAB.landingDamage / 2, 'The landing bowls over nearby enemies')
  assert.ok(Math.hypot(enemy.vx, enemy.vy) > 0, 'Landing shoves nearby enemies')
}

{
  const battle = new Battle(() => 0)
  battle.resize(800, 600)
  const rex = battle.spawn(300, 300, 'red', 'rex')!
  rex.skillCooldown = 100
  rex.rexStompCooldown = 100
  const target = battle.spawn(329, 300, 'blue', 'rex')!
  target.stun = 100
  battle.step()
  assert.equal(target.hp, TREX.hp - TREX.damage, 'An equal-sized enemy can be bitten')
  assert.equal(rex.grab, null, 'An equal-sized enemy cannot fit in the jaw')
  assert.equal(target.heldBy, null)
}

for (const team of ['red', 'blue'] as const) {
  const battle = new Battle(() => 0)
  battle.resize(800, 600)
  const rex = battle.spawn(300, 300, team, 'rex')!
  const ally = battle.spawn(323, 300, team, 'goose')!
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(ally.hp, GOOSE.hp, 'T-Rex never bites or grabs a teammate')
  assert.equal(rex.hp, TREX.hp)
  assert.equal(rex.grab, null)
}

for (const dies of ['holder', 'victim'] as const) {
  const { battle, rex, target } = rexScene()
  battle.step()
  if (dies === 'holder') rex.hp = 0
  else target.hp = 0
  battle.step()
  assert.equal(rex.grab, null, `${dies} death frees the jaw`)
  assert.equal(target.heldBy, null, `${dies} death releases the victim`)
  assert.equal(target.thrown, null, 'Death cleanup does not launch a throw')
}

{
  const { battle, rex, target } = rexScene()
  battle.step()
  battle.clear()
  assert.equal(rex.grab, null, 'Clear frees held references')
  assert.equal(target.heldBy, null)
  assert.equal(battle.fighters.length, 0)
  const fresh = battle.spawn(300, 300, 'red', 'rex')!
  assert.equal(fresh.grab, null)
  assert.equal(fresh.thrown, null)
  assert.equal(fresh.dizzy, 0)
}

// A swoop must travel before hitting, strike once, and spare nearby allies.
{
  const battle = new Battle(() => 0.1)
  battle.resize(800, 600)
  const honk = battle.spawn(100, 300, 'red')!
  const target = battle.spawn(200, 300, 'blue', 'thor')!
  const ally = battle.spawn(200, 330, 'red')!
  target.stun = ally.stun = 100
  battle.step()
  assert.equal(honk.charge?.phase, 'flight', 'A successful chance roll starts a swoop')
  assert.equal(target.hp, 600, 'Takeoff causes no remote damage')
  target.x = 230
  let travelled = false
  for (let i = 0; i < 60 && honk.charge; i++) {
    battle.step()
    if (honk.x > 100) travelled = true
  }
  assert.ok(travelled, 'Honk flies toward the enemy')
  assert.equal(honk.charge, null, 'The swoop finishes')
  assert.equal(target.hp, 600 - GOOSE.damage, 'The swoop follows its target and lands one peck')
  assert.equal(ally.hp, 45, 'A swoop spares allies')
  assert.ok(target.fear > 0, 'A swooping peck can scare its victim')
  battle.step()
  assert.equal(target.hp, 600 - GOOSE.damage, 'Landing does not immediately deal a second peck')
  assert.equal(honk.charge, null, 'The skill cooldown prevents another immediate swoop')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  const honk = battle.spawn(100, 300, 'red')!
  const target = battle.spawn(200, 300, 'blue', 'thor')!
  target.stun = 100
  battle.step()
  assert.equal(honk.charge, null, 'A failed chance roll keeps Honk on foot')
  assert.ok(honk.x > 100, 'Honk keeps approaching after a failed roll')
  assert.equal(target.hp, 600, 'A failed swoop roll cannot damage a distant enemy')
}

for (const interruption of ['stun', 'fear', 'target death'] as const) {
  const battle = new Battle(() => 0.1)
  battle.resize(800, 600)
  const honk = battle.spawn(100, 300, 'red')!
  const target = battle.spawn(200, 300, 'blue', 'thor')!
  target.stun = 100
  battle.step()
  assert.ok(honk.charge, 'Honk takes off before the interruption')
  if (interruption === 'target death') target.hp = 0
  else honk[interruption] = 1
  battle.step()
  assert.equal(honk.charge, null, `${interruption} cancels a swoop`)
  assert.equal(target.hp, interruption === 'target death' ? 0 : 600, 'An interrupted swoop causes no damage')
}

// Run only with the owner's permission: npm run check.
{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  battle.spawn(100, 100, 'red')
  battle.spawn(120, 100, 'blue')
  battle.step()
  assert.ok(battle.fighters.some((goose) => goose.hp < GOOSE.hp), 'Opposing teams peck')
}

for (const team of ['red', 'blue', 'ffa'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  battle.spawn(100, 100, team)
  battle.spawn(100, 100, team)
  for (let i = 0; i < 120; i++) battle.step()
  assert.equal(battle.fighters.length, 2)
  assert.ok(battle.fighters.every((goose) => goose.hp === GOOSE.hp), `${team} allies never hurt one another`)
  assert.ok(Math.abs(battle.fighters[0].x - battle.fighters[1].x) > 0, 'Overlapping geese separate')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  battle.spawn(100, 100, 'red')
  battle.spawn(200, 100, 'ffa')
  battle.step()
  assert.ok(battle.fighters[0].x > 100 && battle.fighters[1].x < 200, 'Nearby enemies approach one another')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  battle.spawn(100, 100, 'red')
  battle.spawn(200, 100, 'blue')
  const scared = battle.fighters[0]
  scared.fear = 0.8
  scared.scaredBy = battle.fighters[1]
  battle.step()
  assert.ok(scared.x < 100, 'A scared goose flees the goose that pecked it')
  assert.equal(scared.attack, 0, 'A fleeing goose cannot attack')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  battle.spawn(100, 100, 'red')
  battle.spawn(120, 100, 'blue')
  battle.fighters[1].hp = GOOSE.damage
  battle.step()
  assert.equal(battle.fighters.length, 1, 'A lethal peck removes its victim')
  assert.equal(battle.splats.length, 1, 'Death leaves an ink splat')
  for (let i = 0; i < 301; i++) battle.step()
  assert.equal(battle.splats.length, 0, 'Ink splats fade away')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  for (let i = 0; i < MAX_FIGHTERS + 1; i++) battle.spawn(700, 500, 'red')
  assert.equal(battle.fighters.length, MAX_FIGHTERS, 'Placement respects the population cap')
  battle.resize(100, 80)
  assert.ok(battle.fighters.every((goose) => goose.x >= 0 && goose.x <= 100 && goose.y >= 0 && goose.y <= 80), 'Resize keeps geese on the page')
  battle.splats.push({ x: 30, y: 40, life: 5, color: '#9aa7b8', size: 1 })
  battle.clear()
  assert.equal(battle.fighters.length, 0, 'Clear removes every goose')
  assert.equal(battle.splats.length, 0, 'Clear removes every splat')
}


// Different species cooperate on a selected team, but oppose each other in FFA.
for (const team of ['red', 'blue'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  const goose = battle.spawn(100, 100, team, 'goose')!
  const thor = battle.spawn(120, 100, team, 'thor')!
  for (let i = 0; i < 120; i++) battle.step()
  assert.equal(goose.hp, GOOSE.hp)
  assert.equal(thor.hp, 600)
  assert.equal(battle.hammers.length, 0, 'Mixed allied species do not attack')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  battle.spawn(100, 100, 'ffa', 'thor')
  battle.spawn(200, 100, 'ffa', 'goose')
  battle.step()
  assert.equal(battle.hammers.length, 1, 'Different FFA species fight')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(800, 600)
  const thor = battle.spawn(100, 100, 'red', 'thor')!
  const target = battle.spawn(200, 100, 'blue', 'goose')!
  target.hp = 1000
  // Hold the target still to measure the two hammer passes independently of knockback.
  for (let i = 0; i < 120; i++) {
    target.x = 200; target.y = 100
    target.vx = target.vy = 0
    target.stun = 100
    battle.step()
    thor.cooldown = 100 // exactly one throw
    if (i === 0) {
      assert.equal(battle.hammers.length, 1)
      assert.ok(thor.hammerOut, 'Thor waits empty-handed')
    }
  }
  assert.ok(Math.abs(target.hp - (1000 - 26 * 2)) < 0.001,
    'The normal hammer hits once per pass without automatic lightning')
  assert.equal(battle.hammers.length, 0, 'The hammer is caught')
  assert.equal(thor.hammerOut, false, 'Thor has his hammer back')
}

for (const species of ['goose', 'thor'] as const) {
  const battle = new Battle(() => 0.99)
  battle.resize(2400, 1600)
  const fighter = battle.spawn(1200, 800, 'red', species)!
  assert.equal(fighter.hit, 0, 'Placement starts at normal size, including before Start')
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(fighter.x, 1200, 'The first wandering leg is a rest')
  assert.equal(fighter.y, 800)
  for (let i = 0; i < 120; i++) battle.step()
  assert.ok(Math.hypot(fighter.x - 1200, fighter.y - 800) > 5, `${species} wanders with no enemies`)
  assert.equal(fighter.hp, species === 'goose' ? GOOSE.hp : 600)
  assert.equal(fighter.hit, 0, 'Wandering does not change the hit-size effect')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(2400, 1600)
  const fighter = battle.spawn(100, 100, 'red')!
  const enemy = battle.spawn(2000, 100, 'blue')!
  battle.step()
  assert.equal(fighter.target, null, 'A distant enemy does not interrupt wandering')
  enemy.x = 200
  battle.step()
  assert.equal(fighter.target, enemy, 'A nearby enemy interrupts wandering')
  assert.ok(fighter.vx > 0, 'A spotted enemy is approached')
  enemy.x = 1500
  battle.step()
  assert.equal(fighter.target, enemy, 'An already spotted enemy can be chased beyond sight')
  assert.ok(fighter.vx > 0)
  enemy.hp = 0
  battle.step()
  assert.equal(fighter.target, null, 'A dead target is forgotten')
  battle.clear()
  assert.equal(battle.tick, 0, 'Clear restarts the wandering clock')
  assert.equal(battle.spawn(1200, 800, 'red')!.id, 0, 'Clear restarts wandering identities')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(2400, 1600)
  battle.spawn(1200, 800, 'red')
  const resting = battle.spawn(1500, 800, 'red', 'thor')!
  resting.stun = 1
  for (let i = 0; i < 30; i++) battle.step()
  assert.equal(resting.x, 1500, 'A stunned fighter cannot wander')
  assert.equal(resting.y, 800)
  resting.stun = 0
  resting.hammerOut = true
  for (let i = 0; i < 30; i++) battle.step()
  assert.equal(resting.x, 1500, 'Thor waits for his hammer instead of wandering')
  assert.equal(resting.y, 800)
}


function skillScene(roll: number) {
  const battle = new Battle(() => roll)
  battle.resize(1000, 800)
  const thor = battle.spawn(200, 400, 'red', 'thor')!
  const target = battle.spawn(350, 400, 'blue', 'goose')!
  const ally = battle.spawn(350, 450, 'red', 'goose')!
  target.hp = 500
  target.stun = ally.stun = 100
  return { battle, thor, target, ally }
}

{
  const { battle, thor, target, ally } = skillScene(0.1)
  ally.x = 275; ally.y = 400 // the shot must pass through its ally
  battle.step()
  assert.ok(thor.lightning, 'The first chance band charges a lightning shot')
  assert.equal(battle.shots.length, 0, 'No shot is released before charging')
  assert.equal(target.hp, 500, 'Charging causes no damage')
  assert.equal(battle.hammers.length, 0)
  assert.ok(thor.skillCooldown > 0)
  thor.cooldown = 100
  for (let i = 0; i < 30; i++) battle.step()
  assert.equal(target.hp, 500, 'The charge lasts longer than half a second')
  assert.equal(battle.shots.length, 0)
  for (let i = 0; i < 20; i++) battle.step()
  assert.equal(target.hp, 500 - THOR_SKILLS.shot.damage)
  assert.equal(ally.hp, GOOSE.hp, 'The lightning shot passes through allies')
  assert.equal(battle.shots.length, 1, 'The released strike remains visible briefly')
  assert.ok(Math.hypot(battle.shots[0].tx - battle.shots[0].x, battle.shots[0].ty - battle.shots[0].y) > 100,
    'The strike spans the firing line instead of appearing as a small spark')
  for (let i = 0; i < 20; i++) battle.step()
  assert.equal(battle.shots.length, 0, 'The strike fades away')
  assert.equal(target.hp, 500 - THOR_SKILLS.shot.damage, 'The lingering strike damages its victim only once')
}

for (const interruption of ['stun', 'fear', 'target death'] as const) {
  const { battle, thor, target } = skillScene(0.1)
  battle.step()
  if (interruption === 'stun') thor.stun = 1
  else if (interruption === 'fear') thor.fear = 1
  else target.hp = 0
  battle.step()
  assert.equal(thor.lightning, null, `${interruption} cancels the lightning charge`)
  assert.equal(battle.shots.length, 0, 'An interrupted charge produces no strike')
}

{
  const { battle, thor, target, ally } = skillScene(0.55)
  battle.step()
  assert.equal(battle.storms.length, 1, 'The second chance band marks an area')
  assert.equal(battle.storms[0].phase, 'warning')
  assert.equal(target.hp, 500, 'The warning does not deal damage')
  thor.cooldown = 100
  for (let i = 0; i < 50; i++) battle.step()
  assert.equal(target.hp, 500, 'Damage waits for the warning circle to finish')
  target.stun = 0
  for (let i = 0; i < 6; i++) battle.step()
  assert.equal(target.hp, 500 - THOR_SKILLS.storm.damage)
  assert.ok(target.stun > 1, 'The summoned strike stuns enemies')
  assert.equal(ally.hp, GOOSE.hp, 'The area strike spares allies inside its circle')
  for (let i = 0; i < 20; i++) battle.step()
  assert.equal(target.hp, 500 - THOR_SKILLS.storm.damage, 'The area hits only once')
}

{
  const { battle, thor, target } = skillScene(0.55)
  battle.step()
  const markedX = battle.storms[0].x
  target.x = 800
  thor.cooldown = 100
  for (let i = 0; i < 60; i++) battle.step()
  assert.equal(target.hp, 500, 'Leaving the warning circle avoids the strike')
  assert.equal(battle.storms[0].x, markedX, 'The warning stays on its original ground position')
}

{
  const { battle, thor, target, ally } = skillScene(0.8)
  battle.step()
  assert.equal(thor.charge?.phase, 'windup', 'The third chance band starts a charged flight')
  assert.equal(thor.x, 200, 'Thor charges before taking off')
  assert.equal(target.hp, 500)
  thor.cooldown = 100
  let flew = false
  for (let i = 0; i < 100 && thor.charge; i++) {
    battle.step()
    if (thor.charge?.phase === 'flight' && thor.x > 200) flew = true
  }
  assert.ok(flew, 'Thor travels toward the marked landing point')
  assert.equal(thor.charge, null)
  assert.equal(target.hp, 500 - THOR_SKILLS.charge.damage)
  assert.ok(Math.hypot(target.vx, target.vy) > 100, 'The landing knocks enemies away')
  assert.equal(ally.hp, GOOSE.hp, 'The landing spares allies')
  assert.equal(battle.impacts.length, 1, 'Landing leaves one shockwave')
  for (let i = 0; i < 20; i++) battle.step()
  assert.equal(target.hp, 500 - THOR_SKILLS.charge.damage, 'The slam hits once')
}

{
  const { battle, thor } = skillScene(0.8)
  battle.step()
  thor.stun = 1
  battle.step()
  assert.equal(thor.charge, null, 'Stun interrupts the charge')
  assert.equal(battle.impacts.length, 0, 'An interrupted charge causes no landing hit')
}

{
  const { battle, thor, target } = skillScene(0.8)
  battle.step()
  target.hp = 0
  battle.step()
  assert.equal(thor.charge, null, 'A target dying during the windup cancels the charge')
  assert.equal(battle.impacts.length, 0)
}

{
  const { battle, thor } = skillScene(0.1)
  battle.step()
  thor.cooldown = 0
  battle.step()
  assert.equal(battle.hammers.length, 0, 'Charging prevents other attacks even when the normal cooldown is ready')
  for (let i = 0; i < 60 && thor.lightning; i++) battle.step()
  assert.equal(thor.lightning, null)
  assert.equal(battle.shots.length, 1)
  thor.cooldown = 0
  battle.step()
  assert.equal(battle.hammers.length, 1, 'The shared skill cooldown falls back to the normal hammer')
  assert.equal(battle.shots.length, 1, 'No second skill is cast during the shared cooldown')
}

for (const roll of [0.1, 0.55, 0.8]) {
  const { battle, thor, target } = skillScene(roll)
  battle.step()
  thor.hp = 0
  battle.step()
  assert.equal(battle.shots.length, 0, 'Caster death removes travelling lightning')
  assert.equal(battle.storms.length, 0, 'Caster death cancels pending area strikes')
  assert.equal(battle.impacts.length, 0)
  assert.equal(target.hp, 500, 'Dead casters do not deliver pending skill damage')
}

{
  const { battle } = skillScene(0.55)
  battle.step()
  assert.equal(battle.storms.length, 1)
  battle.clear()
  assert.equal(battle.storms.length, 0)
  assert.equal(battle.shots.length, 0)
  assert.equal(battle.impacts.length, 0)
  assert.equal(battle.bolts.length, 0)
  assert.equal(battle.fighters.length, 0, 'Clear removes the caster and all pending skill effects')
  const fresh = battle.spawn(200, 400, 'red', 'thor')!
  assert.equal(fresh.skillCooldown, 0)
  assert.equal(fresh.charge, null)
  assert.equal(fresh.lightning, null)
}

{
  const battle = new Battle(() => 0.1)
  battle.resize(1000, 800)
  const thor = battle.spawn(200, 300, 'red', 'thor')!
  const front = battle.spawn(250, 300, 'blue')!
  const behind = battle.spawn(200, 360, 'blue')!
  const distant = battle.spawn(350, 300, 'blue')!
  const ally = battle.spawn(210, 345, 'red')!
  for (const target of [front, behind, distant]) { target.hp = 100; target.stun = 100 }
  ally.stun = 100
  battle.step()
  assert.equal(front.hp, 100 - THOR_MELEE.damage, 'A nearby enemy triggers the ground smash')
  assert.equal(behind.hp, 100 - THOR_MELEE.damage, 'The smash hits enemies around Thor')
  assert.equal(distant.hp, 100, 'Enemies outside the smash area are safe')
  assert.equal(ally.hp, GOOSE.hp, 'The smash spares allies')
  assert.ok(Math.hypot(front.vx, front.vy) > 100, 'The ground smash knocks enemies away')
  assert.equal(battle.impacts.length, 1, 'The smash shows a shockwave')
  assert.equal(thor.slam, 1)
  assert.equal(battle.hammers.length, 0, 'Thor does not throw at close range')
  assert.equal(thor.lightning, null, 'Close combat takes priority over ranged skills')
  assert.equal(thor.skillCooldown, 0, 'Melee does not consume the shared skill cooldown')
  for (let i = 0; i < 10; i++) battle.step()
  assert.equal(front.hp, 100 - THOR_MELEE.damage, 'The normal cooldown prevents repeated melee hits')
}

for (const lethalFirstHit of [false, true]) {
  const { battle, thor, target, ally } = skillScene(0.1)
  if (lethalFirstHit) target.hp = THOR_SKILLS.shot.damage
  const crowd = [[350, 500], [450, 500], [450, 600], [550, 600], [550, 700]].map(([x, y]) => {
    const enemy = battle.spawn(x, y, 'blue')!
    enemy.hp = 500
    enemy.stun = 100
    return enemy
  })
  battle.step()
  thor.cooldown = 100
  for (let i = 0; i < 60 && thor.lightning; i++) battle.step()
  assert.equal(target.hp, lethalFirstHit ? 0 : 500 - THOR_SKILLS.shot.damage)
  for (const enemy of crowd.slice(0, 4)) assert.equal(enemy.hp, 500 - THOR_SKILLS.shot.damage, 'Each chained enemy is struck once')
  assert.equal(crowd[4].hp, 500, 'The chain stops at five targets total')
  assert.equal(ally.hp, GOOSE.hp, 'Nearby allies are skipped by the chain')
  assert.equal(battle.shots.length, 5, 'Every chain hop has a visible lightning link')
}

{
  const { battle, thor, target, ally } = skillScene(0.1)
  const packed = [370, 390, 410, 430, 450].map((x) => {
    const enemy = battle.spawn(x, 400, 'blue')!
    enemy.hp = 500
    enemy.stun = 100
    return enemy
  })
  battle.step()
  thor.cooldown = 100
  for (let i = 0; i < 60 && thor.lightning; i++) battle.step()
  assert.equal(target.hp, 472, 'The initial lightning shot hits its target')
  for (const enemy of packed.slice(0, 4)) {
    assert.equal(enemy.hp, 472, 'The hammer shot chains through tightly grouped enemies')
  }
  assert.equal(packed[4].hp, 500, 'A packed group still respects the five-enemy limit')
  assert.equal(ally.hp, 45, 'The chain skips nearby allies')
  assert.equal(battle.shots.length, 5, 'Tightly grouped victims each have a visible lightning link')
}

{
  const { battle, thor } = skillScene(0.1)
  const distant = battle.spawn(350, 600, 'blue')!
  distant.hp = 500
  distant.stun = 100
  battle.step()
  thor.cooldown = 100
  for (let i = 0; i < 60 && thor.lightning; i++) battle.step()
  assert.equal(distant.hp, 500, 'Lightning cannot chain across a gap beyond its hop range')
  assert.equal(battle.shots.length, 1, 'The chain ends when no eligible next enemy is nearby')
}

console.log('Battle checks passed')

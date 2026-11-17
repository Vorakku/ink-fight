// Unrun. Run only with owner permission: node checks/bugs.check.ts
import assert from 'node:assert/strict'
import { BLUE, DT, MAX, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const t = UNITS.findIndex((u) => u.key === key)
  assert.ok(t >= 0, `missing ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(1200, 700); return s }
const advance = (s: Sim, ticks: number) => { for (let t = 0; t < ticks; t++) s.step() }

{ // Three full lives; temporary deaths are unreachable and leave no collectible corpse.
  const s = scene(), type = unit('cockroach'), roach = s.spawn(type, 300, 300, RED)
  s.spawn(unit('dungbeetle'), 900, 300, RED)
  const gen = s.generation[roach]
  for (let life = 1; life <= 2; life++) {
    s.damage(roach, 10000, 100, 0)
    assert.equal(s.stage[roach], 1)
    assert.equal(s.bugs.revivals[roach], life)
    assert.equal(s.canAct(roach), false)
    assert.equal(s.cAlive.some(Boolean), false)
    s.damage(roach, 10000, 0, 0)
    assert.equal(s.hp[roach], 1, 'playing dead is unreachable')
    advance(s, 179)
    assert.equal(s.stage[roach], 1, 'stays down for the full three seconds')
    advance(s, 2)
    assert.equal(s.stage[roach], 0)
    assert.equal(s.hp[roach], UNITS[type].hp)
    assert.equal(s.generation[roach], gen)
    assert.equal(s.counts[type], 1)
  }
  s.damage(roach, 10000, 0, 0)
  assert.equal(s.alive[roach], 0, 'the third death is final')
  assert.ok(s.cAlive.some(Boolean), 'only the final death leaves a body')
  const reused = s.spawn(type, 100, 300, RED)
  assert.equal(reused, roach)
  assert.equal(s.bugs.revivals[reused], 0, 'new occupant gets both revivals')
}

{ // Both ordinary explosions and Mozzie's overfull pop are harmless, including the shove.
  const s = scene(), roach = s.spawn(unit('cockroach'), 300, 300, BLUE)
  const pickle = s.spawn(unit('pickle'), 315, 300, RED)
  const hp = s.hp[roach]
  s.buildGrid()
  s.attack(pickle, roach, -1, 0)
  assert.equal(s.hp[roach], hp)
  assert.equal(s.vx[roach], 0)
  assert.equal(s.burnT[roach], 0)
  const mozzie = s.spawn(unit('mozzie'), 315, 300, RED)
  s.grow[mozzie] = UNITS[s.type[mozzie]].swell! - 1
  s.buildGrid()
  s.attack(mozzie, roach, -1, 0)
  assert.equal(s.hp[roach], hp - UNITS[s.type[mozzie]].dmg, 'the bite hurts, its explosion does not')
  assert.equal(s.vx[roach], -UNITS[s.type[mozzie]].knock, 'only the bite can shove it')
}

{ // A connected allied group shares one blink and reaches beyond a lone light's radius.
  const s = scene(), type = unit('firefly')
  const a = s.spawn(type, 300, 300, RED), b = s.spawn(type, 370, 300, RED)
  const victim = s.spawn(unit('goose'), 300, 375, BLUE)
  const friend = s.spawn(unit('goose'), 310, 375, RED)
  s.abilityCd[a] = s.abilityCd[b] = 0
  s.buildGrid(); s.bugs.step()
  assert.equal(s.pulseT[a], s.pulseT[b])
  assert.equal(s.abilityCd[a], 3)
  assert.equal(s.abilityCd[b], 3)
  assert.ok(s.bugs.flashR[a] > 75)
  assert.ok(s.blindT[victim] > 0)
  assert.equal(s.blindT[friend], 0)
  s.bugs.step()
  assert.equal(s.abilityCd[a], 3, 'no second flash while recharging')
  s.clear()
  const lone = s.spawn(type, 300, 300, RED)
  s.abilityCd[lone] = 0; s.buildGrid(); s.bugs.step()
  assert.equal(s.bugs.flashR[lone], 55)
}

{ // It passes the nearer little enemy, bites its host, and changes rides after a death.
  const s = scene(), flea = s.spawn(unit('flea'), 300, 300, RED)
  const little = s.spawn(unit('goose'), 325, 300, BLUE)
  const big = s.spawn(unit('giant'), 420, 300, BLUE)
  s.cd[little] = s.cd[big] = 100
  s.buildGrid()
  assert.equal(s.findTarget(flea), big)
  for (let t = 0; t < 90 && s.latchT[flea] <= 0; t++) s.step()
  assert.ok(s.latchT[flea] > 0)
  assert.equal(s.focus[flea], big)
  const hp = s.hp[big]
  advance(s, 35)
  assert.ok(s.hp[big] < hp, 'the passenger bites')
  const generation = s.generation[big]
  s.damage(big, 10000, 0, 0)
  const replacement = s.spawn(unit('goose'), s.x[flea] + 20, s.y[flea], BLUE)
  assert.equal(replacement, big)
  assert.notEqual(s.generation[replacement], generation)
  for (let t = 0; t < 120 && (s.focusGen[flea] === generation || s.latchT[flea] <= 0); t++) s.step()
  assert.ok(s.latchT[flea] > 0)
  assert.ok(s.focusAlive(flea), 'the new ride has a valid generation')
  assert.ok(s.focus[flea] === little || s.focus[flea] === replacement)
  s.stopMoves(flea)
  assert.equal(s.bugs.hopT[flea], 0)
  assert.equal(s.latchT[flea], 0)
}

{ // A moth seeks a friendly flame instead of the enemy, then delivers fire by contact.
  const s = scene(), moth = s.spawn(unit('moth'), 300, 300, RED)
  const flame = s.spawn(unit('dragon'), 320, 300, RED)
  const enemy = s.spawn(unit('goose'), 200, 300, BLUE)
  s.buildGrid()
  assert.equal(s.bugs.steer(moth, enemy), true)
  assert.ok(s.vx[moth] > 0, 'flies toward fire on its own side')
  assert.equal(s.burnT[moth], 4)
  assert.equal(s.fearT[moth], 0)
  s.x[flame] = 800
  s.x[enemy] = s.x[moth] + 2
  s.cd[enemy] = 100
  s.vx[moth] = s.vy[moth] = 0
  s.step()
  assert.ok(s.burnT[enemy] > 0)
  assert.equal(s.hot[enemy], 1)
  assert.equal(s.burnT[moth], 0, 'delivery does not immediately catch back onto the moth')
  assert.equal(s.fearT[moth], 0)
}

{ // Bodies are available without ants; three grow the ball, which rolls independently.
  const s = scene(), beetle = s.spawn(unit('dungbeetle'), 100, 300, RED)
  for (const x of [140, 210, 280]) {
    const victim = s.spawn(unit('goose'), x, 300, BLUE)
    s.damage(victim, 10000, 0, 0)
  }
  assert.equal(s.cAlive.reduce((n, a) => n + a, 0), 3)
  let released = -1
  for (let t = 0; t < 600 && released < 0; t++) {
    s.step()
    released = s.bugs.life.findIndex((life) => life > 0)
  }
  assert.ok(released >= 0, 'three fallen bodies release a ball')
  assert.equal(s.bugs.ballR[beetle], 7)
  assert.equal(s.bugs.radius[released], 19)
  assert.equal(s.cAlive.some(Boolean), false)
  const ally = s.spawn(unit('giant'), s.bugs.x[released] + 5, s.bugs.y[released], RED)
  const enemy = s.spawn(unit('giant'), s.bugs.x[released] + 5, s.bugs.y[released], BLUE)
  s.buildGrid(); s.bugs.step()
  assert.equal(s.hp[ally], UNITS[unit('giant')].hp)
  assert.equal(s.hp[enemy], UNITS[unit('giant')].hp - 30)
  s.bugs.step()
  assert.equal(s.hp[enemy], UNITS[unit('giant')].hp - 30, 'one hit per victim per released ball')
  s.damage(beetle, 10000, 0, 0)
  const oldX = s.bugs.x[released]
  s.bugs.step()
  assert.notEqual(s.bugs.x[released], oldX, 'the ball keeps rolling after its owner dies')
  s.clear()
  assert.equal(s.bugs.life.some(Boolean), false)
  assert.equal(s.bugs.ballR.some(Boolean), false)
}

{ // A reserved corpse belongs to its ant/spider collector until that claim is released.
  const s = scene(), beetle = s.spawn(unit('dungbeetle'), 300, 300, RED)
  const victim = s.spawn(unit('goose'), 320, 300, BLUE)
  s.damage(victim, 10000, 0, 0)
  const k = s.cAlive.findIndex(Boolean)
  assert.ok(k >= 0)
  const collector = s.spawn(unit('spider'), 900, 300, RED)
  for (const claim of ['ant', 'spider']) {
    s.cHome[k] = claim === 'ant' ? collector : -1
    s.cSpider[k] = claim === 'spider' ? collector : -1
    s.px[beetle] = s.x[beetle] - 1
    s.bugs.afterMove()
    assert.equal(s.cAlive[k], 1)
    assert.equal(s.bugs.ballR[beetle], 7)
  }
  s.cHome[k] = s.cSpider[k] = -1
  s.bugs.afterMove()
  assert.equal(s.cAlive[k], 0)
  assert.equal(s.bugs.ballR[beetle], 11)
}

// Ten more bugs (2026-11-14), also unrun.

{ // Buzz Kill: one sting ends the bee; the stinger keeps hurting.
  const s = scene(), bee = s.spawn(unit('bee'), 300, 300, RED), victim = s.spawn(unit('rex'), 310, 300, BLUE)
  s.tick = 13 // pulses must be relative to this sting, not a global tick or victim slot
  s.buildGrid()
  s.attack(bee, victim, 1, 0)
  assert.equal(s.alive[bee], 0)
  const hp = s.hp[victim]
  assert.equal(hp, UNITS[s.type[victim]].hp - UNITS[unit('bee')].dmg)
  advance(s, 29)
  assert.equal(s.hp[victim], hp, 'the first pulse waits half a second')
  advance(s, 1)
  assert.equal(s.hp[victim], hp - 4)
  advance(s, 330)
  assert.equal(s.hp[victim], hp - 48, 'twelve pulses over six seconds')
  assert.ok(s.bugs.stingT[victim] <= DT)
  s.damage(victim, 10000, 0, 0)
  const fresh = s.spawn(unit('rex'), 310, 300, BLUE)
  assert.equal(fresh, victim)
  assert.equal(s.bugs.stingT[fresh], 0, 'the stinger does not follow a recycled victim slot')
}

{ // Night Shift: awake fighters are off the menu, a toppled one is not.
  const s = scene(), bug = s.spawn(unit('bedbug'), 300, 300, RED), victim = s.spawn(unit('gymbro'), 340, 300, BLUE)
  s.buildGrid()
  assert.equal(s.findTarget(bug), -1)
  const hp = s.hp[victim]
  s.attack(bug, victim, 1, 0)
  assert.equal(s.hp[victim], hp, 'even direct attacks refuse an awake target')
  s.downT[victim] = 1
  assert.equal(s.findTarget(bug), victim)
  s.downT[victim] = 0
  s.dizzyT[victim] = 1
  assert.equal(s.findTarget(bug), -1, 'a fighter who is only dizzy is still awake')
  s.dizzyT[victim] = 0
  const statue = s.spawn(unit('gargoyle'), 400, 300, BLUE)
  s.face[bug] = 1; s.updateGazes()
  assert.equal(s.isStatue(statue), true)
  assert.equal(s.bugs.ignores(bug, statue), false)
  const napper = s.spawn(unit('bedrot'), 420, 300, BLUE)
  assert.equal(s.bugs.ignores(bug, napper), false)
  s.atkT[napper] = 1
  assert.equal(s.bugs.ignores(bug, napper), true, 'the pillow fighter is awake while attacking')
}

{ // Forklift: even a giant ends up on its back.
  const s = scene(), beetle = s.spawn(unit('hercules'), 300, 300, RED), giant = s.spawn(unit('giant'), 330, 300, BLUE)
  s.buildGrid()
  s.attack(beetle, giant, 1, 0)
  assert.ok(s.downT[giant] > 0)
  assert.equal(s.canAct(giant), false)
}

{ // One Day: alive at nineteen seconds, gone just after twenty.
  const s = scene(), fly = s.spawn(unit('mayfly'), 300, 300, RED)
  advance(s, 19 * 60)
  assert.equal(s.alive[fly], 1)
  s.shockT[fly] = 5
  advance(s, 60)
  assert.equal(s.alive[fly], 0)
}

{ // Twig: hidden while still, visible the moment it moves.
  const s = scene(), twig = s.spawn(unit('twig'), 300, 300, RED)
  advance(s, 1)
  assert.equal(s.hidden[twig], 1)
  s.vx[twig] = 100
  advance(s, 1)
  assert.equal(s.hidden[twig], 0)
}

{ // Enemies can pass a still Twig at close range; only a rear poke ends its wait.
  const s = scene(), twig = s.spawn(unit('twig'), 300, 300, RED), enemy = s.spawn(unit('goose'), 280, 300, BLUE)
  s.face[enemy] = 1; s.cd[twig] = 0
  s.buildGrid()
  assert.equal(s.findTarget(enemy), -1, 'proximity alone cannot reveal a still stick insect')
  const hp = s.hp[enemy]
  s.bugs.steer(twig, enemy)
  s.attack(twig, enemy, -1, 0)
  assert.equal(s.hp[enemy], hp, 'waits while the enemy is facing it')
  assert.equal(s.vx[twig], 0)
  s.x[enemy] = 320; s.buildGrid()
  s.bugs.steer(twig, enemy)
  assert.equal(s.hp[enemy], hp - UNITS[unit('twig')].dmg * 2, 'the poke from behind receives the ambush bonus')
}

{ // Renovation: walks past the fighter to the building and chews it at five times the rate.
  const s = scene(), type = unit('termite'), termite = s.spawn(type, 300, 300, RED)
  s.spawn(unit('goose'), 320, 300, BLUE)
  const hill = s.spawn(unit('anthill'), 400, 300, BLUE), hp = s.hp[hill]
  s.buildGrid()
  assert.equal(s.findTarget(termite), hill)
  s.attack(termite, hill, 1, 0)
  assert.equal(s.hp[hill], hp - UNITS[type].dmg * UNITS[type].wrecker!)
}

{ // Plus One: the egg goes in on a bite the victim survives; two wasps come out when it dies.
  const s = scene(), type = unit('wasp'), wasp = s.spawn(type, 300, 300, RED), victim = s.spawn(unit('rex'), 310, 300, BLUE)
  s.buildGrid()
  s.attack(wasp, victim, 1, 0)
  assert.equal(s.bugs.egg[victim], RED)
  s.damage(victim, 10000, 0, 0)
  assert.equal(s.counts[type], 3)
  assert.equal(s.teamCounts[RED], 3)
}

{ // A lethal sting still implants before the victim's death hook runs.
  const s = scene(), type = unit('wasp'), parent = s.spawn(type, 300, 300, RED), victim = s.spawn(unit('rex'), 310, 300, BLUE)
  s.hp[victim] = 1
  s.buildGrid(); s.attack(parent, victim, 1, 0)
  assert.equal(s.alive[victim], 0)
  assert.equal(s.counts[type], 3)
  assert.equal(s.teamCounts[RED], 3)
}

{ // Temporary roach deaths keep the egg; only the final death releases its two wasps.
  const s = scene(), type = unit('wasp'), parent = s.spawn(type, 300, 300, RED), host = s.spawn(unit('cockroach'), 310, 300, BLUE)
  s.buildGrid(); s.attack(parent, host, 1, 0)
  s.damage(parent, 10000, 0, 0)
  for (let life = 0; life < 2; life++) {
    s.damage(host, 10000, 0, 0)
    assert.equal(s.counts[type], 0)
    assert.equal(s.bugs.egg[host], RED)
    advance(s, 181)
  }
  s.damage(host, 10000, 0, 0)
  assert.equal(s.counts[type], 2)
}

{ // At the live-fighter limit, both offspring wait for slots instead of disappearing.
  const s = scene(), type = unit('wasp'), parent = s.spawn(type, 300, 300, RED), host = s.spawn(unit('rex'), 310, 300, BLUE)
  for (let k = s.n; k < MAX; k++) s.spawn(unit('bedrot'), 1000, 600, RED)
  s.buildGrid(); s.attack(parent, host, 1, 0)
  s.damage(host, 10000, 0, 0)
  s.buildGrid(); s.bugs.step()
  assert.equal(s.counts[type], 2, 'the freed host slot hatches the first wasp')
  s.damage(2, 10000, 0, 0)
  s.buildGrid(); s.bugs.step()
  assert.equal(s.counts[type], 3, 'the next free slot hatches the second wasp')
  assert.equal(s.teamCounts[RED], MAX)
}

{ // Trap Card: a fighter that cannot walk still slides down the slope.
  const s = scene()
  const lion = s.spawn(unit('antlion'), 300, 300, RED)
  s.damage(lion, 1, 300, 0)
  s.toss(lion, 1, 0, BLUE)
  assert.equal(s.vx[lion], 0)
  assert.equal(s.airT[lion], 0)
  const goose = s.spawn(unit('goose'), 350, 300, BLUE)
  s.downT[goose] = 5
  advance(s, 30)
  assert.ok(s.x[goose] < 350)
  assert.equal(s.x[lion], 300)
}

{ // 17 Years: out of reach underground, then up on the shared clock with a stunning scream.
  const s = scene(), cicada = s.spawn(unit('cicada'), 300, 300, RED), sleeper = s.spawn(unit('bedrot'), 340, 300, BLUE)
  assert.equal(s.stage[cicada], 1)
  s.damage(cicada, 10000, 0, 0)
  assert.equal(s.alive[cicada], 1)
  advance(s, 17 * 60 + 1)
  assert.equal(s.stage[cicada], 0)
  assert.ok(s.shockT[sleeper] > 0)
}

{ // Mounds join one deadline, opposing cicadas emerge fairly, and Clear starts a new wait.
  const s = scene(), type = unit('cicada'), first = s.spawn(type, 300, 300, RED)
  advance(s, 300)
  const second = s.spawn(type, 330, 300, BLUE)
  advance(s, 720)
  assert.equal(s.stage[first], 1)
  assert.equal(s.stage[second], 1)
  s.step()
  assert.equal(s.stage[first], 0)
  assert.equal(s.stage[second], 0)
  assert.ok(s.shockT[first] > 0 && s.shockT[second] > 0, 'both screams see the whole emerged cohort')
  s.clear()
  const fresh = s.spawn(type, 300, 300, RED)
  advance(s, 1020)
  assert.equal(s.stage[fresh], 1, 'the previous game clock cannot shorten the next wait')
  s.step(); assert.equal(s.stage[fresh], 0)
}

{ // All You Can Eat: the bush is gone and there is one more locust.
  const s = scene(), type = unit('locust')
  s.spawn(type, 300, 300, RED)
  s.addTerrain(330, 300)
  assert.ok(s.inBush(330, 300))
  advance(s, 120)
  assert.equal(s.inBush(330, 300), false)
  assert.equal(s.counts[type], 2)
}

{ // Eating preserves overlapping water, reveals hiders, and ignores stale terrain indices.
  const s = scene(), hider = s.spawn(unit('snake'), 300, 300, BLUE)
  s.addTerrain(300, 300, 0)
  s.addTerrain(300, 300, 1)
  s.hidden[hider] = s.ambush[hider] = 1
  const water = s.waterVer
  assert.equal(s.removeTerrain(-1), false)
  assert.equal(s.removeTerrain(2), false)
  assert.equal(s.bn, 2)
  assert.equal(s.removeTerrain(0), true)
  assert.equal(s.inBush(300, 300), false)
  assert.equal(s.inWater(300, 300), true)
  assert.equal(s.waterVer, water)
  assert.equal(s.hidden[hider], 0)
  assert.equal(s.ambush[hider], 0)
  assert.equal(s.removeTerrain(0), true)
  assert.equal(s.inWater(300, 300), false)
  assert.ok(s.waterVer > water)
  assert.equal(s.removeTerrain(0), false)
}

{ // A full page leaves a locust meal intact until its offspring can be placed.
  const s = scene(), type = unit('locust'), locust = s.spawn(type, 300, 300, RED)
  for (let k = s.n; k < MAX; k++) s.spawn(unit('bedrot'), 1000, 600, RED)
  s.addTerrain(300, 300)
  s.buildGrid(); s.bugs.steer(locust, -1)
  assert.equal(s.bn, 1)
  assert.equal(s.counts[type], 1)
  s.damage(1, 10000, 0, 0)
  s.bugs.steer(locust, -1)
  assert.equal(s.bn, 0)
  assert.equal(s.counts[type], 2)
}

console.log('ok: fifteen bugs')

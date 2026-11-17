// Unrun. Run only after owner approval: node checks/mythicals.check.ts
import assert from 'node:assert/strict'
import { BLUE, DT, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const t = UNITS.findIndex((u) => u.key === key)
  assert.ok(t >= 0, `missing ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(1400, 800); return s }
const advance = (s: Sim, ticks: number) => { for (let k = 0; k < ticks; k++) s.step() }
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.02, `${a} should be close to ${b}`)

{ // Facing works across the page, follows teams, and ignores blind or hidden observers.
  const s = scene(), gargoyle = s.spawn(unit('gargoyle'), 300, 300, RED)
  const watcher = s.spawn(unit('goose'), 1200, 650, BLUE)
  const ally = s.spawn(unit('goose'), 100, 300, RED)
  s.face[watcher] = -1; s.face[ally] = 1
  s.updateGazes()
  assert.equal(s.isStatue(gargoyle), true)
  assert.equal(s.canAct(gargoyle), false)
  const hp = s.hp[gargoyle]
  s.damage(gargoyle, 40, 250, 0)
  close(s.hp[gargoyle], hp - 2)
  assert.equal(s.vx[gargoyle], 0)
  s.toss(gargoyle, 1, 0, BLUE)
  assert.equal(s.airT[gargoyle], 0)
  s.face[watcher] = 1; s.updateGazes()
  assert.equal(s.isStatue(gargoyle), false, 'allies looking do not freeze it')
  s.damage(gargoyle, 40, 0, 0)
  close(s.hp[gargoyle], hp - 42)
  s.face[watcher] = -1; s.blindT[watcher] = 1; s.updateGazes()
  assert.equal(s.isStatue(gargoyle), false)
  s.blindT[watcher] = 0; s.hidden[watcher] = 1; s.updateGazes()
  assert.equal(s.isStatue(gargoyle), false)
  s.hidden[watcher] = 0; s.updateGazes()
  assert.equal(s.isStatue(gargoyle), true)
  s.clear()
  assert.equal(s.watched.some(Boolean), false)
}

{ // Statue movement is rooted through separation and damage over time is reduced too.
  const s = scene(), g = s.spawn(unit('gargoyle'), 300, 300, RED)
  const watcher = s.spawn(unit('goose'), 305, 300, BLUE)
  s.face[watcher] = -1; s.cd[watcher] = 100
  s.burnT[g] = 1
  const hp = s.hp[g]
  s.step()
  assert.equal(s.x[g], 300)
  assert.equal(s.y[g], 300)
  close(s.hp[g], hp - 9 * DT * 0.05)
  s.blindT[watcher] = 1
  s.x[watcher] = 400
  s.step()
  assert.equal(s.isStatue(g), false)
  assert.ok(s.vx[g] > 0, 'moves as soon as the last watcher cannot see it')
}

{ // Growth is permanent, exact thirds count, and one big hit can grow two heads.
  const s = scene(), h = s.spawn(unit('hydra'), 300, 300, RED)
  assert.equal(s.layers[h], 1)
  s.damage(h, 99, 0, 0); assert.equal(s.layers[h], 1)
  s.damage(h, 1, 0, 0); assert.equal(s.layers[h], 2)
  s.damage(h, 100, 0, 0); assert.equal(s.layers[h], 3)
  s.hp[h] = UNITS[unit('hydra')].hp
  s.step()
  assert.equal(s.layers[h], 3, 'healing cannot take a head away')
  assert.equal(s.bn, 0, 'head growth never sheds pancakes or syrup')
  s.damage(h, 10000, 0, 0)
  const reused = s.spawn(unit('hydra'), 300, 300, RED)
  assert.equal(reused, h)
  assert.equal(s.layers[reused], 1)
  s.damage(reused, 201, 0, 0)
  assert.equal(s.layers[reused], 3)
  assert.equal(s.headTarget[reused * 3], -1)
}

for (const key of ['hydra', 'cerberus']) {
  const s = scene(), fighter = s.spawn(unit(key), 300, 300, RED)
  if (key === 'hydra') s.damage(fighter, 201, 0, 0)
  const victims = [[330, 300], [320, 320], [330, 280]].map(([x, y]) => s.spawn(unit('goose'), x, y, BLUE))
  const ally = s.spawn(unit('goose'), 325, 300, RED)
  const before = victims.map((j) => s.hp[j])
  s.buildGrid(); s.attack(fighter, victims[0], 1, 0)
  const targets = Array.from(s.headTarget.subarray(fighter * 3, fighter * 3 + 3))
  assert.equal(new Set(targets).size, 3, `${key}: each head chooses its own victim`)
  assert.ok(targets.every((j) => victims.includes(j)))
  victims.forEach((j, k) => close(s.hp[j], before[k] - UNITS[unit(key)].dmg))
  assert.equal(s.hp[ally], UNITS[unit('goose')].hp)
  s.x[victims[1]] = s.x[victims[2]] = 1200
  const loneHp = s.hp[victims[0]]
  s.buildGrid(); s.attack(fighter, victims[0], 1, 0)
  close(s.hp[victims[0]], loneHp - UNITS[unit(key)].dmg)
  assert.equal(s.headTarget[fighter * 3 + 1], -1, 'a lone victim receives one bite')
  s.damage(victims[0], 10000, 0, 0)
  const replacement = s.spawn(unit('goose'), 900, 300, BLUE)
  assert.equal(replacement, victims[0])
  assert.notEqual(s.generation[replacement], s.headGen[fighter * 3], 'old head aims cannot follow a recycled victim')
}

for (const thrower of ['dad', 'thor', 'poseidon']) {
  const s = scene(), dog = s.spawn(unit('cerberus'), 300, 300, RED)
  const enemy = s.spawn(unit('goose'), 325, 300, BLUE)
  const source = s.spawn(unit(thrower), 250, 200, RED)
  s.cd[dog] = 0; s.cd[enemy] = 100
  s.attack(source, enemy, 1, 0)
  s.abilityCd[source] = 100 // isolate the distraction from Poseidon's separate wave
  const hp = s.hp[enemy]
  s.step()
  assert.equal(s.chasing[dog], 1, `chases a friendly ${thrower} throw`)
  assert.equal(s.target[dog], -1)
  assert.ok(s.vy[dog] < 0)
  assert.equal(s.hp[enemy], hp, 'distraction takes priority over a nearby bite')
  assert.ok(s.pn > 0, 'chasing preserves the real projectile and its owner')
  s.shockT[dog] = 0.5; s.step()
  assert.equal(s.chasing[dog], 0, 'stun stops pursuit')
  s.clear()
  assert.equal(s.chasing.some(Boolean), false)
}

{ // Regeneration continues through a hit/stun, stops during fire and never exceeds max health.
  const s = scene(), troll = s.spawn(unit('troll'), 300, 300, RED)
  s.hp[troll] = 100; s.atkT[troll] = 1; s.shockT[troll] = 2
  advance(s, 60)
  close(s.hp[troll], 142)
  s.burnT[troll] = 1
  advance(s, 30)
  close(s.hp[troll], 142 - 9 * 3 * 0.5)
  assert.ok(s.fearT[troll] > 0)
  s.burnT[troll] = 0
  const hp = s.hp[troll]
  s.step(); close(s.hp[troll], hp + 42 * DT)
  s.hp[troll] = UNITS[unit('troll')].hp - 0.1
  s.step(); assert.equal(s.hp[troll], UNITS[unit('troll')].hp)
  s.shockT[troll] = 0
  const chili = s.spawn(unit('chili'), 350, 300, BLUE)
  const before = s.hp[troll]
  s.hit(troll, UNITS[unit('chili')], 0, 0, chili)
  close(s.hp[troll], before - UNITS[unit('chili')].dmg * 3)
  assert.ok(s.burnT[troll] > 0 && s.fearT[troll] > 0)
}

{ // Human and wolf alternate on time, with actual wolf damage and no transformation heal.
  const s = scene(), man = s.spawn(unit('werewolf'), 300, 300, RED)
  s.damage(man, 30, 0, 0)
  const hp = s.hp[man]
  advance(s, 479)
  assert.ok(s.moodT[man] < 0)
  s.step(); assert.ok(s.moodT[man] > 0)
  assert.equal(s.hp[man], hp)
  const enemy = s.spawn(unit('goose'), s.x[man] + 20, s.y[man], BLUE)
  s.cd[man] = s.cd[enemy] = 100
  const before = s.hp[enemy]
  s.buildGrid(); s.attack(man, enemy, 1, 0)
  close(s.hp[enemy], before - UNITS[unit('werewolf')].werewolf!.dmg!)
  s.cd[man] = 100
  advance(s, 300)
  assert.ok(s.moodT[man] < 0)
  assert.ok(s.dizzyT[man] > 0, 'changing back leaves him confused')
  assert.equal(s.hp[man], hp)
  const now = s.hp[enemy]
  s.attack(man, enemy, 1, 0)
  assert.equal(s.hp[enemy], now, 'the human cannot hurt anyone')
  s.moodT[man] = -DT
  s.shockT[man] = 0.5; s.burnT[man] = 1
  s.step()
  assert.ok(s.moodT[man] > 0, 'the clock still runs while stunned')
  assert.ok(s.shockT[man] > 0 && s.burnT[man] > 0, 'transformation does not clear harmful effects')
  s.clear()
  const fresh = s.spawn(unit('werewolf'), 300, 300, RED)
  assert.equal(s.moodT[fresh], -8)
}

console.log('ok: gargoyle gazes, hydra growth, distinct bites, projectile chasing, troll fire and werewolf cycles')

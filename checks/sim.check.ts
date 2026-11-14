// Self-check, no browser needed: `npm run check`
import assert from 'node:assert/strict'
import { Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const sim = new Sim()
sim.resize(800, 600)
for (let k = 0; k < 20; k++) {
  sim.spawn(0, 100, 100 + k * 20) // toasts on the left
  sim.spawn(1, 700, 100 + k * 20) // geese on the right
}
assert.deepEqual([sim.counts[0], sim.counts[1]], [20, 20])

for (let t = 0; t < 60 * 120 && sim.counts[0] && sim.counts[1]; t++) sim.step()

assert.ok(!sim.counts[0] || !sim.counts[1], 'one side should be wiped out within two minutes')
let alive = 0
for (let i = 0; i < sim.n; i++) {
  if (!sim.alive[i]) continue
  alive++
  assert.ok(Number.isFinite(sim.x[i]) && Number.isFinite(sim.y[i]), 'position is finite')
  const r = UNITS[sim.type[i]].r
  assert.ok(sim.x[i] >= r && sim.x[i] <= 800 - r && sim.y[i] >= r && sim.y[i] <= 600 - r, 'unit stays on the page')
}
assert.equal(alive, sim.counts.reduce((a, b) => a + b, 0), 'counts match live units')

// dragon breath sets a neighbour on fire
const d = new Sim()
d.resize(800, 600)
d.spawn(UNITS.findIndex((u) => u.key === 'dragon'), 300, 300)
d.spawn(0, 360, 300)
for (let t = 0; t < 60; t++) d.step()
let burning = false
for (let i = 0; i < d.n; i++) if (d.alive[i] && d.burnT[i] > 0) burning = true
assert.ok(burning || d.counts[0] === 0, 'toast next to a dragon should be burning (or already ash)')

// phoenix: breath that lands leaves a healing ring; dies into an egg, hatches a chick, grows up, then dies for real
const p = new Sim()
p.resize(800, 600)
const phx = UNITS.findIndex((u) => u.key === 'phoenix')
p.spawn(phx, 300, 300)
p.spawn(0, 350, 300)
for (let t = 0; t < 30; t++) p.step()
assert.ok(p.rLife.some((l) => l > 0), 'phoenix fire that lands leaves a healing ring')
p.clear() // alone from here on, so only the burn below can hurt it
p.spawn(phx, 300, 300) // slot 0
const ash = () => { p.hp[0] = 1; p.burnT[0] = 1; for (let t = 0; t < 30; t++) p.step() }
ash()
assert.deepEqual([p.alive[0], p.stage[0], p.counts[phx]], [1, 1, 1], 'first death is an egg')
for (let t = 0; t < 60 * 3; t++) p.step()
assert.equal(p.stage[0], 2, 'egg hatches into a chick')
for (let t = 0; t < 60 * 9; t++) p.step()
assert.deepEqual([p.stage[0], p.hp[0]], [3, UNITS[phx].hp], 'chick grows back up at full health')
ash()
assert.deepEqual([p.alive[0], p.counts[phx]], [0, 0], 'no second rebirth')

// a hider in a bush stays put and invisible until an enemy comes close
const b = new Sim()
b.resize(800, 600)
b.addTerrain(400, 300)
const kid = UNITS.findIndex((u) => u.key === 'toddler')
b.spawn(kid, 400, 300) // slot 0
b.spawn(0, 100, 300) // slot 1, a toast far away
for (let t = 0; t < 30; t++) b.step()
assert.equal(b.hidden[0], 1, 'toddler is hidden in the bush')
assert.ok(Math.abs(b.x[0] - 400) < 3, 'toddler waits in the bush')
assert.equal(b.target[1], -1, 'toast cannot see the hidden toddler')
for (let t = 0; t < 60 * 8; t++) b.step()
assert.ok(b.ambush[0] === 0 || !b.alive[0] || !b.alive[1], 'toddler eventually springs the ambush')

// puddles: a toast wades at half speed, and still gets there
const w = new Sim()
w.resize(800, 600)
for (let k = 0; k < 12; k++) w.addTerrain(60 + k * 20, 150, 1)
assert.ok(w.inWater(100, 150) && !w.inWater(100, 450) && !w.inBush(100, 150), 'puddle mask')
w.spawn(0, 60, 150) // slot 0, in the puddle
w.spawn(0, 60, 450) // slot 1, on dry land
w.spawn(2, 780, 300) // an intern far away, something to walk at
for (let t = 0; t < 120; t++) w.step()
assert.ok(w.x[0] - 60 > 10 && w.x[0] - 60 < (w.x[1] - 60) * 0.7, 'toast in a puddle is slower than toast on land')

// siren: the ballad reels a toast in, then the death metal hurts it
const s = new Sim()
s.resize(800, 600)
s.spawn(UNITS.findIndex((u) => u.key === 'siren'), 400, 300) // slot 0
s.spawn(0, 550, 300) // slot 1
for (let t = 0; t < 30; t++) s.step()
assert.ok(s.lureT[1] > 0 && s.hp[0] === UNITS[s.type[0]].hp, 'toast is charmed and not fighting')
for (let t = 0; t < 60 * 20 && s.song[0] <= 0; t++) s.step()
assert.ok(s.song[0] > 0 && s.x[1] < 500, 'toast walked into the pit and the metal started')
const before = s.hp[1]
for (let t = 0; t < 60; t++) s.step()
assert.ok(!s.alive[1] || s.hp[1] < before, 'death metal hurts')

// t-rex: a bite on someone smaller becomes a grab, a shake and a long throw that ends in stars
const g = new Sim()
g.resize(800, 600)
const rex = UNITS.findIndex((u) => u.key === 'rex')
const chance = UNITS[rex].grab
UNITS[rex].grab = 1 // every bite grabs, so the check isn't down to luck
g.spawn(rex, 300, 300) // slot 0
g.spawn(0, 330, 300) // slot 1, a toast
for (let t = 0; t < 120 && g.heldBy[1] < 0; t++) g.step()
assert.deepEqual([g.heldBy[1], g.grab[0]], [0, 1], 'rex has the toast in its jaws')
for (let t = 0; t < 60 && g.airT[1] <= 0; t++) g.step()
assert.ok(g.airT[1] > 0 && g.heldBy[1] < 0 && g.grab[0] < 0, 'toast is thrown')
for (let t = 0; t < 60 && g.airT[1] > 0; t++) g.step()
assert.ok(Math.hypot(g.x[1] - g.x[0], g.y[1] - g.y[0]) > 150 && g.dizzyT[1] > 0 && g.hp[1] < UNITS[0].hp, 'toast lands far away, hurt and dizzy')
g.clear()
g.spawn(rex, 300, 300)
g.spawn(UNITS.findIndex((u) => u.key === 'dragon'), 340, 300)
for (let t = 0; t < 120; t++) g.step()
assert.ok(g.grab[0] < 0 && g.heldBy[1] < 0, 'a dragon does not fit in the mouth')
UNITS[rex].grab = chance

// unicorn: spots a toast from afar, charges at it, and the poke that ends the charge sends it flying
const u = new Sim()
u.resize(800, 600)
u.spawn(UNITS.findIndex((k) => k.key === 'unicorn'), 200, 300) // slot 0
u.spawn(0, 340, 300) // slot 1
u.step()
assert.equal(u.rush[0], 1, 'unicorn charges at a far-off toast')
for (let t = 0; t < 180 && u.airT[1] <= 0; t++) u.step()
assert.ok(u.airT[1] > 0 && u.rush[0] === 0, 'the charge ends with the toast in the air')
for (let t = 0; t < 60 && u.airT[1] > 0; t++) u.step()
assert.ok(Math.hypot(u.x[1] - u.x[0], u.y[1] - u.y[0]) > 150 && u.dizzyT[1] > 0, 'toast lands far away, seeing stars')

// pegasus: flies right up to a toast, turns its back on it, drifts away and hoses it with rainbow
const f = new Sim()
f.resize(800, 600)
f.spawn(UNITS.findIndex((k) => k.key === 'pegasus'), 200, 300) // slot 0
f.spawn(0, 330, 300) // slot 1
f.step()
assert.equal(f.beam[0], 0, 'no rainbow until it has flown right up')
for (let t = 0; t < 300 && !f.beam[0]; t++) f.step()
assert.equal(f.beam[0], 1, 'pegasus reaches the toast and starts the rainbow')
const full = f.hp[1], gap = Math.abs(f.x[1] - f.x[0])
for (let t = 0; t < 30; t++) f.step()
assert.ok(f.hp[1] < full, 'the rainbow hurts')
assert.equal(f.face[0], f.x[1] > f.x[0] ? -1 : 1, 'butt towards the enemy')
f.hp[1] = 1e6 // hold the toast still and unkillable, so only the pegasus is moving
for (let t = 0; t < 30; t++) { f.x[1] = f.x[0] + (f.x[1] > f.x[0] ? gap : -gap); f.step() }
assert.equal(f.beam[0], 1, 'still firing while it backs off')

// griffin: grabs one toast, carries it to the next and throws it at them; both bounce away and see stars
const c = new Sim()
c.resize(800, 600)
const grif = UNITS.findIndex((k) => k.key === 'griffin'), luck = UNITS[grif].grab
UNITS[grif].grab = 1
c.spawn(grif, 300, 300) // slot 0
c.spawn(0, 330, 300) // slot 1
c.spawn(0, 450, 300) // slot 2
for (let t = 0; t < 120 && c.heldBy[1] < 0 && c.heldBy[2] < 0; t++) c.step()
const cargo = c.heldBy[1] === 0 ? 1 : 2, other = 3 - cargo
assert.equal(c.heldBy[cargo], 0, 'griffin picks a toast up')
UNITS[grif].grab = 0 // one catch is enough for this check
for (let t = 0; t < 240 && c.airT[cargo] <= 0; t++) c.step()
assert.ok(c.airT[cargo] > 0 && c.grab[0] < 0, 'and throws it at the other toast')
for (let t = 0; t < 60 && c.airT[other] <= 0; t++) c.step()
assert.ok(c.airT[other] > 0 && c.airT[cargo] > 0, 'they collide and both bounce away')
for (let t = 0; t < 60 && (c.airT[other] > 0 || c.airT[cargo] > 0); t++) c.step()
assert.ok(c.dizzyT[other] > 0 && c.dizzyT[cargo] > 0, 'and both end up seeing stars')
UNITS[grif].grab = luck

// snake: swallows what it kills (more max hp, full heal), and a king summons little snakes
const n = new Sim()
n.resize(800, 600)
const snk = UNITS.findIndex((k) => k.key === 'snake')
n.spawn(snk, 300, 300) // slot 0
n.spawn(1, 318, 300) // a goose
n.hp[1] = 1
for (let t = 0; t < 180 && n.counts[1]; t++) n.step()
assert.deepEqual([n.counts[1], n.grow[0], n.hp[0]], [0, 1, UNITS[snk].hp + UNITS[snk].eats!], 'snake eats the goose, grows and heals to its new full health')
n.grow[0] = 5 // crowned
n.spawn(0, 400, 300) // a toast to pick a fight with
n.hp[1] = 1e6
for (let t = 0; t < 10; t++) n.step()
assert.equal(n.counts[snk], 2, 'a king with an enemy in sight summons one little snake')

// Roster expansion regressions. Added without running: owner permission is required.
const unit = (key: string) => {
  const t = UNITS.findIndex((def) => def.key === key)
  assert.ok(t >= 0, `missing fighter: ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(1000, 600); return s }

// The sniper actually acquires and hits a target far beyond the old nearby-cell search.
const sniper = scene()
const fish = sniper.spawn(unit('archerfish'), 100, 300)
const distant = sniper.spawn(unit('toast'), 600, 300)
sniper.cd[fish] = 0
sniper.step()
assert.equal(sniper.target[fish], distant, 'archerfish sees an enemy 500px away')
assert.ok(sniper.inWater(sniper.x[fish], sniper.y[fish]), 'dry placement gives the fish water')
for (let t = 0; t < 120; t++) sniper.step()
assert.ok(sniper.hp[distant] < UNITS[unit('toast')].hp, 'long-range water spit reaches the enemy')

// Shoves and overlap separation cannot push a confined swimmer onto land.
const pond = scene()
const wet = pond.spawn(unit('archerfish'), 200, 300)
for (let k = 0; k < 4; k++) {
  const blocker = pond.spawn(unit('bedrot'), 200 + k * 3, 300)
  pond.cd[blocker] = 100
}
pond.vx[wet] = 1600
for (let t = 0; t < 90; t++) {
  pond.step()
  assert.ok(pond.inWater(pond.x[wet], pond.y[wet]), 'water-bound fish stays wet after movement and separation')
}

// The old water coordinate can survive in the last mask cell while being outside new page bounds.
const smallerPond = scene()
smallerPond.addTerrain(602, 300, 1)
const edgeFish = smallerPond.spawn(unit('archerfish'), 590, 300)
smallerPond.resize(590, 600)
assert.ok(smallerPond.x[edgeFish] <= 580 && smallerPond.inWater(smallerPond.x[edgeFish], smallerPond.y[edgeFish]), 'resize rehomes a swimmer inside the new page and water')
assert.equal(smallerPond.px[edgeFish], smallerPond.x[edgeFish], 'resize resets interpolation for a rehomed swimmer')

// Centaurs keep moving tangentially while their spears are in flight.
const orbit = scene()
const horse = orbit.spawn(unit('centaur'), 300, 300)
orbit.spawn(unit('toast'), 445, 300)
orbit.cd[horse] = 0
orbit.step()
assert.ok(Math.abs(orbit.y[horse] - 300) > 0 && orbit.pn > 0, 'centaur runs around the target while throwing')
const stickyOrbit = scene()
const stickyHorse = stickyOrbit.spawn(unit('centaur'), 300, 300)
stickyOrbit.spawn(unit('toast'), 445, 300)
stickyOrbit.slowT[stickyHorse] = 3
stickyOrbit.step()
assert.ok(Math.abs(stickyOrbit.y[stickyHorse] - 300) < Math.abs(orbit.y[horse] - 300) * 0.6, 'sticky hits also slow an orbiting centaur')
const wadingOrbit = scene()
wadingOrbit.addTerrain(300, 300, 1)
const wetHorse = wadingOrbit.spawn(unit('centaur'), 300, 300)
wadingOrbit.spawn(unit('toast'), 445, 300)
wadingOrbit.step()
assert.ok(Math.abs(wadingOrbit.y[wetHorse] - 300) < Math.abs(orbit.y[horse] - 300) * 0.7, 'orbiting centaurs still wade at reduced speed')

// Burst shots use the real projectile pool and can damage a real opponent.
const kernels = scene()
const corn = kernels.spawn(unit('popcorn'), 100, 300)
const snack = kernels.spawn(unit('toast'), 240, 300)
kernels.cd[corn] = 0
kernels.step()
assert.equal(kernels.pn, 3, 'popcorn throws three kernels')
for (let t = 0; t < 50; t++) kernels.step()
assert.ok(kernels.hp[snack] < UNITS[unit('toast')].hp, 'kernel fan lands damage')

const cheese = scene()
const slice = cheese.spawn(unit('pizza'), 300, 300)
const topping = cheese.spawn(unit('toast'), 325, 300)
cheese.hp[slice] = 40
cheese.cd[slice] = 0
cheese.cd[topping] = 100
cheese.step()
assert.ok(cheese.hp[slice] > 40 && cheese.slowT[topping] > 0, 'cheese pull steals health and leaves sticky feet')

const squish = scene()
const cushion = squish.spawn(unit('mochi'), 324, 300)
const puncher = squish.spawn(unit('toast'), 300, 300)
squish.cd[cushion] = 100
squish.cd[puncher] = 0
squish.step()
assert.ok(squish.hp[cushion] < UNITS[unit('mochi')].hp && squish.hp[puncher] < UNITS[unit('toast')].hp, 'punching mochi reflects damage')

// Electrical damage stuns briefly, then releases the victim.
const zap = scene()
const jelly = zap.spawn(unit('jellyfish'), 300, 300)
const bones = zap.spawn(unit('toast'), 345, 300)
zap.cd[jelly] = 0
zap.step()
assert.ok(zap.shockT[bones] > 0 && zap.hp[bones] < UNITS[unit('toast')].hp, 'jellyfish hurts and electrifies its victim')
zap.cd[jelly] = 100 // let that one stun expire without another zap
for (let t = 0; t < 40; t++) zap.step()
assert.equal(zap.shockT[bones], 0, 'the X-ray stun ends')

// A dash is one stronger hit; panic cancels attacking and moves away instead.
const dash = scene()
const shinobi = dash.spawn(unit('ninja'), 300, 300)
const practice = dash.spawn(unit('toast'), 400, 300)
dash.cd[shinobi] = dash.cd[practice] = 100
dash.step()
assert.ok(dash.dashT[shinobi] > 0, 'safe ninja commits to a dash')
for (let t = 0; t < 15; t++) dash.step()
assert.ok(Math.abs(dash.hp[practice] - (UNITS[unit('toast')].hp - UNITS[unit('ninja')].dmg * 2.2)) < 0.01, 'dash strikes exactly once')
const nope = scene()
const anxious = nope.spawn(unit('ninja'), 300, 300)
nope.spawn(unit('toast'), 390, 300)
nope.hp[anxious] = 10
nope.cd[anxious] = 0
nope.step()
assert.ok(nope.fearT[anxious] > 0 && nope.x[anxious] < 300 && nope.pn === 0, 'hurt ninja runs away instead of attacking')
const stickyNope = scene()
stickyNope.addTerrain(300, 300, 1)
const stuckNinja = stickyNope.spawn(unit('ninja'), 300, 300)
stickyNope.spawn(unit('toast'), 390, 300)
stickyNope.hp[stuckNinja] = 10
stickyNope.slowT[stuckNinja] = 3
stickyNope.step()
assert.ok(300 - stickyNope.x[stuckNinja] < (300 - nope.x[anxious]) * 0.3, 'panic retreat respects sticky slowing and wading')

// Multiple spin sweeps hurt nearby enemies, then the spin ends.
const blades = scene()
const sensei = blades.spawn(unit('samurai'), 300, 300)
const dummy = blades.spawn(unit('toast'), 335, 300)
blades.cd[sensei] = 0
blades.cd[dummy] = 100
blades.step()
assert.ok(blades.spinT[sensei] > 0, 'samurai starts spinning')
const firstSweep = blades.hp[dummy]
for (let t = 0; t < 55; t++) blades.step()
assert.ok(blades.hp[dummy] < firstSweep && blades.spinT[sensei] === 0, 'spin lands repeated hits and finishes')

// The capybara lands its own jump without taking thrown-unit fall damage.
const cheeks = scene()
const admiral = cheeks.spawn(unit('capybara'), 300, 300)
const landing = cheeks.spawn(unit('toast'), 360, 300)
cheeks.cd[landing] = 100
cheeks.step()
assert.ok(cheeks.leapT[admiral] > 0, 'capybara jumps toward the enemy')
for (let t = 0; t < 35; t++) cheeks.step()
assert.ok(cheeks.hp[landing] <= UNITS[unit('toast')].hp - UNITS[unit('capybara')].dmg * 2, 'rump landing damages the nearby enemy')
assert.equal(cheeks.hp[admiral], UNITS[unit('capybara')].hp, 'its own jump does not deal fall damage')

// The cat opens with a brawl, switches to ordinary claws and never reopens.
const paws = scene()
const lawyer = paws.spawn(unit('cat'), 300, 300)
const client = paws.spawn(unit('toast'), 355, 300)
paws.hp[client] = 1000
paws.cd[client] = 100
paws.step()
for (let t = 0; t < 30; t++) paws.step()
assert.ok(paws.scrapT[lawyer] > 0 && paws.brawling(client), 'cat and victim enter the opening smoke cloud')
for (let t = 0; t < 90; t++) paws.step()
const afterCloud = paws.hp[client]
assert.ok(paws.opened[lawyer] && paws.scrapT[lawyer] === 0 && !paws.brawling(client), 'cloud releases both fighters')
for (let t = 0; t < 90; t++) paws.step()
assert.ok(paws.hp[client] < afterCloud && paws.leapT[lawyer] === 0, 'cat continues with normal claws')

// Killing the cat releases its partner, even when the cat's slot is reused.
const interrupted = scene()
const litigant = interrupted.spawn(unit('cat'), 300, 300)
const partner = interrupted.spawn(unit('toast'), 355, 300)
interrupted.cd[partner] = 100
interrupted.step()
for (let t = 0; t < 30; t++) interrupted.step()
assert.ok(interrupted.brawling(partner), 'interruption scene reached the brawl')
interrupted.hp[litigant] = 0.01
interrupted.burnT[litigant] = 1
interrupted.step()
interrupted.spawn(unit('cat'), 800, 300)
assert.ok(!interrupted.brawling(partner), 'dead/reused cat cannot leave a fighter trapped')

// Egg hatching reuses its slot; the new goose is not the cat's locked jump target.
const recycled = scene()
const jumper = recycled.spawn(unit('cat'), 300, 300)
const shell = recycled.spawn(unit('egg'), 365, 300)
recycled.cd[shell] = 100
recycled.step()
recycled.hp[shell] = 0.01
recycled.burnT[shell] = 1
recycled.step()
assert.equal(recycled.type[shell], unit('goose'), 'egg hatched in the old target slot')
const interruptedX = recycled.x[jumper]
recycled.step()
assert.ok(recycled.leapT[jumper] === 0 && recycled.x[jumper] === interruptedX, 'target replacement stops the leap with a landing in place')
for (let t = 0; t < 35; t++) recycled.step()
assert.ok(recycled.scrapT[jumper] === 0 && !recycled.brawling(shell), 'opening leap does not trap a recycled target')

const duvet = scene()
const sleeper = duvet.spawn(unit('bedrot'), 300, 300)
duvet.hp[sleeper] = 20
for (let t = 0; t < 60; t++) duvet.step()
assert.ok(duvet.hp[sleeper] > 27 && duvet.x[sleeper] === 300, 'bed rot recovers in place')

console.log(`ok: ${alive} survivors after ${sim.tick} ticks; roster expansion scenes passed`)

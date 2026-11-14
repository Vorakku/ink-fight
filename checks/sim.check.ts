// Self-check, no browser needed: `npm run check`
import assert from 'node:assert/strict'
import { BLUE, RED, Sim, TETHER_LEN } from '../src/game/sim.ts'
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

// Quirks phase 4: the cheese pull is now a strand that holds the victim close and drains it.
const cheese = scene()
const slice = cheese.spawn(unit('pizza'), 300, 300)
const topping = cheese.spawn(unit('toast'), 325, 300)
cheese.hp[slice] = 40
cheese.cd[slice] = 0
cheese.cd[topping] = 100
for (let t = 0; t < 10 && cheese.tetherT[slice] <= 0; t++) cheese.step()
assert.ok(cheese.tetherT[slice] > 0 && cheese.tethered(slice) === topping, 'a cheese slap ties the toast up')
cheese.x[topping] = cheese.x[slice] + 100 // try to wander off
cheese.step()
assert.ok(Math.hypot(cheese.x[topping] - cheese.x[slice], cheese.y[topping] - cheese.y[slice]) <= TETHER_LEN + 1, 'the strand pulls it back')
const drained = cheese.hp[slice]
for (let t = 0; t < 31; t++) cheese.step()
assert.ok(cheese.hp[slice] > drained, 'the pizza drinks through the strand')

// Quirks phase 3: mochi no longer pricks back. It takes the hit, stays put, and springs a hard hitter into the air.
const squish = scene()
const cushion = squish.spawn(unit('mochi'), 324, 300)
const puncher = squish.spawn(unit('gymbro'), 300, 300)
squish.cd[cushion] = 100
squish.cd[puncher] = 0
squish.step()
assert.ok(squish.hp[cushion] < UNITS[unit('mochi')].hp && squish.vx[cushion] < 20, 'mochi is hurt but not knocked back')
assert.ok(squish.airT[puncher] > 0 && squish.downT[puncher] > 0, 'gym bro is thrown by his own punch, and lands on his back')

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

// Fighter quirks, phase 1 (docs/fighter-quirks/phase-1-quick-wins.md). Each scene is in its own block.
{ // Honk: a peck that scares sends the victim running from the goose
  const def = UNITS[unit('goose')], chance = def.scare
  def.scare = 1
  const s = scene()
  const honker = s.spawn(unit('goose'), 300, 300), coward = s.spawn(unit('toast'), 318, 300)
  s.cd[honker] = 0
  s.cd[coward] = 100
  for (let t = 0; t < 30 && s.fearT[coward] <= 0; t++) s.step()
  assert.ok(s.fearT[coward] > 0, 'a peck scares the toast')
  const from = s.x[coward]
  for (let t = 0; t < 20; t++) s.step()
  def.scare = chance
  assert.ok(s.x[coward] > from + 5 && s.face[coward] === 1, 'the scared toast turns its back on the goose and runs')
}
{ // Nana: the handbag throws what it hits, but only shoves something far bigger than her
  const s = scene()
  const nana = s.spawn(unit('nana'), 300, 300), mail = s.spawn(unit('toast'), 318, 300)
  s.cd[nana] = 0
  s.cd[mail] = 100
  s.step()
  assert.ok(s.airT[mail] > 0, 'a handbag swing sends the toast through the air')
  const big = scene()
  const gran = big.spawn(unit('nana'), 300, 300), drake = big.spawn(unit('dragon'), 322, 300)
  big.cd[gran] = 0
  big.cd[drake] = 100
  big.step()
  assert.ok(big.hp[drake] < UNITS[unit('dragon')].hp && big.airT[drake] === 0, 'a dragon is hit but too big to throw')
}
{ // Reply Guy: skips the nearer toast for the toughest fighter in sight
  const s = scene()
  const guy = s.spawn(unit('replyguy'), 100, 300)
  s.spawn(unit('toast'), 220, 300)
  const boss = s.spawn(unit('dragon'), 600, 300)
  s.step()
  assert.equal(s.target[guy], boss, 'reply guy targets the dragon, not the closer toast')
}
{ // Touch Grass: plants bushes behind itself as it walks, and does not hide itself in them
  const s = scene()
  const walker = s.spawn(unit('touchgrass'), 100, 300)
  s.cd[s.spawn(unit('toast'), 900, 300)] = 100
  let exposed = false
  for (let t = 0; t < 180; t++) {
    s.step()
    if (s.bn > 0 && !s.hidden[walker]) exposed = true
  }
  assert.ok(s.bn > 0 && s.bT.subarray(0, s.bn).every((kind) => kind === 0), 'touch grass leaves bushes behind')
  assert.ok(exposed && s.x[walker] > 200, 'its own lawn does not stop it walking')
}
{ // Kaboom Pickle: the explosion leaves a puddle where it went off
  const s = scene()
  const bomb = unit('pickle')
  const fuse = s.spawn(bomb, 300, 300)
  s.cd[s.spawn(unit('toast'), 330, 300)] = 100
  let bx = 300, by = 300
  for (let t = 0; t < 120 && s.counts[bomb]; t++) {
    bx = s.x[fuse]
    by = s.y[fuse]
    s.step()
  }
  assert.ok(!s.counts[bomb] && s.inWater(bx, by), 'pickle explodes into a brine puddle')
}
{ // Pop Off: burning makes it fire kernels with nobody to aim at
  const def = UNITS[unit('popcorn')], rate = def.pops
  def.pops = 60 // one a tick, so the check does not depend on luck
  const s = scene()
  s.burnT[s.spawn(unit('popcorn'), 300, 300)] = 2
  s.step()
  def.pops = rate
  assert.ok(s.pn > 0, 'a burning popcorn pops without a target')
}

// Fighter quirks, phase 2 (docs/fighter-quirks/phase-2-timers-and-states.md).
{ // Sir Toast: the first fighter to hurt him is the only one he chases, until they are gone
  const s = scene()
  const sir = s.spawn(unit('toast'), 300, 300), clerk = s.spawn(unit('intern'), 480, 300)
  s.cd[clerk] = 0
  for (let t = 0; t < 120 && s.grow[sir] <= 0; t++) s.step()
  assert.ok(s.grow[sir] > 0, 'a staple starts the grudge')
  const pest = s.spawn(unit('goose'), s.x[sir] - 20, s.y[sir]) // right next to him, and ignored
  s.cd[pest] = 100
  for (let t = 0; t < 30; t++) s.step()
  assert.equal(s.target[sir], clerk, 'toast keeps after the intern with a goose at his elbow')
  s.hp[clerk] = 0.01
  s.burnT[clerk] = 1
  s.step()
  s.step()
  assert.ok(!s.alive[clerk] && s.grow[sir] === 0 && s.target[sir] !== clerk, 'the grudge cools off when the intern is gone')
}
{ // Mozzie: the sip that fills it up pops it, and the splash lands on the victim
  const s = scene()
  const def = UNITS[unit('mozzie')]
  const sipper = s.spawn(unit('mozzie'), 300, 300), meal = s.spawn(unit('toast'), 314, 300)
  s.grow[sipper] = def.swell! - 1
  s.cd[sipper] = 0
  s.cd[meal] = 100
  for (let t = 0; t < 10 && s.alive[sipper]; t++) s.step()
  assert.ok(!s.alive[sipper], 'a full mozzie pops')
  assert.ok(s.hp[meal] <= UNITS[unit('toast')].hp - def.dmg * 4 + 0.01, 'the pop splashes more than a bite')
}
{ // Gym Bro: a big shove puts him on his back, and he stays there after he lands
  const s = scene()
  const gran = s.spawn(unit('nana'), 300, 300), bro = s.spawn(unit('gymbro'), 318, 300)
  s.cd[gran] = 0
  s.cd[bro] = 100
  s.step()
  assert.ok(s.downT[bro] > 0 && s.airT[bro] > 0, 'the handbag topples him and throws him')
  for (let t = 0; t < 60 && s.airT[bro] > 0; t++) s.step()
  const at = s.x[bro]
  for (let t = 0; t < 20; t++) s.step()
  assert.ok(s.downT[bro] > 0 && Math.abs(s.x[bro] - at) < 3, 'he lies where he landed')
}
{ // Spit Llama: a hit leaves the victim with nobody to aim at
  const s = scene()
  const spitter = s.spawn(unit('llama'), 100, 300), wet = s.spawn(unit('toast'), 280, 300)
  s.cd[spitter] = 0
  s.cd[wet] = 100
  for (let t = 0; t < 180 && s.blindT[wet] <= 0; t++) s.step()
  assert.ok(s.blindT[wet] > 0, 'llama spit blinds the toast')
  s.step()
  assert.equal(s.target[wet], -1, 'a blind toast has no target, grudge or not')
}
{ // Boba Menace: a pearl drags its victim toward the cup
  const s = scene()
  const cup = s.spawn(unit('boba'), 100, 300), napper = s.spawn(unit('bedrot'), 280, 300)
  const full = UNITS[unit('bedrot')].hp
  s.cd[cup] = 0
  s.cd[napper] = 100
  for (let t = 0; t < 120 && s.hp[napper] >= full; t++) s.step()
  assert.ok(s.hp[napper] < full, 'a pearl lands')
  for (let t = 0; t < 5; t++) s.step()
  assert.ok(s.x[napper] < 279, 'and reels bed rot toward the cup')
}
{ // Depresso: the caffeine runs out and it sleeps where it stands
  const s = scene()
  const cup = s.spawn(unit('espresso'), 300, 300)
  s.cd[s.spawn(unit('toast'), 700, 300)] = 100
  s.moodT[cup] = 0.05
  for (let t = 0; t < 10; t++) s.step()
  assert.ok(s.moodT[cup] < 0, 'the crash arrives')
  const at = s.x[cup]
  for (let t = 0; t < 30; t++) s.step()
  assert.ok(s.moodT[cup] < 0 && Math.abs(s.x[cup] - at) < 2, 'and it stays put while asleep')
}

// Fighter quirks, phase 3 (docs/fighter-quirks/phase-3-interactions.md). The mochi scene is further up.
{ // Señor Chili: wildfire hops to whoever the burning fighter bumps into, but never onto a chili
  const s = scene()
  const lit = s.spawn(unit('toast'), 300, 300), next = s.spawn(unit('toast'), 305, 300)
  s.burnT[lit] = 2.5
  s.hot[lit] = 1
  s.step()
  assert.ok(s.burnT[next] > 0 && s.hot[next] === 1 && s.fearT[next] > 0, 'a burning toast lights the toast it bumps into, which panics')
  assert.ok(s.burnT[next] < s.burnT[lit], 'each hop burns shorter')
  const proof = scene()
  const torch = proof.spawn(unit('toast'), 300, 300), pepper = proof.spawn(unit('chili'), 305, 300)
  proof.burnT[torch] = 2.5
  proof.hot[torch] = 1
  proof.cd[torch] = proof.cd[pepper] = 100
  for (let t = 0; t < 3; t++) proof.step()
  assert.equal(proof.burnT[pepper], 0, 'a chili does not catch its own fire')
}
{ // Doomscroller: scrolling spreads by contact, then leaves a short immunity
  const s = scene()
  const first = s.spawn(unit('toast'), 300, 300), second = s.spawn(unit('toast'), 305, 300)
  s.phoneT[first] = 1.6
  s.step()
  assert.ok(s.phoneT[second] > 0, 'a scrolling toast hands the habit to the toast it bumps into')
  for (let t = 0; t < 150 && (s.phoneT[first] > 0 || s.phoneT[second] > 0); t++) s.step()
  assert.ok(s.phoneT[first] < 0 && s.phoneT[second] < 0, 'both put the phone down and are immune for a moment')
  s.phoneT[first] = 1.6
  s.x[second] = s.x[first] + 5 // shove them back together
  s.step()
  assert.ok(s.phoneT[second] <= 0, 'an immune toast does not catch it again')
}
{ // Toddler: a hit becomes a leg-hug, and the toddler rides along wherever the leg goes
  const def = UNITS[unit('toddler')], chance = def.latch
  def.latch = 1
  const s = scene()
  const kid2 = s.spawn(unit('toddler'), 300, 300), leg = s.spawn(unit('toast'), 316, 300)
  s.cd[kid2] = 0
  s.cd[leg] = 100
  for (let t = 0; t < 30 && s.latchT[kid2] <= 0; t++) s.step()
  def.latch = chance
  assert.ok(s.latchT[kid2] > 0, 'the toddler grabs a leg')
  for (let t = 0; t < 20; t++) {
    s.vx[leg] = 200 // drag the toast away
    s.step()
  }
  assert.ok(s.latchT[kid2] > 0 && Math.hypot(s.x[kid2] - s.x[leg], s.y[kid2] - s.y[leg]) < 15 && s.slowT[leg] > 0, 'and is dragged along, slowing it')
}
{ // Main Character: a pose pulls nearby enemies off their own targets
  const s = scene()
  const star = s.spawn(unit('maincharacter'), 300, 300)
  const bait = s.spawn(unit('goose'), 330, 300) // close enough to pose at
  const fanA = s.spawn(unit('toast'), 390, 275), fanB = s.spawn(unit('toast'), 390, 325)
  const rival = s.spawn(unit('intern'), 430, 300) // nearer to the toasts than she is
  s.cd[star] = 100
  s.cd[bait] = s.cd[fanA] = s.cd[fanB] = s.cd[rival] = 100
  s.step()
  assert.ok(s.target[fanA] === rival && s.target[fanB] === rival, 'the toasts start out after the intern')
  s.cd[star] = 0
  s.step()
  assert.ok(s.spotT[fanA] > 0 && s.target[fanA] === star && s.target[fanB] === star, 'her pose turns both toasts toward her')
}

// Fighter quirks, phase 4 (docs/fighter-quirks/phase-4-bigger-builds.md). The cheese scene is further up.
{ // Sandal Dad: throws his only sandal, then has to go and pick it up
  const s = scene()
  const pops = s.spawn(unit('dad'), 100, 300), napper = s.spawn(unit('bedrot'), 220, 300)
  s.cd[napper] = 1e9 // a passive target, so dad lives to fetch
  s.cd[pops] = 0
  s.step()
  assert.equal(s.away[pops], 1, 'the sandal is in the air')
  let landed = false
  for (let t = 0; t < 360 && s.away[pops]; t++) {
    s.step()
    if (s.away[pops] === 2) landed = true
  }
  assert.ok(landed && s.away[pops] === 0, 'it lands, and dad hops over and picks it up')
}
{ // Flapjack: losing a third of its health drops a pancake into a syrup spot
  const s = scene()
  const def = UNITS[unit('pancake')]
  const jack = s.spawn(unit('pancake'), 300, 300)
  assert.equal(s.layers[jack], 3, 'starts three pancakes tall')
  s.hp[jack] = def.hp * 0.6
  s.step()
  assert.ok(s.layers[jack] === 2 && s.bT.subarray(0, s.bn).some((kind) => kind === 2), 'one pancake falls off as syrup')
  const toast = s.spawn(unit('toast'), s.bX[s.bn - 1], s.bY[s.bn - 1])
  s.step()
  assert.ok(s.slowT[toast] > 0, 'the syrup gums up whoever walks through it')
}
{ // Spike: hurt and crowded, he curls up and rolls through them
  const s = scene()
  const def = UNITS[unit('hedgehog')]
  const ball = s.spawn(unit('hedgehog'), 300, 300)
  s.hp[ball] = def.hp * 0.3
  const pins = [s.spawn(unit('toast'), 340, 300), s.spawn(unit('toast'), 300, 345), s.spawn(unit('toast'), 260, 300)]
  for (const p of pins) s.cd[p] = 100
  let rolled = false
  for (let t = 0; t < 60; t++) {
    s.step()
    if (s.rollT[ball] > 0) rolled = true
  }
  assert.ok(rolled, 'spike curls up and rolls')
  assert.ok(pins.some((p) => !s.alive[p] || s.hp[p] < UNITS[unit('toast')].hp), 'and bowls into a toast')
}
{ // Stinky: sprays a cloud that hurts enemies and shoves them out of it, and survives doing it
  const s = scene()
  const skunk = s.spawn(unit('skunk'), 300, 300), nose = s.spawn(unit('toast'), 330, 300)
  s.cd[nose] = 100
  for (let t = 0; t < 10 && !s.kLife.some((l) => l > 0); t++) s.step()
  const k = s.kLife.findIndex((l) => l > 0)
  assert.ok(k >= 0 && s.alive[skunk], 'the skunk sprays and is still standing')
  const hp = s.hp[nose], far = Math.hypot(s.x[nose] - s.kX[k], s.y[nose] - s.kY[k])
  for (let t = 0; t < 40; t++) s.step()
  assert.ok(s.hp[nose] < hp && Math.hypot(s.x[nose] - s.kX[k], s.y[nose] - s.kY[k]) > far, 'the toast is hurt and pushed out of the cloud')
}
{ // Unpaid Intern: a kill gets him promoted, and he hurries the intern next to him along
  const def = UNITS[unit('intern')], need = def.promote
  def.promote = 1
  const s = scene()
  const boss = s.spawn(unit('intern'), 100, 300), staff = s.spawn(unit('intern'), 100, 340)
  const victim = s.spawn(unit('goose'), 200, 300)
  s.hp[victim] = 1
  s.cd[boss] = 0
  s.cd[staff] = 100
  s.cd[victim] = 100
  for (let t = 0; t < 60 && s.alive[victim]; t++) s.step()
  assert.ok(!s.alive[victim] && s.grow[boss] >= 1, 'the first intern gets the kill')
  s.step()
  def.promote = need
  assert.equal(s.bossTick[staff], s.tick - 1, 'the new manager hurries the other intern')
}

// Teams: same type on opposite sides fights; different types on one side don't; free-for-all is the default.
{
  const s = scene(), toast = unit('toast')
  const a = s.spawn(toast, 400, 300, RED), b = s.spawn(toast, 440, 300, BLUE)
  for (let t = 0; t < 30; t++) s.step()
  assert.equal(s.target[a], b, 'a red toast fights a blue toast')
  assert.equal(s.teamCounts[RED], 1, 'one red on the page')
  assert.equal(s.teamCounts[BLUE], 1, 'one blue on the page')
}
{
  const s = scene(), a = s.spawn(unit('toast'), 400, 300, RED), b = s.spawn(unit('goose'), 440, 300, RED)
  for (let t = 0; t < 60; t++) s.step()
  assert.equal(s.target[a], -1, 'teammates of different types leave each other alone')
  assert.equal(s.hp[b], UNITS[unit('goose')].hp, 'and nobody gets hurt')
}
{
  const s = scene(), a = s.spawn(unit('toast'), 400, 300), b = s.spawn(unit('toast'), 440, 300)
  assert.equal(s.team[a], 2 + unit('toast'), 'spawn defaults to free-for-all')
  for (let t = 0; t < 30; t++) s.step()
  assert.equal(s.target[a], -1, 'two free-for-all toasts are still one side')
  const r = s.spawn(unit('goose'), 420, 330, RED)
  for (let t = 0; t < 30; t++) s.step()
  assert.notEqual(s.target[r], -1, 'a red fighter fights free-for-all fighters')
  assert.equal(s.team[b], 2 + unit('toast'), 'free-for-all keeps its type as its side')
}
// Projectiles carry the shooter's side.
{
  const s = scene()
  s.spawn(unit('archerfish'), 100, 300, BLUE)
  const mate = s.spawn(unit('toast'), 500, 300, BLUE)
  for (let t = 0; t < 120; t++) s.step()
  assert.equal(s.hp[mate], UNITS[unit('toast')].hp, 'no spitting at a teammate')
  const foe = s.spawn(unit('toast'), 500, 360, RED)
  for (let t = 0; t < 180; t++) s.step()
  assert.ok(s.hp[foe] < UNITS[unit('toast')].hp || !s.alive[foe], 'spits at the red one')
}
// A hatched goose keeps its egg's side.
{
  const s = scene(), egg = s.spawn(unit('egg'), 400, 300, BLUE)
  s.hp[egg] = 0.01
  s.spawn(unit('toast'), 415, 300, RED)
  for (let t = 0; t < 120 && s.type[egg] === unit('egg'); t++) s.step()
  assert.equal(s.type[egg], unit('goose'), 'the egg hatched into its own slot')
  assert.equal(s.team[egg], BLUE, 'and the goose is still blue')
}
// Frozen pops settle; clear empties the team tally.
{
  const s = scene(), a = s.spawn(unit('toast'), 400, 300, RED)
  for (let t = 0; t < 30; t++) s.settle()
  assert.equal(s.hitT[a], 0, 'a fighter placed during setup settles to normal size')
  assert.equal(s.x[a], s.px[a], 'and settle() moves nobody')
  s.clear()
  assert.equal(s.teamCounts[RED], 0, 'clear empties the team tally')
}

console.log(`ok: ${alive} survivors after ${sim.tick} ticks; roster expansion and phase 1-4 quirk and team scenes passed`)

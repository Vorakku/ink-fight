// Unrun. Run only with owner permission: node checks/aquatics.check.ts
import assert from 'node:assert/strict'
import { BLUE, RED, Sim } from '../src/game/sim.ts'
import { UNITS } from '../src/game/units.ts'

const unit = (key: string) => {
  const t = UNITS.findIndex((u) => u.key === key)
  assert.ok(t >= 0, `missing ${key}`)
  return t
}
const scene = () => { const s = new Sim(); s.resize(1200, 700); return s }
const advance = (s: Sim, ticks: number) => { for (let t = 0; t < ticks; t++) s.step() }
const pond = (s: Sim, x: number, y: number, radius = 100) => {
  for (let dy = -radius; dy <= radius; dy += 20) for (let dx = -radius; dx <= radius; dx += 20) {
    if (dx * dx + dy * dy <= radius * radius) s.addTerrain(x + dx, y + dy, 1)
  }
}

{ // Inflation shoves only enemies, then needs to deflate before another shove.
  const s = scene(), p = s.spawn(unit('pufferfish'), 300, 300, RED)
  const foe = s.spawn(unit('toast'), 340, 300, BLUE), friend = s.spawn(unit('toast'), 340, 310, RED)
  s.buildGrid()
  s.damage(p, 10, 0, 0, foe)
  assert.ok(s.vx[foe] > 250)
  assert.equal(s.vx[friend], 0)
  const shove = s.vx[foe]
  s.damage(p, 10, 0, 0, foe)
  assert.equal(s.vx[foe], shove, 'repeated hits do not repeat inflation while inflated')
  for (let t = 0; t < 181; t++) s.aquatics.step()
  s.damage(p, 10, 0, 0, foe)
  assert.ok(s.vx[foe] > shove)
}

{ // An octopus leaves enemy-only blindness behind and actually jets through its pond.
  const s = scene(); pond(s, 300, 300)
  const o = s.spawn(unit('octopus'), 300, 300, RED)
  const foe = s.spawn(unit('toast'), 335, 300, BLUE), ally = s.spawn(unit('toast'), 310, 320, RED)
  s.buildGrid()
  assert.equal(s.aquatics.steer(o, foe), true)
  s.aquatics.step()
  assert.ok(s.blindT[foe] > 0)
  assert.equal(s.blindT[ally], 0)
  const x = s.x[o], y = s.y[o]
  advance(s, 12)
  assert.ok(Math.hypot(s.x[o] - x, s.y[o] - y) > 15)
  assert.ok(s.inWater(s.x[o], s.y[o]))
  s.shockT[o] = 1; s.step()
  assert.equal(s.aquatics.jet[o], 0, 'stun cancels the escape')
}

{ // A charged bubble passes allies and throws its first enemy.
  const s = scene(); pond(s, 300, 300)
  const shrimp = s.spawn(unit('pistolshrimp'), 300, 300, RED)
  const foe = s.spawn(unit('giant'), 390, 300, BLUE), ally = s.spawn(unit('bedrot'), 345, 300, RED)
  s.shockT[foe] = 10; s.cd[foe] = 100
  const hp = s.hp[foe], friendlyHp = s.hp[ally]
  s.buildGrid(); s.attack(shrimp, foe, 1, 0)
  assert.equal(s.hp[foe], hp, 'charging itself deals no damage')
  advance(s, 60)
  assert.ok(s.hp[foe] < hp)
  assert.ok(s.airT[foe] > 0, 'the bubble launches a bowling victim')
  assert.equal(s.hp[ally], friendlyHp)
}

{ // A disabled shrimp cannot finish a wind-up, and a recycled target is a different fighter.
  const s = scene(), shrimp = s.spawn(unit('pistolshrimp'), 300, 300, RED)
  const foe = s.spawn(unit('toast'), 400, 300, BLUE)
  s.buildGrid(); s.attack(shrimp, foe, 1, 0)
  s.shockT[shrimp] = 1; s.step()
  assert.equal(s.aquatics.wind[shrimp], 0)
  assert.equal(s.aquatics.snaps.length, 0)
  s.shockT[shrimp] = 0
  s.attack(shrimp, foe, 1, 0)
  s.damage(foe, Infinity, 0, 0)
  const replacement = s.spawn(unit('toast'), 400, 300, BLUE)
  assert.equal(replacement, foe)
  s.aquatics.steer(shrimp, replacement)
  assert.equal(s.aquatics.wind[shrimp], 0)
  assert.equal(s.aquatics.snaps.length, 0)
}

{ // Clickbait draws one enemy toward its pond; death releases the charm immediately.
  const s = scene(), a = s.spawn(unit('anglerfish'), 300, 300, RED)
  const foe = s.spawn(unit('toast'), 410, 300, BLUE), friend = s.spawn(unit('toast'), 360, 310, RED)
  s.buildGrid(); s.aquatics.steer(a, foe)
  assert.ok(s.lureT[foe] > 0)
  assert.equal(s.lureT[friend], 0)
  assert.equal(s.lureX[foe], s.x[a])
  const before = s.x[foe]
  advance(s, 25)
  assert.ok(s.x[foe] < before)
  s.damage(a, Infinity, 0, 0, foe)
  assert.equal(s.lureT[foe], 0)
}

{ // Two claws carry two living enemies, collide them, and release both on interruption.
  const s = scene(), crab = s.spawn(unit('crab'), 300, 300, RED)
  const a = s.spawn(unit('toast'), 325, 300, BLUE), b = s.spawn(unit('toast'), 275, 300, BLUE)
  s.buildGrid(); s.attack(crab, a, 1, 0); s.attack(crab, b, -1, 0)
  assert.equal(s.heldBy[a], crab); assert.equal(s.heldBy[b], crab)
  const ahp = s.hp[a], bhp = s.hp[b]
  s.aquatics.steer(crab, -1); s.aquatics.afterMove()
  assert.ok(s.hp[a] < ahp && s.hp[b] < bhp)
  s.stopMoves(crab)
  assert.equal(s.heldBy[a], -1); assert.equal(s.heldBy[b], -1)
  const giant = s.spawn(unit('giant'), 325, 300, BLUE)
  s.buildGrid(); s.attack(crab, giant, 1, 0)
  assert.equal(s.heldBy[giant], -1, 'large fighters resist carrying')
}

{ // A dead passenger's reused slot cannot remain in a claw; killing the crab frees the other.
  const s = scene(), crab = s.spawn(unit('crab'), 300, 300, RED)
  const a = s.spawn(unit('toast'), 325, 300, BLUE), b = s.spawn(unit('toast'), 275, 300, BLUE)
  s.buildGrid(); s.attack(crab, a, 1, 0); s.attack(crab, b, -1, 0)
  s.damage(a, Infinity, 0, 0)
  const newA = s.spawn(unit('toast'), 900, 300, BLUE)
  assert.equal(newA, a)
  s.aquatics.step(); s.aquatics.afterMove()
  assert.equal(s.heldBy[newA], -1)
  assert.equal(s.x[newA], 900)
  s.damage(crab, Infinity, 0, 0)
  assert.equal(s.heldBy[b], -1)
}

{ // Sharks choose wounded prey even when a healthy enemy is closer.
  const s = scene(), shark = s.spawn(unit('shark'), 300, 300, RED)
  s.spawn(unit('toast'), 335, 300, BLUE)
  const wounded = s.spawn(unit('giant'), 430, 300, BLUE)
  s.hp[wounded] = 100
  s.buildGrid()
  assert.equal(s.findTarget(shark), wounded)
}

{ // A missed lunge can beach the shark briefly, then returns it to its launching pond.
  const s = scene(), shark = s.spawn(unit('shark'), 300, 300, RED)
  const foe = s.spawn(unit('toast'), 425, 300, BLUE)
  s.cd[shark] = 0; s.buildGrid(); s.aquatics.steer(shark, foe)
  s.x[foe] = s.px[foe] = 900; s.shockT[foe] = 10
  advance(s, 30)
  assert.ok(s.aquatics.flop[shark] > 0)
  assert.equal(s.inWater(s.x[shark], s.y[shark]), false)
  advance(s, 110)
  assert.ok(s.inWater(s.x[shark], s.y[shark]))
  assert.equal(s.aquatics.flop[shark], 0)
}

{ // Detached limbs heal only on recovery; enemy feet deny the heal.
  const s = scene(), a = s.spawn(unit('axolotl'), 300, 300, RED)
  s.buildGrid(); s.damage(a, 20, 0, 0)
  assert.equal(s.aquatics.limbs.length, 1)
  for (let t = 0; t < 60; t++) s.aquatics.afterMove()
  assert.equal(s.hp[a], UNITS[unit('axolotl')].hp - 2)
  assert.equal(s.aquatics.limbs.length, 0)
  s.damage(a, 20, 0, 0)
  const limb = s.aquatics.limbs[0], hp = s.hp[a]
  s.spawn(unit('toast'), limb.x, limb.y, BLUE)
  s.buildGrid(); s.aquatics.afterMove()
  assert.equal(s.aquatics.limbs.length, 0)
  assert.equal(s.hp[a], hp)
}

{ // Limb ownership cannot transfer to a replacement in a dead axolotl's slot; Clear removes effects.
  const s = scene(), a = s.spawn(unit('axolotl'), 300, 300, RED)
  s.buildGrid(); s.damage(a, 20, 0, 0); s.damage(a, Infinity, 0, 0)
  const replacement = s.spawn(unit('axolotl'), 300, 300, RED)
  assert.equal(replacement, a)
  s.damage(replacement, 5, 0, 0)
  const hp = s.hp[replacement]
  s.aquatics.afterMove()
  assert.equal(s.hp[replacement], hp)
  assert.equal(s.aquatics.limbs.length, 0)
  s.clear()
  assert.equal(s.aquatics.inks.length + s.aquatics.snaps.length + s.aquatics.limbs.length, 0)
  assert.equal(s.aquatics.claws.some((j) => j >= 0), false)
}

console.log('Water fighter scenes passed')

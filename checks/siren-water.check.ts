import assert from 'node:assert/strict'
import { Battle } from '../src/game/battle.ts'
import { WaterTerrain } from '../src/game/terrain.ts'

// Run only with the owner's permission.
{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const siren = battle.spawn(400, 400, 'red', 'siren')!
  const enemy = battle.spawn(550, 400, 'blue', 'thor')!
  const ally = battle.spawn(540, 440, 'red')!
  ally.stun = 100
  enemy.lightning = { target: siren, time: 0.7 }
  battle.step()
  assert.equal(enemy.lure?.owner, siren, 'The ballad charms enemies in range')
  assert.equal(enemy.lightning, null, 'Charm interrupts a charged attack')
  assert.ok(enemy.x < 550, 'Charmed enemies walk toward the singer')
  assert.equal(enemy.hp, 600, 'The ballad does not damage its audience')
  assert.equal(ally.lure, null, 'The ballad spares allies')
  siren.hp = 0
  battle.step()
  assert.equal(enemy.lure, null, 'The spell ends when the singer dies')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const siren = battle.spawn(400, 400, 'red', 'siren')!
  const near = battle.spawn(460, 400, 'blue', 'thor')!
  const far = battle.spawn(550, 400, 'blue', 'thor')!
  const ally = battle.spawn(400, 440, 'red')!
  near.stun = far.stun = ally.stun = 100
  for (let i = 0; i < 150; i++) battle.step()
  assert.ok(siren.song > 0, 'A nearby audience triggers death metal after the opening ballad')
  assert.ok(near.hp < 600, 'Death metal damages the nearby crowd')
  assert.equal(near.lure, null, 'Death metal lets enemies fight back')
  assert.equal(far.hp, 600, 'Death metal only reaches the mosh pit')
  assert.equal(ally.hp, 45, 'Death metal spares teammates')
  near.hp = far.hp = 0
  for (let i = 0; i < 190; i++) battle.step()
  assert.ok(siren.song <= 0, 'Death metal returns to ballad mode after three seconds')
  battle.clear()
  assert.equal(siren.song, 0)
}

{
  const water = new WaterTerrain()
  water.resize(800, 600)
  water.paint(100, 100)
  assert.ok(water.inWater(100, 100), 'Painted terrain becomes water')
  assert.ok(!water.inWater(200, 100), 'Dry paper remains dry')
  water.resize(1000, 700)
  assert.ok(water.inWater(100, 100), 'Resizing retains painted water')
  assert.ok(!water.inWater(-1, 100))
  water.clear()
  assert.ok(!water.inWater(100, 100), 'Clear removes terrain')
}

for (const species of ['goose', 'siren'] as const) {
  const distances: number[] = []
  for (const wet of [false, true]) {
    const battle = new Battle(() => 0.99)
    battle.resize(1000, 700)
    const fighter = battle.spawn(300, 400, 'red', species)!
    const enemy = battle.spawn(350, 400, 'blue', 'thor')!
    enemy.stun = 100
    fighter.fear = 2
    fighter.scaredBy = enemy
    if (wet) battle.water.paint(300, 400)
    battle.step()
    distances.push(300 - fighter.x)
  }
  assert.ok(distances[0] > 0)
  assert.ok(Math.abs(distances[1] / distances[0] - (species === 'siren' ? 1 : 0.5)) < 0.001,
    'Water halves land movement while the siren swims at normal speed')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const siren = battle.spawn(300, 400, 'red', 'siren')!
  assert.ok(battle.water.inWater(siren.x, siren.y), 'Dry placement creates a pond at the siren')
  const enemy = battle.spawn(650, 400, 'blue', 'thor')!
  enemy.stun = 100
  siren.target = enemy
  for (let i = 0; i < 300; i++) {
    battle.step()
    assert.ok(battle.water.inWater(siren.x, siren.y), 'Pursuit cannot leave the pond')
  }
  assert.ok(siren.x < 340, 'The siren stops at the original shore')
  assert.ok(!battle.water.inWater(400, 400), 'Movement does not paint a water trail')
  siren.vx = -2400
  siren.fear = 2
  siren.scaredBy = enemy
  for (let i = 0; i < 30; i++) {
    battle.step()
    assert.ok(battle.water.inWater(siren.x, siren.y), 'Fear and knockback cannot push her onto paper')
  }
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const siren = battle.spawn(300, 400, 'red', 'siren')!
  battle.water.paint(500, 400)
  const rex = battle.spawn(650, 400, 'blue', 'rex')!
  rex.stun = 100
  siren.thrown = { owner: rex, time: 0.5 }
  siren.vx = 12000
  battle.step()
  assert.ok(siren.x < 340, 'A throw cannot jump a dry gap into a separate pond')
  assert.ok(battle.water.inWater(siren.x, siren.y))
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const siren = battle.spawn(300, 400, 'red', 'siren')!
  const rex = battle.spawn(300, 400, 'red', 'rex')!
  rex.stun = 100
  for (let i = 0; i < 30; i++) {
    battle.step()
    assert.ok(battle.water.inWater(siren.x, siren.y), 'Crowd separation keeps the siren in water')
  }
  rex.grab = { target: siren, time: 1 }
  siren.heldBy = rex
  rex.x = 600
  battle.step()
  rex.hp = 0
  battle.step()
  assert.equal(siren.heldBy, null)
  assert.ok(battle.water.inWater(siren.x, siren.y), 'Release from a dead holder returns her to water')
}

{
  const battle = new Battle(() => 0.99)
  battle.resize(1200, 800)
  const siren = battle.spawn(1000, 700, 'red', 'siren')!
  battle.resize(200, 120)
  assert.ok(siren.x <= 200 && siren.y <= 120, 'Resize keeps the siren on the battlefield')
  assert.ok(battle.water.inWater(siren.x, siren.y), 'Resize supplies a pond when the old one is off-screen')
}

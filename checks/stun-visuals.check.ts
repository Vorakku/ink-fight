// Run only with the owner's permission: node checks/stun-visuals.check.ts
import assert from 'node:assert/strict'
import { Battle, DT, renderBattle, type Fighter } from '../src/game/battle.ts'
import { buildSprites, type Species } from '../src/game/units.ts'

// Record real renderer output at the Canvas boundary; no browser or pixel library required.
function canvas() {
  const drawn: unknown[] = []
  let stars = 0
  const element = { width: 1200, height: 800, getContext: () => context }
  const properties: Record<string, unknown> = { canvas: element, globalAlpha: 1 }
  const stack: Record<string, unknown>[] = []
  const context = new Proxy(properties, {
    get(target, key: string) {
      if (key === 'drawImage') return (source: unknown) => drawn.push(source)
      if (key === 'fill') return () => { if (target.fillStyle === '#ffd23f') stars++ }
      if (key === 'save') return () => stack.push({ ...target })
      if (key === 'restore') return () => Object.assign(target, stack.pop())
      if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => ({ addColorStop() {} })
      return key in target ? target[key] : () => {}
    },
  })
  return { element, context: context as unknown as CanvasRenderingContext2D, drawn, stars: () => stars }
}

const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => canvas().element } })
try {
  const sprites = buildSprites()
  const scene = (species: Species = 'spartan') => {
    const battle = new Battle(() => 0.99)
    battle.resize(1200, 800)
    const owner = battle.spawn(300, 400, 'red', species)!
    const victim = battle.spawn(320, 400, 'blue', 'goose')!
    victim.hp = 1000
    const api = battle as unknown as {
      spartanAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
      rexThrowImpact(owner: Fighter, target: Fighter): void
      fireAttack(owner: Fighter, target: Fighter, nx: number, ny: number): void
      dragonChain(owner: Fighter, target: Fighter): void
      stepLightningCharge(owner: Fighter): boolean
      stepLightning(): void
      releaseLightningSword(owner: Fighter, angle: number): void
      stepLightningWaves(): void
      turnZombie(fighter: Fighter, team: 'blue'): void
    }
    return { battle, owner, victim, api }
  }
  const render = (battle: Battle) => {
    const output = canvas()
    renderBattle(output.context, battle, sprites, 1)
    return output
  }
  const skeleton = sprites.goose.blue.shocked

  // Regression: colored nest progress/health bars must not stop the animation loop.
  for (const team of ['red', 'blue', 'ffa'] as const) {
    const battle = new Battle()
    battle.resize(1200, 800)
    const nest = battle.spawn(500, 400, team, 'dragon-nest')!
    assert.doesNotThrow(() => render(battle), `${team} nest construction renders`)
    nest.nest!.time = 3
    nest.hp -= 100
    assert.doesNotThrow(() => render(battle), `${team} nest damage renders`)
  }

  // Regression: a real Spartan bash must display stun stars, never lightning bones.
  {
    const { battle, owner, victim, api } = scene()
    api.spartanAttack(owner, victim, 1, 0)
    assert.ok(victim.stun > 0)
    const output = render(battle)
    assert.equal(output.drawn.includes(skeleton), false, 'A physical shield bash must not draw the lightning skeleton')
    assert.ok(output.stars() > 0, 'Ordinary stun displays yellow stars')
    assert.equal(victim.shock, 0)
  }
  {
    const { battle, owner, victim, api } = scene('rex')
    api.rexThrowImpact(owner, victim)
    assert.ok(victim.stun > 0)
    assert.equal(victim.shock, 0)
    assert.equal(render(battle).drawn.includes(skeleton), false)
  }
  {
    const { battle, owner, victim } = scene()
    owner.hp = 0
    victim.elevation = 5; victim.falling = true
    battle.step(); battle.step()
    assert.ok(victim.stun > 0)
    assert.equal(victim.shock, 0)
    const output = render(battle)
    assert.equal(output.drawn.includes(skeleton), false)
    assert.ok(output.stars() > 0)
  }

  // Damage-only lightning shots flash bones without acquiring a new gameplay stun.
  {
    const { battle, owner, victim, api } = scene('thor')
    owner.lightning = { target: victim, time: 0 }
    api.stepLightningCharge(owner)
    assert.ok(victim.shock > 0)
    assert.equal(victim.stun, 0)
    assert.equal(render(battle).drawn.includes(skeleton), true)
    const shock = victim.shock
    render(battle); render(battle)
    assert.equal(victim.shock, shock, 'Rendering while paused never advances the timer')
    victim.stun = 2
    owner.stun = 100
    for (let i = 0; i < Math.ceil(shock / DT) + 2; i++) battle.step()
    assert.equal(victim.shock, 0)
    assert.ok(victim.stun > 0, 'Physical stun can outlast the independent electric flash')
    const output = render(battle)
    assert.equal(output.drawn.includes(skeleton), false)
    assert.ok(output.stars() > 0)
  }

  // Lightning storms retain their gameplay stun and get the electrical overlay.
  {
    const { battle, owner, victim, api } = scene('thor')
    battle.storms.push({ owner, x: victim.x, y: victim.y, elevation: 0, time: 0, phase: 'warning' })
    api.stepLightning()
    assert.ok(victim.stun > 1)
    assert.ok(victim.shock > 1)
    const output = render(battle)
    assert.equal(output.drawn.includes(skeleton), true)
    assert.equal(output.stars(), 0)
  }

  // Only the electric Dragon breath flashes bones; chain and sword hits do too.
  for (const form of [0, 1, 2, 3] as const) {
    const { battle, owner, victim, api } = scene('dragon')
    owner.dragonForm = form
    owner.skillCooldown = 100
    api.fireAttack(owner, victim, 1, 0)
    assert.equal(victim.shock > 0, form === 2)
    assert.equal(render(battle).drawn.includes(skeleton), form === 2)
  }
  for (const attack of ['chain', 'sword', 'wave'] as const) {
    const { battle, owner, victim, api } = scene('dragon')
    owner.dragonForm = 2
    if (attack === 'chain') api.dragonChain(owner, victim)
    else {
      if (attack === 'wave') victim.x = 650
      api.releaseLightningSword(owner, 0)
      if (attack === 'wave') {
        assert.equal(victim.shock, 0, 'Distant targets wait for the wave to reach them')
        for (let i = 0; i < 100 && victim.hp === 1000; i++) api.stepLightningWaves()
      }
    }
    assert.ok(victim.hp < 1000)
    assert.ok(victim.shock > 0, attack)
    assert.equal(render(battle).drawn.includes(skeleton), true, attack)
  }

  // Freezing overrides both reactions; conversion, rebirth and Clear remove old flashes.
  {
    const { battle, victim, api } = scene()
    victim.stun = victim.shock = victim.frozen = 1
    const output = render(battle)
    assert.equal(output.drawn.includes(skeleton), false)
    assert.equal(output.stars(), 0)
    api.turnZombie(victim, 'blue')
    assert.equal(victim.shock, 0)
    const phoenix = battle.spawn(700, 400, 'red', 'phoenix')!
    phoenix.shock = 1; phoenix.hp = 0
    battle.step()
    assert.equal(phoenix.stage, 'egg')
    assert.equal(phoenix.shock, 0)
    victim.shock = 1
    battle.clear()
    assert.equal(victim.shock, 0)
    assert.equal(battle.spawn(500, 500, 'red')!.shock, 0)
  }
  console.log('Stun/lightning rendering checks passed')
} finally {
  if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
  else Reflect.deleteProperty(globalThis, 'document')
}

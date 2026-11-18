import { buildShockedSprite } from './art.ts'
import { buildGooseSprite, GOOSE } from './goose.ts'
import { buildThorSprite, THOR } from './thor.ts'
import { buildRexParts, buildRexSprite, buildRexEggSprite, TREX, TREX_EGG, type RexForm } from './rex.ts'
import { buildPhoenixSprite, PHOENIX, PHOENIX_FORMS, type PhoenixForm } from './phoenix.ts'
import { buildDragonSprite, buildDragonNestSprite, buildDragonEggSprite, buildSleepingDragonSprite, DRAGON, DRAGON_FORMS, DRAGON_NEST, DRAGON_EGG, type DragonForm } from './dragon.ts'
import { buildSirenSprite, SIREN } from './siren.ts'
import { buildNinjaSprite, NINJA } from './ninja.ts'
import { buildSpartanSprite, SPARTAN } from './spartan.ts'
import { buildCavalryFootSprite, buildCavalryFrames, buildCavalrySprite, CAVALRY } from './cavalry.ts'
import { buildMantisSprite, buildMantisShedSprite, MANTIS, type MantisForm } from './mantis.ts'
import { buildZombieSprite, buildZombieVariant, ZOMBIE } from './zombie.ts'
import { buildVampireSprite, VAMPIRE } from './vampire.ts'
import { buildSwordSaintSprite, SWORD_SAINT } from './swordsaint.ts'
import { buildYanDemonSprite, buildYanJinSprite, YAN_JIN } from './yanjin.ts'
import { buildMengChuanSprite, buildMengDevilSprite, MENG_CHUAN, MENG_DEVIL } from './mengchuan.ts'
import { buildFoxSpiritSprite, buildMeiSprite, MEI_SPIRIT, MEI_YUANZHI } from './meiyuanzhi.ts'
import { ANT, ANTHILL, ANT_QUEEN, ANT_TANK, ANT_SLASHER, ANT_FLY, buildAntSprite, buildAnthillSprite, buildAntQueenSprite, buildAntTankSprite, buildAntSlasherSprite, buildAntFlySprite } from './ant.ts'

export type Team = 'red' | 'blue' | 'ffa'
export const TEAM_COLORS = { red: '#e5484d', blue: '#3e7bfa' } as const
export const UNITS = {
  goose: { ...GOOSE, size: 1, color: '#9aa7b8', buildSprite: buildGooseSprite },
  thor: { ...THOR, scare: 0, buildSprite: buildThorSprite },
  rex: { ...TREX, scare: 0, buildSprite: buildRexSprite },
  'rex-egg': { ...TREX_EGG, scare: 0, buildSprite: buildRexEggSprite },
  phoenix: { ...PHOENIX, scare: 0, buildSprite: buildPhoenixSprite },
  dragon: { ...DRAGON, scare: 0, buildSprite: buildDragonSprite },
  siren: { ...SIREN, scare: 0, buildSprite: buildSirenSprite },
  ninja: { ...NINJA, scare: 0, buildSprite: buildNinjaSprite },
  spartan: { ...SPARTAN, scare: 0, buildSprite: buildSpartanSprite },
  cavalry: { ...CAVALRY, scare: 0, buildSprite: buildCavalrySprite },
  mantis: { ...MANTIS, scare: 0, buildSprite: buildMantisSprite },
  zombie: { ...ZOMBIE, buildSprite: buildZombieSprite },
  vampire: { ...VAMPIRE, scare: 0, buildSprite: buildVampireSprite },
  swordsaint: { ...SWORD_SAINT, scare: 0, buildSprite: buildSwordSaintSprite },
  meiyuanzhi: { ...MEI_YUANZHI, scare: 0, buildSprite: buildMeiSprite },
  'mei-fox': { ...MEI_SPIRIT, buildSprite: buildFoxSpiritSprite },
  yanjin: { ...YAN_JIN, scare: 0, buildSprite: buildYanJinSprite },
  mengchuan: { ...MENG_CHUAN, scare: 0, buildSprite: buildMengChuanSprite },
  'meng-devil': { ...MENG_DEVIL, buildSprite: buildMengDevilSprite },
  ant: { ...ANT, scare: 0, buildSprite: buildAntSprite },
  anthill: { ...ANTHILL, scare: 0, buildSprite: buildAnthillSprite },
  'ant-queen': { ...ANT_QUEEN, scare: 0, buildSprite: buildAntQueenSprite },
  'ant-tank': { ...ANT_TANK, scare: 0, buildSprite: buildAntTankSprite },
  'ant-slasher': { ...ANT_SLASHER, scare: 0, buildSprite: buildAntSlasherSprite },
  'ant-fly': { ...ANT_FLY, scare: 0, buildSprite: buildAntFlySprite },
  'dragon-nest': { ...DRAGON_NEST, scare: 0, buildSprite: buildDragonNestSprite },
  'dragon-egg': { ...DRAGON_EGG, scare: 0, buildSprite: buildDragonEggSprite },
} as const
export type Species = keyof typeof UNITS
export const CHARACTERS = ['goose', 'thor', 'rex', 'phoenix', 'dragon', 'siren', 'ninja', 'zombie', 'vampire', 'ant', 'spartan', 'mantis', 'swordsaint', 'meiyuanzhi', 'cavalry', 'yanjin', 'mengchuan'] as const
export const CATEGORIES = ['Food', 'Animals', 'Prehistoric', 'People', 'Mythical', 'Water', 'Bug', 'Hero', 'Miscellaneous'] as const
export type Category = (typeof CATEGORIES)[number]
export const CHARACTER_CATEGORIES: Record<(typeof CHARACTERS)[number], Category> = {
  goose: 'Animals', rex: 'Prehistoric', ninja: 'People', phoenix: 'Mythical', dragon: 'Mythical',
  siren: 'Water', ant: 'Bug', thor: 'Hero', zombie: 'Miscellaneous', vampire: 'Miscellaneous',
  spartan: 'People', cavalry: 'People',
  mantis: 'Bug', swordsaint: 'Hero', meiyuanzhi: 'Hero', yanjin: 'Hero', mengchuan: 'Hero',
}
export const SPECIES: Species[] = [...CHARACTERS, 'anthill', 'ant-queen', 'ant-tank', 'ant-slasher', 'ant-fly', 'dragon-nest', 'dragon-egg', 'rex-egg', 'mei-fox', 'meng-devil']

type RexVariant = {
  ready: HTMLCanvasElement; shocked: HTMLCanvasElement
  zombie: HTMLCanvasElement; shockedZombie: HTMLCanvasElement
  parts: ReturnType<typeof buildRexParts>
}

type Poses = {
  colony?: HTMLCanvasElement[]
  dragon?: {
    ready: HTMLCanvasElement; sleeping: HTMLCanvasElement; flyingFrames: HTMLCanvasElement[]
    breathing: HTMLCanvasElement; breathingFrames: HTMLCanvasElement[]
    shocked: HTMLCanvasElement; shockedFlyingFrames: HTMLCanvasElement[]; zombie: HTMLCanvasElement
  }[]
  zombie: { ready: HTMLCanvasElement; shocked: HTMLCanvasElement; chick?: HTMLCanvasElement; shockedChick?: HTMLCanvasElement }
  ninja?: { poke: HTMLCanvasElement; slash: HTMLCanvasElement }
  meng?: { slash: HTMLCanvasElement; parry: HTMLCanvasElement; meditate: HTMLCanvasElement; raise: HTMLCanvasElement
    thunder: { ready: HTMLCanvasElement; slash: HTMLCanvasElement; parry: HTMLCanvasElement; meditate: HTMLCanvasElement; raise: HTMLCanvasElement }
    body: { ready: HTMLCanvasElement; punch: HTMLCanvasElement; parry: HTMLCanvasElement; meditate: HTMLCanvasElement; raise: HTMLCanvasElement
      hook: HTMLCanvasElement; slam: HTMLCanvasElement } }
  yan?: { slice: HTMLCanvasElement; raise: HTMLCanvasElement; slam: HTMLCanvasElement; meditate: HTMLCanvasElement; lift: HTMLCanvasElement; pierce: HTMLCanvasElement; charge: HTMLCanvasElement; cleave: HTMLCanvasElement
    idle: HTMLCanvasElement; seppuku: HTMLCanvasElement
    demon: { ready: HTMLCanvasElement; slash: HTMLCanvasElement; raise: HTMLCanvasElement; plant: HTMLCanvasElement; lift: HTMLCanvasElement; roar: HTMLCanvasElement } }
  saint?: SaintPoses & { bamboo: SaintPoses & { ready: HTMLCanvasElement } }
  mei?: { meditate: HTMLCanvasElement; throwFront: HTMLCanvasElement; throwBack: HTMLCanvasElement
    fox: { ready: HTMLCanvasElement; meditate: HTMLCanvasElement; throwFront: HTMLCanvasElement; throwBack: HTMLCanvasElement; shocked: HTMLCanvasElement } }
  mantis?: { ready: HTMLCanvasElement; strike: HTMLCanvasElement; carry: HTMLCanvasElement; hop: HTMLCanvasElement;
    guard: HTMLCanvasElement; shocked: HTMLCanvasElement; zombie: HTMLCanvasElement; shockedZombie: HTMLCanvasElement;
    shed: HTMLCanvasElement }[]
  spartan?: {
    poke: HTMLCanvasElement; bash: HTMLCanvasElement; guard: HTMLCanvasElement; throwing: HTMLCanvasElement
    commander: { ready: HTMLCanvasElement; poke: HTMLCanvasElement; bash: HTMLCanvasElement;
      guard: HTMLCanvasElement; throwing: HTMLCanvasElement; shocked: HTMLCanvasElement }
    knife: { ready: HTMLCanvasElement; poke: HTMLCanvasElement; bash: HTMLCanvasElement; guard: HTMLCanvasElement;
      shocked: HTMLCanvasElement; zombie: HTMLCanvasElement; shockedZombie: HTMLCanvasElement }
  }
  // Unhorsed cavalry reuse the Spartan knife slot so shocked/zombie/corpse drawing works unchanged.
  cavalry?: { frames: HTMLCanvasElement[][]; foot: NonNullable<Poses['spartan']>['knife'] }
  rex?: ReturnType<typeof buildRexParts>
  rexAlpha?: RexVariant
  rexBlack?: RexVariant
  phoenix?: {
    egg: HTMLCanvasElement; chick: HTMLCanvasElement; shockedChick: HTMLCanvasElement
    forms: { ready: HTMLCanvasElement; shocked: HTMLCanvasElement; zombie: HTMLCanvasElement;
      flyingFrames: HTMLCanvasElement[]; shockedFlyingFrames: HTMLCanvasElement[] }[]
  }
  ready: HTMLCanvasElement
  empty: HTMLCanvasElement
  throwing: HTMLCanvasElement
  catching: HTMLCanvasElement
  meditating?: HTMLCanvasElement
  shocked: HTMLCanvasElement
  shockedEmpty: HTMLCanvasElement
  casting: HTMLCanvasElement
  charging: HTMLCanvasElement
  flying: HTMLCanvasElement
  flyingFrames?: HTMLCanvasElement[]
  shockedFlyingFrames?: HTMLCanvasElement[]
  slamming: HTMLCanvasElement
}
export type Sprites = Record<Species, Record<Team, Poses>>

// Walk cycles for standing poses, built the first time a pose is drawn on the move.
const WALK_FRAMES = 8
const walkBuilders = new WeakMap<HTMLCanvasElement, (step: number) => HTMLCanvasElement>()
const walkCycles = new WeakMap<HTMLCanvasElement, HTMLCanvasElement[]>()

function walks(pose: HTMLCanvasElement, build: (step: number) => HTMLCanvasElement, zombie?: HTMLCanvasElement) {
  walkBuilders.set(pose, build)
  if (zombie) walkBuilders.set(zombie, (step) => buildZombieVariant(build(step)))
}

type SaintPoses = { stand: HTMLCanvasElement; slash: HTMLCanvasElement; meditate: HTMLCanvasElement; fish: HTMLCanvasElement }

// His on-foot and resting poses, with the jian or (bamboo form) the lightning bamboo stick.
function buildSaintPoses(color: string | undefined, bamboo: boolean): SaintPoses {
  const stand = buildSwordSaintSprite(color, 'stand', undefined, bamboo)
  walks(stand, (step) => buildSwordSaintSprite(color, 'stand', step, bamboo))
  return { stand, slash: buildSwordSaintSprite(color, 'slash', undefined, bamboo),
    meditate: buildSwordSaintSprite(color, 'meditate', undefined, bamboo), fish: buildSwordSaintSprite(color, 'fish', undefined, bamboo) }
}

// The frame of `pose` at `step` strides walked (one stride = both feet); poses without a cycle stay as they are.
export function walkFrame(pose: HTMLCanvasElement, step: number) {
  const build = walkBuilders.get(pose)
  if (!build) return pose
  let cycle = walkCycles.get(pose)
  if (!cycle) walkCycles.set(pose, cycle = Array.from({ length: WALK_FRAMES }, (_, k) => build(k / WALK_FRAMES)))
  return cycle[(Math.floor(step * WALK_FRAMES) % WALK_FRAMES + WALK_FRAMES) % WALK_FRAMES]
}

type Color = string | undefined
// The standing pose of each walker, at a place in its stride.
const WALKERS: Partial<Record<Species, (color: Color, step: number) => HTMLCanvasElement>> = {
  goose: (color, step) => buildGooseSprite(color, false, 1, step),
  thor: (color, step) => buildThorSprite(color, 'ready', step),
  rex: (color, step) => buildRexSprite(color, 0, step),
  siren: buildSirenSprite,
  ninja: (color, step) => buildNinjaSprite(color, 'ready', step),
  zombie: buildZombieSprite,
  vampire: (color, step) => buildVampireSprite(color, undefined, step),
  spartan: (color, step) => buildSpartanSprite(color, 'ready', 'spear', false, step),
  meiyuanzhi: (color, step) => buildMeiSprite(color, 'ready', step),
  yanjin: (color, step) => buildYanJinSprite(color, 'ready', step),
  mengchuan: (color, step) => buildMengChuanSprite(color, 'ready', step),
  ant: buildAntSprite,
  'ant-queen': buildAntQueenSprite,
  'ant-tank': buildAntTankSprite,
  'ant-slasher': buildAntSlasherSprite,
  'ant-fly': (color, step) => buildAntFlySprite(color, 1, step),
  'mei-fox': buildFoxSpiritSprite,
}

function rexParts(color: Color, form: RexForm = 0) {
  const parts = buildRexParts(color, form)
  walks(parts.body, parts.walkingBody)
  return parts
}

function buildRexVariant(color: string | undefined, form: RexForm): RexVariant {
  const ready = buildRexSprite(color, form), zombie = buildZombieVariant(ready)
  walks(ready, (step) => buildRexSprite(color, form, step), zombie)
  return { ready, zombie, shocked: buildShockedSprite(ready, 32, 11),
    shockedZombie: buildShockedSprite(zombie, 32, 11), parts: rexParts(color, form) }
}

export function buildSprites(): Sprites {
  const sprites = {} as Sprites
  for (const species of SPECIES) {
    const sides = {} as Record<Team, Poses>
    for (const team of ['red', 'blue', 'ffa'] as const) {
      const color = team === 'ffa' ? undefined : TEAM_COLORS[team]
      const ready = UNITS[species].buildSprite(color)
      const empty = species === 'thor' ? buildThorSprite(color, 'empty') : ready
      const headX = species === 'mei-fox' ? 37 : species === 'cavalry' ? 22 : species === 'ant' || species.startsWith('ant-') ? 35 : species === 'mantis' ? 30 : species === 'spartan' ? 29 : species === 'vampire' ? 28 : species === 'ninja' || species === 'zombie' ? 24 : species === 'thor' || species === 'swordsaint' || species === 'meiyuanzhi' || species === 'yanjin' || species === 'mengchuan' ? 25 : species === 'siren' ? 26 : species === 'rex' ? 32 : 34
      const headY = species === 'mei-fox' ? 23 : species === 'cavalry' ? 6 : species === 'ant' || species.startsWith('ant-') ? 26 : species === 'zombie' || species === 'spartan' || species === 'mantis' ? 14 : species === 'thor' || species === 'swordsaint' || species === 'meiyuanzhi' || species === 'yanjin' || species === 'mengchuan' || species === 'siren' ? 13 : species === 'rex' || species === 'dragon' ? 11 : species === 'phoenix' || species === 'ninja' || species === 'vampire' ? 15 : 12
      const shocked = buildShockedSprite(ready, headX, headY)
      const undead = species === 'zombie' ? ready : buildZombieVariant(empty)
      const undeadChick = species === 'phoenix' ? buildZombieVariant(buildPhoenixSprite(color, 'chick')) : undefined
      const walker = WALKERS[species]
      // A zombie is its own undead pose, and Thor's undead pose is the hammerless one.
      if (walker) walks(ready, (step) => walker(color, step), species === 'zombie' || species === 'thor' ? undefined : undead)
      if (species === 'thor') walks(empty, (step) => buildThorSprite(color, 'empty', step), undead)
      const flyingFrames = species === 'goose' || species === 'dragon' || species === 'phoenix' || species === 'vampire' || species === 'ant-fly'
        ? Array.from({ length: 8 }, (_, frame) => {
            const flap = Math.sin(frame * Math.PI / 4)
            return species === 'ant-fly' ? buildAntFlySprite(color, flap) : species === 'vampire' ? buildVampireSprite(color, flap) : species === 'goose' ? buildGooseSprite(color, true, flap)
              : species === 'dragon' ? buildDragonSprite(color, flap) : buildPhoenixSprite(color, 'adult', flap)
          })
        : undefined
      sides[team] = {
        colony: species === 'anthill' ? Array.from({ length: 5 }, (_, i) => buildAnthillSprite(color, i + 1)) : undefined,
        dragon: species === 'dragon' ? DRAGON_FORMS.map((_, form) => {
          const ready = buildDragonSprite(color, undefined, form as DragonForm), zombie = buildZombieVariant(ready)
          walks(ready, (step) => buildDragonSprite(color, undefined, form as DragonForm, false, step), zombie)
          const frames = Array.from({ length: 8 }, (_, frame) =>
            buildDragonSprite(color, Math.sin(frame * Math.PI / 4), form as DragonForm))
          const breathing = buildDragonSprite(color, undefined, form as DragonForm, true)
          const breathingFrames = Array.from({ length: 8 }, (_, frame) =>
            buildDragonSprite(color, Math.sin(frame * Math.PI / 4), form as DragonForm, true))
          return { ready, sleeping: buildSleepingDragonSprite(color, form as DragonForm), flyingFrames: frames, breathing, breathingFrames, shocked: buildShockedSprite(ready, 34, 11),
            shockedFlyingFrames: frames.map((frame) => buildShockedSprite(frame, 34, 11)), zombie }
        }) : undefined,
        zombie: {
          ready: undead,
          shocked: buildShockedSprite(undead, headX, headY),
          chick: undeadChick,
          shockedChick: undeadChick ? buildShockedSprite(undeadChick, 24, 26) : undefined,
        },
        ninja: species === 'ninja' ? { poke: buildNinjaSprite(color, 'poke'), slash: buildNinjaSprite(color, 'slash') } : undefined,
        meng: species === 'mengchuan' ? { slash: buildMengChuanSprite(color, 'slash'), parry: buildMengChuanSprite(color, 'parry'), meditate: buildMengChuanSprite(color, 'meditate'), raise: buildMengChuanSprite(color, 'raise'),
          thunder: (() => {
            const ready = buildMengChuanSprite(color, 'ready', undefined, 'thunder')
            walks(ready, (step) => buildMengChuanSprite(color, 'ready', step, 'thunder'))
            return { ready, slash: buildMengChuanSprite(color, 'slash', undefined, 'thunder'), parry: buildMengChuanSprite(color, 'parry', undefined, 'thunder'),
              meditate: buildMengChuanSprite(color, 'meditate', undefined, 'thunder'), raise: buildMengChuanSprite(color, 'raise', undefined, 'thunder') }
          })(),
          body: (() => {
            const ready = buildMengChuanSprite(color, 'ready', undefined, 'body')
            walks(ready, (step) => buildMengChuanSprite(color, 'ready', step, 'body'))
            return { ready, punch: buildMengChuanSprite(color, 'punch', undefined, 'body'), parry: buildMengChuanSprite(color, 'parry', undefined, 'body'),
              meditate: buildMengChuanSprite(color, 'meditate', undefined, 'body'), raise: buildMengChuanSprite(color, 'raise', undefined, 'body'),
              hook: buildMengChuanSprite(color, 'hook', undefined, 'body'), slam: buildMengChuanSprite(color, 'slam', undefined, 'body') }
          })() } : undefined,
        saint: species === 'swordsaint' ? { ...buildSaintPoses(color, false),
          bamboo: { ready: buildSwordSaintSprite(color, 'ride', undefined, true), ...buildSaintPoses(color, true) } } : undefined,
        yan: species === 'yanjin' ? { slice: buildYanJinSprite(color, 'slice'), raise: buildYanJinSprite(color, 'raise'),
          slam: buildYanJinSprite(color, 'slam'), meditate: buildYanJinSprite(color, 'meditate'), lift: buildYanJinSprite(color, 'lift'),
          pierce: buildYanJinSprite(color, 'pierce'),
          charge: buildYanJinSprite(color, 'charge'), cleave: buildYanJinSprite(color, 'cleave'), seppuku: buildYanJinSprite(color, 'seppuku'),
          idle: (() => {
            const idle = buildYanJinSprite(color, 'idle')
            walks(idle, (step) => buildYanJinSprite(color, 'idle', step))
            return idle
          })(),
          demon: (() => {
            const ready = buildYanDemonSprite(color, 'ready')
            walks(ready, (step) => buildYanDemonSprite(color, 'ready', step))
            return { ready, slash: buildYanDemonSprite(color, 'slash'), raise: buildYanDemonSprite(color, 'raise'),
              plant: buildYanDemonSprite(color, 'plant'), lift: buildYanDemonSprite(color, 'lift'), roar: buildYanDemonSprite(color, 'roar') }
          })() } : undefined,
        mei: species === 'meiyuanzhi' ? { meditate: buildMeiSprite(color, 'meditate'),
          throwFront: buildMeiSprite(color, 'throwFront'), throwBack: buildMeiSprite(color, 'throwBack'),
          fox: (() => {
            const ready = buildMeiSprite(color, 'ready', undefined, true)
            walks(ready, (step) => buildMeiSprite(color, 'ready', step, true))
            return { ready, meditate: buildMeiSprite(color, 'meditate', undefined, true),
              throwFront: buildMeiSprite(color, 'throwFront', undefined, true),
              throwBack: buildMeiSprite(color, 'throwBack', undefined, true), shocked: buildShockedSprite(ready, 25, 13) }
          })() } : undefined,
        mantis: species === 'mantis' ? Array.from({ length: 4 }, (_, index) => {
          const form = index as MantisForm, ready = buildMantisSprite(color, 'ready', form), zombie = buildZombieVariant(ready)
          const carry = buildMantisSprite(color, 'carry', form), guard = buildMantisSprite(color, 'guard', form)
          walks(ready, (step) => buildMantisSprite(color, 'ready', form, step), zombie)
          walks(carry, (step) => buildMantisSprite(color, 'carry', form, step))
          walks(guard, (step) => buildMantisSprite(color, 'guard', form, step))
          return { ready, strike: buildMantisSprite(color, 'strike', form), carry,
            hop: buildMantisSprite(color, 'hop', form), guard,
            shocked: buildShockedSprite(ready, 30, 14), zombie, shockedZombie: buildShockedSprite(zombie, 30, 14),
            shed: buildMantisShedSprite(form) }
        }) : undefined,
        spartan: species === 'spartan' ? (() => {
          // Ready and guard (formation march) poses walk, for every weapon and the commander.
          const walking = (pose: 'ready' | 'guard', weapon: 'spear' | 'knife', commander: boolean) => {
            const sprite = buildSpartanSprite(color, pose, weapon, commander)
            walks(sprite, (step) => buildSpartanSprite(color, pose, weapon, commander, step))
            return sprite
          }
          const knife = buildSpartanSprite(color, 'ready', 'knife'), zombie = buildZombieVariant(knife)
          walks(knife, (step) => buildSpartanSprite(color, 'ready', 'knife', false, step), zombie)
          const commander = walking('ready', 'spear', true)
          return { poke: buildSpartanSprite(color, 'poke'), bash: buildSpartanSprite(color, 'bash'),
            guard: walking('guard', 'spear', false), throwing: buildSpartanSprite(color, 'throw'),
            commander: { ready: commander, poke: buildSpartanSprite(color, 'poke', 'spear', true),
              bash: buildSpartanSprite(color, 'bash', 'spear', true), guard: walking('guard', 'spear', true),
              throwing: buildSpartanSprite(color, 'throw', 'spear', true), shocked: buildShockedSprite(commander, 29, 14) },
            knife: { ready: knife, poke: buildSpartanSprite(color, 'poke', 'knife'),
              bash: buildSpartanSprite(color, 'bash', 'knife'), guard: walking('guard', 'knife', false),
              shocked: buildShockedSprite(knife, 29, 14), zombie, shockedZombie: buildShockedSprite(zombie, 29, 14) } }
        })() : undefined,
        cavalry: species === 'cavalry' ? (() => {
          const foot = buildCavalryFootSprite(color), poke = buildCavalryFootSprite(color, 'poke'), zombie = buildZombieVariant(foot)
          walks(foot, (step) => buildCavalryFootSprite(color, 'ready', step), zombie)
          return { frames: buildCavalryFrames(color), foot: { ready: foot, poke, bash: poke, guard: foot,
            shocked: buildShockedSprite(foot, 24, 14), zombie, shockedZombie: buildShockedSprite(zombie, 24, 14) } }
        })() : undefined,
        rex: species === 'rex' ? rexParts(color) : undefined,
        rexAlpha: species === 'rex' ? buildRexVariant(color, 1) : undefined,
        rexBlack: species === 'rex' ? buildRexVariant(color, 2) : undefined,
        phoenix: species === 'phoenix' ? {
          forms: PHOENIX_FORMS.map((_, form) => {
            const ready = buildPhoenixSprite(color, 'adult', undefined, form as PhoenixForm), zombie = buildZombieVariant(ready)
            walks(ready, (step) => buildPhoenixSprite(color, 'adult', undefined, form as PhoenixForm, step), zombie)
            const frames = Array.from({ length: 8 }, (_, frame) =>
              buildPhoenixSprite(color, 'adult', Math.sin(frame * Math.PI / 4), form as PhoenixForm))
            return { ready, shocked: buildShockedSprite(ready, 34, 15), zombie,
              flyingFrames: frames, shockedFlyingFrames: frames.map((frame) => buildShockedSprite(frame, 34, 15)) }
          }),
          egg: buildPhoenixSprite(color, 'egg'),
          chick: (() => {
            const chick = buildPhoenixSprite(color, 'chick')
            walks(chick, (step) => buildPhoenixSprite(color, 'chick', undefined, 0, step), undeadChick)
            return chick
          })(),
          shockedChick: buildShockedSprite(buildPhoenixSprite(color, 'chick'), 24, 26),
        } : undefined,
        ready,
        empty,
        throwing: species === 'thor' ? buildThorSprite(color, 'throw') : ready,
        catching: species === 'thor' ? buildThorSprite(color, 'catch') : ready,
        meditating: species === 'thor' ? buildThorSprite(color, 'heal') : undefined,
        shocked,
        shockedEmpty: species === 'thor' ? buildShockedSprite(empty, headX, headY) : shocked,
        casting: species === 'thor' ? buildThorSprite(color, 'cast') : ready,
        charging: species === 'thor' ? buildThorSprite(color, 'charge') : ready,
        flying: species === 'thor' ? buildThorSprite(color, 'fly') : flyingFrames?.[0] ?? ready,
        flyingFrames,
        shockedFlyingFrames: flyingFrames?.map((frame) => buildShockedSprite(frame, headX, species === 'vampire' ? 24 : headY)),
        slamming: species === 'thor' ? buildThorSprite(color, 'slam') : ready,
      }
    }
    sprites[species] = sides
  }
  return sprites
}

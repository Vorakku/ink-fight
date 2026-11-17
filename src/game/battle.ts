import { UNITS, TEAM_COLORS, walkFrame, type Species, type Sprites, type Team } from './units.ts'
import { drawHammer, drawLightningBolt, THOR_MELEE, THOR_REST, THOR_SKILLS } from './thor.ts'
import { GOOSE, GOOSE_SWOOP } from './goose.ts'
import { drawRexBloodlust, REX_ARM, REX_JAW, TREX, TREX_GRAB, TREX_ROAR, TREX_FEED, TREX_EGG, TREX_ALPHA, TREX_BLACK, TREX_STOMP, TREX_RAM, TREX_BLOODLUST, TREX_THROW } from './rex.ts'
import { drawFireBreath, drawPhoenixBreath, drawFlame, drawPhoenixHealing, drawPhoenixFire, drawPhoenixGlitter, PHOENIX_CHICK, PHOENIX_FIRE, PHOENIX_REBIRTH, PHOENIX_DIVE, PHOENIX_FORMS, PHOENIX_FIRE_RESISTANCE, PHOENIX_KILL_HEAL, PHOENIX_BARRAGE, PHOENIX_ENCORE, type PhoenixForm } from './phoenix.ts'
import { drawDragonSword, drawIceRing, drawLightningWave, drawDragonLightning, drawDragonDomain, drawDragonDomainCollapse, DRAGON_FEED, DRAGON_FIRE, DRAGON_FORMS, DRAGON_ICE, DRAGON_ICE_DIVE, DRAGON_LIGHTNING, DRAGON_LIGHTNING_SWORD, DRAGON_NEST, DRAGON_EGG, DRAGON_BABY, DRAGON_DOMAIN, type DragonElement, type DragonForm } from './dragon.ts'
import { drawCharmHeart, drawSirenSong, SIREN, SIREN_SONG } from './siren.ts'
import { drawKatanaImpact, drawKatanaSlash, drawShuriken, KATANA_SLASH_DURATION, NINJA, NINJA_AMBUSH, NINJA_DASH, SHURIKEN_SPEED } from './ninja.ts'
import { drawSpartanSpear, SPARTAN, SPARTAN_BASH, SPARTAN_FORMATION, SPARTAN_THROW, SPARTAN_KNIFE, SPARTAN_CHARGE, SPARTAN_COMMANDER } from './spartan.ts'
import { CAVALRY_FOOT, CAVALRY_GALLOP_FRAMES, CAVALRY_RIDE } from './cavalry.ts'
import { activeSpartanSlot, leaveSpartanFormation, updateSpartanFormations, drawSpartanFormation, drawSpartanCharge, type SpartanFormation, type SpartanArmy } from './spartan-formations.ts'
import { MANTIS, MANTIS_DUEL, MANTIS_DODGE, MANTIS_GUARD, MANTIS_EVOLUTION, MANTIS_MOON_SLASH,
  mantisForm, drawMantisDuel, drawMantisMolt, drawMantisMoonSlash,
  type MantisDuel, type MantisForm, type MantisMolt, type MantisMoonSlash } from './mantis.ts'
import { BCELL, drawTower, drawTree, TOWER_COLLAPSE, TOWER_HEIGHT, TOWER_HP, TOWER_ROOF, TOWER_SPACING, TREE_HEIGHT, TREE_SPACING, WaterTerrain } from './terrain.ts'
import { drawWater, sinkAt } from './water.ts'
import { ZOMBIE, ZOMBIE_INFECTION } from './zombie.ts'
import { VAMPIRE, VAMPIRE_BAT, VAMPIRE_FIRE_WEAKNESS } from './vampire.ts'
import { drawFoxBlast, drawFoxClaw, drawFoxTails, drawFoxTalisman, drawMeiShield, drawMeiSmoke, drawMeiStar, drawTalisman, drawTalismanMine, MEI_AURA, MEI_BARRAGE, MEI_CLAW, MEI_MINE, MEI_HANDS, MEI_REST, MEI_ESCAPE, MEI_FLAME, MEI_FOX, MEI_PRESSURE, MEI_SHIELD, MEI_SPIRITS, MEI_STAR, MEI_TALISMAN, starDashAt, MEI_TRANSFORM, MEI_YUANZHI } from './meiyuanzhi.ts'
import { CATCH_COUNT, drawCatch, drawCrater, drawFishingRod, drawFlyingSword, drawGiantSword, drawMeditationAura, drawSaintSlash, drawSonicTrail, drawSwordFan,
  fishingPose, SAINT_SLASH_DURATION, swordSlot, SWORD_SAINT, SWORD_SAINT_FISHING, SWORD_SAINT_GIANT, SWORD_SAINT_MELEE, SWORD_SAINT_REST, SWORD_SAINT_STORM,
  SWORD_SAINT_SWORDS } from './swordsaint.ts'
import { ANT, ANTHILL, COLONY_BUILD, ANT_ARMY, ANT_PROVOKE } from './ant.ts'
export { TEAM_COLORS, type Team } from './units.ts'

export const DT = 1 / 60
export const MAX_FIGHTERS = 1000
const HAMMER_SPEED = 420
const ELECTRIC_FLASH = 0.3
const DOMAIN_SEAL = DRAGON_DOMAIN.rise + DRAGON_DOMAIN.scream
const DOMAIN_CAST = DOMAIN_SEAL + DRAGON_DOMAIN.fall
const DOMAIN_END = DOMAIN_SEAL + DRAGON_DOMAIN.hold + DRAGON_DOMAIN.shrink

export interface Fighter {
  id: number
  species: Species
  x: number
  y: number
  vx: number
  vy: number
  team: Team
  hp: number
  cooldown: number
  attack: number
  hit: number
  fear: number
  scaredBy: Fighter | null
  target: Fighter | null
  retaliation: Fighter | null
  stun: number
  shock: number
  hammerOut: boolean
  catching: number
  skillCooldown: number
  swordStack: number
  saint: SaintMelee | null
  saintRest: SaintRest | null
  mei: MeiSkill | null
  meiMelee: number
  meiRanged: number
  meiFoe: Fighter | null
  meiFox: number
  meiBarrage: number
  meiMine: number // talisman mine cooldown
  meiStar: number // star dash cooldown
  meiHand: number // the hand that threw last: 0 front (right), 1 back (left)
  meiForm: number // 0 calm, 1 nine-tailed fox, 2 fox form with its spirits summoned
  spartanFormation: SpartanFormation | null
  spartanCommander: { troops: Fighter[] } | null
  spartanSpear: boolean
  spartanMark: Fighter | null
  spartanThrowCooldown: number
  cavalryMounted: boolean
  mantisDuel: MantisDuel | null
  mantisCooldown: number
  mantisGrace: number
  mantisMeals: number
  mantisEaten: boolean
  mantisDodge: { time: number; nx: number; ny: number } | null
  mantisDodgeCooldown: number
  mantisKills: number
  mantisForm: MantisForm
  mantisLeap: { target: Fighter; time: number; fromX: number; fromY: number } | null
  mantisCloak: number
  mantisPrey: Fighter | null
  mantisMoon: { time: number; angle: number } | null
  mantisMoonCooldown: number
  casting: number
  slam: number
  charge: Charge | null
  dash: { target: Fighter; time: number } | null
  tree: Tree | null
  treeCooldown: number
  hidden: boolean
  ambush: NinjaAmbush | null
  lightning: { target: Fighter; time: number } | null
  grab: { target: Fighter; time: number; landing?: { x: number; y: number } } | null
  heldBy: Fighter | null
  thrown: { owner: Fighter; time: number; smash?: { x: number; y: number; fromX: number; fromY: number; duration: number; team: Team } } | null
  dizzy: number
  roar: number
  rexMeals: number
  rexNutrition: number
  rexLayTime: number
  rexEggsLaid: number
  rexBaby: boolean
  rexKills: number
  rexStomp: number
  rexStompCooldown: number
  rexRam: { phase: 'windup' | 'dash' | 'pin'; time: number; target: Fighter; nx: number; ny: number } | null
  rexRamCooldown: number
  rexBloodlust: boolean
  rexBloodlustCall: number
  rexReinforcements: number
  bleed: number
  bleedOwner: Fighter | null
  stage: 'adult' | 'egg' | 'chick' | 'reborn'
  stageTime: number
  zombie: boolean
  bat: boolean
  dragonKills: number
  dragonProgress: number
  dragonMeals: number
  dragonNutrition: number
  dragonMaturity: number
  dragonTraining: number
  dragonHome: Fighter | null
  dragonSleeping: boolean
  dragonQuiet: number
  dragonLayTime: number
  dragonEggsLaid: number
  dragonDomain: DragonDomain | null
  dragonDomainUsed: boolean
  nest: { time: number; owner: Fighter | null } | null
  mealFor: Fighter | null
  feeding: { body: Splat; time: number } | null
  dragonForm: DragonForm
  evolution: number
  chill: number
  frozen: number
  iceDive: { time: number } | null
  iceDiveCooldown: number
  phoenixKills: number
  phoenixForm: PhoenixForm
  phoenixDive: { kind: 'dive' | 'barrage' | 'encore'; time: number; fromX: number; fromY: number;
    x: number; y: number; endX: number; endY: number; released: number; wave: number; hits: Set<Fighter | Tower> } | null
  phoenixDiveCooldown: number
  phoenixEncoreCooldown: number
  lightningSword: { time: number; angle: number; target: Fighter; released: boolean } | null
  lightningSwordCooldown: number
  burnOwner: Fighter | null
  infection: { time: number; team: Team } | null
  burn: number
  song: number
  lure: { owner: Fighter; time: number } | null
  waterPosition: { x: number; y: number } | null
  tower: Tower | null
  elevation: number
  falling: boolean
  colony: { time: number; need: number; workers: number; counted: boolean; brood: number;
    level: number; recruits: number; exit: number; alarm: number; enemy: Fighter | null } | null
  antHome: Fighter | null
  antDeployed: boolean
  antFlight: { passenger: Fighter; target: Fighter } | null
  taunt: { owner: Fighter; time: number } | null
  buildFor: Fighter | null
  inside: Fighter | null
  entry: number
  haulFor: Splat | null
  phase: number
  facing: number
}

export interface Tower {
  x: number
  y: number
  hp: number
  occupant: Fighter | null
  fall: number
}

interface Tree { x: number; y: number; occupant: Fighter | null }
interface NinjaAmbush {
  tree: Tree
  target: Fighter | null
  phase: 'slash' | 'recover' | 'return'
  time: number
  fromX: number
  fromY: number
  fromElevation: number
  toX: number
  toY: number
  struck: boolean
}

interface Splat {
  x: number; y: number; life: number; color: string; size: number
  meal?: { owner: Fighter; victim: Fighter }
  body?: Fighter
  haul?: { home: Fighter; crew: Fighter[]; entry: number }
}
interface Bolt { x: number; y: number; tx: number; ty: number; life: number }
interface Charge {
  phase: 'windup' | 'flight'
  time: number
  fromX: number
  fromY: number
  x: number
  y: number
  target: Fighter
}
interface LightningShot { owner: Fighter; x: number; y: number; tx: number; ty: number; life: number; healing?: boolean }
interface Storm { owner: Fighter; x: number; y: number; elevation: number; time: number; phase: 'warning' | 'impact' }
interface Impact { x: number; y: number; radius: number; life: number; color?: string; inferno?: boolean; smoke?: boolean; fox?: boolean; claw?: number }
// A bomb talisman Mei stuck on the ground; it arms, then waits for an enemy to step on it.
interface TalismanMine { owner: Fighter; x: number; y: number; life: number }
interface KatanaSlash { x: number; y: number; angle: number; life: number; saint?: boolean }
interface Flame { owner: Fighter; nx: number; ny: number; life: number; age: number; element: DragonElement }
interface HealingRing { owner: Fighter; life: number }
interface PhoenixFire { owner: Fighter; x: number; y: number; life: number; radius: number; damage: number; burn: number }
interface PhoenixFireball { owner: Fighter; fromX: number; fromY: number; height: number; x: number; y: number; time: number }
interface DragonDomain {
  owner: Fighter; team: Team; x: number; y: number; time: number; radius: number
  sealed: boolean; captives: Set<Fighter>
}
interface IceRing { x: number; y: number; radius: number; life: number }
interface LightningWave {
  owner: Fighter; x: number; y: number; vx: number; vy: number; remaining: number
  age: number; radius: number; height: number; damage: number; hits: Set<Fighter>
}
interface SaintMelee {
  phase: 'flip' | 'melee' | 'mount'; time: number; target: Fighter; combo: number
  trail: { fromX: number; fromY: number; toX: number; toY: number; time: number } | null
}
// Heroes share meditation state; the saint also fishes at (x, y). Thor's time counts toward a self-strike.
// Mei Yuanzhi's escape backflip, talisman shield, barrage, fox transformation or star dash; (x, y) is where it
// started (the star's centre for a star dash, which began at `from`).
interface MeiSkill { kind: 'flip' | 'shield' | 'barrage' | 'transform' | 'star'; time: number; x: number; y: number; target: Fighter; absorbed: number; from?: { x: number; y: number } }
interface SaintRest { kind: 'meditate' | 'fish'; x: number; y: number; action: 'wait' | 'adjust' | 'reel'; time: number; catch: number }

function canMeditate(fighter: Fighter) {
  return fighter.hp > 0 && !fighter.zombie && fighter.stun <= 0 && fighter.frozen <= 0 && fighter.fear <= 0
    && !fighter.lure && !fighter.heldBy && !fighter.thrown && !fighter.falling && !fighter.inside
    && !fighter.hammerOut && !fighter.charge && !fighter.lightning && !fighter.saint && !fighter.mei
    && fighter.burn <= 0 && fighter.bleed <= 0
}
interface GiantSword { owner: Fighter; target: Fighter; x: number; y: number; fromX: number; fromY: number; time: number; flying: boolean }
interface FishThrow { owner: Fighter; target: Fighter; fromX: number; fromY: number; time: number }
// Swords: `comeback` ones return to the saint after striking, `ride` is the sword he rides during his blink.
interface Shuriken { kind: 'shuriken' | 'spear' | 'sword' | 'talisman'; power?: number; fox?: boolean; hold?: number; target?: Fighter; seed?: number; comeback?: boolean; returning?: boolean; ride?: boolean; owner: Fighter; x: number; y: number; vx: number; vy: number; elevation: number; vz: number; life: number }
interface Hammer {
  owner: Fighter
  x: number
  y: number
  vx: number
  vy: number
  remaining: number
  returning: boolean
  age: number
  homeTime: number
  hits: Set<Fighter>
}

function antFamily(fighter: Fighter) {
  return fighter.species === 'ant' || fighter.species === 'anthill' || fighter.species.startsWith('ant-')
}

function antSoldier(fighter: Fighter) {
  return antFamily(fighter) && fighter.species !== 'anthill' && fighter.species !== 'ant-queen'
}

function allies(a: Fighter, b: Fighter) {
  return a.team === b.team && (a.team !== 'ffa'
    || (a.zombie || b.zombie ? a.zombie && b.zombie : a.species === b.species
      || (antFamily(a) && antFamily(b))
      || (['rex', 'rex-egg'].includes(a.species) && ['rex', 'rex-egg'].includes(b.species))
      || (['dragon', 'dragon-nest', 'dragon-egg'].includes(a.species) && ['dragon', 'dragon-nest', 'dragon-egg'].includes(b.species))
      || (['meiyuanzhi', 'mei-fox'].includes(a.species) && ['meiyuanzhi', 'mei-fox'].includes(b.species))))
}

function building(fighter: Fighter) {
  return !!fighter.colony || fighter.species === 'dragon-nest' || fighter.species === 'dragon-egg' || fighter.species === 'rex-egg'
}

function targetable(owner: Fighter, target: Fighter) {
  return target.hp > 0 && target.stage !== 'egg' && !target.heldBy && !concealed(target) && !target.inside
    && !allies(owner, target) && mantisCanTarget(owner, target)
}

function concealed(fighter: Fighter) {
  return fighter.hidden || fighter.mantisCloak > 0 || meiVanished(fighter)
}

function meiVanished(fighter: Fighter) {
  return fighter.mei?.kind === 'flip' && fighter.mei.time < MEI_ESCAPE.vanish
}

function mantisCanTarget(owner: Fighter, target: Fighter) {
  const ownDuel = owner.mantisDuel
  if (ownDuel && owner === ownDuel.captive) return ownDuel.state === 'duel' && target === ownDuel.challenger
  if (ownDuel && owner === ownDuel.challenger && ownDuel.state === 'duel') return target === ownDuel.captive
  const duel = target.mantisDuel
  return !duel || target !== duel.captive || owner.species !== 'mantis' || owner.zombie || owner.team !== duel.team
    || (duel.state === 'duel' && owner === duel.challenger)
}

function mantisOpponent(fighter: Fighter) {
  const duel = fighter.mantisDuel
  if (duel?.state !== 'duel') return null
  return fighter === duel.captive ? duel.challenger : fighter === duel.challenger ? duel.captive : null
}

function mantisGuard(fighter: Fighter) {
  const duel = fighter.mantisDuel
  return !!duel && fighter !== duel.captive && fighter !== duel.challenger
}

function grounded(fighter: Fighter) {
  return fighter.stage !== 'egg' && !fighter.inside && !fighter.bat && !fighter.iceDive && !fighter.phoenixDive && !fighter.heldBy && !fighter.thrown && !fighter.tower
    && !(fighter.dragonDomain && fighter.dragonDomain.time < DOMAIN_CAST)
    && fighter.elevation <= 0 && !fighter.hidden && !fighter.falling && fighter.charge?.phase !== 'flight'
}

function canFly(fighter: Fighter) {
  return !fighter.zombie && (fighter.species === 'dragon' || fighter.species === 'goose' || fighter.species === 'vampire'
    || fighter.species === 'ant-fly' || (fighter.species === 'phoenix' && (fighter.stage === 'adult' || fighter.stage === 'reborn')))
}

function canReach(owner: Fighter, target: Fighter) {
  if (target.tower && !owner.tower && !canFly(owner)) return false
  return Math.abs(owner.elevation - target.elevation) <= 24
}

function isAlphaRex(fighter: Fighter) {
  return fighter.species === 'rex' && !fighter.zombie
    && (fighter.rexMeals >= TREX_ALPHA.meals || fighter.rexKills >= TREX_BLACK.kills)
}

function isBlackRex(fighter: Fighter) {
  return fighter.species === 'rex' && !fighter.zombie && fighter.rexKills >= TREX_BLACK.kills
}

function bloodlustActive(fighter: Fighter) {
  return isBlackRex(fighter) && fighter.rexBloodlust
    && fighter.hp < (TREX_ALPHA.hp + fighter.rexNutrition * TREX_FEED.health) * rexMaturity(fighter) * TREX_BLOODLUST.threshold
}

function rexMaturity(fighter: Fighter) {
  return fighter.rexBaby ? TREX_EGG.babyScale + (1 - TREX_EGG.babyScale) * Math.min(1, fighter.rexMeals / TREX_EGG.matureMeals) : 1
}

function spartanCommanderProtected(fighter: Fighter) {
  return !!fighter.spartanCommander && !fighter.zombie && fighter.spartanCommander.troops.some((troop) =>
    troop.hp > 0 && troop.species === 'spartan' && !troop.zombie && !troop.spartanCommander && troop.team === fighter.team)
}

function incomingDamage(target: Fighter, damage: number, owner?: Fighter | null, direct = false) {
  const slot = activeSpartanSlot(target), group = target.spartanFormation
  if (direct && slot && group && slot.role !== 'center' && owner && !allies(target, owner)
    && owner.species !== 'dragon' && owner.species !== 'phoenix') {
    const dx = owner.x - target.x, dy = owner.y - target.y, distance = Math.hypot(dx, dy)
    if (distance > 0 && (dx * slot.nx + dy * slot.ny) / distance >= 0.5) {
      const armor = group.kind === 'wall' ? SPARTAN_FORMATION.wallArmor
        : group.kind === 'circle' ? SPARTAN_FORMATION.circleArmor : 0
      damage *= 1 - armor
    }
  }
  if (spartanCommanderProtected(target)) damage = Math.min(damage, Math.max(0, target.hp - 1))
  if (target.species === 'ant-tank' && !target.zombie) return damage * (1 - ANT_PROVOKE.armor)
  return isBlackRex(target) && owner && !allies(target, owner) ? damage * (1 - TREX_BLACK.armor) : damage
}

function fireMultiplier(target: Fighter) {
  if (target.zombie) return 1
  if (target.species === 'phoenix') return 1 - PHOENIX_FIRE_RESISTANCE
  return target.species === 'vampire' ? VAMPIRE_FIRE_WEAKNESS : 1
}

function fighterDef(fighter: Fighter) {
  const spartan = activeSpartanSlot(fighter)
  const spartanPower = fighter.spartanCommander && !fighter.zombie ? SPARTAN_COMMANDER.power : 1
  const spartanScale = fighter.spartanCommander && !fighter.zombie ? SPARTAN_COMMANDER.scale : 1
  const form = DRAGON_FORMS[fighter.dragonForm]
  const growth = DRAGON_BABY.scale + (1 - DRAGON_BABY.scale) * fighter.dragonMaturity
  const rexGrowth = 1 + (fighter.rexKills >= TREX_BLACK.kills ? 1 : Math.min(1, fighter.rexMeals / TREX_ALPHA.meals)) * TREX_FEED.growth
  const youngRex = rexMaturity(fighter)
  const alpha = isAlphaRex(fighter)
  const bloodlust = bloodlustActive(fighter)
  const mantisGrowth = 1 + (UNITS.dragon.size * DRAGON_FORMS[0].scale / MANTIS.size - 1)
    * Math.min(1, Math.max(0, fighter.mantisMeals) / MANTIS_EVOLUTION.growthMeals)
  const def = fighter.species === 'phoenix' && fighter.stage === 'chick' ? PHOENIX_CHICK
    : fighter.species === 'mantis' ? { ...UNITS.mantis,
      hp: MANTIS.hp * (1 + fighter.mantisMeals * 0.1), damage: MANTIS.damage * (1 + fighter.mantisMeals * 0.1),
      size: MANTIS.size * mantisGrowth, radius: MANTIS.radius * mantisGrowth,
      range: (MANTIS.range + (fighter.mantisForm >= 1 ? MANTIS_EVOLUTION.bladeReach : 0)) * mantisGrowth,
      speed: MANTIS.speed * (fighter.mantisCloak > 0 ? 1.25 : 1),
      detection: fighter.mantisForm >= 3 ? MANTIS_EVOLUTION.huntRange : MANTIS_EVOLUTION.leapRange }
    : fighter.species === 'spartan' ? { ...UNITS.spartan,
      hp: SPARTAN.hp * spartanPower, size: SPARTAN.size * spartanScale, radius: SPARTAN.radius * spartanScale,
      range: fighter.spartanSpear ? SPARTAN.range * spartanScale + (spartan?.role === 'rear' && fighter.spartanFormation?.kind === 'wall' ? SPARTAN_FORMATION.rearReach : 0) : SPARTAN_KNIFE.range,
      damage: (fighter.spartanSpear ? SPARTAN.damage : SPARTAN_KNIFE.damage) * spartanPower * (spartan && fighter.spartanFormation?.kind === 'circle' ? SPARTAN_FORMATION.circleDamage : 1),
      cooldown: fighter.spartanSpear ? SPARTAN.cooldown : SPARTAN_KNIFE.cooldown,
      knockback: (fighter.spartanSpear ? SPARTAN.knockback : SPARTAN_KNIFE.knockback) * spartanPower,
      detection: SPARTAN_THROW.range }
    : fighter.species === 'cavalry' && !fighter.cavalryMounted ? { ...UNITS.cavalry, ...CAVALRY_FOOT }
    : fighter.species === 'phoenix' ? { ...UNITS.phoenix, ...PHOENIX_FORMS[fighter.phoenixForm],
      detection: fighter.phoenixForm === 2 ? PHOENIX_ENCORE.range : fighter.phoenixForm === 1 ? PHOENIX_BARRAGE.range : PHOENIX_DIVE.range }
    : fighter.species === 'dragon' ? { ...UNITS.dragon, hp: (form.hp + fighter.dragonNutrition * DRAGON_FEED.health) * growth,
      damage: form.damage * growth, range: form.range * growth, color: form.body,
      size: UNITS.dragon.size * form.scale * growth, radius: UNITS.dragon.radius * form.scale * growth }
    : fighter.species === 'rex' ? { ...UNITS.rex,
      hp: ((alpha ? TREX_ALPHA.hp : TREX.hp) + fighter.rexNutrition * TREX_FEED.health) * youngRex,
      damage: (alpha ? TREX_ALPHA.damage : TREX.damage) * (bloodlust ? TREX_BLOODLUST.damage : 1) * youngRex,
      cooldown: alpha ? TREX_ALPHA.cooldown : TREX.cooldown,
      speed: (alpha ? TREX_ALPHA.speed : TREX.speed) * (bloodlust ? TREX_BLOODLUST.speed : 1),
      color: fighter.rexKills >= TREX_BLACK.kills ? TREX_BLACK.color : alpha ? TREX_ALPHA.color : TREX.color,
      size: TREX.size * rexGrowth * youngRex, radius: TREX.radius * rexGrowth * youngRex, range: TREX.range * rexGrowth * youngRex }
    : fighter.colony ? { ...UNITS.anthill, hp: ANTHILL.hp + Math.max(0, fighter.colony.level - 1) * 250,
      radius: ANTHILL.radius * (1 + Math.max(0, fighter.colony.level - 1) * 0.35),
      size: 1 + Math.max(0, fighter.colony.level - 1) * 0.35 }
    : UNITS[fighter.species]
  return fighter.zombie ? { ...ZOMBIE, radius: def.radius, hp: def.hp, size: def.size, color: def.color } : def
}

// Spearless Spartans and unhorsed cavalry draw from the same foot-soldier pose slot.
function footPoses(poses: Sprites[Species][Team], fighter: Fighter) {
  return fighter.spartanSpear ? undefined : poses.spartan?.knife ?? (fighter.cavalryMounted ? undefined : poses.cavalry?.foot)
}

function segmentDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, lengthSquared = dx * dx + dy * dy
  const t = lengthSquared ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared)) : 0
  return Math.hypot(x - ax - dx * t, y - ay - dy * t)
}

export class Battle {
  water = new WaterTerrain()
  towers: Tower[] = []
  trees: Tree[] = []
  fighters: Fighter[] = []
  splats: Splat[] = []
  hammers: Hammer[] = []
  shuriken: Shuriken[] = []
  giantSwords: GiantSword[] = []
  fishThrows: FishThrow[] = []
  blinded: { target: Fighter; life: number }[] = []
  craters: { x: number; y: number; life: number }[] = []
  bolts: Bolt[] = []
  shots: LightningShot[] = []
  storms: Storm[] = []
  impacts: Impact[] = []
  mines: TalismanMine[] = []
  katanaSlashes: KatanaSlash[] = []
  flames: Flame[] = []
  rings: HealingRing[] = []
  phoenixFires: PhoenixFire[] = []
  phoenixFireballs: PhoenixFireball[] = []
  spartanFormations: SpartanFormation[] = []
  spartanArmies = new Map<Team, SpartanArmy>()
  onSpartanScream: (() => void) | null = null
  mantisDuels: MantisDuel[] = []
  mantisMolts: MantisMolt[] = []
  mantisMoonSlashes: MantisMoonSlash[] = []
  dragonDomains: DragonDomain[] = []
  iceRings: IceRing[] = []
  lightningWaves: LightningWave[] = []
  width = 1
  height = 1
  tick = 0
  nextColony: Record<Team, number> = { red: 10, blue: 10, ffa: 10 }
  private coloniesMade: Record<Team, number> = { red: 0, blue: 0, ffa: 0 }
  private queensBorn: Record<Team, number> = { red: 0, blue: 0, ffa: 0 }
  private nextId = 0
  private random: () => number
  private fighterGrid = new Map<string, Fighter[]>()
  private gridRadius = 0

  private buildFighterGrid() {
    this.fighterGrid.clear()
    this.gridRadius = 0
    for (const fighter of this.fighters) {
      if (fighter.hp <= 0 || fighter.inside || fighter.heldBy) continue
      const key = `${Math.floor(fighter.x / 96)},${Math.floor(fighter.y / 96)}`
      const cell = this.fighterGrid.get(key)
      if (cell) cell.push(fighter)
      else this.fighterGrid.set(key, [fighter])
      if (!fighter.nest) this.gridRadius = Math.max(this.gridRadius, fighterDef(fighter).radius)
    }
  }

  private *nearbyFighters(x: number, y: number, radius: number) {
    for (let cy = Math.floor((y - radius) / 96); cy <= Math.floor((y + radius) / 96); cy++) {
      for (let cx = Math.floor((x - radius) / 96); cx <= Math.floor((x + radius) / 96); cx++) {
        const cell = this.fighterGrid.get(`${cx},${cy}`)
        if (cell) yield* cell
      }
    }
  }

  constructor(random: () => number = Math.random) {
    this.random = random
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.water.resize(width, height)
    for (const tower of this.towers) this.clampTower(tower)
    for (const tree of this.trees) this.clampTree(tree)
    for (const fighter of this.fighters) this.clamp(fighter)
  }

  private clampTree(tree: { x: number; y: number }) {
    const marginX = Math.min(44, this.width / 2)
    const marginTop = Math.min(TREE_HEIGHT + 4, this.height - 10)
    tree.x = Math.max(marginX, Math.min(this.width - marginX, tree.x))
    tree.y = Math.max(marginTop, Math.min(this.height - 10, tree.y))
  }

  placeTree(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > this.width || y > this.height || this.trees.length >= 200) return
    const tree: Tree = { x, y, occupant: null }
    this.clampTree(tree)
    if (this.trees.some((other) => Math.hypot(other.x - tree.x, other.y - tree.y) < TREE_SPACING)) return
    this.trees.push(tree)
    for (const fighter of this.fighters) {
      if (fighter.zombie || fighter.species !== 'ninja' || fighter.hp <= 0 || fighter.tower || fighter.ambush || fighter.dash
        || fighter.heldBy || fighter.thrown || fighter.falling || fighter.stun > 0 || fighter.fear > 0 || fighter.lure) continue
      if (Math.hypot(fighter.x - tree.x, fighter.y - tree.y) <= 18 && this.hideNinja(fighter, tree)) break
    }
  }

  private clampTower(tower: Tower) {
    const marginX = Math.min(48, this.width / 2)
    const marginTop = Math.min(TOWER_HEIGHT + 48, this.height - 20)
    tower.x = Math.max(marginX, Math.min(this.width - marginX, tower.x))
    tower.y = Math.max(marginTop, Math.min(this.height - 20, tower.y))
  }

  placeTower(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > this.width || y > this.height || this.towers.length >= 100) return
    const tower: Tower = { x, y, hp: TOWER_HP, occupant: null, fall: 0 }
    this.clampTower(tower)
    if (this.towers.some((other) => Math.hypot(other.x - tower.x, other.y - tower.y) < TOWER_SPACING)) return
    this.towers.push(tower)
    return tower
  }

  private leaveTower(fighter: Fighter, falling = false) {
    if (fighter.tower?.occupant === fighter) fighter.tower.occupant = null
    fighter.tower = null
    fighter.falling = falling && fighter.elevation > 0
    if (!fighter.falling) fighter.elevation = 0
  }

  private hitTower(tower: Tower, damage: number, owner?: Fighter) {
    if (tower.hp <= 0) return
    if (owner && tower.occupant) this.rally(tower.occupant, owner)
    tower.hp = Math.max(0, tower.hp - damage)
    if (tower.hp > 0) return
    tower.fall = TOWER_COLLAPSE
    const occupant = tower.occupant
    if (occupant) {
      this.leaveTower(occupant, true)
      occupant.charge = occupant.lightning = null
      occupant.saintRest = null
      occupant.casting = 0
      occupant.vx = occupant.vy = 0
    }
    this.impacts.push({ x: tower.x, y: tower.y, radius: 45, life: TOWER_COLLAPSE })
  }

  private stepTowerOccupant(fighter: Fighter) {
    const tower = fighter.tower!
    fighter.hidden = false
    if (fighter.species === 'ninja' && fighter.stun <= 0 && fighter.fear <= 0 && !fighter.lure) {
      const tree = this.nearestNinjaTree(fighter)
      if (tree && this.returnNinjaToTree(fighter, tree)) return
    }
    fighter.x = tower.x
    fighter.y = tower.y
    fighter.vx = fighter.vy = 0
    if (fighter.stun > 0 || fighter.fear > 0) return
    const roof = TOWER_ROOF + fighterDef(fighter).radius
    if (fighter.elevation < roof) fighter.phase += DT * 10
    fighter.elevation = Math.min(roof, fighter.elevation + DT * roof / 0.8)
    if (fighter.elevation < roof) return
    if (fighter.species === 'ninja' && fighter.cooldown > 0) return
    let target = this.retaliationTarget(fighter)
    if (!target) {
      let nearest: number = fighter.species === 'ninja' ? NINJA.range : UNITS.thor.detection
      for (const other of this.fighters) {
        if (!targetable(fighter, other)) continue
        const distance = Math.hypot(other.x - fighter.x, other.y - fighter.y)
        if (distance <= nearest) { target = other; nearest = distance }
      }
    }
    fighter.target = target
    if (!target) { this.stepHeroRest(fighter); return }
    fighter.saintRest = null
    if (fighter.cooldown > 0 || (fighter.species === 'thor' && fighter.skillCooldown > 0)) return
    if (Math.abs(target.x - fighter.x) > 2) fighter.facing = target.x > fighter.x ? 1 : -1
    if (fighter.species === 'ninja') {
      const dx = target.x - fighter.x, dy = target.y - fighter.y, distance = Math.hypot(dx, dy)
      if (distance > NINJA.range + NINJA.radius + fighterDef(target).radius) return
      const nx = distance > 0.001 ? dx / distance : fighter.facing, ny = distance > 0.001 ? dy / distance : 0
      this.ninjaAttack(fighter, target, nx, ny)
      fighter.cooldown = NINJA.cooldown
      fighter.attack = 1
      return
    }
    this.storms.push({ owner: fighter, x: target.x, y: target.y, elevation: target.elevation,
      time: THOR_SKILLS.storm.warning, phase: 'warning' })
    fighter.cooldown = THOR_SKILLS.cooldown
    fighter.skillCooldown = THOR_SKILLS.cooldown
    fighter.casting = 1
    fighter.attack = 1
  }

  private seekTower(fighter: Fighter) {
    if (fighter.zombie || (fighter.species !== 'thor' && fighter.species !== 'ninja') || fighter.stun > 0 || fighter.fear > 0 || fighter.hammerOut || fighter.lure) return false
    if (fighter.ambush) return false
    if (fighter.species === 'thor' && fighter.hp < fighterDef(fighter).hp) return false
    if (this.retaliationTarget(fighter)) return false
    let nearest: Tower | null = null, distance: number = fighter.species === 'ninja' ? NINJA_AMBUSH.seekRange : UNITS.thor.detection
    for (const tower of this.towers) {
      if (tower.hp <= 0 || tower.occupant) continue
      const d = Math.hypot(tower.x - fighter.x, tower.y - fighter.y)
      if (d <= distance) { nearest = tower; distance = d }
    }
    if (!nearest) return false
    if (distance <= 30) {
      nearest.occupant = fighter
      fighter.tower = nearest
      fighter.target = null
      fighter.vx = fighter.vy = 0
      this.stepTowerOccupant(fighter)
    } else {
      const dx = nearest.x - fighter.x, dy = nearest.y - fighter.y
      fighter.facing = dx > 0 ? 1 : -1
      const speed = UNITS[fighter.species].speed
      this.move(fighter, dx / distance * speed, dy / distance * speed)
    }
    return true
  }

  private attackTower(fighter: Fighter, target: Fighter) {
    const tower = target.tower
    if (!tower || tower.hp <= 0) return false
    const def = fighterDef(fighter)
    const dx = tower.x - fighter.x, dy = tower.y - fighter.y
    const distance = Math.hypot(dx, dy)
    const nx = distance > 0.001 ? dx / distance : fighter.facing, ny = distance > 0.001 ? dy / distance : 0
    if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
    const flying = canFly(fighter)
    if (flying) {
      const change = Math.max(-DT * 160, Math.min(DT * 160, target.elevation - fighter.elevation))
      fighter.elevation += change
    }
    const reach = def.radius + (flying ? fighterDef(target).radius : 28) + def.range
    if (!fighter.zombie && fighter.species === 'vampire') this.setVampireBat(fighter, distance > reach || !canReach(fighter, target))
    const speed = fighter.bat ? VAMPIRE_BAT.speed : def.speed
    if (distance > reach) this.move(fighter, nx * speed, ny * speed)
    else {
      this.move(fighter, 0, 0)
      if (fighter.cooldown <= 0 && (!flying || canReach(fighter, target))) {
        fighter.cooldown = def.cooldown
        fighter.attack = 1
        if (!flying) this.hitTower(tower, def.damage, fighter)
        else if (fighter.species === 'vampire') this.vampireBite(fighter, target, nx, ny)
        else if (fighter.species === 'goose') this.peck(fighter, target)
        else if (antSoldier(fighter)) this.hit(target, def.damage, nx * def.knockback, ny * def.knockback, fighter)
        else this.fireAttack(fighter, target, nx, ny)
      }
    }
    return true
  }

  private clamp(fighter: Fighter) {
    if (fighter.tower) {
      fighter.x = fighter.tower.x
      fighter.y = fighter.tower.y
      return
    }
    const def = fighterDef(fighter)
    const marginX = Math.min(24 * def.size, this.width / 2)
    const marginTop = Math.min(41 * def.size - def.radius, this.height / 2)
    const marginBottom = Math.min(12 * def.size, this.height / 2)
    fighter.x = Math.max(marginX, Math.min(this.width - marginX, fighter.x))
    fighter.y = Math.max(marginTop, Math.min(this.height - marginBottom, fighter.y))
    if (fighter.species !== 'siren' || fighter.heldBy) return

    const previous = fighter.waterPosition
    if (!previous) {
      // A new siren brings a small pond when placed on dry paper.
      if (!this.water.inWater(fighter.x, fighter.y)) this.water.paint(fighter.x, fighter.y, true)
    } else if (!this.water.inWater(previous.x, previous.y)
      || previous.x < marginX || previous.x > this.width - marginX
      || previous.y < marginTop || previous.y > this.height - marginBottom) {
      // A resize may leave her former pond outside the battlefield.
      let nearest = Infinity, wetX = fighter.x, wetY = fighter.y
      for (let k = 0; k < this.water.bmask.length; k++) {
        if (!(this.water.bmask[k] & 2)) continue
        const x = (k % this.water.bcols + 0.5) * BCELL
        const y = (Math.floor(k / this.water.bcols) + 0.5) * BCELL
        if (x < marginX || x > this.width - marginX || y < marginTop || y > this.height - marginBottom) continue
        const distance = (x - fighter.x) ** 2 + (y - fighter.y) ** 2
        if (distance < nearest) { nearest = distance; wetX = x; wetY = y }
      }
      fighter.x = wetX
      fighter.y = wetY
      if (nearest === Infinity) this.water.paint(fighter.x, fighter.y, true)
      fighter.vx = fighter.vy = 0
    } else {
      // Check the whole path so a shove or throw cannot skip a dry gap.
      const dx = fighter.x - previous.x, dy = fighter.y - previous.y
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (BCELL / 2)))
      for (let k = 1; k <= steps; k++) {
        if (this.water.inWater(previous.x + dx * k / steps, previous.y + dy * k / steps)) continue
        fighter.x = previous.x + dx * (k - 1) / steps
        fighter.y = previous.y + dy * (k - 1) / steps
        fighter.vx = fighter.vy = 0
        break
      }
    }
    fighter.waterPosition = { x: fighter.x, y: fighter.y }
  }

  spawn(x: number, y: number, team: Team, species: Species = 'goose', commander = false) {
    if (this.fighters.length >= MAX_FIGHTERS) return
    const fighter: Fighter = {
      id: this.nextId++, species, x, y, vx: 0, vy: 0, team, hp: UNITS[species].hp,
      cooldown: 0, attack: 0, hit: 0, fear: 0, scaredBy: null, target: null, retaliation: null, stun: 0, shock: 0, hammerOut: false, catching: 0,
      skillCooldown: 0, swordStack: species === 'swordsaint' ? SWORD_SAINT_SWORDS.max : 0, saint: null, saintRest: null, mei: null, meiMelee: 0, meiRanged: 0, meiFoe: null, meiFox: 0, meiBarrage: 0, meiMine: 0, meiStar: 0, meiHand: 1, meiForm: 0, spartanFormation: null, casting: 0, slam: 0, charge: null, lightning: null,
      spartanSpear: species === 'spartan', spartanMark: null, spartanThrowCooldown: SPARTAN_THROW.opening,
      spartanCommander: species === 'spartan' && commander ? { troops: [] } : null,
      cavalryMounted: species === 'cavalry',
      mantisDuel: null, mantisCooldown: 0, mantisGrace: 0, mantisMeals: 0, mantisEaten: false,
      mantisDodge: null, mantisDodgeCooldown: 0,
      mantisKills: 0, mantisForm: 0, mantisLeap: null, mantisCloak: 0, mantisPrey: null,
      mantisMoon: null, mantisMoonCooldown: 0,
      dash: null, tree: null, treeCooldown: 0, hidden: false, ambush: null,
      grab: null, heldBy: null, thrown: null, dizzy: 0, roar: 0,
      rexMeals: 0, rexNutrition: 0, bleed: 0, bleedOwner: null,
      rexLayTime: 0, rexEggsLaid: 0, rexBaby: false,
      rexKills: 0, rexStomp: 0, rexStompCooldown: 0, rexRam: null, rexRamCooldown: 0,
      rexBloodlust: false, rexBloodlustCall: 0, rexReinforcements: 0,
      stage: 'adult', stageTime: 0, burn: 0, zombie: species === 'zombie', bat: false, infection: null,
      dragonKills: 0, dragonForm: 0, evolution: 0, chill: 0, burnOwner: null,
      dragonMeals: 0, dragonNutrition: 0, dragonProgress: 0, mealFor: null, feeding: null,
      dragonMaturity: 1, dragonTraining: 0, dragonHome: null, dragonSleeping: false,
      dragonQuiet: 0, dragonLayTime: 0, dragonEggsLaid: 0,
      dragonDomain: null, dragonDomainUsed: false,
      nest: species === 'dragon-nest' ? { time: 0, owner: null } : null,
      frozen: 0, iceDive: null, iceDiveCooldown: 0,
      phoenixKills: 0, phoenixForm: 0, phoenixDive: null, phoenixDiveCooldown: PHOENIX_DIVE.opening, phoenixEncoreCooldown: 0,
      lightningSword: null, lightningSwordCooldown: 0,
      song: 0, lure: null,
      waterPosition: null,
      tower: null, elevation: 0, falling: false,
      colony: species === 'anthill' ? { time: 0, need: this.nextColony[team], workers: 0, counted: false, brood: 0,
        level: 0, recruits: 0, exit: 0, alarm: 0, enemy: null } : null,
      antHome: null, antDeployed: false, antFlight: null, taunt: null,
      buildFor: null, inside: null, entry: 0, haulFor: null,
      phase: Math.random() * Math.PI * 2, facing: 1,
    }
    if (fighter.spartanCommander) { fighter.hp *= SPARTAN_COMMANDER.power; fighter.spartanThrowCooldown = 0 }
    this.clamp(fighter)
    if (species === 'siren' && !this.water.inWater(fighter.x, fighter.y)) return
    this.fighters.push(fighter)
    if (species === 'spartan' && !commander) {
      const living = this.fighters.filter((f) => f.species === 'spartan' && f.hp > 0 && !f.zombie && !f.spartanCommander && f.team === team).length
      const previous = this.spartanArmies.get(team)
      const army: SpartanArmy = living === 1 && !(previous?.commander && previous.commander.hp > 0 && !previous.commander.zombie)
        ? { total: 0, chargeUsed: false }
        : this.spartanArmies.get(team) ?? { total: living - 1, chargeUsed: false }
      army.total++
      this.spartanArmies.set(team, army)
      this.trySpartanCommander(team)
    }
    if (species === 'ninja') {
      const tree = this.nearestNinjaTree(fighter, 18)
      if (tree) this.hideNinja(fighter, tree)
    }
    return fighter
  }

  private trySpartanCommander(team: Team) {
    const army = this.spartanArmies.get(team)
    if (!army) return
    const troops = this.fighters.filter((f) => f.species === 'spartan' && f.hp > 0 && !f.zombie
      && !f.spartanCommander && f.team === team)
    if (army.commander) {
      if (army.commander.spartanCommander) army.commander.spartanCommander.troops = troops
      return
    }
    if (troops.length <= SPARTAN_COMMANDER.troops || this.fighters.length >= MAX_FIGHTERS) return
    const x = troops.reduce((sum, f) => sum + f.x, 0) / troops.length
    const y = troops.reduce((sum, f) => sum + f.y, 0) / troops.length
    const leader = this.spawn(x, y, team, 'spartan', true)
    if (!leader?.spartanCommander) return
    leader.spartanCommander.troops = troops
    army.commander = leader
    this.impacts.push({ x, y, radius: 55, life: 0.4, color: '#edc366' })
  }

  clear() {
    this.fighterGrid.clear()
    for (const fighter of this.fighters) {
      fighter.saintRest = null
      this.cancelDragonDomain(fighter)
      this.removeMantisFromDuel(fighter)
      fighter.mantisDuel = null
      fighter.mantisCooldown = fighter.mantisGrace = fighter.mantisMeals = 0
      fighter.mantisEaten = false
      this.cancelMantisDodge(fighter)
      fighter.mantisDodgeCooldown = 0
      this.cancelMantisLeap(fighter)
      fighter.mantisKills = fighter.mantisForm = fighter.mantisCloak = 0
      fighter.mantisPrey = null
      fighter.mantisMoon = null
      fighter.mantisMoonCooldown = 0
      leaveSpartanFormation(fighter)
      fighter.spartanCommander = null
      fighter.spartanSpear = fighter.species === 'spartan'
      fighter.cavalryMounted = fighter.species === 'cavalry'
      fighter.spartanMark = null
      fighter.spartanThrowCooldown = SPARTAN_THROW.opening
      fighter.dragonDomainUsed = false
      this.setVampireBat(fighter, false)
      this.leaveTower(fighter)
      this.releaseGrab(fighter)
      fighter.thrown = null
      fighter.dash = null
      this.leaveNinjaTree(fighter)
      fighter.treeCooldown = 0
      fighter.ambush = null
      fighter.roar = 0
      fighter.rexMeals = fighter.rexNutrition = fighter.bleed = 0
      fighter.rexLayTime = fighter.rexEggsLaid = 0
      fighter.rexBaby = false
      fighter.rexKills = fighter.rexStomp = fighter.rexStompCooldown = fighter.rexRamCooldown = 0
      fighter.rexBloodlust = false
      fighter.rexBloodlustCall = fighter.rexReinforcements = 0
      fighter.bleedOwner = null
      fighter.shock = 0
      fighter.song = 0
      fighter.lure = null
      fighter.infection = null
      fighter.feeding = null
      fighter.mealFor = null
      fighter.dragonMeals = 0
      fighter.dragonHome = null
      fighter.dragonSleeping = false
      fighter.dragonQuiet = fighter.dragonLayTime = fighter.dragonTraining = 0
      fighter.dragonEggsLaid = 0
      fighter.dragonMaturity = 1
      if (fighter.nest) fighter.nest.owner = null
      fighter.dragonNutrition = fighter.dragonProgress = 0
      fighter.iceDive = null
      fighter.phoenixDive = null
      fighter.phoenixDiveCooldown = PHOENIX_DIVE.opening
      fighter.phoenixKills = fighter.phoenixForm = fighter.phoenixEncoreCooldown = 0
      fighter.lightningSword = null
      fighter.lightningSwordCooldown = 0
      fighter.iceDiveCooldown = fighter.frozen = 0
      fighter.burnOwner = null
      fighter.dragonKills = fighter.dragonForm = fighter.evolution = fighter.chill = 0
      fighter.target = fighter.retaliation = null
      fighter.buildFor = fighter.inside = null
      fighter.antHome = null
      fighter.antDeployed = false
      fighter.taunt = null
      fighter.haulFor = null
      fighter.entry = 0
    }
    this.fighters = []
    this.splats = []
    this.hammers = []
    this.shuriken = []
    this.giantSwords = []
    this.fishThrows = []
    this.blinded = []
    this.craters = []
    this.bolts = []
    this.shots = []
    this.storms = []
    this.impacts = []
    this.mines = []
    this.katanaSlashes = []
    this.flames = []
    this.dragonDomains = []
    this.rings = []
    this.phoenixFires = []
    this.phoenixFireballs = []
    this.spartanFormations = []
    this.spartanArmies.clear()
    this.mantisDuels = []
    this.mantisMolts = []
    this.mantisMoonSlashes = []
    this.iceRings = []
    this.lightningWaves = []
    this.water.clear()
    this.towers = []
    this.trees = []
    this.tick = 0
    this.nextId = 0
    this.nextColony = { red: 10, blue: 10, ffa: 10 }
    this.coloniesMade = { red: 0, blue: 0, ffa: 0 }
    this.queensBorn = { red: 0, blue: 0, ffa: 0 }
  }

  private antAvailable(ant: Fighter) {
    return ant.species === 'ant' && this.antReady(ant)
  }

  private antReady(ant: Fighter) {
    return antSoldier(ant) && !ant.zombie && ant.hp > 0 && !ant.heldBy && !ant.thrown
      && !ant.falling && ant.elevation <= 0 && ant.stun <= 0 && ant.frozen <= 0
      && ant.fear <= 0 && ant.dizzy <= 0 && !ant.lure
  }

  private releaseAntWorker(ant: Fighter) {
    const home = ant.inside
    ant.buildFor = ant.inside = null
    ant.entry = 0
    if (!home) return
    const angle = ant.id * 2.399963, radius = fighterDef(home).radius + fighterDef(ant).radius + 6
    ant.x = home.x + Math.cos(angle) * radius
    ant.y = home.y + Math.sin(angle) * radius
    ant.vx = Math.cos(angle) * 35
    ant.vy = Math.sin(angle) * 35
    this.clamp(ant)
  }

  private dropBody(body: Splat) {
    for (const ant of body.haul?.crew ?? []) if (ant.haulFor === body) ant.haulFor = null
    body.haul = undefined
  }

  private releaseColony(home: Fighter) {
    for (const ant of this.fighters) {
      if (ant.species === 'ant-queen' && ant.inside === home) {
        if (home.hp <= 0) ant.hp = 0
        continue
      }
      if (ant.buildFor === home || ant.inside === home) this.releaseAntWorker(ant)
      if (ant.antHome === home) { ant.antHome = null; ant.antDeployed = false }
    }
    for (const body of this.splats) if (body.haul?.home === home) this.dropBody(body)
  }

  private startColony(seed: Fighter) {
    const margin = 32
    if (this.width < margin * 2 || this.height < margin * 2) return
    for (let k = 0; k < 40; k++) {
      const angle = k * 2.4, distance = k ? 24 + Math.floor(k / 8) * 24 : 0
      const x = Math.max(margin, Math.min(this.width - margin, seed.x + Math.cos(angle) * distance))
      const y = Math.max(margin, Math.min(this.height - margin, seed.y + Math.sin(angle) * distance))
      if (Math.hypot(x - seed.x, y - seed.y) > 120) continue
      if ([[0, 0], [-16, 0], [16, 0], [0, -16], [0, 16]].some(([dx, dy]) => this.water.inWater(x + dx, y + dy))) continue
      if (this.fighters.some((f) => f.hp > 0 && f.colony && Math.hypot(f.x - x, f.y - y) < 70)) continue
      if (this.towers.some((t) => t.hp > 0 && Math.hypot(t.x - x, t.y - y) < 70)) continue
      return this.spawn(x, y, seed.team, 'anthill')
    }
  }

  private stepColonies() {
    for (const ant of this.fighters) {
      if (ant.buildFor && (ant.buildFor.hp <= 0 || !ant.buildFor.colony
        || !allies(ant, ant.buildFor) || !this.antAvailable(ant))) this.releaseAntWorker(ant)
    }
    for (const team of ['red', 'blue', 'ffa'] as const) {
      const ants = this.fighters.filter((ant) => ant.species === 'ant' && ant.hp > 0 && !ant.zombie && ant.team === team)
      let home = this.fighters.find((f) => f.hp > 0 && f.team === team && f.colony)
      if (this.tick % 30 === 1 && ants.length >= this.nextColony[team]) {
        const ready = ants.filter((ant) => this.antAvailable(ant) && !ant.antDeployed)
        if (ready.length >= this.nextColony[team]) {
          if (!home) home = this.startColony(ready[0])
          else if (home.colony!.time >= COLONY_BUILD && home.colony!.level < ANT_ARMY.tiers && home.colony!.alarm <= 0) {
            home.colony!.time = 0
            home.colony!.need = this.nextColony[team]
            home.colony!.counted = false
          }
        }
      }
      if (!home?.colony || home.colony.time >= COLONY_BUILD) continue
      const colony = home.colony
      let assigned = ants.filter((ant) => ant.buildFor === home).length
      for (const ant of ants) {
        if (assigned >= colony.need) break
        if (ant.buildFor || ant.antDeployed || !this.antAvailable(ant)) continue
        if (ant.haulFor) this.dropBody(ant.haulFor)
        ant.buildFor = home
        assigned++
      }
      colony.workers = ants.filter((ant) => ant.inside === home && ant.entry >= 1 && this.antAvailable(ant)).length
      if (colony.workers < colony.need) continue
      colony.time = Math.min(COLONY_BUILD, colony.time + DT)
      if (colony.time >= COLONY_BUILD) {
        this.nextColony[team] *= 2
        colony.level++
        home.hp += colony.level > 1 ? 250 : 0
        home.cooldown = ANTHILL.cooldown
        home.hit = 1
        for (const ant of ants) if (ant.buildFor === home) {
          ant.buildFor = null
          ant.antHome = home
        }
        if (colony.level === 1) colony.recruits += Math.max(0, ANT_ARMY.defenders - ants.filter((ant) => ant.antHome === home).length)
      }
    }
  }

  private workColony(ant: Fighter) {
    const home = ant.buildFor ?? (ant.antHome && !ant.antDeployed && !ant.haulFor ? ant.antHome : null)
    if (!home || home.hp <= 0 || !this.antReady(ant)) return false
    const dx = home.x + 4 - ant.x, dy = home.y + 9 - ant.y, distance = Math.hypot(dx, dy)
    ant.target = null
    if (distance < 8) {
      ant.inside = home
      ant.entry = 0
      ant.x = home.x + 4
      ant.y = home.y + 9
      ant.vx = ant.vy = 0
    } else {
      ant.facing = dx > 0 ? 1 : -1
      const speed = Math.min(ANT.speed, distance / DT)
      this.move(ant, dx / distance * speed, dy / distance * speed)
    }
    return true
  }

  private stepAntQueens() {
    for (const home of this.fighters) {
      if (home.hp <= 0 || !home.colony || home.colony.time < COLONY_BUILD) continue
      if (!home.colony.counted) {
        home.colony.counted = true
        this.coloniesMade[home.team]++
      }
      if (this.queensBorn[home.team] >= Math.floor(this.coloniesMade[home.team] / 4)) continue
      const queen = this.spawn(home.x + 4, home.y + 9, home.team, 'ant-queen')
      if (!queen) continue // Keep the earned queen pending while the page is full.
      this.queensBorn[home.team]++
      queen.inside = home
      queen.entry = 1
    }
  }

  private hatchAnt(home: Fighter) {
    if (!home.colony || home.colony.time < COLONY_BUILD || home.cooldown > 0) return
    const brood = home.colony.brood || (this.fighters.some((queen) => queen.hp > 0 && !queen.zombie
      && queen.species === 'ant-queen' && queen.inside && queen.inside.hp > 0 && allies(home, queen)) ? 2 : 1)
    const colony = home.colony
    colony.brood = brood
    // Food recruits hatch in addition to the ordinary brood; full capacity preserves both queues.
    let budget = brood + Math.min(4, colony.recruits)
    while (budget-- > 0 && this.fighters.length < MAX_FIGHTERS) {
      const roll = this.random()
      const species: Species = colony.level >= 4 && roll < 0.12 ? 'ant-fly'
        : colony.level >= 2 && roll < 0.3 ? 'ant-tank'
        : colony.level >= 3 && roll < 0.75 ? 'ant-slasher' : 'ant'
      const ant = this.spawn(home.x + 4, home.y + 9, home.team, species)
      if (!ant) break
      ant.antHome = ant.inside = home
      ant.entry = 1
      if (colony.brood > 0) colony.brood--
      else colony.recruits--
      home.attack = 1
    }
    if (colony.brood === 0) home.cooldown = colony.recruits > 0 ? 0.4 : ANTHILL.cooldown
  }

  private stepAntArmy() {
    const homes = this.fighters.filter((f) => f.hp > 0 && f.colony && (f.colony.time >= COLONY_BUILD || f.colony.level > 0))
    for (const ant of this.fighters) {
      if (!antSoldier(ant) || ant.zombie || ant.hp <= 0) continue
      if (ant.antHome && (ant.antHome.hp <= 0 || !allies(ant, ant.antHome))) {
        this.releaseAntWorker(ant)
        ant.antHome = null
        ant.antDeployed = false
      }
      if (!ant.antHome && !ant.buildFor) ant.antHome = homes.find((home) => allies(ant, home)) ?? null
    }
    for (const home of homes) {
      const colony = home.colony!
      colony.exit = Math.max(0, colony.exit - DT)
      colony.alarm = Math.max(0, colony.alarm - DT)
      let enemy = colony.enemy
      if (!enemy || !targetable(home, enemy) || Math.hypot(enemy.x - home.x, enemy.y - home.y) > 550) enemy = null
      if (!enemy) enemy = this.fighters.find((f) => targetable(home, f) && !building(f)
        && Math.hypot(f.x - home.x, f.y - home.y) < 240) ?? null
      colony.enemy = enemy
      if (enemy) colony.alarm = 8
      else colony.alarm = 0
      const members = this.fighters.filter((f) => f.hp > 0 && !f.zombie && f.antHome === home)
      const deployed = members.filter((f) => f.antDeployed)
      if (!enemy) for (const ant of deployed) if (ant.species !== 'ant-tank') {
        ant.antDeployed = false
        ant.target = ant.retaliation = null
      }
      if (colony.exit > 0 || deployed.length >= ANT_ARMY.defenders) continue
      const ready = members.filter((ant) => ant.inside === home && ant.entry >= 1 && !ant.buildFor && this.antReady(ant))
      const tanks = deployed.filter((ant) => ant.species === 'ant-tank').length
      const flyers = deployed.filter((ant) => ant.species === 'ant-fly').length
      const priority = (ant: Fighter) => ant.species === 'ant-tank' ? (tanks < 3 ? 0 : 4)
        : ant.species === 'ant-fly' ? (flyers < 2 ? 1 : 5) : ant.species === 'ant-slasher' ? 2 : 3
      ready.sort((a, b) => priority(a) - priority(b))
      const ant = enemy ? ready[0] : tanks < 2 ? ready.find((f) => f.species === 'ant-tank') : undefined
      if (!ant) continue
      this.releaseAntWorker(ant)
      ant.antDeployed = true
      ant.target = ant.retaliation = enemy
      colony.exit = ANT_ARMY.exit
      home.attack = 1
    }
  }

  private stepHauling() {
    const homes = this.fighters.filter((home) => home.hp > 0 && home.colony && home.colony.time >= COLONY_BUILD)
    const free = () => this.fighters.filter((ant) => this.antAvailable(ant) && !ant.buildFor && !ant.antDeployed && !ant.haulFor
      && (!ant.inside || ant.inside === ant.antHome))
    for (const body of this.splats) {
      if (body.meal && (body.meal.owner.hp <= 0 || body.meal.owner.zombie)) body.meal = undefined
      if (!body.body || body.life <= 0 || body.meal) { if (body.haul) this.dropBody(body); continue }
      if (body.haul) {
        const haul = body.haul
        if (haul.home.hp <= 0) this.dropBody(body)
        else haul.crew = haul.crew.filter((ant) => {
          const ready = this.antAvailable(ant) && !ant.buildFor && !ant.inside && allies(ant, haul.home)
          if (!ready && ant.haulFor === body) ant.haulFor = null
          return ready
        })
      }
      const need = Math.min(8, Math.max(2, Math.ceil(body.size * 2)))
      if (this.tick % 15 !== 1) continue
      if (!body.haul) {
        const available = free()
        let home: Fighter | undefined, distance = Infinity
        for (const candidate of homes) {
          if (allies(candidate, body.body) || available.filter((ant) => allies(ant, candidate)).length < need) continue
          const d = Math.hypot(candidate.x - body.x, candidate.y - body.y)
          if (d < distance) { home = candidate; distance = d }
        }
        if (!home) continue
        body.haul = { home, crew: [], entry: 0 }
      }
      const haul = body.haul
      for (const ant of free()) {
        if (haul.crew.length >= need) break
        if (!allies(ant, haul.home)) continue
        if (ant.inside) this.releaseAntWorker(ant)
        ant.antHome = haul.home
        haul.crew.push(ant)
        ant.haulFor = body
      }
    }
  }

  private haulPosition(body: Splat, seat: number) {
    const need = Math.min(8, Math.max(2, Math.ceil(body.size * 2)))
    const angle = seat * Math.PI * 2 / need, radius = Math.max(12, body.size * 10) + 6
    return { x: Math.max(16, Math.min(this.width - 16, body.x + Math.cos(angle) * radius)),
      y: Math.max(24, Math.min(this.height - 10, body.y + Math.sin(angle) * radius)) }
  }

  private haulBody(ant: Fighter) {
    const body = ant.haulFor
    if (!body?.haul || !this.antAvailable(ant)) return false
    const position = this.haulPosition(body, body.haul.crew.indexOf(ant))
    const dx = position.x - ant.x, dy = position.y - ant.y, distance = Math.hypot(dx, dy)
    ant.facing = body.x > ant.x ? 1 : -1
    ant.target = null
    const speed = distance < 3 ? 0 : Math.min(ANT.speed, distance / DT)
    this.move(ant, distance ? dx / distance * speed : 0, distance ? dy / distance * speed : 0)
    return true
  }

  private moveBodies() {
    for (const body of this.splats) {
      const haul = body.haul
      if (!haul) continue
      if (body.life <= 0 || haul.home.hp <= 0) { this.dropBody(body); continue }
      const dx = haul.home.x + 4 - body.x, dy = haul.home.y + 9 - body.y, distance = Math.hypot(dx, dy)
      if (haul.entry > 0) {
        haul.entry = Math.min(1, haul.entry + DT / 0.6)
        body.x += dx * 0.15
        body.y += dy * 0.15
        if (haul.entry >= 1) {
          if (haul.home.colony) {
            haul.home.colony.recruits += Math.max(2, Math.ceil(body.size * ANT_ARMY.food))
            haul.home.cooldown = Math.min(haul.home.cooldown, 0.4)
            haul.home.hit = 1
          }
          body.life = 0
          this.dropBody(body)
        }
        continue
      }
      const need = Math.min(8, Math.max(2, Math.ceil(body.size * 2)))
      if (haul.crew.length < need || !haul.crew.every((ant, seat) => {
        const position = this.haulPosition(body, seat)
        return this.antAvailable(ant) && !ant.buildFor && Math.hypot(ant.x - position.x, ant.y - position.y) < 12
      })) continue
      if (distance < 14) { haul.entry = DT / 0.6; continue }
      const speed = 36 / Math.sqrt(need / 2) * (this.water.inWater(body.x, body.y) ? 0.4 : 1)
      const mx = dx / distance * Math.min(distance, speed * DT), my = dy / distance * Math.min(distance, speed * DT)
      body.x += mx
      body.y += my
      for (const ant of haul.crew) { ant.x += mx; ant.y += my; this.clamp(ant) }
    }
  }

  private retaliationTarget(fighter: Fighter) {
    if (fighter.taunt) {
      if (fighter.taunt.time > 0 && targetable(fighter, fighter.taunt.owner)) return fighter.taunt.owner
      fighter.taunt = null
    }
    const target = fighter.retaliation
    if (!target || target.hp <= 0 || target.stage === 'egg' || concealed(target) || target.inside || allies(fighter, target)) {
      fighter.retaliation = null
      return null
    }
    return target.heldBy ? null : target
  }

  private rally(victim: Fighter, attacker: Fighter) {
    if (attacker.hp <= 0 || attacker.stage === 'egg' || concealed(attacker) || allies(victim, attacker)) return
    if (antFamily(victim) && !victim.zombie) for (const home of this.fighters) {
      if (home.hp > 0 && home.colony && allies(victim, home)) {
        home.colony.alarm = 8
        home.colony.enemy = attacker
      }
    }
    for (const fighter of this.fighters) {
      if (fighter.hp <= 0 || !allies(victim, fighter)) continue
      fighter.retaliation = attacker
      fighter.target = attacker
    }
  }

  private growDragon(dragon: Fighter) {
    if (dragon.dragonMaturity >= 1) return
    const previousHp = fighterDef(dragon).hp
    dragon.dragonMaturity = (Math.min(1, dragon.dragonTraining / DRAGON_BABY.training)
      + Math.min(1, dragon.dragonNutrition / DRAGON_BABY.nutrition)) / 2
    dragon.hp += fighterDef(dragon).hp - previousHp
    this.evolveDragon(dragon)
  }

  private wakeDragon(fighter: Fighter, attacker?: Fighter) {
    const dragon = fighter.species === 'dragon' ? fighter : fighter.nest?.owner ?? fighter.dragonHome?.nest?.owner
    if (!dragon || dragon.hp <= 0 || dragon.zombie) return
    dragon.dragonSleeping = false
    dragon.dragonQuiet = 0
    if (attacker && targetable(dragon, attacker)) dragon.target = dragon.retaliation = attacker
  }

  private detachDragon(dragon: Fighter) {
    if (dragon.dragonHome?.nest?.owner === dragon) dragon.dragonHome.nest.owner = null
    dragon.dragonHome = null
    dragon.dragonSleeping = false
    dragon.dragonQuiet = dragon.dragonLayTime = 0
  }

  private destroyDragonNest(home: Fighter) {
    const dragon = home.nest?.owner
    if (dragon) this.detachDragon(dragon)
    if (home.nest) home.nest.owner = null
    for (const egg of this.fighters) {
      if (egg.species === 'dragon-egg' && egg.dragonHome === home) egg.hp = 0
    }
  }

  private makeDragonNest(dragon: Fighter) {
    const marginX = 24 * DRAGON_NEST.size, marginTop = 41 * DRAGON_NEST.size - DRAGON_NEST.radius
    const marginBottom = 12 * DRAGON_NEST.size
    if (this.width < marginX * 2 || this.height < marginTop + marginBottom) return
    for (let k = 0; k < 80; k++) {
      const angle = k * 2.4 + dragon.id, distance = k ? 30 + Math.floor(k / 16) * 24 : 0
      const x = Math.max(marginX, Math.min(this.width - marginX, dragon.x + Math.cos(angle) * distance))
      const y = Math.max(marginTop, Math.min(this.height - marginBottom, dragon.y + Math.sin(angle) * distance))
      if (Math.hypot(x - dragon.x, y - dragon.y) > 160) continue
      let clear = true
      for (let dx = -DRAGON_NEST.radius; dx <= DRAGON_NEST.radius && clear; dx += 16) {
        for (let dy = -DRAGON_NEST.radius; dy <= DRAGON_NEST.radius; dy += 16) {
          if (this.water.inWater(x + dx, y + dy)) { clear = false; break }
        }
      }
      if (!clear || this.fighters.some((f) => f.hp > 0 && building(f)
        && Math.hypot(f.x - x, f.y - y) < fighterDef(f).radius + DRAGON_NEST.radius + 20)) continue
      if (this.towers.some((t) => t.hp > 0 && Math.hypot(t.x - x, t.y - y) < DRAGON_NEST.radius + 40)
        || this.trees.some((t) => Math.hypot(t.x - x, t.y - y) < DRAGON_NEST.radius + 25)) continue
      const home = this.spawn(x, y, dragon.team, 'dragon-nest')
      if (!home) return
      home.nest!.owner = dragon
      dragon.dragonHome = home
      return
    }
  }

  private stepDragonRest(dragon: Fighter, target: Fighter | null) {
    if (dragon.species !== 'dragon' || dragon.zombie || dragon.dragonMaturity < 1) return false
    if (target || dragon.dragonDomain || dragon.burn > 0 || dragon.stun > 0 || dragon.frozen > 0 || dragon.fear > 0 || dragon.lure) {
      dragon.dragonSleeping = false
      dragon.dragonQuiet = 0
      return false
    }
    dragon.dragonQuiet += DT
    if (dragon.dragonQuiet < DRAGON_NEST.quiet) return false
    if (!dragon.dragonHome || dragon.dragonHome.hp <= 0 || !dragon.dragonHome.nest || !allies(dragon, dragon.dragonHome)) {
      this.detachDragon(dragon)
      dragon.dragonQuiet = DRAGON_NEST.quiet
      if ((this.tick + dragon.id) % 30 === 0) this.makeDragonNest(dragon)
      if (!dragon.dragonHome) return false
    }
    const home = dragon.dragonHome, nest = home.nest!
    const dx = home.x - dragon.x, dy = home.y + 35 - dragon.y, distance = Math.hypot(dx, dy)
    dragon.dragonSleeping = false
    if (distance > 8) {
      const speed = Math.min(fighterDef(dragon).speed, distance / DT)
      if (Math.abs(dx) > 2) dragon.facing = dx > 0 ? 1 : -1
      this.move(dragon, dx / distance * speed, dy / distance * speed)
      return true
    }
    dragon.vx = dragon.vy = 0
    if (nest.time < DRAGON_NEST.build) {
      nest.time = Math.min(DRAGON_NEST.build, nest.time + DT)
      return true
    }
    dragon.dragonSleeping = true
    dragon.hp = Math.min(fighterDef(dragon).hp, dragon.hp + fighterDef(dragon).hp * DRAGON_NEST.heal * DT)
    if (dragon.dragonEggsLaid >= DRAGON_EGG.maxPerDragon) return true
    dragon.dragonLayTime = Math.min(DRAGON_NEST.lay, dragon.dragonLayTime + DT)
    const eggs = this.fighters.filter((egg) => egg.hp > 0 && egg.species === 'dragon-egg' && egg.dragonHome === home)
    if (eggs.length < DRAGON_EGG.max && dragon.dragonLayTime >= DRAGON_NEST.lay) {
      const side = eggs.some((egg) => egg.x < home.x) ? 1 : -1
      const egg = this.spawn(home.x + side * 36, home.y + 55, dragon.team, 'dragon-egg')
      if (egg) {
        egg.dragonHome = home
        egg.stageTime = DRAGON_EGG.hatch
        dragon.dragonEggsLaid++
        dragon.dragonLayTime = 0
      }
    }
    return true
  }

  private stepDragonEgg(egg: Fighter) {
    const home = egg.dragonHome
    if (!home || home.hp <= 0 || !home.nest || !allies(egg, home)) { egg.hp = 0; return }
    if (home.nest.time < DRAGON_NEST.build) return
    egg.stageTime = Math.max(0, egg.stageTime - DT)
    if (egg.stageTime > DT * 0.5) return
    for (let k = 0; k < 12; k++) {
      const angle = k * Math.PI / 6, exit = DRAGON_NEST.radius + 24
      const x = home.x + Math.cos(angle) * exit, y = home.y + Math.sin(angle) * exit
      if (x < 20 || y < 26 || x > this.width - 20 || y > this.height - 12 || this.water.inWater(x, y)) continue
      if (this.fighters.some((f) => f !== egg && f.hp > 0 && !f.nest && !f.inside
        && Math.hypot(f.x - x, f.y - y) < fighterDef(f).radius + 10)) continue
      // Reuse the egg's slot: hatching never exceeds the page's fighter limit.
      egg.species = 'dragon'
      egg.dragonHome = null
      egg.dragonMaturity = 0
      egg.stageTime = egg.burn = egg.chill = egg.frozen = 0
      egg.burnOwner = egg.target = egg.retaliation = null
      egg.cooldown = 0
      egg.x = x; egg.y = y
      egg.hp = fighterDef(egg).hp
      egg.hit = 1
      return
    }
  }

  private stepRexBreeding(rex: Fighter, target: Fighter | null) {
    if (rex.species !== 'rex' || rex.zombie || rex.rexBaby || rex.rexEggsLaid >= TREX_EGG.maxPerRex) return
    if (target || !grounded(rex) || rex.stun > 0 || rex.frozen > 0 || rex.fear > 0 || rex.dizzy > 0
      || rex.burn > 0 || rex.bleed > 0 || rex.lure) { rex.rexLayTime = 0; return }
    rex.rexLayTime = Math.min(TREX_EGG.lay, rex.rexLayTime + DT)
    if (rex.rexLayTime < TREX_EGG.lay || this.fighters.length >= MAX_FIGHTERS) return
    const radius = fighterDef(rex).radius + TREX_EGG.radius + 10
    for (let k = 0; k < 12; k++) {
      const angle = Math.PI * k / 6
      const x = rex.x + Math.cos(angle) * radius, y = rex.y + Math.sin(angle) * radius
      if (x < 24 || y < 32 || x > this.width - 24 || y > this.height - 14
        || [[0, 0], [-8, 0], [8, 0], [0, -8], [0, 8]].some(([dx, dy]) => this.water.inWater(x + dx, y + dy))) continue
      if (this.fighters.some((f) => f !== rex && f.hp > 0 && !f.inside && !f.heldBy && !f.nest
        && Math.hypot(f.x - x, f.y - y) < fighterDef(f).radius + TREX_EGG.radius + 4)) continue
      if (this.towers.some((tower) => tower.hp > 0 && Math.hypot(tower.x - x, tower.y - y) < 28 + TREX_EGG.radius)) continue
      const egg = this.spawn(x, y, rex.team, 'rex-egg')
      if (!egg) return
      egg.stageTime = TREX_EGG.hatch
      rex.rexEggsLaid++
      rex.rexLayTime = 0
      rex.catching = 1
      return
    }
  }

  private stepRexEgg(egg: Fighter) {
    egg.stageTime = Math.max(0, egg.stageTime - DT)
    if (egg.stageTime > DT * 0.5) return
    const radius = TREX.radius * TREX_EGG.babyScale
    for (let k = 0; k < 13; k++) {
      const angle = k * Math.PI / 6, distance = k === 0 ? 0 : 24
      const x = egg.x + Math.cos(angle) * distance, y = egg.y + Math.sin(angle) * distance
      if (x < 28 || y < 35 || x > this.width - 28 || y > this.height - 14
        || this.water.inWater(x, y)) continue
      if (this.fighters.some((f) => f !== egg && f.hp > 0 && !f.inside && !f.heldBy && !f.nest
        && Math.hypot(f.x - x, f.y - y) < fighterDef(f).radius + radius)) continue
      if (this.towers.some((tower) => tower.hp > 0 && Math.hypot(tower.x - x, tower.y - y) < 28 + radius)) continue
      // Reuse the egg's slot, preserving hatching at the creature cap and after the parent's death.
      egg.species = 'rex'
      egg.rexBaby = true
      egg.stageTime = egg.burn = egg.bleed = egg.chill = egg.frozen = 0
      egg.burnOwner = egg.bleedOwner = egg.target = egg.retaliation = null
      egg.x = x; egg.y = y
      egg.hp = fighterDef(egg).hp
      egg.cooldown = TREX.cooldown
      egg.hit = 1
      return
    }
  }

  private claimMeal(owner: Fighter | null | undefined, victim: Fighter) {
    if (victim.hp <= 0 && spartanCommanderProtected(victim)) { victim.hp = 1; return }
    if (victim.hp <= 0) {
      leaveSpartanFormation(victim)
      this.removeMantisFromDuel(victim)
      this.cancelMantisLeap(victim)
      this.revealMantis(victim)
      victim.mantisPrey = null
      victim.mantisMoon = null
    }
    if (!owner || owner.hp <= 0 || owner.zombie || building(victim) || allies(owner, victim)) return
    // An Encore becoming an egg has not died permanently yet.
    if (!victim.zombie && victim.species === 'phoenix' && victim.stage === 'adult') return
    if (owner.species === 'mantis') {
      owner.mantisKills++
      const form = mantisForm(owner.mantisKills)
      if (form > owner.mantisForm) {
        for (let next = owner.mantisForm + 1; next <= form; next++) {
          this.mantisMolts.push({ x: owner.x, y: owner.y, size: fighterDef(owner).size, facing: owner.facing,
            team: owner.team, form: next as MantisForm, life: MANTIS_EVOLUTION.shedLife })
        }
        owner.mantisForm = form
        owner.evolution = MANTIS_EVOLUTION.moltTime
      }
      if (!victim.zombie && (antFamily(victim) || victim.species === 'mantis')) {
        owner.mantisMeals++
        owner.hp = fighterDef(owner).hp
        owner.catching = 1
        victim.mantisEaten = true
      }
      if (owner.mantisForm >= 2) {
        owner.mantisDodgeCooldown = 0
        this.cancelMantisDodge(owner)
        this.cancelMantisLeap(owner)
        this.revealMantis(owner)
        this.tryMantisLeap(owner)
      }
      return
    }
    if (owner.species === 'spartan') {
      if (!owner.spartanSpear && owner.spartanMark === victim) {
        owner.spartanSpear = true
        owner.spartanMark = null
        owner.catching = 1
      }
      return
    }
    if (!['dragon', 'rex', 'phoenix'].includes(owner.species)) return
    if (owner.species === 'phoenix') {
      owner.phoenixKills++
      while (owner.phoenixForm < 2 && owner.phoenixKills >= PHOENIX_FORMS[owner.phoenixForm + 1].kills) {
        const previousHp = fighterDef(owner).hp
        owner.phoenixForm = (owner.phoenixForm + 1) as PhoenixForm
        if (owner.stage === 'adult' || owner.stage === 'reborn') owner.hp += fighterDef(owner).hp - previousHp
        owner.evolution = 0.9
        owner.phoenixDiveCooldown = 0
      }
      if (owner.stage !== 'egg') owner.hp = Math.min(fighterDef(owner).hp, owner.hp + PHOENIX_KILL_HEAL)
      return
    }
    victim.mealFor = owner
    if (owner.species === 'dragon') {
      owner.dragonKills++
      owner.dragonProgress++
      this.evolveDragon(owner)
    } else {
      const previousHp = fighterDef(owner).hp
      owner.rexKills++
      if (owner.rexKills === TREX_BLACK.kills) {
        owner.hp += fighterDef(owner).hp - previousHp
        owner.evolution = 0.9
        owner.skillCooldown = 0
      }
    }
  }

  private evolveDragon(owner: Fighter) {
    if (owner.dragonMaturity < 1) return
    while (owner.dragonForm < 3) {
      const next = (owner.dragonForm + 1) as DragonForm
      if (owner.dragonProgress < DRAGON_FORMS[next].progress) break
      const previousHp = DRAGON_FORMS[owner.dragonForm].hp
      owner.dragonForm = next
      owner.hp += DRAGON_FORMS[next].hp - previousHp
      owner.evolution = 0.9
      owner.skillCooldown = 0
    }
  }

  private stepFeeding(owner: Fighter) {
    if ((owner.species !== 'dragon' && owner.species !== 'rex') || owner.zombie || owner.stun > 0
      || owner.frozen > 0 || owner.fear > 0 || owner.lure) {
      owner.feeding = null
      return false
    }
    if (owner.feeding && (owner.feeding.body.life <= 0 || owner.feeding.body.meal?.owner !== owner)) owner.feeding = null
    if (!owner.feeding) {
      let nearest: Splat | null = null, distance = Infinity
      for (const body of this.splats) {
        if (body.life <= 0 || body.meal?.owner !== owner) continue
        const d = Math.hypot(body.x - owner.x, body.y - owner.y)
        if (d < distance) { nearest = body; distance = d }
      }
      if (!nearest) return false
      owner.feeding = { body: nearest, time: 0 }
    }
    owner.dragonSleeping = false
    owner.dragonQuiet = 0
    owner.rexLayTime = 0
    const feeding = owner.feeding, body = feeding.body
    // Finish airborne actions first, then descend to the fallen prey.
    if (owner.elevation > 0) {
      owner.elevation = Math.max(0, owner.elevation - DT * 160)
      owner.vx = owner.vy = 0
      return true
    }
    const dx = body.x - owner.x, dy = body.y - owner.y, distance = Math.hypot(dx, dy)
    if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
    const def = fighterDef(owner)
    if (distance > def.radius + body.size * 6 + 10) {
      feeding.time = 0
      this.move(owner, dx / distance * def.speed, dy / distance * def.speed)
      return true
    }
    owner.vx = owner.vy = 0
    this.flames = this.flames.filter((flame) => flame.owner !== owner)
    feeding.time += DT
    if (feeding.time >= DRAGON_FEED.bite) {
      body.life = 0
      // Body size is captured at death; visual hit pops and eating shrinkage never affect its value.
      const nutrition = Math.max(1, Math.round(body.size * body.size))
      if (owner.species === 'dragon') {
        owner.dragonMeals++
        owner.dragonNutrition += nutrition
        // The kill already granted one point. Eating earns the rest without counting a second kill.
        owner.dragonProgress += nutrition - 1
        this.growDragon(owner)
        this.evolveDragon(owner)
      } else {
        owner.rexMeals++
        owner.rexNutrition += nutrition
        if (owner.rexMeals >= TREX_EGG.matureMeals) owner.rexBaby = false
        if (owner.rexMeals === TREX_ALPHA.meals) {
          owner.evolution = 0.9
          owner.skillCooldown = 0
        }
      }
      owner.hp = fighterDef(owner).hp
      owner.catching = 1
      owner.feeding = null
    }
    return true
  }

  private hit(target: Fighter, damage: number, kx = 0, ky = 0, owner?: Fighter, shock = 0, dodgeable = false) {
    if (target.hp <= 0 || target.stage === 'egg' || target.inside) return false
    if (target.saint && target.saint.phase !== 'melee') return false // the saint's backflips are immune
    if (target.mei && target.mei.kind !== 'barrage') { // Mei's escape backflip is immune and his shield soaks every hit
      if (target.mei.kind === 'shield' && damage > 0) target.mei.absorbed += damage
      return false
    }
    if (owner && !mantisCanTarget(owner, target)) return false
    if (target.tower && (!owner || !canReach(owner, target))) {
      if (owner) this.hitTower(target.tower, damage, owner)
      return false
    }
    if (dodgeable && damage > 0 && owner && this.tryMantisDodge(target, owner)) return false
    if (damage > 0 && owner && !allies(owner, target) && this.trySaintDeflect(target)) return false
    damage = incomingDamage(target, damage, owner, true)
    const dealt = Math.min(Math.max(0, damage), target.hp)
    target.hp -= damage
    target.hidden = false
    this.revealMantis(target)
    if (owner) this.rally(target, owner)
    if (owner && dealt > 0 && target.species === 'meiyuanzhi' && !target.zombie) {
      const close = Math.hypot(owner.x - target.x, owner.y - target.y)
        <= fighterDef(owner).radius + fighterDef(target).radius + MEI_PRESSURE.closeReach
      if (close) target.meiMelee++
      else { target.meiRanged++; target.meiFoe = owner }
    }
    if (dealt > 0) {
      if (target.saintRest?.kind === 'meditate') target.saintRest = null
      if (target.hp > 0 && !building(target)) target.shock = Math.max(target.shock, shock)
      this.wakeDragon(target, owner)
      if (owner && owner.hp > 0 && owner.species === 'dragon' && !owner.zombie && owner.dragonMaturity < 1
        && !building(target) && !allies(owner, target)) {
        owner.dragonTraining = Math.min(DRAGON_BABY.training, owner.dragonTraining + dealt)
        this.growDragon(owner)
      }
    }
    target.hit = 1
    if (!target.tower && !building(target)) {
      target.vx += kx
      target.vy += ky
    }
    if (target.hp <= 0 && target.tower) this.leaveTower(target)
    if (target.hp <= 0) this.leaveNinjaTree(target)
    if (target.hp <= 0) this.claimMeal(owner, target)
    if (owner && target.hp > 0 && dealt > 0) this.saintFishCounter(target, owner)
    if (target.hp <= 0 && target.colony) this.releaseColony(target)
    if (target.hp <= 0 && target.nest) this.destroyDragonNest(target)
    return true
  }

  private sing(owner: Fighter) {
    const metal = owner.song > 0
    const radius = metal ? SIREN_SONG.radius : SIREN.range
    let closeAudience = false
    for (const target of this.fighters) {
      if (target.hp <= 0 || target.stage === 'egg' || target.heldBy || target.inside || (building(target) && !metal) || allies(owner, target)) continue
      if (!canReach(owner, target)) continue
      const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
      if (distance >= radius + fighterDef(target).radius) continue
      if (metal) {
        const nx = distance > 0.001 ? dx / distance : owner.facing, ny = distance > 0.001 ? dy / distance : 0
        this.hit(target, SIREN.damage, nx * SIREN.knockback, ny * SIREN.knockback, owner)
      } else {
        this.rally(target, owner)
        target.lure = { owner, time: SIREN_SONG.lure }
        if (distance < SIREN_SONG.radius + fighterDef(target).radius) closeAudience = true
      }
    }
    if (!metal && closeAudience && owner.song <= -SIREN_SONG.ballad) {
      owner.song = SIREN_SONG.metal
      for (const target of this.fighters) if (target.lure?.owner === owner) target.lure = null
    }
  }

  private move(fighter: Fighter, speedX: number, speedY: number) {
    if (fighter.chill > 0) { speedX *= DRAGON_ICE.speed; speedY *= DRAGON_ICE.speed }
    if (fighter.species !== 'siren' && fighter.species !== 'swordsaint' && grounded(fighter) && this.water.inWater(fighter.x, fighter.y)) {
      speedX *= 0.5
      speedY *= 0.5
    }
    if (fighter.dizzy > 0) { speedX *= 0.35; speedY *= 0.35 }
    fighter.vx += (speedX - fighter.vx) * 0.13
    fighter.vy += (speedY - fighter.vy) * 0.13
    fighter.x += fighter.vx * DT
    fighter.y += fighter.vy * DT
    fighter.phase += Math.hypot(fighter.vx, fighter.vy) * DT * 0.12
    this.clamp(fighter)
  }

  private fireAttack(owner: Fighter, target: Fighter, nx: number, ny: number) {
    const def = fighterDef(owner)
    const chick = owner.stage === 'chick'
    const element: DragonElement = owner.species === 'dragon' ? DRAGON_FORMS[owner.dragonForm].element : 'fire'
    const burning = element === 'fire'
    const cone = owner.species === 'phoenix' ? Math.cos(PHOENIX_FIRE.halfAngle) : 0.55
    const victims = chick ? [target] : this.fighters
    let ringTarget: Fighter | null = null
    for (const victim of victims) {
      if (victim.hp <= 0 || victim.stage === 'egg' || victim.heldBy || victim.inside || allies(owner, victim)) continue
      if (!canReach(owner, victim)) continue
      const dx = victim.x - owner.x, dy = victim.y - owner.y, distance = Math.hypot(dx, dy)
      if (distance > def.radius + def.range + fighterDef(victim).radius) continue
      if (!chick && distance > 0 && (dx * nx + dy * ny) / distance < cone) continue
      const fire = burning ? fireMultiplier(victim) : 1
      this.hit(victim, def.damage * fire, nx * def.knockback, ny * def.knockback, owner, element === 'lightning' ? ELECTRIC_FLASH : 0)
      if (burning) {
        victim.burn = owner.species === 'dragon' ? DRAGON_FIRE.burn : chick ? PHOENIX_FIRE.chickBurn : PHOENIX_FIRE.burn
        victim.burnOwner = owner
      }
      if (element === 'ice') victim.chill = DRAGON_ICE.duration
      ringTarget ??= victim
    }
    if (!chick) {
      const flame = this.flames.find((flame) => flame.owner === owner)
      if (flame) { flame.nx = nx; flame.ny = ny; flame.life = 0.3; flame.element = element }
      else this.flames.push({ owner, nx, ny, life: 0.3, age: 0, element })
    }
    if (owner.species === 'dragon' && owner.dragonForm >= 2 && owner.skillCooldown <= 0) {
      const first = ringTarget && ringTarget.hp > 0 ? ringTarget : target
      if (targetable(owner, first) && canReach(owner, first)) {
        owner.skillCooldown = DRAGON_LIGHTNING.cooldown
        this.dragonChain(owner, first)
      }
    }
    if (owner.species === 'phoenix' && ringTarget && !chick && owner.skillCooldown <= 0) {
      this.healPhoenix(owner)
    }
  }

  private healPhoenix(owner: Fighter) {
    if (owner.hp <= 0 || owner.zombie || owner.stage === 'egg' || owner.stage === 'chick' || owner.skillCooldown > 0) return
    owner.skillCooldown = 1
    this.rings.push({ owner, life: 1 })
    for (const ally of this.fighters) {
      if (ally.hp <= 0 || ally.stage === 'egg' || !allies(owner, ally)) continue
      if (Math.abs(ally.elevation - owner.elevation) > 24
        || Math.hypot(ally.x - owner.x, ally.y - owner.y) > PHOENIX_FIRE.radius) continue
      ally.hp = Math.max(ally.hp, Math.min(fighterDef(ally).hp, ally.hp + PHOENIX_FIRE.heal))
    }
  }

  private tryPhoenixDive(owner: Fighter, target: Fighter | null) {
    const kind = owner.phoenixForm === 2 && owner.phoenixEncoreCooldown <= 0 ? 'encore'
      : owner.phoenixForm > 0 ? 'barrage' : 'dive'
    const ability = kind === 'encore' ? PHOENIX_ENCORE : kind === 'barrage' ? PHOENIX_BARRAGE : PHOENIX_DIVE
    if (owner.species !== 'phoenix' || owner.zombie || owner.stage === 'egg' || owner.stage === 'chick'
      || owner.phoenixDiveCooldown > 0 || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0 || owner.lure || !grounded(owner)
      || !target || !targetable(owner, target) || !grounded(target)
      || Math.hypot(target.x - owner.x, target.y - owner.y) > ability.range) return false
    let x = target.x, y = target.y, endX = x, endY = y
    if (kind === 'encore') {
      const distance = Math.hypot(x - owner.x, y - owner.y)
      const nx = distance > 0.001 ? (x - owner.x) / distance : owner.facing
      const ny = distance > 0.001 ? (y - owner.y) / distance : 0
      const half = PHOENIX_ENCORE.length / 2
      endX = Math.max(28, Math.min(this.width - 28, x + nx * half))
      endY = Math.max(35, Math.min(this.height - 14, y + ny * half))
      x = Math.max(28, Math.min(this.width - 28, x - nx * half))
      y = Math.max(35, Math.min(this.height - 14, y - ny * half))
      owner.phoenixEncoreCooldown = PHOENIX_ENCORE.cooldown
    }
    owner.phoenixDive = { kind, time: 0, fromX: owner.x, fromY: owner.y, x, y, endX, endY,
      released: 0, wave: -1, hits: new Set() }
    owner.phoenixDiveCooldown = kind === 'encore' ? PHOENIX_BARRAGE.cooldown : ability.cooldown
    owner.attack = 0
    owner.vx = owner.vy = 0
    if (Math.abs(target.x - owner.x) > 2) owner.facing = target.x > owner.x ? 1 : -1
    this.flames = this.flames.filter((flame) => flame.owner !== owner)
    return this.stepPhoenixDive(owner)
  }

  private cancelPhoenixDive(owner: Fighter) {
    if (!owner.phoenixDive) return
    owner.phoenixDive = null
    owner.vx = owner.vy = 0
    owner.falling = owner.elevation > 0 && !owner.heldBy && !owner.thrown && !owner.tower
  }

  private stepPhoenixDive(owner: Fighter) {
    if (owner.hp <= 0 || owner.zombie || owner.stage === 'egg' || owner.stage === 'chick' || owner.stun > 0
      || owner.frozen > 0 || owner.fear > 0 || owner.lure || owner.heldBy || owner.thrown) {
      this.cancelPhoenixDive(owner)
      return false
    }
    if (owner.phoenixDive!.kind === 'barrage') return this.stepPhoenixBarrage(owner)
    if (owner.phoenixDive!.kind === 'encore') return this.stepPhoenixEncore(owner)
    const dive = owner.phoenixDive!, { rise, hover, fall, height } = PHOENIX_DIVE
    dive.time += DT
    owner.vx = owner.vy = 0
    if (dive.time < rise) owner.elevation = height * Math.sin(dive.time / rise * Math.PI / 2)
    else if (dive.time < rise + hover) owner.elevation = height
    else {
      const progress = Math.min(1, (dive.time - rise - hover) / fall)
      owner.x = dive.fromX + (dive.x - dive.fromX) * progress
      owner.y = dive.fromY + (dive.y - dive.fromY) * progress
      owner.elevation = height * (1 - progress) ** 2
      this.clamp(owner)
    }
    if (dive.time < rise + hover + fall) return true
    owner.phoenixDive = null
    owner.elevation = 0
    owner.slam = 1
    this.phoenixBlast(owner, owner.x, owner.y, PHOENIX_DIVE.radius, PHOENIX_DIVE.damage, PHOENIX_DIVE.knockback, PHOENIX_DIVE.burn)
    this.phoenixFires.push({ owner, x: owner.x, y: owner.y, life: PHOENIX_DIVE.fireLife,
      radius: PHOENIX_DIVE.radius, damage: PHOENIX_DIVE.fireDamage, burn: PHOENIX_DIVE.burn })
    this.healPhoenix(owner)
    return true
  }

  private phoenixBlast(owner: Fighter, x: number, y: number, radius: number, damage: number, knockback: number, burn: number) {
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || !grounded(victim)) continue
      const dx = victim.x - x, dy = victim.y - y, distance = Math.hypot(dx, dy)
      if (distance > radius + fighterDef(victim).radius) continue
      const direction = distance > 0 ? Math.atan2(dy, dx) : victim.id * 2.399963
      this.hit(victim, damage * fireMultiplier(victim), Math.cos(direction) * knockback, Math.sin(direction) * knockback, owner)
      if (victim.hp > 0) { victim.burn = Math.max(victim.burn, burn); victim.burnOwner = owner }
    }
    for (const tower of this.towers) {
      if (tower.hp > 0 && tower.occupant && !allies(owner, tower.occupant)
        && Math.hypot(tower.x - x, tower.y - y) <= radius + 28) this.hitTower(tower, damage, owner)
    }
    this.impacts.push({ x, y, radius, life: 0.4, color: '#ef7d34' })
  }

  private stepPhoenixBarrage(owner: Fighter) {
    const dive = owner.phoenixDive!, ability = PHOENIX_BARRAGE
    dive.time += DT
    owner.vx = owner.vy = 0
    const descent = Math.max(0, (dive.time - ability.rise - ability.volley) / ability.fall)
    owner.elevation = ability.height * (dive.time < ability.rise
      ? Math.sin(dive.time / ability.rise * Math.PI / 2) : Math.max(0, 1 - descent))
    while (dive.released < ability.count && dive.time >= ability.rise + dive.released * ability.volley / ability.count) {
      const index = dive.released++, angle = index * 2.399963
      const spread = index === 0 ? 0 : ability.spread * Math.sqrt(index / (ability.count - 1))
      const def = fighterDef(owner)
      this.phoenixFireballs.push({ owner, fromX: owner.x + owner.facing * 21 * def.size,
        fromY: owner.y + def.radius - 26 * def.size, height: owner.elevation,
        x: Math.max(28, Math.min(this.width - 28, dive.x + Math.cos(angle) * spread)),
        y: Math.max(35, Math.min(this.height - 14, dive.y + Math.sin(angle) * spread)), time: 0 })
      owner.attack = 1
    }
    if (dive.time >= ability.rise + ability.volley + ability.fall) {
      owner.phoenixDive = null
      owner.elevation = 0
      this.healPhoenix(owner)
    }
    return true
  }

  private stepPhoenixFireballs() {
    for (const ball of this.phoenixFireballs) {
      if (ball.owner.hp <= 0 || ball.owner.zombie || ball.owner.stage === 'egg' || ball.owner.stage === 'chick') continue
      ball.time += DT
      if (ball.time < PHOENIX_BARRAGE.flight) continue
      const a = PHOENIX_BARRAGE
      this.phoenixBlast(ball.owner, ball.x, ball.y, a.radius, a.damage, a.knockback, a.burn)
      this.phoenixFires.push({ owner: ball.owner, x: ball.x, y: ball.y, radius: a.radius,
        damage: a.fireDamage, burn: a.burn, life: a.fireLife })
    }
    this.phoenixFireballs = this.phoenixFireballs.filter((ball) => ball.time < PHOENIX_BARRAGE.flight
      && ball.owner.hp > 0 && !ball.owner.zombie && ball.owner.stage !== 'egg' && ball.owner.stage !== 'chick')
  }

  private stepPhoenixEncore(owner: Fighter) {
    const dive = owner.phoenixDive!, a = PHOENIX_ENCORE, previous = dive.time
    dive.time += DT
    owner.vx = owner.vy = 0
    if (dive.time < a.rise) {
      const t = dive.time / a.rise
      owner.x = dive.fromX + (dive.x - dive.fromX) * t
      owner.y = dive.fromY + (dive.y - dive.fromY) * t
      owner.elevation = a.height * Math.sin(t * Math.PI / 2)
      return true
    }
    owner.elevation = a.height
    const segments = Math.ceil(Math.hypot(dive.endX - dive.x, dive.endY - dive.y) / a.spacing)
    for (let wave = 0; wave < a.waves; wave++) {
      const start = a.rise + wave * a.pass, end = start + a.pass
      if (dive.time < start || previous >= end) continue
      if (dive.wave !== wave) { dive.wave = wave; dive.hits.clear(); dive.released = 0 }
      const from = Math.max(0, (previous - start) / a.pass), to = Math.min(1, (dive.time - start) / a.pass)
      const ax = wave % 2 ? dive.endX : dive.x, ay = wave % 2 ? dive.endY : dive.y
      const dx = (wave % 2 ? dive.x : dive.endX) - ax, dy = (wave % 2 ? dive.y : dive.endY) - ay
      const px = ax + dx * from, py = ay + dy * from
      owner.x = ax + dx * to; owner.y = ay + dy * to
      if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
      for (const victim of this.fighters) {
        if (dive.hits.has(victim) || !targetable(owner, victim) || !grounded(victim)
          || segmentDistance(victim.x, victim.y, px, py, owner.x, owner.y) > a.radius + fighterDef(victim).radius) continue
        dive.hits.add(victim)
        this.hit(victim, a.damage * fireMultiplier(victim), 0, a.knockback * (wave % 2 ? -1 : 1), owner)
        if (victim.hp > 0) { victim.burn = Math.max(victim.burn, a.burn); victim.burnOwner = owner }
      }
      for (const tower of this.towers) {
        if (dive.hits.has(tower) || tower.hp <= 0 || !tower.occupant || allies(owner, tower.occupant)
          || segmentDistance(tower.x, tower.y, px, py, owner.x, owner.y) > a.radius + 28) continue
        dive.hits.add(tower)
        this.hitTower(tower, a.damage, owner)
      }
      while (dive.released <= segments && dive.released / Math.max(1, segments) <= to) {
        const t = dive.released++ / Math.max(1, segments)
        this.phoenixFires.push({ owner, x: ax + dx * t, y: ay + dy * t, radius: a.radius,
          damage: a.fireDamage, burn: a.burn, life: a.fireLife })
      }
    }
    const fall = (dive.time - a.rise - a.waves * a.pass) / a.fall
    if (fall > 0) owner.elevation = a.height * Math.max(0, 1 - fall)
    this.clamp(owner)
    if (fall >= 1) {
      owner.phoenixDive = null
      owner.elevation = 0
      owner.slam = 1
      this.healPhoenix(owner)
    }
    return true
  }

  private stepPhoenixFires() {
    const pulse = this.tick % Math.round(PHOENIX_DIVE.fireTick / DT) === 0
    const scorched = new Map<Fighter, Set<Fighter | Tower>>()
    // Strongest patches first; one Phoenix cannot stack overlapping ground fire.
    if (pulse) this.phoenixFires.sort((a, b) => b.damage - a.damage)
    for (const fire of this.phoenixFires) {
      fire.life -= DT
      if (fire.life <= 0 || fire.owner.zombie) { fire.life = 0; continue }
      if (!pulse) continue
      let hits = scorched.get(fire.owner)
      if (!hits) { hits = new Set(); scorched.set(fire.owner, hits) }
      const damage = fire.damage * PHOENIX_DIVE.fireTick
      for (const victim of this.fighters) {
        if (hits.has(victim) || !targetable(fire.owner, victim) || !grounded(victim)
          || Math.hypot(victim.x - fire.x, victim.y - fire.y) > fire.radius + fighterDef(victim).radius) continue
        hits.add(victim)
        this.hit(victim, damage * fireMultiplier(victim), 0, 0, fire.owner)
        if (victim.hp > 0) { victim.burn = Math.max(victim.burn, fire.burn); victim.burnOwner = fire.owner }
      }
      for (const tower of this.towers) {
        if (hits.has(tower) || tower.hp <= 0 || !tower.occupant || allies(fire.owner, tower.occupant)
          || Math.hypot(tower.x - fire.x, tower.y - fire.y) > fire.radius + 28) continue
        hits.add(tower)
        this.hitTower(tower, damage, fire.owner)
      }
    }
    this.phoenixFires = this.phoenixFires.filter((fire) => fire.life > 0)
  }

  private tryDragonDomain(owner: Fighter) {
    if (owner.species !== 'dragon' || owner.dragonForm !== 3 || owner.zombie || owner.dragonMaturity < 1 || owner.dragonDomainUsed
      || owner.hp <= 0 || owner.hp >= fighterDef(owner).hp * DRAGON_DOMAIN.threshold
      || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0 || owner.lure || !grounded(owner)) return false
    if (!this.fighters.some((f) => targetable(owner, f) && !building(f)
      && Math.hypot(f.x - owner.x, f.y - owner.y) <= DRAGON_DOMAIN.radius)) return false
    this.releaseGrab(owner)
    owner.lightningSword = null
    owner.feeding = null
    owner.dragonSleeping = false
    owner.dragonQuiet = 0
    owner.attack = 0
    owner.vx = owner.vy = 0
    const domain: DragonDomain = { owner, team: owner.team, x: owner.x, y: owner.y, time: 0,
      radius: DRAGON_DOMAIN.radius, sealed: false, captives: new Set() }
    owner.dragonDomain = domain
    owner.dragonDomainUsed = true
    this.dragonDomains.push(domain)
    this.flames = this.flames.filter((flame) => flame.owner !== owner)
    return this.stepDragonDomainCast(owner)
  }

  private cancelDragonDomain(owner: Fighter) {
    const domain = owner.dragonDomain
    if (!domain) return
    if (domain.time < DOMAIN_CAST) {
      owner.roar = 0
      owner.falling = owner.elevation > 0 && !owner.heldBy && !owner.thrown && !owner.tower
    }
    owner.dragonDomain = null
    this.dragonDomains = this.dragonDomains.filter((active) => active !== domain)
  }

  private stepDragonDomainCast(owner: Fighter) {
    const domain = owner.dragonDomain
    if (!domain || domain.time >= DOMAIN_CAST) { if (domain) owner.roar = 0; return false }
    if (owner.hp <= 0 || owner.zombie || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0
      || owner.lure || owner.heldBy || owner.thrown) {
      this.cancelDragonDomain(owner)
      return false
    }
    owner.vx = owner.vy = 0
    owner.roar = domain.time >= DRAGON_DOMAIN.rise && domain.time < DOMAIN_SEAL ? DOMAIN_SEAL - domain.time : 0
    if (domain.time < DRAGON_DOMAIN.rise) owner.elevation = DRAGON_DOMAIN.height * Math.sin(domain.time / DRAGON_DOMAIN.rise * Math.PI / 2)
    else if (domain.time < DOMAIN_SEAL) owner.elevation = DRAGON_DOMAIN.height
    else owner.elevation = DRAGON_DOMAIN.height * (1 - (domain.time - DOMAIN_SEAL) / DRAGON_DOMAIN.fall) ** 2
    return true
  }

  private domainTarget(fighter: Fighter) {
    if (fighter.dragonDomain?.sealed) {
      const captive = [...fighter.dragonDomain.captives].find((victim) => targetable(fighter, victim))
      if (captive) return captive
    }
    for (const domain of this.dragonDomains) {
      if (domain.owner.hp > 0 && !domain.owner.zombie && domain.owner.team === domain.team
        && domain.captives.has(fighter) && !allies(domain.owner, fighter)) return domain.owner
    }
    return null
  }

  private stepDragonDomains() {
    for (const domain of [...this.dragonDomains]) {
      const owner = domain.owner
      if (owner.hp <= 0 || owner.zombie || owner.team !== domain.team || owner.dragonDomain !== domain) {
        this.cancelDragonDomain(owner)
        continue
      }
      const wasCasting = domain.time < DOMAIN_CAST
      domain.time += DT
      if (wasCasting && domain.time >= DOMAIN_CAST) { owner.elevation = 0; owner.roar = 0 }
      if (domain.time < DOMAIN_SEAL) continue
      domain.sealed = true
      const closing = Math.max(0, Math.min(1, (domain.time - DOMAIN_SEAL - DRAGON_DOMAIN.hold) / DRAGON_DOMAIN.shrink))
      domain.radius = DRAGON_DOMAIN.radius + (DRAGON_DOMAIN.finalRadius - DRAGON_DOMAIN.radius) * closing
      for (const victim of this.fighters) {
        if (victim.hp <= 0 || victim.inside || building(victim) || allies(owner, victim)
          || domain.captives.has(victim) || Math.hypot(victim.x - domain.x, victim.y - domain.y) > domain.radius) continue
        domain.captives.add(victim)
        this.releaseGrab(victim)
        if (victim.heldBy) this.releaseGrab(victim.heldBy)
        this.leaveTower(victim, true)
        this.leaveNinjaTree(victim)
        this.cancelPhoenixDive(victim)
        this.removeMantisFromDuel(victim)
        this.cancelMantisDodge(victim)
        this.cancelMantisLeap(victim)
        this.revealMantis(victim)
        victim.mantisPrey = null
        victim.mantisMoon = null
        this.releaseAntWorker(victim)
        if (victim.haulFor) this.dropBody(victim.haulFor)
        victim.charge = victim.lightning = null
        victim.iceDive = victim.lightningSword = null
        victim.dash = victim.ambush = null
        victim.thrown = null
        victim.elevation = 0
        victim.falling = false
        victim.target = victim.retaliation = owner
      }
      for (const victim of [...domain.captives]) {
        if (victim.hp <= 0 || allies(owner, victim)) { domain.captives.delete(victim); continue }
        // Reaching shelter cannot erase a creature already sealed into the arena.
        if (victim.inside) this.releaseAntWorker(victim)
      }
      for (const fighter of [owner, ...domain.captives]) {
        const dx = fighter.x - domain.x, dy = fighter.y - domain.y, distance = Math.hypot(dx, dy)
        const limit = Math.max(0, domain.radius - fighterDef(fighter).radius - 4)
        if (distance <= limit) continue
        fighter.x = domain.x + dx / distance * limit
        fighter.y = domain.y + dy / distance * limit
        fighter.vx = fighter.vy = 0
      }
      if (domain.time < DOMAIN_END) continue
      // The collapse ignores armor, elevation, and temporary combat shields; normal death/rebirth cleanup still runs.
      for (const victim of domain.captives) {
        if (victim.hp <= 0 || allies(owner, victim)) continue
        victim.hp = 0
        this.claimMeal(owner, victim)
      }
      this.impacts.push({ x: domain.x, y: domain.y, radius: DRAGON_DOMAIN.radius, life: 0.8, inferno: true })
      this.cancelDragonDomain(owner)
    }
  }

  private dragonChain(owner: Fighter, first: Fighter) {
    const struck = new Set<Fighter>()
    const damage = fighterDef(owner).damage * 2
    let target: Fighter | null = first
    let x = owner.x + owner.facing * 19 * fighterDef(owner).size
    let y = owner.y - owner.elevation - 18
    for (let hop = 0; hop < DRAGON_LIGHTNING.targets && target; hop++) {
      const current: Fighter = target
      this.shots.push({ owner, x, y, tx: current.x, ty: current.y - current.elevation - 10, life: 0.3 })
      if (this.hit(current, damage, 0, 0, owner, ELECTRIC_FLASH) && current.hp > 0 && !building(current)) current.stun = Math.max(current.stun, DRAGON_LIGHTNING.stun)
      struck.add(current)
      x = current.x
      y = current.y - current.elevation - 10
      target = null
      let nearest: number = DRAGON_LIGHTNING.range
      for (const candidate of this.fighters) {
        if (struck.has(candidate) || !targetable(owner, candidate) || !canReach(owner, candidate)) continue
        const distance = Math.hypot(candidate.x - current.x, candidate.y - current.y)
        if (distance <= nearest) { target = candidate; nearest = distance }
      }
    }
  }

  private tryLightningSword(owner: Fighter, target: Fighter | null) {
    if (owner.zombie || owner.species !== 'dragon' || owner.dragonMaturity < 1 || owner.dragonForm < 2 || owner.lightningSwordCooldown > 0
      || owner.stun > 0 || owner.fear > 0 || owner.lure || !grounded(owner)
      || !target || !targetable(owner, target) || !grounded(target)) return false
    const dx = target.x - owner.x, dy = target.y - owner.y
    if (Math.hypot(dx, dy) > DRAGON_LIGHTNING_SWORD.range + fighterDef(target).radius) return false
    owner.facing = dx >= 0 ? 1 : -1
    owner.lightningSword = { time: 0, angle: Math.atan2(dy, dx), target, released: false }
    owner.lightningSwordCooldown = DRAGON_LIGHTNING_SWORD.cooldown
    owner.attack = 0
    owner.vx = owner.vy = 0
    this.flames = this.flames.filter((flame) => flame.owner !== owner)
    return this.stepLightningSword(owner)
  }

  private stepLightningSword(owner: Fighter) {
    const sword = owner.lightningSword!
    if (owner.zombie || owner.hp <= 0 || owner.stun > 0 || owner.fear > 0 || owner.lure || owner.heldBy || owner.thrown
      || (sword.time < DRAGON_LIGHTNING_SWORD.windup && !targetable(owner, sword.target))) {
      owner.lightningSword = null
      return false
    }
    sword.time += DT
    owner.vx = owner.vy = 0
    const { windup, slash, recovery } = DRAGON_LIGHTNING_SWORD
    if (!sword.released && sword.time >= windup + slash * 0.45) {
      sword.released = true
      this.releaseLightningSword(owner, sword.angle)
    }
    if (sword.time >= windup + slash + recovery) owner.lightningSword = null
    return true
  }

  private releaseLightningSword(owner: Fighter, angle: number) {
    const def = fighterDef(owner), power = owner.dragonForm === 3 ? 4 / 3 : 1
    const reach = (21 + DRAGON_LIGHTNING_SWORD.blade) * def.size
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || !grounded(victim)) continue
      const dx = victim.x - owner.x, dy = victim.y - owner.y, distance = Math.hypot(dx, dy)
      if (distance > reach + fighterDef(victim).radius) continue
      if (distance > 0 && (dx * Math.cos(angle) + dy * Math.sin(angle)) / distance < Math.cos(0.95)) continue
      this.hit(victim, DRAGON_LIGHTNING_SWORD.damage * power, Math.cos(angle) * 80, Math.sin(angle) * 80, owner, ELECTRIC_FLASH)
    }
    // All three crescents share hit history so overlapping waves cannot triple-hit an enemy.
    const hits = new Set<Fighter>()
    for (const offset of [-0.22, 0, 0.22]) {
      const direction = angle + offset
      this.lightningWaves.push({ owner, x: owner.x + owner.facing * 21 * def.size, y: owner.y,
        vx: Math.cos(direction) * DRAGON_LIGHTNING_SWORD.waveSpeed,
        vy: Math.sin(direction) * DRAGON_LIGHTNING_SWORD.waveSpeed,
        remaining: DRAGON_LIGHTNING_SWORD.waveRange, age: 0,
        radius: DRAGON_LIGHTNING_SWORD.waveRadius * DRAGON_FORMS[owner.dragonForm].scale,
        height: 27 * def.size - def.radius, damage: DRAGON_LIGHTNING_SWORD.waveDamage * power, hits })
    }
  }

  private stepLightningWaves() {
    for (const wave of this.lightningWaves) {
      if (wave.owner.hp <= 0 || wave.owner.zombie) { wave.remaining = 0; continue }
      const px = wave.x, py = wave.y
      const travel = Math.min(DRAGON_LIGHTNING_SWORD.waveSpeed * DT, wave.remaining)
      wave.x += wave.vx / DRAGON_LIGHTNING_SWORD.waveSpeed * travel
      wave.y += wave.vy / DRAGON_LIGHTNING_SWORD.waveSpeed * travel
      wave.remaining -= travel
      wave.age += DT
      let blocked = false
      for (const tower of this.towers) {
        if (tower.hp <= 0 || !tower.occupant || allies(wave.owner, tower.occupant)) continue
        if (segmentDistance(tower.x, tower.y, px, py, wave.x, wave.y) > 28 + wave.radius * 0.55) continue
        this.hitTower(tower, wave.damage, wave.owner)
        wave.remaining = 0
        blocked = true
        break
      }
      if (blocked) continue
      for (const victim of this.fighters) {
        if (wave.hits.has(victim) || !targetable(wave.owner, victim) || !grounded(victim)) continue
        if (segmentDistance(victim.x, victim.y, px, py, wave.x, wave.y) > fighterDef(victim).radius + wave.radius * 0.55) continue
        if (this.hit(victim, wave.damage, wave.vx / DRAGON_LIGHTNING_SWORD.waveSpeed * 50,
          wave.vy / DRAGON_LIGHTNING_SWORD.waveSpeed * 50, wave.owner, ELECTRIC_FLASH)) wave.hits.add(victim)
      }
    }
    this.lightningWaves = this.lightningWaves.filter((wave) => wave.remaining > 0)
  }

  private tryIceDive(owner: Fighter, target: Fighter | null) {
    if (owner.zombie || owner.species !== 'dragon' || owner.dragonMaturity < 1 || owner.dragonForm < 1 || owner.iceDiveCooldown > 0
      || owner.stun > 0 || owner.fear > 0 || owner.lure || !grounded(owner)
      || !target || !targetable(owner, target) || !grounded(target)) return false
    const radius = DRAGON_ICE_DIVE.radius * DRAGON_FORMS[owner.dragonForm].scale / 1.2
    if (Math.hypot(target.x - owner.x, target.y - owner.y) > radius + fighterDef(target).radius) return false
    owner.iceDive = { time: 0 }
    owner.iceDiveCooldown = DRAGON_ICE_DIVE.cooldown
    owner.attack = 0
    owner.vx = owner.vy = 0
    this.flames = this.flames.filter((flame) => flame.owner !== owner)
    return this.stepIceDive(owner)
  }

  private stepIceDive(owner: Fighter) {
    if (owner.zombie || owner.hp <= 0 || owner.stun > 0 || owner.fear > 0 || owner.lure || owner.heldBy || owner.thrown) {
      owner.iceDive = null
      owner.falling = owner.elevation > 0 && !owner.heldBy && !owner.thrown
      return false
    }
    const dive = owner.iceDive!
    dive.time += DT
    owner.vx = owner.vy = 0
    const { rise, hover, fall, height } = DRAGON_ICE_DIVE
    if (dive.time < rise) owner.elevation = height * Math.sin(dive.time / rise * Math.PI / 2)
    else if (dive.time < rise + hover) owner.elevation = height
    else owner.elevation = height * Math.pow(Math.max(0, 1 - (dive.time - rise - hover) / fall), 2)
    if (dive.time < rise + hover + fall) return true

    owner.iceDive = null
    owner.elevation = 0
    owner.slam = 1
    const radius = DRAGON_ICE_DIVE.radius * DRAGON_FORMS[owner.dragonForm].scale / 1.2
    const damage = DRAGON_ICE_DIVE.damage * (1 + (owner.dragonForm - 1) * 0.25)
    this.iceRings.push({ x: owner.x, y: owner.y, radius, life: DRAGON_ICE_DIVE.effect })
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || !grounded(victim)) continue
      if (Math.hypot(victim.x - owner.x, victim.y - owner.y) > radius + fighterDef(victim).radius) continue
      if (this.hit(victim, damage, 0, 0, owner) && victim.hp > 0) {
        victim.frozen = Math.max(victim.frozen, DRAGON_ICE_DIVE.freeze)
        victim.stun = Math.max(victim.stun, DRAGON_ICE_DIVE.freeze)
        victim.chill = Math.max(victim.chill, DRAGON_ICE_DIVE.freeze + DRAGON_ICE.duration)
        victim.vx = victim.vy = 0
      }
    }
    return true
  }

  private peck(owner: Fighter, target: Fighter) {
    if (target.hp <= 0 || allies(owner, target) || (!grounded(target) && !target.tower) || !canReach(owner, target)) return
    const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
    if (distance > GOOSE.radius + fighterDef(target).radius + GOOSE.range) return
    const nx = distance > 0.001 ? dx / distance : owner.facing, ny = distance > 0.001 ? dy / distance : 0
    if (!this.hit(target, GOOSE.damage, nx * GOOSE.knockback, ny * GOOSE.knockback, owner, 0, true)) return
    if (!building(target) && this.random() < GOOSE.scare) {
      target.fear = 0.8
      target.scaredBy = owner
    }
  }

  private zombieBite(owner: Fighter, target: Fighter, nx: number, ny: number) {
    if (!targetable(owner, target) || !grounded(target)) return
    const def = fighterDef(owner)
    if (Math.hypot(target.x - owner.x, target.y - owner.y) > def.radius + def.range + fighterDef(target).radius) return
    if (this.hit(target, def.damage, nx * def.knockback, ny * def.knockback, owner, 0, true)
      && target.hp > 0 && !building(target) && !target.zombie && !target.infection) {
      target.infection = { time: ZOMBIE_INFECTION, team: owner.team }
    }
  }

  private turnZombie(fighter: Fighter, team: Team) {
    if (spartanCommanderProtected(fighter)) { fighter.infection = null; return }
    fighter.saintRest = null
    fighter.spartanCommander = null
    this.removeMantisFromDuel(fighter)
    this.cancelMantisDodge(fighter)
    this.cancelMantisLeap(fighter)
    this.revealMantis(fighter)
    fighter.mantisPrey = null
    fighter.mantisMoon = null
    fighter.shock = 0
    fighter.spartanMark = null
    leaveSpartanFormation(fighter)
    this.cancelDragonDomain(fighter)
    this.cancelPhoenixDive(fighter)
    fighter.rexBloodlust = false
    fighter.rexBloodlustCall = fighter.rexReinforcements = 0
    fighter.rexStomp = 0
    fighter.bleed = 0
    fighter.bleedOwner = null
    this.detachDragon(fighter)
    this.releaseAntWorker(fighter)
    fighter.antHome = null
    fighter.antDeployed = false
    fighter.taunt = null
    if (fighter.haulFor) this.dropBody(fighter.haulFor)
    this.setVampireBat(fighter, false)
    fighter.iceDive = null
    fighter.lightningSword = null
    fighter.feeding = null
    this.leaveTower(fighter, true)
    this.leaveNinjaTree(fighter)
    this.releaseGrab(fighter)
    if (fighter.heldBy) this.releaseGrab(fighter.heldBy)
    fighter.zombie = true
    fighter.evolution = 0
    fighter.team = team
    fighter.infection = null
    fighter.stageTime = 0
    fighter.charge = fighter.lightning = null
    fighter.dash = fighter.ambush = null
    fighter.thrown = null
    fighter.target = fighter.retaliation = fighter.scaredBy = null
    fighter.lure = null
    fighter.song = fighter.roar = fighter.casting = fighter.slam = 0
    fighter.attack = fighter.catching = fighter.cooldown = fighter.skillCooldown = 0
    fighter.vx = fighter.vy = 0
    fighter.hammerOut = false
    fighter.hit = 1
    // Old-side projectiles and casts cannot keep attacking after their owner turns.
    this.hammers = this.hammers.filter((hammer) => hammer.owner !== fighter)
    this.shuriken = this.shuriken.filter((star) => star.owner !== fighter)
    this.giantSwords = this.giantSwords.filter((sword) => sword.owner !== fighter)
    this.fishThrows = this.fishThrows.filter((fish) => fish.owner !== fighter)
    this.shots = this.shots.filter((shot) => shot.owner !== fighter)
    this.storms = this.storms.filter((storm) => storm.owner !== fighter)
    this.flames = this.flames.filter((flame) => flame.owner !== fighter)
    this.phoenixFires = this.phoenixFires.filter((fire) => fire.owner !== fighter)
    this.phoenixFireballs = this.phoenixFireballs.filter((ball) => ball.owner !== fighter)
    this.lightningWaves = this.lightningWaves.filter((wave) => wave.owner !== fighter)
    for (const other of this.fighters) {
      if (other.taunt?.owner === fighter) other.taunt = null
      if (other.lure?.owner === fighter) other.lure = null
      if (other.target === fighter) other.target = null
      if (other.retaliation === fighter) other.retaliation = null
      if (other.spartanMark === fighter && allies(other, fighter)) other.spartanMark = null
    }
  }

  private releaseGrab(owner: Fighter) {
    this.dropAntPassenger(owner)
    const target = owner.grab?.target
    if (target?.heldBy === owner) target.heldBy = null
    owner.grab = null
    const rammed = owner.rexRam?.target
    if (rammed?.heldBy === owner) {
      rammed.heldBy = null
      rammed.vx = rammed.vy = 0
    }
    owner.rexRam = null
    return target
  }

  private dropAntPassenger(owner: Fighter) {
    if (!owner.antFlight) return
    const passenger = owner.antFlight?.passenger
    owner.antFlight = null
    owner.elevation = 0
    if (!passenger || passenger.heldBy !== owner) return
    passenger.heldBy = null
    passenger.elevation = 0
    passenger.x = owner.x
    passenger.y = owner.y + 9
    passenger.vx = passenger.vy = 0
    passenger.hit = 0.5
    this.clamp(passenger)
  }

  private stepAntFly(owner: Fighter) {
    if (owner.species !== 'ant-fly' || owner.zombie || owner.inside) return false
    if (owner.hp <= 0 || owner.stun > 0 || owner.fear > 0 || owner.frozen > 0 || owner.lure || owner.heldBy || owner.thrown) {
      this.dropAntPassenger(owner)
      return false
    }
    if (!owner.antFlight && owner.skillCooldown <= 0 && owner.antDeployed) {
      const target = owner.antHome?.colony?.enemy
      if (target && targetable(owner, target) && Math.hypot(target.x - owner.x, target.y - owner.y) > 100) {
        const passenger = this.fighters.find((ant) => (ant.species === 'ant-slasher' || ant.species === 'ant')
          && ant.antDeployed && ant.antHome === owner.antHome && this.antReady(ant) && !ant.inside && !ant.haulFor && !ant.buildFor
          && Math.hypot(ant.x - owner.x, ant.y - owner.y) < 65)
        if (passenger) {
          owner.antFlight = { passenger, target }
          passenger.heldBy = owner
          passenger.vx = passenger.vy = 0
          owner.skillCooldown = 4
        }
      }
    }
    const flight = owner.antFlight
    if (!flight) return false
    const { passenger, target } = flight
    if (passenger.hp <= 0 || passenger.heldBy !== owner || !allies(owner, passenger) || !targetable(owner, target)
      || !owner.antDeployed || !passenger.antDeployed) {
      this.dropAntPassenger(owner)
      return false
    }
    const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
    if (distance <= fighterDef(target).radius + 38) {
      this.dropAntPassenger(owner)
      passenger.target = passenger.retaliation = target
      owner.skillCooldown = 2
      return true
    }
    owner.elevation = Math.min(45, owner.elevation + DT * 140)
    owner.facing = dx >= 0 ? 1 : -1
    this.move(owner, dx / distance * UNITS['ant-fly'].speed, dy / distance * UNITS['ant-fly'].speed)
    passenger.x = owner.x
    passenger.y = owner.y + 7
    passenger.elevation = Math.max(0, owner.elevation - 12)
    return true
  }

  private provokeAnt(owner: Fighter) {
    if (owner.species !== 'ant-tank' || owner.zombie || owner.skillCooldown > 0 || !grounded(owner)
      || owner.stun > 0 || owner.fear > 0 || owner.frozen > 0) return
    let provoked = false
    for (const enemy of this.fighters) {
      if (!targetable(owner, enemy) || building(enemy) || Math.hypot(enemy.x - owner.x, enemy.y - owner.y) > ANT_PROVOKE.radius) continue
      enemy.taunt = { owner, time: ANT_PROVOKE.duration }
      enemy.target = owner
      provoked = true
    }
    if (provoked) { owner.skillCooldown = ANT_PROVOKE.cooldown; owner.attack = 1 }
  }

  private setVampireBat(fighter: Fighter, bat: boolean) {
    if (fighter.bat === bat) return
    fighter.bat = bat
    if (!bat) {
      fighter.vx *= 0.2
      fighter.vy *= 0.2
      if (!fighter.target?.tower) fighter.elevation = 0
    }
  }

  private stepVampireFlight(fighter: Fighter, target: Fighter | null) {
    if (fighter.zombie || fighter.species !== 'vampire') return false
    if (!target || fighter.stun > 0 || fighter.fear > 0) {
      this.setVampireBat(fighter, false)
      return false
    }
    // Tower flight uses the shared climb-to-occupant logic instead.
    if (target.tower) return false
    const dx = target.x - fighter.x, dy = target.y - fighter.y, distance = Math.hypot(dx, dy)
    const landing = VAMPIRE.radius + fighterDef(target).radius + VAMPIRE.range + VAMPIRE_BAT.landing
    this.setVampireBat(fighter, distance > landing + (fighter.bat ? 0 : VAMPIRE_BAT.takeoff))
    if (!fighter.bat) return false
    fighter.elevation = Math.min(VAMPIRE_BAT.height, fighter.elevation + DT * 160)
    if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
    this.move(fighter, dx / distance * VAMPIRE_BAT.speed, dy / distance * VAMPIRE_BAT.speed)
    return true
  }

  private vampireBite(owner: Fighter, target: Fighter, nx: number, ny: number) {
    if (owner.bat || !targetable(owner, target) || (!grounded(target) && !target.tower) || !canReach(owner, target)) return
    if (Math.hypot(target.x - owner.x, target.y - owner.y) > VAMPIRE.radius + fighterDef(target).radius + VAMPIRE.range) return
    if (this.hit(target, VAMPIRE.damage, nx * VAMPIRE.knockback, ny * VAMPIRE.knockback, owner, 0, true)) {
      owner.hp = Math.max(owner.hp, Math.min(VAMPIRE.hp, owner.hp + VAMPIRE.damage))
      owner.catching = 1 // brief rising blood drops use the existing, pause-aware pose timer
    }
  }

  private nearestNinjaTree(fighter: Fighter, range: number = NINJA_AMBUSH.seekRange) {
    if (fighter.treeCooldown > 0) return null
    let nearest: Tree | null = null, distance = range
    for (const tree of this.trees) {
      if (tree.occupant && tree.occupant !== fighter) continue
      const d = Math.hypot(tree.x - fighter.x, tree.y - fighter.y)
      if (d <= distance) { nearest = tree; distance = d }
    }
    return nearest
  }

  private leaveNinjaTree(fighter: Fighter) {
    if (fighter.tree?.occupant === fighter) fighter.tree.occupant = null
    fighter.tree = null
    fighter.hidden = false
  }

  private hideNinja(fighter: Fighter, tree: Tree) {
    if (fighter.treeCooldown > 0 || (tree.occupant && tree.occupant !== fighter)) return false
    if (tree.occupant !== fighter) fighter.cooldown = Math.max(fighter.cooldown, 0.4)
    if (fighter.tree !== tree) this.leaveNinjaTree(fighter)
    tree.occupant = fighter
    fighter.tree = tree
    fighter.x = tree.x
    fighter.y = tree.y
    fighter.elevation = NINJA_AMBUSH.perch
    fighter.vx = fighter.vy = 0
    fighter.hidden = fighter.hit <= 0 && fighter.burn <= 0 && fighter.stun <= 0 && fighter.fear <= 0 && !fighter.lure
    return true
  }

  private returnNinjaToTree(fighter: Fighter, tree: Tree) {
    if (fighter.treeCooldown > 0) return false
    const destination = !tree.occupant || tree.occupant === fighter ? tree : this.nearestNinjaTree(fighter)
    if (!destination) return false
    if (Math.hypot(destination.x - fighter.x, destination.y - fighter.y) > NINJA_AMBUSH.returnRange) return false
    this.leaveNinjaTree(fighter)
    destination.occupant = fighter
    const elevation = fighter.elevation
    this.leaveTower(fighter)
    fighter.elevation = elevation
    fighter.tree = destination
    fighter.hidden = false
    fighter.dash = null
    fighter.vx = fighter.vy = 0
    fighter.ambush = { tree: destination, target: null, phase: 'return', time: NINJA_AMBUSH.returnTime,
      fromX: fighter.x, fromY: fighter.y, fromElevation: elevation, toX: destination.x, toY: destination.y, struck: false }
    return true
  }

  private recoverNinja(fighter: Fighter) {
    this.leaveNinjaTree(fighter)
    fighter.treeCooldown = NINJA_AMBUSH.recovery
    fighter.elevation = 0
    fighter.vx = fighter.vy = 0
    fighter.ambush!.phase = 'recover'
    fighter.ambush!.target = null
    fighter.ambush!.time = 0
  }

  private stepNinjaCover(fighter: Fighter) {
    if (fighter.zombie || fighter.species !== 'ninja' || fighter.stun > 0 || fighter.fear > 0 || fighter.lure
      || fighter.treeCooldown > 0 || fighter.ambush?.phase === 'recover') {
      fighter.hidden = false
      return false
    }
    const home = fighter.tree
    const tree = home && (!home.occupant || home.occupant === fighter) ? home : this.nearestNinjaTree(fighter)
    if (fighter.tree !== tree) this.leaveNinjaTree(fighter)
    if (!tree) return false
    fighter.tree = tree
    const dx = tree.x - fighter.x, dy = tree.y - fighter.y, distance = Math.hypot(dx, dy)
    if (distance > 18) {
      fighter.hidden = false
      fighter.elevation = Math.max(0, fighter.elevation - DT * 160)
      if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
      this.move(fighter, dx / distance * NINJA.speed, dy / distance * NINJA.speed)
      return true
    }
    if (!this.hideNinja(fighter, tree)) return false
    if (fighter.cooldown > 0 || fighter.skillCooldown > 0) return true
    let target = this.retaliationTarget(fighter)
    if (target && (!grounded(target) || Math.hypot(target.x - tree.x, target.y - tree.y) > NINJA_AMBUSH.range)) target = null
    if (!target) {
      let nearest: number = NINJA_AMBUSH.range
      for (const other of this.fighters) {
        if (!targetable(fighter, other) || !grounded(other)) continue
        const d = Math.hypot(other.x - tree.x, other.y - tree.y)
        if (d <= nearest) { target = other; nearest = d }
      }
    }
    if (!target) return true
    fighter.target = target
    this.leaveNinjaTree(fighter)
    fighter.skillCooldown = NINJA_DASH.cooldown
    const tx = target.x - fighter.x, ty = target.y - fighter.y, length = Math.hypot(tx, ty)
    const nx = length > 0.001 ? tx / length : fighter.facing, ny = length > 0.001 ? ty / length : 0
    fighter.facing = nx >= 0 ? 1 : -1
    fighter.ambush = { tree, target, phase: 'slash', time: NINJA_AMBUSH.blinkTime,
      fromX: fighter.x, fromY: fighter.y, fromElevation: fighter.elevation,
      toX: target.x + nx * 36, toY: target.y + ny * 36, struck: false }
    return true
  }

  private stepNinjaAmbush(fighter: Fighter) {
    const ambush = fighter.ambush!
    if (ambush.phase === 'recover') {
      fighter.hidden = false
      if (fighter.treeCooldown > 0 || fighter.stun > 0 || fighter.fear > 0 || fighter.lure) return false
      const tree = !ambush.tree.occupant || ambush.tree.occupant === fighter ? ambush.tree : this.nearestNinjaTree(fighter)
      if (!tree) { fighter.ambush = null; return false }
      ambush.tree = tree
      if (this.returnNinjaToTree(fighter, tree)) return true
      const dx = tree.x - fighter.x, dy = tree.y - fighter.y, distance = Math.hypot(dx, dy)
      if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
      this.move(fighter, dx / distance * NINJA.speed, dy / distance * NINJA.speed)
      return true
    }
    if (fighter.stun > 0 || fighter.fear > 0 || fighter.lure || fighter.heldBy || fighter.thrown) {
      fighter.ambush = null
      this.leaveNinjaTree(fighter)
      fighter.treeCooldown = Math.max(fighter.treeCooldown, NINJA_AMBUSH.recovery)
      fighter.falling = fighter.elevation > 0
      return false
    }
    fighter.hidden = false
    ambush.time = Math.max(0, ambush.time - DT)
    if (ambush.phase === 'return') {
      const progress = 1 - ambush.time / NINJA_AMBUSH.returnTime
      fighter.x = ambush.fromX + (ambush.tree.x - ambush.fromX) * progress
      fighter.y = ambush.fromY + (ambush.tree.y - ambush.fromY) * progress
      fighter.elevation = ambush.fromElevation * (1 - progress) + NINJA_AMBUSH.perch * progress
        + Math.sin(progress * Math.PI) * NINJA_AMBUSH.jumpHeight
      this.clamp(fighter)
      if (ambush.time <= 0) {
        fighter.ambush = null
        fighter.cooldown = Math.max(fighter.cooldown, 0.4)
        this.hideNinja(fighter, ambush.tree)
      }
      return true
    }
    const target = ambush.target
    if (!target || !targetable(fighter, target) || !grounded(target)) {
      this.recoverNinja(fighter)
      return true
    }
    const reach = NINJA.radius + fighterDef(target).radius + NINJA_AMBUSH.pokeReach
    const progress = 1 - ambush.time / NINJA_AMBUSH.blinkTime
    const px = fighter.x, py = fighter.y
    fighter.x = ambush.fromX + (ambush.toX - ambush.fromX) * progress
    fighter.y = ambush.fromY + (ambush.toY - ambush.fromY) * progress
    fighter.elevation = ambush.fromElevation * (1 - progress)
    fighter.vx = (fighter.x - px) / DT
    fighter.vy = (fighter.y - py) / DT
    this.clamp(fighter)
    if (!ambush.struck && segmentDistance(target.x, target.y, px, py, fighter.x, fighter.y) <= reach) {
      const dx = ambush.toX - ambush.fromX, dy = ambush.toY - ambush.fromY, length = Math.hypot(dx, dy) || 1
      if (this.hit(target, NINJA.damage * NINJA_DASH.damageMultiplier,
        dx / length * NINJA_DASH.knockback, dy / length * NINJA_DASH.knockback, fighter, 0, true)) {
        this.katanaSlashes.push({ x: target.x, y: target.y - target.elevation,
          angle: Math.atan2(dy, dx), life: KATANA_SLASH_DURATION })
      }
      ambush.struck = true
      fighter.attack = 1
    }
    if (ambush.time <= 0) this.recoverNinja(fighter)
    return true
  }

  private ninjaDangerous(fighter: Fighter, target: Fighter, distance: number) {
    if (distance > 130) return false
    const enemy = fighterDef(target)
    if (fighter.hp < NINJA.hp * 0.4 || enemy.radius > NINJA.radius * 1.4 || enemy.damage >= fighter.hp * 0.65) return true
    let enemies = 0
    for (const other of this.fighters) {
      if (!targetable(fighter, other)) continue
      if (Math.hypot(other.x - fighter.x, other.y - fighter.y) < 80 && ++enemies >= 3) return true
    }
    return false
  }

  private stepNinjaDash(owner: Fighter) {
    const dash = owner.dash!, target = dash.target
    if (owner.stun > 0 || owner.fear > 0 || owner.lure || !targetable(owner, target) || !grounded(target)) {
      owner.dash = null
      owner.vx = owner.vy = 0
      return false
    }
    const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
    const nx = distance > 0.001 ? dx / distance : owner.facing, ny = distance > 0.001 ? dy / distance : 0
    const reach = NINJA.radius + fighterDef(target).radius + NINJA_DASH.reach
    const travel = Math.min(NINJA_DASH.speed * DT, Math.max(0, distance - reach))
    owner.x += nx * travel
    owner.y += ny * travel
    owner.vx = nx * NINJA_DASH.speed
    owner.vy = ny * NINJA_DASH.speed
    if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
    owner.phase += DT * 25
    this.clamp(owner)
    dash.time = Math.max(0, dash.time - DT)
    if (Math.hypot(target.x - owner.x, target.y - owner.y) <= reach + 0.01) {
      if (this.hit(target, NINJA.damage * NINJA_DASH.damageMultiplier,
        nx * NINJA_DASH.knockback, ny * NINJA_DASH.knockback, owner, 0, true)) {
        this.katanaSlashes.push({ x: target.x, y: target.y - target.elevation,
          angle: Math.atan2(ny, nx), life: KATANA_SLASH_DURATION })
      }
      owner.attack = 1
      dash.time = 0
    }
    if (dash.time <= 0) {
      owner.dash = null
      owner.treeCooldown = Math.max(owner.treeCooldown, NINJA_AMBUSH.recovery)
      owner.vx = owner.vy = 0
    }
    return true
  }

  private ninjaAttack(owner: Fighter, target: Fighter, nx: number, ny: number) {
    const reach = NINJA.radius + fighterDef(target).radius + NINJA_AMBUSH.pokeReach
    if (Math.hypot(target.x - owner.x, target.y - owner.y) <= reach && canReach(owner, target)) {
      this.hit(target, NINJA.damage, nx * NINJA.knockback, ny * NINJA.knockback, owner, 0, true)
    } else this.throwShuriken(owner, nx, ny, target)
  }

  private mantisReady(fighter: Fighter, allowCloak = false) {
    return fighter.hp > 0 && !fighter.zombie && grounded(fighter) && !fighter.grab
      && fighter.stun <= 0 && fighter.frozen <= 0 && fighter.fear <= 0 && !fighter.lure
      && !fighter.dash && !fighter.ambush && !fighter.charge && !fighter.lightning && !fighter.hidden
      && !fighter.mantisDodge && !fighter.mantisLeap && !fighter.mantisMoon && (allowCloak || fighter.mantisCloak <= 0)
  }

  private tryMantisMoonSlash(owner: Fighter, target: Fighter | null) {
    if (owner.species !== 'mantis' || owner.mantisForm < 1 || owner.mantisMoonCooldown > 0 || owner.cooldown > 0
      || !this.mantisReady(owner, true) || !target || !targetable(owner, target) || !grounded(target)) return false
    const radius = MANTIS_MOON_SLASH.radius * Math.sqrt(fighterDef(owner).size / MANTIS.size)
    const dx = target.x - owner.x, dy = target.y - owner.y
    const distance = Math.hypot(dx, dy)
    if (distance > radius + fighterDef(target).radius
      || (owner.mantisCloak > 0 && distance > MANTIS_EVOLUTION.ambushReach)) return false
    this.revealMantis(owner)
    owner.mantisMoon = { time: 0, angle: Math.atan2(dy, dx) }
    owner.mantisMoonCooldown = MANTIS_MOON_SLASH.cooldown
    owner.cooldown = fighterDef(owner).cooldown
    owner.casting = owner.attack = 1
    owner.vx = owner.vy = 0
    if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
    return true
  }

  private stepMantisMoonSlash(owner: Fighter) {
    const moon = owner.mantisMoon
    if (!moon) return false
    if (owner.hp <= 0 || owner.zombie || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0 || owner.lure
      || !grounded(owner) || owner.grab) {
      owner.mantisMoon = null
      return false
    }
    owner.vx = owner.vy = 0
    owner.attack = owner.casting = 1
    moon.time += DT
    if (moon.time < MANTIS_MOON_SLASH.windup) return true
    owner.mantisMoon = null
    const def = fighterDef(owner), radius = MANTIS_MOON_SLASH.radius * Math.sqrt(def.size / MANTIS.size)
    const x = owner.x, y = owner.y, nx = Math.cos(moon.angle), ny = Math.sin(moon.angle)
    this.mantisMoonSlashes.push({ x, y, angle: moon.angle, radius, life: MANTIS_MOON_SLASH.life })
    for (const target of this.fighters) {
      if (target.hp <= 0 || target.stage === 'egg' || target.heldBy || target.inside || allies(owner, target)
        || !mantisCanTarget(owner, target) || !canReach(owner, target)) continue
      const dx = target.x - x, dy = target.y - y, distance = Math.hypot(dx, dy)
      if (distance > radius + fighterDef(target).radius
        || (distance > 0.001 && (dx * nx + dy * ny) / distance < Math.cos(MANTIS_MOON_SLASH.halfAngle))) continue
      const kx = distance > 0.001 ? dx / distance : nx, ky = distance > 0.001 ? dy / distance : ny
      this.hit(target, def.damage * MANTIS_MOON_SLASH.damageMultiplier,
        kx * MANTIS_MOON_SLASH.knockback, ky * MANTIS_MOON_SLASH.knockback, owner)
    }
    return true
  }

  private revealMantis(fighter: Fighter) {
    fighter.mantisCloak = 0
  }

  private stepMantisCloak(fighter: Fighter) {
    if (fighter.mantisPrey && !targetable(fighter, fighter.mantisPrey)) {
      fighter.mantisPrey = null
      this.revealMantis(fighter)
    }
    if (fighter.mantisCloak > 0 && (fighter.zombie || fighter.hp <= 0 || fighter.grab
      || fighter.heldBy || fighter.thrown || fighter.inside || fighter.stun > 0 || fighter.frozen > 0
      || fighter.fear > 0 || fighter.lure || fighter.burn > 0 || fighter.bleed > 0
      || (fighter.mantisDuel && !mantisOpponent(fighter) && !mantisGuard(fighter)))) this.revealMantis(fighter)
  }

  private tryMantisHunt(fighter: Fighter, target: Fighter | null) {
    if (fighter.species !== 'mantis' || fighter.mantisForm < 3) return false
    if (!target || !targetable(fighter, target) || building(target)) {
      fighter.mantisPrey = null
      this.revealMantis(fighter)
      return false
    }
    if (fighter.mantisPrey === target || !this.mantisReady(fighter, true)
      || (fighter.mantisDuel && !mantisOpponent(fighter) && !mantisGuard(fighter))
      || fighter.burn > 0 || fighter.bleed > 0 || this.domainTarget(fighter)) return false
    if (Math.hypot(target.x - fighter.x, target.y - fighter.y) > MANTIS_EVOLUTION.huntRange) return false
    fighter.mantisPrey = target
    fighter.mantisCloak = 1
    return true
  }

  private tryMantisLeap(fighter: Fighter) {
    if (fighter.species !== 'mantis' || fighter.mantisForm < 2 || !this.mantisReady(fighter) || this.domainTarget(fighter)) return false
    let target: Fighter | null = null
    let nearest: number = MANTIS_EVOLUTION.leapRange
    for (const other of this.fighters) {
      if (!targetable(fighter, other) || !grounded(other) || building(other)) continue
      const duel = fighter.mantisDuel
      if (duel && mantisGuard(fighter)) {
        const escort = duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport'
        if (Math.hypot(other.x - (escort ? duel.carrier.x : duel.x), other.y - (escort ? duel.carrier.y : duel.y))
          > (escort ? MANTIS_GUARD.escortRadius : duel.radius) + MANTIS_GUARD.watch + fighterDef(other).radius) continue
      }
      const distance = Math.hypot(other.x - fighter.x, other.y - fighter.y)
      if (distance < nearest) { nearest = distance; target = other }
    }
    if (!target) return false
    this.tryMantisHunt(fighter, target)
    fighter.mantisLeap = { target, time: 0, fromX: fighter.x, fromY: fighter.y }
    fighter.target = target
    fighter.vx = fighter.vy = 0
    return true
  }

  private cancelMantisLeap(fighter: Fighter) {
    if (!fighter.mantisLeap) return
    fighter.mantisLeap = null
    fighter.elevation = 0
  }

  private stepMantisLeap(fighter: Fighter) {
    const leap = fighter.mantisLeap
    if (!leap) return false
    if (fighter.zombie || fighter.stun > 0 || fighter.frozen > 0 || fighter.fear > 0 || fighter.lure
      || fighter.heldBy || fighter.thrown || fighter.inside || fighter.falling || this.domainTarget(fighter)
      || !targetable(fighter, leap.target) || !grounded(leap.target)) {
      this.cancelMantisLeap(fighter)
      return false
    }
    const duel = fighter.mantisDuel
    if (duel && mantisGuard(fighter)) {
      const escort = duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport'
      if (Math.hypot(leap.target.x - (escort ? duel.carrier.x : duel.x), leap.target.y - (escort ? duel.carrier.y : duel.y))
        > (escort ? MANTIS_GUARD.escortRadius : duel.radius) + MANTIS_GUARD.watch + fighterDef(leap.target).radius) {
        this.cancelMantisLeap(fighter)
        return false
      }
    }
    leap.time += DT
    const progress = Math.min(1, leap.time / MANTIS_EVOLUTION.leapTime), target = leap.target
    const dx = target.x - leap.fromX, dy = target.y - leap.fromY, distance = Math.hypot(dx, dy)
    const def = fighterDef(fighter), reach = def.radius + fighterDef(target).radius + def.range * 0.5
    const travel = Math.max(0, distance - reach)
    fighter.x = leap.fromX + (distance > 0 ? dx / distance * travel : 0) * progress
    fighter.y = leap.fromY + (distance > 0 ? dy / distance * travel : 0) * progress
    fighter.elevation = Math.sin(progress * Math.PI) * MANTIS_EVOLUTION.leapHeight
    fighter.vx = fighter.vy = 0
    if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
    this.clamp(fighter)
    if (progress >= 1) {
      this.cancelMantisLeap(fighter)
      fighter.cooldown = def.cooldown
      fighter.attack = 1
      const length = Math.hypot(target.x - fighter.x, target.y - fighter.y) || 1
      this.mantisAttack(fighter, target, (target.x - fighter.x) / length, (target.y - fighter.y) / length)
    }
    return true
  }

  private tryMantisDodge(fighter: Fighter, attacker: Fighter) {
    if (fighter.species !== 'mantis' || fighter.mantisDodgeCooldown > 0 || !this.mantisReady(fighter)
      || (fighter.mantisDuel && !mantisOpponent(fighter) && !mantisGuard(fighter))) return false
    const dx = fighter.x - attacker.x, dy = fighter.y - attacker.y, distance = Math.hypot(dx, dy)
    const nx = distance > 0.001 ? -dy / distance : 0, ny = distance > 0.001 ? dx / distance : 1
    const radius = fighterDef(fighter).radius, margin = Math.max(32, fighterDef(fighter).size * 32)
    for (const side of [fighter.id % 2 ? 1 : -1, fighter.id % 2 ? -1 : 1]) {
      const x = fighter.x + nx * side * MANTIS_DODGE.distance, y = fighter.y + ny * side * MANTIS_DODGE.distance
      if (x < margin || x > this.width - margin || y < margin || y > this.height - margin) continue
      const duel = fighter.mantisDuel
      if (duel && !mantisGuard(fighter) && Math.hypot(x - duel.x, y - duel.y) > duel.radius - radius - MANTIS_DUEL.wallPadding) continue
      if (this.towers.some((t) => t.hp > 0 && segmentDistance(t.x, t.y, fighter.x, fighter.y, x, y) < radius + 28)
        || this.trees.some((t) => segmentDistance(t.x, t.y, fighter.x, fighter.y, x, y) < radius + 20)
        || this.fighters.some((f) => f !== fighter && f.hp > 0 && grounded(f)
          && Math.hypot(f.x - x, f.y - y) < radius + fighterDef(f).radius)) continue
      let dry = true
      for (let p = 0.25; p <= 1; p += 0.25) {
        if (this.water.inWater(fighter.x + (x - fighter.x) * p, fighter.y + (y - fighter.y) * p)) { dry = false; break }
      }
      if (!dry) continue
      fighter.mantisDodge = { time: MANTIS_DODGE.duration, nx: nx * side, ny: ny * side }
      fighter.mantisDodgeCooldown = MANTIS_DODGE.cooldown
      fighter.vx = fighter.vy = 0
      this.rally(fighter, attacker)
      return true
    }
    return false
  }

  private cancelMantisDodge(fighter: Fighter) {
    if (!fighter.mantisDodge) return
    fighter.mantisDodge = null
    fighter.elevation = 0
  }

  private stepMantisDodge(fighter: Fighter) {
    const dodge = fighter.mantisDodge
    if (!dodge) return false
    if (fighter.zombie || fighter.stun > 0 || fighter.frozen > 0 || fighter.fear > 0 || fighter.lure
      || fighter.heldBy || fighter.thrown || fighter.inside || fighter.falling) {
      this.cancelMantisDodge(fighter)
      return false
    }
    const elapsed = Math.min(DT, dodge.time)
    dodge.time = Math.max(0, dodge.time - DT)
    const speed = MANTIS_DODGE.distance / MANTIS_DODGE.duration
    fighter.x += dodge.nx * speed * elapsed
    fighter.y += dodge.ny * speed * elapsed
    fighter.elevation = Math.sin((1 - dodge.time / MANTIS_DODGE.duration) * Math.PI) * MANTIS_DODGE.height
    fighter.vx = fighter.vy = 0
    this.clamp(fighter)
    if (dodge.time <= 0) this.cancelMantisDodge(fighter)
    return true
  }

  private endMantisDuel(duel: MantisDuel) {
    if (duel.state === 'hop') duel.carrier.elevation = 0
    this.mantisDuels = this.mantisDuels.filter((active) => active !== duel)
    if (duel.carrier.grab?.target === duel.captive) this.releaseGrab(duel.carrier)
    if (duel.captive.heldBy === duel.carrier) duel.captive.heldBy = null
    for (const fighter of [...duel.members, duel.captive]) {
      if (fighter.mantisDuel !== duel) continue
      fighter.mantisDuel = null
      fighter.mantisCooldown = Math.max(fighter.mantisCooldown, MANTIS_DUEL.cooldown)
      fighter.target = null
    }
    duel.captive.mantisGrace = MANTIS_DUEL.grace
    duel.members = []
    duel.challenger = null
    duel.guardVacancies = duel.guardRecruitTime = 0
  }

  private removeMantisFromDuel(fighter: Fighter) {
    const duel = fighter.mantisDuel
    if (!duel) return
    if (fighter === duel.captive || (fighter === duel.carrier && (duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport'))) {
      this.endMantisDuel(duel)
      return
    }
    const replaceGuard = fighter.hp <= 0 && mantisGuard(fighter)
    fighter.mantisDuel = null
    fighter.mantisCooldown = MANTIS_DUEL.cooldown
    fighter.target = null
    duel.members = duel.members.filter((member) => member !== fighter)
    if (fighter === duel.challenger) { duel.challenger = null; duel.state = 'handoff'; duel.time = 0 }
    if (replaceGuard) {
      duel.guardVacancies++
      duel.guardRecruitTime = 0
      this.replaceMantisGuards(duel)
    }
    if (!duel.members.length) this.endMantisDuel(duel)
  }

  private replaceMantisGuards(duel: MantisDuel) {
    if (duel.guardVacancies <= 0 || duel.guardRecruitTime > 0 || !this.mantisDuels.includes(duel)) return
    duel.guardRecruitTime = 0.5
    const escort = duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport'
    const x = escort ? duel.carrier.x : duel.x, y = escort ? duel.carrier.y : duel.y
    const range = (escort ? MANTIS_GUARD.escortRadius : duel.radius) + MANTIS_DUEL.recruit
    const nearby = this.fighters.filter((f) => f.species === 'mantis' && f.team === duel.team
      && !f.mantisDuel && f.mantisCooldown <= 0 && this.mantisReady(f) && !this.domainTarget(f)
      && Math.hypot(f.x - x, f.y - y) <= range)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y) || a.id - b.id)
    for (const replacement of nearby) {
      if (duel.guardVacancies <= 0 || duel.members.length >= MANTIS_DUEL.maxMembers) break
      replacement.mantisDuel = duel
      replacement.target = null
      duel.members.push(replacement)
      duel.guardVacancies--
    }
  }

  private mantisRingPosition(duel: MantisDuel, fighter: Fighter, scale = 1) {
    const index = duel.members.indexOf(fighter)
    const angle = Math.PI + Math.max(0, index) / Math.max(1, duel.members.length) * Math.PI * 2
    const escort = duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport'
    const radius = escort ? MANTIS_GUARD.escortRadius : duel.radius
    return { x: (escort ? duel.carrier.x : duel.x) + Math.cos(angle) * radius * scale,
      y: (escort ? duel.carrier.y : duel.y) + Math.sin(angle) * radius * scale }
  }

  private stepMantisGuard(fighter: Fighter, duel: MantisDuel) {
    if (!mantisGuard(fighter)) return false
    const escort = duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport'
    const cx = escort ? duel.carrier.x : duel.x, cy = escort ? duel.carrier.y : duel.y
    const radius = escort ? MANTIS_GUARD.escortRadius : duel.radius
    let target: Fighter | null = null, best = Infinity
    for (const other of this.nearbyFighters(cx, cy, radius + MANTIS_GUARD.watch + this.gridRadius)) {
      if (other === duel.captive || other.mantisDuel === duel || building(other) || !targetable(fighter, other)) continue
      const distance = Math.hypot(other.x - cx, other.y - cy)
      if (distance > radius + MANTIS_GUARD.watch + fighterDef(other).radius) continue
      const attacking = other.target?.mantisDuel === duel || fighter.retaliation === other
      if (!attacking && distance > radius + fighterDef(other).radius + MANTIS_GUARD.reach) continue
      const assigned = duel.members.filter((f) => f !== fighter && mantisGuard(f) && f.target === other).length
      const score = Math.hypot(other.x - fighter.x, other.y - fighter.y) + assigned * 40 - (attacking ? 40 : 0)
      if (score < best) { best = score; target = other }
    }
    fighter.target = target
    if (!target) { this.tryMantisHunt(fighter, null); return false }
    if (this.tryMantisHunt(fighter, target)) return true
    if (this.tryMantisMoonSlash(fighter, target)) return true
    const dx = target.x - cx, dy = target.y - cy, distance = Math.hypot(dx, dy)
    const nx = distance > 0.001 ? dx / distance : fighter.facing, ny = distance > 0.001 ? dy / distance : 0
    const def = fighterDef(fighter), reach = def.radius + fighterDef(target).radius + def.range + MANTIS_GUARD.reach
    // Stand between the intruder and the club; push breaches back toward the rim.
    const stand = Math.min(radius, Math.max(0, distance - reach * 0.75))
    const mx = cx + nx * stand - fighter.x, my = cy + ny * stand - fighter.y, travel = Math.hypot(mx, my)
    const speed = Math.min(def.speed * MANTIS_GUARD.speed, travel / DT)
    this.move(fighter, travel > 4 ? mx / travel * speed : 0, travel > 4 ? my / travel * speed : 0)
    if (Math.abs(target.x - fighter.x) > 2) fighter.facing = target.x > fighter.x ? 1 : -1
    if (fighter.cooldown <= 0 && grounded(target) && canReach(fighter, target)
      && Math.hypot(target.x - fighter.x, target.y - fighter.y) <= reach) {
      fighter.cooldown = def.cooldown
      fighter.attack = 1
      if (this.hit(target, def.damage, nx * MANTIS_GUARD.knockback, ny * MANTIS_GUARD.knockback, fighter, 0, true)
        && target.hp > 0) target.stun = Math.max(target.stun, MANTIS_GUARD.stun)
    }
    return true
  }

  private tryMantisDuel(owner: Fighter, target: Fighter | null) {
    if (owner.species !== 'mantis' || owner.mantisDuel || owner.mantisCooldown > 0 || owner.cooldown > 0 || !this.mantisReady(owner)
      || !target || !targetable(owner, target) || !grounded(target) || building(target) || target.species === 'siren'
      || target.grab || target.mantisDodge || target.mantisDuel || target.mantisGrace > 0 || fighterDef(target).radius > fighterDef(owner).radius * 1.5) return false
    if (Math.hypot(target.x - owner.x, target.y - owner.y) > MANTIS_DUEL.hopRange) return false
    const nearby = this.fighters.filter((f) => f !== owner && f.species === 'mantis' && f.team === owner.team
      && !f.mantisDuel && f.mantisCooldown <= 0 && this.mantisReady(f)
      && Math.hypot(f.x - owner.x, f.y - owner.y) <= MANTIS_DUEL.recruit)
      .sort((a, b) => Math.hypot(a.x - owner.x, a.y - owner.y) - Math.hypot(b.x - owner.x, b.y - owner.y) || a.id - b.id)
    if (nearby.length < MANTIS_DUEL.members - 1) return false
    owner.mantisCooldown = 0.5 // Retry blocked rings twice per second, rather than scanning dry ground every frame.
    const members = [owner, ...nearby.slice(0, MANTIS_DUEL.maxMembers - 1)]
    const minimum = fighterDef(target).radius * 2 + Math.max(...members.map((f) => fighterDef(f).radius)) * 2 + 18
    const margin = Math.max(32, fighterDef(target).size * 32)
    const radius = Math.min(Math.max(MANTIS_DUEL.radius, minimum), this.width / 2 - margin, this.height / 2 - margin)
    if (radius < Math.max(100, minimum)) return false
    const extent = radius + margin
    const cx = members.reduce((sum, f) => sum + f.x, 0) / members.length
    const cy = members.reduce((sum, f) => sum + f.y, 0) / members.length
    let x = cx, y = cy, found = false
    for (let attempt = 0; attempt < 49; attempt++) {
      const distance = attempt ? Math.ceil(attempt / 8) * 80 : 0, angle = (attempt - 1) % 8 * Math.PI / 4
      x = Math.max(extent, Math.min(this.width - extent, cx + Math.cos(angle) * distance))
      y = Math.max(extent, Math.min(this.height - extent, cy + Math.sin(angle) * distance))
      if (this.towers.some((tower) => tower.hp > 0 && Math.hypot(tower.x - x, tower.y - y) < extent + 28)
        || this.trees.some((tree) => Math.hypot(tree.x - x, tree.y - y) < extent + 20)
        || this.fighters.some((f) => f !== target && !members.includes(f) && f.hp > 0 && !f.heldBy && !f.inside
          && Math.hypot(f.x - x, f.y - y) < extent + fighterDef(f).radius)
        || this.mantisDuels.some((d) => Math.hypot(d.x - x, d.y - y) < d.radius + extent)) continue
      let dry = true
      for (let dx = -extent; dx <= extent && dry; dx += 16) {
        for (let dy = -extent; dy <= extent; dy += 16) {
          if (dx * dx + dy * dy <= extent * extent && this.water.inWater(x + dx, y + dy)) { dry = false; break }
        }
      }
      if (dry) { found = true; break }
    }
    if (!found) return false
    const duel: MantisDuel = { x, y, radius, members, team: owner.team, captive: target, captiveTeam: target.team,
      carrier: owner, challenger: owner, state: 'windup', time: 0, age: 0, hopFromX: owner.x, hopFromY: owner.y,
      guardVacancies: 0, guardRecruitTime: 0 }
    this.mantisDuels.push(duel)
    for (const fighter of [...members, target]) {
      fighter.mantisDuel = duel
      fighter.target = null
      fighter.vx = fighter.vy = 0
    }
    this.rally(target, owner)
    return this.steerMantisDuel(owner)
  }

  private stepMantisDuels() {
    for (const fighter of this.fighters) {
      fighter.mantisCooldown = Math.max(0, fighter.mantisCooldown - DT)
      fighter.mantisGrace = Math.max(0, fighter.mantisGrace - DT)
      fighter.mantisDodgeCooldown = Math.max(0, fighter.mantisDodgeCooldown - DT)
      fighter.mantisMoonCooldown = Math.max(0, fighter.mantisMoonCooldown - DT)
    }
    for (const duel of [...this.mantisDuels]) {
      duel.time += DT; duel.age += DT
      duel.guardRecruitTime = Math.max(0, duel.guardRecruitTime - DT)
      const captive = duel.captive, carrier = duel.carrier
      const settingUp = duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport'
      if ((settingUp && duel.age >= MANTIS_DUEL.setupTimeout) || captive.hp <= 0 || captive.stage === 'egg' || captive.team !== duel.captiveTeam
        || captive.inside || captive.tower || captive.thrown || (captive.heldBy && captive.heldBy !== carrier)
        || duel.x - duel.radius < 24 || duel.y - duel.radius < 32
        || duel.x + duel.radius > this.width - 24 || duel.y + duel.radius > this.height - 14) {
        this.endMantisDuel(duel); continue
      }
      for (const member of [...duel.members]) {
        const dueling = duel.state === 'duel' && member === duel.challenger
        if (member.hp <= 0 || member.zombie || member.team !== duel.team || member.heldBy || member.thrown || member.inside
          || (!dueling && (member.fear > 0 || member.lure
            || (!mantisGuard(member) && (member.stun > 0 || member.frozen > 0))))) this.removeMantisFromDuel(member)
      }
      if (!this.mantisDuels.includes(duel)) continue
      this.replaceMantisGuards(duel)
      if (settingUp) {
        if ((duel.members.length < MANTIS_DUEL.members && duel.guardVacancies <= 0)
          || carrier.mantisDuel !== duel) { this.endMantisDuel(duel); continue }
        if (duel.state === 'windup') {
          if (!grounded(captive) || Math.hypot(captive.x - carrier.x, captive.y - carrier.y) > MANTIS_DUEL.hopRange + 10) { this.endMantisDuel(duel); continue }
          if (duel.time >= MANTIS_DUEL.windup) {
            duel.hopFromX = carrier.x; duel.hopFromY = carrier.y
            duel.state = 'hop'; duel.time = 0
          }
        } else if (duel.state === 'hop') {
          if (!grounded(captive)) { this.endMantisDuel(duel); continue }
          const progress = Math.min(1, duel.time / MANTIS_DUEL.hopTime)
          const dx = captive.x - duel.hopFromX, dy = captive.y - duel.hopFromY, distance = Math.hypot(dx, dy)
          const reach = fighterDef(carrier).radius + fighterDef(captive).radius
          const travel = Math.max(0, distance - reach)
          carrier.x = duel.hopFromX + (distance > 0 ? dx / distance * travel : 0) * progress
          carrier.y = duel.hopFromY + (distance > 0 ? dy / distance * travel : 0) * progress
          carrier.elevation = Math.sin(progress * Math.PI) * MANTIS_DUEL.hopHeight
          carrier.vx = carrier.vy = 0
          if (Math.abs(dx) > 2) carrier.facing = dx > 0 ? 1 : -1
          this.clamp(carrier)
          if (progress >= 1) {
            carrier.elevation = 0
            carrier.grab = { target: captive, time: MANTIS_DUEL.transport }
            captive.heldBy = carrier
            captive.vx = captive.vy = 0
            captive.charge = captive.lightning = null
            captive.dash = null
            captive.ambush = null
            duel.state = 'transport'; duel.time = 0
          }
        } else {
          if (duel.time >= MANTIS_DUEL.transport || carrier.grab?.target !== captive || captive.heldBy !== carrier) {
            this.endMantisDuel(duel); continue
          }
          if (Math.hypot(carrier.x - duel.x, carrier.y - duel.y) > 8) continue
          this.releaseGrab(carrier)
          captive.x = duel.x; captive.y = duel.y
          duel.state = 'bow'; duel.time = 0
        }
      } else {
        this.constrainMantisDuel(duel)
        if (duel.state === 'handoff' && duel.time >= MANTIS_DUEL.handoff) {
          duel.challenger = duel.members.find((f) => this.mantisReady(f, true)) ?? null
          if (!duel.challenger) { this.endMantisDuel(duel); continue }
          duel.state = 'bow'; duel.time = 0
        } else if (duel.state === 'bow' && duel.challenger) {
          const position = this.mantisRingPosition(duel, duel.challenger, 0.45)
          if (Math.hypot(duel.challenger.x - position.x, duel.challenger.y - position.y) > 10) duel.time = 0
          if (duel.time >= MANTIS_DUEL.bow) { duel.state = 'duel'; duel.time = 0 }
        }
      }
    }
  }

  private constrainMantisDuel(duel: MantisDuel) {
    if (duel.state === 'windup' || duel.state === 'hop' || duel.state === 'transport') return
    for (const fighter of [duel.captive, duel.challenger]) {
      if (!fighter || fighter.hp <= 0 || fighter.mantisDuel !== duel) continue
      const dx = fighter.x - duel.x, dy = fighter.y - duel.y, distance = Math.hypot(dx, dy)
      const limit = Math.max(0, duel.radius - fighterDef(fighter).radius - MANTIS_DUEL.wallPadding)
      if (distance <= limit) continue
      const nx = dx / distance, ny = dy / distance
      fighter.x = duel.x + nx * limit
      fighter.y = duel.y + ny * limit
      const outward = fighter.vx * nx + fighter.vy * ny
      if (outward > 0) { fighter.vx -= nx * outward; fighter.vy -= ny * outward }
    }
  }

  private steerMantisDuel(fighter: Fighter) {
    const duel = fighter.mantisDuel
    if (!duel) return false
    if (fighter.hp <= 0 || fighter.inside || fighter.thrown || (fighter.heldBy && !(fighter === duel.captive && fighter.heldBy === duel.carrier))) {
      this.removeMantisFromDuel(fighter); return false
    }
    if (mantisOpponent(fighter)) return false
    if (mantisGuard(fighter) && (fighter.stun > 0 || fighter.frozen > 0) && fighter.fear <= 0 && !fighter.lure) {
      fighter.target = null
      this.move(fighter, 0, 0)
      return true
    }
    if (fighter !== duel.captive && (fighter.stun > 0 || fighter.frozen > 0 || fighter.fear > 0 || fighter.lure)) {
      this.removeMantisFromDuel(fighter); return false
    }
    if (fighter === duel.captive) {
      if (duel.state !== 'transport') this.move(fighter, 0, 0)
      return true
    }
    if (fighter === duel.carrier && duel.state === 'hop') return true
    if (this.stepMantisGuard(fighter, duel)) return true
    let x = fighter.x, y = fighter.y, slow = 1
    if (fighter === duel.carrier && duel.state === 'transport') { x = duel.x; y = duel.y; slow = MANTIS_DUEL.carrySpeed }
    else if (!(fighter === duel.carrier && duel.state === 'windup')) {
      const position = this.mantisRingPosition(duel, fighter, fighter === duel.challenger ? 0.45 : 1)
      x = position.x; y = position.y
    }
    const dx = x - fighter.x, dy = y - fighter.y, distance = Math.hypot(dx, dy)
    const speed = distance > 4 ? Math.min(fighterDef(fighter).speed * slow, distance / DT) : 0
    this.move(fighter, distance > 0 ? dx / distance * speed : 0, distance > 0 ? dy / distance * speed : 0)
    if (Math.abs(duel.x - fighter.x) > 2) fighter.facing = duel.x > fighter.x ? 1 : -1
    fighter.target = null
    return true
  }

  private mantisAttack(owner: Fighter, target: Fighter, nx: number, ny: number) {
    const def = fighterDef(owner)
    if (!targetable(owner, target) || !grounded(target) || !canReach(owner, target)
      || Math.hypot(target.x - owner.x, target.y - owner.y) > def.radius + fighterDef(target).radius + def.range) return
    this.revealMantis(owner)
    this.hit(target, def.damage, nx * def.knockback, ny * def.knockback, owner, 0, true)
  }

  private trySpartanThrow(owner: Fighter, target: Fighter | null) {
    if (owner.species !== 'spartan' || owner.zombie || !owner.spartanSpear || owner.spartanThrowCooldown > 0
      || owner.cooldown > 0 || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0 || owner.lure || !grounded(owner)
      || !target || !targetable(owner, target) || !grounded(target) || building(target)) return false
    const group = owner.spartanFormation, slot = group?.slots.get(owner)
    // Front ranks keep their spears; rear ranks can break out to finish a marked foe.
    if (group && (group.charge || !owner.spartanCommander && group.members.length >= SPARTAN_FORMATION.min && (!group.formed || slot?.role !== 'rear'))) return false
    const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
    if (distance < SPARTAN_THROW.minRange || distance > SPARTAN_THROW.range || this.shuriken.length >= MAX_FIGHTERS * 2) return false
    const nx = dx / distance, ny = dy / distance
    owner.spartanSpear = !!owner.spartanCommander
    owner.spartanMark = owner.spartanCommander ? null : target
    owner.spartanThrowCooldown = owner.spartanCommander ? SPARTAN_COMMANDER.throwCooldown : SPARTAN_THROW.cooldown
    owner.cooldown = owner.spartanCommander ? SPARTAN.cooldown : SPARTAN_KNIFE.cooldown
    owner.casting = owner.attack = 1
    owner.vx = owner.vy = 0
    if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
    const radius = fighterDef(owner).radius
    this.shuriken.push({ kind: 'spear', owner, power: owner.spartanCommander ? SPARTAN_COMMANDER.power : 1,
      x: owner.x + nx * radius, y: owner.y + ny * radius,
      vx: nx * SPARTAN_THROW.speed, vy: ny * SPARTAN_THROW.speed,
      elevation: owner.elevation + 12, vz: 0, life: SPARTAN_THROW.range / SPARTAN_THROW.speed })
    return true
  }

  private stepSpartanCharge(owner: Fighter) {
    const group = owner.spartanFormation, charge = group?.charge, slot = group?.slots.get(owner)
    if (!group || !charge || !slot || owner.zombie || owner.lure || owner.taunt
      || !grounded(owner) || this.domainTarget(owner)) return false
    owner.target = null
    owner.casting = owner.attack = 0
    if (Math.abs(group.nx) > 0.1) owner.facing = group.nx > 0 ? 1 : -1
    if (charge.phase === 'rally') {
      const dx = slot.x - owner.x, dy = slot.y - owner.y, distance = Math.hypot(dx, dy)
      const fraction = Math.min(1, DT / Math.max(DT, charge.time))
      owner.vx = dx * fraction / DT; owner.vy = dy * fraction / DT
      owner.x += dx * fraction; owner.y += dy * fraction
      owner.phase += distance * fraction * 0.12
      return true
    }
    if (charge.phase === 'windup') {
      owner.x = slot.x; owner.y = slot.y
      owner.vx = owner.vy = 0
      return true
    }
    const oldX = owner.x, oldY = owner.y
    owner.x = slot.x; owner.y = slot.y
    owner.vx = charge.phase === 'dash' ? group.nx * SPARTAN_CHARGE.speed : 0
    owner.vy = charge.phase === 'dash' ? group.ny * SPARTAN_CHARGE.speed : 0
    if (charge.phase === 'recover') return true
    owner.phase += DT * 24
    for (const victim of this.fighters) {
      if (charge.hits.has(victim) || !targetable(owner, victim) || !grounded(victim) || building(victim)) continue
      if (segmentDistance(victim.x, victim.y, oldX, oldY, owner.x, owner.y)
        > fighterDef(owner).radius + fighterDef(victim).radius + 5) continue
      charge.hits.add(victim)
      if (this.hit(victim, SPARTAN_CHARGE.damage, group.nx * SPARTAN_CHARGE.knockback,
        group.ny * SPARTAN_CHARGE.knockback, owner, 0, true)) {
        victim.stun = Math.max(victim.stun, SPARTAN_CHARGE.stun)
        this.impacts.push({ x: victim.x, y: victim.y, radius: 30, life: 0.3, color: '#edb74d' })
      }
    }
    return true
  }

  private stepSpartanFormation(owner: Fighter, inDomain: boolean) {
    const group = owner.spartanFormation, slot = group?.slots.get(owner)
    if (!group || !slot || group.members.length < SPARTAN_FORMATION.min || inDomain
      || owner.zombie || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0 || owner.lure || owner.taunt || !grounded(owner)) return false
    if (!owner.spartanSpear && group.kind !== 'circle' && owner.spartanMark && targetable(owner, owner.spartanMark)) return false
    if (group.kind === 'wedge' && group.target && targetable(owner, group.target)) owner.target = group.target
    const target = owner.target
    if (Math.abs(slot.nx) > 0.1) owner.facing = slot.nx > 0 ? 1 : -1
    if (target && targetable(owner, target)) {
      const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
      const def = fighterDef(owner)
      if (owner.cooldown <= 0 && distance <= def.radius + (target.tower ? 28 : fighterDef(target).radius) + def.range) {
        const nx = distance > 0 ? dx / distance : owner.facing, ny = distance > 0 ? dy / distance : 0
        if (target.tower) this.hitTower(target.tower, def.damage, owner)
        else this.spartanAttack(owner, target, nx, ny)
        owner.cooldown = def.cooldown
        owner.attack = 1
      }
    }
    const dx = slot.x - owner.x, dy = slot.y - owner.y, distance = Math.hypot(dx, dy)
    const speed = Math.min(SPARTAN.speed * 1.3, distance / DT)
    this.move(owner, distance > 2 ? dx / distance * speed : 0, distance > 2 ? dy / distance * speed : 0)
    return true
  }

  // Mounted sweep: every reachable enemy around the rider is hit and knocked outward.
  private cavalrySlash(owner: Fighter) {
    const def = fighterDef(owner)
    for (const other of this.nearbyFighters(owner.x, owner.y, def.radius + CAVALRY_RIDE.slash + 48)) {
      if (!targetable(owner, other) || !grounded(other) || !canReach(owner, other)) continue
      const dx = other.x - owner.x, dy = other.y - owner.y, distance = Math.hypot(dx, dy)
      if (distance > def.radius + fighterDef(other).radius + CAVALRY_RIDE.slash) continue
      const nx = distance > 0.001 ? dx / distance : owner.facing, ny = distance > 0.001 ? dy / distance : 0
      this.hit(other, def.damage, nx * def.knockback, ny * def.knockback, owner, 0, true)
    }
    this.impacts.push({ x: owner.x, y: owner.y, radius: def.radius + CAVALRY_RIDE.slash, life: 0.25, color: '#dce6e8' })
  }

  private spartanAttack(owner: Fighter, target: Fighter, nx: number, ny: number) {
    if (owner.hp <= 0 || owner.zombie || !targetable(owner, target) || !grounded(target) || !canReach(owner, target)) return
    const def = fighterDef(owner), distance = Math.hypot(target.x - owner.x, target.y - owner.y)
    if (distance > def.radius + fighterDef(target).radius + def.range) return
    const slot = activeSpartanSlot(owner), group = slot ? owner.spartanFormation : null
    const bash = !building(target) && owner.skillCooldown <= 0 && slot?.role !== 'center'
      && (!group || group.bashReady <= 0)
      && (group?.kind !== 'wedge' || slot?.role === 'tip')
      && distance <= def.radius + fighterDef(target).radius + SPARTAN_BASH.range
    if (bash) {
      owner.skillCooldown = SPARTAN_BASH.cooldown; owner.slam = 1
      if (group) group.bashReady = SPARTAN_FORMATION.bashInterval
    }
    const power = owner.spartanCommander ? SPARTAN_COMMANDER.power : 1
    const damage = bash ? SPARTAN_BASH.damage * power * (group?.kind === 'circle' ? SPARTAN_FORMATION.circleDamage : 1) : def.damage
    const knockback = bash ? SPARTAN_BASH.knockback * power : def.knockback
    if (this.hit(target, damage, nx * knockback, ny * knockback, owner, 0, true) && bash && target.hp > 0) {
      target.stun = Math.max(target.stun, SPARTAN_BASH.stun)
      this.impacts.push({ x: target.x, y: target.y, radius: 24, life: 0.25, color: '#c39243' })
    }
  }

  // `power` replaces the burst damage (the shield's thrown-back talisman) and widens the blast.
  private throwTalisman(owner: Fighter, target: Fighter, power?: number, fox = false) {
    if (this.shuriken.length >= MAX_FIGHTERS * 2) return
    owner.meiHand ^= 1 // alternate hands
    const hand = MEI_HANDS[owner.meiHand], size = fighterDef(owner).size
    const star: Shuriken = { kind: 'talisman', power, fox, owner, x: owner.x + owner.facing * hand.forward * size, y: owner.y,
      vx: 0, vy: 0, elevation: owner.elevation + hand.height * size, vz: 0, life: 0 }
    this.aimTalisman(star, target.x, target.y, target.elevation)
    this.shuriken.push(star)
  }

  // Head for (x, y, elevation), arriving as its life runs out.
  private aimTalisman(star: Shuriken, x: number, y: number, elevation: number) {
    const dx = x - star.x, dy = y - star.y, distance = Math.hypot(dx, dy) || 1
    const speed = MEI_TALISMAN.speed, time = Math.max(DT, distance / speed)
    star.vx = dx / distance * speed
    star.vy = dy / distance * speed
    star.vz = (elevation - star.elevation) / time
    star.life = time
  }

  // A barrage talisman appears on an arc around his upper body and hovers there before flying.
  private summonBarrageTalisman(owner: Fighter, target: Fighter) {
    if (this.shuriken.length >= MAX_FIGHTERS * 2) return
    const B = MEI_BARRAGE, angle = this.random() * Math.PI // 0 → π sweeps from one side over his head to the other
    this.shuriken.push({ kind: 'talisman', owner, target, hold: B.hover, vx: 0, vy: 0, vz: 0, life: 0,
      x: owner.x + Math.cos(angle) * B.ring * 1.3, y: owner.y + 2, elevation: owner.elevation + 18 + Math.sin(angle) * B.ring })
  }

  private tryMeiBarrage(fighter: Fighter, target: Fighter) {
    if (fighter.meiBarrage > 0 || this.random() >= MEI_BARRAGE.chance) return false
    fighter.meiBarrage = MEI_BARRAGE.cooldown
    fighter.mei = { kind: 'barrage', time: MEI_BARRAGE.count * MEI_BARRAGE.interval, x: fighter.x, y: fighter.y, target, absorbed: 0 }
    fighter.vx = fighter.vy = 0
    return true
  }

  private tryMeiFox(fighter: Fighter) {
    if (fighter.meiFox > 0 || this.random() >= MEI_FOX.chance) return false
    fighter.meiFox = MEI_FOX.cooldown
    return true
  }

  // The fox talisman explodes: every enemy in the blast takes damage, knockback, a stun and a purple burn.
  private meiFoxBlast(owner: Fighter, x: number, y: number, elevation: number) {
    const F = MEI_FOX
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || victim.tower || Math.abs(victim.elevation - elevation) > 40) continue
      const dx = victim.x - x, dy = victim.y - y, distance = Math.hypot(dx, dy)
      if (distance > F.radius + fighterDef(victim).radius) continue
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : victim.id * 2.39996
      if (!this.hit(victim, F.damage, Math.cos(angle) * F.knockback, Math.sin(angle) * F.knockback, owner) || victim.hp <= 0 || building(victim)) continue
      victim.stun = Math.max(victim.stun, F.stun)
      victim.burn = Math.max(victim.burn, F.burn)
      victim.burnOwner = owner
    }
    for (const tower of this.towers) {
      if (tower.hp > 0 && tower.occupant && !allies(owner, tower.occupant)
        && Math.hypot(tower.x - x, tower.y - y) <= F.radius + 28) this.hitTower(tower, F.damage, owner)
    }
    this.impacts.push({ x, y: y - elevation - 10, radius: F.radius, life: F.blast, fox: true })
    this.impacts.push({ x, y, radius: F.radius * 0.7, life: MEI_ESCAPE.smoke, smoke: true })
  }

  private talismanBurst(owner: Fighter, x: number, y: number, elevation: number, power?: number) {
    const damage = power ?? MEI_YUANZHI.damage, knockback = MEI_YUANZHI.knockback
    const radius = MEI_TALISMAN.radius + (power ? Math.min(MEI_SHIELD.maxGrowth, power * MEI_SHIELD.growth) : 0)
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || victim.tower || Math.abs(victim.elevation - elevation) > 24) continue
      const dx = victim.x - x, dy = victim.y - y, distance = Math.hypot(dx, dy)
      if (distance > radius + fighterDef(victim).radius) continue
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : victim.id * 2.39996
      this.hit(victim, damage, Math.cos(angle) * knockback, Math.sin(angle) * knockback, owner, 0, true)
    }
    for (const tower of this.towers) {
      if (tower.hp > 0 && tower.occupant && !allies(owner, tower.occupant)
        && Math.hypot(tower.x - x, tower.y - y) <= radius + 28) this.hitTower(tower, damage, owner)
    }
    this.impacts.push({ x, y: y - elevation, radius, life: 0.4, color: MEI_TALISMAN.color })
  }

  // Overwhelmed up close: backflip, drop a stun bomb, vanish at the top and reappear at throwing range.
  // Overwhelmed by ranged hits: raise a talisman shield, then throw back what it soaked up.
  private tryMeiSkill(fighter: Fighter, target: Fighter | null) {
    if (fighter.species !== 'meiyuanzhi' || fighter.zombie || fighter.mei || !target || fighter.skillCooldown > 0
      || fighter.stun > 0 || fighter.fear > 0 || fighter.lure || !grounded(fighter)) return false
    const kind = fighter.meiForm === 0 && fighter.meiMelee >= MEI_PRESSURE.hits ? 'flip' : fighter.meiRanged >= MEI_PRESSURE.hits ? 'shield' : null
    if (!kind) return false
    fighter.mei = { kind, time: kind === 'flip' ? MEI_ESCAPE.flip + MEI_ESCAPE.vanish : MEI_SHIELD.time,
      x: fighter.x, y: fighter.y, target, absorbed: 0 }
    fighter.meiMelee = fighter.meiRanged = 0
    fighter.vx = fighter.vy = 0
    return true
  }

  private stepMei(fighter: Fighter) {
    const mei = fighter.mei!
    if (fighter.zombie || fighter.heldBy || fighter.thrown) { fighter.mei = null; return false }
    this.move(fighter, 0, 0)
    mei.time -= DT
    if (mei.kind === 'star') {
      const S = MEI_STAR, dashed = S.strokes * S.dash, elapsed = dashed + S.flight - mei.time, from = mei.from!
      if (elapsed < dashed) {
        const at = starDashAt(from.x, from.y, mei.x, mei.y, elapsed)
        fighter.x = at.x
        fighter.y = at.y
        fighter.facing = at.facing
        this.clamp(fighter)
      } else if (elapsed - DT < dashed) { // back at the first point: throw into the centre
        fighter.attack = 1
        fighter.meiHand = 0
        fighter.facing = mei.x > fighter.x ? 1 : -1
      }
      if (mei.time > 0) return true
      fighter.mei = null
      this.meiStarBlast(fighter, mei.x, mei.y)
      return true
    }
    if (mei.kind === 'transform') {
      if (mei.time > 0) return true
      fighter.mei = null
      fighter.meiForm = 1
      fighter.cooldown = 0
      this.meiSlam(fighter)
      return true
    }
    if (mei.kind === 'barrage') {
      // One talisman each time the clock crosses an interval mark; stop early if the target is gone.
      const B = MEI_BARRAGE, target = mei.target
      if (!targetable(fighter, target)) { fighter.mei = null; return false }
      if (Math.ceil((mei.time + DT) / B.interval - 1e-6) > Math.ceil(mei.time / B.interval - 1e-6)) {
        this.summonBarrageTalisman(fighter, target)
        fighter.meiHand ^= 1 // the hands take turns flicking talismans out
        fighter.attack = 1
        if (Math.abs(target.x - fighter.x) > 2) fighter.facing = target.x > fighter.x ? 1 : -1
      }
      if (mei.time <= 0) fighter.mei = null
      return true
    }
    if (mei.kind === 'shield') {
      if (mei.time > 0) return true
      fighter.mei = null
      fighter.skillCooldown = MEI_SHIELD.cooldown
      const foe = fighter.meiFoe && targetable(fighter, fighter.meiFoe) ? fighter.meiFoe
        : targetable(fighter, mei.target) ? mei.target : null
      if (foe && mei.absorbed > 0) {
        fighter.attack = 1
        this.throwTalisman(fighter, foe, mei.absorbed * MEI_SHIELD.returnRate)
      }
      return true
    }
    const E = MEI_ESCAPE, elapsed = E.flip + E.vanish - mei.time
    if (elapsed >= E.bomb && elapsed - DT < E.bomb) this.meiStunBomb(fighter, mei.x, mei.y)
    if (elapsed >= E.flip && elapsed - DT < E.flip) {
      this.impacts.push({ x: fighter.x, y: fighter.y - E.height, radius: 22, life: E.smoke, smoke: true })
      if (targetable(fighter, mei.target)) this.meiBlink(fighter, mei.target)
    }
    if (mei.time > 0) return true
    fighter.mei = null
    fighter.skillCooldown = E.cooldown
    fighter.cooldown = 0 // throw the moment he reappears
    this.impacts.push({ x: fighter.x, y: fighter.y, radius: 22, life: E.smoke, smoke: true })
    return true
  }

  private meiStunBomb(owner: Fighter, x: number, y: number) {
    const E = MEI_ESCAPE
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || !grounded(victim)) continue
      if (Math.hypot(victim.x - x, victim.y - y) > E.radius + fighterDef(victim).radius) continue
      if (this.hit(victim, MEI_YUANZHI.damage, 0, 0, owner) && victim.hp > 0 && !building(victim)) victim.stun = Math.max(victim.stun, E.stun)
    }
    this.impacts.push({ x, y, radius: E.radius, life: 0.4, color: MEI_TALISMAN.color })
    this.impacts.push({ x, y, radius: E.radius * 0.8, life: E.smoke, smoke: true })
  }

  // Reappear at throwing range from the target, on the side farthest from every other enemy.
  private meiBlink(fighter: Fighter, target: Fighter) {
    const def = fighterDef(fighter), distance = MEI_YUANZHI.range * MEI_ESCAPE.blink + def.radius + fighterDef(target).radius
    let bestX = fighter.x, bestY = fighter.y, best = -1
    for (let k = 0; k < 8; k++) {
      const angle = k * Math.PI / 4 + fighter.id
      const x = Math.min(this.width - def.radius, Math.max(def.radius, target.x + Math.cos(angle) * distance))
      const y = Math.min(this.height - def.radius, Math.max(def.radius, target.y + Math.sin(angle) * distance))
      let nearest = Infinity
      for (const other of this.fighters) if (targetable(fighter, other)) nearest = Math.min(nearest, Math.hypot(other.x - x, other.y - y))
      if (nearest > best) { best = nearest; bestX = x; bestY = y }
    }
    fighter.x = bestX
    fighter.y = bestY
    this.clamp(fighter)
    fighter.facing = target.x > fighter.x ? 1 : -1
  }

  // Nine-Tailed Fox: at 75% health he rises immune and slams down in fox form; at 50% his fox spirits join him.
  private tryMeiTransform(fighter: Fighter) {
    if (fighter.species !== 'meiyuanzhi' || fighter.zombie || fighter.heldBy || fighter.thrown || !grounded(fighter)
      || fighter.mei?.kind === 'transform') return false
    const max = fighterDef(fighter).hp, T = MEI_TRANSFORM
    if (fighter.meiForm === 0 && fighter.hp <= max * T.health) {
      // The transformation has no target; it keeps his own place in the field so the skill shape stays the same.
      fighter.mei = { kind: 'transform', time: T.rise + T.hover + T.slam, x: fighter.x, y: fighter.y, target: fighter, absorbed: 0 }
      fighter.saintRest = null
      fighter.vx = fighter.vy = 0
      return true
    }
    if (fighter.meiForm === 1 && !fighter.mei && fighter.hp <= max * MEI_SPIRITS.health) {
      fighter.meiForm = 2
      this.summonMeiSpirits(fighter)
    }
    return false
  }

  // The transformation lands: every grounded enemy nearby is hit, knocked away and stunned.
  private meiSlam(owner: Fighter) {
    const T = MEI_TRANSFORM
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || !grounded(victim)) continue
      const dx = victim.x - owner.x, dy = victim.y - owner.y, distance = Math.hypot(dx, dy)
      if (distance > T.radius + fighterDef(victim).radius) continue
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : victim.id * 2.39996
      if (this.hit(victim, T.damage, Math.cos(angle) * T.knockback, Math.sin(angle) * T.knockback, owner)
        && victim.hp > 0 && !building(victim)) victim.stun = Math.max(victim.stun, T.stun)
    }
    this.impacts.push({ x: owner.x, y: owner.y - 10, radius: T.radius, life: MEI_FOX.blast, fox: true })
    this.impacts.push({ x: owner.x, y: owner.y, radius: T.radius * 0.7, life: MEI_ESCAPE.smoke, smoke: true })
  }

  // Three purple nine-tailed foxes appear around him in smoke and go for his foe.
  private summonMeiSpirits(owner: Fighter) {
    const enemy = owner.retaliation ?? owner.target
    const distance = fighterDef(owner).radius + UNITS['mei-fox'].radius + 16
    for (let k = 0; k < MEI_SPIRITS.count; k++) {
      const angle = Math.PI / 2 + k * Math.PI * 2 / MEI_SPIRITS.count
      const spirit = this.spawn(owner.x + Math.cos(angle) * distance, owner.y + Math.sin(angle) * distance, owner.team, 'mei-fox')
      if (!spirit) return
      spirit.facing = owner.facing
      if (enemy && targetable(spirit, enemy)) spirit.target = spirit.retaliation = enemy
      this.impacts.push({ x: spirit.x, y: spirit.y, radius: 20, life: MEI_ESCAPE.smoke, smoke: true })
    }
  }

  // Star Dash: once his fox spirits are out, he may dash a star round the target and blow up its centre.
  private tryMeiStar(owner: Fighter, target: Fighter) {
    if (owner.meiForm < 2 || owner.meiStar > 0 || this.random() >= MEI_STAR.chance || !grounded(target)) return false
    const S = MEI_STAR
    owner.meiStar = S.cooldown
    owner.mei = { kind: 'star', time: S.strokes * S.dash + S.flight, x: target.x, y: target.y, target, absorbed: 0,
      from: { x: owner.x, y: owner.y } }
    owner.vx = owner.vy = 0
    return true
  }

  // The star's centre explodes: every enemy in the blast is hurt, flung outward, stunned and set burning.
  private meiStarBlast(owner: Fighter, x: number, y: number) {
    const S = MEI_STAR
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || victim.tower || victim.elevation > 40) continue
      const dx = victim.x - x, dy = victim.y - y, distance = Math.hypot(dx, dy)
      if (distance > S.blast + fighterDef(victim).radius) continue
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : victim.id * 2.39996
      if (!this.hit(victim, S.damage, Math.cos(angle) * S.knockback, Math.sin(angle) * S.knockback, owner) || victim.hp <= 0 || building(victim)) continue
      victim.stun = Math.max(victim.stun, S.stun)
      victim.burn = Math.max(victim.burn, S.burn)
      victim.burnOwner = owner
    }
    for (const tower of this.towers) {
      if (tower.hp > 0 && tower.occupant && !allies(owner, tower.occupant)
        && Math.hypot(tower.x - x, tower.y - y) <= S.blast + 28) this.hitTower(tower, S.damage, owner)
    }
    this.impacts.push({ x, y: y - 10, radius: S.blast, life: MEI_FOX.blast, fox: true })
    this.impacts.push({ x, y, radius: S.blast, life: 0.5, color: MEI_TALISMAN.color })
    this.impacts.push({ x, y, radius: S.blast * 0.75, life: MEI_ESCAPE.smoke, smoke: true })
  }

  // Talisman Mine: stick a bomb talisman on the ground part of the way to the target, in its path.
  private placeMeiMine(owner: Fighter, target: Fighter) {
    if (owner.meiMine > 0 || this.random() >= MEI_MINE.chance || !grounded(target)
      || this.mines.filter((mine) => mine.owner === owner).length >= MEI_MINE.max) return false
    owner.meiMine = MEI_MINE.cooldown
    owner.meiHand ^= 1
    const x = owner.x + (target.x - owner.x) * MEI_MINE.place, y = owner.y + (target.y - owner.y) * MEI_MINE.place
    this.mines.push({ owner, x, y, life: MEI_MINE.life })
    this.impacts.push({ x, y, radius: 14, life: 0.5, smoke: true })
    return true
  }

  // Armed mines go off under the first enemy to step on them.
  private stepMines() {
    for (const mine of this.mines) {
      mine.life -= DT
      if (mine.life > MEI_MINE.life - MEI_MINE.arm) continue
      const stepped = this.fighters.some((f) => targetable(mine.owner, f) && grounded(f) && !building(f)
        && Math.hypot(f.x - mine.x, f.y - mine.y) <= MEI_MINE.trigger + fighterDef(f).radius)
      if (stepped) { this.mineBlast(mine); mine.life = 0 }
    }
    this.mines = this.mines.filter((mine) => mine.life > 0)
  }

  // The mine bursts: grounded enemies in the blast are hurt and thrown through the air away from it.
  private mineBlast(mine: TalismanMine) {
    const M = MEI_MINE, owner = mine.owner
    for (const victim of this.fighters) {
      if (!targetable(owner, victim) || !grounded(victim)) continue
      const dx = victim.x - mine.x, dy = victim.y - mine.y, distance = Math.hypot(dx, dy)
      if (distance > M.radius + fighterDef(victim).radius) continue
      if (!this.hit(victim, M.damage, 0, 0, owner) || victim.hp <= 0 || building(victim)) continue
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : victim.id * 2.39996
      this.releaseGrab(victim)
      victim.vx = Math.cos(angle) * TREX_GRAB.speed
      victim.vy = Math.sin(angle) * TREX_GRAB.speed
      victim.thrown = { owner, time: TREX_GRAB.distance / TREX_GRAB.speed }
    }
    for (const tower of this.towers) {
      if (tower.hp > 0 && tower.occupant && !allies(owner, tower.occupant)
        && Math.hypot(tower.x - mine.x, tower.y - mine.y) <= M.radius + 28) this.hitTower(tower, M.damage, owner)
    }
    this.impacts.push({ x: mine.x, y: mine.y, radius: M.radius, life: 0.4, color: MEI_TALISMAN.color })
    this.impacts.push({ x: mine.x, y: mine.y, radius: M.radius * 0.7, life: MEI_ESCAPE.smoke, smoke: true })
  }

  // A purple fox claw: Mei in fox form up close, and his fox spirits.
  private foxClaw(owner: Fighter, target: Fighter, nx: number, ny: number, damage: number, knockback: number) {
    if (!grounded(target) || !canReach(owner, target)) return
    if (this.hit(target, damage, nx * knockback, ny * knockback, owner, 0, true)) {
      this.impacts.push({ x: target.x, y: target.y - fighterDef(target).size * 18, radius: 0, life: MEI_CLAW.show, claw: owner.facing })
    }
  }

  private throwShuriken(owner: Fighter, nx: number, ny: number, target?: Fighter) {
    if (this.shuriken.length >= MAX_FIGHTERS * 2) return
    this.shuriken.push({ kind: 'shuriken', owner, x: owner.x + nx * NINJA.radius, y: owner.y + ny * NINJA.radius,
      vx: nx * SHURIKEN_SPEED, vy: ny * SHURIKEN_SPEED, elevation: owner.elevation,
      vz: target ? (target.elevation - owner.elevation) / Math.max(DT, Math.hypot(target.x - owner.x, target.y - owner.y) / SHURIKEN_SPEED) : 0,
      life: (NINJA.range + NINJA.radius + 30) * 1.25 / SHURIKEN_SPEED })
  }

  // Launch the newest floating sword from where it hovers; the attack cooldown spaces them out.
  // Sword Storm sometimes launches every floating sword at once.
  private launchSwords(owner: Fighter, target: Fighter, nx: number, ny: number) {
    const roll = owner.skillCooldown <= 0 ? this.random() : 1
    if (roll < SWORD_SAINT_GIANT.chance) {
      // Spirit swords converge into a giant sword above him; he holds his attacks until it lands.
      owner.skillCooldown = SWORD_SAINT_STORM.cooldown
      owner.cooldown = SWORD_SAINT_GIANT.form + SWORD_SAINT_GIANT.flight
      this.giantSwords.push({ owner, target, x: owner.x, y: owner.y, fromX: owner.x, fromY: owner.y, time: 0, flying: false })
      return
    }
    const storm = roll < SWORD_SAINT_GIANT.chance + SWORD_SAINT_STORM.chance && owner.swordStack >= SWORD_SAINT_STORM.min
    if (storm) {
      owner.skillCooldown = SWORD_SAINT_STORM.cooldown
      this.impacts.push({ x: owner.x, y: owner.y, radius: 46, life: 0.35, color: '#7fd8a0' })
    }
    for (let n = storm ? Math.floor(owner.swordStack) : 1; n > 0; n--) this.launchSword(owner, target, nx, ny)
  }

  private launchSword(owner: Fighter, target: Fighter, nx: number, ny: number, comeback = false) {
    if (owner.swordStack < 1 || this.shuriken.length >= MAX_FIGHTERS * 2) return
    const def = fighterDef(owner), { speed, life, hover } = SWORD_SAINT_SWORDS
    owner.swordStack -= 1
    const k = Math.floor(owner.swordStack), slot = swordSlot(k, this.tick, owner.id)
    // Alternate sides at varied widths so swords, and a whole storm, fan out and arc in from left and right.
    const angle = Math.atan2(ny, nx) + (k % 2 ? 1 : -1) * SWORD_SAINT_SWORDS.launchAngle * (0.5 + (k % 5) * 0.25)
    this.shuriken.push({ kind: 'sword', target, owner, comeback, seed: k * 1.9 + owner.id, x: owner.x + slot.x * def.size * owner.facing, y: owner.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, elevation: owner.elevation + hover - def.radius - slot.y * def.size, vz: 0, life })
  }

  // An enemy too close: backflip off the sword while every sword, including the ridden one, flies at it.
  private trySaintFlip(fighter: Fighter, target: Fighter | null) {
    if (fighter.zombie || fighter.species !== 'swordsaint' || fighter.saint || !target || fighter.stun > 0
      || fighter.fear > 0 || !grounded(target)) return false
    const def = fighterDef(fighter), dx = target.x - fighter.x, dy = target.y - fighter.y, d = Math.hypot(dx, dy)
    if (d > def.radius + fighterDef(target).radius + SWORD_SAINT_MELEE.trigger) return false
    const nx = d > 0.001 ? dx / d : fighter.facing, ny = d > 0.001 ? dy / d : 0
    fighter.saint = { phase: 'flip', time: SWORD_SAINT_MELEE.flip, target, trail: null, combo: 0 }
    for (let n = Math.floor(fighter.swordStack); n > 0; n--) this.launchSword(fighter, target, nx, ny, true)
    this.shuriken.push({ kind: 'sword', ride: true, target, owner: fighter, seed: fighter.id, x: fighter.x, y: fighter.y,
      vx: nx * SWORD_SAINT_SWORDS.speed, vy: ny * SWORD_SAINT_SWORDS.speed, elevation: SWORD_SAINT_SWORDS.hover, vz: 0, life: SWORD_SAINT_SWORDS.life })
    return true
  }

  private stepSaint(fighter: Fighter) {
    const saint = fighter.saint!, target = saint.target, def = fighterDef(fighter)
    if (fighter.zombie) { fighter.saint = null; return false }
    saint.time -= DT
    if (saint.trail) saint.trail.time -= DT
    if (saint.phase === 'mount') {
      this.move(fighter, 0, 0)
      if (saint.time <= 0) fighter.saint = null
      return true
    }
    const lost = !targetable(fighter, target) || !canReach(fighter, target)
    if (saint.phase === 'flip') {
      this.move(fighter, -fighter.facing * SWORD_SAINT_MELEE.hop, 0)
      if (saint.time > 0) return true
      // Sonic slash: catch the ridden sword and blink behind the enemy.
      this.shuriken = this.shuriken.filter((star) => !(star.ride && star.owner === fighter))
      if (lost) { saint.phase = 'mount'; saint.time = SWORD_SAINT_MELEE.mount; return true }
      this.saintDash(fighter, target, SWORD_SAINT_MELEE.blinkDamage, SWORD_SAINT_MELEE.blinkKnockback)
      fighter.cooldown = SWORD_SAINT_MELEE.slashCooldown
      saint.phase = 'melee'
      return true
    }
    // On foot: slash with the held sword while returned swords stab alongside; mount again once the enemy is gone.
    if (lost) { saint.phase = 'mount'; saint.time = SWORD_SAINT_MELEE.mount; return true }
    fighter.target = target
    if (fighter.stun > 0) { this.move(fighter, 0, 0); return true }
    const dx = target.x - fighter.x, dy = target.y - fighter.y, d = Math.hypot(dx, dy)
    const nx = d > 0.001 ? dx / d : fighter.facing, ny = d > 0.001 ? dy / d : 0
    if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
    if (d > def.radius + fighterDef(target).radius + SWORD_SAINT_MELEE.reach) {
      this.move(fighter, nx * def.speed, ny * def.speed)
      return true
    }
    this.move(fighter, 0, 0)
    if (fighter.cooldown <= 0) {
      const helpers = Math.floor(fighter.swordStack)
      if (saint.combo < SWORD_SAINT_MELEE.combo) {
        // Quick slashes, alternating angles.
        saint.combo++
        fighter.cooldown = SWORD_SAINT_MELEE.slashCooldown
        fighter.attack = 1
        const damage = SWORD_SAINT_MELEE.damage + helpers * SWORD_SAINT_MELEE.perSword
        if (this.hit(target, damage, nx * def.knockback, ny * def.knockback, fighter, 0, true)) {
          this.katanaSlashes.push({ x: target.x, y: target.y - target.elevation, saint: true,
            angle: Math.atan2(ny, nx) + (saint.combo % 2 ? 0.8 : -0.8), life: SAINT_SLASH_DURATION })
        }
      } else {
        // The finishing dash cuts through to the far side.
        this.saintDash(fighter, target, SWORD_SAINT_MELEE.dashDamage + helpers * SWORD_SAINT_MELEE.dashPerSword, SWORD_SAINT_MELEE.dashKnockback)
        saint.combo = 0
        fighter.cooldown = SWORD_SAINT_MELEE.recover
      }
    }
    return true
  }

  // Blink through to just behind the target with a jade streak and one cut.
  private saintDash(fighter: Fighter, target: Fighter, damage: number, knockback: number) {
    const def = fighterDef(fighter), dx = target.x - fighter.x, dy = target.y - fighter.y, d = Math.hypot(dx, dy) || 1
    const fromX = fighter.x, fromY = fighter.y
    fighter.x = target.x + dx / d * (def.radius + fighterDef(target).radius + 8)
    fighter.y = target.y + dy / d * (def.radius + fighterDef(target).radius + 8)
    this.clamp(fighter)
    fighter.vx = fighter.vy = 0
    fighter.facing = target.x > fighter.x ? 1 : -1
    fighter.attack = 1
    if (fighter.saint) fighter.saint.trail = { fromX, fromY, toX: fighter.x, toY: fighter.y, time: SWORD_SAINT_MELEE.trail }
    if (this.hit(target, damage, dx / d * knockback, dy / d * knockback, fighter, 0, true)) {
      this.katanaSlashes.push({ x: target.x, y: target.y - target.elevation, angle: Math.atan2(dy, dx), life: SAINT_SLASH_DURATION, saint: true })
    }
  }

  // No enemy around: heroes heal; the saint goes fishing once fully healed.
  private stepHeroRest(fighter: Fighter) {
    const mei = fighter.species === 'meiyuanzhi'
    const thor = fighter.species === 'thor'
    if ((fighter.species !== 'swordsaint' && !mei && !thor) || !canMeditate(fighter)) return false
    const def = fighterDef(fighter)
    if (fighter.hp < def.hp) {
      if (fighter.saintRest?.kind !== 'meditate') {
        fighter.saintRest = { kind: 'meditate', x: fighter.x, y: fighter.y, action: 'wait', time: 0, catch: 0 }
      }
      if (thor) {
        fighter.attack = fighter.catching = fighter.casting = fighter.slam = 0
        fighter.saintRest.time += DT
        if (fighter.saintRest.time + DT * 0.01 >= THOR_REST.windup) {
          fighter.saintRest.time = 0
          fighter.hp = Math.min(def.hp, fighter.hp + THOR_REST.heal)
          const x = fighter.x + fighter.facing * 14 * def.size
          const y = fighter.y + def.radius - fighter.elevation - 40 * def.size
          this.shots.push({ owner: fighter, x: x - 24, y: Math.min(0, y - 240) + 10,
            tx: x, ty: y + 10, life: THOR_SKILLS.shot.duration, healing: true })
          this.impacts.push({ x: fighter.x, y: fighter.y - fighter.elevation, radius: 42, life: 0.4, color: '#67cfff' })
        }
      } else {
        fighter.hp = Math.min(def.hp, fighter.hp + (mei ? MEI_REST.heal : SWORD_SAINT_REST.heal) * DT)
      }
      this.move(fighter, 0, 0)
      return true
    }
    if (mei || thor) { fighter.saintRest = null; return false }
    let spot = fighter.saintRest?.kind === 'fish' && this.water.inWater(fighter.saintRest.x, fighter.saintRest.y) ? fighter.saintRest : null
    if (!spot && (this.tick + fighter.id) % 30 === 0) spot = this.nearestWater(fighter.x, fighter.y)
    fighter.saintRest = spot
    if (!spot) return false
    const dx = spot.x - fighter.x, dy = spot.y - fighter.y, d = Math.hypot(dx, dy)
    if (d > 6) {
      if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
      this.move(fighter, dx / d * def.speed * 0.6, dy / d * def.speed * 0.6)
      return true
    }
    this.move(fighter, 0, 0)
    spot.time -= DT
    if (spot.time > 0) return true
    const F = SWORD_SAINT_FISHING, wait = () => F.wait[0] + this.random() * F.wait[1]
    const roll = this.random()
    if (spot.action === 'reel' ? roll < F.moveChance : spot.action === 'wait' && roll >= F.adjustChance + F.reelChance) {
      this.moveFishingSpot(spot)
      spot.action = 'wait'; spot.time = wait()
    } else if (spot.action !== 'wait') {
      spot.action = 'wait'; spot.time = wait()
    } else if (roll < F.adjustChance) {
      spot.action = 'adjust'; spot.time = F.adjust
    } else {
      spot.action = 'reel'; spot.time = F.reel; spot.catch = Math.floor(this.random() * CATCH_COUNT)
    }
    return true
  }

  // Try a few nearby points on the same water for a new fishing position.
  private moveFishingSpot(spot: SaintRest) {
    for (let k = 0; k < 8; k++) {
      const x = spot.x + (this.random() - 0.5) * 140, y = spot.y + (this.random() - 0.5) * 90
      if (Math.hypot(x - spot.x, y - spot.y) > 30 && this.water.inWater(x, y)) { spot.x = x; spot.y = y; return }
    }
  }

  // shortcut: scans the whole water mask; fine at a 30-tick cadence, cache it if many saints lag.
  private nearestWater(x: number, y: number): SaintRest | null {
    const mask = this.water.bmask, cols = this.water.bcols
    let best = Infinity, spot: SaintRest | null = null
    for (let k = 0; k < mask.length; k++) {
      if (mask[k] !== 2) continue
      const wx = (k % cols + 0.5) * BCELL, wy = (Math.floor(k / cols) + 0.5) * BCELL
      const d = (wx - x) ** 2 + (wy - y) ** 2
      if (d < best) { best = d; spot = { kind: 'fish', x: wx, y: wy, action: 'wait', time: SWORD_SAINT_FISHING.wait[0], catch: 0 } }
    }
    return spot
  }

  // Hit while fishing: swing the rod and fling a fish into the attacker's face.
  private saintFishCounter(saint: Fighter, attacker: Fighter) {
    const rest = saint.saintRest
    if (saint.species !== 'swordsaint' || saint.zombie || saint.saint || rest?.kind !== 'fish' || allies(saint, attacker)) return
    saint.saintRest = null
    saint.casting = 1
    saint.facing = attacker.x > saint.x ? 1 : -1
    this.fishThrows.push({ owner: saint, target: attacker, fromX: saint.x, fromY: saint.y, time: 0 })
  }

  private stepFishThrows() {
    for (const fish of this.fishThrows) {
      fish.time += DT
      if (fish.time < SWORD_SAINT_FISHING.counterFlight || fish.target.hp <= 0) continue
      if (this.hit(fish.target, SWORD_SAINT_FISHING.damage, 0, 0, fish.owner) && fish.target.hp > 0 && !building(fish.target)) {
        fish.target.stun = Math.max(fish.target.stun, SWORD_SAINT_FISHING.blind)
        this.blinded.push({ target: fish.target, life: SWORD_SAINT_FISHING.blind })
      }
    }
    this.fishThrows = this.fishThrows.filter((fish) => fish.time < SWORD_SAINT_FISHING.counterFlight && fish.target.hp > 0)
    for (const blind of this.blinded) blind.life -= DT
    this.blinded = this.blinded.filter((blind) => blind.life > 0 && blind.target.hp > 0)
  }

  private stepGiantSwords() {
    const G = SWORD_SAINT_GIANT
    for (const sword of this.giantSwords) {
      sword.time += DT
      if (!sword.flying) {
        sword.x = sword.fromX = sword.owner.x
        sword.y = sword.fromY = sword.owner.y
        if (sword.time >= G.form) { sword.flying = true; sword.time = 0 }
        continue
      }
      const p = Math.min(1, sword.time / G.flight)
      const tx = sword.target.hp > 0 ? sword.target.x : sword.x, ty = sword.target.hp > 0 ? sword.target.y : sword.y
      sword.x = sword.fromX + (tx - sword.fromX) * p
      sword.y = sword.fromY + (ty - sword.fromY) * p
      if (p < 1) continue
      // Impact: crater, area damage, outward knockback and a stun.
      this.craters.push({ x: sword.x, y: sword.y, life: G.crater })
      this.impacts.push({ x: sword.x, y: sword.y, radius: G.radius, life: 0.4, color: '#7fd8a0' })
      for (const other of this.nearbyFighters(sword.x, sword.y, G.radius + 32)) {
        if (other.hp <= 0 || allies(sword.owner, other) || !grounded(other)) continue
        const dx = other.x - sword.x, dy = other.y - sword.y, d = Math.hypot(dx, dy)
        if (d > G.radius + fighterDef(other).radius) continue
        const nx = d > 0.001 ? dx / d : 1, ny = d > 0.001 ? dy / d : 0
        if (this.hit(other, G.damage, nx * G.knockback, ny * G.knockback, sword.owner) && other.hp > 0 && !building(other)) {
          other.stun = Math.max(other.stun, G.stun)
        }
      }
    }
    this.giantSwords = this.giantSwords.filter((sword) => !sword.flying || sword.time < G.flight)
    for (const crater of this.craters) crater.life -= DT
    this.craters = this.craters.filter((crater) => crater.life > 0)
  }

  // On foot, his circling swords may parry a whole hit.
  private trySaintDeflect(target: Fighter) {
    if (target.species !== 'swordsaint' || target.zombie || target.saint?.phase !== 'melee') return false
    const chance = Math.min(SWORD_SAINT_MELEE.deflectMax, Math.floor(target.swordStack) * SWORD_SAINT_MELEE.deflectPerSword)
    if (chance <= 0 || this.random() >= chance) return false
    this.impacts.push({ x: target.x, y: target.y, radius: 26, life: 0.25, color: '#7fd8a0' })
    return true
  }

  private stepShuriken() {
    for (let i = this.shuriken.length - 1; i >= 0; i--) {
      const star = this.shuriken[i], owner = star.owner
      const spear = star.kind === 'spear', sword = star.kind === 'sword', talisman = star.kind === 'talisman'
      if (star.hold !== undefined && star.hold > 0) {
        // A hovering barrage talisman: on release, aim near its target (or his current one) and fly.
        star.hold -= DT
        if (owner.hp <= 0 || owner.zombie) { this.shuriken.splice(i, 1); continue }
        if (star.hold > 0) continue
        const target = star.target && targetable(owner, star.target) ? star.target
          : owner.target && targetable(owner, owner.target) ? owner.target : null
        if (!target) { this.shuriken.splice(i, 1); continue }
        const angle = this.random() * Math.PI * 2, spread = Math.sqrt(this.random()) * MEI_BARRAGE.scatter
        this.aimTalisman(star, target.x + Math.cos(angle) * spread, target.y + Math.sin(angle) * spread, target.elevation)
        continue
      }
      const speed = spear ? SPARTAN_THROW.speed : sword ? SWORD_SAINT_SWORDS.speed : talisman ? MEI_TALISMAN.speed : SHURIKEN_SPEED
      const damage = spear ? SPARTAN_THROW.damage * (star.power ?? 1) : sword ? SWORD_SAINT.damage : NINJA.damage
      const knockback = spear ? SPARTAN_THROW.knockback * (star.power ?? 1) : sword ? SWORD_SAINT.knockback : NINJA.knockback
      if (star.returning) {
        // Fly home and rejoin the swords around him.
        const dx = owner.x - star.x, dy = owner.y - star.y, d = Math.hypot(dx, dy) || 1
        star.vx += (dx / d * SWORD_SAINT_MELEE.returnSpeed - star.vx) * 0.2
        star.vy += (dy / d * SWORD_SAINT_MELEE.returnSpeed - star.vy) * 0.2
        star.x += star.vx * DT
        star.y += star.vy * DT
        star.elevation += (SWORD_SAINT_SWORDS.hover + 20 - star.elevation) * 0.1
        if (owner.hp <= 0 || owner.zombie) this.shuriken.splice(i, 1)
        else if (d < 18) {
          owner.swordStack = Math.min(SWORD_SAINT_SWORDS.max, owner.swordStack + 1)
          this.shuriken.splice(i, 1)
        }
        continue
      }
      const homing = sword ? star.target : undefined
      if (homing && homing.hp > 0 && !concealed(homing)) {
        // Steer toward the target at constant speed, weaving side to side; the weave fades close in so it still lands.
        const dx = homing.x - star.x, dy = homing.y - star.y, d = Math.hypot(dx, dy) || 1
        const age = SWORD_SAINT_SWORDS.life - star.life
        const heading = Math.atan2(dy, dx) + Math.sin(age * 8 + (star.seed ?? 0)) * SWORD_SAINT_SWORDS.weave * Math.min(1, d / 120)
        star.vx += (Math.cos(heading) * speed - star.vx) * SWORD_SAINT_SWORDS.turn
        star.vy += (Math.sin(heading) * speed - star.vy) * SWORD_SAINT_SWORDS.turn
        const v = Math.hypot(star.vx, star.vy) || 1
        star.vx = star.vx / v * speed
        star.vy = star.vy / v * speed
      }
      if (sword && !star.ride && SWORD_SAINT_SWORDS.life - star.life < SWORD_SAINT_SWORDS.aim) { star.life -= DT; continue } // turning to aim
      if (homing && homing.hp > 0) star.elevation += (homing.elevation + 14 - star.elevation) * 0.2
      const px = star.x, py = star.y
      star.x += star.vx * DT
      star.y += star.vy * DT
      star.elevation = Math.max(0, star.elevation + star.vz * DT)
      star.life -= DT
      if (owner.hp <= 0 || (spear && owner.spartanSpear && !owner.spartanCommander) || star.life <= 0 || star.x < 0 || star.y < 0 || star.x > this.width || star.y > this.height) {
        if (spear && !owner.spartanSpear) owner.spartanMark = null
        if (talisman && owner.hp > 0 && star.life <= 0) {
          if (star.fox) this.meiFoxBlast(owner, star.x, star.y, star.elevation)
          else this.talismanBurst(owner, star.x, star.y, star.elevation, star.power)
        }
        if (star.comeback && owner.hp > 0) star.returning = true
        else this.shuriken.splice(i, 1)
        continue
      }
      if (star.ride) continue // the ridden sword only carries him in; it never strikes
      let victim: Fighter | null = null, nearest = Infinity
      for (const target of this.fighters) {
        if (target.hp <= 0 || target.stage === 'egg' || target.heldBy || target.thrown || target.inside || allies(owner, target)) continue
        if (!target.tower && Math.abs(star.elevation - target.elevation) > 24) continue
        if (target.tower && star.elevation > target.elevation + 24) continue
        if (segmentDistance(target.x, target.y, px, py, star.x, star.y) > fighterDef(target).radius + 3) continue
        const along = Math.max(0, ((target.x - px) * star.vx + (target.y - py) * star.vy) / speed)
        if (along < nearest) { nearest = along; victim = target }
      }
      if (victim && talisman) {
        if (star.fox) this.meiFoxBlast(owner, star.x, star.y, star.elevation)
        else this.talismanBurst(owner, star.x, star.y, star.elevation, star.power)
        this.shuriken.splice(i, 1)
      } else if (victim) {
        const protectedByTower = victim.tower && Math.abs(star.elevation - victim.elevation) > 24
        if (spear && !owner.spartanCommander) owner.spartanMark = protectedByTower || building(victim) ? null : victim
        let struck = true
        if (protectedByTower) this.hitTower(victim.tower!, damage, owner)
        else struck = this.hit(victim, damage, star.vx / speed * knockback, star.vy / speed * knockback, owner, 0, true)
        if (spear && !struck) owner.spartanMark = null
        if (star.comeback) star.returning = true
        else this.shuriken.splice(i, 1)
      }
    }
  }

  private stepRexBloodlust(owner: Fighter) {
    if (!isBlackRex(owner) || owner.rexBloodlust) return false
    const low = owner.hp < fighterDef(owner).hp * TREX_BLOODLUST.threshold
    if (!low || owner.hp <= 0 || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0
      || owner.lure || !grounded(owner)) {
      if (owner.rexBloodlustCall > 0) {
        owner.rexBloodlustCall = 0
        owner.roar = 0
      }
      return false
    }
    if (owner.rexBloodlustCall <= 0) {
      this.releaseGrab(owner)
      owner.rexStomp = 0
      owner.feeding = null
      owner.attack = 0
      owner.rexBloodlustCall = TREX_BLOODLUST.call
    }
    owner.vx = owner.vy = 0
    owner.rexBloodlustCall = Math.max(0, owner.rexBloodlustCall - DT)
    owner.roar = owner.rexBloodlustCall
    if (owner.rexBloodlustCall <= DT * 0.5) {
      owner.rexBloodlust = true
      owner.rexBloodlustCall = owner.roar = 0
      owner.rexReinforcements = TREX_BLOODLUST.helpers
      owner.skillCooldown = Math.max(owner.skillCooldown, TREX_ROAR.cooldown)
      this.terrifyRexEnemies(owner)
      this.summonRexHelp(owner)
    }
    return true
  }

  private terrifyRexEnemies(owner: Fighter) {
    for (const target of this.fighters) {
      if (target.hp <= 0 || allies(owner, target) || building(target) || target.stage === 'egg'
        || target.inside || target.heldBy || target.thrown
        || Math.hypot(target.x - owner.x, target.y - owner.y) > TREX_BLOODLUST.terrorRadius) continue
      this.releaseGrab(target)
      this.leaveNinjaTree(target)
      target.rexStomp = target.roar = 0
      target.feeding = null
      this.rally(target, owner)
      target.fear = Math.max(target.fear, TREX_BLOODLUST.fear)
      target.stun = Math.max(target.stun, TREX_BLOODLUST.shock)
      target.scaredBy = owner
    }
  }

  private summonRexHelp(owner: Fighter) {
    if (!isBlackRex(owner) || owner.hp <= 0 || (owner.infection && owner.infection.time <= DT)) {
      owner.rexReinforcements = 0
      return
    }
    while (owner.rexReinforcements > 0 && this.fighters.length < MAX_FIGHTERS) {
      let spawned = false
      for (let k = 0; k < 48; k++) {
        const angle = k * 2.399963 + owner.id
        const radius = fighterDef(owner).radius + TREX.radius + 36 + Math.floor(k / 12) * 24
        const x = owner.x + Math.cos(angle) * radius, y = owner.y + Math.sin(angle) * radius
        if (x < TREX.size * 24 || x > this.width - TREX.size * 24
          || y < TREX.size * 41 - TREX.radius || y > this.height - TREX.size * 12) continue
        if ([[0, 0], [-TREX.radius, 0], [TREX.radius, 0], [0, -TREX.radius], [0, TREX.radius]]
          .some(([dx, dy]) => this.water.inWater(x + dx, y + dy))) continue
        if (this.fighters.some((f) => f.hp > 0 && !f.nest && !f.inside && !f.heldBy
          && Math.hypot(f.x - x, f.y - y) < fighterDef(f).radius + TREX.radius + 12)) continue
        if (this.towers.some((tower) => tower.hp > 0 && Math.hypot(tower.x - x, tower.y - y) < 28 + TREX.radius + 12)) continue
        const helper = this.spawn(x, y, owner.team, 'rex')
        if (!helper) return
        const enemy = owner.retaliation ?? owner.target
        if (enemy && targetable(helper, enemy)) helper.target = helper.retaliation = enemy
        owner.rexReinforcements--
        spawned = true
        break
      }
      if (!spawned) break // Keep only the missing helpers pending until a dry exit clears.
    }
  }

  private tryRexStomp(owner: Fighter) {
    if (owner.species !== 'rex' || owner.zombie || owner.rexStompCooldown > 0 || owner.cooldown > 0
      || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0 || owner.lure || !grounded(owner)) return false
    const nearbyEnemy = this.fighters.some((target) => targetable(owner, target) && grounded(target) && !building(target)
      && Math.hypot(target.x - owner.x, target.y - owner.y) <= TREX_STOMP.radius + fighterDef(target).radius)
    if (!nearbyEnemy) return false
    owner.rexStomp = TREX_STOMP.charge
    owner.rexStompCooldown = TREX_STOMP.cooldown
    owner.cooldown = fighterDef(owner).cooldown
    owner.attack = 0
    owner.feeding = null
    return this.stepRexStomp(owner)
  }

  private stepRexStomp(owner: Fighter) {
    owner.vx = owner.vy = 0
    if (owner.hp <= 0 || owner.zombie || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0
      || owner.lure || !grounded(owner)) {
      owner.rexStomp = 0
      return false
    }
    owner.rexStomp = Math.max(0, owner.rexStomp - DT)
    if (owner.rexStomp <= DT * 0.5) {
      owner.rexStomp = 0
      this.groundSmash(owner, TREX_STOMP.radius, fighterDef(owner).damage * TREX_STOMP.power,
        TREX_STOMP.knockback, '#ac8057')
    }
    return true
  }

  private tryRexRam(owner: Fighter, target: Fighter | null) {
    if (!isBlackRex(owner) || owner.rexRamCooldown > 0 || owner.cooldown > 0 || owner.stun > 0
      || owner.frozen > 0 || owner.fear > 0 || owner.lure || !grounded(owner)
      || !target || !targetable(owner, target) || !grounded(target) || building(target)) return false
    const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
    if (distance < TREX_RAM.minRange || distance > TREX_RAM.range) return false
    owner.rexRam = { phase: 'windup', time: TREX_RAM.windup, target, nx: dx / distance, ny: dy / distance }
    owner.rexRamCooldown = TREX_RAM.cooldown
    owner.feeding = null
    owner.attack = 0
    if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
    return this.stepRexRam(owner)
  }

  private stepRexRam(owner: Fighter) {
    const ram = owner.rexRam!, target = ram.target
    const carrying = target.heldBy === owner
    if (!isBlackRex(owner) || owner.hp <= 0 || owner.stun > 0 || owner.frozen > 0 || owner.fear > 0
      || owner.lure || !grounded(owner) || target.hp <= 0 || allies(owner, target)
      || (carrying ? target.inside || target.hidden : !targetable(owner, target) || !grounded(target))) {
      this.releaseGrab(owner)
      owner.vx = owner.vy = 0
      return false
    }
    ram.time = Math.max(0, ram.time - DT)
    if (ram.phase === 'windup') {
      owner.vx = owner.vy = 0
      if (ram.time <= DT * 0.5) {
        const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
        ram.nx = distance > 0 ? dx / distance : owner.facing
        ram.ny = distance > 0 ? dy / distance : 0
        ram.phase = 'dash'; ram.time = TREX_RAM.dash
      }
      return true
    }
    if (ram.phase === 'pin') {
      owner.vx = owner.vy = target.vx = target.vy = 0
      if (!carrying || ram.time <= DT * 0.5) this.releaseGrab(owner)
      return true
    }
    const oldX = owner.x, oldY = owner.y
    const x = owner.x + ram.nx * TREX_RAM.speed * DT, y = owner.y + ram.ny * TREX_RAM.speed * DT
    owner.x = x; owner.y = y
    owner.vx = ram.nx * TREX_RAM.speed; owner.vy = ram.ny * TREX_RAM.speed
    owner.phase += DT * 18
    this.clamp(owner)
    if (!carrying && segmentDistance(target.x, target.y, oldX, oldY, owner.x, owner.y)
      <= fighterDef(owner).radius + fighterDef(target).radius + 4) {
      const tooLarge = fighterDef(target).radius >= fighterDef(owner).radius * TREX_THROW.lift
      this.hit(target, TREX_RAM.damage, tooLarge ? ram.nx * TREX.knockback : 0, tooLarge ? ram.ny * TREX.knockback : 0, owner)
      if (target.hp <= 0 || tooLarge) {
        this.releaseGrab(owner)
        owner.vx = owner.vy = 0
        return true
      }
      this.releaseGrab(target)
      this.leaveNinjaTree(target)
      target.rexStomp = target.roar = 0
      target.feeding = null
      target.charge = target.lightning = null
      target.dash = target.ambush = null
      target.lightningSword = null
      target.heldBy = owner
      target.vx = target.vy = 0
      ram.time = Math.hypot(this.width, this.height) / TREX_RAM.speed + 1
    }
    if (target.heldBy === owner) {
      const offset = fighterDef(owner).radius + fighterDef(target).radius * 0.6
      const tx = owner.x + ram.nx * offset, ty = owner.y + ram.ny * offset
      target.x = tx; target.y = ty
      this.clamp(target)
      const wallX = owner.x !== x, wallY = owner.y !== y
      if (wallX || wallY || target.x !== tx || target.y !== ty) {
        // A large rammer may reach its own margin before a smaller carried victim.
        if (wallX) target.x = ram.nx > 0 ? this.width : 0
        if (wallY) target.y = ram.ny > 0 ? this.height : 0
        this.clamp(target)
        this.hit(target, TREX_RAM.wallDamage, 0, 0, owner)
        target.stun = Math.max(target.stun, TREX_RAM.stun)
        this.impacts.push({ x: target.x, y: target.y, radius: 45, life: 0.4, color: '#ac8057' })
        ram.phase = 'pin'; ram.time = TREX_RAM.pin
        owner.vx = owner.vy = 0
        if (target.hp <= 0) this.releaseGrab(owner)
        return true
      }
    }
    if (ram.time <= DT * 0.5 || owner.x === oldX && owner.y === oldY) {
      this.releaseGrab(owner)
      owner.vx = owner.vy = 0
    }
    return true
  }

  private bite(owner: Fighter, target: Fighter) {
    if (target.hp <= 0 || allies(owner, target) || !grounded(target)) return
    const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
    const def = fighterDef(owner)
    if (distance > def.radius + fighterDef(target).radius + def.range) return
    const nx = distance > 0.001 ? dx / distance : owner.facing, ny = distance > 0.001 ? dy / distance : 0
    if (!this.hit(target, def.damage, nx * def.knockback, ny * def.knockback, owner, 0, true)) return
    if (target.hp > 0 && !building(target) && isAlphaRex(owner)) {
      target.bleed = TREX_ALPHA.bleed
      target.bleedOwner = owner
    }
    if (target.hp > 0 && !building(target) && fighterDef(target).radius < def.radius * (isBlackRex(owner) ? TREX_THROW.lift : 1)
      && this.random() < TREX_GRAB.chance) {
      this.releaseGrab(target)
      target.rexStomp = 0
      owner.grab = { target, time: TREX_GRAB.shake }
      if (isBlackRex(owner)) owner.grab.landing = this.rexThrowLanding(owner, target)
      target.heldBy = owner
      target.vx = target.vy = 0
      target.charge = target.lightning = null
      target.dash = null
      target.ambush = null
      this.leaveNinjaTree(target)
    }
  }

  private tryRexRoar(owner: Fighter) {
    if (owner.skillCooldown > 0) return false
    // Failed rolls wait one normal attack interval, even while approaching.
    owner.skillCooldown = fighterDef(owner).cooldown
    if (this.random() >= TREX_ROAR.chance) return false
    owner.skillCooldown = TREX_ROAR.cooldown
    owner.cooldown = fighterDef(owner).cooldown
    owner.roar = TREX_ROAR.duration
    owner.attack = 0
    owner.vx = owner.vy = 0
    for (const target of this.fighters) {
      if (target.hp <= 0 || target.stage === 'egg' || target.heldBy || target.thrown || target.inside || building(target) || allies(owner, target)) continue
      if (!canReach(owner, target)) continue
      if (Math.hypot(target.x - owner.x, target.y - owner.y) > TREX_ROAR.radius) continue
      this.rally(target, owner)
      target.fear = Math.max(target.fear, TREX_ROAR.fear)
      target.scaredBy = owner
    }
    return true
  }

  private rexThrowLanding(owner: Fighter, carried: Fighter) {
    const enemies = this.fighters.filter((target) => target !== carried && targetable(owner, target)
      && grounded(target) && !building(target))
    let x = owner.x + owner.facing * TREX_THROW.range, y = owner.y
    let best = 0, nearest = Infinity
    for (const candidate of enemies) {
      const distance = Math.hypot(candidate.x - owner.x, candidate.y - owner.y)
      if (distance > TREX_THROW.range) continue
      let count = 0
      for (const other of this.nearbyFighters(candidate.x, candidate.y, TREX_THROW.radius + this.gridRadius)) {
        if (other !== carried && targetable(owner, other) && grounded(other) && !building(other)
          && Math.hypot(other.x - candidate.x, other.y - candidate.y) <= TREX_THROW.radius + fighterDef(other).radius) count++
      }
      if (count > best || count === best && distance < nearest) {
        best = count; nearest = distance
        x = candidate.x; y = candidate.y
      }
    }
    const def = fighterDef(carried)
    const mx = Math.min(24 * def.size, this.width / 2)
    const top = Math.min(41 * def.size - def.radius, this.height / 2)
    const bottom = Math.min(12 * def.size, this.height / 2)
    return { x: Math.max(mx, Math.min(this.width - mx, x)), y: Math.max(top, Math.min(this.height - bottom, y)) }
  }

  private rexThrowImpact(owner: Fighter, victim: Fighter) {
    this.hit(victim, TREX_THROW.damage, 0, 0, owner)
    victim.stun = Math.max(victim.stun, TREX_THROW.stun)
    for (const other of this.fighters) {
      if (other === victim || !targetable(owner, other) || !grounded(other)) continue
      const dx = other.x - victim.x, dy = other.y - victim.y, distance = Math.hypot(dx, dy)
      if (distance > TREX_THROW.radius + fighterDef(other).radius) continue
      const angle = distance > 0 ? Math.atan2(dy, dx) : other.id * 2.399963
      this.hit(other, TREX_THROW.splashDamage, Math.cos(angle) * TREX_THROW.knockback,
        Math.sin(angle) * TREX_THROW.knockback, owner)
      if (other.hp > 0 && !building(other)) {
        this.releaseGrab(other)
        other.stun = Math.max(other.stun, TREX_THROW.stun)
        other.dizzy = Math.max(other.dizzy, TREX_GRAB.dizzy)
      }
    }
    for (const tower of this.towers) {
      if (tower.hp > 0 && tower.occupant && !allies(owner, tower.occupant)
        && Math.hypot(tower.x - victim.x, tower.y - victim.y) <= TREX_THROW.radius + 28) this.hitTower(tower, TREX_THROW.splashDamage, owner)
    }
    this.impacts.push({ x: victim.x, y: victim.y, radius: TREX_THROW.radius, life: 0.4, color: '#c18a54' })
  }

  private stepGrab(owner: Fighter) {
    const grab = owner.grab!, target = grab.target
    if (target.hp <= 0 || target.heldBy !== owner) { this.releaseGrab(owner); return false }
    owner.vx = owner.vy = 0
    if (owner.stun > 0) return true
    grab.time = Math.max(0, grab.time - DT)
    if (grab.time <= 0) {
      this.releaseGrab(owner)
      if (isBlackRex(owner)) {
        const landing = grab.landing ?? this.rexThrowLanding(owner, target)
        target.vx = (landing.x - target.x) / TREX_THROW.duration
        target.vy = (landing.y - target.y) / TREX_THROW.duration
        target.thrown = { owner, time: TREX_THROW.duration, smash: { ...landing,
          fromX: target.x, fromY: target.y, duration: TREX_THROW.duration, team: owner.team } }
      } else {
        const angle = (this.random() - 0.5) * 1.2
        target.vx = Math.cos(angle) * owner.facing * TREX_GRAB.speed
        target.vy = Math.sin(angle) * TREX_GRAB.speed
        target.thrown = { owner, time: TREX_GRAB.distance / TREX_GRAB.speed }
      }
      owner.attack = 1
    } else if (this.tick % 10 === 0) this.hit(target, fighterDef(owner).damage * 0.25, 0, 0, owner)
    return true
  }

  private stepThrown(fighter: Fighter) {
    const flight = fighter.thrown!
    flight.time = Math.max(0, flight.time - DT)
    if (flight.smash) {
      const progress = 1 - flight.time / flight.smash.duration
      fighter.x = flight.smash.fromX + (flight.smash.x - flight.smash.fromX) * progress
      fighter.y = flight.smash.fromY + (flight.smash.y - flight.smash.fromY) * progress
    } else {
      fighter.x += fighter.vx * DT
      fighter.y += fighter.vy * DT
    }
    this.clamp(fighter)
    if (flight.time > 0) return
    fighter.thrown = null
    fighter.vx = fighter.vy = 0
    fighter.dizzy = TREX_GRAB.dizzy
    if (flight.smash) {
      if (flight.owner.zombie || flight.owner.team !== flight.smash.team) this.hit(fighter, TREX_GRAB.landingDamage)
      else this.rexThrowImpact(flight.owner, fighter)
      return
    }
    this.hit(fighter, TREX_GRAB.landingDamage, 0, 0, flight.owner)
    for (const other of this.fighters) {
      if (other === fighter || other.hp <= 0 || allies(flight.owner, other) || !grounded(other)) continue
      const dx = other.x - fighter.x, dy = other.y - fighter.y, distance = Math.hypot(dx, dy)
      if (distance > TREX_GRAB.landingRadius + fighterDef(other).radius) continue
      const nx = distance > 0.001 ? dx / distance : flight.owner.facing
      const ny = distance > 0.001 ? dy / distance : 0
      this.hit(other, TREX_GRAB.landingDamage * 0.5, nx * 150, ny * 150, flight.owner)
    }
  }

  private groundSmash(owner: Fighter, radius: number, damage: number, knockback: number, color = '#3e9de8') {
    for (const target of this.fighters) {
      if (target.hp <= 0 || allies(owner, target) || !grounded(target)) continue
      const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy)
      if (distance > radius + fighterDef(target).radius) continue
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : target.id * 2.39996
      this.hit(target, damage, Math.cos(angle) * knockback, Math.sin(angle) * knockback, owner)
    }
    for (const tower of this.towers) {
      if (tower.hp <= 0 || !tower.occupant || allies(owner, tower.occupant)) continue
      if (Math.hypot(tower.x - owner.x, tower.y - owner.y) <= radius + 28) this.hitTower(tower, damage, owner)
    }
    this.impacts.push({ x: owner.x, y: owner.y, radius, life: 0.4, color })
    owner.slam = 1
  }

  private throwHammer(owner: Fighter, target: Fighter) {
    const distance = Math.hypot(target.x - owner.x, target.y - owner.y)
    const lead = distance / HAMMER_SPEED
    const dx = target.x + target.vx * lead - owner.x, dy = target.y + target.vy * lead - owner.y
    const aim = Math.hypot(dx, dy) || 1
    this.hammers.push({
      owner, x: owner.x, y: owner.y,
      vx: dx / aim * HAMMER_SPEED, vy: dy / aim * HAMMER_SPEED,
      remaining: distance + 40, returning: false, age: 0, homeTime: 4, hits: new Set(),
    })
    owner.hammerOut = true
  }

  private tryThorSkill(owner: Fighter, target: Fighter) {
    if (owner.skillCooldown > 0) return false
    const roll = this.random()
    const { shot, storm, charge } = THOR_SKILLS
    if (roll < shot.chance) {
      owner.lightning = { target, time: shot.windup }
      owner.attack = 0
    } else if (roll < shot.chance + storm.chance) {
      // Mark the ground now; targets can leave the warning circle before impact.
      this.storms.push({ owner, x: target.x, y: target.y, elevation: 0, time: storm.warning, phase: 'warning' })
      owner.casting = 1
    } else if (roll < shot.chance + storm.chance + charge.chance) {
      owner.charge = { phase: 'windup', time: charge.windup, fromX: owner.x, fromY: owner.y, x: target.x, y: target.y, target }
    } else return false
    owner.skillCooldown = THOR_SKILLS.cooldown
    return true
  }

  private stepLightningCharge(owner: Fighter) {
    const windup = owner.lightning!
    owner.vx = owner.vy = 0
    if (owner.stun > 0 || owner.fear > 0 || !targetable(owner, windup.target)) {
      owner.lightning = null
      return false
    }
    const dx = windup.target.x - owner.x, dy = windup.target.y - owner.y
    if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
    windup.time = Math.max(0, windup.time - DT)
    if (windup.time > 0) return true

    const { shot } = THOR_SKILLS
    const distance = Math.hypot(dx, dy)
    const nx = distance > 0.001 ? dx / distance : owner.facing
    const ny = distance > 0.001 ? dy / distance : 0
    let reach: number = shot.range, victim: Fighter | null = null
    for (const target of this.fighters) {
      if (!targetable(owner, target)) continue
      const tx = target.x - owner.x, ty = target.y - owner.y
      const along = tx * nx + ty * ny
      const perpendicular = Math.abs(tx * ny - ty * nx)
      const radius = fighterDef(target).radius + shot.width / 2
      if (perpendicular > radius) continue
      const halfChord = Math.sqrt(radius * radius - perpendicular * perpendicular)
      if (along + halfChord < 0) continue
      const entry = Math.max(0, along - halfChord)
      if (entry <= reach) { reach = entry; victim = target }
    }
    if (victim) this.hit(victim, shot.damage, 0, 0, owner, ELECTRIC_FLASH)
    this.shots.push({
      owner, x: owner.x + owner.facing * 11, y: owner.y - 19,
      tx: owner.x + nx * reach, ty: owner.y + ny * reach, life: shot.duration,
    })
    if (victim) {
      const struck = new Set<Fighter>([victim])
      let previous = victim
      for (let hop = 1; hop < shot.maxTargets; hop++) {
        let next: Fighter | null = null, nearest: number = shot.chainRange
        for (const target of this.fighters) {
          if (!targetable(owner, target) || struck.has(target)) continue
          const distance = Math.hypot(target.x - previous.x, target.y - previous.y)
          if (distance <= nearest) { nearest = distance; next = target }
        }
        if (!next) break
        this.hit(next, shot.damage, 0, 0, owner, ELECTRIC_FLASH)
        this.shots.push({ owner, x: previous.x, y: previous.y, tx: next.x, ty: next.y, life: shot.duration })
        struck.add(next)
        previous = next
      }
    }
    owner.lightning = null
    owner.casting = 1
    owner.attack = 1
    return true
  }

  private stepCharge(owner: Fighter) {
    const charge = owner.charge!
    const swooping = owner.species === 'goose'
    if (owner.stun > 0 || owner.fear > 0 || ((swooping || charge.phase === 'windup') && !targetable(owner, charge.target))) {
      owner.charge = null
      owner.vx = owner.vy = 0
      return false
    }
    owner.vx = owner.vy = 0
    charge.time = Math.max(0, charge.time - DT)
    if (charge.phase === 'windup') {
      if (charge.time <= 0) {
        charge.phase = 'flight'
        charge.time = THOR_SKILLS.charge.flight
        charge.fromX = owner.x
        charge.fromY = owner.y
      }
    } else {
      const progress = 1 - charge.time / (swooping ? GOOSE_SWOOP.flight : THOR_SKILLS.charge.flight)
      if (swooping) {
        const dx = charge.target.x - charge.fromX, dy = charge.target.y - charge.fromY
        const distance = Math.hypot(dx, dy)
        const reach = GOOSE.radius + fighterDef(charge.target).radius
        const approach = distance > 0 ? Math.max(0, distance - reach) / distance : 0
        charge.x = charge.fromX + dx * approach
        charge.y = charge.fromY + dy * approach
        if (Math.abs(dx) > 2) owner.facing = dx > 0 ? 1 : -1
      }
      owner.x = charge.fromX + (charge.x - charge.fromX) * progress
      owner.y = charge.fromY + (charge.y - charge.fromY) * progress
      owner.phase += DT * 12
      this.clamp(owner)
      if (charge.time <= 0) {
        if (swooping) {
          this.peck(owner, charge.target)
          owner.attack = 1
          owner.cooldown = GOOSE.cooldown
        } else {
          const skill = THOR_SKILLS.charge
          this.groundSmash(owner, skill.radius, skill.damage, skill.knockback)
        }
        owner.charge = null
      }
    }
    return true
  }

  private stepLightning() {
    const { storm } = THOR_SKILLS
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const bolt = this.shots[i]
      bolt.life = Math.max(0, bolt.life - DT)
      if (bolt.owner.hp <= 0 || bolt.life <= 0) this.shots.splice(i, 1)
    }
    for (let i = this.storms.length - 1; i >= 0; i--) {
      const area = this.storms[i]
      if (area.phase === 'warning' && area.owner.hp <= 0) { this.storms.splice(i, 1); continue }
      area.time = Math.max(0, area.time - DT)
      if (area.time > 0) continue
      if (area.phase === 'impact') { this.storms.splice(i, 1); continue }
      area.phase = 'impact'
      area.time = 0.3
      for (const target of this.fighters) {
        if (target.hp <= 0 || target.stage === 'egg' || target.heldBy || target.inside || allies(area.owner, target)) continue
        if (Math.hypot(target.x - area.x, target.y - area.y) > storm.radius + fighterDef(target).radius) continue
        if (target.tower && (area.elevation <= 24 || !canReach(area.owner, target))) {
          this.hitTower(target.tower, storm.damage, area.owner)
          continue
        }
        if (Math.abs(target.elevation - area.elevation) > storm.radius) continue
        if (this.hit(target, storm.damage, 0, 0, area.owner, storm.stun) && !building(target)) target.stun = Math.max(target.stun, storm.stun)
      }
      this.bolts.push({ x: area.x - 12, y: area.y - area.elevation - 180, tx: area.x, ty: area.y - area.elevation, life: 0.3 })
    }
  }

  private stepHammers() {
    for (let i = this.hammers.length - 1; i >= 0; i--) {
      const hammer = this.hammers[i], owner = hammer.owner, def = UNITS[owner.species]
      if (owner.hp <= 0) { this.hammers.splice(i, 1); continue }
      hammer.age += DT
      if (hammer.returning) {
        const dx = owner.x - hammer.x, dy = owner.y - hammer.y
        const d = Math.hypot(dx, dy) || 1
        hammer.vx = dx / d * HAMMER_SPEED
        hammer.vy = dy / d * HAMMER_SPEED
        hammer.homeTime -= DT
      }
      const px = hammer.x, py = hammer.y
      hammer.x += hammer.vx * DT
      hammer.y += hammer.vy * DT
      hammer.remaining -= HAMMER_SPEED * DT
      const edge = hammer.x < 0 || hammer.y < 0 || hammer.x > this.width || hammer.y > this.height
      hammer.x = Math.max(0, Math.min(this.width, hammer.x))
      hammer.y = Math.max(0, Math.min(this.height, hammer.y))
      for (const target of this.fighters) {
        if (target.hp <= 0 || target.stage === 'egg' || target.heldBy || target.inside || allies(owner, target) || hammer.hits.has(target)) continue
        if (!target.tower && !canReach(owner, target)) continue
        if (segmentDistance(target.x, target.y, px, py, hammer.x, hammer.y) > fighterDef(target).radius + 3) continue
        this.hit(target, def.damage, hammer.vx / HAMMER_SPEED * def.knockback, hammer.vy / HAMMER_SPEED * def.knockback, owner)
        hammer.hits.add(target)
      }
      if (!hammer.returning && (hammer.remaining <= 0 || edge)) {
        hammer.returning = true
        hammer.hits.clear() // each enemy can be hit once going out and once coming back
      } else if (hammer.returning && (hammer.homeTime <= 0 || segmentDistance(owner.x, owner.y, px, py, hammer.x, hammer.y) < def.radius + 8)) {
        owner.hammerOut = false
        owner.catching = 1
        this.hammers.splice(i, 1)
      }
    }
  }

  step() {
    this.tick++
    for (const team of ['red', 'blue', 'ffa'] as const) this.trySpartanCommander(team)
    for (const molt of this.mantisMolts) molt.life -= DT
    this.mantisMolts = this.mantisMolts.filter((molt) => molt.life > 0)
    for (const slash of this.mantisMoonSlashes) slash.life -= DT
    this.mantisMoonSlashes = this.mantisMoonSlashes.filter((slash) => slash.life > 0)
    for (const fighter of this.fighters) {
      if (fighter.taunt) fighter.taunt.time -= DT
      if (fighter.antFlight && (fighter.hp <= 0 || fighter.zombie || fighter.stun > 0 || fighter.frozen > 0
        || fighter.fear > 0 || fighter.lure || fighter.heldBy || fighter.thrown)) this.dropAntPassenger(fighter)
    }
    this.stepColonies()
    this.stepAntQueens()
    this.stepAntArmy()
    this.stepHauling()
    this.stepMantisDuels()
    this.buildFighterGrid()
    this.spartanFormations = updateSpartanFormations(this.fighters, this.spartanFormations, DT,
      this.width, this.height, targetable, fighterDef, this.spartanArmies)
    for (const group of this.spartanFormations) {
      const charge = group.charge
      if (charge?.phase === 'windup' && charge.time <= 0.7 && !charge.screamed) {
        charge.screamed = true
        this.onSpartanScream?.()
      }
    }
    for (const home of this.fighters) if (home.nest && home.hp <= 0) this.destroyDragonNest(home)
    for (const fighter of this.fighters) {
      if (fighter.rexReinforcements > 0 && (this.tick + fighter.id) % 15 === 0) this.summonRexHelp(fighter)
    }
    for (const tower of this.towers) {
      if (tower.hp <= 0) tower.fall = Math.max(0, tower.fall - DT)
      if (tower.occupant && tower.occupant.hp <= 0) this.leaveTower(tower.occupant)
    }
    this.towers = this.towers.filter((tower) => tower.hp > 0 || tower.fall > 0)
    for (const flame of this.flames) {
      flame.life -= DT
      flame.age += DT
    }
    this.flames = this.flames.filter(({ owner, life }) => life > 0 && owner.hp > 0
      && owner.stage !== 'egg' && owner.stage !== 'chick' && !owner.heldBy && !owner.thrown
      && owner.stun <= 0 && owner.fear <= 0 && !owner.lure && !owner.iceDive && !owner.phoenixDive && !owner.lightningSword)
    for (const ring of this.rings) ring.life -= DT
    this.rings = this.rings.filter((ring) => ring.life > 0 && ring.owner.hp > 0 && !ring.owner.zombie
      && ring.owner.stage !== 'egg' && ring.owner.stage !== 'chick')
    this.stepPhoenixFireballs()
    this.stepPhoenixFires()
    for (const ring of this.iceRings) ring.life -= DT
    this.iceRings = this.iceRings.filter((ring) => ring.life > 0)
    for (const bolt of this.bolts) bolt.life -= DT
    this.bolts = this.bolts.filter((bolt) => bolt.life > 0)
    this.stepMines()
    for (const impact of this.impacts) impact.life -= DT
    this.impacts = this.impacts.filter((impact) => impact.life > 0)
    for (const slash of this.katanaSlashes) slash.life -= DT
    this.katanaSlashes = this.katanaSlashes.filter((slash) => slash.life > 0)
    // Local targeting uses the same spatial buckets as crowd separation at the 1,000-creature cap.
    for (const fighter of this.fighters) {
      if (fighter.saintRest?.kind === 'meditate' && !canMeditate(fighter)) fighter.saintRest = null
      if (fighter.hp <= 0 && spartanCommanderProtected(fighter)) fighter.hp = 1
      if (fighter.hp <= 0) continue
      if (fighter.dragonSleeping && (fighter.stun > 0 || fighter.frozen > 0 || fighter.fear > 0
        || fighter.lure || fighter.heldBy || fighter.thrown || fighter.burn > 0)) this.wakeDragon(fighter)
      fighter.chill = Math.max(0, fighter.chill - DT)
      fighter.shock = Math.max(0, fighter.shock - DT)
      fighter.frozen = Math.max(0, fighter.frozen - DT)
      fighter.iceDiveCooldown = Math.max(0, fighter.iceDiveCooldown - DT)
      fighter.phoenixDiveCooldown = Math.max(0, fighter.phoenixDiveCooldown - DT)
      fighter.phoenixEncoreCooldown = Math.max(0, fighter.phoenixEncoreCooldown - DT)
      fighter.spartanThrowCooldown = Math.max(0, fighter.spartanThrowCooldown - DT)
      fighter.rexStompCooldown = Math.max(0, fighter.rexStompCooldown - DT)
      fighter.rexRamCooldown = Math.max(0, fighter.rexRamCooldown - DT)
      fighter.lightningSwordCooldown = Math.max(0, fighter.lightningSwordCooldown - DT)
      if (fighter.frozen > 0) fighter.vx = fighter.vy = 0
      fighter.evolution = Math.max(0, fighter.evolution - DT)
      if (!fighter.zombie && (fighter.stage === 'egg' || fighter.stage === 'chick')) {
        fighter.stageTime = Math.max(0, fighter.stageTime - DT)
        if (fighter.stageTime <= 0) {
          const hatching = fighter.stage === 'egg'
          fighter.stage = hatching ? 'chick' : 'reborn'
          fighter.stageTime = hatching ? PHOENIX_REBIRTH.chick : 0
          fighter.hp = fighterDef(fighter).hp
          fighter.hit = 1
        }
        if (fighter.stage === 'egg') continue
      }
      if (fighter.burn > 0) {
        this.wakeDragon(fighter, fighter.burnOwner ?? undefined)
        const elapsed = Math.min(DT, fighter.burn)
        fighter.burn = Math.max(0, fighter.burn - DT)
        const fire = fireMultiplier(fighter)
        fighter.hp -= incomingDamage(fighter, PHOENIX_FIRE.damagePerSecond * elapsed * fire, fighter.burnOwner)
        if (fighter.hp <= 0) {
          this.claimMeal(fighter.burnOwner, fighter)
          fighter.burnOwner = null
          fighter.infection = null
          continue
        }
        if (fighter.burn <= 0) fighter.burnOwner = null
      }
      if (fighter.bleed > 0) {
        const elapsed = Math.min(DT, fighter.bleed)
        fighter.bleed = Math.max(0, fighter.bleed - DT)
        fighter.hp -= incomingDamage(fighter, TREX_ALPHA.bleedDamage * elapsed, fighter.bleedOwner)
        this.wakeDragon(fighter, fighter.bleedOwner ?? undefined)
        if (fighter.hp <= 0) {
          this.claimMeal(fighter.bleedOwner, fighter)
          fighter.bleedOwner = null
          fighter.infection = null
          continue
        }
        if (fighter.bleed <= 0) fighter.bleedOwner = null
      }
      if (fighter.infection) {
        fighter.infection.time = Math.max(0, fighter.infection.time - DT)
        if (fighter.infection.time <= 0) {
          this.turnZombie(fighter, fighter.infection.team)
          continue
        }
      }
      const def = fighterDef(fighter)
      fighter.cooldown -= DT
      fighter.attack = Math.max(0, fighter.attack - DT * 5)
      fighter.hit = Math.max(0, fighter.hit - DT * 6)
      fighter.catching = Math.max(0, fighter.catching - DT * 6)
      fighter.skillCooldown = Math.max(0, fighter.skillCooldown - DT)
      fighter.meiMelee = Math.max(0, fighter.meiMelee - DT * MEI_PRESSURE.decay)
      fighter.meiRanged = Math.max(0, fighter.meiRanged - DT * MEI_PRESSURE.decay)
      fighter.meiFox = Math.max(0, fighter.meiFox - DT)
      fighter.meiBarrage = Math.max(0, fighter.meiBarrage - DT)
      fighter.meiMine = Math.max(0, fighter.meiMine - DT)
      fighter.meiStar = Math.max(0, fighter.meiStar - DT)
      if (fighter.species === 'swordsaint' && !fighter.zombie && !fighter.saint) {
        fighter.swordStack = Math.min(SWORD_SAINT_SWORDS.max, fighter.swordStack + DT / SWORD_SAINT_SWORDS.summon)
      }
      if (fighter.cavalryMounted && fighter.hp <= def.hp * CAVALRY_RIDE.dismount) {
        fighter.cavalryMounted = false
        fighter.stun = Math.max(fighter.stun, CAVALRY_RIDE.fall)
        this.impacts.push({ x: fighter.x, y: fighter.y, radius: 26, life: 0.35, smoke: true })
      }
      fighter.treeCooldown = Math.max(0, fighter.treeCooldown - DT)
      fighter.casting = Math.max(0, fighter.casting - DT * 4)
      fighter.slam = Math.max(0, fighter.slam - DT * 4)
      fighter.fear = Math.max(0, fighter.fear - DT)
      fighter.stun = Math.max(0, fighter.stun - DT)
      fighter.dizzy = Math.max(0, fighter.dizzy - DT)
      fighter.roar = Math.max(0, fighter.roar - DT)
      fighter.song = Math.max(-SIREN_SONG.ballad, fighter.song - DT)
      this.stepMantisCloak(fighter)
      if (fighter.lure) {
        fighter.lure.time -= DT
        if (fighter.lure.time <= 0 || fighter.lure.owner.hp <= 0 || fighter.lure.owner.song > 0) fighter.lure = null
      }
      if (building(fighter)) {
        fighter.vx = fighter.vy = 0
        fighter.fear = fighter.stun = fighter.dizzy = fighter.frozen = 0
        fighter.lure = fighter.infection = null
        if (fighter.colony) this.hatchAnt(fighter)
        else if (fighter.species === 'dragon-egg') this.stepDragonEgg(fighter)
        else if (fighter.species === 'rex-egg') this.stepRexEgg(fighter)
        continue
      }
      if (fighter.inside) {
        fighter.entry = Math.min(1, fighter.entry + DT / 0.25)
        fighter.vx = fighter.vy = 0
        continue
      }
      if (this.stepMantisMoonSlash(fighter)) continue
      if (this.stepMantisLeap(fighter)) continue
      if (this.stepMantisDodge(fighter)) continue
      if (this.steerMantisDuel(fighter)) continue
      if (fighter.bat && (fighter.stun > 0 || fighter.fear > 0 || fighter.lure || fighter.heldBy || fighter.thrown)) {
        this.setVampireBat(fighter, false)
      }
      if (fighter.feeding && (fighter.stun > 0 || fighter.fear > 0 || fighter.lure || fighter.heldBy || fighter.thrown)) fighter.feeding = null
      if (fighter.dragonDomain && this.stepDragonDomainCast(fighter)) continue
      if (this.tryDragonDomain(fighter)) continue
      if (this.stepRexBloodlust(fighter)) continue
      if (fighter.rexRam && this.stepRexRam(fighter)) continue
      if (fighter.rexStomp > 0 && this.stepRexStomp(fighter)) continue
      if (fighter.phoenixDive && this.stepPhoenixDive(fighter)) continue
      if (fighter.lightningSword && this.stepLightningSword(fighter)) continue
      if (fighter.iceDive && this.stepIceDive(fighter)) continue
      if (fighter.heldBy) {
        if (fighter.heldBy.hp > 0 && (fighter.heldBy.grab?.target === fighter || fighter.heldBy.rexRam?.target === fighter
          || fighter.heldBy.antFlight?.passenger === fighter)) continue
        fighter.heldBy = null
      }
      if (fighter.falling) {
        fighter.elevation = Math.max(0, fighter.elevation - DT * 240)
        if (fighter.elevation === 0) {
          fighter.falling = false
          this.hit(fighter, 25)
          fighter.stun = Math.max(fighter.stun, 1)
        }
        continue
      }
      if (fighter.tower) { this.stepTowerOccupant(fighter); continue }
      if (fighter.thrown) { this.stepThrown(fighter); continue }
      if (this.stepAntFly(fighter)) continue
      if (fighter.lure) {
        this.releaseGrab(fighter)
        fighter.charge = fighter.lightning = null
        fighter.dash = null
        fighter.ambush = null
        this.leaveNinjaTree(fighter)
        if (fighter.species === 'ninja' && fighter.elevation > 0) { fighter.falling = true; continue }
        fighter.roar = 0
        fighter.target = null
        const dx = fighter.lure.owner.x - fighter.x, dy = fighter.lure.owner.y - fighter.y
        const distance = Math.hypot(dx, dy)
        const speed = fighter.stun > 0 || distance <= def.radius + SIREN.radius ? 0 : def.speed
        if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
        this.move(fighter, distance > 0 ? dx / distance * speed : 0, distance > 0 ? dy / distance * speed : 0)
        continue
      }
      if (fighter.grab && this.stepGrab(fighter)) continue
      if (fighter.spartanFormation?.charge && this.stepSpartanCharge(fighter)) continue
      if (fighter.roar > 0) {
        if (fighter.stun > 0 || fighter.fear > 0) fighter.roar = 0
        else { fighter.vx = fighter.vy = 0; continue }
      }
      if (fighter.lightning && this.stepLightningCharge(fighter)) continue
      if (fighter.charge && this.stepCharge(fighter)) continue
      if (fighter.ambush && this.stepNinjaAmbush(fighter)) continue
      if (fighter.dash && this.stepNinjaDash(fighter)) continue
      if (fighter.saint && this.stepSaint(fighter)) continue
      if (this.tryMeiTransform(fighter)) continue
      if (fighter.mei && this.stepMei(fighter)) continue
      const domainOwner = this.domainTarget(fighter)
      const duelOpponent = mantisOpponent(fighter)
      if (!domainOwner && !duelOpponent && this.stepNinjaCover(fighter)) continue
      if (!domainOwner && !duelOpponent && this.seekTower(fighter)) continue
      if (!domainOwner && !duelOpponent && this.workColony(fighter)) continue
      if (!domainOwner && !duelOpponent && this.haulBody(fighter)) continue
      if (!domainOwner && !duelOpponent && fighter.species === 'ant-tank' && !fighter.zombie && fighter.antHome?.hp && fighter.stun <= 0 && fighter.fear <= 0) {
        const dx = fighter.antHome.x - fighter.x, dy = fighter.antHome.y - fighter.y, distance = Math.hypot(dx, dy)
        if (distance > 170) {
          this.move(fighter, dx / distance * def.speed, dy / distance * def.speed)
          continue
        }
      }
      this.provokeAnt(fighter)

      const retaliation = domainOwner ?? duelOpponent ?? this.retaliationTarget(fighter)
      let target = retaliation ?? fighter.target
      if (target && !targetable(fighter, target)) target = null
      if (!retaliation) {
        let distance = Infinity
        // Thor and T-Rex have explicit sight ranges; Honk keeps the original local search.
        const detection = 'detection' in def ? def.detection : undefined
        const sight = Math.max(5, Math.ceil((detection ?? (def.range + def.radius + 24)) / 32))
        const cellX = Math.floor(fighter.x / 32), cellY = Math.floor(fighter.y / 32)
        for (const other of this.nearbyFighters(fighter.x, fighter.y, (sight + 1) * 32)) {
          if (!targetable(fighter, other)) continue
          if (Math.abs(Math.floor(other.x / 32) - cellX) > sight || Math.abs(Math.floor(other.y / 32) - cellY) > sight) continue
          const d = Math.hypot(other.x - fighter.x, other.y - fighter.y)
          if (detection !== undefined && d > detection) continue
          if (d < distance) { target = other; distance = d }
        }
      }
      fighter.target = target
      // A fishing saint ignores enemies he can see; only an attack (and his fish counter) breaks his calm.
      if (target && fighter.saintRest?.kind === 'fish' && !retaliation) fighter.target = target = null
      else if (target) fighter.saintRest = null
      if (this.tryMantisHunt(fighter, target)) continue
      if (this.tryMantisMoonSlash(fighter, target)) continue
      if (this.tryMantisDuel(fighter, target)) continue
      if (!domainOwner && fighter.species === 'spartan' && !fighter.zombie && !fighter.spartanSpear
        && fighter.spartanMark && targetable(fighter, fighter.spartanMark)) fighter.target = target = fighter.spartanMark
      if (this.trySpartanThrow(fighter, target)) continue
      if (this.trySaintFlip(fighter, target)) continue
      if (this.tryMeiSkill(fighter, target)) continue
      if (this.stepSpartanFormation(fighter, domainOwner !== null)) continue
      if (!domainOwner && fighter.species === 'ant-tank' && fighter.antHome && target
        && Math.hypot(target.x - fighter.antHome.x, target.y - fighter.antHome.y) > 240) {
        fighter.target = target = null
      }
      // Fight first, including interrupting a meal when a new enemy appears.
      if (target) {
        fighter.feeding = null
        fighter.dragonSleeping = false
        fighter.dragonQuiet = 0
        fighter.rexLayTime = 0
      }
      else if (this.stepFeeding(fighter)) continue
      if (this.stepVampireFlight(fighter, target)) continue
      if (this.tryRexRam(fighter, target)) continue
      if (this.tryPhoenixDive(fighter, target)) continue
      if (this.tryLightningSword(fighter, target)) continue
      if (this.tryIceDive(fighter, target)) continue
      if ((!target?.tower || fighter.fear > 0 || fighter.stun > 0) && fighter.elevation > 0) {
        fighter.elevation = Math.max(0, fighter.elevation - DT * 160)
        if (fighter.elevation > 0) { this.move(fighter, 0, 0); continue }
      }
      if (this.stepDragonRest(fighter, target)) continue
      this.stepRexBreeding(fighter, target)
      let speedX = 0, speedY = 0
      if (fighter.fear > 0 && fighter.scaredBy && !concealed(fighter.scaredBy)) target = fighter.scaredBy
      else fighter.scaredBy = null
      if (target && fighter.stun <= 0) {
        if (fighter.fear <= 0 && this.attackTower(fighter, target)) continue
        const dx = target.x - fighter.x, dy = target.y - fighter.y
        const d = Math.hypot(dx, dy)
        const nx = d > 0.001 ? dx / d : fighter.facing, ny = d > 0.001 ? dy / d : 0
        if (!fighter.zombie && fighter.species === 'ninja' && this.ninjaDangerous(fighter, target, d)) {
          fighter.fear = Math.max(fighter.fear, 1.1)
          fighter.scaredBy = target
        }
        if (fighter.fear > 0) {
          speedX = -nx * def.speed * 1.9
          speedY = -ny * def.speed * 1.9
          fighter.facing = nx > 0 ? -1 : 1
        } else {
          if (Math.abs(dx) > 2) fighter.facing = dx > 0 ? 1 : -1
          if (!fighter.zombie && fighter.species === 'ninja' && fighter.skillCooldown <= 0 && grounded(target)
            && d > NINJA.radius + fighterDef(target).radius + NINJA_DASH.reach && d < NINJA_DASH.range) {
            fighter.dash = { target, time: NINJA_DASH.duration }
            fighter.skillCooldown = NINJA_DASH.cooldown
            this.stepNinjaDash(fighter)
            continue
          }
          if (!fighter.zombie && fighter.cavalryMounted && !fighter.hammerOut) {
            // Gallop in, then circle the target, switching direction now and then, slashing on the move.
            const reach = def.radius + fighterDef(target).radius
            const side = Math.floor((this.tick + fighter.id * 37) / CAVALRY_RIDE.swap) % 2 ? 1 : -1
            const pull = Math.max(-1, Math.min(1, (d - reach - CAVALRY_RIDE.orbit) / 20))
            const circling = d < reach + CAVALRY_RIDE.orbit + CAVALRY_RIDE.approach
            const mx = circling ? nx * pull - ny * side : nx, my = circling ? ny * pull + nx * side : ny
            const length = Math.hypot(mx, my) || 1
            if (Math.abs(fighter.vx) > 20) fighter.facing = fighter.vx > 0 ? 1 : -1
            if (fighter.cooldown <= 0 && d <= reach + def.range) {
              fighter.cooldown = def.cooldown
              fighter.attack = 1
              this.cavalrySlash(fighter)
            }
            this.move(fighter, mx / length * def.speed, my / length * def.speed)
            continue
          }
          if (this.tryRexStomp(fighter)) continue
          if (!fighter.zombie && fighter.species === 'rex' && fighter.cooldown <= 0 && d <= TREX_ROAR.radius && this.tryRexRoar(fighter)) continue
          if (!fighter.hammerOut) {
            if (d > def.radius + fighterDef(target).radius + def.range) {
              if (!fighter.zombie && fighter.species === 'goose' && d <= GOOSE_SWOOP.range && fighter.cooldown <= 0
                && fighter.skillCooldown <= 0 && grounded(target)) {
                fighter.cooldown = def.cooldown
                if (this.random() < GOOSE_SWOOP.chance) {
                  fighter.charge = { phase: 'flight', time: GOOSE_SWOOP.flight, fromX: fighter.x, fromY: fighter.y, x: target.x, y: target.y, target }
                  fighter.skillCooldown = GOOSE_SWOOP.cooldown
                  fighter.vx = fighter.vy = 0
                  continue
                }
              }
              speedX = nx * def.speed
              speedY = ny * def.speed
            } else if (fighter.cooldown <= 0) {
              fighter.cooldown = def.cooldown
              fighter.attack = 1
              if (fighter.zombie) this.zombieBite(fighter, target, nx, ny)
              else if (fighter.species === 'vampire') this.vampireBite(fighter, target, nx, ny)
              else if (fighter.species === 'thor') {
                if (d <= THOR_MELEE.reach + fighterDef(target).radius && grounded(target)) {
                  this.groundSmash(fighter, THOR_MELEE.radius, THOR_MELEE.damage, THOR_MELEE.knockback)
                } else if (!this.tryThorSkill(fighter, target)) this.throwHammer(fighter, target)
                if (fighter.charge || fighter.lightning) { fighter.vx = fighter.vy = 0; continue }
              }
              else if (fighter.species === 'rex') this.bite(fighter, target)
              else if (fighter.species === 'phoenix' || fighter.species === 'dragon') this.fireAttack(fighter, target, nx, ny)
              else if (fighter.species === 'siren') this.sing(fighter)
              else if (fighter.species === 'ninja') this.ninjaAttack(fighter, target, nx, ny)
              else if (fighter.species === 'swordsaint') this.launchSwords(fighter, target, nx, ny)
              else if (fighter.species === 'meiyuanzhi') {
                if (this.tryMeiStar(fighter, target)) continue
                if (fighter.meiForm > 0 && d <= def.radius + fighterDef(target).radius + MEI_CLAW.reach) {
                  fighter.meiHand = 0 // the front hand claws
                  this.foxClaw(fighter, target, nx, ny, MEI_CLAW.damage, MEI_CLAW.knockback)
                } else if (!this.tryMeiBarrage(fighter, target) && !this.placeMeiMine(fighter, target)) {
                  this.throwTalisman(fighter, target, undefined, this.tryMeiFox(fighter))
                }
              }
              else if (fighter.species === 'mei-fox') this.foxClaw(fighter, target, nx, ny, def.damage, def.knockback)
              else if (fighter.species === 'spartan') this.spartanAttack(fighter, target, nx, ny)
              else if (fighter.species === 'cavalry') {
                if (grounded(target) && canReach(fighter, target)) this.hit(target, def.damage, nx * def.knockback, ny * def.knockback, fighter, 0, true)
              }
              else if (fighter.species === 'mantis') this.mantisAttack(fighter, target, nx, ny)
              else if (antSoldier(fighter)) {
                if (grounded(target) && canReach(fighter, target)) {
                  const struck = this.hit(target, def.damage, nx * def.knockback, ny * def.knockback, fighter, 0, true)
                  if (struck && fighter.species === 'ant-slasher' && target.hp > 0 && !building(target)) {
                    target.bleed = 4
                    target.bleedOwner = fighter
                  }
                }
              }
              else this.peck(fighter, target)
            }
          }
        }
      } else if (!target && fighter.stun <= 0 && !fighter.hammerOut) {
        if (this.stepHeroRest(fighter)) continue
        // Original wandering: 1.5-second headings, every third leg a rest, at 40% speed.
        const leg = Math.floor((this.tick + fighter.id * 37) / 90)
        if (fighter.species === 'ant-tank' && fighter.antHome && !fighter.zombie) {
          const angle = fighter.id * 2.4, radius = fighterDef(fighter.antHome).radius + 36
          const dx = fighter.antHome.x + Math.cos(angle) * radius - fighter.x
          const dy = fighter.antHome.y + Math.sin(angle) * radius - fighter.y, distance = Math.hypot(dx, dy)
          if (distance > 8) { speedX = dx / distance * def.speed; speedY = dy / distance * def.speed }
        } else if ((leg + fighter.id) % 3) {
          const angle = Math.sin(fighter.id * 12.9898 + leg * 78.233) * 43758.5453
          speedX = Math.cos(angle) * def.speed * 0.4
          speedY = Math.sin(angle) * def.speed * 0.4
          if (Math.abs(speedX) > 2) fighter.facing = speedX > 0 ? 1 : -1
        }
      }
      this.move(fighter, speedX, speedY)
    }

    this.buildFighterGrid()
    for (const fighter of this.fighters) {
      if (fighter.hp <= 0 || !grounded(fighter)) continue
      for (const other of this.nearbyFighters(fighter.x, fighter.y, fighterDef(fighter).radius + this.gridRadius + 32)) {
        if (other.id <= fighter.id || other.hp <= 0 || !grounded(other)) continue
        // Builders and carriers can cross their own doorway.
        if (fighter.buildFor === other || other.buildFor === fighter
          || fighter.antHome === other || other.antHome === fighter
          || fighter.haulFor?.haul?.home === other || other.haulFor?.haul?.home === fighter) continue
        if (fighter.nest || other.nest) continue
        // The summoned army moves as one formation while gathering and ramming.
        if (fighter.spartanFormation?.charge || other.spartanFormation?.charge) continue
        const dx = other.x - fighter.x, dy = other.y - fighter.y
        const distance = Math.hypot(dx, dy), radius = fighterDef(fighter).radius + fighterDef(other).radius
        if (distance >= radius) continue
        const nx = distance > 0.001 ? dx / distance : 1
        const ny = distance > 0.001 ? dy / distance : 0
        const overlap = radius - distance
        if (!building(fighter)) {
          const push = building(other) ? overlap : overlap / 2
          fighter.x -= nx * push; fighter.y -= ny * push
        }
        if (!building(other)) {
          const push = building(fighter) ? overlap : overlap / 2
          other.x += nx * push; other.y += ny * push
        }
      }
    }
    for (const fighter of this.fighters) {
      const target = fighter.grab?.target
      if (fighter.hp > 0 && target && target.hp > 0) {
        target.x = fighter.x + fighter.facing * fighterDef(fighter).radius
        target.y = fighter.y
      }
    }
    this.stepLightningWaves()
    this.stepHammers()
    this.stepShuriken()
    this.stepGiantSwords()
    this.stepFishThrows()
    this.stepLightning()
    this.moveBodies()
    for (const splat of this.splats) splat.life -= DT
    for (const splat of this.splats) if (splat.life <= 0 && splat.haul) this.dropBody(splat)
    this.splats = this.splats.filter((splat) => splat.life > 0)
    for (const fighter of this.fighters) this.clamp(fighter)
    this.stepDragonDomains()
    for (const duel of this.mantisDuels) this.constrainMantisDuel(duel)
    for (const fighter of this.fighters) {
      if (fighter.hp <= 0 && spartanCommanderProtected(fighter)) fighter.hp = 1
      const def = fighterDef(fighter)
      if (fighter.hp <= 0) {
        fighter.saintRest = null
        leaveSpartanFormation(fighter)
        this.removeMantisFromDuel(fighter)
        this.cancelDragonDomain(fighter)
        fighter.rexBloodlust = false
        fighter.rexBloodlustCall = fighter.rexReinforcements = 0
        fighter.rexStomp = 0
        fighter.bleed = 0
        fighter.bleedOwner = null
        if (fighter.nest) this.destroyDragonNest(fighter)
        if (fighter.species === 'dragon') this.detachDragon(fighter)
        if (fighter.colony) this.releaseColony(fighter)
        this.releaseAntWorker(fighter)
        if (fighter.haulFor) this.dropBody(fighter.haulFor)
        fighter.infection = null
        fighter.feeding = null
        fighter.iceDive = null
        fighter.phoenixDive = null
        fighter.phoenixDiveCooldown = PHOENIX_DIVE.opening
        fighter.lightningSword = null
        fighter.frozen = 0
        fighter.shock = 0
        fighter.spartanMark = null
        this.cancelMantisDodge(fighter)
        this.cancelMantisLeap(fighter)
        this.revealMantis(fighter)
        fighter.mantisPrey = null
        fighter.mantisMoon = null
        fighter.burnOwner = null
        this.setVampireBat(fighter, false)
        this.leaveTower(fighter)
        fighter.dash = null
        fighter.ambush = null
        this.leaveNinjaTree(fighter)
        this.releaseGrab(fighter)
        if (fighter.heldBy) this.releaseGrab(fighter.heldBy)
        fighter.thrown = null
        fighter.roar = 0
        fighter.song = 0
        fighter.lure = null
        const eater = fighter.mealFor
        const meal = eater && eater.hp > 0 && !eater.zombie ? { owner: eater, victim: fighter } : undefined
        const rebirth = !fighter.zombie && fighter.species === 'phoenix' && fighter.stage === 'adult'
        const body = !building(fighter) && !rebirth && !fighter.mantisEaten && (meal || (
          this.splats.filter((splat) => splat.body).length < 4000
          && this.fighters.some((ant) => ant.hp > 0 && !ant.zombie && ant.species === 'ant' && !allies(ant, fighter))))
          ? fighter : undefined
        this.splats.push({ x: fighter.x, y: fighter.y + def.radius,
          life: meal ? DRAGON_FEED.corpseLife : body ? Infinity : 5, color: def.color, size: def.size, meal, body })
        fighter.mealFor = null
        if (!fighter.zombie && fighter.species === 'phoenix' && fighter.stage === 'adult') {
          fighter.stage = 'egg'
          fighter.elevation = 0
          fighter.falling = false
          fighter.stageTime = PHOENIX_REBIRTH.egg
          fighter.hp = 1
          fighter.vx = fighter.vy = fighter.burn = fighter.attack = fighter.fear = fighter.stun = fighter.dizzy = 0
          fighter.frozen = fighter.chill = 0
          fighter.cooldown = fighter.skillCooldown = 0
          fighter.target = fighter.scaredBy = null
          fighter.charge = fighter.lightning = null
          fighter.hit = 1
        }
      }
    }
    this.fighters = this.fighters.filter((fighter) => fighter.hp > 0)
    for (const fighter of this.fighters) {
      if (fighter.spartanMark && (fighter.spartanMark.hp <= 0 || allies(fighter, fighter.spartanMark))) fighter.spartanMark = null
    }
    this.hammers = this.hammers.filter((hammer) => hammer.owner.hp > 0)
    this.shuriken = this.shuriken.filter((star) => star.owner.hp > 0)
    this.giantSwords = this.giantSwords.filter((sword) => sword.owner.hp > 0)
    this.shots = this.shots.filter((shot) => shot.owner.hp > 0)
    this.storms = this.storms.filter((area) => area.phase === 'impact' || area.owner.hp > 0)
  }
}

export function renderBattle(c: CanvasRenderingContext2D, battle: Battle, sprites: Sprites, dpr: number) {
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)
  let screenShake = 0
  for (const group of battle.spartanFormations) {
    const charge = group.charge
    if (charge?.phase === 'windup') screenShake = Math.max(screenShake, (1 - charge.time / SPARTAN_CHARGE.windup) * 2)
    else if (charge?.phase === 'dash') screenShake = Math.max(screenShake, 3.5)
    else if (charge?.phase === 'recover') screenShake = Math.max(screenShake, charge.time / SPARTAN_CHARGE.recover * 2)
  }
  for (const fighter of battle.fighters) {
    if (fighter.species === 'thor' && fighter.saintRest?.kind === 'meditate' && canMeditate(fighter)) {
      screenShake = Math.max(screenShake, 0.4 + fighter.saintRest.time / THOR_REST.windup * 2.4)
    }
  }
  for (const shot of battle.shots) {
    if (shot.healing) screenShake = Math.max(screenShake, shot.life / THOR_SKILLS.shot.duration * 4)
  }
  const screenX = Math.sin(battle.tick * 2.7) * screenShake
  const screenY = Math.cos(battle.tick * 2.1) * screenShake * 0.6
  drawWater(c, battle.water, battle.tick, dpr, screenX, screenY)
  c.setTransform(dpr, 0, 0, dpr, screenX * dpr, screenY * dpr)
  // Ground-level nests render below remains, creatures and battle effects.
  for (const home of battle.fighters) {
    if (!home.nest || home.hp <= 0) continue
    const built = home.nest.time / DRAGON_NEST.build
    c.save()
    c.translate(home.x, home.y + DRAGON_NEST.radius)
    c.scale(DRAGON_NEST.size, DRAGON_NEST.size * (0.18 + built * 0.82))
    c.drawImage(sprites['dragon-nest'][home.team].ready, -24, -44, 48, 48)
    c.restore()
    if (built < 1 || home.hp < DRAGON_NEST.hp) {
      c.save()
      c.fillStyle = '#ded6c9'
      c.fillRect(home.x - 36, home.y + DRAGON_NEST.radius + 8, 72, 4)
      c.fillStyle = home.team === 'ffa' ? '#e5c36b' : TEAM_COLORS[home.team]
      c.fillRect(home.x - 36, home.y + DRAGON_NEST.radius + 8,
        72 * (built < 1 ? built : Math.max(0, home.hp / DRAGON_NEST.hp)), 4)
      c.restore()
    }
  }

  for (const domain of battle.dragonDomains) {
    drawDragonDomain(c, domain.x, domain.y, domain.radius, battle.tick / 60, domain.sealed, DOMAIN_END - domain.time)
  }
  for (const crater of battle.craters) drawCrater(c, crater.x, crater.y, crater.life / SWORD_SAINT_GIANT.crater)
  for (const splat of battle.splats) {
    const delivery = splat.haul?.entry ?? 0
    if (splat.haul) {
      c.strokeStyle = '#ad5640'
      c.lineWidth = 1
      c.globalAlpha = 0.45 * (1 - delivery)
      c.beginPath()
      for (const ant of splat.haul.crew) {
        if (ant.hp <= 0 || ant.haulFor !== splat) continue
        c.moveTo(ant.x, ant.y - 3)
        c.lineTo(splat.x, splat.y)
      }
      c.stroke()
    }
    c.fillStyle = splat.color
    c.globalAlpha = Math.min(1, splat.life / 2) * 0.5 * (1 - delivery)
    c.beginPath()
    c.ellipse(splat.x, splat.y, 10 * splat.size * (1 - delivery), 5 * splat.size * (1 - delivery), 0, 0, Math.PI * 2)
    c.fill()
    const victim = splat.body ?? splat.meal?.victim
    if (victim && splat.life > 0) {
      const owner = splat.meal?.owner
      const eating = owner?.feeding?.body === splat ? owner.feeding.time / DRAGON_FEED.bite : 0
      const poses = sprites[victim.species][victim.team]
      const dragon = poses.dragon?.[victim.dragonForm]
      const alpha = victim.rexKills >= TREX_BLACK.kills ? poses.rexBlack
        : victim.rexMeals >= TREX_ALPHA.meals ? poses.rexAlpha : undefined
      const phoenix = victim.stage === 'adult' || victim.stage === 'reborn' ? poses.phoenix?.forms[victim.phoenixForm] : undefined
      const knife = footPoses(poses, victim)
      const mantis = poses.mantis?.[victim.mantisForm]
      const sprite = victim.zombie ? mantis?.zombie ?? knife?.zombie ?? alpha?.zombie ?? dragon?.zombie ?? phoenix?.zombie ?? (victim.stage === 'chick' ? poses.zombie.chick! : poses.zombie.ready)
        : mantis?.ready ?? knife?.ready ?? alpha?.ready ?? dragon?.ready ?? phoenix?.ready ?? (victim.stage === 'chick' ? poses.phoenix!.chick : poses.ready)
      c.save()
      c.globalAlpha = Math.min(1, splat.life / 2) * 0.65 * (1 - delivery)
      c.translate(splat.x, splat.y - 4 - eating * 18)
      c.rotate(Math.PI / 2 + eating * 0.4)
      const size = splat.size * 0.55 * (1 - eating * 0.9) * (1 - delivery)
      c.scale(size, size)
      c.drawImage(sprite, -24, -24, 48, 48)
      c.restore()
    }
  }
  c.globalAlpha = 1

  for (const ring of battle.iceRings) {
    drawIceRing(c, ring.x, ring.y, ring.radius, 1 - ring.life / DRAGON_ICE_DIVE.effect)
  }
  for (const fighter of battle.fighters) {
    const star = fighter.mei?.kind === 'star' ? fighter.mei : null
    if (star?.from) drawMeiStar(c, star.from.x, star.from.y, star.x, star.y, MEI_STAR.strokes * MEI_STAR.dash + MEI_STAR.flight - star.time)
  }
  for (const mine of battle.mines) {
    drawTalismanMine(c, mine.x, mine.y, battle.tick, mine.life <= MEI_MINE.life - MEI_MINE.arm)
  }
  for (const fire of battle.phoenixFires) {
    drawPhoenixFire(c, fire.x, fire.y, fire.radius, fire.life, battle.tick / 60 + fire.owner.id)
  }
  for (const ball of battle.phoenixFireballs) {
    const t = Math.min(1, ball.time / PHOENIX_BARRAGE.flight)
    c.save()
    c.strokeStyle = '#dc873e'
    c.fillStyle = 'rgba(239,125,52,.05)'
    c.lineWidth = 0.8
    c.setLineDash([3, 5])
    c.beginPath(); c.arc(ball.x, ball.y, PHOENIX_BARRAGE.radius, 0, Math.PI * 2); c.fill(); c.stroke()
    c.setLineDash([])
    for (let k = 3; k >= 0; k--) {
      const p = Math.max(0, t - k * 0.055)
      const x = ball.fromX + (ball.x - ball.fromX) * p
      const height = ball.height * (1 - p) + Math.sin(p * Math.PI) * 90
      const y = ball.fromY + (ball.y - ball.fromY) * p - height
      c.globalAlpha = 1 - k * 0.22
      drawFlame(c, x, y, 1.3 - k * 0.2)
      if (k === 0) {
        c.fillStyle = '#fff1a8'
        c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill()
      }
    }
    c.restore()
  }
  for (const ring of battle.rings) {
    const owner = ring.owner
    if (owner.hp <= 0 || owner.zombie || owner.stage === 'egg' || owner.stage === 'chick') continue
    drawPhoenixHealing(c, owner.x, owner.y + fighterDef(owner).radius, PHOENIX_FIRE.radius, ring.life, owner.id * 0.17)
  }

  for (const area of battle.storms) {
    c.save()
    c.translate(0, -area.elevation)
    const warning = area.phase === 'warning'
    const progress = warning ? 1 - area.time / THOR_SKILLS.storm.warning : 1
    c.strokeStyle = '#3e9de8'
    c.fillStyle = '#67cfff'
    c.globalAlpha = warning ? 0.05 : area.time / 0.3 * 0.15
    c.beginPath()
    c.arc(area.x, area.y, THOR_SKILLS.storm.radius, 0, Math.PI * 2)
    c.fill()
    c.globalAlpha = warning ? 0.75 : area.time / 0.3
    c.lineWidth = 1.5
    c.setLineDash(warning ? [5, 5] : [])
    c.lineDashOffset = -battle.tick * 0.4
    c.stroke()
    if (warning) {
      c.setLineDash([])
      c.lineWidth = 3
      c.beginPath()
      c.arc(area.x, area.y, THOR_SKILLS.storm.radius - 4, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
      c.stroke()
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(area.x - 5, area.y); c.lineTo(area.x + 5, area.y)
      c.moveTo(area.x, area.y - 5); c.lineTo(area.x, area.y + 5)
      c.stroke()
    }
    c.restore()
  }
  for (const impact of battle.impacts) {
    if (impact.inferno) {
      drawDragonDomainCollapse(c, impact.x, impact.y, impact.radius, Math.max(0, 1 - impact.life / 0.8))
      continue
    }
    if (impact.claw) {
      drawFoxClaw(c, impact.x, impact.y, impact.claw, 1 - impact.life / MEI_CLAW.show)
      continue
    }
    if (impact.fox) {
      drawFoxBlast(c, impact.x, impact.y, impact.radius, 1 - impact.life / MEI_FOX.blast)
      continue
    }
    if (impact.smoke) {
      drawMeiSmoke(c, impact.x, impact.y, impact.radius, 1 - impact.life / MEI_ESCAPE.smoke)
      continue
    }
    c.save()
    const fade = impact.life / 0.4, radius = impact.radius * (1 - fade * 0.8)
    c.globalAlpha = fade * 0.65
    c.strokeStyle = impact.color ?? '#3e9de8'
    c.lineWidth = 1.5
    c.beginPath()
    c.arc(impact.x, impact.y, radius, 0, Math.PI * 2)
    for (let k = 0; k < 6; k++) {
      const angle = k * Math.PI / 3
      c.moveTo(impact.x + Math.cos(angle) * 6, impact.y + Math.sin(angle) * 6)
      c.lineTo(impact.x + Math.cos(angle + 0.12) * radius * 0.65, impact.y + Math.sin(angle + 0.12) * radius * 0.65)
      c.lineTo(impact.x + Math.cos(angle) * radius, impact.y + Math.sin(angle) * radius)
    }
    c.stroke()
    c.restore()
  }

  for (const duel of battle.mantisDuels) drawMantisDuel(c, duel)
  for (const molt of battle.mantisMolts) {
    const shed = sprites.mantis[molt.team].mantis?.[molt.form].shed
    if (shed) drawMantisMolt(c, molt, shed)
  }
  for (const slash of battle.mantisMoonSlashes) drawMantisMoonSlash(c, slash)
  for (const group of battle.spartanFormations) drawSpartanFormation(c, group)
  for (const fighter of battle.fighters) {
    if (fighter.nest || (fighter.heldBy && fighter.heldBy.rexRam?.target !== fighter && fighter.heldBy.antFlight?.passenger !== fighter)
      || (fighter.inside && fighter.entry >= 1) || meiVanished(fighter)) continue
    const def = fighterDef(fighter)
    const poses = sprites[fighter.species][fighter.team]
    const mantis = poses.mantis?.[fighter.mantisForm]
    if (fighter.colony) {
      const colony = fighter.colony, built = colony.time / COLONY_BUILD
      c.save()
      c.translate(fighter.x, fighter.y + def.radius)
      c.scale(def.size, def.size * (colony.level > 0 ? 1 : 0.18 + built * 0.82))
      c.drawImage(poses.colony?.[Math.max(0, colony.level - 1)] ?? poses.ready, -24, -44, 48, 48)
      c.restore()
      c.save()
      c.font = '9px system-ui'
      c.textAlign = 'center'
      c.fillStyle = '#77717a'
      const reserve = battle.fighters.filter((ant) => ant.hp > 0 && ant.inside === fighter && antSoldier(ant)).length
      c.fillText(`Lv ${Math.max(1, colony.level)} · ${reserve} inside${colony.recruits ? ` · +${colony.recruits} recruits` : ''}`, fighter.x, fighter.y + def.radius + 12)
      c.restore()
      if (built < 1 || fighter.hp < def.hp) {
        c.save()
        const y = fighter.y - def.radius * 1.8
        c.lineWidth = 2
        c.strokeStyle = '#ded6c9'
        c.beginPath(); c.moveTo(fighter.x - 14, y); c.lineTo(fighter.x + 14, y); c.stroke()
        c.strokeStyle = fighter.team === 'ffa' ? ANT.color : TEAM_COLORS[fighter.team]
        c.beginPath(); c.moveTo(fighter.x - 14, y)
        c.lineTo(fighter.x - 14 + 28 * (built < 1 ? built : fighter.hp / def.hp), y); c.stroke()
        if (built < 1) {
          c.font = '10px system-ui'
          c.textAlign = 'center'
          c.fillStyle = '#77717a'
          c.fillText(`${colony.workers}/${colony.need}`, fighter.x, y - 5)
        }
        c.restore()
      }
      if ((built < 1 && colony.workers > 0) || fighter.attack > 0) {
        c.save()
        c.fillStyle = ANTHILL.color
        for (let k = 0; k < 3; k++) {
          const u = (battle.tick * 0.04 + k / 3 + fighter.id * 0.17) % 1
          c.globalAlpha = 1 - u
          c.beginPath()
          c.arc(fighter.x + 4 + u * (6 + k * 3), fighter.y + 9 - Math.sin(u * Math.PI) * (5 + k), 1.2, 0, Math.PI * 2)
          c.fill()
        }
        c.restore()
      }
      continue
    }
    const dragon = poses.dragon?.[fighter.dragonForm]
    const knife = footPoses(poses, fighter)
    const commanderPoses = fighter.spartanCommander && !fighter.zombie ? poses.spartan?.commander : undefined
    const spartanPoses = commanderPoses ?? poses.spartan
    if (commanderPoses) {
      c.save()
      c.font = 'bold 9px system-ui'; c.textAlign = 'center'; c.fillStyle = '#a77b32'
      c.fillText(spartanCommanderProtected(fighter) ? 'COMMANDER · PROTECTED' : 'COMMANDER',
        fighter.x, Math.max(12, fighter.y - def.size * 35 - fighter.elevation))
      c.restore()
    }
    if (fighter.species === 'ant-tank' && !fighter.zombie && fighter.skillCooldown > ANT_PROVOKE.cooldown - 0.65) {
      c.save()
      c.strokeStyle = '#d49c35'
      c.lineWidth = 2
      for (let k = 0; k < 5; k++) {
        const angle = Math.PI + k * Math.PI / 4
        c.beginPath()
        c.moveTo(fighter.x + Math.cos(angle) * 22, fighter.y - 14 + Math.sin(angle) * 22)
        c.lineTo(fighter.x + Math.cos(angle) * 29, fighter.y - 14 + Math.sin(angle) * 29)
        c.stroke()
      }
      c.font = 'bold 10px system-ui'; c.textAlign = 'center'; c.fillStyle = '#a56c24'
      c.fillText('PROVOKE!', fighter.x, fighter.y - 44)
      c.restore()
    }
    const phoenix = fighter.stage === 'adult' || fighter.stage === 'reborn' ? poses.phoenix?.forms[fighter.phoenixForm] : undefined
    const flyingFrames = phoenix?.flyingFrames ?? dragon?.flyingFrames ?? poses.flyingFrames
    const shockedFrames = phoenix?.shockedFlyingFrames ?? dragon?.shockedFlyingFrames ?? poses.shockedFlyingFrames
    const climbing = fighter.tower && fighter.elevation < TOWER_ROOF + def.radius
    const moving = fighter.stage === 'egg' ? 0 : climbing ? 1 : Math.min(1, Math.hypot(fighter.vx, fighter.vy) / 25)
    const isThor = !fighter.zombie && fighter.species === 'thor'
    const saintFan = fighter.species === 'swordsaint' && !fighter.zombie && !fighter.heldBy && !fighter.inside
    const swordRider = fighter.species === 'swordsaint' && !fighter.heldBy && !fighter.inside
      && (!fighter.saint || fighter.saint.phase === 'mount')
    const saintFlip = fighter.saint && fighter.saint.phase !== 'melee' ? fighter.saint : null
    const saintJab = fighter.saint?.phase === 'melee' ? fighter.attack : 0
    const rest = !fighter.zombie && !fighter.saint && (fighter.saintRest?.kind !== 'meditate' || canMeditate(fighter)) ? fighter.saintRest : null
    const meditating = rest?.kind === 'meditate'
    const meiFox = poses.mei && fighter.meiForm > 0 && !fighter.zombie ? poses.mei.fox : undefined, meiPoses = meiFox ?? poses.mei
    const thorMeditating = isThor && meditating
    const fishing = rest?.kind === 'fish' && Math.hypot(rest.x - fighter.x, rest.y - fighter.y) < 12
    const countering = fighter.species === 'swordsaint' && !fighter.zombie && !fighter.saint && fighter.casting > 0
    const evolvedRex = fighter.rexKills >= TREX_BLACK.kills ? poses.rexBlack
      : fighter.rexMeals >= TREX_ALPHA.meals ? poses.rexAlpha : undefined
    const rex = fighter.zombie ? undefined : evolvedRex?.parts ?? poses.rex
    const rexBody = fighter.rexStomp > 0 ? rex?.stompingBody : rex?.body
    const breath = battle.flames.find((flame) => flame.owner === fighter)
    const singing = !fighter.zombie && fighter.species === 'siren' && fighter.cooldown > -0.3 && fighter.stun <= 0
      && fighter.fear <= 0 && !fighter.lure && grounded(fighter)
    const roaring = fighter.roar > 0
    const bloodlust = bloodlustActive(fighter)
    const callingHelp = fighter.rexBloodlustCall > 0
    const lightningCharge = fighter.lightning !== null
    const charging = fighter.charge?.phase === 'windup'
    const stompCharge = fighter.rexStomp > 0 ? 1 - fighter.rexStomp / TREX_STOMP.charge : 0
    const ramCharge = fighter.rexRam?.phase === 'windup' ? 1 - fighter.rexRam.time / TREX_RAM.windup : 0
    const spartanCharge = fighter.spartanFormation?.charge
    const chargePower = thorMeditating ? rest.time / THOR_REST.windup
      : lightningCharge ? 1 - fighter.lightning!.time / THOR_SKILLS.shot.windup
      : charging ? 1 - fighter.charge!.time / THOR_SKILLS.charge.windup : 0
    const shake = spartanCharge?.phase === 'windup' ? 0.5 + (1 - spartanCharge.time / SPARTAN_CHARGE.windup) * 2
      : fighter.grab ? 1.8 : roaring ? 0.8 : fighter.rexStomp > 0 ? 0.4 + stompCharge
      : fighter.rexRam?.phase === 'windup' ? 0.3 + ramCharge
      : lightningCharge || charging ? 0.5 + chargePower * 2.5 : 0
    const shakeX = Math.sin(battle.tick * 2.7 + fighter.id) * shake
    const shakeY = Math.cos(battle.tick * 2.1 + fighter.id) * shake * 0.45
    const flying = fighter.charge?.phase === 'flight'
    const dashing = fighter.dash !== null || fighter.ambush?.phase === 'slash'
    // Mei's flip: 0 → 1 up to the top, where he is upside down and vanishes.
    // Mei's transformation: elapsed seconds, and his lift (0 → 1) as he rises, hangs and slams down.
    const T = MEI_TRANSFORM, transform = fighter.mei?.kind === 'transform' ? T.rise + T.hover + T.slam - fighter.mei.time : null
    const meiRise = transform === null ? 0 : transform < T.rise ? Math.sin(transform / T.rise * Math.PI / 2)
      : Math.min(1, Math.max(0, 1 - (transform - T.rise - T.hover) / T.slam))
    const meiFlip = fighter.mei?.kind === 'flip' ? Math.min(1, (MEI_ESCAPE.flip + MEI_ESCAPE.vanish - fighter.mei.time) / MEI_ESCAPE.flip) : null
    const backflipping = fighter.ambush?.phase === 'return' || saintFlip !== null || meiFlip !== null
    const flipProgress = saintFlip ? 1 - Math.max(0, saintFlip.time) / (saintFlip.phase === 'flip' ? SWORD_SAINT_MELEE.flip : SWORD_SAINT_MELEE.mount)
      : meiFlip !== null ? meiFlip * 0.5
      : backflipping ? 1 - fighter.ambush!.time / NINJA_AMBUSH.returnTime : 0
    const hovering = fighter.bat || (!fighter.tower && !fighter.tree && !fighter.falling && fighter.elevation > 0)
    const antFlapping = fighter.species === 'ant-fly' && !fighter.inside && !fighter.heldBy && !fighter.thrown
      && !fighter.falling && fighter.stun <= 0 && fighter.frozen <= 0
      && (moving > 0.1 || hovering || fighter.antFlight !== null || fighter.antDeployed)
    const flapRate = fighter.species === 'ant-fly' ? 1 : fighter.phoenixDive ? 0.85 : fighter.iceDive ? 0.65 : fighter.species === 'vampire' ? 0.9 : fighter.species === 'dragon' ? 0.32 : fighter.species === 'phoenix' ? 0.48 : 0.64
    const flightFrame = (fighter.species === 'vampire' ? fighter.bat : fighter.species === 'ant-fly' ? antFlapping : flying || hovering) && canFly(fighter) && flyingFrames
      ? Math.floor(battle.tick * flapRate + fighter.id * 1.7) % flyingFrames.length : null
    const thrown = fighter.thrown
    const progress = flying ? 1 - fighter.charge!.time / (isThor ? THOR_SKILLS.charge.flight : GOOSE_SWOOP.flight) : 0
    const faceHeight = flying && !isThor ? Math.max(0, (UNITS[fighter.charge!.target.species].size - 1) * 31) : 0
    const throwProgress = thrown ? 1 - thrown.time / (thrown.smash?.duration ?? TREX_GRAB.distance / TREX_GRAB.speed) : 0
    const altitude = fighter.elevation + (thrown ? Math.sin(throwProgress * Math.PI) * (thrown.smash ? TREX_THROW.height : 44)
      : flying ? Math.sin(progress * Math.PI) * (isThor ? 42 : 28) + faceHeight * progress : 0)
      + (saintFlip ? Math.sin(flipProgress * Math.PI) * SWORD_SAINT_MELEE.flipHeight : 0)
      + (meiFlip !== null ? Math.sin(meiFlip * Math.PI / 2) * MEI_ESCAPE.height : 0)
      + meiRise * T.height
      + (swordRider ? SWORD_SAINT_SWORDS.hover + Math.sin(battle.tick * 0.08 + fighter.id) * 2.5 : 0)
    const bob = Math.abs(Math.sin(fighter.phase)) * (fighter.zombie ? 3.5 : isThor ? 1.5 : 2.5) * moving
    const attackLean = fighter.mantisLeap ? 0.22 : fighter.mantisDodge ? -0.18
      : spartanCharge?.phase === 'dash' ? 0.3 : spartanCharge?.phase === 'windup' ? -0.12
      : fighter.mantisDuel?.state === 'hop' && fighter.mantisDuel.carrier === fighter ? 0.2
      : fighter.mantisDuel?.state === 'bow' && fighter.mantisDuel.challenger === fighter ? 0.32
      : fighter.haulFor ? -0.16 + Math.sin(fighter.phase) * 0.06
      : fighter.rexStomp > 0 ? -0.1 - stompCharge * 0.08
      : fighter.rexRam ? fighter.rexRam.phase === 'windup' ? 0.1 : 0.28
      : fighter.feeding && fighter.feeding.time > 0 ? 0.3 + Math.sin(fighter.feeding.time * 24) * 0.04
      : fighter.lightningSword
      ? -0.16 + Math.min(1, Math.max(0, (fighter.lightningSword.time - DRAGON_LIGHTNING_SWORD.windup) / DRAGON_LIGHTNING_SWORD.slash)) * 0.42
      : fighter.phoenixDive ? fighter.phoenixDive.kind === 'encore' ? 0.12
        : fighter.phoenixDive.kind === 'barrage' ? -0.22
        : fighter.phoenixDive.time < PHOENIX_DIVE.rise + PHOENIX_DIVE.hover ? -0.28 : 0.85
      : fighter.iceDive ? fighter.iceDive.time < DRAGON_ICE_DIVE.rise + DRAGON_ICE_DIVE.hover ? -0.2 : 0.5
      : dashing ? 0.35 : flying ? isThor ? 0.8 : -0.15 + Math.sin(battle.tick * 0.9) * 0.12 : charging || lightningCharge ? -0.18
      : roaring ? -0.12 : singing ? Math.sin(battle.tick * (fighter.song > 0 ? 0.9 : 0.08)) * (fighter.song > 0 ? 0.2 : 0.06)
        : isThor ? -fighter.attack * 0.12 + fighter.catching * 0.08 + fighter.slam * 0.25
          : breath ? -0.06 + Math.sin(battle.tick * 0.7 + fighter.id) * 0.025 : fighter.cavalryMounted ? 0 : fighter.attack * 0.45
    const rotation = (Math.sin(fighter.phase) * (fighter.zombie ? 0.16 : isThor ? 0.06 : 0.1) * moving
      + (fighter.zombie ? 0.09 + fighter.attack * 0.22 : attackLean)) * fighter.facing
    const sink = (grounded(fighter) && !swordRider) || fighter.stage === 'egg' ? sinkAt(fighter.x, fighter.y) / def.size : 0
    const trail = fighter.saint?.trail
    const bombFall = meiFlip !== null ? meiFlip * MEI_ESCAPE.flip / MEI_ESCAPE.bomb : 1
    if (bombFall < 1) drawTalisman(c, fighter.x + 6 * fighter.facing, fighter.y + def.radius - (altitude + 16) * (1 - bombFall), bombFall * 6, 1)
    if (trail && trail.time > 0) drawSonicTrail(c, trail.fromX, trail.fromY - 18, trail.toX, trail.toY - 18, trail.time / SWORD_SAINT_MELEE.trail)
    if ((flying || hovering || thrown || fighter.falling || backflipping || swordRider || transform !== null || fighter.species === 'ninja') && !concealed(fighter)) {
      c.save()
      c.fillStyle = 'rgba(34,31,51,.16)'
      c.beginPath()
      c.ellipse(fighter.x, fighter.y + def.radius, 13 * def.size, 4, 0, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
    if (fighter.ambush?.phase === 'slash') {
      c.save()
      c.strokeStyle = '#96cfc3'
      c.globalAlpha = 0.45
      c.lineWidth = 3
      c.beginPath()
      c.moveTo(fighter.ambush.fromX, fighter.ambush.fromY - fighter.ambush.fromElevation - 18)
      c.lineTo(fighter.x, fighter.y - fighter.elevation - 18)
      c.stroke()
      c.restore()
    }
    if (fighter.rexStomp > 0) {
      c.save()
      c.strokeStyle = '#ac8057'
      c.globalAlpha = 0.2 + stompCharge * 0.3
      c.lineWidth = 1.2
      c.setLineDash([4, 7])
      c.beginPath()
      c.arc(fighter.x, fighter.y, TREX_STOMP.radius, 0, Math.PI * 2)
      c.stroke()
      c.restore()
    }
    const throwAim = fighter.grab?.landing ?? thrown?.smash
    if (throwAim) {
      c.save()
      c.strokeStyle = '#b67e4f'
      c.fillStyle = 'rgba(193,138,84,.04)'
      c.lineWidth = 1.2
      c.setLineDash([5, 7])
      c.beginPath(); c.arc(throwAim.x, throwAim.y, TREX_THROW.radius, 0, Math.PI * 2)
      c.fill(); c.stroke()
      c.setLineDash([])
      c.beginPath()
      c.moveTo(throwAim.x - 7, throwAim.y - 7); c.lineTo(throwAim.x + 7, throwAim.y + 7)
      c.moveTo(throwAim.x + 7, throwAim.y - 7); c.lineTo(throwAim.x - 7, throwAim.y + 7)
      c.stroke()
      c.restore()
    }
    if (fighter.phoenixDive) {
      const dive = fighter.phoenixDive
      c.save()
      c.fillStyle = 'rgba(240,119,43,.06)'
      c.strokeStyle = '#df773b'
      c.lineWidth = 1.3
      c.setLineDash([5, 7])
      c.beginPath()
      if (dive.kind === 'encore') {
        c.lineCap = 'round'
        c.lineWidth = PHOENIX_ENCORE.radius * 2
        c.strokeStyle = 'rgba(244,161,51,.09)'
        c.moveTo(dive.x, dive.y); c.lineTo(dive.endX, dive.endY); c.stroke()
        c.lineWidth = 1.5
        c.strokeStyle = '#df773b'
      } else c.arc(dive.x, dive.y, dive.kind === 'barrage' ? PHOENIX_BARRAGE.spread + PHOENIX_BARRAGE.radius : PHOENIX_DIVE.radius, 0, Math.PI * 2)
      c.fill(); c.stroke()
      c.setLineDash([])
      if (dive.kind === 'encore') {
        c.font = 'bold 12px system-ui'
        c.textAlign = 'center'
        c.fillStyle = '#c8702c'
        c.fillText('ENCORE', fighter.x, fighter.y - fighter.elevation - 65)
      }
      for (let k = 0; k < 5; k++) {
        const age = (battle.tick / 22 + k / 5) % 1
        c.globalAlpha = (1 - age) * 0.65
        drawFlame(c, fighter.x - fighter.facing * age * 16,
          fighter.y - fighter.elevation + age * 24, 0.45 + age * 0.3)
      }
      c.restore()
    }
    if (fighter.iceDive) {
      c.save()
      const radius = DRAGON_ICE_DIVE.radius * DRAGON_FORMS[fighter.dragonForm].scale / 1.2
      c.strokeStyle = '#7fcce8'
      c.fillStyle = 'rgba(155,222,248,.1)'
      c.globalAlpha = 0.4 + fighter.iceDive.time / 3
      c.lineWidth = 1.5
      c.setLineDash([5, 6])
      c.beginPath()
      c.arc(fighter.x, fighter.y, radius, 0, Math.PI * 2)
      c.fill()
      c.stroke()
      c.restore()
    }
    c.save()
    c.translate(fighter.x + fighter.attack * (isThor ? -2 : 4) * fighter.facing + shakeX, fighter.y + def.radius - bob - altitude + (charging ? 3 : 0) + shakeY)
    c.rotate(rotation)
    if (fighter.stage === 'egg' || fighter.species === 'dragon-egg' || fighter.species === 'rex-egg') c.rotate(Math.sin(battle.tick * 0.25 + fighter.id) * 0.08)
    if (thrown) c.rotate(throwProgress * Math.PI * 3 * fighter.facing)
    if (backflipping) {
      c.translate(0, -24 * def.size)
      c.rotate(-flipProgress * Math.PI * 2 * fighter.facing)
      c.translate(0, 24 * def.size)
    }
    c.scale(fighter.facing * def.size * (1 + fighter.hit * 0.22), def.size * (1 + fighter.hit * 0.22))
    if (fighter.dragonSleeping) c.scale(1, 1 + Math.sin(battle.tick * 0.035 + fighter.id) * 0.025)
    if (fighter.inside) {
      c.globalAlpha = 1 - fighter.entry
      c.scale(1 - fighter.entry, 1 - fighter.entry)
    }
    const picked = fighter.zombie ? mantis?.zombie ?? knife?.zombie ?? evolvedRex?.zombie ?? dragon?.zombie ?? phoenix?.zombie ?? (fighter.stage === 'chick' ? poses.zombie.chick! : poses.zombie.ready)
      : evolvedRex ? evolvedRex.ready
      : dragon && fighter.dragonSleeping ? dragon.sleeping
      : dragon ? breath || fighter.lightningSword || (fighter.dragonDomain && fighter.dragonDomain.time < DOMAIN_SEAL)
        || (fighter.feeding && fighter.feeding.time > 0 && Math.sin(fighter.feeding.time * 24) > 0)
        ? flightFrame !== null ? dragon.breathingFrames[flightFrame] : dragon.breathing
        : flightFrame !== null ? dragon.flyingFrames[flightFrame] : dragon.ready
      : fighter.stage === 'egg' ? poses.phoenix!.egg : fighter.stage === 'chick' ? poses.phoenix!.chick
      : phoenix ? flightFrame !== null ? phoenix.flyingFrames[flightFrame] : phoenix.ready
      : thorMeditating ? poses.meditating!
      : poses.ninja && dashing ? poses.ninja.slash
      : poses.ninja && fighter.attack > 0 ? poses.ninja.poke
      : mantis && (fighter.mantisLeap || fighter.mantisDodge || (fighter.mantisDuel?.state === 'hop' && fighter.mantisDuel.carrier === fighter)) ? mantis.hop
      : mantis && fighter.grab ? mantis.carry
      : mantis && fighter.attack > 0 ? mantis.strike
      : mantis && mantisGuard(fighter) ? mantis.guard
      : mantis ? mantis.ready
      : poses.cavalry ? knife ? fighter.attack > 0 ? knife.poke : knife.ready : poses.cavalry.frames[fighter.attack > 0 ? Math.min(3, 1 + Math.floor((1 - fighter.attack) * 3)) : 0]
        [moving < 0.15 ? CAVALRY_GALLOP_FRAMES : Math.floor(fighter.phase / (Math.PI * 2) * CAVALRY_GALLOP_FRAMES) % CAVALRY_GALLOP_FRAMES]
      : spartanPoses ? spartanCharge ? spartanCharge.phase === 'dash' ? knife?.bash ?? spartanPoses.bash : knife?.guard ?? spartanPoses.guard
        : fighter.casting > 0 ? spartanPoses.throwing
        : fighter.slam > 0 ? knife?.bash ?? spartanPoses.bash : fighter.attack > 0 ? knife?.poke ?? spartanPoses.poke
        : activeSpartanSlot(fighter) ? knife?.guard ?? spartanPoses.guard : knife?.ready ?? commanderPoses?.ready ?? poses.ready
      : poses.saint && fighter.saint && fighter.saint.phase !== 'mount' ? fighter.attack > 0 ? poses.saint.slash : poses.saint.stand
      : poses.saint && meditating ? poses.saint.meditate : poses.saint && (fishing || countering) ? poses.saint.fish
      : meiPoses && meditating ? meiPoses.meditate
      : meiPoses && fighter.attack > 0 ? fighter.meiHand ? meiPoses.throwBack : meiPoses.throwFront
      : meiFox ? meiFox.ready
      : flightFrame !== null ? flyingFrames![flightFrame]
      : (flying || hovering) && fighter.species !== 'vampire' ? poses.flying : lightningCharge ? poses.casting : charging ? poses.charging : fighter.slam > 0 ? poses.slamming
      : fighter.casting > 0 ? poses.casting : fighter.hammerOut
        ? fighter.attack > 0 ? poses.throwing : poses.empty
        : fighter.catching > 0 ? poses.catching : poses.ready
    // Standing poses step through their walk cycle while moving on the ground; one cycle per 2π of phase.
    const walking = moving > 0.15 && grounded(fighter) && fighter.stun <= 0 && fighter.frozen <= 0
    const stepAt = (pose: HTMLCanvasElement) => walking ? walkFrame(pose, fighter.phase / (Math.PI * 2)) : pose
    const sprite = stepAt(picked), body = rexBody && stepAt(rexBody)
    if (sink > 0.5) {
      c.globalAlpha = 0.28
      c.drawImage(body ?? sprite, -24, -44, 48, 48)
      c.globalAlpha = 1
      c.beginPath()
      c.rect(-48, -100, 96, 100 - sink)
      c.clip()
    }
    if (fighter.hidden) c.globalAlpha = 0.24
    else if (fighter.mantisCloak > 0) c.globalAlpha = 0.12
    if (transform !== null) drawMeditationAura(c, battle.tick, MEI_AURA)
    if (meditating) drawMeditationAura(c, battle.tick, thorMeditating ? ['#3e9de8', '#b5eaff'] : poses.mei ? MEI_AURA : undefined)
    if (saintFan) drawSwordFan(c, Math.floor(fighter.swordStack), battle.tick, fighter.id, false, saintJab)
    if (bloodlust || callingHelp) {
      drawRexBloodlust(c, battle.tick, fighter.id,
        callingHelp ? 1 - fighter.rexBloodlustCall / TREX_BLOODLUST.call : null)
    }
    // Live tails: Mei's from his lower back, a fox spirit's from its rump.
    if (meiFox) drawFoxTails(c, battle.tick, fighter.id, -9, -13, 34, moving)
    else if (fighter.species === 'mei-fox') drawFoxTails(c, battle.tick, fighter.id, -10, -15, 19, moving)
    c.drawImage(body ?? sprite, -24, -44, 48, 48)
    if (fighter.mei?.kind === 'shield') drawMeiShield(c, battle.tick, Math.min(1, fighter.mei.absorbed / 100))
    if (saintFan) drawSwordFan(c, Math.floor(fighter.swordStack), battle.tick, fighter.id, true, saintJab)
    if (fishing) {
      const time = battle.tick + fighter.id * 7, rod = fishingPose(rest!.action, rest!.time, time)
      drawFishingRod(c, rod.lift, altitude / def.size, time, rod.caught ? rest!.catch : null)
    } else if (countering) drawFishingRod(c, -0.8 + fighter.casting * 1.8, null, battle.tick, null) // the swing
    if (mantis && !fighter.zombie && fighter.evolution > 0) {
      c.save()
      const progress = 1 - fighter.evolution / MANTIS_EVOLUTION.moltTime
      c.globalAlpha = Math.sin(progress * Math.PI) * 0.8
      c.strokeStyle = '#fff4ce'; c.lineWidth = 1.2
      c.beginPath(); c.moveTo(5, -35); c.lineTo(1, -29); c.lineTo(5, -25)
      c.lineTo(0, -18); c.lineTo(2, -12); c.lineTo(-4, -5); c.stroke()
      for (let k = 0; k < 5; k++) {
        const side = k % 2 ? 1 : -1
        const x = side * (8 + progress * 18), y = -29 + k * 5 + progress * 12
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * 4, y + 2); c.stroke()
      }
      c.restore()
    }
    if (mantis && fighter.grab) {
      const captive = fighter.grab.target, captivePoses = sprites[captive.species][captive.team]
      const knife = footPoses(captivePoses, captive)
      const dragon = captivePoses.dragon?.[captive.dragonForm]
      const phoenix = captivePoses.phoenix?.forms[captive.phoenixForm]
      const mantisVictim = captivePoses.mantis?.[captive.mantisForm]
      const captiveSprite = captive.zombie ? mantisVictim?.zombie ?? knife?.zombie ?? dragon?.zombie ?? captivePoses.zombie.ready
        : mantisVictim?.ready ?? knife?.ready ?? dragon?.ready ?? phoenix?.ready ?? captivePoses.ready
      c.save()
      c.translate(17, -17)
      const scale = Math.min(1.2, fighterDef(captive).size / def.size)
      c.scale(scale, scale)
      c.rotate(-0.25)
      c.drawImage(captiveSprite, -24, -25, 48, 48)
      c.restore()
      c.strokeStyle = '#221f33'; c.lineWidth = 4
      c.beginPath(); c.moveTo(4, -21); c.lineTo(13, -15); c.stroke()
      c.strokeStyle = '#8eb858'; c.lineWidth = 2.2; c.stroke()
      c.strokeStyle = '#221f33'; c.lineWidth = 1.1; c.fillStyle = '#a9ca68'
      c.beginPath(); c.moveTo(11.5, -16); c.lineTo(18.5, -24); c.lineTo(20, -23)
      c.lineTo(16, -18); c.lineTo(21.5, -22); c.lineTo(14.5, -14); c.closePath(); c.fill(); c.stroke()
      c.strokeStyle = '#e9edb4'; c.lineWidth = 1
      c.beginPath(); c.moveTo(12, -16); c.lineTo(19, -23); c.lineTo(16, -18); c.stroke()
    }
    if (phoenix && !fighter.zombie && fighter.phoenixForm === 2) {
      drawPhoenixGlitter(c, sprite, battle.tick, fighter.id)
    }
    if (fighter.bleed > 0) {
      c.save()
      c.fillStyle = '#b74756'
      for (let k = 0; k < 3; k++) {
        const fall = (battle.tick / 35 + k / 3 + fighter.id * 0.17) % 1
        const x = -6 + k * 5, y = -15 + fall * 17
        c.globalAlpha = (1 - fall) * 0.8
        c.beginPath()
        c.moveTo(x, y - 2)
        c.bezierCurveTo(x - 2, y, x - 1, y + 1.5, x, y + 1.5)
        c.bezierCurveTo(x + 1, y + 1.5, x + 2, y, x, y - 2)
        c.fill()
      }
      c.restore()
    }
    if (!fighter.zombie && evolvedRex && fighter.evolution > 0) {
      c.save()
      const progress = 1 - fighter.evolution / 0.9
      c.globalAlpha = (1 - progress) * 0.65
      c.strokeStyle = isBlackRex(fighter) ? '#8995a1' : '#e5c5c4'
      c.lineWidth = 1.2
      c.beginPath()
      c.ellipse(0, -20, 14 + progress * 10, 18 + progress * 8, 0, 0, Math.PI * 2)
      c.stroke()
      c.restore()
    }
    if (fighter.dragonSleeping) {
      c.save()
      c.strokeStyle = '#a29bab'
      c.lineWidth = 0.7
      for (let k = 0; k < 3; k++) {
        const rise = (battle.tick / 150 + k / 3 + fighter.id * 0.17) % 1
        c.globalAlpha = (1 - rise) * 0.6
        c.beginPath()
        c.arc(17 + Math.sin(rise * 5 + k) * 3, -13 - rise * 24, 1 + rise * 3, 0, Math.PI * 2)
        c.stroke()
      }
      c.restore()
    }
    if (!fighter.zombie && dragon && fighter.dragonForm < 3 && fighter.evolution > 0) {
      c.save()
      const pulse = 1 - fighter.evolution / 0.9
      c.globalAlpha = (1 - pulse) * 0.8
      c.lineWidth = 2
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = DRAGON_FORMS[fighter.dragonForm].light
        c.beginPath()
        c.ellipse(0, -20, 14 + pulse * 14 + k * 3, 19 + pulse * 8 + k * 2, 0, k * 2.1 + pulse * 3, k * 2.1 + pulse * 3 + 1.7)
        c.stroke()
      }
      c.restore()
    }
    if (!fighter.zombie && dragon && fighter.dragonForm >= 2 && (fighter.evolution > 0 || fighter.dragonForm === 3)) {
      c.save()
      const flash = Math.floor(battle.tick / 4) + fighter.id
      const golden = fighter.dragonForm === 3
      // Keep each burst stable for a few frames, then scatter it independently of the previous burst.
      const random = (salt: number) => {
        const value = Math.sin(flash * 127.1 + salt * 311.7) * 43758.5453
        return value - Math.floor(value)
      }
      c.lineJoin = 'round'
      for (let arc = 0; arc < (golden ? 4 : 2); arc++) {
        if (golden && random(arc * 20) < 0.25) continue
        c.save()
        const side = arc === 0 ? -1 : 1
        const length = 9 + random(arc * 20 + 1) * 14
        if (golden) {
          const angle = random(arc * 20 + 2) * Math.PI * 2
          c.translate(Math.cos(angle) * (20 + random(arc * 20 + 3) * 6),
            -20 + Math.sin(angle) * (22 + random(arc * 20 + 4) * 6))
          c.rotate(angle + Math.PI / 2 + (random(arc * 20 + 5) - 0.5) * 1.2)
        }
        c.beginPath()
        for (let k = 0; k <= 7; k++) {
          const x = golden ? (k / 7 - 0.5) * length : side * (17 + Math.sin(flash * 1.7 + k * 2.3) * 4)
          const y = golden ? (random(arc * 20 + k + 6) - 0.5) * 6 : -4 - k * 5
          if (k === 0) c.moveTo(x, y)
          else c.lineTo(x, y)
          if (k === 3 || k === 5) { c.lineTo(x + side * 6, y - 4); c.moveTo(x, y) }
        }
        c.strokeStyle = golden ? '#f7cd62' : '#b37aef'; c.lineWidth = 1.8
        c.globalAlpha = golden ? 0.2 + random(arc * 20 + 14) * 0.3 : 0.35; c.stroke()
        c.strokeStyle = '#fff6d0'; c.lineWidth = 0.5
        c.globalAlpha = golden ? 0.55 + random(arc * 20 + 15) * 0.45 : 0.85; c.stroke()
        c.restore()
      }
      c.restore()
    }
    if (fighter.dragonDomain && fighter.dragonDomain.time < DOMAIN_SEAL) {
      c.save()
      const calling = fighter.dragonDomain.time >= DRAGON_DOMAIN.rise
      c.strokeStyle = '#f0a34b'; c.lineWidth = 0.9
      for (let k = 0; k < 3; k++) {
        const spread = (battle.tick / 26 + k / 3) % 1
        c.globalAlpha = (1 - spread) * (calling ? 0.85 : 0.25)
        c.beginPath(); c.arc(24, -29, 5 + spread * 22, -0.8, 0.8); c.stroke()
      }
      c.restore()
    }
    if (fighter.lightningSword) {
      const sword = fighter.lightningSword
      const nx = Math.cos(sword.angle), ny = Math.sin(sword.angle)
      const angle = Math.atan2(ny * Math.cos(rotation) - nx * Math.sin(rotation),
        (nx * Math.cos(rotation) + ny * Math.sin(rotation)) * fighter.facing)
      const sweep = Math.min(1, Math.max(0, (sword.time - DRAGON_LIGHTNING_SWORD.windup) / DRAGON_LIGHTNING_SWORD.slash))
      const end = DRAGON_LIGHTNING_SWORD.windup + DRAGON_LIGHTNING_SWORD.slash
      const charge = Math.min(1, sword.time / DRAGON_LIGHTNING_SWORD.windup,
        Math.max(0, 1 - (sword.time - end) / DRAGON_LIGHTNING_SWORD.recovery))
      drawDragonSword(c, 21, -27, angle, charge, sweep, battle.tick / 60)
    }
    if (breath) {
      // Use the sprite's mouth transform, then undo its lean when aiming the jet.
      const angle = Math.atan2(breath.ny * Math.cos(rotation) - breath.nx * Math.sin(rotation),
        (breath.nx * Math.cos(rotation) + breath.ny * Math.sin(rotation)) * fighter.facing)
      const power = Math.min(1, breath.age / 0.08, breath.life / 0.12)
      const pop = 1 + fighter.hit * 0.22
      const length = (def.range + def.radius - 21 * def.size * pop) / def.size
      c.save()
      c.translate(21, fighter.species === 'dragon' ? -27 : -26)
      // The mouth follows the hit pose; the jet keeps a steady thickness and reach.
      c.scale(1 / pop, 1 / pop)
      const reach = length * Math.min(1, breath.age / 0.16)
      const time = battle.tick / 60 + fighter.id * 0.73
      if (fighter.species === 'phoenix') drawPhoenixBreath(c, 0, 0, angle, reach, time, power)
      else drawFireBreath(c, 0, 0, angle, reach, 13 + fighter.dragonForm * 1.5, time, power, breath.element)
      c.restore()
    }
    if (poses.ninja && dashing) {
      const progress = fighter.dash ? 1 - fighter.dash.time / NINJA_DASH.duration
        : 1 - fighter.ambush!.time / NINJA_AMBUSH.blinkTime
      drawKatanaSlash(c, progress)
    }
    if (rex) {
      const part = (image: HTMLCanvasElement, hinge: number[], angle: number) => {
        c.save()
        c.translate(hinge[0] - 24, hinge[1] - 44)
        c.rotate(angle)
        c.drawImage(image, -hinge[0], -hinge[1], 48, 48)
        c.restore()
      }
      part(rex.arm, REX_ARM, Math.sin(fighter.phase * 2.3) * 0.7 - 0.2)
      const target = fighter.grab?.target
      if (target) {
        c.save()
        c.translate(17, isBlackRex(fighter) ? -29 : -24)
        c.rotate((isBlackRex(fighter) ? 0.7 : 1.2) + Math.sin(battle.tick * 0.9) * 0.4)
        const size = fighterDef(target).size / def.size
        c.scale(size, size)
        const victim = sprites[target.species][target.team]
        const dragonVictim = victim.dragon?.[target.dragonForm]
        const knifeVictim = !target.spartanSpear ? victim.spartan?.knife : undefined
        const mantisVictim = victim.mantis?.[target.mantisForm]
        const alphaVictim = target.rexKills >= TREX_BLACK.kills ? victim.rexBlack
          : target.rexMeals >= TREX_ALPHA.meals ? victim.rexAlpha : undefined
        c.drawImage(target.zombie ? mantisVictim?.zombie ?? knifeVictim?.zombie ?? alphaVictim?.zombie ?? dragonVictim?.zombie ?? (target.stage === 'chick' ? victim.zombie.chick! : victim.zombie.ready)
          : mantisVictim?.ready ?? knifeVictim?.ready ?? alphaVictim?.ready ?? dragonVictim?.ready ?? (target.stage === 'chick' ? victim.phoenix!.chick : target.hammerOut ? victim.empty : victim.ready), -24, -26, 48, 48)
        c.restore()
      }
      part(rex.jaw, REX_JAW, target ? 0.3 : roaring ? 0.95 + Math.sin(battle.tick * 0.8) * 0.08
        : fighter.feeding && fighter.feeding.time > 0 ? 0.25 + Math.sin(fighter.feeding.time * 24) * 0.18
        : 0.06 + fighter.attack * 0.7)
    }
    if (singing) drawSirenSong(c, battle.tick, fighter.id, fighter.song > 0)
    if (fighter.rexStomp > 0 || fighter.rexRam?.phase === 'dash') {
      c.save()
      c.fillStyle = '#b99870'
      c.strokeStyle = '#8c6b4c'
      c.lineWidth = 0.5
      for (let k = 0; k < 4; k++) {
        const age = (battle.tick / 24 + k / 4 + fighter.id * 0.17) % 1
        c.globalAlpha = (1 - age) * 0.55
        c.beginPath()
        c.ellipse(-7 - age * 14, -1 - Math.sin(age * Math.PI) * 5, 1 + age * 2, 0.7 + age, 0, 0, Math.PI * 2)
        c.fill(); c.stroke()
      }
      c.restore()
    }
    if (!fighter.zombie && (dragon || rex) && fighter.catching > 0) {
      c.save()
      c.globalAlpha = fighter.catching
      c.strokeStyle = '#58a366'
      c.lineWidth = 2
      const rise = (1 - fighter.catching) * 12
      for (let k = 0; k < 2; k++) {
        const x = 4 + k * 9, y = -35 - rise - k * 4
        c.beginPath()
        c.moveTo(x - 2.5, y); c.lineTo(x + 2.5, y)
        c.moveTo(x, y - 2.5); c.lineTo(x, y + 2.5)
        c.stroke()
      }
      c.restore()
    }
    if (!fighter.zombie && fighter.species === 'vampire' && fighter.catching > 0) {
      c.save()
      c.fillStyle = '#bb3551'
      c.globalAlpha = fighter.catching
      const rise = (1 - fighter.catching) * 14
      for (let k = 0; k < 3; k++) {
        const x = 7 + k * 5, y = -20 - rise - k * 3
        c.beginPath()
        c.moveTo(x, y - 4)
        c.bezierCurveTo(x - 4, y, x - 2, y + 3, x, y + 3)
        c.bezierCurveTo(x + 2, y + 3, x + 4, y, x, y - 4)
        c.fill()
      }
      c.restore()
    }
    if (fighter.lure) drawCharmHeart(c, battle.tick, fighter.id)
    if (roaring) {
      const progress = 1 - fighter.roar / (callingHelp ? TREX_BLOODLUST.call : TREX_ROAR.duration)
      c.strokeStyle = callingHelp ? '#bd4556' : '#b87840'
      c.lineWidth = callingHelp ? 1.8 : 1.5
      c.globalAlpha = Math.sin(progress * Math.PI) * 0.85
      for (let k = 0; k < 3; k++) {
        c.beginPath()
        c.arc(20, -26, 8 + k * 7 + progress * 12, -0.85, 0.85)
        c.stroke()
      }
      c.globalAlpha = 1
    }
    if (charging || lightningCharge || thorMeditating || fighter.casting > 0) {
      const sparkX = thorMeditating ? 14 : 8, sparkY = thorMeditating ? -40 : -38
      c.strokeStyle = '#3e9de8'
      c.lineWidth = 1 + chargePower * 0.6
      c.beginPath()
      for (let k = 0; k < 6; k++) {
        const angle = k * Math.PI / 3 + battle.tick * 0.1
        const radius = 5 + chargePower * 8
        c.moveTo(sparkX + Math.cos(angle) * radius, sparkY + Math.sin(angle) * radius)
        c.lineTo(sparkX + Math.cos(angle + 0.15) * (radius + 3), sparkY + Math.sin(angle + 0.15) * (radius + 3))
        c.lineTo(sparkX + Math.cos(angle) * (radius + 6), sparkY + Math.sin(angle) * (radius + 6))
      }
      c.stroke()
      if (lightningCharge || charging || thorMeditating) {
        c.globalAlpha = 0.1 + chargePower * 0.2
        c.fillStyle = '#b5eaff'
        c.beginPath()
        c.arc(sparkX, sparkY, 5 + chargePower * 8, 0, Math.PI * 2)
        c.fill()
        c.globalAlpha = 1
      }
    }
    if (fighter.species !== 'phoenix' && (flying || hovering || dashing)) {
      c.strokeStyle = '#80bacb'
      c.lineWidth = 1.2
      c.beginPath()
      c.moveTo(-13, -18); c.lineTo(-27, -18)
      c.moveTo(-16, -25); c.lineTo(-32, -25)
      c.stroke()
    }
    if (fighter.shock > 0 && fighter.frozen <= 0) {
      c.globalAlpha = Math.min(1, fighter.shock / 0.2)
      c.drawImage(fighter.zombie ? mantis?.shockedZombie ?? knife?.shockedZombie ?? evolvedRex?.shockedZombie ?? (fighter.stage === 'chick' ? poses.zombie.shockedChick! : poses.zombie.shocked)
        : mantis ? mantis.shocked
        : knife ? knife.shocked
        : evolvedRex ? evolvedRex.shocked
        : fighter.stage === 'chick' ? poses.phoenix!.shockedChick
        : flightFrame !== null ? shockedFrames![flightFrame]
        : fighter.hammerOut ? poses.shockedEmpty : commanderPoses?.shocked ?? meiFox?.shocked ?? phoenix?.shocked ?? dragon?.shocked ?? poses.shocked, -24, -44, 48, 48)
      c.globalAlpha = 1
    }
    const stunned = fighter.stun > 0 && fighter.shock <= 0 && fighter.frozen <= 0
    if ((fighter.dizzy > 0 || stunned) && !thrown) {
      c.fillStyle = '#ffd23f'
      c.strokeStyle = '#221f33'
      c.lineWidth = 0.6
      c.globalAlpha = Math.min(1, Math.max(fighter.dizzy, stunned ? fighter.stun : 0) * 3)
      for (let a = 0; a < 3; a++) {
        const angle = battle.tick * 0.14 + a * 2.09
        const x = Math.cos(angle) * 9, y = -40 + Math.sin(angle) * 2.5
        c.beginPath()
        for (let k = 0; k < 8; k++) {
          const radius = k & 1 ? 1.1 : 3
          c.lineTo(x + Math.cos(k * Math.PI / 4) * radius, y + Math.sin(k * Math.PI / 4) * radius)
        }
        c.closePath()
        c.fill()
        c.stroke()
      }
      c.globalAlpha = 1
    }

    if (fighter.frozen > 0) {
      c.save()
      c.globalAlpha = Math.min(0.85, fighter.frozen * 2)
      c.strokeStyle = '#76c7e8'
      c.fillStyle = 'rgba(171,230,252,.4)'
      c.lineWidth = 1.2
      c.beginPath()
      c.moveTo(-15, 3)
      c.lineTo(-19, -17)
      c.lineTo(-12, -39)
      c.lineTo(1, -47)
      c.lineTo(15, -38)
      c.lineTo(20, -16)
      c.lineTo(14, 3)
      c.closePath()
      c.fill()
      c.stroke()
      c.strokeStyle = '#f4fdff'
      c.lineWidth = 0.9
      c.beginPath()
      c.moveTo(-12, -39)
      c.lineTo(-5, -18)
      c.lineTo(-15, 3)
      c.moveTo(-5, -18)
      c.lineTo(20, -16)
      c.moveTo(1, -47)
      c.lineTo(7, -29)
      c.lineTo(15, -38)
      c.stroke()
      c.restore()
    }
    if (fighter.chill > 0) {
      c.save()
      c.strokeStyle = '#63b9de'
      c.fillStyle = '#def8ff'
      c.globalAlpha = Math.min(0.8, fighter.chill)
      c.lineWidth = 0.8
      for (let k = 0; k < 4; k++) {
        const x = (k - 1.5) * 7, y = -9 - (k % 2) * 7
        c.beginPath()
        c.moveTo(x - 2, y)
        c.lineTo(x, y - 6)
        c.lineTo(x + 3, y)
        c.closePath()
        c.fill()
        c.stroke()
      }
      c.restore()
    }
    if (fighter.infection) {
      c.save()
      c.strokeStyle = '#78a34b'
      c.lineWidth = 1.4
      for (let k = 0; k < 3; k++) {
        const rise = (battle.tick * 0.025 + k / 3 + fighter.id * 0.17) % 1
        c.globalAlpha = (1 - rise) * 0.8
        c.fillStyle = '#a4c86c'
        c.beginPath()
        c.arc((k - 1) * 7, -12 - rise * 26, 1.5 + rise, 0, Math.PI * 2)
        c.fill()
        c.stroke()
      }
      c.restore()
    }
    if (def.scare > 0 && fighter.attack > 0) { // three quiet sound arcs off the beak
      c.strokeStyle = '#9a9aa8'
      c.lineWidth = 1.1
      c.globalAlpha = fighter.attack
      for (let k = 0; k < 3; k++) {
        c.beginPath()
        c.arc(22, -31, 5 + k * 4, -0.65, 0.65)
        c.stroke()
      }
      c.globalAlpha = 1
    }
    if (fighter.fear > 0) {
      c.strokeStyle = '#9a9aa8'
      c.lineWidth = 1.2
      for (let k = 0; k < 3; k++) {
        c.beginPath()
        c.moveTo(-13, -9 - k * 5)
        c.lineTo(-22, -9 - k * 5)
        c.stroke()
      }
      c.fillStyle = '#7ac6ec'
      c.beginPath()
      c.moveTo(-12, -39)
      c.quadraticCurveTo(-19, -30, -12, -30)
      c.quadraticCurveTo(-7, -30, -12, -39)
      c.fill()
    }
    c.restore()
    if (sink > 0.5) {
      c.save()
      c.strokeStyle = '#e4faff'
      c.lineWidth = 1.4
      c.beginPath()
      c.ellipse(fighter.x, fighter.y + def.radius - bob - sink * def.size, def.radius * 1.15, 2, 0, 0, Math.PI)
      c.stroke()
      c.restore()
    }
    if (fighter.burn > 0) {
      for (let k = 0; k < 3; k++) {
        const rise = (battle.tick * 0.04 + k / 3 + fighter.id * 0.17) % 1
        c.globalAlpha = 1 - rise
        drawFlame(c, fighter.x + (k - 1) * 6, fighter.y - altitude - 8 - rise * 18, 0.65,
          fighter.burnOwner?.species === 'meiyuanzhi' ? MEI_FLAME : undefined)
      }
      c.globalAlpha = 1
    }
    if (phoenix && !fighter.zombie && (fighter.phoenixKills > 0 || fighter.evolution > 0)) {
      c.save()
      c.font = '10px system-ui'
      c.textAlign = 'center'
      c.fillStyle = fighter.phoenixForm === 2 ? '#b47d26' : '#bd6539'
      c.fillText(`${PHOENIX_FORMS[fighter.phoenixForm].name} · ${fighter.phoenixKills} kills`,
        fighter.x, fighter.y + def.radius + 14)
      c.restore()
    }
    if (mantis && !fighter.zombie && fighter.mantisKills > 0) {
      c.save()
      c.font = '9px system-ui'; c.textAlign = 'center'; c.fillStyle = '#567645'
      const label = ['Mantis', 'Sword Mantis', 'Winged Mantis', 'Ghost Mantis'][fighter.mantisForm]
      c.fillText(`${label} · ${fighter.mantisKills} kills`, fighter.x, fighter.y + def.radius + 14)
      c.restore()
    }
  }

  for (const domain of battle.dragonDomains) {
    drawDragonDomain(c, domain.x, domain.y, domain.radius, battle.tick / 60, domain.sealed, DOMAIN_END - domain.time, true)
  }
  for (const slash of battle.katanaSlashes) {
    const progress = 1 - slash.life / (slash.saint ? SAINT_SLASH_DURATION : KATANA_SLASH_DURATION)
    if (slash.saint) drawSaintSlash(c, slash.x, slash.y, slash.angle, progress)
    else drawKatanaImpact(c, slash.x, slash.y, slash.angle, progress)
  }
  for (const wave of battle.lightningWaves) {
    drawLightningWave(c, wave.x, wave.y - wave.height, Math.atan2(wave.vy, wave.vx),
      wave.radius, wave.age, wave.remaining / DRAGON_LIGHTNING_SWORD.waveRange)
  }
  for (const shot of battle.shots) {
    c.save()
    const dx = shot.tx - shot.x, dy = shot.ty - shot.y, length = Math.hypot(dx, dy)
    const fade = shot.life / THOR_SKILLS.shot.duration
    c.translate(shot.x, shot.y - 10)
    c.rotate(Math.atan2(dy, dx))
    if (shot.owner.species === 'dragon') drawDragonLightning(c, length, battle.tick / 60 + shot.owner.id, fade)
    else drawLightningBolt(c, length, fade)
    c.restore()
  }
  for (const star of battle.shuriken) {
    if (star.kind === 'sword') {
      // Swords leave the fan upright and swing horizontal before flying.
      const turn = star.ride ? 1 : Math.min(1, (SWORD_SAINT_SWORDS.life - star.life) / SWORD_SAINT_SWORDS.aim)
      const aim = Math.atan2(star.vy, star.vx), upright = -Math.PI / 2
      const swing = ((aim - upright + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      drawFlyingSword(c, star.x, star.y - star.elevation, upright + swing * turn, battle.tick + star.owner.id * 13, turn, star.ride ? 28 : 16)
    }
    else if (star.kind === 'talisman' && star.fox) drawFoxTalisman(c, star.x, star.y - star.elevation, battle.tick + star.owner.id)
    else if (star.kind === 'talisman') drawTalisman(c, star.x, star.y - star.elevation, Math.sin(battle.tick * 0.3 + star.owner.id) * 0.5, 1 + Math.min(3, (star.power ?? 0) / 40))
    else if (star.kind === 'spear') drawSpartanSpear(c, star.x, star.y - star.elevation, Math.atan2(star.vy, star.vx), (star.power ?? 1) > 1)
    else drawShuriken(c, star.x, star.y - star.elevation, battle.tick * 0.7 + star.owner.id)
  }
  for (const sword of battle.giantSwords) {
    const lift = SWORD_SAINT_GIANT.height + 20
    if (!sword.flying) drawGiantSword(c, sword.x, sword.y - lift, Math.PI / 2, Math.min(1, sword.time / SWORD_SAINT_GIANT.form), battle.tick)
    else {
      const p = Math.min(1, sword.time / SWORD_SAINT_GIANT.flight)
      const angle = Math.atan2(sword.target.y - (sword.fromY - lift), sword.target.x - sword.fromX)
      drawGiantSword(c, sword.x, sword.y - lift * (1 - p), angle, 1, battle.tick)
    }
  }
  for (const fish of battle.fishThrows) {
    const p = Math.min(1, fish.time / SWORD_SAINT_FISHING.counterFlight), head = fighterDef(fish.target).size * 30
    drawCatch(c, 0, fish.fromX + (fish.target.x - fish.fromX) * p,
      fish.fromY - 30 + (fish.target.y - head + 30 - fish.fromY) * p - Math.sin(p * Math.PI) * 50, fish.time * 20, 2)
  }
  for (const { target } of battle.blinded) {
    drawCatch(c, 0, target.x - 14, target.y - fighterDef(target).size * 30 - target.elevation, Math.PI / 2 + Math.sin(battle.tick * 0.3) * 0.3, 1.8)
  }
  for (const hammer of battle.hammers) {
    c.save()
    c.translate(hammer.x, hammer.y - 10)
    const speed = Math.hypot(hammer.vx, hammer.vy) || 1
    const dx = hammer.vx / speed, dy = hammer.vy / speed
    c.strokeStyle = hammer.returning ? '#80bacb' : '#9ea8ba'
    c.lineWidth = 1.5
    c.globalAlpha = 0.35
    c.beginPath()
    c.moveTo(-dx * 11, -dy * 11)
    c.lineTo(-dx * 24, -dy * 24)
    c.stroke()
    c.globalAlpha = 1
    c.rotate(hammer.age * 27)
    c.translate(0, 4)
    drawHammer(c)
    c.restore()
  }
  c.strokeStyle = '#67cfff'
  for (const bolt of battle.bolts) {
    const dx = bolt.tx - bolt.x, dy = bolt.ty - bolt.y, distance = Math.hypot(dx, dy) || 1
    const ox = -dy / distance * 5, oy = dx / distance * 5
    const fade = bolt.life / 0.3
    c.beginPath()
    c.moveTo(bolt.x, bolt.y - 10)
    c.lineTo(bolt.x + dx * 0.35 + ox, bolt.y - 10 + dy * 0.35 + oy)
    c.lineTo(bolt.x + dx * 0.65 - ox, bolt.y - 10 + dy * 0.65 - oy)
    c.lineTo(bolt.tx, bolt.ty - 10)
    c.lineWidth = 4
    c.globalAlpha = fade * 0.18
    c.stroke()
    c.lineWidth = 1.4
    c.globalAlpha = fade
    c.stroke()
    c.lineWidth = 1
    c.globalAlpha = fade * 0.6
    c.beginPath()
    c.arc(bolt.tx, bolt.ty - 10, 2 + (1 - fade) * 6, 0, Math.PI * 2)
    c.stroke()
  }
  c.globalAlpha = 1
  const terrain: (Tree | Tower)[] = [...battle.trees, ...battle.towers].sort((a, b) => a.y - b.y || a.x - b.x)
  for (const item of terrain) {
    if ('hp' in item) {
      drawTower(c, item.x, item.y, item.hp / TOWER_HP, item.hp <= 0 ? 1 - item.fall / TOWER_COLLAPSE : 0)
    } else drawTree(c, item.x, item.y)
  }
  for (const group of battle.spartanFormations) drawSpartanCharge(c, group, battle.tick)
}

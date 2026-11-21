import { box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'
import { ARMOR, drawLuiBow, GOLD, GOLD_DARK, HAIR, halberd, inkArrow, inkBrushArc, LUI_FENG, LUI_FOOT_BOW_RIG, MANE, pauldron, RED, RED_DARK, scales,
  SHADE, SKIN, sleeve, WHITE } from './luifeng.ts'

// Lui Feng unhorsed: when his health falls to half his horse dies, and he fights on foot with sword, spear and longbow
// until the horse returns. Tuning first, then the foot art.

// On foot he is smaller and slower than mounted; HP and detection stay his own. The melee numbers are the sword's.
export const LUI_FOOT = { radius: 11, speed: 110, size: 1.25, range: 70, damage: 22, cooldown: 0.55, knockback: 70 } as const

// The horse falls at `threshold` of max HP (he is thrown down, stunned `fall` s; the body lies `corpse` s). It returns
// `returnAfter` s later, or after `idleReturn` s in a row with no enemy in sight. The return takes `remount` s and
// heals `heal` of his max HP.
export const LUI_HORSE = { threshold: 0.5, fall: 1, corpse: 2, returnAfter: 15, idleReturn: 5, remount: 1.5, heal: 0.5 } as const

export type LuiWeapon = 'sword' | 'spear' | 'bow'
// Sword up to `sword` px, bow beyond `bow` px, spear between; a weapon holds `hysteresis` px past its band.
export const LUI_WEAPON_BANDS = { sword: 70, bow: 220, hysteresis: 15 } as const
// How far he keeps from his target with each weapon (he holds his range rather than closing in).
export const LUI_FOOT_SPACING = { spear: 130, spearMin: 100, spearMax: 160, bow: 300 } as const

export const LUI_FOOT_ATTACKS = {
  sword: { damage: 22, cooldown: 0.55, knockback: 70, range: 70 },
  spear: { damage: 26, cooldown: 0.8, knockback: 110, range: 150 },
  bow: { damage: 20, cooldown: 1, knockback: 50, speed: 780, draw: 0.25, range: 520 },
} as const

export type LuiFootSkillKind = 'pierce' | 'barrage' | 'strike' | 'moon' | 'cutter' | 'stars'
export const LUI_FOOT_SKILL_WEAPON: Record<LuiFootSkillKind, LuiWeapon> = {
  pierce: 'bow', barrage: 'bow', strike: 'spear', moon: 'spear', cutter: 'sword', stars: 'sword',
}
// A ready skill isn't used at once: each second he rolls this chance to use one that fits.
export const LUI_SKILL_ROLL = 0.35

// Piercing Shot: one large arrow straight at the target that flies through everyone to the arena's edge.
export const LUI_PIERCE = { charge: 0.8, damage: 45, knockback: 140, speed: 900, radius: 18, cooldown: 10 } as const
// Arrow Barrage: `arrows` arrows over `duration` s, sprayed across a `spread`-radian cone.
export const LUI_BARRAGE = { charge: 0.6, arrows: 20, duration: 1, spread: 2.09, damage: 10, knockback: 40, speed: 1100,
  range: 520, cooldown: 12 } as const
// Heavenly Strike: rise, lean back, throw the spear down (slowing whoever it hits), then dive to it; the landing knocks
// up and stuns everyone within `landRadius`.
export const LUI_STRIKE = { rise: 0.45, lean: 0.35, throw: 0.2, dive: 0.35, height: 140, damage: 40, hitRadius: 30,
  slow: 2, slowAmount: 0.5, landRadius: 110, landDamage: 20, stun: 1, range: 260, cooldown: 14 } as const
// Heavenly Slash: a thick ink crescent that flies through everyone to the arena's edge.
export const LUI_MOON = { charge: 0.7, swing: 0.2, damage: 35, knockback: 90, speed: 520, radius: 34, cooldown: 10 } as const
// Sky Cutter: backflip over the enemy cutting, land behind, then dash back through it cutting again.
export const LUI_CUTTER = { flip: 0.45, flipHeight: 50, land: 0.15, dash: 0.2, dashDistance: 120, damage: 30, range: 110,
  cooldown: 9 } as const
// Playful Stars: spin in a ring of crescents pulling enemies in, then pierce the ground to blast them away.
export const LUI_STARS = { spin: 1.2, plant: 0.3, radius: 150, pull: 160, tick: 0.2, tickDamage: 4, damage: 40,
  knockback: 520, cooldown: 16 } as const
export const LUI_FOOT_COOLDOWNS: Record<LuiFootSkillKind, number> = {
  pierce: LUI_PIERCE.cooldown, barrage: LUI_BARRAGE.cooldown, strike: LUI_STRIKE.cooldown,
  moon: LUI_MOON.cooldown, cutter: LUI_CUTTER.cooldown, stars: LUI_STARS.cooldown,
}
export const LUI_FOOT_SKILLS = Object.keys(LUI_FOOT_COOLDOWNS) as LuiFootSkillKind[]
// How long a sword skill's black ink slash lingers.
export const LUI_INK_SLASH_LIFE = 0.4

// The return, in seconds into LUI_HORSE.remount: spear butt planted until `plant`, fully covered in ink at `covered`
// (the horse appears behind him then), the ink gone and the backflip into the saddle from `flip` to the end.
export const LUI_REMOUNT = { plant: 0.35, covered: 0.7, flip: 1 } as const

// ---- Art ----

type FootPose = 'stand' | 'slash' | 'thrust' | 'raise' | 'throw' | 'back' | 'spin' | 'plant' | 'butt' | 'fallen'
const SHOULDER = LUI_FOOT_BOW_RIG.shoulder

// His black-and-gold jian, hilt at (x, y) pointing along `angle`: gold pommel and guard, red tassel, pale blade.
export function drawLuiSword(c: C, x: number, y: number, angle: number, length = 14) {
  c.save()
  c.translate(x, y); c.rotate(angle)
  c.lineCap = c.lineJoin = 'round'
  c.strokeStyle = INK; c.lineWidth = 2.2; line(c, -3.5, 0, 0, 0)
  c.strokeStyle = RED_DARK; c.lineWidth = 1.2; line(c, -3.3, 0, -0.3, 0)
  c.strokeStyle = RED; c.lineWidth = 0.6; line(c, -4.4, 0.4, -6, 3.6)
  c.strokeStyle = INK; c.lineWidth = 0.6
  ellipse(c, -4, 0, 0.9, 0.9, GOLD)
  poly(c, '#e4e7ea', 0.8, -0.95, length - 2, -0.75, length, 0, length - 2, 0.75, 0.8, 0.95)
  c.strokeStyle = 'rgba(34,31,51,.45)'; c.lineWidth = 0.35; line(c, 1.5, 0, length - 2.5, 0)
  c.strokeStyle = INK; c.lineWidth = 0.6
  poly(c, GOLD, 0, -2.4, 1.3, -1, 1.3, 1, 0, 2.4, -0.6, 0)
  c.restore()
}

const footPauldron = (c: C) => { c.save(); c.translate(LUI_FOOT_BOW_RIG.armor[0], LUI_FOOT_BOW_RIG.armor[1]); pauldron(c); c.restore() }

// Lui Feng on foot: the same crown, armour and red cape as in the saddle. One arm holds the pose's weapon; with the
// bow both arms are drawn live (drawLuiFootBow).
function footGeneral(c: C, weapon: LuiWeapon, pose: FootPose, step?: number) {
  // Thrown down: lying on his back. Left applied so the team headband lies with him.
  if (pose === 'fallen') { c.translate(24, 40); c.rotate(-1.45); c.translate(-24, -25) }

  // Red cape behind him with a gold hem.
  c.strokeStyle = INK; c.lineWidth = 1
  c.beginPath()
  c.moveTo(19, 17); c.quadraticCurveTo(12, 22, 9, 37); c.quadraticCurveTo(14, 35, 17.5, 37.5)
  c.quadraticCurveTo(18, 28, 21.5, 19); c.closePath()
  c.fillStyle = RED; c.fill(); c.stroke()
  c.strokeStyle = RED_DARK; c.lineWidth = 0.7
  c.beginPath(); c.moveTo(18.5, 20); c.quadraticCurveTo(14, 26, 12.5, 34); c.stroke()
  c.strokeStyle = GOLD; c.lineWidth = 0.6
  c.beginPath(); c.moveTo(9.6, 36.2); c.quadraticCurveTo(14, 34.3, 17.3, 36.4); c.stroke()

  // Long black hair down his back.
  c.strokeStyle = INK; c.lineWidth = 0.8
  poly(c, HAIR, 19, 9, 15, 14, 14, 24, 16.5, 27, 18, 20, 20.5, 15)

  // Armoured legs and black boots with gold cuffs.
  const boot = (x: number) => () => {
    c.strokeStyle = INK; c.lineWidth = 4; line(c, x, 32, x, 40.5)
    c.strokeStyle = '#3a2f36'; c.lineWidth = 2.6; line(c, x, 32, x, 40.5)
    c.strokeStyle = INK; c.lineWidth = 0.8; box(c, x - 2.2, 40, 6, 3.6, 1.2, ARMOR)
    c.strokeStyle = GOLD; c.lineWidth = 0.5; line(c, x - 1.8, 40.6, x + 3.4, 40.6)
  }
  leg(c, step, 21, 32, boot(21))
  leg(c, opposite(step), 27.5, 32, boot(27.5))

  // Red robe skirt with a gold hem under a black scale tasset.
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, RED, 16.5, 26, 32, 26, 34, 36, 14.5, 36)
  c.strokeStyle = GOLD; c.lineWidth = 0.7; line(c, 15, 34.8, 33.6, 34.8)
  c.strokeStyle = INK; c.lineWidth = 0.8
  poly(c, ARMOR, 18, 26.5, 30.5, 26.5, 31.5, 33, 24.5, 34.5, 17, 33)
  scales(c, 18.6, 27.6, 12, 5)
  c.strokeStyle = GOLD; c.lineWidth = 0.5; line(c, 17.2, 32.6, 24.5, 34, 31.3, 32.6)

  // Black scale cuirass with gold trim, dragon coil, red collar and a gold lion belt.
  c.strokeStyle = INK; c.lineWidth = 1.2
  box(c, 17, 16.5, 14.5, 10.5, 3, ARMOR)
  scales(c, 18.2, 18.4, 12, 7)
  c.strokeStyle = GOLD; c.lineWidth = 0.6
  c.beginPath(); c.roundRect(17.9, 17.3, 12.7, 9, 2.4); c.stroke()
  c.lineWidth = 0.7
  c.beginPath(); c.arc(25.5, 21.5, 1.9, -0.5, Math.PI * 1.6); c.stroke()
  c.beginPath(); c.arc(25.5, 21.5, 0.8, 0, Math.PI * 1.8); c.stroke()
  c.strokeStyle = INK; c.lineWidth = 0.6
  poly(c, RED, 21, 16.2, 28, 16.2, 24.5, 19.8)
  c.strokeStyle = '#f4efe2'; c.lineWidth = 0.5; line(c, 22, 16.5, 24.5, 19, 27, 16.5)
  c.strokeStyle = INK; c.lineWidth = 0.7
  box(c, 16.5, 25.2, 15.5, 2.4, 0.6, GOLD)
  ellipse(c, 24.5, 26.4, 1.5, 1.3, GOLD_DARK)
  ellipse(c, 24.5, 26.4, 0.55, 0.55, RED)

  // Head: topknot under a gold crown trailing bead strands, stern brow, moustache and goatee.
  c.lineWidth = 1.3
  ellipse(c, 25, 10.5, 6.6, 6.6, SKIN)
  c.lineWidth = 1
  poly(c, HAIR, 31, 7, 28.5, 4.6, 24, 4, 19.8, 5.2, 18, 8.5, 17.8, 13.5, 19.3, 17, 21.2, 15.2, 21.4, 11, 23.8, 8.4, 28, 7.8)
  ellipse(c, 23.5, 3, 2.8, 2.3, HAIR)
  c.lineWidth = 0.6
  ellipse(c, 21.8, 11, 1.1, 1.5, SKIN)
  poly(c, GOLD, 20.5, 3.6, 21.2, 0.4, 23.6, -1.2, 26.4, -0.2, 26.6, 1.8, 25.6, 3.5)
  ellipse(c, 23.8, 1.2, 0.8, 0.8, RED)
  c.strokeStyle = GOLD; c.lineWidth = 0.4; c.fillStyle = GOLD
  for (const [x, y] of [[19.2, 6.8], [17.9, 6.2], [16.8, 5.2]]) {
    line(c, 20.8, 2.5, x, y)
    c.fillRect(x - 0.4, y - 0.2, 0.8, 0.8)
  }
  c.strokeStyle = INK; c.lineWidth = 0.9
  line(c, 27.4, 8.6, 30.6, 9.2)
  c.fillStyle = INK
  c.fillRect(28.4, 10, 1.5, 1.3)
  c.lineWidth = 0.4
  poly(c, HAIR, 28, 14.2, 31, 13.6, 30, 14.6)
  poly(c, HAIR, 29, 15, 30.5, 15, 29.6, 17.4)

  // The weapon arm.
  if (weapon === 'bow' && pose === 'stand') { footPauldron(c); return }
  const hand: readonly [number, number] = pose === 'slash' ? [35, 20] : pose === 'thrust' ? [32, 21] : pose === 'raise' ? [23, 5]
    : pose === 'throw' ? [36, 15] : pose === 'back' ? [20, 25] : pose === 'spin' ? [33, 21] : pose === 'plant' ? [29, 29]
    : pose === 'butt' ? [31, 21] : pose === 'fallen' ? [30, 27] : weapon === 'sword' ? [30, 27] : [31, 25]
  sleeve(c, SHOULDER[0], SHOULDER[1], hand[0], hand[1])
  if (pose === 'slash') {
    c.save(); c.translate(24, 22); inkBrushArc(c, 15, 4, -1.4, 0.8); c.restore()
    drawLuiSword(c, hand[0], hand[1], -0.25)
  } else if (pose === 'spin') drawLuiSword(c, hand[0], hand[1], 0, 13)
  else if (pose === 'plant') drawLuiSword(c, hand[0], hand[1], Math.PI / 2)
  else if (pose === 'thrust') halberd(c, hand[0], hand[1], 0, 14, 2)
  else if (pose === 'raise') halberd(c, hand[0], hand[1], -0.15, 10, 6)
  else if (pose === 'back') halberd(c, hand[0], hand[1], Math.PI + 0.3, 4, 4)
  else if (pose === 'butt') halberd(c, hand[0], hand[1], -Math.PI / 2 + 0.08, 22, 0)
  else if (pose === 'stand') {
    if (weapon === 'sword') drawLuiSword(c, hand[0], hand[1], 0.75)
    else halberd(c, hand[0], hand[1], -1.42, 13, 8)
  }
  footPauldron(c)
  c.strokeStyle = INK; c.lineWidth = 1
  ellipse(c, hand[0], hand[1], 2.1, 1.9, SKIN)
}

export function buildLuiFootSprite(color: string | undefined, weapon: LuiWeapon, pose: FootPose = 'stand', step?: number) {
  return buildSprite((c) => footGeneral(c, weapon, pose, step), color, [19.5, 5.4, 11])
}

// The longbow and both arms over the standing pose (fighter's space, sprite units). See drawLuiBow.
export function drawLuiFootBow(c: C, angle: number, draw: number, after = -1, ink = 0) {
  drawLuiBow(c, angle, draw, after, ink, LUI_FOOT_BOW_RIG)
}

// Piercing Shot's great arrow, or Heavenly Slash's thick ink crescent, flying at (x, y) along (vx, vy).
export function drawLuiPiercer(c: C, kind: 'arrow' | 'moon', x: number, y: number, vx: number, vy: number) {
  c.save()
  c.translate(x, y); c.rotate(Math.atan2(vy, vx))
  if (kind === 'arrow') inkArrow(c, 74)
  else {
    c.translate(-LUI_MOON.radius * 0.7, 0) // the crescent bows forward along its flight
    c.globalAlpha *= 0.45
    inkBrushArc(c, LUI_MOON.radius + 10, 6, -1.25, 1.25)
    c.globalAlpha /= 0.45
    inkBrushArc(c, LUI_MOON.radius, 18, -1.1, 1.1)
  }
  c.restore()
}

// Heavenly Strike's spear in world space: flying point-first at `angle`, or planted head-down in the ground.
export function drawLuiThrownSpear(c: C, x: number, y: number, angle: number) {
  c.save()
  c.translate(x, y); c.rotate(angle); c.scale(LUI_FOOT.size, LUI_FOOT.size)
  c.lineCap = c.lineJoin = 'round'
  halberd(c, -22, 0, 0, 14, 10) // point at the origin: the 12-unit point ahead of 24 units of shaft
  c.restore()
}

// A black ink slash left in the air by his sword, at (x, y) facing `angle`, fading over LUI_INK_SLASH_LIFE. With a
// `length` it is instead his spear thrust: a straight tapering streak of ink wind that long.
export function drawLuiInkSlash(c: C, x: number, y: number, angle: number, radius: number, facing: number, time: number, length = 0) {
  const p = time / LUI_INK_SLASH_LIFE
  if (p >= 1) return
  c.save()
  c.translate(x, y); c.rotate(angle); c.scale(1, facing)
  c.globalAlpha *= Math.sqrt(1 - p)
  if (length > 0) {
    const reach = length * Math.min(1, p / 0.25), tail = length * Math.max(0, (p - 0.3) / 0.7)
    c.fillStyle = '#15151d'
    c.beginPath(); c.moveTo(tail, -1.5); c.lineTo(reach - 6, -4); c.lineTo(reach, 0); c.lineTo(reach - 6, 4); c.lineTo(tail, 1.5); c.closePath(); c.fill()
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 0.8
    line(c, tail + 4, -0.6, reach - 8, -1.6)
    c.restore()
    return
  }
  const head = Math.min(1, p / 0.35)
  inkBrushArc(c, radius, 20, -1.3, -1.3 + 2.6 * head)
  c.globalAlpha *= 0.4
  inkBrushArc(c, radius + 12, 5, -1.1, -1.1 + 2.2 * head)
  c.restore()
}

// Playful Stars round ground point (x, y): crescents whirling round him while he spins (`plant` < 0), then the sword's
// shockwave `plant` 0..1 through its spread.
export function drawLuiStars(c: C, x: number, y: number, spin: number, plant: number) {
  const R = LUI_STARS.radius
  c.save()
  c.translate(x, y); c.scale(1, 0.42)
  if (plant < 0) {
    for (let k = 0; k < 5; k++) {
      const a = spin + k * Math.PI * 2 / 5
      inkBrushArc(c, R * (0.55 + 0.09 * k), 9 - k, a, a + 1.4)
    }
    c.globalAlpha *= 0.35
    inkBrushArc(c, R, 3, spin * 1.3, spin * 1.3 + Math.PI * 1.6)
  } else {
    c.globalAlpha *= 1 - plant
    inkBrushArc(c, Math.max(1, R * (1 - (1 - plant) ** 3)), 22 * (1 - plant), 0, Math.PI * 2)
    c.strokeStyle = '#15151d'; c.lineWidth = 2
    for (let k = 0; k < 8; k++) {
      const a = k * 2.39996, reach = R * Math.min(1, plant * 2) * (0.5 + 0.06 * k)
      line(c, Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a + 0.1) * reach * 0.6, Math.sin(a + 0.1) * reach * 0.6, Math.cos(a) * reach, Math.sin(a) * reach)
    }
  }
  c.restore()
}

// His fallen horse at ground point (x, y): it drops onto its side, lies still, then dissolves into ink.
export function drawLuiHorseCorpse(c: C, x: number, y: number, facing: number, time: number) {
  const s = LUI_FENG.size * 0.9, drop = Math.min(1, time / 0.25)
  const fade = Math.max(0, Math.min(1, (LUI_HORSE.corpse - time) / 0.8))
  c.save()
  c.translate(x, y); c.scale(facing * s, s)
  c.lineJoin = c.lineCap = 'round'
  c.fillStyle = 'rgba(34,31,51,.16)'
  c.beginPath(); c.ellipse(0, 0, 21, 3.5, 0, 0, Math.PI * 2); c.fill()
  c.save()
  c.globalAlpha *= fade
  c.translate(0, -8 * (1 - drop)); c.rotate((1 - drop) * -0.3)
  for (const [x0, x1] of [[-9, -15], [-5, -9], [6, 4], [10, 11]]) {
    c.strokeStyle = INK; c.lineWidth = 2.6; line(c, x0, -3, x1, 1.5)
    c.strokeStyle = WHITE; c.lineWidth = 1.5; line(c, x0, -3, x1, 1.5)
    c.fillStyle = INK; c.beginPath(); c.ellipse(x1, 1.8, 1.2, 0.8, 0, 0, Math.PI * 2); c.fill()
  }
  c.strokeStyle = INK; c.lineWidth = 0.9
  poly(c, MANE, -14, -6, -21, -4, -23, 0, -17, -1)
  c.lineWidth = 1.2
  ellipse(c, 0, -5.5, 15, 5.5, WHITE)
  poly(c, WHITE, 11, -8, 17, -5, 22, -1.5, 23.5, 0.5, 19, 1, 13, -1)
  c.strokeStyle = SHADE; c.lineWidth = 0.6
  line(c, 12, -7.5, 17, -4.4); line(c, 13, -6, 18, -3)
  c.strokeStyle = GOLD; c.lineWidth = 0.8
  line(c, 18.5, -3.4, 20, 0.6)
  c.strokeStyle = INK; c.lineWidth = 0.6
  line(c, 19.6, -2, 21, -1.6) // closed eye
  c.lineWidth = 0.8
  poly(c, ARMOR, -6, -10.5, 6, -10.5, 5.5, -5, -5.5, -5)
  c.strokeStyle = RED; c.lineWidth = 0.7
  for (let k = -5; k <= 5; k += 1.25) line(c, k, -4.8, k - 0.3, -3.4)
  c.restore()
  const ink = 1 - fade // dissolving: ink blots spread over where it lay
  if (ink > 0) {
    c.fillStyle = '#15151d'
    for (let k = 0; k < 7; k++) {
      const bx = Math.sin(k * 2.4) * 15, by = -4 + Math.cos(k * 1.7) * 3
      c.globalAlpha = Math.min(1, ink * 1.6) * (1 - ink * 0.8)
      c.beginPath(); c.arc(bx, by, 1.5 + ink * 5 * (0.6 + 0.4 * Math.sin(k)), 0, Math.PI * 2); c.fill()
    }
  }
  c.restore()
}

// Black ink welling up round him (fighter's space, sprite units, feet at the origin); `amount` 1 hides him.
export function drawLuiInkCover(c: C, amount: number, tick: number) {
  if (amount <= 0) return
  c.save()
  c.globalAlpha *= Math.min(1, amount * 1.4)
  const g = c.createRadialGradient(0, -20, 3, 0, -20, 30)
  g.addColorStop(0, 'rgba(21,21,29,.98)'); g.addColorStop(0.7, 'rgba(21,21,29,.92)'); g.addColorStop(1, 'rgba(21,21,29,0)')
  c.fillStyle = g
  c.beginPath(); c.ellipse(0, -22, 18 * (0.4 + 0.6 * amount), 28 * (0.3 + 0.7 * amount), 0, 0, Math.PI * 2); c.fill()
  c.translate(0, -22); c.scale(1, 1.5)
  for (let k = 0; k < 3; k++) {
    const a = tick * 0.12 + k * 2.1
    inkBrushArc(c, 12 + k * 3, 3, a, a + 2.2)
  }
  c.restore()
}

import { bladeArc, box, buildSprite, ellipse, INK, leg, line, opposite, poly, type C } from './art.ts'

const SKIN = '#f2d8c4', HAIR = '#1c1f2b', HAIR_SHADE = '#3a4258', TIE = '#2fa8e8'
const ARMOR = '#262a3a', ARMOR_DARK = '#171a26', SILVER = '#aab4c8', GLOW = '#4d9bff', GLOW_PALE = '#9fd2ff'
const SILK = '#2f6be0', SILK_PALE = '#5fc0f0', STEEL = '#dfe6ef'

// He starts as the Devil Saint; at half health he picks one of three forms (see MENG_RITUAL).
export const MENG_CHUAN = {
  name: 'Meng Chuan',
  blurb: 'A swordsman in dark spiked armour trailing torn blue silk. Autumn Breeze: dashes through foes, binding them, and painted slashes burst across his cut',
  radius: 11, hp: 820, speed: 140, damage: 28, range: 16, detection: 480,
  cooldown: 0.5, knockback: 90, spacing: 44, size: 1.25, color: SILK,
} as const

type MengPose = 'ready' | 'slash' | 'parry' | 'meditate' | 'raise' | 'punch' | 'hook' | 'slam' // the last three are the body form's

function drawJian(c: C, length: number, thunder = false) {
  c.save()
  c.lineWidth = 1
  box(c, -5, -1.1, 7, 2.2, 0.8, thunder ? THUNDER_LOOK.armorDark : ARMOR_DARK)
  if (thunder) {
    // A blade of lightning: a yellow glow around a jagged white-hot bolt.
    const bolt = [3.5, 0]
    for (let k = 1; k <= 5; k++) bolt.push(3.5 + (length + 2 - 3.5) * k / 5, k === 5 ? 0 : (k % 2 ? -1.3 : 1.3))
    c.lineCap = c.lineJoin = 'round'
    c.globalAlpha = 0.35
    c.strokeStyle = THUNDER_YELLOW
    c.lineWidth = 5
    line(c, ...bolt)
    c.globalAlpha = 1
    c.lineWidth = 2
    line(c, ...bolt)
    c.strokeStyle = '#ffffff'
    c.lineWidth = 0.8
    line(c, ...bolt)
  } else {
    poly(c, STEEL, 3.5, -1, length - 3, -1, length, 0, length - 3, 1, 3.5, 1)
    c.strokeStyle = '#ffffff'
    c.lineWidth = 0.6
    line(c, 4.5, -0.2, length - 4, -0.2)
  }
  c.strokeStyle = INK
  c.lineWidth = 0.9
  poly(c, thunder ? THUNDER_LOOK.trim : SILVER, 2.4, -3, 3.6, -1, 3.6, 1, 2.4, 3, 1.8, 0)
  c.restore()
}

// Devil Saint: dark spiked armour, blue inlay and torn blue silk. Lightning and Thunder Saint: gold armour on his
// arms and shoulders, a bare chest with a fiery tattoo, white-and-gold sash over black trousers and grey boots.
const DEVIL_LOOK = { hair: HAIR, armor: ARMOR, armorDark: ARMOR_DARK, trim: SILVER, glow: GLOW, glowPale: GLOW_PALE,
  silk: SILK, silkPale: SILK_PALE, legs: ARMOR_DARK, boots: ARMOR }
const THUNDER_YELLOW = '#ffe14a'
const THUNDER_LOOK = { hair: '#f4f0f6', armor: '#e8b030', armorDark: '#a8701c', trim: '#fff1a8', glow: '#ff7a1e',
  glowPale: '#fff6b0', silk: '#f4f1ea', silkPale: '#e8c25a', legs: '#1f1d26', boots: '#8f9099' }

function drawMengChuan(c: C, pose: MengPose, step?: number, thunder = false) {
  const L = thunder ? THUNDER_LOOK : DEVIL_LOOK
  const ARMOR = L.armor, ARMOR_DARK = L.armorDark, SILVER = L.trim, GLOW_PALE = L.glowPale, SILK = L.silk, SILK_PALE = L.silkPale
  // A thin glowing seam, the armour's inlay.
  const seam = (...points: number[]) => {
    c.save()
    c.strokeStyle = L.glow
    c.lineWidth = 0.9
    line(c, ...points)
    c.restore()
  }
  const jian = (length: number) => drawJian(c, length, thunder)
  const seated = pose === 'meditate'
  if (seated) {
    // Crossed armoured legs with a boot tucked in front; the rest of him sits lower.
    poly(c, L.legs, 9, 40, 39, 40, 41, 44.5, 7, 44.5)
    seam(11, 42.5, 15, 42.2)
    seam(33, 42.2, 37, 42.5)
    poly(c, L.boots, 32, 40.5, 40, 41, 42, 44.5, 32, 44.5)
    c.translate(0, 4)
  }
  // Long ponytail falling down his back (the thunder form's hair stands up in spikes instead).
  if (!thunder) {
    c.save()
    c.lineWidth = 1.3
    poly(c, HAIR, 19, 5, 13, 9, 10.5, 19, 12, 27, 15.5, 22, 17, 14)
    c.restore()
  }

  // Back arm: dark gauntlet hanging at his side.
  poly(c, ARMOR, 16.5, 20, 12.5, 23, 12, 31, 16, 31.5, 18.5, 25)
  seam(13.2, 29.5, 15.6, 29.8)

  // Armoured legs and pointed boots.
  const armouredLeg = (x1: number, x2: number) => {
    poly(c, L.legs, x1, 33, x2, 33, x2 - 0.5, 40, x1 + 0.5, 40)
    if (!thunder) seam(x1 + 2.5, 35, x1 + 2.5, 39)
    poly(c, L.boots, x1 - 1, 39.5, x2 + 0.5, 39.5, x2 + 3.5, 44, x1 - 1, 44)
  }
  if (!seated) {
    leg(c, step, 20, 34, () => armouredLeg(17, 23))
    leg(c, opposite(step), 28, 34, () => armouredLeg(25, 31))
  }

  // Torn silk tassets: dark under-layer, then blue strips with jagged hems.
  poly(c, L.legs, 15, 28, 33, 28, 35, 38, 31, 36, 28, 39, 24, 36, 20, 39, 17, 36, 13, 38)
  c.save()
  c.lineWidth = 1
  poly(c, SILK, 15.5, 29, 19.5, 29, 18.5, 40, 16.8, 37.5, 14, 39)
  poly(c, SILK_PALE, 21, 29, 24, 29, 24.5, 37, 23, 35.5, 21.2, 37.5)
  poly(c, SILK, 26, 29, 30, 29, 31, 41, 29, 38.5, 26.8, 40)
  poly(c, SILK_PALE, 31, 29, 33.5, 29, 35.5, 37, 33.5, 36, 32.5, 38)
  c.restore()

  if (thunder) {
    // Bare chest, a fiery tattoo curling up over it, and a gold plate across the top of the chest.
    poly(c, SKIN, 16, 18.5, 32, 18.5, 33.5, 28.5, 14.5, 28.5)
    c.save()
    c.lineCap = 'round'
    c.strokeStyle = '#ff7a1e'
    c.lineWidth = 1.1
    line(c, 24, 27.5, 23, 24.5, 25, 22, 23.5, 20.5)
    line(c, 20, 27.5, 19.5, 25, 21, 23.5)
    line(c, 28, 27.5, 28.5, 24.5, 27, 23)
    c.strokeStyle = '#d8452f'
    c.lineWidth = 0.7
    line(c, 22, 26.5, 21.5, 24.5)
    line(c, 26, 26.5, 26.5, 24)
    c.strokeStyle = 'rgba(120,70,40,.35)'
    line(c, 24, 21, 24, 27) // the line between his chest muscles
    c.restore()
    poly(c, ARMOR, 17, 18.5, 31, 18.5, 30, 21.5, 24, 20.5, 18, 21.5)
  } else {
    // Breastplate with layered silver ridges and blue inlay.
    poly(c, ARMOR, 16, 18.5, 32, 18.5, 33.5, 28.5, 14.5, 28.5)
    c.save()
    c.strokeStyle = SILVER
    c.lineWidth = 0.8
    line(c, 18, 20, 24, 25, 30, 20)
    line(c, 17, 23, 24, 27.5, 31, 23)
    c.restore()
    seam(24, 19.5, 24, 26)
    seam(19.5, 21.5, 22, 24)
    seam(28.5, 21.5, 26, 24)
  }
  // Belt with a glowing gem.
  c.save()
  c.lineWidth = 1
  box(c, 14.5, 27, 19, 2.6, 1, ARMOR_DARK)
  ellipse(c, 24, 28.3, 1.4, 1.4, GLOW_PALE)
  c.restore()

  // High collar.
  if (!thunder) poly(c, ARMOR_DARK, 19, 16.5, 30, 16.5, 31, 20, 18, 20)

  const hand = (x: number, y: number) => {
    c.save()
    c.lineWidth = 1.2
    ellipse(c, x, y, 2.2, 2.2, ARMOR_DARK)
    c.restore()
  }

  // Front arm: the jian held low, or extended at the end of a cut (drawMengSwing draws the trail).
  if (pose === 'ready') {
    poly(c, ARMOR, 28, 20, 34, 20.5, 38.5, 28, 35.5, 30.5, 30, 26)
    seam(35, 27, 37, 28.5)
    c.save()
    c.translate(37, 29.5)
    c.rotate(1.05)
    jian(14)
    c.restore()
    hand(37, 29.5)
  } else if (seated) {
    // The jian laid across his lap, hands joined in front of his chest.
    c.save()
    c.translate(12, 36)
    jian(25)
    c.restore()
    poly(c, ARMOR, 28, 20, 33, 21, 32, 27.5, 27, 27)
    seam(29, 25.5, 31.5, 25.8)
    hand(28, 26.5)
  } else if (pose === 'raise') {
    // Front arm thrust up, the jian pointing at the sky to call his transformations.
    poly(c, ARMOR, 28, 20, 33, 18.5, 36.5, 14, 34, 11.5, 30, 16)
    seam(33, 15, 35, 13)
    c.save()
    c.translate(35, 13)
    c.rotate(-1.3)
    jian(13)
    c.restore()
    hand(35, 13)
  } else if (pose === 'parry') {
    // Front arm raised, the jian held up across his face to turn a blow aside.
    poly(c, ARMOR, 28, 20, 34, 19, 37.5, 22.5, 35, 25.5, 30, 25)
    seam(34.5, 21, 36.5, 22.5)
    c.save()
    c.translate(36, 22)
    c.rotate(-1.2)
    jian(14)
    c.restore()
    hand(36, 22)
  } else {
    poly(c, ARMOR, 28, 20, 34, 19.5, 38, 22, 36.5, 26, 30, 25.5)
    c.save()
    c.translate(37, 24)
    c.rotate(0.35)
    jian(10)
    c.restore()
    hand(37, 24)
  }

  // Spiked pauldron on the front shoulder, horn sweeping up.
  poly(c, ARMOR, 25.5, 17.5, 32, 15.5, 35.5, 19, 34.5, 23.5, 29, 23, 26, 21)
  poly(c, ARMOR_DARK, 31, 16, 33.5, 7.5, 34.5, 17)
  seam(28, 19.5, 31.5, 18, 33.5, 20.5)

  // Head: pale face, black hair with long side bangs, high topknot bound in blue.
  c.save()
  c.lineWidth = 1.6
  ellipse(c, 25, 13, 7.2, 7.5, SKIN)
  c.lineWidth = 1.3
  if (thunder) {
    // Wild white hair swept up and back in spikes, a gold circlet mark on the brow.
    poly(c, L.hair, 17.5, 16, 14, 13, 17, 11, 12.5, 7, 17.5, 6.5, 15.5, 1.5, 20.5, 3.5, 21.5, 0, 25, 2.8, 28, 0.2, 29.5, 3.8,
      33.5, 2.5, 32.5, 6, 35.5, 7.5, 32.8, 9.5, 29.5, 8.5, 27, 10.5, 24.5, 8.5, 21.5, 11, 20.5, 18)
    c.strokeStyle = '#b9b3c4'
    c.lineWidth = 0.7
    line(c, 19, 6, 23.5, 4.5)
    line(c, 17, 10, 18.5, 15)
    c.strokeStyle = '#e8b030'
    c.lineWidth = 0.9
    line(c, 27.5, 9.6, 29, 10.4, 30.5, 9.6)
  } else {
    poly(c, HAIR, 17.5, 15, 17.2, 8, 20, 4.5, 25, 3.2, 30, 4.2, 33, 7.5, 32.5, 10.5, 29, 8.5, 26.5, 10.5, 24, 8.5, 21.5, 11, 20.5, 18)
    poly(c, HAIR, 31.5, 8.5, 33.2, 10, 33, 16.5, 31.2, 13)
    ellipse(c, 22.5, 2.6, 2.6, 2, HAIR)
    c.lineWidth = 0.9
    box(c, 21.4, 3.2, 2.4, 2, 0.6, TIE)
    c.strokeStyle = HAIR_SHADE
    c.lineWidth = 0.7
    line(c, 20.5, 6.5, 27, 5)
    line(c, 18.5, 10, 19, 15.5)
  }
  c.restore()
  // Stern brow and a cold narrow eye.
  c.save()
  c.lineWidth = 1.2
  line(c, 26.5, 11.3, 31, 11.9)
  if (seated) {
    c.beginPath()
    c.arc(29, 13.2, 1.8, 0.2, Math.PI - 0.2) // eyes closed
    c.stroke()
  } else {
    ellipse(c, 29, 13.8, 1.9, 1.3, '#fff')
    c.fillStyle = thunder ? '#c98f1a' : '#4a5f8c'
    c.beginPath()
    c.arc(29.6, 13.8, 1, 0, Math.PI * 2) // cold blue eye; amber in the thunder form
    c.fill()
  }
  c.lineWidth = 0.9
  line(c, 28.4, 18.4, 30.6, 18.2)
  c.restore()
}

// Body Refinement Divine-Demon (炼体神魔): spiky red hair over dark roots, red marks on his face, a bare chest under
// red-gold flame armour split by a red crack, both forearms blazing to the fist, dark smoky wings off his shoulders,
// layered dark belts with silver buckles over black trousers. No jian: he fights with his fists.
const BODY = { hair: '#e0322a', roots: '#3a1418', armor: '#d8452f', armorDark: '#8a2a18', gold: '#f2c060', flame: '#ff8a2a',
  flamePale: '#ffd36a', crack: '#c8231e', cloth: '#262330', trim: '#e07a2a', legs: '#1c1a24', boots: '#2a2833', buckle: '#c9ced8' }

function drawMengBody(c: C, pose: MengPose, step?: number) {
  const seated = pose === 'meditate'
  // A fist wrapped in fire: the gauntlet, then flames licking up off it.
  const fist = (x: number, y: number, up = -1) => {
    c.save()
    c.lineWidth = 1.2
    ellipse(c, x, y, 2.7, 2.6, BODY.armor)
    c.lineWidth = 0.7
    poly(c, BODY.flame, x - 2.4, y - 0.5 * up, x - 1.5, y + 3.6 * up, x - 0.3, y + 0.8 * up)
    poly(c, BODY.flamePale, x - 0.2, y - 0.8 * up, x + 0.9, y + 4.6 * up, x + 1.8, y + 0.6 * up)
    poly(c, BODY.flame, x + 1.6, y, x + 3.4, y + 2.8 * up, x + 2.9, y - 0.6 * up)
    c.restore()
  }
  // A forearm plated in red-gold with a gold ridge and a flame lick along it.
  const arm = (ridge: number[], ...points: number[]) => {
    poly(c, BODY.armor, ...points)
    c.save()
    c.strokeStyle = BODY.gold
    c.lineWidth = 0.8
    line(c, ...ridge)
    c.restore()
  }
  if (seated) {
    poly(c, BODY.legs, 9, 40, 39, 40, 41, 44.5, 7, 44.5)
    poly(c, BODY.boots, 32, 40.5, 40, 41, 42, 44.5, 32, 44.5)
    c.translate(0, 4)
  }
  const slam = pose === 'slam', crouch = { x: 2, y: 5 } // slamming, he drops into a crouch over his feet
  if (slam) c.translate(crouch.x, crouch.y)

  // Dark smoky wings rising off both shoulders, ragged like torn smoke.
  c.save()
  c.lineWidth = 0.8
  c.strokeStyle = 'rgba(34,31,51,.7)'
  poly(c, 'rgba(48,36,52,.82)', 18, 19, 9, 4, 12, 10, 4, 8, 10, 14, 2.5, 16, 10, 19.5, 6, 24, 15, 23)
  poly(c, 'rgba(48,36,52,.7)', 30, 18, 38, 3, 37.5, 9.5, 44.5, 7.5, 39, 13.5, 46, 16, 38.5, 18.5, 41, 23, 33, 21)
  c.strokeStyle = 'rgba(160,60,40,.5)'
  line(c, 16, 18, 10, 9)
  line(c, 32, 17, 38, 8)
  c.restore()

  // Back arm: a blazing gauntlet at his side, or raised with the other overhead.
  if (pose === 'raise') {
    arm([16, 15, 15, 9], 17, 20, 13.5, 17, 13.5, 8, 17, 8.5, 19, 16)
    fist(15.3, 7)
  } else if (slam) {
    arm([16, 24, 21, 34], 15, 20, 13, 23.5, 20, 37.5, 24.5, 36, 19, 22) // driven down to the ground
    fist(22.5, 38.5)
  } else if (pose !== 'hook') { // a hook swings this arm across his front, drawn below
    arm([13.5, 26, 14, 30], 16.5, 20, 12.5, 23, 12, 30, 16, 30.5, 18.5, 25)
    fist(14, 31, -1)
  }

  // Black trousers and dark boots.
  const trouser = (x1: number, x2: number) => {
    poly(c, BODY.legs, x1, 33, x2, 33, x2 - 0.5, 40, x1 + 0.5, 40)
    poly(c, BODY.boots, x1 - 1, 39.5, x2 + 0.5, 39.5, x2 + 3.5, 44, x1 - 1, 44)
  }
  if (!seated) {
    if (slam) c.translate(-crouch.x, -crouch.y) // his feet stay planted
    leg(c, step, 20, 34, () => trouser(17, 23))
    leg(c, opposite(step), 28, 34, () => trouser(25, 31))
    if (slam) c.translate(crouch.x, crouch.y)
  }

  // Dark layered cloth hanging from the belts, its edges trimmed in orange.
  poly(c, BODY.cloth, 15, 28, 33, 28, 35, 37, 31, 35.5, 28, 39, 24, 36, 20, 39.5, 17, 36, 13, 38)
  c.save()
  c.strokeStyle = BODY.trim
  c.lineWidth = 0.7
  line(c, 13.6, 37.4, 17, 35.8, 20, 39)
  line(c, 28.3, 38.5, 31, 35, 34.5, 36.5)
  c.restore()

  // Bare chest: red-gold flame plates over it, fire patterns down his sides and a red crack down the middle.
  poly(c, SKIN, 16, 18.5, 32, 18.5, 33.5, 28.5, 14.5, 28.5)
  c.save()
  c.lineWidth = 1
  poly(c, BODY.armor, 17, 18.5, 23.6, 19, 23, 23, 19.5, 23.5, 16.5, 21.5)
  poly(c, BODY.armor, 24.4, 19, 31, 18.5, 32, 21.5, 29, 23.5, 25, 23)
  c.strokeStyle = BODY.gold
  c.lineWidth = 0.8
  line(c, 18, 20, 20.5, 21.5, 22.5, 20)
  line(c, 25.5, 20, 28, 21.5, 30.5, 20)
  c.lineCap = 'round'
  c.strokeStyle = BODY.flame
  line(c, 16, 27.5, 17.5, 25, 16.8, 23.5)
  line(c, 32, 27.5, 30.8, 25, 31.6, 23.8)
  c.strokeStyle = BODY.crack
  c.lineWidth = 1.1
  line(c, 24, 19.5, 23.6, 22.5, 24.4, 25, 23.8, 27.5)
  c.lineWidth = 0.6
  line(c, 23.6, 22.5, 22.2, 24)
  line(c, 24.4, 25, 25.8, 26.2)
  c.restore()

  // Two dark belts, one crossing low, with silver buckles.
  c.save()
  c.lineWidth = 1
  box(c, 14.5, 27, 19, 2.6, 1, BODY.cloth)
  poly(c, BODY.cloth, 15, 30, 32.5, 31.5, 32.5, 33.2, 15, 31.8)
  c.lineWidth = 0.6
  box(c, 27, 31.2, 2.2, 1.9, 0.4, BODY.buckle) // the top belt's buckle sits under the team sash
  c.restore()

  // Front arm (a parry is drawn after the head, across his face).
  if (pose === 'ready' || pose === 'hook') {
    arm([31, 22, 34.5, 22.5], 28, 20, 33, 19.5, 36.5, 22, 34, 26, 29.5, 25.5)
    fist(35.6, 22.6)
    if (pose === 'hook') { // the far arm swung round across his front, elbow bent, fist at chin height
      arm([20, 19, 32, 18.5], 17, 18, 20, 16.5, 34, 16.5, 34, 21, 21, 22.5)
      fist(36.4, 18.6)
    }
  } else if (slam) {
    arm([31, 24, 35, 33], 28, 20, 33, 19.5, 38.5, 36, 34.5, 37.5, 29.5, 25.5)
    fist(36.5, 38.5)
  } else if (pose === 'punch') {
    arm([31, 21.5, 39, 22.5], 28, 20, 34, 19.5, 41, 21.2, 40.5, 25, 30, 25.5)
    fist(42.2, 23.1)
  } else if (seated) {
    arm([29.5, 23, 31.5, 26], 28, 20, 33, 21, 32, 27.5, 27, 27)
    fist(28.4, 26.4)
  } else if (pose === 'raise') {
    arm([31.5, 15, 34.5, 10], 28, 20, 33, 18.5, 36.8, 8.5, 33.6, 7.5, 30, 15)
    fist(35.3, 6.8)
  }

  // Flame pauldron on the front shoulder, its tongues sweeping up.
  c.save()
  c.lineWidth = 1.2
  poly(c, BODY.armor, 25.5, 17.5, 28, 13.5, 29.5, 16, 31.5, 11.5, 32.5, 15.5, 35, 13, 34.5, 18, 35.5, 21.5, 30, 22.5, 26, 21)
  c.strokeStyle = BODY.gold
  c.lineWidth = 0.8
  line(c, 27, 19.5, 30.5, 17.5, 33.5, 19.5)
  c.restore()

  // Head: spiky red hair swept up over dark roots, red marks on his face.
  c.save()
  c.lineWidth = 1.6
  ellipse(c, 25, 13, 7.2, 7.5, SKIN)
  c.lineWidth = 1.3
  poly(c, BODY.roots, 17.5, 16.5, 14.5, 12.5, 17, 7, 21, 9.5, 20.5, 18)
  poly(c, BODY.hair, 18, 13, 14.5, 9, 17.5, 7.5, 13.5, 2.5, 18.5, 3.5, 17.5, -1.5, 21.5, 1.5, 23, -2.5, 25.5, 1.2, 28.5, -2,
    29.8, 2.2, 34, 0, 33, 4.5, 36.5, 5, 33.5, 8, 30, 8.3, 27.5, 10.5, 25, 8.5, 22, 11, 20.5, 14)
  c.strokeStyle = BODY.armorDark
  c.lineWidth = 0.7
  line(c, 18.5, 5, 23, 3.5)
  line(c, 25, 4, 30, 2.8)
  line(c, 16.5, 9, 18.5, 12)
  c.strokeStyle = BODY.crack
  c.lineWidth = 0.8
  line(c, 26.6, 15.6, 27.8, 17.8)
  line(c, 31, 15.4, 31.6, 17)
  line(c, 25.5, 9.8, 26.2, 11.2)
  c.restore()
  // Stern brow; a burning eye.
  c.save()
  c.lineWidth = 1.2
  line(c, 26.5, 11.3, 31, 11.9)
  if (seated) {
    c.beginPath()
    c.arc(29, 13.2, 1.8, 0.2, Math.PI - 0.2) // eyes closed
    c.stroke()
  } else {
    ellipse(c, 29, 13.8, 1.9, 1.3, '#fff')
    c.fillStyle = '#e8501e'
    c.beginPath()
    c.arc(29.6, 13.8, 1, 0, Math.PI * 2)
    c.fill()
  }
  c.lineWidth = 0.9
  line(c, 28.4, 18.4, 30.6, 18.2)
  c.restore()

  // Parry: the blazing forearm thrown up across his face to take the blow.
  if (pose === 'parry') {
    arm([31.2, 20, 33.4, 12.5], 28.5, 23.5, 33, 22.5, 35.2, 11, 31.4, 10.6, 29.5, 17)
    fist(33.4, 9.8)
  }
}

export type MengForm = 'devil' | 'thunder' | 'body'

export function buildMengChuanSprite(color?: string, pose: MengPose = 'ready', step?: number, form: MengForm = 'devil') {
  // Team colour is his belt sash.
  const draw = form === 'body' ? (c: C) => drawMengBody(c, pose, step) : (c: C) => drawMengChuan(c, pose, step, form === 'thunder')
  return buildSprite(draw, color, [15, pose === 'meditate' ? 30.5 : 26.5, 18])
}

// Divine Thunder Slash (神雷斩), the Thunder Saint's ultimate, once per fight: the first time he drops below `health`
// of his HP the battle stops to watch (it waits for a Lightning Step to end). Times are seconds from that moment.
// He jumps to the centre of the field by `jump` (an arc `peak` px high) and rises to hover `hover` px up by `rise`.
// Behind him a door of black smoke gathers over `door`, eagle eyes on it open and blaze over `eyes`, and it swings
// open over `open` in a flash that lights up the whole field, on his lightning god seated behind it. Through
// `storm` lightning rains on the field and strikes each enemy once for `strike` damage; from `grab` a bolt falls into
// his raised hand, and at `slashAt` he cuts toward the thickest group (the enemy with the most others within `crowd` px). Door and god dissolve into smoke from `fade`;
// he lands at `end`. Every enemy stands frozen in shock until the cut; he is untouchable throughout. The crescent
// flies `wave.speed` px/s and grows `wave.grow` px/s until it leaves the field, hitting each enemy it crosses once.
// The name hangs beside it for `title` s. The god is drawn `scale` times its design size.
export const MENG_GOD = {
  health: 0.25, jump: 0.5, peak: 60, rise: 1.4, hover: 40,
  door: [1, 2], eyes: [2, 2.5], open: [2.5, 3.2], storm: [3.2, 4.4], grab: 4.4, slashAt: 4.8, fade: 5.4, end: 6.2,
  strike: 20, crowd: 160, title: 2.4, scale: 1.5,
  wave: { speed: 420, grow: 320, start: 40, span: 1.1, thick: 0.32, damage: 200, knockback: 480, stun: 1 },
} as const
export const MENG_GOD_TITLE = '神雷斩'

const BRUSH_FONT = 'KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif'
const DOOR_W = 170, DOOR_H = 230, ARCH_R = DOOR_W / 2, SPRING = DOOR_H - ARCH_R // the fire door, px
const FIRE = ['255,90,20', '255,170,40', '200,40,16', '255,210,90', '60,16,12'] // its fire puffs, red to gold with some smoke

// A soft puff of smoke, ink unless `rgb` says otherwise.
function puff(c: C, x: number, y: number, r: number, alpha: number, rgb = '18,16,24') {
  const g = c.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `rgba(${rgb},${alpha})`)
  g.addColorStop(0.6, `rgba(${rgb},${alpha * 0.6})`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  c.fillStyle = g
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}

// The door's arched outline, ground centre at (0, 0), `inset` px in from its edge.
function archPath(c: C, inset = 0) {
  const r = ARCH_R - inset
  c.beginPath()
  c.moveTo(-r, 0)
  c.lineTo(-r, -SPRING)
  c.arc(0, -SPRING, r, Math.PI, 0)
  c.lineTo(r, 0)
}

// A point `u` (0..1) of the way round the outline, up the left side, over the arch and down the right.
function archPoint(u: number): [number, number] {
  const s = u * (2 * SPRING + Math.PI * ARCH_R)
  if (s < SPRING) return [-ARCH_R, -s]
  if (s < SPRING + Math.PI * ARCH_R) {
    const a = Math.PI + (s - SPRING) / ARCH_R
    return [Math.cos(a) * ARCH_R, -SPRING + Math.sin(a) * ARCH_R]
  }
  return [ARCH_R, -SPRING + s - SPRING - Math.PI * ARCH_R]
}

// The left leaf: hinged on the left, meeting its twin at x = 0.
function leafPath(c: C) {
  const r = ARCH_R - 6
  c.beginPath()
  c.moveTo(-r, 0)
  c.lineTo(-r, -SPRING)
  c.arc(0, -SPRING, r, Math.PI, Math.PI * 1.5)
  c.lineTo(0, 0)
  c.closePath()
}

// One blazing eye at (x, y) on the left leaf, its hooked inner corner toward the seam (+x): a glowing blue rim and a
// sweeping brow of blue fire, the eye opening `open` (0..1) from shut (a thread of light between the lids), filled
// with nothing but blue-white light, no iris or pupil. Blue fire streams off its outer corner up and out, longer
// as it opens; `flare` throws it further.
function eagleEye(c: C, x: number, y: number, open: number, flare: number, tick: number) {
  const lid = () => {
    c.beginPath()
    c.moveTo(-17, -4)
    c.quadraticCurveTo(-3, -12, 12, 2)
    c.lineTo(17, 8) // the hook
    c.lineTo(10, 5)
    c.quadraticCurveTo(-2, 6, -17, -4)
    c.closePath()
  }
  c.save()
  c.translate(x, y)
  c.rotate(0.2) // the inner corner dips toward the seam: a glare
  const reach = Math.max(flare, open * 0.75)
  if (reach > 0) for (let k = 0; k < 3; k++) { // blue fire tongues streaming off the outer corner, up and out
    const len = (40 + 16 * k) * reach, wave = Math.sin(tick * 0.12 + k * 2) * 4
    c.save()
    c.globalAlpha *= reach * (1 - k * 0.25)
    c.shadowColor = '#4dc8ff'
    c.shadowBlur = 14
    const trail = c.createLinearGradient(-15, 0, -15 - len, -len * 0.7)
    trail.addColorStop(0, '#e8faff')
    trail.addColorStop(0.4, '#5ab4ff')
    trail.addColorStop(1, 'rgba(40,80,255,0)')
    c.fillStyle = trail
    c.beginPath()
    c.moveTo(-14, -7 + k * 2)
    c.quadraticCurveTo(-15 - len * 0.5, -6 - len * 0.2 + wave - k * 4, -15 - len, -len * 0.7 - k * 6 + wave)
    c.quadraticCurveTo(-15 - len * 0.45, -len * 0.15 + wave + k * 3, -14, 0 + k)
    c.fill()
    c.restore()
  }
  c.save()
  c.scale(1, 0.05 + 0.95 * open)
  lid()
  c.save()
  c.clip()
  const light = c.createRadialGradient(0, -1, 0, 0, -1, 17)
  light.addColorStop(0, '#ffffff')
  light.addColorStop(0.4, '#c8f2ff')
  light.addColorStop(1, '#3a8cff')
  c.fillStyle = light
  c.shadowColor = '#4dc8ff'
  c.shadowBlur = 12 * open
  c.fillRect(-20, -14, 40, 24)
  c.restore()
  c.save() // its glow spilling past the lids
  c.globalCompositeOperation = 'lighter'
  c.globalAlpha *= open * 0.5
  c.shadowColor = '#6fd8ff'
  c.shadowBlur = 16
  c.fillStyle = 'rgba(120,210,255,.5)'
  lid()
  c.fill()
  c.restore()
  c.strokeStyle = '#2a4cff'
  c.shadowColor = '#4dc8ff'
  c.shadowBlur = 8
  c.lineWidth = 2.2
  lid()
  c.stroke()
  c.restore()
  // The brow: a tapered sweep of blue fire over the eye, rising toward its outer corner, blazing once it opens.
  c.shadowColor = '#4dc8ff'
  c.shadowBlur = 10 * open
  const brow = c.createLinearGradient(18, 0, -30, 0)
  brow.addColorStop(0, '#1a2a8a')
  brow.addColorStop(1, open > 0 ? '#9fe0ff' : '#1a2a8a')
  c.fillStyle = brow
  c.beginPath()
  c.moveTo(18, -3)
  c.quadraticCurveTo(-2, -18, -32, -22)
  c.quadraticCurveTo(-4, -13, 18, -3)
  c.fill()
  c.restore()
}

// Behind him, at the ground point (x, y) under him `time` s into the ultimate: fire rises off the ground and climbs,
// a billowing front, into a tall arched double door that is a colossal face of fire and lightning: deep blue leaves
// fading to embers, veined with flame, a fire spiral on each side of the forehead, flame wings sweeping up and out
// from its sides, lightning crackling through the fire, and light glowing blue to orange along its edges and seam.
// Big blazing eyes appear shut on its leaves under brows of blue fire, with a blue flame on the seam between them,
// then open on blue-white light streaming blue fire; the leaves swing apart (squashing toward their hinges) and gold light floods out
// onto his lightning god, seated behind it and towering over it. From `fade` it all dissolves into smoke. In front
// of the door, under him while he hovers `lift` px up: a gold ring, falling ink motes, and his sash and hair lifting.
export function drawMengGod(c: C, x: number, y: number, time: number, tick: number, lift: number) {
  const G = MENG_GOD
  const form = clamp01((time - G.door[0]) / (G.door[1] - G.door[0])), gone = clamp01((time - G.fade) / (G.end - G.fade))
  const eyes = ease((time - G.eyes[0]) / (G.eyes[1] - G.eyes[0])), open = ease((time - G.open[0]) / (G.open[1] - G.open[0]))
  const flare = clamp01(1 - Math.abs(time - G.eyes[1]) / 0.3), surge = clamp01(1 - Math.abs(time - G.slashAt) / 0.35)
  c.save()
  c.translate(x, y)
  c.lineJoin = c.lineCap = 'round'
  if (form > 0 && gone < 1) {
    c.save()
    c.translate(0, -6) // just behind him
    c.globalAlpha = 1 - gone
    // The smoke rises from the ground: the door exists only below its rising front.
    const rise = ease(form), front = 10 - (DOOR_H + 40) * rise, solid = ease(form / 0.4) * (1 - gone)
    const belowFront = () => {
      c.beginPath()
      c.rect(-DOOR_W, front, DOOR_W * 2, DOOR_H + 60)
      c.clip()
    }
    // Fire boiling up its sides and off its base the whole time it stands, red and orange with darker smoke.
    for (let i = 0; i < 24; i++) {
      const u = (tick * 0.01 + rand(i, 31)) % 1, side = i % 2 ? 1 : -1
      const sx = i < 18 ? side * (ARCH_R + rand(i, 32) * 40) : (rand(i, 32) - 0.5) * DOOR_W
      puff(c, sx + Math.sin(u * 6 + i) * 6, 6 - u * (DOOR_H + 40) * Math.max(rise, 0.3), 10 + u * 20,
        0.5 * Math.sin(u * Math.PI) * Math.min(1, form * 3), FIRE[i % FIRE.length])
    }
    // Flame wings sweeping up and out from its sides past the top of the arch, orange outside, blue along the rim.
    const wings = ease((form - 0.3) / 0.7) * (1 - gone)
    if (wings > 0) for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
      const sway = Math.sin(tick * 0.05 + k * 1.3 + side) * 6, reach = (1 - k * 0.22) * wings
      const x0 = side * (ARCH_R - 4), y0 = -SPRING * (0.15 + k * 0.25)
      const tx = side * (ARCH_R + 70 + 20 * k) * reach + sway, ty = -DOOR_H - (40 - 10 * k) * reach + sway
      const wing = c.createLinearGradient(x0, y0, tx, ty)
      wing.addColorStop(0, 'rgba(255,90,20,.9)')
      wing.addColorStop(0.6, 'rgba(255,190,50,.75)')
      wing.addColorStop(1, 'rgba(255,240,170,0)')
      c.fillStyle = wing
      c.beginPath()
      c.moveTo(x0, y0)
      c.quadraticCurveTo(side * (ARCH_R + 50) * reach, y0 - 40, tx, ty)
      c.quadraticCurveTo(side * (ARCH_R + 10), y0 - 70 * reach, x0, y0 - 30)
      c.fill()
      c.strokeStyle = `rgba(110,170,255,${0.8 * reach})` // the blue inner rim
      c.lineWidth = 2
      c.stroke()
    }
    // The light inside, the god behind it, and the light pouring out onto the ground.
    if (open > 0) {
      c.save()
      archPath(c, 6)
      c.closePath()
      const light = c.createRadialGradient(0, -DOOR_H * 0.45, 8, 0, -DOOR_H * 0.45, DOOR_H * 0.7)
      light.addColorStop(0, `rgba(255,248,210,${open})`)
      light.addColorStop(0.4, `rgba(255,200,80,${0.85 * open})`)
      light.addColorStop(1, `rgba(190,100,30,${0.6 * open})`)
      c.fillStyle = light
      c.fill()
      c.restore()
      drawMengAvatar(c, ease((time - G.open[0] - 0.05) / 0.35), surge, tick) // revealed in the flash, towering over the door
      const pool = c.createRadialGradient(0, 10, 0, 0, 10, DOOR_W)
      pool.addColorStop(0, `rgba(255,214,110,${0.55 * open})`)
      pool.addColorStop(1, 'rgba(255,170,50,0)')
      c.fillStyle = pool
      c.beginPath()
      c.ellipse(0, 10, DOOR_W * open, 30, 0, 0, Math.PI * 2)
      c.fill()
    }
    // The two leaves, the dark of the face, deep blue fading to embers at the base, narrowing toward their hinges as they swing open. No frame.
    const squash = 1 - 0.88 * open
    const leaf = (side: number) => { // the left leaf as is, the right one mirrored
      c.scale(-side, 1)
      c.translate(-ARCH_R, 0)
      c.scale(squash, 1)
      c.translate(ARCH_R, 0)
    }
    c.save()
    belowFront()
    for (const side of [-1, 1]) {
      c.save()
      leaf(side)
      c.globalAlpha = 0.9 * solid
      const ink = c.createLinearGradient(0, -DOOR_H, 0, 0)
      ink.addColorStop(0, '#080a24')
      ink.addColorStop(0.55, '#1a1450')
      ink.addColorStop(1, '#5a1608')
      c.fillStyle = ink
      leafPath(c)
      c.fill()
      // Orange flame veins curling up through it, and a fire spiral on the forehead above the eye.
      c.globalAlpha = solid
      c.strokeStyle = '#ff7a24'
      c.shadowColor = '#ff5a10'
      c.shadowBlur = 8
      c.lineWidth = 2
      for (let k = 0; k < 4; k++) {
        const vx = -ARCH_R + 18 + k * 16, wave = Math.sin(tick * 0.06 + k) * 4
        c.beginPath()
        c.moveTo(vx, -10)
        c.bezierCurveTo(vx + 14 + wave, -SPRING * 0.4, vx - 10 - wave, -SPRING * 0.7, vx + 8, -SPRING * (0.9 - k * 0.04))
        c.stroke()
      }
      c.lineWidth = 2.6
      c.beginPath()
      for (let a = 0; a < Math.PI * 4; a += 0.2) { // a spiral of fire, clear of the seam and the brow
        const r = 2 + a * 1.4
        c.lineTo(-24 + Math.cos(a + tick * 0.03) * r, -SPRING - 52 + Math.sin(a + tick * 0.03) * r)
      }
      c.stroke()
      c.restore()
    }
    c.restore()
    // Smoke puffs rising off the ground into the outline and the leaves, the low ones settling first, drifting off
    // as it dissolves.
    const leafEdge = ARCH_R - 6
    for (let i = 0; i < 88; i++) {
      let tx: number, ty: number
      if (i < 48) [tx, ty] = archPoint(i / 47)
      else { // inside a leaf, squashed with it
        const side = i % 2 ? 1 : -1, lx = rand(i, 1) * leafEdge, ly = -rand(i, 2) * SPRING
        tx = side * (leafEdge - lx * squash)
        ty = ly
      }
      const delay = -ty / (DOOR_H + 10) * 0.5 + rand(i, 3) * 0.1, p = ease((form - delay) / 0.4)
      if (p <= 0) continue
      const sx = tx + (rand(i, 4) - 0.5) * 40, sy = 8
      const drift = Math.sin(tick * 0.03 + i) * 2 + Math.sin(p * Math.PI) * (rand(i, 5) - 0.5) * 50 // swirling as it climbs
      const px = sx + (tx - sx) * p + drift + (rand(i, 6) - 0.5) * 60 * gone
      const py = sy + (ty - sy) * p - gone * (30 + 50 * rand(i, 7))
      puff(c, px, py, (i < 48 ? 10 : 15) + rand(i, 8) * 8 + gone * 12, 0.55 * p, i < 48 ? FIRE[i % FIRE.length] : '14,14,44')
    }
    // The rising front: a billowing band of fire climbing up it.
    const climbing = 1 - ease((form - 0.85) / 0.15)
    if (climbing > 0) for (let i = 0; i < 13; i++) {
      const fx = -ARCH_R - 20 + (DOOR_W + 40) * i / 12, fy = front + Math.sin(tick * 0.08 + i * 1.7) * 6
      puff(c, fx, fy, 16 + rand(i, 41) * 10, 0.6 * climbing, FIRE[i % FIRE.length])
    }
    // The eyes, one on each leaf, on top of the smoke: shut as the door finishes forming, then opening wide.
    const shown = ease((form - 0.6) / 0.4) * (1 - gone)
    if (shown > 0) for (const side of [-1, 1]) {
      c.save()
      leaf(side)
      c.globalAlpha = shown
      c.translate(-41, -SPRING + 4)
      c.scale(2.1, 2.1) // big, filling the top of the leaf
      eagleEye(c, 0, 0, eyes, flare, tick)
      c.restore()
    }
    // A blue flame burning on the seam between the eyes, white at its heart, guttering out as the leaves part.
    const third = shown * (1 - open)
    if (third > 0) {
      const fy = -SPRING + 20, h = 46 + Math.sin(tick * 0.2) * 5
      c.save()
      c.globalAlpha = third
      c.shadowColor = '#4dc8ff'
      c.shadowBlur = 18
      for (const [w, color] of [[11, '#2a6cff'], [5, '#bfeaff'], [2, '#ffffff']] as const) {
        c.fillStyle = color
        c.beginPath()
        c.moveTo(0, fy - h * (w / 11 * 0.4 + 0.6))
        c.quadraticCurveTo(w, fy - h * 0.3, 0, fy + w)
        c.quadraticCurveTo(-w, fy - h * 0.3, 0, fy - h * (w / 11 * 0.4 + 0.6))
        c.fill()
      }
      c.restore()
    }
    c.save()
    belowFront()
    // Fire wisps curling off its edges.
    c.strokeStyle = 'rgba(255,120,30,.7)'
    c.lineWidth = 2
    for (let k = 0; k < 9; k++) {
      const u = (tick * 0.006 + rand(k, 9)) % 1, [wx, wy] = archPoint(rand(k, 10)), out = wx < 0 ? -1 : 1
      c.globalAlpha = form * (1 - gone) * Math.sin(u * Math.PI)
      c.beginPath()
      c.moveTo(wx, wy)
      c.quadraticCurveTo(wx + out * 20 * u, wy - 14 * u, wx + out * (14 + 10 * u), wy - 30 * u)
      c.arc(wx + out * (14 + 10 * u) - out * 4, wy - 30 * u, 4, 0, Math.PI * 1.5 * out, out < 0)
      c.stroke()
    }
    c.globalAlpha = 1
    // Light glowing along its edges and down the seam where the leaves meet: electric blue over the brow, burning
    // to gold and orange toward the base.
    c.globalAlpha = ease((form - 0.5) / 0.5) * (1 - gone)
    const edge = c.createLinearGradient(0, -DOOR_H, 0, 0)
    edge.addColorStop(0, '#bfeaff')
    edge.addColorStop(0.3, '#3a7cff')
    edge.addColorStop(0.65, '#ffb020')
    edge.addColorStop(1, '#ff5a1e')
    c.strokeStyle = edge
    c.shadowColor = '#ff8a20'
    c.shadowBlur = 16
    c.lineWidth = 2.6
    archPath(c)
    c.stroke()
    const gap = leafEdge * (1 - squash), seamTop = -SPRING - Math.sqrt(Math.max(0, leafEdge ** 2 - gap ** 2))
    for (const [width, alpha] of [[8, 0.35], [3, 1]] as const) { // a soft halo, then the line
      c.save()
      c.globalAlpha *= alpha
      c.lineWidth = width
      line(c, -gap, 0, -gap, seamTop)
      if (gap > 1) line(c, gap, 0, gap, seamTop)
      c.restore()
    }
    c.restore() // below the front
    // Lightning crackling up through the fire at its sides, each bolt flickering on and off.
    c.shadowColor = '#ffd23a'
    c.shadowBlur = 10
    for (let k = 0; k < 6; k++) {
      const seed = k * 7 + Math.floor(tick / 5), side = k % 2 ? 1 : -1
      if (rand(seed, 51) < 0.45) continue
      const bx = side * (ARCH_R + 6 + rand(seed, 52) * 50), by = -rand(seed, 53) * SPRING
      c.save()
      c.globalAlpha = ease((form - 0.5) / 0.5) * (1 - gone) * 0.85
      jagged(c, bx, by, bx + side * (20 + rand(seed, 54) * 40), by - 30 - rand(seed, 55) * 60, seed, 14, 1.6)
      c.restore()
    }
    // Shafts of light thrown out of the opening.
    if (open > 0) {
      c.globalCompositeOperation = 'lighter'
      c.shadowBlur = 0
      c.fillStyle = 'rgba(255,190,80,.16)'
      c.globalAlpha = open * (1 - gone)
      for (let k = 0; k < 5; k++) {
        const a = Math.PI * (0.28 + 0.11 * k) + Math.sin(tick * 0.02 + k) * 0.04
        c.beginPath()
        c.moveTo(-gap * 0.6, -SPRING * 0.6)
        c.lineTo(gap * 0.6, -SPRING * 0.6)
        c.lineTo(Math.cos(a + 0.05) * 260, -SPRING * 0.6 + Math.sin(a + 0.05) * 260)
        c.lineTo(Math.cos(a - 0.05) * 260, -SPRING * 0.6 + Math.sin(a - 0.05) * 260)
        c.fill()
      }
    }
    c.restore()
  }
  // Levitating: a gold ring under his feet, ink motes falling from it, his sash and hair lifting.
  if (lift > 1) {
    const up = clamp01(lift / G.hover)
    c.save()
    c.translate(0, -lift + 2)
    c.globalAlpha = up
    c.strokeStyle = 'rgba(20,16,24,.5)'
    c.lineWidth = 4
    c.beginPath()
    c.ellipse(0, 0, 24 + 2 * Math.sin(tick * 0.1), 6.5, 0, 0, Math.PI * 2)
    c.stroke()
    c.strokeStyle = '#ffd23a'
    c.shadowColor = '#ffb020'
    c.shadowBlur = 10
    c.lineWidth = 1.6
    c.stroke()
    c.setLineDash([5, 4])
    c.lineDashOffset = -tick * 0.4
    c.beginPath()
    c.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2)
    c.stroke()
    c.setLineDash([])
    c.shadowBlur = 0
    c.fillStyle = INK
    for (let k = 0; k < 10; k++) {
      const u = (tick * 0.012 + rand(k, 11)) % 1
      c.globalAlpha = up * (1 - u) * 0.7
      c.beginPath()
      c.arc((rand(k, 12) - 0.5) * 40, u * lift, 1 + rand(k, 13) * 1.6, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = up
    for (const side of [-1, 1]) {
      const sway = Math.sin(tick * 0.09 + side) * 5
      c.beginPath() // the sash
      c.moveTo(side * 4, -18)
      c.bezierCurveTo(side * 16, -26, side * 4, -42 + sway, side * 18 + sway, -60)
      c.strokeStyle = INK
      c.lineWidth = 4.6
      c.stroke()
      c.strokeStyle = '#f4f1ea'
      c.lineWidth = 3
      c.stroke()
      c.strokeStyle = '#e8c25a'
      c.lineWidth = 0.9
      c.stroke()
      for (let k = 0; k < 2; k++) { // hair strands rising off his head
        c.beginPath()
        c.moveTo(side * (2 + k * 3), -50)
        c.quadraticCurveTo(side * (4 + k * 4) + sway * 0.4, -58, side * (3 + k * 6) - sway * 0.3, -66 - k * 3)
        c.strokeStyle = INK
        c.lineWidth = 3
        c.stroke()
        c.strokeStyle = '#f4f0f6'
        c.lineWidth = 1.6
        c.stroke()
      }
    }
    c.restore()
  }
  c.restore()
}

// The divine lightning emperor (ground point at the origin), seated behind the door and towering over it, painted in
// ink over a bronze-gold wash: a majestic god on a stone seat, at his ease and menacing. He leans to the left
// onto his left knee, drawn up with the foot on the seat's edge, his arm braced on it and the hand gripping the knee;
// the right leg is planted, the right forearm rests on that knee and the fist grips a lightning spear. A gold halo
// rimmed in flame behind his head, a red celestial scarf arching over it and streaming down both sides, dark curling
// hair under a flame-peaked gold crown. Ornate armour: rounded layered pauldrons and a gold breastplate with a round
// mirror over the heart, all with gold filigree. His head is drawn larger so the face reads: ears with gold rings,
// modelled sockets, cheekbones and hollows, a red flame mark pulsing on his brow, tapered brows (one arched), and no
// nose, mouth or beard: nothing on his face but heavy-lidded eyes burning red round a white-hot core; their outer
// corners pulse, a glint streaks across each, light runs back from them toward the temples and red vapour pours off.
// Gold lightning veins on his arms. A furnace of red cloud behind him, smoke and lightning round him; he breathes
// slowly.
// `appear` fades him in; `surge` (0..1) is the cut, when his eyes and lightning flare.
function drawMengAvatar(c: C, appear: number, surge: number, tick: number) {
  if (appear <= 0) return
  const flick = Math.floor(tick / 3), k = MENG_GOD.scale, MUSCLE = 'rgba(70,24,12,.65)', HAIR = '#3a1e16'
  const breath = 1 + 0.014 * Math.sin(tick * 0.035), pulse = 0.5 + 0.5 * Math.sin(tick * 0.12)
  // His upper body leans left, pivoting at the waist, and breathes.
  const lean = () => {
    c.translate(0, -64)
    c.rotate(-0.13)
    c.scale(1, breath)
    c.translate(0, 64)
  }
  c.save()
  c.scale(k, k)
  c.globalAlpha *= appear
  c.lineJoin = c.lineCap = 'round'
  // The furnace of red cloud behind him, smoke rising through it.
  const furnace = c.createRadialGradient(0, -110, 10, 0, -110, 160)
  furnace.addColorStop(0, 'rgba(255,190,100,.8)')
  furnace.addColorStop(0.45, 'rgba(210,80,30,.5)')
  furnace.addColorStop(1, 'rgba(120,20,10,0)')
  c.fillStyle = furnace
  c.beginPath()
  c.arc(0, -110, 160, 0, Math.PI * 2)
  c.fill()
  for (let i = 0; i < 16; i++) {
    const u = (tick * 0.006 + rand(i, 21)) % 1, x = (rand(i, 22) - 0.5) * 220, y = -40 - rand(i, 23) * 130 - u * 50
    puff(c, x, y, 18 + u * 22, 0.5 * Math.sin(u * Math.PI), i % 3 ? '120,30,18' : '16,14,22')
  }
  c.shadowColor = '#ffb020'
  c.shadowBlur = 10
  for (let i = 0; i < 4 + Math.round(surge * 4); i++) { // lightning crackling behind his shoulders
    const side = i % 2 ? 1 : -1, a = -Math.PI / 2 + side * (0.5 + rand(flick, i) * 0.9)
    jagged(c, side * 60, -130, side * 60 + Math.cos(a) * (70 + rand(flick, i + 9) * 40), -130 + Math.sin(a) * 60, flick * 7 + i, 10, 1.3)
  }
  c.shadowBlur = 0
  // The stone seat.
  c.strokeStyle = INK
  c.lineWidth = 1.6
  poly(c, '#1c1519', -82, 0, -78, -56, -64, -70, 64, -70, 78, -56, 82, 0)
  c.strokeStyle = 'rgba(255,170,70,.6)'
  c.lineWidth = 1
  line(c, -76, -56, -62, -66, 62, -66, 76, -56)
  const skin = c.createLinearGradient(0, -165, 0, 0)
  skin.addColorStop(0, '#ffdcae')
  skin.addColorStop(0.3, '#eba062')
  skin.addColorStop(0.65, '#b85a30')
  skin.addColorStop(1, '#6a2618')
  const bronze = c.createLinearGradient(0, -165, 0, 0)
  bronze.addColorStop(0, '#d8a050')
  bronze.addColorStop(0.5, '#9a5e2c')
  bronze.addColorStop(1, '#3a2018')
  const gilt = c.createLinearGradient(0, -150, 0, -100)
  gilt.addColorStop(0, '#fff0b0')
  gilt.addColorStop(0.5, '#f2c050')
  gilt.addColorStop(1, '#b8742a')
  const gold = (...points: number[]) => {
    c.save()
    c.strokeStyle = '#ffd56a'
    c.lineWidth = 1
    line(c, ...points)
    c.restore()
  }
  const spiral = (x: number, y: number, r: number, dir: number) => { // a filigree curl
    c.save()
    c.strokeStyle = '#ffd56a'
    c.lineWidth = 0.9
    c.beginPath()
    for (let i = 0; i <= 14; i++) {
      const a = dir * i * 0.55, rr = r * (1 - i / 18)
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
    }
    c.stroke()
    c.restore()
  }
  c.strokeStyle = INK
  c.lineWidth = 1.6
  // The right leg planted: greave, foot, thigh and knee guard.
  poly(c, bronze, 44, -58, 64, -58, 60, -8, 42, -8)
  gold(46, -48, 62, -48)
  gold(45, -28, 61, -28)
  poly(c, '#2a1a1c', 36, -8, 64, -8, 72, 0, 32, 0)
  poly(c, skin, 8, -62, 30, -72, 58, -78, 74, -66, 64, -52, 14, -52)
  ellipse(c, 60, -60, 12, 10, '#9a5e2c')
  spiral(60, -60, 6, 1)
  // The left leg drawn up, its foot on the seat's edge and the knee high.
  poly(c, bronze, -70, -86, -48, -86, -50, -70, -68, -70)
  gold(-67, -79, -51, -79)
  poly(c, '#2a1a1c', -76, -72, -46, -72, -43, -64, -79, -64)
  poly(c, skin, -8, -62, -28, -76, -48, -94, -72, -98, -78, -84, -60, -76, -16, -52)
  ellipse(c, -60, -88, 13, 11, '#9a5e2c')
  spiral(-60, -88, 6.5, -1)
  // The layered war-skirt between his knees, edged gold.
  poly(c, '#7a1a1a', -22, -66, 22, -66, 17, -30, 7, -35, 0, -22, -7, -35, -17, -30)
  poly(c, '#a8321e', -16, -66, 16, -66, 11, -44, 0, -38, -11, -44)
  gold(-17, -31, -7, -36, 0, -23, 7, -36, 17, -31)
  gold(-11, -44, 0, -38, 11, -44)
  // Leaning: the halo, the scarf arching over it, the hair, the torso, the breastplate, the belt.
  c.save()
  lean()
  const halo = c.createRadialGradient(0, -142, 20, 0, -142, 62)
  halo.addColorStop(0, 'rgba(255,240,180,.55)')
  halo.addColorStop(1, 'rgba(255,170,60,0)')
  c.fillStyle = halo
  c.beginPath()
  c.arc(0, -142, 62, 0, Math.PI * 2)
  c.fill()
  c.shadowColor = '#ffb020'
  c.shadowBlur = 12
  c.strokeStyle = '#ffd56a'
  c.lineWidth = 2.6
  c.beginPath()
  c.arc(0, -142, 40, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = '#ffb040'
  for (let i = 0; i < 16; i++) { // small flames round the ring
    const a = i / 16 * Math.PI * 2, h = 6 + 3 * Math.sin(tick * 0.15 + i * 1.9)
    c.beginPath()
    c.moveTo(Math.cos(a - 0.08) * 41, -142 + Math.sin(a - 0.08) * 41)
    c.lineTo(Math.cos(a) * (41 + h), -142 + Math.sin(a) * (41 + h))
    c.lineTo(Math.cos(a + 0.08) * 41, -142 + Math.sin(a + 0.08) * 41)
    c.fill()
  }
  c.shadowBlur = 0
  const scarf = (path: () => void) => {
    path()
    c.strokeStyle = INK
    c.lineWidth = 7.5
    c.stroke()
    c.strokeStyle = '#c8231e'
    c.lineWidth = 5.5
    c.stroke()
    c.strokeStyle = '#ffd56a'
    c.lineWidth = 0.9
    c.stroke()
  }
  const wave = Math.sin(tick * 0.04)
  scarf(() => {
    c.beginPath()
    c.moveTo(-50, -126)
    c.bezierCurveTo(-96, -204, 96, -204, 50, -126)
  })
  for (const s of [-1, 1]) {
    scarf(() => {
      c.beginPath()
      c.moveTo(s * 50, -126)
      c.bezierCurveTo(s * (108 + 6 * wave), -110, s * (92 - 8 * wave), -60, s * (104 + 6 * wave), -14)
    })
  }
  // Dark curling hair behind his head and falling to his shoulders.
  c.strokeStyle = INK
  c.lineWidth = 1.4
  poly(c, HAIR, -22, -156, 22, -156, 28, -140, 30, -122, 22, -116, 14, -128, -14, -128, -22, -116, -30, -122, -28, -140)
  c.save()
  c.strokeStyle = 'rgba(255,190,110,.45)'
  c.lineWidth = 1
  for (const s of [-1, 1]) for (const yy of [-146, -134, -124]) {
    c.beginPath()
    c.arc(s * 25, yy, 3, 0, Math.PI * 1.4)
    c.stroke()
  }
  c.restore()
  c.strokeStyle = INK
  c.lineWidth = 1.6
  c.shadowColor = '#ff8a2a'
  c.shadowBlur = 10
  poly(c, skin, -26, -64, 26, -64, 42, -96, 60, -120, 44, -140, 16, -138, -16, -138, -44, -140, -60, -120, -42, -96)
  c.shadowBlur = 0
  c.strokeStyle = 'rgba(60,18,8,.3)'
  c.lineWidth = 6
  line(c, -36, -110, -40, -96, -26, -70)
  line(c, 36, -110, 40, -96, 26, -70)
  c.strokeStyle = MUSCLE
  c.lineWidth = 1.3
  for (const yy of [-96, -86, -76]) {
    line(c, -11, yy, -1, yy + 1.5)
    line(c, 11, yy, 1, yy + 1.5)
  }
  line(c, 0, -104, 0, -70)
  // The breastplate: gold over the chest, curls of filigree, a round mirror over the heart.
  c.strokeStyle = INK
  c.lineWidth = 1.5
  poly(c, gilt, -44, -138, -16, -136, 0, -131, 16, -136, 44, -138, 40, -122, 20, -107, 0, -111, -20, -107, -40, -122)
  spiral(-26, -122, 7, 1)
  spiral(26, -122, 7, -1)
  gold(-40, -125, -20, -110, 0, -114, 20, -110, 40, -125)
  const mirror = c.createRadialGradient(-2, -122, 1, 0, -120, 9)
  mirror.addColorStop(0, '#fff8d8')
  mirror.addColorStop(1, '#a8682a')
  c.lineWidth = 1.2
  c.fillStyle = mirror
  c.beginPath()
  c.arc(0, -120, 9, 0, Math.PI * 2)
  c.fill()
  c.stroke()
  c.strokeStyle = '#ffd56a'
  c.beginPath()
  c.arc(0, -120, 6.5, 0, Math.PI * 2)
  c.stroke()
  ellipse(c, 0, -120, 2, 2, '#d8231e')
  c.strokeStyle = INK
  poly(c, '#2a1a1c', -27, -71, 27, -71, 26, -62, -26, -62)
  ellipse(c, 0, -66.5, 6, 6, '#f2c050')
  line(c, 1.5, -71, -1.5, -66.5, 1.5, -66.5, -1.5, -62)
  c.restore()
  // The left arm braced on the raised knee: elbow out, forearm across the knee, the hand gripping it.
  c.lineWidth = 1.6
  poly(c, skin, -58, -124, -80, -124, -102, -98, -90, -88, -78, -100, -62, -104)
  poly(c, skin, -100, -100, -92, -88, -56, -91, -54, -104)
  poly(c, bronze, -84, -103, -70, -104, -70, -89, -84, -88.5)
  gold(-83, -100, -71, -100.5)
  gold(-83, -92, -71, -92.5)
  ellipse(c, -52, -97, 10, 9, '#d07040')
  c.strokeStyle = MUSCLE
  c.lineWidth = 1
  for (const fx of [-57, -52, -47]) line(c, fx, -93, fx - 0.5, -86) // fingers curled down over the knee
  line(c, -72, -118, -88, -104)
  // The right arm resting on the planted knee, the fist gripping the spear.
  c.strokeStyle = INK
  c.lineWidth = 1.6
  poly(c, skin, 40, -142, 66, -136, 86, -104, 80, -78, 62, -78, 54, -112)
  poly(c, skin, 84, -84, 66, -88, 42, -54, 56, -44)
  poly(c, bronze, 71, -63, 65, -54, 48, -66, 54, -74)
  gold(68, -60, 51, -70)
  ellipse(c, 48, -46, 10, 9, '#d07040')
  c.strokeStyle = MUSCLE
  c.lineWidth = 1
  line(c, 42, -50, 46, -40)
  line(c, 48, -52, 52, -42)
  line(c, 66, -126, 74, -102)
  // Gold lightning veins glowing on his arms, flickering.
  c.save()
  c.globalAlpha *= Math.min(1, 0.55 + 0.45 * rand(flick, 3) + surge * 0.3)
  c.strokeStyle = '#ffd25a'
  c.lineWidth = 0.9
  c.shadowColor = '#ffb020'
  c.shadowBlur = 6
  line(c, -68, -118, -84, -106, -90, -98)
  line(c, -98, -95, -88, -96)
  line(c, 68, -128, 76, -110, 70, -98, 76, -86)
  line(c, 76, -80, 64, -70, 60, -62)
  c.restore()
  // Leaning again: the pauldrons, then the head, tilted a little further.
  c.save()
  lean()
  c.strokeStyle = INK
  c.lineWidth = 1.5
  for (const s of [-1, 1]) {
    poly(c, bronze, s * 58, -124, s * 80, -128, s * 92, -112, s * 80, -106, s * 62, -114) // the lower plate
    gold(s * 62, -116, s * 80, -110, s * 90, -113)
    poly(c, gilt, s * 40, -142, s * 62, -149, s * 82, -140, s * 88, -124, s * 74, -118, s * 56, -126) // the upper plate
    spiral(s * 68, -135, 6, s)
    ellipse(c, s * 79, -128, 2.4, 2.4, '#d8231e')
  }
  c.translate(0, -136)
  c.rotate(-0.06)
  c.translate(0, 136)
  c.translate(0, -120) // the head drawn larger, so his face reads
  c.scale(1.3, 1.3)
  c.translate(0, 120)
  // Locks falling by his ears, the ears with gold rings, the face.
  c.strokeStyle = INK
  c.lineWidth = 1.1
  poly(c, HAIR, -17, -152, -24, -142, -23, -127, -17, -131)
  poly(c, HAIR, 17, -152, 24, -142, 23, -127, 17, -131)
  for (const s of [-1, 1]) {
    ellipse(c, s * 19, -136, 2.6, 4.6, '#e0965a')
    c.save()
    c.strokeStyle = '#ffd56a'
    c.lineWidth = 0.9
    c.beginPath()
    c.arc(s * 19.4, -129.6, 1.8, 0, Math.PI * 2)
    c.stroke()
    c.restore()
  }
  c.lineWidth = 1.3
  const head = [-15.5, -154, 15.5, -154, 18.5, -144, 18, -136, 16.5, -128, 12, -120, 6, -115.5, 0, -114.5, -6, -115.5, -12, -120,
    -16.5, -128, -18, -136, -18.5, -144]
  poly(c, skin, ...head)
  c.save()
  c.strokeStyle = 'rgba(0,0,0,0)'
  const brow = c.createLinearGradient(0, -154, 0, -138)
  brow.addColorStop(0, 'rgba(60,18,8,.35)')
  brow.addColorStop(1, 'rgba(60,18,8,0)')
  poly(c, brow, ...head)
  c.restore()
  // Modelling: sockets under the brow, hollows under the cheekbones, light on the cheekbones. No nose, no mouth:
  // nothing on his face but the eyes.
  c.save()
  c.fillStyle = 'rgba(70,20,10,.28)'
  for (const s of [-1, 1]) {
    c.beginPath()
    c.ellipse(s * 9.5, -137.6, 6.4, 3.4, 0, 0, Math.PI * 2)
    c.fill()
  }
  c.strokeStyle = 'rgba(70,20,10,.25)'
  c.lineWidth = 2.6
  line(c, -15, -131, -11.5, -123)
  line(c, 15, -131, 11.5, -123)
  c.strokeStyle = 'rgba(255,236,190,.55)'
  c.lineWidth = 1.4
  line(c, -15.5, -133, -10.5, -131.5)
  line(c, 15.5, -133, 10.5, -131.5)
  c.restore()
  // The divine mark on his brow: a small red flame, pulsing.
  c.save()
  c.shadowColor = '#ff2a10'
  c.shadowBlur = 4 + 6 * pulse
  c.fillStyle = '#e8281a'
  c.beginPath()
  c.moveTo(0, -151.5)
  c.quadraticCurveTo(2.2, -147.5, 0, -144)
  c.quadraticCurveTo(-2.2, -147.5, 0, -151.5)
  c.fill()
  c.fillStyle = '#ffd56a'
  c.fillRect(-0.4, -148.4, 0.8, 2.2)
  c.restore()
  // The flame-peaked gold crown on his topknot.
  c.lineWidth = 1
  ellipse(c, 0, -158, 9, 7, HAIR)
  poly(c, gilt, -15, -150, -19, -159, -12, -156, -9, -165, -5, -157, 0, -175, 5, -157, 9, -165, 12, -156, 19, -159, 15, -150)
  ellipse(c, 0, -157, 2.2, 2.6, '#d8231e')
  gold(-14, -152, 14, -152)
  // Tapered brows, one level and one arched, over heavy-lidded eyes burning red with a white-hot core.
  c.lineWidth = 0.8
  poly(c, HAIR, -18.5, -141.6, -12, -144.4, -3.8, -141.6, -4.4, -140, -12, -142.2, -18, -140)
  poly(c, HAIR, 18.5, -142.4, 12, -146, 3.8, -141.8, 4.4, -140.2, 12, -143.8, 18, -140.8)
  for (const s of [-1, 1]) {
    const eye = () => {
      c.beginPath()
      c.moveTo(s * 4, -137.6)
      c.quadraticCurveTo(s * 9, -140.2, s * 15, -138.6)
      c.quadraticCurveTo(s * 9.5, -135.4, s * 4, -137.6)
      c.closePath()
    }
    c.save()
    eye()
    c.shadowColor = '#ff2a10'
    c.shadowBlur = 8 + 14 * surge + 4 * pulse
    const burn = c.createRadialGradient(s * 9.5, -137.7, 0, s * 9.5, -137.7, 6)
    burn.addColorStop(0, '#ffffff')
    burn.addColorStop(0.3, '#ffd0a0')
    burn.addColorStop(0.65, '#ff4a1e')
    burn.addColorStop(1, '#a8100a')
    c.fillStyle = burn
    c.fill()
    c.restore()
    c.strokeStyle = INK
    c.lineWidth = 1.3
    c.beginPath() // the heavy upper lid
    c.moveTo(s * 3.6, -137.4)
    c.quadraticCurveTo(s * 9, -140.6, s * 15.4, -138.8)
    c.stroke()
    c.lineWidth = 0.6
    c.strokeStyle = MUSCLE
    c.beginPath() // the lower lid, and the crease above
    c.moveTo(s * 5, -136.8)
    c.quadraticCurveTo(s * 9.5, -135, s * 14.5, -138.2)
    c.stroke()
    c.beginPath()
    c.moveTo(s * 5, -139.6)
    c.quadraticCurveTo(s * 9.5, -141.8, s * 14, -140.4)
    c.stroke()
  }
  // The eyes' outer corners pulse red: a glint streaking across each eye, light running back toward the temples
  // and red vapour pouring off.
  for (const s of [-1, 1]) {
    const cx = s * 15, cy = -138.6, r = 4 + 4 * pulse + 4 * surge
    c.save()
    c.globalCompositeOperation = 'lighter'
    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, r)
    glow.addColorStop(0, `rgba(255,120,80,${0.7 + 0.3 * pulse})`)
    glow.addColorStop(1, 'rgba(255,30,10,0)')
    c.fillStyle = glow
    c.beginPath()
    c.arc(cx, cy, r, 0, Math.PI * 2)
    c.fill()
    const len = 10 + 8 * pulse + 10 * surge, glint = c.createLinearGradient(cx - len, cy, cx + len, cy)
    glint.addColorStop(0, 'rgba(255,60,30,0)')
    glint.addColorStop(0.5, `rgba(255,230,210,${0.6 + 0.4 * pulse})`)
    glint.addColorStop(1, 'rgba(255,60,30,0)')
    c.strokeStyle = glint
    c.lineWidth = 0.8
    line(c, cx - len, cy + 0.4, cx + len, cy - 0.4)
    c.restore()
    for (const [lift, width, dash] of [[0, 2.6, 0], [3, 1.2, 1], [-2.5, 1, 1]] as const) {
      const trail = () => {
        c.beginPath()
        c.moveTo(cx, cy)
        c.bezierCurveTo(s * 24, cy - 1 - lift, s * 32, cy - 6 - lift, s * (42 + 4 * pulse), cy - 14 - lift * 1.6)
      }
      c.save()
      c.shadowColor = '#ff2a10'
      c.shadowBlur = 6
      if (dash) {
        c.setLineDash([2.5, 3.5])
        c.lineDashOffset = -tick * 0.7 - lift * 3 // the light runs outward along it
      }
      trail()
      c.strokeStyle = dash ? '#ff9a6a' : `rgba(255,50,24,${0.3 + 0.25 * pulse})`
      c.lineWidth = width
      c.stroke()
      c.restore()
    }
    for (let j = 0; j < 5; j++) {
      const u = (tick * 0.022 + j / 5 + (s > 0 ? 0.1 : 0)) % 1
      puff(c, s * (17 + u * 22), cy - 2 - u * 18, 1.4 + u * 5, 0.55 * (1 - u) * (0.6 + 0.4 * pulse), j % 2 ? '255,70,40' : '200,30,20')
    }
  }
  c.restore()
  // The lightning spear in his right fist, arcs spitting off his fingers; more of it as Meng Chuan cuts.
  c.shadowColor = THUNDER_YELLOW
  c.shadowBlur = 12
  jagged(c, 36, -2, 62, -124, flick, 8, 2.4 + surge)
  for (let i = 0; i < 3 + Math.round(surge * 5); i++) {
    const a = rand(flick, i + 20) * Math.PI * 2, r = 14 + rand(flick, i + 30) * 24
    jagged(c, 48, -46, 48 + Math.cos(a) * r, -46 + Math.sin(a) * r, flick * 5 + i, 6, 1)
  }
  c.restore()
}

// The light the door lets out, over the whole `width`×`height` field from its ground point (x, y), `time` s into
// the ultimate: as it opens the whole screen goes white, holds, and fades away on the god, leaving a red-gold glow
// over everything while he sits there, gone as he dissolves.
export function drawMengGodLight(c: C, width: number, height: number, x: number, y: number, time: number) {
  const G = MENG_GOD, o = time - G.open[0]
  if (o <= 0) return
  const white = o < 0.3 ? o / 0.3 : o < 0.5 ? 1 : Math.max(0, 1 - (o - 0.5) / 0.8)
  const warm = Math.min(1, o / 0.3) * 0.25 * (1 - clamp01((time - G.fade) / 0.6))
  c.save()
  if (warm > 0) {
    const cy = y - DOOR_H * 0.45, R = Math.hypot(Math.max(x, width - x), Math.max(cy, height - cy)) + 20
    const g = c.createRadialGradient(x, cy, 0, x, cy, R)
    g.addColorStop(0, `rgba(255,240,200,${warm})`)
    g.addColorStop(0.3, `rgba(255,200,110,${warm * 0.8})`)
    g.addColorStop(1, `rgba(200,70,30,${warm * 0.7})`)
    c.fillStyle = g
    c.fillRect(-20, -20, width + 40, height + 40) // past the edges, for the screen shake
  }
  if (white > 0) {
    c.fillStyle = `rgba(255,255,255,${white})`
    c.fillRect(-20, -20, width + 40, height + 40)
  }
  c.restore()
}

// The storm and the grab, `time` s into the ultimate, over a `width`×`height` field: lightning `bolts` (each `time` s
// old) dropping from above the screen, each with a white flash and an ink splash where it lands; red ink spatter
// flicked across the field; and from `grab`, a bolt falling into his raised hand at (hx, hy).
export function drawMengStorm(c: C, width: number, height: number, time: number, tick: number,
  bolts: readonly { x: number; y: number; time: number; seed: number }[], hx: number, hy: number) {
  const G = MENG_GOD, s0 = G.storm[0]
  c.save()
  c.lineCap = c.lineJoin = 'round'
  if (time > s0) {
    const fade = 1 - clamp01((time - G.slashAt - 0.4) / 0.8)
    for (let k = 0; k < 70; k++) {
      const p = clamp01((time - s0 - rand(k, 71) * 1.3) / 0.08)
      if (p <= 0) continue
      const sx = rand(k, 72) * width, sy = rand(k, 73) * height, r = (0.8 + rand(k, 74) ** 3 * 4) * p
      c.globalAlpha = fade * 0.75
      c.fillStyle = c.strokeStyle = k % 5 ? SEAL : LOTUS_DEEP
      c.beginPath()
      c.arc(sx, sy, r, 0, Math.PI * 2)
      c.fill()
      if (k % 4 === 0) { // flicked off the brush
        const a = rand(k, 75) * Math.PI * 2
        c.lineWidth = r * 0.6
        line(c, sx, sy, sx + Math.cos(a) * r * 3.5, sy + Math.sin(a) * r * 3.5)
      }
    }
  }
  for (const b of bolts) {
    const fade = clamp01(1 - b.time / 0.45)
    if (fade <= 0) continue
    c.save()
    c.translate(b.x, b.y + 6)
    c.globalAlpha = fade * 0.8
    c.fillStyle = INK
    inkBlob(c, 9 + 8 * ease(b.time / 0.15), 0.4, b.seed)
    c.fill()
    for (let i = 0; i < 6; i++) {
      const a = rand(b.seed, i) * Math.PI * 2, d = 12 + 18 * ease(b.time / 0.2) * rand(b.seed, i + 6)
      c.beginPath()
      c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.45, 1 + rand(b.seed, i + 12) * 1.6, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
    if (b.time < 0.2) {
      const flash = 1 - b.time / 0.2, top = b.x + (rand(b.seed, 20) - 0.5) * 80, seed = b.seed + Math.floor(b.time * 30)
      c.globalAlpha = flash * 0.5
      boltPath(c, top, -30, b.x, b.y - 8, seed, 30)
      c.strokeStyle = INK
      c.lineWidth = 7
      c.stroke()
      c.globalAlpha = flash
      c.shadowColor = THUNDER_YELLOW
      c.shadowBlur = 12
      jagged(c, top, -30, b.x, b.y - 8, seed, 30, 2.4)
      c.shadowBlur = 0
      const white = c.createRadialGradient(b.x, b.y - 8, 0, b.x, b.y - 8, 42)
      white.addColorStop(0, 'rgba(255,255,255,.95)')
      white.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = white
      c.beginPath()
      c.arc(b.x, b.y - 8, 42, 0, Math.PI * 2)
      c.fill()
    }
  }
  if (time > G.grab && time < G.slashAt + 0.12) {
    const p = ease((time - G.grab) / 0.18), top = hy - 280, tip = top + (hy - top) * p, seed = Math.floor(tick / 2)
    c.globalAlpha = 0.5
    boltPath(c, hx + 10, top, hx, tip, seed, 18)
    c.strokeStyle = INK
    c.lineWidth = 7
    c.stroke()
    c.globalAlpha = 1
    c.shadowColor = THUNDER_YELLOW
    c.shadowBlur = 14
    jagged(c, hx + 10, top, hx, tip, seed, 18, 2.6)
    if (p >= 1) for (let i = 0; i < 4; i++) { // crackling in his hand
      const a = rand(seed, i) * Math.PI * 2
      jagged(c, hx, hy, hx + Math.cos(a) * 16, hy + Math.sin(a) * 16, seed * 3 + i, 6, 1)
    }
  }
  c.restore()
}

// The Divine Thunder Slash at (x, y) (ground point under its pivot), heading `angle`, `R` px across, `age` s old:
// one colossal brush stroke curved like a crescent. A dark ink-brown body with a dry-brush grain and branching
// cracks, a blazing gold edge outside and a thinner gold rim inside, gold and white flecks glittering on it, a ragged
// dry-brush tail where the stroke begins and a sharp tip where it ends, lightning threads crawling over it and red
// ink thrown off it.
export function drawMengDivineWave(c: C, x: number, y: number, angle: number, R: number, age: number, tick: number) {
  const W = MENG_GOD.wave, S = W.span, th = R * W.thick, flick = Math.floor(tick / 2), N = 40, fade = Math.min(1, age / 0.08)
  const width = (u: number) => th * Math.sin(Math.PI * (0.16 + 0.84 * u)) ** 0.55 // u = 0 at the tail, 1 at the tip
  const at = (u: number) => -S + 2 * S * u
  const point = (u: number, f: number): [number, number] => { const a = at(u), r = R - width(u) * f; return [Math.cos(a) * r, Math.sin(a) * r] }
  const body = () => {
    c.beginPath()
    for (let i = 0; i <= N; i++) c.lineTo(...point(i / N, 0))
    for (let i = N; i >= 0; i--) c.lineTo(...point(i / N, 1))
    c.closePath()
  }
  c.save()
  c.translate(x, y - 22)
  c.rotate(angle)
  c.globalAlpha = fade
  c.lineJoin = 'round'
  // The ragged dry-brush tail where the stroke begins: split hairs trailing back.
  for (let k = 0; k < 14; k++) {
    const r = R - width(0) * (k + 0.5) / 14, len = (0.08 + rand(k, 81) * 0.24) * S
    c.strokeStyle = k % 3 ? 'rgba(70,44,22,.75)' : 'rgba(214,150,50,.6)'
    c.lineWidth = width(0) / 14 * (0.5 + rand(k, 82))
    c.beginPath()
    c.arc(0, 0, r, -S - len, -S + 0.05)
    c.stroke()
  }
  // The blazing glow outside it.
  c.save()
  c.shadowColor = '#ffb020'
  c.shadowBlur = 30
  c.strokeStyle = 'rgba(255,190,60,.6)'
  c.lineWidth = th * 0.18
  c.lineCap = 'round'
  c.beginPath()
  c.arc(0, 0, R, -S * 0.92, S * 0.85)
  c.stroke()
  c.restore()
  // The body: ink-brown, going to gold at its outer edge.
  const g = c.createRadialGradient(0, 0, Math.max(1, R - th), 0, 0, R + 2)
  g.addColorStop(0, '#3a2414')
  g.addColorStop(0.45, '#6e4a26')
  g.addColorStop(0.7, '#8c6a36')
  g.addColorStop(0.84, '#c8922c')
  g.addColorStop(0.93, '#ffd23a')
  g.addColorStop(1, '#fff6c8')
  c.fillStyle = g
  body()
  c.fill()
  c.save()
  body()
  c.clip()
  // Dry-brush grain: hair streaks running along the stroke.
  for (let k = 0; k < 36; k++) {
    const u0 = rand(k, 92) * 0.8, u1 = Math.min(1, u0 + 0.15 + rand(k, 93) * 0.5)
    c.strokeStyle = k % 4 === 0 ? 'rgba(240,200,120,.22)' : 'rgba(30,18,10,.28)'
    c.lineWidth = 0.8 + rand(k, 94) * th * 0.04
    c.beginPath()
    c.arc(0, 0, R - th * rand(k, 91) * 0.95, at(u0), at(u1))
    c.stroke()
  }
  // Branching dark cracks across it.
  c.strokeStyle = 'rgba(28,16,8,.85)'
  c.lineCap = 'round'
  for (let k = 0; k < 8; k++) {
    let u = 0.1 + 0.8 * (k + rand(k, 101)) / 8, f = 0.05 + rand(k, 102) * 0.2
    const pts: number[] = []
    for (let s = 0; s < 7; s++) {
      pts.push(...point(u, f))
      u += (rand(k * 7 + s, 103) - 0.4) * 0.05
      f += 0.1 + rand(k * 7 + s, 104) * 0.08
    }
    c.lineWidth = Math.max(1, th * 0.028)
    line(c, ...pts)
    let bu = u - 0.05, bf = 0.35 + rand(k, 105) * 0.2 // a branch splitting off along the stroke
    const branch = [...point(bu, bf)]
    for (let s = 0; s < 3; s++) {
      bu += (k % 2 ? 1 : -1) * (0.03 + rand(k * 3 + s, 106) * 0.03)
      bf += (rand(k * 3 + s, 107) - 0.5) * 0.15
      branch.push(...point(bu, bf))
    }
    c.lineWidth = Math.max(0.8, th * 0.016)
    line(c, ...branch)
  }
  // Gold and white flecks glittering on it.
  for (let k = 0; k < 44; k++) {
    const [fx, fy] = point(rand(k, 111), rand(k, 112)), s = 1 + rand(k, 114) * 2.4
    c.globalAlpha = fade * (0.35 + 0.65 * rand(flick + k, 113))
    c.fillStyle = k % 3 ? '#ffe14a' : '#ffffff'
    c.fillRect(fx - s / 2, fy - s / 3, s, s * 0.6)
  }
  c.restore()
  // The thinner gold rim inside, and the blazing gold edge outside.
  c.save()
  c.lineCap = 'round'
  c.shadowColor = '#ffb020'
  c.shadowBlur = 8
  c.strokeStyle = '#ffc63a'
  c.lineWidth = Math.max(1.2, th * 0.035)
  c.beginPath()
  for (let i = 2; i <= N - 1; i++) c.lineTo(...point(i / N, 1))
  c.stroke()
  c.shadowBlur = 16
  c.strokeStyle = '#ffd23a'
  c.lineWidth = Math.max(2, th * 0.07)
  c.beginPath()
  c.arc(0, 0, R, -S * 0.95, S * 0.97)
  c.stroke()
  c.strokeStyle = '#fffbe8'
  c.lineWidth = Math.max(1, th * 0.022)
  c.stroke()
  c.restore()
  // Lightning threads crawling on it.
  c.shadowColor = THUNDER_YELLOW
  c.shadowBlur = 8
  for (let k = 0; k < 5; k++) {
    const u = rand(flick + k, 121), f = 0.2 + rand(flick + k, 122) * 0.6
    const [ax, ay] = point(u, f), [bx, by] = point(Math.min(1, u + 0.06 + rand(flick, k + 123) * 0.08), f + (rand(flick, k + 124) - 0.5) * 0.3)
    jagged(c, ax, ay, bx, by, flick * 9 + k, 8, 1)
  }
  c.shadowBlur = 0
  // Red ink thrown off behind it.
  const drop = Math.max(1, R / 220)
  for (let k = 0; k < 18; k++) {
    const [ox, oy] = point(rand(k, 131), -0.1 - rand(k, 132) * 0.8)
    c.globalAlpha = fade * (0.55 + 0.35 * rand(k, 133))
    c.fillStyle = k % 4 ? SEAL : LOTUS_DEEP
    c.beginPath()
    c.arc(ox - rand(k, 134) * th * (0.6 + age), oy, (1.2 + rand(k, 135) ** 2 * 4) * drop, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// One title character painted in white dry brush, cached: a pale stroke with an ink edge, split by streaks of bare
// paper along the brush's travel, with ragged hairs trailing off its right-hand edges.
const glyphs = new Map<string, HTMLCanvasElement>()
function dryBrushGlyph(ch: string, size: number) {
  const key = ch + size, cached = glyphs.get(key)
  if (cached) return cached
  const q = 2, S = Math.ceil(size * 1.5) * q, canvas = document.createElement('canvas'), x = canvas.getContext('2d')!
  canvas.width = canvas.height = S
  x.scale(q, q)
  const s = S / q
  x.font = `bold ${size}px ${BRUSH_FONT}`
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.lineJoin = 'round'
  x.strokeStyle = INK
  x.lineWidth = size * 0.13
  x.strokeText(ch, s / 2, s / 2)
  x.fillStyle = PAPER
  x.fillText(ch, s / 2, s / 2)
  x.globalCompositeOperation = 'destination-out'
  const seed = ch.charCodeAt(0)
  for (let k = 0; k < 26; k++) {
    const yy = rand(seed, k) * s, x0 = rand(seed, k + 30) * s * 0.6, len = s * (0.2 + rand(seed, k + 60) * 0.5)
    x.globalAlpha = 0.35 + rand(seed, k + 90) * 0.5
    x.lineWidth = 0.5 + rand(seed, k + 120) * 1.3
    line(x, x0, yy, x0 + len, yy - len * 0.12)
  }
  x.globalCompositeOperation = 'source-over'
  x.globalAlpha = 1
  const data = x.getImageData(0, 0, S, S).data, alpha = (px: number, py: number) => data[(Math.round(py * q) * S + Math.round(px * q)) * 4 + 3]
  for (let k = 0, hairs = 0; k < 400 && hairs < 14; k++) {
    const px = rand(seed, k + 200) * (s - 8), py = rand(seed, k + 600) * s
    if (alpha(px, py) < 200 || alpha(px + 3, py) > 40) continue
    hairs++
    const len = 5 + rand(seed, k + 900) * 10, dy = -1 - rand(seed, k + 950) * 2
    x.strokeStyle = INK
    x.lineWidth = 1.2
    line(x, px, py + 0.6, px + len, py + dy + 0.6)
    x.strokeStyle = PAPER
    x.lineWidth = 0.7
    line(x, px, py, px + len, py + dy)
  }
  glyphs.set(key, canvas)
  return canvas
}

// The name in a column whose top is at (x, y), `time` s after the cut: big white dry-brush characters brushed in
// one after another from the top down, then a small red seal reading 秘技 stamped under them; all fade out together.
export function drawMengGodTitle(c: C, x: number, y: number, time: number, tick: number) {
  const T = MENG_GOD.title, out = clamp01((T - time) / 0.4), n = MENG_GOD_TITLE.length, size = 40, gap = size * 1.05
  if (out <= 0) return
  c.save()
  const rise = (1 - out) * 10
  for (let i = 0; i < n; i++) {
    const p = clamp01((time - 0.1 - i * 0.2) / 0.22)
    if (p <= 0) continue
    const glyph = dryBrushGlyph(MENG_GOD_TITLE[i], size), S = glyph.width, s = S / 2
    const cx = x + (i % 2 ? 4 : -3) + Math.sin(tick * 0.05 + i) * 0.6, cy = y + gap * (i + 0.5) - rise
    c.globalAlpha = out
    c.drawImage(glyph, 0, 0, S, S * p, cx - s / 2, cy - s / 2, s, s * p) // the brush travels down the character
  }
  const stamp = ease((time - 0.1 - n * 0.2 - 0.1) / 0.15)
  if (stamp > 0) {
    const k = 1 + (1 - stamp) * 0.8, w = 15, h = 30
    c.translate(x + 18, y + gap * n + h / 2 - 6 - rise)
    c.scale(k, k)
    c.rotate(0.05)
    c.globalAlpha = out * stamp
    c.fillStyle = SEAL
    c.beginPath()
    c.roundRect(-w / 2, -h / 2, w, h, 3)
    c.fill()
    c.fillStyle = PAPER
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.font = `bold 11px ${BRUSH_FONT}`
    c.fillText('秘', 0, -h * 0.23)
    c.fillText('技', 0, h * 0.25)
  }
  c.restore()
}

// His sword trail for a basic cut, in sprite-local units (feet at 0,0, facing right), `progress` 0..1 through the
// attack: the jian sweeps from overhead down to where the slash pose holds it, a sharp crescent of blue light
// behind it, gold with crackling sparks in the thunder form.
export function drawMengSwing(c: C, progress: number, thunder: boolean) {
  const swing = ease(progress * 2.6), from = -1.75, to = 0.45
  c.save()
  c.translate(30 - 24, 22 - 44)
  bladeArc(c, 21, from, to, 9, swing + Math.max(0, progress - 0.38) * 1.7, thunder ? THUNDER_YELLOW : GLOW, thunder ? '#ffb020' : GLOW_PALE)
  if (thunder && progress < 0.6) {
    c.fillStyle = '#fff6b0'
    for (let k = 0; k < 5; k++) {
      const a = from + (to - from) * swing * rand(k, 3), r = 21 + (rand(k, 4) - 0.3) * 8 + progress * 14
      c.fillRect(Math.cos(a) * r - 1, Math.sin(a) * r - 1, 2, 2)
    }
  }
  c.restore()
}

// Lightning and Thunder Saint: faster, and he cuts from afar. Every slash throws a crescent of lightning wrapped in
// wind that flies `moon.speed` px/s for `moon.life` seconds, hitting each enemy in its path once.
// No devils and no devouring in this form; he meditates like the other heroes.
export const MENG_THUNDER = {
  name: 'Lightning and Thunder Saint',
  stats: { speed: 235, range: 170, cooldown: 0.65, color: '#f2c230' },
  moon: { speed: 640, life: 0.5, radius: 22, damage: 30, knockback: 220 },
} as const
export const MENG_THUNDER_FORM = 1 // index of the gold bar

// Lightning Step, the Thunder Saint's first skill: an enemy `min`..`range` px away makes him zig-zag at it in `hops`
// lightning steps (each `hop` s, swinging `side` px off the line, `rest` s apart), untouchable while he flashes,
// then cut it for `damage` and stun it `stun` s. Trails fade over `trail` s, the strike over `strike` s.
export const MENG_STEP = { min: 1, range: 620, hops: 4, side: 48, hop: 0.07, rest: 0.07, damage: 55, stun: 0.5, slash: 0.3,
  cooldown: 6, trail: 0.45, strike: 0.6 } as const

// A jagged path along (x1, y1)->(x2, y2), the same every frame for `seed`.
function boltPath(c: C, x1: number, y1: number, x2: number, y2: number, seed: number, wiggle: number) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L, n = Math.max(3, Math.round(L / 12))
  c.beginPath()
  for (let i = 0; i <= n; i++) {
    const j = i === 0 || i === n ? 0 : (rand(seed, i) - 0.5) * wiggle
    c.lineTo(x1 + dx * i / n + px * j, y1 + dy * i / n + py * j)
  }
}

// A jagged bolt along (x1, y1)->(x2, y2) at body height: a wide gold glow, a yellow body and a white core.
function jagged(c: C, x1: number, y1: number, x2: number, y2: number, seed: number, wiggle: number, width: number) {
  boltPath(c, x1, y1, x2, y2, seed, wiggle)
  for (const [color, w, a] of [[THUNDER_YELLOW, width * 3, 0.3], [THUNDER_YELLOW, width, 0.9], ['#ffffff', width * 0.4, 1]] as const) {
    c.strokeStyle = color
    c.lineWidth = w
    c.globalAlpha *= a
    c.stroke()
    c.globalAlpha /= a
  }
}

// One lightning step `time` s after he flashed from (x1, y1) to (x2, y2): a crackling gold trail with a gold afterglow
// of his body where he left, and sparks where he landed.
export function drawMengStep(c: C, x1: number, y1: number, x2: number, y2: number, time: number, seed: number) {
  const fade = clamp01(1 - time / MENG_STEP.trail)
  if (fade <= 0) return
  c.save()
  c.lineCap = c.lineJoin = 'round'
  c.globalAlpha = fade
  c.shadowColor = THUNDER_YELLOW
  c.shadowBlur = 10
  ellipse(c, x1, y1 - 14, 7, 14, 'rgba(255,225,74,.35)') // the afterglow of where he stood
  jagged(c, x1, y1 - 16, x2, y2 - 16, seed + Math.floor(time * 30), 16, 2.4) // it flickers
  jagged(c, x1, y1 - 6, x2, y2 - 6, seed + 7, 10, 1)
  c.fillStyle = '#fff6b0'
  for (let i = 0; i < 6; i++) {
    const a = rand(seed, 20 + i) * Math.PI * 2, r = 4 + 22 * ease(time / MENG_STEP.trail) * (0.5 + rand(seed, 30 + i))
    c.fillRect(x2 + Math.cos(a) * r - 1, y2 - 14 + Math.sin(a) * r * 0.6 - 1, 2, 2)
  }
  c.restore()
}

// The cut that ends Lightning Step, `time` s in: a bolt from the sky onto the target, two crossed lightning slashes
// through it, a burst ring and flying sparks.
export function drawMengStrike(c: C, x: number, y: number, time: number, seed: number) {
  const S = MENG_STEP.strike, fade = clamp01((S - time) / (S * 0.6)), grow = ease(time / 0.12)
  if (fade <= 0) return
  c.save()
  c.lineCap = c.lineJoin = 'round'
  c.globalAlpha = fade
  c.shadowColor = THUNDER_YELLOW
  c.shadowBlur = 14
  if (time < S * 0.5) jagged(c, x + 10, y - 200, x, y - 16, seed + Math.floor(time * 24), 26, 3) // the sky answers
  const r = 30 * grow
  jagged(c, x - r, y - 16 - r * 0.8, x + r, y - 16 + r * 0.8, seed + 3, 8, 2.6)
  jagged(c, x + r, y - 16 - r * 0.8, x - r, y - 16 + r * 0.8, seed + 5, 8, 2.6)
  c.shadowBlur = 0
  c.strokeStyle = '#fff1a8'
  c.lineWidth = 2
  c.beginPath()
  c.ellipse(x, y - 4, 10 + 40 * ease(time / S), 4 + 14 * ease(time / S), 0, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = '#ffffff'
  for (let i = 0; i < 10; i++) {
    const a = rand(seed, 40 + i) * Math.PI * 2, d = 6 + 46 * ease(time / S) * (0.4 + rand(seed, 50 + i))
    c.fillRect(x + Math.cos(a) * d - 1, y - 16 + Math.sin(a) * d * 0.7 - 1, 2, 2)
  }
  c.restore()
}

// The Thunder Saint's aura around him, feet at (x, y), `size` his sprite scale: arcs of lightning crackling round his
// body, re-forked every couple of frames, and now and then a bolt that jumps out to a random spot nearby with an
// ink underline, leaving a spark burst and an ink splash where it lands. Drawn only; it hurts no one.
export const MENG_AURA = { arcs: 3, window: 9, chance: 0.55, reach: [36, 90] } as const // `window` ticks per chance of a bolt
export function drawMengAura(c: C, x: number, y: number, size: number, tick: number, seed: number) {
  const A = MENG_AURA, flick = Math.floor(tick / 2) + seed * 31, cy = y - 24 * size, rx = 13 * size, ry = 24 * size
  c.save()
  c.lineCap = c.lineJoin = 'round'
  c.shadowColor = THUNDER_YELLOW
  c.shadowBlur = 8
  for (let i = 0; i < A.arcs; i++) { // crawling round his outline
    const a = rand(flick, i) * Math.PI * 2, b = a + (rand(flick, i + 5) - 0.5) * 2.2
    jagged(c, x + Math.cos(a) * rx, cy + Math.sin(a) * ry, x + Math.cos(b) * rx * 1.3, cy + Math.sin(b) * ry * 1.2, flick * 3 + i, 7, 0.9)
  }
  const w = Math.floor(tick / A.window) + seed * 17, age = tick % A.window
  if (rand(w, 1) < A.chance && age < 5) { // a bolt thrown out at random
    const a = rand(w, 2) * Math.PI * 2, d = A.reach[0] + rand(w, 3) * (A.reach[1] - A.reach[0])
    const tx = x + Math.cos(a) * d, ty = y + Math.sin(a) * d * 0.5, fade = 1 - age / 5
    c.globalAlpha = fade * 0.5
    c.shadowBlur = 0
    boltPath(c, x, cy, tx, ty - 4, w, 16)
    c.strokeStyle = INK
    c.lineWidth = 4
    c.stroke()
    c.globalAlpha = fade
    c.shadowBlur = 10
    jagged(c, x, cy, tx, ty - 4, w + Math.floor(age / 2), 16, 1.6)
    c.shadowBlur = 0
    c.globalAlpha = fade * 0.6
    c.fillStyle = INK
    c.save()
    c.translate(tx, ty)
    inkBlob(c, 4 + age, 0.4, w)
    c.fill()
    c.restore()
    c.globalAlpha = fade
    c.fillStyle = '#fff6b0'
    for (let k = 0; k < 6; k++) {
      const s = rand(w, k + 10) * Math.PI * 2, r = 3 + age * 2.5 * (0.5 + rand(w, k + 20))
      c.fillRect(tx + Math.cos(s) * r - 1, ty - 4 + Math.sin(s) * r * 0.6 - 1, 2, 2)
    }
  }
  c.restore()
}

// A crescent of lightning `age` seconds into its flight along `angle`: a glowing gold blade of light with a jagged
// crackling edge, gusts of wind curling behind it and sparks flying off.
export function drawMengThunderMoon(c: C, x: number, y: number, angle: number, age: number, tick: number) {
  const M = MENG_THUNDER.moon, grow = ease(age / 0.1), R = 26 * grow, fade = Math.min(1, (M.life - age) / 0.12)
  if (R <= 1 || fade <= 0) return
  c.save()
  c.translate(x, y - 18)
  c.rotate(angle)
  c.globalAlpha = fade
  c.lineCap = c.lineJoin = 'round'
  // Wind: pale curling gusts streaming behind.
  c.strokeStyle = 'rgba(214,238,255,.75)'
  c.lineWidth = 1.3
  for (const off of [-16, -7, 4, 13]) {
    const length = 22 + ((tick * 2 + off * 5) % 14), curl = off > 0 ? 1 : -1
    c.beginPath()
    c.moveTo(-6, off)
    c.quadraticCurveTo(-6 - length * 0.6, off + curl * 5, -6 - length, off - curl * 2)
    c.arc(-6 - length, off - curl * 5, 3, Math.PI / 2 * curl, Math.PI * 1.5 * curl, curl < 0)
    c.stroke()
  }
  // The crescent body, glowing.
  c.beginPath()
  c.arc(-R * 0.55, 0, R, -1.15, 1.15)
  c.arc(-R * 0.85, 0, R * 0.95, 1.05, -1.05, true)
  c.closePath()
  c.shadowColor = THUNDER_YELLOW
  c.shadowBlur = 12
  c.fillStyle = '#fff6b0'
  c.fill()
  c.shadowBlur = 0
  c.strokeStyle = '#c98f1a'
  c.lineWidth = 1.2
  c.stroke()
  // Crackling bolt along the outer edge, flickering each frame.
  c.strokeStyle = '#ffffff'
  c.lineWidth = 1.4
  c.beginPath()
  for (let k = 0; k <= 8; k++) {
    const a = -1.1 + k * 2.2 / 8, jag = k % 2 ? 3 + ((tick + k) % 3) : 0
    const px = -R * 0.55 + Math.cos(a) * (R + jag), py = Math.sin(a) * (R + jag)
    if (k === 0) c.moveTo(px, py)
    else c.lineTo(px, py)
  }
  c.stroke()
  c.strokeStyle = THUNDER_YELLOW
  c.lineWidth = 0.8
  c.stroke()
  // Sparks thrown off the tips.
  c.fillStyle = THUNDER_YELLOW
  for (let k = 0; k < 6; k++) {
    const drift = (tick * 0.7 + k * 5) % 10
    c.globalAlpha = fade * (1 - drift / 10)
    c.beginPath()
    c.arc(-4 - drift * 2, (k % 2 ? 1 : -1) * (R * 0.8 + drift), 1.3, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// With no enemy around he meditates, healing `heal` HP/s while hurt. Every enemy he killed leaves a body for his
// two devils: they fly out from his shoulders at `speed`, chew it for `bite` seconds, and the meal heals him
// `heal` HP per unit of the body's size squared before they fly back to circle him.
export const MENG_REST = { heal: 45 } as const
export const MENG_DEVILS = { speed: 320, bite: 1.2, heal: 160, orbit: 38, height: 44 } as const

const DEVIL = '#161a2b', DEVIL_SHADE = '#262c45', MAW = '#4a0a18', SMOKE = '#34406a'

// At half health he raises his jian and his three transformations rise over his head as bars of light, fire, gold
// and the tallest, blue; a light flickers across them and settles on one: fire (Body Refinement Divine-Demon),
// gold (Lightning and Thunder Saint) or blue (Devil Saint).
export const MENG_RITUAL = { health: 0.5, raise: 0.4, rise: 0.7, pick: 1.1, burst: 0.4 } as const
export const MENG_RITUAL_TIME = MENG_RITUAL.raise + MENG_RITUAL.rise + MENG_RITUAL.pick + MENG_RITUAL.burst
export const MENG_DEVIL_FORM = 2 // index of the blue bar
const FORM_BARS = [{ color: '#ff7a2a', height: 22 }, { color: '#ffd23a', height: 28 }, { color: GLOW, height: 38 }] as const

// The three bars side by side, standing on `base` above his head, for a ritual `time` seconds in.
export function drawMengRitual(c: C, x: number, base: number, time: number, tick: number, chosen: number) {
  const R = MENG_RITUAL
  const rise = ease((time - R.raise) / R.rise)
  if (rise <= 0) return
  const p = clamp01((time - R.raise - R.rise) / R.pick), burst = clamp01((time - R.raise - R.rise - R.pick) / R.burst)
  // The light flickers across the bars, slowing down until it rests on the chosen one.
  const steps = Math.floor(8 * (1 - (1 - p) ** 2)), lit = time < R.raise + R.rise ? -1 : ((chosen + steps - 8) % 3 + 3) % 3
  c.save()
  c.lineCap = 'round'
  FORM_BARS.forEach((bar, k) => {
    const bx = x + (k - 1) * 11, height = bar.height * rise, on = k === lit
    const fade = k === chosen ? 1 - burst * 0.6 : 1 - burst
    if (fade <= 0) return
    const flare = k === chosen ? 1 + burst * 1.5 : 1
    c.globalAlpha = (on ? 0.45 : 0.22) * fade
    c.strokeStyle = bar.color
    c.lineWidth = (on ? 9 : 7) * flare
    line(c, bx, base, bx, base - height)
    c.globalAlpha = (on ? 1 : 0.6) * fade
    c.lineWidth = 3 * flare
    line(c, bx, base, bx, base - height)
    if (on) {
      c.strokeStyle = '#ffffff'
      c.lineWidth = 1.2
      line(c, bx, base - 1, bx, base - height + 1)
    }
    // Embers rising off the top of each bar.
    c.fillStyle = bar.color
    for (let e = 0; e < 3; e++) {
      const u = (tick * 0.03 + e / 3 + k * 0.21) % 1
      c.globalAlpha = (1 - u) * 0.8 * fade
      c.beginPath()
      c.arc(bx + Math.sin(tick * 0.1 + e * 2 + k) * 2.5, base - height - u * 12, 1.4, 0, Math.PI * 2)
      c.fill()
    }
  })
  c.restore()
}

// One of the two devils fighting at his side, summoned by the Devil Saint form.
export const MENG_DEVIL = {
  name: 'Devil', blurb: 'One of the two fanged devils Meng Chuan lets loose as the Devil Saint. Flies at his enemies and bites',
  color: GLOW, radius: 14, hp: 220, speed: 190, damage: 22, range: 6, cooldown: 0.6, knockback: 60,
  spacing: 40, size: 1.25, scare: 0,
} as const

// One devil, facing +x before `facing` flips it: a dark orb that is mostly gaping mouth, rows of fangs growing
// longer toward the front, a slanted glowing eye, a blue glow, and a tail of smoke curling out behind it.
// `open` 0..1 is how wide the jaws gape.
export function drawMengDevil(c: C, x: number, y: number, facing: number, size: number, open: number, tick: number, seed: number) {
  const R = 16
  c.save()
  c.translate(x, y)
  c.scale(size * facing, size)
  c.strokeStyle = INK
  c.lineJoin = c.lineCap = 'round'

  // Smoke tail: puffs shrinking along a wave that ripples back from the body, pale wisps peeling off.
  for (let k = 9; k >= 0; k--) {
    const t = k / 9, px = -R + 2 - t * 46, py = Math.sin(tick * 0.12 - k * 0.8 + seed) * (2 + t * 9) - t * 4
    const r = 10 - t * 7
    c.globalAlpha = 0.85 - t * 0.55
    c.fillStyle = k % 2 ? SMOKE : DEVIL_SHADE
    c.lineWidth = 1
    c.beginPath()
    c.arc(px, py, r, 0, Math.PI * 2)
    c.fill()
    c.globalAlpha *= 0.6
    c.stroke()
  }
  c.fillStyle = GLOW
  for (let k = 0; k < 6; k++) {
    const drift = (tick * 0.5 + k * 11 + seed * 13) % 60 / 60
    c.globalAlpha = 0.45 * (1 - drift)
    c.beginPath()
    c.arc(-R - drift * 50, Math.sin(k * 2.3 + tick * 0.07) * 6 - drift * 10, 3 - drift * 2, 0, Math.PI * 2)
    c.fill()
  }

  // Blue glow around the orb.
  c.fillStyle = GLOW_PALE
  c.globalAlpha = 0.2 + Math.sin(tick * 0.09 + seed) * 0.06
  c.beginPath()
  c.arc(0, 0, R + 6, 0, Math.PI * 2)
  c.fill()
  c.globalAlpha = 1

  // Body, then the maw cut into its front: a wedge from a hinge behind the middle to past the front edge.
  c.lineWidth = 1.6
  ellipse(c, 0, 0, R, R, DEVIL)
  const hx = -9, hy = 3, top = -3 - open * 10, bottom = 6 + open * 8, fx = R + 4
  c.save()
  c.beginPath()
  c.arc(0, 0, R - 0.8, 0, Math.PI * 2)
  c.clip()
  c.lineWidth = 1.2
  poly(c, MAW, hx, hy, fx, top, fx, bottom)
  // Fangs along both lips, pointing across the mouth and longest at the front.
  for (let k = 0; k < 5; k++) {
    const t = (k + 0.6) / 5.4, long = 2.5 + t * 6
    const ux = hx + (fx - hx) * t, uy = hy + (top - hy) * t, lx = hx + (fx - hx) * (t - 0.08), ly = hy + (bottom - hy) * (t - 0.08)
    c.lineWidth = 0.8
    poly(c, '#ffffff', ux - 1.6, uy - 0.5, ux + 1.6, uy - 0.5 + (top - hy) / (fx - hx) * 3.2, ux + 0.3, uy + long)
    poly(c, '#ffffff', lx - 1.6, ly + 0.5, lx + 1.6, ly + 0.5 + (bottom - hy) / (fx - hx) * 3.2, lx + 0.3, ly - long * 0.85)
  }
  c.restore()
  c.lineWidth = 1.6
  c.beginPath()
  c.arc(0, 0, R, 0, Math.PI * 2)
  c.stroke()
  // Slanted glowing eye above the upper jaw, under a heavy brow.
  c.lineWidth = 0.8
  poly(c, GLOW_PALE, 2, -10 - open * 1.5, 9, -7.5 - open * 2, 3, -6.5 - open * 1.5)
  c.lineWidth = 1.6
  line(c, 0, -12 - open * 1.5, 10, -9.5 - open * 2)
  c.restore()
}

// Both devils circle (cx, cy) on opposite sides. `eating` is seconds spent chewing (they close in on the body and
// face it), `heading` the side they are flying toward; otherwise each faces where its orbit carries it.
export function drawMengDevils(c: C, cx: number, cy: number, size: number, tick: number, id: number, eating: number | null, heading: number | null) {
  const D = MENG_DEVILS, radius = D.orbit * size * (eating === null ? 1 : 1 - 0.5 * Math.min(1, eating / 0.2))
  for (let k = 0; k < 2; k++) {
    const angle = tick * 0.04 + id + k * Math.PI
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius * 0.35 + Math.sin(tick * 0.08 + k * 2) * 3
    const open = eating !== null ? 0.5 + Math.sin(tick * 0.55 + k * 1.7) * 0.5 : 0.35 + Math.sin(tick * 0.06 + k) * 0.2
    const facing = eating !== null ? (x < cx ? 1 : -1) : heading ?? (Math.sin(angle) > 0 ? -1 : 1)
    drawMengDevil(c, x, y, facing, size, open, tick, id * 7 + k * 3)
  }
}

// Still picture of a devil for places that need a sprite; the battle draws devils live.
export function buildMengDevilSprite() {
  return buildSprite((c) => drawMengDevil(c, 30, 22, 1, 0.85, 0.5, 0, 0), undefined, [0, 0, 0], false)
}

// First skill, Autumn Breeze (秋风): a dash through the target that cuts and binds every enemy on the line,
// then curved painted slashes burst across the cut and a painting of the autumn wind blooms along it.
export const MENG_BREEZE = { min: 1, range: 220, past: 22, speed: 950, width: 20, damage: 42, paint: 2.4, cooldown: 7 } as const

const GOLD = '#f2c230', GOLD_DARK = '#c98f1a', GOLD_PALE = '#fff1a8', LEAF = '#5fae4a', LEAF_DARK = '#3d7f34', LEAF_TIP = '#9ccf6a'
const TEAL = '#2fb3a6', CYAN = '#3fd6ff', JADE = '#2fd27a', JADE_PALE = '#b4ffc8', PAPER = '#fbf7ec'
const SEAL = '#d8452f', FADE = 0.5, UNROLL = 0.5, HALF = 20 // the painting's half-height
const LIFT = 18 // the effect floats at body height above the ground line
const WIDE = 3 // how much wider than drawn the slashes and painting appear across the cut (looks only, not the hit width)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
export const ease = (t: number) => 1 - (1 - clamp01(t)) ** 3
const rand = (i: number, k: number) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s) }

// A ginkgo leaf, stem at the origin, fan pointing up (-y).
function ginkgo(c: C, s: number) {
  c.beginPath()
  c.moveTo(0, 0)
  c.quadraticCurveTo(-s * 1.15, -s * 0.35, -s, -s * 1.2)
  c.quadraticCurveTo(-s * 0.55, -s * 1.5, -s * 0.1, -s * 1.22)
  c.lineTo(0, -s * 0.95)
  c.lineTo(s * 0.1, -s * 1.22)
  c.quadraticCurveTo(s * 0.55, -s * 1.5, s, -s * 1.2)
  c.quadraticCurveTo(s * 1.15, -s * 0.35, 0, 0)
  const g = c.createLinearGradient(0, 0, 0, -s * 1.4)
  g.addColorStop(0, GOLD_DARK)
  g.addColorStop(1, GOLD)
  c.fillStyle = g
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.45
  c.stroke()
  c.strokeStyle = 'rgba(150,100,20,.65)'
  c.lineWidth = 0.3
  for (const a of [-0.75, -0.35, 0.35, 0.75]) line(c, 0, 0, Math.sin(a) * s * 1.15, -Math.cos(a) * s * 1.2)
  c.strokeStyle = INK
  c.lineWidth = 0.5
  line(c, 0, 0, 0, s * 0.7)
}

// A slender bamboo leaf along x, base at -x, tip at +x.
function bamboo(c: C, s: number) {
  c.beginPath()
  c.moveTo(-s * 1.7, 0)
  c.quadraticCurveTo(-s * 0.3, -s * 0.62, s * 1.7, 0)
  c.quadraticCurveTo(-s * 0.3, s * 0.5, -s * 1.7, 0)
  const g = c.createLinearGradient(-s * 1.7, 0, s * 1.7, 0)
  g.addColorStop(0, LEAF_DARK)
  g.addColorStop(0.55, LEAF)
  g.addColorStop(1, LEAF_TIP)
  c.fillStyle = g
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.45
  c.stroke()
  c.strokeStyle = 'rgba(255,255,230,.6)'
  c.lineWidth = 0.35
  line(c, -s * 1.5, 0, s * 1.4, -s * 0.05)
}

// A leaf tumbling in the wind: `flip` squashes it across its width as it turns over.
function leaf(c: C, green: boolean, x: number, y: number, angle: number, flip: number, size: number, alpha: number) {
  if (alpha <= 0.01) return
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  c.scale(1, Math.sign(flip || 1) * Math.max(0.15, Math.abs(flip)))
  c.globalAlpha *= alpha
  if (green) bamboo(c, size)
  else ginkgo(c, size)
  c.restore()
}

// A cloud curl (卷云纹): a spiral winding in from radius r.
function curl(c: C, x: number, y: number, r: number, dir: number, spin: number) {
  c.beginPath()
  for (let k = 0; k <= 24; k++) {
    const p = k / 24, a = spin + dir * p * Math.PI * 3, rr = r * (1 - p * 0.85)
    if (k) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8)
    else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8)
  }
  c.stroke()
}

const ribbonY = (u: number, v0: number, amp: number, wave: number, phase: number) => v0 + Math.sin(u / wave + phase) * amp

// A flowing wind ribbon from `from` to `to`: a soft wash under a crisp line, waves travelling with `phase`,
// ending in a curl.
function ribbon(c: C, from: number, to: number, v0: number, amp: number, wave: number, phase: number, color: string, dir: number) {
  if (to - from < 4) return
  c.beginPath()
  for (let u = from; u <= to; u += 3) {
    const v = ribbonY(u, v0, amp, wave, phase)
    if (u === from) c.moveTo(u, v)
    else c.lineTo(u, v)
  }
  c.strokeStyle = color
  const alpha = c.globalAlpha
  c.globalAlpha = alpha * 0.25
  c.lineWidth = 3.4
  c.stroke()
  c.globalAlpha = alpha
  c.lineWidth = 1.1
  c.stroke()
  curl(c, to, ribbonY(to, v0, amp, wave, phase) + dir * 3.2, 4, dir, phase * 0.5)
}

// The autumn-wind painting along the cut, `t` seconds after the dash, painted straight onto the battlefield:
// it spreads from the start of the cut to its end, plays, then dissolves.
function drawPainting(c: C, x1: number, y1: number, x2: number, y2: number, t: number, tick: number) {
  const L = Math.hypot(x2 - x1, y2 - y1) / WIDE, fade = clamp01((MENG_BREEZE.paint - t) / FADE) // L in painting units
  const flip = x2 < x1 ? -1 : 1 // keeps the painting's top up when he dashes left
  const open = L * ease(t / UNROLL), scene = fade * ease((t - 0.1) / 0.4)
  c.save()
  c.translate(x1, y1 - LIFT)
  c.rotate(Math.atan2(y2 - y1, x2 - x1))
  c.scale(WIDE, flip * WIDE)
  c.lineCap = c.lineJoin = 'round'
  // Pale autumn sun.
  if (L * 0.72 < open) {
    c.globalAlpha = scene * 0.55
    c.fillStyle = GOLD
    c.beginPath()
    c.arc(L * 0.72, -10, 4.5, 0, Math.PI * 2)
    c.fill()
  }
  // Far blue peaks and near green hills rising out of nothing at both ends, washed into mist at their feet,
  // ridges touched with ink.
  const hills = (base: number, height: number, f1: number, f2: number, seed: number, fill: string, ink: number) => {
    const ridge = (u: number) => HALF - (HALF - base + height * (0.55 + 0.3 * Math.sin(u * f1 + seed) + 0.15 * Math.sin(u * f2 + seed * 2)))
      * Math.sin(Math.PI * clamp01(u / L)) ** 0.5
    c.beginPath()
    c.moveTo(0, HALF)
    for (let u = 0; u <= open; u += 4) c.lineTo(u, ridge(u))
    c.lineTo(open, ridge(open))
    c.lineTo(open, HALF)
    const g = c.createLinearGradient(0, base - height, 0, HALF)
    g.addColorStop(0, fill)
    g.addColorStop(1, 'rgba(251,247,236,0)')
    c.fillStyle = g
    c.fill()
    c.beginPath()
    for (let u = 0; u <= open; u += 4) c.lineTo(u, ridge(u))
    c.strokeStyle = `rgba(34,31,51,${ink})`
    c.lineWidth = 0.5
    c.stroke()
    // A few texture strokes (皴) down the slopes.
    for (let u = 14 + seed * 3; u < open - 6; u += 31) {
      const v = ridge(u)
      if (v > HALF - 4) continue
      line(c, u, v + 1.5, u - 2, v + 5)
      line(c, u + 3, v + 2, u + 1.5, v + 6.5)
    }
  }
  c.globalAlpha = scene
  hills(4, 22, 0.05, 0.13, 1.7, 'rgba(62,123,250,.5)', 0.2)
  hills(13, 15, 0.08, 0.21, 4.1, 'rgba(47,160,120,.6)', 0.3)
  // Drifting mist bands.
  c.fillStyle = 'rgba(251,247,236,.75)'
  for (let k = 0; k < 3; k++) {
    const u = ((k * (L + 40)) / 3 + t * 14) % (L + 40) - 20
    if (u > open) continue
    c.beginPath()
    c.ellipse(u, 9 + k * 2.5, 22, 2.6, 0, 0, Math.PI * 2)
    c.fill()
  }
  // Wild geese (雁) crossing the sky.
  c.strokeStyle = INK
  c.lineWidth = 0.55
  for (let k = 0; k < 3; k++) {
    const gu = L * 0.28 + t * 11 + k * 7, gv = -13 + Math.abs(k - 1) * 2.2, wing = 1.2 + Math.sin(tick * 0.3 + k) * 0.9
    if (gu < open) line(c, gu - 2.2, gv - wing, gu, gv, gu + 2.2, gv - wing)
  }
  // Wind: three ribbons with cloud curls blowing toward the far end.
  const flow = tick * 0.07
  ribbon(c, 0, open, -9, 3, 9, flow, SILK, 1)
  ribbon(c, 6, open - 6, -1, 2.5, 7, flow + 2, SILK_PALE, -1)
  ribbon(c, 2, open - 12, 6, 2, 11, flow + 4, TEAL, 1)
  c.strokeStyle = SILK_PALE
  c.lineWidth = 0.9
  for (let u = 40; u < open - 20; u += 70) curl(c, u, ribbonY(u, -9, 3, 9, flow) - 4, 3, -1, flow)
  // A ginkgo branch reaching in over the start, swaying, its leaves fluttering.
  const grow = ease((t - 0.25) / 0.5), reach = Math.min(72, L * 0.45), sway = Math.sin(tick * 0.05) * 1.5
  const twig = (s: number) => [reach * s, -HALF + 1 + 13 * s * s + Math.sin(s * 3) * 2 + sway * s] as const
  c.globalAlpha = scene
  c.strokeStyle = INK
  for (let k = 0; k < 8 && k / 8 < grow; k++) {
    const [ua, va] = twig(k / 8), [ub, vb] = twig(Math.min(grow, (k + 1) / 8))
    c.lineWidth = 2.2 - k * 0.2
    line(c, ua, va, ub, vb)
  }
  for (let k = 0; k < 6; k++) {
    const s = 0.3 + k * 0.13
    if (s > grow) break
    const [u, v] = twig(s), side = k % 2 ? 1 : -1
    c.strokeStyle = INK
    c.lineWidth = 0.5
    line(c, u, v, u + side * 2, v + 3)
    leaf(c, false, u + side * 2, v + 3, Math.PI + side * 0.5 + Math.sin(tick * 0.08 + k) * 0.25, 1, 3.1, 1)
  }
  // Inscription 秋风 and the seal, written once it has spread; kept upright when the painting is flipped.
  const write = (u: number, v: number, draw: () => void) => {
    c.save()
    c.translate(u, v)
    c.scale(flip, 1)
    draw()
    c.restore()
  }
  c.font = `bold 11px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let k = 0; k < 2; k++) {
    const p = ease((t - 0.5 - k * 0.15) / 0.25)
    if (p <= 0) continue
    c.globalAlpha = fade * p
    write(L - 12, -10 + k * 11, () => {
      c.scale(1.3 - p * 0.3, 1.3 - p * 0.3)
      c.strokeStyle = PAPER
      c.lineWidth = 2.5
      c.strokeText('秋风'[k], 0, 0)
      c.fillStyle = INK
      c.fillText('秋风'[k], 0, 0)
    })
  }
  const stamp = ease((t - 0.95) / 0.15)
  if (stamp > 0) {
    c.globalAlpha = fade * stamp
    write(L - 12, 13, () => {
      c.scale(1.6 - stamp * 0.6, 1.6 - stamp * 0.6)
      c.fillStyle = SEAL
      c.fillRect(-3.5, -3.5, 7, 7)
      c.strokeStyle = PAPER
      c.lineWidth = 0.4
      c.strokeRect(-2.6, -2.6, 5.2, 5.2)
      c.fillStyle = PAPER
      c.font = '5px KaiTi, STKaiti, "Noto Serif CJK SC", serif'
      c.fillText('孟', 0, 0.3)
    })
  }
  // Gust strokes racing past above and below.
  c.strokeStyle = SILK_PALE
  c.lineWidth = 1
  for (let k = 0; k < 6; k++) {
    const u = (t * 260 + k * 53) % (L + 60) - 30, v = (k % 2 ? 1 : -1) * (HALF + 7 + (k % 3) * 4)
    c.globalAlpha = fade * 0.6 * scene
    line(c, u, v, u + 16, v + Math.sin(u * 0.05) * 1.5)
  }
  // Leaves blown out of the painting, tumbling past its edges.
  const count = Math.max(10, Math.min(22, Math.round(L / 10)))
  for (let i = 0; i < count; i++) {
    const born = 0.15 + rand(i, 1) * 0.5 + rand(i, 2) * 0.9, age = t - born
    if (age <= 0) continue
    const u0 = rand(i, 3) * L * 0.8, v0 = (rand(i, 4) - 0.5) * 26
    const u = u0 + age * (50 + rand(i, 5) * 60) + age * age * 20
    const v = v0 + Math.sin(age * 2.4 + rand(i, 6) * 6) * 7 + (rand(i, 7) - 0.5) * 34 * age
    const spin = (rand(i, 8) < 0.5 ? -1 : 1) * (1.5 + rand(i, 9) * 2.5)
    c.globalAlpha = fade
    leaf(c, i % 5 > 2, u, v, rand(i, 10) * 6 + age * spin, Math.cos(age * (5 + rand(i, 11) * 4)), 2.8 + rand(i, 12) * 1.4, clamp01(age / 0.15))
  }
  c.restore()
}

// One painted slash from tail (ax, ay) to head (bx, by), `w` wide at its belly; `start` is when it is painted.
// `bend` bows it sideways as a fraction of its length (0 is straight).
type Stroke = { ax: number; ay: number; bx: number; by: number; w: number; bend: number; start: number; dark: string; light: string; ghost: string; seed: number }
const PALETTES = [[SILK, CYAN, GOLD], [JADE, JADE_PALE, SILK_PALE], [GOLD_DARK, GOLD_PALE, JADE], [SILK, GLOW_PALE, JADE]] as const

// The main cut along the dash, five slashes crossing it and two long hairline cuts, the same every frame.
// `curve` scales how much they sweep: 0 straight, 1 curved arcs.
function breezeStrokes(x1: number, y1: number, x2: number, y2: number, curve: number) {
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, angle = Math.atan2(uy, ux)
  const seed = Math.round(x1 * 3.1 + y1 * 7.7), size = Math.min(1.3, 0.6 + L / 300), up = ux >= 0 ? -1 : 1 // bows upward on screen
  const strokes: Stroke[] = [{ ax: x1 - ux * 14, ay: y1 - uy * 14, bx: x2 + ux * 18, by: y2 + uy * 18, w: 8 * WIDE, bend: 0.14 * up * curve, start: 0,
    dark: SILK, light: CYAN, ghost: GOLD, seed }]
  for (let i = 0; i < 5; i++) {
    const r = (k: number) => rand(seed + i * 13, k), s = 0.15 + 0.7 * r(1), off = (r(2) - 0.5) * 16 * WIDE
    const cx = x1 + ux * L * s - uy * off, cy = y1 + uy * L * s + ux * off
    const a = angle + (i % 2 ? 1 : -1) * (0.35 + r(3) * 0.85), half = (26 + r(4) * 26) * size * WIDE
    const [dark, light, ghost] = PALETTES[(i + 1) % PALETTES.length]
    strokes.push({ ax: cx - Math.cos(a) * half, ay: cy - Math.sin(a) * half, bx: cx + Math.cos(a) * half, by: cy + Math.sin(a) * half,
      w: (3 + r(5) * 3) * WIDE, bend: (i % 2 ? 1 : -1) * (0.18 + r(6) * 0.2) * curve, start: 0.06 + i * 0.07, dark, light, ghost, seed: seed + i * 13 })
  }
  for (const [k, tilt] of [[0, 0.12], [1, -0.09]] as const) {
    const a = angle + tilt, half = L / 2 + 40, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + (k ? 6 : -6) * WIDE
    strokes.push({ ax: cx - Math.cos(a) * half, ay: cy - Math.sin(a) * half, bx: cx + Math.cos(a) * half, by: cy + Math.sin(a) * half,
      w: 1.4 * WIDE, bend: 0.06 * up * curve, start: 0.4 + k * 0.07, dark: GLOW_PALE, light: '#ffffff', ghost: CYAN, seed: seed + 97 + k })
  }
  return strokes
}

// A stroke's curve: at(s, off, along) is the point `off` px to its left and `along` px ahead at s (0 tail, 1 head).
function strokePath(st: Stroke) {
  const len = Math.hypot(st.bx - st.ax, st.by - st.ay)
  const cx = (st.ax + st.bx) / 2 - (st.by - st.ay) * st.bend, cy = (st.ay + st.by) / 2 + (st.bx - st.ax) * st.bend
  const at = (s: number, off = 0, along = 0) => {
    const u = 1 - s, dx = u * (cx - st.ax) + s * (st.bx - cx), dy = u * (cy - st.ay) + s * (st.by - cy), d = Math.hypot(dx, dy) || 1
    const tx = dx / d, ty = dy / d
    return [u * u * st.ax + 2 * u * s * cx + s * s * st.bx - ty * off + tx * along, u * u * st.ay + 2 * u * s * cy + s * s * st.by + tx * off + ty * along] as const
  }
  return { at, len }
}

// One clean cut: a lens of light sharp at both ends, thickest past the middle, with a soft coloured glow, a body
// washing from its dark colour to white at the head and a white-hot core.
// `reveal` cuts it from tail to head, `thin` wastes it away, `jitter` makes the glow shimmer.
function slash(c: C, st: Stroke, reveal: number, thin: number, jitter: number) {
  const { at, len } = strokePath(st)
  if (len < 1 || reveal <= 0 || thin <= 0) return
  const N = 24, base = c.globalAlpha
  const lens = (scale: number) => {
    c.beginPath()
    for (let k = 0; k <= 2 * N + 1; k++) {
      const side = k <= N ? 1 : -1, s = (k <= N ? k : 2 * N + 1 - k) / N * reveal
      const w = st.w * scale * thin * Math.sin(Math.PI * s) ** 0.7 * (0.3 + 0.7 * s)
      const [x, y] = at(s, w * side)
      c.lineTo(x, y)
    }
    c.closePath()
    c.fill()
  }
  c.save()
  c.fillStyle = st.light
  c.shadowColor = st.light
  c.shadowBlur = st.w * 2
  c.globalAlpha = base * 0.45
  lens(1.8 + jitter * 0.25)
  c.restore()
  const wash = c.createLinearGradient(st.ax, st.ay, st.bx, st.by)
  wash.addColorStop(0, st.dark)
  wash.addColorStop(0.6, st.light)
  wash.addColorStop(1, '#ffffff')
  c.fillStyle = wash
  lens(1)
  c.fillStyle = '#ffffff'
  lens(0.35)
  c.globalAlpha = base
}

// Sharp coloured shards breaking off a slash `age` seconds after it lands, spinning away from it.
function shards(c: C, st: Stroke, age: number) {
  const life = 1.2, base = c.globalAlpha, { at, len } = strokePath(st)
  if (age <= 0 || age >= life || len < 1) return
  c.lineWidth = 0.4
  c.strokeStyle = INK
  for (let k = 0; k < 6; k++) {
    const r = (n: number) => rand(st.seed + k * 7, n), side = r(2) < 0.5 ? -1 : 1, speed = 40 + r(3) * 50
    const travel = speed * age * (1 - age / (life * 2)), size = (1.5 + r(4) * 2) * (st.w > 2 * WIDE ? 1 : 0.6) * WIDE
    const [x, y] = at(r(1), side * travel, travel * 0.4)
    c.save()
    c.translate(x, y)
    c.rotate(r(5) * 6 + age * (4 + r(6) * 6) * side)
    c.globalAlpha = base * (1 - age / life)
    c.fillStyle = k % 3 ? st.light : st.ghost
    c.beginPath()
    c.moveTo(size * 1.6, 0)
    c.lineTo(-size * 0.6, size * 0.55)
    c.lineTo(-size * 0.3, -size * 0.6)
    c.closePath()
    c.fill()
    c.stroke()
    c.restore()
  }
}

// The painted slashes alone along the cut from (x1, y1) to (x2, y2), ground points. While `dashing` a thin cut
// chases him; `time` seconds after the dash the slashes are painted on one after another, shed shards while their
// colour fringes shimmer, then waste away. `curve` 0 gives the straight version.
export function drawMengSlashes(c: C, x1: number, y1: number, x2: number, y2: number, dashing: boolean, time: number, tick: number, curve = 1) {
  if (Math.hypot(x2 - x1, y2 - y1) < 1) return
  const strokes = breezeStrokes(x1, y1, x2, y2, curve)
  c.save()
  c.translate(0, -LIFT)
  c.lineJoin = 'round'
  if (dashing) slash(c, { ...strokes[0], ax: x1, ay: y1, bx: x2, by: y2, w: 3 }, 1, 1, 0)
  else {
    const fade = clamp01((MENG_BREEZE.paint - time) / FADE), jitter = Math.sin(tick * 0.9) * 0.8 * fade
    strokes.forEach((st, i) => {
      c.globalAlpha = fade
      const grow = i === 0 ? 0.4 + 0.6 * ease(time / 0.08) : 1 // the dash's thin cut swells into the main stroke
      slash(c, st, ease((time - st.start) / 0.1), grow * (0.35 + 0.65 * fade), jitter)
      shards(c, st, time - st.start - 0.08)
    })
  }
  c.restore()
}

// Autumn Breeze: the painting blooms along the cut behind the curved slashes.
export function drawMengBreeze(c: C, x1: number, y1: number, x2: number, y2: number, dashing: boolean, time: number, tick: number) {
  if (!dashing && Math.hypot(x2 - x1, y2 - y1) >= 1) drawPainting(c, x1, y1, x2, y2, time, tick)
  drawMengSlashes(c, x1, y1, x2, y2, dashing, time, tick)
}

// An enemy bound by the breeze at ground point (x, y): a turning ring of wind with leaves circling it.
// `left` is the painting's time left, for the fade-out.
export function drawMengBind(c: C, x: number, y: number, left: number, tick: number) {
  const alpha = clamp01(left * 4), spin = tick * 0.06
  if (alpha <= 0) return
  c.save()
  c.translate(x, y - 10)
  c.globalAlpha = alpha
  c.lineCap = 'round'
  c.lineWidth = 1.3
  c.strokeStyle = SILK
  c.beginPath()
  c.ellipse(0, 0, 14, 4.5, 0, spin, spin + 2.4)
  c.stroke()
  c.strokeStyle = TEAL
  c.beginPath()
  c.ellipse(0, 0, 14, 4.5, 0, spin + Math.PI, spin + Math.PI + 2.4)
  c.stroke()
  c.strokeStyle = SILK_PALE
  c.lineWidth = 0.8
  curl(c, Math.cos(spin + 2.4) * 14, Math.sin(spin + 2.4) * 4.5, 2.5, 1, spin)
  for (let k = 0; k < 3; k++) {
    const a = -spin * 1.3 + k * 2.09
    leaf(c, k === 1, Math.cos(a) * 15, Math.sin(a) * 5 - 2, a + Math.PI / 2, Math.cos(tick * 0.2 + k), 2.6, 1)
  }
  c.restore()
}

// Parry, in every form: he turns most attacks aside with the jian (`chance` of each enemy hit), holding a guard pose
// for `pose` seconds. A parried projectile flies back the way it came, now his.
export const MENG_PARRY = { chance: 0.9, pose: 0.25, spark: 0.35 } as const

// The parry at ground point (x, y), the blow coming from `angle`: a curved blade flash meeting it, a glint at the
// point of contact, a pale ring, gold sparks sprayed back toward the attacker and a ginkgo leaf knocked loose.
// `progress` runs 0..1 over the spark's life; `seed` varies the spray.
export function drawMengParry(c: C, x: number, y: number, angle: number, progress: number, seed: number) {
  const p = clamp01(progress), out = 1 - p, ca = Math.cos(angle), sa = Math.sin(angle)
  const hx = x + ca * 12, hy = y - 22 + sa * 5 // where blade meets blow
  c.save()
  c.lineCap = c.lineJoin = 'round'
  // The blade's flash: a short crescent sweeping across the blow, ink under cyan under white.
  const sweep = ease(p / 0.35), from = angle - 1.1, to = from + 2.2 * sweep
  c.globalAlpha = out
  for (const [width, color] of [[4.5, INK], [3, CYAN], [1.1, '#ffffff']] as const) {
    c.strokeStyle = color
    c.lineWidth = width * (0.5 + out * 0.5)
    c.beginPath()
    c.ellipse(x, y - 22, 15, 11, 0, from, to)
    c.stroke()
  }
  // Pale blue ring spreading from the contact.
  c.globalAlpha = out * 0.7
  c.strokeStyle = GLOW_PALE
  c.lineWidth = 1
  c.beginPath()
  c.arc(hx, hy, 3 + ease(p) * 13, 0, Math.PI * 2)
  c.stroke()
  // Gold sparks sprayed back the way the blow came, falling as they fly.
  for (let k = 0; k < 9; k++) {
    const a = angle + (rand(seed + k, 1) - 0.5) * 1.8, speed = 22 + rand(seed + k, 2) * 26, d = speed * ease(p) * 0.9
    const sx = hx + Math.cos(a) * d, sy = hy + Math.sin(a) * d * 0.7 + p * p * 10, tail = 3 + out * 4
    c.globalAlpha = out
    c.strokeStyle = k % 3 ? GOLD : GOLD_PALE
    c.lineWidth = k % 3 ? 1 : 1.4
    line(c, sx, sy, sx - Math.cos(a) * tail, sy - Math.sin(a) * tail * 0.7 - p * 2)
  }
  // A four-point glint at the contact, flaring then gone.
  const g = Math.sin(Math.PI * clamp01(p / 0.5)) * 7
  if (g > 0.2) {
    c.globalAlpha = 1
    c.fillStyle = '#ffffff'
    c.strokeStyle = SILK
    c.lineWidth = 0.5
    c.beginPath()
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? g * 0.22 : g, a = k * Math.PI / 4 + 0.2
      c.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r)
    }
    c.closePath()
    c.fill()
    c.stroke()
  }
  // A ginkgo leaf knocked loose, fluttering away.
  leaf(c, rand(seed, 3) < 0.3, hx + ca * 16 * p, hy - 6 * p + p * p * 14, rand(seed, 4) * 6 + p * 5, Math.cos(p * 12), 2.6, out)
  c.restore()
}

// Five Autumn Shadows (五影秋斩): a parry can split him into five that surround the enemy. Unsure which is real, it strikes
// a clone; it shatters, and he and the other three dash through it to the far side and cut, freezing it under the straight slashes.
export const MENG_CLONE = {
  chance: 0.3, cooldown: 10, range: 260, count: 5, ring: 62, behind: 30,
  split: 0.4, feint: 0.6, strike: 0.35, dash: 0.2, damage: 64,
} as const
export const MENG_CLONE_TITLE = '五影秋斩'

const TITLE_COLORS = [SILK, CYAN, JADE, GOLD] as const

// The skill's name in big brush characters at (x, y), `time` seconds into the cut: each character slides in and
// settles, floats, carries colour fringes like the slashes, and is filled with the slash colours flowing through it,
// over a brush stroke that sweeps under them. Everything drifts up and fades as the cut ends.
export function drawMengTitle(c: C, x: number, y: number, time: number, tick: number) {
  const n = MENG_CLONE_TITLE.length, size = 24, gap = size * 1.08, width = gap * n
  const out = clamp01((MENG_BREEZE.paint - time) / FADE), left = x - width / 2, shift = (tick * 1.2) % width
  if (out <= 0) return
  c.save()
  c.lineJoin = c.lineCap = 'round'
  // The brush stroke under the name.
  const under: Stroke = { ax: left - 12, ay: y + size * 0.62, bx: left + width + 12, by: y + size * 0.55, w: 3.5, bend: -0.03, start: 0,
    dark: SILK, light: JADE_PALE, ghost: GOLD, seed: 7 }
  c.globalAlpha = out
  slash(c, under, ease((time - 0.15) / 0.3), out, Math.sin(tick * 0.9) * 0.6)
  c.font = `bold ${size}px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let i = 0; i < n; i++) {
    const p = ease((time - 0.05 - i * 0.08) / 0.22)
    if (p <= 0) continue
    const ch = MENG_CLONE_TITLE[i], scale = 1.6 - 0.6 * p, rise = (1 - out) * 14 + (1 - out) * i * 2
    const cx = left + gap * (i + 0.5) + (1 - p) * 22, cy = y + Math.sin(tick * 0.08 + i * 1.3) * 1.5 - rise
    c.save()
    c.translate(cx, cy)
    c.scale(scale, scale)
    c.globalAlpha = p * out
    const jitter = Math.sin(tick * 0.9 + i) * 0.7
    c.fillStyle = GOLD
    c.globalAlpha = p * out * 0.5
    c.fillText(ch, 1.6 + jitter, 0.8)
    c.fillStyle = CYAN
    c.fillText(ch, -1.6 - jitter, -0.6)
    c.globalAlpha = p * out
    c.strokeStyle = INK
    c.lineWidth = 5
    c.strokeText(ch, 0, 0)
    c.strokeStyle = '#ffffff'
    c.lineWidth = 1.6
    c.strokeText(ch, 0, 0)
    // The slash colours flow along the whole name; two repeats so the loop is seamless.
    const g0 = (left - shift - cx) / scale, g = c.createLinearGradient(g0, 0, g0 + (width * 2) / scale, 0)
    for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, TITLE_COLORS[k % 4])
    c.fillStyle = g
    c.fillText(ch, 0, 0)
    c.restore()
  }
  c.restore()
}

// A clone at ground point (x, y) breaking up into ink `p` (0..1) of the way: blots, cyan shards and a leaf flung off.
// `burst` throws them harder (a clone struck down rather than fading).
export function drawMengDissolve(c: C, x: number, y: number, p: number, seed: number, burst: number) {
  if (p <= 0 || p >= 1) return
  const out = 1 - p, spread = ease(p) * (16 + burst * 14)
  c.save()
  c.lineWidth = 0.4
  c.strokeStyle = INK
  for (let k = 0; k < 10; k++) {
    const a = rand(seed + k, 1) * Math.PI * 2, d = spread * (0.5 + rand(seed + k, 2) * 0.6)
    c.globalAlpha = out
    c.fillStyle = k % 4 ? INK : SILK
    c.beginPath()
    c.arc(x + Math.cos(a) * d, y - 20 + Math.sin(a) * d * 0.8 - p * 8, (0.8 + rand(seed + k, 3) * 1.8) * out, 0, Math.PI * 2)
    c.fill()
  }
  for (let k = 0; k < 4; k++) {
    const a = rand(seed + k, 4) * Math.PI * 2, d = spread * 1.2, s = 2 + rand(seed + k, 5) * 1.5
    c.save()
    c.translate(x + Math.cos(a) * d, y - 20 + Math.sin(a) * d * 0.8)
    c.rotate(a + p * 6)
    c.globalAlpha = out
    c.fillStyle = k % 2 ? CYAN : GLOW_PALE
    c.beginPath()
    c.moveTo(s * 1.6, 0)
    c.lineTo(-s * 0.6, s * 0.55)
    c.lineTo(-s * 0.3, -s * 0.6)
    c.closePath()
    c.fill()
    c.stroke()
    c.restore()
  }
  leaf(c, rand(seed, 6) < 0.4, x + spread * 0.6, y - 26 - spread * 0.4, p * 6, Math.cos(p * 10), 2.6, out)
  c.restore()
}

// The enemy, unsure which Meng Chuan is real: a brush question mark bobbing over the head at ground point (x, y).
export function drawMengConfused(c: C, x: number, y: number, tick: number) {
  c.save()
  c.font = `bold 15px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.translate(x + Math.sin(tick * 0.2) * 2, y - 52 + Math.sin(tick * 0.15) * 1.5)
  c.rotate(Math.sin(tick * 0.2) * 0.2)
  c.strokeStyle = PAPER
  c.lineWidth = 3
  c.strokeText('?', 0, 0)
  c.fillStyle = INK
  c.fillText('?', 0, 0)
  c.restore()
}

// ---- Body Refinement Divine-Demon (炼体神魔), the fire bar ----

// A brawler: fists instead of the jian. Undying Body: he takes `armor` less damage from enemies and regenerates
// `regen` HP/s all the time. Every `heavy.every`-th punch is a heavy straight hitting every enemy in a cone `reach`
// px past both radii and `span` radians either side of where he faces, for `heavy.damage` times the damage and
// `heavy.knockback` times the knockback. No devils and no bodies, as in the thunder form.
export const MENG_BODY = {
  name: 'Body Refinement Divine-Demon',
  stats: { speed: 175, range: 16, cooldown: 0.3, damage: 22, knockback: 120, color: '#e0482a' },
  armor: 0.3, regen: 10,
  heavy: { every: 4, reach: 40, span: 0.52, damage: 1.5, knockback: 2 },
} as const
export const MENG_BODY_FORM = 0 // index of the fire bar

// Sha qi refined into his flesh leaks out of every punch, one colour per punch in this order.
export const MENG_SHA = ['#d8322a', '#f07a1e', '#f2c230', '#3fa45a', '#2f6be0', INK, '#f6f2ea'] as const
const SHA_PALE = ['#ff9a8a', '#ffc48a', '#fff1a8', '#b4f0c0', '#9fd2ff', '#8a86a0', '#ffffff'] as const
export const MENG_SHA_LIFE = 0.6
const shaPale = (color: string) => SHA_PALE[Math.max(0, (MENG_SHA as readonly string[]).indexOf(color))]
// White sha paints its strokes in a pale grey so they still read; its edges stay ink.
const shaStroke = (color: string) => color === MENG_SHA[6] ? '#b9b4c8' : color
const shaLight = (color: string) => color === MENG_SHA[2] || color === MENG_SHA[6]
const LOTUS_RED = '#c8231e', LOTUS_DEEP = '#8a1016', LOTUS_PALE = '#ffb0a0', EMBER = '#ff8a2a', EMBER_PALE = '#ffd36a'

// A ragged blob path around (0, 0), `squash` as deep as wide, the same every frame for `seed`.
function inkBlob(c: C, r: number, squash: number, seed: number) {
  c.beginPath()
  for (let i = 0; i <= 28; i++) {
    const a = i / 28 * Math.PI * 2, d = r * (1 + 0.18 * Math.sin(3 * a + seed) + 0.1 * Math.sin(7 * a + seed * 1.7))
    c.lineTo(Math.cos(a) * d, Math.sin(a) * d * squash)
  }
  c.closePath()
}

// The painted motif each sha colour blooms into, `S` px across its body, facing +x (the throw), with `fill` the
// colour, `pale` its light tint. Seven classical subjects, one per colour: plum blossom, curling flame, chrysanthemum,
// bamboo, auspicious cloud, ink orchid and white mist cloud. All crisp shapes with ink outlines.
function shaMotif(c: C, k: number, S: number, fill: string, pale: string, spin: number) {
  const radial = (x: number, y: number, r: number) => {
    const g = c.createRadialGradient(x * 0.4, y * 0.4, 0, x, y, r)
    g.addColorStop(0, pale)
    g.addColorStop(1, fill)
    return g
  }
  const outline = (width = 0.8) => {
    c.strokeStyle = INK
    c.lineWidth = width
    c.stroke()
  }
  // A pointed leaf or petal from the origin along +x: `len` long, `w` wide, washing from `base` to `tip`.
  const blade = (angle: number, len: number, w: number, base: string, tip: string, bend = 0) => {
    c.save()
    c.rotate(angle)
    const g = c.createLinearGradient(0, 0, len, 0)
    g.addColorStop(0, base)
    g.addColorStop(1, tip)
    c.fillStyle = g
    c.beginPath()
    c.moveTo(0, 0)
    c.quadraticCurveTo(len * 0.45, -w + bend, len, bend * 1.6)
    c.quadraticCurveTo(len * 0.45, w + bend, 0, 0)
    c.fill()
    outline(0.6)
    c.restore()
  }
  // An auspicious cloud of three lobes with a curl in each and a tail streaming back.
  const cloud = (body: string, curls: string) => {
    const lobes = [[-0.45, 0.05, 0.42], [0, -0.22, 0.55], [0.5, 0.06, 0.4]] as const
    c.beginPath()
    for (const [x, y, r] of lobes) {
      c.moveTo(x * S + r * S, y * S)
      c.arc(x * S, y * S, r * S, 0, Math.PI * 2)
    }
    c.fillStyle = body
    c.fill()
    outline(0.9)
    c.strokeStyle = curls
    c.lineWidth = 1.1
    for (const [x, y, r] of lobes) curl(c, x * S, y * S, r * S * 0.62, 1, spin * 2 + x)
    c.strokeStyle = INK
    c.lineWidth = 0.8
    c.beginPath()
    c.moveTo(-0.8 * S, 0.3 * S)
    c.quadraticCurveTo(-1.3 * S, 0.45 * S, -1.6 * S, 0.15 * S)
    c.stroke()
  }
  if (k === 0) {
    // Plum blossom (梅): five round petals around gold stamens.
    for (let i = 0; i < 5; i++) {
      const a = spin + i * Math.PI * 2 / 5, x = Math.cos(a) * S * 0.42, y = Math.sin(a) * S * 0.42
      c.fillStyle = radial(x, y, S * 0.5)
      c.beginPath()
      c.arc(x, y, S * 0.4, 0, Math.PI * 2)
      c.fill()
      outline()
    }
    c.strokeStyle = INK
    c.lineWidth = 0.6
    c.fillStyle = INK
    for (let i = 0; i < 8; i++) {
      const a = spin * 1.5 + i * Math.PI / 4, r = S * (0.38 + (i % 2) * 0.1)
      line(c, 0, 0, Math.cos(a) * r, Math.sin(a) * r)
      c.beginPath()
      c.arc(Math.cos(a) * r, Math.sin(a) * r, 0.9, 0, Math.PI * 2)
      c.fill()
    }
    c.lineWidth = 0.7
    ellipse(c, 0, 0, S * 0.14, S * 0.14, GOLD)
  } else if (k === 1) {
    // Curling flame (火焰纹): three tongues hooking at the tip, a pale core in each, a curl at the root.
    for (const [a, len, w] of [[-0.55, 1.05, 0.26], [0, 1.45, 0.34], [0.55, 1.05, 0.26]] as const) {
      c.save()
      c.rotate(a)
      const L = len * S, W = w * S, hook = Math.sin(spin * 3 + a * 4) * W * 0.6
      const tongue = (scale: number) => {
        c.beginPath()
        c.moveTo(0, -W * scale)
        c.bezierCurveTo(L * 0.4, -W * 1.3 * scale, L * 0.75, -W * 0.2 + hook, L * scale, hook - W * 0.4)
        c.bezierCurveTo(L * 0.7 * scale, W * 0.3 + hook * 0.5, L * 0.4, W * 1.1 * scale, 0, W * scale)
        c.closePath()
      }
      const g = c.createLinearGradient(0, 0, L, 0)
      g.addColorStop(0, '#d8322a')
      g.addColorStop(0.5, fill)
      g.addColorStop(1, pale)
      c.fillStyle = g
      tongue(1)
      c.fill()
      outline(0.7)
      c.fillStyle = EMBER_PALE
      tongue(0.55)
      c.fill()
      c.restore()
    }
    c.strokeStyle = INK
    c.lineWidth = 1
    curl(c, -S * 0.15, S * 0.1, S * 0.35, -1, spin * 2)
  } else if (k === 2) {
    // Chrysanthemum (菊): two rings of slender petals, pale outside, golden inside, around a dark heart.
    for (const [n, r, w, col, off] of [[16, 1, 0.13, pale, 0], [12, 0.7, 0.12, fill, 0.13]] as const) {
      for (let i = 0; i < n; i++) {
        const a = spin + off + i * Math.PI * 2 / n
        c.save()
        c.rotate(a)
        c.fillStyle = col
        c.beginPath()
        c.ellipse(r * S * 0.5, 0, r * S * 0.5, w * S, 0, 0, Math.PI * 2)
        c.fill()
        outline(0.5)
        c.restore()
      }
    }
    c.lineWidth = 0.7
    ellipse(c, 0, 0, S * 0.2, S * 0.2, GOLD_DARK)
    c.fillStyle = INK
    for (let i = 0; i < 6; i++) c.fillRect(Math.cos(i) * S * 0.1 - 0.5, Math.sin(i * 2.3) * S * 0.1 - 0.5, 1, 1)
  } else if (k === 3) {
    // Bamboo (竹): a spray of five pointed leaves fanning forward from a dark node.
    for (const [a, len] of [[-0.95, 1.05], [-0.45, 1.3], [0, 1.5], [0.45, 1.25], [0.9, 1]] as const) {
      blade(a + Math.sin(spin * 2 + a) * 0.05, len * S, S * 0.2, '#1f6b34', pale, a * S * 0.05)
      c.save()
      c.rotate(a)
      c.strokeStyle = '#1f5a2c'
      c.lineWidth = 0.5
      line(c, len * S * 0.1, 0, len * S * 0.8, a * S * 0.06)
      c.restore()
    }
    c.lineWidth = 0.8
    ellipse(c, 0, 0, S * 0.12, S * 0.18, '#1f5a2c')
  } else if (k === 4) {
    // Auspicious cloud (祥云) in blue.
    cloud(radial(0, -S * 0.1, S), fill)
  } else if (k === 5) {
    // Ink orchid (兰): long sweeping leaves of pure ink, thick in the middle and pointed at both ends, one small flower.
    for (const [a, len, bow] of [[-0.6, 1.7, -0.5], [0, 1.9, 0.35], [0.5, 1.4, 0.6]] as const) {
      c.save()
      c.rotate(a)
      const L = len * S, B = bow * S, W = S * 0.14
      c.fillStyle = INK
      c.beginPath()
      c.moveTo(0, 0)
      c.quadraticCurveTo(L * 0.5, B - W, L, B * 0.3)
      c.quadraticCurveTo(L * 0.5, B + W, 0, 0)
      c.fill()
      c.restore()
    }
    for (let i = 0; i < 3; i++) blade(-1.9 + i * 0.7 + spin * 0.2, S * 0.55, S * 0.16, '#8a86a0', '#ffffff')
    c.fillStyle = INK
    c.beginPath()
    c.arc(0, 0, S * 0.08, 0, Math.PI * 2)
    c.fill()
  } else {
    // White mist cloud: an auspicious cloud of paper white, ink outlined, with grey curls.
    cloud('#ffffff', '#8a86a0')
  }
}

// A splash of sha at (x, y) `age` s old, thrown toward `angle` (null: upward), `size` times the base size, painted like
// a scroll: a soft halo of the tint, a brushed ring sweeping round, and the colour's own motif (see shaMotif) opening
// out of the punch's head with a small overshoot, drifting along the throw and turning gently, a few gold motes rising;
// it fades cleanly after MENG_SHA_LIFE.
export function drawMengSha(c: C, x: number, y: number, color: string, age: number, seed: number, angle: number | null = null, size = 1) {
  const p = clamp01(age / MENG_SHA_LIFE), bloom = ease(p / 0.22), out = 1 - clamp01((p - 0.45) / 0.55)
  if (out <= 0 || bloom <= 0) return
  const k = Math.max(0, (MENG_SHA as readonly string[]).indexOf(color)), pale = shaPale(color), S = 11 * size
  const throwAt = angle ?? -Math.PI / 2, spin = (rand(seed, 1) - 0.5) * 0.8 + p * 0.5
  c.save()
  c.translate(x + Math.cos(throwAt) * S * 0.4 * bloom, y + Math.sin(throwAt) * S * 0.3 * bloom)
  c.lineCap = c.lineJoin = 'round'
  // Halo.
  const halo = c.createRadialGradient(0, 0, 0, 0, 0, S * 1.8 * bloom + 0.1)
  halo.addColorStop(0, color === INK ? 'rgba(217,212,230,.7)' : pale)
  halo.addColorStop(1, 'rgba(255,255,255,0)')
  c.globalAlpha = 0.5 * out
  c.fillStyle = halo
  c.beginPath()
  c.arc(0, 0, S * 1.8 * bloom + 0.1, 0, Math.PI * 2)
  c.fill()
  // A brushed ring sweeping round it, pressed at the start and lifting off.
  const sweep = ease(p / 0.3) * Math.PI * 1.7, r0 = S * 1.35
  c.globalAlpha = 0.75 * out
  c.strokeStyle = shaLight(color) ? INK : color
  for (let i = 0; i < 6; i++) {
    c.lineWidth = 2.2 * (1 - i / 6) + 0.3
    c.beginPath()
    c.arc(0, 0, r0, seed + sweep * i / 6, seed + sweep * (i + 1) / 6)
    c.stroke()
  }
  // The motif, opening with a little overshoot.
  const scale = bloom * (1 + 0.1 * Math.sin(clamp01(p / 0.35) * Math.PI))
  c.globalAlpha = out
  c.save()
  c.scale(scale, scale)
  c.rotate(k === 1 || k === 3 || k === 5 ? throwAt : spin)
  if (Math.cos(throwAt) < 0 && (k === 1 || k === 3 || k === 5)) c.scale(1, -1) // keep thrown motifs right way up
  shaMotif(c, k, S, color === MENG_SHA[6] ? '#ffffff' : color, pale, spin)
  c.restore()
  // Gold motes drifting up.
  c.fillStyle = GOLD
  for (let i = 0; i < 3; i++) {
    const rise = p * (14 + i * 6), a = rand(seed, i + 5) * Math.PI * 2, d = S * (0.9 + i * 0.25)
    c.globalAlpha = out * (1 - p)
    c.fillRect(Math.cos(a) * d - 0.8, Math.sin(a) * d * 0.6 - rise - 0.8, 1.6, 1.6)
  }
  c.restore()
}

// A brush stroke of sha colour from (ax, ay) to (bx, by).
const shaSlash = (ax: number, ay: number, bx: number, by: number, w: number, bend: number, color: string, seed: number): Stroke =>
  ({ ax, ay, bx, by, w, bend, start: 0, dark: shaStroke(color), light: shaPale(color), ghost: color, seed })

// One punch in sprite-local units (feet at 0,0, facing right), `progress` 0..1 over MENG_PUNCH_LIFE, `k` the punch's
// number (left and right fists curve opposite ways): a black ink brush stroke drawn after the fist along a curved path,
// pressed thick at the fist and tapering behind it into split dry hairs, with drops flicked off its bend; a painted
// fist of the sha colour rides its head. The heavy straight's stroke and fist are
// longer and heavier.
export const MENG_PUNCH_LIFE = 0.45 // how long a punch's ink stroke stays on the field

export function drawMengPunch(c: C, progress: number, color: string, heavy: boolean, k: number) {
  const head = ease(progress * 4.5), fade = 1 - clamp01((progress - 0.45) / 0.55)
  if (fade <= 0 || head <= 0.02) return
  const side = k % 2 ? 1 : -1, reach = heavy ? 72 : 54, W = heavy ? 14 : 10
  // A long quadratic sweep from well behind his shoulder, bowed up or down, out past the fist.
  const A = [-20, -21 + side * 13], B = [reach * 0.38, -21 + side * (heavy ? 20 : 24)], E = [reach, -20]
  const at = (s: number) => {
    const u = 1 - s
    return [u * u * A[0] + 2 * u * s * B[0] + s * s * E[0], u * u * A[1] + 2 * u * s * B[1] + s * s * E[1]]
  }
  const normal = (s: number) => {
    const u = 1 - s, dx = 2 * u * (B[0] - A[0]) + 2 * s * (E[0] - B[0]), dy = 2 * u * (B[1] - A[1]) + 2 * s * (E[1] - B[1]), d = Math.hypot(dx, dy) || 1
    return [-dy / d, dx / d]
  }
  const tail = 0, N = 30
  // Width along the drawn part: a pointed tail swelling to the full pressed brush toward the fist, drying thinner as it fades.
  const width = (t: number) => W * (0.12 + 0.88 * Math.sin(Math.PI / 2 * Math.min(1, t * 1.15))) * (0.45 + 0.55 * fade)
  c.save()
  c.lineJoin = c.lineCap = 'round'
  c.globalAlpha = fade
  c.beginPath()
  for (let i = 0; i <= N; i++) {
    const t = i / N, s = tail + (head - tail) * t, [x, y] = at(s), [nx, ny] = normal(s), w = width(t) / 2
    if (i) c.lineTo(x + nx * w, y + ny * w)
    else c.moveTo(x + nx * w, y + ny * w)
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N, s = tail + (head - tail) * t, [x, y] = at(s), [nx, ny] = normal(s), w = width(t) / 2
    c.lineTo(x - nx * w, y - ny * w)
  }
  c.closePath()
  c.fillStyle = INK
  c.fill()
  // Dry-brush hairs splitting off the tail half.
  c.strokeStyle = INK
  c.lineWidth = 0.6
  for (let h = 0; h < 4; h++) {
    const off = (h / 3 - 0.5) * W * 0.9
    c.beginPath()
    for (let i = 0; i <= 8; i++) {
      const t = i / 8 * 0.55, s = tail + (head - tail) * t, [x, y] = at(s), [nx, ny] = normal(s), o = off * (1.3 - t)
      if (i) c.lineTo(x + nx * o, y + ny * o)
      else c.moveTo(x + nx * o, y + ny * o)
    }
    c.stroke()
  }
  // Drops flicked off the bend.
  c.fillStyle = INK
  for (let d = 0; d < 3; d++) {
    const s = clamp01(tail + (head - tail) * (0.45 + d * 0.12)), [x, y] = at(s), [nx, ny] = normal(s)
    const fling = (3 + d * 2.5) * (1 - fade + 0.3)
    c.beginPath()
    c.arc(x + nx * side * fling, y + ny * side * fling, 0.9 - d * 0.2, 0, Math.PI * 2)
    c.fill()
  }
  // The sha fist riding the stroke's head, knuckles along its direction of travel, wreathed in its demon aura.
  const [hx, hy] = at(head), [tx, ty] = normal(head), size = heavy ? 1.35 : 1
  c.translate(hx, hy)
  c.rotate(Math.atan2(-tx, ty))
  demonAura(c, color, size, progress * MENG_PUNCH_LIFE, k * 7.3, 0.4 + 0.6 * ease(progress * 6))
  glowingFist(c, color, size)
  c.restore()
}

// Seven Sha Fists (七煞拳), his first skill here: an enemy `min`..`range` px away makes him rush at it at `speed` px/s,
// then throw `count` punches `interval` s apart, one per sha colour, for `damage` each, and end in a burst of all seven
// colours: `burstDamage` and `burstKnockback` to every enemy within `burstRadius`. He holds the follow-through `burst` s.
// Demon Assault (body form): he stands and machine-guns his punches, `count` sha fists flying at the target one every
// `interval` s, each fanned up to `spread` radians off the aim and hitting the first enemy on its way.
export const MENG_ASSAULT = {
  min: 30, range: 230, count: 16, interval: 0.09, speed: 560, spread: 0.18, damage: 9, knockback: 40, reach: 10,
  recover: 0.2, cooldown: 9,
} as const

// ---- The sha fist: what every body-form punch throws ----

export const SHA_FIST_LIFE = 0.32 // how long a fist's burst lasts where a punch lands

const shaFill = (color: string) => color === INK ? '#4a4462' : color

// A clenched fist in sha colour pointing along +x, knuckles forward, about 16 px long at `s` 1: the back of the hand,
// four knuckles, the thumb folded across, ink-outlined with a pale shine.
function shaFistGlyph(c: C, color: string, s: number) {
  const fill = shaFill(color), pale = shaPale(color)
  c.save()
  c.scale(s, s)
  c.lineJoin = c.lineCap = 'round'
  c.strokeStyle = INK
  c.lineWidth = 1.1
  const g = c.createLinearGradient(0, -7, 0, 7)
  g.addColorStop(0, pale)
  g.addColorStop(0.55, fill)
  g.addColorStop(1, fill)
  c.fillStyle = g
  c.beginPath() // the back of the hand
  c.moveTo(-8, -5)
  c.quadraticCurveTo(-1, -7.5, 4, -6)
  c.lineTo(4, 6)
  c.quadraticCurveTo(-1, 7.2, -8, 5)
  c.closePath()
  c.fill()
  c.stroke()
  for (let i = 0; i < 4; i++) { // knuckles
    c.beginPath()
    c.ellipse(5, -4.5 + i * 3, 2.6, 1.75, 0, 0, Math.PI * 2)
    c.fill()
    c.stroke()
  }
  c.beginPath() // the thumb folded across the fingers
  c.moveTo(-3, 6)
  c.quadraticCurveTo(1.5, 3.5, 5.5, 4.2)
  c.lineWidth = 2.6
  c.stroke()
  c.strokeStyle = fill
  c.lineWidth = 1.2
  c.stroke()
  c.strokeStyle = INK
  c.lineWidth = 0.7
  for (let i = 0; i < 3; i++) { const y = -3 + i * 3; c.beginPath(); c.moveTo(0.5, y); c.lineTo(3.4, y); c.stroke() } // finger creases
  c.strokeStyle = 'rgba(255,255,255,.75)'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(-6, -4)
  c.quadraticCurveTo(-1, -5.8, 3, -4.8)
  c.stroke()
  c.fillStyle = GOLD // a gold wrist band
  c.strokeStyle = INK
  c.lineWidth = 0.9
  c.beginPath()
  c.moveTo(-8, -5)
  c.lineTo(-10.5, -4.4)
  c.lineTo(-10.5, 4.4)
  c.lineTo(-8, 5)
  c.closePath()
  c.fill()
  c.stroke()
  c.restore()
}

// The demon aura round a fist at the origin pointing +x, in its sha colour, `s` its scale and `t` seconds of
// flicker: a glow, flame tongues licking back off it edged in ink, two horn flames curling back above and below
// round a shadowy demon mask with glowing eyes, and embers trailing off. Drawn under the fist.
function demonAura(c: C, color: string, s: number, t: number, seed: number, alpha = 1) {
  const fill = shaFill(color), pale = color === INK ? '#b9a8e0' : shaPale(color), flame = color === INK ? '#4a3a6a' : fill
  c.save()
  c.scale(s, s)
  c.globalAlpha *= alpha
  c.lineJoin = c.lineCap = 'round'
  const glow = c.createRadialGradient(-2, 0, 0, -2, 0, 20) // the glow
  glow.addColorStop(0, pale)
  glow.addColorStop(0.45, color === MENG_SHA[6] ? 'rgba(255,255,255,.5)' : fill)
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  const base = c.globalAlpha
  c.globalAlpha = base * 0.55
  c.fillStyle = glow
  c.beginPath()
  c.arc(-2, 0, 20, 0, Math.PI * 2)
  c.fill()
  c.globalAlpha = base * 0.5 // the demon mask behind: a horned shadow with two glowing eyes
  c.fillStyle = INK
  c.beginPath()
  c.moveTo(-4, -9)
  c.quadraticCurveTo(-16, -15, -24, -16) // top horn
  c.quadraticCurveTo(-18, -9, -17, -5)
  c.quadraticCurveTo(-22, 0, -17, 5)
  c.quadraticCurveTo(-18, 9, -24, 16) // bottom horn
  c.quadraticCurveTo(-16, 15, -4, 9)
  c.closePath()
  c.fill()
  c.globalAlpha = base * (0.75 + 0.25 * Math.sin(t * 30 + seed))
  c.fillStyle = pale
  c.shadowColor = pale
  c.shadowBlur = 6
  for (const y of [-3.2, 3.2]) {
    c.beginPath()
    c.moveTo(-13, y - 1.1)
    c.lineTo(-9, y)
    c.lineTo(-13, y + 1.1)
    c.closePath()
    c.fill()
  }
  c.shadowBlur = 0
  // Flame tongues licking back and out, flickering.
  for (let i = 0; i < 7; i++) {
    const spread = (i - 3) / 3, wave = Math.sin(t * 24 + i * 1.7 + seed), len = 16 + rand(seed, i) * 12 + wave * 3
    const y0 = spread * 6, y1 = spread * (12 + rand(seed, i + 7) * 6) + wave * 2.5, w = 2.6 - Math.abs(spread)
    const tx = -6 - len, cx = -6 - len * 0.5, cy = (y0 + y1) / 2 + wave * 3
    c.globalAlpha = base * 0.9
    c.beginPath()
    c.moveTo(-4, y0 - w)
    c.quadraticCurveTo(cx, cy - w * 1.6, tx, y1)
    c.quadraticCurveTo(cx, cy + w * 1.6, -4, y0 + w)
    c.closePath()
    c.fillStyle = i % 2 ? flame : pale
    c.fill()
    c.strokeStyle = INK
    c.lineWidth = 0.45
    c.globalAlpha = base * 0.6
    c.stroke()
  }
  // Horn flames curling back off the top and bottom of the fist.
  for (const side of [-1, 1]) {
    const flick = Math.sin(t * 18 + side + seed) * 1.5
    c.globalAlpha = base
    c.beginPath()
    c.moveTo(2, side * 5)
    c.quadraticCurveTo(-6, side * (14 + flick), -15, side * (17 + flick))
    c.quadraticCurveTo(-8, side * (10 + flick), -3, side * 7.5)
    c.closePath()
    c.fillStyle = flame
    c.fill()
    c.strokeStyle = INK
    c.lineWidth = 0.6
    c.stroke()
  }
  c.fillStyle = pale // embers trailing off
  for (let i = 0; i < 5; i++) {
    const drift = (t * 2.2 + rand(seed, i + 20)) % 1
    c.globalAlpha = base * (1 - drift)
    c.beginPath()
    c.arc(-10 - drift * 22, (rand(seed, i + 30) - 0.5) * 18 - drift * 4, 0.9 * (1 - drift * 0.5), 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// The fist itself with a soft glow of its colour round it.
function glowingFist(c: C, color: string, s: number) {
  c.save()
  c.shadowColor = color === INK ? '#b9a8e0' : shaPale(color)
  c.shadowBlur = 9 * s
  shaFistGlyph(c, color, s)
  c.restore()
}

// Speed strokes streaming back from a fist at the origin (pointing +x): ink brush lines with a sha wash under them.
function fistStreaks(c: C, color: string, s: number, seed: number, alpha: number) {
  c.save()
  c.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    const y = (i - 1.5) * 4.2 * s + (rand(seed, i) - 0.5) * 2, len = (16 + rand(seed, i + 4) * 18) * s, x0 = -9 * s
    c.globalAlpha = alpha * 0.45
    c.strokeStyle = shaStroke(color)
    c.lineWidth = 3.4 * s
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 - len, y); c.stroke()
    c.globalAlpha = alpha
    c.strokeStyle = INK
    c.lineWidth = 0.8 * s
    c.beginPath(); c.moveTo(x0 - 2, y); c.lineTo(x0 - len * 0.8, y + (rand(seed, i + 8) - 0.5) * 1.5); c.stroke()
  }
  c.restore()
}

// A flying sha fist at (x, y) heading along `angle` (Demon Assault's shots), with its streaks; `time` in seconds flickers its aura.
export function drawShaFistShot(c: C, x: number, y: number, angle: number, color: string, seed: number, time: number) {
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  if (Math.cos(angle) < 0) c.scale(1, -1) // thumb stays underneath
  fistStreaks(c, color, 0.85, seed, 0.9)
  demonAura(c, color, 0.75, time, seed)
  glowingFist(c, color, 0.85)
  c.restore()
}

// Where a punch lands at (x, y), thrown along `angle`, `age` s old: a ragged splash of the colour, tapered rays of
// colour edged in ink, ink drops thrown out, and the fist's print swelling and fading. `size` scales it.
export function drawShaFist(c: C, x: number, y: number, angle: number, color: string, age: number, seed: number, size = 1) {
  const flip = Math.cos(angle) < 0 ? -1 : 1, b = clamp01(age / SHA_FIST_LIFE)
  if (b >= 1) return
  const out = 1 - b, pop = ease(b / 0.35), S = 12 * size
  c.save()
  c.translate(x, y)
  c.lineJoin = c.lineCap = 'round'
  // The splash: a ragged blob of the colour, edged in ink.
  c.globalAlpha = out * 0.85
  c.fillStyle = shaFill(color)
  c.beginPath()
  for (let i = 0; i <= 14; i++) {
    const a = i / 14 * Math.PI * 2, r = S * pop * (0.65 + rand(seed, i % 14) * 0.5)
    if (i) c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8)
    else c.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.8)
  }
  c.closePath()
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.9
  c.stroke()
  // Rays: tapered brush spikes of colour bursting out, mostly forward along the punch.
  for (let i = 0; i < 8; i++) {
    const a = angle + (i - 3.5) / 3.5 * 1.5 + (rand(seed, i + 20) - 0.5) * 0.3
    const r0 = S * 0.5 * pop, r1 = S * (1.2 + rand(seed, i + 30) * 1.1) * ease(b / 0.25), w = S * 0.16
    const px = -Math.sin(a), py = Math.cos(a)
    c.beginPath()
    c.moveTo(Math.cos(a) * r0 + px * w, Math.sin(a) * r0 + py * w)
    c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1)
    c.lineTo(Math.cos(a) * r0 - px * w, Math.sin(a) * r0 - py * w)
    c.closePath()
    c.globalAlpha = out
    c.fillStyle = i % 3 ? shaFill(color) : shaPale(color)
    c.fill()
    c.lineWidth = 0.7
    c.stroke()
  }
  // Ink drops thrown out.
  c.fillStyle = INK
  for (let i = 0; i < 5; i++) {
    const a = angle + (rand(seed, i + 40) - 0.5) * 2.4, d = S * (0.8 + b * 1.6 + rand(seed, i + 50))
    c.globalAlpha = out
    c.beginPath()
    c.arc(Math.cos(a) * d, Math.sin(a) * d, 1.3 * (1 - b * 0.6), 0, Math.PI * 2)
    c.fill()
  }
  // The fist's print swelling and fading at the heart of it.
  c.rotate(angle)
  c.scale(1, flip)
  c.globalAlpha = out * out
  shaFistGlyph(c, color, size * (1 + b * 0.7))
  c.restore()
}

export const MENG_FISTS = {
  min: 1, range: 250, speed: 950, count: 7, interval: 0.06, damage: 7, burstDamage: 12, burstRadius: 50, burstKnockback: 260,
  burst: 0.5, cooldown: 7,
} as const

// Sonic Dash, his gap-closer: an enemy `min`..`range` px away makes him streak to it at `speed` px/s (giving up after
// `timeout` s, a wall in the way) and hit it for `damage`, knocking it up like Yan Jin's slam. Every `cooldown` s; his
// red-orange streak fades over `trail` s.
export const MENG_SONIC = { min: 80, range: 320, speed: 1400, damage: 30, cooldown: 6, timeout: 0.4, trail: 0.35 } as const

// The fists landing on a target whose body is at (x, y), `time` s after the first: each a brush stroke of its colour
// driving in from its own angle around the target, a pale fist-shaped afterimage at its head, fading.
export function drawMengFists(c: C, x: number, y: number, time: number, seed: number) {
  const F = MENG_FISTS
  c.save()
  c.lineJoin = c.lineCap = 'round'
  for (let k = 0; k < F.count; k++) {
    const age = time - k * F.interval
    if (age < 0) break
    const fade = clamp01(1 - age / 0.35)
    if (fade <= 0) continue
    const a = seed + k * 2.4 + (rand(seed, k) - 0.5) * 0.4, color = MENG_SHA[k]
    const fx = x + Math.cos(a) * 30, fy = y + Math.sin(a) * 16, hx = x + Math.cos(a) * 7, hy = y + Math.sin(a) * 4
    c.globalAlpha = fade
    slash(c, shaSlash(fx, fy, hx, hy, 3.5, k % 2 ? 0.08 : -0.08, color, seed + k), ease(age / 0.05), fade, 0)
    if (age < 0.18) {
      c.globalAlpha = (1 - age / 0.18) * 0.85
      c.lineWidth = 1
      c.strokeStyle = INK
      c.fillStyle = shaPale(color)
      c.beginPath()
      c.ellipse(hx + Math.cos(a) * 3, hy + Math.sin(a) * 2, 3.6, 3.2, a, 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }
  }
  c.restore()
}

// The closing burst at a target's body (x, y), `progress` 0..1: a white flash, then seven petals of colour brushed
// out from the centre like a painted flower, an ink ring spreading and ink flung outward as drops.
export function drawMengBurst(c: C, x: number, y: number, progress: number, seed: number) {
  const p = clamp01(progress), out = 1 - p, R = MENG_FISTS.burstRadius
  if (out <= 0) return
  c.save()
  c.translate(x, y)
  c.lineJoin = c.lineCap = 'round'
  if (p < 0.2) {
    c.globalAlpha = 1 - p / 0.2
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.arc(0, 0, 10 + p * 60, 0, Math.PI * 2)
    c.fill()
  }
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * Math.PI * 2 + seed
    c.globalAlpha = out
    slash(c, shaSlash(Math.cos(a) * 4, Math.sin(a) * 3, Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.55, 6, 0.12, MENG_SHA[k], k * 3),
      ease(p / 0.25), 0.4 + out * 0.6, 0)
  }
  const ring = ease(p / 0.6)
  c.globalAlpha = out * 0.8
  c.strokeStyle = INK
  c.lineWidth = 2 * out + 0.5
  c.beginPath()
  c.ellipse(0, 0, R * ring + 0.1, R * 0.55 * ring + 0.1, 0, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = INK
  for (let k = 0; k < 12; k++) {
    const a = rand(seed * 10, k) * Math.PI * 2, d = R * (0.5 + rand(seed * 10, k + 20) * 0.7) * ease(p / 0.5)
    c.globalAlpha = out
    c.beginPath()
    c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.6 + p * p * 10, 1.6 - (k % 3) * 0.4, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

// Rampage (狂暴), the Body Refinement form's last stand: the first time he drops below `health` of his HP he rampages
// for the rest of the fight. Nothing stuns, freezes, scares, lifts, lures or grabs him, and his attacks become a chain:
// a left hook and a right hook (`hook` × his damage, `hookKnockback` × his knockback), then a ground slam: `slam` × his
// damage and `slamKnockback` px/s to every enemy within `radius` px of where his fists land, knocking them all up.
// The slam leaves a burning handprint that lasts `print` s, and he takes `recover` s to come up out of it.
export const MENG_RAGE = { health: 0.25, hook: 1.3, hookKnockback: 1.4, slam: 2.4, slamKnockback: 160, radius: 80, recover: 0.7, print: 5 } as const

// His rampage, feet at (x, y), `size` his sprite scale: dark red and orange flames licking up round his body, black
// smoke and embers rising off him.
export function drawMengRage(c: C, x: number, y: number, size: number, tick: number, seed: number) {
  c.save()
  for (let i = 0; i < 8; i++) {
    const u = (tick * 0.03 + rand(seed, i)) % 1, side = i % 2 ? 1 : -1, life = Math.sin(u * Math.PI)
    const bx = x + side * (8 + rand(seed, i + 7) * 7) * size, by = y - (6 + rand(seed, i + 14) * 26) * size
    const h = (10 + 10 * rand(seed, i + 21)) * size * life
    c.globalAlpha = 0.6 * life
    c.fillStyle = i % 3 ? LOTUS_RED : EMBER
    c.beginPath()
    c.moveTo(bx - 3 * size, by)
    c.quadraticCurveTo(bx - 2 * size + side * 2, by - h * 0.6, bx + side * 3 * size, by - h - u * 8 * size)
    c.quadraticCurveTo(bx + size, by - h * 0.4, bx + 3 * size, by)
    c.closePath()
    c.fill()
  }
  c.globalAlpha = 1
  for (let i = 0; i < 4; i++) {
    const u = (tick * 0.012 + rand(seed, i + 30)) % 1
    puff(c, x + (rand(seed, i + 31) - 0.5) * 26 * size, y - (30 + u * 36) * size, (5 + u * 8) * size, 0.35 * Math.sin(u * Math.PI))
  }
  c.fillStyle = EMBER_PALE
  for (let i = 0; i < 6; i++) {
    const u = (tick * 0.02 + rand(seed, i + 40)) % 1
    c.globalAlpha = 1 - u
    c.fillRect(x + (rand(seed, i + 41) - 0.5) * 30 * size + Math.sin(tick * 0.1 + i) * 2, y - (10 + u * 50) * size, 1.6, 1.6)
  }
  c.restore()
}

// The handprint his slam leaves at ground point (x, y), fingers toward `angle`, `age` s old: a giant palm and splayed
// fingers pressed into the ground in black ink, rimmed with embers that cool from gold to dull red, cracks splitting
// out from it, and as it lands a shock ring and flung ink. It fades over its last second.
export function drawMengPrint(c: C, x: number, y: number, angle: number, age: number, seed: number) {
  const P = MENG_RAGE.print, fade = clamp01(P - age), heat = clamp01(1 - age / (P * 0.7)), land = ease(age / 0.12)
  if (fade <= 0) return
  c.save()
  c.translate(x, y)
  c.scale(1, 0.55) // lying on the ground
  c.lineCap = c.lineJoin = 'round'
  c.globalAlpha = fade
  if (age < 0.45) {
    const p = age / 0.45
    c.strokeStyle = INK
    c.lineWidth = 6 * (1 - p)
    c.beginPath()
    c.arc(0, 0, 20 + 90 * ease(p), 0, Math.PI * 2)
    c.stroke()
    c.strokeStyle = `rgba(255,140,40,${1 - p})`
    c.lineWidth = 2
    c.stroke()
    c.fillStyle = INK
    c.globalAlpha = fade * (1 - p)
    for (let i = 0; i < 12; i++) {
      const a = rand(seed, i) * Math.PI * 2, d = 26 + 70 * ease(p) * (0.5 + rand(seed, i + 12))
      c.beginPath()
      c.arc(Math.cos(a) * d, Math.sin(a) * d, 1.5 + rand(seed, i + 24) * 3, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = fade
  }
  c.rotate(angle)
  const k = 1.3 - 0.3 * land // slammed in, settling
  c.scale(k, k)
  c.strokeStyle = 'rgba(26,16,20,.8)'
  for (let i = 0; i < 9; i++) { // cracks splitting out from it
    let a = rand(seed, i + 40) * Math.PI * 2, r = 16
    const pts = [Math.cos(a) * r, Math.sin(a) * r], len = (20 + rand(seed, i + 50) * 30) * land
    for (let s = 1; s <= 4; s++) {
      a += (rand(seed * 3 + i, s) - 0.5) * 0.6
      r += len / 4
      pts.push(Math.cos(a) * r, Math.sin(a) * r)
    }
    c.lineWidth = Math.max(1, 2.2 - i * 0.12)
    line(c, ...pts)
  }
  const shape = (grow: number) => {
    c.lineWidth = 7 + grow * 2
    for (const [fy, len] of [[-9, 13], [-3, 16], [3, 15], [9, 11]]) line(c, 7, fy, 7 + len, fy * 1.2)
    line(c, -2, 10, 8, 19) // the thumb
    c.beginPath()
    c.ellipse(-3, 0, 12 + grow, 12 + grow, 0, 0, Math.PI * 2)
    c.fill()
  }
  const rim = `rgb(${Math.round(110 + 145 * heat)},${Math.round(28 + 172 * heat)},${Math.round(20 + 60 * heat)})`
  c.save()
  c.strokeStyle = c.fillStyle = rim
  c.shadowColor = '#ff5a1e'
  c.shadowBlur = 14 * heat
  shape(1.6)
  c.restore()
  c.strokeStyle = c.fillStyle = '#1c1216'
  shape(0)
  c.globalAlpha = fade * heat // embers still glowing in the cracks of the palm
  c.strokeStyle = EMBER
  c.lineWidth = 1
  line(c, -10, -4, -3, 1, 4, -2)
  line(c, -8, 6, -2, 3)
  c.restore()
}

// Sha Kasaya (煞袈裟): an enemy within `trigger` px makes the sha condense into a seven-colour mantle around him for
// `duration` s (every `cooldown` s). Wrapped in it nothing stuns, freezes, scares, lifts, lures or grabs him, and
// every enemy within both radii and `touch` px catches fire for `burn` s. He keeps fighting meanwhile.
export const MENG_KASAYA = { trigger: 120, duration: 4, cooldown: 12, touch: 10, burn: 1.2 } as const

// The mantle in sprite-local units (feet at 0,0, facing right), `strength` 0..1 as it forms and fades: brushed
// translucent ribbons of the seven colours falling from his shoulders like a monk's robe, rippling, their hems
// fraying into dry hairs, embers lifting off. `front` draws the two ribbons draped over his front; otherwise the robe
// behind him and the embers.
export function drawMengKasaya(c: C, tick: number, strength: number, front: boolean) {
  if (strength <= 0) return
  c.save()
  c.lineJoin = c.lineCap = 'round'
  const ribbon = (k: number, x0: number, x1: number, top: number, hem: number, alpha: number) => {
    const color = MENG_SHA[k], wave = Math.sin(tick * 0.09 + k * 1.3) * 2.5, flare = Math.sin(tick * 0.06 + k) * 1.5
    c.globalAlpha = alpha * strength
    c.fillStyle = color
    c.beginPath()
    c.moveTo(x0, top)
    c.quadraticCurveTo(x0 - 3 + wave, (top + hem) / 2, x0 - 4 + flare, hem)
    c.lineTo(x1 + 4 + flare, hem + 1)
    c.quadraticCurveTo(x1 + 3 + wave, (top + hem) / 2, x1, top)
    c.closePath()
    c.fill()
    c.globalAlpha = strength * 0.8
    c.strokeStyle = shaLight(color) ? INK : color
    c.lineWidth = 0.7
    c.stroke()
    c.strokeStyle = shaStroke(color)
    c.lineWidth = 0.5
    for (let h = 0; h < 3; h++) {
      const hx = x0 - 4 + flare + (x1 - x0 + 8) * (h + 0.5) / 3
      line(c, hx, hem, hx + wave * 0.4, hem + 2.5 + (h % 2))
    }
  }
  if (front) {
    ribbon(6, 2, 5, -27, -6, 0.4)
    ribbon(2, 8, 10.5, -26, -9, 0.4)
  } else {
    for (let k = 0; k < 7; k++) {
      const x0 = -15 + k * 4
      ribbon(k, x0, x0 + 4, -28 + Math.abs(k - 3) * 0.6, -1 + Math.abs(k - 3) * 0.4, 0.35)
    }
    for (let k = 0; k < 6; k++) {
      const rise = (tick * 0.5 + k * 9) % 34
      c.globalAlpha = strength * (1 - rise / 34)
      c.fillStyle = k % 2 ? EMBER : EMBER_PALE
      c.fillRect(-14 + rand(k, 1) * 28, -6 - rise, 1.6, 1.6)
    }
  }
  c.restore()
}

// Red Lotus Karmic Fire (红莲业火), his ultimate here: `opening` s into the form and every `cooldown` s after, an enemy
// within `range` px makes him leap `height` px up over `leap` s and drive both fists down, landing at `slam` s; he is
// untouchable and unstoppable until `end`. A red lotus of fire blooms where he lands: `damage` and `knockback` to
// enemies within `radius` px (drawn and tested `squash` as deep), then for `burnTime` s it sets everyone standing in
// it burning (`burn` s, kept topped up). Its name hangs over him for `title` s.
export const MENG_LOTUS = {
  range: 200, cooldown: 20, opening: 3, leap: 0.4, height: 50, slam: 0.75, end: 1.1,
  radius: 55, squash: 0.6, damage: 70, knockback: 300, burnTime: 3, burn: 1, title: 2.2,
} as const
export const MENG_LOTUS_TITLE = '红莲业火'

// Whether (dx, dy) from the lotus's centre lies inside it.
export function inMengLotus(dx: number, dy: number) {
  const L = MENG_LOTUS
  return (dx / L.radius) ** 2 + (dy / (L.radius * L.squash)) ** 2 <= 1
}

// The lotus at ground point (x, y), `age` s after he landed, painted onto the battlefield: a flash and an ink shock
// ring as he lands, a burning wash on the ground marking where it burns, then a great red lotus brushed open petal by
// petal (a red wash darkening to the base, ink outline, vein strokes) around a gold seed pod, brushed flames licking
// off the petal tips and embers rising. It burns down and fades when the burning ends.
export function drawMengLotus(c: C, x: number, y: number, age: number, tick: number) {
  const L = MENG_LOTUS, out = clamp01((L.burnTime + 0.5 - age) / 0.5)
  if (out <= 0) return
  c.save()
  c.translate(x, y)
  c.lineJoin = c.lineCap = 'round'
  if (age < 0.35) {
    const p = age / 0.35, r = L.radius * 1.2 * ease(p) + 0.1
    c.globalAlpha = 1 - p
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.ellipse(0, 0, 20 + p * 50, (20 + p * 50) * L.squash, 0, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = INK
    c.lineWidth = 3 * (1 - p) + 0.5
    c.beginPath()
    c.ellipse(0, 0, r, r * L.squash, 0, 0, Math.PI * 2)
    c.stroke()
  }
  // The burning ground: a red-orange wash bleeding to a ragged dark edge.
  const spread = ease(age / 0.25) * L.radius
  c.globalAlpha = 0.32 * out
  c.fillStyle = EMBER
  inkBlob(c, spread, L.squash, 5)
  c.fill()
  c.globalAlpha = 0.7 * out
  c.strokeStyle = LOTUS_DEEP
  c.lineWidth = 1.2
  c.stroke()
  c.globalAlpha = 0.25 * out
  c.fillStyle = LOTUS_RED
  inkBlob(c, spread * 0.7, L.squash, 11)
  c.fill()
  // Petals, back row first: each opens from upright to its own angle, one after another.
  const petal = (angle: number, length: number, width: number, deep: string) => {
    c.save()
    c.rotate(angle)
    const g = c.createLinearGradient(0, 0, length, 0)
    g.addColorStop(0, deep)
    g.addColorStop(0.55, LOTUS_RED)
    g.addColorStop(1, LOTUS_PALE)
    c.fillStyle = g
    c.beginPath()
    c.moveTo(0, 0)
    c.quadraticCurveTo(length * 0.45, -width, length, 0)
    c.quadraticCurveTo(length * 0.45, width, 0, 0)
    c.fill()
    c.strokeStyle = INK
    c.lineWidth = 1.1
    c.stroke()
    c.strokeStyle = deep
    c.lineWidth = 0.6
    line(c, length * 0.12, 0, length * 0.82, 0)
    line(c, length * 0.2, width * 0.25, length * 0.7, width * 0.12)
    line(c, length * 0.2, -width * 0.25, length * 0.7, -width * 0.12)
    c.restore()
  }
  const rows = [
    { n: 7, from: -2.75, to: -0.39, length: 34, width: 9, start: 0.08, deep: LOTUS_DEEP },
    { n: 6, from: -2.95, to: -0.19, length: 40, width: 11, start: 0.2, deep: '#a8141a' },
    { n: 3, from: -2.2, to: -0.94, length: 26, width: 8, start: 0.34, deep: LOTUS_DEEP },
  ]
  const tips: [number, number][] = []
  c.globalAlpha = out
  for (const row of rows) {
    for (let i = 0; i < row.n; i++) {
      const open = ease((age - row.start - i * 0.035) / 0.22)
      if (open <= 0) continue
      const final = row.from + (row.to - row.from) * i / (row.n - 1), angle = -Math.PI / 2 + (final + Math.PI / 2) * open
      const length = row.length * (0.4 + 0.6 * open)
      petal(angle, length, row.width, row.deep)
      tips.push([Math.cos(angle) * length, Math.sin(angle) * length])
    }
  }
  // The seed pod at its heart.
  const pod = ease((age - 0.4) / 0.2)
  if (pod > 0) {
    c.lineWidth = 1
    c.strokeStyle = INK
    ellipse(c, 0, -8, 7 * pod, 4 * pod, GOLD)
    c.fillStyle = GOLD_DARK
    for (let k = 0; k < 5; k++) c.fillRect(-4.5 + k * 2, -9 + (k % 2), 1.1 * pod, 1.1 * pod)
  }
  // Flames off the petal tips: brushed tongues of orange and yellow, flickering.
  for (const [k, [tx, ty]] of tips.entries()) {
    const h = (7 + rand(k, 1) * 6) * (0.75 + Math.sin(tick * 0.4 + k * 1.7) * 0.25), w = 2.6
    c.globalAlpha = out * 0.9
    c.fillStyle = k % 2 ? EMBER : EMBER_PALE
    c.beginPath()
    c.moveTo(tx - w, ty)
    c.quadraticCurveTo(tx - w * 0.6, ty - h * 0.6, tx + Math.sin(tick * 0.3 + k) * 2, ty - h)
    c.quadraticCurveTo(tx + w * 0.6, ty - h * 0.6, tx + w, ty)
    c.closePath()
    c.fill()
  }
  // Embers rising from the burning ground.
  for (let k = 0; k < 14; k++) {
    const rise = (tick * 0.6 + k * 11) % 60, a = rand(k, 3) * Math.PI * 2, d = L.radius * Math.sqrt(rand(k, 4))
    c.globalAlpha = out * (1 - rise / 60)
    c.fillStyle = k % 3 ? EMBER : EMBER_PALE
    c.fillRect(Math.cos(a) * d, Math.sin(a) * d * L.squash - rise, 1.7, 1.7)
  }
  c.restore()
}

// The name over him at (x, y), `time` s after he landed: red-gold characters slamming down one after another, edged
// in ink and white over a red brush stroke, then a red seal pressed down beside them; all fade out together.
export function drawMengLotusTitle(c: C, x: number, y: number, time: number, tick: number) {
  const T = MENG_LOTUS.title, out = clamp01((T - time) / 0.4), n = MENG_LOTUS_TITLE.length, size = 28, gap = size * 1.1
  if (out <= 0) return
  const left = x - gap * n / 2
  c.save()
  c.lineJoin = c.lineCap = 'round'
  c.globalAlpha = out
  slash(c, { ax: left - 10, ay: y + size * 0.6, bx: left + gap * n + 10, by: y + size * 0.52, w: 4, bend: -0.04, start: 0,
    dark: LOTUS_DEEP, light: EMBER, ghost: EMBER_PALE, seed: 21 }, ease((time - 0.1) / 0.3), out, Math.sin(tick * 0.9) * 0.6)
  c.font = `bold ${size}px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let i = 0; i < n; i++) {
    const p = ease((time - i * 0.1) / 0.18)
    if (p <= 0) continue
    const scale = 1.8 - 0.8 * p, shake = (1 - p) * Math.sin(tick * 2 + i) * 3
    c.save()
    c.translate(left + gap * (i + 0.5) + shake, y)
    c.scale(scale, scale)
    c.globalAlpha = p * out
    c.strokeStyle = INK
    c.lineWidth = 6
    c.strokeText(MENG_LOTUS_TITLE[i], 0, 0)
    c.strokeStyle = '#ffffff'
    c.lineWidth = 2
    c.strokeText(MENG_LOTUS_TITLE[i], 0, 0)
    const fill = c.createLinearGradient(0, -size / 2, 0, size / 2)
    fill.addColorStop(0, EMBER_PALE)
    fill.addColorStop(0.45, EMBER)
    fill.addColorStop(1, LOTUS_RED)
    c.fillStyle = fill
    c.fillText(MENG_LOTUS_TITLE[i], 0, 0)
    c.restore()
  }
  // The seal: a vermilion square with 神魔 cut in it, pressed down after the last character.
  const stamp = ease((time - n * 0.1 - 0.1) / 0.15)
  if (stamp > 0) {
    const s = 16, k = 1 + (1 - stamp) * 0.8
    c.save()
    c.translate(left + gap * n + 16, y + 10)
    c.scale(k, k)
    c.rotate(-0.06)
    c.globalAlpha = out * stamp
    c.fillStyle = SEAL
    c.fillRect(-s / 2, -s / 2, s, s)
    c.fillStyle = PAPER
    c.font = `bold ${Math.round(s * 0.42)}px KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif`
    c.fillText('神', 0, -s * 0.2)
    c.fillText('魔', 0, s * 0.24)
    c.restore()
  }
  c.restore()
}

// 悲苍一画秋风, the Devil Saint form's second skill: an enemy within `trigger` px makes him cut once all the way round
// himself. Every enemy within `radius` px takes `damage` and is bound in place for `bind` s; he holds the
// follow-through `recover` s. Every `cooldown` s. The cut is one huge brush stroke `ring` px out (`width` px at its
// fattest, `squash` its ground perspective), swept round him in `sweep` s and gone by `life`; its name hangs for `title` s.
export const MENG_RING = {
  trigger: 90, radius: 90, damage: 36, bind: 1, cooldown: 9, recover: 0.35,
  sweep: 0.22, life: 1.3, title: 2, ring: 60, width: 32, squash: 0.5,
} as const
export const MENG_RING_TITLE = '悲苍一画秋风'

// The cut round (x, y), `time` s in. `half` -1 draws the far side (before the fighters, so it passes behind him),
// 1 the near side and the flung red ink. One stroke of the brush swept nearly all the way round, dry and thin at its
// tail and fattening toward its head: an umber-and-ochre ink body blotched with darker wash and cracked with black
// veins, gold light blazing along its outer rim and a thinner line of it on the inner, gold flecks glinting in it.
export function drawMengRing(c: C, x: number, y: number, time: number, seed: number, half: number) {
  const R = MENG_RING, out = clamp01((R.life - time) / 0.5)
  if (out <= 0) return
  const span = Math.PI * 1.85, a0 = rand(seed, 1) * Math.PI * 2, headU = ease(time / R.sweep), cy = y - 8
  const W = R.width * (0.55 + 0.45 * out) // it thins as it fades
  const width = (u: number) => W * (0.1 + 0.9 * u ** 0.7) * Math.min(1, (headU - u) / 0.05 + 0.3)
  const at = (a: number, r: number, squash: number = R.squash): [number, number] => [x + Math.cos(a) * r, cy + Math.sin(a) * r * squash]
  // The stroke's two edges, `squash` 1 for the unsquashed shape the gradient fill uses.
  const edges = (squash: number) => {
    const n = Math.max(2, Math.ceil(56 * headU)), outer: [number, number][] = [], inner: [number, number][] = []
    for (let i = 0; i <= n; i++) {
      const u = headU * i / n, a = a0 + span * u, w = width(u)
      outer.push(at(a, R.ring + w / 2, squash))
      inner.push(at(a, R.ring - w / 2, squash))
    }
    return { outer, inner }
  }
  const trace = (points: [number, number][], start = true) => {
    if (start) c.beginPath()
    for (const [px, py] of points) c.lineTo(px, py)
  }
  const band = ({ outer, inner }: ReturnType<typeof edges>) => {
    trace(outer)
    trace([...inner].reverse(), false)
    c.closePath()
  }
  const { outer, inner } = edges(R.squash)
  c.save()
  c.lineJoin = c.lineCap = 'round'
  if (half > 0) { // red ink flung off the cut, over everything
    c.fillStyle = '#c8231e'
    for (let k = 0; k < 16; k++) {
      const a = rand(seed, 40 + k) * Math.PI * 2, d = R.ring + 16 + rand(seed, 60 + k) * 60 * ease(time / 0.4)
      c.globalAlpha = out * (0.5 + 0.4 * rand(seed, 80 + k))
      c.beginPath()
      c.arc(x + Math.cos(a) * d, cy + Math.sin(a) * d * R.squash - 10 * rand(seed, 90 + k), 0.8 + rand(seed, 70 + k) * 2.4, 0, Math.PI * 2)
      c.fill()
    }
  }
  c.globalAlpha = out
  c.beginPath()
  c.rect(x - 300, half < 0 ? cy - 300 : cy, 600, 300)
  c.clip()
  // The ink body, ochre to umber across its width, gold at both rims; the gradient drawn round, then squashed with it.
  c.save()
  c.translate(x, cy)
  c.scale(1, R.squash)
  c.translate(-x, -cy)
  const body = c.createRadialGradient(x, cy, R.ring - W / 2, x, cy, R.ring + W / 2)
  body.addColorStop(0, '#ffd84a')
  body.addColorStop(0.1, '#9a6a28')
  body.addColorStop(0.45, '#4a3018')
  body.addColorStop(0.75, '#7a5224')
  body.addColorStop(0.9, '#e8a830')
  body.addColorStop(1, '#fff3b0')
  c.fillStyle = body
  band(edges(1))
  c.fill()
  c.restore()
  // Inside the stroke: darker wash, black veins cracking it, gold flecks.
  c.save()
  band({ outer, inner })
  c.clip()
  for (let k = 0; k < 8; k++) {
    const u = (k + rand(seed, 100 + k)) / 8
    if (u > headU) continue
    const [bx, by] = at(a0 + span * u, R.ring + (rand(seed, 110 + k) - 0.5) * W * 0.5)
    puff(c, bx, by, 6 + width(u) * 0.4, 0.45, '40,24,12')
  }
  c.strokeStyle = INK
  c.globalAlpha = out * 0.85
  for (let k = 0; k < 11; k++) {
    const u = (k + 0.3 + rand(seed, 120 + k) * 0.4) / 11, a = a0 + span * u, w = width(u)
    if (u > headU || w < 6) continue
    const tilt = (rand(seed, 130 + k) - 0.5) * 0.2
    const [x1, y1] = at(a, R.ring + w / 2 + 2), [x2, y2] = at(a + tilt, R.ring - w / 2 - 2)
    c.lineWidth = 1.3
    boltPath(c, x1, y1, x2, y2, seed + k, 5)
    c.stroke()
    const [mx, my] = at(a + tilt / 2, R.ring), [ex, ey] = at(a + tilt / 2 + 0.12, R.ring + (rand(seed, 140 + k) - 0.5) * w * 0.6)
    c.lineWidth = 0.8
    boltPath(c, mx, my, ex, ey, seed + k + 50, 3) // a branch off it
    c.stroke()
  }
  c.lineWidth = 1 // one long vein running along the stroke
  c.beginPath()
  for (let i = 0; i <= 40; i++) {
    const u = headU * i / 40
    c.lineTo(...at(a0 + span * u, R.ring + (rand(seed, 200 + i) - 0.5) * width(u) * 0.35))
  }
  c.stroke()
  for (let k = 0; k < 30; k++) {
    const u = rand(seed, 300 + k) * headU
    const [fx, fy] = at(a0 + span * u, R.ring + (rand(seed, 330 + k) - 0.5) * width(u) * 0.9)
    c.globalAlpha = out * (0.4 + 0.6 * Math.abs(Math.sin(time * 9 + k)))
    c.fillStyle = k % 5 === 0 ? '#ffffff' : k % 7 === 0 ? '#9fe0ff' : '#ffe14a'
    c.fillRect(fx, fy, 1.6, 1.2)
  }
  c.restore()
  // Dry-brush hairs trailing off the tail.
  c.globalAlpha = out * 0.55
  c.strokeStyle = '#3a2a18'
  c.lineWidth = 0.7
  for (let k = 0; k < 4; k++) {
    c.beginPath()
    for (let i = 0; i <= 10; i++) c.lineTo(...at(a0 - 0.05 * k + span * Math.min(headU, 0.16) * i / 10, R.ring + (k - 1.5) * 2.2))
    c.stroke()
  }
  // The rims: a thin ink edge, then gold light blazing along the outer rim and a line of it on the inner.
  c.globalAlpha = out * 0.6
  c.strokeStyle = INK
  c.lineWidth = 1
  trace(outer)
  c.stroke()
  c.globalCompositeOperation = 'lighter'
  c.shadowColor = '#ffb020'
  c.shadowBlur = 14
  for (const [color, w, alpha] of [['#ffb020', 6, 0.45], ['#ffe680', 2.6, 0.9], ['#ffffff', 1, 1]] as const) {
    c.globalAlpha = out * alpha
    c.strokeStyle = color
    c.lineWidth = w
    trace(outer)
    c.stroke()
  }
  c.globalAlpha = out * 0.8
  c.strokeStyle = '#ffd23a'
  c.lineWidth = 1.2
  trace(inner)
  c.stroke()
  // The head, white-hot while it sweeps round.
  const hot = 1 - clamp01(time / (R.sweep + 0.15))
  if (hot > 0) puff(c, ...at(a0 + span * headU, R.ring), 18, 0.9 * hot, '255,236,170')
  c.restore()
}

// The name beside him, its top at (x, y), `time` s after the cut: two columns of white brush characters edged in
// ink, slamming down one after another, red ink spattered round them, then a red 秘技 seal pressed under the first.
export function drawMengRingTitle(c: C, x: number, y: number, time: number, tick: number) {
  const out = clamp01((MENG_RING.title - time) / 0.4), size = 26, gap = size * 1.05, rows = 3, font = 'KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", serif'
  if (out <= 0) return
  c.save()
  c.lineJoin = c.lineCap = 'round'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = '#c8231e'
  for (let k = 0; k < 14; k++) { // spatter
    c.globalAlpha = out * clamp01(time / 0.3) * 0.7
    c.beginPath()
    c.arc(x + (rand(k, 501) - 0.5) * size * 3.4, y + rand(k, 502) * gap * rows, 0.7 + rand(k, 503) * 2, 0, Math.PI * 2)
    c.fill()
  }
  c.font = `bold ${size}px ${font}`
  for (let i = 0; i < MENG_RING_TITLE.length; i++) {
    const p = ease((time - i * 0.08) / 0.16)
    if (p <= 0) continue
    const col = Math.floor(i / rows), row = i % rows, scale = 1.8 - 0.8 * p, shake = (1 - p) * Math.sin(tick * 2 + i) * 3
    c.save()
    c.translate(x + (col - 0.5) * size * 1.25 + shake, y + gap * (row + 0.5) + col * gap * 0.4) // the second column sits lower
    c.scale(scale, scale)
    c.rotate((rand(i, 504) - 0.5) * 0.12)
    c.globalAlpha = p * out
    c.strokeStyle = INK
    c.lineWidth = 6
    c.strokeText(MENG_RING_TITLE[i], 0, 0)
    c.strokeStyle = '#8a86a0'
    c.lineWidth = 2
    c.strokeText(MENG_RING_TITLE[i], 0, 0)
    c.fillStyle = PAPER
    c.fillText(MENG_RING_TITLE[i], 0, 0)
    c.restore()
  }
  const stamp = ease((time - MENG_RING_TITLE.length * 0.08 - 0.1) / 0.15)
  if (stamp > 0) {
    const w = 13, h = 24, k = 1 + (1 - stamp) * 0.8
    c.save()
    c.translate(x - size * 0.62, y + gap * rows + 14)
    c.scale(k, k)
    c.rotate(-0.06)
    c.globalAlpha = out * stamp
    c.fillStyle = SEAL
    c.fillRect(-w / 2, -h / 2, w, h)
    c.fillStyle = PAPER
    c.font = `bold ${Math.round(w * 0.78)}px ${font}`
    c.fillText('秘', 0, -h * 0.24)
    c.fillText('技', 0, h * 0.24)
    c.restore()
  }
  c.restore()
}

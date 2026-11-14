export type Kind = 'melee' | 'ranged' | 'boom' | 'fire' | 'sing' | 'beam'

export const CATEGORIES = ['Food', 'Animals', 'People', 'Mythical', 'Water', 'Bug'] as const
export type Category = (typeof CATEGORIES)[number]

export interface UnitDef {
  key: string
  name: string
  blurb: string
  category: Category
  color: string // ink colour of the splat it leaves behind
  kind: Kind
  r: number // collision radius, px
  hp: number
  speed: number // px/s
  dmg: number
  range: number // px beyond touching; for 'boom' it is the blast radius, for 'sing' how far the ballad carries
  cd: number // seconds between attacks
  knock: number // knockback impulse, px/s; negative pulls the victim toward the attacker
  spacing: number // px between units along a brush stroke
  draw: (c: CanvasRenderingContext2D) => void
  // optional quirks
  size?: number // drawn this many times bigger
  burn?: number // hits set the target on fire for this many seconds
  slow?: number // hits slow the target for this many seconds
  thorns?: number // damage dealt back to anyone who punches it
  lifesteal?: number // share of melee damage healed back
  hatch?: string // key of the unit that pops out when it dies
  band?: number // sprite-px y of the team bandanna, where the top-edge guess lands on a wing, crest or prop
  shot?: string // colour of its projectile
  hides?: boolean // turns invisible in bushes and ambushes from them
  heal?: number // fire that lands leaves a ring that heals its own kind this much
  grab?: number // chance a bite on someone smaller turns into a grab, a shake and a long throw
  charge?: number // px: spotting a target at least this far away sets off a charge; the poke that ends it sends the target flying
  flies?: ((c: CanvasRenderingContext2D) => void)[] // hovers: crosses puddles at full speed and never wades. [body, wing], drawn apart so the wing can flap around WING
  carry?: boolean // with grab: instead of shaking its catch, carries it to the next enemy and throws it at them
  eats?: number // swallows whatever its bite kills: this much more max hp per meal, healed to full, and it grows; enough meals make it a king that raises little ones
  rebirth?: Partial<UnitDef> // first death is an egg, which hatches into a frantic chick with these stats, which grows back up
  projectile?: 'pearl' | 'kernel' | 'notification' | 'bubble' | 'spear' | 'water' | 'shuriken' | 'web'
  burst?: number // projectiles in a small fan, each with the listed damage
  orbit?: number // preferred distance while circling an enemy and throwing
  waterbound?: boolean // stays inside painted water, including when shoved
  shock?: number // seconds stunned, with a cartoon X-ray reaction
  dash?: boolean // shuriken fighter: closes short gaps with one dash strike
  timid?: boolean // retreats when hurt, outnumbered or facing something much bigger
  spin?: number // radius of repeated sword sweeps during a short spin
  pulse?: number // radius of a single pose-and-knockback attack
  leap?: 'slam' | 'scrap' // repeating rump-first landing, or one opening cat brawl
  regen?: number // hp per second recovered while resting between attacks
  scare?: number // chance a peck sends the victim running in panic for a moment
  launch?: number // melee hits throw the victim this many px; it bowls over whoever it lands on
  bully?: boolean // ignores whoever is closest and goes after the toughest fighter it can see
  lawn?: number // plants a grass tuft behind itself every this many px walked, up to a dozen per life
  brine?: number // its explosion leaves this many puddle stamps
  pops?: number // while burning, fires this many kernels per second in random directions
  grudge?: number // chases only the first fighter that hurts it; each further hit from them adds this much speed and damage, up to five. Shares its lock with leap and dash, so never give one fighter both
  swell?: number // each bite makes it bigger and slower; at this many bites it pops
  topple?: number // knockback at least this strong puts it on its back for a moment
  blind?: number // hits leave the victim stumbling about blind for this many seconds
  crash?: number // wired (double speed, double pokes) for a few seconds, then asleep this long; repeat
  wildfire?: boolean // its burns spread to whoever the burning fighter bumps into, and send the victim running in panic
  distract?: number // hits make the victim stop and scroll its phone for this many seconds; it spreads by contact
  latch?: number // chance a hit turns into hugging the victim's leg for a couple of seconds: rides along, slows and nibbles. Shares its lock with leap, dash and grudge
  squish?: number // takes no knockback and can't be thrown; springs this share of the shove back at the attacker (a hard one throws them)
  spotlight?: number // its pose makes every enemy this close come at it for a moment (needs pulse)
  fetch?: boolean // throws its only projectile and must pick it up from where it lands before throwing again
  alt?: (c: CanvasRenderingContext2D) => void // a second look the renderer swaps in while its quirk says so: empty-handed, curled up, promoted
  stack?: ((c: CanvasRenderingContext2D) => void)[] // drawings from one pancake to full height; each lost share of hp knocks one off as a syrup spot, and it speeds up
  tether?: number // a hit ties the victim to it with a strand for this many seconds: it can't get away and it gets drained. Shares its lock with leap, dash, grudge and latch
  roll?: number // when cornered, curls up and rolls through enemies at this speed
  stink?: number // sprays a cloud this many px wide that enemies are shoved out of and hurt by; recharges
  promote?: number // after this many kills it stops fighting and makes its own kind nearby attack twice as fast
  ant?: boolean // gathers with its side to build colonies, without being consumed
  colony?: boolean // stationary anthill; built by ants, never painted from the tray
  bug?: 'millipede' | 'car' | 'mantis' | 'spider' | 'nest'
  building?: boolean // stationary, cannot be carried or shoved
  internal?: boolean // created by fighters rather than painted from the tray
  prey?: boolean // an explicitly biological body spiders may collect
}

type C = CanvasRenderingContext2D
const INK = '#221f33'
const deadEyes = new WeakSet<C>() // only contexts baking the still, fallen sprites

// Sprites are drawn in a 48x48 box, facing right, feet at (24, 44).
function ellipse(c: C, x: number, y: number, rx: number, ry: number, fill: string) {
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fillStyle = fill
  c.fill()
  c.stroke()
}

function box(c: C, x: number, y: number, w: number, h: number, rad: number, fill: string) {
  c.beginPath()
  c.roundRect(x, y, w, h, rad)
  c.fillStyle = fill
  c.fill()
  c.stroke()
}

function line(c: C, ...p: number[]) {
  c.beginPath()
  c.moveTo(p[0], p[1])
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1])
  c.stroke()
}

function poly(c: C, fill: string, ...p: number[]) {
  c.beginPath()
  c.moveTo(p[0], p[1])
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1])
  c.closePath()
  c.fillStyle = fill
  c.fill()
  c.stroke()
}

function eye(c: C, x: number, y: number, r = 2.8, pupil = 1.3) {
  c.save()
  c.lineWidth = 1.4
  if (deadEyes.has(c)) {
    c.strokeStyle = INK
    line(c, x - r * 0.7, y - r * 0.7, x + r * 0.7, y + r * 0.7)
    line(c, x - r * 0.7, y + r * 0.7, x + r * 0.7, y - r * 0.7)
    c.restore()
    return
  }
  ellipse(c, x, y, r, r, '#fff')
  c.beginPath()
  c.arc(x + r * 0.3, y, pupil, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.restore()
}

function legs(c: C, x1: number, x2: number, color = INK) {
  c.save()
  c.strokeStyle = color
  line(c, x1, 36, x1, 43, x1 + 3, 43)
  line(c, x2, 36, x2, 43, x2 + 3, 43)
  c.restore()
}

function toast(c: C) {
  legs(c, 19, 29)
  box(c, 11, 12, 26, 27, 6, '#d99a3d')
  c.fillStyle = '#f6dba6'
  c.beginPath()
  c.roundRect(14.5, 15.5, 19, 20, 4)
  c.fill()
  c.save() // pat of butter, sliding off
  c.translate(24, 11)
  c.rotate(-0.15)
  box(c, -6, -5, 12, 6, 1.5, '#ffe45c')
  c.restore()
  eye(c, 21, 25)
  eye(c, 30, 25)
  line(c, 17, 20, 23.5, 22.5) // angry brows
  line(c, 34, 20, 27.5, 22.5)
  c.beginPath() // frown
  c.arc(25.5, 34, 3, Math.PI * 1.15, Math.PI * 1.85)
  c.stroke()
}

function goose(c: C) {
  legs(c, 19, 25, '#f08c1b')
  poly(c, '#fff', 10, 30, 4, 24, 12, 26) // tail
  ellipse(c, 21, 31, 12, 8.5, '#fff')
  c.save() // neck: fat ink stroke with a white one on top
  c.lineCap = 'round'
  c.lineWidth = 9
  line(c, 29, 28, 33, 13)
  c.strokeStyle = '#fff'
  c.lineWidth = 4.5
  line(c, 29, 28, 33, 13)
  c.restore()
  ellipse(c, 34, 12, 5.5, 5.5, '#fff')
  poly(c, '#f08c1b', 38.5, 9, 46.5, 10.5, 39, 12.5) // beak, mid-honk
  poly(c, '#f08c1b', 38.5, 13.5, 44.5, 16.5, 37.5, 16)
  eye(c, 35, 11, 2.2, 1.1)
  line(c, 31.5, 6.5, 38, 8.5)
  c.beginPath() // wing
  c.arc(19, 30, 6, Math.PI * 0.1, Math.PI * 0.9)
  c.stroke()
}

// Shared by the intern and his promoted self: body, the tie he already wears, head and bed hair.
function internBase(c: C) {
  legs(c, 20, 28)
  box(c, 15, 22, 18, 18, 7, '#f4f1ea')
  c.save()
  c.lineWidth = 1.4
  poly(c, '#d9453b', 23, 23, 26, 23, 25.5, 26, 27, 32, 24.5, 35, 22, 32, 23.5, 26) // tie
  c.restore()
  ellipse(c, 24, 15, 8, 8, '#f2c9a5')
  c.beginPath() // bed hair
  c.arc(24, 14, 8, Math.PI * 1.02, Math.PI * 1.98)
  c.lineTo(28, 9)
  c.lineTo(25, 12)
  c.lineTo(21, 8.5)
  c.lineTo(19, 12)
  c.closePath()
  c.fillStyle = '#5b4636'
  c.fill()
  c.stroke()
}

function intern(c: C) {
  internBase(c)
  c.save() // dead-tired eyes with bags
  c.lineWidth = 1.4
  c.fillStyle = INK
  for (const ex of [21.5, 28]) {
    c.beginPath()
    c.arc(ex, 16.5, 1.2, 0, Math.PI * 2)
    c.fill()
    line(c, ex - 2.4, 14.8, ex + 2.4, 14.8)
    c.beginPath()
    c.arc(ex, 17, 2.6, Math.PI * 0.2, Math.PI * 0.8)
    c.stroke()
  }
  line(c, 23, 21, 27, 21)
  c.restore()
  box(c, 32, 26, 12, 4.5, 1.5, '#3d6fd8') // stapler
  line(c, 32, 33, 44, 33, 32, 30.5)
}

function internManager(c: C) { // promoted: same tie, a clipboard and a coffee, and a whole new attitude
  internBase(c)
  c.save()
  c.lineWidth = 1.4
  line(c, 19.3, 16, 23.7, 16) // half-lidded, very senior
  line(c, 25.8, 16, 30.2, 16)
  dot(c, 21.5, 17, 1.1, INK)
  dot(c, 28, 17, 1.1, INK)
  c.beginPath() // smug
  c.arc(25, 19.5, 2.2, Math.PI * 0.15, Math.PI * 0.85)
  c.stroke()
  c.restore()
  box(c, 6, 24, 9, 12, 1.5, '#f4f1ea') // clipboard
  c.save()
  c.lineWidth = 1
  line(c, 8, 28, 13, 28)
  line(c, 8, 31, 13, 31)
  c.beginPath() // mug handle
  c.arc(40.5, 29, 2.5, -Math.PI * 0.5, Math.PI * 0.5)
  c.stroke()
  c.restore()
  box(c, 33, 25, 7, 8, 1.5, '#fff') // coffee somebody else made
  c.save()
  c.strokeStyle = '#b9a69e'
  c.lineWidth = 1.2
  line(c, 36.5, 23, 35.5, 20, 37, 17)
  c.restore()
}

function nana(c: C) {
  legs(c, 19, 27)
  ellipse(c, 23, 31, 10.5, 9.5, '#b48ad6')
  ellipse(c, 23, 6.5, 4, 4, '#d9d9e3') // bun
  ellipse(c, 23, 16, 7.5, 7.5, '#f3cfb3')
  c.beginPath() // hair cap
  c.arc(23, 15, 7.5, Math.PI * 1.05, Math.PI * 1.95)
  c.closePath()
  c.fillStyle = '#d9d9e3'
  c.fill()
  c.stroke()
  c.save() // glasses and a sweet little smile
  c.lineWidth = 1.4
  for (const ex of [20.5, 27]) {
    ellipse(c, ex, 17, 2.8, 2.8, '#fff')
    c.beginPath()
    c.arc(ex + 0.6, 17, 1, 0, Math.PI * 2)
    c.fillStyle = INK
    c.fill()
  }
  line(c, 23.3, 17, 24.2, 17)
  c.beginPath()
  c.arc(24, 20, 2.2, Math.PI * 0.15, Math.PI * 0.85)
  c.stroke()
  c.restore()
  line(c, 32, 28, 37, 23) // handbag of doom
  box(c, 35, 23, 10, 9, 2, '#c0392b')
  c.fillStyle = '#ffe45c'
  c.beginPath()
  c.arc(40, 25.5, 1.3, 0, Math.PI * 2)
  c.fill()
}

function pickle(c: C) {
  legs(c, 20, 28)
  box(c, 16, 9, 16, 31, 8, '#6fbf4a')
  c.fillStyle = '#4f9a33'
  for (const [bx, by] of [[19.5, 13], [28.5, 15], [19, 34], [29, 33], [28.5, 24]]) {
    c.beginPath()
    c.arc(bx, by, 1.2, 0, Math.PI * 2)
    c.fill()
  }
  eye(c, 20.5, 19, 3.6, 1)
  eye(c, 28, 19, 3.6, 1)
  c.beginPath() // screaming
  c.ellipse(24.5, 28.5, 2.6, 3.4, 0, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.save() // lit fuse
  c.strokeStyle = '#8a6a3b'
  c.beginPath()
  c.moveTo(24, 9)
  c.quadraticCurveTo(24, 3, 29, 4)
  c.stroke()
  c.restore()
  c.save()
  c.lineWidth = 1.4
  ellipse(c, 30, 4, 2.4, 2.4, '#ffb300')
  line(c, 33, 1, 35, -0.5)
  line(c, 33.5, 5, 36, 6)
  c.restore()
}

const SKIN = '#f2c9a5'

function dot(c: C, x: number, y: number, r: number, fill: string) {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fillStyle = fill
  c.fill()
}

function smile(c: C, x: number, y: number, r: number) {
  c.beginPath()
  c.arc(x, y, r, Math.PI * 0.15, Math.PI * 0.85)
  c.stroke()
}

// outlined neck: fat ink stroke with a coloured one on top
function tube(c: C, x1: number, y1: number, x2: number, y2: number, fill: string) {
  c.save()
  c.lineCap = 'round'
  c.lineWidth = 10
  line(c, x1, y1, x2, y2)
  c.strokeStyle = fill
  c.lineWidth = 5.6
  line(c, x1, y1, x2, y2)
  c.restore()
}

function chili(c: C) {
  legs(c, 20, 28)
  box(c, 17, 12, 14, 28, 7, '#e03a2e')
  poly(c, '#4f9a33', 19, 13, 29, 13, 26, 9, 27, 4, 23.5, 4, 23, 9) // stem
  eye(c, 21, 21)
  eye(c, 28, 21)
  line(c, 17.5, 16.5, 23, 18.5)
  line(c, 31.5, 16.5, 26, 18.5)
  c.save() // magnificent moustache
  c.lineWidth = 3
  line(c, 18, 29, 21, 27, 24.5, 28.5, 28, 27, 31, 29)
  c.restore()
}

// Flapjack with n pancakes left. The face lives on the bottom one so it survives every loss.
function pancakeStack(n: number) {
  return (c: C) => {
    legs(c, 19, 29)
    for (let k = 0; k < n; k++) ellipse(c, 24, 35 - k * 5, 12, 4.5, k & 1 ? '#ecb96b' : '#e2a95a')
    const top = 35 - (n - 1) * 5
    ellipse(c, 24, top - 1.5, 9, 3, '#8a4b1c') // syrup
    c.save()
    c.strokeStyle = '#8a4b1c'
    c.lineWidth = 3
    line(c, 32, top, 32, top + 5)
    c.restore()
    box(c, 21, top - 6.5, 6, 4, 1, '#ffe45c') // butter
    eye(c, 20, 34.5, 2.2, 1)
    eye(c, 28, 34.5, 2.2, 1)
    smile(c, 24, 37.3, 1.6)
  }
}

function egg(c: C) {
  legs(c, 20, 28)
  ellipse(c, 24, 26, 10, 13, '#fff8e7')
  line(c, 14.5, 21, 18, 18, 21, 22, 24, 18, 27, 22, 30, 18, 33.5, 21) // ominous crack
  eye(c, 20.5, 28)
  eye(c, 28, 28)
  line(c, 21.5, 34, 23, 33, 24.5, 34, 26, 33, 27.5, 34) // wobbly lip
}

function hedgehog(c: C) {
  legs(c, 17, 27)
  poly(c, '#6b4a2f', 9, 36, 6, 27, 11, 28, 10, 20, 16, 23, 17, 15, 22, 21, 26, 15, 29, 22, 34, 20, 33, 28, 30, 38)
  ellipse(c, 29, 33, 8.5, 6.5, '#f0d2ad')
  dot(c, 37.5, 33, 1.8, INK)
  eye(c, 31, 30.5, 2.2, 1.1)
  line(c, 28, 27, 33.5, 28.5)
}

function hedgehogBall(c: C) { // curled up: all spikes, no apologies
  const p: number[] = []
  for (let k = 0; k < 24; k++) {
    const a = k * Math.PI / 12, r = k & 1 ? 9.5 : 14
    p.push(24 + Math.cos(a) * r, 30 + Math.sin(a) * r)
  }
  poly(c, '#6b4a2f', ...p)
  ellipse(c, 25, 31, 6.5, 5.5, '#f0d2ad') // a bit of belly showing
  dot(c, 29.5, 31, 1.5, INK)
}

function mozzie(c: C) {
  c.save()
  c.lineWidth = 1.4
  line(c, 20, 30, 18, 39)
  line(c, 24, 30, 25, 39)
  line(c, 27, 29, 30, 37)
  ellipse(c, 17, 18, 7, 3.5, '#eef6ff')
  ellipse(c, 24, 16, 7, 3.5, '#eef6ff')
  c.restore()
  ellipse(c, 21, 26, 8, 5, '#7d8597')
  ellipse(c, 31, 23, 4.5, 4.5, '#7d8597')
  line(c, 34.5, 24.5, 46, 29) // the pointy end
  eye(c, 32, 22, 2, 1)
}

function llama(c: C) {
  const wool = '#f3e6cf'
  legs(c, 15, 25)
  ellipse(c, 20, 31, 11, 7.5, wool)
  tube(c, 28, 28, 31, 15, wool)
  poly(c, wool, 29.5, 9, 28.5, 2, 33, 7) // ear
  ellipse(c, 34, 12, 6.5, 5, wool)
  eye(c, 34, 11, 2, 1)
  line(c, 31.5, 9.3, 36.5, 9.3) // unimpressed eyelid
  line(c, 37, 15, 40, 14.5)
  dot(c, 39.5, 11.5, 0.8, INK)
}

function skunk(c: C) {
  const fur = '#2b2b36'
  legs(c, 20, 28)
  ellipse(c, 12, 21, 6.5, 11, fur) // tail
  c.beginPath()
  c.ellipse(12, 20, 2.5, 8, 0, 0, Math.PI * 2)
  c.fillStyle = '#fff'
  c.fill()
  ellipse(c, 23, 32, 10.5, 7.5, fur)
  ellipse(c, 33, 28, 6.5, 5.5, fur)
  c.save()
  c.strokeStyle = '#fff'
  line(c, 29, 23.5, 34, 25)
  c.strokeStyle = '#7cb342' // the smell
  c.lineWidth = 1.6
  line(c, 3, 8, 5, 5, 3, 2)
  line(c, 10, 7, 12, 4, 10, 1)
  line(c, 17, 9, 19, 6, 17, 3)
  c.restore()
  eye(c, 34.5, 28, 2, 1)
  dot(c, 39.5, 29, 1.2, '#ff8fb1')
}

const SNAKE = '#8e6fe0'

// On the page only the head is a sprite: the renderer draws the body segment by segment, so it can grow.
function snakeHead(c: C) {
  c.save() // forked tongue
  c.strokeStyle = '#e0364a'
  c.lineWidth = 1.3
  line(c, 36, 38, 41.5, 38.5, 44, 36.8)
  line(c, 41.5, 38.5, 44, 40.4)
  c.restore()
  ellipse(c, 31, 36.5, 6.5, 5.5, SNAKE)
  c.beginPath() // pale chin
  c.ellipse(32, 39.6, 4, 1.6, 0, 0, Math.PI * 2)
  c.fillStyle = '#e9e2ff'
  c.fill()
  eye(c, 32.5, 34.6, 2.3, 1.1)
  line(c, 29.6, 31.6, 35.2, 33) // up to something
  dot(c, 36.3, 36, 0.6, INK)
}

function snakeCrown(c: C) {
  c.save()
  c.lineWidth = 1.3
  poly(c, '#ffd23f', 26.5, 31.5, 25.8, 24.5, 28.8, 27.8, 31, 23, 33.2, 27.8, 36.2, 24.5, 35.5, 31.5)
  c.restore()
  dot(c, 31, 28.6, 1, '#e0364a')
}

function snake(c: C) { // tray icon: the whole noodle
  c.save()
  c.lineCap = 'round'
  for (const [w, col] of [[10, INK], [5.8, SNAKE]] as const) {
    c.lineWidth = w
    c.strokeStyle = col
    c.beginPath()
    c.moveTo(3, 39)
    c.quadraticCurveTo(9, 29, 15, 36.5)
    c.quadraticCurveTo(20.5, 43.5, 26, 37.5)
    c.stroke()
  }
  c.restore()
  for (const [sx, sy] of [[6.5, 34.5], [12.5, 33.5], [18.5, 39.5], [24, 38.5]]) dot(c, sx, sy, 1.3, '#c6f25c')
  snakeHead(c)
}

const REX = '#d9773a'
export const REX_JAW = [29, 17], REX_ARM = [30, 27] // hinges, in sprite px: the renderer swings the parts around these

// The T-rex comes in three pieces so the jaw can snap and the tiny arms can flail.
function rexBody(c: C) {
  legs(c, 17, 24)
  poly(c, REX, 14, 23, 6, 24, 0, 18, 5, 29, 13, 35) // tail
  ellipse(c, 21, 29, 11, 8.5, REX)
  c.save()
  c.beginPath() // pale belly
  c.ellipse(23, 33.5, 7, 3.6, 0, 0, Math.PI * 2)
  c.fillStyle = '#f6dfb0'
  c.fill()
  c.beginPath() // soft light on the back
  c.ellipse(18, 24.5, 6, 2, -0.15, 0, Math.PI * 2)
  c.fillStyle = 'rgba(255,255,255,.22)'
  c.fill()
  c.strokeStyle = '#a8521f' // stripes down the back and tail
  c.lineWidth = 1.8
  for (const [sx, sy] of [[4.5, 22.5], [9, 24], [14, 22], [19, 21.5], [24, 22]]) line(c, sx, sy, sx + 0.6, sy + 3.5)
  c.restore()
  ellipse(c, 19.5, 35, 4.5, 4.5, REX) // thigh
  tube(c, 28, 26, 31, 17, REX)
  box(c, 26, 4, 20, 12.5, 4.5, REX) // a head too big for the rest of him
  c.save()
  c.beginPath()
  c.ellipse(34, 6.5, 6, 1.4, 0, 0, Math.PI * 2)
  c.fillStyle = 'rgba(255,255,255,.22)'
  c.fill()
  c.lineWidth = 1.2
  for (const tx of [33, 36.5, 40, 43.5]) poly(c, '#fff', tx - 1.5, 16.5, tx, 20, tx + 1.5, 16.5) // top teeth
  c.restore()
  eye(c, 33, 10, 2.6, 1.2)
  line(c, 29.5, 5.5, 36.5, 8) // furious brow
  dot(c, 43.5, 8, 0.9, INK)
}

function rexJaw(c: C) {
  c.save()
  c.lineWidth = 1.2
  for (const tx of [34.5, 38, 41.5]) poly(c, '#fff', tx - 1.5, 20, tx, 16.5, tx + 1.5, 20)
  c.restore()
  box(c, 27, 19, 17.5, 5, 2.5, REX)
}

function rexArm(c: C) { // can't reach anything, waves anyway
  c.save()
  for (const [w, col] of [[4.2, INK], [1.8, REX]] as const) {
    c.lineWidth = w
    c.strokeStyle = col
    line(c, 30, 27, 34.5, 29.5)
  }
  c.strokeStyle = INK
  c.lineWidth = 1.2
  line(c, 36.8, 28.3, 34.5, 29.5, 36.6, 31.2) // two claws
  c.restore()
}

function rex(c: C) { // tray icon: all the pieces, mouth open
  rexBody(c)
  rexArm(c)
  c.translate(REX_JAW[0], REX_JAW[1])
  c.rotate(0.3)
  c.translate(-REX_JAW[0], -REX_JAW[1])
  rexJaw(c)
}

function gymbro(c: C) {
  legs(c, 21, 27) // skipped leg day
  ellipse(c, 10.5, 25, 4.5, 6, SKIN)
  ellipse(c, 37.5, 25, 4.5, 6, SKIN)
  poly(c, '#ff7a59', 12, 21, 36, 21, 30, 38, 18, 38)
  ellipse(c, 24, 14, 6.5, 6.5, SKIN)
  c.save() // headband
  c.strokeStyle = '#d9453b'
  c.lineWidth = 3
  line(c, 17.5, 11, 30.5, 11)
  c.restore()
  dot(c, 21.5, 14.5, 1.1, INK)
  dot(c, 27, 14.5, 1.1, INK)
  smile(c, 24.3, 16.5, 2.4)
}

function toddler(c: C) {
  legs(c, 21, 27)
  line(c, 18, 34, 12, 30) // grabby hands
  line(c, 30, 34, 37, 30)
  box(c, 18, 31, 12, 9, 4, '#7ec8e3')
  ellipse(c, 24, 23, 9.5, 9.5, '#f6d3b8')
  c.beginPath() // one curl
  c.arc(25, 12, 2.5, Math.PI * 0.5, Math.PI * 2)
  c.stroke()
  eye(c, 20.5, 22.5)
  eye(c, 28, 22.5)
  c.beginPath()
  c.ellipse(24.5, 28.5, 3, 2, 0, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.fillStyle = '#fff' // one tooth
  c.fillRect(23.7, 26.8, 1.8, 1.6)
}

// Everything above the throwing arm: shirt, head, sunglasses, moustache.
function dadTop(c: C) {
  box(c, 14, 21, 20, 18, 7, '#4caf8a')
  ellipse(c, 24, 14, 7.5, 7.5, SKIN)
  box(c, 18.5, 11, 5, 3.5, 1, INK) // sunglasses
  box(c, 25.5, 11, 5, 3.5, 1, INK)
  line(c, 23.5, 12, 25.5, 12)
  c.save() // moustache
  c.strokeStyle = '#5b4636'
  c.lineWidth = 3
  line(c, 20.5, 18, 28, 18)
  c.restore()
}

function dad(c: C) {
  legs(c, 20, 28)
  line(c, 32, 27, 38, 19) // throwing arm
  c.save() // the sandal
  c.translate(40, 15)
  c.rotate(-0.5)
  ellipse(c, 0, 0, 5.5, 2.6, '#ff8fb1')
  c.restore()
  dadTop(c)
}

function dadBarefoot(c: C) { // the sandal is out there somewhere; the arm hangs empty
  legs(c, 20, 28)
  line(c, 32, 28, 37, 34)
  dadTop(c)
}

function dragon(c: C) {
  const G = '#3fae6b'
  legs(c, 15, 26)
  poly(c, G, 12, 35, 3, 31, 0, 23, 5, 28, 13, 28) // tail
  poly(c, '#2e8b57', 15, 25, 7, 8, 14, 13, 19, 6, 21, 14, 27, 11, 24, 26) // wing
  ellipse(c, 20, 32, 12, 8.5, G)
  c.beginPath() // belly
  c.ellipse(22, 35, 7, 4.5, 0, 0, Math.PI * 2)
  c.fillStyle = '#c8e6a0'
  c.fill()
  tube(c, 29, 28, 32, 16, G)
  poly(c, '#fff3c4', 30, 8, 27, 1, 33, 6) // horn
  box(c, 28, 6, 16, 11, 4, G)
  eye(c, 34, 10.5, 2.4, 1.1)
  line(c, 30.5, 7, 37, 9)
  dot(c, 41.5, 9.5, 0.9, INK)
  c.save() // teeth
  c.lineWidth = 1.2
  poly(c, '#fff', 37, 17, 38.5, 20, 40, 17)
  poly(c, '#fff', 40.5, 17, 42, 19.5, 43, 16.5)
  c.restore()
}

function phoenix(c: C) {
  const R = '#ff6b2c', Y = '#ffc93c'
  legs(c, 20, 27, '#f08c1b')
  poly(c, Y, 13, 30, 1, 30, 6, 25, 0, 19, 8, 20, 6, 12, 15, 21) // flame tail
  ellipse(c, 22, 29, 11, 9.5, R)
  c.beginPath() // belly
  c.ellipse(24, 32, 6, 5, 0, 0, Math.PI * 2)
  c.fillStyle = '#ffd98a'
  c.fill()
  c.beginPath() // wing
  c.arc(18, 28, 6, Math.PI * 0.1, Math.PI * 0.9)
  c.stroke()
  poly(c, Y, 27, 11, 25, 3, 30, 7, 32, 0, 35, 7, 39, 4, 37, 11) // hairdo, on fire, on purpose
  ellipse(c, 32, 16, 7.5, 7, R)
  poly(c, '#f08c1b', 38.5, 14.5, 45.5, 17, 38.5, 19.5) // beak
  eye(c, 34, 15, 3, 1.3)
  dot(c, 30.5, 20, 1.6, '#ffb3a0') // blush
}

function unicorn(c: C) {
  const W = '#fff', PINK = '#ff7eb6', GOLD = '#ffd23f', BLUE = '#6ec6ff'
  const stripes = (...p: number[]) => { // two more colours running along the pink hair
    c.save()
    c.lineWidth = 1.6
    c.strokeStyle = GOLD
    line(c, ...p)
    c.translate(1.9, 1)
    c.strokeStyle = BLUE
    line(c, ...p)
    c.restore()
  }
  poly(c, PINK, 11, 27, 4, 25, 0, 32, 3, 40, 6, 34, 11, 32) // tail
  stripes(8.5, 28, 3.5, 29.5, 2.5, 35)
  legs(c, 15, 26)
  ellipse(c, 20, 31, 11, 7.5, W)
  c.beginPath() // soft shade under the belly
  c.ellipse(20, 34.6, 8, 2.6, 0, 0, Math.PI * 2)
  c.fillStyle = 'rgba(150,130,200,.2)'
  c.fill()
  dot(c, 16, 30, 1.5, GOLD) // a little mark on the flank
  dot(c, 19, 28.2, 0.9, PINK)
  poly(c, PINK, 26, 27, 20, 24, 23.5, 22, 19.5, 18, 24, 17, 22, 11.5, 27, 12, 27, 5.5, 32, 9) // mane, mostly behind the neck
  stripes(22.2, 23.2, 21.8, 18.6, 23.6, 13.2, 28, 8)
  tube(c, 28, 28, 31, 16, W)
  poly(c, W, 30, 9, 29.5, 3, 33.5, 7) // ear
  poly(c, GOLD, 35.5, 8.5, 46, 0.5, 39, 10.5) // the pointy end
  c.save()
  c.lineWidth = 1
  line(c, 38, 7, 39.8, 9.2) // spiral
  line(c, 40.5, 5, 42.2, 7)
  line(c, 43, 3, 44.2, 4.6)
  c.restore()
  ellipse(c, 35, 13.5, 6.5, 5, W)
  eye(c, 35, 12.5, 2, 1)
  line(c, 32.3, 9.8, 37.6, 11.2) // very serious about this
  dot(c, 37.6, 16, 1.3, '#ffb3c7') // blush
  dot(c, 40.2, 13.6, 0.7, INK)
}

const PEG = '#bfe0ff'
export const WING = [22, 27] // wing hinge, in sprite px

const wing = (fill: string, feather: string) => (c: C) => {
  poly(c, fill, 22, 28, 13, 23, 11, 12, 16, 17, 17, 6, 21.5, 14, 25, 7, 27.5, 19)
  c.save()
  c.lineWidth = 1
  c.strokeStyle = feather
  line(c, 16.5, 19, 19, 24) // feathers
  line(c, 21, 16, 22, 23.5)
  line(c, 25, 15, 24.5, 23)
  c.restore()
}
const pegasusWing = wing('#fff', '#a9b8d6'), griffinWing = wing('#9a6a3a', '#5e3d1e')

function griffinBody(c: C) { // eagle at the front, lion at the back
  const TAWNY = '#dba24a', BEAK = '#f08c1b'
  line(c, 10, 30, 4.5, 28, 2.5, 21) // lion tail
  ellipse(c, 2.8, 18, 2.6, 3.4, '#8a5a2b') // tuft
  line(c, 14, 36, 14, 43, 17, 43) // back paw
  c.save() // front talons
  c.strokeStyle = BEAK
  line(c, 26, 36, 26, 41.5)
  line(c, 23.3, 44, 26, 41.5, 28.7, 44)
  c.restore()
  ellipse(c, 20, 31, 11, 7.5, TAWNY)
  c.beginPath() // soft shade under the belly
  c.ellipse(19, 34.6, 8, 2.6, 0, 0, Math.PI * 2)
  c.fillStyle = 'rgba(120,70,20,.22)'
  c.fill()
  ellipse(c, 27.5, 28, 5, 6, '#fff') // feathery ruff
  tube(c, 28, 27, 31, 17, '#fff')
  c.save()
  c.lineWidth = 1
  c.strokeStyle = '#b9bccb'
  for (const [fx, fy] of [[26, 27], [29, 30], [30.5, 24.5], [28.5, 21]]) { c.beginPath(); c.arc(fx, fy, 1.5, Math.PI * 0.1, Math.PI * 0.9); c.stroke() } // chest feathers
  c.restore()
  poly(c, '#fff', 29.5, 10, 27, 4, 32.5, 8) // ear tuft
  ellipse(c, 34, 13, 6.5, 5.5, '#fff')
  poly(c, BEAK, 39, 10.5, 46, 12.5, 44.5, 18, 42.5, 15.2, 39, 16) // hooked beak
  eye(c, 35.5, 12.2, 2.2, 1.1)
  line(c, 32.3, 8.8, 38.6, 10.9) // professional glare
}

function griffin(c: C) {
  griffinBody(c)
  griffinWing(c)
}

// The pegasus is body plus a separate wing, so the wing can flap.
function pegasusBody(c: C) {
  const GOLD = '#ffd23f'
  poly(c, GOLD, 10, 28, 6, 22, 7.5, 14, 3.5, 11, 0.5, 18, 2.5, 27, 8, 32) // tail, held well out of the line of fire
  c.save()
  c.lineWidth = 1.1
  line(c, 4.2, 14.5, 3.2, 20, 5, 26)
  c.restore()
  legs(c, 15, 26) // dangling
  ellipse(c, 20, 31, 11, 7.5, PEG)
  c.beginPath() // soft shade under the belly
  c.ellipse(20, 34.6, 8, 2.6, 0, 0, Math.PI * 2)
  c.fillStyle = 'rgba(60,90,160,.2)'
  c.fill()
  c.save() // a little rainbow on the rump, as a warning
  c.lineWidth = 1.1
  for (const [k, col] of ['#ff5d5d', '#ffe45c', '#5aa9ff'].entries()) {
    c.strokeStyle = col
    c.beginPath()
    c.arc(13.5, 32.5, 3.5 - k * 1.1, Math.PI, Math.PI * 2)
    c.stroke()
  }
  c.restore()
  poly(c, GOLD, 26, 27, 20.5, 24, 23.5, 22, 20, 18, 24, 17, 22.5, 12, 27, 12, 27.5, 5.5, 32, 9) // mane
  tube(c, 28, 28, 31, 16, PEG)
  poly(c, PEG, 30, 9, 29.5, 3, 33.5, 7) // ear
  ellipse(c, 35, 13.5, 6.5, 5, PEG)
  eye(c, 35, 12.5, 2, 1)
  line(c, 32.6, 11, 37.4, 11) // smug eyelid
  smile(c, 38.2, 14.2, 1.8)
  dot(c, 40.3, 13, 0.7, INK)
}

function pegasus(c: C) {
  pegasusBody(c)
  pegasusWing(c)
}

function phoenixEgg(c: C) {
  ellipse(c, 24, 30, 10, 13, '#ffd98a')
  c.save()
  c.lineWidth = 1.4
  poly(c, '#ff6b2c', 16, 36, 19, 30, 22, 35, 24.5, 28, 27, 35, 30, 30, 32, 36, 28, 41.5, 20, 41.5) // flame pants
  smile(c, 20.5, 23, 2) // fast asleep
  smile(c, 28, 23, 2)
  c.restore()
}

function chick(c: C) {
  legs(c, 21, 27, '#f08c1b')
  poly(c, '#ff6b2c', 21, 19, 20, 9, 24, 13, 26, 7, 28, 19) // one tiny flame of hair
  line(c, 14, 28, 8, 22) // flapping, uselessly
  line(c, 34, 28, 40, 22)
  ellipse(c, 24, 28, 10, 10, '#ffd23f')
  eye(c, 20.5, 26, 3.2, 1.4)
  eye(c, 28.5, 26, 3.2, 1.4)
  line(c, 16.5, 21, 22.5, 23.5) // furious
  line(c, 32.5, 21, 26.5, 23.5)
  poly(c, '#f08c1b', 22.5, 30, 26.5, 30, 24.5, 34.5)
}

function siren(c: C) {
  const T = '#2bb8a6'
  poly(c, '#7fe3d4', 11, 40, 3, 33, 6, 40, 3, 46) // tail fin
  ellipse(c, 21, 15, 8, 10.5, '#ff5fa2') // big hair
  box(c, 19, 20, 12, 15, 5, SKIN)
  tube(c, 11, 40, 25, 36, T) // tail, no legs to skip leg day with
  dot(c, 25, 26, 2.3, '#b98cf0') // seashell top
  ellipse(c, 26, 13, 7, 7, SKIN)
  smile(c, 28.5, 11, 2) // eyes shut, feeling it
  dot(c, 31, 16.5, 2.2, INK) // mouth wide open, mid-note
  line(c, 30, 27, 37, 20) // arm
  dot(c, 38.5, 18, 3, '#55596b') // karaoke mic
}

function boba(c: C) {
  legs(c, 19, 29)
  line(c, 30, 18, 34, 4) // straw doubles as the pearl cannon
  poly(c, '#bd8b65', 12, 16, 36, 16, 32, 39, 17, 39)
  box(c, 11, 13, 26, 5, 2, '#ead8cb')
  for (const x of [20, 25, 30]) dot(c, x, 34, 2.2, '#4a2941')
  eye(c, 21, 24)
  eye(c, 30, 24)
  smile(c, 26, 29, 2)
}

function pizza(c: C) {
  legs(c, 20, 28)
  poly(c, '#ffc667', 9, 12, 39, 12, 25, 40) // cheese triangle
  box(c, 8, 9, 32, 7, 3, '#bd783d')
  for (const [x, y] of [[16, 21], [31, 20], [24, 33]]) dot(c, x, y, 2.5, '#cc4b48')
  eye(c, 21, 25, 2.2, 1)
  eye(c, 29, 25, 2.2, 1)
  smile(c, 25, 29, 2)
}

function mochi(c: C) {
  legs(c, 19, 29)
  ellipse(c, 24, 29, 16, 11, '#f4b7cd') // squishable, suspiciously resilient
  ellipse(c, 20, 23, 7, 2, 'rgba(255,255,255,.24)')
  eye(c, 20, 28, 2.3, 1)
  eye(c, 29, 28, 2.3, 1)
  dot(c, 15, 32, 2, '#ed83aa')
  dot(c, 34, 32, 2, '#ed83aa')
  smile(c, 25, 32, 2)
}

function espresso(c: C) {
  legs(c, 20, 28)
  ellipse(c, 36, 27, 6, 6, '#fbf0d7') // handle
  box(c, 12, 18, 23, 20, 5, '#957362')
  ellipse(c, 23.5, 18, 11.5, 4, '#543b34')
  c.save()
  c.strokeStyle = '#b9a69e'
  c.lineWidth = 1.3
  line(c, 19, 12, 17, 8, 20, 4)
  line(c, 27, 12, 25, 8, 28, 4) // even the steam needs a break
  c.restore()
  eye(c, 20, 27, 2.5, 0.8)
  eye(c, 28, 27, 2.5, 0.8)
  line(c, 17, 25, 23, 25)
  line(c, 25, 25, 31, 25)
  line(c, 22, 33, 27, 33)
}

function popcorn(c: C) {
  legs(c, 19, 29)
  poly(c, '#f17986', 11, 19, 37, 19, 33, 39, 16, 39)
  c.save()
  c.lineWidth = 3
  c.strokeStyle = '#fff1d0'
  line(c, 18, 22, 20, 35)
  line(c, 25, 22, 25, 36)
  line(c, 32, 22, 30, 35)
  c.restore()
  for (const [x, y] of [[14, 17], [20, 12], [27, 16], [33, 12], [37, 18]]) ellipse(c, x, y, 4, 4, '#fff1b8')
  eye(c, 21, 26, 2.2, 1)
  eye(c, 29, 26, 2.2, 1)
  dot(c, 25, 32, 2, INK) // has another unsolicited take ready
}

// Same simple person underneath; a colour and a prop do the introducing.
function person(c: C, color: string) {
  legs(c, 20, 28)
  box(c, 14, 23, 20, 17, 7, color)
  ellipse(c, 24, 15, 8, 8, SKIN)
  eye(c, 21, 15, 2.2, 1)
  eye(c, 28, 15, 2.2, 1)
}

function doomscroller(c: C) {
  person(c, '#6676a8')
  poly(c, '#38384b', 16, 10, 18, 5, 24, 7, 30, 5, 33, 11) // bed hair, phone glow
  box(c, 33, 23, 10, 15, 2, '#38384b')
  box(c, 35, 25, 6, 9, 1, '#addde8')
  line(c, 18, 13, 24, 13)
  line(c, 26, 13, 31, 13)
  line(c, 21, 20, 28, 20)
}

function replyGuy(c: C) {
  person(c, '#6e9bc7')
  box(c, 15, 6, 18, 5, 2, '#314b73')
  line(c, 30, 10, 39, 10) // backwards-cap energy, forwards opinions
  box(c, 30, 27, 15, 10, 2, '#dce8f2')
  c.save()
  c.lineWidth = 1
  for (const yy of [30, 33]) line(c, 33, yy, 42, yy)
  c.restore()
  smile(c, 25, 20, 2)
}

function mainCharacter(c: C) {
  person(c, '#ed91bb')
  poly(c, '#624b76', 15, 13, 17, 5, 24, 3, 31, 7, 33, 13, 27, 9, 23, 11, 21, 8)
  line(c, 35, 37, 39, 22) // portable ring light, very humble
  ellipse(c, 39, 17, 6, 7, '#fff7ca')
  ellipse(c, 39, 17, 3, 4, '#fbf7ec')
  smile(c, 25, 20, 2)
}

function touchGrass(c: C) {
  person(c, '#91a84d')
  poly(c, '#65813f', 16, 10, 14, 2, 21, 7, 24, 1, 27, 7, 33, 3, 32, 11) // extremely literal advice
  poly(c, '#bc8065', 34, 28, 46, 28, 43, 38, 37, 38)
  line(c, 40, 28, 40, 18)
  ellipse(c, 36, 22, 4, 2, '#8fbd59')
  ellipse(c, 43, 19, 3, 2, '#8fbd59')
  smile(c, 25, 20, 2)
}

function bedRot(c: C) {
  ellipse(c, 23, 31, 16, 10, '#8597c3') // duvet burrito, no plans to leave
  box(c, 26, 27, 18, 10, 4, '#ece7fa') // pillow of consequences
  ellipse(c, 19, 22, 7, 7, SKIN)
  box(c, 11, 13, 16, 6, 3, '#8597c3')
  line(c, 14, 22, 18, 22)
  line(c, 21, 22, 25, 22)
  smile(c, 20, 26, 2)
}

function ninja(c: C) {
  legs(c, 20, 28)
  box(c, 14, 24, 20, 16, 7, '#46516a')
  ellipse(c, 24, 15, 9, 9, '#46516a')
  box(c, 17, 12, 16, 6, 2, '#f7d7bc')
  dot(c, 22, 15, 1, INK)
  dot(c, 29, 15, 1, INK)
  poly(c, '#96cfc3', 15, 20, 5, 24, 7, 18, 15, 17) // mint scarf, zero bravery
  poly(c, '#bfcbd9', 39, 25, 41, 29, 46, 30, 42, 32, 41, 37, 38, 33, 34, 32, 38, 29)
}

function samurai(c: C) {
  person(c, '#bd5864')
  poly(c, '#54334a', 13, 13, 17, 5, 30, 5, 35, 13)
  poly(c, '#ffd23f', 17, 7, 13, 2, 22, 6, 28, 6, 35, 2, 31, 8) // helmet crest
  box(c, 15, 29, 18, 8, 2, '#834052')
  line(c, 31, 32, 37, 28)
  poly(c, '#e3e9f1', 37, 28, 44, 10, 45, 17, 40, 30) // sword; the rest is rotational confidence
  line(c, 35, 27, 42, 30)
}

function centaur(c: C) {
  legs(c, 12, 25, '#654a3d')
  line(c, 17, 36, 16, 42, 19, 43)
  line(c, 30, 35, 32, 42, 35, 43) // all four hooves, none on leg day
  line(c, 10, 29, 4, 24, 3, 30)
  ellipse(c, 20, 31, 13, 7, '#ad7954')
  ellipse(c, 20, 34, 8, 2, 'rgba(70,40,20,.18)')
  box(c, 24, 15, 11, 16, 4, '#55a9a0')
  ellipse(c, 30, 9, 6, 6, SKIN)
  poly(c, '#654a3d', 24, 9, 24, 4, 30, 2, 35, 5, 35, 8)
  eye(c, 32, 9, 1.8, 0.8)
  line(c, 34, 23, 43, 14)
  line(c, 39, 38, 43, 9) // spear held nearly upright
  poly(c, '#d8e5eb', 40, 9, 44, 2, 46, 10)
}

function archerfish(c: C) {
  poly(c, '#669bbc', 12, 26, 3, 20, 4, 34, 13, 31) // smug little tail
  ellipse(c, 24, 27, 14, 9, '#7fb7c9')
  poly(c, '#537b98', 16, 19, 24, 12, 28, 19)
  ellipse(c, 25, 31, 8, 3, '#d6edf0')
  for (const xx of [17, 23]) line(c, xx, 21, xx - 2, 27)
  ellipse(c, 39, 27, 5, 3, '#7fb7c9') // a mouth built for unreasonable range
  eye(c, 33, 23, 3, 1)
  line(c, 29, 20, 36, 21)
}

function jellyfish(c: C) {
  c.save()
  c.lineWidth = 2.4
  c.strokeStyle = '#ab70bc'
  for (const xx of [13, 20, 27, 34]) line(c, xx, 27, xx - 2, 33, xx + 2, 38, xx, 43)
  c.restore()
  ellipse(c, 24, 22, 16, 12, '#c7a0de')
  ellipse(c, 18, 16, 6, 2, 'rgba(255,255,255,.3)')
  c.save()
  c.lineWidth = 1.1
  poly(c, '#fff1a6', 24, 11, 20, 19, 24, 19, 22, 25, 29, 16, 25, 16) // the warranty sticker
  c.restore()
  eye(c, 17, 24, 2.2, 1)
  eye(c, 32, 24, 2.2, 1)
  smile(c, 25, 29, 2)
}

function capybara(c: C) {
  legs(c, 15, 30, '#765842')
  ellipse(c, 21, 30, 15, 10, '#b99269') // the entire combat strategy is stored back here
  ellipse(c, 15, 32, 7, 6, '#caa780')
  box(c, 27, 19, 18, 16, 6, '#b99269')
  ellipse(c, 30, 19, 3, 4, '#b99269')
  eye(c, 36, 25, 2.3, 0.8)
  line(c, 33, 23, 39, 23)
  dot(c, 43, 28, 1, INK)
  line(c, 38, 32, 43, 32)
  ellipse(c, 28, 14, 4, 3, '#f5a849') // emergency emotional-support tangerine
  line(c, 28, 11, 30, 9)
}

function cat(c: C) {
  legs(c, 18, 29)
  c.save()
  c.lineWidth = 4
  c.strokeStyle = '#cd997c'
  line(c, 12, 31, 6, 28, 4, 20, 7, 17) // tail already filing a complaint
  c.restore()
  ellipse(c, 22, 32, 11, 7, '#cd997c')
  poly(c, '#cd997c', 25, 22, 24, 10, 31, 15, 39, 11, 40, 23)
  ellipse(c, 33, 24, 9, 7, '#cd997c')
  eye(c, 30, 23, 2, 0.8)
  eye(c, 37, 23, 2, 0.8)
  poly(c, '#b45d70', 32, 27, 35, 27, 33.5, 29)
  c.save()
  c.lineWidth = 1
  line(c, 26, 27, 21, 26)
  line(c, 26, 29, 21, 30)
  line(c, 40, 27, 46, 26)
  line(c, 40, 29, 46, 30)
  c.restore()
}

function ant(c: C) {
  c.save()
  c.lineWidth = 1.5
  for (let k = 0; k < 3; k++) {
    const x = 16 + k * 7
    line(c, x, 33, x - 5, 38, x - 7, 43)
    line(c, x + 1, 34, x + 5, 39, x + 8, 42) // six legs, all late for the same meeting
  }
  c.restore()
  ellipse(c, 13, 31, 9, 7, '#9b4535')
  ellipse(c, 25, 31, 6, 5, '#ad5640')
  ellipse(c, 35, 26, 7, 7, '#ad5640')
  ellipse(c, 11, 29, 4, 2, 'rgba(255,255,255,.2)')
  line(c, 32, 20, 28, 14, 25, 14)
  line(c, 37, 19, 40, 13, 44, 12) // antennae: the entire planning department
  eye(c, 37, 24, 2.3, 1)
  line(c, 35, 21, 40, 22)
  line(c, 40, 29, 44, 30, 42, 33) // tiny, deeply serious mandibles
}

function anthill(c: C) {
  poly(c, '#b98b61', 4, 42, 8, 35, 13, 32, 18, 23, 23, 20, 29, 25, 34, 34, 40, 36, 45, 43)
  poly(c, '#d2aa7c', 8, 38, 16, 30, 20, 24, 23, 22, 22, 30, 18, 36)
  ellipse(c, 28, 37, 5.5, 6, '#4e342d') // one suspiciously productive little doorway
  c.save()
  c.lineWidth = 1
  line(c, 10, 40, 15, 38)
  line(c, 26, 27, 30, 30)
  line(c, 35, 38, 39, 40)
  dot(c, 20, 34, 1, '#805b43')
  dot(c, 17, 40, 0.9, '#805b43')
  c.restore()
}

function millipede(c: C) {
  c.save()
  c.lineWidth = 1.2
  for (let k = 0; k < 7; k++) {
    const x = 7 + k * 4.6, y = 34 - Math.sin(k * 0.5) * 3
    line(c, x, y, x - 2, 41, x + 1, 43)
    line(c, x + 1, y, x + 4, 39, x + 6, 40)
    ellipse(c, x, y - 3, 4.1, 5, k & 1 ? '#bd7952' : '#a96343')
  }
  c.restore()
  ellipse(c, 38, 27, 6, 6, '#c78558')
  line(c, 36, 22, 34, 16, 31, 15)
  line(c, 40, 21, 43, 16, 46, 17)
  eye(c, 40, 26, 2.4, 1.1)
}

function millipedeWheel(c: C) {
  c.save()
  c.lineWidth = 1.3
  for (let k = 0; k < 14; k++) {
    const a = k * Math.PI / 7
    line(c, 24 + Math.cos(a) * 12, 29 + Math.sin(a) * 12, 24 + Math.cos(a) * 16, 29 + Math.sin(a) * 16)
  }
  c.restore()
  ellipse(c, 24, 29, 12.5, 12.5, '#ac6748')
  c.beginPath()
  c.moveTo(34, 29)
  c.bezierCurveTo(34, 16, 13, 17, 15, 30)
  c.bezierCurveTo(17, 41, 34, 37, 29, 27)
  c.bezierCurveTo(25, 20, 19, 26, 24, 30)
  c.stroke()
  eye(c, 34, 26, 2.2, 1)
}

function bugCar(c: C) {
  c.save()
  for (const [x, y] of [[11, 25], [36, 25], [11, 38], [36, 38]]) {
    c.save()
    c.translate(x - 24 * 0.43, y - 29 * 0.43)
    c.scale(0.43, 0.43)
    millipedeWheel(c)
    c.restore()
  }
  c.restore()
  poly(c, '#78bfc1', 5, 33, 8, 22, 17, 21, 21, 12, 33, 14, 38, 23, 44, 26, 44, 35, 5, 35)
  poly(c, '#e6f6f5', 21, 16, 30, 17, 34, 23, 18, 22)
  line(c, 25, 17, 24, 23)
  box(c, 3, 33, 43, 4, 1, '#e1ce9d')
  eye(c, 37, 27, 2.4, 1)
  line(c, 38, 32, 42, 31)
  line(c, 7, 23, 3, 18)
}

function mantis(c: C) {
  c.save()
  c.strokeStyle = '#4d7a3c'
  c.lineWidth = 2
  line(c, 22, 28, 13, 37, 9, 43)
  line(c, 26, 29, 31, 37, 37, 43)
  c.restore()
  ellipse(c, 20, 31, 6, 9, '#82b95b')
  poly(c, '#a2d06c', 23, 31, 25, 19, 30, 17, 29, 31)
  line(c, 28, 24, 36, 31, 39, 20, 34, 24)
  line(c, 25, 25, 30, 32, 33, 22, 29, 26)
  poly(c, '#9cce68', 21, 12, 39, 12, 32, 21)
  eye(c, 24, 14, 2.6, 1)
  eye(c, 36, 14, 2.6, 1)
  line(c, 26, 10, 23, 4, 19, 3)
  line(c, 33, 10, 37, 4, 41, 4)
}

function spider(c: C) {
  c.save()
  c.lineWidth = 1.7
  for (let k = 0; k < 4; k++) {
    line(c, 19 + k * 3, 30, 7 + k * 3, 26 + k * 3, 3 + k * 4, 36 + k * 2)
    line(c, 24 + k * 2, 31, 40 + k, 24 + k * 4, 45 - k, 34 + k * 3)
  }
  c.restore()
  ellipse(c, 20, 28, 10, 9, '#77618c')
  ellipse(c, 17, 25, 4.5, 2.4, '#9d87b0')
  ellipse(c, 32, 30, 7, 6, '#9277a6')
  eye(c, 31, 27, 3, 1.3)
  eye(c, 37, 28, 2.4, 1.1)
  line(c, 32, 34, 35, 35, 38, 33)
}

function spiderNest(c: C) {
  c.save()
  c.lineWidth = 1.2
  c.strokeStyle = '#8e8797'
  poly(c, '#ebe8ee', 3, 41, 10, 30, 14, 18, 24, 13, 35, 23, 39, 33, 46, 42)
  for (let k = 0; k < 5; k++) line(c, 24, 15, 5 + k * 9, 41)
  line(c, 12, 26, 20, 29, 32, 26, 36, 29)
  line(c, 8, 34, 18, 36, 31, 33, 41, 36)
  ellipse(c, 27, 36, 6, 6, '#4c3e5b')
  c.restore()
}

export const UNITS: UnitDef[] = [
  {
    key: 'toast', name: 'Sir Toast', blurb: 'Remembers who hit him first. Gets toastier and faster every time they do it again', category: 'Food',
    color: '#d99a3d', kind: 'melee', r: 11, hp: 140, speed: 55, dmg: 14, range: 4, cd: 0.7, knock: 90, spacing: 26, draw: toast, grudge: 0.15,
  },
  {
    key: 'goose', name: 'Honk', blurb: 'Pecks you once. You run for your life', category: 'Animals', prey: true,
    color: '#9aa7b8', kind: 'melee', r: 9, hp: 45, speed: 150, dmg: 7, range: 3, cd: 0.3, knock: 40, spacing: 22, draw: goose, scare: 0.35,
  },
  {
    key: 'intern', name: 'Unpaid Intern', blurb: 'Two kills and he is management. Now the other interns do twice the work', category: 'People',
    color: '#3d6fd8', kind: 'ranged', r: 9, hp: 50, speed: 65, dmg: 12, range: 190, cd: 1, knock: 60, spacing: 22, draw: intern, promote: 2, alt: internManager,
  },
  {
    key: 'nana', name: 'Nana', blurb: 'One handbag swing and you\'re airmail. Mind who you land on', category: 'People',
    color: '#9b6bc7', kind: 'melee', r: 10, hp: 110, speed: 38, dmg: 30, range: 5, cd: 1.4, knock: 520, spacing: 24, draw: nana, launch: 200,
  },
  {
    key: 'pickle', name: 'Kaboom Pickle', blurb: 'Runs in screaming, explodes, leaves a brine puddle behind', category: 'Food',
    color: '#5aa83a', kind: 'boom', r: 9, hp: 30, speed: 110, dmg: 70, range: 55, cd: 0, knock: 380, spacing: 24, draw: pickle, hides: true, brine: 3,
  },
  {
    key: 'chili', name: 'Señor Chili', blurb: 'So spicy it spreads. Burning victims run screaming into their friends', category: 'Food',
    color: '#e03a2e', kind: 'melee', r: 9, hp: 60, speed: 95, dmg: 6, range: 3, cd: 0.5, knock: 40, spacing: 22, draw: chili, burn: 2.5, hides: true, wildfire: true,
  },
  {
    key: 'pancake', name: 'Flapjack', blurb: 'Every big hit knocks a pancake off. Shorter, stickier, faster', category: 'Food',
    color: '#e2a95a', kind: 'ranged', r: 11, hp: 90, speed: 45, dmg: 8, range: 170, cd: 1.1, knock: 20, spacing: 26, draw: pancakeStack(3), shot: '#8a4b1c', stack: [pancakeStack(1), pancakeStack(2), pancakeStack(3)],
  },
  {
    key: 'egg', name: 'Eggbert', blurb: 'Crack him and an angry Honk pops out', category: 'Food',
    color: '#f2d98a', kind: 'melee', r: 9, hp: 55, speed: 70, dmg: 6, range: 3, cd: 0.6, knock: 30, spacing: 22, draw: egg, hatch: 'goose',
  },
  {
    key: 'hedgehog', name: 'Spike', blurb: 'Prick him and get pricked. Corner him and he goes full bowling ball', category: 'Animals', prey: true,
    color: '#8a6a4a', kind: 'melee', r: 9, hp: 80, speed: 60, dmg: 8, range: 3, cd: 0.7, knock: 30, spacing: 22, draw: hedgehog, thorns: 8, hides: true, roll: 260, alt: hedgehogBall,
  },
  {
    key: 'mozzie', name: 'Mozzie', blurb: 'Drinks your health, sip by sip, until it pops', category: 'Bug', prey: true,
    color: '#c0392b', kind: 'melee', r: 6, hp: 22, speed: 170, dmg: 5, range: 2, cd: 0.35, knock: 5, spacing: 16, draw: mozzie, lifesteal: 1, swell: 6,
  },
  {
    key: 'llama', name: 'Spit Llama', blurb: 'Spits in your eye from across the page. Good luck finding anyone now', category: 'Animals', prey: true,
    color: '#d9c7a3', kind: 'ranged', r: 10, hp: 70, speed: 60, dmg: 9, range: 240, cd: 0.8, knock: 90, spacing: 24, draw: llama, shot: '#9fd3e8', blind: 1.3,
  },
  {
    key: 'skunk', name: 'Stinky', blurb: 'Does not blow up any more. Just makes the area unlivable', category: 'Animals', prey: true,
    color: '#7cb342', kind: 'melee', r: 9, hp: 70, speed: 90, dmg: 6, range: 3, cd: 0.7, knock: 20, spacing: 24, draw: skunk, hides: true, stink: 60,
  },
  {
    key: 'snake', name: 'Noodle', blurb: 'Swallows what it kills and grows. Leave it unwatched and it crowns itself and raises an army of little noodles', category: 'Animals', prey: true,
    color: SNAKE, kind: 'melee', r: 8, hp: 70, speed: 85, dmg: 11, range: 3, cd: 0.55, knock: 20, spacing: 22, draw: snake, eats: 30, hides: true,
  },
  {
    key: 'rex', name: 'Tiny Arms', blurb: 'Bites, shakes, flings. Cannot clap', category: 'Animals', prey: true,
    color: REX, kind: 'melee', r: 14, hp: 380, speed: 62, dmg: 26, range: 5, cd: 0.9, knock: 120, spacing: 56, draw: rex, size: 1.5, grab: 0.35,
  },
  {
    key: 'gymbro', name: 'Gym Bro', blurb: 'Hits like a truck. Skipped leg day, so one good shove turns him turtle', category: 'People',
    color: '#ff7a59', kind: 'melee', r: 11, hp: 160, speed: 60, dmg: 26, range: 4, cd: 1, knock: 220, spacing: 26, draw: gymbro, topple: 150,
  },
  {
    key: 'toddler', name: 'Toddler', blurb: 'Hugs your leg and will not let go. Also bites', category: 'People',
    color: '#7ec8e3', kind: 'melee', r: 7, hp: 35, speed: 135, dmg: 4, range: 2, cd: 0.3, knock: 10, spacing: 18, draw: toddler, latch: 0.4, hides: true,
  },
  {
    key: 'dad', name: 'Sandal Dad', blurb: 'One sandal, terrifying aim. Then a long, awkward hop to go get it', category: 'People',
    color: '#4caf8a', kind: 'ranged', r: 10, hp: 85, speed: 50, dmg: 16, range: 150, cd: 0.6, knock: 420, spacing: 24, draw: dad, shot: '#ff8fb1', fetch: true, alt: dadBarefoot,
  },
  {
    key: 'dragon', name: 'Scorch', blurb: 'Huge. Breathes scribbly fire that keeps burning', category: 'Mythical', prey: true,
    color: '#3fae6b', kind: 'fire', r: 16, hp: 700, speed: 42, dmg: 5, range: 95, cd: 0.15, knock: 25, spacing: 70, draw: dragon, burn: 3.5, size: 1.7,
  },
  {
    key: 'phoenix', name: 'Encore', blurb: 'Fire that heals her flock. Dies dramatically, comes back as a furious chick. Once', category: 'Mythical', prey: true,
    color: '#ff6b2c', kind: 'fire', r: 12, hp: 200, speed: 70, dmg: 3, range: 75, cd: 0.15, knock: 10, spacing: 44, draw: phoenix, burn: 2, size: 1.25, heal: 10,
    rebirth: { kind: 'melee', hp: 70, speed: 190, dmg: 4, range: 3, cd: 0.16, knock: 15, burn: 1.5 },
  },
  {
    key: 'unicorn', name: 'Pointy', blurb: 'Spots you from across the page, charges, and pokes you into next week', category: 'Mythical', prey: true,
    color: '#ff7eb6', kind: 'melee', r: 11, hp: 150, speed: 70, dmg: 12, range: 4, cd: 0.6, knock: 60, spacing: 30, draw: unicorn, size: 1.15, charge: 90,
  },
  {
    key: 'pegasus', name: 'Sparklebutt', blurb: 'Turns round, clenches for dear life, and fires a rainbow that sends it skidding', category: 'Mythical', prey: true,
    color: '#9fd0ff', kind: 'beam', r: 10, hp: 110, speed: 150, dmg: 32, range: 620, cd: 2.2, knock: 100, spacing: 34, draw: pegasus, size: 1.15, flies: [pegasusBody, pegasusWing],
  },
  {
    key: 'griffin', name: 'Special Delivery', blurb: 'Claws you, or picks you up, flies you to your friend and introduces you at speed', category: 'Mythical', prey: true,
    color: '#dba24a', kind: 'melee', r: 13, hp: 260, speed: 120, dmg: 16, range: 4, cd: 0.7, knock: 70, spacing: 50, draw: griffin, size: 1.4, grab: 0.4, carry: true, flies: [griffinBody, griffinWing],
  },
  {
    key: 'siren', name: 'Karaoke Shelly', blurb: 'Opens with a ballad nobody can resist. Closes with death metal', category: 'Water', prey: true,
    color: '#2bb8a6', kind: 'sing', r: 10, hp: 90, speed: 40, dmg: 7, range: 220, cd: 0.2, knock: 45, spacing: 40, draw: siren,
  },
  {
    key: 'boba', name: 'Boba Menace', blurb: 'Pearls on a string. Reels you in for a closer sip', category: 'Food',
    color: '#bd8b65', kind: 'ranged', r: 10, hp: 75, speed: 55, dmg: 8, range: 195, cd: 0.85, knock: -160, spacing: 26, draw: boba, projectile: 'pearl',
  },
  {
    key: 'pizza', name: 'Cheesed', blurb: 'Ties you up in cheese and slurps your health through it', category: 'Food',
    color: '#ffc667', kind: 'melee', r: 10, hp: 95, speed: 70, dmg: 13, range: 13, cd: 0.75, knock: 35, spacing: 26, draw: pizza, tether: 2.5,
  },
  {
    key: 'mochi', name: 'Squish Issue', blurb: 'Hit the mochi and it squishes. Then it un-squishes into you', category: 'Food',
    color: '#f4b7cd', kind: 'melee', r: 11, hp: 150, speed: 42, dmg: 5, range: 3, cd: 0.9, knock: 85, spacing: 28, draw: mochi, squish: 1,
  },
  {
    key: 'espresso', name: 'Depresso', blurb: 'Three seconds of pure caffeine. Then a nap, wherever it is', category: 'Food',
    color: '#957362', kind: 'melee', r: 9, hp: 55, speed: 100, dmg: 8, range: 3, cd: 0.5, knock: 25, spacing: 24, draw: espresso, crash: 2,
  },
  {
    key: 'popcorn', name: 'Pop Off', blurb: 'Three hot takes per serving. Set it on fire and it never shuts up', category: 'Food',
    color: '#f17986', kind: 'ranged', r: 10, hp: 65, speed: 60, dmg: 6, range: 165, cd: 1, knock: 45, spacing: 26, draw: popcorn, burst: 3, projectile: 'kernel', pops: 8,
  },
  {
    key: 'doomscroller', name: 'Doomscroller', blurb: 'Every notification is contagious. Soon the whole crowd is scrolling', category: 'People',
    color: '#6676a8', kind: 'ranged', r: 9, hp: 60, speed: 48, dmg: 7, range: 210, cd: 0.9, knock: 20, spacing: 24, draw: doomscroller, distract: 1.6, projectile: 'notification',
  },
  {
    key: 'replyguy', name: 'Reply Guy', blurb: 'Skips everyone nearby to reply to the biggest account on the page', category: 'People',
    color: '#6e9bc7', kind: 'ranged', r: 9, hp: 65, speed: 65, dmg: 5, range: 180, cd: 0.9, knock: 65, spacing: 24, draw: replyGuy, burst: 3, projectile: 'bubble', bully: true,
  },
  {
    key: 'maincharacter', name: 'Main Character', blurb: 'Strikes a pose. Everyone nearby has to come and look, then gets shoved', category: 'People',
    color: '#ed91bb', kind: 'melee', r: 10, hp: 105, speed: 65, dmg: 13, range: 38, cd: 1.5, knock: 230, spacing: 30, draw: mainCharacter, pulse: 58, spotlight: 130,
  },
  {
    key: 'touchgrass', name: 'Touch Grass', blurb: 'Leaves a lawn everywhere it walks. Hiders are thrilled', category: 'People',
    color: '#91a84d', kind: 'melee', r: 9, hp: 80, speed: 80, dmg: 12, range: 5, cd: 0.75, knock: 35, spacing: 24, draw: touchGrass, hides: true, lawn: 60,
  },
  {
    key: 'bedrot', name: 'Bed Rot', blurb: 'Heals in the duvet. Pillow-fights anyone who interrupts the lore', category: 'People',
    color: '#8597c3', kind: 'melee', r: 12, hp: 135, speed: 0, dmg: 22, range: 10, cd: 1.6, knock: 160, spacing: 32, draw: bedRot, regen: 8,
  },
  {
    key: 'centaur', name: 'Horsing Around', blurb: 'Centaurs run circles around you. Spears make the point', category: 'Mythical', prey: true,
    color: '#ad7954', kind: 'ranged', r: 12, hp: 155, speed: 120, dmg: 14, range: 210, cd: 1.1, knock: 70, spacing: 34, draw: centaur, size: 1.2, orbit: 145, projectile: 'spear',
  },
  {
    key: 'archerfish', name: 'Spit Take', blurb: 'Stays in the pond. Spits from three business days away', category: 'Water', prey: true,
    color: '#7fb7c9', kind: 'ranged', r: 10, hp: 65, speed: 50, dmg: 22, range: 620, cd: 1.8, knock: 80, spacing: 30, draw: archerfish, waterbound: true, projectile: 'water',
  },
  {
    key: 'jellyfish', name: 'Shocktopus', blurb: 'A jellyfish with free X-rays. Your bones did not consent to this cameo', category: 'Water', prey: true,
    color: '#c7a0de', kind: 'melee', r: 11, hp: 90, speed: 55, dmg: 12, range: 65, cd: 1.2, knock: 20, spacing: 30, draw: jellyfish, waterbound: true, shock: 0.45,
  },
  {
    key: 'ninja', name: 'No Thanks', blurb: 'Shuriken, dash, immediate regret. Runs when the vibes turn lethal', category: 'People',
    color: '#46516a', kind: 'ranged', r: 9, hp: 70, speed: 115, dmg: 9, range: 155, cd: 0.75, knock: 35, spacing: 26, draw: ninja, projectile: 'shuriken', dash: true, timid: true,
  },
  {
    key: 'samurai', name: 'Spin Sensei', blurb: 'Studied the blade. Majored in becoming a ceiling fan', category: 'People',
    color: '#bd5864', kind: 'melee', r: 10, hp: 145, speed: 75, dmg: 7, range: 30, cd: 2, knock: 55, spacing: 30, draw: samurai, spin: 52,
  },
  {
    key: 'capybara', name: 'Rear Admiral', blurb: 'Jumps, aims the cheeks, lands the argument. Extremely unbothered', category: 'Animals', prey: true,
    color: '#b99269', kind: 'melee', r: 12, hp: 165, speed: 60, dmg: 13, range: 4, cd: 0.9, knock: 65, spacing: 34, draw: capybara, leap: 'slam', size: 1.1,
  },
  {
    key: 'cat', name: 'Civil Paw', blurb: 'One airborne dust-cloud lawsuit. Then the regular scratch subscription', category: 'Animals', prey: true,
    color: '#cd997c', kind: 'melee', r: 9, hp: 80, speed: 105, dmg: 7, range: 4, cd: 0.4, knock: 25, spacing: 26, draw: cat, leap: 'scrap',
  },
  {
    key: 'ant', name: 'Ant', blurb: 'Ten build an anthill. Then twenty, forty… The workers stay. The neighbours worry', category: 'Bug', prey: true,
    color: '#ad5640', kind: 'melee', r: 4, hp: 24, speed: 85, dmg: 3, range: 2, cd: 0.45, knock: 8, spacing: 14, size: 0.65, draw: ant, ant: true,
  },
  {
    key: 'anthill', name: 'Anthill', blurb: 'Three seconds of digging. One fresh ant every four seconds. Absolutely no planning permission', category: 'Bug',
    color: '#b98b61', kind: 'melee', r: 16, hp: 200, speed: 0, dmg: 0, range: 0, cd: 4, knock: 0, spacing: 60, draw: anthill, colony: true, building: true, internal: true, prey: false, band: 25,
  },
  {
    key: 'millipede', name: 'Millipede', blurb: 'Curls up and rolls into trouble. Four wheels make a very questionable car', category: 'Bug',
    color: '#ad704c', kind: 'melee', r: 9, hp: 65, speed: 200, dmg: 10, range: 3, cd: 0.4, knock: 125, spacing: 30, draw: millipede, alt: millipedeWheel, bug: 'millipede', prey: true, band: 25,
  },
  {
    key: 'car', name: 'Bugmobile', blurb: 'Four millipedes, one driving licence. None of them passed', category: 'Bug',
    color: '#78bfc1', kind: 'melee', r: 23, hp: 260, speed: 260, dmg: 26, range: 3, cd: 0.4, knock: 240, spacing: 60, size: 1.6, draw: bugCar, bug: 'car', internal: true, prey: false, band: 27,
  },
  {
    key: 'mantis', name: 'Praying Mantis', blurb: 'Brings a guest to fight club. The others wait politely for their turn', category: 'Bug',
    color: '#82b95b', kind: 'melee', r: 9, hp: 85, speed: 95, dmg: 10, range: 4, cd: 0.6, knock: 30, spacing: 28, draw: mantis, bug: 'mantis', prey: true, band: 14,
  },
  {
    key: 'spider', name: 'Spider', blurb: 'Webs, pounces, wraps the leftovers. Five cocoons and the family gets bigger', category: 'Bug',
    color: '#9277a6', kind: 'ranged', r: 8, hp: 65, speed: 90, dmg: 8, range: 480, cd: 1.4, knock: 12, spacing: 26, draw: spider, bug: 'spider', prey: true, projectile: 'web', band: 27,
  },
  {
    key: 'nest', name: 'Spider Nest', blurb: 'A silk home with room for five very suspicious parcels', category: 'Bug',
    color: '#c1b6ce', kind: 'melee', r: 17, hp: 150, speed: 0, dmg: 0, range: 0, cd: 1, knock: 0, spacing: 60, draw: spiderNest, bug: 'nest', building: true, internal: true, prey: false, band: 23,
  },
]

const PUDDLE = [[24, 26, 15], [11, 27, 9], [37, 26, 9], [18, 19, 9], [31, 20, 10]]
const BUSH = [[24, 27, 13], [13, 30, 9], [35, 30, 9], [18, 18, 9.5], [30, 17, 10]]
export const BUSH_BASE = 16 // px from a bush stamp's centre down to where it meets the ground (depth sorting)

function bushShape(c: C, grow: number, fill: string, blobs = BUSH) {
  c.fillStyle = fill
  for (const [x, y, r] of blobs) {
    c.beginPath()
    c.arc(x, y, r + grow, 0, Math.PI * 2)
    c.fill()
  }
}

// A leafy bush in three tones like a little tree canopy: thin dark outline, shaded base, lit clumps
// nudged up-left, a few curved leaf-clump marks and a soft highlight. `v` jiggles the clumps so a
// hedge of them doesn't look copy-pasted.
function leafyBush(c: C, v: number) {
  const blobs = BUSH.map(([x, y, r], k) => [x + Math.sin(v * 3.1 + k * 1.7) * 2, y + Math.cos(v * 2.3 + k) * 1.5, r + Math.sin(v + k * 2.9)])
  c.fillStyle = 'rgba(34,31,51,.16)' // ground shadow
  c.beginPath()
  c.ellipse(24, 41, 18, 4, 0, 0, Math.PI * 2)
  c.fill()
  bushShape(c, 1.1, '#1f3b24', blobs)
  bushShape(c, 0, '#3e8b45', blobs)
  c.save()
  c.beginPath() // keep the lighter layers inside the outline
  for (const [x, y, r] of blobs) { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2) }
  c.clip()
  c.fillStyle = '#5daa52'
  for (const [x, y, r] of blobs) { c.beginPath(); c.arc(x - 1, y - 2.2, r * 0.82, 0, Math.PI * 2); c.fill() }
  c.fillStyle = '#7cc266'
  for (const [x, y, r] of blobs) { c.beginPath(); c.arc(x - 2, y - 4, r * 0.48, 0, Math.PI * 2); c.fill() }
  c.strokeStyle = '#3a8441'
  c.lineWidth = 1
  c.lineCap = 'round'
  for (const [x, y, r] of blobs) { c.beginPath(); c.arc(x, y + r * 0.15, r * 0.55, Math.PI * 0.15, Math.PI * 0.85); c.stroke() }
  c.fillStyle = 'rgba(255,255,255,.18)' // speckle
  for (let k = 0; k < 14; k++) { c.beginPath(); c.arc(10 + ((k * 37 + v * 11) % 28), 12 + ((k * 23 + v * 7) % 24), 0.7, 0, Math.PI * 2); c.fill() }
  c.restore()
  dot(c, blobs[3][0] - 3, blobs[3][1] - 4, 2.2, 'rgba(255,255,255,.4)')
}

export interface Sprites {
  unit: HTMLCanvasElement[]
  dead: HTMLCanvasElement[]
  deadAlt: (HTMLCanvasElement | undefined)[]
  deadStack: (HTMLCanvasElement[] | undefined)[]
  deadChick: HTMLCanvasElement
  xray: HTMLCanvasElement[] // white doodle bones clipped to each fighter's dark silhouette
  char: (HTMLCanvasElement | undefined)[] // a scorched silhouette, faded in over a grudge-holder as it gets angrier
  egg: HTMLCanvasElement // phoenix between lives
  chick: HTMLCanvasElement
  fly: (HTMLCanvasElement[] | undefined)[] // per unit type, for the ones that fly: body (no ground shadow, it hovers) and wing
  snake: HTMLCanvasElement[] // head, crown (the renderer draws the body)
  rex: HTMLCanvasElement[] // T-rex in pieces: body, jaw, arm
  splat: HTMLCanvasElement[]
  flame: HTMLCanvasElement
  bush: HTMLCanvasElement[] // variants; drawn centred on the stamp, base at BUSH_BASE below it
  bushIcon: HTMLCanvasElement
  puddleIcon: HTMLCanvasElement
  note: HTMLCanvasElement // the ballad
  bolt: HTMLCanvasElement // the death metal
  heart: HTMLCanvasElement // floats over a charmed fan
  alt: (HTMLCanvasElement | undefined)[] // per unit type: its second look, if it has one
  stack: (HTMLCanvasElement[] | undefined)[] // per unit type: one sprite per pancake count
}

const SS = 3 // supersample so sprites stay crisp on hi-dpi screens

function canvas48(paint: (c: C) => void) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 48 * SS
  const c = cv.getContext('2d')!
  c.scale(SS, SS)
  paint(c)
  return cv
}

const inked = (paint: (c: C) => void) =>
  canvas48((c) => {
    c.strokeStyle = INK
    c.lineWidth = 2.6
    c.lineJoin = c.lineCap = 'round'
    paint(c)
  })

function unitSprite(draw: (c: C) => void, shadow = true, dead = false) {
  return canvas48((c) => {
    c.fillStyle = 'rgba(34,31,51,.16)' // ground shadow
    c.beginPath()
    c.ellipse(24, 44, 10, 3, 0, 0, Math.PI * 2)
    if (shadow) c.fill()
    c.strokeStyle = INK
    c.lineWidth = 2.2
    c.lineJoin = c.lineCap = 'round'
    c.save()
    if (dead) deadEyes.add(c)
    draw(c)
    if (dead) deadEyes.delete(c)
    c.restore()
  })
}

export function buildSprites(): Sprites {
  return {
    dead: UNITS.map((u) => unitSprite(u.draw, false, true)),
    deadAlt: UNITS.map((u) => u.alt ? unitSprite(u.alt, false, true) : undefined),
    deadStack: UNITS.map((u) => u.stack?.map((draw) => unitSprite(draw, false, true))),
    deadChick: unitSprite(chick, false, true),
    xray: UNITS.map((u) => {
      const cv = unitSprite(u.draw, false), c = cv.getContext('2d')!
      c.globalCompositeOperation = 'source-in'
      c.fillStyle = '#302e49'
      c.fillRect(0, 0, 48, 48)
      c.globalCompositeOperation = 'source-atop'
      c.strokeStyle = '#f5fbff'
      c.fillStyle = '#f5fbff'
      c.lineWidth = 1.6
      const animal = u.category === 'Animals' || u.category === 'Mythical' || u.category === 'Bug' || u.projectile === 'water'
      if (animal) {
        line(c, 10, 30, 30, 30, 33, 20)
        for (const xx of [15, 21, 27]) {
          line(c, xx, 26, xx + 1, 34)
          line(c, xx, 31, xx - 1, 40)
        }
      } else {
        line(c, 24, 19, 24, 35, 19, 42)
        line(c, 24, 35, 29, 42)
        line(c, 16, 29, 24, 23, 34, 29)
        for (const yy of [25, 29, 33]) line(c, 20, yy, 28, yy)
      }
      ellipse(c, animal ? 33 : 24, animal ? 20 : 16, 4, 4, '#f5fbff')
      dot(c, animal ? 34 : 26, animal ? 19 : 15, 1, '#302e49')
      c.globalCompositeOperation = 'source-over'
      return cv
    }),
    char: UNITS.map((u) => {
      if (!u.grudge) return undefined
      const cv = unitSprite(u.draw, false), c = cv.getContext('2d')!
      c.globalCompositeOperation = 'source-in'
      c.fillStyle = '#3a2414'
      c.fillRect(0, 0, 48, 48)
      return cv
    }),
    egg: unitSprite(phoenixEgg),
    chick: unitSprite(chick),
    fly: UNITS.map((u) => u.flies?.map((d) => unitSprite(d, false))),
    snake: [unitSprite(snakeHead, false), unitSprite(snakeCrown, false)],
    rex: [unitSprite(rexBody), unitSprite(rexJaw, false), unitSprite(rexArm, false)],
    bush: [0, 1, 2].map((v) => canvas48((c) => leafyBush(c, v))),
    bushIcon: canvas48((c) => leafyBush(c, 0)),
    alt: UNITS.map((u) => u.alt && unitSprite(u.alt)),
    stack: UNITS.map((u) => u.stack?.map((d) => unitSprite(d))),
    puddleIcon: canvas48((c) => { // same look as the pond on the page (water.ts): teal shore, pale shallows, deep middle
      bushShape(c, 0.8, '#72c3cf', PUDDLE)
      bushShape(c, 0, '#9fe4eb', PUDDLE)
      c.beginPath()
      c.ellipse(24, 25, 13, 8, -0.1, 0, Math.PI * 2)
      c.fillStyle = '#66b9e6'
      c.fill()
    }),
    note: inked((c) => {
      line(c, 29, 30, 29, 9, 38, 14)
      ellipse(c, 23, 31, 6.5, 5, '#ff8fb1')
    }),
    bolt: inked((c) => poly(c, '#b6ff3c', 28, 4, 12, 26, 22, 26, 18, 44, 36, 20, 26, 20)),
    heart: inked((c) => {
      c.beginPath()
      c.moveTo(24, 39)
      c.bezierCurveTo(2, 24, 12, 6, 24, 17)
      c.bezierCurveTo(36, 6, 46, 24, 24, 39)
      c.fillStyle = '#ff5d8f'
      c.fill()
      c.stroke()
    }),
    flame: canvas48((c) => {
      c.strokeStyle = INK
      c.lineWidth = 2.2
      c.lineJoin = 'round'
      c.beginPath()
      c.moveTo(24, 5)
      c.bezierCurveTo(28, 14, 38, 20, 36, 31)
      c.bezierCurveTo(35, 39, 29, 43, 24, 43)
      c.bezierCurveTo(16, 43, 11, 37, 12, 30)
      c.bezierCurveTo(12, 23, 19, 20, 18, 13)
      c.quadraticCurveTo(22, 12, 24, 5)
      c.fillStyle = '#ff8a1f'
      c.fill()
      c.stroke()
      c.beginPath()
      c.moveTo(24, 22)
      c.bezierCurveTo(29, 27, 31, 32, 28, 37)
      c.bezierCurveTo(26, 41, 21, 41, 19, 37)
      c.bezierCurveTo(17, 31, 22, 28, 24, 22)
      c.fillStyle = '#ffe45c'
      c.fill()
    }),
    unit: UNITS.map((u) => unitSprite(u.draw)),
    splat: UNITS.map((u) =>
      canvas48((c) => {
        c.fillStyle = u.color
        for (let k = 0; k < 9; k++) {
          const a = k * 2.4, d = k === 0 ? 0 : 7 + ((k * 5) % 9)
          c.beginPath()
          c.arc(24 + Math.cos(a) * d, 24 + Math.sin(a) * d, k === 0 ? 9 : 2 + ((k * 3) % 4), 0, Math.PI * 2)
          c.fill()
        }
      }),
    ),
  }
}

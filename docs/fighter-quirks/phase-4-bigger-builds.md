# Phase 4: bigger builds

Six fighters that need a new drawing, a new kind of ground object or a new effect buffer. Phases 1–3
must be merged first. Read [README.md](README.md) first.

- [x] Groundwork: `alt` sprite, syrup terrain (kind 2)
- [x] Sandal Dad: one sandal
- [x] Flapjack: short stack
- [x] Cheesed: cheese tether
- [x] Spike: curls up and rolls
- [x] Stinky: stink cloud
- [x] Unpaid Intern: promotion
- [x] Wrap-up (README checklist), then stop and ask the owner

**Status (2026-11-14):** implemented, with one check scene per fighter in `checks/sim.check.ts` (the
cheese scene replaces the old one in place; the rest are at the end). **Nothing has been run**, and
neither have phases 1–3. Differences from the text below:

- Pancakes come off in the think loop, not in `damage()`, so burns and stink (which lower hp
  directly) knock pancakes off too.
- The cloud is placed halfway to the target, not behind the skunk, so the victim starts inside it.
- A dad only throws if the projectile pool has room, so a full pool can't strand him waiting forever.
- Blurbs avoid apostrophes ("he is management", "Does not blow up").
- The new drawings (barefoot dad, manager, hedgehog ball, pancake stacks) were drawn from coordinates
  only. Check them at 30px.

---

## Groundwork

### `alt`: a second look

Sandal Dad (empty-handed), Spike (curled into a ball) and the Unpaid Intern (promoted) each need a
second sprite.

- Field: `alt?: (c: CanvasRenderingContext2D) => void // a second look the renderer swaps in while its quirk says so`
- `Sprites.alt: (HTMLCanvasElement | undefined)[]`, built in `buildSprites()` as
  `UNITS.map((u) => u.alt && unitSprite(u.alt))`.
- In `render.ts`, extend `spriteOf(j)`: if `sprites.alt[t]` exists and `this fighter's quirk is active`
  (dad: `away[j] > 0`, spike: `rollT[j] > 0`, intern: promoted), use it. Keep that condition in one
  small helper next to `spriteOf`, e.g. `const altOn = (j) => ...`.
- The `xray` sprites stay built from `draw`. A stunned dad or curled Spike shows normal bones. Fine.

### Syrup terrain (kind 2)

Flapjack drops syrup spots. Terrain kinds are bits in `bmask`, and `stampBush()` already does
`1 << bT[b]`, so kind 2 sets bit 4 without changes.

- Add `inSyrup(x, y) { return (this.mask(x, y) & 4) === 4 }`.
- `water.ts` only reads `& 2` (verified 2026-11-14), so syrup doesn't become pond. Re-check before
  relying on it.
- `addTerrain(x, y, 2)` doesn't bump `waterVer` (phase 1 bumps it only for kind 1).
- Renderer: when rebuilding the sorted bush list on `terrainVer` change, also collect syrup stamps
  into `syrups`. Draw them after water and before fighters: an unoutlined `#8a4b1c` blob at alpha 0.55
  (three or four overlapping ellipses, like the `PUDDLE` blob layout), plus one small outlined pancake
  disc (`#e2a95a`, 7×2.6) lying on it.
- Slowing: in `step()`'s first loop (where `hidden` is computed), for non-fliers that aren't a
  `stack` fighter: `if (this.inSyrup(x[i], y[i])) slowT[i] = Math.max(slowT[i], 0.25)`. The existing
  sticky-footing smudge shows it.

---

## Sandal Dad: one sandal

**Joke:** one sandal, terrifying aim, then a long awkward hop to go and pick it up. If it misses, it
flies on and he has further to hop.

**Now:** ranged with big knockback (`knock 420, cd 1.3`).

**Data**
- New field: `fetch?: boolean // throws its only projectile and must pick it up from where it lands before throwing again`
- Dad: `fetch: true`, `alt: dadBarefoot`, `cd 1.3 → 0.6` (fetching is now the limit).
- New drawing `dadBarefoot` in `units.ts`: `dad()` without the sandal, the throwing arm lowered and a
  bare foot. Refactor `dad()` into shared pieces rather than copying it.
- Blurb: `One sandal, terrifying aim. Then a long, awkward hop to go get it`

**Sim**
- New state: `away = new Uint8Array(MAX) // 0 in hand, 1 in the air, 2 on the floor at (itemX, itemY)`,
  `itemX = f32(MAX)`, `itemY = f32(MAX)`. Reset `away` in `spawn()`.
- In `attack()`, before firing: `if (def.fetch) { if (this.away[i]) return; this.away[i] = 1 }`.
- Projectile loop, when a projectile dies (hit, expired or off the page): if `UNITS[pType[p]].fetch`
  and `const o = this.owner(p)` is `>= 0` and `away[o] === 1`, then `away[o] = 2`, and
  `itemX/itemY = pX/pY` clamped 8px inside the page. If the owner is gone, the sandal is simply lost
  with him.
- Steering, when `away[i]`:
  - `1`: stand still facing the projectile (`dvx = dvy = 0`). It's in the air for a fraction of a
    second.
  - `2`: ignore enemies and head for `(itemX, itemY)` at `speed * 0.8`. Within `r + 8`, set
    `away[i] = 0` and `hitT[i] = 1` (picked up).
  - Put this before the normal target branch, but after the fear and lure handling so a scared or
    charmed dad still behaves like everyone else.

**Render**
- Sandal on the floor: for each alive dad with `away === 2`, draw the sandal (`#ff8fb1` ellipse
  5.5×2.6, ink outline 1.2, rotated about -0.3) at `(itemX, itemY)` in the ground pass with the syrup.
  `sim.n` is small enough to scan.
- Dad uses `alt` while `away > 0`. Hop while `away === 2`: an extra bob
  `Math.abs(Math.sin(phase * 2)) * 4`.

**Edge cases**
- A scared or lured dad with the sandal on the floor keeps `away = 2`, so after the fear passes he
  goes back for it.
- A dad thrown far from his sandal hops all the way back. That's the joke.

**Check:** dad at (100, 300), Bed Rot at (220, 300). Set `cd[dad] = 0` and step once: assert
`away[dad] === 1`. Step up to 6 seconds and assert `away[dad]` passed through 2 and came back to 0.

**Owner looks for:** a barefoot dad hopping to his sandal after each throw.

---

## Flapjack: short stack

**Joke:** every big hit knocks a pancake off the stack. It lands as a sticky syrup spot, and Flapjack
gets shorter and faster.

**Now:** ranged syrup with the generic `slow: 2.5`.

**Data**
- New field: `stack?: ((c: CanvasRenderingContext2D) => void)[] // drawings from one pancake to full height; each lost share of hp knocks one off as a syrup spot, and it speeds up`
- Flapjack: `stack: [pancakeStack(1), pancakeStack(2), pancakeStack(3)]`, remove `slow`, `dmg 6 → 8`.
  Keep `draw: pancakeStack(3)` for the tray.
- New drawing: replace `pancake()` with `pancakeStack(n)`, which returns a draw function with `n`
  layers bottom-up at y 35, 30, 25. Syrup and butter go on the top layer, legs as today. **Put the face
  on the bottom pancake** so it survives every loss.
- `Sprites.stack: (HTMLCanvasElement[] | undefined)[]`, built like `fly`.
- Blurb: `Every big hit knocks a pancake off. Shorter, stickier, faster`

**Sim**
- New state: `layers = new Uint8Array(MAX)`. In `spawn()`, set it to `def.stack?.length ?? 0`.
- In `damage()`, after hp changes, if the fighter has `stack` and is alive:
  `const left = Math.max(1, Math.ceil(hp[j] / def.hp * n))`. While `left < layers[j]`: `layers[j]--`,
  `addTerrain(x[j] - face[j] * 14, y[j] + 4, 2)`, `hitT[j] = 1`.
- Speed: multiply by `1 + (n - layers[i]) * 0.35`.
- The syrup slow (groundwork) skips `stack` fighters, so Flapjacks walk through their own syrup.

**Render:** use `sprites.stack[t][layers[i] - 1]` for the body.

**Check:** a lone Flapjack, `hp = def.hp * 0.67`, `burnT = 1`. Step 20 ticks. Assert `layers === 2`,
some stamp has `bT === 2`, and `inSyrup` is true near the Flapjack.

**Owner looks for:** Flapjack getting shorter with a pancake left in a syrup spot each time.

---

## Cheesed: cheese tether

**Joke:** a hit ties the victim to the pizza with a stretchy cheese strand. It can't wander off, it
gets drained through the strand, and if it's yanked too far the strand snaps and both bounce.

**Now:** `lifesteal: 0.65, slow: 0.8`. Its strand is only drawn while it attacks, via
`def.key === 'pizza'`.

**Data**
- New field: `tether?: number // a hit ties the victim with a strand for this many seconds: it can't get away and is drained`
- Pizza: remove `lifesteal` and `slow`, `tether: 2.5`. New exported constants:
  `export const TETHER_LEN = 70`, `const SNAP = 1.8, DRAIN = 3, DRAIN_EVERY = 30`.
- Blurb: `Ties you up in cheese and slurps your health through it`

**Sim**
- New state: `tetherT = f32(MAX)`. Reset in `spawn()`. The victim is stored in `focus` via `lockOn()`.
  Don't add it to `stopMoves()`: a stunned pizza keeps hold of its strand.
- In `attack()`, melee branch: `if (def.tether && this.alive[t] && this.heldBy[t] < 0 && this.airT[t] <= 0) { this.lockOn(i, t); this.tetherT[i] = def.tether }`.
- In `step()` (think loop): if `tetherT[i] > 0`, count it down. End it if
  `!focusAlive(i) || airT[v] > 0`. Every `DRAIN_EVERY` ticks:
  `damage(v, DRAIN, 0, 0); hp[i] = Math.min(maxHp(i), hp[i] + DRAIN)`.
- Constraint, after the separation loop (next to the jaw loop): for a tethered pair at distance `d`:
  - `d > TETHER_LEN * SNAP` (thrown, flung, carried off): snap. `tetherT[i] = 0`; give each fighter
    160 px/s of velocity toward the other; `hitT` on both.
  - `d > TETHER_LEN`: pull the victim back onto the circle, `x[v] = x[i] + dx / d * TETHER_LEN` (same
    for y).
  - The `clamp()` after it keeps water-bound victims wet.

**Render**
- Replace the `def.key === 'pizza'` strand with one drawn while `tetherT > 0`: from the pizza
  (`x, y - 18`) to the victim (`x[v], y[v] - 15`) as a quadratic curve. Sag
  `Math.max(2, (TETHER_LEN - d) * 0.3)` (droopy when slack, straight when taut). Line width from 2.5
  down to 1.2 as `d → TETHER_LEN`. Colour `#ffd775`.
- The jellyfish's zap line in the same block keeps using `def.shock`.

**Replaces an existing check:** the `cheese` scene asserts health stolen per hit plus `slowT`. Rewrite
it: pizza at (300, 300), toast at (325, 300), `cd[pizza] = 0`, toast `cd = 100`, `hp[pizza] = 40`.
Step until `tetherT > 0`. Then set `x[toast] = 420` (100px away), step once, and assert the distance
is ≤ `TETHER_LEN + 1`. Step `DRAIN_EVERY` ticks and assert `hp[pizza] > 40`.

**Owner looks for:** a cheese string sagging and tightening as the victim tries to leave; the snap.

---

## Spike: curls up and rolls

**Joke:** when things look bad (hurt, outnumbered or facing something huge), Spike curls into a spiky
ball and bowls through the crowd, bouncing off the page edges. Thorns still prick anyone who hits him.

**Now:** `thorns: 8, hides: true`. Thorns stays: it's his alone now that Squish Issue lost it.

**Data**
- New field: `roll?: number // when cornered, curls up and rolls through enemies at this speed`
- Hedgehog: `roll: 260`, `alt: hedgehogBall`. New constants: `const ROLL_T = 1.4, ROLL_CD = 5`.
- New drawing `hedgehogBall`: a round body (`#6b4a2f`) with a ring of short spikes. A hint of face is
  optional. It must read as a ball at 30px.
- Blurb: `Prick him and get pricked. Corner him and he goes full bowling ball`

**Sim**
- New state: `rollT = f32(MAX)`. Reset in `spawn()`. Add it to `stopMoves()`.
- Trigger, in the abilities block (next to `leap`/`dash`, which already requires no fear, no lure and
  `abilityCd <= 0`): `if (def.roll && this.dangerous(i, t, d))` → `rollT[i] = ROLL_T`,
  `abilityCd[i] = ROLL_CD`, `vx/vy = dx / d * def.roll`, `continue`. `dangerous()` is the ninja's
  existing "hurt, outnumbered or facing something much bigger" test.
- Rolling block (near the dash block): count `rollT` down. Bounce off the edges: if the next position
  would leave `[r, w - r]` horizontally, flip `vx`; same for `vy`. Every 6 ticks,
  `this.sweep(i, def.r + 6)`, which hits enemies with Spike's dmg and knockback, enemy-only. Keep the
  velocity (no easing), `phase += DT * 30`, `continue`. On the last tick, `vx/vy *= 0.3`.

**Render**
- While `rollT > 0`: use the `alt` ball, `rot = tick * 0.5 * face` (spinning), no walk bob. Add
  `rollT > 0` to the speed-line condition.

**Edge cases**
- A water-bound fighter can't be rolled into dry land; normal `clamp()`/`keepWet()` apply.
- A held, thrown or stunned Spike stops rolling via `stopMoves()`.

**Check:** Spike at (300, 300) with `hp = def.hp * 0.3`, three toasts around him within 60px, all with
`cd = 100`. Step up to 1 second. Assert `rollT > 0` at some point, and at least one toast lost hp.

**Owner looks for:** a spiky ball zipping through a crowd and bouncing off the page edge.

---

## Stinky: stink cloud

**Joke:** Stinky doesn't blow himself up any more. He turns his back, sprays, and leaves a green cloud
that nobody can stand to be in. Enemies get pushed out of it while it eats away at them, and Stinky
keeps fighting.

**Now:** `kind: 'boom'` with `slow: 4`, which overlaps Kaboom Pickle.

**Data**
- New field: `stink?: number // sprays a cloud this many px wide that enemies are pushed out of and hurt by; recharges`
- Skunk: `kind: 'boom' → 'melee'`, `hp 40 → 70`, `dmg 15 → 6`, `range 75 → 3`, `cd 0 → 0.7`,
  `knock 120 → 20`, remove `slow`, `stink: 60`. Keep `hides`. New constants:
  `const MAXK = 48, STINK_T = 4, STINK_CD = 6, STINK_DPS = 4, STINK_PUSH = 20`.
- Blurb: `Doesn't blow up any more. Just makes the area unlivable`

**Sim**
- Cloud ring buffer (copy the `rX/rY/rLife/rHead` pattern): `kX, kY, kLife = f32(MAXK)`,
  `kType = new Uint8Array(MAXK)`, `private kHead = 0`. Clear `kLife` in `clear()`. Decay
  `kLife -= DT / STINK_T` in the effect-decay lines at the end of `step()`.
- Spray, in the abilities block: `if (def.stink && d < def.stink)` → add a cloud at
  `(x[i] - face[i] * 8, y[i])`, `kType = ty`, `abilityCd = STINK_CD`, `atkT = 1`, turn its back
  (`face = -face`), `continue`.
- Effect: in the think loop, for every alive fighter that isn't airborne, loop over the clouds with
  `kLife > 0`. For each cloud whose `kType !== type[i]` and whose centre is within
  `UNITS[kType].stink` of this fighter:
  `slowT = max(slowT, 0.3)`, `hp -= STINK_DPS * DT` (kill check as in the burn block), and push it
  out: `vx += dx / d * STINK_PUSH`, `vy += dy / d * STINK_PUSH`. Steering eases toward the wanted
  velocity at 0.13 per tick, so the push settles at about 150 px/s outward, faster than anyone walks
  in.
- Add `// shortcut: every fighter checks every live cloud (≤ 48), stamp clouds into a coarse mask if crowds of skunks stutter`.

**Render**
- After the fighters and before the flames: for each live cloud, four overlapping unoutlined circles
  in `rgba(150,190,80,…)`. Each wobbles (`Math.sin(tick * 0.05 + k)`) and the circles spread slightly
  as the cloud ages, with alpha `0.3 * Math.min(1, kLife * 3)`. Add three short wavy stink lines
  rising from it (`#7a9a3a`, line width 1).

**Edge cases**
- Hidden fighters inside a cloud still get pushed. The stink finds you in the bush.
- Fliers aren't exempt: everyone can smell.

**Check:** skunk at (300, 300), toast at (330, 300), toast `cd = 100`, skunk `abilityCd = 0`. Step
until a cloud is live. Record the toast's hp and distance from the cloud, step 40 ticks, and assert it
lost hp and is further from the cloud centre.

**Owner looks for:** green clouds that fighters shuffle out of while the skunk keeps fighting.

---

## Unpaid Intern: promotion

**Joke:** two kills and the intern is promoted. He puts down the stapler, picks up a coffee and a
clipboard, stops working, and stands behind the other interns, who now fire twice as fast with a
sweat drop. With nobody left to manage, he goes back to work.

**Now:** plain ranged staples.

**Data**
- New field: `promote?: number // after this many kills it stops fighting and makes its own kind nearby attack twice as fast`
- Intern: `promote: 2`, `alt: internManager`. New constant: `const BOSS_R = 90`.
- New drawing `internManager`: `intern()`'s body and tie (he already wears one), the stapler replaced
  by a coffee mug and a clipboard, and smug half-lidded eyes instead of the tired ones. Refactor
  `intern()` into shared pieces.
- Blurb: `Two kills and he's management. Now the other interns do twice the work`

**Sim**
- Kill counting uses `grow` (see phase 2). In `hit()`, after `damage()`:
  `if (this.died && by >= 0 && UNITS[this.type[by]].promote) this.grow[by]++`. Phase 2's `by` gives
  the projectile's owner.
- Promoted: `def.promote && grow[i] >= def.promote`.
- New state: `bossTick = new Int32Array(MAX).fill(-1) // tick a manager last hurried this one`. Make it
  public; the renderer reads it.
- A promoted fighter, in the think loop: scan the 3×3 grid cells around it for its own type within
  `BOSS_R` that aren't promoted. For each, if `bossTick[j] !== tick`, do `cd[j] -= DT` (an extra
  tick, so twice as fast) and set `bossTick[j] = tick`. That caps the boost at 2× however many
  managers crowd round.
- If it found at least one subordinate: no attacking. Move to about 40px behind the nearest
  subordinate (away from the enemy) at walking speed, or stand still when already there. If it found
  none, it fights normally.

**Render**
- `alt` sprite while promoted.
- Hurried interns: draw the existing blue sweat drop (from the `fearT` branch) when
  `bossTick[i] >= tick - 1`. Extend that condition rather than copying the drawing.

**Edge cases**
- A promoted intern that's hit still takes damage. Managers have no special defence.
- Kills by Nana's throw landing (`land()` passes no attacker) don't count. Fine.

**Check:** set `UNITS[intern].promote = 1` for the check (restore it afterwards). Intern A at
(100, 300), goose at (200, 300) with `hp = 1`, intern B at (100, 340). Step until the goose dies.
Assert `grow[A] >= 1`. Step once more and assert `bossTick[B] === tick - 1` (A hurried B on the
last tick). Checking `cd` directly is unreliable because B's own attacks reset it.

**Owner looks for:** an intern with a coffee mug loitering behind sweating interns.

---

## Existing checks this phase affects

- `cheese` (pizza): rewrite as above.
- Anything asserting the skunk explodes (`counts` drop after it goes off) or a stink `slowT`: re-read
  and replace. None found as of 2026-11-14.
- The first battle scene doesn't use these fighters.

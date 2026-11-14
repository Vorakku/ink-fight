# Phase 2: timers and states

Six fighters that each need one new per-fighter timer or counter and a matching visual. Phase 1 must be
merged first (this phase uses `shoot()`). Read [README.md](README.md) first.

- [x] Groundwork: projectile owner, `by` on `hit()`
- [x] Sir Toast: holds a grudge
- [x] Mozzie: drinks until it pops
- [x] Gym Bro: skipped leg day
- [x] Spit Llama: spat on
- [x] Boba Menace: pearls on a string
- [x] Depresso: caffeine crash
- [x] Wrap-up (README checklist), then stop and ask the owner

**Status (2026-11-14):** implemented, with one check scene per fighter at the end of
`checks/sim.check.ts`. **Nothing has been run** (phase 1 hasn't been run either): no check, build,
type check, lint or browser look. Differences from the text below:

- The walking-speed changes (grudge, full belly, caffeine, blindness) live in one `pace(i)` helper.
- Gym Bro's blurb is `Hits like a truck. Skipped leg day, so one good shove turns him turtle`.
- Lying down is drawn as a rotation of -1.6 (toppled, on its back) or +1.45 (asleep, face first)
  with the sprite lifted 8px. Those numbers were chosen without looking; adjust them by eye.
- Depresso's sleep bubbles are drawn unrotated so they rise straight up from a tipped-over cup.
- Gym Bro's optional kicking legs were skipped.
- Boba's pull (160) is above Gym Bro's topple threshold (150), so a pearl tips him over. Kept: it
  fits the joke.

---

## Groundwork

### Projectile owner

Sir Toast (this phase), Boba (this phase), Sandal Dad and Unpaid Intern (phase 4) need to know who
fired a projectile.

- Add `pFrom = new Int32Array(MAXP) // slot that fired it` and
  `pGen = new Uint32Array(MAXP) // that slot's generation when it fired`.
- Set both in `shoot()`.
- In the projectile loop's swap-remove (`const l = --this.pn` ...), copy `pFrom` and `pGen` with the
  other fields. **Forgetting this gives projectiles the wrong owner.**
- Add `private owner(p: number)`: return `pFrom[p]` if that slot is alive, its generation equals
  `pGen[p]` and its type equals `pType[p]`; otherwise `-1`.

### `by` on `hit()`

`hit(j, def, kx, ky, from, mult)` uses `from` for thorns and eating. Both should only happen when the
attacker is touching the victim, which is why ranged and area hits pass `-1`. Grudges (and phase 4's
kill counting) need the attacker even at range, so add a separate argument:

- `private hit(j, def, kx, ky, from, mult = 1, by = from)` with the comment
  `// by: who gets the credit or the blame (also at range); from: who is touching it (thorns, eating)`.
- Projectile loop: pass `by = this.owner(p)`. `breathe()`, the `beam` attack and the siren's metal in
  `sing()`: pass `by = i`. `explode()` and `land()`: leave `-1` (the attacker is dead or the hit was
  a landing).

---

## Sir Toast: holds a grudge

**Joke:** "deeply offended". He locks onto the first fighter that hurts him and chases only them,
walking past everyone else. Each further hit from that fighter toasts him darker and makes him faster
and meaner. When the grudge target dies, he cools down.

**Now:** a plain tank (`hp 140, speed 55, dmg 14`).

**Data**
- New field: `grudge?: number // chases only the first fighter that hurts it; each further hit from them adds this much speed and damage (up to GRUDGE_MAX hits)`
- Toast: `grudge: 0.15`. New constant: `const GRUDGE_MAX = 5`.
- Blurb: `Remembers who hit him first. Gets toastier and faster every time they do it again`

**Sim**
- Store the grudge target with the existing `focus`/`focusGen` via `lockOn()`/`focusAlive()`. Store
  the stack count in `grow` (currently snake meals). Update both comments: `focus` is also "the grudge
  target", and `grow` is "snake meals, mozzie sips, toast grudge hits, intern kills". Add a comment on
  the field: `grudge` must not be combined with `leap`, `dash`, `latch` or `tether` on one fighter,
  because they also use `focus`.
- In `hit()`, before damage: if `UNITS[type[j]].grudge && by >= 0 && by !== j`:
  - if `!this.focusAlive(j)`: `this.lockOn(j, by); this.grow[j] = 1`
  - else if `this.focus[j] === by`: `this.grow[j] = Math.min(GRUDGE_MAX, this.grow[j] + 1)`
- In `step()`, at the retarget line (`let t = target[i]; if (...) t = target[i] = this.findTarget(i)`),
  add afterwards: `if (def.grudge && this.focusAlive(i)) t = target[i] = this.focus[i]`. He chases a
  hidden grudge target too, because he knows you're in that bush.
- When `def.grudge && grow[i] > 0 && !this.focusAlive(i)`: `grow[i] = 0; hitT[i] = 1` (cools off).
- Speed: in the `speed` line multiply by `(def.grudge ? 1 + def.grudge * this.grow[i] : 1)`.
  Damage: in `attack()` multiply `mult` by the same factor.
- `maxHp()` only uses `grow` when `def.eats`, so toast's hp is unaffected. Don't change that.

**Render**
- Toasting: add `char: (HTMLCanvasElement | undefined)[]` to `Sprites`, built only for fighters with
  `grudge`: a `unitSprite(u.draw, false)` filled with `#3a2414` using `source-atop` (the same trick as
  `xray`, without the bones). In the fighter loop, right after the body is drawn, draw it with
  `globalAlpha = grow[i] / GRUDGE_MAX * 0.55`, then reset alpha.
- Steam at 3+ stacks: two small grey (`#b9a69e`) puffs rising and fading above the head. Copy the
  regen sleep-bubble loop's motion and use filled circles.
- The renderer sizes fighters by `grow` only when `eats`. Keep it that way so toast doesn't grow.

**Edge cases**
- A projectile whose shooter died gives `by = -1`, so no grudge forms. Fine.
- An Eggbert's hatchling reuses the dead egg's slot with a new generation, so a grudge against the egg
  doesn't carry over to the goose.

**Check:** toast at (300, 300), intern at (480, 300) (in staple range). Step until `grow[toast] > 0`.
Then spawn a goose at (320, 300) and step 30 more ticks. Assert `target[toast] === intern`.
Kill the intern (`hp = 0` plus a burn tick, or `clear()` a fresh scene) and assert `grow` returns to 0.

**Owner looks for:** a toast walking past a goose pecking it to get at the intern, getting browner
and steaming.

---

## Mozzie: drinks until it pops

**Joke:** every bite swells it up, red and round and slower, until it pops in a small red splat that
splashes the fighters around it.

**Now:** `lifesteal: 1`, shared with Gym Bro and Cheesed (both lose it in this and later phases).

**Data**
- New field: `swell?: number // each bite makes it bigger and slower; at this many bites it pops`
- Mozzie: `swell: 6`, keep `lifesteal: 1`. New constants: `const POP_R = 26, POP_MULT = 3`.
- Blurb: `Drinks your health, sip by sip, until it pops`

**Sim**
- In `attack()`, melee branch, after the `lifesteal` line:
  `if (def.swell && this.alive[i] && ++this.grow[i] >= def.swell) return this.pop(i)`
- `private pop(i)`: `this.sweep(i, POP_R, POP_MULT)`, then `if (this.alive[i]) { this.splat(x, y, type, 1.6); this.kill(i) }`.
  **The `alive` check matters:** `sweep()` can hit a Spike, and thorns can kill the mozzie
  mid-sweep. Calling `kill()` on a dead slot frees it twice.
- Speed: multiply by `(def.swell ? 1 - this.grow[i] * 0.08 : 1)`.

**Render**
- Size: extend the `size` expression so `swell` fighters use `1 + meals * 0.12` like `eats` does.
- Full belly: after the body, draw an unoutlined `rgba(192,57,43,…)` ellipse over the abdomen (sprite
  `(21, 26)`, so local `(-3, -18)`), radius growing with `grow`, alpha `0.2 + grow * 0.08`.
- A little wobble when it's nearly full: `rot += Math.sin(tick * 0.5 + i) * 0.08 * grow / swell`.

**Edge cases**
- Lifesteal still heals it, so a swollen mozzie is tanky but slow. That's the trade-off.

**Check:** mozzie next to a toast with `grow[mozzie] = 5`, `cd[mozzie] = 0`. Step until the bite
lands (up to 10 ticks). Assert `alive[mozzie] === 0` and the toast lost more than one plain bite's
damage.

**Owner looks for:** mozzies getting visibly fatter and redder, then popping.

---

## Gym Bro: skipped leg day

**Joke:** huge punches, tiny legs. One good shove and he's on his back, flailing like a turtle.

**Now:** `lifesteal: 0.5` (the generic one).

**Data**
- New field: `topple?: number // knockback at least this strong puts it on its back for TOPPLE_T seconds`
- Gym Bro: remove `lifesteal`; `dmg 18 → 26`, `knock 140 → 220`, `cd 0.8 → 1.0`; `topple: 150`.
  New constant: `const TOPPLE_T = 1.2`.
- Blurb: `Hits like a truck. Skipped leg day, so one good shove and he's a turtle`

**Sim**
- New state: `downT = f32(MAX) // seconds left on its back`. Reset in `spawn()`.
- In `damage()` (where all knockback goes, including phase 3's squish), after applying velocity:
  `const tp = UNITS[this.type[j]].topple; if (tp && this.alive[j] && kx * kx + ky * ky >= tp * tp) this.downT[j] = TOPPLE_T`
- In `step()`, right after the `shockT` block, copy its shape: count down, `endScrap`, zero
  `leapT/dashT/spinT`, damp velocity `*= 0.8`, `continue`.
- A Nana throw: her `hit()` knockback (520) topples him, then `toss()` throws him. The air block runs
  before the `downT` block, so he flies, lands, then lies there. Good.

**Render**
- While `downT > 0`: add `face * (1.9 + Math.sin(tick * 0.9 + i) * 0.15)` to `rot` (on his back,
  rocking) and lower `y` by about 5px so he lies on the ground. Skip the walk bob.
- Optional: two short kicking-leg strokes. Only if they read at 30px.

**Edge cases:** being knocked down doesn't stop damage; he's just helpless.

**Check:** Nana next to a Gym Bro, `cd[nana] = 0`. Step up to 3 seconds. Assert `downT[gymbro] > 0`
was seen at some point after he landed.

**Owner looks for:** Gym Bro flipped over and rocking after a big hit.

---

## Spit Llama: spat on

**Joke:** a spit in the eye from across the page, and the victim stumbles around blind with spit
dripping down its face.

**Now:** plain ranged.

**Data**
- New field: `blind?: number // hits leave the victim stumbling about blind for this many seconds`
- Llama: `blind: 1.3`. Keep its stats.
- Blurb: `Spits in your eye from across the page. Good luck finding anyone now`

**Sim**
- New state: `blindT = f32(MAX)`. Reset in `spawn()`.
- In `hit()`: `if (def.blind) this.blindT[j] = def.blind`.
- In `step()`, next to the `lured` block: if `blindT[i] > 0`, count it down, set `t = -1`,
  `target[i] = -1`, `endScrap`, and zero `leapT/dashT/spinT`. In the steering block, a blind fighter
  takes the "has a goal" path with a wander point
  `tx = x[i] + Math.cos(this.tick * 0.05 + i) * 40, tyy = y[i] + Math.sin(this.tick * 0.07 + i) * 40`
  at `speed * 0.5`. It walks in loose circles and never attacks.
- Other fighters can still target a blind one.

**Render**
- While `blindT > 0`: a light-blue (`#9fd3e8`, the spit colour) blob over the face, with a short drip
  under it and a thin ink outline (0.8). Heads differ, so start at local `(6, -30)` and adjust by eye.
  Alpha `Math.min(1, blindT * 3)`.
- Stumble: `rot += Math.sin(tick * 0.3 + i) * 0.15`.

**Check:** llama at (100, 300), toast at (280, 300). Step up to 3 seconds until `blindT[toast] > 0`,
then assert `target[toast] === -1` for the next few ticks.

**Owner looks for:** spat-on fighters wandering in circles with a blue drip on their face.

---

## Boba Menace: pearls on a string

**Joke:** the pearls are on a string. Each one that hits reels the victim in toward the cup, so Boba
pulls you close and sips.

**Now:** ranged with the generic `slow: 2`.

**Data**
- No new field. A negative `knock` already pulls: the projectile loop applies
  `(pVx / 420) * src.knock`, and a negative value points back at the shooter. Update the `knock`
  comment on `UnitDef` to: `// knockback impulse, px/s; negative pulls the victim toward the attacker`.
- Boba: `knock: 35 → -160`, remove `slow`.
- Blurb: `Pearls on a string. Reels you in for a closer sip`

**Sim:** nothing beyond the data. Read every use of `def.knock` (`hit`, `sweep`, `explode`, `sing`,
`breathe`, the projectile loop) to confirm none assumes it's positive. As of 2026-11-14 none does.

**Render**
- In the projectile loop, for `def.knock < 0`: before drawing the pearl, draw a thin (1px)
  tea-coloured (`#8a5a3c`, alpha 0.6) line from the owner's straw tip to the pearl. Use
  `this.owner(p)` (expose it, or make `pFrom`/`pGen` public and check in the renderer). The straw
  tip is sprite `(34, 4)` (local `(10, -40)`, mirrored by `face`). If the owner is gone, skip the line.

**Edge cases:** a pulled victim gets closer to Boba, which is ranged and squishy. It's a real
trade-off, and the funny one.

**Check:** Boba at (100, 300), Bed Rot (speed 0) at (280, 300). Step until Bed Rot's hp drops. Assert
`x[bedrot] < 280`.

**Owner looks for:** a string from cup to pearl; victims jerked toward Boba.

---

## Depresso: caffeine crash

**Joke:** a few seconds of pure jittery caffeine, double speed with rapid pokes, then it crashes and
naps wherever it is, tipped over with sleep bubbles.

**Now:** `charge: 65` (a copy of Pointy's charge).

**Data**
- New field: `crash?: number // wired for WIRED_T seconds, then asleep this long; repeat`
- Espresso: remove `charge`; `crash: 2`. New constant: `const WIRED_T = 3.5`.
- Blurb: `Three seconds of pure caffeine. Then a nap, wherever it is`

**Sim**
- New state: `moodT = f32(MAX) // crash: seconds left wired (> 0) or asleep (< 0)`. In `spawn()`, set
  `moodT[i] = def.crash ? WIRED_T * (0.5 + Math.random() * 0.5) : 0` so a crowd doesn't crash in sync.
- In `step()`, right after the `shockT` block, only when `def.crash`:
  - wired: `if ((moodT[i] -= DT) <= 0) moodT[i] = -def.crash`
  - asleep: `if ((moodT[i] += DT) >= 0) moodT[i] = WIRED_T`; meanwhile damp velocity `*= 0.75` and
    `continue`.
- Wired: multiply `speed` by 2, and in `attack()` multiply the `cd` reset by 0.5.

**Render**
- Wired: jitter `x += Math.sin(tick * 2.3 + i) * 1.2`, and reuse the speed-line branch (add
  `moodT > 0 && crash` to its condition).
- Asleep: tip over, `rot += face * 1.45`. Reuse the regen sleep bubbles by extending that condition to
  `(def.regen && atk === 0) || (def.crash && moodT[i] < 0)`.

**Edge cases:** being hit doesn't wake it. If the owner wants that, a hit while asleep would end the
nap early; skip it for now.

**Check:** lone espresso with `moodT = 0.05`. Step 10 ticks, assert `moodT < 0`. Record `x` and step
30 more ticks with a toast nearby, assert the espresso barely moved (under 2px).

**Owner looks for:** buzzing, double-speed espressos that suddenly keel over and sleep.

---

## Existing checks this phase affects

- **Toast is the dummy in most scenes.** With `grudge` it chases the first fighter that hits it
  instead of the nearest, which can change scenes that rely on where it walks. Re-read every scene
  that spawns a toast. Where the toast is just a punching bag, `cd[toast] = 100` already keeps it from
  attacking, but it still walks. If a scene breaks, swap the dummy for Bed Rot (speed 0) rather than
  weakening the grudge.
- No scene asserts Mozzie, Gym Bro, Llama, Boba's slow or Depresso's charge. Re-read to confirm.

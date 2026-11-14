# Phase 3: fighters affecting each other

Five fighters whose quirk spreads, sticks or bounces between fighters. Phases 1 and 2 must be merged
first. Read [README.md](README.md) first.

- [x] Groundwork: `stopMoves(i)`, `touch(i, j)`
- [x] Señor Chili: hot potato
- [x] Doomscroller: contagious scrolling
- [x] Toddler: won't let go
- [x] Squish Issue: squishes, then un-squishes into you
- [x] Main Character: all eyes on her
- [x] Wrap-up (README checklist), then stop and ask the owner

**Status (2026-11-14):** implemented, with one check scene per fighter in `checks/sim.check.ts` (the
mochi scene replaces the old `squish` one in place; the rest are at the end). **Nothing has been
run**, and neither have phases 1 and 2: no check, build, type check, lint or browser look.
Differences from the text below:

- **Toddler placement.** The text says to put the hugging toddler behind the victim, by the victim's
  facing. That would flip it from side to side every tick, because the victim turns to face the
  toddler. It now stays on whichever side it grabbed.
- **Wildfire flag.** Any new burn sets `hot` from its source, so a plain burn (dragon, phoenix) on top
  of a wildfire puts the spreading out. `hot` also clears when the burn ends.
- **Eggs** are skipped by `touch()`: a phoenix egg can't catch fire or a phone.
- Chili's blurb is `So spicy it spreads. Burning victims run screaming into their friends` (no
  apostrophe).
- The toddler's sway follows the clock, not the victim's walk cycle.
- The Main Character check uses a goose next to her as something to pose at, and an intern as the
  toasts' first target, so the scene proves the pose changed their minds.

---

## Groundwork

### `stopMoves(i)`

The line `this.endScrap(i); this.leapT[i] = this.dashT[i] = this.spinT[i] = 0` (or a close variant)
appears in `kill()`, `toss()`, the held block, the shock block, the lured block and, since phase 2,
the topple and blind blocks. This phase adds `latchT`, and phase 4 adds `rollT`. Replace them all
with:

```ts
// cancel anything mid-move: cat brawl, jump, dash, spin, leg-hug (and later a roll)
private stopMoves(i: number) {
  this.endScrap(i)
  this.leapT[i] = this.dashT[i] = this.spinT[i] = this.latchT[i] = 0
}
```

Check each call site: some only zeroed some of the timers. Zeroing all of them is correct everywhere
these are called.

### `touch(i, j)`: when two fighters overlap

The separation loop in `step()` (`// push overlapping units apart`) is the only place that knows two
fighters are touching. Add one call there, inside the `if (d2 < min * min)` branch, before the push:
`this.touch(i, j)`. Put all contact effects (fire, phones) in that one method:

```ts
// two fighters bumped into each other this tick; contact effects go here
private touch(i: number, j: number) { /* Chili and Doomscroller below */ }
```

The loop skips held, leaping and brawling fighters, so they can't catch things by contact. Intended.

---

## Señor Chili: hot potato

**Joke:** his burns make the victim panic and run, and the fire spreads to whoever the burning
fighter bumps into. Crowds catch fire in a chain that dies out after a few hops. Pop Off pops.

**Now:** `burn: 3, hides: true`. Burning exists elsewhere (Scorch, Encore).

**Data**
- New field: `wildfire?: boolean // its burns spread on contact and make the victim run in panic`
- Chili: `wildfire: true`, `burn 3 → 2.5`. New constants:
  `const SPREAD_MIN = 0.8, SPREAD_KEEP = 0.6, PANIC_T = 0.9`.
- Blurb: `So spicy it's contagious. Burning victims run screaming into their friends`

**Sim**
- New state: `hot = new Uint8Array(MAX) // its burn came from a wildfire and spreads on contact`.
  Reset in `spawn()`.
- In `hit()`, where `burn` is applied: if `def.wildfire && !this.fireproof(j)`, then `hot[j] = 1` and
  `fearT[j] = Math.max(fearT[j], PANIC_T)`.
- `private fireproof(j)`: `const d = this.def(j); return !!d.burn || d.kind === 'fire'`. Fighters that
  set fires don't catch them: Chili, Scorch, Encore and the chick.
- In the burn block in `step()`: when `burnT` reaches 0, set `hot[i] = 0`.
- In `touch(i, j)`, both directions:
  `if (hot[a] && burnT[a] > SPREAD_MIN && burnT[b] <= 0 && !fireproof(b)) { burnT[b] = burnT[a] * SPREAD_KEEP; hot[b] = 1; fearT[b] = Math.max(fearT[b], PANIC_T) }`.
  Each hop passes on 60% of the remaining burn and needs at least 0.8 to spread: 2.5 → 1.5 → 0.9 →
  stop. That's about three hops, so it never sweeps the whole page.
- The panic reuses phase 1's fear branch (runs from its target, sweat drop and speed lines). Pop Off's
  `pops` triggers on any burn.

**Render:** nothing new (head flame, sweat drop and speed lines all exist).

**Edge cases**
- Spreading ignores teams on purpose. A burning goose can light its own flock.
- Dragon and phoenix burns don't spread, because only `hot` burns spread.

**Check:** two toasts touching at (300, 300) and (305, 300), no Chili. Set `burnT[a] = 2.5, hot[a] = 1`.
Step 3 ticks, assert `burnT[b] > 0 && hot[b] === 1`. Second scene: a toast with `hot`/`burnT` touching
a Chili. Assert the Chili never gets `burnT > 0`.

**Owner looks for:** fire hopping through a crowd and burning fighters running; popcorn going off.

---

## Doomscroller: contagious scrolling

**Joke:** a notification hit makes the victim stop and look at its phone. Anyone that bumps into a
scroller starts scrolling too. Soon a whole crowd stands staring at phones.

**Now:** ranged with the generic `slow: 1.6`.

**Data**
- New field: `distract?: number // hits make the victim stop and scroll its phone for this many seconds; it spreads by contact`
- Doomscroller: remove `slow`, `distract: 1.6`. New constants:
  `const PHONE_SPREAD = 0.8, PHONE_KEEP = 0.7, PHONE_IMMUNE = 1.5`.
- Blurb: `Every notification is contagious. Soon the whole crowd is scrolling`

**Sim**
- New state: `phoneT = f32(MAX) // > 0 scrolling, < 0 just put it down and immune for a moment`. Reset
  in `spawn()`.
- Countdown in `step()` (near the other timers): if `> 0`, subtract `DT`, and on crossing 0 set it to
  `-PHONE_IMMUNE`. If `< 0`, add `DT`, capped at 0.
- Can a fighter be distracted: `phoneT[j] === 0 && !this.def(j).distract` (Doomscrollers are already
  scrolling).
- In `hit()`: `if (def.distract && <can be distracted>) phoneT[j] = def.distract`.
- In `step()`, after the `shockT` block: `if (phoneT[i] > 0) { this.stopMoves(i); vx *= 0.8; vy *= 0.8; continue }`.
- In `touch(i, j)`, both directions:
  `if (phoneT[a] > PHONE_SPREAD && <b can be distracted>) phoneT[b] = phoneT[a] * PHONE_KEEP`.
  1.6 → 1.12 → stop. Combined with the immunity, it fades out.

**Render**
- While `phoneT > 0` and the fighter isn't a `distract` fighter: a tiny phone in front of its face, a
  dark box `#38384b` about 5×8 with a pale screen `#addde8` (the same colours as the Doomscroller's
  phone) at about local `(8, -24)`. Head tilt: `rot += face * 0.25`. Alpha
  `Math.min(1, phoneT * 4)`.

**Edge cases:** a scrolling fighter is frozen, not stunned. It still takes damage and can be thrown.
Thrown fighters skip the phone block until they land, and the timer keeps counting down.

**Check:** two toasts touching, `phoneT[a] = 1.6`. Step 2 ticks, assert `phoneT[b] > 0`. Then step
until both are below 0, set `phoneT[a] = 1.6` again, step 2 ticks, and assert `phoneT[b] <= 0`
(immunity).

**Owner looks for:** clumps of fighters frozen with little phones, spreading through crowds.

---

## Toddler: won't let go

**Joke:** the toddler hugs an enemy's leg and rides along, slowing it down and nibbling, until it gets
shaken off (dizzy) or squashed.

**Now:** `slow: 1.5, hides: true` (generic slow).

**Data**
- New field: `latch?: number // chance a hit turns into hugging the victim's leg for LATCH_T seconds: rides along, slows and nibbles`
- Toddler: remove `slow`, `latch: 0.4`. Keep `hides`. New constants:
  `const LATCH_T = 2.5, NIBBLE = 30 // ticks between nibbles`.
- Blurb: `Hugs your leg and will not let go. Also bites`

**Sim**
- New state: `latchT = f32(MAX) // seconds left hugging focus[i]'s leg`. Reset in `spawn()`. Add it to
  `stopMoves()`. The victim is stored in `focus` via `lockOn()` (see phase 2's note on fighters
  sharing `focus`).
- In `attack()`, melee branch, after `hit()`:
  `if (def.latch && this.latchT[i] <= 0 && this.alive[t] && this.airT[t] <= 0 && this.heldBy[t] < 0 && Math.random() < def.latch) { this.lockOn(i, t); this.latchT[i] = LATCH_T }`
- In `step()`, near the dash/leap blocks:
  ```
  if latchT[i] > 0:
    v = focus[i]
    if !focusAlive(i) || airT[v] > 0 || (latchT[i] -= DT) <= 0:
      latchT[i] = 0; dizzyT[i] = 0.8; slowT[i] = max(slowT[i], 0.8)   // shaken off
    else:
      slowT[v] = max(slowT[v], 0.2)
      if (tick + i) % NIBBLE === 0: hit(v, def, 0, 0, i)
      vx[i] = vy[i] = 0
      continue
  ```
- Riding: next to the "whoever is in a jaw goes where the jaw goes" loop, add: if `latchT[i] > 0`
  and `focusAlive(i)`, set `x[i] = x[v] - face[v] * UNITS[type[v]].r * 0.6` and `y[i] = y[v] + 2`.
- Separation: skip fighters with `latchT > 0` (add them to the existing skip conditions for `i` and
  `j`).

**Render**
- A hugging toddler sits at the victim's side and is drawn in normal grid order. Add a hug tilt,
  `rot += face * -0.2`, plus a small sway matching the victim's walk: `Math.sin(phase[v]) * 0.1`.
- The victim already shows sticky-footing smudges from `slowT`.

**Edge cases**
- The victim can hit the toddler, which is in reach. The toddler (35 hp) usually loses. That's the
  risk it takes.
- If the victim is dragged into water, the toddler wades along. Toddlers aren't water-bound, so
  `keepWet` doesn't apply.
- When the victim is thrown, the `airT[v] > 0` check shakes the toddler off before the throw moves
  them apart.

**Check:** set `UNITS[toddler].latch = 1` for the check (restore it afterwards). Toddler next to a
toast, `cd[toddler] = 0`, toast `cd = 100`. Step until `latchT > 0`. Then set `vx[toast] = 200` for
20 ticks and assert the toddler stayed within 15px of the toast.

**Owner looks for:** toddlers stuck to legs being dragged around, then dizzy when they fall off.

---

## Squish Issue: squishes, then un-squishes into you

**Joke:** a hit that would knock the mochi back flattens it instead. It springs back and sends the
attacker flying with its own force. Big hitters (Gym Bro, Nana) launch themselves.

**Now:** `thorns: 12` (a copy of Spike's).

**Data**
- New field: `squish?: number // takes no knockback; springs it back at the attacker at this share (a hard hit throws them)`
- Mochi: remove `thorns`, `squish: 1`. New constant: `const SQUISH_THROW = 200 // returned knockback at least this strong throws the attacker`.
- Blurb: `Hit the mochi and it squishes. Then it un-squishes into you`

**Sim**
- In `hit()`, before calling `damage()`:
  ```
  sq = UNITS[type[j]].squish
  if sq:
    k = hypot(kx, ky)
    if from >= 0 && alive[from] && k > 0:
      damage(from, 0, -kx * sq, -ky * sq)            // phase 2's topple sees this
      if k * sq >= SQUISH_THROW: toss(from, -kx / k, -ky / k, type[j], 120)
      atkT[j] = 1                                    // the spring
    kx = ky = 0
  ```
- In `toss()`: `if (UNITS[this.type[g]].squish) { this.hitT[g] = 1; return }`. It flattens instead
  of flying, which covers Nana's throw, the unicorn's charge, the T-rex's fling and landings.
- Projectiles and explosions pass `from = -1`, so the knockback is absorbed with no bounce.

**Render**
- Replace `def.key === 'mochi'` with `def.squish`, and make the squash stronger:
  `c.scale(1 + hitT * 0.45, 1 - hitT * 0.4)`. The spring uses the existing `atkT` lunge.

**Edge cases**
- The thrown attacker can land on other fighters (bounce is off, so they just get the landing hit).
- A held mochi dropped by the T-rex's `fling()` now just drops. Fine.

**Replaces an existing check:** the `squish` scene asserts "punching mochi reflects damage". Rewrite
it: Gym Bro next to a mochi, `cd[gymbro] = 0`, mochi `cd = 100`. Step until the punch lands. Assert
`airT[gymbro] > 0` (his knock 220 × squish 1 ≥ 200) and `vx/vy[mochi]` stayed near 0.

**Owner looks for:** a mochi flattening on a hit and the attacker flying off.

---

## Main Character: all eyes on her

**Joke:** she strikes a pose and every enemy nearby drops what it's doing and comes to look, walking
right into the shove.

**Now:** `pulse: 58` (pose knockback). It's already somewhat distinct; this gives the pose a pull.

**Data**
- New field: `spotlight?: number // its pose makes every enemy this close come at it for SPOT_T seconds`
- Main Character: `spotlight: 130`. New constant: `const SPOT_T = 1.4`.
- Blurb: `Strikes a pose. Everyone nearby has to come and look, then gets shoved`

**Sim**
- New state: `spotT = f32(MAX)`, `spotBy = new Int32Array(MAX).fill(-1)`, `spotGen = new Uint32Array(MAX)`
  (the victim's side: who it's staring at). Reset all three in `spawn()`.
- In `attack()`, in the `pulse` branch before `sweep()`, if `def.spotlight`: scan enemies within
  `def.spotlight` (copy the grid loop from `explode()`) and set
  `spotT[j] = SPOT_T, spotBy[j] = i, spotGen[j] = generation[i]`.
- In `step()`, after the retarget line (and after Toast's grudge override): if `spotT[i] > 0`, count
  down. Then, if `spotBy` is alive, its generation matches, it's not the same type, and this fighter
  isn't `lured`, set `t = target[i] = spotBy[i]`.

**Render**
- While `spotT > 0`: a small four-point sparkle (`#fff7ca` fill, ink outline 0.6, about 3px) above the
  head at `y - 40 * size`, alpha `Math.min(1, spotT * 3)`. It echoes her ring light.

**Edge cases:** the siren's lure overrides it (lured fighters ignore targets anyway). Toast's grudge
is overridden by the spotlight: the spotlight wins because it comes later.

**Check:** Main Character at (300, 300), two toasts at (400, 280) and (400, 320), an intern at
(500, 300). Set the Main Character's `cd = 0` and let her pose. Assert both toasts have
`target === maincharacter` for the next few ticks.

**Owner looks for:** sparkles over nearby fighters as they turn to face her and get shoved.

---

## Existing checks this phase affects

- `cheese` (pizza) is unaffected until phase 4.
- `squish` (mochi): rewrite as above.
- The bush/ambush scene uses a toddler that hides. Make sure `latch` didn't change hiding.
- Any scene asserting `slowT` after a toddler or doomscroller hit: re-read. None found as of
  2026-11-14.

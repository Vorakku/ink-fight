# Phase 1: quick wins

Six fighters whose new behaviour mostly reuses machinery the sim already has. Each one is roughly
5–20 lines of sim code plus a small visual. Read [README.md](README.md) first.

- [x] Groundwork: `waterVer`, `shoot()`
- [x] Honk: terror honk
- [x] Nana: handbag airmail
- [x] Reply Guy: only replies to the biggest account
- [x] Touch Grass: leaves a lawn behind
- [x] Kaboom Pickle: brine puddle
- [x] Pop Off: pops when heated
- [x] Wrap-up (README checklist), then stop and ask the owner

**Status (2026-11-14):** implemented, with one check scene per fighter at the end of
`checks/sim.check.ts`. **Nothing has been run**: no check, build, type check, lint or browser look.
Differences from the text below: the first brine puddle always lands dead centre (so the spot where
the pickle stood is reliably wet); Nana's optional extra swing tilt was skipped.

---

## Groundwork

### `waterVer`: stop rebuilding the pond when only bushes change

`water.ts` `drawWater()` rebuilds its whole cached water layer whenever `sim.terrainVer` changes. Today
terrain only changes when the player paints. From this phase on, fighters add terrain mid-fight
(Touch Grass plants bushes, Pickle leaves puddles), so a bush would trigger a full water rebuild.

- In `Sim`, add `waterVer = 0 // bumped only when water changes; water.ts rebuilds its cache from this`.
- Bump it in `resize()`, in `clear()`, and in `addTerrain()` when `kind === 1`.
- In `water.ts` `drawWater()`, compare against `sim.waterVer` instead of `sim.terrainVer`.
- Leave `terrainVer` as it is: `render.ts` still uses it to re-sort bushes.

### `shoot(i, angle)`: one place that spawns a projectile

Pop Off (this phase) and the projectile owner (phase 2) both need it. Move the body of the projectile
loop at the end of `attack()` into:

```ts
// one projectile from i along `angle`, using its def's damage and range
private shoot(i: number, angle: number) {
  if (this.pn >= MAXP) return
  const def = this.def(i), p = this.pn++, speed = 420
  // ...same assignments as today (pX/pY from the rim along angle, pVx/pVy, pLife, pDmg, pType)
}
```

`attack()` then loops `for (k < count) this.shoot(i, angle + (k - (count - 1) * 0.5) * 0.15)`. Today
the spawn point uses `nx, ny` (the aim). Use `Math.cos(angle), Math.sin(angle)` so a sideways kernel
leaves from the side. For a fan that's a visual change of a pixel or two.

---

## Honk: terror honk

**Joke:** one peck and the victim runs away with a sweat drop, chased by a goose. That includes the
T-rex.

**Now:** plain fast melee (`hp 45, speed 150, dmg 7, cd 0.3`).

**Data**
- New field: `scare?: number // chance a peck sends the victim running in panic for SCARE_T seconds`
- Goose: `scare: 0.35`. New constant in `sim.ts`: `const SCARE_T = 0.8`.
- Blurb: `Pecks you once. You run for your life`

**Sim**
- In `hit()`, next to the `burn`/`slow`/`shock` lines:
  `if (def.scare && from >= 0 && Math.random() < def.scare) { this.fearT[j] = Math.max(this.fearT[j], SCARE_T); this.target[j] = from }`
- That's all the sim needs. The panic branch in `step()` (`if (this.fearT[i] > 0 && !lured)`)
  already works for any fighter: it runs away from its target at 1.9× speed, turns its back and
  doesn't attack. Setting `target[j] = from` makes it run from the goose, not from whatever it was
  fighting. It may switch to the nearest enemy at the next 12-tick retarget, which is usually the
  goose anyway.
- Eggbert hatches a goose, so this applies to the hatchling too. Intended.

**Render**
- The victim already gets speed lines and a sweat drop from the existing `fearT` branch.
- Add the honk: when `def.scare && atk > 0`, draw three short concentric arcs in front of the beak,
  ink-grey (`#9a9aa8`), line width 1.1, opening outward, alpha `atk`. Find the beak's tip in `goose()`
  in `units.ts`. In the renderer's local space a sprite point `(sx, sy)` is `(sx - 24, sy - 44)`.
  Keep them inside about 8px of the beak.

**Edge cases**
- A swarm of geese can keep one big victim running for a long time. That's the joke, but if it's too
  strong, lower `scare`. Don't add immunity systems in this phase.
- A held, thrown or stunned victim skips steering, so the fear just runs out. Fine.

**Check:** goose next to a toast, set `UNITS[goose].scare = 1` for the check (restore it afterwards),
`cd[goose] = 0`, step until the first peck (up to 30 ticks), then assert `fearT[toast] > 0` and that
the toast moves away from the goose over the next 20 ticks.

**Owner looks for:** a toast or T-rex turning tail with a sweat drop; small honk arcs at the beak.

---

## Nana: handbag airmail

**Joke:** "one handbag swing sends you flying", but literally: the victim flies through the air in an
arc and bowls over whoever it lands on.

**Now:** melee with big knockback (`dmg 45, knock 520, cd 1.4`).

**Data**
- New field: `launch?: number // melee hits throw the victim this many px; it bowls over whoever it lands on`
- Nana: `launch: 200`, `dmg 45 → 30` (the landing adds `LAND_DMG` 18). Keep `knock: 520`: fighters too
  big to throw still get shoved.
- Blurb: `One handbag swing and you're airmail. Mind who you land on`

**Sim**
- In `attack()`, melee branch, right after the existing `if (rush) this.toss(...)` line:
  `if (def.launch && this.alive[t] && this.airT[t] <= 0 && UNITS[this.type[t]].r <= def.r * 1.5) this.toss(t, nx, ny, this.type[i], def.launch, 1)`
- The last argument `1` (bounce) turns on the bowling: `land()` throws whoever it lands on `BOUNCE` px,
  and the thrown fighter bounces back the other way. `toss()` already refuses eggs and fighters held in
  a jaw.
- The size limit (`r <= 15` for Nana) lets her throw a T-rex (r 14) but not Scorch (r 16). The
  thrown T-rex is the joke; the dragon just gets shoved.

**Render:** none needed. The thrown arc, tumble, landing and dizzy stars all exist. Optional: add
`atk * 0.25` extra tilt for `def.launch` fighters so the swing reads bigger.

**Edge cases**
- `toss()` overwrites the victim's velocity, so the knockback applied a moment earlier by `hit()`
  doesn't double up. That's correct.
- A victim killed by the hit is skipped by the `alive[t]` check.

**Check:** Nana next to a toast, `cd[nana] = 0`, step once or twice, assert `airT[toast] > 0`. Second
scene: Nana next to a dragon, assert `airT[dragon] === 0` after her first swing.

**Owner looks for:** fighters arcing away from Nana and knocking over a second fighter when they land.

---

## Reply Guy: only replies to the biggest account

**Joke:** he ignores everyone near him and walks across the page to bother the strongest fighter,
whatever is hitting him on the way.

**Now:** ranged `burst: 3` speech bubbles, same as Pop Off's fan. Keep the burst: it's his "three
replies" joke, and Pop Off gets its own thing below.

**Data**
- New field: `bully?: boolean // ignores whoever is closest and goes after the toughest fighter it can see`
- Reply Guy: `bully: true`. New constant: `const BULLY_SIGHT = 16 // cells a bully scans for the biggest target`
- Blurb: `Skips everyone nearby to reply to the biggest account on the page`

**Sim**
- In `findTarget()`, when `this.def(i).bully`: scan `BULLY_SIGHT` cells instead of `sight`, and
  prefer the highest `UNITS[type[j]].hp` (that fighter's max hp). Break ties by distance. All existing
  filters stay (same type, held, egg, hidden beyond `REVEAL`).
- Movement needs no change: a target out of reach is walked toward.
- Add `// shortcut: a 33×33-cell scan every 12 ticks per Reply Guy, cap or cache it if a big crowd of them stutters`.

**Render:** none. The walk across the page is the visual. Let the owner judge whether it reads.

**Edge cases**
- If nothing is in sight, he heads for the nearest enemy crowd as usual.
- His three bubbles still fan out, so they may hit fighters on either side of the big one. Fine.

**Check:** Reply Guy at (100, 300), toast at (220, 300), dragon at (600, 300). Step 13 ticks, assert
`target[replyguy] === dragon`.

**Owner looks for:** Reply Guy walking past closer fighters toward the dragon or T-rex.

---

## Touch Grass: leaves a lawn behind

**Joke:** grass grows wherever it walks. The page slowly turns into a lawn, and every hider (Pickle,
Chili, Noodle, Spike, Toddler, Touch Grass itself) gets new places to ambush from.

**Now:** `hides: true, slow: 2`. The "roots" are just the generic slow.

**Data**
- New field: `lawn?: number // plants a grass tuft behind itself every this many px walked, up to LAWN_MAX per life`
- Touch Grass: `lawn: 60`, remove `slow`, `dmg 10 → 12`. Keep `hides: true`.
- New constant: `const LAWN_MAX = 12`.
- Blurb: `Leaves a lawn everywhere it walks. Hiders are thrilled`

**Sim**
- New state: `walked = f32(MAX) // px walked since the last tuft` and
  `planted = new Uint8Array(MAX) // tufts planted this life`. Reset both in `spawn()`.
- In `step()`, in the position-integration loop (`x[i] += vx[i] * DT`), for `def.lawn` fighters that
  aren't airborne, add `Math.hypot(vx[i], vy[i]) * DT` to `walked[i]`. When it reaches `def.lawn` and
  `planted[i] < LAWN_MAX`: compute `bx = x[i] - face[i] * 34, by = y[i]`. If that point is on the
  page, `!inBush(bx, by)` and `!inWater(bx, by)`, call `addTerrain(bx, by, 0)` and increment
  `planted[i]`. Set `walked[i] = 0` either way.
- **Plant behind, not underfoot.** A hider standing in a bush waits for enemies (the "hiders lie in
  wait" branch). A tuft under its own feet would freeze it. 34px behind puts the tuft
  (`BUSH_R` 18 × up to 1.15) clear of its body.
- `addTerrain()` already returns when `bn >= MAXB`, so a full page just stops growing.

**Render:** nothing new: bushes draw from the terrain list. Keep the existing grass blades on attack,
but replace `def.key === 'touchgrass'` with `def.lawn` (rule 4).

**Edge cases**
- Thanks to `waterVer`, planting doesn't rebuild the pond.
- `clear()` resets `bn`, so lawns vanish with everything else.

**Check:** Touch Grass at (100, 300), toast at (900, 300), step 3 seconds, assert `bn > 0` and every
new stamp has `bT === 0`. Also assert `hidden[touchgrass] === 0` at some point after the first tuft
(it didn't hide itself).

**Owner looks for:** a trail of little bushes behind Touch Grass; hiders using them.

---

## Kaboom Pickle: brine puddle

**Joke:** it explodes and leaves a briny puddle. Walkers wade through it at half speed, and swimmers
(Spit Take, Shocktopus) suddenly have more pond.

**Now:** `boom` + `hides`. It's already distinct; this adds an aftermath.

**Data**
- New field: `brine?: number // its explosion leaves this many puddle stamps`
- Pickle: `brine: 3`.
- Blurb: `Runs in screaming, explodes, leaves a brine puddle behind`

**Sim**
- In `explode()`, before `this.kill(i)`: for each of `def.brine` stamps, place
  `addTerrain(x[i] + Math.cos(a) * d, y[i] + Math.sin(a) * d, 1)` with `a = k * 2.1 + Math.random()`
  and `d = Math.random() * def.range * 0.35`. Clamp to the page.
- Water's effects already exist: half-speed wading for walkers, and swimmers confined to water.

**Render:** none. The pond renders from the mask, and `waterVer` triggers the rebuild.

**Edge cases**
- If a pond appears under a water-bound fish's neighbour, the fish can now swim there through
  connected water. `keepWet()` still stops it crossing dry gaps.
- Ten pickles exploding in one tick bump `waterVer` ten times but the pond rebuilds once per frame.

**Check:** pickle next to a toast. Step until `counts[pickle] === 0`, then assert
`inWater(<pickle's last x>, <y>)`. Record the pickle's position each tick before it explodes.

**Owner looks for:** a small puddle where each pickle went off; fighters wading through it.

---

## Pop Off: pops when heated

**Joke:** set it on fire and it sprays kernels in every direction, like popcorn in a hot pan. Chili,
Scorch and Encore turn it into a sprinkler.

**Now:** ranged `burst: 3`, same as Reply Guy.

**Data**
- New field: `pops?: number // while burning, fires this many kernels per second in random directions`
- Pop Off: `pops: 8`. Keep `burst: 3` for its normal shot.
- Blurb: `Three hot takes per serving. Set it on fire and it never shuts up`

**Sim**
- In `step()`, in the burn block (`if (this.burnT[i] > 0)`), after the damage tick and only if the
  fighter is still alive: `if (def.pops && Math.random() < def.pops * DT) { this.shoot(i, Math.random() * Math.PI * 2); this.atkT[i] = 1 }`
- Projectiles skip their own type, so kernels never hurt other Pop Offs.
- This runs before the "held in a jaw" check on purpose: a burning popcorn in the T-rex's mouth keeps
  firing.

**Render:** nothing new. Kernels, the burning flame and the `atkT` lunge already draw.

**Edge cases**
- The projectile pool is 1024. A crowd of burning popcorn hits that cap, and `shoot()` silently drops
  extra kernels. Fine.

**Check:** a lone Pop Off with `burnT = 2`, no enemies. Step 30 ticks and assert `pn > 0` (normal shots
need a target, so these must be pops).

**Owner looks for:** a burning popcorn spraying kernels all around and hopping as it pops.

---

## Existing checks this phase affects

- The very first scene (20 toasts vs 20 geese, "one side wiped out within two minutes"): scared
  toasts run, so the fight may take longer. If it becomes flaky, raise the limit; don't weaken `scare`
  just for the check.
- No existing scene asserts Nana, Reply Guy, Touch Grass's slow, Pickle or Pop Off behaviour that this
  phase removes. Re-read the scenes before finishing to make sure.

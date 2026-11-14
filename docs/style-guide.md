# InkFight style guide: drawing, animation and effects

This is the house style for anything that appears on the page: fighters, their moving parts, and the
effects around them. Follow it when you add or change a fighter so new work looks and moves like the
rest. Read [neal-reference.md](neal-reference.md) first; it explains the idea we are borrowing (the
jokes come from what happens on screen) and lists what we must not copy.

## Current state (read before starting)

Five fighters from the earlier session were recorded as **never run**: Tiny Arms (`rex`), Pointy
(`unicorn`), Sparklebutt (`pegasus`), Special Delivery (`griffin`) and Noodle (`snake`). No type-check,
no `npm run check`, no look in a browser. Their sprites were drawn from coordinates alone.

The 2026-11-14 roster expansion adds another 17 fighters, also **not run or visually checked**.
See [the roster design](superpowers/specs/2026-11-14-roster-expansion-design.md) for their abilities
and [the implementation plan](superpowers/plans/2026-11-14-roster-expansion.md) for the handoff.

The owner explicitly prohibits running tests, builds, linters, type checkers or verification
commands without permission. Finish the change, then ask whether they want it tested. This rule
overrides all automatic testing steps in skills and the historical instructions below.

Once the owner authorizes testing:

1. Run `npm run build` and `npm run check` and fix what fails.
2. Open the game (`npm run dev`), place each of the five, and fix what looks wrong: hinge positions
   (jaw, arm, wing), where a carried fighter sits in the jaw or talons, where the rainbow starts, how the
   snake's head meets its body.

Do not start a dev server or perform browser checks before authorization either.

## Where things live

| File | What it holds |
|---|---|
| `src/game/units.ts` | `UnitDef`, the drawing helpers, one draw function per fighter, the `UNITS` table, `buildSprites()` |
| `src/game/sim.ts` | All behaviour. Units are parallel typed arrays, stepped at 60 Hz |
| `src/game/render.ts` | Draws everything each frame from the sim's arrays and the prebuilt sprites |
| `src/game/water.ts` | The pond |
| `checks/sim.check.ts` | One assert-based check per behaviour, no browser needed |

## Drawing a fighter

A fighter is a function that paints into a 48×48 box with Canvas 2D. It is painted once at 3× resolution
by `unitSprite()` and stamped from then on.

**The box**

- Facing right, feet at (24, 44), nothing outside 0–48.
- Keep the body in the lower two thirds. Heads usually sit around y 8–18, bodies around y 22–38.
- A bigger fighter is the same 48 box with `size` on its `UnitDef` (1.15 for a horse, 1.4–1.7 for the
  large ones). Don't draw bigger; scale.

**Use the helpers, not raw paths**

| Helper | Use |
|---|---|
| `ellipse`, `box`, `poly` | Filled and outlined shapes |
| `line` | An outlined stroke through points |
| `tube` | A fat outlined neck or limb between two points |
| `legs` | Two stick legs with little feet |
| `eye` | White eye with a pupil looking right |
| `dot`, `smile` | Small fills without an outline, and a mouth arc |

**Outline**

- Colour `INK` (`#221f33`), round caps and joins. `unitSprite()` sets a 2.2 line width; leave it for the
  main shapes.
- Small details get thinner lines: 1.0–1.4 for teeth, claws, feathers, spirals, eye rims.
- The reference doc wants thinner outlines everywhere. That will be done once, in the shared helpers. Do
  not thin individual fighters; match the current weight.

**Colour and shading**

- One main body colour per fighter, flat, plus at most two accents. Pick a main colour no other fighter
  uses. Taken so far: toast `#d99a3d`, pickle `#6fbf4a`, chili `#e03a2e`, pancake `#e2a95a`, hedgehog
  `#6b4a2f`, mozzie `#7d8597`, llama `#f3e6cf`, skunk `#2b2b36`, snake `#8e6fe0`, rex `#d9773a`, gym bro
  `#ff7a59`, toddler `#7ec8e3`, dad `#4caf8a`, nana `#b48ad6`, dragon `#3fae6b`, phoenix `#ff6b2c`,
  pegasus `#bfe0ff`, griffin `#dba24a`, siren `#2bb8a6`. White bodies: goose, unicorn.
- Shared accents: gold `#ffd23f`, butter yellow `#ffe45c`, beak orange `#f08c1b`, skin `SKIN`, blush
  `#ffb3c7`.
- Shading is soft and unoutlined: a paler belly ellipse, a translucent darker ellipse under the belly
  (`rgba(…, .2)`), and optionally a translucent white highlight top-left (`rgba(255,255,255,.22)`). See
  `rexBody` and `unicorn`. No gradients.
- The ground shadow is added by `unitSprite()`. Don't draw your own unless the fighter hovers or is drawn
  by the renderer (see Moving parts).

**Face and detail**

- One eye visible (side-on), with one brow or eyelid line that sets the mood: angry, smug, tired. The
  face stays calm or determined; the situation is the joke.
- The silhouette plus one feature says what it is from across the page: a huge head and teeth, a horn, a
  wing, a hooked beak.
- Aim for three to five small details beyond the silhouette (stripes, spots, a ruff, a flank mark, a
  tongue). Each should read at 30px tall; if it doesn't, drop it.
- Put a short comment on each part of the drawing, with the joke where there is one
  (`// tiny arms: can't reach anything, waves anyway`).

## Moving parts

Most fighters are a single sprite. When one part needs to move on its own, split the sprite.

**Hinged parts** (T-rex jaw and arm, wings)

1. Write one draw function per piece: `rexBody`, `rexJaw`, `rexArm`.
2. Export the hinge as a point in sprite px: `REX_JAW = [29, 17]`.
3. Write a combined function for `UnitDef.draw`. That is the tray and tally icon, so it must show the
   whole fighter.
4. Build the pieces in `buildSprites()` with `unitSprite(piece, false)` (no shadow) for everything except
   a ground-standing body.
5. In `render.ts`, draw the body, then swing each piece with `part(sprite, HINGE, angle)`.

**Fliers** set `flies: [body, wing]` on the `UnitDef`. That one field gives them a hover, a shadow that
stays on the ground, a flapping wing around `WING`, full speed over water and no wading. Reuse the `wing`
factory with new colours before drawing a new wing.

**Drawn by the renderer** (the snake's body) is for shapes that change length. Only the head and crown
are sprites; the body is circles drawn each frame in two passes (ink outline, then fill). Use this only
when a sprite cannot do the job.

**Carried fighters** are skipped in the main loop and drawn by whoever holds them, between the holder's
body and its front piece, so the jaw or talons overlap them.

## Animation

Every fighter already gets these from the renderer for free. New behaviour should drive them, not add a
parallel system.

| Signal | Where | What it looks like |
|---|---|---|
| Walk | `phase` | Bobs 2.5px and tilts ±0.1 rad as it moves |
| Attack | `atkT` 1→0 in 0.2s | Lunges 4px forward and tips 0.45 rad |
| Hit or spawn | `hitT` 1→0 in about 0.17s | Pops 22% bigger |
| Facing | `face` | Sprite is mirrored |
| Hover | `flies` | Floats 12px up (30px when carrying), drifting ±2px |
| Thrown | `airT`, `airD` | Arcs up to 45px high for a full throw and tumbles |

Rules of thumb:

- Movement is sine-based and keyed to `sim.tick` or `phase`, with `+ i` so a crowd isn't in step.
- Part swings stay under about 0.7 rad.
- To show "something happened" to a fighter, set `hitT = 1`. To show "it did something", set `atkT = 1`.
- A pose change is a small rotation added to `rot` in `render.ts` (the unicorn's head-down charge is
  +0.3 rad), not a second sprite.

## Effects

Effects are small and quiet: about a third of a fighter's size or less, a few plain shapes, gone in a
second or two.

| Effect | Trigger | How it is drawn |
|---|---|---|
| Dizzy stars | `dizzyT` after a thrown fighter lands | Three 3px gold stars orbiting above the head |
| Speed lines | `rush` (charging) | Three 9px grey (`#9a9aa8`) lines streaming behind |
| Rainbow charge | `beam === 1` | Paper-thin turn, clenched wiggle, frantic wings and six sparkles sucked into the rump over 1.1s |
| Rainbow blast | `beam === 2` | Six straight parallel bands reaching 620px, a fading muzzle ring and a recoil skid; one hit at release |
| Ant construction | `buildFor`, `inside`, `entryT`, `colonyT`, `colonyWorkers` | Workers enter the doorway over 0.25s and work underground; dirt hops from the entrance as the mound rises over 3s. A small count and progress stroke show the work; surviving builders emerge on completion or destruction |
| Ant emergence | completed anthill's `atkT` | Three fading dirt specks at the entrance and the new ant's normal spawn pop, every 4s |
| Fallen bodies | `cAlive`, `cType`, `cSize`, `cStage`, `cLook` | Frozen sprite snapshots on their side, X eyes, subdued colour and a soft floor shadow; independent of recycled live-fighter slots |
| Ant hauling | `haulFor`, `haulSlot`, `cNeed`, `cHome`, `cEnter` | Two to eight ants grip positions around a body, lean and sweat while moving it together; it shrinks into the destination entrance over 0.6s and disappears |
| Millipede/car | `millipedes.curlT`, `group`, `assemblyT`, `wheelPhase` | A segmented bug curls into a rolling wheel; four allies shimmy into a car with separately spinning millipede wheels and a wobbly chassis |
| Mantis ritual | `mantises.scenes`, `member`, `role` | A real captive dangles between forelegs, allies wait around a small dust circle, and one bowing challenger steps forward at a time |
| Spider attack | `spiders.webT`, `windT`, `jumpT`, `mount`, `clingT` | A traveling silk pellet leaves temporary leg threads; a crouch and jump arc end in a brief vulnerable clinging bite burst |
| Spider nest/brood | `spiders.nestT`, `weaving`, `body`, `wrapT`, `cocoons`, `birthT` | A nest weaves into view, real bodies trail on silk and gain wrapping bands, and five visible cocoon bundles twitch before one spider emerges |
| Burning | `burnT` | The `flame` sprite at half size, flickering on the head |
| Charmed | `lureT` | The `heart` sprite at 0.3 size above the head |
| Healing ring | `rLife` | Twelve small flames in a spreading circle |
| Foam and leaves | `oLife` | White ellipses behind waders; green leaves from bushes |
| Ink splat | death | The fighter's `color`, fading over five seconds |
| Notes and bolts | siren | Too big today; shrink before copying their size |
| Shock/X-ray | `shockT` | A dark silhouette with white cartoon bones, clipped to the victim's sprite; fades without strobing |
| Spin | `spinT` | Sprite turns edge-on while small elliptical sword swishes circle it |
| Jump | `leapT` | Sine arc with a shadow on the ground; capybara leans rump-first |
| Landing/pose | `pulseT` | One fading elliptical dust or ring-light ring |
| Cat brawl | `scrapT`, `scrapBy` | A short smoke cloud over both participants with paws and claws poking out |
| Panic | `fearT` | Ninja, or anyone a goose just pecked, turns away, trails speed lines and sheds a small blue sweat drop |
| Honk | `scare` fighter attacking (`atkT`) | Three small grey sound arcs off the beak, fading with the lunge |
| Lawn | `lawn` fighter walking | Ordinary bush stamps planted behind it; no separate effect |
| Toasting | `grow` on a `grudge` fighter | The `char` silhouette faded in over the body, up to 55%; two grey steam puffs from three hits on |
| Full belly | `grow` on a `swell` fighter | The sprite grows 12% a sip, a red ellipse fills the abdomen, and it wobbles |
| Toppled | `downT` | Sprite rotated onto its back, rocking, lifted 8px to lie on the ground |
| Spat on | `blindT` | A pale blue blob and drip over the face; the fighter sways as it stumbles |
| Pearl string | projectile from a fighter with negative `knock` | A thin tea-coloured line from the straw to the pearl |
| Wired / crashed | `moodT` on a `crash` fighter | Wired: 1.2px jitter and speed lines. Crashed: tipped face first with the sleep bubbles |
| Scrolling | `phoneT` > 0 | A tiny dark phone with a pale screen held up to the face, head tilted down |
| Leg-hug | `latchT` | The hugger sits at the victim's side, leaning in and swaying; the victim shows sticky footing |
| Squish | `hitT` on a `squish` fighter | Sprite squashes wide and flat, then springs back with the attack lunge |
| Spotlit | `spotT` | A small pale-yellow four-point sparkle over the head |
| Second look | `alt` (dad `away`, hedgehog `rollT`, promoted intern) | Sprite swapped for the fighter's `alt` drawing |
| Sandal on the floor | `away === 2` | Pink sandal lying at `itemX/itemY`; dad hops toward it |
| Syrup spot | terrain kind 2 | Flat translucent brown blobs with a fallen pancake; walkers through it show sticky footing |
| Cheese strand | `tetherT` | Yellow line, droopy when slack, thinner when taut |
| Rolling | `rollT` | Spiky ball sprite spinning, with speed lines |
| Stink cloud | `kLife` | Four wobbling translucent green puffs and three wavy lines, drawn over fighters |
| Overworked | `bossTick` | The blue sweat drop on interns a manager is hurrying |
| Team bandanna | `team` is red or blue | A 3px band in `TEAM_COLORS` just under the sprite's top edge, knotted at the back with two fluttering tails; fades with a hider; `band` on the fighter overrides the height |

To add an effect:

- If it follows one fighter, add a timer array to the sim and draw it in the fighter loop in `render.ts`
  after the body. Fade with `globalAlpha` from the timer, then reset `globalAlpha` to 1.
- If it is left behind on the page, use a fixed-size ring buffer like `oLife` or `sLife`.
- Draw simple shapes directly with canvas paths. Make a sprite only for something outlined and reused
  (flame, heart).
- No text, no screen shake, no flashes bigger than the fighter.

## Behaviour rules (sim.ts)

- **State is a typed array** indexed by unit slot, declared with a one-line comment. Reset it in
  `spawn()`, because slots are reused.
- **One optional field on `UnitDef` per quirk** (`grab`, `charge`, `flies`, `carry`, `eats`), with a
  comment saying what it does. The sim checks the field, never the fighter's key.
- **Teams**: red, blue, or free-for-all (stored as `2 + type`, so every type is its own side). Friend or
  foe compares `team`, never `type`, and anything a fighter makes (projectiles, stink clouds, throws,
  hatchlings, summons) inherits its side.
- **Reuse what exists**: `hit()` for a landed attack, `damage()` for raw damage, `toss()` to send someone
  through the air, `land()` for the landing, `burnT` and `slowT` for after-effects.
- **No allocation in `step()`.** Area scans copy the grid loop used in `explode()`.
- **Every gimmick shows on screen.** If it changes a number, it also sets `hitT`, `atkT` or an effect.
- **Delayed targets have identity**: dash/leap/brawl locks record the slot's generation, so a hatched
  or respawned fighter cannot inherit the old fighter's incoming ability.
- **Water-bound fighters** set `waterbound`. Dry placement creates a puddle; movement and separation
  are clipped back to the shoreline. Existing sirens remain amphibious.
- **Shared quirks**: `burst` uses the projectile pool, `orbit` keeps throwing while circling, `shock`
  briefly stuns, `spin` and `pulse` use enemy-only area hits, `regen` recovers while resting,
  `dash`/`timid` supply the ninja's lunge and panic, and `leap` selects a slam or opening brawl.
  From [fighter quirks phase 1](fighter-quirks/phase-1-quick-wins.md): `scare` panics the victim,
  `launch` throws it with `toss()`, `bully` targets the toughest fighter in sight, `lawn` plants
  bushes, `brine` leaves puddles after an explosion, and `pops` fires kernels while burning.
  From [phase 2](fighter-quirks/phase-2-timers-and-states.md): `grudge` locks onto the first attacker,
  `swell` pops after enough bites, `topple` knocks it flat, `blind` takes away the victim's target,
  `crash` alternates caffeine and sleep, and a negative `knock` pulls.
  From [phase 3](fighter-quirks/phase-3-interactions.md): `wildfire` burns spread on contact,
  `distract` hands out phones that spread on contact, `latch` hugs a leg, `squish` springs knockback
  back at the attacker, and `spotlight` makes nearby enemies target the poser.
  From [phase 4](fighter-quirks/phase-4-bigger-builds.md): `fetch` must retrieve its projectile,
  `alt` is a second sprite, `stack` loses layers as syrup, `tether` holds and drains, `roll` bowls
  when cornered, `stink` sprays clouds, and `promote` turns a killer into a manager.
- **Contact effects go in `touch(i, j)`**, called from the separation loop for every overlapping pair.
  Anything that spreads must weaken each hop so it dies out.
- **Cancel moves with `stopMoves(i)`** (brawl, jump, dash, spin, leg-hug) whenever a fighter is
  stunned, thrown, held, charmed or killed. Add new move timers to it.
- **Projectiles know who fired them**: `owner(p)` returns the shooter's slot, or -1 if it is gone.
  `hit()` takes `from` (who is touching it: thorns, eating) and `by` (who gets the blame, also at range).
- **Terrain can change mid-fight.** Water redraws from `waterVer`, bushes re-sort from `terrainVer`.
  Bump `waterVer` only when water changes.
- **One check per behaviour** in `checks/sim.check.ts`: build a tiny scene, step it, assert. Where luck
  is involved, set the chance to 1 for the check and put it back.
- Mark a known limit as `// shortcut: <the limit>, <when to fix it>`.

## Voice

- Names are short and silly: Sir Toast, Honk, Tiny Arms, Sparklebutt, Noodle.
- The blurb is one line that says what it does, with the joke in it, and no full stop at the end:
  "Bites, shakes, flings. Cannot clap".
- Keep archetypes distinct from Battle Draw with original drawings and behaviour. The owner expressly
  requested a ninja on 2026-11-14; ours wears a mint scarf and panics when threatened. Battle Draw also
  has a Snake; ours is kept distinct by its colour and its eat-and-grow behaviour. Do not copy assets.

## Adding a fighter: the steps

1. Pick the tab, a name, a blurb, a main colour nobody has, and one gimmick.
2. Write the draw function(s) in `units.ts` using the helpers.
3. Add the entry to `UNITS`. Copy the stats of the closest existing fighter and adjust.
4. If the gimmick is new, add one field to `UnitDef`, the state arrays and logic in `sim.ts`, and its
   visible reaction in `render.ts`.
5. Add one check.
6. Ask the owner whether to run the build and the check, then look at it in the browser at normal zoom.
   It should be recognisable at 30px tall.

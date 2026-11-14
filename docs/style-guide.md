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
| Rainbow | `beam` (pegasus firing) | Six 1.7px bands arching from rump to target |
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
| Panic | `fearT` | Ninja turns away, trails speed lines and sheds a small blue sweat drop |

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
- **Every unit type is its own team.** "Enemy" means any other type.
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

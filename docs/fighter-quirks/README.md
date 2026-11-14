# Fighter quirks: give every fighter its own joke

Date: 2026-11-14. Requested by the owner after the roster expansion. This folder is the hand-off
for the implementing agent: four phases, done one at a time, with a review by the owner between phases.

## The problem

The roster expansion gave most new fighters the same five generic quirks, so many fighters are the
same fighter with a different drawing:

| Quirk | Fighters that have it today |
|---|---|
| `slow` | Flapjack, Boba Menace, Doomscroller, Toddler, Touch Grass, Cheesed, Stinky |
| `lifesteal` | Mozzie, Gym Bro, Cheesed |
| `thorns` | Spike, Squish Issue |
| `burst` | Pop Off, Reply Guy |
| `charge` | Depresso, Pointy |

Six of the original fighters have no quirk at all: Sir Toast, Honk, Unpaid Intern, Nana, Spit Llama and
Sandal Dad.

**Goal:** each of these 23 fighters gets one behaviour you can see on screen and that no other fighter
shares. Where possible the behaviour also reacts to other fighters (grass gives hiders new places to
hide, fire sets off popcorn), because those reactions are where the funny moments come from.

**Not in scope:** Eggbert, Noodle, Tiny Arms, Scorch, Encore, Pointy, Sparklebutt, Special Delivery,
Karaoke Shelly, Horsing Around, Spit Take, Shocktopus, No Thanks, Spin Sensei, Rear Admiral, Civil Paw
and Bed Rot already have their own thing. Don't change them, apart from incidental fixes a phase
explicitly calls for.

## Phases

| Phase | File | Fighters | Shared groundwork it adds |
|---|---|---|---|
| 1. Quick wins | [phase-1-quick-wins.md](phase-1-quick-wins.md) | Honk, Nana, Reply Guy, Touch Grass, Kaboom Pickle, Pop Off | `waterVer` (separate redraw counter for water), `shoot()` helper |
| 2. Timers and states | [phase-2-timers-and-states.md](phase-2-timers-and-states.md) | Sir Toast, Mozzie, Gym Bro, Spit Llama, Boba Menace, Depresso | Projectile owner (`pFrom`/`pGen`), `by` argument on `hit()` |
| 3. Fighters affecting each other | [phase-3-interactions.md](phase-3-interactions.md) | Señor Chili, Doomscroller, Toddler, Squish Issue, Main Character | `touch(i, j)` contact hook, `stopMoves(i)` helper |
| 4. Bigger builds | [phase-4-bigger-builds.md](phase-4-bigger-builds.md) | Sandal Dad, Flapjack, Cheesed, Spike, Stinky, Unpaid Intern | `alt` sprite field, syrup terrain (kind 2), stink-cloud buffer |

Phases depend on each other in order: phase 2 uses phase 1's `shoot()`, phase 4 uses phase 2's
projectile owner and phase 3's `stopMoves()`. Don't reorder them.

## Hard rules (read before touching code)

1. **Do not run anything without asking the owner first**: no tests, `npm run check`, build, lint,
   type check, dev server or browser. The repo's README and style guide say the same. Write the checks
   and leave them unrun. At the end of each phase, stop and ask: "Phase N done. Want me to verify
   (check / build / run), or will you check it yourself?"
2. **Don't start the next phase** until the owner has reviewed the current one and says to go on.
   Each phase should come out polished, not rushed.
3. **Read first:** [style-guide.md](../style-guide.md) (house style for drawings, effects and the sim)
   and [neal-reference.md](../neal-reference.md) (what not to copy). Everything below follows them.
4. **One optional `UnitDef` field per quirk**, with a one-line comment. The sim checks the field, never
   `def.key`. The renderer has two old key checks (`mochi`, `pizza`). Phases 3 and 4 replace them with
   fields, so don't add new ones.
5. **State is typed arrays**, declared with a one-line comment and reset in `spawn()`. No allocation in
   `step()`: no closures, no arrays, no objects. Area scans copy the grid loop from `explode()`.
6. **Every gimmick shows on screen.** If it changes a number, it also sets `hitT`, `atkT` or draws an
   effect. No text, no screen shake, no flash bigger than the fighter.
7. **Delayed targets have identity.** Anything that remembers another fighter (grudge, latch, tether,
   spotlight, projectile owner) records the slot's `generation` and checks it before acting.
8. **Keep fighter indices.** Never reorder `UNITS`.
9. Tune by changing numbers, not by adding systems. Each fighter section lists its balance knobs.
10. Mark a known limitation with `// shortcut: <the limit>, <when to fix it>` (the house convention).

## How each fighter section is laid out

- **Joke:** what the player should see, in one or two sentences.
- **Now:** its current stats and quirks.
- **Data:** the `UnitDef` field to add, new values, quirks removed, new blurb. Blurbs are one line
  with no full stop at the end (see the style guide's Voice section).
- **Sim:** where in `sim.ts` and what to change. Function names are reliable; line numbers are as of
  2026-11-14 and will drift.
- **Render:** what to draw in `render.ts` (and `units.ts` if there's a new drawing).
- **Edge cases:** what has to keep working.
- **Check:** one scene for `checks/sim.check.ts`, using the existing `scene()` and `unit()` helpers.
  Write it; don't run it.
- **Owner looks for:** what to watch for in the browser at normal zoom.

## Combos to keep in mind

These come for free if each quirk is built as specified. Don't hard-code them, but don't break them
either:

- Touch Grass's lawn → new hiding spots for Kaboom Pickle, Señor Chili, Noodle, Spike, Stinky, Toddler.
- Kaboom Pickle's brine → new water for Spit Take and Shocktopus, and wading for everyone else.
- Señor Chili, Scorch, Encore set fire → Pop Off fires kernels everywhere. Chili's fire spreads in
  crowds.
- Nana's handbag throw → the thrown fighter bowls over others; Gym Bro lands on his back.
- Squish Issue bounces knockback → Gym Bro and Nana get launched by their own hits.
- Reply Guy walks across the page to the biggest fighter, past everyone else.
- Doomscroller's phones spread through crowds; Main Character pulls the crowd together.

## Per-phase wrap-up (every phase)

1. Update the fighter's blurb in `UNITS`. The tooltip uses it.
2. Add any new effect to the Effects table in `style-guide.md`, and any new shared quirk to its
   "Shared quirks" line.
3. Update or replace existing check scenes that assert behaviour the phase removes (each phase lists
   them).
4. Add one short paragraph to the repo `README.md` naming the phase and saying its checks haven't run.
5. Tick the phase's checklist, then stop and ask the owner (rule 1).

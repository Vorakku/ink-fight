# Zombie and Giant implementation record

**Specs:** `../specs/2026-11-14-zombie-infection-design.md`, `../specs/2026-11-14-giant-club-slam-design.md`.
**Status:** source written 2026-11-14. **Not verified:** no tests, type check, lint, build or app run.

## Roster (`units.ts`)

- `CATEGORIES` gains `Miscellaneous`. New fields: `zombie`, `of` (variant's original index), `slam` (radius).
- Appended `zombie` (Miscellaneous, 90 hp, 95 px/s, 7 dmg, 0.75 s) and `giant` (Mythical, 320 hp,
  50 px/s, r 22, size 1.85, 28 dmg, knock 320, cd 2.2, slam 85).
- After the array, one hidden `internal` variety is generated per eligible creature (skips buildings,
  the car and zombies): `Zombie <name>`, original draw/r/size/hp/category/waterbound/band/prey,
  base-zombie stats, no other flags. `ZOMBIE_OF[type]` maps to it (-1 otherwise). The module throws if
  the roster would overflow the 8-bit `type`/free-for-all `team` ids.
- Variety sprites (`unit`, `dead`) are baked with dull eyes and a green-grey `source-atop` wash.
  `Sprites.giant = [body, club]`; the club (with arm) swings around `GIANT_GRIP`.

## Simulation (`sim.ts`)

- Infection: `infectT`, `infectTeam`. A zombie melee bite that the same-generation victim survives,
  on an `infectable` target (has a variety, not an egg, not underground, not held), starts 2 s once;
  later bites don't stack. Ticks for every living fighter (underground/held/airborne too), so setup
  and pause freeze it. `kill` clears it (death and the phoenix egg). Spawn resets it.
- `convert(i)`: mantis/millipede/spider `onRemove`, drop spider home, `stopMoves`, exit anthill,
  release grab/held links, move counts between types and sides once, bump `generation`, keep hp and
  harmful timers, snapshot size into `bulk`. No body, kill, heal or spawn. Chick → 0.8 visual size.
- `growth(i)` is the shared size factor (eats/swell/zombie bulk) for `effectiveRadius`, corpse size
  and rendering. Phoenix ring heal can no longer lower health above the def cap.
- Giant: `slam` state 1 wind-up 0.7 s → 2 swing 0.15 s → `smash` → 3 recovery 0.65 s. Aim point is
  fixed at the wind-up start (≤ 46 px toward the target, clamped to the page). `smash` hits every
  enemy within 85 px of the point, once, skipping held, thrown, leaping, pouncing and flying fighters;
  zero-distance falls back to giant→target, then facing. `stopMoves` cancels any slam state, so stun,
  charm, carry, throw, death and conversion leave no ghost hit. Impact visuals are a separate ring
  buffer (`qX/qY/qR/qLife`, 0.55 s).
- Zombies with no enemies at all wander in loose circles.

## Rendering (`render.ts`)

- Dashed target circle and cross under a committed swing; dust ring, cracks and puffs per impact.
- Giant body sprite with the club part animated through drag/raise/swing/rebound; lean back on the
  wind-up, squash on impact.
- Zombie lurch and limp; green pulse and stain while infected.

## App

- No change needed: Miscellaneous tab and Zombie brush come from `CATEGORIES`; varieties are
  `internal` (no brush) and appear in the tally as `Zombie <name>` with their tinted icon.

## Known limits

- A giant still targets fliers it cannot hit; nearby ground enemies in the 85 px area take the slam.
- Zombie varieties of fliers use the full tray drawing (body plus wing) as a static grounded sprite.
- A zombie Flapjack shows the full three-pancake stack regardless of layers lost before turning.

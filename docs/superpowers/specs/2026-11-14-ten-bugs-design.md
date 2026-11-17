# Ten more bugs

Date: 2026-11-14. The owner selected all ten from the pasted conversation and
asked Codex to continue Claude's implementation. Source and focused check scenes
are written. **Nothing has been run:** no tests, type checks, builds, lint,
verification commands or browser checks. Balance and appearance are unverified.

| Fighter | Key | Quirk field | How it works |
| --- | --- | --- | --- |
| Buzz Kill (bee) | `bee` | `sting: 6` | One 45-damage sting kills the bee. A surviving victim takes 4 every half second for six seconds, timed from delivery |
| Night Shift (bed bug) | `bedbug` | `sleeper` | Only targets stunned/stone, toppled, scrolling or sleeping enemies, including resting Bed Rot and watched gargoyles. Mere dizziness does not qualify |
| Forklift (Hercules beetle) | `hercules` | `flip: 1.2` | Every hit sets the victim's `downT`; no size limit |
| One Day (mayfly) | `mayfly` | `lifespan: 20` | Dies after twenty seconds of simulation time, including while stunned or carried |
| Twig (stick insect) | `twig` | `still` | Hidden below 8 px/s without a bush. Proximity cannot reveal it. Waits for an enemy to pass, then pursues within 80px and pokes from behind, with the existing double ambush hit |
| Renovation (termite) | `termite` | `wrecker: 5` | Targets only buildings; damage to them ×5 |
| Plus One (wasp) | `wasp` | `implant` | The first egg in a victim belongs to that wasp's side. Even a lethal sting implants before damage; two wasps hatch at the victim's final death |
| Trap Card (antlion) | `antlion` | `pit: 60` | Anchored at its pit. Grounded enemies within 60px are pulled inward; buildings, rooted fighters, riders and airborne fighters are spared |
| 17 Years (cicada) | `cicada` | `buried: 110` | A rooted, unreachable mound. The first mound starts a seventeen-second wait; later mounds join that cohort. They surface together and stun enemies within 110px for 1.5 seconds |
| All You Can Eat (locust) | `locust` | `graze` | Seeks bush/lawn stamps within 400px. Each meal removes one stamp and adds one allied locust; full pages leave the meal intact |

All numbers are initial implementation choices, not tested balance.

## Shared rules

Damage, teams, incapacitation and zombie conversion use the existing simulation.
Zombie twins retain the drawing and lose the quirk. Clear resets new timers,
hatch queues and cicada cohorts. Setup/pause freeze time.

Stingers and eggs reset on slot reuse. Wasp eggs survive temporary phoenix/roach
deaths; they hatch only at final death, even after the parent dies. Hatch records
keep their original position and side when the 4,000-fighter limit delays births.
They never attach to the new occupant of a recycled victim slot.

Antlions and buried cicadas cannot be pushed, thrown or kidnapped. Opposing
cicadas in one cohort are all above ground before any scream, so neither side
gets an advantage from fighter-slot order. Later cohorts start a fresh wait.

Terrain removal validates its index, preserves overlapping stamps and water,
refreshes affected hiding immediately, and updates the water cache when water is
removed. Locusts only eat bush stamps, including Touch Grass's lawn.

## Where the code is

- `src/game/bugs.ts`: timers, sting pulses, egg ownership and delayed hatching,
  selective targets, Twig attacks, cicada cohorts, pit pull and locust meals.
- `src/game/sim.ts`: shared damage/death hooks, hidden/target state, anchored
  fighters, generation handling, terrain removal and spatial-grid refresh.
- `src/game/mantises.ts`: rooted bugs cannot be kidnapped.
- `src/game/units.ts`: ten drawings before `ant`, ten quirk fields, ten roster entries before the zombie twins.
- `src/game/render.ts`: pit under the fighters, mound sprite for a buried cicada, scream ring, stinger and egg markers.
- `checks/bugs.check.ts`: original bug scenes plus unrun regressions for timers,
  rear attacks, sleeping/statue targets, revivals, full pages and terrain overlap.
- `docs/handoffs/2026-11-14-ten-bugs-continuation.md`: completion state and the
  commands requiring the owner's testing approval.

## Presentation

Mayflies use their fast flight until they drop; no separate ageing pose was
requested. Cicadas scream once, on surfacing. New art, effects and balance remain
unverified until the owner authorizes running the game and checks.

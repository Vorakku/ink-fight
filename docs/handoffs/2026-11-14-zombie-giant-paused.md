# Ink Fight handoff: Zombie and Giant — paused

Saved 2026-11-14, Asia/Phnom_Penh. The owner explicitly chose **Save and pause**
because they need to close their PC. Stop product work until they resume it.

## Workspace

Actual game checkout: `E:\Test\ink-fight`.
The session's original working directory points at an unrelated art project.

There are substantial existing uncommitted changes, including work that predates
this session. Preserve all of them. No commit, reset, checkout, cleanup, or merge
was requested. Do not treat the whole worktree diff as this pending feature.

## Authorized next task

Implement both approved designs:

- [Zombie infection](../superpowers/specs/2026-11-14-zombie-infection-design.md).
- [Giant club slam](../superpowers/specs/2026-11-14-giant-club-slam-design.md).

The owner approved both using: **Approve both — implement them.**
Implementation of these two features **has not started**. No zombie/giant code
exists from this task, and Miscellaneous has not been added to the roster yet.
The specs are concrete and a read-only builder review found no blocking gaps.
Do not repeat the process-choice or design-approval questions when resuming.

### Confirmed zombie decisions

- Add a **Miscellaneous** category with a paintable **Zombie**.
- Zombies roam, chase and bite; surviving bites infect living enemies.
- Infected creatures retain recognizable bodies but switch to **common zombie
  chase and infectious melee**, replacing their original special abilities.
  The owner explicitly selected this over retaining original abilities.
- Approved draft default: conversion after 2 seconds, joining the infecting side,
  with original current health and physical size preserved. No free heal, corpse
  resurrection, extra live unit or kill credit for conversion.
- Base Zombie and converted variants can spread infection. Buildings, vehicles,
  eggs, corpses and existing zombies are excluded. Previously infected ants can
  convert while underground; hiding is not a cure, so release occupancy safely.
- Use hidden, derived roster variants with only common zombie behavior, rather
  than leaving original bug/ability flags active. Only the seed Zombie is paintable.
- Clear old mantis, millipede, ant, spider, grabbing and corpse-reservation state
  before changing type/team/generation. Existing structures/resources stay on
  their old side. Already-fired projectiles keep their original side.

### Confirmed giant decisions

- Add **Giant** to **Mythical**, carrying a large club.
- A visible wind-up commits to a marked ground impact point, followed by one
  area hit and radial knockback, then recovery. Moving targets can dodge it.
- Approved defaults: spare allies and airborne/flying targets; damage anchored
  buildings without moving them. Respect existing defensive reactions.
- Proposed/approved starting numbers are in the spec (320 health, 0.7s wind-up,
  0.15s downward swing, 85px radius, 28 damage, 320 knockback, 2.2s impact interval).
- Interruptions cancel unlanded swings. Infection cancels the slam and produces
  a recognizable zombie giant with ordinary zombie melee instead.

## Process and verification rules

Ponytail remains mandatory, with **Superpowers** already selected for these tasks.
The next normal step is a concise implementation plan, then implementation without
another design approval. Use the saved specs as the requirements.

The owner's AGENTS.md overrides automatic TDD and verification:

> When a feature or fix is implemented, STOP and ask:
> "Done. Want me to verify (analyze / tests / run), or will you check it yourself?"

- Do not write tests or run analysis, type checking, lint, builds, test suites,
  the app or browser checks before asking after implementation.
- The owner has **not** authorized verification of this task or prior gameplay.
- Do not claim checks passed or visuals work. Source has been written, not run.

## Already written earlier in this session

- Sparklebutt: straight long-range rainbow, charge/turn animation and recoil.
- Ants: Bug category, 10/20/40/... colony thresholds, surviving builders entering
  anthills, offspring, corpse retention and cooperative hauling.
- Mozzie moved from Animals to Bug.
- Three new bugs implemented after their specs were approved:
  - Millipede rolls and four allies assemble into a car.
  - Mantis kidnaps an enemy into a ring with successive 1v1 challengers.
  - Spider shoots webs, pounces, builds nests and consumes five cocoons per birth.

Those additions are **unverified**. No tests were written or run, no lint/type
check/build ran, and no app/browser was launched. Existing check files include
older pre-session edits and an outdated close-range pegasus expectation; do not
silently claim that suite is current or passing.

The three-bug implementation record is
[three-bugs.md](../superpowers/plans/2026-11-14-three-bugs.md).

## Source map for resuming

- `src/game/units.ts`: roster, categories, cached Canvas drawings. Current flags
  include `bug`, `building`, `internal`, `prey`; append to preserve type indices.
- `src/game/sim.ts`: typed-array simulation, targeting/damage/slots, teams, body
  store, ant colonies, lifecycle hooks. `merge` handles four-to-car without deaths.
- `src/game/millipedes.ts`: rolling, four-member assembly and car movement.
- `src/game/mantises.ts`: capture/transport/ring/duel/handoff; generation-aware
  membership and hit/interrupt hooks.
- `src/game/spiders.ts`: web status, pouncing/clinging, home/nest, shared body
  claims, wrapping, cocoon stock and births.
- `src/game/render.ts`: animation and effects. `src/App.tsx`: category-driven
  tray/tally; internal units are hidden from paint brushes.
- `docs/style-guide.md` and `docs/neal-reference.md`: established visual rules.

Potential implementation organization considered but **not yet implemented**:
one focused zombie module and one giant attack module, with a shared safe
in-place conversion operation in Sim. Preserve effective growth/body size and
health cap when converting; generated variants must not copy old ability flags.
Decide exact field and renderer interfaces while writing the implementation plan.

## Resume point

Wait for the owner to resume. Then implement Zombie and Giant from these approved
specs. Once source work is complete, ask the exact verification question and stop.

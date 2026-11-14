# Ant Colonies Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task.

**Goal:** Add Bug ants whose surviving workers build reinforcing colonies at doubling population thresholds.

**Architecture:** Represent anthills as stationary, non-paintable roster units so existing teams, targeting and damage work. Track one unfinished site and a doubling requirement per side. Use existing spawn and Canvas sprite systems.

**Tech Stack:** TypeScript, React, Canvas 2D; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-14-ant-colonies-design.md` (owner approved).

## Global Constraints

- Builders survive. Each side needs 10, then 20, then 40, then 80 living ants.
- Workers gather and dig for 3 seconds; completed colonies spawn one ant every 4 seconds.
- One unfinished site per side; enemies can destroy colonies; destroyed colonies never refund thresholds.
- Clear resets everything; setup/pause freeze activity; respect the 4,000-fighter limit.
- Owner's verification rule overrides TDD: do not write tests or run checks before asking after implementation.
- Work inline in the existing checkout: the approved feature depends on its uncommitted team/gameplay work. Preserve all existing changes; do not stage or commit them.

## Review Focus

- Free-for-all offspring and anthills retain the ants' exact side.
- Dead, held, airborne or distracted workers do not advance digging.
- Destroyed sites release assignments before a slot is recycled.
- Colonies are immovable and cannot be swallowed, thrown or lured.
- Capacity delays site creation/production without losing workers or resetting progression.

### Task 1: Roster and presentation

**Files:** `src/game/units.ts`, `src/App.tsx`.

**Interfaces:** Add `ant?: boolean` and `colony?: boolean` to `UnitDef`, append Ant and Anthill definitions, and add Bug to `CATEGORIES`. Hide `colony` definitions from paint brushes. Keep roster indices stable by appending.

- [x] Draw an ant and an anthill using existing helpers and palette conventions.
- [x] Add small melee Ant stats and stationary, attackable Anthill stats.
- [x] Include bugs in animal X-ray drawing and keep anthills out of the tray.

### Task 2: Colony lifecycle

**Files:** `src/game/sim.ts`.

**Interfaces:** Expose `buildFor: Int32Array`, `colonyT: Float32Array`, `colonyWorkers: Int32Array`, `nextColony: Float32Array`. Export `COLONY_BUILD = 3`. Private `stepColonies()` manages side eligibility, site selection and assignment before the grid rebuild; `workColony(i: number): boolean` steers workers. Colonies produce via existing `spawn(type, x, y, side)`.

- [x] Reset arrays on spawn/Clear and release builder assignments when sites die.
- [x] Gather the required number of available same-side ants at dry, separated sites; wait when short of workers.
- [x] Advance digging only with all required workers nearby; double requirements only on completion.
- [x] Spawn one allied ant every 4 seconds, retaining exact side and waiting at capacity.
- [x] Keep buildings stationary through knockback, throws, grabs, crowd separation, attraction and water; retain ordinary damage and destruction.

### Task 3: Construction animation and documentation

**Files:** `src/game/render.ts`, `README.md`, `docs/style-guide.md`.

**Interfaces:** Consume Task 2 arrays; use roster sprites for completed colonies, scale unfinished mounds by `colonyT / COLONY_BUILD`, and animate assigned ants' digging with soil flecks and antennae movement.

- [x] Draw stable anthills, gathering/build counts, progressive mounds and digging workers.
- [x] Document the approved rules, timing, limits and unverified status.
- [ ] Stop and ask the owner's exact verification question.

### Deferred verification (requires owner authorization)

- Assert 9 ants do not build; 10 complete one hill and remain alive.
- Assert 19 cannot build a second; 20 can, then require 40; new offspring count.
- Assert team isolation, exact FFA side inheritance, interrupted workers, destroyed-site slot reuse and non-refunding thresholds.
- Assert immovable hills, dry placement, Clear, setup/pause and capacity waiting.
- Run the cheapest TypeScript/simulation checks authorized, then visual checks only if authorized.

## Execution ledger

### Extension steps

- [x] Add `inside`/`entryT` ant state; walk builders into doorways, hide occupants
  from combat/grid, and release them alive on completion or hill destruction.
- [x] Snapshot fallen enemies into a bounded body store independent of fighter
  slots, including their type, team, size, stage and appearance.
- [x] Assign two to eight free, friendly ants per body; approach grip positions,
  move the body only with the full crew present, and deliver to completed hills.
- [x] Drop bodies when crews or destinations are interrupted; clean references
  before reusing slots, and preserve exact team/FFA ownership.
- [x] Draw fallen poses, doorway entry/exit, hauling effort and disappearing
  deliveries; document behavior and stop before verification.

Extension ruling: the owner's follow-up authorizes entering and hauling, and the
delivery choice explicitly excludes bonus spawning. Keep the existing approved
timing and population rules. Verification remains deferred by AGENTS.md.

Extension code and documentation are written. No tests were written or run, no
analysis/build/browser checks were performed, and no app was launched. When
authorized, cover inside-worker targeting and counts, completion/destruction
release, corpse snapshots after slot reuse, team-specific two-to-eight-ant crews,
carrier loss, destination reuse, delivery without production bonuses, Clear,
pause, and the 4,000-body cap.

- Ruling: execute inline following the owner's explicit "Approve — build it" instruction; no further process approval is needed.
- Ruling: retain the existing checkout and defer test writing, execution and final review under the owner's hard verification boundary.
- Pre-flight: Task 3 consumes Task 2's named public arrays; Task 2 consumes Task 1's ant/colony flags and appended roster definitions.
- Task 1: code written, verification deferred.
- Task 2: code written, verification deferred.
- Task 3: code and documentation written, verification deferred.
- Ruling: anthills remain ordinary damage targets but ignore movement/distraction statuses; fire and cloud damage still apply.
- Status: implementation written; no tests written, checks run, or app launched. Await the owner's post-implementation verification choice.

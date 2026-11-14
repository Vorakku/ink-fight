# Three Bugs Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the independent files below. The root agent integrates the simulation and spider behavior.

**Goal:** Implement the approved millipede car, praying-mantis gauntlet and spider nest/cocoon lifecycle.

**Architecture:** Keep the roster/sprites and core simulation intact. Put each substantial new behavior in a focused module accepting `Sim`; expose existing simulation operations needed by those modules, rather than copying targeting/damage/corpse handling. The three modules hold their own bounded per-fighter state and provide explicit lifecycle hooks.

**Tech Stack:** TypeScript, React and Canvas 2D; no new dependencies.

**Specs:** `../specs/2026-11-14-millipede-car-design.md`, `../specs/2026-11-14-praying-mantis-duels-design.md`, `../specs/2026-11-14-spider-web-nests-design.md`.

## Global constraints

- The owner's "start implementing for all of the three new bugs" approves proceeding with the three drafted designs and their stated defaults.
- Preserve existing uncommitted changes. Work in this checkout because the features build on its uncommitted teams, ants, corpse store and rainbow behavior. Do not stage, commit, move or delete unrelated work.
- Owner's AGENTS.md overrides TDD/review automation: do not write tests, run analyze/type-check/lint/build/test commands or launch apps before asking after implementation. Defer verification and independent code review to that permission boundary.
- No new dependencies. Keep exact team identities, generations, 4,000-unit/body capacities and pause/setup/Clear behavior.

## Shared interfaces (root owns `sim.ts`)

- UnitDef gains `bug?: 'millipede' | 'car' | 'mantis' | 'spider' | 'nest'`, `building?: boolean`, `internal?: boolean`, `prey?: boolean`, and `'web'` in `projectile`.
- Mark anthills building/internal, car internal with `prey: false`, and spider nests building/internal. Append new roster entries, preserving indices.
- `Sim` exposes existing `generation`, `abilityCd`, `focus`, `focusGen`, and existing operations `attack`, `hit`, `damage`, `findTarget`, `stopMoves`, `sweep`, `toss`, `lockOn`, `focusAlive`, `dropBody` to feature modules. Existing method semantics remain; `damage` accepts optional attacker slot for duel attribution.
- Root adds `canAct(i: number): boolean` for alive, free, uncontrolled fighters and `effectiveRadius(i: number): number` for size/growth-aware capture checks.
- Root adds `merge(members: number[], type: number): number`: exactly four same-side millipedes transform without deaths or corpses; resulting fighter retains summed remaining health and maximum harmful timers/cooldowns. Returns new slot or -1 without changing invalid groups.
- Modules may import `DT` and `type Sim` from `sim.ts`; do not read runtime Sim exports at module initialization. Allocate bounded state from `s.x.length` in constructors. Use erasable TypeScript: no enums or parameter properties.
- `sim.millipedes: Millipedes`, `sim.mantises: MantisDuels`, `sim.spiders: Spiders` are created after core arrays.
- Feature hooks: `reset()`, `onSpawn(i)`, `onRemove(i)`, `interrupt(i)`, `step()` and `steer(i, t): boolean`. `step` runs before the fresh grid and handles lifecycle/grouping; `steer` runs after status/target selection. True means the feature controlled that fighter this tick.
- Mantis additionally exposes `onHit(i, by)`, `opponent(i): number`, `canTarget(i, j): boolean`, and `resize()`. `onRemove` runs on real death/rebirth before core `stopMoves`; it must clean membership so subsequent interrupt is harmless. Active-duel internal status effects remain normal combat; outside-hit hooks cancel or release the affected participant.
- Root routes role-controlled mantis transport/waiting before native grab shaking; active duel pairs return false from steer and use native combat with forced opponents. Root routes millipede/spider steering after normal lure/fear/blind handling.
- Shared corpses gain `cSpider: Int32Array` (-1 free), `cGeneration: Uint32Array`. Spider claims do not set anthill-only `cHome`; ants skip spider-claimed bodies. `dropBody` releases both collector types. Spider module exposes `releaseBody(k)` for cleanup without recursive `dropBody` calls and `afterStep()` for cargo/mounted following.

## Task 1: Roster and visuals (single agent owns these files)

**Files:** `src/game/units.ts`, `src/game/render.ts`, `src/App.tsx`.

- [x] Append all three Bug fighters and internal car/nest, set flags, add clear doodle sprites, preserve existing artists' work.
- [x] Hide internal brushes. Classify current biological Animals/Bug/Water/Mythical as prey explicitly; future undefined prey must not automatically include mechanical units.
- [x] Animate curl/rolling wheels, car suspension and assembly; show mantis carry/duel circle/bow/queue; render spider web, pounce, nest construction, hauling, wrapping, five cocoons and birth.
- [x] Consume module fields below; coordinate with behavior owners if exact scene structures need clarification.

Visual fields: Millipedes `curlT`, `group`, `assemblyT`, `heading`, `wheelPhase`; MantisDuels `member`, `role`, `scenes` (public scene center/radius/state/member/captive/challenger information); Spiders `home`, `nestT`, `cocoons`, `birthT`, `webT`, `windT`, `jumpT`, `mount`, `clingT`, `wrapT`, `body`, `weaving`.

## Task 2: Millipede behavior (single agent owns module)

**File:** create `src/game/millipedes.ts` exporting `Millipedes`.

- [x] Spawn curl, continuous rolling, broad steering, timed enemy-only ramming and edge bounces.
- [x] Reserve exact groups of four per side; meet/assemble; release interrupted groups; support multiple cars and leftovers.
- [x] Use root `merge` for safe, non-healing transformation; maintain wheel/assembly animation state. Cars stay wrecked on death.

## Task 3: Mantis encounters (single agent owns module)

**File:** create `src/game/mantises.ts` exporting `MantisDuels`.

- [x] Reserve 4-6 nearby allies, validate prey, choose dry fitting ring, clamp and visibly carry.
- [x] Form ring, bow, native-combat 1v1, advance exactly once after challenger death; preserve health/status/ability history.
- [x] Handle external interference, escape, transport/control failure, unavailable spectators, timeout, simultaneous deaths, generation reuse, resize and release.
- [x] Expose lifecycle/hit/target hooks and public scene state to root/visual agent. Do not run commands that verify code.

## Task 4: Spiders and integration (root)

**Files:** create `src/game/spiders.ts`; modify `src/game/sim.ts`.

- [x] Web projectile hit signal, ranged/pounce/cling/melee choice and interrupted release.
- [x] Adopt/build safe shared friendly nest, one builder, persistent partial construction, stable homes.
- [x] Retain eligible animal bodies with spiders alone; share exclusive body claims with ants; drag/wrap once.
- [x] Per-nest cocoon stock and exactly-five cost, animated birth, orphan nest behavior, capacity/exit waiting and destruction cleanup.
- [x] Wire module hooks into spawn, Clear, resize, targeting, direct/status damage, throwing, steering, movement, corpses and building physics.

## Review focus for later authorized checks

- Recycled fighter and body slots never revive old links.
- No four-to-car free health, false deaths, mixed-side merges or copied status cures.
- Mantis spectators never damage captive and internal control effects do not incorrectly cancel duels.
- Spider reproduction works without ants and never duplicates a claimed body or spends five cocoons without a child.
- Clear, pause, wet/small pages, casualties and full capacities release or wait safely.

## Ledger

- Ruling: user approved implementation of all three specs; continue without another process/plan approval.
- Ruling: isolated file ownership allows independent agent implementation. Root handles every shared simulation edit; agents do not edit `sim.ts`.
- Ruling: write no tests and perform no automated verification or final code-review pass before the owner's required question. Mark results unverified.
- Pre-flight: all tasks consume the named UnitDef flags; Task 1 consumes behavior fields; behavior tasks consume root methods. Root owns all cross-module glue.
- Task 1: roster/visual source written by bug_visuals; unverified.
- Task 2: millipede module written by millipede_behavior; unverified.
- Task 3: mantis module written by mantis_behavior; unverified.
- Task 4: spider module/shared integration written by root; unverified.
- Integration rulings: keep generation-aware exclusive body claims, allow spider combat abilities inside mantis duels, use one wrapping position per nest, and retain full cocoon stock until a successful capacity-safe birth.
- Status: implementation and documentation written. No tests were written, no automated checks/review pass was run, and no app/browser was launched. Stop here for the owner's verification choice.

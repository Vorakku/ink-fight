# Lui Feng Carnage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved mounted Carnage skill, with enemy-group circling, historical afterimages and pulsed ink slashes.

**Architecture:** Follow the current Fighter/Battle skill pattern and reuse the mounted move, shared hit and ink brush drawing paths.
Cache galloping raised-arm and monochrome ghost frames with Lui Feng's other sprites. Store visual snapshots independently of the caster.

**Tech Stack:** Existing TypeScript, Canvas 2D and sprite caches. No dependencies.

**Spec:** `docs/superpowers/specs/2026-11-21-lui-feng-carnage-design.md`, approved by the user's instruction to implement.

## Global Constraints

- Work in the current V2 checkout, preserving all preceding uncommitted visual changes; do not stage or commit.
- Do not write tests, analyze, build, run checks or launch the app before the owner's verification approval.
- Three-second run, nominal 100 px orbit, approximately 2.5 laps, 18-second independent cooldown.
- At most twelve 20-damage pulses at 0.25-second intervals, 110 px reach and 60 knockback.
- One successful finisher: 50 damage, 140 px reach, 220 knockback; normal Enhance power applies.
- Afterimages every 0.06 seconds, lasting 0.3 seconds. Visual snapshots never deal damage.
- Existing skills are mutually exclusive with Carnage; no invulnerability or friendly fire.

## Review Focus

- Cramped arenas and corner groups: bounded continuous entry rather than snapping onto a circle.
- Death, control effects and zombie conversion: discard active state before another movement mode takes over.
- Floating-point timing: twelve pulse slots and one finisher, without a same-tick normal attack.
- Scattering or dead original targets: finish the fixed-center run without chasing a missing reference.
- Afterimage/trail cleanup and body depth: short-lived snapshots retain their old position and do not hide the rider.

Review and executable checks are deferred until the owner approves verification, including checks for each item above.

### Task 1: Carnage simulation and lifecycle

**Files:** Modify `src/game/luifeng.ts` and `src/game/battle.ts`.

**Interfaces:** Export `LUI_CARNAGE` tuning constants. Add `Fighter.luiCarnage: LuiCarnage | null` and
`Fighter.luiCarnageCooldown: number`; Battle owns `luiGhosts` and `luiCarnageSlashes` snapshots.

- [x] Add constants and simulation state, initialized at spawn and cleared by reset/zombie/death/control paths.
- [x] Implement `tryLuiCarnage(fighter: Fighter, target: Fighter | null): boolean` to select a two-enemy group,
      average its center and fit its orbit to the arena without moving the rider instantly.
- [x] Implement `stepLuiCarnage(fighter: Fighter): boolean` using ordinary smoothed mounted movement and
      constant tangential speed with radial correction; water/chill and Enhance modifiers remain effective.
- [x] Implement `luiCarnageHit(owner: Fighter, finish: boolean): void` for shared targeting/damage and historical
      slash snapshots; count pulse slots in the active state and consume the full successful cast once.
- [x] Dispatch Enhance, Carnage, Charge in that order and prevent overlaps; expire visual records independently.

### Task 2: Mounted spin, ghost art and ink rendering

**Files:** Modify `src/game/luifeng.ts` and `src/game/battle.ts`. `units.ts` already infers Lui Feng's pose type.

**Interfaces:** `buildLuiFengPoses` gains `carnage` and `ghost` frame arrays. Add
`drawLuiCarnageSlash(c: C, x: number, y: number, radius: number, facing: number, time: number, finish: boolean): void`.

- [x] Cache eight galloping raised-arm frames and matching monochrome silhouettes with pale brush accents.
- [x] Record frame, spear rotation, facing, size and position when a ghost is emitted; render it behind live fighters.
- [x] Pick the galloping raised-arm pose while active and reuse `drawLuiSpin` for the fast live overhead spear.
- [x] Draw pulse and finisher trails from their recorded positions using the existing `inkBrushArc`; layer them
      below live bodies so black brushwork remains readable without obscuring the rider.
- [x] Update this execution record, then stop and ask the owner's exact verification question.

## Execution record

- Native execution: these two tasks share the same skill state and renderer, so implement them inline.
- Ruling: stay in the current V2 checkout. Carnage depends on this session's uncommitted visual work; do not
  copy, stash, isolate or commit that work just to satisfy a process default.
- Ruling: the user's explicit implementation instruction authorizes execution of the approved design without
  another plan-handoff approval. Test writing, all executable verification and final review remain deferred.
- Pre-flight: Task 2 consumes Task 1's constants, active state and snapshot records; names are fixed above.
- Ruling: the zombie restriction applies to the caster. Enemy zombies remain valid victims under normal targeting rules.
- Implementation: simulation, lifecycle, cached art and renderer connected. `units.ts` needed no edit because its pose type is inferred.
- Deferred with verification: existing normal-sweep check fixtures contain two enemies and will need Carnage's
  independent cooldown held during those isolated checks; add Carnage-specific coverage only with permission.
- Status: implemented, awaiting the owner's verification decision. No tests written, checks run, final code
  review performed or game launched. Gameplay balance, orbit quality and visual acceptance remain unverified.

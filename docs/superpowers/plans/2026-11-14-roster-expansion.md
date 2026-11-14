# Roster expansion implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline. The owner's
> explicit no-testing rule overrides all automatic execution/verification steps.

**Goal:** Add the 17 fighters from the roster expansion spec with visible combat gags.

**Architecture:** Add optional quirks to `UnitDef` and state arrays to `Sim`.
Reuse the projectile pool, hit handling, grid scans and cached Canvas sprites.

**Tech stack:** Existing React, TypeScript and Canvas 2D; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-14-roster-expansion-design.md`

## Global constraints

- Do not run tests, builds, linters, type checkers or verification commands.
- Original sprites and names; fixed arrays and no per-tick object allocations.
- Preserve old fighter indices; reset new state in `spawn()`.
- Use the existing checkout; leave changes available for the owner's review.

## Review focus

- A long-range fish must acquire a target beyond the old 160px search.
- Knockback, separation and resize must keep water-bound units wet.
- Dead/reused targets must not receive delayed dash/leap/brawl damage.
- Interrupted jumps/brawls must not leave either fighter stuck.
- All People/Animals buttons must remain reachable on a phone.

## Tasks

- [x] Add drawings and definitions in `src/game/units.ts`, including projectile
  shapes and cached silhouette-clipped X-ray overlays.
- [x] Extend `src/game/sim.ts`: range-aware targeting, confined water movement,
  burst shots, regeneration, orbiting, dash/fear, spin/pulse, leap and cat brawl.
  Reset state on spawn and guard delayed targets with slot generations.
- [x] Extend `src/game/render.ts`: shaped projectiles, charge/sweat, spins,
  jump shadows and landing rings, cheese stretch, brawl paws and X-ray effects.
- [x] Keep the enlarged tray reachable in `src/index.css`; update water and
  keyboard hints in `src/App.tsx`.
- [x] Add focused assert-based regression scenes to `checks/sim.check.ts`
  without executing them. Update docs with the new roster and pending checks.
- [ ] Request the owner's permission to test. Leave all execution checks pending.

## Execution notes

The owner's sleeping note delegates naming and routine implementation decisions;
no design/approach confirmation is requested. The original docs' instruction to
start by building is superseded by the owner's explicit testing instruction.

Source review found and prompted fixes for out-of-bounds swimmer origins after
resize, jumps continuing after target replacement, and orbit/retreat bypassing
slow/wading modifiers. Regression scenes were added for all three; none were run.
The separate reviewer made no other concrete findings. Visual quality, responsive
rendering, balance and execution checks remain pending owner authorization.

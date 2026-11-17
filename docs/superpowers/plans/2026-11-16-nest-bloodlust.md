# Nest Collision and Bloodlust Implementation Plan

> Execute inline in the existing checkout. Preserve current changes; do not commit.

**Goal:** Make dragon nests passable and add a low-health black T-Rex help call.

**Architecture:** Change the shared nest separation/render paths. Reuse roar,
Fighter references, spawn limits and derived stats for a single lifetime call.

**Tech Stack:** Existing TypeScript and Canvas; no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-nest-bloodlust-design.md`

- [x] Remove nest separation for all sides, ignore nest spawn blocking, and move
  the nest render pass beneath remains and all other actors/effects.
- [x] Add bloodlust constants, call/used/pending fields, derived health-threshold
  boosts, priority/cancellation and three allied helper spawns with retries.
- [x] Add call/aura visuals, death/conversion/Clear cleanup and README behavior.
- [x] Write unrun checks for nest pass-through, health thresholds,
  call sequencing, one-time summons, FFA, blocked/full spawn limits and cleanup.
- [ ] Ask whether to test. Run nothing without the owner's explicit approval.

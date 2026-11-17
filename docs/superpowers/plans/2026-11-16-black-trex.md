# Black T-Rex Implementation Plan

> Execute inline in the existing checkout. Preserve unrelated work; do not commit.

**Goal:** Add the 100-kill armored form, wall ram, and charged leg stomp.

**Architecture:** Extend existing T-Rex counters and cached art. Reuse heldBy,
kill attribution, clamping, groundSmash, impact effects and lifecycle cleanup.

**Tech Stack:** Existing TypeScript and Canvas, without dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-black-trex-design.md`

- [x] Add black/stomp/ram constants, indexed form palettes and raised-leg artwork;
  cache black variants alongside alpha, preserving corpse and zombie appearance.
- [x] Add kill counting and shared enemy damage reduction, including DoTs;
  preserve alpha power and capped size for black even without 50 meals.
- [x] Implement stomp windup, ram acquisition/carry/wall pin and cooldowns;
  integrate action ordering, held-victim validation and interruption cleanup.
- [x] Render grounded ram victims, black variants, raised feet and dust effects.
- [x] Write unrun checks for thresholds, armor, AoE, ram hit/miss/wall/release,
  interruption, reset and source attribution. Update README.
- [ ] Ask whether to test; run nothing without approval.

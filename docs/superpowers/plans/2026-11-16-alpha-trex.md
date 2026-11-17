# Alpha T-Rex Implementation Plan

> Execute inline in the current checkout. Preserve existing work; do not commit.

**Goal:** Add capped feeding growth, healing, the 50-meal albino alpha and bleeding.

**Architecture:** Share corpse claims and feeding with dragons; use existing
nutrition rewards and reference-based kill attribution. Cache alpha sprite parts.

**Tech Stack:** Existing TypeScript and Canvas, without dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-alpha-trex-design.md`

- [x] Add feeding/alpha constants and albino red-eyed sprite parts in `rex.ts`;
  cache complete, shocked, zombie and separated alpha sprites in `units.ts`.
- [x] Extend Fighter state, effective stats, kill claims and feeding rewards;
  keep all bite, shake and held-target offsets consistent with current size.
- [x] Add attributed, non-stacking bleed and cleanup; show feeding, alpha and
  small bleed visuals in live fighters, held victims and fallen bodies.
- [x] Write unrun checks for 49/50 meals, single rewards, capped growth, combat
  priority, bleed kills/expiry/allies/buildings and cleanup; update README.
- [ ] Ask whether to test. Run nothing without the owner's testing approval.

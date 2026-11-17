# Spartan Formations Implementation Plan

**Goal:** Add the owner's approved Wall/Wedge/Circle behavior to nearby Spartan squads.

**Architecture:** Keep squad decisions, slot geometry and ground labels in
`src/game/spartan-formations.ts`. Reuse existing battle movement, damage, skill
cooldowns, conversion and death handling. Cache one additional guarding sprite.

**Spec:** `docs/superpowers/specs/2026-11-16-spartan-formations-design.md`

- [x] Add tactical tuning, local squad membership, stable slots and timed choices.
- [x] Implement wall, wedge and circle geometry with fire spacing and edge clamping.
- [x] Integrate formation movement, reach, frontal shields and staggered bashes.
- [x] Respect control effects, domain priorities, death, conversion and Clear.
- [x] Add raised shields, formation labels and README behavior notes.
- [x] Write unrun checks for decisions, positioning, bonuses and lifecycle.
- [ ] Ask the owner before running any tests or other verification.

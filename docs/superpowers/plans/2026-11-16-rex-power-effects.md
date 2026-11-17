# T-Rex Power Effects Implementation Plan

> Execute inline in the existing checkout; preserve current changes and do not commit.

**Goal:** Strengthen bloodlust presentation and add terror plus aimed impact throws.

**Architecture:** Reuse aura drawing, fear/stun, existing grab/throw references and
impact effects. Add optional aimed-flight metadata, preserving normal throws.

**Tech Stack:** Existing TypeScript and Canvas, no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-rex-power-effects-design.md`

- [x] Add terror/throw constants and trigger the scream crowd control once at the call climax.
- [x] Choose black throw landing points, support larger grabs, interpolate aimed
  flights and apply enemy-only impact damage, knockback and stun with attribution.
- [x] Enhance aura energy, sparks, lightning/dust and show aimed landing markers
  and the higher throw arc; preserve pause behavior.
- [x] Add unrun checks for scream exclusions/fleeing, aimed impacts, allies,
  armor, conversion, death/Clear and ordinary throw compatibility; update README.
- [ ] Ask whether to test. Run nothing without approval.

# Phoenix Evolution Implementation Plan

**Goal:** Buff Encore with fire resistance and kill-based adult/legend forms.

**Architecture:** Extend the existing Phoenix flight, ground-fire and final-kill
paths in battle.ts. Keep form stats and Canvas drawing in phoenix.ts and cache
form sprites in units.ts. No new dependencies or ability framework.

**Spec:** docs/superpowers/specs/2026-11-16-phoenix-evolution-design.md

## Single integrated change

- [x] Add form stats, resistance, barrage/Encore tuning and sleek evolved artwork.
- [x] Credit final kills from direct attacks and burns; preserve progress on rebirth.
- [x] Extend flight to eight projectile mortar shots and three line sweeps.
- [x] Share fire damage rules and prevent overlapping owned fires stacking damage.
- [x] Cache and display evolved forms, projectile arcs, targeting marks and names.
- [x] Write checks for thresholds, fire versus other damage, projectiles, line sweeps,
  allies, interruption, rebirth, conversion and clear.
- [ ] Ask the owner before executing checks, builds or any verification commands.

## Review focus

Temporary rebirth and buildings must not farm kills. Fire resistance must not
reduce ice, lightning, bites or bleed. Rebirth must retain form progress without
granting extra lives. Sweeps must hit each enemy at most once per pass. Existing
ground-fire protections and converted-owner cleanup must cover the new moves.

# Five Mythicals Implementation Plan

> Implement inline with superpowers:executing-plans; the owner's testing restriction overrides automatic checks.

**Goal:** Add the five specified mythical creatures and visible behaviours.
**Architecture:** Extend the existing quirk fields, typed arrays and sprite pieces.
**Tech stack:** TypeScript and Canvas 2D, no dependencies.
**Spec:** `docs/superpowers/specs/2026-11-14-five-mythicals-design.md`.

## Constraints and review focus

Keep current roster entries. Respect teams, incapacitation, generation checks and
projectile ownership. Statue protection covers direct hits and damage over time.
Head growth never reverses through healing; bites cannot multiply on one victim.
Changing form never heals or clears status effects. No checks may run unapproved.

- [x] Add five drawings and definitions to `src/game/units.ts`, including head pieces and wolf alternate art.
- [x] Implement observation, head growth and distinct bites, thrown-object pursuit, fire-sensitive regeneration and form cycling in `src/game/sim.ts`.
- [x] Show statues, independent heads, chase reactions, healing and transformation in `src/game/render.ts`.
- [x] Write unrun scenes in `checks/mythicals.check.ts` and document the roster in README.
- [ ] Ask the owner whether to test and build the additions.

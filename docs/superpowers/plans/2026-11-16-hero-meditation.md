# Hero Meditation Implementation Plan

**Goal:** All three Hero characters heal while resting; Thor raises his hammer and summons healing lightning with battlefield shake.

**Architecture:** Extend the existing meditation state and idle healing path to Thor. Reuse cached sprites, lightning shots, impact rings and tick-based animation. Sword Saint retains fishing and Mei retains her existing meditation.

**Tech Stack:** TypeScript and Canvas 2D; no dependencies.

## Constraints

- Work in the existing checkout without commits.
- Do not execute tests, builds, linters, type checks, previews or verification commands without the owner's permission.
- Healing requires no target or disabling effect. Damage interrupts meditation; death, conversion and Clear remove it.

## Implementation

- [x] Add focused behavioral checks for healing only on release, repeated capped healing, combat/control interruption, hammer ownership, tower rest, and existing Hero healing.
- [x] Extend `battle.ts` idle meditation to Thor: a two-second windup heals 120 HP, creates a harmless sky-to-hammer lightning shot and a blue ground ring. Permit rest on a settled tower when no enemies are detected.
- [x] Add a cached raised-hammer pose in `thor.ts` and `units.ts`; render blue meditation energy and growing charge sparks.
- [x] Extend existing battlefield shake to Thor's charge and strike; pass the same displacement to `water.ts` so terrain and fighters move together.
- [x] Document the new Hero behavior in `README.md`.
- [ ] Ask the owner whether to run the focused checks and build; leave all verification pending until approved.

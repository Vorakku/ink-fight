# Dragon Evolution Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session.

**Goal:** Implement the approved five-stage dragon family and personal lairs.

**Architecture:** A typed-array `Dragons` subsystem owns tier, home, rest, molt,
special cooldowns and eggs. Reuse the shared projectile, damage, meal, building
and lightning systems. Cache stage art in `units.ts` and render from these arrays.

**Tech Stack:** TypeScript, React, Canvas 2D; no new dependencies.

**Spec:** ../specs/2026-11-14-dragon-evolution-design.md

## Global constraints

Use the current checkout and preserve unrelated work. The owner's AGENTS.md
prohibits all tests, builds, lint, type checks and verification commands until
asked after implementation. Write focused scenes and leave them unrun.

## Review focus

Generation-safe homes and delayed attack owners; enemy-only damage; interruption
of sleep/molt/dive/beam; exact egg budgets and sides; intact eggs when the page or
exit is full; cave destruction and parent death; newborn growth and resets.

## Tasks

- [x] Add dragon/cave/egg definitions and original cached stage art.
- [x] Implement the dragon lifecycle, lairs, resting and four special attacks.
- [x] Integrate simulation ownership, growth, interruption and shared projectiles.
- [x] Render evolution, sleep, flight, cave upgrades, eggs and attacks.
- [x] Add unrun regression scenes and update documentation/tooltips.
- [ ] Ask the owner whether to test.

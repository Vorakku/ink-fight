# Inkfight

Scribble armies of silly fighters onto a notebook page and watch them brawl.

- `npm run dev` to play
- `npm run check` runs the simulation self-check

Game code is in `src/game`: `units.ts` (fighters and their drawings), `sim.ts` (simulation), `render.ts` (canvas drawing), `water.ts` (ponds).

Before adding a fighter, terrain or effect, read [docs/neal-reference.md](docs/neal-reference.md): how Battle Draw (our inspiration) looks and feels, and what we still do differently.

The [2026-11-14 roster expansion](docs/superpowers/specs/2026-11-14-roster-expansion-design.md)
adds five foods, five people, centaurs, an archerfish, a jellyfish, a ninja, a samurai,
a capybara and a cat. New swimmers stay in water and bring a small puddle when
placed on dry paper. The fighter tray scrolls when it cannot fit the whole roster.

This expansion and its new simulation check scenes have not been run. Ask the
owner before running tests, builds, lint, type checking or browser checks.

# Restore Ant in V2

> Execute inline in the existing checkout; preserve the ongoing V2 migration.

**Goal:** Restore the original Ant artwork, melee combat, colony construction and
body hauling in V2.

**Architecture:** Add Ant and internal Anthill definitions to the existing roster.
Use Fighter references for workers and homes, and the existing fallen-prey store
for bodies, so there are no recycled numeric slots or duplicate corpse stores.

**Tech stack:** Existing TypeScript, React and Canvas; no dependencies.

**Spec:** Original approved ant-colonies design in Git at
`HEAD:docs/superpowers/specs/2026-11-14-ant-colonies-design.md`.

## Constraints and decisions

- Keep the V2 300-fighter limit, existing checkout and current local changes.
- Ten living same-side ants build first, then 20, 40, 80; builders survive.
- Gather, enter the doorway, dig for three seconds, and release workers.
- Completed, attackable, stationary hills produce one ant every four seconds.
- Construction takes priority over hauling. Two to eight ants carry enemy bodies;
  deliveries disappear without changing production or adding a food system.
- Keep dragon feeding exclusive with hauling; do not create phoenix rebirth bodies.
- Setup/pause freeze the battle; Clear removes homes, assignments and thresholds.
- Defer tests, builds, linters, type checking and verification until requested,
  following the owner's AGENTS.md. Do not commit or stage existing changes.

## Implementation

- Restore the original ant/hill drawings in `src/game/ant.ts`; add roster entries,
  a paintable character list, Ant shortcut 0, and both population counts.
- Add construction, production, worker shelter and hauling to `battle.ts`; handle
  death, conversion, interruptions, rooted hills, capacity and team/FFA ownership.
- Draw rising hills, entering workers, digging dirt and carried bodies. Document
  the restored behavior and ask whether the owner wants it tested.

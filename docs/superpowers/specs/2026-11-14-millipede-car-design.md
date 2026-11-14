# Rolling millipedes and the four-bug car

## Intent

Add a millipede to **Bug**. On spawning it curls into a circle and rolls around
knocking enemies over. Four millipedes become a silly car that runs enemies over.
The comedy should be visible in their movement and transformation.

## Approach

Use four visibly curled millipedes as the wheels of one combined car fighter.
Reuse the existing rolling knockback, roster/sprite, team, damage and corpse
systems. Coordinating four independently colliding fighters as a permanent car
formation would add fragile steering without improving the requested behavior.
These are proposed implementation choices for owner review.

## Proposed rules

- **Millipede** is paintable in Bug. It briefly curls up after spawning, then rolls
  continuously, seeks enemies with broad turns, and bounces off page edges. With
  no enemy, it keeps rolling around rather than standing still.
- Its segmented body, many tiny feet, spiral shape and dizzy determination read
  clearly at the existing fighter scale. Show a visible curl, rotating segments,
  and small motion strokes. Follow the existing doodle style.
- Groups of four living, available millipedes on the same side automatically
  meet up, even if initially placed apart. Millipedes being carried, airborne,
  stunned or otherwise distracted cannot assemble until available again.
- The four roll to a meeting point and do a short assembly shimmy. If a member
  dies or becomes unavailable before assembly finishes, cancel the group safely;
  the remaining millipedes keep rolling and can regroup.
- Completion replaces exactly four millipedes with one car. This is a
  transformation, so it creates no dead bodies or kill credit. Eight millipedes
  can make two cars; leftovers keep rolling.
- The car has four millipede wheels, a wonky little chassis, a determined face,
  animated wheels, suspension wobble and modest dust. It steers toward enemies,
  bounces off edges and rams what it touches. No paintable car brush.
- The car starts with the four contributors' combined remaining health, never
  a free heal. Existing harmful effects are retained rather than cured by
  assembly. It is faster and heavier than a lone millipede, with stronger damage
  and knockback, but contact damage is timed rather than applied every frame.
- Both forms damage enemies, following existing teams. They do not damage
  allies. In free-for-all the car retains the original millipedes' exact side.
- A destroyed car stays destroyed: it does not respawn four fresh millipedes.
  With enemy ants present, its wreck can use the existing body-hauling behavior.
- Clear removes pending assemblies and cars. Setup and pause freeze curling,
  rolling, assembly, and combat. Preserve the existing fighter limit.

Stats, curl/assembly duration, turning speed, meeting-point selection, and art
details are builder choices. Proposed starting timings are a 0.35s curl, 0.6s
assembly, and at least 0.35s between contact attacks. Adjusting balance later
requires actual gameplay verification.

## Scope and constraints

Update `units.ts` for sprites/roster, `sim.ts` for rolling, grouping and safe
transformation, `render.ts` for curling/wheels/assembly, and `App.tsx` for hiding
the car brush. Update README and the style guide. No dependencies or unrelated
refactors. Preserve all current uncommitted ant, team, and rainbow work.

## Verification

The owner's AGENTS.md requires asking after implementation before writing tests
or running analysis, builds, tests, or the app. Defer those checks. Once
authorized, cover one-to-three rollers, exact four/eight grouping, interrupted
assembly, health/status preservation, free-for-all ownership, wall bounces,
timed enemy-only contact damage, corpse compatibility, capacity, and Clear.

## Approval

The owner authorized implementation of all three new bugs on 2026-11-14. The
millipede/car source is written using this design. No tests were written or run,
no analysis/build checks were run, and the game has not been launched for it.

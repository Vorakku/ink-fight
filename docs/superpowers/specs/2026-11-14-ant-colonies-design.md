# Ants and colonies

## Intent

Add a small ant army that builds its own reinforcements. Ants belong in a new **Bug**
category. The owner specified colony requirements of 10, 20, 40, 80, and so on, and
confirmed that builders stay alive and available after construction.

## Approaches

- **Visible construction (recommended):** eligible friendly ants gather at a site,
  dig, and raise an anthill. This makes the source of reinforcements clear.
- **Instant population unlock:** create a colony immediately when the ant count
  reaches a threshold. Less code, but hides the building behavior.

The proposed implementation uses visible construction and the existing fighter,
sprite, damage, team, and spawning systems. It needs no new dependency.

## Proposed behavior

- The Bug tray offers **Ant**. Existing fighters keep their categories.
- Ants are small, six-legged melee fighters with antennae and an industrious walk.
- Requirements are tracked separately for each side. Ten living ants unlock that
  side's first build; subsequent builds need 20, 40, 80, etc. living ants total.
  These are population thresholds, not an additional 20 or 40 workers purchased.
- One construction site per side at a time. Once eligible, the required number of
  available ants gathers at a nearby dry site, then digs together for 3 seconds.
  Other ants keep fighting. Builders temporarily prioritize construction.
- Workers stay alive and return to fighting after completion. A lost worker or
  interrupted worker cannot contribute; construction waits for enough available
  workers again. Enemy ants never help each other.
- The completed colony is a stationary, attackable anthill. It produces one allied
  ant every 4 seconds, even if no enemy is present. New ants count toward the next
  colony and can become builders.
- Each completed build doubles the next requirement. Destroying a colony does not
  reduce that requirement. Clear resets colonies and requirements.
- Colonies appear through construction, not a paintable colony brush. They retain
  their builders' side in team battles and free-for-all.
- A mound grows during digging with tiny dirt flecks and busy antennae. Finished
  mounds have a dark entrance; emerging ants get the normal spawn pop. Keep the
  game's existing doodle style and team markings.
- Pause and setup freeze building and production. Respect the existing 4,000-fighter
  limit; a colony waits when full rather than discarding or replacing fighters.

Timings, ant stats, colony health, gathering distance, and drawing details are
builder choices proposed here; only the doubling rule and surviving workers were
explicitly chosen by the owner. The suggested timing is 3 seconds to dig and one
new ant per colony every 4 seconds.

## Scope

Update the roster/category and sprites in `units.ts`, colony state, gathering,
production and reset in `sim.ts`, construction rendering in `render.ts`, and brush
filtering in `App.tsx`. Update the README and style guide. Preserve existing local
changes, including Sparklebutt's unverified rainbow change.

## Owner-requested extension: entering and hauling

Builders walk to the doorway and go inside during construction, then emerge alive
when the build finishes. Occupants count toward the ant population but cannot be
targeted outside; destroying the hill releases surviving occupants.

When an enemy of a living ant dies, its body remains on the floor in a still,
fallen pose. Bodies are independent of recycled fighter slots. Anthills and a
phoenix's temporary egg transformation do not leave bodies. Available same-side
ants collect enemy bodies for their nearest completed colony; small bodies need
two ants and large bodies need more (up to eight). Construction takes priority.
An interrupted or depleted crew stops moving its body until help arrives. Losing
the destination drops its bodies for another colony to collect.

The owner chose for delivered bodies to disappear inside, with no food system or
extra ant production. Existing colony timing and doubling requirements stay in
effect. Clear removes bodies. Pause/setup freeze all new behavior.

Builder choices: a 0.25s doorway entry, 0.6s body delivery, and at most 4,000 stored
bodies so long battles do not grow memory indefinitely. At that limit further
deaths retain the original ink-splat behavior until a body slot is freed.

## Verification boundary

The owner's AGENTS.md forbids writing tests or running analysis, tests, builds, or
the app before asking after implementation. Defer those steps until authorized.
Then cover 9 versus 10 ants, the 20/40 progression, surviving builders, offspring
building, team isolation, interruptions, colony destruction, Clear, and capacity.

## Approval

Owner approved the rules and authorized implementation on 2026-11-14. Verification
remains deferred until the owner answers the post-implementation question.

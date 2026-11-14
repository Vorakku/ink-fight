# Miscellaneous: Zombie and infected creature varieties

Status: owner approved implementation on 2026-11-14, then explicitly paused the
task to close their PC. No zombie gameplay code written. See
`../../handoffs/2026-11-14-zombie-giant-paused.md` before resuming.

## Confirmed intent

Add the **Miscellaneous** category and a paintable **Zombie**. It roams, attacks
living enemies, and infects them so they become zombie varieties of themselves.

The owner explicitly chose **zombie behavior** for infected creatures: keep their
recognizable bodies with a zombie look, but replace their original abilities with
chasing and infectious melee. A zombie spider does not keep webs or nests; a
zombie giant does not keep its club slam.

Other timings, eligibility and ownership rules below are proposed defaults.

## Approach

- **Recommended: internal zombie variants with one common behavior.** Generate
  hidden zombie definitions from eligible roster appearances, copying only body
  geometry, drawing, habitat and baseline health. All use the same infectious
  melee behavior. Conversion changes the fighter's type and side safely.
- **Alternative: a zombie flag over the original fighter.** Keeps original type
  indices, but every existing quirk and behavior module would need suppression.
  Missing a branch could leave a zombie building ant colonies or spider nests.

Use the internal-variant approach. Only the base Zombie is paintable. Variants
appear through infection and are not dozens of new tray buttons. Append generated
definitions without changing existing roster indices; guard the stored type-ID
capacity if the roster outgrows its current typed array.

## Behavior and appearance

- A base Zombie runs toward nearby enemies, bites at melee range and wanders when
  nobody is in sight. It follows ordinary pause, terrain, control and team rules.
- Zombie creatures keep their original silhouettes and props, with a sickly
  green/grey tint, dull eyes, loose posture and an uneven, hurried zombie gait.
- Preserve physical size, collision geometry, current health and any existing
  growth visible at conversion. Growth stops afterward. Do not heal to full or
  give every small creature a giant's health pool.
- All variants use common zombie chase/bite attacks. Suppress original projectiles,
  regeneration, charges, slams, rebirth/hatching, summons, nesting, colony building,
  body hauling, combining, duels, latching, death explosions and other special
  abilities. A discarded ability is not deferred to death or a later timer.
- Flying creatures become grounded zombies with their old wings as part of the
  recognizable art. Waterbound creatures retain their existing wet habitat and
  can only chase targets they can reach there. These are proposed movement rules.
- Keep tint and poses readable at the current doodle scale; no gore or new panels.

## Infection and sides

1. A base Zombie or converted zombie lands a bite on a living, eligible enemy.
2. The bite deals ordinary damage. If the victim survives, mark it infected and
   show a small green pulse or stain for a short incubation period.
3. While incubating, it stays on its original side and fights normally. Existing
   health, damage-over-time, movement and defensive reactions still apply.
4. At expiry, if still alive and eligible, convert it once to its matching zombie
   variant and the infecting side. The converted creature can infect others.

- Infection spreads through zombie melee bites, not by proximity, corpse contact,
  projectiles, environmental damage or decorative particles.
- Eligible targets are living creature fighters, including People and animated
  Food as well as Animals, Bug, Water and Mythical creatures. Exclude buildings,
  vehicles such as the millipede car, temporary eggs, dead bodies and zombies.
- Allies are not bitten or infected. In team mode the victim joins the infecting
  Red or Blue side. Free-for-all infection uses the base Zombie's horde side,
  rather than giving each converted original species a separate side.
- Held, underground or otherwise untargetable creatures cannot receive a new
  bite. An infection received earlier can still mature during a grab or inside
  an anthill; conversion must release those links safely. Hiding is not a cure.
- Multiple Red/Blue zombie hordes can fight, but an existing zombie is immune to
  further infection and cannot be repeatedly flipped between hordes.
- The first valid bite owns a pending infection. More bites still hurt, but do not
  stack incubation or postpone conversion. Save side identity independently of
  the source slot so death or slot reuse cannot change which horde inherits it.
- A fatal bite kills normally and leaves no conversion or free resurrection.
  Death during incubation cancels it. Only the same living fighter generation
  can finish an infection; never infect whatever later reuses its slot.
- If the victim becomes a temporary egg or another ineligible state before expiry,
  cancel the pending infection. Undelivered projectiles keep their original firing
  side rather than changing sides after their owner converts.

## Safe conversion

- Conversion is not a death or a new spawn. Do not create a body, award a kill,
  free the slot, grant health, or increase total population.
- Remove the victim from old-side jobs before changing identity: mantis encounter,
  ant construction/inside occupancy/hauling, millipede assembly, spider home/build/
  wrapping/mount, grab/carry links and other locked moves.
- Release a carried creature alive at the carrier's current position. If the
  converting creature is carried, release it too. Drop claimed corpses and make
  them available to other collectors. No corpse may be consumed by conversion.
- Existing structures and their resources keep their old team. Converting a spider
  or ant never transfers its old nest, cocoons, anthill, workers or stored brood.
  Normal orphan-structure behavior remains; the zombie cannot keep producing.
- Preserve ordinary harmful status timers and let an existing physical fall finish.
  Cancel special attack wind-ups and jobs without resetting one-time abilities to
  a usable state. Increment identity generation so old targets/locks become invalid.
- Update old/new side counts and original/variant type counts exactly once.
  Ordinary category-driven tally rows should identify variants as **Zombie <name>**
  and count each fighter once. A zombie ant is not a worker toward normal colonies.
- Zombie deaths are final, with the existing dead-body rules. Animal-shaped zombie
  bodies can retain their original animal-prey eligibility; collecting one does
  not infect ants, spiders, cocoons or newborns.
- Clear removes pending infections, zombie variants and all associated state.
  Setup and pause freeze incubation as well as movement and combat.

## Proposed starting values

| Setting | Proposed value |
|---|---|
| Base Zombie health | 90 |
| Zombie movement speed | 95px/s before terrain/status effects |
| Bite interval | 0.75s |
| Bite damage | 7 |
| Incubation | 2s after the first surviving bite |
| Variant health | Preserve current health; no conversion heal |
| Infection persistence | Until conversion, victim death, ineligible state or Clear |

Exact art, bite reach, idle wandering and size/growth snapshot representation are
builder choices. These numbers are proposed tuning, not tested gameplay values.

## Implementation scope

- `units.ts`: Miscellaneous, base Zombie, safe hidden variant generation and the
  explicit fields distinguishing zombies, eligible original types and buildings.
- `sim.ts` and a focused infection module if needed: bite attribution, pending
  side/generation, safe conversion, counts and lifecycle cleanup. Reuse native
  damage/targeting instead of duplicating combat for each variant.
- Existing bug modules: suppress zombie-specific old behavior through converted
  definitions, and clean reservations before conversion. Retain ordinary fighters.
- `render.ts`: cached zombie art, infection signal, generic gait and dead variants.
- `App.tsx`: category-driven base Zombie brush and hidden variant brushes. Tally
  names/icons identify converted types without requiring another control panel.
- No new dependencies, corpse resurrection, cures, retained original powers,
  global infection waves, or automatic verification.

## Later authorized acceptance checks

- Miscellaneous contains the base Zombie; converted varieties are not paintable.
- A surviving bite infects once; conversion joins the correct horde without a heal
  or count inflation. Fatal bites and deaths during incubation never resurrect.
- Original abilities stop for zombie ants, spiders, mantises, millipedes, phoenixes
  and giants; silhouettes and effective size remain recognizable.
- Structures/cars/eggs/inside ants remain protected; waterbound zombies remain wet.
- Concurrent infections, source death, slot reuse and pre-conversion projectiles
  preserve correct ownership. Zombies cannot be infected again.
- Converting a carrier, captive, builder, hauler, assembly member or brood owner
  releases references, leaves resources on their original side and creates no body.
- Tally, setup, pause, Clear, body collection and full capacity remain consistent.

## Approval and verification

The owner approved this concrete design with "Approve both — implement them."
They subsequently chose Save and pause. Resume only when asked; another process
or design approval is unnecessary. No tests, builds, analysis, app launch or
gameplay changes have been performed for this feature. Verification remains
subject to the separate post-implementation permission question.

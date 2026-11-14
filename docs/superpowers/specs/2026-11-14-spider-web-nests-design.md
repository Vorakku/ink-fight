# Spider: web shots, pouncing, nests and cocoon broods

Status: owner authorized implementation alongside the millipede and mantis on
2026-11-14. Source is written; gameplay and balance remain unverified.

## Intent and confirmed behavior

Add **Spider** to **Bug**. It shoots webs over long distances and jumps onto nearby
enemies to attack. With no activity, or with enemies too far away, it builds a
nest of spider webs. It drags dead animals home and wraps them in cocoons.
**Five cocoons produce one new spider.**

The owner specified those behaviors and the five-to-one reproduction rule. The
close attack is interpreted as a comic pounce and brief clinging bite attack.
Ranges, timings, prey eligibility, nest sharing and destruction rules below are
proposed defaults, not owner-approved decisions.

## Approaches

1. **Nest-based cocoons (recommended):** bodies are visibly dragged to a nest,
   wrapped there, and stored there until five can hatch a new spider. Makes both
   reproduction and destroying an enemy nest understandable on the page.
2. **Personal cocoon counters:** each spider carries its own progress regardless
   of location. Simpler storage, but the nest has little role in reproduction and
   shared body ownership becomes less clear.

This draft uses nest-based cocoons. Reuse existing projectiles, jump/latch motion,
stationary damage targets, and the independent corpse store where compatible.
No new dependencies or separate resource-management UI.

## What the player sees

```text
Enemy far away but in web range -> shoot a silk pellet that tangles its legs
Enemy close -> crouch, pounce, cling briefly and bite, then hop off
No enemy in fighting range -> build or tend a small web nest
Dead enemy animal -> drag home -> wrap into one visible cocoon
Five cocoons at that nest -> consume five -> one allied spider emerges
```

- A small eight-legged spider, expressive eyes and an industrious, slightly smug
  posture. Match the current doodle outlines, shading, scale and team markings.
- Web shots are pale silk pellets with a few wispy strands. On impact a small web
  tangles the target's legs; do not draw a permanent beam across the page.
- Pounce: a low crouch, little airborne arc, legs spread, an awkward landing on the
  enemy, then a short biting burst and a hop off. The victim remains visible.
- Nest: a low silk hammock/dome with a dark entrance, a few radial threads and
  support strands. Build it strand by strand; idle leg movements suggest weaving.
- Dragging: the spider faces its cargo and backs up, pulling it visibly along the
  ground with a short taut silk tether. Large bodies move more slowly.
- Wrapping: the spider circles the fallen body while silk bands cover it. A
  completed cocoon is a small white bundle at the nest with hints of its contents.
- Show up to five bundles around the nest. On birth they gather into a twitching
  bundle, are consumed, and a new spider pops out. Keep the scene readable at
  normal zoom; no gore, elaborate panel, inventory screen or large floating text.

## Combat

### Long-range webs

- Seek visible enemies within web range and fire traveling projectiles. The shot
  keeps its firing direction and can miss a moving target; it is not homing.
- A shot hits the first eligible enemy, deals modest impact damage, and applies a
  temporary web slowdown. Allies are ignored under the existing team rules.
- Proposed web effect: **60% slower movement for 1.8s**, with repeated hits
  refreshing that duration rather than adding unlimited time. This is a movement
  slowdown, not a full stun. Use a dedicated signal for the visible silk so an
  unrelated slow effect does not turn into a web.
- Webs do not stop normal attacks, control attacks or knockback. Dashes, jumps,
  throws and existing crowd-control rules retain their normal behavior. The slow
  applies to ordinary movement, including slowed approach/retreat after landing.
- Fliers and swimmers can be shot if otherwise targetable. Held victims, ants
  underground, temporary eggs and other untargetable units keep their protection.
  Buildings can take impact damage but do not receive meaningless leg-web effects.

### Close-range pounce and bites

- With an eligible enemy nearby and the pounce cooldown ready, stop shooting,
  visibly crouch, then leap toward that enemy's position. Lock its slot and
  generation for the attempt; do not retarget midair.
- A successful landing delivers one bite and a short clinging attack burst. At
  most one bite occurs per bite interval, never every simulation frame. No ranged
  web shots while clinging.
- Pounce onto living, grounded, movable enemies. Buildings, fliers, swimmers
  confined to water, airborne or held fighters, underground ants and eggs cannot
  be mounted. Tiny targets receive the landing bite without a mounted burst.
- The spider and victim remain separate, vulnerable fighters. The victim can fight
  back, and other enemies can hit the spider. Clinging grants no invulnerability,
  victim stun, free healing, or ability reset.
- End the burst after its short duration, then hop clear. If the target dies,
  changes generation, becomes untargetable, or throws the spider off, detach at
  the current location. A miss ends without damage and still uses the cooldown.
- Stun, charm, a grab, a throw, or death interrupts the spider's attack normally.
  One successful pounce cannot produce duplicate landing or detachment hits.
- If the pounce is unavailable, bite at touching range or shoot when separated.
  Do not force the spider to walk into melee before it can use its long-range web.

## Idle behavior and nest construction

- An enemy is "too far" when no valid enemy is inside the spider's web attack
  range. A distant crowd on the far side of the page does not prevent nesting.
- After a short quiet interval, build if the spider has no valid home. Select dry
  ground with enough room for the nest, its entrance and cocoon bundles. Do not
  create a nest in water, overlapping another building, or outside the page.
- Each spider has at most one home. Prefer adopting an existing friendly nest
  nearby, including one under construction, over building an overlapping nest.
  Multiple friendly spiders may share a nest and its stock of cocoons.
- One available builder works on a nest at a time. If its builder is interrupted,
  another friendly spider can resume the same partial nest; adding more spiders
  does not multiply construction speed. Keep completed construction progress.
- Nearby threats interrupt weaving so the spider can defend itself. An unfinished
  nest remains at its current progress and can be attacked. No dragging or wrapping
  into it until it is complete.
- A completed nest is stationary, targetable, attackable and marked with its side.
  It cannot be shoved, kidnapped, carried or thrown. It uses normal damage and
  fire rules. It is built by spiders, not offered as a paintable fighter.
- With a completed home and no threat, forage for a suitable body, return home,
  wrap it, or tend decorative threads. Repeated idle weaving adds no cocoons,
  extra nests, free health or passive spider production.
- A spider with a living home keeps that home rather than building another each
  time it pauses. A newborn adopts its birth nest. Destroying a home permits its
  surviving spiders to build or adopt a replacement after the quiet interval.

## Animal bodies, claiming and dragging

- Eligible animal deaths must leave bodies when an enemy spider is alive, even
  if there are no ants. Keep the existing body snapshots independent of reused
  fighter slots; preserve the dead pose, size, appearance and original side.
- Proposed prey definition: biological fighters in **Animals, Bug, Water and
  Mythical**. Exclude buildings, vehicles/wrecks, People and Food. Eligibility
  must be explicit enough that a future mechanical or non-animal Mythical fighter
  is not accidentally treated as prey. This definition is a proposed interpretation
  of "dead animal" and can be narrowed by the owner.
- Collect only enemy bodies. Friendly casualties do not become cocoon resources.
  Bodies created before the first spider appeared can be collected if they already
  exist; do not reconstruct bodies from expired ink splats.
- A spider with a completed home chooses a nearby unclaimed eligible body and
  reserves it. It may pull one body at a time, regardless of body size; bigger
  bodies take longer to move. No new cooperative spider-hauling requirement.
- Ants and spiders use one exclusive claim per corpse. Neither steals an active
  claim from the other. The first valid claim wins, with stable processing order;
  a body cannot be hauled twice, delivered twice, or counted by both systems.
- A claim is valid only while its collector and destination are alive, eligible,
  on the same original side and generation, and the destination is complete.
  Interrupted collectors drop their body at its current ground position and
  release the claim. Other collectors can then reserve it.
- Fighting takes priority over foraging. A nearby enemy makes a dragging spider
  release its body and return to combat. Carry control effects, spider death,
  destination destruction or failed travel also drop it safely.
- Keep ordinary water slowdown during dragging. Only bodies reachable on the
  ground can be retrieved; do not teleport cargo out of an inaccessible pond.
  A travel timeout releases a stalled claim so one corpse cannot lock a worker.

## Wrapping, five cocoons, and birth

- Bring the actual corpse to a completed friendly nest and wrap it there. Reserve
  a wrapping position so multiple spiders do not overlap or wrap the same body.
- Completion atomically removes exactly one body and adds exactly one cocoon to
  that nest. Size does not create bonus cocoons. Dragging alone earns nothing.
- If wrapping is interrupted, release the claim and leave the original body at
  its current location. The unfinished silk falls away; a future wrap starts
  again. Do not add a cocoon until wrapping completes.
- Stock is per nest, shared by spiders using that friendly nest. Cocoons are
  stored resources, not independently controllable fighters or living captives.
- With five completed cocoons, begin a short birth animation. On a successful
  spawn, consume exactly five and create exactly one ordinary allied spider at
  a valid entrance exit. Four cocoons produce none; five cannot hatch repeatedly.
- If unit capacity or a blocked exit prevents spawning, retain the five cocoons
  and wait. Suspend new wrapping into a nest holding a pending brood; do not lose
  bodies or consume stock while waiting. An interrupted in-progress wrap follows
  the same release rule above.
- Every newborn inherits the nest's exact side, including free-for-all spider
  ownership. It uses normal fighter stats and can fight, forage and build. There
  is no separate aging system or free periodic offspring timer.
- Nests persist after their original builder dies. A complete nest with five
  cocoons can finish a birth without a living parent; other friendly spiders can
  adopt an orphaned nest. Less than five cocoons never hatch by waiting alone.
- Destroying a nest destroys its stored cocoons and cancels unfinished birth.
  Unwrapped or partly wrapped bodies remain collectible at their current position.
  Clear all destination and home references before a building slot can be reused.
  A child already successfully spawned remains an independent living fighter.

## Proposed starting values

| Setting | Proposed value |
|---|---|
| Web attack range | 480px |
| Web shot interval | 1.4s |
| Web movement slowdown | 60% for 1.8s; refresh rather than add |
| Pounce trigger distance | 100px |
| Pounce wind-up / airborne travel | 0.15s / 0.3s |
| Clinging burst / bite interval | 0.9s / 0.3s, starting after the landing bite |
| Pounce cooldown | 3.2s, including failed attempts |
| Quiet interval before nest work | 0.75s |
| Adopt a nearby friendly nest | Within 180px if no home is assigned |
| Nest construction | 3s of active weaving |
| Maximum body-search distance | 640px from the spider |
| Body wrapping | 2s of uninterrupted work |
| Maximum dragging attempt | 20s |
| Birth animation | 0.8s, then wait if spawning is blocked |
| Reproduction cost | **Exactly 5 cocoons for 1 spider: owner requirement** |

Damage, spider/nest health, ground speed, projectile speed, tiny-target threshold,
drag speed by body size, web art and nest geometry are builder choices. Other
numbers in the table are proposed tuning, not verified gameplay results.

## Integration and constraints

- `units.ts`: append Spider and an internal nest definition without changing old
  indices; extend web projectile appearance and biological-corpse eligibility.
  Keep Spider in Bug even though spiders are arachnids rather than insects.
- `sim.ts`: ranged/pounce state, home/build assignments, body claims, wrapping,
  cocoon inventory and capacity-safe birth. Keep partial construction separate
  from reproduction progress and distinguish living targets from corpse slots.
- Existing `leaveBody` is gated on ants. Extend that gate for eligible spider prey
  while preserving which bodies ants currently receive. Do not require ants as a
  hidden prerequisite for spider reproduction.
- Existing body destinations (`cHome`/`bodyHome`) assume completed anthills and
  `haulFor` identifies ant carriers. Extend shared body ownership deliberately:
  nest destinations need their own kind and generation checks; do not pretend a
  spider nest is an anthill or overwrite ant crew requirements to make dragging work.
- A shared body release/removal path must clear every ant/spider reservation
  before reusing the body slot. Collector death, nest death, Clear and interrupted
  work cannot duplicate resources or leave a permanently claimed corpse.
- `render.ts`: web projectile and hit threads, jump/clinging pose, progressive
  nests, visible cargo, silk wrapping, stored cocoons and birth. Hide mounted
  spider duplicates and keep effects small in crowds.
- `App.tsx`: hide internal nest brushes while letting Spider appear through the
  existing category-driven tray. Use the normal team controls and tally.
- Generalize stationary-building handling only where needed so nest targeting,
  knockback immunity, corpse exclusion and capture exclusion match anthills.
  Preserve ordinary fighters, ants, rainbow attacks and their current behavior.
- Reuse existing control and slot-generation rules; cancel incompatible jumps,
  clinging, hauling and wrapping on control changes. Existing health, damage,
  status timers, kill credit, hatching and phoenix rebirth remain valid.
- Temporary phoenix rebirth does not yield a new prey body. Any later final death
  can yield one eligible body. A living mantis captive or other held fighter is
  never a corpse resource. The pending mantis design's outside-interference rules
  must apply if implemented later; this feature does not depend on that spec.
- Respect the existing **4,000 live-unit limit** and **4,000 stored-body limit**.
  Resource cocoons do not occupy fighter slots. At the body limit, further deaths
  retain the existing ink-splat fallback until space becomes available.
- Setup/pause freeze projectiles, attacks, building, dragging, wrapping and birth.
  Clear removes nests, cocoons, claims and pending births. Resize clamps or
  relocates nests and cargo safely; release an assignment that no longer fits.
- No living-enemy cocooning, global food bank, passive unlimited spawning,
  permanent page-wide web traps, new dependencies, or unrelated refactors.

## Acceptance scenarios for later authorized verification

1. A spider shoots from range; web shots travel, miss, hit enemies and refresh the
   slowdown without affecting allies or making unrelated slow effects look webbed.
2. A nearby valid enemy triggers one pounce and a timed bite burst; misses,
   interruptions, target death and slot reuse detach safely without free damage.
3. With no enemy or enemies beyond range, the spider builds a nest. Threats
   interrupt construction; completed work resumes and nests are not spammed.
4. Animal bodies exist with spiders alone. Ineligible People/Food/structures do
   not become spider resources; ant body retention still works as before.
5. An ant and spider competing for one corpse cannot both claim or consume it.
   Dropped bodies can be claimed again without stale collector/destination links.
6. One delivered and fully wrapped body adds one cocoon. Interrupted wrapping
   adds none; giant bodies cannot be counted multiple times.
7. Four cocoons yield zero offspring; five yield exactly one and consume five.
   Repeated ticks cannot duplicate a child. Additional groups of five work again.
8. Red, Blue and free-for-all children preserve exact nest ownership. Newborns
   adopt the birth nest and can continue the full prey-to-cocoon lifecycle.
9. At unit capacity, five cocoons stay pending; freeing a slot permits one birth.
   Builder death, nest death and blocked exits neither create free children nor
   lose resources except through the specified destruction of nest inventory.
10. Pause, setup, Clear, resize, full body storage, unreachable wet prey, phoenix
    rebirth, existing hatching and future mantis-captive interactions stay safe.
11. Webs, jumps, dragged dead poses, the growing nest and five-cocoon birth are
    understandable at normal zoom, including busy mixed battles.

## Verification boundary and approval

The owner authorized implementation of this design with the other two new bugs.
The source is written. Follow the owner's verification rule: ask before writing
tests, running analysis/builds/test suites or launching the app. No such checks
have been performed, and implementation approval does not grant that permission.

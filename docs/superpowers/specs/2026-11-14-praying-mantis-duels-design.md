# Praying mantis: kidnapping and the swarm's duel circle

Status: owner authorized implementation alongside the millipede and spider on
2026-11-14. Source is written; gameplay and balance remain unverified.

## Intent and confirmed behavior

Add **Praying Mantis** to **Bug**. A mantis kidnaps an enemy and carries it back to
its allies. The mantises surround the captive, but only one steps forward to fight
it. If that challenger dies, the next waiting mantis steps forward. Repeat until
the captive dies, defeats the group, or the encounter is interrupted.

The joke is an absurdly formal insect fight club: a kidnapping followed by patient
queueing, solemn bows, and a replacement who briefly regrets volunteering.

The owner specified kidnapping, return to a swarm, surrounding the enemy, and
successive one-on-one challengers. Numbers, timing, capture limits, interruption
rules, and the outcome when the captive wins below are proposed defaults, not
owner-approved decisions.

## Approaches

1. **A small group per captive (recommended):** reserve nearby allies, bring one
   enemy to their circle, and advance a fixed queue. Easy to see and bounded even
   in large battles; separate groups can operate independently.
2. **One global swarm per side:** every friendly mantis gathers around one captive.
   More spectacle, but can pull distant fighters across the whole page and create
   extremely long queues.

This draft uses the small-group approach. Ordinary melee alone would omit the
requested kidnapping and succession. Reusing the T-rex's behavior unchanged would
shake and throw the captive instead of arranging a duel.

## What the player sees

```text
Mantis clamps an enemy in its forelegs
  -> walks back to waiting allies
  -> puts the captive in the middle of their circle
  -> bows and steps forward to fight alone
  -> challenger dies: next mantis steps forward
  -> captive dies, wins the gauntlet, escapes, or outside combat breaks it up
  -> surviving mantises return to the battle
```

- A slim green body, triangular head, antennae, and two folded grabbing forelegs.
  Keep the existing doodle outlines, shading, size, shadows, and team bandannas.
- Carrying: the victim dangles visibly between the forelegs and struggles; the
  carrier leans back under the weight. Use its actual sprite, not a generic sack.
- Waiting: mantises face the center with folded arms and tiny impatient foot taps.
- Challenging: one small bow, forelegs unfold, then the existing attack lunge.
  The next volunteer steps out from its actual ring position after a death.
- A few restrained dust marks indicate the circle. No new panel, dialogue box,
  floating paragraphs, or separate minigame. Show the action on the battle page.

## Group and capture rules

- A lone mantis, or a group too small to kidnap, still fights normally in melee.
- Start a capture only with at least **four available allied mantises**, including
  the kidnapper, within **180px** of it. Reserve the nearest eligible allies, up to
  **six total**, with stable ordering for ties. No member can belong to two groups.
- Members must be alive, on the exact same side, and free of carrying, being
  carried, airborne travel, another duel, or a control effect that prevents work.
  Red and Blue never cooperate. In free-for-all use the existing mantis-type side.
- The kidnapper must reach normal melee range and complete a short, visible clamp
  wind-up. Capture is guaranteed when eligible; it does not depend on repeated
  random rolls. A lost target or interrupted wind-up cancels safely.
- A captive must be a visible, living enemy with effective radius no more than
  **1.5 times the mantis's effective radius** (`r * size`, including growth).
  Exclude buildings, eggs, fliers, waterbound fighters, airborne fighters, ants
  inside anthills, existing captives, and any unit already assigned to an encounter.
  An ineligible enemy can still be attacked normally.
- Capture adds no bonus damage. Health, existing status effects, attack cooldowns,
  and limited-use abilities are preserved. Carrying grants no healing or reset.
- The victim is held using the existing carrier/victim representation, with
  generation checks. It cannot steer or attack while carried. Mantises do not
  apply the T-rex's periodic shaking damage or automatic throw.

## Bringing the captive home

- Reserve a dry, bush-free center near the allies' current position. The ring and
  fighter radii must fit on the page. If no valid site is available, do not capture;
  fight normally and retry after the capture cooldown.
- Waiting allies move to evenly spaced positions around the center. The carrier
  walks there with the victim; this is visible travel, never a teleport.
- Carrier speed is reduced while carrying. If it dies or is stunned, thrown,
  charmed, or otherwise loses control, drop the living victim at the carrier's
  current position and cancel the group. The remaining allies return to combat.
- Transport has a short timeout. Losing too many allies to form the initial
  circle, losing the victim, or failing to reach the site also cancels the group.
- On arrival, put the victim on the ground at the center and release the physical
  carry link. Start the duel after a brief settling/bow animation. No arrival hit.

## Duel and challenger succession

- The kidnapper is the first challenger. Other members wait around the circle;
  they do not attack the captive, including through passive attacks or area moves.
- Captive and challenger prioritize each other. Use their normal attack types,
  damage, cooldowns, movement abilities, defensive reactions, and health.
  A ranged captive must retain room to move and shoot inside the circle.
- The ring is a formation, not an invisible wall. Knockback, a dash, or ordinary
  movement can carry a participant beyond the encounter boundary. Escaping it
  cancels the ritual and releases the survivors; do not teleport them back.
- When the active challenger dies, keep the captive's remaining health and status
  effects. After the handoff delay, the next living, available original member
  walks forward. Exactly one mantis is the challenger at a time, even if several
  deaths happen in the same simulation tick.
- Waiting members killed before their turn are removed from the queue. A waiting
  member with a temporary control effect is skipped for that handoff. New mantises
  do not join or replenish an encounter already in progress.
- If the captive kills every challenger, or no original member is available for
  the next turn, release it alive with its current health. Surviving mantises
  resume normal behavior. No bonus healing, resurrection, or replacement spawns.
- If the captive dies, end the encounter. Challenger and spectators resume normal
  behavior. Existing death, phoenix rebirth, hatching, kill credit, and ant corpse
  handling still run once. A phoenix turning into an egg ends this encounter;
  mantises never continue challenging the egg.
- If challenger and captive die in the same tick, end the encounter once. Do not
  send another mantis forward against a dead or recycled victim slot.

## Interruption, escape, and outside combat

- Outside fighters continue their battle. Outside attacks still deal their normal
  damage; a new outside hit, grab, throw, charm, or other control effect on the
  captive or active challenger breaks the ritual and releases the group.
- Existing burns and damage-over-time effects continue normally. They do not
  disappear on capture or at a handoff; a death from them uses the same death rules.
- An outside attack on a spectator removes that spectator from the group so it can
  defend itself. It does not make every spectator attack the captive. End the
  encounter if no challenger remains available at the next handoff.
- Outside control or displacement of the active challenger cancels the ritual.
  Control effects and shoves caused by the active pair's own normal abilities
  remain part of the duel while both stay inside the boundary: a stunned,
  distracted, toppled, grabbed, or airborne challenger keeps its turn until it
  recovers, dies, leaves the boundary, or the encounter times out. Do not replace
  a living challenger as though it had died.
- Put a hard lifetime on each encounter so no failed path or status interaction
  traps a fighter indefinitely. A released captive has a brief recapture grace
  period. Participating mantises also wait before starting another kidnapping.

## Proposed starting values

| Setting | Proposed value |
|---|---|
| Group size | Minimum 4, maximum 6 mantises |
| Ally recruitment distance | 180px |
| Clamp wind-up | 0.35s |
| Maximum transport time | 4s |
| Ring radius | At least 55px; grow to give the captive and its attacker room |
| Initial bow | 0.5s |
| Handoff after a challenger dies | 0.6s |
| Maximum encounter lifetime | 30s, including transport and handoffs |
| Kidnapping cooldown | 8s after success, failure, or release |
| Captive recapture grace | 2s after release |

Base fighter health, damage, speed, exact carrying slowdown, ring padding, and
animation coordinates are builder choices. Rebalance the proposed numbers only
with owner authorization to verify gameplay; do not treat them as tested values.

## Integration and lifecycle constraints

- Append the mantis definition to `UNITS`; preserve existing fighter indices. The
  Bug tray and tally should use the existing category/roster handling.
- `sim.ts` needs explicit capture, transport, ring, duel, and handoff state. Reuse
  existing target locking, `heldBy`/`grab`, team comparisons, and movement where
  compatible; give mantis encounters their own membership/state so they cannot
  overwrite another fighter's dash, grudge, cheese tether, or ant assignments.
- Validate every member, captive, challenger, and carrier by slot plus generation.
  Death, conversion, recycled slots, and team changes invalidate old membership.
- Cancel incompatible moves when capture begins, but retain health, status timers,
  cooldowns and one-time ability history. The active pair prioritizes each other;
  spectators never target the captive. Outside fighters may target participants
  normally and trigger the interruption rules. Exclude captives from other grabs.
- `hit`, direct damage/status paths, target selection, projectiles, area attacks,
  `toss`, `stopMoves`, death/rebirth, spawn and Clear need consistent interruption
  and cleanup rules. Cleanup must be safe if several paths run in one tick.
- Render the captive once while carried, then normally on the ground. Remove every
  carry/reservation link on release. Surviving fighters remain real units; do not
  consume or replace them to fake the scene.
- Bodies remain independent of duel state. In-progress ant hauling, inside ants,
  and anthills keep their existing rules. No dependency on the pending millipede car.
- Pause/setup freeze all timers and positions. Clear removes every encounter and
  reference. Resize must relocate the entire formation together if it still fits;
  otherwise release everyone safely at valid page positions.
- Captures create no extra fighters and respect the existing 4,000-unit limit.
  No new dependencies, multiplayer, progression, upgrades, or custom combat UI.

## Acceptance scenarios for later authorized verification

1. One to three allied mantises fight normally; four can organize a capture.
2. Eligible enemies are carried visibly; large, hidden, already-held, inside,
   flying, waterbound, building, and egg targets cannot be kidnapped.
3. Mixed sides never cooperate; multiple complete groups can operate independently.
4. Only one challenger attacks the captive. Each challenger death advances once;
   dead, unavailable, and recycled waiting members cannot become challengers.
5. Captive health and effects persist through transport and every handoff. A
   surviving captive is released after beating the group, without being healed.
6. Transport interruption drops the victim; outside combat and escapes release
   the group; timeouts cannot leave a unit stuck or invulnerable.
7. Simultaneous deaths, phoenix rebirth, hatching, corpse creation, ant collection,
   and slot reuse produce no duplicate deaths, phantom targets, or stale links.
8. Setup, pause, Clear, resize, a full arena, and a too-small/drowned page are safe.
9. Carrying, the circle, bows, waiting mantises, and replacement volunteers remain
   understandable at normal zoom and in a crowded fight.

## Verification boundary and approval

The owner authorized implementation of this design with the other two new bugs.
The source is written. Follow the owner's verification rule: ask before writing
tests, running analysis/builds/test suites or launching the app. No such checks
have been performed, and implementation approval does not grant that permission.

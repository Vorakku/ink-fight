# Lui Feng: Carnage

## Intent and decisions

The user wants a new aggressive ability called **Carnage**. Lui Feng gallops around an enemy group, leaving
afterimages of himself and his horse, spinning his spear overhead, and repeatedly slashing nearby enemies with
black-and-white ink effects. The user explicitly chose circling an enemy group instead of the activation spot.
Keep the loose, sweeping ink treatment developed for his charge, normal slash and Enhance buff in this session.

The user approved this design on 2026-11-21 with the instruction to implement it.

## Approaches

1. **Existing hero skill pattern, with a fixed group center (recommended).** Give Carnage its own active state
   and cooldown in `Battle`, reuse the cavalry movement and afterimage patterns, and extend Lui Feng's existing
   spin and ink drawing. Capture the group's center when he starts. This keeps the circular run readable even
   when enemies are knocked around, and avoids changing any other hero's behavior.
2. Follow the group's changing center throughout the cast. This chases scattering enemies but can make the
   path wobble or turn abruptly. It works against the clear, aggressive circular motion requested.

The user is steering the visible behavior; the first implementation approach is the builder's recommendation.
No generic skill framework, new dependency or separate movement engine is needed.

## Goals and limits

- Clearly distinguish Carnage from the normal mounted sweep and the stationary Enhance spin.
- Preserve the horse's gallop beneath the raised-arm pose; the spear rotates live above his head.
- Make the effects aggressive through fast motion, layered brushwork and afterimages, while keeping the rider visible.
- Damage eligible enemies near the rider, never allies. Afterimages are visual copies, not extra attackers.
- Preserve normal attacks, Enhance and Piercing Charge outside this cast, including the recent uncommitted art edits.
- No new input controls, transformation, invulnerability, enemy confinement or changes to other heroes.

## Trigger and skill interactions

- Automatic, like his existing skills: at least two targetable ground enemies in a nearby group, Carnage ready,
  and Lui Feng free to act. Exclude buildings, carried/airborne targets and zombies using the game's normal rules.
- Use his current valid enemy as the group anchor, gathering enemies within 140 px of it and 220 px of Lui Feng.
  Average their positions once to choose the circle center. A single enemy does not trigger this crowd skill.
- Default cooldown: **18 seconds**, spent when the cast starts, including interrupted casts.
- Let Enhance activate first if it is ready. Try Carnage before Piercing Charge and normal attacks afterwards.
- No skills or ordinary attacks overlap an active Carnage. Existing Enhance benefits continue to apply while
  its aura lasts, including its normal damage multiplier, without extending or refreshing the aura.

## Movement and timing

- Duration: **3 seconds** of active circling; aim for approximately **2.5 laps** at a nominal **100 px orbit radius**.
- Begin from his actual location and enter the orbit smoothly; never snap or teleport to the circle edge.
  Reuse the existing mounted steering/movement pattern and keep the real gallop and facing aligned with travel.
- The center stays fixed for this cast. Dying or retreating enemies do not move it or cancel the cast; enemies
  arriving in the area can be hit. Carnage finishes its brief run even if the original group dies.
- Respect arena boundaries and the game's water and movement constraints. Fit or reduce the orbit near walls,
  and use a safe smaller path in cramped arenas. Exact entry steering and boundary fitting are left to the builder.
- During the run, hold the spear above his head and spin it continuously, faster than Enhance's windup.

## Damage

- Pulse at the start and every **0.25 seconds** until the three-second run ends: at most **12 pulses** per cast.
- Each pulse deals **20 base damage** to each eligible ground enemy within **110 px of the rider**, adding the
  target's collision radius when checking reach, consistently with the existing mounted sweep.
- Use the shared targetability, reach, damage and kill-attribution paths; no damage through unrelated restrictions.
- A victim is hit at most once per pulse. Damage is tied to simulation time, never render frames or afterimages.
- Use a light outward knockback (**60**) so the skill feels forceful without immediately scattering its victims.
- At a successful end, one wider brush slash deals **50 base damage** within **140 px of the rider**, with **220**
  outward knockback. It has its own one-time hit pass and replaces the next ordinary swing rather than adding it
  on the same tick. Reset his normal attack cooldown after the finisher.
- If interrupted, stop the motion and pulses immediately and do not trigger the finisher.

## Visual sequence

1. **Entry:** the horse accelerates into the circling path; the rider raises his spear and a black ink sweep with
   a narrow white edge marks the start. This starts the run, not an additional damaging windup.
2. **Run:** reuse the gallop frames with raised arms. Spin the live spear overhead. Leave fading ink silhouettes
   of the full rider and horse about every **0.06 seconds**, each lasting **0.3 seconds**. Black silhouettes with
   restrained pale accents should read as motion afterimages, without hiding the live rider.
3. **Slashes:** each damage pulse starts a circular ink brush trail around the rider. Use the existing ink brush
   rendering, with broken white streaks and a few thin wind streams following the main black stroke. Keep a clear
   moving leading edge and tapered tails; avoid a permanent opaque disc or uniformly spaced rotating spokes.
4. **Finish:** a wider black-and-white brushstroke unfurls and fades. Afterimages and slash tails fade naturally
   for their short remaining lifetime after the active cast ends.

Cache pose/afterimage art at sprite-build time, not during rendering. Bound the number of live afterimages and
slash trails per caster by their emission interval and short lifetime. Preserve the established draw order so
effects and copies do not paint over the rider as a solid mass. No per-frame random flicker or expensive blur.

## State, cleanup and integration

- `src/game/luifeng.ts`: `LUI_CARNAGE` tuning constants; galloping raised-arm frames and cached ghost art;
  Carnage drawing using the existing live overhead spear and ink brush helper.
- `src/game/battle.ts`: Carnage state/cooldown on `Fighter`; start/step and enemy damage pulses; short-lived
  ghost/trail snapshots; skill dispatch, pose selection and rendering. Preserve historical positions, frames,
  facing and spear angle in afterimages rather than attaching old copies to the current rider.
- `src/game/units.ts`: only if the sprite integration needs it; the existing Lui Feng pose type is already inferred.
- Cancel on death, zombie conversion, stun, freeze, fear, charm, capture, throw or other movement-taking states
  such as knockup. Do not allow suspended state to resume later. Cooldown remains spent.
- Initialize and clear all new fields and short-lived effect collections with the existing spawn/reset paths.
  Lingering visual tails cause no damage and expire even when the owner has died or changed teams.
- Keep all previous uncommitted charge, slash and buff work intact. Do not stage or commit changes.

## Validation boundary

The owner's AGENTS.md overrides automatic TDD and verification: **do not write tests, run checks, analyze,
build or launch the game until asked.** After implementation, stop and ask exactly:

> Done. Want me to verify (analyze / tests / run), or will you check it yourself?

If approved afterwards, first use a cheap check of the changed TypeScript. Behavioral checks should cover the
group trigger, smooth bounded movement, pulse cadence, ally safety, Enhance scaling, no overlapping skills,
single finisher, interruption, cleanup and rendering data lifetime. Visual acceptance still requires looking
at the ability in the game; source inspection cannot establish that the motion looks good.

## Left to the builder

Fine visual details, exact orbit entry/boundary math, stable choice of circling direction, and economical reuse
of cached sprite frames. These choices must satisfy the movement, damage and lifecycle rules above. Any
material change to the proposed gameplay or numbers should be raised before implementation.

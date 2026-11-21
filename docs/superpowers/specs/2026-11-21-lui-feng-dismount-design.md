# Lui Feng: dismount passive and foot kit

Agreed with the user on 2026-11-21 through a design conversation. Numbers marked *proposed* are the builder's
starting values for tuning; the behaviors are the user's.

## Intent

Lui Feng is a legendary mounted general. The user wants a second phase: when he is badly hurt his horse dies and he
fights on foot with all three of his weapons (spear, sword, longbow), each with two new skills, until the horse
returns with a dramatic ink entrance and restores the health he lost. The fight should read as a cycle: mounted
general → unhorsed warrior → remounted general.

## Goals

- A repeatable horse cycle: horse dies at 50% HP, returns after 15 s (or 5 s with nothing to fight), healing 50%.
- On foot he switches weapons by distance: sword short, spear medium, bow long.
- Six new foot-only skills, chosen by chance and enemy positions.
- All new art in the game's existing black-and-white ink style with his red/gold/black palette.

## Non-goals

- No change to the mounted kit: sweep, Enhance, Piercing Charge, Carnage, meditation heal, bow shots, Thousand Arrow
  and Piercing Ground stay exactly as they are and stay mounted-only.
- No player control of weapons or skills; everything stays automatic.
- No general multi-weapon hero system.

## Anti-goals (a failure even if it technically works)

- He gets stuck on foot (e.g. a stun loop cancels the horse return forever).
- An endless projectile hits the same enemy repeatedly, or the edge-to-edge projectiles never get cleaned up.
- The foot phase looks like Cavalry's generic foot soldier: he must still read as Lui Feng.
- Existing mounted behavior or other heroes change.

## Approach (chosen: A)

Considered:

- **A. Same fighter with a foot mode (chosen).** Lui Feng stays one `Fighter`. A foot flag plus foot fields, in the
  same spirit as Cavalry's `cavalryMounted`. `fighterDef` returns a foot profile while he is on foot, the renderer
  picks foot poses, and the six skills live in `battle.ts` beside his other skills, reusing hit, stun, knock-up,
  projectile and crescent code. Foot art and tuning constants go in a new `src/game/luifeng-foot.ts`.
- **B. Swap to a hidden "foot Lui Feng" species.** Rejected: every reference to him (enemy targets, tally, zombie
  conversion, buffs, owned projectiles) would need re-pointing on each swap; a common bug source.
- **C. Generic multi-weapon hero framework.** Rejected: one hero needs it.

## Horse cycle

### Dismount

- Triggered by the first damage that takes him to **≤ 50% of max HP** while mounted (check after damage, like
  Cavalry's `CAVALRY_RIDE.dismount` check). Not triggered while a zombie.
- The horse collapses and dies; he is thrown to the ground and **stunned ~1 s** (*proposed*).
- The horse's body stays where it fell for **~2 s** and then dissolves into ink (*proposed*). Purely cosmetic: it
  doesn't block, can't be targeted and does no damage.
- Cancel whatever he was doing on the horse: unreleased bow casts, Piercing Charge, Carnage, Enhance cast,
  meditation. The **Enhance aura ends** (it is a mounted buff). Already released effects (arrows in flight, rain,
  ground shots) resolve normally.
- Mounted skill cooldowns keep ticking while he is on foot.

### On foot

- Foot profile (*proposed*): roughly Sword Saint scale. Size ~1.25, radius ~11, speed ~110, same max HP (HP is not
  rescaled, so 50% stays 50%). Detection stays 600.
- He can die on foot normally.
- If he is turned into a zombie on foot he stays a foot zombie; the horse never returns to a zombie and its timer is
  ignored. No revival case needs handling. *(builder's call)*
- **No meditation on foot:** the meditation heal is mounted-only, so `canMeditate` must be blocked while he is on
  foot. With nothing in range he just stands or idles like other fighters while the 5 s return timer runs.
  *(builder's call)*
- The return timer keeps counting during the dismount stun. *(builder's call)*

### Horse return

- Timer: **15 s** after the horse died. Or sooner: after **5 s in a row with no enemy within his detection range
  (600 px)** ("out of combat / nothing to attack").
- When the timer is due he starts the return as soon as he isn't mid-skill (finish the current foot skill first).
  If he is stunned, frozen, knocked up or similar when it comes due, he starts it the moment that ends.
- Sequence (~1.5 s, *proposed* timings):
  1. He plants the **butt of his spear** into the ground.
  2. Black ink swells up and covers him completely.
  3. The ink clears, revealing the white horse behind him.
  4. He **backflips onto the horse**.
- Once started the sequence **cannot be interrupted** (crowd control is ignored during it) so he can never be
  trapped on foot. He can still take damage during it.
- On completion: mounted again, **heal 50% of max HP** (capped at max), mounted profile and kit return. The cycle
  can repeat: the horse dies again the next time he falls to ≤ 50%.

## Foot weapons

Weapon follows the distance to his current target (*proposed* thresholds, with hysteresis so it doesn't flicker):

| Weapon | Distance | Normal attack |
|---|---|---|
| Sword | ≤ ~70 px | quick ink slash |
| Spear | ~70–220 px | thrust (reach to the medium band; he closes in if needed) |
| Bow | > ~220 px | ordinary arrow (reuse the existing `'arrow'` projectile) |

Only one weapon is shown in his hands at a time; the active skill's weapon overrides the distance choice.

**Movement: he holds his range (the user's choice).** He fights from wherever the enemy is rather than always
closing in. In the bow band he backs off or strafes to keep shooting distance, like his mounted archery
(`moveLuiArchery`). In the spear band he keeps medium distance. He only uses the sword when enemies come close.
Beyond bow range he walks in until he reaches it. So all three weapons and all six skills get real use.

Normal-attack stats *(builder's call, proposed)*: sword 22 damage / 0.55 s / knockback 70; spear 26 damage / 0.8 s /
knockback 110; foot arrow 20 damage / 1 s / knockback 50. The shuriken record gets an optional per-projectile
`damage` (and knockback) override so foot arrows, Piercing Shot and Barrage arrows don't use the mounted
`LUI_BOW.shot` numbers. Enhance never applies on foot (its aura ends at the dismount).

Foot skill cooldowns *(builder's call)*: separate fields that tick all the time (mounted or not), never reset on
dismount or remount, and start ready, so his first foot phase can open with a skill. The 35%/s roll keeps him from
firing them all at once.

## Skill choice: chance + enemy positions

- Only skills of the **current weapon** are candidates.
- A ready skill is not used instantly: he rolls for it at about **35% per second** (*proposed*), using the battle's
  seeded `this.random` so checks stay deterministic.
- Enemy positions weight or gate the roll:
  - **Playful Stars:** requires 2+ enemies within ~150 px of him; more enemies → likelier.
  - **Sky Cutter:** favoured against a single close enemy.
  - **Heavenly Strike:** likelier when enemies are bunched near his target (the landing knock-up hits them).
  - **Heavenly Slash / Piercing Shot:** likelier when 2+ enemies are roughly in a line from him through his target.
  - **Arrow Barrage:** likelier when 3+ enemies are in front of him at range.
- If both skills of the weapon are ready, the one that better fits the positions wins.
- One skill at a time; he finishes it before starting another or the horse return.
- Standard interruption: stun, freeze, fear, charm, capture, throw, knock-up, death and zombie conversion cancel an
  unreleased skill (cooldown stays spent). Released projectiles live on.

## The six skills

All numbers *proposed*. Hits use the common `hit` path (so blocks, wards, immunities and protected targets keep
working) and spare allies. Enemy "once each" bookkeeping uses a `hits` set like `mengMoons`.

### Bow

- **Piercing Shot.** Charge ~0.8 s (bow drawn, ink gathering at the arrow, reusing `drawInkCharge`), then fire one
  large arrow straight at the target's position. It pierces: hits each enemy it passes once (45 damage, modest
  knockback) and only disappears at the **edge of the arena**. Cooldown 10 s.
- **Arrow Barrage.** Charge ~0.6 s, then fire ~20 arrows over ~1 s at super speed, spraying wildly across a wide
  ~120° cone centred on the target; many miss. Each arrow 10 damage, normal arrows (stop on first hit, normal
  lifetime). Must respect the shared projectile cap. Cooldown 12 s.

### Spear

- **Heavenly Strike.** He leaps high, leans back and throws the spear down at the target. On hit: 40 damage and a
  **50% slow for 2 s** (new status: multiplies movement speed; there is no slow status today). The spear plants in
  the ground at the impact point either way (a miss still plants). From the top of his leap he then flies straight
  down to the planted spear and pulls it out; the landing **knocks up and stuns** every enemy within ~110 px for
  ~1 s (reuse the existing knock-up). ~2 s total. Untargetable by ground melee while high in the air is the
  builder's call, consistent with other airborne heroes. Cooldown 14 s.
- **Heavenly Slash.** Charge ~0.7 s, then a swing that sends a thick ink crescent moon toward the target. It flies
  until the **arena edge**, hitting each enemy once (35 damage, small knockback). Model on `mengMoons` /
  `yanCrescents` but with edge removal instead of a fixed life. Cooldown 10 s.

### Sword

- **Sky Cutter.** He backflips over the enemy, cutting a black ink slash arc as he passes over (30 damage), lands
  behind them, then dashes back through them with a second black ink slash (30 damage). Cooldown 9 s.
- **Playful Stars.** He spins very fast for ~1.2 s inside a ring of ink crescent moons (~150 px radius). Enemies
  inside are **pulled toward him** with small damage ticks. Then he pierces the ground with his sword: 40 damage and
  a large outward knockback to everyone in the ring. Cooldown 16 s.

## Art (in `luifeng-foot.ts`, cached like his other poses)

- On-foot Lui Feng: same crown, hair, armour, red cape and gold trim as mounted, standing and walking.
- A sword for him (black and gold, matching the halberd); spear and longbow reuse/adapt the mounted art.
- Poses: stand/walk per weapon, sword slash, spear thrust, bow draw (reuse `drawLuiBow` geometry where it fits),
  thrown/fallen, leap and lean-back, dive, backflip, dash-slash, spin, sword plant, spear-butt plant, backflip mount.
- Horse: collapsing/dead horse, dissolving to ink; the ink cover and horse reveal for the return.
- Effects: large piercing arrow, wild barrage arrows, thrown spear and planted spear, ink crescent moon, black ink
  slash arcs, the spinning ring of crescents, ground-pierce shockwave.
- Sprites are built lazily per team (see `buildSprites`), so new poses only cost memory once he's used.

## Files

- `src/game/luifeng-foot.ts` (new): foot profile, foot skill constants, foot art and effect drawing.
- `src/game/luifeng.ts`: only shared pieces (e.g. exporting existing art helpers the foot file reuses).
- `src/game/battle.ts`: foot/horse state fields (initialise and reset them), dismount/return logic, weapon choice,
  skill selection, the six skills, new projectile/effect records, slow status, render integration.
- `src/game/units.ts`: register the foot poses in Lui Feng's pose data.
- Clear new arrays on battle reset; remove owned unreleased effects on death/conversion like existing code.

## Verification boundary

The owner's CLAUDE.md overrides automatic TDD/verification: do not write tests or run checks/builds/the game before
asking. After implementation, stop and ask: "Done. Want me to verify (analyze / tests / run), or will you check it
yourself?" Visual acceptance needs an in-game look.

## Left to the builder

Exact art, poses and animation timings within the described sequences; projectile speeds; hysteresis widths;
the exact chance weighting formula; which existing helpers to reuse; airborne immunity details for Heavenly Strike.

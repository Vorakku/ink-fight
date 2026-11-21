# Lui Feng: mounted longbow

Approved by the user on 2026-11-21 with an explicit instruction to implement the longbow kit.

## Intent and confirmed behavior

Lui Feng has three weapons in the user's character concept: spear, sword and longbow. This task adds the
**mounted longbow** alongside the existing spear kit. Sword work is not requested yet.

The user confirmed that he uses the bow for **ordinary arrows at distant enemies**, with increased enemy
detection, as well as two charged skills:

- **Thousand Arrow:** gather the spear charge's black-and-white ink wind into the nocked arrow, fire skyward,
  and rain arrows onto a visibly marked area.
- **Piercing Ground:** aim down, gather the same ink charge, then fire beside his horse's feet. The impact
  makes a crater, knocks nearby enemies away and stuns them. The user explicitly chose this close-range impact.

Keep the white warhorse, rider identity and artistic ink palette. The user's earlier spear-spin/slam meditation
healing request remains pending; it is not silently dropped or included in this bow implementation.

## Approaches

1. **Extend the existing automatic hero combat flow (recommended).** Add a bow preference and bow-cast state
   to Lui Feng, cache mounted bow poses, and add an arrow kind to the existing projectile path. Reuse common
   targeting, projectile defenses, damage, crater art and the existing ink charge renderer. This keeps one hero
   with automatic weapon changes and preserves his existing spear skills.
2. A separate selectable archer form or manually controlled weapon. This would add controls and duplicate
   hero setup, while the user wants the same mounted fighter to use both weapons automatically.

The first approach is the builder's recommendation. Use the current TypeScript/Canvas architecture and no new
dependencies or general-purpose weapon framework. All numbers below are proposed defaults for approval.

## Detection and weapon choice

- Increase Lui Feng's explicit detection distance to **600 px**, including while Enhance is active.
- Ordinary bow range: **500 px**. This does not change the spear's existing damage reach.
- Prefer the bow when the current enemy is at least **180 px** away; return to the spear at **140 px** or closer.
  Between those distances retain the previous preference, so small movements do not flicker the weapon.
- The live pose follows an active skill's weapon. Enhance, Carnage and the spear charge show the spear even if
  the stored ranged preference is bow. There is never a bow and spear simultaneously in his hands.
- At bow distance, face the target, shoot while mounted, and use ordinary mounted movement to keep a useful
  distance of about **260 px**. Approach enemies beyond bow range instead of firing beyond reach. Nearer
  targets restore existing spear/cavalry combat. Do not grant perfect aim, homing arrows or teleporting movement.
- Do not make airborne, hidden, tower or protected targets newly reachable just because detection is larger;
  retain the appropriate common targeting and projectile reach rules.

## Ordinary arrows

- New mounted drawing, drawn-string and release poses. Preserve horse movement under ordinary bow shots.
- Brief **0.25-second draw**, **0.9-second shot interval**, **26 base damage**, **60 knockback**, and **780 px/s**
  arrow speed. The shot interval includes drawing; it is not an additional 0.9-second wait after release.
- Aim at the target at release and fly along that heading; moving targets can evade. Fire an actual visible
  arrow from the bow with a restrained black-and-white streaming tail, not an instant damage line.
- Each ordinary arrow can hit the first eligible enemy along its swept flight path once. Allies do not consume
  it. It expires after its configured range/lifetime and obeys arena bounds and the existing projectile cap.
- Store the shot's Enhance damage multiplier when released. Reflection changes ownership as existing
  projectiles do, without borrowing the reflecting hero's base damage or multiplying the shot twice.
- Ordinary arrows participate in the common projectile wall, parry, capture and reflection paths. Do not create
  a separate projectile list that those defenses accidentally ignore.

## Thousand Arrow

- Available against a target within **500 px**. Center the area on that target's position when the cast starts;
  if nearby enemies are clustered within **100 px** of it, use their average position instead. Keep the selected
  center within the playable area. A single valid target is sufficient.
- **1-second charge**, using the current spear charge renderer anchored at the actual nocked arrow. The rider
  reins in and raises the longbow toward the sky. Bow limbs and string show the drawn tension.
- Show the **130 px radius landing marker from the start of the charge**. Lock it to the chosen ground point;
  it does not chase enemies. Use a readable dark ink boundary, pale countdown stroke and light translucent fill.
- Release one clearly visible skyward shot that opens into streams overhead. After **0.6 seconds of flight**,
  rain **six waves**, **0.22 seconds apart**. Each wave deals **18 base damage** once to each eligible enemy
  still inside the marked area, adding collision radius consistently with other area attacks.
- Show many staggered falling ink arrows and small brush impacts. The name conveys the dense volley: do not
  simulate one thousand separate damage-dealing projectile objects. Visual density and simulation wave count
  are separate. Each visible fall reaches the ground before its impact flash; no frame-dependent damage.
- The marker remains readable until the final wave, then fades with the remaining impact art. Enemies can
  leave the marked zone or enter it before later waves. Allies are always spared.
- Cooldown: **12 seconds**, starting at cast start. Interrupting the charge cancels the marker and volley,
  with cooldown spent. Once released, the rain continues through the caster's later movement or stun and he
  can resume fighting after a brief release pose. Death or zombie conversion removes remaining owned rain
  and arrows, consistently with existing owned-projectile cleanup.
- Falling arrow rain is an area attack, like sky strikes, rather than low-flying arrows passing through a wall.
  Normal walls do not shield the entire marked ground area; common target immunity and reach rules still apply.

## Piercing Ground

- A close-range skill, available with at least one eligible enemy within **125 px** of the horse. It can be used
  even when his preferred weapon is spear; he visibly pulls out and aims the longbow down to cast it.
- **0.85-second charge** with the ink wind gathering at the nocked arrow. The horse braces. Aim at the ground
  immediately beside/in front of the horse's feet, not a distant foe, using his facing to place the impact.
- On release, show the heavy arrow moving from the bow to that ground point over about **0.12 seconds**.
  Apply the impact once it reaches the ground, not when charging begins.
- Impact: **50 base damage**, **125 px radius**, **460 outward knockback**, **1-second stun**, and the existing
  crater lasting **2 seconds**. Reuse common hit/stun rules so protected or unstruck targets do not receive a stun.
- Black ink cracks and an expanding white-edged brush shockwave radiate from the crater. Keep the rider visible;
  the flash should communicate a ground strike rather than another floating ring.
- Only eligible nearby ground enemies are hit; allies and Lui Feng are spared. Add target collision radius to
  the reach check. No movement lock or special damage immunity for Lui Feng while charging.
- Cooldown: **10 seconds**, spent at cast start. Interrupting before release cancels the impact. After release,
  the short ground flight resolves even if he is subsequently stunned; death/conversion cancels owned effects.

## Priority, interruption and existing skills

- Finish an active cast or Carnage before starting another skill. Ordinary attacks cannot fire during a charge.
- With no cast active: keep Enhance's priority; try close-range Piercing Ground next, then Carnage; use Thousand
  Arrow at bow distance when ready. Piercing Charge remains available in spear/close-midrange combat rather
  than always replacing the bow by charging at distant targets. Then choose an ordinary bow or spear attack.
- Enhance's existing offensive multiplier applies once to ordinary arrows, rain and ground damage. Snapshot
  it on release for effects that outlive the cast. Do not change existing spear damage, buff duration or armor.
- Stun, freeze, fear, charm, capture, throw, knockup, death and conversion cancel unreleased bow casts. Never
  leave a suspended charge to resume later. Clear or select the weapon pose appropriately after cancellation.
- A dead/lost distant target cancels an ordinary draw. A committed skill area remains a ground point rather
  than dereferencing a missing target. Changing targets never relocates an existing Thousand Arrow marker.
- Preserve existing Carnage afterimages, spear charge, buff art and skill cooldowns. Broader detection must also
  feed their normal target selection without modifying other heroes' detection or melee ranges.

## Files and responsibilities

- `src/game/luifeng.ts`: bow tuning constants, explicit detection, mounted bow poses, draw/release anchors,
  bow/arrow art, marker/rain drawing and ground-impact brushwork. Reuse the ink charge and brush rendering.
- `src/game/battle.ts`: bow preference/cast and cooldown fields; automatic combat selection; ordinary arrow
  projectile kind and movement/damage/render integration; locked rain area and short ground shot; shared hits,
  defenses, lifecycle and snapshots. Keep game effects deterministic between simulation frames.
- `src/game/units.ts`: only if necessary; Lui Feng's extra pose data is already inferred from its builder.
- Initialize/reset all new fields. Clear arrays on battle reset and remove owned live attacks on death or zombie
  conversion. Let purely cosmetic impact/crater tails expire independently and never cause extra damage.
- Cache sprite art during sprite construction. Bound arrows by the existing shared projectile cap, rain by its
  cast cooldown and fixed six-wave lifetime, and rendered streaks by a small fixed visual count per active area.
- Preserve all current uncommitted edits. Do not stage, commit, install dependencies or restructure shared combat.

## Verification boundary

The owner's AGENTS.md overrides automatic TDD and verification. Do not write tests or run analyze, builds,
checks or the game before asking. After implementation stop and ask exactly:

> Done. Want me to verify (analyze / tests / run), or will you check it yourself?

If authorized later, begin with the cheapest TypeScript check. Behavioral coverage should include detection
with/without Enhance, range switching, ordinary projectile hits and defenses, six-wave timing/locked markers,
ground-only stun/knockback, ally safety, single Enhance scaling, simultaneous skill exclusion, interruption and
cleanup. Existing spear/Carnage fixtures may need to disable the newly available bow skills when isolating old
behavior. Actual visual acceptance still requires an in-game look; it is not established by source inspection.

## Left to the builder

Exact mounted arm/bow artwork, stable visual arrow scatter within the locked marker, motion offsets, countdown
styling and economical use of existing effect records. Keep the confirmed behaviors above; report any material
gameplay deviation rather than silently substituting a different weapon or skill.

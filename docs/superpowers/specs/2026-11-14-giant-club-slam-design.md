# Mythical: Giant with a ground-slamming club

Status: owner approved implementation on 2026-11-14, then explicitly paused the
task to close their PC. No giant gameplay code written. See
`../../handoffs/2026-11-14-zombie-giant-paused.md` before resuming.

## Intent

Add a **Giant** to **Mythical**. It walks around with a heavy club, slams the club
into the ground near enemies, damages an area, and knocks enemies away from the
impact. The giant feels heavy and ridiculous through its motion and reactions.

The club, ground impact, area effect and knockback are owner requirements. The
enemy-only targeting rule, grounded-target rule and numbers below are proposed
defaults, consistent with the game's existing team-based attacks.

## Approach

Use a visible wind-up followed by one radial impact at the marked ground point.
Reuse existing enemy filtering, damage, knockback, impact/dust visuals and control
handling. Swing the club separately around the hands so the whole body does not
rotate like a weapon. A constant damage aura would not represent a club slam.

## Combat sequence

1. Walk toward the nearest eligible enemy with the club dragging/bobbing heavily.
2. Once close enough, plant the feet, raise the club and mark the intended impact
   spot on the ground toward the target. Aim commits at the start of the wind-up.
3. Swing down and hit the ground once. Every eligible enemy in the impact radius
   takes area damage and radial knockback away from that point.
4. Show an expanding dust/shock ring, a few fading ground cracks and a short
   recoil/squat. Recover before starting another slam.

- The wind-up gives targets time to move. If the selected enemy moves or dies,
  the committed swing still hits the marked spot; it never snaps to a new victim.
- Damage and knockback occur once at impact, not on every frame of the expanding
  visual ring. Overlapping giants each get their own independent impact.
- Proposed team rule: hit enemies in the area, sparing allies. In free-for-all,
  keep the existing species-side rules. This interprets "everyone" as all enemies
  in range, rather than introducing friendly fire only for the giant.
- Proposed ground rule: already airborne fighters and hovering fliers evade the
  ground shock. Grounded swimmers can be hit at a wet impact point. Do not create
  or erase water, change terrain, or leave permanent collision cracks.
- Buildings can take damage but remain anchored, following existing anthill/nest
  rules. Other targets retain their ordinary knockback resistance and defensive
  reactions; do not bypass squish/reflection behavior to force movement.
- A target at the exact impact center still gets a stable outward shove, using
  the giant-to-target direction or its facing if a direction would otherwise be zero.
- Stun, charm, being carried, a throw or death interrupts an unlanded swing.
  Cancel its impact and keep a short recovery/cooldown; no delayed ghost slam.
- Slow effects affect walking normally. A committed swing's animation remains
  legible; interruptions do not turn it into repeated instant attacks.

## Look and animation

A broad, oversized doodle figure with a huge wooden club, tiny determined eyes
and a stance suggesting the club is nearly as heavy as the giant. Match existing
48px cached sprite conventions, scaling for size. Keep limbs and club silhouette
readable in crowds. Use a separate club piece/hinge for the raise and slam.

On impact the giant briefly squashes into its knees and the club rebounds a
little. Nearby enemies visibly fly backward; the dust and ground marks fade.
Keep team markings visible. No new camera shake setting, terrain system or UI.

## Proposed starting values

| Setting | Proposed value |
|---|---|
| Health | 320 |
| Ground speed | 50px/s |
| Draw scale / collision radius | 1.85 / 22px |
| Wind-up | 0.7s |
| Downward swing | 0.15s |
| Recovery | 0.65s |
| Minimum interval between impacts | 2.2s |
| Slam radius | 85px around the club's impact point |
| Impact damage | 28 per enemy |
| Knockback impulse | 320px/s before existing resistance/reactions |
| Dust/crack visual lifetime | About 0.55s |

Exact club reach, marked-point offset, palette, hinge and knockback tuning are
builder choices. Proposed values have not been tested in gameplay.

## Integration and constraints

- Append Giant in the roster; it appears through the existing Mythical tab.
- Add a clear wind-up/swing/recovery state with a stored impact point. Wire it
  into normal AI, damage/control cancellation, death, spawn, Clear and pause.
- Reuse radial enemy damage checks, but center this slam on the actual club
  impact rather than always on the giant's feet. Preserve kill attribution.
- Render body, hinged club, marked spot, one shock ring and short-lived ground
  details. Give the stored impact its own visual lifetime so a target's death
  does not make the landed effect disappear.
- If infected under the separate zombie design, keep the giant's recognizable
  body/club art but cancel the pending slam and switch to generic zombie bites.
- Respect the existing fighter limit and slot generations. No new dependencies
  or unrelated changes to the capybara's current slam or other area attacks.

## Later authorized acceptance checks

- Giant appears in Mythical and approaches before visibly winding up.
- One slam damages and knocks back several enemies, once each, with a stable
  outward direction even at zero distance. Allies and airborne targets are spared.
- Moving targets can dodge the marked spot; a dead/recycled selected target is
  not followed by an invisible or retargeted slam.
- Interruptions before impact cancel it. Ordinary death/kill credit, building
  anchoring, squish reactions, water, overlapping giants and map edges stay safe.
- Setup, pause, Clear, resize and zombie conversion leave no pending ghost attack.
- Club motion and the area impact are readable at normal zoom and in a crowd.

## Approval and verification

The owner approved this concrete design with "Approve both — implement them."
They subsequently chose Save and pause. Resume only when asked; another process
or design approval is unnecessary. No tests, builds, analysis, app launch or
gameplay changes have been performed for this feature. Verification remains
subject to the separate post-implementation permission question.

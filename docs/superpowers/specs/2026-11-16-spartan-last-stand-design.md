# Spartan last stand

The user clarified that the charge belongs to the whole allied Spartan army.
At 40% of the side's total recruited Spartan population, merge the remaining Spartans
across all local squads into one shared charge. Count living, unconverted
Spartans, including temporarily incapacitated members. Count each recruitment
when spawning, retaining casualties in the denominator. Reinforcements count
toward the same army total even if earlier soldiers have died. Individual HP
and local squad sizes do not control the trigger: 100 recruited Spartans summon
once 40 or fewer survive. Show the survivor/army count on the summon label.
Each side tracks its own recruited total and one charge; a wiped-out army starts fresh when
new Spartans spawn. Clear also resets this history.

Implementation choices: once per army, eligible survivors rally into an open
arrow with thicker ranks for larger forces. The summon pulls the army into
position over at most three simulation seconds, then winds up for 2.4 simulation
seconds on one shared timer. Individual knockback, stun, freeze or fear cannot
keep restarting that timer or drop soldiers from this collective movement.
Recruits arriving during rally or windup join the same summon. Pick a fixed
direction through the densest visible enemy lane when rallying starts; airborne
opponents may inform this direction, while the ram only hits ground enemies.
A golden dragon-head
aura, roar waves, synthesized scream and increasing shake signal the attack.
Dash at 460 px/s until the formation reaches an arena edge, damaging each enemy
crossed once for 90 damage with 300 knockback and 0.6 seconds stun. Do not chase,
pin, or stop for a target. Recover for 0.7 seconds, then resume individual combat.
One or two survivors still get the arrow aura. Death and conversion remove
members. Capture, shelter, charm and flight still suspend participation until
the soldier is free and grounded; the shared summon does not break those states.

The dragon head must enclose the entire charging army. Derive its center and
uniform scale from the full sprite bounds at both current positions and assigned
slots, rotated into the charge direction. Include padding and fit these bounds
inside the broad skull. Pulse and windup may expand the aura, never shrink it
below the enclosing size. Use translucent gold so soldiers remain visible inside.
The aura consists of the dragon head alone, without a circular or oval backdrop
or a surrounding chevron. Its angular skull encloses the same safe rectangle
used to scale around the army. Add forked swept horns, cheek spines, overlapping
scale plates, a glowing slit eye under a heavy brow, an animated fanged jaw,
molten fissures, flowing whiskers and ember trails. Keep roar marks angular.

Extend the existing formation updater and Canvas effects; keep the existing
shield wall, wedge and circle while at least six nearby members remain. Normal
squads may disband; the army-wide recruitment count persists independently. No dependencies.
Write focused runnable checks, but do not execute tests, builds, linters, type
checks, previews or verification commands without the user's approval.

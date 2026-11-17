# Restore Praying Mantis in V2

The owner requests the original Praying Mantis. Restore it under Bug, using the
pre-V2 saved roster and `mantises.ts` behavior as the reference. Keep current
Fighter references, team rules, damage, carry, targeting and cached Canvas sprites.

Restore the original green triangular-headed artwork with 85 HP, 145 speed,
10 claw damage, four-pixel reach, 0.6-second attacks, 30 knockback and radius 9.
Add strike/carry/wing-assisted hop poses and reuse shocked/zombie variants. Keep existing number
shortcuts assigned to the original ten fighters; Mantis is selected from Bug.

Redraw the mantis as an ink-outlined insect with a broad triangular head,
large pale-lime eyes, slit pupils, fine antennae, a slender thorax, segmented
abdomen, layered leaflike wing covers and four jointed walking legs. Give its
two forelegs thick hooked scythes with pale cutting edges and small spines.
Keep each pose distinct, including translucent veined wings and tucked legs
during hops, raised defensive claws, extended strikes and a visible front
claw around carried prey. Move team ribbons to the thorax to keep the face
clear. Use the existing cached Canvas sprites for all roster and battle art.

Personal final kills of any enemy creature count toward three evolutions;
buildings, allied kills and a Phoenix's first adult death do not count. At 25,
shed the old sword arms and grow longer pale-edged blades with 22 extra base
pixels of reach. At 50, shed a wing casing and grow visible wings. From then
on, each kill resets dodge recovery and immediately starts a 0.3-second,
52-pixel-high leap toward the nearest eligible enemy within 260 pixels, with
a claw strike on landing. This can chain after successive kills. Guards stay
within their defensive area and captives cannot use it to escape a duel.
Control effects, an invalid target or Dragon Domain cancel the leap safely.

Blade evolution also unlocks Moon Slash: a 216-degree crescent with a 170-pixel
base radius, growing with the square root of body scale (about 222 pixels at
maximum size). Wind up visibly for 0.28 seconds, then hit all reachable foes in
the arc once for three times current claw damage and 150 outward knockback.
Use a seven-second cooldown, reveal the caster and consume its normal attack
interval. Keep the raised-blade windup pose and animate the cut as three quick
phases over 0.32 seconds: a pointed contact flash, one sharp crescent traveling
across the arc, then a contracting blade and a fine finishing cut. The middle
sweep takes 0.14 seconds, with softly tapered ends, a fuller jade body, ivory cutting
edge and a crisp ink contour. Construct the blade progressively at its moving
tip; never display a complete static crescent. Remove the broad filled fan,
glow, layered blades, floating shards, large dashed telegraph and skill text.
These are visual changes; retain the original attack stats above.
This is area damage, so an
ordinary sidestep does not negate the entire sweep. Grounded invisible enemies
can take collateral damage; normal height, shelter and team rules still apply.
Guards may sweep intruders, while captives and challengers retain their exclusive
opponent targeting and waiting mantises cannot hit the captive. Stun, freeze,
fear, charm, carrying, airborne displacement, death, conversion and Dragon Domain
sealing cancel a pending slash. Clear resets both casts, cooldowns and visuals.

At 75, shed a complete skin and gain ghost hunting: detecting any new enemy
creature within 360 pixels guarantees invisibility before another combat action.
There is no cloak cooldown or expiration during an approach. Stalk 25% faster
and withhold a ready Moon Slash until within 85 pixels to allow a sneak approach.
Normal target selection and retaliation lose
the concealed mantis. Attacking, taking damage, burning, bleeding, control
effects, carrying or conversion reveal it; area attacks can
still hit it. A faint player-visible silhouette keeps it readable. Hunting
does not override guard or duel duties: guards can cloak while intercepting prey
and duelists can cloak against their sole opponent, retaining all arena rules.
Remember the current prey so a revealed mantis does not recloak every frame in
the same fight. A different prey, including a kill-chain leap target, guarantees
another cloak immediately; losing the target clears this memory.

Body growth comes only from Bug meals: interpolate evenly from original size
to the normal adult Fire Dragon's size over 75 meals, then cap it there forever.
Use the same growth factor for collision radius and physical claw reach.
Kill evolutions change artwork and abilities without adding body size beyond
meal growth. They grant no extra meal, healing or free kills. Cache four
distinct art sets, including evolved corpses, carries and shocked/zombie
variants. Show the kill count and form name. Molting cracks flash briefly and
the discarded arms, wing casing or hollow skin fall beside the mantis and fade
over four seconds; they are visual remnants, not edible corpses. Clear resets
kills, form, leaps, cloak and shed effects. Zombies retain their silhouette
but cannot use evolution abilities.

Four to six nearby allied mantises can form a fight club. A carrier within 170
pixels winds up for 0.15 seconds, hops for 0.35 seconds with a 48-pixel arc,
clamps a small grounded enemy on landing and carries it at 110% running speed
to a dry clear ring. The other mantises form a waiting circle. After arrival,
release the guest at the center, bow for half a second and fight one-on-one.
Only the active challenger can attack the captive; waiting and unrecruited
mantises on the club's side cannot dogpile. The captive can attack only that
challenger. If a challenger dies, wait
0.6 seconds, choose the next available member and bow again.

Use the original 180-pixel recruitment radius, 1.5-times-body-radius prey limit,
eight-second cooldown, two-second released-captive grace, six-second transport
limit and thirty-second setup timeout. Active duels have no passive timeout.
Use a 150-pixel default ring radius, adapting to small viewports while retaining
at least a 100-pixel radius and enough space for participants. Exclude buildings, water-bound Siren,
airborne, sheltered and already-held or already-dueling targets. Search for dry
space near the group, searching up to 480 pixels away. Avoid unrelated living
fighters and other clubs as well as terrain; failed searches retry after half a second.

Living mantises can dodge a direct melee hit, spear or shuriken with a 36-pixel
sideways hop over 0.22 seconds. Dodging has a 1.8-second cooldown and requires
dry clear space; it is blocked by control effects, carrying, shelter or other
movement skills. The captive and challenger dodge only during their active duel
and stay inside its boundary; guards can dodge outside the ring. Area damage does not trigger a dodge and a dodge
does not grant continuous invulnerability. Missed bites, bashes and claws do
not apply fear, infection, healing, bleeding, stun or grabs. Cancel movement on
death, conversion, Clear, control effects or capture into a Dragon Domain.

Waiting mantises defend against interference. During pickup and transport they
escort the carrier in a 52-pixel circle; after arrival they guard the club rim.
They intercept hostile intruders and enemies targeting club participants within
100 pixels of their defensive perimeter, spread across available threats, and
stand between the threat and the carrier or club. Their defensive claw attack
has 12 extra pixels of reach, 180 knockback away from the protected area and a
0.2-second ordinary stun. Guards keep normal damage and attack cooldowns.
They return to their positions once threats leave rather than chasing across
the map, and never join the captive's one-on-one fight. Show a raised-claw guard
pose. The carrier releases its captive on arrival without waiting for guards
who may still be repelling intruders.

When an outside guard dies, request one replacement from existing free allied
mantises. Choose the closest ready, living, non-zombie Mantis on the same team
within 180 pixels of the club rim (or escort perimeter during transport).
Exclude fighters already in another club, carrying, controlled, cooling down
from a club or sealed in a Dragon Domain. The recruit walks into the guard
formation using normal movement; preserve its health and position on joining.
Fill one vacancy per dead guard, keeping the six-member cap and the current
challenger. Retry unfilled vacancies every half second while the club lives.
Guard losses awaiting replacement do not alone cancel setup; normal carrier,
captive and timeout rules still apply. Ending or clearing the club discards
unfilled vacancies. Do not spawn or resurrect replacement units.

Outside damage and damage over time no longer immediately cancel the club or
detach guards. Guards can recover from stun/freeze and keep defending. Damage,
death, fear, charm and conversion still apply normally; this is physical defense,
not damage immunity. Clamp the captive
and active challenger inside the circle after all movement, body separation and
combat, independent of height; remove outward velocity. Crossing the rim does
not cancel the duel. A solid double boundary distinguishes the locked arena.
Death, changed teams, conversion, loss of enough carriers during setup, a setup
timeout and an out-of-bounds ring release the affected fighters safely. The one-on-one pair
retains normal attacks, statuses and retaliation rules; its opponent takes
priority over seeking terrain or colony work. Dragon Domain takes precedence.

Restore Bug-only feeding: each personal final kill of a living enemy Bug grants
10% original HP/damage, advances the gradual meal-based body growth, heals to the new maximum and consumes
the remains. Current Bug prey are ant-family creatures and other mantises;
buildings and zombies do not qualify. Other creature kills grant no meals.

Show the carry, bow, ring and active duel. Clear removes all scene and lifecycle
state. Pause freezes simulation timers. No dependencies or legacy simulator
restoration. Write focused checks, but do not run tests, builds, linters, type
checks, previews or verification until the owner approves testing this change.

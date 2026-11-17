# Passable dragon nests and black T-Rex bloodlust

Dragon nests are ground-level structures. Remove their separation collision for
every creature, regardless of team or species, and ignore nests when choosing
creature spawn/hatch clearance. Keep them targetable, stationary and destructible.
Draw nests immediately after water, before corpses, splats, fighters and effects.

A living black T-Rex below 50% of its current maximum HP first screams for 0.9
seconds, then calls three ordinary allied T-Rexes and unlocks bloodlust. The call
is once per individual, so healing/reinjuring cannot create endless summons.
After the call, while below half HP, speed increases by 40% and bite damage by
50%; healing above the threshold removes the boosts, and dropping below restores
them without summoning again. Normal and albino forms cannot use bloodlust.

The call takes priority over bite, grab, stomp and ram, releasing any held victim.
Stun, freeze, fear, charm, capture and loss of the low-health condition interrupt
the unfinished call; it can retry when the T-Rex can act. Death and conversion
cancel pending reinforcements. Helpers inherit the exact side, including FFA,
start without inherited kills/meals, and initially target the caller's enemy.

Try nearby dry, clear positions; ignore passable nests. Respect the existing
300-entity cap. If only part of the group fits, retain only the remaining count
and retry periodically. Helpers already spawned remain ordinary allied creatures.
Reuse the roar pose, existing sprite parts, targeting, spawn and cooldown paths.
Show a red roar and a jagged red-orange and gold energy aura rising behind the
body during the call and active bloodlust, with sparks instead of a circular outline.

Clear resets all new fields. Pause freezes the existing simulation. No new
dependencies, no automatic tests, builds, linters, type checks or verification.

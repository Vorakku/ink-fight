# Tiny Arms: feeding and albino alpha

Reuse dragon-owned corpse feeding for living T-Rexes. Combat takes priority,
feeding can be interrupted, each corpse is consumed once, and only completed
meals count toward the alpha threshold. Buildings and temporary phoenix deaths
do not become food. Larger bodies give more health nutrition, but still count
as one animal toward the owner's requested 50-meal transformation.

Default balancing: each nutrition point adds 8 maximum HP and a meal heals to
the new maximum. Body size, collision radius and bite reach grow gradually up
to 40% larger at 50 meals, then stop growing. At exactly 50 meals, switch to
cached albino body/jaw/arm artwork with red eyes, 1800 base HP plus nutrition,
100 bite damage, a 0.6-second bite cooldown and 110 movement speed. Preserve the
existing roar, grabs and throws, using current size and damage for bite/shake.

Alpha bites apply four seconds of bleeding at 8 HP/second. Repeated bites
refresh one bleed rather than stacking. Exclude allies and buildings. A bleed
kill leaves food for its living, unconverted owner. Use small stylized crimson
drops; no gore or screen effects. Preserve alpha appearance in corpses and
zombie variants while conversion disables feeding and alpha combat powers.

Approach: extend the existing feeding helper and kill attribution, derive alpha
and growth from meal counts, and add one small bleed timer/owner pair. No new
species, dependencies, corpse stores or generalized ability system. Clear,
death, conversion and phoenix rebirth clean up the new status.

No tests, builds, linters, type checks or verification until the owner says yes.

The owner's subsequent balance adjustment raises normal T-Rex stats to 850 HP,
40 bite damage and 80 movement speed. Nutrition still adds permanent maximum health.

# Spartan in People

The owner requests Spartan in the People category. No Spartan definition exists
in the saved pre-V2 roster; the following combat and artwork details are
implementation choices.

Add a bronze-helmeted warrior with a red cape, round lambda shield and spear.
Use existing Canvas helpers, cached ready/thrust/bash sprites, team bands and
zombie/shocked variants. Keep the original ten number shortcuts assigned as-is.

Stats: 240 HP, 85 movement speed, 18 damage, 44 spear reach, 0.8-second attack
cooldown, 65 knockback, radius 11 and size 1.15. Against an enemy creature within
eight pixels beyond collision reach, use a 24-damage shield bash with 220
knockback and 0.6-second stun, once per five seconds. Structures receive normal
spear damage. Use shared targeting, reach, damage, retaliation and skill timers.
Allies and airborne targets remain protected by the existing combat rules.
Converted Spartans use ordinary zombie behavior.

No new dependencies or general combat framework. Write focused checks but do not
run tests, builds, linters, type checks, previews or verification commands until
the owner approves testing.

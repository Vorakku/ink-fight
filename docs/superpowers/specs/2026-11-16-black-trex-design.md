# Black armored T-Rex and leg stomp

The owner requests a black, spiked form at 100 kills, tough scales, a wall ram
exclusive to that form, and a charged area leg stomp for every T-Rex form.

Count permanent enemy creature kills independently of the existing 50-meal
albino milestone. Exclude buildings and temporary phoenix rebirth. At 100 kills,
black supersedes albino even if fewer than 50 meals were eaten; retain alpha
health, speed, bite and bleeding, with the existing capped adult size. Grant any
added health capacity without erasing wounds. Reduce incoming enemy damage by
35%, including attributed fire and bleed ticks, through a shared damage helper.
Environmental/fall damage keeps its existing behavior. Conversion disables
armor and abilities but preserves the black appearance.

Every form can charge a leg stomp for 0.45 seconds when even one grounded
enemy is within 100px. It deals 1.25 times current bite damage with 180
knockback, spares allies, and has a three-second cooldown. A ready stomp takes
priority over roaring so it consistently joins close combat. Reuse groundSmash and
the existing impact store, with brown dust rather than lightning visuals.

Black T-Rex can wind up a ram for 0.4 seconds against a grounded, unheld enemy
60–420px away, then dash at 360px/s. Contact deals 50 damage and captures that
enemy in front. Continue toward the battlefield boundary, then deal 100 wall
impact damage, stun for two seconds and pin for 0.45 seconds before release.
An acquisition dash lasts at most 1.3 seconds; once carrying, allow enough time
to reach an edge. A miss ends without pin/stun. Use a ten-second cooldown.
Battlefield edges are the walls; towers retain existing destruction mechanics.

Stun, freeze, fear, charm, capture, death and conversion cancel unfinished moves
and release carried victims. Never fling a canceled ram victim. Clear resets
all counters, cooldowns and references. Pause freezes the existing simulation.
Maintain target validation and ally/egg/airborne/building exclusions.

Cache black body, jaw, arm, shocked and zombie artwork. Cache a raised-leg body
for each form. Reuse the existing feeding, attribution, heldBy and sprite paths;
avoid new species, dependencies or a generic ability framework.

Write checks but run no tests, builds, linters, type checks, dev servers or
verification commands until the owner explicitly approves testing.

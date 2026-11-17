# Phoenix evolution buff

The owner requests a Phoenix that can contest Dragon/T-Rex while remaining below
their strength, with reduced fire damage, adult evolution at 50 kills, and legend
evolution at 100 kills. Keep Encore's healing and one-time egg/chick rebirth.

Implementation choices: 400/650/900 HP, 4/5/6 breath damage, 60% fire resistance.
Adults become larger and sleeker, with longer flame feathers; legends have
red-to-gold gradient plumage with animated glitter and no crown. Keep the existing
Canvas artwork and cached wing poses. Glitter follows the battle clock and is
masked to the current body/wing silhouette.
Kill progress survives rebirth; evolution adds the increase in maximum health,
preserving existing wounds. Buildings and temporary rebirths grant no kill.

Reuse the existing flight state, enemy-only blast, ground fire and kill-credit
paths. Base Phoenix keeps its dive. Adults rise and spit eight arcing fireballs
at fixed points around their target, each leaving a small ground fire. Legends
also use Encore: rise, perform three alternating straight-line strafing passes
(the owner's `|` shape), burn enemies once per pass and leave fire along each
pass. Cooldowns and modest single-target damage keep the larger creatures ahead.
Overlapping fires from one Phoenix do not multiply their ground-fire damage.

Control effects interrupt flight. Death cancels unreleased casts/projectiles;
completed fires persist through death, and conversion removes owned hazards.
Clear removes all new state. Pause uses the existing simulation clock.

No new dependencies. Write runnable focused checks, but do not run tests, builds,
linters, type checks, previews or verification commands without owner permission.

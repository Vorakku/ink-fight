# Phoenix flame-feather redesign, healing circle and fire dive

Use the owner's reference for a broad two-wing silhouette, layered crimson and
gold flame feathers, a swept crest, hooked bird beak and long curling tail.
Keep Canvas outlines, simple color shapes, readable eyes and team markings.
Reuse eight cached wing poses; keep eggs, chicks and the existing one-time rebirth.
Keep the muzzle at the current fire-breath attachment (45,18) in the 48px artwork.

Healing stays a ten-HP pulse on a successful adult/reborn breath hit, limited to
once per second. Center the actual 80px area on the phoenix, matching the owner's
request for a circle under its feet. Heal only living allies at the same combat
height and cap at maximum HP. Draw a soft red ground circle and rising red plus
signs for one second, following the caster. No flame ring for healing.

Adults/reborn phoenixes can begin a dive against a grounded enemy within 300px.
Use a two-second opening delay, then a ten-second ability cooldown. Rise for
0.65s to 180px, hover for 0.2s, and plunge for 0.25s toward the target's ground
position captured when the move starts. Mark that landing area. The committed
dive can finish if the target moves or dies; stun, freeze, fear, charm, capture,
throw, conversion or death cancel it. Interrupted airborne phoenixes fall.

Landing deals 100 enemy-only damage and 160 knockback in a 140px area, applies
six seconds of burn, and leaves ground fire for three seconds. Ground fire
deals 12 damage/second in 0.3s pulses and refreshes the burn; it spares allies,
eggs and airborne/sheltered targets. Apply existing vampire fire weakness and
black T-Rex armor. Towers take structure damage instead of bypassing occupants.
Landing can trigger the same healing pulse if its cooldown is ready.

Completed ground fire may finish burning after its caster dies/rebirths, but
conversion removes it to prevent changed-team hazards. Clear removes all new
states and fire zones. Pause freezes simulation timers and visual animation.
Reuse Fighter references, damage/burn attribution, impact effects and Canvas.

Write checks without running tests, builds, linters, type checks, previews or
verification until the owner explicitly approves testing. No new dependencies.

# Black T-Rex power effects, terror scream and aimed throw

Enhance the current jagged bloodlust aura with three glowing energy layers,
faster rising sparks, white-gold lightning and lifting dust. Keep the body clear,
use simulation ticks, and avoid adding a circular outline around the T-Rex.

At the climax of the existing bloodlust help call, terrify nearby enemies within
280px: a 0.35s stun supplies the shocked pose, then three seconds of fear sends
them fleeing. Affect exposed airborne creatures too. Exclude allies, buildings,
eggs, sheltered, held and already thrown creatures. Reveal concealed creatures
and drop their held victims; interrupted dives/charges follow existing controls.
Reuse stun/fear/scaredBy/roar and preserve the existing three-helper call.

Black bites may grab creatures up to 1.5 times the T-Rex's radius. Keep the existing
35% grab chance and 0.7s shake. Normal/albino grabs retain their current behavior.
For black grabs, mark a landing point within 420px, preferring the largest enemy
group; if none exists, aim ahead. Clamp to the carried creature's map margins.
After shaking, throw along a fixed 0.8s arc with 90px visual height. Landing deals
100 damage to the thrown victim, 75 to exposed grounded enemies within 140px,
360 knockback and two seconds of stun to all affected enemies. Spare allies,
airborne creatures and sheltered targets. Buildings take damage without stun.
Towers protect occupants. Reuse impact and damage/kill attribution paths.

Snapshot the aimed landing point and thrower's side at release. Conversion before
landing cancels the special blast and leaves only ordinary unattributed landing
damage, preventing a changed-side blast. Owner death can leave a physical throw
in flight; a dead owner gains no meal credit. Existing death/conversion/Clear
cleanup releases held victims; completed landing clears flight metadata once.

Write checks without running tests, builds, linters, type checks or previews.
No dependencies, no generic ability framework, no commits.

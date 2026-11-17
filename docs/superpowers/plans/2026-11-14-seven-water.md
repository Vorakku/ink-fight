# Seven Water Fighters Implementation Plan

**Goal:** Implement the seven Water fighters approved in the conversation, including their visible jokes.

**Architecture:** Append fighters in `units.ts` to preserve existing indices. Keep ability state in `aquatics.ts`, following the existing Bugs/Spiders pattern, and use shared damage, carrying, terrain and status rules. Draw original Canvas sprites and small local effects in `render.ts`; add no dependencies.

**Constraints:** No tests, builds, linters, type-checkers, browser checks or other verification commands without the owner's approval. Work in the existing checkout and preserve unrelated work.

- [x] Add Personal Space (pufferfish), Out of Office (octopus), Small Claims (pistol shrimp), Clickbait (anglerfish), Joint Custody (crab), Fin Collector (shark), and Some Assembly Required (axolotl), with original sprites and tooltips.
- [x] Implement inflation on damage, blinding ink and retreat, charged snapping bubbles, one-victim lure, two-claw carrying and collisions, wounded-target circling and lunging with shore recovery, and recoverable/stompable limbs.
- [x] Integrate spawn/reset/interruption/death, generation-safe delayed effects, team rules, pond confinement and the shark's brief beaching exception.
- [x] Add focused, unrun simulation scenes and document the roster and test permission requirement.

Review focus: recycled slots must not inherit catches/lures/limbs; disabled fighters must not continue abilities; crabs must release both victims; pond confinement must survive knockback and carrying; dry shark misses must return to the launching pond. Validation remains pending owner approval.

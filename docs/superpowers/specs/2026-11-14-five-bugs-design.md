# Five more bugs

Implement the owner's five Bug fighters in the existing Canvas/typed-array game:
Number Two (dung beetle), Low Battery (firefly), Free Ride (flea), Lamp Enjoyer
(moth), and Still Here (cockroach). Keep existing fighter indices and art style.

Extend the existing simulation rather than introduce an ability framework. A
small `bugs.ts` module holds ball physics, firefly grouping and flea/moth steering;
shared damage, body ownership, interruption and revival stay in `sim.ts`.
Reuse hover parts, blindness, contact fire, leg riding and the fallen pose.

Implementer balance choices: three unclaimed bodies grow a pushed ball from 7px
to 19px and release it at 300px/s for four seconds; it strikes each enemy once.
Nearby allied fireflies (90px links) share a three-second blink and gain a wider
blind radius with group size. Fleas choose the largest visible non-building
enemy, hop onto it and bite until it falls or the flea is interrupted. Moths
seek burning fighters and flame creatures, catch fire and continue flying until
they transfer it on contact. Cockroaches lie unreachable on their backs for
exactly three seconds and revive at full health twice; explosions have no effect.

Ant/spider body claims take priority. Recycled slots cannot inherit balls,
rides, revivals or hit history. Clear removes all bug effects. Pause/setup freeze
their clocks. No packages or changes to other fighter abilities are needed.

Tests, builds, linters, type checks, browser checks and verification commands are
prohibited until the owner grants permission. Add focused runnable scenes but
leave them unrun; ask about testing only after implementation is finished.

# Five more mythical fighters

Implement the owner's Gargoyle / Red Light, Hydra / Two For One, Cerberus / Good
Boys, Troll / Under Bridge, and Werewolf / Monthly Subscription in the Mythical
tab. Match the Canvas sprite style and reuse shared damage, facing, attack,
projectile and lifecycle rules; no packages or general ability framework.

Implementer choices:

- A gargoyle is watched when any visible, sighted enemy on the page faces its
  horizontal position, using Perseus's facing rule. Allies, hidden fighters,
  blind fighters, eggs and underground/held fighters do not watch. While watched
  it is grey, stationary, uncarryable, and takes 5% damage. Otherwise it sprints.
- A hydra starts with one head. Crossing 2/3 and 1/3 health permanently adds a
  head, capped at three. A large hit may cross both thresholds. Each head chooses
  a different enemy within bite reach; a lone victim receives only one bite.
- Cerberus has three independent bites and prioritizes nearby real thrown
  objects from either team: sandals, hammers, fish, spears, shuriken and kernels.
  Chasing does not consume projectiles or alter their damage/return behaviour.
- A troll regenerates 42 health per second even during combat or incapacitation,
  up to its health cap. Fire stops regeneration, does triple damage and maintains
  panic until extinguished.
- A werewolf begins as a harmless wandering man. Eight seconds human alternate
  with five seconds wolf, with a faster, damaging wolf sprite and a confused
  reaction on changing back. Transforming preserves current health and effects.

Head pieces visibly aim and bite separately. Recycled slots and Clear reset all
new state. Pause/setup freeze time. Write focused check scenes, but do not run
tests, builds, linters, type checks, browser checks or verification commands until
the owner explicitly approves testing after implementation.

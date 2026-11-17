# Tower combat implementation plan

**Goal:** Thor climbs a one-person tower and always summons lightning from it;
ground enemies destroy the tower first, while flying enemies attack its occupant.

**Architecture:** Keep tower ownership and health in `Battle`, alongside fighter
references and elevation. Reuse existing movement, damage, fire and lightning.
Render climb, flight and collapse from simulation state without new dependencies.

**Defaults chosen for this implementation:** Only Thor seeks and occupies towers.
Towers have 500 HP; their roof is 128 px above ground. Climbing takes 0.8 seconds;
perched Thor uses his existing marked lightning every three seconds. Dragon,
adult/reborn phoenix and Honk can fly to occupants. Collapse takes 0.7 seconds;
the occupant falls, takes 25 damage and is stunned for one second on landing.

**Constraints:** Keep existing combat intact when no towers are involved. One
occupant per tower, including during climbing. Pause freezes all new actions;
death, destruction, resizing and Clear must preserve or release both references.
Do not run tests, builds, linters, type checks, servers or verification commands
without the owner's explicit permission. Do not commit or publish this work.

## Implementation

- [x] Add health, occupancy, ascent, flight and falling state; implement tower
  seeking, protected occupants, ground attacks, collapse and reference cleanup.
- [x] Reuse summoned lightning for perched Thor and existing attacks for flying
  enemies; prevent ground attacks and status effects from bypassing the tower.
- [x] Draw elevation, tower damage, health and collapse; document behavior and
  update the Tower tooltip.
- [ ] Ask the owner whether to test after the complete change. Testing remains
  pending permission, including checks for contested occupancy, ground area and
  projectile protection, flying damage, collapse, death, pause, resize and Clear.

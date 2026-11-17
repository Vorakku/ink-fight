# Kangaroo and opossum

The owner approved Return to Sender (kangaroo) and Dead Serious (opossum), then
asked to build both. Add original Canvas sprites and paintable Animals entries.

Return to Sender pockets one enemy small projectile, shows it in its pouch for
0.65 seconds, then throws it toward its original shooter. Preserve the shot's
appearance and effects, with the kangaroo owning the returned shot. Check the
shooter's generation; discard the shot if that shooter is gone. Full pouches and
disabled kangaroos cannot catch. Sandals, hammers, spears and fish are too large.
Ordinary melee attacks show a double-foot kick.

Dead Serious plays dead for up to four seconds after a surviving hit leaves it
at or below 35% health. Enemies drop it as a target, but existing shots, fire and
area damage can still hurt it. The first grounded enemy to overlap it receives a
double-damage ankle bite; the opossum stands and flees for 1.8 seconds. With no
visitor it stands after four seconds. It can feign again after ten seconds.
Disabling, carrying or throwing it cancels the pose. It never heals or revives.

## Approach

Reuse the projectile pool, generation tracking, contact hook, attack and panic
signals. A separate creature subsystem or using the cockroach's death/revival
state would add complexity or imply invulnerability. Use two optional quirk
fields and typed arrays in the existing simulation; retain the current checkout.

No dependencies. No tests, builds, lint, type checks, dev server, browser checks
or other verification commands without the owner's permission.

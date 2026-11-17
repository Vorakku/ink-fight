# Spartan spear throw and knife recovery

The owner requests a spear-throw special, a switch to knife combat, and spear
recovery when that Spartan kills the target. Use a Fighter reference to mark the
struck enemy, and reuse the existing moving projectile collision/damage paths.

Implementation choices: two-second opening, eight-second throw cooldown, range
90–320 px, speed 520 px/s, damage 36 and knockback 90. A throw immediately removes
the held spear. Knife combat uses 10 damage, 7 px reach, 0.45-second cooldown and
25 knockback; shields and bash remain. A personal final kill of the marked enemy
restores the spear. Immediate spear kills qualify. Temporary Phoenix rebirth,
another enemy's death and an allied finishing blow do not. A miss or a shot
blocked by a structure leaves the knife; the first actual enemy struck becomes
the marked target. The throw cooldown survives retrieval.

Front formation ranks retain their spears; assembled rear ranks can throw.
Knife users can step out to finish marked prey and rejoin after recovery. The
remaining sentries keep advancing, while formation protection still requires
six members in their positions. Circle defense takes priority over pursuit.

Cache knife, thrust, bash, guard, throwing, zombie and shocked poses. Render the
projectile as a long spear. Preserve weapon appearance when carried or dead.
Death and conversion remove projectiles and recovery ownership; Clear resets
state. Unattributed or stolen deaths cannot restore a spear. Pause freezes time.

Write checks, but do not run tests, builds, linters, type checks, previews or
verification commands until the owner approves testing this change.

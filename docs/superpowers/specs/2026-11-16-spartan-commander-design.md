# Spartan commander

The user requested an additional leader for armies with more than fifty
Spartans: three times stronger, larger, unlimited spears, and unable to die
until his troops are dead. Use one commander per side, created when the side
has 51 living, unconverted regular Spartans. Include red, blue and FFA armies.

Implementation choices: reuse the Spartan species with commander state and
cached gold-crested poses. Multiply HP, melee/bash/spear damage and knockback
by three; multiply sprite size, radius and melee reach by 1.6. Give him a new
spear after every throw, with a 1.2-second throw cooldown, rather than requiring
a kill to retrieve it. Keep normal control and targeting rules.

Track current regular Spartan troops by reference, including recruits. While
any is alive on his side and unconverted, damage cannot reduce him below 1 HP.
Apply this to ordinary hits, fire, bleeding and direct execution paths. Block
infection/conversion during protection. Once no troops survive, he is mortal;
he does not automatically die. Other commanders cannot protect him.

The commander is additional to the army's recruited count. Do not let him
inflate the 40% last-stand threshold or create another commander. He joins and
leads the shared ram, and the dragon aura includes his larger full sprite.
Respect the 1,000-fighter cap and retry spawning when space becomes available.
Clear removes commander state, troops and projectiles.

Work in the existing checkout without new dependencies or commits. Write
focused checks but do not execute tests, builds, linters, type checks, previews
or verification commands without the user's approval.

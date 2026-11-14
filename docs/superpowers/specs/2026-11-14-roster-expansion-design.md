# The extremely unserious reinforcements

Date: 2026-11-14. The owner requested autonomous work while asleep. Names, balance,
the archerfish interpretation of the water sniper, and implementation choices below
are the implementer's calls. No tests, builds, lint, type checking, browser checks,
or verification commands may run without the owner's subsequent permission.

## Intent and approach

Add 17 fighters with jokes visible in their behaviour, following `style-guide.md`.
Keep Canvas 2D sprites, typed-array simulation state, fixed-size effect buffers and
one team per fighter type. Extend existing hit, projectile and terrain machinery;
do not add packages or introduce an ability framework. Separate bespoke systems
per fighter would duplicate damage/movement rules; a general scripting system
would add complexity this roster does not need.

The roster trays must scroll on narrow screens. Existing fighters keep their
indices. New state resets when a dead slot is reused. Delayed attacks must not
attach to a different fighter that reuses their target's slot.

## Food: five more

| Fighter | Visible joke and ability |
| --- | --- |
| Boba Menace | A tea cup fires fat tapioca pearls; sticky hits slow enemies |
| Cheesed | A pizza slice slaps with a stretchy cheese strand, slows victims and steals health |
| Squish Issue | A mochi with cheeks squashes when hit and reflects damage |
| Depresso | A tired espresso cup charges at an enemy and launches it; caffeine outruns motivation |
| Pop Off | A popcorn carton fires a three-kernel fan instead of keeping its thoughts inside |

## People: five more, plus ninja and samurai

| Fighter | Visible joke and ability |
| --- | --- |
| Doomscroller | Never looks up; throws slowing phone notifications |
| Reply Guy | Sends three speech bubbles at once; nobody asked |
| Main Character | A ring light and a radial pose knock nearby enemies away |
| Touch Grass | A plant pot and grass hair; hides in bushes and slows enemies with roots |
| Bed Rot | A duvet burrito that stays put, heals while resting and hits nearby enemies with a pillow |
| Ninja / No Thanks | Throws shuriken, dashes into a close enemy, retreats with sweat drops when hurt, outnumbered or facing something much bigger |
| Samurai / Spin Sensei | A little helmet and sword; spins through nearby enemies for several small hits |

## Other requested fighters

- **Centaurs / Horsing Around**, Mythical: four hooves, human torso and spear.
  Circle the enemy at throwing distance and keep launching spears while running.
- **Archerfish / Spit Take**, Water: remains inside water and shoots water spits
  from about 620px away. Target acquisition covers its firing range. A fish placed
  on dry paper gets a small puddle so it can participate immediately.
- **Jellyfish / Shocktopus**, Water: remains in water, zaps close enemies and
  briefly stuns them. The victim shows a dark silhouette and white cartoon bones,
  clipped to its sprite, with a short electrical connection; no strobing flash.
- **Capybara / Rear Admiral**, Animals: repeatedly jumps toward an enemy and
  lands rump first, causing damage and knockback in a small area. Ground shadow,
  squash and a short dust ring explain the landing.
- **Cat / Civil Paw**, Animals: leaps into its first fight and produces a brief
  cartoon smoke cloud with paws/claw swipes sticking out, then uses normal melee
  claws for the rest of its life. Cat and opponent pause in the cloud; cancellation
  or death must release the opponent promptly.

## Constraints and acceptance

Special movement cannot steer a held, thrown, stunned or charmed fighter. A leap
stops if its target disappears and still lands once; a dash damages at most once.
Water confinement applies after velocity and separation, including knockback,
and cannot jump across dry gaps. The original siren remains amphibious.

Every new fighter has an original 48px Canvas drawing, a short tooltip, a category,
and a visible ability. The requested ninja is allowed even though the old reference
document lists it as a Battle Draw fighter: use original clothing/art and the
owner's panic gag. The public Battle Draw page was opened for reference; its text
does not expose animation details, so no claim of observed ninja behaviour is made.

No global style overhaul, sound system, new terrain tools, or balancing of the
whole old roster is part of this change. Simulation checks may be written but must
remain unrun until authorized. Visual quality and balance remain unverified.

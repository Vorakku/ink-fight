# Inkfight

Scribble armies of silly fighters onto a notebook page and watch them brawl.

- `npm run dev` to play
- `npm run check` runs the simulation self-check

Game code is in `src/game`: `units.ts` (fighters and their drawings), `sim.ts` (simulation), `render.ts` (canvas drawing), `water.ts` (ponds).

The Bug roster also includes **Millipede**, **Praying Mantis**, and **Spider**:

- Millipedes curl into wheels and roll into enemies. Four allies meet and assemble
  into a car with four millipede wheels. It keeps their combined remaining health
  and harmful effects, and rams harder; eight millipedes can form two cars.
- Four to six nearby mantises can kidnap an eligible enemy and carry it to a duel
  circle. One mantis challenges at a time; another steps forward when it dies.
  Escape, outside interference, transport failure, or timeout releases the group.
- Spiders shoot webs from range and pounce onto close enemies. When quiet they
  build or share a web nest, drag enemy animal bodies home, and wrap cocoons.
  A nest consumes **five cocoons for one new allied spider**. Full pages or blocked
  exits keep the five cocoons pending; destroying a nest destroys its stock.

The behavior lives in `millipedes.ts`, `mantises.ts`, and `spiders.ts`, with shared
damage, teams, body reservations and lifecycle handling in `sim.ts`. Cars and nests
are created by their fighters and are hidden from the paint tray. Their designs
are in `docs/superpowers/specs/2026-11-14-*-design.md`. These three additions are
written but have not been type-checked, tested, built, or run in the browser.

Sparklebutt turns around and charges for 1.1 seconds before firing a straight, 620px rainbow blast.
It hits enemies along the line once, kicks the shooter backwards, then needs to recharge.
This attack change has not been run or checked; the existing pegasus check still describes its old close-range attack.

The **Bug** tab adds **Ant**. After Start, each side's ants gather at a dry site and dig for 3 seconds:
10 living ants build the first anthill, then 20 build the next, then 40, 80, and so on.
Builders walk into the entrance and work underground, then emerge alive when the hill finishes.
Survivors also emerge if enemies destroy the hill. Occupants still count as ants but cannot be
targeted from outside. Interrupted or missing workers pause construction until enough can help
again; each side has one unfinished site at a time.

Completed anthills can be destroyed by enemies and produce one allied ant every 4 seconds,
even without enemies nearby. These ants count toward further colonies. Losing an anthill does
not reduce the next requirement. Clear resets the progression, and setup/pause freeze it.
At the existing 4,000-fighter limit, construction sites and offspring wait for a free slot.
Anthills are built automatically rather than painted from the tray. This feature has not been
type-checked, tested, or run; verification is awaiting the owner's permission.

When an enemy of a living ant dies, its body stays on the floor in a fallen pose with cartoon
X eyes. Free ants cooperate to drag enemy bodies to a completed friendly anthill: small bodies
need two ants, larger bodies up to eight. They wait for the whole crew, and stop if carriers
are interrupted. Construction has priority. Losing the destination leaves the body available
for another colony. Delivered bodies shrink into the entrance and disappear; they do not add
food, bonus ants, or faster spawning. Buildings and a phoenix's temporary egg transformation
leave no bodies. Clear removes bodies too. Body storage is capped at 4,000; further deaths use
ink splats until space is available. Entry, hauling and delivery have not been checked or run.

Before adding a fighter, terrain or effect, read [docs/neal-reference.md](docs/neal-reference.md): how Battle Draw (our inspiration) looks and feels, and what we still do differently.

The [2026-11-14 roster expansion](docs/superpowers/specs/2026-11-14-roster-expansion-design.md)
adds five foods, five people, centaurs, an archerfish, a jellyfish, a ninja, a samurai,
a capybara and a cat. New swimmers stay in water and bring a small puddle when
placed on dry paper. The fighter tray scrolls when it cannot fit the whole roster.

This expansion and its new simulation check scenes have not been run. Ask the
owner before running tests, builds, lint, type checking or browser checks.

[Fighter quirks](docs/fighter-quirks/README.md) gives every generic fighter its own joke, in four
phases. Phase 1 is implemented: Honk scares what it pecks, Nana's handbag throws fighters, Reply Guy
goes for the biggest fighter on the page, Touch Grass plants a lawn, Kaboom Pickle leaves a puddle and
Pop Off sprays kernels when set on fire. Phase 2 is implemented too: Sir Toast holds a grudge against
the first fighter to hurt him, Mozzie swells until it pops, Gym Bro gets knocked onto his back, Spit
Llama blinds what it hits, Boba Menace's pearls pull victims in and Depresso alternates caffeine and
naps. Phase 3 is implemented as well: Señor Chili's fire spreads between fighters that bump into each
other, Doomscroller's phones spread the same way, Toddler hugs a leg and rides along, Squish Issue
springs knockback back at the attacker, and Main Character's pose pulls nearby enemies toward her.
Phase 4 completes it: Sandal Dad has to hop over and fetch his sandal, Flapjack sheds pancakes into
syrup spots, Cheesed ties victims up with a draining cheese strand, Spike rolls through crowds when
cornered, Stinky sprays stink clouds instead of exploding, and the Unpaid Intern gets promoted to
management. None of the four phases, nor their check scenes, has been run.

[Teams](docs/superpowers/specs/2026-11-14-teams-design.md) (2026-11-14): pick Red, Blue or Free-for-all
before scribbling; red and blue fighters wear a bandanna in their colour. The page holds still until
Start, you can add fighters mid-fight, and Clear goes back to setup. Its check scenes have not been run.
